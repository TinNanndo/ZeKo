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
    <SafeAreaView className="bg-[#2E4834] flex-1"> {/* Wrap with SafeAreaView */}
      <View>
        <Text>Stats</Text>
        {weeklyStats.map((day, index) => (
          <View key={index}>
            <Text>{day.date}: {day.steps} steps</Text>
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}