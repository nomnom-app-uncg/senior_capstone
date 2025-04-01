//_layout in src/app 
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { API_URL } from '@/constants/config';

import { useColorScheme } from '@/hooks/useColorScheme';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Load your custom fonts
  const [fontsLoaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const [checkingToken, setCheckingToken] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [tokenError, setTokenError] = useState(false);

  // Once fonts are loaded, hide splash
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Check AsyncStorage for userToken
  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          try {
            // Verify token is valid by making a test request
            const response = await fetch(`${API_URL}/profile`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            
            if (response.ok) {
              setIsLoggedIn(true);
            } else {
              // Token is invalid, clear it
              await AsyncStorage.removeItem('userToken');
              setIsLoggedIn(false);
            }
          } catch (fetchError) {
            console.error('Error validating token with server:', fetchError);
            // If we can't reach the server, still consider the user logged in
            setIsLoggedIn(true);
          }
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error('Error reading token:', error);
        setTokenError(true);
        setIsLoggedIn(false);
      } finally {
        setCheckingToken(false);
      }
    })();
  }, []);

  // Show loading state while checking token
  if (!fontsLoaded || checkingToken) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6FA35E" />
      </View>
    );
  }

  // Show error state if token validation failed
  if (tokenError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'red', marginBottom: 20 }}>
          Error validating login status. Please try again.
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: '#6FA35E',
            padding: 15,
            borderRadius: 8,
          }}
          onPress={() => {
            setTokenError(false);
            setCheckingToken(true);
          }}
        >
          <Text style={{ color: 'white' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        {isLoggedIn ? (
          // If logged in, show the (tabs) group
          <Stack.Screen name="(tabs)" />
        ) : (
          // Otherwise, show the (auth) group
          <Stack.Screen name="(auth)" />
        )}
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
