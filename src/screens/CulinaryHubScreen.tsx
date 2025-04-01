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
import Ionicons from "react-native-vector-icons/Ionicons";

export default function CulinaryHubScreen() {
  const [activeTab, setActiveTab] = useState<"scan" | "chat">("scan");

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#FFFFFF', '#D4E9C7']}
        style={styles.gradient}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}
        >
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Image 
                source={require("@/assets/images/nomnomLogo.png")} 
                style={styles.logo}
                resizeMode="contain"
              />
              <View style={styles.headerCenter}>
                <Ionicons name="restaurant-outline" size={36} color="#6FA35E" />
                <Text style={styles.heading}>Culinary Hub</Text>
              </View>
            </View>
          </View>

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
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 15,
    marginTop: Platform.OS === 'ios' ? 10 : 0,
    backgroundColor: 'transparent',
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginLeft: 10,
  },
  logo: {
    width: 80,
    height: 80,
  },
  heading: {
    fontSize: 36,
    fontWeight: "900",
    color: "#2E7D32",
    marginTop: 10,
    textShadowColor: 'rgba(110, 163, 94, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
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
    marginHorizontal: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    backgroundColor: 'transparent',
  },
  activeButton: {
    backgroundColor: "#6FA35E",
    shadowOpacity: 0.15,
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  activeText: {
    color: "#FFFFFF",
  },
  contentContainer: {
    flex: 1,
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
});
