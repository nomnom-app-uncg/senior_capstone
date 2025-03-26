import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GradientBackgroundProps {
  children: React.ReactNode;
  style?: object;
}

const GradientBackground: React.FC<GradientBackgroundProps> = ({ children, style }) => {
  return (
    <LinearGradient
      colors={['#77C16F', '#ECECE0', '#FFFFFF']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={[styles.background, style]}
    >
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
});

export default GradientBackground;
