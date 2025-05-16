import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStats } from '../context/StatsContext';

export default function LoadingScreen() {
  const navigation = useNavigation();
  const stats = useStats();
  const [checkedLogin, setCheckedLogin] = useState(false);
  
  // First check if the context is available
  useEffect(() => {
    const checkLoginDirectly = async () => {
      try {
        const userName = await AsyncStorage.getItem('userName');
        const stepGoal = await AsyncStorage.getItem('stepGoal');
        const weight = await AsyncStorage.getItem('weight');
        
        if (userName && stepGoal && weight) {
          console.log('User logged in. Navigating to Home.');
          navigation.replace('Home');
        } else {
          console.log('No user info found. Navigating to Login.');
          navigation.replace('Login');
        }
      } catch (error) {
        console.error('Error in LoadingScreen:', error);
        navigation.replace('Login'); // Fallback to login on error
      }
    };
    
    // If context is not available after short timeout, proceed with direct check
    const timeoutId = setTimeout(() => {
      if (!checkedLogin) {
        console.log('Stats context not available, checking login directly');
        checkLoginDirectly();
      }
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [navigation, checkedLogin]);
  
  // If context is available, use it
  useEffect(() => {
    if (!stats || !stats.isReady) return;
    
    const checkLoginWithContext = async () => {
      try {
        const userName = await AsyncStorage.getItem('userName');
        const stepGoal = await AsyncStorage.getItem('stepGoal');
        const weight = await AsyncStorage.getItem('weight');
        
        setCheckedLogin(true);
        
        if (userName && stepGoal && weight) {
          console.log('User logged in, stats ready. Navigating to Home.');
          navigation.replace('Home');
        } else {
          console.log('No user info found. Navigating to Login.');
          navigation.replace('Login');
        }
      } catch (error) {
        console.error('Error in LoadingScreen:', error);
        navigation.replace('Login');
      }
    };
    
    checkLoginWithContext();
  }, [stats, navigation]);
  
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="white" />
      <Text style={styles.text}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2E4834',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: 'white',
    marginTop: 20,
    fontSize: 18,
  }
});