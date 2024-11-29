import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from 'expo-router';
import { Picker } from '@react-native-picker/picker';

export default function LoginScreen() {
  const [name, setName] = useState('');
  const [stepGoal, setStepGoal] = useState('10000');
  const [weight, setWeight] = useState('');
  const navigation = useNavigation();

  const handleLogin = async () => {
    await AsyncStorage.setItem('userName', name);
    await AsyncStorage.setItem('stepGoal', stepGoal);
    await AsyncStorage.setItem('weight', weight);
    navigation.navigate('(tabs)'); // Navigacija prema glavnoj stranici
  };

  return (
    <View className="flex-1 bg-[#2E4834] justify-center items-center px-5">
      {/* Ikona profila */}
      <View className="bg-[#1E3123] h-32 w-32 rounded-full justify-center items-center mb-8">
        <Text className="text-white text-6xl">👤</Text>
      </View>

      {/* Polje za unos korisničkog imena */}
      <TextInput
        className="bg-[#1E3123] text-white text-lg px-4 py-3 rounded-xl mb-4 w-full"
        placeholder="Username"
        placeholderTextColor="#fff"
        value={name}
        onChangeText={setName}
      />

      {/* Picker za odabir cilja koraka */}
      <View className="bg-white rounded-xl w-full mb-4">
        <Picker
            selectedValue={stepGoal}
            dropdownIconColor="white"
            style={{ color: 'grey' }}
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
            className='bg-[#1E3123] text-white text-lg px-4 py-3 rounded-xl mb-4 w-full'
            placeholder='Enter your weight'
            placeholderTextColor="#fff"
            value={weight}
            onChangeText={setWeight}
            keyboardType='numeric'
        />
      {/* Gumb za potvrdu */}
      <TouchableOpacity
        className="bg-white px-8 py-3 rounded-full mt-5"
        onPress={handleLogin}
      >
        <Text className="text-[#2E4834] text-lg font-bold">Submit</Text>
      </TouchableOpacity>
    </View>
  );
}
