import { useUser, useClerk } from "@clerk/clerk-expo";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
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

function PostCard({ post }: { post: any }) {
  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <Text style={styles.timestamp}>
          {formatTimestamp(post.createdAt)}
        </Text>
      </View>

      {post.content && <Text style={styles.postContent}>{post.content}</Text>}

      {post.imageUrl && (
        <Image source={{ uri: post.imageUrl }} style={styles.postImage} />
      )}
    </View>
  );
}

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  const convexUser = useQuery(api.users.getCurrentUser, {
    clerkId: user?.id || "",
  });

  const userPosts = useQuery(
    api.posts.getUserPosts,
    convexUser ? { userId: convexUser._id } : "skip"
  );

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/(auth)/sign-in");
        },
      },
    ]);
  };

  if (convexUser === undefined || userPosts === undefined) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const ListHeader = () => (
    <View style={styles.header}>
      <View style={styles.profileSection}>
        {convexUser?.avatar ? (
          <Image
            source={{ uri: convexUser.avatar }}
            style={styles.profileImage}
          />
        ) : (
          <View style={[styles.profileImage, styles.profileImagePlaceholder]}>
            <Text style={styles.profileImageText}>
              {convexUser?.name?.charAt(0).toUpperCase() || "?"}
            </Text>
          </View>
        )}
        <Text style={styles.name}>{convexUser?.name}</Text>
        <Text style={styles.email}>{convexUser?.email}</Text>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userPosts?.length || 0}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.postsHeader}>
        <Text style={styles.postsTitle}>My Posts</Text>
      </View>
    </View>
  );

  if (!userPosts || userPosts.length === 0) {
    return (
      <View style={styles.container}>
        <ListHeader />
        <View style={styles.emptyContainer}>
          <Ionicons name="images-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No posts yet</Text>
          <Text style={styles.emptySubtext}>
            Create your first post to see it here
          </Text>
        </View>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={userPosts}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => <PostCard post={item} />}
      ListHeaderComponent={ListHeader}
      contentContainerStyle={styles.listContainer}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  listContainer: {
    paddingBottom: 20,
  },
  header: {
    backgroundColor: "#fff",
    marginBottom: 8,
  },
  profileSection: {
    alignItems: "center",
    padding: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
  },
  profileImagePlaceholder: {
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  profileImageText: {
    color: "#fff",
    fontSize: 40,
    fontWeight: "600",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 5,
  },
  email: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  statItem: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  statLabel: {
    fontSize: 14,
    color: "#8E8E93",
    marginTop: 2,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FF3B30",
  },
  signOutText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
    color: "#FF3B30",
  },
  postsHeader: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  postsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  postCard: {
    backgroundColor: "#fff",
    marginBottom: 8,
    padding: 15,
  },
  postHeader: {
    marginBottom: 10,
  },
  timestamp: {
    fontSize: 12,
    color: "#8E8E93",
  },
  postContent: {
    fontSize: 15,
    color: "#000",
    marginBottom: 10,
    lineHeight: 20,
  },
  postImage: {
    width: "100%",
    height: 300,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginTop: 15,
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#8E8E93",
    textAlign: "center",
  },
});