import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStats } from '../context/StatsContext';
import { FLOWER_TYPES, getLeastRepresentedFlower } from '../context/flowerData';
import { useFocusEffect } from '@react-navigation/native';

// Icons
import SvgCoins from '../assets/icons/coins.svg';
import SvgShop from '../assets/icons/shop.svg';
// Removed SvgSwap import

export default function GardenScreen({ navigation, route }) {
  const { stepCount, coins } = useStats();
  const [activeFlower, setActiveFlower] = useState(null);
  const [grownFlowers, setGrownFlowers] = useState([]);
  const [growthProgress, setGrowthProgress] = useState(0);
  const [showCollection, setShowCollection] = useState(false);
  const [showFlowerSelector, setShowFlowerSelector] = useState(false);
  const [purchasedFlowers, setPurchasedFlowers] = useState([]);
  const [flowerProgressMap, setFlowerProgressMap] = useState({});


    // Make sure this is in your component
    useFocusEffect(
      React.useCallback(() => {
        console.log('Garden screen focused - refreshing data');
        
        // Check if day has changed and we need to reset flower tracking
        const checkDayChange = async () => {
          const today = new Date().toISOString().split('T')[0];
          const lastSavedDate = await AsyncStorage.getItem('lastSavedDate');
          
          if (lastSavedDate !== today) {
            // Day has changed, make sure we're in sync
            console.log('Day changed, resetting flower progress tracking');
            await AsyncStorage.setItem('lastTrackedStepCount', '0');
          }
          
          loadGardenData();
          loadPurchasedFlowers();
        };
        
        checkDayChange();
        
        return () => {
          // Cleanup if needed
        };
      }, [])
    );

  useEffect(() => {
  const unsubscribe = navigation.addListener('focus', () => {
    // Check for route params indicating a new flower purchase
    if (route.params?.newFlower) {
      console.log('New flower purchased:', route.params.flowerId);
      
      // Clear the params to prevent re-processing
      navigation.setParams({ newFlower: undefined });
      
      // Force refresh of purchased flowers
      loadPurchasedFlowers();
      
      // If this flower should be active, refresh the active flower too
      if (route.params?.makeActive) {
        loadGardenData();
      }
    }
  });

  return unsubscribe;
}, [navigation, route]);

  // Load garden data
  useEffect(() => {
    loadGardenData();
  }, []);

  const loadPurchasedFlowers = async () => {
    try {
      const purchases = await AsyncStorage.getItem('shopPurchases');
      if (purchases) {
        const purchasedItems = JSON.parse(purchases);
        
        // Create a map to count instances of each flower type
        const flowerCounts = {};
        purchasedItems.forEach(item => {
          if (flowerCounts[item.id]) {
            flowerCounts[item.id]++;
          } else {
            flowerCounts[item.id] = 1;
          }
        });
        
        // Create properly formatted flower objects
        const flowersWithCounts = [];
        
        // Process each purchased item
        purchasedItems.forEach((purchaseItem, index) => {
          // Find the flower type details
          const flowerType = FLOWER_TYPES.find(f => f.id === purchaseItem.id);
          
          if (flowerType) {
            // Calculate instance number for this specific purchase
            const sameTypeItems = purchasedItems.filter(
              (p, i) => p.id === purchaseItem.id && i <= index
            );
            const instanceNumber = sameTypeItems.length;
            
            // Create instance ID
            const instanceId = `${purchaseItem.id}_instance${instanceNumber - 1}`;
            
            // Create flower with instance data
            const flowerWithInstance = {
              ...flowerType,
              instanceId: instanceId,
              instanceNumber: instanceNumber,
              purchaseId: purchaseItem.purchaseId,
              count: flowerCounts[purchaseItem.id]
            };
            
            flowersWithCounts.push(flowerWithInstance);
          }
        });
        
        console.log(`Loaded ${flowersWithCounts.length} purchased flowers`);
        setPurchasedFlowers(flowersWithCounts);
      } else {
        setPurchasedFlowers([]);
      }
    } catch (error) {
      console.error('Error loading purchased flowers:', error);
      setPurchasedFlowers([]);
    }
  };

  // Update your growth update effect in GardenScreen.js
  useEffect(() => {
    if (!activeFlower) return;
    
    const updateGrowth = async () => {
      try {
        // Calculate the step progress since last update
        const lastStepCount = parseInt(await AsyncStorage.getItem('lastTrackedStepCount') || '0', 10);
        
        // Only proceed if we have more steps than last time
        if (stepCount <= lastStepCount) {
          return;
        }
        
        // Calculate new steps since last update
        const stepsSinceLastUpdate = stepCount - lastStepCount;
        console.log(`New steps detected: ${stepsSinceLastUpdate}`);
        
        // Update the last tracked step count
        await AsyncStorage.setItem('lastTrackedStepCount', stepCount.toString());
        
        // Calculate growth multiplier based on flower rarity
        let growthMultiplier = 1; // Default multiplier
        
        // Apply multipliers based on flower properties
        if (activeFlower.rarity === 'legendary') {
          growthMultiplier = 2.0; // Legendary flowers grow twice as fast
        } else if (activeFlower.rarity === 'rare') {
          growthMultiplier = 1.5; // Rare flowers grow 50% faster
        } else if (activeFlower.rarity === 'uncommon') {
          growthMultiplier = 1.2; // Uncommon flowers grow 20% faster
        }
        
        // Apply the multiplier to the steps
        const effectiveSteps = Math.round(stepsSinceLastUpdate * growthMultiplier);
        
        // Get current progress for this flower
        const currentProgress = flowerProgressMap[activeFlower.instanceId] || 0;
        
        // Calculate the new progress
        const newProgress = currentProgress + effectiveSteps;
        console.log(`Updating growth progress for ${activeFlower.name}: ${currentProgress} + ${effectiveSteps} = ${newProgress}`);
        
        // Update state
        setGrowthProgress(newProgress);
        
        // Update the progress map
        const updatedMap = {...flowerProgressMap, [activeFlower.instanceId]: newProgress};
        setFlowerProgressMap(updatedMap);
        await AsyncStorage.setItem('flowerProgressMap', JSON.stringify(updatedMap));
        
        // Check if flower is fully grown
        if (newProgress >= activeFlower.stepsToGrow) {
          console.log('Flower fully grown! Processing completion...');
          // Add to grown flowers collection
          const newGrownFlower = {
            ...activeFlower,
            grownAt: Date.now()
          };
          
          const storedGrownFlowers = await AsyncStorage.getItem('grownFlowers');
          const currentGrownFlowers = storedGrownFlowers ? JSON.parse(storedGrownFlowers) : [];
          currentGrownFlowers.push(newGrownFlower);
          
          await AsyncStorage.setItem('grownFlowers', JSON.stringify(currentGrownFlowers));
          setGrownFlowers(currentGrownFlowers);
          
          // Reset progress for this flower
          const resetMap = {...updatedMap, [activeFlower.instanceId]: 0};
          setFlowerProgressMap(resetMap);
          setGrowthProgress(0);
          await AsyncStorage.setItem('flowerProgressMap', JSON.stringify(resetMap));
          await AsyncStorage.setItem('lastTrackedStepCount', stepCount.toString());
          
          // Show completion alert
          Alert.alert(
            'Flower Grown!',
            `Your ${activeFlower.name} has fully grown and been added to your collection!`,
            [{ text: 'Great!', style: 'default' }]
          );
        }
      } catch (error) {
        console.error('Error updating growth:', error);
      }
    };
    
    // Run immediately when component mounts or active flower changes
    updateGrowth();
    
    // Set up interval to check for step updates
    const stepCheckInterval = setInterval(updateGrowth, 5000);
    
    return () => {
      clearInterval(stepCheckInterval);
    };
  }, [stepCount, activeFlower, flowerProgressMap]);
  
const loadGardenData = async () => {
  try {
    const storedActiveFlower = await AsyncStorage.getItem('activeFlower');
    const storedGrownFlowers = await AsyncStorage.getItem('grownFlowers');
    const storedFlowerProgress = await AsyncStorage.getItem('flowerProgressMap');
    
    // Load the flower progress map
    let progressMap = {};
    if (storedFlowerProgress) {
      progressMap = JSON.parse(storedFlowerProgress);
      setFlowerProgressMap(progressMap);
    }
    
    // Also initialize lastTrackedStepCount with current stepCount if not exists
    const lastTrackedStep = await AsyncStorage.getItem('lastTrackedStepCount');
    if (!lastTrackedStep) {
      await AsyncStorage.setItem('lastTrackedStepCount', stepCount.toString());
    }
    
    // Load grown flowers
    let localGrownFlowers = [];
    if (storedGrownFlowers) {
      localGrownFlowers = JSON.parse(storedGrownFlowers);
      setGrownFlowers(localGrownFlowers);
    }
    
    // Load active flower if it exists
    if (storedActiveFlower && storedActiveFlower !== 'null') {
      const flower = JSON.parse(storedActiveFlower);
      setActiveFlower(flower);
      
      // Set the growth progress for the active flower
      if (flower.instanceId && progressMap[flower.instanceId] !== undefined) {
        setGrowthProgress(progressMap[flower.instanceId]);
      } else {
        // Default to 0 if no progress is saved
        setGrowthProgress(0);
      }
    } else {
      // Your existing code for selecting a default flower
    }
  } catch (error) {
    console.error('Error loading garden data:', error);
    setActiveFlower(null);
  }
};

  const navigateToShop = () => {
    navigation.navigate('Shop');
  };

  const selectFlower = async (flower) => {
    try {
      // Set the active flower
      setActiveFlower(flower);
      await AsyncStorage.setItem('activeFlower', JSON.stringify(flower));
      
      // Reset the step tracking point to current steps
      await AsyncStorage.setItem('lastTrackedStepCount', stepCount.toString());
      
      // Load the correct progress for this flower instance
      if (flower.instanceId && flowerProgressMap[flower.instanceId] !== undefined) {
        setGrowthProgress(flowerProgressMap[flower.instanceId]);
      } else {
        // If no progress exists for this flower, start at 0
        setGrowthProgress(0);
        // Update the progress map with the new flower
        const updatedMap = {...flowerProgressMap, [flower.instanceId]: 0};
        setFlowerProgressMap(updatedMap);
        await AsyncStorage.setItem('flowerProgressMap', JSON.stringify(updatedMap));
      }
      
      setShowFlowerSelector(false);
    } catch (error) {
      console.error('Error selecting flower:', error);
    }
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

  const renderSelectorFlowerItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.selectorFlowerItem,
        activeFlower?.id === item.id && styles.selectedFlowerItem
      ]}
      onPress={() => selectFlower(item)}
    >
      <Image source={item.image} style={styles.selectorFlowerImage} />
      <View style={styles.selectorFlowerInfo}>
        <Text style={styles.selectorFlowerName}>{item.name}</Text>
        <Text style={styles.selectorFlowerSteps}>
          {activeFlower?.id === item.id 
            ? `${activeFlower.stepsToGrow - growthProgress} steps left to grow`
            : `${item.stepsToGrow} steps to grow`
          }
        </Text>
      </View>
      {activeFlower?.id === item.id && (
        <View style={styles.activeIndicator}>
          <Text style={styles.activeIndicatorText}>Active</Text>
        </View>
      )}
    </TouchableOpacity>
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

          {/* Shop Icon */}
          <TouchableOpacity 
            style={styles.shopButton}
            onPress={navigateToShop}
          >
            <SvgShop width={24} height={24} />
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
            <Text style={styles.toggleText}>Collection</Text>
          </TouchableOpacity>
        </View>

        {/* Main Content */}
{!showCollection ? (
  <View style={styles.gardenContainer}>          
    {activeFlower ? (
      <>
        <View style={styles.activeFlowerContainer}>
          <View style={styles.flowerHeader}>
            <Text style={styles.flowerNameLabel}>{activeFlower.name}</Text>
          </View>
          <Image 
            source={activeFlower.image} 
            style={styles.activeFlowerImage} 
          />
          <View style={styles.progressBarContainer}>
            <View 
              style={[
                styles.progressBar, 
                { 
                  width: `${Math.min((growthProgress / activeFlower.stepsToGrow) * 100, 100)}%`
                }
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {growthProgress}/{activeFlower.stepsToGrow} steps 
            ({Math.round((growthProgress / activeFlower.stepsToGrow) * 100)}%)
          </Text>
        </View>
        
        {/* Purchased Flowers Preview */}
        {purchasedFlowers.length > 0 && (
          <View style={styles.purchasedFlowersContainer}>
            <Text style={styles.purchasedFlowersTitle}>Your Flowers</Text>
            <FlatList
              data={purchasedFlowers}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[
                    styles.purchasedFlowerItem,
                    activeFlower?.instanceId === item.instanceId && styles.activePurchasedFlower
                  ]}
                  onPress={() => selectFlower(item)}
                >
                  <Image 
                    source={item.image} 
                    style={styles.purchasedFlowerImage} 
                  />
                  <Text style={styles.purchasedFlowerName} numberOfLines={1}>
                    {item.name} {item.count > 1 ? `(${item.instanceNumber})` : ''}
                  </Text>
                  {activeFlower?.instanceId === item.instanceId && (
                    <View style={styles.purchasedActiveIndicator} />
                  )}
                  {activeFlower?.instanceId === item.instanceId && (
                    <Text style={styles.stepsLeftText}>
                      {activeFlower.stepsToGrow - growthProgress} steps
                    </Text>
                  )}
                </TouchableOpacity>
              )}
              keyExtractor={item => item.instanceId || item.id}
              numColumns={3}
              contentContainerStyle={styles.purchasedFlowersList}
            />
          </View>
        )}
      </>
    ) : (
      // No changes to the "No Flower Selected" view
      <View style={styles.noFlowerContainer}>
        <Text style={styles.noFlowerTitle}>No Flower Selected</Text>
        <Text style={styles.noFlowerText}>
          You don't have any flowers yet! Collect coins by walking and buy your first flower from the shop.
        </Text>
        <TouchableOpacity 
          style={styles.shopButtonLarge}
          onPress={navigateToShop}
        >
          <Text style={styles.shopButtonText}>Go to Shop</Text>
          <SvgShop width={24} height={24} />
        </TouchableOpacity>
      </View>
    )}
  </View>
) : (
  // No changes to the Collection view
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

        {/* Flower Selector Modal - we keep this since it's triggered by clicking on flowers */}
        <Modal
          visible={showFlowerSelector}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowFlowerSelector(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select a Flower</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowFlowerSelector(false)}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={purchasedFlowers}
                renderItem={renderSelectorFlowerItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.selectorList}
              />
            </View>
          </View>
        </Modal>
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
    justifyContent: 'center',
    borderRadius: 20,
  },
  activeToggle: {
    backgroundColor: '#2E4834',
    borderWidth: 2,
    borderColor: '#1E3123',
  },
  toggleText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
gardenContainer: {
  flex: 1,
  width: '100%',
},
activeFlowerContainer: {
  width: '100%',
  backgroundColor: '#1E3123',
  borderRadius: 20,
  alignItems: 'center',
  justifyContent: 'center',
  padding: 20,
  marginBottom: 10,
        shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.8,
  shadowRadius: 2,
  elevation: 2,
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
  noFlowerContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#1E3123',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
          shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.8,
  shadowRadius: 2,
  elevation: 2,
  },
  noFlowerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  noFlowerText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  shopButtonLarge: {
    flexDirection: 'row',
    backgroundColor: '#2E4834',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  flowerHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  // Removed changeFlowerButton and changeFlowerText styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#2E4834',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1E3123',
  },
  modalTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1E3123',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
  },
  selectorList: {
    padding: 15,
  },
  selectorFlowerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E3123',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  selectedFlowerItem: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  selectorFlowerImage: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
  selectorFlowerName: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 15,
    flex: 1,
  },
  selectorFlowerSteps: {
    color: 'white',
    fontSize: 12,
    opacity: 0.7,
    marginLeft: 15,
  },
  activeIndicator: {
    backgroundColor: '#4CAF50',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginLeft: 10,
  },
  activeIndicatorText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  purchasedFlowersTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  purchasedFlowersList: {
    paddingVertical: 10,
  },
  purchasedFlowerItem: {
    backgroundColor: '#1E3123',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
    padding: 5,
  },
  activePurchasedFlower: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  purchasedFlowerImage: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
  purchasedActiveIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#1E3123',
  },
  selectorFlowerInfo: {
    flex: 1,
    marginLeft: 15,
  },
  remainingStepsContainer: {
    position: 'absolute',
    top: -15,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    zIndex: 1,
  },
  remainingStepsText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
purchasedFlowersContainer: {
  width: '100%',
  marginTop: 20,
  flex: 1, // Allow container to expand
},
purchasedFlowersTitle: {
  color: 'white',
  fontSize: 18,
  fontWeight: 'bold',
  marginBottom: 12,
},
purchasedFlowersList: {
  padding: 5,
},
purchasedFlowerItem: {
  flex: 1,
  margin: 5,
  backgroundColor: '#1E3123',
  borderRadius: 16,
  padding: 10,
  alignItems: 'center',
  position: 'relative',
  height: 120,
  justifyContent: 'center',
  maxWidth: '33%',
},
activePurchasedFlower: {
  borderWidth: 2,
  borderColor: '#4CAF50',
},
purchasedFlowerImage: {
  width: 60,
  height: 60,
  resizeMode: 'contain',
  marginBottom: 8,
},
purchasedFlowerName: {
  color: 'white',
  fontSize: 12,
  fontWeight: 'bold',
  textAlign: 'center',
  marginTop: 4,
},
purchasedActiveIndicator: {
  position: 'absolute',
  top: 10,
  right: 10,
  width: 15,
  height: 15,
  borderRadius: 8,
  backgroundColor: '#4CAF50',
  borderWidth: 2,
  borderColor: '#1E3123',
},
stepsLeftText: {
  position: 'absolute',
  bottom: 5,
  fontSize: 10,
  color: '#4CAF50',
  fontWeight: 'bold',
},
});