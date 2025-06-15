import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GluestackUIProvider } from "@gluestack-ui/themed";
import { config } from "@gluestack-ui/config";
import { AuthProvider } from "../contexts/AuthContext";
import { SettingsProvider } from "../contexts/SettingsContext";
import { NotificationProvider } from "../contexts/NotificationContext";
import ErrorBoundary from "../components/ErrorBoundary";
import ToastNotification from "../components/ui/ToastNotification";

export default function RootLayout() {
  return (
    <GluestackUIProvider config={config}>
      <ErrorBoundary>
        <SettingsProvider>
          <AuthProvider>
            <NotificationProvider>
              <StatusBar style="auto" />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
              </Stack>
              <ToastNotification />
            </NotificationProvider>
          </AuthProvider>
        </SettingsProvider>
      </ErrorBoundary>
    </GluestackUIProvider>
  );
}
