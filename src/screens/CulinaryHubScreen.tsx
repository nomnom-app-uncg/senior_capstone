import React, { useState } from "react";
import { 
  View, 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  KeyboardAvoidingView, 
  Platform 
} from "react-native";
import ImageToGPTScreen from "./GPTScreen"; //  Image Recognition 
import CulinaryChatScreen from "./CulinaryChatScreen"; // Chat 

export default function CulinaryHubScreen() {
  const [activeTab, setActiveTab] = useState<"scan" | "chat">("scan");

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"} // ✅ Fixes keyboard issue
        style={styles.flexContainer}
      >
        {/* Toggle Buttons */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, activeTab === "scan" && styles.activeButton]}
            onPress={() => setActiveTab("scan")}
          >
            <Text style={[styles.toggleButtonText, activeTab === "scan" && styles.activeText]}>
              📷 Scan
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, activeTab === "chat" && styles.activeButton]}
            onPress={() => setActiveTab("chat")}
          >
            <Text style={[styles.toggleButtonText, activeTab === "chat" && styles.activeText]}>
              💬 Chat
            </Text>
          </TouchableOpacity>
        </View>

        {/* Render GPT Image Recognition or Chat */}
        <View style={styles.contentContainer}>
          {activeTab === "scan" ? <ImageToGPTScreen /> : <CulinaryChatScreen />}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  flexContainer: { flex: 1 }, // ✅ Ensures the whole screen adjusts properly

  toggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    padding: 10,
    backgroundColor: "#f8f8f8",
    borderBottomWidth: 1,
    borderColor: "#ddd",
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

