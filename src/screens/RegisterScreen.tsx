// RegisterScreen.tsx
import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text, Alert } from 'react-native';
import axios from 'axios';
import { useRouter, RelativePathString } from 'expo-router';
import { API_URL } from '@/constants/config';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const router = useRouter();

  const handleRegister = async () => {
    if (!username || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }
  
    try {
      await axios.post(`${API_URL}/register`, { username, email, password });
      Alert.alert("Success", "Registration complete! You can now log in.");
      // Navigate to the login screen in the auth group
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
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button title="Register" onPress={handleRegister} />
      <Button title="Go to Login" onPress={() => router.push("login" as RelativePathString)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 10,
    borderRadius: 5,
    color: 'white',
  },
  errorText: { color: 'red', marginBottom: 10, textAlign: 'center' },
});


