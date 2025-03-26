//gptscreen.tsx
import React, { useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  Image,
  ScrollView,
  View,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import Ionicons from "react-native-vector-icons/Ionicons";
import { analyzeImageWithGPT } from "@/services/OpenAIService";

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

          <TouchableOpacity style={styles.bigGreenButton} onPress={startCamera}>
            <Text style={styles.buttonText}>Take a Picture</Text>
          </TouchableOpacity>

          {/* Display Picked Image */}
          {imageUri && (
            <View style={styles.imageContainer}>
              <Image source={{ uri: imageUri }} style={styles.image} />
            </View>
          )}

          {/* Analysis Section */}
          {analysisResult && (
            <View style={styles.analysisContainer}>
              <Text style={styles.analysisTitle}>Analysis:</Text>
              <Text style={styles.analysisDescription}>{analysisResult}</Text>
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
    backgroundColor: "#E8F5E1",
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
    position: 'absolute',
    bottom: 50,
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  toggleButton: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 20,
    flex: 1,
    marginHorizontal: 10,
  },
  captureButton: {
    backgroundColor: 'blue',
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
  captureText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cameraIconContainer: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 15,
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: "center",
    padding: 20,
    paddingBottom: 40,
  },
  bigGreenButton: {
    width: "100%",
    backgroundColor: "rgba(152, 214, 125, 0.8)",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginVertical: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: "#000000",
    fontSize: 18,
    fontWeight: "600",
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1,
    marginTop: 20,
    borderRadius: 15,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  analysisContainer: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  analysisTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#000000",
  },
  analysisDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333333",
  },
});
