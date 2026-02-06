import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { PersonaColorsDark, PersonaColorsLight, Spacing, BorderRadius } from "@/constants/theme";
import { useApp } from "@/context/AppContext";

interface ToastProps {
  visible: boolean;
  message: string;
  isRTL: boolean;
  onHide: () => void;
  duration?: number;
}

export function Toast({ visible, message, isRTL, onHide, duration = 2000 }: ToastProps) {
  const { isDarkMode } = useApp();
  const colors = isDarkMode ? PersonaColorsDark.neutral : PersonaColorsLight.neutral;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 20,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => onHide());
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration, onHide, opacity, translateY]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={[styles.toast, { backgroundColor: colors.surface }]}>
        <ThemedText
          style={[
            styles.message,
            { color: colors.textPrimary },
            isRTL && styles.messageRTL,
          ]}
        >
          {message}
        </ThemedText>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 9999,
  },
  toast: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  message: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  messageRTL: {
    textAlign: "right",
    writingDirection: "rtl",
  },
});
