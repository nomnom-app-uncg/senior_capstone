// src/services/postService.ts
import axios from "axios";
import { API_URL } from "@/constants/config";

export const getPosts = async () => {
const response = await axios.get(`${API_URL}/posts`);
return response.data;
};

export const uploadPostToServer = async (formData: FormData) => {
try {
const response = await axios.post(`${API_URL}/posts`, formData, {
headers: {
"Content-Type": "multipart/form-data",
},
});
console.log("✅ Upload succeeded:", response.data);
    return response.data;
  } catch (err) {
    console.error("❌ Upload error:", {
      message: err.message,
      data: err?.response?.data,
      status: err?.response?.status,
    });
    throw err;
  }
};

