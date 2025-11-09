import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../../context/ThemeContext";
import { BouncyButton, FadeInView } from "../../components/Animated";
import { LinearGradient } from "expo-linear-gradient";

export default function CreateScreen() {
  const { user } = useUser();
  const router = useRouter();
  const { colors } = useTheme();

  // ✅ Fixed: Use "skip" instead of undefined to prevent conditional hook calls
  const convexUser = useQuery(
    api.users.getCurrentUser, 
    user ? { clerkId: user.id } : "skip"
  );

  const createPost = useMutation(api.posts.create);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const [content, setContent] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      const uploadUrl = await generateUploadUrl();

      const response = await fetch(uri);
      const blob = await response.blob();

      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": blob.type },
        body: blob,
      });

      const { storageId } = await uploadResponse.json();
      return storageId;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  const handlePost = async () => {
    if (!content.trim() && !image) {
      Alert.alert("Oops! 😅", "Please add some content or an image");
      return;
    }

    if (!convexUser) {
      Alert.alert("Oops! 😅", "User not found or still loading");
      return;
    }

    setLoading(true);
    try {
      let imageStorageId: string | undefined;

      if (image) {
        imageStorageId = await uploadImage(image);
      }

      await createPost({
        userId: convexUser._id,
        content: content.trim(),
        imageStorageId,
      });

      Alert.alert("Success! 🎉", "Your post is live!");
      setContent("");
      setImage(null);
      router.push("/(tabs)/feed");
    } catch (error) {
      console.error(error);
      Alert.alert("Oops! 😅", "Failed to create post. Try again!");
    } finally {
      setLoading(false);
    }
  };

  if (!convexUser) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <FadeInView style={styles.content}>
          <View style={styles.header}>
            <LinearGradient
              colors={[colors.gradient1, colors.gradient2]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.headerGradient}
            >
              <Text style={styles.headerEmoji}>✨</Text>
              <Text style={styles.headerTitle}>Create Something Amazing</Text>
            </LinearGradient>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <TextInput
              style={[styles.textInput, {
                backgroundColor: colors.surface,
                color: colors.text,
                borderColor: colors.border,
              }]}
              placeholder="What's on your mind? Share your thoughts... 💭"
              placeholderTextColor={colors.textSecondary}
              multiline
              value={content}
              onChangeText={setContent}
              maxLength={500}
            />
            <Text style={[styles.characterCount, { color: colors.textSecondary }]}>
              {content.length}/500
            </Text>
          </View>

          {image && (
            <FadeInView style={[styles.imageCard, { backgroundColor: colors.card }]}>
              <Image source={{ uri: image }} style={styles.selectedImage} />
              <BouncyButton
                onPress={() => setImage(null)}
                style={styles.removeImageButton}
              >
                <LinearGradient
                  colors={[colors.error, "#FF4757"]}
                  style={styles.removeButton}
                >
                  <Ionicons name="close" size={20} color="#fff" />
                </LinearGradient>
              </BouncyButton>
            </FadeInView>
          )}

          <BouncyButton onPress={pickImage} style={{}}>
            <View style={[styles.imageButton, {
              backgroundColor: colors.surface,
              borderColor: colors.primary,
            }]}>
              <Ionicons name="image" size={28} color={colors.primary} />
              <Text style={[styles.imageButtonText, { color: colors.text }]}>
                {image ? "Change Photo 📸" : "Add Photo 📸"}
              </Text>
            </View>
          </BouncyButton>

          <BouncyButton
            onPress={handlePost}
            disabled={loading}
            style={{}}
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.postButton, loading && styles.postButtonDisabled]}
            >
              <Ionicons name="rocket" size={24} color="#fff" />
              <Text style={styles.postButtonText}>
                {loading ? "Posting... ✨" : "Share with World 🚀"}
              </Text>
            </LinearGradient>
          </BouncyButton>
        </FadeInView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  content: { padding: 16 },
  header: { marginBottom: 20, borderRadius: 20, overflow: "hidden" },
  headerGradient: { padding: 24, alignItems: "center" },
  headerEmoji: { fontSize: 48, marginBottom: 8 },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  card: { borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  textInput: { fontSize: 16, minHeight: 150, textAlignVertical: "top", padding: 16, borderRadius: 12, borderWidth: 2 },
  characterCount: { textAlign: "right", fontSize: 12, marginTop: 8 },
  imageCard: { borderRadius: 16, padding: 8, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  selectedImage: { width: "100%", height: 300, borderRadius: 12 },
  removeImageButton: { position: "absolute", top: 16, right: 16 },
  removeButton: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 },
  imageButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 18, borderRadius: 16, marginBottom: 16, borderWidth: 2, borderStyle: "dashed", gap: 12 },
  imageButtonText: { fontSize: 16, fontWeight: "600" },
  postButton: { flexDirection: "row", padding: 18, borderRadius: 16, alignItems: "center", justifyContent: "center", gap: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  postButtonDisabled: { opacity: 0.6 },
  postButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});