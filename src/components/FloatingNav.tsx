// FloatingNav.tsx
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "react-native-vector-icons/Ionicons";
import React from "react";

export default function FloatingNav() {
  const router = useRouter();

  const routes = [
    { icon: "home-outline", route: "/" },
    { icon: "search-outline", route: "/explore" },
    { icon: "cart-outline", route: "/fridgeScreen" },
    { icon: "restaurant-outline", route: "(tabs)/culinaryhub" }, 
    { icon: "person-outline", route: "/profile" },
  ];

  return (
    <View style={styles.container}>
      {routes.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.icon}
          onPress={() => router.push(item.route as any)} // 👈 Type assertion to avoid TypeScript error
        >
          <Ionicons name={item.icon} size={24} color="white" />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    paddingVertical: 12,
  },
  icon: {
    padding: 12,
    borderRadius: 30,
    backgroundColor: "rgba(250, 128, 114, 0.9)",
    marginHorizontal: 8,
  },
});
