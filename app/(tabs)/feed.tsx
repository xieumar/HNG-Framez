import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  RefreshControl,
} from "react-native";
import { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { FadeInView, CuteLoader, CuteError } from "../../components/Animated";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

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

function PostCard({ post, index }: { post: any; index: number }) {
  const { colors } = useTheme();

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
  const posts = useQuery(api.posts.getAllPosts);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
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
    <FlatList
      data={posts}
      keyExtractor={(item) => item._id}
      renderItem={({ item, index }) => <PostCard post={item} index={index} />}
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
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
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
  },
});