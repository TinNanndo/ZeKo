import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStats } from '../context/StatsContext';

/**
 * LoadingScreen - Komponenta za prikaz zaslona učitavanja
 * 
 * Ova komponenta se prikazuje dok se provjerava autentikacija korisnika
 * i priprema potrebni kontekst za aplikaciju
 * 
 * @returns {React.Component} - Zaslon za učitavanje
 */
export default function LoadingScreen() {
  const navigation = useNavigation();
  const stats = useStats();
  const [checkedLogin, setCheckedLogin] = useState(false);
  
  /**
   * Provjera autentikacije korisnika i preusmjeravanje na odgovarajući zaslon
   * 
   * Dohvaća korisničke podatke iz AsyncStorage-a i odlučuje treba li
   * korisnika preusmjeriti na glavni zaslon ili zaslon za prijavu
   */
  const checkUserAuthentication = async () => {
    try {
      // Dohvat ključnih korisničkih podataka
      const userName = await AsyncStorage.getItem('userName');
      const stepGoal = await AsyncStorage.getItem('stepGoal');
      const weight = await AsyncStorage.getItem('weight');
      
      // Ako postoje svi potrebni podaci, preusmjeri na glavni zaslon
      if (userName && stepGoal && weight) {
        navigation.replace('Home');
      } else {
        // Ako nedostaje bilo koji podatak, preusmjeri na zaslon za prijavu
        navigation.replace('Login');
      }
    } catch (error) {
      console.error('Greška pri provjeri autentikacije:', error);
      navigation.replace('Login'); // Fallback u slučaju greške
    }
  };
  
  /**
   * Sigurnosni mehanizam - provjera autentikacije nakon isteka vremena
   * ako kontekst nije postao dostupan
   */
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!checkedLogin) {
        checkUserAuthentication();
      }
    }, 500);
    
    // Čišćenje timera pri unmount-u komponente
    return () => clearTimeout(timeoutId);
  }, [navigation, checkedLogin]);
  
  /**
   * Glavna provjera autentikacije nakon što je kontekst statistike spreman
   */
  useEffect(() => {
    // Ne radi ništa ako kontekst nije spreman
    if (!stats || !stats.isReady) return;
    
    const checkLoginWithContext = async () => {
      await checkUserAuthentication();
      setCheckedLogin(true);
    };
    
    checkLoginWithContext();
  }, [stats, navigation]);
  
  // Prikaz zaslona za učitavanje
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="white" />
      <Text style={styles.text}>Loading...</Text>
    </View>
  );
}

// Definicija stilova
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