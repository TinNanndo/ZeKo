import * as React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import GardenScreen from '../screens/GardenScreen';
import ProfileScreen from '../screens/ProfileScreen';
import StatsScreen from '../screens/StatsScreen';
import { StatsProvider } from '../context/StatsContext'; // Import StatsProvider

// Icons
import SvgHome from '../assets/icons/home';
import SvgGarden from '../assets/icons/garden';
import SvgStats from '../assets/icons/stats';
import SvgProfil from '../assets/icons/profil';

const COLORS = {
    backgroundColor: '#2E4834',
    transparent: 'transparent',
    tabBarBackground: '#1E3123',
};

const styles = StyleSheet.create({
    container: {
      backgroundColor: COLORS.backgroundColor,
      flex: 1, // Same background color as tabBarStyle
    },
    tabBarIconContainer: {
      backgroundColor: COLORS.transparent,
      borderRadius: 15,
      padding: 10,
    },
    tabBarIconContainerFocused: {
      backgroundColor: COLORS.backgroundColor,
    },
});

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <StatsProvider> 
      <View style={styles.container}>
        <Tab.Navigator
          screenOptions={({ route }) => ({

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
            
            tabBarIcon: ({ color, focused }) => {
              let IconComponent;

              if (route.name === 'Home') {
                IconComponent = SvgHome;
              } else if (route.name === 'Garden') {
                IconComponent = SvgGarden;
              } else if (route.name === 'Profile') {
                IconComponent = SvgProfil;
              } else if (route.name === 'Stats') {
                IconComponent = SvgStats;
              }

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
            <Tab.Screen 
                name="Home" 
                component={HomeScreen} 
                options={{
                    headerShown: false,
                    tabBarLabel: '',
                }}
            />

            <Tab.Screen 
                name="Garden" 
                component={GardenScreen} 
                options={{
                    headerShown: false,
                    tabBarLabel: '',
                }}
            />

            <Tab.Screen 
                name="Stats" 
                component={StatsScreen}
                options={{
                    headerShown: false,
                    tabBarLabel: '',
                }}
            />

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
    </StatsProvider>
  );
}