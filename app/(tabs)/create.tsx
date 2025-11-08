import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function CreateScreen() {
  const { user } = useUser();
  const router = useRouter();
  const convexUser = useQuery(api.users.getCurrentUser, {
    clerkId: user?.id || "",
  });
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
      Alert.alert("Error", "Please add some content or an image");
      return;
    }

    if (!convexUser) {
      Alert.alert("Error", "User not found");
      return;
    }

    setLoading(true);
    try {
      let imageUrl = undefined;

      if (image) {
        const storageId = await uploadImage(image);
        // Get the URL from storage
        imageUrl = `${process.env.EXPO_PUBLIC_CONVEX_URL}/api/storage/${storageId}`;
      }

      await createPost({
        userId: convexUser._id,
        content: content.trim(),
        imageUrl,
      });

      Alert.alert("Success", "Post created successfully!");
      setContent("");
      setImage(null);
      router.push("/(tabs)/feed");
    } catch (error) {
      Alert.alert("Error", "Failed to create post");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <TextInput
            style={styles.textInput}
            placeholder="What's on your mind?"
            placeholderTextColor="#999"
            multiline
            value={content}
            onChangeText={setContent}
            maxLength={500}
          />

          {image && (
            <View style={styles.imageContainer}>
              <Image source={{ uri: image }} style={styles.selectedImage} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setImage(null)}
              >
                <Ionicons name="close-circle" size={30} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
            <Ionicons name="image" size={24} color="#007AFF" />
            <Text style={styles.imageButtonText}>Add Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.postButton,
              loading && styles.postButtonDisabled,
            ]}
            onPress={handlePost}
            disabled={loading}
          >
            <Text style={styles.postButtonText}>
              {loading ? "Posting..." : "Post"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  textInput: {
    fontSize: 16,
    minHeight: 150,
    textAlignVertical: "top",
    padding: 15,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  imageContainer: {
    position: "relative",
    marginBottom: 15,
  },
  selectedImage: {
    width: "100%",
    height: 300,
    borderRadius: 8,
  },
  removeImageButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 15,
  },
  imageButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  imageButtonText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "500",
  },
  postButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  postButtonDisabled: {
    opacity: 0.6,
  },
  postButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});