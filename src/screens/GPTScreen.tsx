//gptscreen.tsx
import React, { useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  Image,
  ScrollView,
  View,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import Ionicons from "react-native-vector-icons/Ionicons";
import Toast from 'react-native-root-toast';
import { analyzeImageWithGPT } from "@/services/OpenAIService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "@/constants/config";
import { LinearGradient } from 'expo-linear-gradient';

export default function ImageToGPTScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);

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
  const startCamera = async () => {
    if (!permission) {
      return;
    }
    if (!permission.granted) {
      await requestPermission();
    }
    setShowCamera(true);
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.3,
        });
        console.log('Photo captured successfully');
        setImageUri(photo.uri);
        setShowCamera(false);
        if (photo.base64) {
          console.log('Starting analysis of captured photo');
          // Format the base64 data to match gallery format
          const formattedBase64 = photo.base64.replace(/^data:image\/\w+;base64,/, '');
          analyzeImage(formattedBase64);
        } else {
          console.log('No base64 data in photo');
        }
      } catch (error) {
        console.error('Error taking picture:', error);
      }
    }
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  // Analyze image with GPT
  const analyzeImage = async (base64Image: string) => {
    try {
      console.log('Starting GPT analysis');
      setAnalysisResult("Analyzing image...");
      const result = await analyzeImageWithGPT(base64Image);
      console.log('Analysis complete:', result);
      setAnalysisResult(result);
    } catch (error) {
      console.error('Error in analysis:', error);
      setAnalysisResult("Error analyzing image.");
    }
  };

  const handleSaveRecipe = async () => {
    console.log("📦 handleSaveRecipe called with:", analysisResult);

    try {
      const token = await AsyncStorage.getItem('userToken');
      console.log("🔑 Token:", token);

      if (!token) {
        Toast.show('⚠️ Please log in to save recipes.', {
          duration: Toast.durations.SHORT,
          position: Toast.positions.TOP,
          backgroundColor: '#FFCC00',
          shadow: true,
          animation: true,
          hideOnPress: true,
          delay: 0,
        });
        return;
      }

      // Attempt to extract a title from the result
      const titleMatch = analysisResult.match(/###\s*(.*?Recipe)/i);
      const title = titleMatch ? titleMatch[1] : "Unnamed AI Recipe";

      const response = await fetch(`${API_URL}/saveRecipe`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title,
          content: analysisResult,
        }),
      });

      const responseBody = await response.json().catch(() => null);
      console.log("📬 Response status:", response.status);
      console.log("📄 Response body:", responseBody);

      if (response.ok) {
        Toast.show('💚 Saved to your profile!', {
          duration: Toast.durations.SHORT,
          position: Toast.positions.TOP,
          backgroundColor: '#D4E9C7',
          shadow: true,
          animation: true,
          hideOnPress: true,
          delay: 0,
        });
      } else {
        Toast.show('❌ Could not save recipe.', {
          duration: Toast.durations.SHORT,
          position: Toast.positions.TOP,
          backgroundColor: '#FF6B6B',
          shadow: true,
          animation: true,
          hideOnPress: true,
          delay: 0,
        });
      }
    } catch (err) {
      console.error("❌ Save recipe error:", err);
      Toast.show('⚠️ Something went wrong.', {
        duration: Toast.durations.SHORT,
        position: Toast.positions.TOP,
        backgroundColor: '#FFCC00',
        shadow: true,
        animation: true,
        hideOnPress: true,
        delay: 0,
      });
    }
  };


  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
        >
          <View style={styles.cameraHeader}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setShowCamera(false)}
            >
              <Text style={styles.closeButtonText}>X</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.toggleButton} onPress={toggleCameraFacing}>
              <Text style={styles.toggleText}>Flip Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <Text style={styles.captureText}>Capture</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Food Analysis</Text>
            <Text style={styles.welcomeSubtitle}>Upload a photo to get started</Text>
          </View>

          {/* Big Green Buttons for picking images */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.bigGreenButton, styles.galleryButton]} 
              onPress={pickImageGallery}
            >
              <View style={styles.buttonContent}>
                <Ionicons name="images-outline" size={32} color="#FFFFFF" />
                <Text style={styles.buttonText}>Pick From Gallery</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.bigGreenButton, styles.cameraButton]} 
              onPress={startCamera}
            >
              <View style={styles.buttonContent}>
                <Ionicons name="camera-outline" size={32} color="#FFFFFF" />
                <Text style={styles.buttonText}>Take a Picture</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Display Picked Image */}
          {imageUri && (
            <View style={styles.imageContainer}>
              <Image source={{ uri: imageUri }} style={styles.image} />
              <View style={styles.imageOverlay}>
                <TouchableOpacity 
                  style={styles.retakeButton}
                  onPress={() => setImageUri(null)}
                >
                  <Ionicons name="refresh-outline" size={24} color="#FFFFFF" />
                  <Text style={styles.retakeText}>Retake</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Analysis Section */}
          {analysisResult && (
            <View style={styles.analysisContainer}>
              <View style={styles.analysisHeader}>
                <Ionicons name="analytics-outline" size={24} color="#6FA35E" />
                <Text style={styles.analysisTitle}>Analysis</Text>
              </View>
              <View style={styles.analysisContent}>
                <Text style={styles.analysisDescription}>{analysisResult}</Text>
              </View>
              <TouchableOpacity
                style={{
                  backgroundColor: "#6FA35E",
                  padding: 12,
                  borderRadius: 10,
                  marginTop: 15,
                  alignItems: "center",
                }}
                onPress={handleSaveRecipe}
              >
                <Text style={{ color: "#fff", fontWeight: "bold" }}>Save Recipe</Text>
              </TouchableOpacity>
            </View>

          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  cameraHeader: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  closeButton: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 20,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 15,
  },
  bigGreenButton: {
    flex: 1,
    height: 120,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  galleryButton: {
    backgroundColor: '#4CAF50',
  },
  cameraButton: {
    backgroundColor: '#4CAF50',
  },
  buttonContent: {
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  imageContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  image: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 5,
  },
  retakeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  analysisContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 15,
  },
  analysisTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  analysisContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 15,
    padding: 15,
  },
  analysisDescription: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  scrollContainer: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  welcomeSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  toggleButton: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 20,
    flex: 1,
    marginHorizontal: 10,
  },
  toggleText: {
    color: 'black',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  captureButton: {
    backgroundColor: 'blue',
    padding: 12,
    borderRadius: 20,
    flex: 1,
    marginHorizontal: 10,
  },
  captureText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
