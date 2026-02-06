import React from "react";
import { StyleSheet, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";

import "@/i18n";
import RootStackNavigator from "@/navigation/RootStackNavigator";
import LockScreen from "@/screens/LockScreen";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider, useApp } from "@/context/AppContext";
import { ChatMenuProvider } from "@/context/ChatMenuContext";
import { PersonaColorsDark, PersonaColorsLight } from "@/constants/theme";

function AppContent() {
  const { isAppLocked, isSecurityLoaded, isPinEnabled, isBiometricEnabled, isDarkMode } = useApp();

  if (!isSecurityLoaded) {
    const colors = isDarkMode ? PersonaColorsDark.neutral : PersonaColorsLight.neutral;
    return <View style={[styles.loading, { backgroundColor: colors.background }]} />;
  }

  const shouldShowLockScreen = isAppLocked && (isPinEnabled || isBiometricEnabled);

  if (shouldShowLockScreen) {
    return (
      <>
        <LockScreen />
        <StatusBar style={isDarkMode ? "light" : "dark"} />
      </>
    );
  }

  return (
    <ChatMenuProvider>
      <GestureHandlerRootView style={styles.root}>
        <KeyboardProvider>
          <NavigationContainer>
            <RootStackNavigator />
          </NavigationContainer>
          <StatusBar style={isDarkMode ? "light" : "dark"} />
        </KeyboardProvider>
      </GestureHandlerRootView>
    </ChatMenuProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <AppProvider>
            <AppContent />
          </AppProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loading: {
    flex: 1,
  },
});
