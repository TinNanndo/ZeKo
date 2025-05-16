import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import SvgAvatar from '../assets/icons/avatar.svg';

export default function LoginScreen() {
  const [name, setName] = useState('');
  const [stepGoal, setStepGoal] = useState('10000');
  const [weight, setWeight] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(true);

  // In the useEffect where you check login status, remove this block:
  
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const storedName = await AsyncStorage.getItem('userName');
        // Make sure lastSavedDate is set on first login to avoid day transition issues
        const lastSavedDate = await AsyncStorage.getItem('lastSavedDate');
        if (!lastSavedDate) {
          await AsyncStorage.setItem('lastSavedDate', new Date().toISOString().split('T')[0]);
        }
      } catch (error) {
        console.error('Error checking login status:', error);
      } finally {
        setIsLoading(false);
      }
    };
  
    checkLoginStatus();
  }, []);
  
  const handleLogin = async () => {
    if (!name || !stepGoal || !weight) {
      setModalVisible(true);
    } else {
      try {
        const currentDate = new Date().toISOString().split('T')[0];
        
        // Save user info
        await AsyncStorage.setItem('userName', name);
        await AsyncStorage.setItem('stepGoal', stepGoal);
        await AsyncStorage.setItem('weight', weight);
        
        // Initialize stats storage with zeros
        await AsyncStorage.setItem('stepCount', '0');
        await AsyncStorage.setItem('caloriesBurned', '0');
        await AsyncStorage.setItem('distance', '0');
        await AsyncStorage.setItem('coins', '0');
        await AsyncStorage.setItem('lastSavedDate', currentDate);
        await AsyncStorage.setItem('weeklyStats', JSON.stringify([]));
        
        // Navigate to home screen
        navigation.replace('Home');
      } catch (error) {
        console.error('Error saving data:', error);
      }
    }
  };

  if (isLoading) {
    // You can show a loading indicator here if you want
    return (
      <View style={styles.container}>
        <Text style={{ color: 'white' }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ... (rest of your login screen UI code) ... */}
      <View style={styles.avatarContainer}>
        <View style={styles.avatarBackground}>
          <SvgAvatar width="90" height="90" />
        </View>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor="rgba(255, 255, 255, 0.5)"
        value={name}
        onChangeText={setName}
      />

      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={stepGoal}
          dropdownIconColor="#2E4834"
          style={styles.picker}
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
        style={styles.input}
        placeholder="Enter your weight"
        placeholderTextColor="rgba(255, 255, 255, 0.5)"
        value={weight}
        onChangeText={setWeight}
        keyboardType="numeric"
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Submit</Text>
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>Please fill in all fields</Text>
            <TouchableOpacity style={styles.button} onPress={() => setModalVisible(false)}>
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2E4834',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  avatarContainer: {
    borderWidth: 5,
    borderColor: 'white',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    marginBottom: 20,
  },
  avatarBackground: {
    backgroundColor: '#1E3123',
    borderRadius: 50,
  },
  input: {
    backgroundColor: '#1E3123',
    color: 'white',
    fontSize: 18,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 20,
    marginBottom: 15,
    width: '100%',
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '100%',
    marginBottom: 15,
  },
  picker: {
    color: '#2E4834',
    opacity: 0.5,
  },
  button: {
    backgroundColor: 'white',
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 50,
    marginTop: 20,
  },
  buttonText: {
    color: '#2E4834',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalText: {
    marginBottom: 20,
    fontSize: 18,
  },
});