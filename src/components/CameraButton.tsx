import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

export default function CameraButton() {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.openButton}
      onPress={() => router.push('/camera')}
    >
      <Text style={styles.openButtonText}>OPEN CAMERA</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  openButton: {
    backgroundColor: 'red',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    margin: 16,
  },
  openButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
});
