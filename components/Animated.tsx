import React, { useEffect } from "react";
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "../context/ThemeContext";

// Bouncy Button Component
export function BouncyButton({
  children,
  onPress,
  style,
  disabled,
}: {
  children: React.ReactNode;
  onPress: () => void;
  style?: any;
  disabled?: boolean;
}) {
  const scaleValue = new Animated.Value(1);

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(scaleValue, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      activeOpacity={0.9}
      disabled={disabled}
    >
      <Animated.View
        style={[
          style,
          {
            transform: [{ scale: scaleValue }],
          },
        ]}
      >
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}

// Pulse Animation (for loading states)
export function PulseView({ children, style }: { children: React.ReactNode; style?: any }) {
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [{ scale: pulseAnim }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

// Fade In Animation
export function FadeInView({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: any;
}) {
  const fadeAnim = new Animated.Value(0);
  const translateY = new Animated.Value(20);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 600,
        delay,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: fadeAnim,
          transform: [{ translateY }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

// Cute Loading Indicator
export function CuteLoader() {
  const { colors } = useTheme();
  const spinValue = new Animated.Value(0);
  const scaleValue = new Animated.Value(1);
  const bounceValue = new Animated.Value(0);

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(scaleValue, {
            toValue: 1.15,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scaleValue, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(bounceValue, {
            toValue: -10,
            duration: 500,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(bounceValue, {
            toValue: 0,
            duration: 500,
            easing: Easing.bounce,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.loaderContainer}>
      <Animated.View
        style={[
          styles.loaderWrapper,
          {
            transform: [{ translateY: bounceValue }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.loader,
            {
              backgroundColor: colors.primary,
              transform: [{ rotate: spin }, { scale: scaleValue }],
            },
          ]}
        >
          <View style={[styles.loaderInner, { backgroundColor: colors.secondary }]}>
            <View style={[styles.loaderDot, { backgroundColor: colors.accent }]} />
          </View>
        </Animated.View>
      </Animated.View>
      <Animated.Text 
        style={[
          styles.loaderText, 
          { color: colors.text },
          { transform: [{ scale: scaleValue }] }
        ]}
      >
        ✨ Loading magic...
      </Animated.Text>
      <Text style={[styles.loaderSubtext, { color: colors.textSecondary }]}>
        Hold tight! We're getting things ready 🌟
      </Text>
    </View>
  );
}

// Error State Component
export function CuteError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { colors } = useTheme();
  const bounceValue = new Animated.Value(0);

  useEffect(() => {
    Animated.spring(bounceValue, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.errorContainer,
        {
          transform: [{ scale: bounceValue }],
        },
      ]}
    >
      <Text style={styles.errorEmoji}>😅</Text>
      <Text style={[styles.errorTitle, { color: colors.text }]}>Oops!</Text>
      <Text style={[styles.errorMessage, { color: colors.textSecondary }]}>
        {message}
      </Text>
      {onRetry && (
        <BouncyButton onPress={onRetry} style={{}}>
          <View
            style={[
              styles.retryButton,
              { backgroundColor: colors.primary },
            ]}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </View>
        </BouncyButton>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    flex: 1,
  },
  loaderWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  loader: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  loaderInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  loaderDot: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
  },
  loaderText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 10,
  },
  loaderSubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  errorEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});