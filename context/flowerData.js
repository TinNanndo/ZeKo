import flowersData from './flowers.json';

// Map JSON data to include actual image requires
export const FLOWER_TYPES = flowersData.flowers.map(flower => ({
  ...flower,
  image: getFlowerImage(flower.imagePath)
}));

// Helper function to get image based on path
function getFlowerImage(path) {
  switch(path) {
    case 'rose.png':
      return require('../assets/flowers/rose.png');
    case 'tulip.png':
      return require('../assets/flowers/tulip.png');
    case 'sunflower.png':
      return require('../assets/flowers/sunflower.png');
    case 'lily.png':
      return require('../assets/flowers/lily.png');
    case 'orchid.png':
      return require('../assets/flowers/orchid.png');
    default:
      return require('../assets/flowers/rose.png'); // Fallback
  }
}

// Helper to find the least represented flower
export function getLeastRepresentedFlower(grownFlowers) {
  // Count occurrences of each flower type in the collection
  const flowerCounts = {};
  grownFlowers.forEach(flower => {
    const baseId = flower.id.split('_')[0];
    flowerCounts[baseId] = (flowerCounts[baseId] || 0) + 1;
  });
  
  // Find least represented flower type
  let leastRepresentedFlower = FLOWER_TYPES[0];
  let minCount = Number.MAX_SAFE_INTEGER;
  
  FLOWER_TYPES.forEach(flowerType => {
    const count = flowerCounts[flowerType.id] || 0;
    if (count < minCount) {
      minCount = count;
      leastRepresentedFlower = flowerType;
    }
  });
  
  return leastRepresentedFlower;
}