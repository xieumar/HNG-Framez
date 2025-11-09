import { Redirect } from "expo-router";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { View, ActivityIndicator } from "react-native";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useEffect } from "react";

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const storeUser = useMutation(api.users.store);

  useEffect(() => {
    if (isSignedIn && user) {
      // Ensure user is stored in Convex
      storeUser({
        clerkId: user.id,
        name: user.fullName || user.firstName || "User",
        email: user.primaryEmailAddress?.emailAddress || "",
      }).catch(console.error);
    }
  }, [isSignedIn, user]);

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (isSignedIn) {
    return <Redirect href="/(tabs)/feed" />;
  }

  return <Redirect href="/(auth)/sign-in" />;
}