//fridgescreen.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Modal,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Image,
  FlatList,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDishesFromIngredients } from "@/services/OpenAIService";
import Ionicons from "react-native-vector-icons/Ionicons";
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface Recipe {
  title: string;
  ingredients: string;
  imageUrl: string;
}

export default function FridgeScreen() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [newIngredient, setNewIngredient] = useState<string>("");
  const [loadingGPT, setLoadingGPT] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const fetchRecipeFromIngredients = async () => {
    if (ingredients.length === 0) {
      Alert.alert("No Ingredients", "Please add some ingredients first.");
      return;
    }

    setLoadingGPT(true);
    try {
      const result = await getDishesFromIngredients(ingredients.join(", "));
      
      // Split the result into individual recipes
      const recipeArray = result.split('-------------------')
        .filter(recipe => recipe.trim())
        .map(recipe => {
          const lines = recipe.split('\n');
          const titleLine = lines.find(line => line.startsWith('Recipe:'));
          const imageUrlLine = lines.find(line => line.startsWith('Image URL:'));
          
          const title = titleLine ? titleLine.replace('Recipe:', '').trim() : '';
          let imageUrl = imageUrlLine ? imageUrlLine.replace('Image URL:', '').trim() : '';
          
          // Clean up the image URL if it's wrapped in quotes or has extra spaces
          imageUrl = imageUrl.replace(/^["']|["']$/g, '').trim();
          
          // Get all content between title and image URL
          const content = titleLine 
            ? lines.slice(lines.indexOf(titleLine) + 1, lines.indexOf(imageUrlLine)).join('\n').trim()
            : lines.join('\n').trim();
          
          return { title, ingredients: content, imageUrl };
        })
        .filter(recipe => recipe.imageUrl && recipe.imageUrl.startsWith('http')); // Only keep recipes with valid image URLs

      if (recipeArray.length === 0) {
        Alert.alert("No Recipes Found", "No recipes with valid images were found. Please try again.");
        return;
      }

      setRecipes(recipeArray);
    } catch (error) {
      console.error("Error fetching recipes:", error);
      Alert.alert("Error", "Failed to fetch recipes. Please try again.");
    } finally {
      setLoadingGPT(false);
    }
  };

  const handleAddIngredient = () => {
    const trimmedIngredient = newIngredient.trim();
    if (trimmedIngredient) {
      if (ingredients.includes(trimmedIngredient)) {
        Alert.alert("Duplicate", "This ingredient is already in your list.");
        return;
      }
      setIngredients([...ingredients, trimmedIngredient]);
      setNewIngredient("");
    }
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const RecipeCard: React.FC<{ item: Recipe; onPress: () => void }> = ({ item, onPress }) => {
    const [imageError, setImageError] = useState(false);
    
    return (
      <TouchableOpacity style={styles.recipeCard} onPress={onPress}>
        <Image 
          source={{ uri: imageError ? 'https://via.placeholder.com/400x300?text=No+Image' : item.imageUrl }} 
          style={styles.recipeImage}
          resizeMode="cover"
          onError={() => {
            console.error('Image loading error for:', item.title);
            setImageError(true);
          }}
        />
        <View style={styles.recipeHeader}>
          <Text style={styles.recipeCardTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Ionicons name="chevron-forward" size={24} color="#6FA35E" />
        </View>
        <View style={styles.recipePreview}>
          <Text style={styles.recipePreviewText} numberOfLines={3}>
            {item.ingredients.split('\n').slice(0, 3).join('\n')}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#FFFFFF', '#D4E9C7']}
        style={styles.gradient}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}
        >
          <View style={styles.header}>
            <Image 
              source={require("@/assets/images/nomnomLogo.png")} 
              style={styles.logo}
              resizeMode="contain"
            />
            <View style={styles.headerCenter}>
              <Ionicons name="restaurant-outline" size={36} color="#6FA35E" />
              <Text style={styles.heading}>Virtual Fridge</Text>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Add an ingredient"
              value={newIngredient}
              onChangeText={setNewIngredient}
              placeholderTextColor="#666"
              onSubmitEditing={handleAddIngredient}
            />
            <TouchableOpacity 
              style={styles.addButton}
              onPress={handleAddIngredient}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.ingredientsList}>
            {ingredients.map((ingredient, index) => (
              <View key={index} style={styles.ingredientItem}>
                <Text style={styles.ingredientText}>{ingredient}</Text>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveIngredient(index)}
                >
                  <Ionicons name="close-circle" size={24} color="#FF6B6B" />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              style={[styles.findRecipesButton, loadingGPT && styles.findRecipesButtonDisabled]}
              onPress={fetchRecipeFromIngredients}
              disabled={loadingGPT}
            >
              {loadingGPT ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.findRecipesButtonText}>Find Recipes</Text>
              )}
            </TouchableOpacity>

            {recipes.length > 0 && (
              <View style={styles.recipesSection}>
                <Text style={styles.sectionTitle}>Suggested Recipes</Text>
                <FlatList
                  data={recipes}
                  numColumns={2}
                  keyExtractor={(_, index) => index.toString()}
                  renderItem={({ item }) => (
                    <RecipeCard
                      item={item}
                      onPress={() => {
                        setSelectedRecipe(item);
                        setIsModalVisible(true);
                      }}
                    />
                  )}
                  contentContainerStyle={styles.recipeGrid}
                />
              </View>
            )}
          </ScrollView>

          <Modal
            animationType="slide"
            transparent={true}
            visible={isModalVisible}
            onRequestClose={() => {
              setIsModalVisible(false);
              setSelectedRecipe(null);
            }}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Recipe Details</Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => {
                      setIsModalVisible(false);
                      setSelectedRecipe(null);
                    }}
                  >
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalScroll}>
                  {selectedRecipe && (
                    <View style={styles.recipeItem}>
                      <Image 
                        source={{ uri: selectedRecipe.imageUrl }} 
                        style={styles.modalImage}
                        resizeMode="cover"
                        onError={() => {
                          console.error('Modal image loading error for:', selectedRecipe.title);
                        }}
                      />
                      <Text style={styles.recipeTitle}>{selectedRecipe.title}</Text>
                      <Text style={styles.recipeIngredients}>{selectedRecipe.ingredients}</Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            </View>
          </Modal>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 15,
    marginTop: Platform.OS === 'ios' ? 10 : 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    paddingHorizontal: 15,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    marginRight: 10,
  },
  heading: {
    fontSize: 36,
    fontWeight: "900",
    color: "#2E7D32",
    marginTop: 10,
    textShadowColor: 'rgba(110, 163, 94, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  inputContainer: {
    flexDirection: "row",
    padding: 15,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButton: {
    backgroundColor: "#6FA35E",
    borderRadius: 25,
    paddingHorizontal: 20,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  ingredientsList: {
    flex: 1,
    padding: 15,
  },
  ingredientItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ingredientText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  removeButton: {
    padding: 5,
  },
  findRecipesButton: {
    backgroundColor: "#6FA35E",
    borderRadius: 25,
    padding: 15,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  findRecipesButtonDisabled: {
    backgroundColor: "#98D67D",
  },
  findRecipesButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '90%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 10,
  },
  closeButton: {
    padding: 5,
  },
  modalScroll: {
    flex: 1,
  },
  recipeItem: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recipesSection: {
    marginTop: 20,
    paddingHorizontal: 5,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 15,
  },
  recipeCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
    margin: 8,
    minHeight: 280,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8F8F8',
  },
  recipeCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    flex: 1,
    marginRight: 8,
  },
  recipePreview: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  recipePreviewText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  recipeIngredients: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  recipeGrid: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  recipeImage: {
    width: '100%',
    height: 120,
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: 15,
    marginBottom: 15,
  },
  recipeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 20,
    textAlign: 'center',
  },
});
