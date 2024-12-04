import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import SvgAvatar from '../assets/icons/avatar.svg';

export default function LoginScreen() {
  const [name, setName] = useState('');
  const [stepGoal, setStepGoal] = useState('10000');
  const [weight, setWeight] = useState('');
  const navigation = useNavigation();

  const handleLogin = async () => {
    await AsyncStorage.setItem('userName', name);
    await AsyncStorage.setItem('stepGoal', stepGoal);
    await AsyncStorage.setItem('weight', weight);
    navigation.navigate('index');
  };

  return (
    <View className="flex-1 bg-[#2E4834] justify-center items-center px-5">
      <View className='border-[5px] border-white rounded-full justify-center items-center p-3 mb-8'>
      <View className="bg-[#1E3123] rounded-full">
        <SvgAvatar width="90" height="90" />
      </View>
      </View>
      {/* <View className="bg-white h-32 w-32 rounded-full justify-center items-center"></View> */}

      <TextInput
        className="bg-[#1E3123] text-white text-lg px-5 py-5 rounded-2xl mb-5 w-80"
        placeholder="Username"
        placeholderTextColor="rgba(255, 255, 255, 0.5)"
        value={name}
        onChangeText={setName}
      />

      <View className="bg-white rounded-2xl w-80 mb-5">
      <Picker
          selectedValue={stepGoal}
          dropdownIconColor="#2E4834"
          style={{ color: '#2E4834', opacity: 0.5 }}
          onValueChange={(itemValue) => setStepGoal(itemValue)}
        >
          <Picker.Item label="10,000 steps" value="10000" />
          <Picker.Item label="7,500 steps" value="7500" />
          <Picker.Item label="5,000 steps" value="5000" />
          <Picker.Item label="2,500 steps" value="2500" />
          <Picker.Item label="1,000 steps" value="1000" />
        </Picker>
      </View>

      <TextInput
        className='bg-[#1E3123] text-white text-lg px-5 py-5 rounded-2xl w-80 mb-5'
        placeholder='Enter your weight'
        placeholderTextColor="rgba(255, 255, 255, 0.5)"
        value={weight}
        onChangeText={setWeight}
        keyboardType='numeric'
      />

      <TouchableOpacity
        className="bg-white px-8 py-3 rounded-full mt-5"
        onPress={handleLogin}
      >
        <Text className="text-[#2E4834] text-lg font-bold">Submit</Text>
      </TouchableOpacity>
    </View>
  );
}