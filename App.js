import 'react-native-gesture-handler';
import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LoginScreen from './screens/LoginScreen';
import TabNavigator from './navigation/TabNavigator';
import LoadingScreen from './components/LoadingScreen';
import ShopScreen from './screens/ShopScreen';
import { StatsProvider } from './context/StatsContext';
const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#1E3123"
        translucent={true}
      />
      <StatsProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Loading">
            <Stack.Screen
              name="Loading"
              component={LoadingScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Home"
              component={TabNavigator}
              options={{ headerShown: false }}
            />
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