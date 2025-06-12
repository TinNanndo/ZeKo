import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STEP_LENGTH } from './PedometerService';

/**
 * KONSTANTA ZADATKA
 * Jedinstveni identifikator za pozadinski zadatak brojanja koraka
 * Koristi se pri registraciji i pozivanju zadatka
 */
export const STEP_COUNTER_TASK = 'STEP_COUNTER_TASK';

/**
 * DEFINICIJA POZADINSKOG ZADATKA
 * 
 * Ovaj zadatak se izvršava periodički u pozadini aplikacije i osigurava:
 * 1. Detekciju promjene dana i spremanje dnevne statistike
 * 2. Procjenu broja koraka dok aplikacija nije aktivna
 * 3. Ažuriranje svih metrika aktivnosti (koraci, kalorije, udaljenost)
 * 
 * Zadatak vraća jedan od sljedećih rezultata:
 * - NewData: Uspješno izvršen s novim podacima
 * - Failed: Došlo je do greške tijekom izvršavanja
 */
TaskManager.defineTask(STEP_COUNTER_TASK, async ({ data, error }) => {
  // Provjera i obrada grešaka
  if (error) {
    console.error('Pozadinski zadatak završio s greškom:', error);
    return BackgroundFetch.Result.Failed;
  }
  
  try {
    // --- DOHVAĆANJE TRENUTNIH PODATAKA ---
    
    // Dohvat osnovnih metrika aktivnosti
    const storedStepCount = await AsyncStorage.getItem('stepCount');
    const storedDistance = await AsyncStorage.getItem('distance');
    const storedCalories = await AsyncStorage.getItem('caloriesBurned');
    
    // Konverzija u brojeve
    const currentStepCount = parseInt(storedStepCount || '0', 10);
    const currentDistance = parseFloat(storedDistance || '0');
    const currentCalories = parseFloat(storedCalories || '0');
    
    // Podaci potrebni za izračune
    const storedWeight = await AsyncStorage.getItem('weight');
    const weight = parseFloat(storedWeight || '70'); // 70kg kao zadana vrijednost
    
    // Vremensko praćenje
    const lastBackgroundCheck = await AsyncStorage.getItem('lastBackgroundCheck');
    const currentTime = new Date().getTime();
    
    // --- PROVJERA PROMJENE DANA ---
    
    const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const lastSavedDate = await AsyncStorage.getItem('lastSavedDate');
    
    // Ako je promijenjen dan, spremi statistiku i resetiraj podatke
    if (lastSavedDate && lastSavedDate !== currentDate) {
      console.log(`Pozadinski zadatak: Otkrivena promjena dana (${lastSavedDate} → ${currentDate})`);
      
      // 1. Kreiranje zapisa statistike za prethodni dan
      const previousDayStats = {
        date: lastSavedDate,
        stepCount: currentStepCount,
        caloriesBurned: currentCalories,
        distance: currentDistance,
        coins: parseInt(await AsyncStorage.getItem('coins') || '0', 10)
      };
      
      // 2. Ažuriranje tjedne statistike
      const stats = await AsyncStorage.getItem('weeklyStats');
      const weeklyStats = stats ? JSON.parse(stats) : [];
      
      // Ukloni sve prethodne zapise za isti dan (izbjegavanje duplikata)
      const filteredStats = weeklyStats.filter(stat => stat.date !== lastSavedDate);
      
      // Dodaj novi zapis na početak i sačuvaj samo zadnjih 7 dana
      const updatedStats = [previousDayStats, ...filteredStats].slice(0, 7);
      await AsyncStorage.setItem('weeklyStats', JSON.stringify(updatedStats));
      
      // 3. Resetiranje metrika za novi dan
      await AsyncStorage.setItem('stepCount', '0');
      await AsyncStorage.setItem('caloriesBurned', '0');
      await AsyncStorage.setItem('distance', '0');
      await AsyncStorage.setItem('lastSavedDate', currentDate);
      
      return BackgroundFetch.Result.NewData;
    }
    
    // --- PROCJENA I AŽURIRANJE STATISTIKE U POZADINI ---
    
    if (lastBackgroundCheck) {
      // 1. Izračun proteklog vremena od zadnje provjere
      const elapsedMinutes = (currentTime - parseInt(lastBackgroundCheck)) / (1000 * 60);
      
      // 2. Procjena koraka na temelju prethodne aktivnosti korisnika
      let recentStepsPerMinute = 10; // Zadana vrijednost ako nema podataka
      
      try {
        const recentActivity = await AsyncStorage.getItem('recentStepRate');
        if (recentActivity) {
          recentStepsPerMinute = parseFloat(recentActivity);
        }
      } catch (err) {
        console.error('Greška pri dohvaćanju stope koraka:', err);
      }
      
      // Konzervativnija procjena za pozadinu - 60% normalne stope
      // Ovo pretpostavlja da korisnik nije aktivno koristio uređaj
      const estimatedSteps = Math.round(elapsedMinutes * recentStepsPerMinute * 0.6);
      
      // 3. Ažuriranje broja koraka
      const newStepCount = currentStepCount + estimatedSteps;
      await AsyncStorage.setItem('stepCount', newStepCount.toString());
      
      // 4. Ažuriranje prijeđene udaljenosti
      const addedDistance = (estimatedSteps * STEP_LENGTH) / 1000; // u kilometrima
      const newDistance = currentDistance + addedDistance;
      await AsyncStorage.setItem('distance', newDistance.toString());
      
      // 5. Ažuriranje potrošenih kalorija
      const caloriesPerKgPerStep = 0.0005; // Faktor potrošnje kalorija po kg težine po koraku
      const addedCalories = weight * caloriesPerKgPerStep * estimatedSteps;
      const newCalories = currentCalories + addedCalories;
      await AsyncStorage.setItem('caloriesBurned', newCalories.toString());
      
      console.log(`Pozadinski zadatak: Dodano ${estimatedSteps} koraka, ${addedDistance.toFixed(2)} km, ${addedCalories.toFixed(1)} kcal`);
    }
    
    // Spremi vrijeme ove provjere za sljedeći izračun
    await AsyncStorage.setItem('lastBackgroundCheck', currentTime.toString());
    
    return BackgroundFetch.Result.NewData;
  } catch (error) {
    console.error('Neočekivana greška u pozadinskom zadatku:', error);
    return BackgroundFetch.Result.Failed;
  }
});

/**
 * REGISTRACIJA POZADINSKOG ZADATKA
 * 
 * Postavlja zadatak za periodičko izvršavanje čak i kad aplikacija nije aktivna.
 * Zadatak će se pokretati svakih 15 minuta i preživjet će gašenje aplikacije.
 * 
 * Ova funkcija se poziva pri pokretanju aplikacije kako bi se osiguralo
 * kontinuirano praćenje aktivnosti u pozadini.
 */
export const registerBackgroundTask = async () => {
  try {
    // Registracija zadatka s postavkama
    await BackgroundFetch.registerTaskAsync(STEP_COUNTER_TASK, {
      minimumInterval: 900,    // Svakih 15 minuta (u sekundama)
      stopOnTerminate: false,  // Nastavlja s radom nakon zatvaranja aplikacije
      startOnBoot: true,       // Pokreće se pri pokretanju uređaja
    });
    
    // Postavka minimalnog intervala za izvršavanje
    await BackgroundFetch.setMinimumIntervalAsync(900);
    console.log('Pozadinski zadatak uspješno registriran');
  } catch (error) {
    console.error('Neuspjela registracija pozadinskog zadatka:', error);
  }
};