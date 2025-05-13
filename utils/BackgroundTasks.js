import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STEP_LENGTH } from './PedometerService';

export const STEP_COUNTER_TASK = 'STEP_COUNTER_TASK';

// Define the background task for step counting
TaskManager.defineTask(STEP_COUNTER_TASK, async ({ data, error }) => {
  if (error) {
    console.error(error);
    return BackgroundFetch.Result.Failed;
  }
  
  try {
    // Get current step count
    const storedStepCount = await AsyncStorage.getItem('stepCount');
    const currentStepCount = parseInt(storedStepCount || '0', 10);
    
    // Get current distance and calories
    const storedDistance = await AsyncStorage.getItem('distance');
    const storedCalories = await AsyncStorage.getItem('caloriesBurned');
    const currentDistance = parseFloat(storedDistance || '0');
    const currentCalories = parseFloat(storedCalories || '0');
    
    // Get user weight for calorie calculation
    const storedWeight = await AsyncStorage.getItem('weight');
    const weight = parseFloat(storedWeight || '70');
    
    // Get last background check time
    const lastBackgroundCheck = await AsyncStorage.getItem('lastBackgroundCheck');
    const currentTime = new Date().getTime();
    
    // Check for day change
    const currentDate = new Date().toISOString().split('T')[0];
    const lastSavedDate = await AsyncStorage.getItem('lastSavedDate');
    
    // If day changed, save yesterday's stats and reset
    if (lastSavedDate && lastSavedDate !== currentDate) {
      console.log(`Background task detected day change: ${lastSavedDate} -> ${currentDate}`);
      
      // Create an entry for the previous day
      const previousDayStats = {
        date: lastSavedDate,
        stepCount: currentStepCount,
        caloriesBurned: currentCalories,
        distance: currentDistance,
        coins: parseInt(await AsyncStorage.getItem('coins') || '0', 10)
      };
      
      // Update weekly stats
      const stats = await AsyncStorage.getItem('weeklyStats');
      const weeklyStats = stats ? JSON.parse(stats) : [];
      const filteredStats = weeklyStats.filter(stat => stat.date !== lastSavedDate);
      const updatedStats = [previousDayStats, ...filteredStats].slice(0, 7);
      
      // Save updated weekly stats
      await AsyncStorage.setItem('weeklyStats', JSON.stringify(updatedStats));
      console.log(`Background task saved stats for previous day: ${lastSavedDate}`);
      
      // Reset for new day
      await AsyncStorage.setItem('stepCount', '0');
      await AsyncStorage.setItem('caloriesBurned', '0');
      await AsyncStorage.setItem('distance', '0');
      await AsyncStorage.setItem('lastSavedDate', currentDate);
      
      // Set variables to zero for this execution
      return BackgroundFetch.Result.NewData;
    }
    
    // If we have a previous check time, calculate elapsed time
    if (lastBackgroundCheck) {
      const elapsedMinutes = (currentTime - parseInt(lastBackgroundCheck)) / (1000 * 60);
      
      // Get the user's recent walking patterns from storage
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
      
      // Calculate and update distance
      const addedDistance = (estimatedSteps * STEP_LENGTH) / 1000; // km
      const newDistance = currentDistance + addedDistance;
      await AsyncStorage.setItem('distance', newDistance.toString());
      
      // Calculate and update calories
      const caloriesPerKgPerStep = 0.0005;
      const addedCalories = weight * caloriesPerKgPerStep * estimatedSteps;
      const newCalories = currentCalories + addedCalories;
      await AsyncStorage.setItem('caloriesBurned', newCalories.toString());
      
      console.log(`Background task: added ${estimatedSteps} steps, ${addedDistance.toFixed(2)}km, ${addedCalories.toFixed(1)} cal`);
    }
    
    // Update last background check time
    await AsyncStorage.setItem('lastBackgroundCheck', currentTime.toString());
    
    return BackgroundFetch.Result.NewData;
  } catch (error) {
    console.error('Error in background task:', error);
    return BackgroundFetch.Result.Failed;
  }
});

export const registerBackgroundTask = async () => {
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