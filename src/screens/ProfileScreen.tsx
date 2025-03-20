// ProfileScreen.tsx
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
  TextInput,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "react-native-vector-icons/Ionicons";
import { API_URL } from "@/constants/config";

type Recipe = {
  id: string;
  title: string;
  content: string;
};

export default function ProfileScreen() {
  // ------------------------------
  // 1) STATE
  // ------------------------------
  const [user, setUser] = useState({
    name: "",
    email: "",
    profilePic: "https://placeimg.com/140/140/people", // or from DB
  });

  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);

  // For changing password
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showChangePwModal, setShowChangePwModal] = useState(false);

  useEffect(() => {
    loadUserData();
    // You may leave this listener if other parts of your app emit "favoritesUpdated"
    const listener = DeviceEventEmitter.addListener("favoritesUpdated", loadFavorites);
    return () => {
      listener.remove();
    };
  }, []);

  // ------------------------------
  // 2) LOAD USER + FAVORITES
  // ------------------------------
  const loadUserData = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        console.warn("No user token found; cannot load user info.");
        return;
      }

      const response = await fetch(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || errData.message || "Failed to load user info");
      }

      const data = await response.json();
      // data => { user_id, username, email }

      setUser({
        name: data.username,
        email: data.email,
        profilePic: "https://placeimg.com/140/140/people",
      });
    } catch (error) {
      console.error("Error loading user info:", error);
    }
  };

  const loadFavorites = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        console.warn("No user token found; cannot load from server.");
        return;
      }

      const response = await fetch(`${API_URL}/savedRecipes`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to fetch recipes");
      }

      const data = await response.json();
      const mapped = data.map(
        (item: { recipe_id: { toString: () => any }; title: any; content: any }) => ({
          id: item.recipe_id.toString(),
          title: item.title,
          content: item.content,
        })
      );

      setFavorites(mapped);
    } catch (error) {
      console.error("Error loading favorites:", error);
    }
  };

  // ------------------------------
  // 3) REMOVE FAVORITE
  // ------------------------------
  const removeFavorite = async (id: string) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Not logged in", "Please log in to delete recipes from your account.");
        return;
      }

      const response = await fetch(`${API_URL}/savedRecipes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || errData.message || "Failed to delete recipe");
      }

      const updatedFavorites = favorites.filter((recipe) => recipe.id !== id);
      setFavorites(updatedFavorites);
      DeviceEventEmitter.emit("favoritesUpdated");

      if (selectedRecipe && selectedRecipe.id === id) {
        closeRecipeModal();
      }
    } catch (error) {
      console.error("Error removing favorite from MySQL:", error);
      Alert.alert("Error", "Failed to delete recipe from your account.");
    }
  };

  const confirmRemove = (id: string) => {
    Alert.alert("Confirm Removal", "Are you sure you want to remove this recipe?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", onPress: () => removeFavorite(id) },
    ]);
  };

  // ------------------------------
  // 4) DELETE ACCOUNT
  // ------------------------------
  const confirmDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: deleteAccount },
      ]
    );
  };

  const deleteAccount = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;

      const response = await fetch(`${API_URL}/deleteAccount`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || errData.message || "Failed to delete account");
      }

      Alert.alert("Account Deleted", "Your account has been deleted successfully.");
      // Log out user
      await AsyncStorage.removeItem("userToken");
      // Navigate to login screen or home, e.g.:
      // router.push('/login');
    } catch (error) {
      console.error("Error deleting account:", error);
      Alert.alert("Error", "Failed to delete account.");
    }
  };

  // ------------------------------
  // 5) CHANGE PASSWORD
  // ------------------------------
  const handleChangePassword = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;

      const response = await fetch(`${API_URL}/changePassword`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(
          errData.error || errData.message || "Failed to change password"
        );
      }

      Alert.alert("Success", "Password updated successfully!");
      setShowChangePwModal(false);
      setOldPassword("");
      setNewPassword("");
    } catch (error) {
      console.error("Error changing password:", error);
      Alert.alert("Error", "Failed to change password.");
    }
  };

  // ------------------------------
  // 6) RECIPE MODAL
  // ------------------------------
  const openRecipeModal = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsModalVisible(true);
  };

  const closeRecipeModal = () => {
    setSelectedRecipe(null);
    setIsModalVisible(false);
  };

  // ------------------------------
  // 7) RENDER FAVORITE ITEM
  // ------------------------------
  const renderRecipeItem = ({ item }: { item: Recipe }) => (
    <TouchableOpacity style={styles.recipeCard} onPress={() => openRecipeModal(item)}>
      <Text style={styles.recipeTitle}>{item.title}</Text>
      <Text style={styles.recipeContent} numberOfLines={3}>
        {item.content}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Account Actions at the Top */}
      <View style={styles.accountActions}>
        <TouchableOpacity style={styles.deleteButton} onPress={confirmDeleteAccount}>
          <Text style={styles.deleteButtonText}>Delete Account</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.changePwButton} onPress={() => setShowChangePwModal(true)}>
          <Text style={styles.changePwButtonText}>Change Password</Text>
        </TouchableOpacity>
      </View>

      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <Image source={{ uri: user.profilePic }} style={styles.profilePic} />
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user.name}</Text>
          <Text style={styles.profileEmail}>{user.email}</Text>
        </View>
        <TouchableOpacity
          style={styles.favButton}
          onPress={() => {
            setShowFavorites((prev) => !prev);
            if (!showFavorites) {
              loadFavorites();
            }
          }}
        >
          <Ionicons name="heart" size={30} color="#FF0000" />
        </TouchableOpacity>
      </View>

      {/* Conditionally Render Favorites */}
      {showFavorites && (
        <View style={styles.favoritesSection}>
          <Text style={styles.sectionHeading}>My Favorites</Text>
          {favorites.length === 0 ? (
            <Text style={styles.noFavorites}>
              You have no favorite recipes yet.
            </Text>
          ) : (
            <FlatList
              data={favorites}
              renderItem={renderRecipeItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
            />
          )}
        </View>
      )}

      {/* MODAL FOR CHANGING PASSWORD */}
      <Modal
        visible={showChangePwModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowChangePwModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Old Password"
              secureTextEntry
              value={oldPassword}
              onChangeText={setOldPassword}
            />
            <TextInput
              style={styles.input}
              placeholder="New Password"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowChangePwModal(false)}
              >
                <Text style={styles.closeButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.removeModalButton} onPress={handleChangePassword}>
                <Text style={styles.removeModalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL FOR FULL RECIPE VIEW WITH REMOVE BUTTON */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeRecipeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
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
  accountActions: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginBottom: 20,
  },
  deleteButton: {
    backgroundColor: "#ff4d4f",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  changePwButton: {
    backgroundColor: "#28a745",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  changePwButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
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
  noFavorites: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
    color: "#555",
  },
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
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginTop: 15,
    width: "100%",
  },
  modalButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
});
