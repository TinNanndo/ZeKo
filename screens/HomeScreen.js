import React, { useState, useEffect } from 'react';
import { Text, View, SafeAreaView, AppState, StyleSheet } from 'react-native';
import { Accelerometer, Gyroscope } from 'expo-sensors';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Device from 'expo-device'; // Add this import
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStats } from '../context/StatsContext';

// Icons
import SvgCoins from '../assets/icons/coins.svg';
import SvgNotif from '../assets/icons/notif.svg';
import SvgSteps from '../assets/icons/steps.svg';
import SvgCal from '../assets/icons/cal.svg';
import SvgDist from '../assets/icons/dist.svg';
import CircularProgress from '../utils/CircularProgress';

const STEP_COUNTER_TASK = 'STEP_COUNTER_TASK';
const STEP = 0.75;

// Update the background task to better estimate steps based on recent activity
TaskManager.defineTask(STEP_COUNTER_TASK, async ({ data, error }) => {
  if (error) {
    console.error(error);
    return BackgroundFetch.Result.Failed;
  }
  
  try {
    // Get current step count
    const storedStepCount = await AsyncStorage.getItem('stepCount');
    const currentStepCount = parseInt(storedStepCount || '0', 10);
    
    // Get last background check time
    const lastBackgroundCheck = await AsyncStorage.getItem('lastBackgroundCheck');
    const currentTime = new Date().getTime();
    
    // If we have a previous check time, calculate elapsed time
    if (lastBackgroundCheck) {
      const elapsedMinutes = (currentTime - parseInt(lastBackgroundCheck)) / (1000 * 60);
      
      // Get the user's recent walking patterns from storage
      // This requires you to periodically save step rate data
      let recentStepsPerMinute = 10; // Default value
      
      try {
        const recentActivity = await AsyncStorage.getItem('recentStepRate');
        if (recentActivity) {
          recentStepsPerMinute = parseFloat(recentActivity);
        }
      } catch (err) {
        console.error('Error getting recent activity:', err);
      }
      
      // Estimate steps based on elapsed time and recent activity
      // Use a more conservative estimate in background (60% of normal rate)
      const estimatedSteps = Math.round(elapsedMinutes * recentStepsPerMinute * 0.6);
      
      // Update step count with estimate
      const newStepCount = currentStepCount + estimatedSteps;
      await AsyncStorage.setItem('stepCount', newStepCount.toString());
      console.log(`Background task: added ${estimatedSteps} steps, total: ${newStepCount}`);
    }
    
    // Update last background check time
    await AsyncStorage.setItem('lastBackgroundCheck', currentTime.toString());
    
    return BackgroundFetch.Result.NewData;
  } catch (error) {
    console.error('Error in background task:', error);
    return BackgroundFetch.Result.Failed;
  }
});

function HomeScreen() {
  const [data, setData] = useState({ x: 0, y: 0, z: 0 });
  const [gyroData, setGyroData] = useState({ x: 0, y: 0, z: 0 });
  const [subscription, setSubscription] = useState(null);
  const [gyroSubscription, setGyroSubscription] = useState(null);
  const [lastAcceleration, setLastAcceleration] = useState({ x: 0, y: 0, z: 0 });
  const [lastPeakTime, setLastPeakTime] = useState(0);
  const navigation = useNavigation();
  const [userName, setUserName] = useState('');
  const [stepGoal, setStepGoal] = useState(10000); // Default step goal
  const [weight, setWeight] = useState(70); // Default weight in kg
  const [appState, setAppState] = useState(AppState.currentState);
  const { stepCount, setStepCount, caloriesBurned, setCaloriesBurned, distance, setDistance, coins, setCoins } = useStats();
  const [stepThreshold, setStepThreshold] = useState(1.2);
  const [walkingState, setWalkingState] = useState(false);
  const [recentMagnitudes, setRecentMagnitudes] = useState([]);
  const [rateTrackingStart, setRateTrackingStart] = useState(Date.now());
  const [startingSteps, setStartingSteps] = useState(0);


  useEffect(() => {
    const checkUserSettings = async () => {
      const name = await AsyncStorage.getItem('userName');
      const storedStepGoal = await AsyncStorage.getItem('stepGoal');
      const storedWeight = await AsyncStorage.getItem('weight');
      if (!name || !storedStepGoal || !storedWeight) {
        navigation.navigate('Login');
      } else {
        setUserName(name);
        setStepGoal(parseInt(storedStepGoal, 10)); // Set step goal from storage
        setWeight(parseFloat(storedWeight)); // Set weight from storage
      }
      const storedStepCount = await AsyncStorage.getItem('stepCount');
      const storedCoins = await AsyncStorage.getItem('coins');
      const storedDistance = await AsyncStorage.getItem('distance');
      setStepCount(parseInt(storedStepCount, 10) || 0);
      setCoins(parseInt(storedCoins, 10) || 0);
      setDistance(parseFloat(storedDistance) || 0);
    };

    checkUserSettings();
    _subscribe();
    startBackgroundTask();
    return () => {
      _unsubscribe();
    };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, []);

  const handleAppStateChange = async (nextAppState) => {
    // When app goes to background, record the timestamp and current step count
    if (nextAppState.match(/inactive|background/)) {
      const currentTime = new Date().getTime();
      await AsyncStorage.setItem('appBackgroundTime', currentTime.toString());
      await AsyncStorage.setItem('backgroundStepCount', stepCount.toString());
      
      // Save current stats for real-time updates when app comes back
      await saveDailyStats();
      console.log('App entering background, saved current state');
    }
    
    // When app comes to foreground
    if (appState.match(/inactive|background/) && nextAppState === 'active') {
      const currentDate = new Date().toISOString().split('T')[0];
      const lastSavedDate = await AsyncStorage.getItem('lastSavedDate');
      const appBackgroundTime = await AsyncStorage.getItem('appBackgroundTime');
      const backgroundStepCount = await AsyncStorage.getItem('backgroundStepCount');
      
      // Check if we're on a new day
      if (lastSavedDate !== currentDate) {
        console.log('New day detected, saving yesterday\'s stats and resetting');
        await saveDailyStats();
        setStepCount(0);
        setCaloriesBurned(0);
        setDistance(0);
        await AsyncStorage.setItem('lastSavedDate', currentDate);
      } 
      // If not a new day but we were in background, estimate steps
      else if (appBackgroundTime && backgroundStepCount) {
        const currentTime = new Date().getTime();
        const backgroundTime = currentTime - parseInt(appBackgroundTime);
        const minutesInBackground = backgroundTime / (1000 * 60);
        
        if (minutesInBackground > 1) { // If we were away for more than a minute
          // Get the stored step count from background task (if it increased)
          const currentStoredSteps = parseInt(await AsyncStorage.getItem('stepCount') || '0', 10);
          const previousSteps = parseInt(backgroundStepCount, 10);
          
          // If our background task increased the step count, use that
          if (currentStoredSteps > previousSteps) {
            console.log(`Using ${currentStoredSteps - previousSteps} steps from background task`);
            setStepCount(currentStoredSteps);
          } 
          // Otherwise estimate steps based on user's recent walking patterns
          else {
            // Calculate recent steps per minute before going to background
            // This could be based on last 10 minutes of activity
            const recentStepsPerMinute = 12; // Default value - improve this with actual calculation
            
            // Estimate steps during background - use a conservative multiplier
            const estimatedSteps = Math.round(minutesInBackground * recentStepsPerMinute * 0.5);
            console.log(`Estimating ${estimatedSteps} steps during ${minutesInBackground.toFixed(1)} minutes in background`);
            setStepCount(previousSteps + estimatedSteps);
          }
        }
      }
    }
    setAppState(nextAppState);
  };

  const saveDailyStats = async () => {
    const currentDate = new Date().toISOString().split('T')[0];
    const stats = await AsyncStorage.getItem('weeklyStats');
    const weeklyStats = stats ? JSON.parse(stats) : [];
    
    // Create a proper stats object with all required fields
    const statsObject = {
      date: currentDate,
      stepCount: stepCount,
      caloriesBurned: caloriesBurned,
      distance: distance,
      coins: coins
    };
    
    // Check if today already exists in stats
    const existingIndex = weeklyStats.findIndex(stat => stat.date === currentDate);
    if (existingIndex >= 0) {
      // Update existing entry
      weeklyStats[existingIndex] = statsObject;
    } else {
      // Add new entry
      weeklyStats.push(statsObject);
    }
    
    // Keep only the last 7 days
    if (weeklyStats.length > 7) {
      weeklyStats.sort((a, b) => new Date(b.date) - new Date(a.date));
      weeklyStats.splice(7);
    }
    
    await AsyncStorage.setItem('weeklyStats', JSON.stringify(weeklyStats));
    console.log('Saved daily stats:', statsObject);
  }

    // Add this useEffect to periodically save stats data
  useEffect(() => {
    // Save stats every 5 minutes while app is running
    const saveInterval = setInterval(() => {
      saveDailyStats();
      console.log('Auto-saved stats data');
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(saveInterval);
  }, [stepCount, caloriesBurned, distance, coins]);
  
  // Add this to save stats when user updates steps
  useEffect(() => {
    // Debounced save - only save when steps haven't changed for 2 seconds
    const saveTimeout = setTimeout(() => {
      saveDailyStats();
    }, 2000);
    
    return () => clearTimeout(saveTimeout);
  }, [stepCount]);

  useEffect(() => {
          const caloriesPerStep = calculateCaloriesPerStep(weight);
          const newCaloriesBurned = stepCount * caloriesPerStep;
          setCaloriesBurned(newCaloriesBurned);
          setCoins(Math.floor(stepCount / 100)); // Update coins based on step count
        }, [stepCount, weight]);

  useEffect(() => {
    AsyncStorage.setItem('stepCount', stepCount.toString());
    AsyncStorage.setItem('caloriesBurned', caloriesBurned.toString());
    AsyncStorage.setItem('distance', distance.toString());
    AsyncStorage.setItem('coins', coins.toString());
  }, [stepCount, caloriesBurned, distance, coins]);

  const calculateCaloriesPerStep = (weight) => {
    // Average calories burned per step for different weights
    // This is a simplified calculation and can be adjusted
    const caloriesPerKgPerStep = 0.0005; // Example value
    return weight * caloriesPerKgPerStep;
  };

  const _subscribe = () => {
    if (!subscription) {
      setSubscription(
        Accelerometer.addListener(acceleration => {
          setData(acceleration);
          detectStep(acceleration, gyroData);
        })
      );
      // Android-specific optimization - better balance between accuracy and battery
      Accelerometer.setUpdateInterval(300); // 300ms is a good balance
    }
    if (!gyroSubscription) {
      setGyroSubscription(
        Gyroscope.addListener(gyro => {
          setGyroData(gyro);
        })
      );
      Gyroscope.setUpdateInterval(300); // Match with accelerometer
    }
  };

  const _unsubscribe = () => {
    subscription && subscription.remove();
    gyroSubscription && gyroSubscription.remove();
    setSubscription(null);
    setGyroSubscription(null);
  };

const detectStep = (acceleration, gyroData) => {
  const alpha = 0.25; // Low-pass filter strength
  const filteredAcceleration = {
    x: alpha * lastAcceleration.x + (1 - alpha) * acceleration.x,
    y: alpha * lastAcceleration.y + (1 - alpha) * acceleration.y,
    z: alpha * lastAcceleration.z + (1 - alpha) * acceleration.z,
  };

  const deltaX = Math.abs(filteredAcceleration.x - lastAcceleration.x);
  const deltaY = Math.abs(filteredAcceleration.y - lastAcceleration.y);
  const deltaZ = Math.abs(filteredAcceleration.z - lastAcceleration.z);

  const magnitude = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);

  // Keep recent magnitudes for adaptive threshold
  const updatedMagnitudes = [...recentMagnitudes, magnitude].slice(-20);
  setRecentMagnitudes(updatedMagnitudes);
  
  // Calculate average magnitude to detect if user is walking
  const avgMagnitude = updatedMagnitudes.reduce((sum, val) => sum + val, 0) / updatedMagnitudes.length;
  
  // For Android-specific continuous tracking, always consider potential steps
  // but adjust sensitivity based on detected movement patterns
  let isWalking = avgMagnitude > 0.4;  // Lower threshold for better sensitivity
  if (isWalking !== walkingState) {
    setWalkingState(isWalking);
    console.log(isWalking ? "Walking detected" : "Walking stopped");
  }
  
  // Dynamic threshold based on recent activity - more sensitive for Android
  if (updatedMagnitudes.length > 10) {
    // Lower minimum threshold for better sensitivity on varied Android devices
    const dynamicThreshold = Math.max(0.6, Math.min(1.3, avgMagnitude * 1.4));
    if (Math.abs(dynamicThreshold - stepThreshold) > 0.15) {
      setStepThreshold(dynamicThreshold);
    }
  }

  const currentTime = Date.now();
  const timeSinceLastPeak = currentTime - lastPeakTime;

  // Instead of skipping step detection when not walking,
  // use a sliding scale of sensitivity based on movement patterns
  const effectiveThreshold = walkingState ? 
    stepThreshold : 
    Math.min(1.8, stepThreshold * 1.8); // Higher threshold when not clearly walking
  
  if (magnitude > effectiveThreshold && timeSinceLastPeak > 350) { // Slightly reduced time between steps
    setStepCount(prevStepCount => {
      const newStepCount = prevStepCount + 1;
      const newDistance = (newStepCount * STEP) / 1000;
      setDistance(newDistance);
      return newStepCount;
    });
    setLastPeakTime(currentTime);
  }

  setLastAcceleration(filteredAcceleration);
};

// In your component initialization
useEffect(() => {
  const checkDeviceForCalibration = async () => {
    try {
      const { manufacturer, modelName } = Device.deviceName.split(' ');
      
      // Adjust based on known device sensitivities
      // This would require testing on different devices
      if (manufacturer.toLowerCase().includes('samsung')) {
        setStepThreshold(1.1); // Samsung devices might need different calibration
      } else if (manufacturer.toLowerCase().includes('xiaomi')) {
        setStepThreshold(0.9); // Xiaomi devices might need different calibration
      }
      
      console.log(`Device-specific calibration applied: ${manufacturer} ${modelName}`);
    } catch (error) {
      console.log('Could not apply device-specific calibration');
    }
  };
  
  checkDeviceForCalibration();
}, []);

// Add this function to track recent step rate
  useEffect(() => {
    const calculateStepRate = () => {
      const now = Date.now();
      const elapsedMinutes = (now - rateTrackingStart) / (1000 * 60);
      
      if (elapsedMinutes >= 5) {
        const stepsTaken = stepCount - startingSteps;
        const stepsPerMinute = stepsTaken / elapsedMinutes;
        
        // Only store if user was actively walking (more than 3 steps per minute)
        if (stepsPerMinute > 3) {
          AsyncStorage.setItem('recentStepRate', stepsPerMinute.toString());
          console.log(`Recorded step rate: ${stepsPerMinute.toFixed(1)} steps/minute`);
        }
        
        // Reset for next period
        setRateTrackingStart(now);
        setStartingSteps(stepCount);
      }
    };
    
    const trackingInterval = setInterval(calculateStepRate, 60000); // Check every minute
    return () => clearInterval(trackingInterval);
  }, [stepCount, rateTrackingStart, startingSteps]);

  const startBackgroundTask = async () => {
    try {
      // Make sure the task is registered
      await BackgroundFetch.registerTaskAsync(STEP_COUNTER_TASK, {
        minimumInterval: 900, // 15 minutes (in seconds)
        stopOnTerminate: false,
        startOnBoot: true,
      });
      
      // Schedule the background task
      await BackgroundFetch.setMinimumIntervalAsync(900);
      console.log('Background task registered successfully');
    } catch (error) {
      console.error('Failed to register background task:', error);
    }
  };

  const percentage = Math.min(((stepCount / stepGoal) * 100).toFixed(0), 100); // Ensure percentage does not exceed 100

  const formatNumber = (number) => {
    return new Intl.NumberFormat().format(number);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
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

        {/* Other Cards */}
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
                <Text style={styles.cardValueBold}>{((stepCount * STEP) / 1000).toFixed(1)}</Text> km
              </Text>
            </View>
          </View>
        </View>

        {/* Flower Progress */}
        <View style={styles.flowerCard}>
          <View style={styles.flowerContent}>
            <Text style={styles.flowerTitle}>Flower progress</Text>
            <View style={styles.flowerProgress}>
              <Text style={styles.flowerProgressText}>25,000 km</Text>
              <View style={styles.flowerProgressBar}>
                <View
                  style={{ width: `${Math.min((stepCount / 25000) * 100, 100)}%` }}
                  className="bg-white h-full rounded-full"
                />
              </View>
            </View>
          </View>
          <View style={styles.flowerImage} />
        </View>
      </View>
    </SafeAreaView>
  );
}

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
});

export default HomeScreen;