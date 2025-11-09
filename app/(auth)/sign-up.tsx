import { useSignUp } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../context/ThemeContext";
import { BouncyButton, FadeInView } from "../../components/Animated";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import logo from "../../assets/images/icon.png";
import Toast from "react-native-toast-message";

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const { colors } = useTheme();
  const storeUser = useMutation(api.users.store);

  const [name, setName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const onSignUpPress = async () => {
    if (!isLoaded) return;

    setLoading(true);
    try {
      await signUp.create({
        emailAddress,
        password,
        firstName: name,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);

      Toast.show({
        type: "success",
        text1: "Check your email! 📧",
        text2: `We sent a code to ${emailAddress}`,
        position: "top",
        topOffset: 60,
      });
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Sign up failed 😅",
        text2: err.errors?.[0]?.message || "Please try again",
        position: "top",
        topOffset: 60,
      });
    } finally {
      setLoading(false);
    }
  };

  const onVerifyPress = async () => {
    if (!isLoaded) return;

    setLoading(true);
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });

        await storeUser({
          clerkId: completeSignUp.createdUserId!,
          name,
          email: emailAddress,
        });

        Toast.show({
          type: "success",
          text1: "Welcome to Framez! 🎉",
          text2: "Your account is ready",
          position: "top",
          topOffset: 60,
        });

        router.replace("/(tabs)/feed");
      }
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Verification failed 😬",
        text2: err.errors?.[0]?.message || "Invalid code",
        position: "top",
        topOffset: 60,
      });
    } finally {
      setLoading(false);
    }
  };

  const gradientColors: [string, string] = [colors.gradient2, colors.gradient1];
  const buttonGradientColors: [string, string] = [colors.secondary, colors.primary];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        />

        <View style={styles.content}>
          <FadeInView delay={0}>
            <View style={styles.logoContainer}>
              <Image source={logo} style={styles.logoImage} resizeMode="contain" />
              <Text style={[styles.title, { color: colors.text }]}>
                {pendingVerification ? "Check Email" : "Join Framez"}
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {pendingVerification
                  ? "Enter the code we sent you"
                  : "Start sharing your moments"}
              </Text>
            </View>
          </FadeInView>

          <FadeInView delay={200}>
            <View style={styles.formWrapper}>
              {!pendingVerification ? (
                <>
                  <View
                    style={[styles.inputContainer, { backgroundColor: colors.surface }]}
                  >
                    <Ionicons
                      name="person-outline"
                      size={20}
                      color={colors.textSecondary}
                    />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="Name"
                      placeholderTextColor={colors.textSecondary}
                      value={name}
                      onChangeText={setName}
                      autoComplete="name"
                    />
                  </View>

                  <View
                    style={[styles.inputContainer, { backgroundColor: colors.surface }]}
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
                    style={[styles.inputContainer, { backgroundColor: colors.surface }]}
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
                      autoComplete="password-new"
                    />
                  </View>

                  <BouncyButton onPress={onSignUpPress} disabled={loading}>
                    <LinearGradient
                      colors={buttonGradientColors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.button, loading && styles.buttonDisabled]}
                    >
                      <Text style={styles.buttonText}>
                        {loading ? "Creating... ✨" : "Create Account 🎨"}
                      </Text>
                    </LinearGradient>
                  </BouncyButton>
                </>
              ) : (
                <>
                  <Text
                    style={[styles.verificationText, { color: colors.textSecondary }]}
                  >
                    We sent a code to {emailAddress} 📧
                  </Text>

                  <View
                    style={[styles.inputContainer, { backgroundColor: colors.surface }]}
                  >
                    <Ionicons
                      name="key-outline"
                      size={20}
                      color={colors.textSecondary}
                    />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="Verification Code"
                      placeholderTextColor={colors.textSecondary}
                      value={code}
                      onChangeText={setCode}
                      keyboardType="number-pad"
                      autoComplete="one-time-code"
                    />
                  </View>

                  <BouncyButton onPress={onVerifyPress} disabled={loading}>
                    <LinearGradient
                      colors={buttonGradientColors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.button, loading && styles.buttonDisabled]}
                    >
                      <Text style={styles.buttonText}>
                        {loading ? "Verifying... ✨" : "Verify & Start 🚀"}
                      </Text>
                    </LinearGradient>
                  </BouncyButton>
                </>
              )}

              <View style={styles.footer}>
                <Text style={[styles.footerText, { color: colors.text }]}>
                  Already have an account?{" "}
                </Text>
                <Link href="/(auth)/sign-in">
                  <Text style={[styles.link, { color: colors.primary }]}>
                    Sign In
                  </Text>
                </Link>
              </View>
            </View>
          </FadeInView>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    opacity: 0.1,
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
    fontSize: 40,
    fontWeight: "bold",
    marginBottom: 8,
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
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  verificationText: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: "center",
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
