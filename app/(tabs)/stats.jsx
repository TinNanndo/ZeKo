import React, { useState, useEffect } from 'react';
import { Text, View, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function StatsScreen() {
  const [weeklyStats, setWeeklyStats] = useState([]);

  useEffect(() => {
    const fetchWeeklyStats = async () => {
      const stats = await AsyncStorage.getItem('weeklyStats');
      if (stats) {
        setWeeklyStats(JSON.parse(stats));
      }
    };

    fetchWeeklyStats();
  }, []);

  return (
    <SafeAreaView className="bg-[#2E4834] flex-1">
      <View>
        <Text className="text-white text-lg font-bold">Stats</Text>
        {weeklyStats.map((day, index) => (
          <View key={index}>
            <Text className="text-white">
              {day.date}: {day.steps} steps
            </Text>
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}