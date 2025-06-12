import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, TextInput, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useStats } from '../context/StatsContext';
import { Picker } from '@react-native-picker/picker';

// Uvoz SVG ikona
import SvgAvatar from '../assets/icons/avatar.svg';
import SvgCoins from '../assets/icons/coins.svg';

/**
 * ProfileScreen - Zaslon profila korisnika
 * 
 * Omogućuje:
 * 1. Pregled profila i osnovnih podataka korisnika
 * 2. Uređivanje korisničkih podataka (ime, cilj koraka, težina)
 * 3. Pregled sažetka aktivnosti (koraci, kalorije, udaljenost)
 * 4. Pristup drugim funkcijama (statistika, odjava)
 */
export default function ProfileScreen() {
  const navigation = useNavigation();
  
  // --- STANJE IZ KONTEKSTA STATISTIKE ---
  const { 
    setStepCount, 
    setCoins, 
    stepCount, 
    coins, 
    caloriesBurned, 
    distance,
    stepGoal,
    setStepGoal,
    setCaloriesBurned,
    setDistance,
    checkForNewDay
  } = useStats();
  
  // --- LOKALNO STANJE PROFILA ---
  const [userName, setUserName] = useState('User');
  const [weight, setWeight] = useState(70);
  
  // --- STANJE ZA MODALNI PROZOR UREĐIVANJA ---
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [tempUserName, setTempUserName] = useState('');
  const [tempStepGoal, setTempStepGoal] = useState('');
  const [tempWeight, setTempWeight] = useState('');
  
  // --- UČITAVANJE PODATAKA ---
  
  /**
   * Inicijalno učitavanje korisničkih podataka
   */
  useEffect(() => {
    loadUserInfo();
  }, []);

  /**
   * Osvježavanje podataka kada se zaslon fokusira
   */
  useFocusEffect(
    React.useCallback(() => {
      checkForNewDay();
      loadUserInfo();
      return () => {};
    }, [])
  );
  
  /**
   * Učitavanje korisničkih podataka iz AsyncStorage-a
   */
  const loadUserInfo = async () => {
    try {
      const name = await AsyncStorage.getItem('userName');
      const storedStepGoal = await AsyncStorage.getItem('stepGoal');
      const storedWeight = await AsyncStorage.getItem('weight');
      
      if (name) setUserName(name);
      if (storedStepGoal) setStepGoal(parseInt(storedStepGoal, 10));
      if (storedWeight) setWeight(parseFloat(storedWeight));
    } catch (error) {
      console.error('Greška pri učitavanju korisničkih podataka:', error);
    }
  };

  // --- UREĐIVANJE PROFILA ---
  
  /**
   * Otvaranje modalnog prozora za uređivanje profila
   * Inicijalizira privremene vrijednosti s trenutnim podacima
   */
  const openEditModal = () => {
    setTempUserName(userName);
    setTempStepGoal(stepGoal.toString());
    setTempWeight(weight.toString());
    setEditModalVisible(true);
  };

  /**
   * Spremanje ažuriranih korisničkih podataka
   * Obavlja validaciju prije spremanja
   */
  const saveUserInfo = async () => {
    try {
      // Validacija unosa
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
      
      // Spremanje u AsyncStorage
      await AsyncStorage.setItem('userName', tempUserName);
      await AsyncStorage.setItem('stepGoal', newStepGoal.toString());
      await AsyncStorage.setItem('weight', tempWeight);
      
      // Ažuriranje lokalnog stanja
      setUserName(tempUserName);
      setStepGoal(newStepGoal);
      setWeight(newWeight);
      
      setEditModalVisible(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Greška pri spremanju korisničkih podataka:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  // --- FUNKCIJE ZA BRISANJE PODATAKA ---
  
  /**
   * Odjava korisnika i brisanje svih podataka aplikacije
   * Traži potvrdu prije izvršavanja
   */
  const clearDataAndLogout = async () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out? All progress will be deleted.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Yes", 
          onPress: async () => {
            try {
              // Brisanje svih podataka iz AsyncStorage-a
              await AsyncStorage.clear();
              
              // Resetiranje stanja konteksta na početne vrijednosti
              setStepCount(0);
              setCoins(0);
              setCaloriesBurned(0);
              setDistance(0);
              
              // Navigacija na zaslon za prijavu
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('Greška tijekom brisanja podataka:', error);
              Alert.alert('Error', 'Logout failed. Please try again.');
            }
          }
        }
      ]
    );
  };

  // --- POMOĆNE FUNKCIJE ---
  
  /**
   * Formatiranje brojeva za prikaz (dodavanje separatora tisućica)
   */
  const formatNumber = (number) => {
    return new Intl.NumberFormat().format(number);
  };

  // --- PRIKAZ ZASLONA ---
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Zaglavlje s podacima korisnika */}
        <View style={styles.header}>
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <SvgAvatar width={80} height={80} />
            </View>
          </View>
          <View style={styles.statsCard}>
            <Text style={styles.label}>Name: <Text style={styles.value}>{userName}</Text></Text>
            <Text style={styles.label}>Balance: <Text style={styles.value}>{formatNumber(coins)} <SvgCoins width="18" height="18" /></Text></Text>
            <Text style={styles.label}>Daily Goal: <Text style={styles.value}>{formatNumber(stepGoal)}</Text></Text>
            <Text style={styles.label}>Weight: <Text style={styles.value}>{weight} kg</Text></Text>
          </View>
        </View>

        {/* Glavni sadržaj s opcijama i statistikom */}
        <View style={styles.mainContent}>
          {/* Kartica opcija */}
          <View style={styles.optionsCard}>
            <Text style={styles.optionsTitle}>Options</Text>
            <View style={styles.optionsGrid}>
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
            </View>
            
            <TouchableOpacity 
              style={[styles.option, styles.logoutOption]}
              onPress={clearDataAndLogout}
            >
              <Text style={[styles.optionText, styles.logoutText]}>Log Out</Text>
            </TouchableOpacity>
          </View>

          {/* Kartica sažetka aktivnosti */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Activity Summary</Text>
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
                <Text style={styles.summaryLabel}>kcal</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
      
      {/* Modalni prozor za uređivanje profila */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{flex: 1}}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              
              <Text style={styles.inputLabel}>Username</Text>
              <TextInput
                style={styles.input}
                value={tempUserName}
                onChangeText={setTempUserName}
                placeholder="Enter username"
                placeholderTextColor="#888"
              />
              
              <Text style={styles.inputLabel}>Daily Step Goal</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={tempStepGoal}
                  onValueChange={setTempStepGoal}
                  style={styles.picker}
                  dropdownIconColor="white"
                >
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
                placeholder="Enter weight in kg"
                placeholderTextColor="#888"
                keyboardType="numeric"
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
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// --- STILOVI ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#2E4834',
  },
  container: {
    flex: 1,
    padding: 15, // Further reduced padding
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15, // Further reduced margin
    height: '28%', // Fixed height for header section
  },
  mainContent: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  profileCard: {
    backgroundColor: '#1E3123',
    borderRadius: 15,
    padding: 15, // Reduced padding
    width: '42.5%', // Made narrower
    alignItems: 'center',
    justifyContent: 'center', // Center vertically
          shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.8,
  shadowRadius: 2,
  elevation: 2,
  },
  avatar: {
    borderWidth: 5,
    borderColor: '#fff',
    padding: 10,
    backgroundColor: '#2E4834',
    borderRadius: 100,
  },
  statsCard: {
    backgroundColor: '#1E3123',
    borderRadius: 15,
    padding: 15, // Reduced padding
    width: '52.5%', // Made wider for more info
    justifyContent: 'center',
          shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.8,
  shadowRadius: 2,
  elevation: 2,
  },
  label: {
    color: '#ccc',
    fontSize: 16, // Smaller text
    marginVertical: 5, // Reduced margin
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  optionsCard: {
    backgroundColor: '#1E3123',
    borderRadius: 15,
    padding: 15, // Reduced padding
    marginBottom: 15, // Reduced margin
          shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.8,
  shadowRadius: 2,
  elevation: 2,
  },
    optionsTitle: {
    fontWeight: 'bold',
    fontSize: 24, // Smaller text
    color: 'white',
    marginBottom: 20, // Reduced margin
  },
  optionsGrid: {
    flexDirection: 'col',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  option: {
    backgroundColor: '#2E4834',
    padding: 10, // Reduced padding
    borderRadius: 10,
    marginBottom: 15, // Reduced margin
  },
  logoutOption: {
    backgroundColor: '#9F2A2A',
    marginTop: 20, // Removed margin
    width: '100%',
  },
  optionText: {
    color: 'white',
    fontSize: 16, // Smaller text
    textAlign: 'center',
  },
  logoutText: {
    fontWeight: 'bold',
  },
  summaryCard: {
    backgroundColor: '#1E3123',
    borderRadius: 15,
    padding: 15, // Reduced padding
          shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.8,
  shadowRadius: 2,
  elevation: 2,
  },
  summaryTitle: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 24, // Smaller text
    color: 'white',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  summaryItem: {
    flex: 1,
    margin: 5,
    alignItems: 'center',
    backgroundColor: '#2E4834',
    borderRadius: 10,
    padding: 15,

  },
  summaryValue: {
    color: 'white',
    fontSize: 18, // Smaller text
    fontWeight: 'bold',
  },
  summaryLabel: {
    color: '#ccc',
    fontSize: 12, // Smaller text
    marginTop: 2, // Reduced margin
  },
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
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});