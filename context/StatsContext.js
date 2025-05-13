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

  useEffect(() => {
    const loadStats = async () => {
      const storedStepCount = await AsyncStorage.getItem('stepCount');
      const storedCaloriesBurned = await AsyncStorage.getItem('caloriesBurned');
      const storedDistance = await AsyncStorage.getItem('distance');
      const storedCoins = await AsyncStorage.getItem('coins');
      const storedWeeklyHistory = await AsyncStorage.getItem('weeklyHistory');
      const storedLastSavedDate = await AsyncStorage.getItem('lastSavedDate');

      setStepCount(parseInt(storedStepCount, 10) || 0);
      setCaloriesBurned(parseFloat(storedCaloriesBurned) || 0);
      setDistance(parseFloat(storedDistance) || 0);
      setCoins(parseInt(storedCoins, 10) || 0);
      setWeeklyHistory(storedWeeklyHistory ? JSON.parse(storedWeeklyHistory) : []);
      setLastSavedDate(storedLastSavedDate || null);
    };

    loadStats();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('stepCount', stepCount.toString());
    AsyncStorage.setItem('caloriesBurned', caloriesBurned.toString());
    AsyncStorage.setItem('distance', distance.toString());
    AsyncStorage.setItem('coins', coins.toString());
  }, [stepCount, caloriesBurned, distance, coins]);

  useEffect(() => {
    if (weeklyHistory.length > 0) {
      AsyncStorage.setItem('weeklyHistory', JSON.stringify(weeklyHistory));
    }
  }, [weeklyHistory]);

  useEffect(() => {
    if (lastSavedDate) {
      AsyncStorage.setItem('lastSavedDate', lastSavedDate);
    }
  }, [lastSavedDate]);

  const saveCurrentStatsToHistory = () => {
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Create new weekly entry
    const weeklyEntry = {
      date: currentDate,
      stepCount,
      caloriesBurned,
      distance,
      coins
    };

    // Add to history, keeping only the last 4 weeks
    setWeeklyHistory(prevHistory => {
      const updatedHistory = [weeklyEntry, ...prevHistory];
      return updatedHistory.slice(0, 4); // Keep only last 4 weeks
    });
    
    setLastSavedDate(currentDate);
  };

  const resetDailyStats = () => {
    // Save current stats to history before resetting
    saveCurrentStatsToHistory();
    
    // Reset daily counters
    setStepCount(0);
    setCaloriesBurned(0);
    setDistance(0);
    // Note: Not resetting coins as they accumulate
  };

  // Check if we need to reset stats for a new day
  useEffect(() => {
    const checkForNewDay = () => {
      const currentDate = new Date().toISOString().split('T')[0];
      
      if (lastSavedDate && lastSavedDate !== currentDate) {
        resetDailyStats();
      } else if (!lastSavedDate) {
        setLastSavedDate(currentDate);
      }
    };
    
    checkForNewDay();
    
    // Check daily at midnight
    const intervalId = setInterval(checkForNewDay, 60 * 60 * 1000); // Check every hour
    
    return () => clearInterval(intervalId);
  }, [lastSavedDate]);

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
        saveCurrentStatsToHistory
      }}
    >
      {children}
    </StatsContext.Provider>
  );
};

export const useStats = () => useContext(StatsContext);
export default StatsContext;