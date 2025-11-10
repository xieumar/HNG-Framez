// app/(tabs)/profile.tsx - WITH EDIT/DELETE
import { useUser, useClerk } from "@clerk/clerk-expo";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  Modal,
  Pressable,
  Platform,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { BouncyButton, FadeInView, CuteLoader } from "../../components/Animated";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";

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

interface PostCardProps {
  post: any;
  onEdit: (post: any) => void;
  onDelete: (post: any) => void;
}

function PostCard({ post, onEdit, onDelete }: PostCardProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.postCard, { backgroundColor: colors.card }]}>
      <View style={styles.postHeader}>
        <View style={styles.postHeaderLeft}>
          <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
          <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
            {formatTimestamp(post.createdAt)}
          </Text>
        </View>
        <View style={styles.postMenu}>
          <TouchableOpacity onPress={() => onEdit(post)} style={styles.menuButton}>
            <Ionicons name="create-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(post)} style={styles.menuButton}>
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
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
  const router = useRouter();
  
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [editContent, setEditContent] = useState("");
  const [loading, setLoading] = useState(false);

  const convexUser = useQuery(
    api.users.getCurrentUser,
    user ? { clerkId: user.id } : "skip"
  );
  const updateUser = useMutation(api.users.store);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const updatePost = useMutation(api.posts.update);
  const deletePost = useMutation(api.posts.deletePost);

  const userPosts = useQuery(
    api.posts.getUserPosts,
    convexUser ? { userId: convexUser._id } : "skip"
  );

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      
      Toast.show({
        type: "success",
        text1: "See you soon! 👋",
        text2: "You've been signed out",
        position: "top",
        topOffset: 60,
      });
      
      setShowSignOutModal(false);

      if (Platform.OS === "web") {
        window.location.href = "/(auth)/sign-in";
      } else {
        router.replace("/(auth)/sign-in");
      }
    } catch (error) {
      console.error("Sign out error:", error);
      Toast.show({
        type: "error",
        text1: "Sign out failed",
        text2: "Please try again",
        position: "top",
        topOffset: 60,
      });
      setSigningOut(false);
      setShowSignOutModal(false);
    }
  };

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

        await updateUser({
          clerkId: user.id,
          name: convexUser.name,
          email: convexUser.email,
          avatar: storageId,
        });

        Toast.show({
          type: "success",
          text1: "Avatar updated! ✨",
          text2: "Looking great!",
          position: "top",
          topOffset: 60,
        });
      } catch (error) {
        console.error("Error uploading avatar:", error);
        Toast.show({
          type: "error",
          text1: "Upload failed",
          text2: "Couldn't update your avatar",
          position: "top",
          topOffset: 60,
        });
      } finally {
        setUploadingAvatar(false);
      }
    }
  };

  const handleEdit = (post: any) => {
    setSelectedPost(post);
    setEditContent(post.content);
    setEditModalVisible(true);
  };

  const handleDelete = (post: any) => {
    setSelectedPost(post);
    setDeleteModalVisible(true);
  };

  const confirmEdit = async () => {
    if (!selectedPost || !editContent.trim()) {
      Toast.show({
        type: "warning",
        text1: "Content required",
        text2: "Please enter some text",
        position: "top",
        topOffset: 60,
      });
      return;
    }

    setLoading(true);
    try {
      await updatePost({
        postId: selectedPost._id,
        content: editContent.trim(),
      });

      Toast.show({
        type: "success",
        text1: "Post updated! ✨",
        text2: "Your changes have been saved",
        position: "top",
        topOffset: 60,
      });

      setEditModalVisible(false);
      setSelectedPost(null);
      setEditContent("");
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Update failed",
        text2: "Something went wrong",
        position: "top",
        topOffset: 60,
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedPost) return;

    setLoading(true);
    try {
      await deletePost({ postId: selectedPost._id });

      Toast.show({
        type: "success",
        text1: "Post deleted! 🗑️",
        text2: "Your post has been removed",
        position: "top",
        topOffset: 60,
      });

      setDeleteModalVisible(false);
      setSelectedPost(null);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Delete failed",
        text2: "Something went wrong",
        position: "top",
        topOffset: 60,
      });
    } finally {
      setLoading(false);
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

          <BouncyButton onPress={() => setShowSignOutModal(true)}>
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
          visible={showSignOutModal}
          onClose={() => setShowSignOutModal(false)}
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
        renderItem={({ item }) => (
          <PostCard 
            post={item}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
      
      <SignOutModal
        visible={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={handleSignOut}
        loading={signingOut}
      />

      {/* Edit Modal */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => !loading && setEditModalVisible(false)}>
          <Pressable style={[styles.modalContent, { backgroundColor: colors.card }]} onPress={(e) => e.stopPropagation()}>
            <FadeInView style={styles.modalHeader}>
              <Text style={styles.modalEmoji}>✏️</Text>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Post</Text>
              <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
                Update your content
              </Text>
            </FadeInView>

            <TextInput
              style={[styles.editInput, {
                backgroundColor: colors.surface,
                color: colors.text,
                borderColor: colors.border,
              }]}
              placeholder="What's on your mind?"
              placeholderTextColor={colors.textSecondary}
              value={editContent}
              onChangeText={setEditContent}
              multiline
              maxLength={500}
              autoFocus
            />
            <Text style={[styles.characterCount, { color: colors.textSecondary }]}>
              {editContent.length}/500
            </Text>

            <View style={styles.modalActions}>
              <View style={styles.modalButtonWrapper}>
                <BouncyButton onPress={() => setEditModalVisible(false)} disabled={loading}>
                  <View style={[styles.modalButton, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                  </View>
                </BouncyButton>
              </View>

              <View style={styles.modalButtonWrapper}>
                <BouncyButton onPress={confirmEdit} disabled={loading}>
                  <LinearGradient
                    colors={[colors.primary, colors.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.modalButton, loading && styles.buttonDisabled]}
                  >
                    <Text style={styles.confirmButtonText}>
                      {loading ? "Saving..." : "Save"}
                    </Text>
                  </LinearGradient>
                </BouncyButton>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Delete Modal */}
      <Modal visible={deleteModalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => !loading && setDeleteModalVisible(false)}>
          <Pressable style={[styles.modalContent, { backgroundColor: colors.card }]} onPress={(e) => e.stopPropagation()}>
            <FadeInView style={styles.modalHeader}>
              <Text style={styles.modalEmoji}>🗑️</Text>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Delete Post?</Text>
              <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
                This action cannot be undone
              </Text>
            </FadeInView>

            <View style={styles.modalActions}>
              <View style={styles.modalButtonWrapper}>
                <BouncyButton onPress={() => setDeleteModalVisible(false)} disabled={loading}>
                  <View style={[styles.modalButton, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                  </View>
                </BouncyButton>
              </View>

              <View style={styles.modalButtonWrapper}>
                <BouncyButton onPress={confirmDelete} disabled={loading}>
                  <LinearGradient
                    colors={[colors.error, "#FF4757"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.modalButton, loading && styles.buttonDisabled]}
                  >
                    <Text style={styles.confirmButtonText}>
                      {loading ? "Deleting..." : "Delete"}
                    </Text>
                  </LinearGradient>
                </BouncyButton>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
                <View style={[styles.modalButton, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                </View>
              </BouncyButton>
            </View>

            <View style={styles.modalButtonWrapper}>
              <BouncyButton onPress={onConfirm} disabled={loading}>
                <LinearGradient
                  colors={errorGradientColors}
                  style={[styles.modalButton, loading && styles.buttonDisabled]}
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
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContainer: { paddingBottom: 20 },
  header: { marginBottom: 8 },
  headerGradient: { paddingBottom: 24 },
  profileSection: { alignItems: "center", paddingTop: 24 },
  avatarWrapper: { position: "relative", marginBottom: 16 },
  profileImage: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: "#fff" },
  profileImagePlaceholder: { justifyContent: "center", alignItems: "center" },
  profileImageText: { color: "#fff", fontSize: 48, fontWeight: "bold" },
  editBadge: { position: "absolute", bottom: 0, right: 0, width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center", borderWidth: 3, borderColor: "#fff" },
  name: { fontSize: 28, fontWeight: "bold", color: "#fff", marginBottom: 4 },
  email: { fontSize: 14, color: "rgba(255,255,255,0.8)", marginBottom: 20 },
  statsContainer: { flexDirection: "row", alignItems: "center", marginBottom: 20, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 16, padding: 16 },
  statItem: { alignItems: "center", paddingHorizontal: 24 },
  statDivider: { width: 1, height: 40 },
  statValue: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  statLabel: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 4 },
  signOutButton: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 24, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 12, borderWidth: 2 },
  signOutText: { fontSize: 16, fontWeight: "600", marginLeft: 8 },
  postsHeader: { flexDirection: "row", alignItems: "center", padding: 16 },
  postsTitle: { fontSize: 18, fontWeight: "bold", marginLeft: 8 },
  postCard: { marginHorizontal: 12, marginVertical: 6, borderRadius: 16, padding: 16, ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 }, android: { elevation: 3 }, web: { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' } }) },
  postHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  postHeaderLeft: { flexDirection: "row", alignItems: "center" },
  timestamp: { fontSize: 12, marginLeft: 4 },
  postMenu: { flexDirection: "row", alignItems: "center" },
  menuButton: { padding: 8, marginLeft: 4 },
  postContent: { fontSize: 15, lineHeight: 22, marginBottom: 10 },
  imageWrapper: { borderRadius: 12, overflow: "hidden" },
  postImage: { width: "100%", height: 200, backgroundColor: "#f0f0f0" },
  emptyContainer: { alignItems: "center", padding: 40 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: "600", marginBottom: 8 },
  emptySubtext: { fontSize: 14, textAlign: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: { borderRadius: 24, padding: 24, width: "85%", maxWidth: 400, ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16 }, android: { elevation: 8 }, web: { boxShadow: '0 8px 16px rgba(0,0,0,0.3)' } }) },
  modalHeader: { alignItems: "center", marginBottom: 24 },
  modalEmoji: { fontSize: 64, marginBottom: 16 },
  modalTitle: { fontSize: 24, fontWeight: "bold", marginBottom: 8 },
  modalMessage: { fontSize: 16, textAlign: "center" },
  editInput: { fontSize: 16, minHeight: 120, textAlignVertical: "top", padding: 16, borderRadius: 12, borderWidth: 2, marginBottom: 8 },
  characterCount: { textAlign: "right", fontSize: 12, marginBottom: 16 },
  modalActions: { flexDirection: "row" },
  modalButtonWrapper: { flex: 1, marginHorizontal: 6 },
  modalButton: { padding: 16, borderRadius: 12, alignItems: "center" },
  cancelButtonText: { fontSize: 16, fontWeight: "600" },
  confirmButtonText: { fontSize: 16, fontWeight: "600", color: "#fff" },
  buttonDisabled: { opacity: 0.6 },
});