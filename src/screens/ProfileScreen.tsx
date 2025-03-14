//profilescree.tsx
import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  ScrollView,
  DeviceEventEmitter,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "react-native-vector-icons/Ionicons";

type Recipe = {
  id: string;
  title: string;
  content: string;
};

export default function ProfileScreen() {
  const [user] = useState({
    name: "Jane Doe",
    email: "janedoe@example.com",
    profilePic: "https://placeimg.com/140/140/people",
  });
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    loadFavorites();
    const listener = DeviceEventEmitter.addListener("favoritesUpdated", loadFavorites);
    return () => {
      listener.remove();
    };
  }, []);

  const loadFavorites = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        // If not logged in, maybe fallback to local AsyncStorage or show "not logged in" message
        console.warn("No user token found; cannot load from server.");
        return;
      }
  
      const response = await fetch("http://YOUR_SERVER_IP:3000/savedRecipes", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
  
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to fetch recipes");
      }
  
      const data = await response.json(); 
      // data is an array of objects from saved_recipes table
      // e.g. [{ recipe_id: 1, user_id: 5, title: "...", content: "...", saved_at: "..." }, ...]
  
      // Map them to your local shape if needed
      const mapped = data.map((item: { recipe_id: { toString: () => any; }; title: any; content: any; }) => ({
        id: item.recipe_id.toString(),
        title: item.title,
        content: item.content,
      }));
  
      setFavorites(mapped);
    } catch (error) {
      console.error("Error loading favorites:", error);
    }
  };
  

  const removeFavorite = async (id: string) => {
    try {
      // 1) Get the user token
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Not logged in", "Please log in to delete recipes from your account.");
        return;
      }
  
      // 2) Make a DELETE request to /savedRecipes/:recipeId
      const response = await fetch(`http://localhost:3000/savedRecipes/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
  
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || errData.message || "Failed to delete recipe");
      }
  
      // 3) If successful, remove from local state
      const updatedFavorites = favorites.filter((recipe) => recipe.id !== id);
      setFavorites(updatedFavorites);
  
      // 4) If you want to sync with other screens, you can also:
      DeviceEventEmitter.emit("favoritesUpdated");
  
      // 5) If the deleted recipe was currently open in the modal, close it
      if (selectedRecipe && selectedRecipe.id === id) {
        closeRecipeModal();
      }
    } catch (error) {
      console.error("Error removing favorite from MySQL:", error);
      Alert.alert("Error", "Failed to delete recipe from your account.");
    }
  };
  

  const openRecipeModal = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsModalVisible(true);
  };

  const closeRecipeModal = () => {
    setSelectedRecipe(null);
    setIsModalVisible(false);
  };

  const renderRecipeItem = ({ item }: { item: Recipe }) => (
    <TouchableOpacity style={styles.recipeCard} onPress={() => openRecipeModal(item)}>
      <Text style={styles.recipeTitle}>{item.title}</Text>
      <Text style={styles.recipeContent} numberOfLines={3}>
        {item.content}
      </Text>
    </TouchableOpacity>
  );

  function confirmRemove(id: string): void {
    throw new Error("Function not implemented.");
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <Image source={{ uri: user.profilePic }} style={styles.profilePic} />
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user.name}</Text>
          <Text style={styles.profileEmail}>{user.email}</Text>
        </View>
        <TouchableOpacity style={styles.favButton} onPress={loadFavorites}>
          <Ionicons name="heart" size={30} color="#FF0000" />
        </TouchableOpacity>
      </View>

      {/* Favorites List */}
      <View style={styles.favoritesSection}>
        <Text style={styles.sectionHeading}>My Favorites</Text>
        {favorites.length === 0 ? (
          <Text style={styles.noFavorites}>You have no favorite recipes yet.</Text>
        ) : (
          <FlatList
            data={favorites}
            renderItem={renderRecipeItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>

      {/* Modal for full recipe view with Remove button */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeRecipeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header: NOT ABSOLUTE */}
            <View style={styles.modalHeader}>
              <TouchableOpacity style={styles.closeButton} onPress={closeRecipeModal}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
              {selectedRecipe && (
                <TouchableOpacity
                  style={styles.removeModalButton}
                  onPress={() => confirmRemove(selectedRecipe.id)}
                >
                  <Text style={styles.removeModalButtonText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
            <ScrollView contentContainerStyle={styles.modalScroll}>
              {selectedRecipe && (
                <>
                  <Text style={styles.modalTitle}>{selectedRecipe.title}</Text>
                  <Text style={styles.modalRecipe}>{selectedRecipe.content}</Text>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  profilePic: { width: 80, height: 80, borderRadius: 40, marginRight: 15 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 24, fontWeight: "bold" },
  profileEmail: { fontSize: 16, color: "#666" },
  favButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  favoritesSection: { flex: 1 },
  sectionHeading: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
  },
  noFavorites: { fontSize: 16, textAlign: "center", marginTop: 20, color: "#555" },
  listContainer: { paddingBottom: 20 },
  recipeCard: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  recipeTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 5 },
  recipeContent: { fontSize: 16, color: "#333", marginBottom: 10 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    width: "100%",
    maxHeight: "80%",
    borderRadius: 10,
    padding: 20,
  },
  // No absolute positioning for the header
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: "#ff4d4f",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  closeButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  removeModalButton: {
    backgroundColor: "#28a745",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  removeModalButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  modalScroll: { paddingBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  modalRecipe: { fontSize: 16, color: "#333", lineHeight: 24 },
});
