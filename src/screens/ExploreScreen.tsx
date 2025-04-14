// src/screens/ExploreScreen.tsx
import React, { useEffect, useState } from "react";
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

  const renderPost = ({ item }) => (
    <View style={styles.postCard}>
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.postImage} />
      ) : null}
      <Text style={styles.postCaption}>{item.caption}</Text>
      <Text style={styles.postDate}>{new Date(item.created_at).toLocaleString()}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <Text style={styles.title}>Create a Post</Text>

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
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2E7D32",
    marginBottom: 15,
    textAlign: "center",
  },
  input: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  imagePicker: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  imagePickerText: {
    fontSize: 16,
    color: "#6FA35E",
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
  },
  uploadButton: {
    backgroundColor: "#6FA35E",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 30,
  },
  uploadButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
    color: "#2E7D32",
  },
  postCard: {
    marginBottom: 20,
    borderRadius: 10,
    backgroundColor: "#FFF",
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  postCaption: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  postDate: {
    fontSize: 12,
    color: "gray",
  },
});