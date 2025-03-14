import axios from "axios";

const API_URL = "http://your-backend-ip:3000";

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
