// app/(tabs)/profile.tsx - FIXED VERSION
import { useUser, useClerk } from "@clerk/clerk-expo";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  Modal,
  Pressable,
  Platform,
} from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { BouncyButton, FadeInView, CuteLoader } from "../../components/Animated";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";

function formatTimestamp(timestamp: number) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function PostCard({ post }: { post: any }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.postCard, { backgroundColor: colors.card }]}>
      <View style={styles.postHeader}>
        <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
        <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
          {formatTimestamp(post.createdAt)}
        </Text>
      </View>

      {post.content && (
        <Text style={[styles.postContent, { color: colors.text }]}>
          {post.content}
        </Text>
      )}

      {post.imageUrl && (
        <View style={styles.imageWrapper}>
          <Image source={{ uri: post.imageUrl }} style={styles.postImage} />
        </View>
      )}
    </View>
  );
}

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { colors } = useTheme();
  const [showModal, setShowModal] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // ✅ Fixed: Use "skip" when user is not loaded yet
  const convexUser = useQuery(
    api.users.getCurrentUser,
    user ? { clerkId: user.id } : "skip"
  );
  const updateUser = useMutation(api.users.store);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const userPosts = useQuery(
    api.posts.getUserPosts,
    convexUser ? { userId: convexUser._id } : "skip"
  );

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      setShowModal(false);
      
      if (Platform.OS === "web") {
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Sign out error:", error);
      setSigningOut(false);
      setShowModal(false);
    }
  };

  // ✅ Fixed: Store only storageId, not full URL
  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && convexUser && user) {
      setUploadingAvatar(true);
      try {
        const uploadUrl = await generateUploadUrl();
        
        const response = await fetch(result.assets[0].uri);
        const blob = await response.blob();

        const uploadResponse = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": blob.type },
          body: blob,
        });

        const { storageId } = await uploadResponse.json();

        // ✅ Store ONLY the storageId, not a full URL
        await updateUser({
          clerkId: user.id,
          name: convexUser.name,
          email: convexUser.email,
          avatar: storageId,
        });

        console.log("Avatar uploaded successfully:", storageId);
      } catch (error) {
        console.error("Error uploading avatar:", error);
      } finally {
        setUploadingAvatar(false);
      }
    }
  };

  if (convexUser === undefined || userPosts === undefined) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <CuteLoader />
      </View>
    );
  }

  const gradientColors: [string, string] = [colors.gradient1, colors.gradient2];
  const avatarGradientColors: [string, string] = [colors.primary, colors.secondary];

  const ListHeader = () => (
    <FadeInView style={styles.header}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.profileSection}>
          <BouncyButton onPress={pickAvatar}>
            <View style={styles.avatarWrapper}>
              {convexUser?.avatar ? (
                <Image
                  source={{ uri: convexUser.avatar }}
                  style={styles.profileImage}
                />
              ) : (
                <LinearGradient
                  colors={avatarGradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.profileImage, styles.profileImagePlaceholder]}
                >
                  <Text style={styles.profileImageText}>
                    {convexUser?.name?.charAt(0).toUpperCase() || "?"}
                  </Text>
                </LinearGradient>
              )}
              <View style={[styles.editBadge, { backgroundColor: colors.primary }]}>
                <Ionicons name={uploadingAvatar ? "hourglass" : "camera"} size={16} color="#fff" />
              </View>
            </View>
          </BouncyButton>

          <Text style={styles.name}>{convexUser?.name}</Text>
          <Text style={styles.email}>{convexUser?.email}</Text>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userPosts?.length || 0}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>🎨</Text>
              <Text style={styles.statLabel}>Creative</Text>
            </View>
          </View>

          <BouncyButton onPress={() => setShowModal(true)}>
            <View style={[styles.signOutButton, { borderColor: "#FF4757" }]}>
              <Ionicons name="log-out-outline" size={20} color="#FF4757" />
              <Text style={[styles.signOutText, { color: "#FF4757" }]}>Sign Out</Text>
            </View>
          </BouncyButton>
        </View>
      </LinearGradient>

      <View style={[styles.postsHeader, { backgroundColor: colors.background }]}>
        <Ionicons name="grid-outline" size={20} color={colors.text} />
        <Text style={[styles.postsTitle, { color: colors.text }]}>My Posts</Text>
      </View>
    </FadeInView>
  );

  if (!userPosts || userPosts.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <FlatList
          data={[]}
          renderItem={() => null}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📸</Text>
              <Text style={[styles.emptyText, { color: colors.text }]}>No posts yet</Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                Create your first post to see it here! ✨
              </Text>
            </View>
          }
        />
        <SignOutModal 
          visible={showModal}
          onClose={() => setShowModal(false)}
          onConfirm={handleSignOut}
          loading={signingOut}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={userPosts}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <PostCard post={item} />}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
      <SignOutModal 
        visible={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleSignOut}
        loading={signingOut}
      />
    </View>
  );
}

function SignOutModal({ 
  visible, 
  onClose, 
  onConfirm, 
  loading 
}: { 
  visible: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  loading: boolean;
}) {
  const { colors } = useTheme();
  const errorGradientColors: [string, string] = [colors.error, "#FF4757"];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={() => !loading && onClose()}>
        <Pressable style={[styles.modalContent, { backgroundColor: colors.card }]} onPress={(e) => e.stopPropagation()}>
          <FadeInView style={styles.modalHeader}>
            <Text style={styles.modalEmoji}>👋</Text>
            <Text style={[styles.modalTitle, { color: colors.text }]}>See you soon!</Text>
            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
              Are you sure you want to sign out?
            </Text>
          </FadeInView>

          <View style={styles.modalActions}>
            <View style={styles.modalButtonWrapper}>
              <BouncyButton onPress={onClose} disabled={loading}>
                <View style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                </View>
              </BouncyButton>
            </View>

            <View style={styles.modalButtonWrapper}>
              <BouncyButton onPress={onConfirm} disabled={loading}>
                <LinearGradient
                  colors={errorGradientColors}
                  style={[styles.modalButton, styles.confirmButton, loading && styles.buttonDisabled]}
                >
                  <Text style={styles.confirmButtonText}>
                    {loading ? "Signing out..." : "Sign Out"}
                  </Text>
                </LinearGradient>
              </BouncyButton>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    paddingBottom: 20,
  },
  header: {
    marginBottom: 8,
  },
  headerGradient: {
    paddingBottom: 24,
  },
  profileSection: {
    alignItems: "center",
    paddingTop: 24,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#fff",
  },
  profileImagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  profileImageText: {
    color: "#fff",
    fontSize: 48,
    fontWeight: "bold",
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  name: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 16,
    padding: 16,
  },
  statItem: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    borderWidth: 2,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  postsHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  postsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
  postCard: {
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 16,
    padding: 16,
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
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      },
    }),
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  timestamp: {
    fontSize: 12,
    marginLeft: 4,
  },
  postContent: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 10,
  },
  imageWrapper: {
    borderRadius: 12,
    overflow: "hidden",
  },
  postImage: {
    width: "100%",
    height: 200,
    backgroundColor: "#f0f0f0",
  },
  emptyContainer: {
    alignItems: "center",
    padding: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    borderRadius: 24,
    padding: 24,
    width: "85%",
    maxWidth: 400,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
      },
    }),
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  modalEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 16,
    textAlign: "center",
  },
  modalActions: {
    flexDirection: "row",
  },
  modalButtonWrapper: {
    flex: 1,
    marginHorizontal: 6,
  },
  modalButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButton: {},
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  confirmButton: {},
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});