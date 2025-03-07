//_layout.tsx under (tabs)
import { Tabs } from "expo-router";
import React from "react";
import { Platform, View, StyleSheet } from "react-native";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import FloatingNav from "@/components/FloatingNav"; // ✅ Import FloatingNav
import { IconSymbol } from "@/components/ui/IconSymbol"; // ✅ Import Icons

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
          headerShown: false,
          tabBarStyle: { display: "none" }, // ✅ Hide the default tab bar
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />, // ✅ Restored icon
          }}
        />
        <Tabs.Screen name="explore" options={{ title: "Explore" }} />
        <Tabs.Screen name="fridgeScreen" options={{ title: "Fridge" }} />
        <Tabs.Screen name="culinaryhub" options={{ title: "Culinary Hub" }} />
      </Tabs>

      {/* ✅ Floating Navigation Bar */}
      <FloatingNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  }
}
)
                                 
