import { Platform } from "react-native";

let API_URL: string;

if (Platform.OS === "web") {
  if (typeof window !== "undefined") {
    API_URL = `http://${window.location.hostname}:3000`;
  } else {
    // Fallback for SSR on web
    API_URL = "http://localhost:3000";
  }
} else {
  // ✅ Replace with your machine’s actual IP address
  API_URL = "http://192.168.1.243:3000";
}

export { API_URL };
