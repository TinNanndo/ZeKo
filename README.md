# ZeKo (ZeleniKorak)

**Aplikacija za praćenje koraka i uzgoj virtualnog cvijeća**

---

## Opis aplikacije

ZeKo je mobilna aplikacija za praćenje fizičke aktivnosti, koja koristeći senzore uređaja broji korake, prijeđenu udaljenost i potrošene kalorije. Korisnici zarađuju virtualne novčiće hodanjem, a novčiće mogu potrošiti u trgovini na kupovinu različitih vrsta cvjetova. Svaki kupljeni cvijet može se uzgajati dodatnim hodanjem, što aplikaciju čini zabavnom i motivirajućom.

---

## Tehnički stack

- **Platforma:** React Native (Expo)
- **Navigacija:** React Navigation
- **Pohrana podataka:** AsyncStorage
- **Upravljanje stanjem:** React Context API
- **Dodatni alati:** Expo Sensors (akcelerometar, žiroskop), Background Fetch

---

## Struktura projekta

```
├── App.js
├── app.json
├── components
│   └── LoadingScreen.js
├── context
│   ├── StatsContext.js
│   ├── flowerData.js
│   └── flowers.json
├── index.js
├── navigation
│   └── TabNavigator.js
├── screens
│   ├── GardenScreen.js
│   ├── HomeScreen.js
│   ├── LoginScreen.js
│   ├── ProfileScreen.js
│   ├── ShopScreen.js
│   └── StatsScreen.js
└── utils
    ├── BackgroundTasks.js
    ├── CircularProgress.js
    ├── PedometerService.js
    ├── RectProgress.js
    └── stateManagement.js
```


---

## Pokretanje aplikacije

1. **Instalirajte potrebne alate:**
   - Node.js (verzija 14 ili novija)
   - Expo CLI (`npm install -g expo-cli`)
   - Expo Go aplikacija na mobitelu (za testiranje)
2. **Klonirajte repozitorij:**

```bash
git clone https://github.com/TinNanndo/ZeKo.git
cd zeko-app
```

3. **Instalirajte dependencies:**

```bash
npm install
# ili
yarn install
```

4. **Pokrenite aplikaciju:**

```bash
npx expo start
# ili
yarn start
```

5. **Skenirajte QR kod s Expo Go aplikacijom ili koristite simulator.**

---

## Ključne funkcionalnosti

- **Praćenje koraka:** Automatsko brojanje koraka kroz senzore uređaja.
- **Virtualni novčići:** Zarada novčića na temelju hodanja.
- **Trgovina:** Kupnja različitih vrsta cvjetova za novčiće.
- **Uzgoj cvijeća:** Aktivni cvijet raste kako korisnik hoda.
- **Kolekcija cvjetova:** Pregled uzgojenih i kupljenih cvjetova.
- **Statistika:** Prikaz dnevne i tjedne aktivnosti, prijeđene udaljenosti i potrošenih kalorija.
- **Profil:** Uređivanje korisničkih podataka i resetiranje napretka.

---

## Arhitektura i logika

- **StatsContext:** Centralizirano upravljanje svim podacima o korisničkoj aktivnosti i cvijeću.
- **PedometerService:** Detekcija koraka kroz akcelerometar i žiroskop, s kalibracijom prema vrsti uređaja.
- **AsyncStorage:** Trajna pohrana svih podataka (korisnički podaci, statistika, cvijeće).
- **Bottom Tab Navigator:** Glavna navigacija kroz aplikaciju (Početna, Vrt, Statistika, Profil).
- **Stack Navigator:** Prijelaz između početnog učitavanja, prijave i glavnih zaslona.

---

## Sustav cvjetova

- **Različite vrste:** Cvjetovi različitih rijetkosti (obični, neuobičajeni, rijetki, legendarni).
- **Uzgoj:** Svaki cvijet zahtijeva određeni broj koraka za potpuni rast.
- **Kolekcija:** Pregled svih uzgojenih cvjetova s datumom uzgoja.

---

## Dodavanje novih funkcionalnosti

1. **Novi zaslon:**
   - Dodajte komponentu u `screens/`.
   - Dodajte je u navigaciju (`TabNavigator.js` ili Stack Navigator).
   - Dodajte ikonu u `assets/icons/`.
2. **Novi tip cvijeta:**
   - Dodajte definiciju u `flowers.json`.
   - Dodajte sliku u `assets/flowers/`.
   - Ažurirajte `flowerData.js` za učitavanje slike.
3. **Nova statistika:**
   - Dodajte polje u `StatsContext`.
   - Implementirajte izračun i prikaz na odgovarajućem zaslonu.

---

## Deployment

### **Android**

1. Konfigurirajte `eas.json` za build.
2. Pokrenite `npx expo build:android`.
3. Uploadajte APK na Google Play Console.
4. Testirajte kroz internal testing.

### **iOS**

1. Konfigurirajte Apple Developer account.
2. Pokrenite `npx expo build:ios`.
3. Uploadajte na App Store Connect.
4. Prođite kroz review proces.

---

## Korisni resursi

- [ZeKo dokumentacija](dokumentacija_ZeKo.md)
- [Expo dokumentacija](https://docs.expo.dev/)
- [React Native dokumentacija](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/)

## License
This project is semi open source. Source code is visible for learning purposes only.  
For usage rights, please contact the author at tin.jovanovic003@gmail.com .
