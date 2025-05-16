import React, { useState, useEffect } from 'react';
import { Text, View, SafeAreaView, AppState, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStats } from '../context/StatsContext';

// Custom modules
import PedometerService, { STEP_LENGTH } from '../utils/PedometerService';
import { registerBackgroundTask } from '../utils/BackgroundTasks';

// Icons
import SvgCoins from '../assets/icons/coins.svg';
import SvgNotif from '../assets/icons/notif.svg';
import SvgSteps from '../assets/icons/steps.svg';
import SvgCal from '../assets/icons/cal.svg';
import SvgDist from '../assets/icons/dist.svg';
import CircularProgress from '../utils/CircularProgress';

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

  useEffect(() => {
  const loadGardenData = async () => {
    try {
      const storedActiveFlower = await AsyncStorage.getItem('activeFlower');
      const storedGrowthProgress = await AsyncStorage.getItem('growthProgress');
      const storedGrownFlowers = await AsyncStorage.getItem('grownFlowers');
      
      if (storedActiveFlower) {
        setActiveFlower(JSON.parse(storedActiveFlower));
      }
      
      if (storedGrowthProgress) {
        setGrowthProgress(parseInt(storedGrowthProgress, 10));
      }
      
      if (storedGrownFlowers) {
        setGrownFlowers(JSON.parse(storedGrownFlowers));
      }
    } catch (error) {
      console.error('Error loading garden data:', error);
    }
  };
  
  loadGardenData();
}, []);

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
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
      console.log('HomeScreen unmounting');
    };
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
          <View style={styles.stepsContent}>
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

          <View style={styles.stepsCountContainer}>
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
        <View style={styles.flowerCard}>
          <View style={styles.flowerContent}>
            <Text style={styles.flowerTitle}>
              {activeFlower ? activeFlower.name : 'Flower'} progress
            </Text>
            <View style={styles.flowerProgress}>
              <Text style={styles.flowerProgressText}>
                {activeFlower ? `${growthProgress}/${activeFlower.stepsToGrow} steps` : 'Loading...'}
              </Text>
              <View style={styles.flowerProgressBar}>
                <View
                  style={{ 
                    width: activeFlower 
                      ? `${Math.min((growthProgress / activeFlower.stepsToGrow) * 100, 100)}%` 
                      : '0%',
                    height: '100%',
                    backgroundColor: 'white',
                    borderRadius: 12,
                  }}
                />
              </View>
            </View>
            <Text style={styles.flowerCollectionText}>
              Collection: {grownFlowers.length} flowers
            </Text>
          </View>
          {activeFlower && (
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
    backgroundColor: '#1E3123',
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
  stepsContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: 24,
    marginLeft: 20,
  },
  stepsProgress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepsPercentage: {
    color: 'white',
    fontSize: 24,
    marginLeft: 20,
  },
  stepsCountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  stepsCount: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
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
    fontSize: 24,
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
    marginTop: 20,
  },
  flowerProgressText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'right',
  },
  flowerProgressBar: {
    backgroundColor: '#2E4834',
    height: 24,
    borderRadius: 12,
    marginTop: 10,
  },
  flowerImage: {
    backgroundColor: '#2E4834',
    width: '50%',
    height: '100%',
    marginLeft: 20,
    borderRadius: 15,
  },
  flowerCollectionText: {
  color: 'white',
  fontSize: 14,
  marginTop: 10,
  },
});

export default HomeScreen;