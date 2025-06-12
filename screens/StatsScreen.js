import React, { useState, useEffect } from 'react';
import { Text, View, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStats } from '../context/StatsContext';
import { FLOWER_TYPES } from '../context/flowerData';
import { useFocusEffect } from '@react-navigation/native';
import RectProgress from '../utils/RectProgress';

/**
 * StatsScreen - Zaslon za prikaz statistike
 * 
 * Prikazuje sažetak korisnikove aktivnosti i napretka uključujući:
 * 1. Tjedni pregled aktivnosti po danima
 * 2. Detaljna statistika odabranog dana (koraci, kalorije, udaljenost)
 * 3. Sažetak kolekcije cvjetova
 */
export default function StatsScreen() {
  // --- STANJE ZASLONA ---
  const [isLoading, setIsLoading] = useState(true);
  
  // Statistika po danima
  const [weeklyStats, setWeeklyStats] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedStats, setSelectedStats] = useState(null);
  
  // Statistika cvjetova
  const [flowersCollected, setFlowersCollected] = useState(0);
  const [flowersGrown, setFlowersGrown] = useState(0); 
  const [totalFlowerTypes, setTotalFlowerTypes] = useState(0);
  
  // Dohvat podataka iz konteksta
  const { 
    stepCount, 
    caloriesBurned, 
    distance, 
    coins, 
    weeklyHistory,
    stepGoal,
    checkForNewDay
  } = useStats();

  // --- KONSTANTE ---
  // Kratice dana u tjednu (M, T, W, T, F, S, S na engleskom)
  const daysOfWeek = ['M', 'T', 'W', 'T', 'F', 'S', 'S']; 
  
  // --- UČITAVANJE PODATAKA O CVIJEĆU ---
  
  /**
   * Učitavanje statistike o cvijeću iz lokalne pohrane
   * Računa ukupan broj cvjetova i broj uzgojenih cvjetova
   */
  const loadFlowerStats = async () => {
    try {
      // Učitavanje podataka o kupljenim i uzgojenim cvjetovima
      const shopPurchasesString = await AsyncStorage.getItem('shopPurchases');
      const grownFlowersString = await AsyncStorage.getItem('grownFlowers');
      
      // Postavljanje ukupnog broja mogućih tipova cvjetova
      setTotalFlowerTypes(FLOWER_TYPES.length);
      
      // Izračun kupljenih cvjetova
      if (shopPurchasesString) {
        const purchases = JSON.parse(shopPurchasesString);
        setFlowersCollected(purchases.length);
      } else {
        setFlowersCollected(0);
      }
      
      // Izračun uzgojenih cvjetova
      if (grownFlowersString) {
        const grown = JSON.parse(grownFlowersString);
        setFlowersGrown(grown.length);
      } else {
        setFlowersGrown(0);
      }
    } catch (error) {
      console.error('Greška pri učitavanju statistike cvjetova:', error);
    }
  };
  
  // --- POMOĆNE FUNKCIJE ZA RAD S DATUMIMA ---
  
  /**
   * Dohvat datuma za određeni dan u tjednu
   * @param {number} dayIndex - Indeks dana (0-6, 0=ponedjeljak)
   * @returns {Date} - Objekt datuma za zadani dan
   */
  const getDateForDay = (dayIndex) => {
    const today = new Date();
    const currentDay = today.getDay();
    const distanceToMonday = (currentDay + 6) % 7; // Prilagodba za početak tjedna (ponedjeljak)
    
    const monday = new Date(today);
    monday.setDate(today.getDate() - distanceToMonday);
    
    const date = new Date(monday);
    date.setDate(monday.getDate() + dayIndex);
    return date;
  };

  /**
   * Formatiranje datuma u standardni format (YYYY-MM-DD)
   * @param {Date} date - Datum za formatiranje
   * @returns {string} - Formatiran datum
   */
  const formatDate = (date) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };

  /**
   * Dohvaćanje statistike za odabrani dan
   * Vraća trenutne podatke za današnji dan ili povijesne za prethodne
   * @returns {Object} - Objekt s podacima statistike
   */
  const getDisplayStats = () => {
    if (!selectedDay) {
      // Ako nema odabranog dana, prikaži trenutnu statistiku
      return {
        stepCount,
        caloriesBurned,
        distance,
        coins,
      };
    }
    
    // Provjera je li odabrani dan današnji
    const dateObj = getDateForDay(selectedDay.index);
    const formattedDate = formatDate(dateObj);
    const today = new Date();
    const isToday = formatDate(today) === formattedDate;
    
    if (isToday) {
      // Za današnji dan koristi trenutne podatke iz konteksta
      return {
        stepCount,
        caloriesBurned,
        distance,
        coins,
      };
    }
    
    // Za prethodne dane koristi spremljenu statistiku
    return selectedStats || {
      stepCount: 0,
      caloriesBurned: 0,
      distance: 0,
      coins: 0,
    };
  };

  /**
   * Formatiranje brojeva za prikaz s razdjelnicima tisućica
   * @param {number} number - Broj za formatiranje
   * @returns {string} - Formatiran broj
   */
  const formatNumber = (number) => {
    return new Intl.NumberFormat().format(number);
  };

  /**
   * Obrada klika na dan u tjednu
   * @param {string} day - Oznaka dana (npr. 'M', 'T'...)
   * @param {Date} dateObj - Objekt datuma 
   * @param {number} index - Indeks dana u tjednu (0-6)
   */
  const handleDayClick = (day, dateObj, index) => {
    setSelectedDay({ day, date: dateObj.getDate(), index });
  };

  // --- UČITAVANJE PODATAKA KOD RENDERIRANJA ---
  
  // Inicijalno učitavanje statistike cvjetova
  useEffect(() => {
    loadFlowerStats();
  }, []);

  // Osvježavanje podataka kad se zaslon fokusira
  useFocusEffect(
    React.useCallback(() => {
      checkForNewDay();
      loadFlowerStats();
      return () => {};
    }, [])
  );
  
  // Periodičko osvježavanje podataka o cvjetovima
  useEffect(() => {
    const checkForUpdates = setInterval(() => {
      loadFlowerStats();
    }, 3000);
    
    return () => clearInterval(checkForUpdates);
  }, []);

  // --- UČITAVANJE TJEDNE STATISTIKE ---
  
  /**
   * Učitavanje tjedne statistike iz konteksta ili lokalne pohrane
   */
  useEffect(() => {
    const fetchWeeklyStats = async () => {
      try {
        // Preferiraj podatke iz konteksta ako su dostupni
        if (weeklyHistory && weeklyHistory.length > 0) {
          setWeeklyStats(weeklyHistory);
        } else {
          // Inače učitaj iz AsyncStorage-a
          const stats = await AsyncStorage.getItem('weeklyStats');
          if (stats) {
            const parsedStats = JSON.parse(stats);
            setWeeklyStats(parsedStats);
          } else {
            setWeeklyStats([]);
          }
        }
      } catch (error) {
        console.error('Greška pri učitavanju tjedne statistike:', error);
        setWeeklyStats([]);
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchWeeklyStats();
  }, [weeklyHistory]);
  
  // --- AŽURIRANJE STATISTIKE ODABRANOG DANA ---
  
  /**
   * Ažuriranje podataka za odabrani dan kad se promijeni selekcija
   */
  useEffect(() => {
    if (selectedDay) {
      const dateObj = getDateForDay(selectedDay.index);
      const formattedDate = formatDate(dateObj);
      
      // Provjera je li odabrani dan današnji
      const today = new Date();
      const isToday = formatDate(today) === formattedDate;
      
      if (isToday) {
        // Za današnji dan, koristimo podatke iz konteksta
        setSelectedStats(null);
        return;
      }
      
      // Za prethodne dane, tražimo statistiku iz povijesti
      if (weeklyStats.length > 0) {
        const dayStats = weeklyStats.find(stat => stat.date === formattedDate);
        
        if (dayStats) {
          setSelectedStats(dayStats);
        } else {
          // Nema podataka za taj dan, prikaži nule
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

  // Osvježavanje prikaza kad se promijene podaci za današnji dan
  useEffect(() => {
    if (selectedDay) {
      const dateObj = getDateForDay(selectedDay.index);
      const formattedDate = formatDate(dateObj);
      const today = new Date();
      const isToday = formatDate(today) === formattedDate;
      
      if (isToday) {
        setSelectedStats(null);
      }
    }
  }, [stepCount, caloriesBurned, distance, coins]);

  // Automatski odabir današnjeg dana prilikom učitavanja
  useEffect(() => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = nedjelja, 1 = ponedjeljak, ...
    // Konverzija u naš indeks (ponedjeljak = 0, ... nedjelja = 6)
    const todayIndex = currentDay === 0 ? 6 : currentDay - 1;
    
    const dateObj = getDateForDay(todayIndex);
    setSelectedDay({ 
      day: daysOfWeek[todayIndex], 
      date: dateObj.getDate(), 
      index: todayIndex 
    });
  }, []);

  // Dohvat statistike za prikaz
  const displayStats = getDisplayStats();
  
  // Izračun postotka ostvarenja cilja
  const percentage = displayStats.stepCount !== undefined && stepGoal !== undefined
    ? Math.min(((displayStats.stepCount / stepGoal) * 100).toFixed(1), 100)
    : 0;

  // --- PRIKAZ ZASLONA ---
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
        {/* Tjedni prikaz aktivnosti - stupci po danima */}
        <View style={styles.weeklyTracker}>
          {daysOfWeek.map((day, index) => {
            const dateObj = getDateForDay(index);
            const date = dateObj.getDate();
            const formattedDate = formatDate(dateObj);
            
            // Provjera je li dan današnji
            const today = new Date();
            const isToday = formatDate(today) === formattedDate;
            
            // Pronalaženje statistike za ovaj dan
            let dayData;
            let dayPercentage = 0;
            
            if (isToday) {
              // Za današnji dan, koristi trenutne podatke
              dayPercentage = Math.min(((stepCount / stepGoal) * 100), 100);
            } else {
              // Za prethodne dane, traži u tjednoj povijesti
              dayData = weeklyStats.find(stat => stat.date === formattedDate);
              dayPercentage = dayData 
                ? Math.min(((dayData.stepCount / stepGoal) * 100), 100)
                : 0;
            }
            
            const isSelected = selectedDay && selectedDay.index === index;
            const isSunday = day === 'S' && index === 6; // Nedjelja je zadnji dan
            
            return (
              <View key={index} style={styles.dayContainer}>
                <Text style={[styles.dayText, isSunday && styles.sundayText]}>
                  {day}
                </Text>
                <TouchableOpacity
                  onPress={() => handleDayClick(day, dateObj, index)}
                >
                  <View style={styles.progressContainer}>
                    <RectProgress 
                      percentage={dayPercentage} 
                      width={24} 
                      height={28} 
                      strokeWidth={6} 
                      borderRadius={10} 
                      strokeColor="#fff"
                    />

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

        {/* Kartica sa statistikom odabranog dana */}
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

            {/* Prikaz statistike - koraci, kalorije, udaljenost */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statTitle}>Steps</Text>
                <Text style={styles.statValue}>{formatNumber(displayStats.stepCount)}</Text>
                <Text style={styles.statGoal}>/{formatNumber(stepGoal)}</Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statTitle}>Calories</Text>
                <Text style={styles.statValue}>
                  <Text style={styles.boldText}>{Math.round(displayStats.caloriesBurned)}</Text> kcal
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

        {/* Statistika cvjetova - kolekcija i postignuća */}
        <View style={styles.flowerCard}>
          <Text style={styles.flowerTitle}>Flower Statistics</Text>
          <View style={styles.flowerContent}>
            <Text style={styles.flowerText}>
              Collected flowers: <Text style={styles.boldText}>
                {flowersCollected} / {totalFlowerTypes}
              </Text>
            </Text>
            <Text style={styles.flowerText}>
              Grown flowers: <Text style={styles.boldText}>{flowersGrown}</Text>
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

// --- STILOVI ---
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
  elevation: 2,
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
  elevation: 2,
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