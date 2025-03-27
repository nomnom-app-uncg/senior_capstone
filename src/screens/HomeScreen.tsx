// src/screens/HomeScreen.tsx
import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import {
  Image,
  StyleSheet,
  Platform,
  View,
  SafeAreaView,
  Text,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  ImageBackground,
  Animated,
  Easing,
  FlatList,
  Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { HelloWave } from '@/components/HelloWave';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from "react-native-vector-icons/Ionicons";
import { BlurView } from 'expo-blur';
import { generateRecipeWithImage, generateTrendingRecipes } from "@/services/OpenAIService";

const { width, height } = Dimensions.get('window');

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  index: number;
}

interface CategoryItemProps {
  icon: string;
  label: string;
  color: string;
}

interface RecipeCardProps {
  image: string;
  title: string;
  time: string;
  rating: number;
  onPress: () => void;
}

interface TrendingRecipe {
  title: string;
  time: string;
  rating: number;
  description: string;
  image: string;
  ingredients: string[];
  instructions: string[];
  servings: string;
  difficulty: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, index }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(50)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(index * 200),
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.5)),
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={1}
    >
      <Animated.View
        style={[
          styles.featureCard,
          {
            transform: [
              { scale: scaleAnim },
              { translateY },
            ],
            opacity,
          },
        ]}
      >
        <Ionicons name={icon} size={32} color="#6FA35E" />
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureText}>{description}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const CategoryItem: React.FC<CategoryItemProps> = ({ icon, label, color }) => (
  <TouchableOpacity style={styles.categoryItem}>
    <View style={[styles.categoryIcon, { backgroundColor: color }]}>
      <Ionicons name={icon} size={24} color="white" />
    </View>
    <Text style={styles.categoryLabel}>{label}</Text>
  </TouchableOpacity>
);

const RecipeCard: React.FC<RecipeCardProps> = ({ image, title, time, rating, onPress }) => (
  <TouchableOpacity style={styles.recipeCard} onPress={onPress}>
    <Image 
      source={{ uri: image }} 
      style={styles.recipeImage}
      resizeMode="cover"
    />
    <View style={styles.recipeInfo}>
      <Text style={styles.recipeTitle}>{title}</Text>
      <View style={styles.recipeMetaInfo}>
        <View style={styles.recipeTime}>
          <Ionicons name="time-outline" size={14} color="#666" />
          <Text style={styles.recipeMetaText}>{time}</Text>
        </View>
        <View style={styles.recipeRating}>
          <Ionicons name="star" size={14} color="#FFD700" />
          <Text style={styles.recipeMetaText}>{rating}</Text>
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

const HomeScreen: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [trendingRecipes, setTrendingRecipes] = useState<TrendingRecipe[]>([]);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const [selectedRecipe, setSelectedRecipe] = useState<TrendingRecipe | null>(null);

  const categories = useMemo(() => [
    { icon: 'pizza-outline', label: 'Main Dish', color: '#FF6B6B' },
    { icon: 'cafe-outline', label: 'Breakfast', color: '#4ECDC4' },
    { icon: 'ice-cream-outline', label: 'Dessert', color: '#FFD93D' },
    { icon: 'wine-outline', label: 'Drinks', color: '#6C5CE7' },
  ], []);

  const fetchTrendingRecipes = async () => {
    setIsLoadingRecipes(true);
    try {
      const recipes = await generateTrendingRecipes();
      if (recipes.length > 0) {
        setTrendingRecipes(recipes);
      } else {
        console.error("No recipes generated");
      }
    } catch (error) {
      console.error("Error fetching trending recipes:", error);
    } finally {
      setIsLoadingRecipes(false);
    }
  };

  useEffect(() => {
    const checkLoginStatus = async () => {
      const token = await AsyncStorage.getItem('userToken');
      setIsLoggedIn(!!token);
    };
    checkLoginStatus();

    // Generate initial trending recipes
    fetchTrendingRecipes();

    // Animate welcome title
    Animated.parallel([
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(titleTranslateY, {
        toValue: 0,
        duration: 1000,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  if (isLoggedIn === null) {
    return <ThemedText>Loading...</ThemedText>;
  }

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [0, -50],
    extrapolate: 'clamp',
  });

  const imageScale = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [1.2, 1],
    extrapolateLeft: 'extend',
    extrapolateRight: 'clamp',
  });

  const RecipeModal = () => (
    <Modal
      visible={!!selectedRecipe}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setSelectedRecipe(null)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView bounces={false}>
            {selectedRecipe && (
              <>
                <Image 
                  source={{ uri: selectedRecipe.image }}
                  style={styles.modalImage}
                  resizeMode="cover"
                />
                <View style={styles.modalBody}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{selectedRecipe.title}</Text>
                    <TouchableOpacity 
                      style={styles.closeButton}
                      onPress={() => setSelectedRecipe(null)}
                    >
                      <Ionicons name="close" size={24} color="#333" />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.recipeMetaContainer}>
                    <View style={styles.recipeMeta}>
                      <Ionicons name="time-outline" size={20} color="#6FA35E" />
                      <Text style={styles.recipeMetaLabel}>{selectedRecipe.time}</Text>
                    </View>
                    <View style={styles.recipeMeta}>
                      <Ionicons name="people-outline" size={20} color="#6FA35E" />
                      <Text style={styles.recipeMetaLabel}>{selectedRecipe.servings}</Text>
                    </View>
                    <View style={styles.recipeMeta}>
                      <Ionicons name="speedometer-outline" size={20} color="#6FA35E" />
                      <Text style={styles.recipeMetaLabel}>{selectedRecipe.difficulty}</Text>
                    </View>
                  </View>

                  <Text style={styles.sectionTitle}>Description</Text>
                  <Text style={styles.description}>{selectedRecipe.description}</Text>

                  <Text style={styles.sectionTitle}>Ingredients</Text>
                  {selectedRecipe.ingredients.map((ingredient, index) => (
                    <Text key={index} style={styles.ingredient}>• {ingredient}</Text>
                  ))}

                  <Text style={styles.sectionTitle}>Instructions</Text>
                  {selectedRecipe.instructions.map((step, index) => (
                    <View key={index} style={styles.instructionStep}>
                      <Text style={styles.stepNumber}>{index + 1}</Text>
                      <Text style={styles.stepText}>{step}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View style={[styles.headerBackground, { transform: [{ translateY: headerTranslateY }] }]}>
        <Animated.Image
          source={require("@/assets/images/food-background.jpg")}
          style={[
            styles.backgroundImage,
            {
              transform: [{ scale: imageScale }],
            },
          ]}
          resizeMode="cover"
        />
      </Animated.View>

      <LinearGradient
        colors={['transparent', '#FFFFFF', 'rgba(212,233,199,0.95)']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        locations={[0, 0.2, 1]}
      >
        <Animated.ScrollView
          style={styles.scrollView}
          bounces={true}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
        >
          <View style={styles.container}>
            <View style={styles.headerSpacer} />

            {/* Categories Section */}
            <View style={styles.categoriesSection}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Explore Categories
              </ThemedText>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={categories}
                renderItem={({ item }) => (
                  <CategoryItem
                    icon={item.icon}
                    label={item.label}
                    color={item.color}
                  />
                )}
                keyExtractor={(item) => item.label}
                contentContainerStyle={styles.categoriesList}
              />
            </View>

            {/* Welcome Section with enhanced styling */}
            <View style={styles.welcomeSection}>
              <Animated.View
                style={[
                  styles.titleContainer,
                  {
                    opacity: titleOpacity,
                    transform: [{ translateY: titleTranslateY }],
                  },
                ]}
              >
                <ThemedText type="title" style={styles.welcomeTitle}>
                  WELCOME TO NOMNOM!
                </ThemedText>
                <HelloWave />
              </Animated.View>

              <View style={styles.welcomeContent}>
                <ThemedText type="subtitle" style={styles.welcomeSubtitle}>
                  Your Culinary Journey Starts Here!
                </ThemedText>
                <ThemedText style={styles.welcomeText}>
                  Discover recipes, manage your virtual fridge, and explore the world of cooking with NomNom.
                </ThemedText>
              </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <TouchableOpacity style={styles.quickActionButton}>
                <Ionicons name="scan-outline" size={24} color="#FFF" />
                <Text style={styles.quickActionText}>Scan Recipe</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionButton}>
                <Ionicons name="camera-outline" size={24} color="#FFF" />
                <Text style={styles.quickActionText}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionButton}>
                <Ionicons name="search-outline" size={24} color="#FFF" />
                <Text style={styles.quickActionText}>Search</Text>
              </TouchableOpacity>
            </View>

            {/* Trending Recipes */}
            <View style={styles.trendingSection}>
              <View style={styles.trendingHeader}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  Recipe of the Day
                </ThemedText>
                <TouchableOpacity 
                  style={styles.refreshButton}
                  onPress={fetchTrendingRecipes}
                  disabled={isLoadingRecipes}
                >
                  <Ionicons 
                    name="refresh-outline" 
                    size={24} 
                    color="#6FA35E"
                    style={[
                      styles.refreshIcon,
                      isLoadingRecipes && styles.refreshIconSpinning
                    ]} 
                  />
                </TouchableOpacity>
              </View>
              {isLoadingRecipes ? (
                <View style={styles.loadingContainer}>
                  <ThemedText style={styles.loadingText}>Generating recipes...</ThemedText>
                </View>
              ) : (
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={trendingRecipes}
                  renderItem={({ item }) => (
                    <RecipeCard
                      image={item.image}
                      title={item.title}
                      time={item.time}
                      rating={item.rating}
                      onPress={() => setSelectedRecipe(item)}
                    />
                  )}
                  keyExtractor={(item) => item.title}
                  contentContainerStyle={styles.trendingList}
                />
              )}
            </View>

            {/* Features Section with enhanced styling */}
            <View style={styles.featureSection}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Features
              </ThemedText>
              <View style={styles.featureContainer}>
                <FeatureCard
                  icon="restaurant-outline"
                  title="Virtual Fridge"
                  description="Keep track of your ingredients"
                  index={0}
                />
                <FeatureCard
                  icon="camera-outline"
                  title="Recipe Analysis"
                  description="Get instant recipe suggestions"
                  index={1}
                />
                <FeatureCard
                  icon="chatbubbles-outline"
                  title="AI Chef Chat"
                  description="Chat with our AI chef"
                  index={2}
                />
                <FeatureCard
                  icon="heart-outline"
                  title="Save Favorites"
                  description="Build your recipe collection"
                  index={3}
                />
              </View>
            </View>

            {/* Get Started Section with enhanced styling */}
            <Animated.View style={styles.getStartedSection}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Get Started
              </ThemedText>
              <ThemedText style={styles.getStartedText}>
                Tap any of the navigation icons below to begin your culinary adventure!
              </ThemedText>
              <Animated.View
                style={{
                  transform: [{
                    translateY: scrollY.interpolate({
                      inputRange: [0, 200],
                      outputRange: [0, 10],
                      extrapolate: 'clamp',
                    }),
                  }],
                }}
              >
                <Ionicons name="arrow-down" size={24} color="#6FA35E" style={styles.arrowIcon} />
              </Animated.View>
            </Animated.View>
          </View>
        </Animated.ScrollView>
      </LinearGradient>
      <RecipeModal />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 250,
    overflow: 'hidden',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  scrollView: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 70,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  headerSpacer: {
    height: 150,
    marginBottom: 30,
  },
  welcomeSection: {
    marginBottom: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#2E7D32',
  },
  welcomeContent: {
    alignItems: 'center',
  },
  welcomeSubtitle: {
    fontSize: 24,
    marginBottom: 10,
    color: '#2E7D32',
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    lineHeight: 24,
  },
  featureSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 20,
    textAlign: 'center',
  },
  featureContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },
  featureCard: {
    width: width * 0.43,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    marginTop: 10,
    marginBottom: 5,
    textAlign: 'center',
  },
  featureText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  getStartedSection: {
    alignItems: 'center',
    marginBottom: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  getStartedText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  arrowIcon: {
    marginTop: 10,
  },
  categoriesSection: {
    marginBottom: 30,
  },
  categoriesList: {
    paddingHorizontal: 20,
    gap: 15,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 20,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryLabel: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  quickActionButton: {
    backgroundColor: '#6FA35E',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    width: width * 0.28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionText: {
    color: '#FFF',
    fontSize: 12,
    marginTop: 5,
    fontWeight: '600',
  },
  trendingSection: {
    marginBottom: 30,
  },
  trendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  refreshIcon: {
    opacity: 0.8,
  },
  refreshIconSpinning: {
    opacity: 0.5,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  trendingList: {
    paddingHorizontal: 20,
    gap: 15,
  },
  recipeCard: {
    width: width * 0.6,
    backgroundColor: '#FFF',
    borderRadius: 15,
    overflow: 'hidden',
    marginRight: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recipeImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  recipeInfo: {
    padding: 12,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  recipeMetaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recipeTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recipeRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recipeMetaText: {
    fontSize: 12,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: '90%',
  },
  modalImage: {
    width: '100%',
    height: 250,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  modalBody: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  recipeMetaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  recipeMeta: {
    alignItems: 'center',
  },
  recipeMetaLabel: {
    marginTop: 5,
    color: '#666',
    fontSize: 14,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 20,
  },
  ingredient: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    paddingLeft: 10,
  },
  instructionStep: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'flex-start',
  },
  stepNumber: {
    backgroundColor: '#6FA35E',
    color: '#FFF',
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 10,
    fontSize: 14,
    fontWeight: '600',
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
});

export default HomeScreen;
