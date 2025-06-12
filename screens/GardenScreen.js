import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStats } from '../context/StatsContext';
import { FLOWER_TYPES } from '../context/flowerData';
import { useFocusEffect } from '@react-navigation/native';

// Uvoz ikona
import SvgCoins from '../assets/icons/coins.svg';
import SvgShop from '../assets/icons/shop.svg';

/**
 * GardenScreen - Zaslon za upravljanje virtualnim vrtom
 * 
 * Glavni zaslon za uzgoj virtualnog cvijeća koji omogućuje sljedeće funkcionalnosti:
 * 1. Praćenje rasta aktivnog cvijeta na temelju broja koraka
 * 2. Pregled kolekcije uzgojenog cvijeća
 * 3. Odabir cvijeta za uzgoj
 * 4. Kupnju novog cvijeća u trgovini
 */
export default function GardenScreen({ navigation, route }) {
  // --- STANJE APLIKACIJE ---
  
  // Podatci iz konteksta statistike
  const { stepCount, coins } = useStats();
  
  // Stanje cvijeća u vrtu
  const [activeFlower, setActiveFlower] = useState(null);          // Trenutno aktivni cvijet
  const [grownFlowers, setGrownFlowers] = useState([]);           // Uzgojeno cvijeće
  const [growthProgress, setGrowthProgress] = useState(0);        // Napredak rasta aktivnog cvijeta
  const [purchasedFlowers, setPurchasedFlowers] = useState([]);   // Kupljeno cvijeće
  const [flowerProgressMap, setFlowerProgressMap] = useState({}); // Mapa napretka za svaki cvijet
  
  // Stanje sučelja
  const [showCollection, setShowCollection] = useState(false);       // Prikaz kolekcije ili aktivnog cvijeta
  const [showFlowerSelector, setShowFlowerSelector] = useState(false); // Prikaz modalnog prozora za odabir cvijeta

  // --- UČITAVANJE I INICIJALIZACIJA PODATAKA ---
  
  /**
   * Osvježavanje podataka kad se zaslon fokusira
   * Provjerava je li nastupio novi dan i učitava podatke o vrtu
   */
  useFocusEffect(
    React.useCallback(() => {
      const checkDayChange = async () => {
        const today = new Date().toISOString().split('T')[0];
        const lastSavedDate = await AsyncStorage.getItem('lastSavedDate');
        
        if (lastSavedDate !== today) {
          // Novi dan, resetiraj praćenje koraka za cvijet
          await AsyncStorage.setItem('lastTrackedStepCount', '0');
        }
        
        // Učitaj podatke o vrtu i kupljenim cvjetovima
        loadGardenData();
        loadPurchasedFlowers();
      };
      
      checkDayChange();
      
      return () => {};
    }, [])
  );

  /**
   * Provjera parametara rute za novo kupljeno cvijeće
   * Ažurira se kada korisnik kupi novi cvijet u trgovini
   */
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (route.params?.newFlower) {
        // Izbjegavanje višestrukog osvježavanja
        navigation.setParams({ newFlower: undefined });
        
        // Osvježi listu kupljenog cvijeća
        loadPurchasedFlowers();
        
        // Ako cvijet treba postati aktivan, osvježi i to
        if (route.params?.makeActive) {
          loadGardenData();
        }
      }
    });

    return unsubscribe;
  }, [navigation, route]);

  /**
   * Početno učitavanje podataka o vrtu
   */
  useEffect(() => {
    loadGardenData();
  }, []);

  /**
   * Učitavanje kupljenog cvijeća iz pohrane
   * Obrađuje svaki kupljeni cvijet i dodaje mu podatke o primjerku
   */
  const loadPurchasedFlowers = async () => {
    try {
      const purchases = await AsyncStorage.getItem('shopPurchases');
      if (purchases) {
        const purchasedItems = JSON.parse(purchases);
        
        // Brojanje primjeraka svakog tipa cvijeta
        const flowerCounts = {};
        purchasedItems.forEach(item => {
          flowerCounts[item.id] = (flowerCounts[item.id] || 0) + 1;
        });
        
        // Stvaranje objekata cvijeća s podacima o primjerku
        const flowersWithCounts = [];
        
        purchasedItems.forEach((purchaseItem, index) => {
          const flowerType = FLOWER_TYPES.find(f => f.id === purchaseItem.id);
          
          if (flowerType) {
            // Izračun broja primjerka ovog cvijeta
            const sameTypeItems = purchasedItems.filter(
              (p, i) => p.id === purchaseItem.id && i <= index
            );
            const instanceNumber = sameTypeItems.length;
            
            // Stvaranje jedinstvenog ID-a za ovaj primjerak
            const instanceId = `${purchaseItem.id}_instance${instanceNumber - 1}`;
            
            // Stvaranje objekta s podacima o primjerku
            const flowerWithInstance = {
              ...flowerType,
              instanceId,
              instanceNumber,
              purchaseId: purchaseItem.purchaseId,
              count: flowerCounts[purchaseItem.id]
            };
            
            flowersWithCounts.push(flowerWithInstance);
          }
        });
        
        setPurchasedFlowers(flowersWithCounts);
      } else {
        setPurchasedFlowers([]);
      }
    } catch (error) {
      console.error('Greška pri učitavanju kupljenog cvijeća:', error);
      setPurchasedFlowers([]);
    }
  };

  // --- PRAĆENJE RASTA CVIJETA ---

  /**
   * Praćenje napretka rasta cvijeta na temelju koraka
   * Automatski ažurira napredak kad korisnik napravi korake
   */
  useEffect(() => {
    if (!activeFlower) return;
    
    const updateGrowth = async () => {
      try {
        // Dohvat zadnjeg broja koraka
        const lastStepCount = parseInt(await AsyncStorage.getItem('lastTrackedStepCount') || '0', 10);
        
        // Provjera ima li novih koraka
        if (stepCount <= lastStepCount) return;
        
        // Izračun novih koraka
        const stepsSinceLastUpdate = stepCount - lastStepCount;
        await AsyncStorage.setItem('lastTrackedStepCount', stepCount.toString());
        
        // Određivanje množitelja rasta prema rijetkosti cvijeta
        let growthMultiplier = 1;
        
        switch (activeFlower.rarity) {
          case 'legendary':
            growthMultiplier = 2.0; // 2x brži rast za legendarno cvijeće
            break;
          case 'rare':
            growthMultiplier = 1.5; // 1.5x brži rast za rijetko cvijeće
            break;
          case 'uncommon':
            growthMultiplier = 1.2; // 1.2x brži rast za neuobičajeno cvijeće
            break;
        }
        
        // Primjena množitelja na korake
        const effectiveSteps = Math.round(stepsSinceLastUpdate * growthMultiplier);
        
        // Dohvat trenutnog napretka i izračun novog
        const currentProgress = flowerProgressMap[activeFlower.instanceId] || 0;
        const newProgress = currentProgress + effectiveSteps;
        
        // Ažuriranje stanja
        setGrowthProgress(newProgress);
        
        // Ažuriranje mape napretka u stanju i pohrani
        const updatedMap = {...flowerProgressMap, [activeFlower.instanceId]: newProgress};
        setFlowerProgressMap(updatedMap);
        await AsyncStorage.setItem('flowerProgressMap', JSON.stringify(updatedMap));
        
        // Provjera je li cvijet potpuno izrastao
        if (newProgress >= activeFlower.stepsToGrow) {
          // Dodavanje u kolekciju uzgojenog cvijeća
          const newGrownFlower = {
            ...activeFlower,
            grownAt: Date.now()
          };
          
          // Ažuriranje liste uzgojenog cvijeća
          const storedGrownFlowers = await AsyncStorage.getItem('grownFlowers');
          const currentGrownFlowers = storedGrownFlowers ? JSON.parse(storedGrownFlowers) : [];
          currentGrownFlowers.push(newGrownFlower);
          
          await AsyncStorage.setItem('grownFlowers', JSON.stringify(currentGrownFlowers));
          setGrownFlowers(currentGrownFlowers);
          
          // Resetiranje napretka za ovaj cvijet
          const resetMap = {...updatedMap, [activeFlower.instanceId]: 0};
          setFlowerProgressMap(resetMap);
          setGrowthProgress(0);
          await AsyncStorage.setItem('flowerProgressMap', JSON.stringify(resetMap));
          await AsyncStorage.setItem('lastTrackedStepCount', stepCount.toString());
          
          // Obavijest o završetku uzgoja
          Alert.alert(
            'Flower has grown!',
            `Your ${activeFlower.name} has fully grown and was added to your collection!`,
            [{ text: 'Great!', style: 'default' }]
          );
        }
      } catch (error) {
        console.error('Greška pri ažuriranju rasta:', error);
      }
    };
    
    // Pokreni odmah i zatim svakih 5 sekundi
    updateGrowth();
    const stepCheckInterval = setInterval(updateGrowth, 5000);
    
    return () => clearInterval(stepCheckInterval);
  }, [stepCount, activeFlower, flowerProgressMap]);
  
  /**
   * Učitavanje podataka o vrtu iz trajne pohrane
   * Dohvaća aktivni cvijet, uzgojeno cvijeće i mapu napretka
   */
  const loadGardenData = async () => {
    try {
      const storedActiveFlower = await AsyncStorage.getItem('activeFlower');
      const storedGrownFlowers = await AsyncStorage.getItem('grownFlowers');
      const storedFlowerProgress = await AsyncStorage.getItem('flowerProgressMap');
      
      // Učitavanje mape napretka cvijeta
      if (storedFlowerProgress) {
        const progressMap = JSON.parse(storedFlowerProgress);
        setFlowerProgressMap(progressMap);
      }
      
      // Inicijalizacija praćenja koraka ako ne postoji
      const lastTrackedStep = await AsyncStorage.getItem('lastTrackedStepCount');
      if (!lastTrackedStep) {
        await AsyncStorage.setItem('lastTrackedStepCount', stepCount.toString());
      }
      
      // Učitavanje uzgojenog cvijeća
      if (storedGrownFlowers) {
        setGrownFlowers(JSON.parse(storedGrownFlowers));
      }
      
      // Učitavanje aktivnog cvijeta
      if (storedActiveFlower && storedActiveFlower !== 'null') {
        const flower = JSON.parse(storedActiveFlower);
        setActiveFlower(flower);
        
        // Postavljanje napretka za aktivni cvijet
        if (flower.instanceId) {
          const progressMap = storedFlowerProgress ? JSON.parse(storedFlowerProgress) : {};
          setGrowthProgress(progressMap[flower.instanceId] || 0);
        } else {
          setGrowthProgress(0);
        }
      }
    } catch (error) {
      console.error('Greška pri učitavanju podataka o vrtu:', error);
      setActiveFlower(null);
    }
  };

  // --- FUNKCIJE KORISNIČKOG SUČELJA ---

  /**
   * Navigacija na zaslon trgovine
   */
  const navigateToShop = () => {
    navigation.navigate('Shop');
  };

  /**
   * Odabir cvijeta za uzgoj
   * @param {Object} flower - Cvijet koji će postati aktivan
   */
  const selectFlower = async (flower) => {
    try {
      // Postavljanje odabranog cvijeta kao aktivnog
      setActiveFlower(flower);
      await AsyncStorage.setItem('activeFlower', JSON.stringify(flower));
      
      // Resetiranje praćenja koraka
      await AsyncStorage.setItem('lastTrackedStepCount', stepCount.toString());
      
      // Postavljanje ispravnog napretka za ovaj cvijet
      if (flower.instanceId && flowerProgressMap[flower.instanceId] !== undefined) {
        setGrowthProgress(flowerProgressMap[flower.instanceId]);
      } else {
        // Početak s 0 ako ne postoji prethodni napredak
        setGrowthProgress(0);
        const updatedMap = {...flowerProgressMap, [flower.instanceId]: 0};
        setFlowerProgressMap(updatedMap);
        await AsyncStorage.setItem('flowerProgressMap', JSON.stringify(updatedMap));
      }
      
      // Zatvaranje modalnog prozora za odabir
      setShowFlowerSelector(false);
    } catch (error) {
      console.error('Greška pri odabiru cvijeta:', error);
    }
  };

  // --- KOMPONENTE ZA RENDERIRANJE ---

  /**
   * Renderiranje stavke uzgojenog cvijeta u kolekciji
   */
  const renderFlowerItem = ({ item }) => (
    <View style={styles.flowerItem}>
      <Image source={item.image} style={styles.flowerImage} />
      <Text style={styles.flowerName}>{item.name}</Text>
      <Text style={styles.flowerDate}>
        {new Date(item.grownAt).toLocaleDateString()}
      </Text>
    </View>
  );

  /**
   * Renderiranje stavke cvijeta u izborniku za odabir
   */
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
            ? `${activeFlower.stepsToGrow - growthProgress} more steps to grow`
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

  // --- GLAVNI RENDER ---
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Gornja traka s novčićima i gumbom za trgovinu */}
        <View style={styles.topBar}>
          <View style={styles.coinsContainer}>
            <Text style={styles.coinsText}>{coins}</Text>
            <SvgCoins width={24} height={24} />
          </View>

          <TouchableOpacity 
            style={styles.shopButton}
            onPress={navigateToShop}
          >
            <SvgShop width={24} height={24} />
          </TouchableOpacity>
        </View>

        {/* Prekidač za izbor prikaza (uzgoj/kolekcija) */}
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

        {/* Prikaz zaslona za uzgoj ili kolekcije ovisno o izboru */}
        {!showCollection ? (
          <View style={styles.gardenContainer}>          
            {activeFlower ? (
              <>
                {/* Prikaz aktivnog cvijeta i trake napretka */}
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
                        { width: `${Math.min((growthProgress / activeFlower.stepsToGrow) * 100, 100)}%` }
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {growthProgress}/{activeFlower.stepsToGrow} steps 
                    ({Math.round((growthProgress / activeFlower.stepsToGrow) * 100)}%)
                  </Text>
                </View>
                
                {/* Prikaz kupljenog cvijeća */}
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
              // Prikaz kad nema aktivnog cvijeta
              <View style={styles.noFlowerContainer}>
                <Text style={styles.noFlowerTitle}>No Active Flower</Text>
                <Text style={styles.noFlowerText}>
                  You don't have any flowers yet! Collect coins by walking and buy your first flower in the shop.
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
          // Prikaz kolekcije uzgojenog cvijeća
          <FlatList
            data={grownFlowers}
            renderItem={renderFlowerItem}
            keyExtractor={item => item.id}
            numColumns={2}
            contentContainerStyle={styles.collectionContainer}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                You haven't grown any flowers yet. Start walking to grow your first flowers!
              </Text>
            }
          />
        )}

        {/* Modalni prozor za odabir cvijeta */}
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
  flex: 1,
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