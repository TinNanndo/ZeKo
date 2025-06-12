import * as React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Uvoz zaslona aplikacije
import HomeScreen from '../screens/HomeScreen';
import GardenScreen from '../screens/GardenScreen';
import StatsScreen from '../screens/StatsScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Uvoz SVG ikona za navigaciju
import SvgHome from '../assets/icons/home';
import SvgGarden from '../assets/icons/garden';
import SvgStats from '../assets/icons/stats';
import SvgProfil from '../assets/icons/profil';

/**
 * DEFINICIJA KONSTANTI
 */

/**
 * Definicija boja korištenih u navigaciji
 * Omogućuje jednostavnu promjenu teme aplikacije
 */
const COLORS = {
    backgroundColor: '#2E4834', // Zelena pozadinska boja aplikacije
    transparent: 'transparent',  // Prozirna boja za neaktivne kartice
    tabBarBackground: '#1E3123', // Tamno zelena boja donje navigacijske trake
};

/**
 * STILOVI ZA NAVIGACIJU
 */
const styles = StyleSheet.create({
    container: {
      backgroundColor: COLORS.backgroundColor,
      flex: 1, // Zauzima cijeli dostupni prostor
    },
    tabBarIconContainer: {
      backgroundColor: COLORS.transparent,
      borderRadius: 15,
      padding: 10,
    },
    tabBarIconContainerFocused: {
      backgroundColor: COLORS.backgroundColor, // Promjena pozadine za aktivnu karticu
    },
});

/**
 * NAVIGACIJSKA KOMPONENTA
 */

// Inicijalizacija navigatora s karticama
const Tab = createBottomTabNavigator();

/**
 * TabNavigator - Komponenta za donju navigacijsku traku
 * 
 * Implementira glavni navigacijski sustav aplikacije s 4 zaslona:
 * - Home: Početni zaslon s koracima i statusom
 * - Garden: Zaslon s vrtom i uzgojenim cvijećem
 * - Stats: Zaslon statistike i postignuća
 * - Profile: Zaslon korisničkog profila i postavki
 * 
 * @returns {React.Component} - Komponenta donje navigacijske trake
 */
export default function TabNavigator() {
  return (
      <View style={styles.container}>
        <Tab.Navigator
          screenOptions={({ route }) => ({

            // Stilizacija donje navigacijske trake
            tabBarStyle: {
                borderTopWidth: 0,
                backgroundColor: COLORS.tabBarBackground,
                height: 65,
                paddingTop: 8,
                borderTopRightRadius: 15,
                borderTopLeftRadius: 15,
            },
            tabBarItemStyle: {
                borderRadius: 15,
                padding: 5,
            },
            
            // Funkcija za dinamičko generiranje ikona na temelju odabrane rute
            tabBarIcon: ({ color, focused }) => {
              let IconComponent;

              // Odabir odgovarajuće ikone prema zaslonu
              if (route.name === 'Home') {
                IconComponent = SvgHome;
              } else if (route.name === 'Garden') {
                IconComponent = SvgGarden;
              } else if (route.name === 'Profile') {
                IconComponent = SvgProfil;
              } else if (route.name === 'Stats') {
                IconComponent = SvgStats;
              }

              // Prikazivanje ikone s posebnim stilom kad je kartica odabrana
              return (
                <View
                    style={[
                        styles.tabBarIconContainer,
                        focused && styles.tabBarIconContainerFocused,
                    ]}
                >
                    <IconComponent 
                        width={30} 
                        height={30} 
                        fill={color} 
                    />
                </View>
              );
            },
          })}
        >
            {/* Definicije zaslona u navigaciji */}
            
            {/* Početni zaslon - prikaz dnevnog napretka i statistike koraka */}
            <Tab.Screen 
                name="Home" 
                component={HomeScreen} 
                options={{
                    headerShown: false,
                    tabBarLabel: '',
                }}
            />

            {/* Zaslon vrta - prikaz i upravljanje uzgojenim cvijećem */}
            <Tab.Screen 
                name="Garden" 
                component={GardenScreen} 
                options={{
                    headerShown: false,
                    tabBarLabel: '',
                }}
            />

            {/* Zaslon statistike - detaljni prikaz aktivnosti i postignuća */}
            <Tab.Screen 
                name="Stats" 
                component={StatsScreen}
                options={{
                    headerShown: false,
                    tabBarLabel: '',
                }}
            />

            {/* Zaslon profila - korisnički podaci i postavke aplikacije */}
            <Tab.Screen 
                name="Profile" 
                component={ProfileScreen} 
                options={{
                    headerShown: false,
                    tabBarLabel: '',
                }}
            />
        </Tab.Navigator>
      </View>
  );
}