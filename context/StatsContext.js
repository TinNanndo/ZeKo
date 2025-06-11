import React, { createContext, useState, useContext, useEffect } from 'react';
import { AppState } from 'react-native'; // Make sure to import AppState from react-native
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STEP_LENGTH } from '../utils/PedometerService';

const StatsContext = createContext();

  // Centralized distance calculation with error handling
  const calculateDistance = (steps) => {
    // Validate input
    if (!steps || isNaN(steps) || steps < 0) {
      return 0;
    }
    
    // Convert to number just to be sure
    const numSteps = Number(steps);
    
    // Calculate with 2 decimal precision
    const distanceKm = (numSteps * STEP_LENGTH) / 1000;
    return parseFloat(distanceKm.toFixed(2));
  };

export const StatsProvider = ({ children }) => {
  const [stepCount, setStepCount] = useState(0);
  const [caloriesBurned, setCaloriesBurned] = useState(0);
  const [distance, setDistance] = useState(0);
  const [coins, setCoins] = useState(0);
  const [weeklyHistory, setWeeklyHistory] = useState([]);
  const [lastSavedDate, setLastSavedDate] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [stepGoal, setStepGoal] = useState(10000); // Add this line


  // Load initial stats
  useEffect(() => {
    const loadStats = async () => {
      try {
        const storedStepCount = await AsyncStorage.getItem('stepCount');
        const storedCaloriesBurned = await AsyncStorage.getItem('caloriesBurned');
        const storedDistance = await AsyncStorage.getItem('distance');
        const storedCoins = await AsyncStorage.getItem('coins');
        const storedWeeklyStats = await AsyncStorage.getItem('weeklyStats');
        const storedLastSavedDate = await AsyncStorage.getItem('lastSavedDate');
        const storedStepGoal = await AsyncStorage.getItem('stepGoal');

        if (storedStepGoal) {
          setStepGoal(parseInt(storedStepGoal, 10));
        }

        setStepCount(parseInt(storedStepCount, 10) || 0);
        setCaloriesBurned(parseFloat(storedCaloriesBurned) || 0);
        setDistance(parseFloat(storedDistance) || 0);
        setCoins(parseInt(storedCoins, 10) || 0);
        
        // Initialize weekly history from weeklyStats (use this as the main storage)
        const parsedWeeklyStats = storedWeeklyStats ? JSON.parse(storedWeeklyStats) : [];
        setWeeklyHistory(parsedWeeklyStats);
        setLastSavedDate(storedLastSavedDate || new Date().toISOString().split('T')[0]);
        
        console.log('Stats loaded from storage:', {
          steps: storedStepCount,
          lastSavedDate: storedLastSavedDate,
          weeklyStats: parsedWeeklyStats
        });
        
        setIsInitialized(true);
        setIsReady(true);
        console.log('Stats fully loaded and ready');
      } catch (error) {
        console.error('Error loading stats:', error);
        setIsInitialized(true);
        setIsReady(true);
      }
    };

    loadStats();
  }, []);

    const updateStepGoal = (newGoal) => {
    setStepGoal(newGoal);
    AsyncStorage.setItem('stepGoal', newGoal.toString());
  };

  // Function to update coins and persist the change
const updateCoins = (newAmount) => {
  setCoins(newAmount);
  AsyncStorage.setItem('coins', newAmount.toString());
};

const addCoinsFromSteps = async (newSteps, prevSteps) => {
  const additionalSteps = Math.max(0, newSteps - prevSteps);
  const additionalCoins = Math.floor(additionalSteps / 100);

  if (additionalCoins > 0) {
    const updatedCoins = coins + additionalCoins;
    setCoins(updatedCoins);
    await AsyncStorage.setItem('coins', updatedCoins.toString());
    await AsyncStorage.setItem('lastCoinStepCount', newSteps.toString());
    console.log(`Added ${additionalCoins} coins from ${additionalSteps} new steps`);
  }
};


// Save current stats to AsyncStorage
useEffect(() => {
  if (isInitialized) {
    AsyncStorage.setItem('stepCount', stepCount.toString());
    AsyncStorage.setItem('caloriesBurned', caloriesBurned.toString());
    AsyncStorage.setItem('distance', distance.toString());
    AsyncStorage.setItem('coins', coins.toString());
  }
}, [stepCount, caloriesBurned, distance, coins, isInitialized]);

// Save weekly history to AsyncStorage
useEffect(() => {
  if (isInitialized && weeklyHistory.length > 0) {
    AsyncStorage.setItem('weeklyStats', JSON.stringify(weeklyHistory));
    console.log('Weekly stats saved to storage:', weeklyHistory);
  }
}, [weeklyHistory, isInitialized]);

// Save last saved date to AsyncStorage
useEffect(() => {
  if (isInitialized && lastSavedDate) {
    AsyncStorage.setItem('lastSavedDate', lastSavedDate);
  }
}, [lastSavedDate, isInitialized]);

  const saveCurrentStatsToHistory = async () => {
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Only save if we have meaningful data
    if (stepCount > 0 || caloriesBurned > 0 || distance > 0) {
      // Create new stats entry
      const dailyStats = {
        date: currentDate,
        stepCount,
        caloriesBurned,
        distance,
        coins
      };
      
      console.log('Saving stats for date:', currentDate, dailyStats);

      // Update weekly history, replacing existing entry for today if it exists
      setWeeklyHistory(prevHistory => {
        const filteredHistory = prevHistory.filter(entry => entry.date !== currentDate);
        const updatedHistory = [dailyStats, ...filteredHistory];
        
        // Keep only last 7 days (or however many days you want to track)
        return updatedHistory.slice(0, 7);
      });
    }
  };

const resetDailyStats = async () => {
  try {
    await saveCurrentStatsToHistory();

    setStepCount(0);
    setCaloriesBurned(0);
    setDistance(0);

    await AsyncStorage.setItem('stepCount', '0');
    await AsyncStorage.setItem('caloriesBurned', '0');
    await AsyncStorage.setItem('distance', '0');

    const today = new Date().toISOString().split('T')[0];
    await AsyncStorage.setItem('lastSavedDate', today);
    setLastSavedDate(today);

    console.log('Daily stats successfully reset for new day');
  } catch (error) {
    console.error('Error resetting daily stats:', error);
  }
};

   
const checkForNewDay = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get the last saved date directly from storage to ensure freshness
    const storedLastSavedDate = await AsyncStorage.getItem('lastSavedDate');
    
    console.log(`Checking for day change: Last saved: ${storedLastSavedDate || 'none'}, Today: ${today}`);
    
    if (!storedLastSavedDate || storedLastSavedDate !== today) {
      console.log(`New day detected! Last saved: ${storedLastSavedDate}, Today: ${today}`);
      
      // Save current stats before resetting
      await saveCurrentStatsToHistory();
      
      // Reset the step count and related metrics to 0
      setStepCount(0);
      setCaloriesBurned(0);
      setDistance(0);
      
      // Update storage directly to ensure it's reset
      await AsyncStorage.setItem('stepCount', '0');
      await AsyncStorage.setItem('caloriesBurned', '0');
      await AsyncStorage.setItem('distance', '0');
      
      // Reset the pedometer tracking for flower growth
      await AsyncStorage.setItem('lastTrackedStepCount', '0');
      
      // Update the last saved date to today
      await AsyncStorage.setItem('lastSavedDate', today);
      setLastSavedDate(today);
      
      console.log('Daily stats reset for new day');
      
      // Force reset of pedometer service
      return true; // Return true to indicate a day change happened
    }
    return false; // No day change
  } catch (error) {
    console.error('Error checking for new day:', error);
    return false;
  }
};

// Replace this useEffect block
useEffect(() => {
  // Check for app state changes for day change detection
  const handleAppStateChange = async (nextAppState) => {
    if (nextAppState === 'active' && isInitialized) {
      console.log('App came to foreground, checking for day change');
      await checkForNewDay();
    }
  };

  // Use a try-catch to handle potential missing AppState.addEventListener
  try {
    // Compatible with both older and newer React Native versions
    if (typeof AppState.addEventListener === 'function') {
      // Modern API (React Native 0.65+)
      const subscription = AppState.addEventListener('change', handleAppStateChange);
      return () => {
        subscription.remove();
      };
    } else {
      // Legacy API
      AppState.addEventListener('change', handleAppStateChange);
      return () => {
        AppState.removeEventListener('change', handleAppStateChange);
      };
    }
  } catch (error) {
    console.error('Error setting up AppState listener:', error);
    
    // Fallback to just interval checks if AppState API fails
    return () => {};
  }
}, [isInitialized]);

// Add this new useEffect after your AppState listener
useEffect(() => {
  if (!isInitialized) return;
  
  // Check for day change every 15 minutes
  const intervalCheck = setInterval(async () => {
    console.log('Performing periodic day change check');
    await checkForNewDay();
  }, 15 * 60 * 1000); // 15 minutes
  
  // Run once immediately after initialization
  checkForNewDay();
  
  return () => clearInterval(intervalCheck);
}, [isInitialized]);

// Update step count and recalculate distance correctly
// Update step count and recalculate distance correctly
const updateStepCount = (newStepCount) => {
  // Always recalculate distance when steps change
  const newDistance = calculateDistance(newStepCount);
  
  console.log(`Updating steps to ${newStepCount}, new distance: ${newDistance.toFixed(2)}km`);
  
  // Set both state values
  setStepCount(newStepCount);
  setDistance(newDistance);
  
  // Save both to storage
  AsyncStorage.setItem('stepCount', newStepCount.toString());
  AsyncStorage.setItem('distance', newDistance.toString());
};

const updateLastTrackedStepCount = async () => {
  await AsyncStorage.setItem('lastTrackedStepCount', stepCount.toString());
  console.log(`lastTrackedStepCount updated to ${stepCount}`);
};


return (
  <StatsContext.Provider
    value={{
      stepCount,
      setStepCount: updateStepCount, // Replace direct setter with our function
      updateStepCount,
      caloriesBurned,
      setCaloriesBurned,
      distance,
      setDistance,
      coins,
      setCoins: updateCoins,
      addCoinsFromSteps,
      weeklyHistory,
      resetDailyStats,
      saveCurrentStatsToHistory,
      isReady,
      calculateDistance, // Export the calculation function
      stepGoal, // Add this
      setStepGoal: updateStepGoal,
      checkForNewDay,
      updateLastTrackedStepCount
    }}
  >
    {children}
  </StatsContext.Provider>
);
};

export const useStats = () => useContext(StatsContext);
export default StatsContext;