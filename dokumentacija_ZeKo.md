# Dokumentacija ZeKo aplikacije

## Uvod u strukturu dokumentacije

Ovaj dokument je organiziran prema strukturi aplikacije, počevši od glavnih datoteka pa sve do pomoćnih modula. Svaka sekcija sadrži:

- Svrhu datoteke ili komponente
- Liniju-po-liniju objašnjenje koda
- Objašnjenje logike i algoritama
- Praktične primjere korištenja


## 1. App.js - Glavna točka ulaska aplikacije

### Svrha datoteke

App.js je glavna komponenta koja pokreće cijelu aplikaciju. Ona postavlja navigaciju, kontekst za upravljanje stanjem i osnovnu strukturu aplikacije.

### Detaljno objašnjenje koda

```js
import 'react-native-gesture-handler';
```

**Objašnjenje**: Ova linija MORA biti prva u aplikaciji. React Navigation biblioteka zahtijeva da se ovaj modul učita prije bilo čega drugog jer inicijalizira sustav za rukovanje gestovima (dodir, povlačenje, itd.) koji je potreban za navigaciju.

```js
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
```

**Objašnjenje**:

- `StatusBar` omogućuje kontrolu izgleda statusne trake telefona (boja, prozirnost, sadržaj)
- `SafeAreaProvider` osigurava da se sadržaj aplikacije ne preklapa s notch-om, statusnom trakom ili home indicatorom na različitim uređajima

```js
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
```

**Objašnjenje**:

- `NavigationContainer` je glavni omatač koji omogućuje navigaciju kroz aplikaciju
- `createStackNavigator` stvara "stog" zaslona gdje se novi zasloni dodaju na vrh, a povratkom se uklanjaju

```js
import TabNavigator from './navigation/TabNavigator';
import LoginScreen from './screens/LoginScreen';
import ShopScreen from './screens/ShopScreen';
import LoadingScreen from './components/LoadingScreen';
```

**Objašnjenje**: Uvoz svih glavnih zaslona aplikacije. Svaki import predstavlja zasebnu komponentu koja se koristi u navigaciji.

```js
import { StatsProvider } from './context/StatsContext';
```

**Objašnjenje**: Uvoz konteksta koji omogućuje dijeljenje statistike (koraci, kalorije, novčići) između svih komponenti bez prenošenja kroz props.

```js
const Stack = createStackNavigator();
```

**Objašnjenje**: Kreira instancu Stack navigatora koji će upravljati prijelazima između glavnih zaslona aplikacije.

```js
export default function App() {
  return (
    <SafeAreaProvider>
```

**Objašnjenje**: `SafeAreaProvider` mora omatati cijelu aplikaciju da bi osigurao pravilno rukovanje "sigurnim područjima" na različitim uređajima.

```js
      <StatusBar
        barStyle="light-content"
        backgroundColor="#1E3123"
        translucent={true}
      />
```

**Objašnjenje**:

- `barStyle="light-content"` postavlja bijele ikone u statusnoj traci
- `backgroundColor="#1E3123"` postavlja tamno zelenu boju pozadine
- `translucent={true}` čini statusnu traku prozirnom

```js
      <StatsProvider>
        <NavigationContainer>
```

**Objašnjenje**: `StatsProvider` mora biti izvan `NavigationContainer` ali unutar `SafeAreaProvider` da bi svi zasloni imali pristup statistici.

```js
          <Stack.Navigator initialRouteName="Loading">
```

**Objašnjenje**: Konfigurira Stack navigator da počne sa "Loading" zaslonom kao prvim zaslonom koji će se prikazati.

```js
            <Stack.Screen
              name="Loading"
              component={LoadingScreen}
              options={{ headerShown: false }}
            />
```

**Objašnjenje**:

- `name="Loading"` postavlja jedinstveni identifikator za ovaj zaslon
- `component={LoadingScreen}` povezuje identifikator s konkretnom komponentom
- `options={{ headerShown: false }}` sakriva navigacijsku traku na vrhu


## 2. LoadingScreen.js - Zaslon učitavanja

### Svrha komponente

LoadingScreen provjerava postojanje korisničkih podataka i preusmjerava korisnika na odgovarajući zaslon (Login ili Home).

### Detaljno objašnjenje koda

```js
import React, { useEffect, useState } from 'react';
```

**Objašnjenje**:

- `useEffect` hook se koristi za izvršavanje koda kada se komponenta učitava
- `useState` hook omogućuje komponenti da čuva unutarnje stanje

```js
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
```

**Objašnjenje**:

- `View` je osnovni kontejner (kao `div` u HTML-u)
- `Text` prikazuje tekst
- `ActivityIndicator` prikazuje animaciju učitavanja (spinner)
- `StyleSheet` omogućuje definiranje stilova

```js
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStats } from '../context/StatsContext';
```

**Objašnjenje**:

- `useNavigation` omogućuje komponenti da se kreće između zaslona
- `AsyncStorage` omogućuje trajno spremanje podataka na uređaju
- `useStats` daje pristup kontekstu statistike

```js
export default function LoadingScreen() {
  const navigation = useNavigation();
  const stats = useStats();
  const [checkedLogin, setCheckedLogin] = useState(false);
```

**Objašnjenje**:

- `navigation` objekt se koristi za prelazak između zaslona
- `stats` sadrži sve podatke o statistici iz konteksta
- `checkedLogin` prati je li provjera prijave završena

```js
  const checkUserAuthentication = async () => {
    try {
      const userName = await AsyncStorage.getItem('userName');
      const stepGoal = await AsyncStorage.getItem('stepGoal');
      const weight = await AsyncStorage.getItem('weight');
```

**Objašnjenje**:

- `async/await` omogućuje asinkrono dohvaćanje podataka
- Svaki `getItem` poziv dohvaća jedan podatak iz trajne memorije
- `await` čeka da se operacija završi prije prelaska na sljedeću liniju

```js
      if (userName && stepGoal && weight) {
        navigation.replace('Home');
      } else {
        navigation.replace('Login');
      }
```

**Objašnjenje**:

- Ako svi podaci postoje, korisnik je prijavljen i ide na Home zaslon
- Ako bilo koji podatak nedostaje, korisnik ide na Login zaslon
- `replace` uklanja trenutni zaslon iz stoga (korisnik se ne može vratiti)

```js
    } catch (error) {
      console.error('Greška pri provjeri autentikacije:', error);
      navigation.replace('Login');
    }
```

**Objašnjenje**:

- `try/catch` hvata greške koje se mogu dogoditi prilikom pristupa AsyncStorage-u
- U slučaju greške, sigurno je usmjeriti korisnika na Login zaslon

```js
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!checkedLogin) {
        checkUserAuthentication();
      }
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [navigation, checkedLogin]);
```

**Objašnjenje**:

- `useEffect` se pokreće kada se komponenta učita
- `setTimeout` čeka 500ms prije provjere (daje vremena kontekstu da se učita)
- Return funkcija čisti timeout ako se komponenta ukloni prije završetka
- `[navigation, checkedLogin]` znači da se efekt pokreće ako se te varijable promijene

```js
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="white" />
      <Text style={styles.text}>Učitavanje...</Text>
    </View>
  );
```

**Objašnjenje**:

- Prikazuje spinner i tekst dok se provjerava autentikacija
- `styles.container` referencira stil definiran u `StyleSheet.create`


## 3. StatsContext.js - Upravljanje stanjem aplikacije

### Svrha datoteke

StatsContext je srce aplikacije za upravljanje stanjem. Čuva sve podatke o koracima, kalorijama, udaljenosti i novčićima, te osigurava njihovu sinkronizaciju kroz aplikaciju.

### Detaljno objašnjenje koda

```js
import React, { createContext, useState, useContext, useEffect } from 'react';
```

**Objašnjenje**:

- `createContext` stvara novi React kontekst za dijeljenje podataka
- `useState` omogućuje čuvanje lokalnog stanja komponente
- `useContext` omogućuje pristup kontekstu iz drugih komponenti
- `useEffect` omogućuje izvršavanje koda nakon promjena stanja

```js
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STEP_LENGTH } from '../utils/PedometerService';
```

**Objašnjenje**:

- `AppState` omogućuje praćenje je li aplikacija aktivna ili u pozadini
- `AsyncStorage` za trajno spremanje podataka
- `STEP_LENGTH` konstanta za izračun udaljenosti (0.75 metara po koraku)

```js
const StatsContext = createContext();
```

**Objašnjenje**: Stvara novi kontekst koji će biti dostupan svim komponentama omatanima u Provider.

```js
const calculateDistance = (steps) => {
  if (!steps || isNaN(steps) || steps < 0) {
    return 0;
  }
```

**Objašnjenje**:

- Provjerava je li `steps` valjan (nije null, undefined, NaN ili negativan)
- Vraća 0 ako podaci nisu valjani

```js
  const numSteps = Number(steps);
  const distanceKm = (numSteps * STEP_LENGTH) / 1000;
  return parseFloat(distanceKm.toFixed(2));
```

**Objašnjenje**:

- `Number(steps)` osigurava da je vrijednost broj
- Množi korake s duljinom koraka i dijeli s 1000 za pretvorbu u kilometre
- `toFixed(2)` ograničava na 2 decimale, `parseFloat` uklanja suvišne nule

```js
export const StatsProvider = ({ children }) => {
  const [stepCount, setStepCount] = useState(0);
  const [caloriesBurned, setCaloriesBurned] = useState(0);
  const [distance, setDistance] = useState(0);
  const [coins, setCoins] = useState(0);
```

**Objašnjenje**:

- Svaki `useState` kreira varijablu stanja i funkciju za njeno ažuriranje
- `children` su sve komponente koje će biti omatane ovim Providerom

```js
  const [weeklyHistory, setWeeklyHistory] = useState([]);
  const [lastSavedDate, setLastSavedDate] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isReady, setIsReady] = useState(false);
```

**Objašnjenje**:

- `weeklyHistory` čuva statistiku za svaki dan u tjednu
- `lastSavedDate` pamti kada je zadnji put spremljena statistika
- `isInitialized` označava je li učitavanje podataka završeno
- `isReady` označava je li kontekst spreman za korištenje

```js
  useEffect(() => {
    const loadStats = async () => {
      try {
        const storedStepCount = await AsyncStorage.getItem('stepCount');
        const storedCaloriesBurned = await AsyncStorage.getItem('caloriesBurned');
        const storedDistance = await AsyncStorage.getItem('distance');
        const storedCoins = await AsyncStorage.getItem('coins');
```

**Objašnjenje**:

- `useEffect` bez dependency array se pokreće jednom kada se komponenta učita
- Svaki `getItem` dohvaća jedan podatak iz trajne memorije
- Podaci se čuvaju kao stringovi, pa ih treba parsirati

```js
        setStepCount(parseInt(storedStepCount, 10) || 0);
        setCaloriesBurned(parseFloat(storedCaloriesBurned) || 0);
        setDistance(parseFloat(storedDistance) || 0);
        setCoins(parseInt(storedCoins, 10) || 0);
```

**Objašnjenje**:

- `parseInt(value, 10)` pretvara string u cijeli broj (baza 10)
- `parseFloat` pretvara string u decimalni broj
- `|| 0` osigurava zadanu vrijednost 0 ako je podatak null ili undefined

```js
        const parsedWeeklyStats = storedWeeklyStats ? JSON.parse(storedWeeklyStats) : [];
        setWeeklyHistory(parsedWeeklyStats);
```

**Objašnjenje**:

- `JSON.parse` pretvara JSON string natrag u JavaScript objekt/array
- Ako nema spremljenih podataka, koristi se prazan array

```js
        setIsInitialized(true);
        setIsReady(true);
      } catch (error) {
        console.error('Greška pri učitavanju statistike:', error);
        setIsInitialized(true);
        setIsReady(true);
      }
```

**Objašnjenje**:

- Označava da je učitavanje završeno bez obzira na uspjeh ili grešku
- `console.error` logira grešku za debug potrebe

```js
  const updateStepCount = (newStepCount) => {
    const newDistance = calculateDistance(newStepCount);
    setStepCount(newStepCount);
    setDistance(newDistance);
    AsyncStorage.setItem('stepCount', newStepCount.toString());
    AsyncStorage.setItem('distance', newDistance.toString());
  };
```

**Objašnjenje**:

- Ova funkcija automatski izračunava novu udaljenost kada se promijeni broj koraka
- Ažurira oba stanja i sprema ih u trajnu memoriju
- `toString()` pretvara broj u string za spremanje

```js
  const addCoinsFromSteps = async (newSteps, prevSteps) => {
    const additionalSteps = Math.max(0, newSteps - prevSteps);
    const additionalCoins = Math.floor(additionalSteps / 100);
```

**Objašnjenje**:

- `Math.max(0, difference)` osigurava da razlika nikad nije negativna
- `Math.floor(division / 100)` daje 1 novčić za svakih 100 koraka (zaokruženo prema dolje)

```js
    if (additionalCoins > 0) {
      const updatedCoins = coins + additionalCoins;
      setCoins(updatedCoins);
      await AsyncStorage.setItem('coins', updatedCoins.toString());
      await AsyncStorage.setItem('lastCoinStepCount', newSteps.toString());
    }
```

**Objašnjenje**:

- Dodaje novčiće samo ako je korisnik zaradio barem jedan
- `await` osigurava da se podaci stvarno spremiju prije nastavka
- `lastCoinStepCount` pamti do kojeg koraka su novčići izračunati

```js
  useEffect(() => {
    if (isInitialized) {
      AsyncStorage.setItem('stepCount', stepCount.toString());
      AsyncStorage.setItem('caloriesBurned', caloriesBurned.toString());
      AsyncStorage.setItem('distance', distance.toString());
      AsyncStorage.setItem('coins', coins.toString());
    }
  }, [stepCount, caloriesBurned, distance, coins, isInitialized]);
```

**Objašnjenje**:

- Ovaj `useEffect` se pokreće svaki put kada se promijeni bilo koja od navedenih varijabli
- Automatski sprema sve promjene u trajnu memoriju
- `isInitialized` sprječava spremanje prije učitavanja početnih podataka

```js
  const checkForNewDay = async () => {
    try {
      const today = new Date().toISOString().split('T')[^0];
      const storedLastSavedDate = await AsyncStorage.getItem('lastSavedDate');
```

**Objašnjenje**:

- `new Date().toISOString().split('T')` daje datum u formatu "YYYY-MM-DD"
- Uspoređuje današnji datum s datumom kada su podaci zadnji put spremljeni

```js
      if (!storedLastSavedDate || storedLastSavedDate !== today) {
        await saveCurrentStatsToHistory();
        
        setStepCount(0);
        setCaloriesBurned(0);
        setDistance(0);
```

**Objašnjenje**:

- Ako datum nije isti, nastao je novi dan
- Prvo sprema trenutnu statistiku u povijest
- Zatim resetira sve brojače na 0 za novi dan

```js
        await AsyncStorage.setItem('stepCount', '0');
        await AsyncStorage.setItem('caloriesBurned', '0');
        await AsyncStorage.setItem('distance', '0');
        await AsyncStorage.setItem('lastTrackedStepCount', '0');
```

**Objašnjenje**:

- Također resetira sve spremljene vrijednosti u trajnoj memoriji
- `lastTrackedStepCount` se resetira za praćenje rasta cvijeta

```js
        await AsyncStorage.setItem('lastSavedDate', today);
        setLastSavedDate(today);
        return true;
      }
      return false;
```

**Objašnjenje**:

- Ažurira datum zadnjeg spremanja na današnji
- Vraća `true` ako je nastupio novi dan, `false` ako nije

```js
  const saveCurrentStatsToHistory = async () => {
    const currentDate = new Date().toISOString().split('T')[^0];
    
    if (stepCount > 0 || caloriesBurned > 0 || distance > 0) {
      const dailyStats = {
        date: currentDate,
        stepCount,
        caloriesBurned,
        distance,
        coins
      };
```

**Objašnjenje**:

- Sprema statistiku samo ako ima značajnih podataka (ne sprema prazne dane)
- Kreira objekt s datumom i svim statističkim podacima

```js
      setWeeklyHistory(prevHistory => {
        const filteredHistory = prevHistory.filter(entry => entry.date !== currentDate);
        const updatedHistory = [dailyStats, ...filteredHistory];
        return updatedHistory.slice(0, 7);
      });
```

**Objašnjenje**:

- `filter` uklanja postojeći zapis za današnji dan (ako postoji)
- `[dailyStats, ...filteredHistory]` dodaje novi zapis na početak
- `slice(0, 7)` čuva samo posljednjih 7 dana

```js
  useEffect(() => {
    const handleAppStateChange = async (nextAppState) => {
      if (nextAppState === 'active' && isInitialized) {
        await checkForNewDay();
      }
    };
```

**Objašnjenje**:

- Prati kada korisnik vrati aplikaciju iz pozadine
- `nextAppState === 'active'` znači da je aplikacija postala aktivna
- Automatski provjerava je li nastupio novi dan

```js
    try {
      if (typeof AppState.addEventListener === 'function') {
        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => {
          subscription.remove();
        };
      } else {
        AppState.addEventListener('change', handleAppStateChange);
        return () => {
          AppState.removeEventListener('change', handleAppStateChange);
        };
      }
    } catch (error) {
      console.error('Greška pri postavljanju AppState listenera:', error);
      return () => {};
    }
```

**Objašnjenje**:

- Ovaj kod je kompatibilan s različitim verzijama React Native-a
- Novije verzije koriste `addEventListener` koji vraća objekt s `remove` metodom
- Starije verzije koriste `addEventListener`/`removeEventListener` kao globalne funkcije
- Return funkcija čisti listener kada se komponenta ukloni

```js
  return (
    <StatsContext.Provider
      value={{
        stepCount,
        setStepCount: updateStepCount,
        updateStepCount,
        caloriesBurned,
        setCaloriesBurned,
        // ... ostale vrijednosti
      }}
    >
      {children}
    </StatsContext.Provider>
  );
```

**Objašnjenje**:

- `StatsContext.Provider` čini sve navedene vrijednosti dostupnima svim `children` komponentama
- `value` objekt sadrži sve funkcije i varijable koje ostale komponente mogu koristiti
- `{children}` renderira sve komponente omatane ovim Providerom

```js
export const useStats = () => useContext(StatsContext);
export default StatsContext;
```

**Objašnjenje**:

- `useStats` je prilagođeni hook koji omogućuje lako pristupanje kontekstu
- Umjesto `useContext(StatsContext)`, komponente mogu koristiti samo `useStats()`


## 4. PedometerService.js - Detekcija koraka

### Svrha datoteke

PedometerService koristi senzore uređaja (akcelerometar i žiroskop) za detekciju koraka. Implementira sofisticirane algoritme za prepoznavanje hodanja i izračun kalorija.

### Detaljno objašnjenje koda

```js
import { Accelerometer, Gyroscope } from 'expo-sensors';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
```

**Objašnjenje**:

- `Accelerometer` mjeri promjene brzine kretanja uređaja
- `Gyroscope` mjeri rotaciju uređaja
- `Device` daje informacije o modelu i proizvođaču uređaja

```js
export const STEP_LENGTH = 0.75;
```

**Objašnjenje**: Konstantna prosječna duljina koraka u metrima, koristi se za izračun udaljenosti.

```js
class PedometerService {
  constructor() {
    this.accelerometerSubscription = null;
    this.gyroscopeSubscription = null;
    
    this.lastAcceleration = { x: 0, y: 0, z: 0 };
    this.lastPeakTime = 0;
    this.stepThreshold = 1.2;
    this.walkingState = false;
    this.recentMagnitudes = [];
    
    this.rateTrackingStart = Date.now();
    this.startingSteps = 0;
  }
```

**Objašnjenje**:

- `constructor` inicijalizira sve varijable potrebne za detekciju koraka
- `accelerometerSubscription` čuva referencu na pretplatu senzora
- `lastAcceleration` pamti prethodne vrijednosti za filtriranje
- `stepThreshold` je prag osjetljivosti za detekciju koraka
- `walkingState` prati je li korisnik u stanju hodanja
- `recentMagnitudes` čuva nedavne vrijednosti za adaptivni algoritam

```js
  async initializeDevice() {
    try {
      const brand = await Device.getBrandAsync();
      const model = await Device.getModelAsync();
      
      if (brand.toLowerCase().includes('samsung')) {
        this.stepThreshold = 1.1; 
      } else if (brand.toLowerCase().includes('xiaomi')) {
        this.stepThreshold = 0.9;
      } else if (brand.toLowerCase().includes('huawei')) {
        this.stepThreshold = 1.0; 
      } else if (brand.toLowerCase().includes('oneplus')) {
        this.stepThreshold = 1.2;
      }
```

**Objašnjenje**:

- Različiti proizvođači kalibriraju senzore drugačije
- Ova funkcija prilagođava osjetljivost ovisno o brendu uređaja
- Samsung uređaji obično trebaju niži prag, Xiaomi još niži
- Ovo poboljšava preciznost detekcije koraka

```js
      console.log(`Primijenjena kalibracija specifična za uređaj: ${brand} ${model}, prag: ${this.stepThreshold}`);
    } catch (error) {
      console.log('Nije moguće primijeniti kalibraciju specifičnu za uređaj:', error);
    }
```

**Objašnjenje**:

- Logira informacije o kalibraciji za debugging
- Ako kalibracija ne uspije, koristi se zadana vrijednost

```js
  async subscribe(onStepDetected, currentStepCount) {
    this.startingSteps = currentStepCount || 0;
    console.log('PedometerService započinje s brojem koraka:', this.startingSteps);
    this.rateTrackingStart = Date.now();
```

**Objašnjenje**:

- `onStepDetected` je callback funkcija koja se poziva kada se detektira korak
- `currentStepCount` je početni broj koraka
- `Date.now()` vraća trenutno vrijeme u milisekundama

```js
    if (!this.accelerometerSubscription) {
      this.accelerometerSubscription = Accelerometer.addListener(acceleration => {
        this.detectStep(acceleration, this.gyroData, onStepDetected);
      });
      Accelerometer.setUpdateInterval(100);
    }
```

**Objašnjenje**:

- Provjerava da se ne stvori dupla pretplata
- `addListener` postavlja funkciju koja se poziva za svaki novi podatak senzora
- `setUpdateInterval(100)` postavlja frekvenciju na 10 puta u sekundi (100ms)
- Viša frekvencija daje bolju preciznost detekcije

```js
    if (!this.gyroscopeSubscription) {
      this.gyroscopeSubscription = Gyroscope.addListener(gyro => {
        this.gyroData = gyro;
      });
      Gyroscope.setUpdateInterval(100);
    }
```

**Objašnjenje**:

- Žiroskop pomaže razlikovati hodanje od drugih kretanja
- Podaci se samo spremaju u `this.gyroData` za korištenje u algoritmu

```js
  unsubscribe() {
    if (this.accelerometerSubscription) {
      this.accelerometerSubscription.remove();
      this.accelerometerSubscription = null;
    }
    
    if (this.gyroscopeSubscription) {
      this.gyroscopeSubscription.remove();
      this.gyroscopeSubscription = null;
    }

    if (this.stepRateInterval) {
      clearInterval(this.stepRateInterval);
    }
  }
```

**Objašnjenje**:

- `remove()` zaustavlja slušanje senzora i oslobađa memoriju
- Postavlja reference na `null` da označi da nema aktivnih pretplata
- `clearInterval` zaustavlja periodičko praćenje stope koraka

```js
  detectStep(acceleration, gyroData, onStepDetected) {
    const alpha = 0.25; 
    const filteredAcceleration = {
      x: alpha * this.lastAcceleration.x + (1 - alpha) * acceleration.x,
      y: alpha * this.lastAcceleration.y + (1 - alpha) * acceleration.y,
      z: alpha * this.lastAcceleration.z + (1 - alpha) * acceleration.z,
    };
```

**Objašnjenje**:

- Ovo je niskopropusni filter koji gladi podatke senzora
- `alpha = 0.25` znači da se 25% prethodne vrijednosti kombinira s 75% nove vrijednosti
- Ovo uklanja šum i iznenadne skokove u podacima koji nisu stvarni koraci

```js
    const deltaX = Math.abs(filteredAcceleration.x - this.lastAcceleration.x);
    const deltaY = Math.abs(filteredAcceleration.y - this.lastAcceleration.y);
    const deltaZ = Math.abs(filteredAcceleration.z - this.lastAcceleration.z);

    const magnitude = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);
```

**Objašnjenje**:

- Izračunava promjenu ubrzanja po svakoj osi (x, y, z)
- `Math.abs` osigurava pozitivne vrijednosti
- `Math.sqrt(x² + y² + z²)` izračunava euklidsku udaljenost u 3D prostoru
- Ova formula daje ukupnu "snagu" kretanja bez obzira na smjer

```js
    this.recentMagnitudes = [...this.recentMagnitudes, magnitude].slice(-20);
    
    const avgMagnitude = this.recentMagnitudes.reduce((sum, val) => sum + val, 0) / this.recentMagnitudes.length;
```

**Objašnjenje**:

- `[...array, newItem].slice(-20)` dodaje novi element i zadržava zadnjih 20
- `reduce` izračunava ukupnu sumu svih elemenata
- Prosječna magnituda pomaže prepoznati je li korisnik u stanju hodanja

```js
    const isWalking = avgMagnitude > 0.4;
    if (isWalking !== this.walkingState) {
      this.walkingState = isWalking;
      console.log(isWalking ? "Hod otkriven" : "Hod zaustavljen");
    }
```

**Objašnjenje**:

- Ako je prosječna magnituda veća od 0.4, korisnik vjerojatno hoda
- Logira promjene stanja hodanja za debugging
- Ovo pomaže algoritmu prilagoditi osjetljivost

```js
    if (this.recentMagnitudes.length > 10) {
      const dynamicThreshold = Math.max(0.6, Math.min(1.3, avgMagnitude * 1.4));
      if (Math.abs(dynamicThreshold - this.stepThreshold) > 0.15) {
        this.stepThreshold = dynamicThreshold;
      }
    }
```

**Objašnjenje**:

- Dinamički prilagođava prag detekcije na temelju nedavne aktivnosti
- `Math.max(0.6, Math.min(1.3, value))` ograničava vrijednost između 0.6 i 1.3
- Mijenja prag samo ako je razlika značajna (> 0.15)

```js
    const currentTime = Date.now();
    const timeSinceLastPeak = currentTime - this.lastPeakTime;

    const effectiveThreshold = this.walkingState ? 
      this.stepThreshold : 
      Math.min(1.8, this.stepThreshold * 1.8);
```

**Objašnjenje**:

- Izračunava koliko je vremena prošlo od zadnjeg koraka
- Koristi niži prag kada je korisnik u stanju hodanja
- Koristi viši prag kada korisnik nije jasno u hodu (sprječava lažne pozitive)

```js
    if (magnitude > effectiveThreshold && timeSinceLastPeak > 350) {
      onStepDetected && onStepDetected();
      this.lastPeakTime = currentTime;
    }

    this.lastAcceleration = filteredAcceleration;
```

**Objašnjenje**:

- Detektira korak ako je magnituda veća od praga I prošlo je barem 350ms od zadnjeg koraka
- `onStepDetected && onStepDetected()` sigurno poziva callback ako postoji
- Ažurira vrijeme zadnjeg koraka i spremlje filtrirane podatke za sljedeći ciklus

```js
  calculateCaloriesBurned(steps, weight) {
    const caloriesPerKgPerStep = 0.0005;
    return weight * caloriesPerKgPerStep * steps;
  }
```

**Objašnjenje**:

- Jednostavan algoritam: 0.0005 kalorija po kilogramu po koraku
- Osoba od 70kg troši ~0.035 kalorija po koraku
- Ovo je konzervativna procjena za prosječno hodanje

```js
  calculateDistance(steps) {
    if (!steps || isNaN(steps) || steps < 0) {
      return 0;
    }
    
    const numSteps = Number(steps);
    return parseFloat(((numSteps * STEP_LENGTH) / 1000).toFixed(2));
  }
```

**Objašnjenje**:

- Validira da su koraci valjani broj
- Množi s `STEP_LENGTH` (0.75m) i dijeli s 1000 za kilometre
- `toFixed(2)` ograničava na 2 decimale, `parseFloat` uklanja nepotrebne nule


## 5. HomeScreen.js - Glavni zaslon

### Svrha komponente

HomeScreen je glavni dashboard aplikacije koji prikazuje trenutnu statistiku, dnevni cilj i napredak uzgoja cvijeta.

### Detaljno objašnjenje koda

```js
import React, { useState, useEffect } from 'react';
import { Text, View, AppState, StyleSheet, Image, Dimensions, TouchableOpacity } from 'react-native';
```

**Objašnjenje**:

- `useState` i `useEffect` za upravljanje stanjem komponente
- `AppState` za praćenje je li aplikacija aktivna ili u pozadini
- `Dimensions` za dohvaćanje veličine ekrana uređaja

```js
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStats } from '../context/StatsContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
```

**Objašnjenje**:

- `SafeAreaView` osigurava da se sadržaj ne preklapa s notch-om
- `useFocusEffect` omogućuje izvršavanje koda kada se zaslon fokusira

```js
import PedometerService, { STEP_LENGTH } from '../utils/PedometerService';
import { registerBackgroundTask } from '../utils/BackgroundTasks';
import CircularProgress from '../utils/CircularProgress';
```

**Objašnjenje**:

- Uvoz servisa za detekciju koraka i konstante duljine koraka
- Funkcija za registraciju pozadinskih zadataka
- Komponenta za prikaz kružnog napretka

```js
function HomeScreen() {
  const navigation = useNavigation();
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
```

**Objašnjenje**:

- `Dimensions.get('window')` vraća objekt s dimenzijama ekrana
- Destrukturiranje dohvaća širinu i visinu ekrana

```js
  const [userName, setUserName] = useState('');
  const [weight, setWeight] = useState(70);
  const [appState, setAppState] = useState(AppState.currentState);
  const prevStepCount = React.useRef(0);
  const [dimensions, setDimensions] = useState({screen: Dimensions.get('window')});
```

**Objašnjenje**:

- `userName` čuva ime korisnika dohvaćeno iz AsyncStorage
- `weight` čuva težinu korisnika (zadano 70kg)
- `appState` prati trenutno stanje aplikacije
- `useRef(0)` čuva referencu na prethodnji broj koraka (ne uzrokuje re-render)

```js
  const { 
    stepCount, 
    updateStepCount,
    caloriesBurned, 
    setCaloriesBurned, 
    distance, 
    setDistance, 
    coins, 
    setCoins, 
    stepGoal, 
    isReady,
    checkForNewDay,
    addCoinsFromSteps
  } = useStats();
```

**Objašnjenje**:

- Destrukturiranje dohvaća sve potrebne varijable i funkcije iz StatsContext
- `isReady` osigurava da se komponenta ne pokušava renderirati prije nego što su podaci učitani

```js
  const [activeFlower, setActiveFlower] = useState(null);
  const [growthProgress, setGrowthProgress] = useState(0);
  const [grownFlowers, setGrownFlowers] = useState([]);
```

**Objašnjenje**:

- `activeFlower` čuva podatke o trenutno aktivnom cvijetu koji se uzgaja
- `growthProgress` prati koliko koraka je uloženo u rast trenutnog cvijeta
- `grownFlowers` čuva listu svih uzgojenih cvjetova

```js
  const loadUserInfo = async () => {
    try {
      const name = await AsyncStorage.getItem('userName');
      const storedWeight = await AsyncStorage.getItem('weight');
      
      if (!name) {
        navigation.navigate('Login');
        return;
      }
      
      setUserName(name);
      if (storedWeight) setWeight(parseFloat(storedWeight));
    } catch (error) {
      console.error('Greška pri učitavanju korisničkih podataka:', error);
    }
  };
```

**Objašnjenje**:

- Async funkcija dohvaća korisničke podatke iz trajne memorije
- Ako nema imena, preusmjerava na Login zaslon
- `parseFloat` pretvara string u decimalni broj za težinu

```js
  const loadGardenData = async () => {
    try {
      const storedActiveFlower = await AsyncStorage.getItem('activeFlower');
      const storedFlowerProgress = await AsyncStorage.getItem('flowerProgressMap');
      const storedGrownFlowers = await AsyncStorage.getItem('grownFlowers');
```

**Objašnjenje**:

- Dohvaća podatke o aktivnom cvijetu, napretku rasta i uzgojenim cvjetovima
- Svaki podatak se dohvaća zasebno iz AsyncStorage

```js
      let progressMap = {};
      if (storedFlowerProgress) {
        progressMap = JSON.parse(storedFlowerProgress);
      }
      
      if (storedGrownFlowers) {
        setGrownFlowers(JSON.parse(storedGrownFlowers));
      }
```

**Objašnjenje**:

- `JSON.parse` pretvara spremljeni JSON string natrag u JavaScript objekt
- `progressMap` pamti napredak za svaki individualni cvijet

```js
      if (storedActiveFlower && storedActiveFlower !== 'null') {
        const flower = JSON.parse(storedActiveFlower);
        setActiveFlower(flower);
        
        if (flower.instanceId && progressMap[flower.instanceId] !== undefined) {
          setGrowthProgress(progressMap[flower.instanceId]);
        } else {
          setGrowthProgress(0);
        }
      } else {
        setActiveFlower(null);
        setGrowthProgress(0);
      }
```

**Objašnjenje**:

- Provjerava da aktivni cvijet postoji i nije 'null' string
- `instanceId` omogućuje razlikovanje više primjeraka istog tipa cvijeta
- Postavlja napredak na 0 ako nema spremljenih podataka

```js
  useEffect(() => {
    loadUserInfo();
  }, []);

  useEffect(() => {
    loadGardenData();
  }, []);
```

**Objašnjenje**:

- Ova dva `useEffect` se pokreću jednom kada se komponenta učita
- Prazan dependency array `[]` osigurava da se pokreću samo jednom

```js
  useFocusEffect(
    React.useCallback(() => {
      loadGardenData();
      return () => {}; 
    }, [])
  );
```

**Objašnjenje**:

- `useFocusEffect` se pokreće svaki put kada se zaslon fokusira
- `React.useCallback` optimizira performanse sprječavajući nepotrebna re-renderiranja
- Return funkcija je cleanup (trenutno prazna)

```js
  useEffect(() => {
    if (!activeFlower) return;

    const updateFlowerGrowth = async () => {
      try {
        const lastTracked = parseInt(await AsyncStorage.getItem('lastTrackedStepCount') || '0', 10);

        if (stepCount > lastTracked) {
          const stepsSince = stepCount - lastTracked;
          const newProgress = growthProgress + stepsSince;

          setGrowthProgress(newProgress);
```

**Objašnjenje**:

- Pokreće se svaki put kada se promijeni `stepCount`
- `lastTrackedStepCount` pamti do kojeg koraka je napredak cvijeta ažuriran
- Dodaje razliku koraka na trenutni napredak

```js
          const storedMap = await AsyncStorage.getItem('flowerProgressMap');
          const map = storedMap ? JSON.parse(storedMap) : {};

          if (activeFlower.instanceId) {
            map[activeFlower.instanceId] = newProgress;
            await AsyncStorage.setItem('flowerProgressMap', JSON.stringify(map));
          }

          await AsyncStorage.setItem('lastTrackedStepCount', stepCount.toString());
```

**Objašnjenje**:

- Dohvaća mapu napretka za sve cvjetove
- Ažurira napredak za trenutni aktivni cvijet koristeći njegov `instanceId`
- Sprema ažuriranu mapu i novi broj praćenih koraka

```js
          if (newProgress >= activeFlower.stepsToGrow) {
            console.log('Cvijet je potpuno izrastao!');
          }
        }
      } catch (error) {
        console.error('Greška pri ažuriranju rasta cvijeta:', error);
      }
    };

    updateFlowerGrowth();
  }, [stepCount]);
```

**Objašnjenje**:

- Provjerava je li cvijet potpuno izrastao (napredak >= potrebni koraci)
- Dependency `[stepCount]` znači da se pokreće svaki put kada se broj koraka promijeni

```js
  useEffect(() => {
    if (!isReady) return;
    
    const setupPedometer = async () => {
      try {
        await PedometerService.initializeDevice();
        PedometerService.subscribe(handleStepDetected, stepCount);
        registerBackgroundTask();
      } catch (error) {
        console.error('Greška pri inicijalizaciji pedometra:', error);
      }
    };
    
    setupPedometer();
    
    return () => {
      PedometerService.unsubscribe();
    };
  }, [isReady, stepCount]);
```

**Objašnjenje**:

- Čeka da kontekst bude spreman prije inicijalizacije pedometra
- `initializeDevice()` kalibrira senzore za specifični uređaj
- `subscribe` postavlja callback funkciju za detekciju koraka
- `registerBackgroundTask` omogućuje rad u pozadini
- Return funkcija čisti pretplate kada se komponenta ukloni

```js
  const handleStepDetected = () => {
    const prev = stepCount;
    const updated = stepCount + 1;
    updateStepCount(updated);     
    addCoinsFromSteps(updated, prev); 
  };
```

**Objašnjenje**:

- Poziva se svaki put kada PedometerService detektira korak
- Povećava broj koraka za 1
- `addCoinsFromSteps` automatski izračunava i dodaje novčiće

```js
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      loadGardenData();
      
      const checkProfileUpdates = async () => {
        const storedWeight = await AsyncStorage.getItem('weight');
        if (storedWeight) {
          const parsedWeight = parseFloat(storedWeight);
          if (parsedWeight !== weight) setWeight(parsedWeight);
        }
      };
      
      checkProfileUpdates();
    }, 5000);
    
    return () => clearInterval(refreshInterval);
  }, []);
```

**Objašnjenje**:

- `setInterval` pokreće funkciju svakih 5 sekundi (5000ms)
- Osvježava podatke o vrtu i provjerava je li se promijenila težina korisnika
- Return funkcija čisti interval kada se komponenta ukloni

```js
  useEffect(() => {
    const handleAppStateChange = async (nextAppState) => {
      const prevState = appState;
      setAppState(nextAppState);
      
      if (prevState === 'background' && nextAppState === 'active') {
        const dayChanged = await checkForNewDay();
        
        if (dayChanged) {
          PedometerService.unsubscribe();
          PedometerService.resetTracking(0);
          PedometerService.subscribe(handleStepDetected, 0);
        }
        
        loadGardenData();
      }
    };
```

**Objašnjenje**:

- Prati promjene stanja aplikacije (aktivna/pozadina/neaktivna)
- Kada se aplikacija vrati iz pozadine, provjerava je li nastupio novi dan
- Ako je novi dan, resetira pedometar i ponovno ga inicijalizira

```js
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, [appState]);
```

**Objašnjenje**:

- Postavlja listener za promjene stanja aplikacije
- Return funkcija uklanja listener kada se komponenta ukloni
- Dependency `[appState]` osigurava da se listener ažurira ako se stanje promijeni

```js
  useEffect(() => {
    const newCaloriesBurned = PedometerService.calculateCaloriesBurned(stepCount, weight);
    setCaloriesBurned(newCaloriesBurned);
    prevStepCount.current = stepCount;
  }, [stepCount, weight]);
```

**Objašnjenje**:

- Automatski preračunava kalorije kada se promijeni broj koraka ili težina
- `prevStepCount.current` sprema prethodnju vrijednost u ref (ne uzrokuje re-render)

```js
  useEffect(() => {
    const newDistance = (stepCount * STEP_LENGTH) / 1000;
    if (Math.abs(newDistance - distance) > 0.01) {
      setDistance(newDistance);
    }
  }, [stepCount]);
```

**Objašnjenje**:

- Izračunava novu udaljenost kada se promijeni broj koraka
- Ažurira stanje samo ako je razlika veća od 0.01km (10 metara)
- Ovo sprječava previše ažuriranja za male promjene

```js
  useEffect(() => {
    const handleStepCountChange = async () => {
      try {
        const lastCoinStepCount = parseInt(await AsyncStorage.getItem('lastCoinStepCount') || '0', 10);

        if (stepCount > lastCoinStepCount) {
          const additionalSteps = stepCount - lastCoinStepCount;
          const newCoins = Math.floor(additionalSteps / 100);

          if (newCoins > 0) {
            setCoins(prevCoins => {
              const updated = prevCoins + newCoins;
              AsyncStorage.setItem('coins', updated.toString());
              return updated;
            });

            await AsyncStorage.setItem('lastCoinStepCount', stepCount.toString());
          }
        }
      } catch (error) {
        console.error('Greška pri ažuriranju novčića:', error);
      }
    };

    handleStepCountChange();
  }, [stepCount]);
```

**Objašnjenje**:

- Izračunava koliko novih novčića korisnik zaslužuje
- 1 novčić za svakih 100 koraka (`Math.floor` zaokružuje prema dolje)
- `setCoins(prevCoins => ...)` koristi funkcijski update za sigurnost
- Ažurira `lastCoinStepCount` da sprječava dvostruko brojanje

```js
  const percentage = Math.min(((stepCount / stepGoal) * 100).toFixed(0), 100);
```

**Objašnjenje**:

- Izračunava postotak ostvarenja dnevnog cilja
- `toFixed(0)` zaokružuje na cijeli broj
- `Math.min(..., 100)` osigurava da postotak ne prelazi 100%

```js
  const formatNumber = (number) => {
    return new Intl.NumberFormat().format(number);
  };
```

**Objašnjenje**:

- `Intl.NumberFormat` automatski dodaje separatore tisućica
- Npr. 12345 postaje "12,345" (ovisno o lokalizaciji uređaja)

```js
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Pozdrav, {userName || 'Korisniče'}!</Text>
            <Text style={styles.welcome}>Dobrodošli natrag</Text>
          </View>

          <View style={styles.coinsContainer}>
            <View style={styles.coins}>
              <Text style={styles.coinsText}>{coins}</Text>
              <SvgCoins width="19.5" height="24" />
            </View>
          </View>
        </View>
```

**Objašnjenje**:

- `{userName || 'Korisniče'}` prikazuje ime korisnika ili zadanu vrijednost
- `SvgCoins` je komponenta koja prikazuje ikonu novčića
- Zaglavlje sadrži pozdrav i prikaz trenutnog stanja novčića

```js
        <View style={styles.stepsCard}>
          <View style={styles.stepsLeftColumn}>
            <View style={styles.stepsHeader}>
              <View style={styles.stepsIcon}>
                <SvgSteps width="27.27" height="30" />
              </View>
              <Text style={styles.stepsTitle}>Koraci</Text>
            </View>
        
            <View style={styles.stepsProgress}>
              <CircularProgress percentage={percentage} />
              <Text style={styles.stepsPercentage}>{percentage}%</Text>
            </View>
          </View>
```

**Objašnjenje**:

- Glavna kartica za prikaz koraka podijeljena je u dva stupca
- Lijevi stupac sadrži ikonu, naslov i kružni indikator napretka
- `CircularProgress` je prilagođena komponenta koja prima postotak

```js
          <View style={styles.stepsRightColumn}>
            <Text style={styles.stepsCount}>{formatNumber(stepCount)}</Text>
            <View style={styles.stepsDivider} />
            <Text style={styles.stepsGoal}>{formatNumber(stepGoal)}</Text>
          </View>
```

**Objašnjenje**:

- Desni stupac prikazuje trenutni broj koraka i dnevni cilj
- `stepsDivider` je vizualna linija koja razdvaja trenutne korake od cilja
- Koristi `formatNumber` za čitljiviji prikaz brojeva

```js
        <View style={styles.otherCards}>
          <View style={[styles.card, styles.card01]}>
            <View style={styles.cardIcon}>
              <SvgCal width="23.44" height="30" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Kalorije</Text>
              <Text style={styles.cardValue}>
                <Text style={styles.cardValueBold}>{Math.round(caloriesBurned)}</Text> kcal
              </Text>
            </View>
          </View>
```

**Objašnjenje**:

- `styles.card` je osnovni stil, `styles.card01` dodaje specifične stilove
- `Math.round` zaokružuje kalorije na najbliži cijeli broj
- Koristi ugniježđene `Text` komponente za različito stiliziranje

```js
          <View style={[styles.card, styles.card02]}>
            <View style={styles.cardIcon}>
              <SvgDist width="21" height="30" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Udaljenost</Text>
                <Text style={styles.cardValue}>
                  <Text style={styles.cardValueBold}>{(distance || 0).toFixed(2)}</Text> km
                </Text>
            </View>
          </View>
        </View>
```

**Objašnjenje**:

- Druga kartica prikazuje prijeđenu udaljenost
- `(distance || 0)` osigurava da se prikaže 0 ako je distance null/undefined
- `toFixed(2)` prikazuje udaljenost s točno 2 decimale

```js
        <View style={[styles.flowerCard, { height: dimensions.screen.height * 0.25 }]}>
          <View style={styles.flowerContent}>
            <Text style={styles.flowerTitle}>
              Napredak cvijeta
            </Text>
            <View style={styles.flowerProgress}>
              {activeFlower ? (
                <>
                  <Text style={styles.flowerProgressText}>
                    {`${growthProgress}/${activeFlower.stepsToGrow} koraka`}
                  </Text>
                  <View style={styles.flowerProgressBar}>
                    <View
                      style={{ 
                        width: `${Math.min((growthProgress / activeFlower.stepsToGrow) * 100, 100)}%`,
                        height: '100%',
                        backgroundColor: 'white',
                        borderRadius: 12,
                      }}
                    />
                  </View>
                </>
              ) : (
                <View>
                  <Text style={styles.noFlowerText}>
                    Nemate aktivan cvijet. Posjetite trgovinu da kupite svoj prvi cvijet!
                  </Text>
                </View>
              )}
            </View>
          </View>
```

**Objašnjenje**:

- Visina kartice je 25% visine ekrana (`dimensions.screen.height * 0.25`)
- Uvjetno renderiranje: prikazuje napredak ako ima aktivni cvijet, inače poruku
- Traka napretka se dinamički mijenja prema postotku rasta
- `Math.min(..., 100)` osigurava da širina ne prelazi 100%

```js
          {activeFlower ? (
            <View style={styles.flowerImage}>
              <Image 
                source={activeFlower.image} 
                style={{
                  width: '80%',
                  height: '80%',
                  opacity: 0.3 + (growthProgress / activeFlower.stepsToGrow) * 0.7,
                  resizeMode: 'contain',
                }}
              />
            </View>
          ) : (
            <View style={styles.flowerImage}>
              <TouchableOpacity 
                style={styles.shopButton}
                onPress={() => navigation.navigate('Shop')}
              >
                <Text style={styles.shopButtonText}>Trgovina</Text>
                <SvgShop width={20} height={20} />
              </TouchableOpacity>
            </View>
          )}
```

**Objašnjenje**:

- Ako ima aktivni cvijet, prikazuje sliku cvijeta
- `opacity: 0.3 + (progress/total) * 0.7` čini cvijet prozirnim na početku i sve jasnijim kako raste
- Ako nema cvijeta, prikazuje gumb za odlazak u trgovinu
- `navigation.navigate('Shop')` otvara zaslon trgovine


## 6. GardenScreen.js - Upravljanje virtualnim vrtom

### Svrha komponente

GardenScreen omogućuje uzgoj cvijeća na temelju broja koraka, pregled kolekcije uzgojenog cvijeća i odabir aktivnog cvijeta.

### Ključne funkcionalnosti objašnjene liniju po liniju

```js
  const { stepCount, coins } = useStats();
  
  const [activeFlower, setActiveFlower] = useState(null);
  const [grownFlowers, setGrownFlowers] = useState([]);
  const [growthProgress, setGrowthProgress] = useState(0);
  const [purchasedFlowers, setPurchasedFlowers] = useState([]);
  const [flowerProgressMap, setFlowerProgressMap] = useState({});
```

**Objašnjenje**:

- `activeFlower` čuva podatke o cvijetu koji se trenutno uzgaja
- `grownFlowers` je lista svih potpuno uzgojenih cvjetova
- `growthProgress` prati napredak trenutnog cvijeta u koracima
- `purchasedFlowers` lista svih kupljenih cvjetova iz trgovine
- `flowerProgressMap` mapa koja čuva napredak za svaki individualni cvijet

```js
  const [showCollection, setShowCollection] = useState(false);
  const [showFlowerSelector, setShowFlowerSelector] = useState(false);
```

**Objašnjenje**:

- `showCollection` kontrolira prikazuje li se kolekcija ili uzgoj
- `showFlowerSelector` kontrolira vidljivost modalnog prozora za odabir cvijeta

```js
  useFocusEffect(
    React.useCallback(() => {
      const checkDayChange = async () => {
        const today = new Date().toISOString().split('T')[^0];
        const lastSavedDate = await AsyncStorage.getItem('lastSavedDate');
        
        if (lastSavedDate !== today) {
          await AsyncStorage.setItem('lastTrackedStepCount', '0');
        }
        
        loadGardenData();
        loadPurchasedFlowers();
      };
      
      checkDayChange();
      
      return () => {};
    }, [])
  );
```

**Objašnjenje**:

- `useFocusEffect` se pokreće svaki put kada se zaslon fokusira
- Provjerava je li nastupio novi dan uspoređujući datume
- Ako je novi dan, resetira `lastTrackedStepCount` na 0
- Osvježava podatke o vrtu i kupljenim cvjetovima

```js
  const loadPurchasedFlowers = async () => {
    try {
      const purchases = await AsyncStorage.getItem('shopPurchases');
      if (purchases) {
        const purchasedItems = JSON.parse(purchases);
        
        const flowerCounts = {};
        purchasedItems.forEach(item => {
          if (flowerCounts[item.id]) {
            flowerCounts[item.id]++;
          } else {
            flowerCounts[item.id] = 1;
          }
        });
```

**Objašnjenje**:

- Dohvaća listu kupnji iz trgovine
- `flowerCounts` broji koliko je primjeraka svakog tipa cvijeta kupljeno
- Ovo omogućuje prikaz "Ruža (2)" ako je korisnik kupio 2 ruže

```js
        const flowersWithCounts = [];
        
        purchasedItems.forEach((purchaseItem, index) => {
          const flowerType = FLOWER_TYPES.find(f => f.id === purchaseItem.id);
          
          if (flowerType) {
            const sameTypeItems = purchasedItems.filter(
              (p, i) => p.id === purchaseItem.id && i <= index
            );
            const instanceNumber = sameTypeItems.length;
            
            const instanceId = `${purchaseItem.id}_instance${instanceNumber - 1}`;
```

**Objašnjenje**:

- Za svaku kupnju stvara jedinstveni `instanceId`
- `sameTypeItems.filter` broji koliko je istih cvjetova kupljeno do trenutnog indeksa
- `instanceId` omogućuje razlikovanje između "ruža_instance0" i "ruža_instance1"

```js
            const flowerWithInstance = {
              ...flowerType,
              instanceId: instanceId,
              instanceNumber: instanceNumber,
              purchaseId: purchaseItem.purchaseId,
              count: flowerCounts[purchaseItem.id]
            };
            
            flowersWithCounts.push(flowerWithInstance);
          }
        });
        
        setPurchasedFlowers(flowersWithCounts);
```

**Objašnjenje**:

- `...flowerType` kopira sve osnovne podatke cvijeta (ime, sliku, opis)
- Dodaje dodatne podatke o instanci, broju primjeraka i ID-u kupnje
- Stvara novi objekt za svaki kupljeni cvijet s jedinstvenim podacima

```js
  useEffect(() => {
    if (!activeFlower) return;
    
    const updateGrowth = async () => {
      try {
        const lastStepCount = parseInt(await AsyncStorage.getItem('lastTrackedStepCount') || '0', 10);
        
        if (stepCount <= lastStepCount) {
          return;
        }
        
        const stepsSinceLastUpdate = stepCount - lastStepCount;
        
        await AsyncStorage.setItem('lastTrackedStepCount', stepCount.toString());
```

**Objašnjenje**:

- Pokreće se svaki put kada se promijeni `stepCount` ili `activeFlower`
- `lastTrackedStepCount` pamti do kojeg koraka je napredak ažuriran
- Izračunava koliko je novih koraka dodano od zadnjeg ažuriranja
- Odmah ažurira `lastTrackedStepCount` da sprječava dvostruko brojanje

```js
        let growthMultiplier = 1;
        
        if (activeFlower.rarity === 'legendary') {
          growthMultiplier = 2.0;
        } else if (activeFlower.rarity === 'rare') {
          growthMultiplier = 1.5;
        } else if (activeFlower.rarity === 'uncommon') {
          growthMultiplier = 1.2;
        }
        
        const effectiveSteps = Math.round(stepsSinceLastUpdate * growthMultiplier);
```

**Objašnjenje**:

- Implementira game mechanics gdje rijetko cvijeće raste brže
- Legendarno cvijeće raste dvostruko brže od običnog
- `Math.round` zaokružuje na cijeli broj koraka

```js
        const currentProgress = flowerProgressMap[activeFlower.instanceId] || 0;
        
        const newProgress = currentProgress + effectiveSteps;
        
        setGrowthProgress(newProgress);
        
        const updatedMap = {...flowerProgressMap, [activeFlower.instanceId]: newProgress};
        setFlowerProgressMap(updatedMap);
        await AsyncStorage.setItem('flowerProgressMap', JSON.stringify(updatedMap));
```

**Objašnjenje**:

- Dohvaća trenutni napredak za specifični cvijet koristeći `instanceId`
- Dodaje nove korake na postojeći napredak
- Ažurira mapu napretka i sprema je u trajnu memoriju
- `...flowerProgressMap` kopira postojeću mapu prije dodavanja nove vrijednosti

```js
        if (newProgress >= activeFlower.stepsToGrow) {
          const newGrownFlower = {
            ...activeFlower,
            grownAt: Date.now()
          };
          
          const storedGrownFlowers = await AsyncStorage.getItem('grownFlowers');
          const currentGrownFlowers = storedGrownFlowers ? JSON.parse(storedGrownFlowers) : [];
          currentGrownFlowers.push(newGrownFlower);
          
          await AsyncStorage.setItem('grownFlowers', JSON.stringify(currentGrownFlowers));
          setGrownFlowers(currentGrownFlowers);
```

**Objašnjenje**:

- Provjerava je li cvijet potpuno izrastao
- Dodaje `grownAt` timestamp kada je cvijet završen
- Dohvaća postojeću listu uzgojenih cvjetova i dodaje novi
- Sprema ažuriranu listu u trajnu memoriju

```js
          const resetMap = {...updatedMap, [activeFlower.instanceId]: 0};
          setFlowerProgressMap(resetMap);
          setGrowthProgress(0);
          await AsyncStorage.setItem('flowerProgressMap', JSON.stringify(resetMap));
          await AsyncStorage.setItem('lastTrackedStepCount', stepCount.toString());
          
          Alert.alert(
            'Cvijet je izrastao!',
            `Vaš ${activeFlower.name} je potpuno izraslao i dodan u vašu kolekciju!`,
            [{ text: 'Odlično!', style: 'default' }]
          );
```

**Objašnjenje**:

- Resetira napredak za trenutni cvijet na 0 (spreman za ponovni uzgoj)
- Prikazuje obavijest korisniku da je cvijet završen
- `Alert.alert` je native dijalog koji prekida korisnikov workflow

```js
  const selectFlower = async (flower) => {
    try {
      setActiveFlower(flower);
      await AsyncStorage.setItem('activeFlower', JSON.stringify(flower));
      
      await AsyncStorage.setItem('lastTrackedStepCount', stepCount.toString());
      
      if (flower.instanceId && flowerProgressMap[flower.instanceId] !== undefined) {
        setGrowthProgress(flowerProgressMap[flower.instanceId]);
      } else {
        setGrowthProgress(0);
        const updatedMap = {...flowerProgressMap, [flower.instanceId]: 0};
        setFlowerProgressMap(updatedMap);
        await AsyncStorage.setItem('flowerProgressMap', JSON.stringify(updatedMap));
      }
      
      setShowFlowerSelector(false);
    } catch (error) {
      console.error('Greška pri odabiru cvijeta:', error);
    }
  };
```

**Objašnjenje**:

- Postavlja odabrani cvijet kao aktivan
- Resetira praćenje koraka na trenutnu vrijednost
- Učitava postojeći napredak za odabrani cvijet ili postavlja na 0
- Zatvara modalni prozor za odabir

```js
  const renderFlowerItem = ({ item }) => (
    <View style={styles.flowerItem}>
      <Image source={item.image} style={styles.flowerImage} />
      <Text style={styles.flowerName}>{item.name}</Text>
      <Text style={styles.flowerDate}>
        {new Date(item.grownAt).toLocaleDateString()}
      </Text>
    </View>
  );
```

**Objašnjenje**:

- Funkcija za renderiranje jednog cvijeta u kolekciji
- `new Date(item.grownAt).toLocaleDateString()` formatira timestamp u čitljiv datum
- Prikazuje sliku, ime i datum kada je cvijet uzgojen

```js
        <View style={styles.toggleContainer}>
          <TouchableOpacity 
            style={[styles.toggleButton, !showCollection && styles.activeToggle]}
            onPress={() => setShowCollection(false)}
          >
            <Text style={styles.toggleText}>Uzgoj</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleButton, showCollection && styles.activeToggle]}
            onPress={() => setShowCollection(true)}
          >
            <Text style={styles.toggleText}>Kolekcija</Text>
          </TouchableOpacity>
        </View>
```

**Objašnjenje**:

- Toggle gumbovi za prebacivanje između prikaza uzgoja i kolekcije
- `[styles.toggleButton, condition && styles.activeToggle]` kombinira stilove
- `activeToggle` stil se primjenjuje samo na aktivni gumb

```js
                  <View style={styles.progressBarContainer}>
                    <View 
                      style={[
                        styles.progressBar, 
                        { 
                          width: `${Math.min((growthProgress / activeFlower.stepsToGrow) * 100, 100)}%`
                        }
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {growthProgress}/{activeFlower.stepsToGrow} koraka 
                    ({Math.round((growthProgress / activeFlower.stepsToGrow) * 100)}%)
                  </Text>
```

**Objašnjenje**:

- Prikazuje traku napretka koja se dinamički mijenja
- Širina trake je postotak ostvarenog napretka
- `Math.min(..., 100)` osigurava da širina ne prelazi 100%
- Tekst prikazuje trenutne korake, potrebne korake i postotak


## 7. ShopScreen.js - Trgovina cvjetova

### Svrha komponente

ShopScreen omogućuje kupovinu cvijeća za novčiće zarađene hodanjem. Sadrži filtere po rijetkosti i prikazuje posjedovane cvjetove.

### Ključne funkcionalnosti objašnjene

```js
  const { coins, setCoins, updateLastTrackedStepCount } = useStats();
  const [shopItems, setShopItems] = useState([]);
  const [purchasedItems, setPurchasedItems] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
```

**Objašnjenje**:

- `coins` i `setCoins` za upravljanje novčićima korisnika
- `shopItems` sadrži sve dostupne cvjetove u trgovini
- `purchasedItems` čuva povijest kupnji
- `selectedFilter` kontrolira koji tip cvjetova se prikazuje

```js
  const getPriceByRarity = (rarity) => {
    switch(rarity) {
      case 'common': return 50;
      case 'uncommon': return 1000;
      case 'rare': return 2500;
      case 'legendary': return 5000;
      default: return 500;
    }
  };
```

**Objašnjenje**:

- Određuje cijenu na temelju rijetkosti cvijeta
- Obični cvjetovi koštaju 50 novčića, legendarni 5000
- `default` slučaj osigurava neku cijenu za neočekivane rijetkosti

```js
  const loadShopData = async () => {
    try {
      const storedPurchases = await AsyncStorage.getItem('shopPurchases');
      if (storedPurchases) {
        setPurchasedItems(JSON.parse(storedPurchases));
      }
      
      const items = FLOWER_TYPES.map(flower => ({
        id: flower.id,
        name: flower.name,
        image: flower.image,
        price: getPriceByRarity(flower.rarity),
        rarity: flower.rarity,
        description: flower.description || 'Prekrasan cvijet'
      }));
      
      setShopItems(items);
    } catch (error) {
      console.error('Greška pri učitavanju podataka trgovine:', error);
    }
  };
```

**Objašnjenje**:

- Učitava povijest kupnji iz AsyncStorage
- `FLOWER_TYPES.map` transformira osnovne podatke cvjetova u stavke trgovine
- Dodaje cijenu na temelju rijetkosti i zadani opis ako ne postoji

```js
  const handlePurchase = async (item) => {
    if (coins < item.price) {
      Alert.alert('Nedovoljno novčića', 'Hodajte više kako biste zaradili novčiće!');
      return;
    }

    setCoins(coins - item.price);
    await AsyncStorage.setItem('coins', (coins - item.price).toString());

    const purchaseId = `${item.id}_${Date.now()}`;
    
    const newPurchases = [...purchasedItems, { 
      id: item.id,
      purchaseId: purchaseId,
      purchasedAt: new Date().toISOString() 
    }];
    setPurchasedItems(newPurchases);
    await AsyncStorage.setItem('shopPurchases', JSON.stringify(newPurchases));
```

**Objašnjenje**:

- Prva provjera osigurava da korisnik ima dovoljno novčića
- Oduzima cijenu od trenutnih novčića i sprema novu vrijednost
- `Date.now()` u `purchaseId` osigurava jedinstvenost svake kupnje
- Dodaje novu kupnju u listu i sprema u trajnu memoriju

```js
    const isFirstPurchase = purchasedItems.length === 0;

    if (isFirstPurchase) {
      const purchasedFlower = FLOWER_TYPES.find(f => f.id === item.id);
      if (purchasedFlower) {
        const flowerWithInstance = {
          ...purchasedFlower,
          instanceId: `${item.id}_instance0`,
          instanceNumber: 1
        };
        
        const flowerProgressMap = await AsyncStorage.getItem('flowerProgressMap');
        const progressMap = flowerProgressMap ? JSON.parse(flowerProgressMap) : {};
        
        progressMap[flowerWithInstance.instanceId] = 0;
        
        await AsyncStorage.setItem('flowerProgressMap', JSON.stringify(progressMap));
        await AsyncStorage.setItem('activeFlower', JSON.stringify(flowerWithInstance));
        await AsyncStorage.setItem('growthProgress', '0');
        await updateLastTrackedStepCount();
```

**Objašnjenje**:

- Za prvi kupljeni cvijet automatski ga postavlja kao aktivan
- Stvara `instanceId` s oznakom "instance0" za prvi primjerak
- Inicijalizira napredak na 0 u mapi napretka
- Resetira praćenje koraka za novi cvijet

```js
        Alert.alert(
          'Prvi cvijet kupljen!', 
          `Kupili ste ${item.name}. Postavljen je kao vaš aktivni cvijet. Vratite se u vrt da vidite kako raste!`,
          [
            { 
              text: 'U redu', 
              onPress: () => navigation.navigate('Garden', { 
                newFlower: true,
                flowerId: item.id,
                purchaseId: purchaseId
              })
            }
          ]
        );
```

**Objašnjenje**:

- Prikazuje informativnu poruku o prvoj kupnji
- Preusmjerava korisnika u vrt s parametrima o novom cvijetu
- Parametri se koriste u GardenScreen-u za osvježavanje podataka

```js
    } else {
      Alert.alert(
        'Kupnja uspješna', 
        `Kupili ste ${item.name}. Želite li ga postaviti kao svoj aktivni cvijet?`,
        [
          { 
            text: 'Da', 
            onPress: async () => {
              const purchasedFlower = FLOWER_TYPES.find(f => f.id === item.id);
              if (purchasedFlower) {
                const instanceIdx = purchasedItems.filter(p => p.id === item.id).length - 1;
                const flowerWithInstance = {
                  ...purchasedFlower,
                  instanceId: `${item.id}_instance${instanceIdx}`,
                  instanceNumber: instanceIdx + 1
                };
                
                await AsyncStorage.setItem('activeFlower', JSON.stringify(flowerWithInstance));
                await AsyncStorage.setItem('growthProgress', '0');
                await AsyncStorage.setItem('lastTrackedStepCount', stepCount.toString());              
                navigation.navigate('Garden', { 
                  newFlower: true,
                  flowerId: item.id,
                  purchaseId: purchaseId,
                  makeActive: true
                });
              }
            } 
          },
          { 
            text: 'Ne', 
            style: 'cancel',
            onPress: () => navigation.navigate('Garden', { 
              newFlower: true,
              flowerId: item.id,
              purchaseId: purchaseId,
              makeActive: false
            })
          }
        ]
      );
    }
```

**Objašnjenje**:

- Za ponovne kupnje pita korisnika želi li novi cvijet postaviti kao aktivan
- `instanceIdx` broji koliko je istih cvjetova već kupljeno
- Stvara novi `instanceId` s odgovarajućim brojem instance
- Ovisno o odabiru, navigira u vrt s odgovarajućim parametrima

```js
  const getFilteredItems = () => {
    if (selectedFilter === 'all') return shopItems;
    return shopItems.filter(item => item.rarity === selectedFilter);
  };
```

**Objašnjenje**:

- Filtrira cvjetove prema odabranoj rijetkosti
- Ako je odabrano 'all', vraća sve cvjetove
- Inače filtrira prema specifičnoj rijetkosti

```js
  const getRarityColor = (rarity) => {
    switch(rarity) {
      case 'common': return '#8BC34A';
      case 'uncommon': return '#2196F3';
      case 'rare': return '#9C27B0';
      case 'legendary': return '#FFD700';
      default: return '#8BC34A';
    }
  };
```

**Objašnjenje**:

- Vraća boju prema rijetkosti cvijeta
- Obični = zelena, neuobičajeni = plava, rijetki = ljubičasta, legendarni = zlatna
- Koristi se za vizualno razlikovanje u sučelju

```js
  const renderShopItem = ({ item }) => (
    <View style={styles.shopItem}>
      <View style={[styles.rarityIndicator, { backgroundColor: getRarityColor(item.rarity) }]} />
      <Image source={item.image} style={styles.itemImage} />
      <Text style={styles.itemName}>{item.name}</Text>
      <Text style={styles.itemRarity}>{translateRarity(item.rarity)}</Text>
      <Text style={styles.itemDescription}>{item.description}</Text>
      <View style={styles.priceContainer}>
        <Text style={styles.priceText}>{item.price}</Text>
        <SvgCoins width={16} height={16} />
      </View>
      
      {purchasedItems.filter(purchase => purchase.id === item.id).length > 0 && (
        <View style={styles.ownedBadge}>
          <Text style={styles.ownedText}>
            Posjedujete: {purchasedItems.filter(purchase => purchase.id === item.id).length}
          </Text>
        </View>
      )}
      
      <TouchableOpacity
        style={[
          styles.purchaseButton,
          coins < item.price ? styles.disabledButton : null
        ]}
        onPress={() => handlePurchase(item)}
        disabled={coins < item.price}
      >
        <Text style={styles.purchaseText}>
          Kupi
        </Text>
      </TouchableOpacity>
    </View>
  );
```

**Objašnjenje**:

- Renderira jedan cvijet u trgovini s kompletnim informacijama
- `rarityIndicator` je obojana traka na vrhu stavke
- Prikazuje broj posjedovanih primjeraka ako ih korisnik ima
- Gumb za kupnju je onemogućen ako korisnik nema dovoljno novčića
- `disabled` prop sprječava klikove kada nema dovoljno novčića

