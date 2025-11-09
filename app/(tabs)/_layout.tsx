import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity, View, StyleSheet, Platform } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { BouncyButton } from "../../components/Animated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
  const { colors, isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.surface,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        headerTitleStyle: {
          fontWeight: "bold",
          fontSize: 20,
          color: colors.text,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
          height: (insets.bottom > 0 ? insets.bottom : 0) + 65,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          title: "Feed",
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused && styles.activeTab}>
              <Ionicons 
                name={focused ? "home" : "home-outline"} 
                size={size} 
                color={color} 
              />
            </View>
          ),
          headerRight: () => (
            <BouncyButton onPress={toggleTheme} style={{}}>
              <View style={styles.themeButton}>
                <Ionicons
                  name={isDark ? "sunny" : "moon"}
                  size={24}
                  color={colors.primary}
                />
              </View>
            </BouncyButton>
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "Create",
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[
              styles.createButton,
              { 
                backgroundColor: focused ? colors.primary : colors.surface,
                borderColor: colors.primary,
              }
            ]}>
              <Ionicons 
                name="add" 
                size={size + 4} 
                color={focused ? "#fff" : color} 
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused && styles.activeTab}>
              <Ionicons 
                name={focused ? "person" : "person-outline"} 
                size={size} 
                color={color} 
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  themeButton: {
    marginRight: 16,
    padding: 8,
  },
  activeTab: {
    transform: [{ scale: 1.1 }],
  },
  createButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    marginTop: -10,
  },
});