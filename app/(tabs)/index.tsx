import { useState, useEffect } from 'react';
import { Text, View } from 'react-native';
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

export default function Index() {
  const [isPedometerAvailable, setIsPedometerAvailable] = useState('checking');
  const [pastStepCount, setPastStepCount] = useState(0);
  const [currentStepCount, setCurrentStepCount] = useState(0);

  const subscribe = async () => {
    const isAvailable = await Pedometer.isAvailableAsync();
    setIsPedometerAvailable(String(isAvailable));

    if (isAvailable) {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 1);

      const pastStepCountResult = await Pedometer.getStepCountAsync(start, end);
      if (pastStepCountResult) {
        setPastStepCount(pastStepCountResult.steps);
      }

      return Pedometer.watchStepCount(result => {
        setCurrentStepCount(result.steps);
      });
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