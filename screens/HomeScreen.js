import React, { useState, useEffect } from 'react';
import { Text, View, AppState, StyleSheet, Image, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStats } from '../context/StatsContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

// Vlastiti moduli
import PedometerService, { STEP_LENGTH } from '../utils/PedometerService';
import { registerBackgroundTask } from '../utils/BackgroundTasks';
import CircularProgress from '../utils/CircularProgress';

// SVG ikone
import SvgCoins from '../assets/icons/coins.svg';
import SvgSteps from '../assets/icons/steps.svg';
import SvgCal from '../assets/icons/cal.svg';
import SvgDist from '../assets/icons/dist.svg';
import SvgShop from '../assets/icons/shop.svg';

/**
 * HomeScreen - Glavni zaslon aplikacije
 * 
 * Prikazuje statistiku korisnikove aktivnosti i trenutno stanje 
 * uzgoja aktivnog cvijeta. Glavni funkcionalnosti:
 * 1. Praćenje koraka, kalorija i udaljenosti
 * 2. Prikaz napretka prema dnevnom cilju koraka
 * 3. Prikaz aktivnog cvijeta i njegovog rasta
 */
function HomeScreen() {
  const navigation = useNavigation();
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  
  // --- STANJE APLIKACIJE ---
  
  // Korisnički podaci
  const [userName, setUserName] = useState('');
  const [weight, setWeight] = useState(70);
  const [appState, setAppState] = useState(AppState.currentState);
  const prevStepCount = React.useRef(0);
  const [dimensions, setDimensions] = useState({screen: Dimensions.get('window')});
  
  // Podaci iz konteksta statistike
  const { 
    stepCount, 
    updateStepCount,
    caloriesBurned, 
    setCaloriesBurned, 
    distance, 
    setDistance, 
    coins, 
    setCoins, 
    stepGoal, 
    isReady,
    checkForNewDay,
    addCoinsFromSteps
  } = useStats();
  
  // Podaci o cvijeću
  const [activeFlower, setActiveFlower] = useState(null);
  const [growthProgress, setGrowthProgress] = useState(0);
  const [grownFlowers, setGrownFlowers] = useState([]);

  // --- UČITAVANJE PODATAKA I INICIJALIZACIJA ---
  
  /**
   * Učitavanje korisničkog imena i težine iz pohrane
   * Preusmjerava na prijavu ako korisničko ime nije postavljeno
   */
  const loadUserInfo = async () => {
    try {
      const name = await AsyncStorage.getItem('userName');
      const storedWeight = await AsyncStorage.getItem('weight');
      
      if (!name) {
        navigation.navigate('Login');
        return;
      }
      
      setUserName(name);
      if (storedWeight) setWeight(parseFloat(storedWeight));
    } catch (error) {
      console.error('Greška pri učitavanju korisničkih podataka:', error);
    }
  };
  
  /**
   * Učitavanje podataka o aktivnom cvijetu, napretku rasta
   * i uzgojenim cvjetovima
   */
  const loadGardenData = async () => {
    try {
      const storedActiveFlower = await AsyncStorage.getItem('activeFlower');
      const storedFlowerProgress = await AsyncStorage.getItem('flowerProgressMap');
      const storedGrownFlowers = await AsyncStorage.getItem('grownFlowers');
      
      // Učitaj mapu napretka i uzgojene cvjetove
      let progressMap = {};
      if (storedFlowerProgress) {
        progressMap = JSON.parse(storedFlowerProgress);
      }
      
      if (storedGrownFlowers) {
        setGrownFlowers(JSON.parse(storedGrownFlowers));
      }
      
      // Učitaj aktivni cvijet ako postoji
      if (storedActiveFlower && storedActiveFlower !== 'null') {
        const flower = JSON.parse(storedActiveFlower);
        setActiveFlower(flower);
        
        // Postavi napredak za taj cvijet
        if (flower.instanceId && progressMap[flower.instanceId] !== undefined) {
          setGrowthProgress(progressMap[flower.instanceId]);
        } else {
          setGrowthProgress(0);
        }
      } else {
        setActiveFlower(null);
        setGrowthProgress(0);
      }
    } catch (error) {
      console.error('Greška pri učitavanju podataka o vrtu:', error);
      setActiveFlower(null);
    }
  };
  
  // Inicijalno učitavanje podataka
  useEffect(() => {
    loadUserInfo();
    loadGardenData();
  }, []);

  // Osvježavanje podataka kada se zaslon fokusira
  useFocusEffect(
    React.useCallback(() => {
      loadGardenData();
      
      const refreshUserData = async () => {
        try {
          const name = await AsyncStorage.getItem('userName');
          const storedWeight = await AsyncStorage.getItem('weight');
          
          if (name) setUserName(name);
          if (storedWeight) setWeight(parseFloat(storedWeight));
        } catch (error) {
          console.error('Greška pri osvježavanju korisničkih podataka:', error);
        }
      };
      
      refreshUserData();
      return () => {};
    }, [])
  );
  
  // --- PEDOMETAR I PRAĆENJE KORAKA ---
  
  /**
   * Inicijalizacija pedometra nakon učitavanja statistike
   */
  useEffect(() => {
    if (!isReady) return;
    
    const setupPedometer = async () => {
      try {
        await PedometerService.initializeDevice();
        PedometerService.subscribe(handleStepDetected, stepCount);
        registerBackgroundTask();
      } catch (error) {
        console.error('Greška pri inicijalizaciji pedometra:', error);
      }
    };
    
    setupPedometer();
    
    return () => {
      PedometerService.unsubscribe();
    };
  }, [isReady, stepCount]);

  /**
   * Obrada detektiranih koraka - povećava broj koraka
   * i dodaje novčiće ako je potrebno
   */
  const handleStepDetected = () => {
    const prev = stepCount;
    const updated = stepCount + 1;

    updateStepCount(updated);     
    addCoinsFromSteps(updated, prev); 
  };
  
  // --- AŽURIRANJE NAPRETKA CVIJETA ---
  
  /**
   * Ažuriranje napretka rasta cvijeta kada se promijeni broj koraka
   */
  useEffect(() => {
    if (!activeFlower) return;

    const updateFlowerGrowth = async () => {
      try {
        const lastTracked = parseInt(await AsyncStorage.getItem('lastTrackedStepCount') || '0', 10);

        if (stepCount > lastTracked) {
          // Izračunaj nove korake od zadnjeg ažuriranja
          const stepsSince = stepCount - lastTracked;
          const newProgress = growthProgress + stepsSince;

          // Ažuriraj stanje i pohranu
          setGrowthProgress(newProgress);
          
          const storedMap = await AsyncStorage.getItem('flowerProgressMap');
          const map = storedMap ? JSON.parse(storedMap) : {};

          if (activeFlower.instanceId) {
            map[activeFlower.instanceId] = newProgress;
            await AsyncStorage.setItem('flowerProgressMap', JSON.stringify(map));
          }

          await AsyncStorage.setItem('lastTrackedStepCount', stepCount.toString());
        }
      } catch (error) {
        console.error('Greška pri ažuriranju rasta cvijeta:', error);
      }
    };

    updateFlowerGrowth();
  }, [stepCount]);

  // --- AŽURIRANJE STATISTIKE ---
  
  /**
   * Ažuriranje potrošenih kalorija na temelju koraka i težine
   */
  useEffect(() => {
    const newCaloriesBurned = PedometerService.calculateCaloriesBurned(stepCount, weight);
    setCaloriesBurned(newCaloriesBurned);
    prevStepCount.current = stepCount;
  }, [stepCount, weight]);

  /**
   * Ažuriranje prijeđene udaljenosti na temelju koraka
   */
  useEffect(() => {
    const newDistance = (stepCount * STEP_LENGTH) / 1000;
    if (Math.abs(newDistance - distance) > 0.01) {
      setDistance(newDistance);
    }
  }, [stepCount]);

  // --- PERIODIČKO OSVJEŽAVANJE I PRAĆENJE STANJA APLIKACIJE ---
  
  /**
   * Periodičko osvježavanje podataka o vrtu i korisničkim postavkama
   */
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      loadGardenData();
      
      const checkProfileUpdates = async () => {
        const storedWeight = await AsyncStorage.getItem('weight');
        if (storedWeight) {
          const parsedWeight = parseFloat(storedWeight);
          if (parsedWeight !== weight) setWeight(parsedWeight);
        }
      };
      
      checkProfileUpdates();
    }, 5000);
    
    return () => clearInterval(refreshInterval);
  }, []);
  
  /**
   * Praćenje stanja aplikacije (aktivna/pozadina) i osvježavanje podataka
   */
  useEffect(() => {
    const handleAppStateChange = async (nextAppState) => {
      const prevState = appState;
      setAppState(nextAppState);
      
      if (prevState === 'background' && nextAppState === 'active') {
        // Provjera je li nastupio novi dan
        const dayChanged = await checkForNewDay();
        
        if (dayChanged) {
          // Resetiranje pedometra za novi dan
          PedometerService.unsubscribe();
          PedometerService.resetTracking(0);
          PedometerService.subscribe(handleStepDetected, 0);
        }
        
        // Ažuriranje podataka o cvijetu
        loadGardenData();
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, [appState]);

  // --- POMOĆNE FUNKCIJE ZA PRIKAZ ---
  
  /**
   * Izračun postotka ostvarenja dnevnog cilja koraka
   */
  const percentage = Math.min(((stepCount / stepGoal) * 100).toFixed(0), 100);

  /**
   * Formatiranje brojeva za prikaz s tisućama
   */
  const formatNumber = (number) => {
    return new Intl.NumberFormat().format(number);
  };

  // --- PRIKAZ ZASLONA ---
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header sekcija - pozdrav i novčići */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {userName || 'User'}!</Text>
            <Text style={styles.welcome}>Welcome back</Text>
          </View>

          <View style={styles.coinsContainer}>
            <View style={styles.coins}>
              <Text style={styles.coinsText}>{coins}</Text>
              <SvgCoins width="19.5" height="24" />
            </View>
          </View>
        </View>

        {/* Kartica za prikaz koraka i napretka */}
        <View style={styles.stepsCard}>
          <View style={styles.stepsLeftColumn}>
            <View style={styles.stepsHeader}>
              <View style={styles.stepsIcon}>
                <SvgSteps width="27.27" height="30" />
              </View>
              <Text style={styles.stepsTitle}>Steps</Text>
            </View>
        
            <View style={styles.stepsProgress}>
              <CircularProgress percentage={percentage} />
              <Text style={styles.stepsPercentage}>{percentage}%</Text>
            </View>
          </View>
        
          <View style={styles.stepsRightColumn}>
            <Text style={styles.stepsCount}>{formatNumber(stepCount)}</Text>
            <View style={styles.stepsDivider} />
            <Text style={styles.stepsGoal}>{formatNumber(stepGoal)}</Text>
          </View>
        </View>

        {/* Kartice za kalorije i udaljenost */}
        <View style={styles.otherCards}>
          <View style={[styles.card, styles.card01]}>
            <View style={styles.cardIcon}>
              <SvgCal width="23.44" height="30" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Calories</Text>
              <Text style={styles.cardValue}>
                <Text style={styles.cardValueBold}>{Math.round(caloriesBurned)}</Text> kcal
              </Text>
            </View>
          </View>

          <View style={[styles.card, styles.card02]}>
            <View style={styles.cardIcon}>
              <SvgDist width="21" height="30" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Distance</Text>
                <Text style={styles.cardValue}>
                  <Text style={styles.cardValueBold}>{(distance || 0).toFixed(2)}</Text> km
                </Text>
            </View>
          </View>
        </View>

        {/* Kartica za napredak rasta cvijeta */}
        <View style={[styles.flowerCard, { height: dimensions.screen.height * 0.25 }]}>
          <View style={styles.flowerContent}>
            <Text style={styles.flowerTitle}>
              Flower Progress
            </Text>
            <View style={styles.flowerProgress}>
              {activeFlower ? (
                <>
                  <Text style={styles.flowerProgressText}>
                    {`${growthProgress}/${activeFlower.stepsToGrow} steps`}
                  </Text>
                  <View style={styles.flowerProgressBar}>
                    <View
                      style={{ 
                        width: `${Math.min((growthProgress / activeFlower.stepsToGrow) * 100, 100)}%`,
                        height: '100%',
                        backgroundColor: 'white',
                        borderRadius: 12,
                      }}
                    />
                  </View>
                </>
              ) : (
                <View>
                  <Text style={styles.noFlowerText}>
                    You don't have an active flower. Visit the shop to buy your first flower!
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          {activeFlower ? (
            <View style={styles.flowerImage}>
              <Image 
                source={activeFlower.image} 
                style={{
                  width: '80%',
                  height: '80%',
                  opacity: 0.3 + (growthProgress / activeFlower.stepsToGrow) * 0.7,
                  resizeMode: 'contain',
                }}
              />
            </View>
          ) : (
            <View style={styles.flowerImage}>
              <TouchableOpacity 
                style={styles.shopButton}
                onPress={() => navigation.navigate('Shop')}
              >
                <Text style={styles.shopButtonText}>Shop</Text>
                <SvgShop width={20} height={20} />
              </TouchableOpacity>
            </View>
          )}
        </View>
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
    padding: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    color: 'white',
    fontSize: 18,
  },
  welcome: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  coinsContainer: {
    backgroundColor: '#1E3123',
    width: 112,
    height: 50,
    padding: 8,
    borderRadius: 24,
    justifyContent: 'center',
  },
  coins: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coinsText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  notificationContainer: {
    backgroundColor: '#1E3123',
    width: 50,
    height: 50,
    padding: 20,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
stepsCard: {
  flexDirection: 'row',
  backgroundColor: '#1E3123',
  borderRadius: 15,
  padding: 20,
  marginTop: 15,
      shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.8,
  shadowRadius: 2,
  elevation: 2,
  justifyContent: 'space-between',
},
stepsLeftColumn: {
  flex: 1,
  justifyContent: 'space-between',
},
stepsRightColumn: {
  justifyContent: 'center',
  alignItems: 'flex-end',
  marginRight: 50,

},
stepsHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 20, // Add spacing below the header
},
stepsIcon: {
  backgroundColor: '#2E4834',
  width: 56,
  height: 56,
  borderRadius: 28,
  justifyContent: 'center',
  alignItems: 'center',
},
stepsTitle: {
  color: 'white',
  fontSize: 20,
  marginLeft: 20,
},
stepsProgress: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 15, // Add spacing above the progress
},
stepsPercentage: {
  color: 'white',
  fontSize: 20  ,
  marginLeft: 20,
},
stepsCount: {
  color: 'white',
  fontSize: 22,
  fontWeight: 'bold',
  marginRight: 50,
},
stepsDivider: {
  height: 1,
  backgroundColor: 'white',
  borderRadius: 1,
  width: 76.28,
  transform: [{ rotate: '-34.32deg' }],
},
stepsGoal: {
  color: 'white',
  fontSize: 22,
  marginTop: -5,
  marginRight: -50,
},
  otherCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  card: {
    backgroundColor: '#1E3123',
    borderRadius: 15,
    padding: 20,
    flex: 1,
      shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.8,
  shadowRadius: 2,
  elevation: 2,
  },
  card01: {
    marginRight: 10,
  },
  card02: {
    marginLeft: 10,
  },
  cardIcon: {
    backgroundColor: '#2E4834',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    marginTop: 20,
  },
  cardTitle: {
    color: 'white',
    fontSize: 24,
  },
  cardValue: {
    color: 'white',
    fontSize: 24,
  },
  cardValueBold: {
    fontWeight: 'bold',
  },
flowerCard: {
  backgroundColor: '#1E3123',
  borderRadius: 15,
  padding: 20,
  marginTop: 20,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.8,
  shadowRadius: 2,
  elevation: 2,
  flexDirection: 'row',
  justifyContent: 'space-between',
},
  flowerContent: {
    flex: 1,
  },
  flowerTitle: {
    color: 'white',
    fontSize: 24,
  },
  flowerProgress: {
    marginTop: 30,
    justifyContent: 'flex-end',
},
  flowerProgressText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'right',
  },
flowerProgressBar: {
  backgroundColor: '#2E4834',
  height: 20, // This line is missing
  borderRadius: 12,
  marginTop: 10,
  overflow: 'hidden', // This is also recommended
},
flowerImage: {
  backgroundColor: '#2E4834',
  width: '45%', // Slightly reduced from 50%
  height: '100%',
  marginLeft: 20,
  borderRadius: 15,
  justifyContent: 'center',
  alignItems: 'center',
},
  flowerCollectionText: {
  color: 'white',
  fontSize: 14,
  marginTop: 10,
  },
          noFlowerText: {
            color: 'white',
            fontSize: 14,
          },
          shopButtonContainer: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
          },
          shopButton: {
            flexDirection: 'row',
            backgroundColor: '#1E3123',
            paddingVertical: 10,
            paddingHorizontal: 20,
            borderRadius: 20,
            alignItems: 'center',
          },
          shopButtonText: {
            color: 'white',
            fontSize: 16,
            fontWeight: 'bold',
            marginRight: 8,
          },
});

export default HomeScreen;