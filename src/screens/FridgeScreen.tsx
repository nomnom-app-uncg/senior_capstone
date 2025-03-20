//fridgescreen.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Button,
  TextInput,
  StyleSheet,
  ScrollView,
  Modal,
  TouchableOpacity,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DeviceEventEmitter } from "react-native";
import { getDishesFromIngredients } from "@/services/OpenAIService";
import { API_URL } from "@/constants/config"; // Make sure this points to your server IP/port

export default function FridgeScreen() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [newIngredient, setNewIngredient] = useState<string>("");
  const [selectedDishRecipe, setSelectedDishRecipe] = useState<string>("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loadingGPT, setLoadingGPT] = useState(false);

  const fetchRecipeFromIngredients = async () => {
    if (ingredients.length === 0) return;
    setLoadingGPT(true);
    setSelectedDishRecipe("Fetching detailed recipes...");
    try {
      const result = await getDishesFromIngredients(ingredients.join(", "));
      setSelectedDishRecipe(result);
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
    <View style={styles.container}>
      <Text style={styles.heading}>Virtual Fridge</Text>

      <TextInput
        style={styles.input}
        placeholder="Add an ingredient"
        value={newIngredient}
        onChangeText={setNewIngredient}
      />

      <Button
        title="Add Ingredient"
        onPress={() => {
          if (newIngredient.trim()) {
            setIngredients([...ingredients, newIngredient.trim()]);
            setNewIngredient("");
          }
        }}
      />

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
              <Text style={styles.removeButtonText}>X</Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity
          style={styles.findRecipesButton}
          onPress={fetchRecipeFromIngredients}
          disabled={loadingGPT}
        >
          <Text style={styles.findRecipesButtonText}>
            {loadingGPT ? "Loading..." : "Find Recipes"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.dismissButton}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.dismissText}>✕</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveButton} onPress={saveRecipe}>
                <Text style={styles.saveButtonText}>❤️ Save</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollView}>
              <Text style={styles.heading}>Recipe</Text>
              <Text style={styles.recipeText}>{selectedDishRecipe}</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ------------------------
//       STYLES
// ------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#28a745",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    width: "100%",
  },
  ingredientsList: {
    flex: 1,
    marginTop: 10,
    marginBottom: 20,
  },
  ingredientItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  ingredientText: {
    fontSize: 16,
  },
  removeButton: {
    backgroundColor: "#ff4d4f",
    borderRadius: 15,
    padding: 5,
  },
  removeButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  findRecipesButton: {
    backgroundColor: "#28a745",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 20,
    alignSelf: "center",
    width: "80%",
  },
  findRecipesButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    width: "90%",
    maxHeight: "80%",
    alignSelf: "center",
    paddingTop: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    position: "absolute",
    top: 10,
    right: 10,
    left: 10,
    zIndex: 10,
  },
  dismissButton: {
    backgroundColor: "#ff4d4f",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
    zIndex: 10,
  },
  dismissText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: "#28a745",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  scrollView: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  recipeText: {
    fontSize: 16,
    color: "#333",
    marginVertical: 10,
    lineHeight: 22,
  },
});
