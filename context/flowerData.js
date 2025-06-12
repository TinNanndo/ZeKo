import flowersData from './flowers.json';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * INICIJALIZACIJA PODATAKA O CVIJEĆU
 */

/**
 * Lista svih tipova cvjetova s učitanim slikama
 * Mapira JSON podatke i dodaje stvarne reference na slike
 */
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
      return require('../assets/flowers/1.png'); // Rezervna opcija - prvi cvijet
  }
}

/**
 * FUNKCIJE ZA PRETRAGU I FILTRIRANJE CVJETOVA
 */

/**
 * Dohvaća cvjetove filtrirane po rijetkosti
 * @param {string} rarity - Rijetkost cvijeta ('common', 'uncommon', 'rare', 'legendary')
 * @returns {Array} - Lista filtriranih cvjetova
 */
export function getFlowersByRarity(rarity) {
  return FLOWER_TYPES.filter(flower => flower.rarity === rarity);
}

/**
 * Dohvaća nasumičan cvijet iz kolekcije
 * @returns {Object} - Nasumično odabrani cvijet
 */
export function getRandomFlower() {
  const randomIndex = Math.floor(Math.random() * FLOWER_TYPES.length);
  return FLOWER_TYPES[randomIndex];
}

/**
 * Pronalazi cvijet prema ID-u
 * @param {string} id - ID cvijeta koji se traži
 * @returns {Object} - Pronađeni cvijet ili prvi cvijet kao zadana vrijednost
 */
export function getFlowerById(id) {
  return FLOWER_TYPES.find(flower => flower.id === id) || FLOWER_TYPES[0];
}

/**
 * FUNKCIJE ZA RAD S KORISNIKOVIM CVIJEĆEM
 */

/**
 * Pronalazi cvijet koji je najmanje zastupljen u korisnikovoj kolekciji
 * @param {Array} grownFlowers - Lista već uzgojenih cvjetova
 * @returns {Object|null} - Najmanje zastupljen cvijet ili null
 */
export async function getLeastRepresentedFlower(grownFlowers = []) {
  try {
    // Provjera ima li korisnik kupljeno cvijeće
    const purchases = await AsyncStorage.getItem('shopPurchases');
    let purchasedFlowerIds = [];
    
    if (purchases) {
      // Izdvajanje osnovnih ID-ova (bez vremenskih oznaka)
      purchasedFlowerIds = JSON.parse(purchases).map(item => item.id);
    }
    
    // Dobivanje jedinstvenih ID-ova (bez duplikata)
    purchasedFlowerIds = [...new Set(purchasedFlowerIds)];
    
    // Ako korisnik nema kupljenog cvijeća, vraćamo null
    if (purchasedFlowerIds.length === 0) {
      return null;
    }
    
    // Dohvaćanje kupljenih cvjetova
    const purchasedFlowers = FLOWER_TYPES.filter(flower => 
      purchasedFlowerIds.includes(flower.id)
    );
    
    // Ako još nije uzgojeno nijedno cvijeće, vraćamo prvi kupljeni
    if (grownFlowers.length === 0) {
      return purchasedFlowers[0];
    }
    
    // Brojanje pojavljivanja svakog tipa cvijeta u kolekciji
    const flowerCounts = {};
    purchasedFlowers.forEach(flower => {
      flowerCounts[flower.id] = 0; // Inicijalizacija svih kupljenih cvjetova s 0
    });
    
    grownFlowers.forEach(flower => {
      const baseId = flower.id.split('_')[0]; // Obrada ID-ova s vremenskim oznakama
      if (flowerCounts[baseId] !== undefined) {
        flowerCounts[baseId] += 1;
      }
    });
    
    // Pronalaženje najmanje zastupljenog tipa cvijeta
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
    console.error('Greška pri dohvaćanju najmanje zastupljenog cvijeta:', error);
    return null;
  }
}

/**
 * Provjerava posjeduje li korisnik određeni cvijet
 * @param {string} flowerId - ID cvijeta koji se provjerava
 * @returns {boolean} - true ako korisnik posjeduje cvijet
 */
export async function isFlowerOwned(flowerId) {
  try {
    // Provjera među kupljenim cvjetovima
    const purchases = await AsyncStorage.getItem('shopPurchases');
    if (purchases) {
      const purchasedItems = JSON.parse(purchases);
      if (purchasedItems.some(item => item.id === flowerId)) {
        return true;
      }
    }
    
    // Provjera među uzgojenim cvjetovima
    const grownFlowers = await AsyncStorage.getItem('grownFlowers');
    if (grownFlowers) {
      const grownItems = JSON.parse(grownFlowers);
      if (grownItems.some(item => item.id.split('_')[0] === flowerId)) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Greška pri provjeri vlasništva cvijeta:', error);
    return false;
  }
}

/**
 * Dohvaća sve cvjetove dostupne korisniku
 * Uključuje običnu (common) sortu cvjetova i sve kupljene cvjetove
 * @returns {Array} - Lista dostupnih cvjetova
 */
export async function getAvailableFlowers() {
  try {
    const purchases = await AsyncStorage.getItem('shopPurchases');
    let purchasedIds = [];
    
    if (purchases) {
      purchasedIds = JSON.parse(purchases).map(item => item.id);
    }
    
    // Dohvat svih cvjetova koji su ili obični ili kupljeni
    return FLOWER_TYPES.filter(flower => 
      flower.rarity === 'common' || purchasedIds.includes(flower.id)
    );
  } catch (error) {
    console.error('Greška pri dohvaćanju dostupnih cvjetova:', error);
    return FLOWER_TYPES.filter(flower => flower.rarity === 'common');
  }
}