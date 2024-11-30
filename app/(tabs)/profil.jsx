import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from 'expo-router';
import { setStepCount, setCoins } from '../utils/stateManagement';

export default function ProfilScreen() {
  const navigation = useNavigation();

  const clearDataAndLogout = async () => {
    await AsyncStorage.clear();
    navigation.navigate('login');
  };

  const resetSteps = () => {
    setStepCount(0);
    setCoins(0); // Reset coins when steps are reset
    console.log('Step Count reset to 0'); // Log reset action to terminal
  };

  return (
    <View className="flex-1 bg-[#2E4834] justify-center items-center px-5">
      <Text className='font-bold text-white text-2xl mb-5'>Profil</Text>

      <TouchableOpacity className='bg-[#1E3123] rounded-xl shadow-lg p-5 mb-5' onPress={resetSteps}>
        <Text className='text-white text-lg mt-2 text-center'>Restart</Text>
      </TouchableOpacity>
    
      <TouchableOpacity className='bg-[#1E3123] rounded-xl shadow-lg p-5' onPress={clearDataAndLogout}>
        <Text className='text-white text-lg mt-2 text-center'>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}