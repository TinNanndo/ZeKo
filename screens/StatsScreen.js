import React, { useState, useEffect } from 'react';
import { Text, View, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStats } from '../context/StatsContext';
import { FLOWER_TYPES } from '../context/flowerData';
import { useFocusEffect } from '@react-navigation/native';
import RectProgress from '../utils/RectProgress';

export default function StatsScreen() {
  const [weeklyStats, setWeeklyStats] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedStats, setSelectedStats] = useState(null);
  const { 
    stepCount, 
    caloriesBurned, 
    distance, 
    coins, 
    weeklyHistory,
    stepGoal  // From context
  } = useStats();
  const [isLoading, setIsLoading] = useState(true);

  const [flowersCollected, setFlowersCollected] = useState(0);
  const [flowersGrown, setFlowersGrown] = useState(0); 
  const [totalFlowerTypes, setTotalFlowerTypes] = useState(0);

  // Load flower stats whenever component mounts or receives focus
  const loadFlowerStats = async () => {
    try {
      // Load collected flowers data
      const shopPurchasesString = await AsyncStorage.getItem('shopPurchases');
      const grownFlowersString = await AsyncStorage.getItem('grownFlowers');
      
      // Get total flower types from the flower data
      const totalTypes = FLOWER_TYPES.length;
      setTotalFlowerTypes(totalTypes);
      
      // Calculate flowers collected (purchased)
      if (shopPurchasesString) {
        const purchases = JSON.parse(shopPurchasesString);
        setFlowersCollected(purchases.length);
      } else {
        setFlowersCollected(0);
      }
      
      // Calculate flowers grown
      if (grownFlowersString) {
        const grown = JSON.parse(grownFlowersString);
        setFlowersGrown(grown.length);
      } else {
        setFlowersGrown(0);
      }
      
      console.log('Loaded flower stats - Collected:', 
        shopPurchasesString ? JSON.parse(shopPurchasesString).length : 0, 
        'Grown:', 
        grownFlowersString ? JSON.parse(grownFlowersString).length : 0);
    } catch (error) {
      console.error('Error loading flower stats:', error);
    }
  };
  
  // Initial load when component mounts
  useEffect(() => {
    loadFlowerStats();
  }, []);

  // Reload when screen gains focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('Stats screen focused, reloading flower stats');
      loadFlowerStats();
      return () => {}; // cleanup function
    }, [])
  );
  
  // Set up event listener for storage changes
  useEffect(() => {
    const checkForUpdates = setInterval(() => {
      loadFlowerStats();
    }, 3000); // Check every 3 seconds
    
    return () => clearInterval(checkForUpdates);
  }, []);

  useEffect(() => {
    const fetchWeeklyStats = async () => {
      try {
        // Use weeklyHistory from context directly instead of loading from AsyncStorage
        if (weeklyHistory && weeklyHistory.length > 0) {
          console.log('Using weekly stats from context:', weeklyHistory);
          setWeeklyStats(weeklyHistory);
        } else {
          // Fallback to AsyncStorage if needed
          const stats = await AsyncStorage.getItem('weeklyStats');
          if (stats) {
            const parsedStats = JSON.parse(stats);
            console.log('Fetched weekly stats from storage:', parsedStats);
            setWeeklyStats(parsedStats);
          } else {
            console.log('No weekly stats found');
            setWeeklyStats([]);
          }
        }
      } catch (error) {
        console.error('Error fetching weekly stats:', error);
        setWeeklyStats([]);
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchWeeklyStats();
  }, [weeklyHistory]); // Re-run when weeklyHistory changes

  // Rest of your code remains unchanged
  
  // Update selected stats whenever selectedDay or weeklyStats changes
  // Update this useEffect to handle today's data better
  useEffect(() => {
    if (selectedDay) {
      const dateObj = getDateForDay(selectedDay.index);
      const formattedDate = formatDate(dateObj);
      
      // Check if selected day is today
      const today = new Date();
      const isToday = formatDate(today) === formattedDate;
      
      if (isToday) {
        // If today is selected, mark selectedStats as null to use live stats
        console.log("Today selected, will use live stats from context");
        setSelectedStats(null);
        return; // Exit early since we want to use live stats
      }
      
      // For past days, find stats from weeklyStats
      if (weeklyStats.length > 0) {
        // Find stats for the selected day
        const dayStats = weeklyStats.find(stat => stat.date === formattedDate);
        
        if (dayStats) {
          console.log(`Found stats for ${formattedDate}:`, dayStats);
          setSelectedStats(dayStats);
        } else {
          // No stats for this day
          console.log(`No stats found for ${formattedDate}, setting zeros`);
          setSelectedStats({
            stepCount: 0,
            caloriesBurned: 0,
            distance: 0,
            coins: 0
          });
        }
      }
    }
  }, [selectedDay, weeklyStats]);

    // Add this new useEffect to update UI when live stats change
  useEffect(() => {
    // If today is selected, refresh the UI when live stats change
    if (selectedDay) {
      const dateObj = getDateForDay(selectedDay.index);
      const formattedDate = formatDate(dateObj);
      const today = new Date();
      const isToday = formatDate(today) === formattedDate;
      
      if (isToday) {
        console.log("Live stats updated:", { stepCount, caloriesBurned, distance, coins });
        // Force a refresh of displayStats by setting selectedStats to null
        setSelectedStats(null);
      }
    }
  }, [stepCount, caloriesBurned, distance, coins]);

    // Add this useEffect to automatically select today when the component mounts
  useEffect(() => {
    // Find today's index in the daysOfWeek array
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, ...
    // Convert to our index (Monday = 0, ... Sunday = 6)
    const todayIndex = currentDay === 0 ? 6 : currentDay - 1;
    
    // Select today by default
    const dateObj = getDateForDay(todayIndex);
    setSelectedDay({ 
      day: daysOfWeek[todayIndex], 
      date: dateObj.getDate(), 
      index: todayIndex 
    });
    console.log(`Auto-selected today (${daysOfWeek[todayIndex]}) at index ${todayIndex}`);
  }, []);

  const daysOfWeek = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const getDateForDay = (dayIndex) => {
    const today = new Date();
    const currentDay = today.getDay();
    const distanceToMonday = (currentDay + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - distanceToMonday);
    const date = new Date(monday);
    date.setDate(monday.getDate() + dayIndex);
    return date;
  };

const formatDate = (date) => {
  // Ensure we're working with a Date object
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Adjust for timezone to get consistent date
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  
  // Format as YYYY-MM-DD to ensure consistency
  return `${year}-${month}-${day}`;
};

const logAvailableDates = () => {
  console.log('All available stats dates:', weeklyStats.map(stat => stat.date));
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    console.log(`Date ${i} days ago:`, formatDate(date));
  }
};

  // Get the stats for the selected day or use current stats if today is selected
  // Update the getDisplayStats function to properly use live data from context
  const getDisplayStats = () => {
    if (!selectedDay) {
      // No day selected, show current stats
      return {
        stepCount,
        caloriesBurned,
        distance,
        coins,
      };
    }
    
    // Check if selected day is today
    const dateObj = getDateForDay(selectedDay.index);
    const formattedDate = formatDate(dateObj);
    const today = new Date();
    const isToday = formatDate(today) === formattedDate;
    
    if (isToday) {
      // If today is selected, use live stats from context
      console.log("Using today's live stats:", { stepCount, caloriesBurned, distance, coins });
      return {
        stepCount,
        caloriesBurned,
        distance,
        coins,
      };
    }
    
    // Otherwise use stored stats for the selected day
    return selectedStats || {
      stepCount: 0,
      caloriesBurned: 0,
      distance: 0,
      coins: 0,
    };
  };

  const displayStats = getDisplayStats();
  
  // Calculate percentage based on the displayed stats
  const percentage = displayStats.stepCount !== undefined && stepGoal !== undefined
    ? Math.min(((displayStats.stepCount / stepGoal) * 100).toFixed(1), 100)
    : 0;

  const formatNumber = (number) => {
    return new Intl.NumberFormat().format(number);
  };

  const handleDayClick = (day, dateObj, index) => {
    // Format full date for comparison
    const formattedDate = formatDate(dateObj);
    console.log(`Clicked on ${day}, date: ${formattedDate}`);
    
    // Only store selected day info - useEffect will handle the stats update
    setSelectedDay({ day, date: dateObj.getDate(), index });
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={{ color: 'white' }}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Weekly Activity Tracker */}
        <View style={styles.weeklyTracker}>
          {daysOfWeek.map((day, index) => {
            const dateObj = getDateForDay(index);
            const date = dateObj.getDate();
            const formattedDate = formatDate(dateObj);
            
            // Check if this day is today
            const today = new Date();
            const isToday = formatDate(today) === formattedDate;
            
            // Find stats for this day - use live data for today
            let dayData;
            let dayPercentage = 0;
            
            if (isToday) {
              // For today, use live stats from context
              dayPercentage = Math.min(((stepCount / stepGoal) * 100), 100);
            } else {
              // For past days, find stats from weeklyStats
              dayData = weeklyStats.find(stat => stat.date === formattedDate);
              dayPercentage = dayData 
                ? Math.min(((dayData.stepCount / stepGoal) * 100), 100)
                : 0;
            }
            
            const isSelected = selectedDay && selectedDay.index === index;
            const isSunday = day === 'S' && index === 6;
            
            return (
              <View key={index} style={styles.dayContainer}>
                <Text style={[styles.dayText, isSunday && styles.sundayText]}>
                  {day}
                </Text>
                <TouchableOpacity
                  onPress={() => handleDayClick(day, dateObj, index)}
                >
                  <View style={[
                    styles.progressContainer
                  ]}>
                    <RectProgress 
                      percentage={dayPercentage} 
                      width={24} 
                      height={28} 
                      strokeWidth={6} 
                      borderRadius={10} 
                      strokeColor="#fff"
                    />

                    {/* Put the indicator at the bottom of the progress container */}
                    {isSelected && (
                      <View style={styles.dayButton} />
                    )}
                  </View>
                </TouchableOpacity>
                <Text style={[
                  styles.dateText,
                  isSelected && styles.selectedDateText,
                  isToday && styles.todayText
                ]}>{date}</Text>
              </View>
            );
          })}
        </View>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statsContent}>
            <View style={styles.progressWrapper}>
              <RectProgress 
                percentage={percentage} 
                width={81} 
                height={110} 
                strokeWidth={15} 
                borderRadius={15} 
                strokeColor="#fff" 
              />
              <Text style={styles.progressText}>{percentage}%</Text>
            </View>

            {/* Display stats */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statTitle}>Steps</Text>
                <Text style={styles.statValue}>{formatNumber(displayStats.stepCount)}</Text>
                <Text style={styles.statGoal}>/{formatNumber(stepGoal)}</Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statTitle}>Calories</Text>
                <Text style={styles.statValue}>
                  <Text style={styles.boldText}>{Math.round(displayStats.caloriesBurned)}</Text> cal
                </Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statTitle}>Distance</Text>
                  <Text style={styles.statValue}>
                    <Text style={styles.boldText}>{displayStats.distance.toFixed(2)}</Text> km
                  </Text>
              </View>
            </View>
          </View>
        </View>

      {/* Flower Stats */}
        <View style={styles.flowerCard}>
          <Text style={styles.flowerTitle}>Flower Stats</Text>
          <View style={styles.flowerContent}>
            <Text style={styles.flowerText}>
              Flowers collected: <Text style={styles.boldText}>
                {flowersCollected} / {totalFlowerTypes}
              </Text>
            </Text>
            <Text style={styles.flowerText}>
              Flowers grown: <Text style={styles.boldText}>{flowersGrown}</Text>
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#2E4834',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  weeklyTracker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayContainer: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 18,
    color: 'white',
  },
  sundayText: {
    color: 'red',
  },
progressContainer: {
  width: 35,
  height: 60,
  borderRadius: 15,
  backgroundColor: '#1E3123',
  justifyContent: 'space-between', // Change from 'top' to distribute content
  alignItems: 'center',
  paddingTop: 8,
  paddingBottom: 8, // Add padding at bottom for the indicator
},
  dateText: {
    fontSize: 18,
    color: 'white',
  },
dayButton: {
  backgroundColor: '#2E4834',
  width: 12,
  height: 12,
  borderRadius: 999, // Half of width/height to make a perfect circle
  marginTop: 5,    // Add some space below the progress bar
},
  selectedDateText: {
    fontWeight: 'bold',
  },
  statsCard: {
    backgroundColor: '#1E3123',
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
  selectedDayTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  statsContent: {
    alignItems: 'center',
  },
  progressWrapper: {
    position: 'relative',
  },
  progressText: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -12 }],
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statTitle: {
    color: 'white',
    fontSize: 24,
    marginBottom: 10,
  },
  statValue: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statGoal: {
    color: 'white',
    fontSize: 18,
    marginTop: -10,
  },
  boldText: {
    fontWeight: 'bold',
  },
  flowerCard: {
    backgroundColor: '#1E3123',
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
  flowerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  flowerContent: {
    marginTop: 10,
  },
  flowerText: {
    color: 'white',
    fontSize: 16,
  },
});