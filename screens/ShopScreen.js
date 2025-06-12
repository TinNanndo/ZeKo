import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStats } from '../context/StatsContext';
import { FLOWER_TYPES } from '../context/flowerData';

// Ikone
import SvgCoins from '../assets/icons/coins.svg';
import SvgBack from '../assets/icons/back.svg';

/**
 * ShopScreen - Zaslon za trgovinu cvijećem
 * 
 * Omogućuje korisniku kupovinu cvijeća za novčiće zarađene hodanjem.
 * Sadrži funkcionalnosti za:
 * 1. Filtriranje cvijeća prema rijetkosti
 * 2. Kupovinu cvijeća i oduzimanje novčića
 * 3. Postavljanje kupljenog cvijeta kao aktivnog
 * 4. Praćenje kolekcije kupljenih cvjetova
 */
export default function ShopScreen({ navigation }) {
  // --- STANJE APLIKACIJE ---
  const { coins, setCoins, updateLastTrackedStepCount } = useStats();
  const [shopItems, setShopItems] = useState([]);             // Popis artikala u trgovini
  const [purchasedItems, setPurchasedItems] = useState([]); // Kupljeni artikli
  const [selectedFilter, setSelectedFilter] = useState('all'); // Aktivni filter za prikaz artikala

  // --- UČITAVANJE PODATAKA ---
  
  /**
   * Učitavanje podataka trgovine prilikom prvog renderiranja
   */
  useEffect(() => {
    loadShopData();
  }, []);

  /**
   * Funkcija za učitavanje podataka trgovine i kupljenih artikala
   * Dohvaća kupljene artikle iz AsyncStorage-a i stvara popis 
   * dostupnih cvjetova za kupovinu
   */
  const loadShopData = async () => {
    try {
      // Učitavanje kupljenih artikala
      const storedPurchases = await AsyncStorage.getItem('shopPurchases');
      if (storedPurchases) {
        setPurchasedItems(JSON.parse(storedPurchases));
      }
      
      // Stvaranje artikala za trgovinu iz podataka o cvijeću
      const items = FLOWER_TYPES.map(flower => ({
        id: flower.id,
        name: flower.name,
        image: flower.image,
        price: getPriceByRarity(flower.rarity),
        rarity: flower.rarity,
        description: flower.description
      }));
      
      setShopItems(items);
    } catch (error) {
      console.error('Greška pri učitavanju podataka trgovine:', error);
    }
  };

  // --- POMOĆNE FUNKCIJE ---

  /**
   * Određuje cijenu cvijeta na temelju njegove rijetkosti
   * @param {string} rarity - Rijetkost cvijeta
   * @returns {number} - Cijena cvijeta u novčićima
   */
  const getPriceByRarity = (rarity) => {
    switch(rarity) {
      case 'common': return 50;     // Obično
      case 'uncommon': return 1000; // Neuobičajeno
      case 'rare': return 2500;     // Rijetko
      case 'legendary': return 5000; // Legendarno
      default: return 500;
    }
  };

  /**
   * Filtrira artikle na temelju odabranog filtera
   * @returns {Array} - Filtrirana lista artikala
   */
  const getFilteredItems = () => {
    if (selectedFilter === 'all') return shopItems;
    return shopItems.filter(item => item.rarity === selectedFilter);
  };

  /**
   * Vraća boju koja odgovara rijetkosti cvijeta za vizualni indikator
   * @param {string} rarity - Rijetkost cvijeta
   * @returns {string} - Hex kod boje
   */
  const getRarityColor = (rarity) => {
    switch(rarity) {
      case 'common': return '#8BC34A';    // Zelena za obično
      case 'uncommon': return '#2196F3';  // Plava za neuobičajeno
      case 'rare': return '#9C27B0';      // Ljubičasta za rijetko
      case 'legendary': return '#FFD700'; // Zlatna za legendarno
      default: return '#8BC34A';
    }
  };

  /**
   * Pretvara engleski naziv rijetkosti u odgovarajući engleski naziv za prikaz
   * @param {string} rarity - Rijetkost na engleskom
   * @returns {string} - Rijetkost za prikaz
   */
  const translateRarity = (rarity) => {
    switch(rarity) {
      case 'common': return 'Common';
      case 'uncommon': return 'Uncommon';
      case 'rare': return 'Rare';
      case 'legendary': return 'Legendary';
      default: return rarity;
    }
  };

  // --- PROCESIRANJE KUPOVINE ---

  /**
   * Obrađuje kupovinu cvijeta
   * Oduzima novčiće, dodaje cvijet u kolekciju i postavlja ga kao aktivan ako je potrebno
   * @param {Object} item - Artikl koji se kupuje
   */
  const handlePurchase = async (item) => {
    // Provjera ima li korisnik dovoljno novčića
    if (coins < item.price) {
      Alert.alert('Not Enough Coins', 'Walk more to earn coins!');
      return;
    }

    // Ažuriranje stanja novčića
    setCoins(coins - item.price);
    await AsyncStorage.setItem('coins', (coins - item.price).toString());

    // Stvaranje jedinstvenog ID-a za ovu kupnju
    const purchaseId = `${item.id}_${Date.now()}`;
    
    // Dodavanje u kupljene artikle
    const newPurchases = [...purchasedItems, { 
      id: item.id,
      purchaseId: purchaseId,
      purchasedAt: new Date().toISOString() 
    }];
    setPurchasedItems(newPurchases);
    await AsyncStorage.setItem('shopPurchases', JSON.stringify(newPurchases));

    // Provjera je li ovo prva kupnja cvijeta
    const isFirstPurchase = purchasedItems.length === 0;

    // Ako je prva kupnja, automatski postavlja cvijet kao aktivan
    if (isFirstPurchase) {
      const purchasedFlower = FLOWER_TYPES.find(f => f.id === item.id);
      if (purchasedFlower) {
        // Stvaranje instance cvijeta
        const flowerWithInstance = {
          ...purchasedFlower,
          instanceId: `${item.id}_instance0`,
          instanceNumber: 1
        };
        
        // Inicijalizacija mape napretka za ovaj cvijet
        const flowerProgressMap = await AsyncStorage.getItem('flowerProgressMap');
        const progressMap = flowerProgressMap ? JSON.parse(flowerProgressMap) : {};
        progressMap[flowerWithInstance.instanceId] = 0;
        
        // Spremanje podataka o cvijetu
        await AsyncStorage.setItem('flowerProgressMap', JSON.stringify(progressMap));
        await AsyncStorage.setItem('activeFlower', JSON.stringify(flowerWithInstance));
        await AsyncStorage.setItem('growthProgress', '0');
        await updateLastTrackedStepCount();
        
        // Obavijest o kupnji i navigacija na vrt
        Alert.alert(
          'First Flower Purchased!', 
          `You bought ${item.name}. It has been set as your active flower. Return to the garden to watch it grow!`,
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
        Alert.alert('Purchase Successful', `You bought ${item.name}.`);
      }
    } else {
      // Za kasnije kupnje, pita korisnika želi li postaviti cvijet kao aktivan
      Alert.alert(
        'Purchase Successful', 
        `You bought ${item.name}. Would you like to set it as your active flower?`,
        [
          { 
            text: 'Yes', 
            onPress: async () => {
              const purchasedFlower = FLOWER_TYPES.find(f => f.id === item.id);
              if (purchasedFlower) {
                // Stvaranje instance za novi cvijet
                const instanceIdx = purchasedItems.filter(p => p.id === item.id).length - 1;
                const flowerWithInstance = {
                  ...purchasedFlower,
                  instanceId: `${item.id}_instance${instanceIdx}`,
                  instanceNumber: instanceIdx + 1
                };
                
                // Postavljanje kao aktivnog cvijeta i resetiranje napretka
                await AsyncStorage.setItem('activeFlower', JSON.stringify(flowerWithInstance));
                await AsyncStorage.setItem('growthProgress', '0');
                await AsyncStorage.setItem('lastTrackedStepCount', stepCount.toString());
                
                // Navigacija na vrt
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

  // --- KOMPONENTE ZA RENDERIRANJE ---

  /**
   * Renderira pojedinačni artikl u trgovini
   */
  const renderShopItem = ({ item }) => (
    <View style={styles.shopItem}>
      <View style={[styles.rarityIndicator, { backgroundColor: getRarityColor(item.rarity) }]} />
      <Image source={item.image} style={styles.itemImage} />
      <Text style={styles.itemName}>{item.name}</Text>
      <Text style={styles.itemRarity}>{translateRarity(item.rarity)}</Text>
      <Text style={styles.itemDescription}>{item.description}</Text>
      <View style={styles.priceContainer}>
        <Text style={styles.priceText}>{item.price}</Text>
        <SvgCoins width={16} height={16} />
      </View>
      
      {/* Oznaka za vlasništvo s brojem */}
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
          Buy
        </Text>
      </TouchableOpacity>
    </View>
  );

  // --- PRIKAZ ZASLONA ---
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Zaglavlje s gumbom za povratak, naslovom i stanjem novčića */}
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

        {/* Filteri za prikaz različitih tipova cvijeća */}
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

        {/* Lista artikala u trgovini */}
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

// --- STILOVI ---
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
    borderWidth: 2,
    borderColor: '#1E3123',
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