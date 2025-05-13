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
  const { stepCount, setStepCount, caloriesBurned, setCaloriesBurned, distance, setDistance, coins, setCoins } = useStats();

  useEffect(() => {
    const checkUserSettings = async () => {
      const name = await AsyncStorage.getItem('userName');
      const storedStepGoal = await AsyncStorage.getItem('stepGoal');
      const storedWeight = await AsyncStorage.getItem('weight');
      if (!name || !storedStepGoal || !storedWeight) {
        navigation.navigate('Login');
      } else {
        setUserName(name);
        setStepGoal(parseInt(storedStepGoal, 10));
        setWeight(parseFloat(storedWeight));
      }
      const storedStepCount = await AsyncStorage.getItem('stepCount');
      const storedCoins = await AsyncStorage.getItem('coins');
      const storedDistance = await AsyncStorage.getItem('distance');
      setStepCount(parseInt(storedStepCount, 10) || 0);
      setCoins(parseInt(storedCoins, 10) || 0);
      setDistance(parseFloat(storedDistance) || 0);
    };

    checkUserSettings();
    initializePedometer();
    registerBackgroundTask();
    
    return () => {
      PedometerService.unsubscribe();
    };
  }, []);

  const initializePedometer = async () => {
    try {
      // Load stored step count first
      const storedStepCount = await AsyncStorage.getItem('stepCount');
      const storedDistance = await AsyncStorage.getItem('distance');
      const storedCalories = await AsyncStorage.getItem('caloriesBurned');
      
      // Update state with stored values
      const parsedSteps = parseInt(storedStepCount, 10) || 0;
      setStepCount(parsedSteps);
      setDistance(parseFloat(storedDistance) || 0);
      setCaloriesBurned(parseFloat(storedCalories) || 0);
      
      // Then initialize pedometer with the loaded step count
      await PedometerService.initializeDevice();
      PedometerService.subscribe(handleStepDetected, parsedSteps);
      
      console.log('Pedometer initialized with saved step count:', parsedSteps);
    } catch (error) {
      console.error('Error initializing pedometer:', error);
      // Initialize with zeros as fallback
      await PedometerService.initializeDevice();
      PedometerService.subscribe(handleStepDetected, 0);
    }
  };

  const handleStepDetected = () => {
    setStepCount(prevStepCount => {
      const newStepCount = prevStepCount + 1;
      const newDistance = (newStepCount * STEP_LENGTH) / 1000;
      setDistance(newDistance);
      return newStepCount;
    });
  };

  useEffect(() => {
    // Add app state change listener
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Save stats when component unmounts (app might be closing)
    return () => {
      subscription.remove();
      saveDailyStats();
      console.log('HomeScreen unmounting, saving stats');
    };
  }, [stepCount, caloriesBurned, distance, coins]);

  // App state change handler
  const handleAppStateChange = async (nextAppState) => {
    // When app goes to background
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
      if (lastSavedDate && lastSavedDate !== currentDate) {
        console.log(`New day detected! Last saved: ${lastSavedDate}, Today: ${currentDate}`);
        
        // IMPORTANT: First load the previous day's stats if they exist
        const previousStats = await AsyncStorage.getItem('stepCount');
        const previousCalories = await AsyncStorage.getItem('caloriesBurned');
        const previousDistance = await AsyncStorage.getItem('distance');
        const previousCoins = await AsyncStorage.getItem('coins');
        
        // Create an entry for the previous day using the last saved values
        const previousDayStats = {
          date: lastSavedDate,
          stepCount: parseInt(previousStats || '0', 10),
          caloriesBurned: parseFloat(previousCalories || '0'),
          distance: parseFloat(previousDistance || '0'),
          coins: parseInt(previousCoins || '0', 10)
        };
        
        // Update weekly stats with the previous day's data
        const stats = await AsyncStorage.getItem('weeklyStats');
        const weeklyStats = stats ? JSON.parse(stats) : [];
        
        // Remove any existing entry for the previous day
        const filteredStats = weeklyStats.filter(stat => stat.date !== lastSavedDate);
        
        // Add the previous day's stats and limit to 7 days
        const updatedStats = [previousDayStats, ...filteredStats].slice(0, 7);
        
        // Save the updated weekly stats
        await AsyncStorage.setItem('weeklyStats', JSON.stringify(updatedStats));
        console.log(`Saved stats for previous day (${lastSavedDate}):`, previousDayStats);
        
        // Now reset for the new day
        setStepCount(0);
        setCaloriesBurned(0);
        setDistance(0);
        // Note: Not resetting coins as they accumulate
        
        // Update the last saved date to today
        await AsyncStorage.setItem('lastSavedDate', currentDate);
        console.log('Reset stats for new day');
      } 
      // If not a new day but we were in background, estimate steps
      else if (appBackgroundTime && backgroundStepCount) {
        const currentTime = new Date().getTime();
        const backgroundTime = currentTime - parseInt(appBackgroundTime);
        const minutesInBackground = backgroundTime / (1000 * 60);
        
        if (minutesInBackground > 1) {
          const currentStoredSteps = parseInt(await AsyncStorage.getItem('stepCount') || '0', 10);
          const previousSteps = parseInt(backgroundStepCount, 10);
          
          if (currentStoredSteps > previousSteps) {
            console.log(`Using ${currentStoredSteps - previousSteps} steps from background task`);
            setStepCount(currentStoredSteps);
          } else {
            // Get stored step rate if available
            const storedStepRate = await AsyncStorage.getItem('recentStepRate');
            const recentStepsPerMinute = storedStepRate ? parseFloat(storedStepRate) : 12;
            
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
    try {
      // Save current stats to AsyncStorage
      await AsyncStorage.setItem('stepCount', stepCount.toString());
      await AsyncStorage.setItem('caloriesBurned', caloriesBurned.toString());
      await AsyncStorage.setItem('distance', distance.toString());
      await AsyncStorage.setItem('coins', coins.toString());
      
      console.log('Daily stats saved:', { 
        steps: stepCount, 
        calories: caloriesBurned, 
        distance: distance 
      });
    } catch (error) {
      console.error('Error saving daily stats:', error);
    }
  };

  // Save stats periodically
  // Add this to your HomeScreen component
  useEffect(() => {
    // Save stats every 2 minutes as a safety measure
    const saveInterval = setInterval(() => {
      saveDailyStats();
    }, 120000); // 2 minutes
    
    return () => clearInterval(saveInterval);
  }, [stepCount, caloriesBurned, distance, coins]);
  
  // Save stats when steps change
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      saveDailyStats();
    }, 2000);
    
    return () => clearTimeout(saveTimeout);
  }, [stepCount]);

  // Update calories and coins based on steps
  useEffect(() => {
    const newCaloriesBurned = PedometerService.calculateCaloriesBurned(stepCount, weight);
    setCaloriesBurned(newCaloriesBurned);
    setCoins(Math.floor(stepCount / 100));
  }, [stepCount, weight]);

  // Save stats to AsyncStorage when they change
  useEffect(() => {
    AsyncStorage.setItem('stepCount', stepCount.toString());
    AsyncStorage.setItem('caloriesBurned', caloriesBurned.toString());
    AsyncStorage.setItem('distance', distance.toString());
    AsyncStorage.setItem('coins', coins.toString());
  }, [stepCount, caloriesBurned, distance, coins]);

  const percentage = Math.min(((stepCount / stepGoal) * 100).toFixed(0), 100);

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
          {/* ...existing code... */}
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
          {/* ...existing code... */}
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

        {/* Flower Progress */}
        <View style={styles.flowerCard}>
          {/* ...existing code... */}
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
});

export default HomeScreen;