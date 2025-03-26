// src/screens/HomeScreen.tsx
// src/screens/HomeScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  ImageBackground,
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Platform,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

const HomeScreen: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const checkLoginStatus = async () => {
      const token = await AsyncStorage.getItem('userToken');
      setIsLoggedIn(!!token);
    };
    checkLoginStatus();
  }, []);

  if (isLoggedIn === null) {
    return <Text style={styles.loadingText}>Loading...</Text>;
  }

  return (
    <ImageBackground
      source={require('@/assets/images/homescreenBackground.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        {/* Gradient overlay: white at bottom, fading up */}
        <LinearGradient
          colors={['rgba(255,255,255,1)', 'rgba(255,255,255,0)']}
          style={styles.gradient}
          start={{ x: 0.5, y: 1 }}
          end={{ x: 0.5, y: 0 }}
        />

        {/* Title and logo */}
        <View style={styles.centerContent}>
          <Text style={styles.title}>WELCOME TO</Text>
          <Image
            source={require('@/assets/images/nomnomLogo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

       
       
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 90,
  },
  gradient: {
    position: 'absolute',
    width: '110%',
    height: '55%', // adjust as needed
    bottom: 0,
    zIndex: 1,
  },
  centerContent: {
    alignItems: 'center',
    marginBottom: 30,
    zIndex: 2, // above gradient
  },
  title: {
    fontSize: 35,
    fontWeight: '600',
    color: '#3E503C',
    fontFamily: Platform.OS === 'ios' ? 'AvenirNext-Medium' : 'sans-serif-medium',
    marginBottom: 12,
  },
  logo: {
    width: 160,
    height: 100,
  },
 
  
  loadingText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 18,
  },
});

export default HomeScreen;
