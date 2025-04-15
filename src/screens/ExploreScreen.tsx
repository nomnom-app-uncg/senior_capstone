// src/screens/ExploreScreen.tsx
import React, { useEffect, useState } from "react";
import { useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import Ionicons from "react-native-vector-icons/Ionicons";
import { getPosts, uploadPostToServer } from "@/services/postService";

export default function ExploreScreen() {
  const [caption, setCaption] = useState("");
  const [imageUri, setImageUri] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const data = await getPosts();
      setPosts(data);
    } catch (err) {
      Alert.alert("Error", "Unable to fetch posts.");
    }
    setLoading(false);
  };

  const getMimeType = (uri: string) => {
    const ext = uri.split(".").pop();
    switch (ext) {
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      case "png":
        return "image/png";
      case "gif":
        return "image/gif";
      default:
        return "application/octet-stream";
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadPost = async () => {
    if (!caption || !imageUri) {
      Alert.alert("Missing", "Image and caption are required.");
      return;
    }

    setUploading(true);
    const fileName = imageUri.split("/").pop();
    const type = getMimeType(imageUri);
    console.log("Uploading post with:", { caption, imageUri });

    const formData = new FormData();
    if (Platform.OS === "web" && imageUri.startsWith("data:image")) {
      const res = await fetch(imageUri);
      const blob = await res.blob();
      formData.append("image", blob, fileName);
    } else {
      formData.append("image", {
        uri: imageUri,
        name: fileName,
        type,
      } as any);
    }
    formData.append("caption", caption);
    console.log("Sending FormData:");
    formData.forEach((value, key) => {
      console.log(key, value);
    });


    try {
      await uploadPostToServer(formData);
      setCaption("");
      setImageUri(null);
      fetchPosts();
    } catch (err) {
      console.error("Upload failed in ExploreScreen:", err);
      Alert.alert("Error", "Upload failed.");
    }

    setUploading(false);
  };
  const { width } = useWindowDimensions();
  const isWideScreen = width >= 768; 

  const renderPost = ({ item }) => (
    <View style={[styles.postCard, !isWideScreen && { alignSelf: "center" }]}>
      {/* Header */}
      <View style={styles.postHeader}>
        <Image
          source={{
            uri:
              item.profilePic ||
              "https://i.pinimg.com/564x/dc/c6/d4/dcc6d4ea22c553ae169e6637c085e389.jpg",
          }}
          style={styles.profilePic}
        />
        <Text style={styles.username}>{item.username || "Anonymous"}</Text>
      </View>
  
      {/* Post Image */}
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.postImage} />
      ) : null}
  
      {/* Caption & Timestamp */}
      <Text style={styles.postCaption}>{item.caption}</Text>
      <Text style={styles.postDate}>
        {new Date(item.created_at).toLocaleString()}
      </Text>
    </View>
  );
  



  return (
    <LinearGradient colors={["#FFFFFF", "#D4E9C7"]} style={styles.gradient}>
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <Text style={styles.title}>EXPLORE</Text>

      <TextInput
        placeholder="Caption"
        value={caption}
        onChangeText={setCaption}
        style={styles.input}
      />

      <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
        <Ionicons name="image-outline" size={24} color="#6FA35E" />
        <Text style={styles.imagePickerText}>Choose Image</Text>
      </TouchableOpacity>

      {imageUri && <Image source={{ uri: imageUri }} style={styles.previewImage} />}

      <TouchableOpacity onPress={uploadPost} style={styles.uploadButton} disabled={uploading}>
        <Text style={styles.uploadButtonText}>{uploading ? "Uploading..." : "Post"}</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Recent Posts</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#6FA35E" />
      ) : (
        <View style={isWideScreen && styles.postListWrapper}>
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
          numColumns={isWideScreen ? 2 : 1} // ✅ Dynamic column count
          columnWrapperStyle={
            isWideScreen ? { justifyContent: "space-between", paddingHorizontal: 4 } : undefined
        }
  contentContainerStyle={{ paddingBottom: 100 }}
/>
</View>

      )}
    </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#2E7D32",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  imagePicker: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    marginBottom: 10,
  },
  imagePickerText: {
    fontSize: 16,
    color: "#6FA35E",
    fontWeight: "600",
  },
  previewImage: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    marginBottom: 15,
  },
  uploadButton: {
    backgroundColor: "#6FA35E",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  uploadButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 15,
    color: "#2E7D32",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingBottom: 8,
  },
  postCard: {
    flex: 1,
    margin: 8,
    borderRadius: 14,
    backgroundColor: "#fff",
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 5,   
  },  
  
  postImage: {
    width: "100%",
    aspectRatio: 4 / 3, // ✅ Adjusted to a shorter, cleaner shape
    borderRadius: 10,
    marginBottom: 12,
    resizeMode: "cover",
  }, 
  postCaption: {
    fontSize: 17,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
  },
  postDate: {
    fontSize: 12,
    color: "#888",
    textAlign: "right",
  },
  postListWrapper: {
    width: "100%",
    maxWidth: 1250,       // ✅ Limit overall post area
    alignSelf: "center",  // ✅ Center on the screen
    paddingHorizontal: 12,
  },  
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  profilePic: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: "#ccc",
  },
  username: {
    fontWeight: "600",
    fontSize: 15,
    color: "#2E7D32",
  },

});
