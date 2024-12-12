import React, { useState, useEffect } from 'react';
import { Text, View, SafeAreaView, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStats } from '../context/StatsContext';
import CircularProgress from '../utils/RectProgress';
import RectProgress from '../utils/RectProgress';

export default function StatsScreen() {
  const [weeklyStats, setWeeklyStats] = useState([]);
  const [stepGoal, setStepGoal] = useState(10000); // Default step goal
  const { stepCount, caloriesBurned, distance, coins } = useStats(); // Use stepCount from context

  useEffect(() => {
    const fetchWeeklyStats = async () => {
      const stats = await AsyncStorage.getItem('weeklyStats');
      if (stats) {
        const parsedStats = JSON.parse(stats);
        console.log('Fetched weekly stats:', parsedStats); // Debug logging
        setWeeklyStats(parsedStats);
      } else {
        console.log('No weekly stats found'); // Debug logging
      }
    };

    const fetchStepGoal = async () => {
      const storedStepGoal = await AsyncStorage.getItem('stepGoal');
      setStepGoal(parseInt(storedStepGoal, 10) || 10000); // Default to 10000 if not set
    };

    fetchWeeklyStats();
    fetchStepGoal();
  }, []);

  const daysOfWeek = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const getDateForDay = (dayIndex) => {
    const today = new Date();
    const currentDay = today.getDay();
    const distanceToMonday = (currentDay + 6) % 7; // Calculate distance to Monday (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const monday = new Date(today);
    monday.setDate(today.getDate() - distanceToMonday); // Set date to the Monday of the current week
    const date = new Date(monday);
    date.setDate(monday.getDate() + dayIndex); // Adjust date based on the day index
    return date.getDate(); // Return only the day part (DD)
  };

  const percentage = Math.min(((stepCount / stepGoal) * 100).toFixed(1), 100); // Ensure percentage does not exceed 100

  const formatNumber = (number) => {
    return new Intl.NumberFormat().format(number);
  };

  return (
    <SafeAreaView className="bg-[#2E4834] flex-1">
      <View className="flex flex-col p-5 space-y-6 pb-24 flex-1">

        {/* Weekly Activity Tracker */}
        <View className="flex flex-row justify-between items-center">
          {daysOfWeek.map((day, index) => {
            const date = getDateForDay(index);
            const recordedDay = weeklyStats.find(stat => new Date(stat.date).getDate() === date);
            const isSunday = day === 'S' && index === 6; // Check if the day is Sunday
            return (
              <View key={index} className="flex flex-col items-center space-y-2">
                <Text className={`text-lg ${isSunday ? 'text-red-500' : 'text-white'}`}>
                  {day}
                </Text>
                {recordedDay ? (
                  <TouchableOpacity
                    className="w-9 h-16 rounded-[15px] bg-[#2E4834] flex items-center justify-center"
                    onPress={() => console.log(`Clicked on ${day}`)}
                  >
                    <Text className="text-lg text-red-500">{recordedDay.steps}</Text>
                  </TouchableOpacity>
                ) : (
                  <View className="flex flex-col items-center">
                    <View className="w-[35px] h-[60px] rounded-[15px] bg-[#1E3123] flex items-center pt-2">
                      <RectProgress percentage={percentage} width={24} height={28} strokeWidth={6} borderRadius={10} strokeColor="#fff" />
                    </View>
                    <Text className='text-lg text-white'>{date}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Stats Card */}
        <View className="bg-[#1E3123] rounded-xl p-5 shadow-lg my-5">
          <View className="flex flex-col items-center space-y-4">
            <View className="relative">
              <CircularProgress percentage={percentage} />
              <Text className="text-white text-xl font-bold">{percentage}%</Text>
            </View>

            <View className="flex flex-row justify-between w-full">

              <View className="flex flex-col items-center">
                <Text className="text-white text-2xl font-roman font-HelveticaNeueRoman mb-2">Steps</Text>

                <Text className="text-white text-2xl font-black font-HelveticaNeueBlack">
                  {formatNumber(stepCount)}
                </Text>
                <Text className="text-white text-base font-thin font-HelveticaNeueThin -mt-2 ml-2">
                  /{formatNumber(stepGoal)}
                </Text>
              </View>

              <View className="flex flex-col items-center">
                <Text className="text-white text-2xl font-roman font-HelveticaNeueRoman mb-2">Calories</Text>
                <Text className="text-white text-2xl font-thin font-HelveticaNeueThin"><Text className='font-HelveticaNeueBlack font-black'>{Math.round(caloriesBurned)}</Text> cal</Text>
              </View>

              <View className="flex flex-col items-center">
                <Text className="text-white text-2xl font-roman font-HelveticaNeueRoman mb-2">Distance</Text>
                <Text className="text-white text-2xl font-thin font-HelveticaNeueThin"><Text className='font-HelveticaNeueBlack font-black'>{distance}</Text> km</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Flower Stats */}
        <View className="bg-[#1E3123] rounded-xl p-5 shadow-lg">
          <Text className="text-white text-lg font-bold">Flower Stats</Text>
          <View className="flex flex-col mt-3 space-y-2">
            <Text className="text-white text-sm">
              Flower collected: <Text className="font-bold">20 / 103</Text>
            </Text>
            <Text className="text-white text-sm">
              Flower grown: <Text className="font-bold">20</Text>
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}