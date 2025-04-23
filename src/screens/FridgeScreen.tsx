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
import { API_URL } from "@/constants/config";

interface Recipe {
  title: string;
  ingredients: string;
  imageUrl: string;
  saved?: boolean;
}

export default function FridgeScreen() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [newIngredient, setNewIngredient] = useState<string>("");
  const [loadingGPT, setLoadingGPT] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [savedTitles, setSavedTitles] = useState<string[]>([]);

  const fetchSavedRecipes = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;

      const res = await fetch(`${API_URL}/savedRecipes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        const titles = data.map((r: { title: string }) => r.title.trim().toLowerCase());
        setSavedTitles(titles);
      }
    } catch (err) {
      console.error("Error fetching saved recipes:", err);
    }
  };

  useEffect(() => {
    fetchSavedRecipes();
  }, []);

  const fetchRecipeFromIngredients = async () => {
    if (ingredients.length === 0) {
      Alert.alert("No Ingredients", "Please add some ingredients first.");
      return;
    }

    setLoadingGPT(true);
    try {
      const result = await getDishesFromIngredients(ingredients.join(", "));
      const recipeArray = result.split('-------------------')
        .filter(recipe => recipe.trim())
        .map(recipe => {
          const lines = recipe.split('\n');
          const titleLine = lines.find(line => line.startsWith('Recipe:'));
          const imageUrlLine = lines.find(line => line.startsWith('Image URL:'));
          const title = titleLine ? titleLine.replace('Recipe:', '').trim() : '';
          let imageUrl = imageUrlLine ? imageUrlLine.replace('Image URL:', '').trim() : '';
          imageUrl = imageUrl.replace(/^\"|'|\"$/g, '').trim();
          const content = titleLine 
            ? lines.slice(lines.indexOf(titleLine) + 1, lines.indexOf(imageUrlLine)).join('\n').trim()
            : lines.join('\n').trim();
          return { title, ingredients: content, imageUrl };
        })
        .filter(recipe => recipe.imageUrl && recipe.imageUrl.startsWith('http'))
        .map(r => ({
          ...r,
          saved: savedTitles.includes(r.title.trim().toLowerCase()),
        }));

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

  const handleSaveRecipe = async (recipe: Recipe) => {
    if (savedTitles.includes(recipe.title.trim().toLowerCase())) return;
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Login Required", "Please log in to save recipes.");
        return;
      }

      const response = await fetch(`${API_URL}/saveRecipe`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: recipe.title,
          content: recipe.ingredients,
        }),
      });

      if (response.ok) {
        console.log("✅ Saved:", recipe.title);
        setSavedTitles([...savedTitles, recipe.title.trim().toLowerCase()]);
      } else {
        console.error("❌ Failed to save:", recipe.title);
      }
    } catch (err) {
      console.error("❌ Error saving recipe:", err);
    }
  };

  const toggleSaved = async (index: number) => {
    const recipe = recipes[index];
    if (!recipe.saved) {
      await handleSaveRecipe(recipe);
    }
    const updated = [...recipes];
    updated[index].saved = !recipe.saved;
    setRecipes(updated);
  };

  const handleAddIngredient = () => {
    const trimmed = newIngredient.trim();
    if (trimmed && !ingredients.includes(trimmed)) {
      setIngredients([...ingredients, trimmed]);
      setNewIngredient("");
    } else if (ingredients.includes(trimmed)) {
      Alert.alert("Duplicate", "This ingredient is already in your list.");
    }
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const RecipeCard: React.FC<{ item: Recipe; index: number; onPress: () => void; toggleSaved: () => void }> = ({ item, index, onPress, toggleSaved }) => {
    const [imageError, setImageError] = useState(false);
    return (
      <TouchableOpacity style={styles.recipeCard} onPress={onPress}>
        <TouchableOpacity onPress={toggleSaved} style={{ position: 'absolute', top: 10, right: 10, zIndex: 1 }}>
          <Ionicons name={item.saved ? "heart" : "heart-outline"} size={22} color={item.saved ? "green" : "gray"} />
        </TouchableOpacity>
        <Image source={{ uri: imageError ? 'https://via.placeholder.com/400x300?text=No+Image' : item.imageUrl }} style={styles.recipeImage} resizeMode="cover" onError={() => setImageError(true)} />
        <View style={styles.recipeHeader}>
          <Text style={styles.recipeCardTitle} numberOfLines={2}>{item.title}</Text>
          <Ionicons name="chevron-forward" size={24} color="#6FA35E" />
        </View>
        <View style={styles.recipePreview}>
          <Text style={styles.recipePreviewText} numberOfLines={3}>{item.ingredients.split('\n').slice(0, 3).join('\n')}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={["#FFFFFF", "#D4E9C7"]} style={styles.gradient}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
          <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Add an ingredient"
                value={newIngredient}
                onChangeText={setNewIngredient}
                placeholderTextColor="#666"
                onSubmitEditing={handleAddIngredient}
              />
              <TouchableOpacity style={styles.addButton} onPress={handleAddIngredient}>
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
            {ingredients.map((ingredient, index) => (
              <View key={index} style={styles.ingredientItem}>
                <Text style={styles.ingredientText}>{ingredient}</Text>
                <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveIngredient(index)}>
                  <Ionicons name="close-circle" size={24} color="#FF6B6B" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={[styles.findRecipesButton, loadingGPT && styles.findRecipesButtonDisabled]}
              onPress={fetchRecipeFromIngredients}
              disabled={loadingGPT}
            >
              {loadingGPT ? <ActivityIndicator color="white" /> : <Text style={styles.findRecipesButtonText}>Find Recipes</Text>}
            </TouchableOpacity>
            {recipes.length > 0 && (
              <FlatList
                data={recipes}
                numColumns={2}
                keyExtractor={(_, index) => index.toString()}
                renderItem={({ item, index }) => (
                  <RecipeCard
                    item={item}
                    index={index}
                    onPress={() => {
                      setSelectedRecipe(item);
                      setIsModalVisible(true);
                    }}
                    toggleSaved={() => toggleSaved(index)}
                  />
                )}
                contentContainerStyle={styles.recipeGrid}
              />
            )}
          </ScrollView>
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