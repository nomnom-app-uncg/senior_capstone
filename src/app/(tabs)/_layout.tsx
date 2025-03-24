//_layout.tsx under (tabs)
import { Tabs } from "expo-router";
import React from "react";
import { View, StyleSheet } from "react-native";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import FloatingNav from "@/components/FloatingNav";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
          // Hide the default tab bar, we have a FloatingNav
          tabBarStyle: { display: "none" },
        }}
      >
        <Tabs.Screen name="index" options={{ title: "Home" }} />
        <Tabs.Screen name="explore" options={{ title: "Explore" }} />
        <Tabs.Screen name="fridgeScreen" options={{ title: "Fridge" }} />
        <Tabs.Screen name="culinaryhub" options={{ title: "Culinary Hub" }} />
        <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      </Tabs>

      {/* Floating nav bar */}
      <FloatingNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
