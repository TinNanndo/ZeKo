import { useState, useEffect } from 'react';
import { Text, View, Alert, PermissionsAndroid, Platform } from 'react-native';
import { Pedometer } from 'expo-sensors';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { BackgroundFetchResult } from 'expo-background-fetch';

import '../../assets/global.css';

const BACKGROUND_STEP_COUNT_TASK = 'BACKGROUND_STEP_COUNT_TASK';

TaskManager.defineTask(BACKGROUND_STEP_COUNT_TASK, async () => {
  try {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 1);

    const pastStepCountResult = await Pedometer.getStepCountAsync(start, end);
    if (pastStepCountResult) {
      // Save the step count to storage or state management
      console.log('Steps in the last 24 hours:', pastStepCountResult.steps);
    }
    return BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Background task error:', error);
    return BackgroundFetchResult.Failed;
  }
});

const registerBackgroundTask = async () => {
  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_STEP_COUNT_TASK, {
      minimumInterval: 15 * 60, // 15 minutes
      stopOnTerminate: false,
      startOnBoot: true,
    });
    console.log('Background task registered');
  } catch (error) {
    console.error('Failed to register background task', error);
  }
};

const requestActivityPermission = async () => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION,
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Activity recognition permission granted');
      } else {
        Alert.alert('Permission Denied', 'Permission to access activity recognition was denied');
        return false;
      }
    } catch (err) {
      console.warn(err);
      return false;
    }
  }
  return true;
};

export default function Index() {
  const [isPedometerAvailable, setIsPedometerAvailable] = useState('checking');
  const [pastStepCount, setPastStepCount] = useState(0);
  const [currentStepCount, setCurrentStepCount] = useState(0);
  const [isSimulating, setIsSimulating] = useState(true); // Add a state for simulation mode

  const requestPermissions = async () => {
    if (Platform.OS === 'ios') {
      const { status } = await Pedometer.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Permission to access motion data is required to count steps. Please enable it in your device settings.',
          [{ text: 'OK' }]
        );
        return false;
      }
    } else if (Platform.OS === 'android') {
      const activityPermissionGranted = await requestActivityPermission();
      if (!activityPermissionGranted) return false;
    }
    return true;
  };

  const subscribe = async () => {
    const permissionGranted = await requestPermissions();
    if (!permissionGranted) return;

    const isAvailable = await Pedometer.isAvailableAsync();
    setIsPedometerAvailable(String(isAvailable));
    console.log('Pedometer available:', isAvailable);

    if (isAvailable) {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 1);

      const pastStepCountResult = await Pedometer.getStepCountAsync(start, end);
      if (pastStepCountResult) {
        setPastStepCount(pastStepCountResult.steps);
      }

      if (isSimulating) {
        // Simulate step counting
        let simulatedSteps = 0;
        setInterval(() => {
          simulatedSteps += Math.floor(Math.random() * 10); // Simulate random steps
          setCurrentStepCount(simulatedSteps);
        }, 1000); // Update every second
      } else {
        return Pedometer.watchStepCount(result => {
          setCurrentStepCount(result.steps);
        });
      }
    }
  };

  useEffect(() => {
    subscribe().then(subscription => {
      return () => subscription && subscription.remove();
    });
    registerBackgroundTask();
  }, []);

  return (
    <View className='bg-[#2E4834]'>
      <Text className='text-white text-lg'>Pedometer.isAvailableAsync(): {isPedometerAvailable}</Text>

      <View className='min-h-screen flex flex-col items-center justify-center p-4 space-y-8'>
        <View className='bg-[#1E3123] rounded-2xl p-5 backdrop-filter backdrop-blur-lg shadow-lg'>
          <Text className='text-center text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4'>Step Counter</Text>
          <Text className='text-center text-4xl sm:text-5xl md:text-6xl font-extrabold text-white'>{currentStepCount}</Text>
          <Text className="text-center text-white text-md sm:text-lg mt-2">Steps Taken</Text>

          <View className="mt-6">
            <Text className='text-center text-3xl sm:text-4xl md:text-5xl font-light text-white mb-4'>/10,000</Text>
          </View>
        </View>
      </View>
    </View>
  );
}