// app/(tabs)/feed.tsx
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@clerk/clerk-expo";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Pressable,
  TextInput,
  Platform,
} from "react-native";
import { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { FadeInView, CuteLoader, CuteError, BouncyButton } from "../../components/Animated";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
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
  index: number;
  currentUserId?: string;
  onEdit: (post: any) => void;
  onDelete: (post: any) => void;
}

function PostCard({ post, index, currentUserId, onEdit, onDelete }: PostCardProps) {
  const { colors } = useTheme();
  const isOwner = post.userId === currentUserId;

  return (
    <FadeInView delay={index * 100} style={[styles.postCard, { backgroundColor: colors.card }]}>
      <View style={styles.postHeader}>
        <View style={styles.avatarContainer}>
          {post.author?.avatar ? (
            <Image
              source={{ uri: post.author.avatar }}
              style={styles.avatar}
            />
          ) : (
            <LinearGradient
              colors={[colors.gradient1, colors.gradient2]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.avatar, styles.avatarPlaceholder]}
            >
              <Text style={styles.avatarText}>
                {post.author?.name?.charAt(0).toUpperCase() || "?"}
              </Text>
            </LinearGradient>
          )}
        </View>
        <View style={styles.postInfo}>
          <Text style={[styles.authorName, { color: colors.text }]}>
            {post.author?.name || "Unknown"}
          </Text>
          <View style={styles.timestampContainer}>
            <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
            <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
              {formatTimestamp(post.createdAt)}
            </Text>
          </View>
        </View>
        
        {isOwner && (
          <View style={styles.postMenu}>
            <TouchableOpacity onPress={() => onEdit(post)} style={styles.menuButton}>
              <Ionicons name="create-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(post)} style={styles.menuButton}>
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {post.content && (
        <Text style={[styles.postContent, { color: colors.text }]}>
          {post.content}
        </Text>
      )}

      {post.imageUrl && (
        <View style={styles.imageWrapper}>
          <Image 
            source={{ uri: post.imageUrl }} 
            style={styles.postImage}
            resizeMode="cover"
          />
        </View>
      )}

      <View style={styles.postActions}>
        <View style={styles.actionButton}>
          <Ionicons name="heart-outline" size={24} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.textSecondary }]}>Like</Text>
        </View>
        <View style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={22} color={colors.secondary} />
          <Text style={[styles.actionText, { color: colors.textSecondary }]}>Comment</Text>
        </View>
        <View style={styles.actionButton}>
          <Ionicons name="share-outline" size={24} color={colors.accent} />
          <Text style={[styles.actionText, { color: colors.textSecondary }]}>Share</Text>
        </View>
      </View>
    </FadeInView>
  );
}

export default function FeedScreen() {
  const { colors } = useTheme();
  const { user } = useUser();
  const posts = useQuery(api.posts.getAllPosts);
  const convexUser = useQuery(api.users.getCurrentUser, user ? { clerkId: user.id } : "skip");
  const updatePost = useMutation(api.posts.update);
  const deletePost = useMutation(api.posts.deletePost);
  
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [editContent, setEditContent] = useState("");
  const [loading, setLoading] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
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

  if (posts === undefined) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <CuteLoader />
      </View>
    );
  }

  if (posts.length === 0) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <CuteError 
          message="No posts yet! Be the first to share something amazing! 🎨"
        />
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={posts}
        keyExtractor={(item) => item._id}
        renderItem={({ item, index }) => (
          <PostCard 
            post={item} 
            index={index}
            currentUserId={convexUser?._id}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
        contentContainerStyle={[styles.listContainer, { backgroundColor: colors.background }]}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary, colors.secondary]}
          />
        }
        showsVerticalScrollIndicator={false}
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
    </>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    paddingVertical: 8,
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
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      },
    }),
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  postInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  timestampContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  timestamp: {
    fontSize: 12,
    marginLeft: 4,
  },
  postMenu: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuButton: {
    padding: 8,
    marginLeft: 4,
  },
  postContent: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  imageWrapper: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
  },
  postImage: {
    width: "100%",
    height: 300,
    backgroundColor: "#f0f0f0",
  },
  postActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
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
        boxShadow: "0 8px 16px rgba(0,0,0,0.3)",
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
 editInput: {
  fontSize: 16,
  minHeight: 120,
  textAlignVertical: "top",
  padding: 16,
  borderRadius: 12,
  borderWidth: 2,
  marginBottom: 8,
},

  characterCount: {
    textAlign: "right",
    fontSize: 12,
    marginBottom: 16,
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
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});