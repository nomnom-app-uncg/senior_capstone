//gptscreen.tsx
import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  Image,
  ScrollView,
  View,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import Ionicons from "react-native-vector-icons/Ionicons";
import { analyzeImageWithGPT } from "@/services/OpenAIService";

export default function ImageToGPTScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState("");

  // Pick from Gallery
  const pickImageGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      base64: true,
      allowsMultipleSelection: false,
      quality: 0.3,
    });

    if (!result.canceled) {
      const pickedAsset = result.assets[0];
      setImageUri(pickedAsset.uri);
      analyzeImage(pickedAsset.base64 ?? "");
    }
  };

  // Take a Picture
  const pickImageCamera = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      base64: true,
      allowsMultipleSelection: false,
      quality: 0.3,
    });

    if (!result.canceled) {
      const pickedAsset = result.assets[0];
      setImageUri(pickedAsset.uri);
      analyzeImage(pickedAsset.base64 ?? "");
    }
  };

  // Analyze image with GPT
  const analyzeImage = async (base64Image: string) => {
    try {
      setAnalysisResult("Analyzing image...");
      const result = await analyzeImageWithGPT(base64Image);
      setAnalysisResult(result);
    } catch (error) {
      setAnalysisResult("Error analyzing image.");
    }
  };

  return (
    <LinearGradient
      // Keep the same ombré background
      colors={["#F5FBEF", "#CDECC1"]}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.container}>
        {/* Top Camera Icon */}
        <View style={styles.cameraIconContainer}>
          <Ionicons name="camera-outline" size={36} color="#6FA35E" />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            {/* Big Green Buttons for picking images */}
            <TouchableOpacity style={styles.bigGreenButton} onPress={pickImageGallery}>
              <Text style={styles.buttonText}>Pick From Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.bigGreenButton} onPress={pickImageCamera}>
              <Text style={styles.buttonText}>Take a Picture</Text>
            </TouchableOpacity>

            {/* Display Picked Image */}
            {imageUri && (
              <Image source={{ uri: imageUri }} style={styles.image} />
            )}

            {/* Analysis Section */}
            {analysisResult && (
              <View style={styles.analysisContainer}>
                <Text style={styles.analysisTitle}>Analysis:</Text>

                {/* 
                  THIS is where we show the actual GPT response:
                  (restoring your original functionality)
                */}
                <Text style={styles.analysisDescription}>{analysisResult}</Text>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
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

  /* Camera Icon at the top */
  cameraIconContainer: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 5,
  },

  scrollContainer: {
    flexGrow: 1,
    alignItems: "center",
    padding: 20,
    paddingBottom: 40,
  },

  /* Big Green Buttons */
  bigGreenButton: {
    width: "80%",
    backgroundColor: "#8FBF73",
    paddingVertical: 15,
    borderRadius: 8,
    marginVertical: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "600",
  },

  /* Picked Image */
  image: {
    width: 200,
    height: 200,
    resizeMode: "contain",
    marginTop: 20,
  },

  /* Analysis Card */
  analysisContainer: {
    width: "90%",
    backgroundColor: "#fefefc",
    borderRadius: 6,
    borderColor: "#333",
    borderTopWidth: 2,
    padding: 16,
    marginTop: 20,
  },
  analysisTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#000",
  },
  analysisDescription: {
    fontSize: 16,
    lineHeight: 22,
    color: "#000",
  },
});
