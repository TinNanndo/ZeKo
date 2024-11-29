import React, { useState, useEffect } from 'react';
import { Text, View, TouchableOpacity, Button } from 'react-native';
import { Accelerometer, Gyroscope } from 'expo-sensors';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import '../../assets/global.css'
import { useNavigation } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STEP_COUNTER_TASK = 'STEP_COUNTER_TASK';
const STEP = 0.75;

TaskManager.defineTask(STEP_COUNTER_TASK, ({ data, error }) => {
  if (error) {
    console.error(error);
    return;
  }
  if (data) {
    const { steps } = data;
    console.log('Background steps:', steps);
  }
});

export default function Index() {
  const [{ x, y, z }, setData] = useState({ x: 0, y: 0, z: 0 });
  const [gyroData, setGyroData] = useState({ x: 0, y: 0, z: 0 });
  const [subscription, setSubscription] = useState(null);
  const [gyroSubscription, setGyroSubscription] = useState(null);
  const [stepCount, setStepCount, stepDistance] = useState(0);
  const [lastAcceleration, setLastAcceleration] = useState({ x: 0, y: 0, z: 0 });
  const [lastPeakTime, setLastPeakTime] = useState(0);
  const navigation = useNavigation();
  const [userName, setUserName] = useState('');
  const [stepGoal, setStepGoal] = useState(10000); // Default step goal
  const [weight, setWeight] = useState(70); // Default weight in kg
  const [caloriesBurned, setCaloriesBurned] = useState(0);

  useEffect(() => {
    const checkUserSettings = async () => {
      const name = await AsyncStorage.getItem('userName');
      const storedStepGoal = await AsyncStorage.getItem('stepGoal');
      const storedWeight = await AsyncStorage.getItem('weight');
      if (!name || !storedStepGoal || !storedWeight) {
        navigation.navigate('login');
      } else {
        setUserName(name);
        setStepGoal(parseInt(storedStepGoal, 10)); // Set step goal from storage
        setWeight(parseFloat(storedWeight)); // Set weight from storage
      }
    };

    checkUserSettings();
    _subscribe();
    startBackgroundTask();
    return () => {
      _unsubscribe();
    };
  }, []);

  useEffect(() => {
    const caloriesPerStep = calculateCaloriesPerStep(weight);
    setCaloriesBurned(stepCount * caloriesPerStep);
  }, [stepCount, weight]);

  const calculateCaloriesPerStep = (weight) => {
    // Average calories burned per step for different weights
    // This is a simplified calculation and can be adjusted
    const caloriesPerKgPerStep = 0.0005; // Example value
    return weight * caloriesPerKgPerStep;
  };

  const clearDataAndLogout = async () => {
    await AsyncStorage.clear();
    navigation.navigate('login');
  };

  const _subscribe = () => {
    setSubscription(
      Accelerometer.addListener(acceleration => {
        setData(acceleration);
        detectStep(acceleration, gyroData);
      })
    );
    setGyroSubscription(
      Gyroscope.addListener(gyro => {
        setGyroData(gyro);
      })
    );
    Accelerometer.setUpdateInterval(100); // Set update interval to 100ms
    Gyroscope.setUpdateInterval(100); // Set update interval to 100ms
  };

  const _unsubscribe = () => {
    subscription && subscription.remove();
    gyroSubscription && gyroSubscription.remove();
    setSubscription(null);
    setGyroSubscription(null);
  };

  const detectStep = (acceleration, gyroData) => {
    const alpha = 0.2; // Adjusted filter strength for smoothing
    const filteredAcceleration = {
      x: alpha * lastAcceleration.x + (1 - alpha) * acceleration.x,
      y: alpha * lastAcceleration.y + (1 - alpha) * acceleration.y,
      z: alpha * lastAcceleration.z + (1 - alpha) * acceleration.z,
    };

    const deltaX = Math.abs(filteredAcceleration.x - lastAcceleration.x);
    const deltaY = Math.abs(filteredAcceleration.y - lastAcceleration.y);
    const deltaZ = Math.abs(filteredAcceleration.z - lastAcceleration.z);

    const magnitude = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);

    const currentTime = Date.now();
    const timeSinceLastPeak = currentTime - lastPeakTime;

    // Free fall detection (magnitude close to zero)
    if (magnitude < 0.2) {
      console.log('Free fall detected, ignoring...');
      return;
    }

    // Impact detection (sudden large change in acceleration)
    if (magnitude > 3.0) {
      console.log('Impact detected, ignoring...');
      return;
    }

    // Gyroscope data to detect rotational movements
    const gyroMagnitude = Math.sqrt(gyroData.x * gyroData.x + gyroData.y * gyroData.y + gyroData.z * gyroData.z);
    if (gyroMagnitude > 1.0) {
      console.log('Rotational movement detected, ignoring...');
      return;
    }

    // Shaking detection (rapid changes in acceleration)
    if (deltaX > 1.5 || deltaY > 1.5 || deltaZ > 1.5) {
      console.log('Shaking detected, ignoring...');
      return;
    }

    // Adjusted threshold and time interval
    if (magnitude > 1.2 && timeSinceLastPeak > 300) {
      setStepCount(prevStepCount => {
        const newStepCount = prevStepCount + 1;
        console.log('Step Count (Accelerometer):', newStepCount); // Log step count to terminal
        return newStepCount;
      });
      setLastPeakTime(currentTime);
    }

    setLastAcceleration(filteredAcceleration);
  };

  const resetSteps = () => {
    setStepCount(1400);
    console.log('Step Count reset to 0'); // Log reset action to terminal
  };

  const startBackgroundTask = async () => {
    await BackgroundFetch.registerTaskAsync(STEP_COUNTER_TASK, {
      minimumInterval: 60, // Run every minute
      stopOnTerminate: false,
      startOnBoot: true,
    });
    console.log('Background task registered');
  };

  return (
    <View className="bg-[#2E4834] min-h-screen flex flex-col p-5 space-y-6">
      <View className="flex items-center justify-between">
        <Text className="text-white text-xl">Hello, {userName}!</Text>
        <Text className="text-white text-lg font-bold">1950</Text>
      </View>

      <Text className="text-white text-3xl font-bold">Welcome back</Text>

      {/* Kartica za korake */}
      <View className="bg-[#1E3123] rounded-xl p-5 my-5 shadow-lg flex flex-row justify-between">
        <View>
          <Text className="text-white text-2xl">Steps</Text>
          <Text className="text-white text-lg">{((stepCount / stepGoal) * 100).toFixed(1)}%</Text>
          
        </View>

        <View>
          <Text className="text-white text-4xl font-bold">{stepCount}</Text>
          <Text className="text-white">/{stepGoal}</Text>
        </View>
      </View>

      {/* Druge kartice */}
      <View className="flex flex-row justify-between mb-5">
        <View className="bg-[#1E3123] rounded-xl p-5 flex-1 mr-2">
          <Text className="text-white text-xl">Calories</Text>
          <Text className="text-white text-3xl font-bold">{caloriesBurned} kcal</Text> {/* Update this line */}
        </View>
        <View className="bg-[#1E3123] rounded-xl p-5 flex-1 ml-2">
          <Text className="text-white text-xl">Distance</Text>
          <Text className="text-white text-3xl font-bold">{(((stepCount * STEP)/1000).toFixed(1))} km</Text>
        </View>
      </View>

      {/* Progres cvijeta */}
      <View className="bg-[#1E3123] rounded-xl p-5 shadow-lg mb-5">
        <Text className="text-white text-xl">Flower progress</Text>
        <View className="bg-white h-2 rounded-full mt-2">
          <View
            style={{ width: `${(stepCount / 25000) * 100}%` }}
            className="bg-[#2E4834] h-full rounded-full"
          />
        </View>
        <Text className="text-white text-lg mt-2">25,000 km</Text>
      </View>

      <TouchableOpacity className=' bg-[#1E3123] rounded-xl shadow-lg p-5 mb-5' onPress={resetSteps}>
        <Text className='text-white text-lg mt-2 text-center'>Restart</Text>
      </TouchableOpacity>
    
      <TouchableOpacity className=' bg-[#1E3123] rounded-xl shadow-lg p-5' onPress={clearDataAndLogout}>
        <Text className='text-white text-lg mt-2 text-center'>Logout</Text>
      </TouchableOpacity>
    </View>

  );
}