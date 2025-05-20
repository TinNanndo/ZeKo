import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useStats } from '../context/StatsContext';
import { Picker } from '@react-native-picker/picker';

import SvgAvatar from '../assets/icons/avatar.svg';

export default function ProfileScreen() {
  const navigation = useNavigation();
    const { 
    setStepCount, 
    setCoins, 
    stepCount, 
    coins, 
    caloriesBurned, 
    distance,
    stepGoal,
    setStepGoal
  } = useStats();
  const [userName, setUserName] = useState('User');
  const [weight, setWeight] = useState(70);
  
  
  // Add state for edit modal
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [tempUserName, setTempUserName] = useState('');
  const [tempStepGoal, setTempStepGoal] = useState('');
  const [tempWeight, setTempWeight] = useState('');
  
  // Load user info initially
  useEffect(() => {
    loadUserInfo();
  }, []);

  // Add this to reload user info when the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('Profile screen focused, reloading user info');
      loadUserInfo();
      return () => {}; // Cleanup function
    }, [])
  );
  
  // Also respond to changes in stepCount and coins from context
  useEffect(() => {
    console.log('Stats updated in context:', { stepCount, coins });
    // No need to reload everything, as these values are already updated by the context
  }, [stepCount, coins, caloriesBurned, distance]);
  
  const loadUserInfo = async () => {
    try {
      // Load user info
      const name = await AsyncStorage.getItem('userName');
      const storedStepGoal = await AsyncStorage.getItem('stepGoal');
      const storedWeight = await AsyncStorage.getItem('weight');
      
      if (name) setUserName(name);
      if (storedStepGoal) setStepGoal(parseInt(storedStepGoal, 10));
      if (storedWeight) setWeight(parseFloat(storedWeight));
      
      console.log('Loaded user profile:', { name, stepGoal: storedStepGoal, weight: storedWeight });
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  };

  const openEditModal = () => {
    // Initialize temp values with current values
    setTempUserName(userName);
    setTempStepGoal(stepGoal.toString()); // Make sure it's a string for Picker
    setTempWeight(weight.toString());
    setEditModalVisible(true);
  };

  const saveUserInfo = async () => {
    try {
      // Validate input
      const newStepGoal = parseInt(tempStepGoal, 10);
      const newWeight = parseFloat(tempWeight);
      
      if (tempUserName.trim() === '') {
        Alert.alert('Error', 'Username cannot be empty');
        return;
      }
      
      if (isNaN(newStepGoal) || newStepGoal <= 0) {
        Alert.alert('Error', 'Step goal must be a positive number');
        return;
      }
      
      if (isNaN(newWeight) || newWeight <= 0) {
        Alert.alert('Error', 'Weight must be a positive number');
        return;
      }
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('userName', tempUserName);
      // Use context method to update stepGoal
      setStepGoal(newStepGoal);
      await AsyncStorage.setItem('weight', tempWeight);
      
      // Update state
      setUserName(tempUserName);
      // No need to set stepGoal here as it's handled by context
      setWeight(newWeight);
      
      setEditModalVisible(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error saving user info:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const clearDataAndLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out? All progress will be reset.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Yes", 
          onPress: async () => {
            try {
              // First, specifically clear critical data items to ensure nothing is missed
              
              // Flower-related data
              await AsyncStorage.removeItem('flowerProgressMap');
              await AsyncStorage.removeItem('activeFlower');
              await AsyncStorage.removeItem('grownFlowers');
              await AsyncStorage.removeItem('shopPurchases');
              await AsyncStorage.removeItem('lastTrackedStepCount');
              await AsyncStorage.removeItem('growthProgress');
              
              // Stats-related data
              await AsyncStorage.removeItem('stepCount');
              await AsyncStorage.removeItem('caloriesBurned');
              await AsyncStorage.removeItem('distance');
              await AsyncStorage.removeItem('coins');
              await AsyncStorage.removeItem('weeklyStats');
              await AsyncStorage.removeItem('lastSavedDate');
              
              // User profile data
              await AsyncStorage.removeItem('userName');
              await AsyncStorage.removeItem('stepGoal');
              await AsyncStorage.removeItem('weight');
              
              // Additional app settings
              await AsyncStorage.removeItem('notificationSettings');
              await AsyncStorage.removeItem('appSettings');
              
              // Finally clear everything else to catch any remaining items
              await AsyncStorage.clear();
              
              // Reset state in context if possible
              setStepCount(0);
              setCoins(0);
              
              console.log('All data successfully cleared before logout');
              navigation.navigate('Login');
            } catch (error) {
              console.error('Error during logout data clearing:', error);
              Alert.alert('Error', 'Failed to completely log out. Please try again.');
            }
          }
        }
      ]
    );
  };

  const resetSteps = async () => {
    Alert.alert(
      "Reset Progress",
      "Are you sure you want to reset your steps and coins? This cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Reset", 
          onPress: async () => {
            setStepCount(0);
            setCoins(3000);
            await AsyncStorage.setItem('stepCount', '0');
            await AsyncStorage.setItem('coins', '0');
            Alert.alert("Reset Complete", "Your steps and coins have been reset to 0.");
          },
          style: "destructive"
        }
      ]
    );
  };

  const formatNumber = (number) => {
    return new Intl.NumberFormat().format(number);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.profileCard}>
          <View style={styles.profileCircle}>
            <Text style={styles.profileInitial}>{userName.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.userName}>{userName}</Text>
        </View>
        <View style={styles.statsCard}>
          <Text style={styles.label}>Daily Goal: <Text style={styles.value}>{formatNumber(stepGoal)} steps</Text></Text>
          <Text style={styles.label}>Balance: <Text style={styles.value}>{formatNumber(coins)} coins</Text></Text>
          <Text style={styles.label}>Weight: <Text style={styles.value}>{weight} kg</Text></Text>
        </View>
      </View>

      <View style={styles.optionsCard}>
        <Text style={styles.optionsTitle}>Settings</Text>
        <TouchableOpacity 
          style={styles.option}
          onPress={openEditModal}
        >
          <Text style={styles.optionText}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.option}
          onPress={() => navigation.navigate('Stats')}
        >
          <Text style={styles.optionText}>View Statistics</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.option}
          onPress={resetSteps}
        >
          <Text style={styles.optionText}>Notification Settings</Text>
        </TouchableOpacity>
        
        {/* Logout button moved here */}
        <TouchableOpacity 
          style={[styles.option, styles.logoutOption]}
          onPress={clearDataAndLogout}
        >
          <Text style={[styles.optionText, styles.logoutText]}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.optionsTitle}>Activity Summary</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{formatNumber(stepCount)}</Text>
            <Text style={styles.summaryLabel}>Steps</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{distance.toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>km</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{Math.round(caloriesBurned)}</Text>
            <Text style={styles.summaryLabel}>calories</Text>
          </View>
        </View>
      </View>
      
      {/* Edit Profile Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            
            <Text style={styles.inputLabel}>Username</Text>
            <TextInput
              style={styles.input}
              value={tempUserName}
              onChangeText={setTempUserName}
              placeholder="Enter your name"
              placeholderTextColor="#999"
            />
            
            <Text style={styles.inputLabel}>Daily Step Goal</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={tempStepGoal}
                dropdownIconColor="#fff"
                style={styles.picker}
                onValueChange={(itemValue) => setTempStepGoal(itemValue)}
                mode="dropdown"
              >
                <Picker.Item label="500 steps" value="500" />
                <Picker.Item label="1,000 steps" value="1000" />
                <Picker.Item label="2,500 steps" value="2500" />
                <Picker.Item label="5,000 steps" value="5000" />
                <Picker.Item label="7,500 steps" value="7500" />
                <Picker.Item label="10,000 steps" value="10000" />
                <Picker.Item label="12,500 steps" value="12500" />
                <Picker.Item label="15,000 steps" value="15000" />
                <Picker.Item label="20,000 steps" value="20000" />
              </Picker>
            </View>
            
            <Text style={styles.inputLabel}>Weight (kg)</Text>
            <TextInput
              style={styles.input}
              value={tempWeight}
              onChangeText={setTempWeight}
              placeholder="Enter your weight"
              keyboardType="decimal-pad"
              placeholderTextColor="#999"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={saveUserInfo}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  
  // Add modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2E4834',
    borderRadius: 15,
    padding: 20,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    color: 'white',
    marginBottom: 5,
    fontSize: 16,
  },
  input: {
    backgroundColor: '#1E3123',
    borderRadius: 10,
    padding: 15,
    color: 'white',
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#555',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  pickerContainer: {
    backgroundColor: '#1E3123',
    borderRadius: 10,
    marginBottom: 15,
    overflow: 'hidden',
  },
  picker: {
    color: 'white',
    height: 50,
    width: '100%',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#2E4834',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  profileCard: {
    backgroundColor: '#1E3123',
    borderRadius: 15,
    padding: 20,
    width: '45%',
    alignItems: 'center',
  },
  profileCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: 'white',
    backgroundColor: '#365B41',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    fontSize: 32,
    color: 'white',
    fontWeight: 'bold',
  },
  userName: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  statsCard: {
    backgroundColor: '#1E3123',
    borderRadius: 15,
    padding: 20,
    width: '45%',
    justifyContent: 'center',
  },
  label: {
    color: '#ccc',
    fontSize: 14,
    marginVertical: 5,
  },
  value: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  optionsCard: {
    backgroundColor: '#1E3123',
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 20,
    marginVertical: 10,
  },
  summaryCard: {
    backgroundColor: '#1E3123',
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 20,
    marginVertical: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  summaryLabel: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 4,
  },
  optionsTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    color: 'white',
    marginBottom: 15,
  },
  option: {
    backgroundColor: '#365B41',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  optionText: {
    color: 'white',
    fontSize: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
    logoutOption: {
    backgroundColor: '#9F2A2A', // Red background for logout
    marginTop: 15, // Add more spacing above the logout button
  },
  logoutText: {
    fontWeight: 'bold', // Make the logout text bold
  },
});