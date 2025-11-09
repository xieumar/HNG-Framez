import { useSignIn } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../context/ThemeContext";
import { BouncyButton, FadeInView } from "../../components/Animated";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "react-native";
import logo from "../../assets/images/icon.png";
import Toast from "react-native-toast-message";

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const { colors } = useTheme();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSignInPress = async () => {
    if (!isLoaded) return;

    setLoading(true);
    try {
      const completeSignIn = await signIn.create({
        identifier: emailAddress,
        password,
      });

      await setActive({ session: completeSignIn.createdSessionId });

      Toast.show({
        type: "success",
        text1: "Welcome back! 🎉",
        text2: "You're now signed in.",
        position: "top",
        topOffset: 60,
      });

      router.replace("/(tabs)/feed");
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Sign in failed 😅",
        text2: err.errors?.[0]?.message || "Please check your credentials.",
        position: "top",
        topOffset: 60,
      });
    } finally {
      setLoading(false);
    }
  };

  const gradientColors: [string, string] = [colors.primary, colors.secondary];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.content}>
        <FadeInView delay={0}>
          <View style={styles.logoContainer}>
            <Image source={logo} style={styles.logoImage} resizeMode="contain" />
            <Text style={[styles.title, { color: colors.text }]}>Framez</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Share your moments
            </Text>
          </View>
        </FadeInView>

        <FadeInView delay={200}>
          <View style={styles.formWrapper}>
            <View
              style={[
                styles.inputContainer,
                { backgroundColor: colors.surface },
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={20}
                color={colors.textSecondary}
              />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Email"
                placeholderTextColor={colors.textSecondary}
                value={emailAddress}
                onChangeText={setEmailAddress}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>

            <View
              style={[
                styles.inputContainer,
                { backgroundColor: colors.surface },
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={colors.textSecondary}
              />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Password"
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
              />
            </View>

            <BouncyButton onPress={onSignInPress} disabled={loading}>
              <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.button, loading && styles.buttonDisabled]}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Signing in... " : "Sign In "}
                </Text>
              </LinearGradient>
            </BouncyButton>

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: colors.text }]}>
                Don't have an account?{" "}
              </Text>
              <Link href="/(auth)/sign-up">
                <Text style={[styles.link, { color: colors.primary }]}>
                  Sign Up
                </Text>
              </Link>
            </View>
          </View>
        </FadeInView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 48,
  },
  logoImage: {
    width: 100,
    height: 100,
    marginBottom: 4,
  },
  title: {
    fontSize: 48,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  formWrapper: {
    width: "100%",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  button: {
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
  },
  link: {
    fontSize: 14,
    fontWeight: "600",
  },
});
