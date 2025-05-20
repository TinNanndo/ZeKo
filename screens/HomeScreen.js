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
  const [weight, setWeight] = useState(70);
  const [appState, setAppState] = useState(AppState.currentState);
  const { 
    stepCount, 
    setStepCount, 
    caloriesBurned, 
    setCaloriesBurned, 
    distance, 
    setDistance, 
    coins, 
    setCoins, 
    stepGoal, 
    isReady 
  } = useStats();  const [activeFlower, setActiveFlower] = useState(null);
  const [growthProgress, setGrowthProgress] = useState(0);
  const [grownFlowers, setGrownFlowers] = useState([]);
  const [dimensions, setDimensions] = useState({screen: Dimensions.get('window')});
  const prevStepCount = React.useRef(0);


  // Move this function definition to the top of your component
  const loadUserInfo = async () => {
    try {
      const name = await AsyncStorage.getItem('userName');
      const storedWeight = await AsyncStorage.getItem('weight');
      
      if (!name) {
        console.log('No user name found, redirecting to login');
        navigation.navigate('Login');
        return;
      }
      
      setUserName(name);
      if (storedWeight) setWeight(parseFloat(storedWeight));
      
      console.log('User info loaded:', { name, weight: storedWeight });
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  };
  
  // Then update your existing useEffect to use this function
  useEffect(() => {
    loadUserInfo();
  }, []);

  // Modify the loadGardenData function in HomeScreen.js
  
  const loadGardenData = async () => {
    try {
      console.log('Loading garden data in Home screen');
      const storedActiveFlower = await AsyncStorage.getItem('activeFlower');
      const storedFlowerProgress = await AsyncStorage.getItem('flowerProgressMap');
      const storedGrownFlowers = await AsyncStorage.getItem('grownFlowers');
      
      // Parse the flower progress map
      let progressMap = {};
      if (storedFlowerProgress) {
        progressMap = JSON.parse(storedFlowerProgress);
      }
      
      if (storedGrownFlowers) {
        setGrownFlowers(JSON.parse(storedGrownFlowers));
      }
      
      // Load active flower and its specific progress
      if (storedActiveFlower && storedActiveFlower !== 'null') {
        const flower = JSON.parse(storedActiveFlower);
        setActiveFlower(flower);
        
        // Get the specific progress for this flower using its instanceId
        if (flower.instanceId && progressMap[flower.instanceId] !== undefined) {
          setGrowthProgress(progressMap[flower.instanceId]);
          console.log(`Loaded progress for ${flower.name}: ${progressMap[flower.instanceId]} steps`);
        } else {
          // Default to 0 if no progress is saved for this flower
          setGrowthProgress(0);
          console.log(`No progress found for ${flower.name}, defaulting to 0`);
        }
        
        console.log('Loaded active flower:', flower.name, 
          flower.instanceId ? `(Instance: ${flower.instanceNumber})` : '');
      } else {
        console.log('No active flower found in storage');
        setActiveFlower(null);
        setGrowthProgress(0);
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

    // Add this inside your HomeScreen function, after other useFocusEffect hooks
  useFocusEffect(
    React.useCallback(() => {
      const loadUserInfo = async () => {
        try {
          const name = await AsyncStorage.getItem('userName');
          // Remove this line:
          // const storedStepGoal = await AsyncStorage.getItem('stepGoal');
          const storedWeight = await AsyncStorage.getItem('weight');
          
          if (name) setUserName(name);
          // Remove this line:
          // if (storedStepGoal) setStepGoal(parseInt(storedStepGoal, 10));
          if (storedWeight) setWeight(parseFloat(storedWeight));
          
          console.log('Refreshed user profile data in HomeScreen');
        } catch (error) {
          console.error('Error refreshing user info:', error);
        }
      };
      
      loadUserInfo();
      return () => {};
    }, [])
  );
  
  // Update your flower progress useEffect to be more reactive
  useEffect(() => {
    if (!activeFlower) return;
    
    const syncFlowerProgress = async () => {
      try {
        // Always check the latest growth progress from storage to 
        // stay in sync with GardenScreen
      const storedFlowerProgress = await AsyncStorage.getItem('flowerProgressMap');
      if (storedFlowerProgress) {
        const progressMap = JSON.parse(storedFlowerProgress);
        
        // Get the progress specific to this flower
        if (activeFlower.instanceId && progressMap[activeFlower.instanceId] !== undefined) {
          const newProgress = progressMap[activeFlower.instanceId];
          if (newProgress !== growthProgress) {
            console.log(`Updating flower progress for ${activeFlower.name}: ${newProgress} steps`);
            setGrowthProgress(newProgress);
          }
        }
      }
        
        // Rest of your existing flower progress update code
      const lastTrackedStep = parseInt(await AsyncStorage.getItem('lastTrackedStepCount') || '0', 10);
      if (stepCount <= lastTrackedStep) return;
        
        const stepsSinceLastUpdate = stepCount - lastTrackedStep;
        if (stepsSinceLastUpdate > 0) {
          const newProgress = growthProgress + stepsSinceLastUpdate;
          setGrowthProgress(newProgress);
          
          await AsyncStorage.setItem('growthProgress', newProgress.toString());
          await AsyncStorage.setItem('lastTrackedStepCount', stepCount.toString());
          
          if (newProgress >= activeFlower.stepsToGrow) {
            console.log('Flower has reached full growth! Visit Garden to see it bloom.');
          }
        }
        await loadGardenData();
      } catch (error) {
        console.error('Error syncing flower progress:', error);
      }
    };
    
    syncFlowerProgress();
  }, [stepCount, activeFlower, growthProgress]);

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
    // Distance calculation now handled in StatsContext
    return newStepCount;
  });
};

  // Update your existing app state useEffect
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, [appState, stepCount]); // Add stepCount as a dependency

    // Add this after your other useEffect hooks
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      // Reload garden data to check for changes from other screens
      loadGardenData();
      
      // Also check for updated weight that may affect calculations
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

useEffect(() => {
  // Update calories based on all steps
  const newCaloriesBurned = PedometerService.calculateCaloriesBurned(stepCount, weight);
  setCaloriesBurned(newCaloriesBurned);
  
  // Update the ref value here
  prevStepCount.current = stepCount;
}, [stepCount, weight]);

// Add this new effect to handle step changes for coin calculation
useEffect(() => {
  const handleStepCountChange = async () => {
    try {
      // Get the last step count we used for coins
      const lastCoinStepCount = parseInt(await AsyncStorage.getItem('lastCoinStepCount') || '0', 10);
      
      // If we have more steps now, add coins just for the difference
      if (stepCount > lastCoinStepCount) {
        const additionalSteps = stepCount - lastCoinStepCount;
        const newCoins = Math.floor(additionalSteps / 100);
        
        if (newCoins > 0) {
          setCoins(prevCoins => {
            const updatedCoins = prevCoins + newCoins;
            AsyncStorage.setItem('coins', updatedCoins.toString());
            return updatedCoins;
          });
          
          // Update the last step count we used for coins
          await AsyncStorage.setItem('lastCoinStepCount', stepCount.toString());
          console.log(`Added ${newCoins} coins from ${additionalSteps} new steps`);
        }
      }
    } catch (error) {
      console.error('Error updating coins from steps:', error);
    }
  };
  
  handleStepCountChange();
}, [stepCount]);

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
                  <Text style={styles.cardValueBold}>{distance.toFixed(2)}</Text> km
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

// Styles remain unchanged
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