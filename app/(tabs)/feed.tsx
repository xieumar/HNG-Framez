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
  Share,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import { useState, useMemo } from "react";
import { useTheme } from "../../context/ThemeContext";
import { FadeInView, CuteLoader, CuteError, BouncyButton } from "../../components/Animated";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { Id } from "../../convex/_generated/dataModel";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Type for optimistic comment count updates
type OptimisticCounts = Map<Id<"posts">, number>;

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
  onComment: (post: any) => void;
  onLike: (post: any) => void;
  onShare: (post: any) => void;
  isLiked: boolean;
  optimisticCommentCount?: number;
}

function PostCard({ 
  post, 
  index, 
  currentUserId, 
  onEdit, 
  onDelete, 
  onComment, 
  onLike, 
  onShare, 
  isLiked,
  optimisticCommentCount
}: PostCardProps) {
  const { colors } = useTheme();
  const isOwner = post.userId === currentUserId;

  // Use optimistic count if available, otherwise use server count
  const displayCommentsCount = optimisticCommentCount ?? post.commentsCount ?? 0;

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
        <TouchableOpacity onPress={() => onLike(post)} style={styles.actionButton}>
          <Ionicons 
            name={isLiked ? "heart" : "heart-outline"} 
            size={24} 
            color={isLiked ? colors.error : colors.primary} 
          />
          <Text style={[styles.actionText, { color: colors.textSecondary }]}>
            {post.likesCount || 0}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => onComment(post)} style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={22} color={colors.secondary} />
          <Text style={[styles.actionText, { color: colors.textSecondary }]}>
            {displayCommentsCount}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => onShare(post)} style={styles.actionButton}>
          <Ionicons name="share-outline" size={24} color={colors.accent} />
          <Text style={[styles.actionText, { color: colors.textSecondary }]}>
            {post.sharesCount || 0}
          </Text>
        </TouchableOpacity>
      </View>
    </FadeInView>
  );
}

export default function FeedScreen() {
  const { colors } = useTheme();
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  const posts = useQuery(api.posts.getAllPosts);
  const convexUser = useQuery(api.users.getCurrentUser, user ? { clerkId: user.id } : "skip");
  const updatePost = useMutation(api.posts.update);
  const deletePost = useMutation(api.posts.deletePost);
  const toggleLike = useMutation(api.likes.toggleLike);
  const createComment = useMutation(api.comments.create);
  const incrementShareCount = useMutation(api.posts.incrementShareCount);
  
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [editContent, setEditContent] = useState("");
  const [commentContent, setCommentContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  
  // Optimistic comment counts: stores the INCREMENT from server value
  const [optimisticCommentDeltas, setOptimisticCommentDeltas] = useState<OptimisticCounts>(new Map());

  const comments = useQuery(
    api.comments.getPostComments,
    selectedPost ? { postId: selectedPost._id } : "skip"
  );

  // Compute optimistic counts by adding delta to server count
  const postsWithOptimisticCounts = useMemo(() => {
    if (!posts) return [];
    
    return posts.map(post => {
      const delta = optimisticCommentDeltas.get(post._id) ?? 0;
      const optimisticCount = (post.commentsCount ?? 0) + delta;
      
      return {
        ...post,
        optimisticCommentCount: optimisticCount
      };
    });
  }, [posts, optimisticCommentDeltas]);

  const onRefresh = async () => {
    setRefreshing(true);
    // Clear optimistic updates on refresh
    setOptimisticCommentDeltas(new Map());
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleLike = async (post: any) => {
    if (!convexUser) {
      Toast.show({
        type: "info",
        text1: "Sign in required",
        text2: "Please sign in to like posts",
        position: "top",
        topOffset: 60,
      });
      return;
    }

    try {
      const result = await toggleLike({
        postId: post._id,
        userId: convexUser._id,
      });

      // Update local state
      setLikedPosts(prev => {
        const newSet = new Set(prev);
        if (result.liked) {
          newSet.add(post._id);
        } else {
          newSet.delete(post._id);
        }
        return newSet;
      });
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleComment = (post: any) => {
    if (!convexUser) {
      Toast.show({
        type: "info",
        text1: "Sign in required",
        text2: "Please sign in to comment",
        position: "top",
        topOffset: 60,
      });
      return;
    }
    setSelectedPost(post);
    setCommentModalVisible(true);
  };

  const submitComment = async () => {
    if (!selectedPost || !convexUser || !commentContent.trim()) {
      Toast.show({
        type: "warning",
        text1: "Content required",
        text2: "Please enter a comment",
        position: "top",
        topOffset: 60,
      });
      return;
    }

    // Optimistically increment the comment count BEFORE setting loading
    setOptimisticCommentDeltas(prev => {
      const newMap = new Map(prev);
      const currentDelta = newMap.get(selectedPost._id) ?? 0;
      newMap.set(selectedPost._id, currentDelta + 1);
      return newMap;
    });

    // Also update the selectedPost immediately so modal shows updated count
    setSelectedPost((prev: any) => ({
      ...prev,
      commentsCount: (prev.commentsCount ?? 0) + 1
    }));

    setLoading(true);

    try {
      await createComment({
        postId: selectedPost._id,
        userId: convexUser._id,
        content: commentContent.trim(),
      });

      Toast.show({
        type: "success",
        text1: "Comment added! 💬",
        position: "top",
        topOffset: 60,
      });

      setCommentContent("");
      
      // Clear the optimistic update after a short delay to ensure server has updated
      setTimeout(() => {
        setOptimisticCommentDeltas(prev => {
          const newMap = new Map(prev);
          newMap.delete(selectedPost._id);
          return newMap;
        });
      }, 1000);
      
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticCommentDeltas(prev => {
        const newMap = new Map(prev);
        const currentDelta = newMap.get(selectedPost._id) ?? 0;
        if (currentDelta > 0) {
          newMap.set(selectedPost._id, currentDelta - 1);
        } else {
          newMap.delete(selectedPost._id);
        }
        return newMap;
      });

      // Also revert the selectedPost update
      setSelectedPost((prev: any) => ({
        ...prev,
        commentsCount: Math.max(0, (prev.commentsCount || 0) - 1)
      }));
      
      Toast.show({
        type: "error",
        text1: "Comment failed",
        text2: "Something went wrong",
        position: "top",
        topOffset: 60,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (post: any) => {
    try {
      const message = `Check out this post by ${post.author?.name || "Unknown"}:\n\n${post.content}`;
      
      if (Platform.OS === "web") {
        if (navigator.share) {
          await navigator.share({
            title: `Post by ${post.author?.name}`,
            text: message,
          });
        } else {
          await navigator.clipboard.writeText(message);
          Toast.show({
            type: "success",
            text1: "Copied to clipboard! 📋",
            position: "top",
            topOffset: 60,
          });
        }
      } else {
        await Share.share({
          message: message,
        });
      }

      // Increment share count
      await incrementShareCount({ postId: post._id });
    } catch (error: any) {
      if (error?.message !== "User cancelled") {
        console.error("Error sharing:", error);
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
        data={postsWithOptimisticCounts}
        keyExtractor={(item) => item._id}
        renderItem={({ item, index }) => (
          <PostCard 
            post={item} 
            index={index}
            currentUserId={convexUser?._id}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onComment={handleComment}
            onLike={handleLike}
            onShare={handleShare}
            isLiked={likedPosts.has(item._id)}
            optimisticCommentCount={item.optimisticCommentCount}
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

      {/* Comments Modal */}
      <Modal visible={commentModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={0}
        >
          <View style={[styles.commentsModal, { backgroundColor: colors.background, paddingTop: insets.top }]}>
            <View style={[styles.commentsHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
              <Text style={[styles.commentsTitle, { color: colors.text }]}>
                Comments ({
                  selectedPost 
                    ? (postsWithOptimisticCounts.find(p => p._id === selectedPost._id)?.optimisticCommentCount ?? selectedPost.commentsCount ?? 0)
                    : 0
                })
              </Text>
              <TouchableOpacity onPress={() => setCommentModalVisible(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.commentsList}>
              {comments?.map((comment) => (
                <View key={comment._id} style={[styles.commentItem, { backgroundColor: colors.card }]}>
                  <View style={styles.commentHeader}>
                    {comment.author?.avatar ? (
                      <Image
                        source={{ uri: comment.author.avatar }}
                        style={styles.commentAvatar}
                      />
                    ) : (
                      <LinearGradient
                        colors={[colors.gradient1, colors.gradient2]}
                        style={[styles.commentAvatar, styles.avatarPlaceholder]}
                      >
                        <Text style={styles.commentAvatarText}>
                          {comment.author?.name?.charAt(0).toUpperCase() || "?"}
                        </Text>
                      </LinearGradient>
                    )}
                    <View style={styles.commentInfo}>
                      <Text style={[styles.commentAuthor, { color: colors.text }]}>
                        {comment.author?.name || "Unknown"}
                      </Text>
                      <Text style={[styles.commentTime, { color: colors.textSecondary }]}>
                        {formatTimestamp(comment.createdAt)}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.commentText, { color: colors.text }]}>
                    {comment.content}
                  </Text>
                </View>
              ))}
            </ScrollView>

            <View style={[styles.commentInputContainer, { 
              backgroundColor: colors.card, 
              borderTopColor: colors.border,
              paddingBottom: Math.max(insets.bottom, 12)
            }]}>
              <TextInput
                style={[styles.commentInput, {
                  backgroundColor: colors.surface,
                  color: colors.text,
                }]}
                placeholder="Write a comment..."
                placeholderTextColor={colors.textSecondary}
                value={commentContent}
                onChangeText={setCommentContent}
                multiline
              />
              <TouchableOpacity
                onPress={submitComment}
                disabled={loading || !commentContent.trim()}
                style={[styles.sendButton, (!commentContent.trim() || loading) && styles.sendButtonDisabled]}
              >
                <LinearGradient
                  colors={[colors.primary, colors.secondary]}
                  style={styles.sendButtonGradient}
                >
                  <Ionicons name="send" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContainer: { paddingVertical: 8 },
  postCard: { marginHorizontal: 12, marginVertical: 6, borderRadius: 16, padding: 16, ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 }, android: { elevation: 3 }, web: { boxShadow: "0 2px 8px rgba(0,0,0,0.1)" } }) },
  postHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  avatarContainer: { marginRight: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarPlaceholder: { justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  postInfo: { flex: 1 },
  authorName: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  timestampContainer: { flexDirection: "row", alignItems: "center" },
  timestamp: { fontSize: 12, marginLeft: 4 },
  postMenu: { flexDirection: "row", alignItems: "center" },
  menuButton: { padding: 8, marginLeft: 4 },
  postContent: { fontSize: 15, lineHeight: 22, marginBottom: 12 },
  imageWrapper: { borderRadius: 12, overflow: "hidden", marginBottom: 12 },
  postImage: { width: "100%", height: 300, backgroundColor: "#f0f0f0" },
  postActions: { flexDirection: "row", justifyContent: "space-around", paddingTop: 12, borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.05)" },
  actionButton: { flexDirection: "row", alignItems: "center", gap: 6 },
  actionText: { fontSize: 14, fontWeight: "600" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: { borderRadius: 24, padding: 24, width: "85%", maxWidth: 400, ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16 }, android: { elevation: 8 }, web: { boxShadow: "0 8px 16px rgba(0,0,0,0.3)" } }) },
  modalHeader: { alignItems: "center", marginBottom: 24 },
  modalEmoji: { fontSize: 64, marginBottom: 16 },
  modalTitle: { fontSize: 24, fontWeight: "bold", marginBottom: 8 },
  modalMessage: { fontSize: 16, textAlign: "center" },
  editInput: { fontSize: 16, minHeight: 120, textAlignVertical: "top", padding: 16, borderRadius: 12, borderWidth: 2, marginBottom: 8 },
  modalActions: { flexDirection: "row" },
  modalButtonWrapper: { flex: 1, marginHorizontal: 6 },
  modalButton: { padding: 16, borderRadius: 12, alignItems: "center" },
  cancelButtonText: { fontSize: 16, fontWeight: "600" },
  confirmButtonText: { fontSize: 16, fontWeight: "600", color: "#fff" },
  buttonDisabled: { opacity: 0.6 },
  commentsModal: { flex: 1 },
  commentsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1 },
  commentsTitle: { fontSize: 20, fontWeight: "bold" },
  commentsList: { flex: 1, padding: 12 },
  commentItem: { marginBottom: 12, padding: 12, borderRadius: 12 },
  commentHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  commentAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 8 },
  commentAvatarText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  commentInfo: { flex: 1 },
  commentAuthor: { fontSize: 14, fontWeight: "bold" },
  commentTime: { fontSize: 12 },
  commentText: { fontSize: 14, lineHeight: 20, marginLeft: 44 },
  commentInputContainer: { flexDirection: "row", alignItems: "flex-end", padding: 12, borderTopWidth: 1 },
  commentInput: { flex: 1, fontSize: 16, padding: 12, borderRadius: 20, maxHeight: 100 },
  sendButton: { marginLeft: 8 },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonGradient: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
});