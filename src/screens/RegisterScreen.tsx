// RegisterScreen.tsx
import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  Alert,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from "react-native";
import { useRouter, RelativePathString } from "expo-router";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { API_URL } from "@/constants/config";

export default function RegisterScreen() {
  const [username, setUsername] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const router = useRouter();

  const handleRegister = async () => {
    if (!username || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    try {
      await axios.post(`${API_URL}/register`, { username, email, password });
      Alert.alert("Success", "Registration complete! You can now log in.");
      router.push("login" as RelativePathString);
    } catch (err: any) {
      console.error("Registration Error:", err);
      if (err.response) {
        if (err.response.status === 409) {
          setError("Oops! You already have an account. Try logging in.");
        } else if (err.response.status === 500) {
          setError("Server error! Please try again later.");
        } else {
          setError("Something went wrong. Please try again.");
        }
      } else if (err.request) {
        setError("Cannot connect to the server. Please check your internet.");
      } else {
        setError("Unexpected error. Please try again.");
      }
    }
  };

  return (
    <LinearGradient
      // Darker green at top -> lighter green at bottom
      colors={["#A2D96F", "#CDECC1"]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require("@/assets/images/nomnomLogo.png")}
            style={styles.logo}
          />
        </View>

        <View style={styles.container}>
          <Text style={styles.screenTitle}>Register</Text>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor="#888"
            value={username}
            onChangeText={setUsername}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#888"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {/* "Continue" button (was "Register") */}
          <TouchableOpacity style={styles.continueButton} onPress={handleRegister}>
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>

          {/* Smaller link to go to Login */}
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.push("login" as RelativePathString)}
          >
            <Text style={styles.linkButtonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 20,
  },
  logo: {
    width: 180,
    height: 90,
    resizeMode: "contain",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    // Center the form
    alignItems: "center",
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 25,
    color: "#000",
  },
  errorText: {
    color: "red",
    marginBottom: 10,
    textAlign: "center",
  },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#000",
  },
  continueButton: {
    width: "100%",
    backgroundColor: "#6FA35E",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  linkButton: {
    marginTop: 15,
  },
  linkButtonText: {
    color: "#004aad",
    fontSize: 16,
    textDecorationLine: "underline",
  },
});
