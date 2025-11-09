// config/toastConfig.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { BaseToast, ErrorToast, ToastConfig } from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

export const toastConfig: ToastConfig = {
  success: (props) => (
    <View style={styles.toastContainer}>
      <LinearGradient
        colors={["#B8E6D5", "#9BCDCD"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.toast}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.emoji}>✅</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{props.text1}</Text>
          {props.text2 && <Text style={styles.message}>{props.text2}</Text>}
        </View>
      </LinearGradient>
    </View>
  ),

  error: (props) => (
    <View style={styles.toastContainer}>
      <LinearGradient
        colors={["#FFB5BA", "#FF4757"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.toast}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.emoji}>❌</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{props.text1}</Text>
          {props.text2 && <Text style={styles.message}>{props.text2}</Text>}
        </View>
      </LinearGradient>
    </View>
  ),

  info: (props) => (
    <View style={styles.toastContainer}>
      <LinearGradient
        colors={["#9BCDCD", "#C8B6E2"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.toast}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.emoji}>ℹ️</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{props.text1}</Text>
          {props.text2 && <Text style={styles.message}>{props.text2}</Text>}
        </View>
      </LinearGradient>
    </View>
  ),

  warning: (props) => (
    <View style={styles.toastContainer}>
      <LinearGradient
        colors={["#FFA502", "#FF6348"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.toast}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.emoji}>⚠️</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{props.text1}</Text>
          {props.text2 && <Text style={styles.message}>{props.text2}</Text>}
        </View>
      </LinearGradient>
    </View>
  ),
};

const styles = StyleSheet.create({
  toastContainer: {
    width: "90%",
    paddingHorizontal: 16,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    marginRight: 12,
  },
  emoji: {
    fontSize: 28,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
  },
});