import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, FlatList, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStats } from '../context/StatsContext';
import { FLOWER_TYPES, getLeastRepresentedFlower } from '../context/flowerData';

// Icons
import SvgCoins from '../assets/icons/coins.svg';
import SvgShop from '../assets/icons/shop.svg';

const nextFlower = getLeastRepresentedFlower(updatedGrownFlowers);
setActiveFlower(nextFlower);
await AsyncStorage.setItem('activeFlower', JSON.stringify(nextFlower));

export default function GardenScreen({ navigation }) {
  const { stepCount, coins } = useStats();
  const [activeFlower, setActiveFlower] = useState(null);
  const [grownFlowers, setGrownFlowers] = useState([]);
  const [growthProgress, setGrowthProgress] = useState(0);
  const [showCollection, setShowCollection] = useState(false);

  // Load garden data when component mounts
  useEffect(() => {
    const loadGardenData = async () => {
      try {
        const storedActiveFlower = await AsyncStorage.getItem('activeFlower');
        const storedGrownFlowers = await AsyncStorage.getItem('grownFlowers');
        const storedGrowthProgress = await AsyncStorage.getItem('growthProgress');
        
        if (storedActiveFlower) {
          setActiveFlower(JSON.parse(storedActiveFlower));
        } else {
          // Default to first flower if none is active
          setActiveFlower(FLOWER_TYPES[0]);
          await AsyncStorage.setItem('activeFlower', JSON.stringify(FLOWER_TYPES[0]));
        }
        
        if (storedGrownFlowers) {
          setGrownFlowers(JSON.parse(storedGrownFlowers));
        }
        
        if (storedGrowthProgress) {
          setGrowthProgress(parseInt(storedGrowthProgress, 10));
        }
      } catch (error) {
        console.error('Error loading garden data:', error);
      }
    };
    
    loadGardenData();
  }, []);

  // Update flower growth based on step count
  useEffect(() => {
    if (!activeFlower) return;
    
    const updateGrowth = async () => {
      // Calculate new progress
      let newProgress = growthProgress + 1;
      
      // Check if flower is fully grown
      if (newProgress >= activeFlower.stepsToGrow) {
        // Add to grown flowers collection
        const updatedGrownFlowers = [...grownFlowers, {
          ...activeFlower,
          id: `${activeFlower.id}_${Date.now()}`, // Make unique ID
          grownAt: new Date().toISOString()
        }];
        
        setGrownFlowers(updatedGrownFlowers);
        await AsyncStorage.setItem('grownFlowers', JSON.stringify(updatedGrownFlowers));
        
        // Reset progress and select next flower
        setGrowthProgress(0);
        await AsyncStorage.setItem('growthProgress', '0');
        
        // Find next flower that isn't already fully represented in collection
        const flowerCounts = {};
        updatedGrownFlowers.forEach(flower => {
          const baseId = flower.id.split('_')[0];
          flowerCounts[baseId] = (flowerCounts[baseId] || 0) + 1;
        });
        
        // Find least represented flower type
        let nextFlower = FLOWER_TYPES[0];
        let minCount = Number.MAX_SAFE_INTEGER;
        
        FLOWER_TYPES.forEach(flowerType => {
          const count = flowerCounts[flowerType.id] || 0;
          if (count < minCount) {
            minCount = count;
            nextFlower = flowerType;
          }
        });
        
        setActiveFlower(nextFlower);
        await AsyncStorage.setItem('activeFlower', JSON.stringify(nextFlower));
      } else {
        // Update progress
        setGrowthProgress(newProgress);
        await AsyncStorage.setItem('growthProgress', newProgress.toString());
      }
    };
    
    updateGrowth();
  }, [stepCount]);

  const navigateToShop = () => {
    // This would navigate to your shop screen
    // navigation.navigate('Shop');
    alert('Shop coming soon!');
  };

  const toggleCollection = () => {
    setShowCollection(!showCollection);
  };

  const renderFlowerItem = ({ item }) => (
    <View style={styles.flowerItem}>
      <Image source={item.image} style={styles.flowerImage} />
      <Text style={styles.flowerName}>{item.name}</Text>
      <Text style={styles.flowerDate}>
        {new Date(item.grownAt).toLocaleDateString()}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          {/* Coin Balance */}
          <View style={styles.coinsContainer}>
            <Text style={styles.coinsText}>{coins}</Text>
            <SvgCoins width={24} height={24} />
          </View>

          {/* Title */}
          <Text style={styles.title}>My Garden</Text>

          {/* Shop Icon */}
          <TouchableOpacity 
            style={styles.shopButton}
            onPress={navigateToShop}
          >
            <SvgCoins width={24} height={24} />
          </TouchableOpacity>
        </View>

        {/* Toggle View */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity 
            style={[styles.toggleButton, !showCollection && styles.activeToggle]}
            onPress={() => setShowCollection(false)}
          >
            <Text style={styles.toggleText}>Growing</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleButton, showCollection && styles.activeToggle]}
            onPress={() => setShowCollection(true)}
          >
            <Text style={styles.toggleText}>Collection ({grownFlowers.length})</Text>
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        {!showCollection ? (
          <View style={styles.gardenContainer}>
            <View style={styles.activeFlowerContainer}>
              {activeFlower && (
                <>
                  <Image 
                    source={activeFlower.image} 
                    style={[
                      styles.activeFlowerImage,
                      { opacity: 0.3 + (growthProgress / activeFlower.stepsToGrow) * 0.7 }
                    ]} 
                  />
                  <Text style={styles.flowerNameLabel}>{activeFlower.name}</Text>
                  
                  {/* Growth Progress Bar */}
                  <View style={styles.progressBarContainer}>
                    <View 
                      style={[
                        styles.progressBar, 
                        { width: `${(growthProgress / activeFlower.stepsToGrow) * 100}%` }
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {growthProgress} / {activeFlower.stepsToGrow} steps
                  </Text>
                </>
              )}
            </View>
            
            <View style={styles.gardenInfo}>
              <Text style={styles.infoText}>
                Walk more to grow your flowers faster!
              </Text>
              <Text style={styles.infoText}>
                Total flowers grown: {grownFlowers.length}
              </Text>
            </View>
          </View>
        ) : (
          <FlatList
            data={grownFlowers}
            renderItem={renderFlowerItem}
            keyExtractor={item => item.id}
            numColumns={2}
            contentContainerStyle={styles.collectionContainer}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                You haven't grown any flowers yet. Start walking to grow some!
              </Text>
            }
          />
        )}
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  coinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E3123',
    padding: 10,
    borderRadius: 20,
  },
  coinsText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 5,
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  shopButton: {
    backgroundColor: '#1E3123',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E3123',
    borderRadius: 20,
    marginBottom: 20,
  },
  toggleButton: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
    borderRadius: 20,
  },
  activeToggle: {
    backgroundColor: '#2E4834',
  },
  toggleText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  gardenContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeFlowerContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#1E3123',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  activeFlowerImage: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
  },
  flowerNameLabel: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
  },
  progressBarContainer: {
    width: '100%',
    height: 20,
    backgroundColor: '#2E4834',
    borderRadius: 10,
    marginTop: 20,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'white',
  },
  progressText: {
    color: 'white',
    fontSize: 16,
    marginTop: 10,
  },
  gardenInfo: {
    marginTop: 20,
    alignItems: 'center',
  },
  infoText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 10,
  },
  collectionContainer: {
    padding: 10,
  },
  flowerItem: {
    flex: 1,
    margin: 10,
    backgroundColor: '#1E3123',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
  },
  flowerImage: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  flowerName: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  flowerDate: {
    color: 'white',
    fontSize: 12,
    marginTop: 5,
  },
  emptyText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
});