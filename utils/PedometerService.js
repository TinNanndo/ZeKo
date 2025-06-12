import { Accelerometer, Gyroscope } from 'expo-sensors';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * KONSTANTE
 */

/**
 * Prosječna duljina koraka u metrima
 * Koristi se za izračun ukupne prijeđene udaljenosti
 */
export const STEP_LENGTH = 0.75;

/**
 * GLAVNI SERVIS ZA PEDOMETAR
 * 
 * Koristi podatke senzora za otkrivanje koraka i praćenje aktivnosti korisnika.
 * Implementira napredne algoritme za filtriranje šuma i točniju detekciju koraka.
 */
class PedometerService {
  /**
   * Konstruktor - inicijalizira sve potrebne varijable
   */
  constructor() {
    // --- SENZORSKE PRETPLATE ---
    this.accelerometerSubscription = null;
    this.gyroscopeSubscription = null;
    
    // --- VARIJABLE ZA DETEKCIJU KORAKA ---
    this.lastAcceleration = { x: 0, y: 0, z: 0 }; // Posljednje očitanje akcelerometra
    this.lastPeakTime = 0;                       // Vrijeme zadnjeg otkrivenog koraka
    this.stepThreshold = 1.2;                    // Prag osjetljivosti za detekciju
    this.walkingState = false;                   // Je li korisnik trenutno u hodu
    this.recentMagnitudes = [];                  // Povijest magnituda za analizu
    
    // --- VARIJABLE ZA PRAĆENJE TEMPA ---
    this.rateTrackingStart = Date.now();         // Početak praćenja tempa hodanja
    this.startingSteps = 0;                      // Početni broj koraka za period
  }

  /**
   * INICIJALIZACIJA I KALIBRACIJA
   * 
   * Prilagođava algoritam specifičnostima uređaja
   */
  async initializeDevice() {
    try {
      // Dohvat informacija o uređaju za prilagodbu algoritma
      const brand = await Device.getBrandAsync();
      const model = await Device.getModelAsync();
      
      // Prilagodba praga osjetljivosti različitim modelima uređaja
      // (temelji se na empirijskim testiranjima)
      if (brand.toLowerCase().includes('samsung')) {
        this.stepThreshold = 1.1;  // Samsung uređaji trebaju nižu osjetljivost
      } else if (brand.toLowerCase().includes('xiaomi')) {
        this.stepThreshold = 0.9;  // Xiaomi uređaji trebaju višu osjetljivost
      } else if (brand.toLowerCase().includes('huawei')) {
        this.stepThreshold = 1.0;  // Huawei uređaji - srednja osjetljivost
      } else if (brand.toLowerCase().includes('oneplus')) {
        this.stepThreshold = 1.2;  // OnePlus uređaji - niža osjetljivost
      }
      
      console.log(`Primijenjena kalibracija specifična za uređaj: ${brand} ${model}, prag: ${this.stepThreshold}`);
    } catch (error) {
      console.log('Nije moguće primijeniti kalibraciju specifičnu za uređaj:', error);
    }
  }

  /**
   * UPRAVLJANJE PRAĆENJEM
   */

  /**
   * Aktivira praćenje koraka pretplatom na senzore
   * 
   * @param {Function} onStepDetected - Callback koji se poziva pri detekciji koraka
   * @param {number} currentStepCount - Trenutni broj koraka za inicijalizaciju
   */
  async subscribe(onStepDetected, currentStepCount) {
    // Inicijalizacija brojača i vremena
    this.startingSteps = currentStepCount || 0;
    this.rateTrackingStart = Date.now();
    console.log('PedometerService započinje s brojem koraka:', this.startingSteps);
    
    // Aktivacija pretplate na akcelerometar ako nije već aktivna
    if (!this.accelerometerSubscription) {
      this.accelerometerSubscription = Accelerometer.addListener(acceleration => {
        this.detectStep(acceleration, this.gyroData, onStepDetected);
      });
      // Postavljanje intervala osvježavanja (10 Hz za precizniju detekciju)
      Accelerometer.setUpdateInterval(100); 
    }
    
    // Aktivacija pretplate na žiroskop ako nije već aktivna
    if (!this.gyroscopeSubscription) {
      this.gyroscopeSubscription = Gyroscope.addListener(gyro => {
        this.gyroData = gyro;
      });
      Gyroscope.setUpdateInterval(100);
    }

    // Pokreni praćenje tempa hodanja
    this.startStepRateTracking();
  }

  /**
   * Deaktivira praćenje koraka otkazivanjem pretplata na senzore
   */
  unsubscribe() {
    // Otkaži pretplatu na akcelerometar
    if (this.accelerometerSubscription) {
      this.accelerometerSubscription.remove();
      this.accelerometerSubscription = null;
    }
    
    // Otkaži pretplatu na žiroskop
    if (this.gyroscopeSubscription) {
      this.gyroscopeSubscription.remove();
      this.gyroscopeSubscription = null;
    }

    // Zaustavi periodičko praćenje tempa hodanja
    if (this.stepRateInterval) {
      clearInterval(this.stepRateInterval);
      this.stepRateInterval = null;
    }
  }

  /**
   * Resetira sve varijable za praćenje na početne vrijednosti
   * 
   * @param {number} currentStepCount - Novi početni broj koraka
   */
  async resetTracking(currentStepCount = 0) {
    // Reset varijabli za praćenje
    this.startingSteps = currentStepCount;
    this.rateTrackingStart = Date.now();
    this.lastPeakTime = 0;
    this.walkingState = false;
    this.recentMagnitudes = [];
    
    console.log('PedometerService praćenje resetirano s brojem koraka:', currentStepCount);
    
    // Resetiranje zadnje točke praćenja za rast cvijeta
    await AsyncStorage.setItem('lastTrackedStepCount', '0');
  }

  /**
   * Provjera je li došlo do promjene dana za resetiranje statistike
   * 
   * @returns {boolean} - Indikator promjene dana
   */
  async checkForDayChange() {
    try {
      const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
      const lastSavedDate = await AsyncStorage.getItem('lastSavedDate');
      
      // Ako je danas različit od zadnjeg spremljenog datuma
      if (lastSavedDate && lastSavedDate !== today) {
        console.log('Otkrivena promjena dana u PedometerService');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Greška prilikom provjere promjene dana u PedometerService:', error);
      return false;
    }
  }

  /**
   * ALGORITMI ZA DETEKCIJU I ANALIZU
   */

  /**
   * Glavni algoritam za detekciju koraka
   * 
   * Koristi naprednu obradu senzorskih podataka za preciznu detekciju
   * i filtriranje lažnih očitanja
   * 
   * @param {Object} acceleration - Podaci o akceleraciji iz senzora
   * @param {Object} gyroData - Podaci o rotaciji iz žiroskopa
   * @param {Function} onStepDetected - Callback za detekciju koraka
   */
  detectStep(acceleration, gyroData, onStepDetected) {
    // --- KORAK 1: FILTRIRANJE PODATAKA ---
    
    // Primjena niskopropusnog filtera za uklanjanje šumova
    const alpha = 0.25; // Faktor glađenja (viši = sporije promjene)
    const filteredAcceleration = {
      x: alpha * this.lastAcceleration.x + (1 - alpha) * acceleration.x,
      y: alpha * this.lastAcceleration.y + (1 - alpha) * acceleration.y,
      z: alpha * this.lastAcceleration.z + (1 - alpha) * acceleration.z,
    };

    // --- KORAK 2: IZRAČUN PROMJENA I MAGNITUDE ---
    
    // Izračun promjena po svakoj osi
    const deltaX = Math.abs(filteredAcceleration.x - this.lastAcceleration.x);
    const deltaY = Math.abs(filteredAcceleration.y - this.lastAcceleration.y);
    const deltaZ = Math.abs(filteredAcceleration.z - this.lastAcceleration.z);

    // Ukupna magnituda promjene (vektorska suma)
    const magnitude = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);

    // --- KORAK 3: ANALIZA OBRASCA KRETANJA ---
    
    // Čuvanje povijesti za analizu obrasca kretanja (zadnjih 20 očitanja)
    this.recentMagnitudes = [...this.recentMagnitudes, magnitude].slice(-20);
    
    // Izračun prosječne magnitude za detekciju stanja hodanja
    const avgMagnitude = this.recentMagnitudes.reduce((sum, val) => sum + val, 0) / 
                        this.recentMagnitudes.length;
    
    // Logika za detekciju stanja hodanja (kontinuirano kretanje vs. mirovanje)
    const isWalking = avgMagnitude > 0.4;
    if (isWalking !== this.walkingState) {
      this.walkingState = isWalking;
      console.log(isWalking ? "Hod otkriven" : "Hod zaustavljen");
    }
    
    // --- KORAK 4: ADAPTIVNI PRAG DETEKCIJE ---
    
    // Dinamičko prilagođavanje praga na temelju nedavne aktivnosti
    if (this.recentMagnitudes.length > 10) {
      // Izračun adaptivnog praga s ograničenjima donje i gornje granice
      const dynamicThreshold = Math.max(0.6, Math.min(1.3, avgMagnitude * 1.4));
      
      // Promijeni prag samo ako je značajna razlika
      if (Math.abs(dynamicThreshold - this.stepThreshold) > 0.15) {
        this.stepThreshold = dynamicThreshold;
      }
    }

    // --- KORAK 5: DETEKCIJA KORAKA ---
    
    // Provjera vremenskog razmaka između koraka (za eliminaciju lažnih očitanja)
    const currentTime = Date.now();
    const timeSinceLastPeak = currentTime - this.lastPeakTime;

    // Prilagodba osjetljivosti na temelju stanja hodanja
    const effectiveThreshold = this.walkingState ? 
      this.stepThreshold : 
      Math.min(1.8, this.stepThreshold * 1.8); // Viši prag kada korisnik vjerojatno miruje
    
    // Detekcija koraka kad je magnituda iznad praga i prošlo dovoljno vremena od zadnjeg koraka
    if (magnitude > effectiveThreshold && timeSinceLastPeak > 350) {
      onStepDetected && onStepDetected();
      this.lastPeakTime = currentTime;
    }

    // Spremi trenutno očitanje za sljedeću iteraciju
    this.lastAcceleration = filteredAcceleration;
  }

  /**
   * PRAĆENJE TEMPA HODANJA
   */

  /**
   * Pokreće periodičko praćenje tempa hodanja
   */
  startStepRateTracking() {
    // Postavi interval koji će svakih 60 sekundi ažurirati tempo hodanja
    this.stepRateInterval = setInterval(() => {
      this.calculateStepRate();
    }, 60000); // Interval: 1 minuta
  }

  /**
   * Izračunava i sprema prosječni tempo hodanja
   * 
   * Ova vrijednost se koristi za procjenu koraka u pozadini
   * kada aplikacija nije aktivna
   */
  async calculateStepRate() {
    try {
      // Dohvat trenutnog broja koraka
      const storedStepCount = await AsyncStorage.getItem('stepCount');
      const currentStepCount = parseInt(storedStepCount || '0', 10);
      
      // Izračun proteklog vremena u minutama
      const now = Date.now();
      const elapsedMinutes = (now - this.rateTrackingStart) / (1000 * 60);
      
      // Analiza i spremanje tempa nakon 5 minuta mjerenja
      if (elapsedMinutes >= 5) {
        // Izračun koraka napravljenih u ovom periodu
        const stepsTaken = currentStepCount - this.startingSteps;
        const stepsPerMinute = stepsTaken / elapsedMinutes;
        
        // Spremi tempo samo ako je korisnik stvarno hodao (više od 3 koraka/min)
        if (stepsPerMinute > 3) {
          AsyncStorage.setItem('recentStepRate', stepsPerMinute.toString());
          console.log(`Zabilježena stopa koraka: ${stepsPerMinute.toFixed(1)} koraka/minuti`);
        }
        
        // Priprema za sljedeći period mjerenja
        this.rateTrackingStart = now;
        this.startingSteps = currentStepCount;
      }
    } catch (error) {
      console.error('Greška prilikom izračuna stope koraka:', error);
    }
  }

  /**
   * POMOĆNE FUNKCIJE ZA IZRAČUNE
   */

  /**
   * Izračunava potrošene kalorije na temelju koraka i težine
   * 
   * @param {number} steps - Broj koraka
   * @param {number} weight - Težina korisnika u kilogramima
   * @returns {number} - Potrošene kalorije
   */
  calculateCaloriesBurned(steps, weight) {
    // Pojednostavljeni faktor potrošnje po kilogramu težine i koraku
    const caloriesPerKgPerStep = 0.0005;
    return weight * caloriesPerKgPerStep * steps;
  }

  /**
   * Izračunava prijeđenu udaljenost na temelju broja koraka
   * 
   * @param {number} steps - Broj koraka
   * @returns {number} - Prijeđena udaljenost u kilometrima
   */
  calculateDistance(steps) {
    // Validacija ulaznih podataka
    if (!steps || isNaN(steps) || steps < 0) {
      return 0;
    }
    
    // Osiguravanje da su koraci numerička vrijednost
    const numSteps = Number(steps);
    
    // Izračun udaljenosti i formatiranje na 2 decimale
    return parseFloat(((numSteps * STEP_LENGTH) / 1000).toFixed(2));
  }
}

// Stvaranje jedne globalne instance servisa
const pedometerService = new PedometerService();

// Izvoz instance kao zadane
export default pedometerService;