import flowersData from './flowers.json';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Map JSON data to include actual image requires
export const FLOWER_TYPES = flowersData.flowers.map(flower => ({
  ...flower,
  image: getFlowerImage(flower.imagePath)
}));

// Helper function to get image based on numbered path
function getFlowerImage(path) {
  switch(path) {
    case '1.png':
      return require('../assets/flowers/1.png');
    case '2.png':
      return require('../assets/flowers/2.png');
    case '3.png':
      return require('../assets/flowers/3.png');
    case '4.png':
      return require('../assets/flowers/4.png');
    case '5.png':
      return require('../assets/flowers/5.png');
    case '6.png':
      return require('../assets/flowers/6.png');
    case '7.png':
      return require('../assets/flowers/7.png');
    case '8.png':
      return require('../assets/flowers/8.png');
    case '9.png':
      return require('../assets/flowers/9.png');
    case '10.png':
      return require('../assets/flowers/10.png');
    case '11.png':
      return require('../assets/flowers/11.png');
    case '12.png':
      return require('../assets/flowers/12.png');
    default:
      return require('../assets/flowers/1.png'); // Fallback to the first flower
  }
}

// Modify getLeastRepresentedFlower to handle no active flower
export async function getLeastRepresentedFlower(grownFlowers = []) {
  try {
    // Check if user has any purchased flowers
    const purchases = await AsyncStorage.getItem('shopPurchases');
    let purchasedFlowerIds = [];
    
    if (purchases) {
      // Extract the base IDs (without timestamps)
      purchasedFlowerIds = JSON.parse(purchases).map(item => item.id);
    }
    
    // Get unique flower IDs (no duplicates)
    purchasedFlowerIds = [...new Set(purchasedFlowerIds)];
    
    // If user has no purchased flowers, return null (no flower)
    if (purchasedFlowerIds.length === 0) {
      return null;
    }
    
    // Otherwise get purchased flowers
    const purchasedFlowers = FLOWER_TYPES.filter(flower => 
      purchasedFlowerIds.includes(flower.id)
    );
    
    // If no flowers have been grown yet, return the first purchased flower
    if (grownFlowers.length === 0) {
      return purchasedFlowers[0];
    }
    
    // Count occurrences of each flower type in the collection
    const flowerCounts = {};
    purchasedFlowers.forEach(flower => {
      flowerCounts[flower.id] = 0; // Initialize all purchased flowers with 0 count
    });
    
    grownFlowers.forEach(flower => {
      const baseId = flower.id.split('_')[0]; // Handle IDs with timestamps
      if (flowerCounts[baseId] !== undefined) {
        flowerCounts[baseId] += 1;
      }
    });
    
    // Find least represented flower type
    let leastRepresentedFlower = purchasedFlowers[0];
    let minCount = Number.MAX_SAFE_INTEGER;
    
    Object.keys(flowerCounts).forEach(flowerId => {
      const count = flowerCounts[flowerId];
      if (count < minCount) {
        minCount = count;
        leastRepresentedFlower = FLOWER_TYPES.find(f => f.id === flowerId);
      }
    });
    
    return leastRepresentedFlower;
  } catch (error) {
    console.error('Error getting least represented flower:', error);
    return null; // Return null if there's an error
  }
}

export async function isFlowerOwned(flowerId) {
  try {
    // Check purchased flowers
    const purchases = await AsyncStorage.getItem('shopPurchases');
    if (purchases) {
      const purchasedItems = JSON.parse(purchases);
      if (purchasedItems.some(item => item.id === flowerId)) {
        return true;
      }
    }
    
    // Check grown flowers
    const grownFlowers = await AsyncStorage.getItem('grownFlowers');
    if (grownFlowers) {
      const grownItems = JSON.parse(grownFlowers);
      if (grownItems.some(item => item.id.split('_')[0] === flowerId)) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking if flower is owned:', error);
    return false;
  }
}

export async function getAvailableFlowers() {
  try {
    const purchases = await AsyncStorage.getItem('shopPurchases');
    let purchasedIds = [];
    
    if (purchases) {
      purchasedIds = JSON.parse(purchases).map(item => item.id);
    }
    
    // Get all flowers that are either common or have been purchased
    return FLOWER_TYPES.filter(flower => 
      flower.rarity === 'common' || purchasedIds.includes(flower.id)
    );
  } catch (error) {
    console.error('Error getting available flowers:', error);
    return FLOWER_TYPES.filter(flower => flower.rarity === 'common');
  }
}

// Get flowers by rarity
export function getFlowersByRarity(rarity) {
  return FLOWER_TYPES.filter(flower => flower.rarity === rarity);
}

// Get a random flower
export function getRandomFlower() {
  const randomIndex = Math.floor(Math.random() * FLOWER_TYPES.length);
  return FLOWER_TYPES[randomIndex];
}

// Get a flower by ID
export function getFlowerById(id) {
  return FLOWER_TYPES.find(flower => flower.id === id) || FLOWER_TYPES[0];
}