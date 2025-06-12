/**
 * UPRAVLJANJE GLOBALNIM STANJEM APLIKACIJE
 * 
 * Ovo je jednostavan modul za upravljanje globalnim stanjem bez Context API-a.
 * Omogućuje pristup i ažuriranje važnih stanja (koraci, novčići) iz bilo kojeg
 * dijela aplikacije bez potrebe za prosljeđivanjem props-ova kroz hijerarhiju.
 * 
 * NAČIN RADA:
 * 1. Komponente koje trebaju pristup globalnom stanju pozivaju odgovarajuće setter funkcije
 * 2. Ove funkcije interno koriste React.useState settere koje su registrirane pri inicijalizaciji
 * 3. Time se postiže centralizirano upravljanje bez potrebe za složenim kontekstom
 */

// --- UNUTARNJE VARIJABLE MODULA ---

/**
 * Globalne varijable koje pohranjuju reference na React setter funkcije
 * Inicijalno su null i postavljaju se tijekom pokretanja aplikacije
 */
let stepCountSetter = null;  // Setter za broj koraka
let coinsSetter = null;      // Setter za broj novčića

// --- FUNKCIJE ZA REGISTRACIJU SETTERA ---

/**
 * Registrira React.useState setter funkciju za broj koraka
 * Poziva se jednom pri inicijalizaciji glavne komponente
 * 
 * @param {Function} setter - useState setter funkcija za broj koraka
 */
export const setStepCountSetter = (setter) => {
  stepCountSetter = setter;
};

/**
 * Registrira React.useState setter funkciju za novčiće
 * Poziva se jednom pri inicijalizaciji glavne komponente
 * 
 * @param {Function} setter - useState setter funkcija za novčiće
 */
export const setCoinsSetter = (setter) => {
  coinsSetter = setter;
};

// --- FUNKCIJE ZA AŽURIRANJE STANJA ---

/**
 * Ažurira broj koraka u cijeloj aplikaciji
 * Može se pozivati iz bilo koje komponente bez potrebe za props
 * 
 * @param {number} count - Novi broj koraka za postavljanje
 */
export const setStepCount = (count) => {
  if (stepCountSetter) {
    stepCountSetter(count);
  }
};

/**
 * Ažurira broj novčića u cijeloj aplikaciji
 * Može se pozivati iz bilo koje komponente bez potrebe za props
 * 
 * @param {number} coins - Novi broj novčića za postavljanje
 */
export const setCoins = (coins) => {
  if (coinsSetter) {
    coinsSetter(coins);
  }
};

// Izvoz svih funkcija kao zadani objekt za lakši pristup
export default {
  setStepCount,
  setCoins,
  setStepCountSetter,
  setCoinsSetter,
};