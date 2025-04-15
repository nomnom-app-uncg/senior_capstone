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
