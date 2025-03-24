//culinaryhubscreen.tsx
import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import ImageToGPTScreen from "./GPTScreen";
import CulinaryChatScreen from "./CulinaryChatScreen";
import FloatingNav from "@/components/FloatingNav";

export default function CulinaryHubScreen() {
  const [activeTab, setActiveTab] = useState<"scan" | "chat">("scan");

  return (
    <LinearGradient
      colors={["#F5FBEF", "#CDECC1"]}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.container}>
        {/* BIGGER Top Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require("@/assets/images/nomnomLogo.png")}
            style={styles.logo}
          />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.flexContainer}
        >
          {/* Toggle Buttons (Scan vs Chat) */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                activeTab === "scan" && styles.activeButton,
              ]}
              onPress={() => setActiveTab("scan")}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  activeTab === "scan" && styles.activeText,
                ]}
              >
                Scan
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleButton,
                activeTab === "chat" && styles.activeButton,
              ]}
              onPress={() => setActiveTab("chat")}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  activeTab === "chat" && styles.activeText,
                ]}
              >
                Chat
              </Text>
            </TouchableOpacity>
          </View>

          {/* Main Content */}
          <View style={styles.contentContainer}>
            {activeTab === "scan" ? <ImageToGPTScreen /> : <CulinaryChatScreen />}
          </View>
        </KeyboardAvoidingView>

        {/* Floating Bottom Nav */}
        <FloatingNav />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  flexContainer: {
    flex: 1,
  },

  // Made the logo bigger
  logoContainer: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 5,
  },
  logo: {
    width: 160,    // Increased width
    height: 80,    // Increased height
    resizeMode: "contain",
  },

  /* Toggle (Scan/Chat) */
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    padding: 10,
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: "#ddd",
    marginHorizontal: 5,
  },
  activeButton: {
    backgroundColor: "#28a745",
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  activeText: {
    color: "#fff",
  },

  contentContainer: {
    flex: 1,
  },
});
