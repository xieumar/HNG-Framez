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

// Cute Loading Indicator - Three Pulsing Dots
export function CuteLoader() {
  const { colors } = useTheme();
  
  const Dot = ({ delay }: { delay: number }) => {
    const scaleValue = new Animated.Value(0.3);
    const opacityValue = new Animated.Value(0.3);

    useEffect(() => {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scaleValue, {
              toValue: 1,
              duration: 600,
              delay,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(opacityValue, {
              toValue: 1,
              duration: 600,
              delay,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(scaleValue, {
              toValue: 0.3,
              duration: 600,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(opacityValue, {
              toValue: 0.3,
              duration: 600,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    }, []);

    return (
      <Animated.View
        style={[
          styles.loaderDot,
          {
            backgroundColor: colors.primary,
            transform: [{ scale: scaleValue }],
            opacity: opacityValue,
          },
        ]}
      />
    );
  };

  return (
    <View style={styles.loaderContainer}>
      <View style={styles.dotsWrapper}>
        <Dot delay={0} />
        <Dot delay={200} />
        <Dot delay={400} />
      </View>
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
  dotsWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loaderDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
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