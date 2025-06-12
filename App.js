/**
 * GLAVNI ULAZ APLIKACIJE
 * 
 * Ova datoteka predstavlja korijenske komponente aplikacije i upravlja:
 * 1. Navigacijskom strukturom
 * 2. Globalnim pružateljima konteksta
 * 3. Konfiguracijom statusne trake
 * 4. Sigurnosnim područjima za različite uređaje
 */

// --- OSNOVNE BIBLIOTEKE ---
import 'react-native-gesture-handler'; // Podrška za geste i navigaciju
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// --- NAVIGACIJA ---
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import TabNavigator from './navigation/TabNavigator';

// --- ZASLONI ---
import LoginScreen from './screens/LoginScreen';
import ShopScreen from './screens/ShopScreen';
import LoadingScreen from './components/LoadingScreen';

// --- UPRAVLJANJE STANJEM ---
import { StatsProvider } from './context/StatsContext';

// Inicijalizacija Stack navigatora za glavnu navigaciju
const Stack = createStackNavigator();

/**
 * Glavna komponenta aplikacije
 * 
 * Definira cjelokupnu strukturu aplikacije uključujući:
 * - Sigurnosna područja ekrana
 * - Pružatelje konteksta za globalno stanje
 * - Navigacijsku strukturu s rutama
 * - Izgled statusne trake
 */
export default function App() {
  return (
    <SafeAreaProvider>
      {/* Konfiguracija statusne trake uređaja */}
      <StatusBar
        barStyle="light-content"      // Bijeli tekst na statusnoj traci
        backgroundColor="#1E3123"      // Boja pozadine statusne trake
        translucent={true}            // Prozirni efekt
      />
      
      {/* Globalni pružatelj statistike za praćenje aktivnosti */}
      <StatsProvider>
        <NavigationContainer>
          {/* Glavni stog navigacije */}
          <Stack.Navigator initialRouteName="Loading">
            {/* Početni zaslon za učitavanje */}
            <Stack.Screen
              name="Loading"
              component={LoadingScreen}
              options={{ headerShown: false }} // Bez prikaza zaglavlja
            />
            
            {/* Zaslon za prijavu i konfiguraciju korisnika */}
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            
            {/* Glavni zaslon s navigacijom po karticama */}
            <Stack.Screen
              name="Home"
              component={TabNavigator}
              options={{ headerShown: false }}
            />
            
            {/* Zaslon trgovine za kupnju cvijeća */}
            <Stack.Screen 
              name="Shop" 
              component={ShopScreen}
              options={{ headerShown: false }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </StatsProvider>
    </SafeAreaProvider>
  );
}