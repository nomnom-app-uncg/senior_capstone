//profilescreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  SafeAreaView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from "react-native-vector-icons/Ionicons";
import * as ImagePicker from 'expo-image-picker';
import { API_URL } from "../constants/config";//IP address 
import * as FileSystem from 'expo-file-system';


interface UserData {
  username: string;
  email: string;
  profilePic?: string;
}

interface Recipe {
  recipe_id: number;
  title: string;
  content: string;
}

export default function ProfileScreen() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChangePasswordModalVisible, setIsChangePasswordModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isLoadingUserData, setIsLoadingUserData] = useState(true);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const router = useRouter();


  useEffect(() => {
  const loadImageFromStorage = async () => {
    const storedImage = await AsyncStorage.getItem("localProfileImage");
    if (storedImage) {
      setProfileImage(storedImage);
    }
  };

  loadImageFromStorage();
  fetchUserData();
  fetchFavorites();
}, []);

  const fetchUserData = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        router.replace("/login");
        return;
      }

        const response = await fetch(`${API_URL}/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Fetched user data:', data);
        setUserData(data);
        if (data.profilePic) {
          console.log('Setting profile image:', data.profilePic);
          setProfileImage(data.profilePic);
        }
      } else {
        router.replace("/login");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      router.replace("/login");
    } finally {
      setIsLoadingUserData(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;

        const response = await fetch(`${API_URL}/savedRecipe` , {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFavorites(data);
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);
    } finally {
      setIsLoadingFavorites(false);
    }
  };

  const handleLogout = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (token) {
          await fetch(`${API_URL}/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
      await AsyncStorage.removeItem("userToken");
      await AsyncStorage.removeItem("userData");
      router.replace("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

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

      if (response.ok) {
        Alert.alert("Success", "Password changed successfully");
        setIsChangePasswordModalVisible(false);
        setOldPassword("");
        setNewPassword("");
      } else {
        const data = await response.json();
        Alert.alert("Error", data.message || "Failed to change password");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      Alert.alert("Error", "Failed to change password");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;

        const response = await fetch(`${API_URL}/deleteAccount`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await AsyncStorage.removeItem("userToken");
        await AsyncStorage.removeItem("userData");
        router.replace("/login");
      } else {
        Alert.alert("Error", "Failed to delete account");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      Alert.alert("Error", "Failed to delete account");
    }
  };

  const handleDeleteFavorite = async (recipeId: number) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;

      const response = await fetch(
          `${ API_URL } / savedRecipes / ${ recipeId }`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setFavorites(favorites.filter((recipe) => recipe.recipe_id !== recipeId));
        Alert.alert("Success", "Recipe removed from favorites");
      } else {
        Alert.alert("Error", "Failed to remove recipe from favorites");
      }
    } catch (error) {
      console.error("Error deleting favorite:", error);
      Alert.alert("Error", "Failed to remove recipe from favorites");
    }
  };

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 1,
            });

            if (!result.canceled) {
                const imageUri = result.assets[0].uri;

                // Copy image to app's local directory
                const fileName = imageUri.split('/').pop();
                const localPath = FileSystem.documentDirectory + fileName;

                await FileSystem.copyAsync({
                    from: imageUri,
                    to: localPath,
                });

                // Save local path to AsyncStorage
                await AsyncStorage.setItem("localProfileImage", localPath);
                setProfileImage(localPath);
            }
        } catch (error) {
            console.error("Error picking image:", error);
            Alert.alert("Error", "Failed to pick image");
        }
    };


  const updateProfilePicture = async (imageData: string | Blob) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;

      // Create form data
      const formData = new FormData();
      if (Platform.OS === 'web' && imageData instanceof Blob) {
        formData.append('image', imageData, 'profile-picture.jpg');
      } else {
        formData.append('image', {
          uri: typeof imageData === 'string' ? imageData.replace('file://', '') : '',
          type: 'image/jpeg',
          name: 'profile-picture.jpg',
        } as any);
      }

        console.log('Uploading image to:', `${API_URL}/updateProfilePicture`);
      
        const response = await fetch(`${API_URL}/updateProfilePicture`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          'Accept': 'application/json',
          ...(Platform.OS === 'web' ? {} : { 'Content-Type': 'multipart/form-data' }),
        },
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('Upload successful:', data);
        setProfileImage(data.image);
        setUserData(prev => prev ? { ...prev, profilePic: data.image } : null);
        Alert.alert("Success", "Profile picture updated successfully");
      } else {
        console.error('Upload failed:', data);
        Alert.alert("Error", data.error || data.message || "Failed to update profile picture");
      }
    } catch (error) {
      console.error("Error updating profile picture:", error);
      Alert.alert("Error", "Failed to update profile picture");
    }
  };

  if (isLoadingUserData || isLoadingFavorites) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6FA35E" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#FFFFFF', '#D4E9C7']}
        style={styles.gradient}
      >
        <ScrollView style={styles.container}>
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <View style={styles.profileImageContainer}>
                          <Image
                              source={{
                                  uri: profileImage || "https://i.pinimg.com/564x/dc/c6/d4/dcc6d4ea22c553ae169e6637c085e389.jpg",
                              }}
                              style={styles.profileImage}
                          />

              <TouchableOpacity 
                style={styles.profileImageOverlay}
                onPress={pickImage}
              >
                <Ionicons name="camera" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.username}>{userData?.username}</Text>
              <Text style={styles.email}>{userData?.email}</Text>
            </View>
          </View>

          {/* Dashboard Section */}
          <View style={styles.dashboardSection}>
            <View style={styles.dashboardHeader}>
              <Ionicons name="stats-chart" size={24} color="#6FA35E" />
              <Text style={styles.dashboardTitle}>Dashboard</Text>
            </View>
            
            <View style={styles.dashboardGrid}>
              <View style={styles.dashboardCard}>
                <View style={[styles.cardIcon, { backgroundColor: 'rgba(111, 163, 94, 0.1)' }]}>
                  <Ionicons name="heart" size={24} color="#6FA35E" />
                </View>
                <Text style={styles.cardValue}>{favorites.length}</Text>
                <Text style={styles.cardLabel}>Saved Recipes</Text>
              </View>

              <View style={styles.dashboardCard}>
                <View style={[styles.cardIcon, { backgroundColor: 'rgba(74, 144, 226, 0.1)' }]}>
                  <Ionicons name="time" size={24} color="#4A90E2" />
                </View>
                <Text style={styles.cardValue}>0</Text>
                <Text style={styles.cardLabel}>Recent Views</Text>
              </View>

              <View style={styles.dashboardCard}>
                <View style={[styles.cardIcon, { backgroundColor: 'rgba(255, 107, 107, 0.1)' }]}>
                  <Ionicons name="star" size={24} color="#FF6B6B" />
                </View>
                <Text style={styles.cardValue}>0</Text>
                <Text style={styles.cardLabel}>Favorites</Text>
              </View>
            </View>

            <View style={styles.activitySection}>
              <Text style={styles.activityTitle}>Recent Activity</Text>
              <View style={styles.activityList}>
                <View style={styles.activityItem}>
                  <View style={styles.activityIcon}>
                    <Ionicons name="time-outline" size={20} color="#666" />
                  </View>
                  <Text style={styles.activityText}>No recent activity</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Favorites Section */}
          <View style={styles.favoritesSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="heart" size={24} color="#6FA35E" />
              <Text style={styles.sectionTitle}>Saved Recipes</Text>
            </View>
            {favorites.length === 0 ? (
              <View style={styles.emptyFavorites}>
                <Ionicons name="heart-outline" size={48} color="#6FA35E" />
                <Text style={styles.emptyFavoritesText}>No saved recipes yet</Text>
              </View>
            ) : (
              <View style={styles.favoritesList}>
                {favorites.map((recipe) => (
                  <TouchableOpacity
                    key={recipe.recipe_id}
                    style={styles.recipeCard}
                    onPress={() => setSelectedRecipe(recipe)}
                  >
                    <View style={styles.recipeCardContent}>
                      <Text style={styles.recipeTitle} numberOfLines={2}>
                        {recipe.title}
                      </Text>
                      <Text style={styles.recipePreview} numberOfLines={2}>
                        {recipe.content}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteFavorite(recipe.recipe_id)}
                    >
                      <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.changePasswordButton]}
              onPress={() => setIsChangePasswordModalVisible(true)}
            >
              <Ionicons name="key-outline" size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Change Password</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.deleteAccountButton]}
              onPress={() => setIsDeleteModalVisible(true)}
            >
              <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Delete Account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.logoutButton]}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Change Password Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isChangePasswordModalVisible}
          onRequestClose={() => setIsChangePasswordModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Change Password</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setIsChangePasswordModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              <View style={styles.modalBody}>
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
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={handleChangePassword}
                >
                  <Text style={styles.modalButtonText}>Change Password</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Delete Account Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isDeleteModalVisible}
          onRequestClose={() => setIsDeleteModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Delete Account</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setIsDeleteModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              <View style={styles.modalBody}>
                <Text style={styles.deleteWarning}>
                  Are you sure you want to delete your account? This action cannot be undone.
                </Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setIsDeleteModalVisible(false)}
                  >
                    <Text style={styles.modalButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.deleteButton]}
                    onPress={handleDeleteAccount}
                  >
                    <Text style={styles.modalButtonText}>Delete Account</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>

        {/* Recipe Details Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={!!selectedRecipe}
          onRequestClose={() => setSelectedRecipe(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Recipe Details</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setSelectedRecipe(null)}
                >
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalScroll}>
                {selectedRecipe && (
                  <View style={styles.recipeDetails}>
                    <Text style={styles.recipeDetailsTitle}>{selectedRecipe.title}</Text>
                    <Text style={styles.recipeDetailsContent}>{selectedRecipe.content}</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  profileHeader: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 30,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#6FA35E',
  },
  profileImageOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#6FA35E',
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    alignItems: 'center',
  },
  username: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: "#666",
  },
  actionButtonsContainer: {
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 40,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    gap: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 15,
    gap: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  changePasswordButton: {
    backgroundColor: '#6FA35E',
  },
  deleteAccountButton: {
    backgroundColor: '#FF6B6B',
  },
  logoutButton: {
    backgroundColor: '#4A90E2',
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  favoritesSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2E7D32",
  },
  emptyFavorites: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    marginTop: 20,
  },
  emptyFavoritesText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  favoritesList: {
    gap: 15,
  },
  recipeCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  recipeCardContent: {
    flex: 1,
    marginRight: 10,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2E7D32",
    marginBottom: 5,
  },
  recipePreview: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  deleteButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    width: "90%",
    maxHeight: "80%",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 5,
  },
  modalBody: {
    padding: 20,
  },
  input: {
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  modalButton: {
    backgroundColor: "#6FA35E",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  deleteWarning: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 24,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#E0E0E0",
  },
  deleteButton: {
    flex: 1,
    backgroundColor: "#FF6B6B",
  },
  modalScroll: {
    maxHeight: 400,
  },
  recipeDetails: {
    padding: 20,
  },
  recipeDetailsTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 15,
  },
  recipeDetailsContent: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
  },
  dashboardSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  dashboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  dashboardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2E7D32",
  },
  dashboardGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  dashboardCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    marginHorizontal: 5,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  cardLabel: {
    fontSize: 14,
    color: "#666",
    textAlign: 'center',
  },
  activitySection: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 15,
    padding: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
  },
  activityList: {
    gap: 10,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  activityIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityText: {
    fontSize: 14,
    color: "#666",
  },
});
