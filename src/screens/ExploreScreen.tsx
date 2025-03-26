//explore screen import React from "react";
import { View, Text, StyleSheet } from "react-native";
import GradientBackground from "@/components/GradientBackground"; // import gradient wrapper

export default function ExploreScreen() {
  return (
    <GradientBackground>
      <View style={styles.container}>
        <Text style={styles.title}>Welcome to the Explore Screen!</Text>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#3E503C",
  },
});
