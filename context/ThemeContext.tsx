import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  colors: typeof lightColors;
}

const lightColors = {
  primary: "#a78dccff", // Lavender
  secondary: "#9BCDCD", // Soft mint
  accent: "#FFD6E0", // Pastel pink
  background: "#F8FAFA",
  surface: "#FFFFFF",
  text: "#2D3436",
  textSecondary: "#636E72",
  border: "#E8F0F0",
  error: "#FFB5BA",
  success: "#B8E6D5",
  card: "#FFFFFF",
  shadow: "rgba(155, 205, 205, 0.15)",
  gradient1: "#9BCDCD",
  gradient2: "#C8B6E2",
};

const darkColors = {
  primary: "#7AB8B8", // Deeper mint
  secondary: "#A89CC8", // Muted lavender
  accent: "#E8B4BE", // Muted pink
  background: "#1A1D1E",
  surface: "#252A2B",
  text: "#EAEAEA",
  textSecondary: "#A8A8A8",
  border: "#3A4446",
  error: "#E89BA0",
  success: "#90C9B4",
  card: "#252A2B",
  shadow: "rgba(0, 0, 0, 0.5)",
  gradient1: "#7AB8B8",
  gradient2: "#A89CC8",
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem("theme");
      if (savedTheme) {
        setTheme(savedTheme as Theme);
      } else if (systemColorScheme) {
        setTheme(systemColorScheme);
      }
    } catch (error) {
      console.log("Error loading theme:", error);
    }
  };

  const toggleTheme = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    try {
      await AsyncStorage.setItem("theme", newTheme);
    } catch (error) {
      console.log("Error saving theme:", error);
    }
  };

  const colors = theme === "light" ? lightColors : darkColors;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === "dark",
        toggleTheme,
        colors,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}