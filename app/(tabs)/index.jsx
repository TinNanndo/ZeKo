import React, { useState, useEffect } from 'react';
import { Text, View, SafeAreaView, AppState } from 'react-native'; // Import SafeAreaView and AppState
import { Accelerometer, Gyroscope } from 'expo-sensors';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import '../../assets/global.css'; // Ensure this import is correct
import { useNavigation } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStats } from '../context/StatsContext';

// IKONE
import SvgCoins from '../../assets/icons/coins.svg';
import SvgNotif from '../../assets/icons/notif.svg';
import SvgSteps from '../../assets/icons/steps.svg';
import SvgCal from '../../assets/icons/cal.svg';
import SvgDist from '../../assets/icons/dist.svg';
import CircularProgress from '../utils/CircularProgress';

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

function IndexComponent() {
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
      const storedStepCount = await AsyncStorage.getItem('stepCount');
      const storedCoins = await AsyncStorage.getItem('coins');
      setStepCount(parseInt(storedStepCount, 10) || 0);
      setCoins(parseInt(storedCoins, 10) || 0);
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
    if (appState.match(/inactive|background/) && nextAppState === 'active') {
      const currentDate = new Date().toISOString().split('T')[0];
      const lastSavedDate = await AsyncStorage.getItem('lastSavedDate');
      if (lastSavedDate !== currentDate) {
        await saveDailyStats();
        setStepCount(0);
        await AsyncStorage.setItem('lastSavedDate', currentDate);
      }
    }
    setAppState(nextAppState);
  };

  const saveDailyStats = async () => {
    const currentDate = new Date().toISOString().split('T')[0];
    const stats = await AsyncStorage.getItem('weeklyStats');
    const weeklyStats = stats ? JSON.parse(stats) : [];
    weeklyStats.push({ date: currentDate, steps: stepCount });
    if (weeklyStats.length > 7) {
      weeklyStats.shift(); // Keep only the last 7 days
    }
    await AsyncStorage.setItem('weeklyStats', JSON.stringify(weeklyStats));
  };

  useEffect(() => {
    const caloriesPerStep = calculateCaloriesPerStep(weight);
    const newCaloriesBurned = stepCount * caloriesPerStep;
    setCaloriesBurned(newCaloriesBurned);
    setDistance(((stepCount * STEP) / 1000).toFixed(1));
    setCoins(Math.floor(stepCount / 100)); // Update coins based on step count
  }, [stepCount, weight]);

  useEffect(() => {
    AsyncStorage.setItem('stepCount', stepCount.toString());
    AsyncStorage.setItem('coins', coins.toString());
  }, [stepCount, coins]);

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
      Accelerometer.setUpdateInterval(100); // Set update interval to 100ms
    }
    if (!gyroSubscription) {
      setGyroSubscription(
        Gyroscope.addListener(gyro => {
          setGyroData(gyro);
        })
      );
      Gyroscope.setUpdateInterval(100); // Set update interval to 100ms
    }
  };

  const _unsubscribe = () => {
    subscription && subscription.remove();
    gyroSubscription && gyroSubscription.remove();
    setSubscription(null);
    setGyroSubscription(null);
  };

  const detectStep = (acceleration, gyroData) => {
    const alpha = 0.25; // Adjusted filter strength for smoothing
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

  const startBackgroundTask = async () => {
    await BackgroundFetch.registerTaskAsync(STEP_COUNTER_TASK, {
      minimumInterval: 60, // Run every minute
      stopOnTerminate: false,
      startOnBoot: true,
    });
    console.log('Background task registered');
  };

  const percentage = Math.min(((stepCount / stepGoal) * 100).toFixed(0), 100); // Ensure percentage does not exceed 100

  const formatNumber = (number) => {
    return new Intl.NumberFormat().format(number);
  };

  return (
    <SafeAreaView className="bg-[#2E4834] flex-1">
      <View className="flex flex-col p-5 space-y-6 pb-24 flex-1">
        <View className="flex flex-row items-center justify-between">
        <View className=''>
          <Text className="text-white text-lg font-roman font-HelveticaNeueMedium">
            Hello, {userName || 'User'}!
          </Text>
          <Text className="text-white text-2xl font-bold font-HelveticaNeueBold -mt-1">
            Welcome back
          </Text>
        </View>


          <View className='bg-[#1E3123] w-28 h-14 p-2 rounded-tl-3xl rounded-br-3xl rounded-tr rounded-bl justify-center'>
            <View className="flex-row items-center justify-between">
              <Text className="text-white text-xl font-bold font-HelveticaNeueBold ml-2">{coins}</Text>
              <SvgCoins width="19.5" height="24" />
            </View>
          </View>

          <View className='bg-[#1E3123] w-14 h-14 p-5 rounded-full justify-center items-center'>
            <SvgNotif width="19.5" height="24" />
          </View>
        </View>

        {/* Kartica za korake */}
        <View className="bg-[#1E3123] rounded-xl p-5 my-5 shadow-lg flex flex-row justify-between mb-5">
          <View className='flex justify-center items-center'>
            <View className='flex flex-row items-center'>
              <View className="bg-[#2E4834] w-14 h-14 rounded-full justify-center items-center">
                <SvgSteps width="27.27" height="30"/>
              </View>

              <Text className="text-white text-2xl ml-5 font-roman font-HelveticaNeueRoman">Steps</Text>
            </View>
            
            <View className="flex flex-row items-center mt-5 right-[15]">
              <CircularProgress percentage={percentage} />
              <Text className="text-white text-2xl ml-5 font-thin font-HelveticaNeueThin">{percentage}%</Text>
            </View>

          </View>

          <View className="flex items-center justify-center mr-6">
          <Text className="text-white text-2xl font-black font-HelveticaNeueBlack mr-16">
            {formatNumber(stepCount)}
          </Text>

            <View
              style={{
                height: 1,
                backgroundColor: 'white',
                borderRadius: 1,
                width: 76.28,
                transform: [{ rotate: '-34.32deg' }],
              }}
            />

            <Text className="text-white text-2xl font-thin font-HelveticaNeueThin ml-16">
              {formatNumber(stepGoal)}
            </Text>
          </View>
        </View>

        {/* Druge kartice */}
        <View className="flex flex-row justify-between mb-5">
          <View className="bg-[#1E3123] rounded-xl p-5 flex-1 mr-2">
            <View className="bg-[#2E4834] w-14 h-14 rounded-full justify-center items-center">
              <SvgCal width="23.44" height="30"/>
            </View>

            <View className='mt-5 ml-5'>
              <Text className="text-white text-2xl font-roman font-HelveticaNeueRoman">Calories</Text>
              <Text className="text-white text-3xl font-thin font-HelveticaNeueThin"><Text className='font-HelveticaNeueBlack font-black'>{Math.round(caloriesBurned)}</Text> cal</Text>
            </View>
          </View>

          <View className="bg-[#1E3123] rounded-xl p-5 flex-1 ml-2">
            <View className="bg-[#2E4834] w-14 h-14 rounded-full justify-center items-center">
              <SvgDist width="21" height="30"/>
            </View>

            <View className='mt-5 ml-5'>
              <Text className="text-white text-xl font-roman font-HelveticaNeueRoman">Distance</Text>
              <Text className="text-white text-3xl font-thin font-HelveticaNeueThin"><Text className='font-HelveticaNeueBlack font-black'>{(((stepCount * STEP)/1000).toFixed(1))}</Text> km</Text>
            </View>
          </View>
        </View>

        {/* Progres cvijeta */}
        <View className="bg-[#1E3123] rounded-xl p-5 shadow-lg flex flex-row justify-between mb-5 flex-1">
          <View className='flex-1'>
            <Text className="text-white text-xl font-medium font-HelveticaNeueMedium">Flower</Text>
            <Text className="text-white text-xl font-medium font-HelveticaNeueMedium">progress</Text>
            <View className='mt-5'>
              <Text className="text-white text-right text-xs font-light font-HelveticaNeueLight">
                25,000 km
              </Text>
              <View className="bg-[#2E4834] h-6 rounded-full mt-2">
                <View
                  style={{ width: `${Math.min((stepCount / 25000) * 100, 100)}%` }}
                  className="bg-white h-full rounded-full"
                />
              </View>
            </View>
          </View>
          <View className='bg-[#2E4834] w-2/4 h-full ml-5 rounded'></View>
        </View>

      </View>
    </SafeAreaView>
  );
}

export default function Index() {
  return (
    <SafeAreaView className="bg-[#2E4834] flex-1">
      <IndexComponent />
    </SafeAreaView>
  );
}