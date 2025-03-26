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
      colors={["#98D67D", "#E8F5E1"]}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.container}>
        {/* Logo */}
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
    paddingHorizontal: 20,
  },
  flexContainer: {
    flex: 1,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 60,
    resizeMode: "contain",
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    padding: 10,
    marginBottom: 15,
  },
  toggleButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    marginHorizontal: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activeButton: {
    backgroundColor: "rgba(152, 214, 125, 0.8)",
    shadowOpacity: 0.15,
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  activeText: {
    color: "#000",
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 20,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
