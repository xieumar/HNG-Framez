// app/_layout.tsx
import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { Slot } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { ThemeProvider } from "../context/ThemeContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";
import { toastConfig } from "../config/toastConfig";

const EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_dHJ1c3RpbmctY29yYWwtNTkuY2xlcmsuYWNjb3VudHMuZGV2JA";
const EXPO_PUBLIC_CONVEX_URL = "https://mild-canary-773.convex.cloud";

const convex = new ConvexReactClient(EXPO_PUBLIC_CONVEX_URL, {
  unsavedChangesWarning: false,
});

const tokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch {
      return;
    }
  },
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ClerkProvider publishableKey={EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          <ThemeProvider>
            <Slot />
            <Toast config={toastConfig} />
          </ThemeProvider>
        </ConvexProviderWithClerk>
      </ClerkProvider>
    </GestureHandlerRootView>
  );
}