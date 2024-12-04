import React, { useState, useEffect } from 'react';
import { Text, View, SafeAreaView, AppState } from 'react-native';
import { Accelerometer, Gyroscope } from 'expo-sensors';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { useNavigation } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setStepCountSetter, setCoinsSetter } from '../utils/stateManagement';

// IKONE
import SvgCoins from '../../assets/icons/coins.svg';
import SvgNotif from '../../assets/icons/notif.svg';
import SvgSteps from '../../assets/icons/steps.svg';
import SvgCal from '../../assets/icons/cal.svg';
import SvgDist from '../../assets/icons/dist.svg';
import CircularProgress from '../utils/CircularProgress';

const STEP_COUNTER_TASK = 'STEP_COUNTER_TASK';
const STEP = 0.75;

TaskManager.defineTask(STEP_COUNTER_TASK, async ({ data, error }: { data: { steps: number }, error: TaskManager.TaskManagerError | null }) => {
  if (error) {
    console.error(error);
    return;
  }
  if (data) {
    const { steps } = data;
    console.log('Background steps:', steps);
  }
  return Promise.resolve();
});

export default function Index() {
  const [{ x, y, z }, setData] = useState({ x: 0, y: 0, z: 0 });
  const [gyroData, setGyroData] = useState({ x: 0, y: 0, z: 0 });
  const [stepCount, setStepCount] = useState(0);
  const [userName, setUserName] = useState('');
  const [stepGoal, setStepGoal] = useState(10000);
  const [weight, setWeight] = useState(70);
  const [caloriesBurned, setCaloriesBurned] = useState(0);
  const [coins, setCoins] = useState(0);
  const navigation = useNavigation();

  useEffect(() => {
    const checkUserSettings = async () => {
      const name = await AsyncStorage.getItem('userName');
      const storedStepGoal = await AsyncStorage.getItem('stepGoal');
      const storedWeight = await AsyncStorage.getItem('weight');

      if (!name || !storedStepGoal || !storedWeight) {
        navigation.navigate('LoginScreen'); // Change this line
      } else {
        setUserName(name);
        setStepGoal(parseInt(storedStepGoal, 10));
        setWeight(parseFloat(storedWeight));
      }

      const storedStepCount = await AsyncStorage.getItem('stepCount');
      const storedCoins = await AsyncStorage.getItem('coins');
      setStepCount(parseInt(storedStepCount ?? '0', 10) || 0);
      setCoins(parseInt(storedCoins ?? '0', 10));
    };

    checkUserSettings();
  }, []);

  const percentage = Math.min(parseFloat(((stepCount / stepGoal) * 100).toFixed(1)), 100);

  const formatNumber = (number: number) => {
    return new Intl.NumberFormat().format(number);
  };

  return (
    <SafeAreaView className="bg-[#2E4834] flex-1">
      <View className="flex flex-col p-5 space-y-6 pb-24 flex-1">
        <View className="flex flex-row items-center justify-between">
          <View>
            <Text className="text-white text-lg">Hello, {userName || 'User'}!</Text>
            <Text className="text-white text-2xl font-bold">Welcome back</Text>
          </View>

          <View className="bg-[#1E3123] w-28 h-14 p-2 rounded-tl-3xl rounded-br-3xl rounded-tr rounded-bl justify-center">
            <View className="flex-row items-center justify-between">
              <Text className="text-white text-xl font-bold">{coins}</Text>
              <SvgCoins width="19.5" height="24" />
            </View>
          </View>

          <View className="bg-[#1E3123] w-14 h-14 p-5 rounded-full justify-center items-center">
            <SvgNotif width="19.5" height="24" />
          </View>
        </View>

        <View className="bg-[#1E3123] rounded-xl p-5 my-5 shadow-lg flex flex-row justify-between mb-5">
          <View>
            <View className="bg-[#2E4834] w-14 h-14 rounded-full justify-center items-center">
              <SvgSteps width="27.27" height="30" />
            </View>
            <Text className="text-white text-2xl">Steps</Text>
            <View className="flex-row items-center mt-5">
              <CircularProgress percentage={percentage} />
              <Text className="text-white text-lg ml-5">{percentage}%</Text>
            </View>
          </View>
          <View className="flex items-center justify-center mr-6">
            <Text className="text-white text-2xl font-black font-HelveticaNeueBlack mr-16">{formatNumber(stepCount)}</Text>

            <View
              style={{
                height: 1,
                backgroundColor: 'white',
                borderRadius: 1,
                width: 76.28,
                transform: [{ rotate: '-34.32deg' }],
              }}
            />

            <Text className="text-white text-2xl font-thin font-HelveticaNeueThin ml-16">{formatNumber(stepGoal)}</Text>
          </View>
        </View>

        <View className="flex flex-row justify-between mb-5">
          <View className="bg-[#1E3123] rounded-xl p-5 flex-1 mr-2">
            <View className="bg-[#2E4834] w-14 h-14 rounded-full justify-center items-center">
              <SvgCal width="23.44" height="30" />
            </View>
            <Text className="text-white text-2xl">Calories</Text>
            <Text className="text-white text-3xl">{Math.round(caloriesBurned)} cal</Text>
          </View>

          <View className="bg-[#1E3123] rounded-xl p-5 flex-1 ml-2">
            <View className="bg-[#2E4834] w-14 h-14 rounded-full justify-center items-center">
              <SvgDist width="21" height="30" />
            </View>
            <Text className="text-white text-xl">Distance</Text>
            <Text className="text-white text-3xl">{((stepCount * STEP) / 1000).toFixed(1)} km</Text>
          </View>
          </View>

        {/* Progres cvijeta */}
        <View className="bg-[#1E3123] rounded-xl p-5 shadow-lg flex flex-row justify-between mb-5 flex-1">
          <View className='flex-1'>
            <Text className="text-white text-xl font-medium font-HelveticaNeueMedium">Flower</Text>
            <Text className="text-white text-xl font-medium font-HelveticaNeueMedium">progress</Text>
            <View className='mt-5'>
              <Text className="text-white text-right text-xs font-light font-HelveticaNeueLight">25,000 km</Text>

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