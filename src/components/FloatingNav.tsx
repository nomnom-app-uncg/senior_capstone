// FloatingNav.tsx
import React, { useState } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter, RelativePathString } from "expo-router";
import Ionicons from "react-native-vector-icons/Ionicons";

export default function FloatingNav() {
  const router = useRouter();
  const [activeRoute, setActiveRoute] = useState("/");

  const routes = [
    { icon: "home-outline", route: "/" },
    { icon: "search-outline", route: "/explore" },
    { icon: "cart-outline", route: "/fridgeScreen" },
    { icon: "restaurant-outline", route: "/culinaryhub" },
    { icon: "person-outline", route: "/profile" },
  ];

  return (
    <View style={styles.container}>
      {routes.map((item, index) => {
        const isActive = activeRoute === item.route;
        // If active, remove the "-outline" suffix for a filled icon
        const iconName = isActive ? item.icon.replace("-outline", "") : item.icon;
        return (
          <TouchableOpacity
            key={index}
            style={styles.iconWrapper}
            onPress={() => {
              setActiveRoute(item.route);
              router.push(item.route as RelativePathString);
            }}
          >
            <Ionicons name={iconName} size={28} color="#6FA35E" />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#ccc",
  },
  iconWrapper: {
    padding: 12,
  },
});
