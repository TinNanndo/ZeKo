import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useStats } from '../context/StatsContext';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { setStepCount, setCoins, stepCount, coins } = useStats();

  useEffect(() => {
    const loadStats = async () => {
      const storedStepCount = await AsyncStorage.getItem('stepCount');
      const storedCoins = await AsyncStorage.getItem('coins');
      if (storedStepCount !== null) setStepCount(parseInt(storedStepCount));
      if (storedCoins !== null) setCoins(parseInt(storedCoins));
    };

    loadStats();
  }, []);

  const clearDataAndLogout = async () => {
    await AsyncStorage.clear();
    navigation.navigate('Login');
  };

  const resetSteps = async () => {
    setStepCount(5000); // Reset step count to 0
    setCoins(10000); // Reset coins when steps are reset
    await AsyncStorage.setItem('stepCount', '0'); // Persist reset step count
    await AsyncStorage.setItem('coins', '0'); // Persist reset coins
    console.log('Step Count reset to 0'); // Log reset action to terminal
  };

  return (
    <SafeAreaView style={styles.safeArea}>
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.stats}>Steps: {stepCount}</Text>
      <Text style={styles.stats}>Coins: {coins}</Text>

      <TouchableOpacity style={styles.button} onPress={resetSteps}>
        <Text style={styles.buttonText}>Restart</Text>
      </TouchableOpacity>
    
      <TouchableOpacity style={styles.button} onPress={clearDataAndLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    safeArea: {
    flex: 1,
    backgroundColor: '#2E4834',
  },
  container: {
    flex: 1,
    backgroundColor: '#2E4834',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontWeight: 'bold',
    color: 'white',
    fontSize: 24,
    marginBottom: 20,
  },
  stats: {
    color: 'white',
    fontSize: 18,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#1E3123',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
  },
});