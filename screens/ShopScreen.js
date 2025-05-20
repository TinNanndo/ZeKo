import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStats } from '../context/StatsContext';

// Icons
import SvgCoins from '../assets/icons/coins.svg';
import SvgBack from '../assets/icons/back.svg';

import { FLOWER_TYPES, getFlowersByRarity } from '../context/flowerData';

export default function ShopScreen({ navigation }) {
  const { coins, setCoins } = useStats();
  const [shopItems, setShopItems] = useState([]);
  const [purchasedItems, setPurchasedItems] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    loadShopData();
  }, []);

  const loadShopData = async () => {
    try {
      // Load purchased items
      const storedPurchases = await AsyncStorage.getItem('shopPurchases');
      if (storedPurchases) {
        setPurchasedItems(JSON.parse(storedPurchases));
      }
      
      // Set up shop items based on flower data
      const items = FLOWER_TYPES.map(flower => ({
        id: flower.id,
        name: flower.name,
        image: flower.image,
        price: getPriceByRarity(flower.rarity),
        rarity: flower.rarity,
        description: flower.description || 'A beautiful flower'
      }));
      
      setShopItems(items);
    } catch (error) {
      console.error('Error loading shop data:', error);
    }
  };

  const getPriceByRarity = (rarity) => {
    switch(rarity) {
      case 'common':
        return 500;
      case 'uncommon':
        return 1000;
      case 'rare':
        return 2500;
      case 'legendary':
        return 5000;
      default:
        return 500;
    }
  };

const handlePurchase = async (item) => {
  if (coins < item.price) {
    Alert.alert('Not enough coins', 'Walk more to earn coins!');
    return;
  }

  // Update coins
  setCoins(coins - item.price);

  // Create a unique ID for this purchase instance
  const purchaseId = `${item.id}_${Date.now()}`;
  
  // Add to purchased items with unique ID
  const newPurchases = [...purchasedItems, { 
    id: item.id,
    purchaseId: purchaseId,
    purchasedAt: new Date().toISOString() 
  }];
  setPurchasedItems(newPurchases);
  await AsyncStorage.setItem('shopPurchases', JSON.stringify(newPurchases));

  // Check if this is the first purchased flower
  const isFirstPurchase = purchasedItems.length === 0;

  // If first purchase, set as active flower
  if (isFirstPurchase) {
    const purchasedFlower = FLOWER_TYPES.find(f => f.id === item.id);
    if (purchasedFlower) {
      // Create instance ID
      const flowerWithInstance = {
        ...purchasedFlower,
        instanceId: `${item.id}_instance0`,
        instanceNumber: 1
      };
      
      // Initialize the progress map for this flower
const flowerProgressMap = await AsyncStorage.getItem('flowerProgressMap');
const progressMap = flowerProgressMap ? JSON.parse(flowerProgressMap) : {};

// Ensure the progress is set to 0 for this flower instance
progressMap[flowerWithInstance.instanceId] = 0;
      
await AsyncStorage.setItem('flowerProgressMap', JSON.stringify(progressMap));
await AsyncStorage.setItem('activeFlower', JSON.stringify(flowerWithInstance));
      await AsyncStorage.setItem('growthProgress', '0'); // Reset progress
await AsyncStorage.setItem('lastTrackedStepCount', '0'); // Reset step tracking      

      Alert.alert(
        'First Flower Purchased!', 
        `You have purchased ${item.name}. It is now set as your active flower. Return to the garden to see it grow!`,
        [
          { 
            text: 'OK', 
            onPress: () => navigation.navigate('Garden', { 
              newFlower: true,
              flowerId: item.id,
              purchaseId: purchaseId
            })
          }
        ]
      );
    } else {
      Alert.alert('Purchase Successful', `You have purchased ${item.name}.`);
    }
  } else {
    // For repeat purchases, still ask about making active
    Alert.alert(
      'Purchase Successful', 
      `You have purchased ${item.name}. Would you like to make it your active flower?`,
      [
        { 
          text: 'Yes', 
          onPress: async () => {
            const purchasedFlower = FLOWER_TYPES.find(f => f.id === item.id);
            if (purchasedFlower) {
              // Create instance ID for the new flower
              const instanceIdx = purchasedItems.filter(p => p.id === item.id).length - 1;
              const flowerWithInstance = {
                ...purchasedFlower,
                instanceId: `${item.id}_instance${instanceIdx}`,
                instanceNumber: instanceIdx + 1
              };
              
              await AsyncStorage.setItem('activeFlower', JSON.stringify(flowerWithInstance));
              await AsyncStorage.setItem('growthProgress', '0'); // Reset progress
              await AsyncStorage.setItem('lastTrackedStepCount', '0'); // Reset step count
              
              navigation.navigate('Garden', { 
                newFlower: true,
                flowerId: item.id,
                purchaseId: purchaseId,
                makeActive: true
              });
            }
          } 
        },
        { 
          text: 'No', 
          style: 'cancel',
          onPress: () => navigation.navigate('Garden', { 
            newFlower: true,
            flowerId: item.id,
            purchaseId: purchaseId,
            makeActive: false
          })
        }
      ]
    );
  }
};

  const getFilteredItems = () => {
    if (selectedFilter === 'all') return shopItems;
    return shopItems.filter(item => item.rarity === selectedFilter);
  };

const isPurchased = (itemId) => {
  return false;
};

const renderShopItem = ({ item }) => (
  <View style={styles.shopItem}>
    <View style={[styles.rarityIndicator, { backgroundColor: getRarityColor(item.rarity) }]} />
    <Image source={item.image} style={styles.itemImage} />
    <Text style={styles.itemName}>{item.name}</Text>
    <Text style={styles.itemRarity}>{item.rarity}</Text>
    <Text style={styles.itemDescription}>{item.description}</Text>
    <View style={styles.priceContainer}>
      <Text style={styles.priceText}>{item.price}</Text>
      <SvgCoins width={16} height={16} />
    </View>
    
    {/* Update owned badge to show count instead */}
    {purchasedItems.filter(purchase => purchase.id === item.id).length > 0 && (
      <View style={styles.ownedBadge}>
        <Text style={styles.ownedText}>
          Owned: {purchasedItems.filter(purchase => purchase.id === item.id).length}
        </Text>
      </View>
    )}
    
    <TouchableOpacity
      style={[
        styles.purchaseButton,
        coins < item.price ? styles.disabledButton : null
      ]}
      onPress={() => handlePurchase(item)}
      disabled={coins < item.price}
    >
      <Text style={styles.purchaseText}>
        Purchase
      </Text>
    </TouchableOpacity>
  </View>
);

  const getRarityColor = (rarity) => {
    switch(rarity) {
      case 'common': return '#8BC34A';
      case 'uncommon': return '#2196F3';
      case 'rare': return '#9C27B0';
      case 'legendary': return '#FFD700';
      default: return '#8BC34A';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <SvgBack width={24} height={24} />
          </TouchableOpacity>
          <Text style={styles.title}>Flower Shop</Text>
          <View style={styles.coinsContainer}>
            <Text style={styles.coinsText}>{coins}</Text>
            <SvgCoins width={24} height={24} />
          </View>
        </View>

        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'all' && styles.activeFilter]}
            onPress={() => setSelectedFilter('all')}
          >
            <Text style={styles.filterText}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'common' && styles.activeFilter]}
            onPress={() => setSelectedFilter('common')}
          >
            <Text style={styles.filterText}>Common</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'uncommon' && styles.activeFilter]}
            onPress={() => setSelectedFilter('uncommon')}
          >
            <Text style={styles.filterText}>Uncommon</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'rare' && styles.activeFilter]}
            onPress={() => setSelectedFilter('rare')}
          >
            <Text style={styles.filterText}>Rare</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'legendary' && styles.activeFilter]}
            onPress={() => setSelectedFilter('legendary')}
          >
            <Text style={styles.filterText}>Legendary</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={getFilteredItems()}
          renderItem={renderShopItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.shopList}
          numColumns={2}
        />
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
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 10,
    backgroundColor: '#1E3123',
    borderRadius: 20,
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  coinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E3123',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  coinsText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 5,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#1E3123',
    borderRadius: 20,
    overflow: 'hidden',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  activeFilter: {
    backgroundColor: '#2E4834',
  },
  filterText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  shopList: {
    paddingBottom: 20,
  },
  shopItem: {
    flex: 1,
    margin: 8,
    backgroundColor: '#1E3123',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  rarityIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  itemImage: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  itemName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  itemRarity: {
    color: 'white',
    opacity: 0.7,
    fontSize: 12,
    marginVertical: 4,
  },
  itemDescription: {
    color: 'white',
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 8,
    height: 40,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  priceText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 4,
  },
  purchaseButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  purchasedButton: {
    backgroundColor: '#888',
  },
  disabledButton: {
    backgroundColor: '#555',
  },
  purchaseText: {
    color: 'white',
    fontWeight: 'bold',
  },
ownedBadge: {
  position: 'absolute',
  top: 10,
  right: 10,
  backgroundColor: 'rgba(76, 175, 80, 0.7)',
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 12,
},
ownedText: {
  color: 'white',
  fontSize: 10,
  fontWeight: 'bold',
},
});