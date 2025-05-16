import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const StatsContext = createContext();

export const StatsProvider = ({ children }) => {
  const [stepCount, setStepCount] = useState(0);
  const [caloriesBurned, setCaloriesBurned] = useState(0);
  const [distance, setDistance] = useState(0);
  const [coins, setCoins] = useState(0);
  const [weeklyHistory, setWeeklyHistory] = useState([]);
  const [lastSavedDate, setLastSavedDate] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isReady, setIsReady] = useState(false);


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
    // Make sure to await the save operation before resetting
    await saveCurrentStatsToHistory();
    
    // Now reset the daily counters
    setStepCount(0);
    setCaloriesBurned(0);
    setDistance(0);
    // Note: Not resetting coins as they accumulate
    
    // Update the last saved date to today
    const today = new Date().toISOString().split('T')[0];
    setLastSavedDate(today);
    
    console.log('Daily stats reset for new day');
  };

  // Check if we need to reset stats for a new day
  useEffect(() => {
    if (!isInitialized) return;
    
    const checkForNewDay = async () => {
      const today = new Date().toISOString().split('T')[0];
      
      if (lastSavedDate && lastSavedDate !== today) {
        console.log(`New day detected! Last saved: ${lastSavedDate}, Today: ${today}`);
        await resetDailyStats();
      }
    };
    
    checkForNewDay();
    
    // Check every hour
    const intervalId = setInterval(checkForNewDay, 60 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [lastSavedDate, isInitialized]);

  return (
    <StatsContext.Provider
      value={{
        stepCount,
        setStepCount,
        caloriesBurned,
        setCaloriesBurned,
        distance,
        setDistance,
        coins,
        setCoins,
        weeklyHistory,
        resetDailyStats,
        saveCurrentStatsToHistory,
        isReady
      }}
    >
      {children}
    </StatsContext.Provider>
  );
};

export const useStats = () => useContext(StatsContext);
export default StatsContext;