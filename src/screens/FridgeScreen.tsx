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
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DeviceEventEmitter } from "react-native";
import { getDishesFromIngredients } from "@/services/OpenAIService";
import { API_URL } from "@/constants/config";
import Ionicons from "react-native-vector-icons/Ionicons";

export default function FridgeScreen() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [newIngredient, setNewIngredient] = useState<string>("");
  const [selectedDishRecipe, setSelectedDishRecipe] = useState<string>("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loadingGPT, setLoadingGPT] = useState(false);
  const [recipes, setRecipes] = useState<Array<{title: string, ingredients: string}>>([]);

  const fetchRecipeFromIngredients = async () => {
    if (ingredients.length === 0) return;
    setLoadingGPT(true);
    setSelectedDishRecipe("Fetching detailed recipes...");
    try {
      const result = await getDishesFromIngredients(ingredients.join(", "));
      // Parse the result into individual recipes
      const recipeArray = result.split('\n\n').map((recipe: string) => {
        const lines = recipe.split('\n');
        const title = lines[0].replace(/^\d+\.\s*/, '').trim();
        const ingredients = lines.slice(1).filter(line => line.trim() !== '').join('\n').trim();
        return {
          title,
          ingredients,
        };
      }).slice(0, 4); // Take only the first 4 recipes
      setRecipes(recipeArray);
      setIsModalVisible(true);
    } catch (error) {
      console.error("Error fetching detailed recipes:", error);
      setSelectedDishRecipe("Failed to fetch detailed recipes.");
      setIsModalVisible(true);
    }
    setLoadingGPT(false);
  };

  const saveRecipe = async () => {
    if (!selectedDishRecipe) return;

    try {
      // Use the first line of the AI response as the title
      const title = selectedDishRecipe.split("\n")[0] || "My Saved Recipe";
      const content = selectedDishRecipe;

      // Grab token from AsyncStorage
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Not logged in", "Please log in to save recipes to your account.");
        return;
      }

      // Use the same base URL as in your config
      const response = await fetch(`${API_URL}/saveRecipe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to save recipe");
      }

      Alert.alert("Saved!", "Your recipe has been saved to your profile tab!");
    } catch (error) {
      console.error("Error saving recipe:", error);
      Alert.alert("Error", "Failed to save the recipe.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.header}>
          <Ionicons name="restaurant-outline" size={36} color="#6FA35E" />
          <Text style={styles.heading}>Virtual Fridge</Text>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Add an ingredient"
            value={newIngredient}
            onChangeText={setNewIngredient}
            placeholderTextColor="#666"
          />
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => {
              if (newIngredient.trim()) {
                setIngredients([...ingredients, newIngredient.trim()]);
                setNewIngredient("");
              }
            }}
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
                onPress={() => {
                  setIngredients(ingredients.filter((_, i) => i !== index));
                }}
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
            <Text style={styles.findRecipesButtonText}>
              {loadingGPT ? "Loading..." : "Find Recipes"}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        <Modal
          animationType="slide"
          transparent={true}
          visible={isModalVisible}
          onRequestClose={() => setIsModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Recipe Suggestions</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setIsModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalScroll}>
                <View style={styles.recipeGrid}>
                  {recipes.map((recipe, index) => (
                    <View key={index} style={styles.recipeCard}>
                      <TouchableOpacity 
                        style={styles.recipeCardContent}
                        onPress={() => {
                          setSelectedDishRecipe(`${recipe.title}\n\n${recipe.ingredients}`);
                        }}
                      >
                        <Text style={styles.recipeCardTitle} numberOfLines={2}>
                          {recipe.title}
                        </Text>
                        <Text style={styles.recipeCardIngredients} numberOfLines={4}>
                          {recipe.ingredients}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.saveIconButton}
                        onPress={() => {
                          setSelectedDishRecipe(`${recipe.title}\n\n${recipe.ingredients}`);
                          saveRecipe();
                        }}
                      >
                        <Ionicons name="bookmark-outline" size={24} color="#6FA35E" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        <Modal
          animationType="slide"
          transparent={true}
          visible={!!selectedDishRecipe}
          onRequestClose={() => setSelectedDishRecipe("")}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Recipe Details</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setSelectedDishRecipe("")}
                >
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalScroll}>
                <Text style={styles.modalText}>{selectedDishRecipe}</Text>
                <TouchableOpacity style={styles.saveButton} onPress={saveRecipe}>
                  <Text style={styles.saveButtonText}>❤️ Save Recipe</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ------------------------
//       STYLES
// ------------------------
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#E8F5E1",
  },
  container: {
    flex: 1,
    backgroundColor: "#E8F5E1",
  },
  header: {
    alignItems: "center",
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
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
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
    maxHeight: "80%",
  },
  recipeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 10,
  },
  recipeCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
    minHeight: 200,
  },
  recipeCardContent: {
    padding: 12,
    height: '100%',
  },
  recipeCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  recipeCardIngredients: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  saveButton: {
    backgroundColor: "#6FA35E",
    borderRadius: 25,
    padding: 15,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  modalText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
  },
  saveIconButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
