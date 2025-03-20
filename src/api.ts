import axios from "axios";
import { API_URL } from "@/constants/config"; // Import API_URL from config.ts

interface User {
  username: string;
  email: string;
  password: string;
}

export const registerUser = async (userData: User) => {
  const response = await axios.post(`${API_URL}/register`, userData);
  return response.data;
};

export const loginUser = async (email: string, password: string) => {
  const response = await axios.post(`${API_URL}/login`, { email, password });
  return response.data;
};
