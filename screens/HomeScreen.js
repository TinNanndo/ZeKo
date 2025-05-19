import React, { useState, useEffect } from 'react';
import { Text, View, AppState, StyleSheet, Image, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStats } from '../context/StatsContext';
import { FLOWER_TYPES } from '../context/flowerData';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

// Custom modules
import PedometerService, { STEP_LENGTH } from '../utils/PedometerService';
import { registerBackgroundTask } from '../utils/BackgroundTasks';

// Icons
import SvgCoins from '../assets/icons/coins.svg';
import SvgNotif from '../assets/icons/notif.svg';
import SvgSteps from '../assets/icons/steps.svg';
import SvgCal from '../assets/icons/cal.svg';
import SvgDist from '../assets/icons/dist.svg';
import SvgShop from '../assets/icons/shop.svg';
import CircularProgress from '../utils/CircularProgress';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

function HomeScreen() {
  const navigation = useNavigation();
  const [userName, setUserName] = useState('');
  const [stepGoal, setStepGoal] = useState(10000);
  const [weight, setWeight] = useState(70);
  const [appState, setAppState] = useState(AppState.currentState);
  const { stepCount, setStepCount, caloriesBurned, setCaloriesBurned, distance, setDistance, coins, setCoins, isReady } = useStats();
  const [activeFlower, setActiveFlower] = useState(null);
  const [growthProgress, setGrowthProgress] = useState(0);
  const [grownFlowers, setGrownFlowers] = useState([]);
  const [dimensions, setDimensions] = useState({screen: Dimensions.get('window')});

  // Load user info once
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const name = await AsyncStorage.getItem('userName');
        const storedStepGoal = await AsyncStorage.getItem('stepGoal');
        const storedWeight = await AsyncStorage.getItem('weight');
        
        if (!name || !storedStepGoal || !storedWeight) {
          navigation.navigate('Login');
          return;
        }
        
        setUserName(name);
        setStepGoal(parseInt(storedStepGoal, 10));
        setWeight(parseFloat(storedWeight));
      } catch (error) {
        console.error('Error loading user info:', error);
      }
    };
    
    loadUserInfo();
  }, []);

  const loadGardenData = async () => {
      try {
        console.log('Loading garden data in Home screen');
        const storedActiveFlower = await AsyncStorage.getItem('activeFlower');
        const storedGrowthProgress = await AsyncStorage.getItem('growthProgress');
        const storedGrownFlowers = await AsyncStorage.getItem('grownFlowers');
        
        if (storedGrowthProgress) {
          const progress = parseInt(storedGrowthProgress, 10) || 0;
          setGrowthProgress(progress);
          console.log('Loaded growth progress:', progress);
        }
        
        if (storedGrownFlowers) {
          setGrownFlowers(JSON.parse(storedGrownFlowers));
        }
        
        // Load active flower directly from AsyncStorage to ensure it matches GardenScreen
        if (storedActiveFlower && storedActiveFlower !== 'null') {
          const flower = JSON.parse(storedActiveFlower);
          setActiveFlower(flower);
          console.log('Loaded active flower:', flower.name, 
            flower.instanceId ? `(Instance: ${flower.instanceNumber})` : '');
        } else {
          // Code for handling no active flower remains the same
          console.log('No active flower found in storage');
          // ...existing code...
        }
      } catch (error) {
        console.error('Error loading garden data:', error);
        setActiveFlower(null);
      }
    };

  useEffect(() => {
    loadGardenData();
  }, []);

    useFocusEffect(
    React.useCallback(() => {
      const reloadData = async () => {
        console.log('Home screen focused, reloading garden data');
        await loadGardenData();
      };
      
      reloadData();
      return () => {}; // cleanup function
    }, [])
  );
  
  // Update the flower progress useEffect to sync with GardenScreen
  useEffect(() => {
    if (!activeFlower) return;
    
    const updateFlowerProgress = async () => {
      try {
        const lastTrackedStep = parseInt(await AsyncStorage.getItem('lastTrackedStepCount') || '0', 10);
        if (stepCount <= lastTrackedStep) return;
        
        // Only update from Home screen if we have steps not yet tracked
        const stepsSinceLastUpdate = stepCount - lastTrackedStep;
        if (stepsSinceLastUpdate > 0) {
          const newProgress = growthProgress + stepsSinceLastUpdate;
          setGrowthProgress(newProgress);
          
          // Save updated progress in AsyncStorage
          await AsyncStorage.setItem('growthProgress', newProgress.toString());
          await AsyncStorage.setItem('lastTrackedStepCount', stepCount.toString());
          
          // Check if flower is fully grown but don't handle it here,
          // let the GardenScreen handle this logic to ensure consistency
          if (newProgress >= activeFlower.stepsToGrow) {
            console.log('Flower has reached full growth! Visit Garden to see it bloom.');
          }
        }
      } catch (error) {
        console.error('Error updating flower progress:', error);
      }
    };
    
    updateFlowerProgress();
  }, [stepCount, activeFlower]);

  // Initialize pedometer only once StatsContext is ready
  useEffect(() => {
    if (!isReady) {
      console.log('Waiting for stats to be ready before initializing pedometer...');
      return;
    }
    
    console.log('Stats ready, initializing pedometer with step count:', stepCount);
    const setupPedometer = async () => {
      try {
        await PedometerService.initializeDevice();
        PedometerService.subscribe(handleStepDetected, stepCount);
        registerBackgroundTask();
      } catch (error) {
        console.error('Error initializing pedometer:', error);
      }
    };
    
    setupPedometer();
    
    return () => {
      PedometerService.unsubscribe();
    };
  }, [isReady, stepCount]);

  const handleStepDetected = () => {
    setStepCount(prevStepCount => {
      const newStepCount = prevStepCount + 1;
      const newDistance = (newStepCount * STEP_LENGTH) / 1000;
      setDistance(newDistance);
      return newStepCount;
    });
  };

  // App state change handling
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ screen: window });
    });
    
    return () => subscription?.remove();
  }, []);

  // Handle app going to background/foreground
  const handleAppStateChange = async (nextAppState) => {
    // When app goes to background
    if (nextAppState.match(/inactive|background/)) {
      const currentTime = new Date().getTime();
      await AsyncStorage.setItem('appBackgroundTime', currentTime.toString());
      await AsyncStorage.setItem('backgroundStepCount', stepCount.toString());
      console.log('App entering background, saved background time and step count');
    }
    
    // When app comes to foreground
    if (appState.match(/inactive|background/) && nextAppState === 'active') {
      console.log('App coming to foreground');
      
      // Handle background time estimation logic
      const appBackgroundTime = await AsyncStorage.getItem('appBackgroundTime');
      const backgroundStepCount = await AsyncStorage.getItem('backgroundStepCount');
      
      if (appBackgroundTime && backgroundStepCount) {
        const currentTime = new Date().getTime();
        const backgroundTime = currentTime - parseInt(appBackgroundTime);
        const minutesInBackground = backgroundTime / (1000 * 60);
        
        if (minutesInBackground > 1) {
          console.log(`App was in background for ${minutesInBackground.toFixed(1)} minutes`);
        }
      }
    }
    
    setAppState(nextAppState);
  };

  // Update calories and coins based on steps
  useEffect(() => {
    const newCaloriesBurned = PedometerService.calculateCaloriesBurned(stepCount, weight);
    setCaloriesBurned(newCaloriesBurned);
    setCoins(Math.floor(stepCount / 100));
  }, [stepCount, weight]);

  const percentage = Math.min(((stepCount / stepGoal) * 100).toFixed(0), 100);

  const formatNumber = (number) => {
    return new Intl.NumberFormat().format(number);
  };

  // Rest of your render code remains the same
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Your existing UI code */}
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

          <View style={styles.notificationContainer}>
            <SvgNotif width="19.5" height="24" />
          </View>
        </View>

        {/* Steps Card */}
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

        {/* Other cards remain the same */}
        <View style={styles.otherCards}>
          <View style={[styles.card, styles.card01]}>
            <View style={styles.cardIcon}>
              <SvgCal width="23.44" height="30" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Calories</Text>
              <Text style={styles.cardValue}>
                <Text style={styles.cardValueBold}>{Math.round(caloriesBurned)}</Text> cal
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
                <Text style={styles.cardValueBold}>{distance.toFixed(1)}</Text> km
              </Text>
            </View>
          </View>
        </View>

        {/* Flower progress */}
        <View style={[styles.flowerCard, { height: dimensions.screen.height * 0.25 }]}>
          <View style={styles.flowerContent}>
            <Text style={styles.flowerTitle}>
              Flower progress
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
                <View style={styles.noFlowerMessage}>
                  <Text style={styles.noFlowerText}>
                    No active flower yet. Visit the shop to buy your first flower!
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
            <View style={styles.shopButtonContainer}>
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

// Styles remain unchanged
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#2E4834',
  },
  container: {
    flex: 1,
    padding: 20,
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
    fontSize: 24,
    fontWeight: 'bold',
  },
  coinsContainer: {
    backgroundColor: '#1E3123',
    width: 112,
    height: 56,
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
    width: 56,
    height: 56,
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
  marginTop: 20,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.8,
  shadowRadius: 2,
  elevation: 5,
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
  elevation: 5,
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
            noFlowerMessage: {
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 20,
          },
          noFlowerText: {
            color: 'white',
            fontSize: 14,
            textAlign: 'center',
            marginBottom: 10,
          },
          shopButtonContainer: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
          },
          shopButton: {
            flexDirection: 'row',
            backgroundColor: '#4CAF50',
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