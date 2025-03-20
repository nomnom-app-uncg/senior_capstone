// RegisterScreen.tsx
import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text, Alert } from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { API_URL } from '@/constants/config'; // Import centralized API URL

const RegisterScreen = () => {
  const [username, setUsername]   = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [error, setError]         = useState('');
  const router                  = useRouter(); // expo-router hook for navigation

  const handleRegister = async () => {
    if (!username || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }
  
    try {
      const response = await axios.post(`${API_URL}/register`, {
        username,
        email,
        password,
      });
  
      Alert.alert("Success", "Registration complete! You can now log in.");
      router.push("/login"); // Navigate to login page
    } catch (err: any) {
      console.error("Registration Error:", err);
  
      if (err.response) {
        // Backend responded with an error
        if (err.response.status === 409) {
          setError("Oops! You already have an account. Try logging in.");
        } else if (err.response.status === 500) {
          setError("Server error! Please try again later.");
        } else {
          setError("Something went wrong. Please try again.");
        }
      } else if (err.request) {
        // No response received (server down or unreachable)
        setError("Cannot connect to the server. Please check your internet.");
      } else {
        // Unknown Axios error
        setError("Unexpected error. Please try again.");
      }
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>
      {error ? <Text style={styles.errorText}>{typeof error === "string" ? error : JSON.stringify(error)}</Text> : null}

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
      <Button title="Go to Login" onPress={() => router.push('/login')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 10,
    borderRadius: 5,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default RegisterScreen;
