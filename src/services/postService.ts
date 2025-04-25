import axios from "axios";
import { API_URL } from "@/constants/config";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const getPosts = async () => {
  const response = await axios.get(`${API_URL}/posts`);
  return response.data;
};

export const uploadPostToServer = async (formData: FormData) => {
  try {
    const token = await AsyncStorage.getItem("userToken");

    // Log token to verify it exists
    console.log("📦 Retrieved Token:", token);

    if (!token) {
      throw new Error("No user token found. User may not be logged in.");
    }

    const response = await axios.post(`${API_URL}/posts`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("✅ Upload succeeded:", response.data);
    return response.data;
  } catch (err) {
    console.error("❌ Upload error:", {
      message: err?.message,
      data: err?.response?.data,
      status: err?.response?.status,
    });
    throw err;
  }
};

export const likePost = async (postId: number) => {
  const token = await AsyncStorage.getItem("userToken");
  if (!token) throw new Error("No user token found.");

  return axios.post(
    `${API_URL}/like`,
    { postId },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

export const unlikePost = async (postId: number) => {
  const token = await AsyncStorage.getItem("userToken");
  if (!token) throw new Error("No user token found.");

  return axios.delete(`${API_URL}/unlike`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { postId },
  });
};

export const addComment = async (postId: number, content: string) => {
  const token = await AsyncStorage.getItem("userToken");
  if (!token) throw new Error("No user token found.");

  return axios.post(
    `${API_URL}/comment`,
    { postId, content },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

export const getMyLikes = async () => {
  const token = await AsyncStorage.getItem("userToken");
  if (!token) throw new Error("No user token found.");
  const res = await axios.get(`${API_URL}/myLikes`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data; // Array of liked post IDs
};

export const getComments = async (postId: number) => {
  const response = await axios.get(`${API_URL}/comments/${postId}`);
  return response.data;
};

export const deletePost = async (postId: number) => {
  const token = await AsyncStorage.getItem("userToken");
  if (!token) throw new Error("No user token found.");

  const res = await fetch(`${API_URL}/posts/${postId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Failed to delete post");
  }

  return await res.json(); // returns { message: "Post deleted" }
};
