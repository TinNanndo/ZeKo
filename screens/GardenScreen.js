import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStats } from '../context/StatsContext';
import { FLOWER_TYPES, getLeastRepresentedFlower } from '../context/flowerData';

// Icons
import SvgCoins from '../assets/icons/coins.svg';
import SvgShop from '../assets/icons/shop.svg';
// Removed SvgSwap import

export default function GardenScreen({ navigation }) {
  const { stepCount, coins } = useStats();
  const [activeFlower, setActiveFlower] = useState(null);
  const [grownFlowers, setGrownFlowers] = useState([]);
  const [growthProgress, setGrowthProgress] = useState(0);
  const [showCollection, setShowCollection] = useState(false);
  const [showFlowerSelector, setShowFlowerSelector] = useState(false);
  const [purchasedFlowers, setPurchasedFlowers] = useState([]);

  // Load garden data
  useEffect(() => {
    loadGardenData();
  }, []);

  // Load purchased flowers
  useEffect(() => {
    const loadPurchasedFlowers = async () => {
      try {
        const purchases = await AsyncStorage.getItem('shopPurchases');
        if (purchases) {
          const purchasedItems = JSON.parse(purchases);
          
          // Instead of filtering by unique IDs, group purchases by flower ID
          // and create an array of flower instances with counts
          const flowersWithCounts = [];
          
          // Group purchases by flower ID to count them
          const flowerCounts = {};
          purchasedItems.forEach(item => {
            if (!flowerCounts[item.id]) {
              flowerCounts[item.id] = 0;
            }
            flowerCounts[item.id]++;
          });
          
          // Create array of flowers with count information
          Object.keys(flowerCounts).forEach(flowerId => {
            const flowerType = FLOWER_TYPES.find(f => f.id === flowerId);
            if (flowerType) {
              for (let i = 0; i < flowerCounts[flowerId]; i++) {
                flowersWithCounts.push({
                  ...flowerType,
                  instanceId: `${flowerId}_instance${i}`, // Create unique instance ID
                  count: flowerCounts[flowerId],
                  instanceNumber: i + 1
                });
              }
            }
          });
          
          setPurchasedFlowers(flowersWithCounts);
        }
      } catch (error) {
        console.error('Error loading purchased flowers:', error);
      }
    };
    
    loadPurchasedFlowers();
  }, [showFlowerSelector]); // Reload when selector opens

  // Growth update effect
  useEffect(() => {
    if (!activeFlower) return;
    
    const updateGrowth = async () => {
      try {
        // Calculate the step progress since last update
        const lastStepCount = parseInt(await AsyncStorage.getItem('lastTrackedStepCount') || '0', 10);
        const stepsSinceLastUpdate = stepCount - lastStepCount;
        
        if (stepsSinceLastUpdate <= 0) return; // No new steps
        
        // Save current step count as the last tracked count
        await AsyncStorage.setItem('lastTrackedStepCount', stepCount.toString());
        
        // Add new steps to growth progress
        let newProgress = growthProgress + stepsSinceLastUpdate;
        
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
          
          // Use the getLeastRepresentedFlower helper function
          const nextFlower = await getLeastRepresentedFlower(updatedGrownFlowers);
          
          setActiveFlower(nextFlower);
          await AsyncStorage.setItem('activeFlower', JSON.stringify(nextFlower));
          
          console.log(`Flower fully grown! New flower: ${nextFlower?.name || 'None'}`);
        } else {
          // Update progress
          setGrowthProgress(newProgress);
          await AsyncStorage.setItem('growthProgress', newProgress.toString());
          console.log(`Growth progress updated: ${newProgress}/${activeFlower.stepsToGrow}`);
        }
      } catch (error) {
        console.error('Error updating growth:', error);
      }
    };
    
    updateGrowth();
  }, [stepCount, activeFlower]);
  
  const loadGardenData = async () => {
    try {
      const storedActiveFlower = await AsyncStorage.getItem('activeFlower');
      const storedGrownFlowers = await AsyncStorage.getItem('grownFlowers');
      const storedGrowthProgress = await AsyncStorage.getItem('growthProgress');
      
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
      
      // Load growth progress
      if (storedGrowthProgress) {
        setGrowthProgress(parseInt(storedGrowthProgress, 10));
      }
      
      // Load active flower if it exists
      if (storedActiveFlower && storedActiveFlower !== 'null') {
        setActiveFlower(JSON.parse(storedActiveFlower));
      } else {
        // Check if user has purchased flowers
        const purchases = await AsyncStorage.getItem('shopPurchases');
        if (purchases) {
          const purchasedItems = JSON.parse(purchases);
          if (purchasedItems.length > 0) {
            // Find the first purchased flower
            const firstPurchaseItem = purchasedItems[0];
            const firstPurchasedFlowerId = firstPurchaseItem.id;
            const purchasedFlower = FLOWER_TYPES.find(f => f.id === firstPurchasedFlowerId);
            
            if (purchasedFlower) {
              // Add instance ID to the flower
              const flowerWithInstance = {
                ...purchasedFlower,
                instanceId: `${firstPurchasedFlowerId}_instance0`,
                instanceNumber: 1
              };
              
              setActiveFlower(flowerWithInstance);
              await AsyncStorage.setItem('activeFlower', JSON.stringify(flowerWithInstance));
            }
          } else {
            // No purchased flowers
            setActiveFlower(null);
            await AsyncStorage.setItem('activeFlower', 'null');
          }
        } else {
          // No purchased flowers
          setActiveFlower(null);
          await AsyncStorage.setItem('activeFlower', 'null');
        }
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
      setActiveFlower(flower);
      await AsyncStorage.setItem('activeFlower', JSON.stringify(flower));
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
    backgroundColor: '#4CAF50',
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