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
  Alert,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../context/ThemeContext";
import { BouncyButton, FadeInView } from "../../components/Animated";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

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
    } catch (err: any) {
      Alert.alert("Oops! 😅", err.errors?.[0]?.message || "Sign up failed");
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
          name: name,
          email: emailAddress,
        });

        router.replace("/(tabs)/feed");
      }
    } catch (err: any) {
      Alert.alert("Oops! 😅", err.errors?.[0]?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <LinearGradient
          colors={[colors.gradient2, colors.gradient1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        />

        <View style={styles.content}>
          <FadeInView delay={0}>
            <View style={styles.logoContainer}>
              <Text style={styles.logo}>🎉</Text>
              <Text style={styles.title}>
                {pendingVerification ? "Check Email" : "Join Framez"}
              </Text>
              <Text style={styles.subtitle}>
                {pendingVerification
                  ? "Enter the code we sent you"
                  : "Start sharing your moments"}
              </Text>
            </View>
          </FadeInView>

          <FadeInView delay={200} style={styles.form}>
            {!pendingVerification ? (
              <>
                <View style={[styles.inputContainer, { backgroundColor: colors.surface }]}>
                  <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Name"
                    placeholderTextColor={colors.textSecondary}
                    value={name}
                    onChangeText={setName}
                  />
                </View>

                <View style={[styles.inputContainer, { backgroundColor: colors.surface }]}>
                  <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Email"
                    placeholderTextColor={colors.textSecondary}
                    value={emailAddress}
                    onChangeText={setEmailAddress}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>

                <View style={[styles.inputContainer, { backgroundColor: colors.surface }]}>
                  <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Password"
                    placeholderTextColor={colors.textSecondary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>

                <BouncyButton onPress={onSignUpPress} disabled={loading} style={{}}>
                  <LinearGradient
                    colors={[colors.secondary, colors.primary]}
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
                <Text style={[styles.verificationText, { color: colors.textSecondary }]}>
                  We sent a code to {emailAddress} 📧
                </Text>

                <View style={[styles.inputContainer, { backgroundColor: colors.surface }]}>
                  <Ionicons name="key-outline" size={20} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Verification Code"
                    placeholderTextColor={colors.textSecondary}
                    value={code}
                    onChangeText={setCode}
                    keyboardType="number-pad"
                  />
                </View>

                <BouncyButton onPress={onVerifyPress} disabled={loading} style={{}}>
                  <LinearGradient
                    colors={[colors.secondary, colors.primary]}
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
              <Link href="/(auth)/sign-in" asChild>
                <Text style={[styles.link, { color: colors.primary }]}>Sign In</Text>
              </Link>
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
    flex: 1,
    opacity: 0.1,
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
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
  logo: {
    fontSize: 80,
    marginBottom: 8,
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
  form: {
    width: "100%",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
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