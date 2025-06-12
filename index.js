import { registerRootComponent } from 'expo';
import App from './App';

/**
 * ULAZNA TOČKA APLIKACIJE
 * 
 * Ova datoteka služi kao početna točka za pokretanje React Native aplikacije.
 * Koristi Expo funkciju registerRootComponent koja:
 * 1. Registrira glavni komponentu aplikacije (App)
 * 2. Postavlja odgovarajuće okruženje ovisno o načinu pokretanja:
 *    - Unutar Expo razvojnog okruženja
 *    - Kao samostalna nativna aplikacija
 */
registerRootComponent(App);
