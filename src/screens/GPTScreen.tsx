//gptscreen.tsx
import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  Button,
  Image,
  ScrollView,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { analyzeImageWithGPT } from "@/services/OpenAIService";

export default function ImageToGPTScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState("");

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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.heading}>🍽️ Image to GPT</Text>

          {/* 🎨 Image Picker Buttons */}
          <Button title="Pick from Gallery" onPress={pickImageGallery} />
          <Button title="Take a Picture" onPress={pickImageCamera} />

          {/* 🖼️ Display Image */}
          {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}

          {/* 🤖 Show GPT Image Analysis */}
          {analysisResult && (
            <>
              <Text style={styles.subHeading}>GPT Analysis:</Text>
              <Text style={styles.analysisText}>{analysisResult}</Text>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    paddingBottom: 40, // Adds extra space for bottom navigation bar
  },
  heading: { fontSize: 24, fontWeight: "bold", marginBottom: 20, color: "green" },
  subHeading: { fontSize: 18, fontWeight: "600", marginTop: 20, marginBottom: 10, color: "black" },
  analysisText: { fontSize: 16, color: "black", textAlign: "center", paddingHorizontal: 20 },
  image: { width: 200, height: 200, resizeMode: "contain", marginTop: 20 },
});
