import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import SvgAvatar from '../assets/icons/avatar.svg';

/**
 * LoginScreen - Zaslon za inicijalno postavljanje korisničkog profila
 * 
 * Omogućuje korisniku da unese osnovne podatke potrebne za aplikaciju:
 * 1. Korisničko ime (za personalizirane poruke)
 * 2. Dnevni cilj koraka (za praćenje napretka)
 * 3. Tjelesnu težinu (za izračun potrošenih kalorija)
 */
export default function LoginScreen() {
  // --- STANJE ZASLONA ---
  const [name, setName] = useState('');                     // Korisničko ime
  const [stepGoal, setStepGoal] = useState('10000');        // Cilj koraka (zadano 10000)
  const [weight, setWeight] = useState('');                 // Težina korisnika
  const [isModalVisible, setModalVisible] = useState(false); // Stanje modala za upozorenja
  const [isLoading, setIsLoading] = useState(true);         // Stanje učitavanja
  
  const navigation = useNavigation();

  /**
   * INICIJALIZACIJA ZASLONA
   * 
   * Postavlja datum zadnjeg spremanja podataka ako ne postoji
   * kako bi osigurao pravilno praćenje statistike po danima
   */
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        // Postavljanje datuma zadnjeg spremanja ako ne postoji
        const lastSavedDate = await AsyncStorage.getItem('lastSavedDate');
        if (!lastSavedDate) {
          await AsyncStorage.setItem('lastSavedDate', new Date().toISOString().split('T')[0]);
        }
      } catch (error) {
        console.error('Greška pri inicijalizaciji datuma:', error);
      } finally {
        setIsLoading(false);
      }
    };
  
    checkLoginStatus();
  }, []);
  
  /**
   * OBRADA PRIJAVE KORISNIKA
   * 
   * Validira unose, sprema korisničke podatke i inicijalizira
   * statistiku. Nakon uspješne obrade preusmjerava na Home zaslon.
   */
  const handleLogin = async () => {
    // Validacija - sva polja moraju biti popunjena
    if (!name || !stepGoal || !weight) {
      setModalVisible(true);
      return;
    }
    
    try {
      const currentDate = new Date().toISOString().split('T')[0];
      
      // Čisti sve prethodne podatke (bitno kod ponovnog korištenja)
      await AsyncStorage.clear();
      
      // Spremanje korisničkih podataka
      await AsyncStorage.setItem('userName', name);
      await AsyncStorage.setItem('stepGoal', stepGoal);
      await AsyncStorage.setItem('weight', weight);
      
      // Inicijalizacija statistike s početnim vrijednostima
      await AsyncStorage.setItem('stepCount', '0');
      await AsyncStorage.setItem('caloriesBurned', '0');
      await AsyncStorage.setItem('distance', '0');
      await AsyncStorage.setItem('coins', '0');
      await AsyncStorage.setItem('lastSavedDate', currentDate);
      await AsyncStorage.setItem('weeklyStats', JSON.stringify([]));
      
      // Čišćenje podataka o cvijeću za svježi početak
      await AsyncStorage.removeItem('activeFlower');
      await AsyncStorage.removeItem('flowerProgressMap');
      await AsyncStorage.removeItem('shopPurchases');
      await AsyncStorage.removeItem('grownFlowers');
      await AsyncStorage.removeItem('lastTrackedStepCount');
      
      // Navigacija na glavni zaslon
      navigation.replace('Home');
    } catch (error) {
      console.error('Greška pri spremanju korisničkih podataka:', error);
    }
  };

  // Prikaz indikatora učitavanja
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={{ color: 'white' }}>Loading...</Text>
      </View>
    );
  }

  // --- PRIKAZ ZASLONA ---
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Avatar korisnika */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatarBackground}>
            <SvgAvatar width="90" height="90" />
          </View>
        </View>

        {/* Polje za unos korisničkog imena */}
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          value={name}
          onChangeText={setName}
        />

        {/* Izbornik za odabir dnevnog cilja koraka */}
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={stepGoal}
            dropdownIconColor="#2E4834"
            style={styles.picker}
            onValueChange={(itemValue) => setStepGoal(itemValue)}
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

        {/* Polje za unos težine */}
        <TextInput
          style={styles.input}
          placeholder="Enter your weight (kg)"
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          value={weight}
          onChangeText={setWeight}
          keyboardType="numeric"
        />

        {/* Gumb za potvrdu */}
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Confirm</Text>
        </TouchableOpacity>

        {/* Modal upozorenja za nepotpune podatke */}
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