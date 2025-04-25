// src/screens/ExploreScreen.tsx
import React, { useEffect, useState } from "react";
import { useWindowDimensions, Image as RNImage } from "react-native";
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getPosts,
  uploadPostToServer,
  likePost,
  unlikePost,
  getComments,
  addComment,
  getMyLikes,
  deletePost,
} from "@/services/postService";

export default function ExploreScreen() {
  const [caption, setCaption] = useState("");
  const [imageUri, setImageUri] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [likes, setLikes] = useState({});
  const [visibleCommentPostId, setVisibleCommentPostId] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([]);
  const [showUploadUI, setShowUploadUI] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [postData, likedPostIds] = await Promise.all([
          getPosts(),
          getMyLikes(),
        ]);
        setPosts(postData);
        const likeMap = likedPostIds.reduce((acc, id) => {
          acc[id] = true;
          return acc;
        }, {});
        setLikes(likeMap);

        const userData = await AsyncStorage.getItem("user");
        if (userData) {
          const user = JSON.parse(userData);
          console.log("👤 Logged-in user from storage:", user); // for debug
          setCurrentUserId(user.id);
        }

      } catch (err) {
        Alert.alert("Error", "Unable to fetch posts or likes.");
      }
      setLoading(false);
    };

    loadData();
  }, []);

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
    const formData = new FormData();
  
    try {
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
  
      await uploadPostToServer(formData);
  
      // ✅ Optional: Short delay to ensure DB propagation
      await new Promise((res) => setTimeout(res, 500));
  
      // ✅ Re-fetch posts to show immediately
      const updatedPosts = await getPosts();
      setPosts(updatedPosts);
  
      setCaption("");
      setImageUri(null);
      setShowUploadUI(false); // ✅ Hide the upload section after post
    } catch (err) {
      console.error("Upload error:", err);
      Alert.alert("Error", "Upload failed.");
    } finally {
      setUploading(false);
    }
  };
  

  const toggleLike = async (postId: number) => {
    try {
      if (likes[postId]) {
        await unlikePost(postId);
      } else {
        await likePost(postId);
      }

      setLikes((prev) => ({ ...prev, [postId]: !prev[postId] }));

      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                likeCount: post.likeCount + (likes[postId] ? -1 : 1),
              }
            : post
        )
      );
    } catch (error) {
      console.error("Like toggle failed", error);
    }
  };

  const toggleCommentSection = async (postId: number) => {
    if (visibleCommentPostId === postId) {
      setVisibleCommentPostId(null);
    } else {
      const loaded = await getComments(postId);
      setComments(loaded);
      setVisibleCommentPostId(postId);
    }
  };

  const submitComment = async (postId: number) => {
    try {
      await addComment(postId, commentText);
      const updated = await getComments(postId);
      setComments(updated);
      setCommentText("");
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, commentCount: post.commentCount + 1 }
            : post
        )
      );
    } catch (error) {
      console.error("Error submitting comment", error);
    }
  };

  const { width } = useWindowDimensions();
  const isWideScreen = width >= 768;

  const renderPost = ({ item }) => (
    <View
      style={{
        width: isWideScreen ? "48%" : "100%",
        marginHorizontal: isWideScreen ? "1%" : 0,
        marginBottom: 20,
      }}
    >
      <View style={[styles.postCard]}>
        <View style={styles.postHeader}>
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            <Image
              source={{
                uri:
                  item.profilePic ||
                  "https://i.pinimg.com/564x/dc/c6/d4/dcc6d4ea22c553ae169e6637c085e389.jpg",
              }}
              style={styles.profilePic}
            />
            <Text style={styles.username}>{item.username}</Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={styles.postDateTop}>
              {new Date(item.created_at).toLocaleString()}
            </Text>

            {/* ✅ DEBUG LOG */}
            {console.log("🧠 Comparing IDs:", item.user_id, "vs", currentUserId)}

            {/* ✅ DELETE BUTTON — conditionally shown */}
            {item.user_id === currentUserId && (
              <TouchableOpacity
                onPress={async () => {
                  const confirmed = window.confirm("Are you sure?");
                  if (confirmed) {
                    try {
                      console.log("🗑️ Deleting post ID:", item.id);
                      await deletePost(item.id);
                      setPosts((prev) => prev.filter((p) => p.id !== item.id));
                    } catch (err) {
                      console.error("❌ Delete failed:", err);
                      alert("Failed to delete post.");
                    }
                  }
                }}
              >
                <Ionicons name="trash-outline" size={22} color="#d9534f" />
              </TouchableOpacity>
            )}
          </View>

        </View>

        {item.image && <Image source={{ uri: item.image }} style={styles.postImage} />}

        <Text style={styles.postCaption}>
          <Text style={styles.captionUsername}>{item.username || "Anonymous"}: </Text>
          {item.caption}
        </Text>

        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }}>
          <TouchableOpacity
            onPress={() => toggleLike(item.id)}
            style={{ flexDirection: "row", alignItems: "center", marginRight: 20 }}
          >
            <Ionicons
              name={likes[item.id] ? "heart" : "heart-outline"}
              size={24}
              color={likes[item.id] ? "#e74c3c" : "#555"}
            />
            <Text style={{ marginLeft: 6 }}>{item.likeCount || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => toggleCommentSection(item.id)}
            style={{ flexDirection: "row", alignItems: "center" }}
          >
            <Ionicons name="chatbubble-outline" size={24} color="#555" />
            <Text style={{ marginLeft: 6 }}>{item.commentCount || 0}</Text>
          </TouchableOpacity>
        </View>

        {visibleCommentPostId === item.id && (
          <View style={{ marginTop: 10, backgroundColor: "#f9f9f9", padding: 10, borderRadius: 10 }}>
            {comments.map((c, idx) => (
              <View key={idx} style={{ marginBottom: 6 }}>
                <Text style={{ fontWeight: "bold" }}>{c.username}</Text>
                <Text>{c.content}</Text>
              </View>
            ))}
            <TextInput
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Add a comment..."
              style={{ borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 8, marginTop: 10 }}
            />
            <TouchableOpacity
              onPress={() => submitComment(item.id)}
              style={{ backgroundColor: "#6FA35E", padding: 10, borderRadius: 8, marginTop: 8 }}
            >
              <Text style={{ color: "#fff", textAlign: "center", fontWeight: "bold" }}>Post</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <LinearGradient colors={["#FFFFFF", "#D4E9C7"]} style={styles.gradient}>
      <View style={styles.topHeader}>
  <Image
    source={require("../assets/images/nomnomLogo.png")}
    style={styles.logo}
  />

  <View style={styles.headerCenter}>
    <Ionicons name="compass-outline" size={40} color="#6FA35E" />
    <Text style={styles.title}>EXPLORE</Text>
  </View>

  <TouchableOpacity
    onPress={() => setShowUploadUI(!showUploadUI)}
    style={styles.plusButtonWrapper}
  >
    <Ionicons name="add-circle-outline" size={34} color="#2E7D32" />
  </TouchableOpacity>
</View>


      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
        {showUploadUI && (
          <>
            <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
              <Ionicons name="image-outline" size={24} color="#6FA35E" />
              <Text style={styles.imagePickerText}>Choose Image</Text>
            </TouchableOpacity>

            {imageUri && <Image source={{ uri: imageUri }} style={styles.previewImage} />}

            <TextInput placeholder="Caption" value={caption} onChangeText={setCaption} style={styles.input} />

            <TouchableOpacity onPress={uploadPost} style={styles.uploadButton} disabled={uploading}>
              <Text style={styles.uploadButtonText}>{uploading ? "Uploading..." : "Post"}</Text>
            </TouchableOpacity>
          </>
        )}

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
              numColumns={isWideScreen ? 2 : 1}
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
  gradient: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20 },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 50,
    paddingBottom: 10,
    backgroundColor: "transparent",
  },  
  logo: {
    width: 100,
    height: 100,
    resizeMode: "contain",
    marginRight: 10,
  },
  plusButtonWrapper: {
    padding: 5,
    alignItems: "center",
    justifyContent: "center",
  },  
  title: {
  fontSize: 35,
  fontWeight: "800",
  color: "#2E7D32",
  marginBottom: 0,
  textAlign: "center",
  textTransform: "uppercase",
  letterSpacing: 1,
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
    fontSize: 27,
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
    aspectRatio: 4 / 3,
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
  postDateTop: {
    fontSize: 12,
    color: "#888",
    textAlign: "right",
    flexShrink: 0,
  },
  postListWrapper: {
    width: "100%",
    maxWidth: 1250,
    alignSelf: "center",
    paddingHorizontal: 12,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    justifyContent: "space-between",
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
  captionUsername: {
    fontWeight: "bold",
    color: "#2E7D32",
    textDecorationLine: "underline",
  },
  header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
    
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  ios: {
    position: "relative", // ensures it's laid out within the flex row
  },
  android: {
    position: "relative",
  },
  web: {
    position: "relative",
  },
});
