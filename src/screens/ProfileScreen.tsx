// ProfileScreen.tsx
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
import * as ImagePicker from "expo-image-picker";
import { useRouter, RelativePathString } from "expo-router";
import { API_URL } from "@/constants/config";
import GradientBackground from "@/components/GradientBackground"; // ✅ added

type Recipe = {
    id: string;
    title: string;
    content: string;
};

export default function ProfileScreen() {
    const [user, setUser] = useState({
        name: "",
        email: "",
        profilePic: "https://placeimg.com/140/140/people",
    });
    const [favorites, setFavorites] = useState<Recipe[]>([]);
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [showFavorites, setShowFavorites] = useState(false);
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [showChangePwModal, setShowChangePwModal] = useState(false);

    const router = useRouter();

    useEffect(() => {
        loadUserData();
        const listener = DeviceEventEmitter.addListener("favoritesUpdated", loadFavorites);
        return () => {
            listener.remove();
        };
    }, []);

    const loadUserData = async () => {
        try {
            const token = await AsyncStorage.getItem("userToken");
            if (!token) return;
            const response = await fetch(`${API_URL}/profile`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error("Failed to load user info");
            const data = await response.json();
            setUser({
                name: data.username,
                email: data.email,
                profilePic: data.profilePic || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTNJEbNBW7WgMiqHuSO0OPtl8yxP218c-U-4Q&s",
            });
        } catch (error) {
            console.error("Error loading user info:", error);
        }
    };

    const loadFavorites = async () => {
        try {
            const token = await AsyncStorage.getItem("userToken");
            if (!token) return;
            const response = await fetch(`${API_URL}/savedRecipes`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error("Failed to fetch recipes");
            const data = await response.json();
            const mapped = data.map((item: any) => ({
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
            const token = await AsyncStorage.getItem("userToken");
            if (!token) return;
            const response = await fetch(`${API_URL}/savedRecipes/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error("Failed to delete recipe");
            const updatedFavorites = favorites.filter((r) => r.id !== id);
            setFavorites(updatedFavorites);
            DeviceEventEmitter.emit("favoritesUpdated");
            if (selectedRecipe?.id === id) closeRecipeModal();
        } catch (error) {
            console.error("Error removing favorite:", error);
            Alert.alert("Error", "Failed to delete recipe from your account.");
        }
    };

    const confirmRemove = (id: string) => {
        Alert.alert("Confirm Removal", "Are you sure you want to remove this recipe?", [
            { text: "Cancel", style: "cancel" },
            { text: "Remove", onPress: () => removeFavorite(id) },
        ]);
    };

    const handleProfilePicChange = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });
        if (!result.canceled) {
            const uri = result.assets[0].uri;
            setUser((prev) => ({ ...prev, profilePic: uri }));
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
            <Text style={styles.recipeContent} numberOfLines={3}>{item.content}</Text>
        </TouchableOpacity>
    );

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
                throw new Error(errData.error || errData.message || "Failed to change password");
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

    return (
        <GradientBackground>
            <SafeAreaView style={styles.container}>
                <View style={styles.profileHeaderContainer}>
                    <Image
                        source={{ uri: "https://i.pinimg.com/564x/dc/c6/d4/dcc6d4ea22c553ae169e6637c085e389.jpg" }}
                        style={styles.backgroundImage}
                    />
                    <View style={styles.profileBox}>
                        <TouchableOpacity onPress={handleProfilePicChange}>
                            <Image source={{ uri: user.profilePic }} style={styles.profilePic} />
                        </TouchableOpacity>
                        <View style={styles.textRow}>
                            <Text style={styles.welcomeText}>Welcome</Text>
                            <Text style={styles.backText}>back:</Text>
                        </View>
                        <Text style={styles.profileName}>{user.name}</Text>
                        <TouchableOpacity style={styles.bookmarkButton} onPress={() => {
                            setShowFavorites((prev) => !prev);
                            if (!showFavorites) loadFavorites();
                        }}>
                            <Ionicons name="heart" size={30} color="#FF0000" />
                        </TouchableOpacity>

                        <View style={styles.profileActionsRow}>
                            <TouchableOpacity style={styles.changePwButton} onPress={() => setShowChangePwModal(true)}>
                                <Text style={styles.changePwButtonText}>edit pass</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.deleteButtonAlt} onPress={() => Alert.alert("Confirm", "Delete account?", [
                                { text: "Cancel", style: "cancel" },
                                { text: "Delete", style: "destructive" }
                            ])}>
                                <Text style={styles.deleteButtonText}>Delete</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.profileInfoBox}>
                            <Text style={styles.profileLabel}>Email:</Text>
                            <Text style={styles.profileEmail}>{user.email}</Text>
                        </View>

                        <TouchableOpacity style={styles.logoutButton} onPress={async () => {
                            await AsyncStorage.removeItem("userToken");
                            router.replace("/login" as RelativePathString);
                        }}>
                            <Text style={styles.logoutButtonText}>Logout</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {showFavorites && (
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
                )}

                <Modal visible={isModalVisible} animationType="slide" transparent onRequestClose={closeRecipeModal}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <TouchableOpacity style={styles.closeButton} onPress={closeRecipeModal}>
                                    <Text style={styles.closeButtonText}>✕</Text>
                                </TouchableOpacity>
                                {selectedRecipe && (
                                    <TouchableOpacity style={styles.removeModalButton} onPress={() => confirmRemove(selectedRecipe.id)}>
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

                <Modal
                    visible={showChangePwModal}
                    animationType="slide"
                    transparent
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
                                <TouchableOpacity
                                    style={styles.removeModalButton}
                                    onPress={handleChangePassword}
                                >
                                    <Text style={styles.removeModalButtonText}>Save</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        </GradientBackground>
    );
}


const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
    },
    profileHeaderContainer: {
      alignItems: "center",
      marginBottom: 20,
    },
    backgroundImage: {
      width: "100%",
      height: 100,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    },
    profileBox: {
      backgroundColor: "rgba(255, 255, 255, 0.15)",
      width: "100%",
      borderRadius: 10,
      padding: 15,
      alignItems: "center",
      backdropFilter: "blur(10px)", // For web – not all platforms support this
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
      marginTop: -40,
    },
    profilePic: {
      width: 80,
      height: 80,
      borderRadius: 40,
      borderColor: "#fff",
      borderWidth: 2,
    },
    textRow: {
      flexDirection: "row",
      marginTop: 10,
    },
    welcomeText: {
      fontWeight: "bold",
      fontSize: 18,
      marginRight: 4,
      color: "#fff",
    },
    backText: {
      fontWeight: "bold",
      fontSize: 18,
      color: "#fff",
    },
    profileName: {
      fontSize: 22,
      fontWeight: "bold",
      marginTop: 5,
      color: "#28a745",
    },
    bookmarkButton: {
      position: "absolute",
      top: 10,
      right: 10,
    },
    profileActionsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      width: "100%",
      paddingHorizontal: 10,
      marginTop: 12,
    },
    changePwButton: {
      backgroundColor: "#fff",
      paddingVertical: 8,
      paddingHorizontal: 25,
      borderRadius: 8,
    },
    deleteButtonAlt: {
      backgroundColor: "#fff",
      paddingVertical: 8,
      paddingHorizontal: 25,
      borderRadius: 8,
    },
    changePwButtonText: {
      fontWeight: "bold",
      color: "#28a745",
    },
    deleteButtonText: {
      fontWeight: "bold",
      color: "#FF0000",
    },
    profileInfoBox: {
      marginTop: 16,
      width: "100%",
      paddingHorizontal: 20,
    },
    profileLabel: {
      fontWeight: "bold",
      fontSize: 16,
      color: "#fff",
    },
    profileEmail: {
      fontSize: 15,
      marginBottom: 6,
      color: "#fff",
    },
    logoutButton: {
      backgroundColor: "#28a745",
      marginTop: 16,
      paddingVertical: 10,
      paddingHorizontal: 40,
      borderRadius: 8,
    },
    logoutButtonText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 16,
    },
    favoritesSection: {
      flex: 1,
    },
    sectionHeading: {
      fontSize: 28,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 15,
      color: "#fff",
    },
    noFavorites: {
      fontSize: 16,
      textAlign: "center",
      marginTop: 20,
      color: "#eee",
    },
    listContainer: {
      paddingBottom: 20,
    },
    recipeCard: {
      backgroundColor: "rgba(255, 255, 255, 0.15)",
      padding: 15,
      borderRadius: 10,
      marginBottom: 15,
      borderWidth: 1,
      borderColor: "#ddd",
    },
    recipeTitle: {
      fontSize: 20,
      fontWeight: "bold",
      marginBottom: 5,
      color: "#fff",
    },
    recipeContent: {
      fontSize: 16,
      color: "#eee",
      marginBottom: 10,
    },
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
    closeButtonText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 16,
    },
    removeModalButton: {
      backgroundColor: "#28a745",
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    removeModalButtonText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 16,
    },
    modalScroll: {
      paddingBottom: 20,
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: "bold",
      marginBottom: 10,
      color: "#28a745",
    },
    modalRecipe: {
      fontSize: 16,
      color: "#333",
      lineHeight: 24,
    },
    input: {
      borderWidth: 1,
      borderColor: "#ccc",
      borderRadius: 5,
      padding: 10,
      marginTop: 15,
      width: "100%",
      backgroundColor: "#fff",
    },
    modalButtonRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 20,
    },
  });
  