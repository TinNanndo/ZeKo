import React, { createContext, useState, useContext, useEffect } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STEP_LENGTH } from '../utils/PedometerService';

/**
 * KONTEKST ZA UPRAVLJANJE STATISTIKOM
 * 
 * Ovaj kontekst omogućuje praćenje i ažuriranje korisnikove aktivnosti
 * kroz sve komponente aplikacije.
 */
const StatsContext = createContext();

/**
 * POMOĆNE FUNKCIJE
 */

/**
 * Izračunava prijeđenu udaljenost na temelju broja koraka
 * @param {number} steps - Broj koraka
 * @returns {number} - Udaljenost u kilometrima
 */
const calculateDistance = (steps) => {
  if (!steps || isNaN(steps) || steps < 0) {
    return 0;
  }
  
  const numSteps = Number(steps);
  const distanceKm = (numSteps * STEP_LENGTH) / 1000;
  return parseFloat(distanceKm.toFixed(2));
};

/**
 * GLAVNI PROVIDER KOMPONENTA
 * 
 * Upravlja stanjem aplikacije vezanim uz statistiku korisnika
 * i pruža funkcije za ažuriranje podataka
 */
export const StatsProvider = ({ children }) => {
  /**
   * STANJE APLIKACIJE
   */
  // Osnovni podaci statistike
  const [stepCount, setStepCount] = useState(0);           // Broj koraka
  const [caloriesBurned, setCaloriesBurned] = useState(0); // Potrošene kalorije
  const [distance, setDistance] = useState(0);             // Prijeđena udaljenost u km
  const [coins, setCoins] = useState(0);                   // Zarađeni novčići
  const [stepGoal, setStepGoal] = useState(10000);         // Dnevni cilj koraka
  
  // Podaci za praćenje povijesti
  const [weeklyHistory, setWeeklyHistory] = useState([]);  // Povijest statistike po danima
  const [lastSavedDate, setLastSavedDate] = useState(null); // Zadnji datum spremanja
  
  // Stanja inicijalizacije
  const [isInitialized, setIsInitialized] = useState(false); // Je li kontekst inicijaliziran
  const [isReady, setIsReady] = useState(false);             // Je li kontekst spreman za korištenje

  /**
   * INICIJALIZACIJA PODATAKA
   * 
   * Učitava sve podatke iz AsyncStorage-a pri prvom pokretanju
   */
  useEffect(() => {
    const loadStats = async () => {
      try {
        // Dohvat svih spremljenih podataka
        const storedStepCount = await AsyncStorage.getItem('stepCount');
        const storedCaloriesBurned = await AsyncStorage.getItem('caloriesBurned');
        const storedDistance = await AsyncStorage.getItem('distance');
        const storedCoins = await AsyncStorage.getItem('coins');
        const storedWeeklyStats = await AsyncStorage.getItem('weeklyStats');
        const storedLastSavedDate = await AsyncStorage.getItem('lastSavedDate');
        const storedStepGoal = await AsyncStorage.getItem('stepGoal');

        // Postavljanje vrijednosti u stanje aplikacije
        if (storedStepGoal) {
          setStepGoal(parseInt(storedStepGoal, 10));
        }

        setStepCount(parseInt(storedStepCount, 10) || 0);
        setCaloriesBurned(parseFloat(storedCaloriesBurned) || 0);
        setDistance(parseFloat(storedDistance) || 0);
        setCoins(parseInt(storedCoins, 10) || 0);
        
        const parsedWeeklyStats = storedWeeklyStats ? JSON.parse(storedWeeklyStats) : [];
        setWeeklyHistory(parsedWeeklyStats);
        setLastSavedDate(storedLastSavedDate || new Date().toISOString().split('T')[0]);
        
        // Označavanje da je kontekst inicijaliziran i spreman
        setIsInitialized(true);
        setIsReady(true);
      } catch (error) {
        console.error('Greška pri učitavanju statistike:', error);
        setIsInitialized(true);
        setIsReady(true);
      }
    };

    loadStats();
  }, []);

  /**
   * FUNKCIJE ZA AŽURIRANJE PODATAKA
   */
  
  /**
   * Ažurira dnevni cilj koraka
   * @param {number} newGoal - Novi cilj koraka
   */
  const updateStepGoal = (newGoal) => {
    setStepGoal(newGoal);
    AsyncStorage.setItem('stepGoal', newGoal.toString());
  };

  /**
   * Ažurira broj novčića
   * @param {number} newAmount - Novi broj novčića
   */
  const updateCoins = (newAmount) => {
    setCoins(newAmount);
    AsyncStorage.setItem('coins', newAmount.toString());
  };

  /**
   * Dodaje novčiće na temelju novih koraka
   * Jedan novčić se dobija za svakih 100 koraka
   * @param {number} newSteps - Trenutni broj koraka
   * @param {number} prevSteps - Prethodni broj koraka
   */
  const addCoinsFromSteps = async (newSteps, prevSteps) => {
    const additionalSteps = Math.max(0, newSteps - prevSteps);
    const additionalCoins = Math.floor(additionalSteps / 100);

    if (additionalCoins > 0) {
      const updatedCoins = coins + additionalCoins;
      setCoins(updatedCoins);
      await AsyncStorage.setItem('coins', updatedCoins.toString());
      await AsyncStorage.setItem('lastCoinStepCount', newSteps.toString());
    }
  };

  /**
   * Ažurira broj koraka i automatski preračunava udaljenost
   * @param {number} newStepCount - Novi broj koraka
   */
  const updateStepCount = (newStepCount) => {
    const newDistance = calculateDistance(newStepCount);
    
    setStepCount(newStepCount);
    setDistance(newDistance);
    
    AsyncStorage.setItem('stepCount', newStepCount.toString());
    AsyncStorage.setItem('distance', newDistance.toString());
  };

  /**
   * Ažurira zadnji broj praćenih koraka za rast cvijeta
   */
  const updateLastTrackedStepCount = async () => {
    await AsyncStorage.setItem('lastTrackedStepCount', stepCount.toString());
  };

  /**
   * AUTOMATSKO SPREMANJE PODATAKA
   */
  
  // Spremanje trenutnih podataka u AsyncStorage pri promjeni
  useEffect(() => {
    if (isInitialized) {
      AsyncStorage.setItem('stepCount', stepCount.toString());
      AsyncStorage.setItem('caloriesBurned', caloriesBurned.toString());
      AsyncStorage.setItem('distance', distance.toString());
      AsyncStorage.setItem('coins', coins.toString());
    }
  }, [stepCount, caloriesBurned, distance, coins, isInitialized]);

  // Spremanje tjedne povijesti pri promjeni
  useEffect(() => {
    if (isInitialized && weeklyHistory.length > 0) {
      AsyncStorage.setItem('weeklyStats', JSON.stringify(weeklyHistory));
    }
  }, [weeklyHistory, isInitialized]);

  // Spremanje datuma zadnjeg spremanja pri promjeni
  useEffect(() => {
    if (isInitialized && lastSavedDate) {
      AsyncStorage.setItem('lastSavedDate', lastSavedDate);
    }
  }, [lastSavedDate, isInitialized]);

  /**
   * FUNKCIJE ZA RAD S POVIJEŠĆU I DNEVNIM RESETIRANJEM
   */

  /**
   * Sprema trenutnu statistiku u povijest
   */
  const saveCurrentStatsToHistory = async () => {
    const currentDate = new Date().toISOString().split('T')[0];
    
    if (stepCount > 0 || caloriesBurned > 0 || distance > 0) {
      // Stvaranje zapisa za trenutni dan
      const dailyStats = {
        date: currentDate,
        stepCount,
        caloriesBurned,
        distance,
        coins
      };
      
      // Ažuriranje povijesti, zamjena postojećeg zapisa za danas ako postoji
      setWeeklyHistory(prevHistory => {
        const filteredHistory = prevHistory.filter(entry => entry.date !== currentDate);
        const updatedHistory = [dailyStats, ...filteredHistory];
        
        // Čuvanje samo zadnjih 7 dana
        return updatedHistory.slice(0, 7);
      });
    }
  };

  /**
   * Resetira dnevnu statistiku
   */
  const resetDailyStats = async () => {
    try {
      await saveCurrentStatsToHistory();

      // Resetiranje na 0
      setStepCount(0);
      setCaloriesBurned(0);
      setDistance(0);

      // Spremanje novih vrijednosti
      await AsyncStorage.setItem('stepCount', '0');
      await AsyncStorage.setItem('caloriesBurned', '0');
      await AsyncStorage.setItem('distance', '0');

      // Ažuriranje datuma
      const today = new Date().toISOString().split('T')[0];
      await AsyncStorage.setItem('lastSavedDate', today);
      setLastSavedDate(today);
    } catch (error) {
      console.error('Greška pri resetiranju dnevne statistike:', error);
    }
  };

  /**
   * Provjerava je li nastupio novi dan
   * @returns {boolean} - true ako je nastupio novi dan, inače false
   */
  const checkForNewDay = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const storedLastSavedDate = await AsyncStorage.getItem('lastSavedDate');
      
      if (!storedLastSavedDate || storedLastSavedDate !== today) {
        // Spremi jučerašnju statistiku
        await saveCurrentStatsToHistory();
        
        // Resetiraj brojače
        setStepCount(0);
        setCaloriesBurned(0);
        setDistance(0);
        
        // Direktno ažuriraj pohranu
        await AsyncStorage.setItem('stepCount', '0');
        await AsyncStorage.setItem('caloriesBurned', '0');
        await AsyncStorage.setItem('distance', '0');
        
        // Resetiraj praćenje koraka za rast cvijeta
        await AsyncStorage.setItem('lastTrackedStepCount', '0');
        
        // Ažuriraj datum zadnjeg spremanja
        await AsyncStorage.setItem('lastSavedDate', today);
        setLastSavedDate(today);
        
        return true; // Novi dan
      }
      return false; // Isti dan
    } catch (error) {
      console.error('Greška pri provjeri za novi dan:', error);
      return false;
    }
  };

  /**
   * AUTOMATSKA PROVJERA NOVOG DANA
   */
  
  // Provjera promjene dana pri promjeni stanja aplikacije (aktivna/pozadina)
  useEffect(() => {
    const handleAppStateChange = async (nextAppState) => {
      if (nextAppState === 'active' && isInitialized) {
        await checkForNewDay();
      }
    };

    try {
      if (typeof AppState.addEventListener === 'function') {
        // Moderan API (React Native 0.65+)
        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => {
          subscription.remove();
        };
      } else {
        // Stariji API
        AppState.addEventListener('change', handleAppStateChange);
        return () => {
          AppState.removeEventListener('change', handleAppStateChange);
        };
      }
    } catch (error) {
      console.error('Greška pri postavljanju AppState listenera:', error);
      return () => {};
    }
  }, [isInitialized]);

  // Periodička provjera novog dana
  useEffect(() => {
    if (!isInitialized) return;
    
    // Provjera svakih 15 minuta
    const intervalCheck = setInterval(async () => {
      await checkForNewDay();
    }, 15 * 60 * 1000);
    
    // Prva provjera odmah
    checkForNewDay();
    
    return () => clearInterval(intervalCheck);
  }, [isInitialized]);

  /**
   * DOSTAVLJANJE KONTEKSTA
   */
  return (
    <StatsContext.Provider
      value={{
        stepCount,
        setStepCount: updateStepCount,
        updateStepCount,
        caloriesBurned,
        setCaloriesBurned,
        distance,
        setDistance,
        coins,
        setCoins: updateCoins,
        addCoinsFromSteps,
        weeklyHistory,
        resetDailyStats,
        saveCurrentStatsToHistory,
        isReady,
        calculateDistance,
        stepGoal,
        setStepGoal: updateStepGoal,
        checkForNewDay,
        updateLastTrackedStepCount
      }}
    >
      {children}
    </StatsContext.Provider>
  );
};

/**
 * Hook za jednostavan pristup statistici iz komponenti
 */
export const useStats = () => useContext(StatsContext);
export default StatsContext;