import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Image,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  FadeIn,
  FadeInDown,
} from "react-native-reanimated";
import { Fingerprint, Delete } from "lucide-react-native";

import { ThemedText } from "@/components/ThemedText";
import { useApp } from "@/context/AppContext";
import { Spacing, BorderRadius, PersonaColorsDark, PersonaColorsLight } from "@/constants/theme";

const { width } = Dimensions.get("window");
const PIN_LENGTH = 4;
const CORRECT_PIN = "1234";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { setIsAuthenticated, isDarkMode } = useApp();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const shakeX = useSharedValue(0);

  const theme = isDarkMode ? PersonaColorsDark.neutral : PersonaColorsLight.neutral;

  const handlePinPress = useCallback(
    (digit: string) => {
      if (pin.length >= PIN_LENGTH) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const newPin = pin + digit;
      setPin(newPin);
      setError(false);

      if (newPin.length === PIN_LENGTH) {
        setTimeout(() => {
          if (newPin === CORRECT_PIN) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setIsAuthenticated(true);
          } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setError(true);
            shakeX.value = withSequence(
              withSpring(-10, { damping: 2 }),
              withSpring(10, { damping: 2 }),
              withSpring(-10, { damping: 2 }),
              withSpring(0, { damping: 2 })
            );
            setTimeout(() => setPin(""), 300);
          }
        }, 100);
      }
    },
    [pin, setIsAuthenticated, shakeX]
  );

  const handleDelete = useCallback(() => {
    if (pin.length > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setPin(pin.slice(0, -1));
      setError(false);
    }
  }, [pin]);

  const handleBiometric = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsAuthenticated(true);
  }, [setIsAuthenticated]);

  const pinDotsStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const renderPinDots = () => (
    <Animated.View style={[styles.pinDotsContainer, pinDotsStyle]}>
      {Array.from({ length: PIN_LENGTH }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.pinDot,
            {
              backgroundColor:
                index < pin.length
                  ? error
                    ? "#FF4444"
                    : theme.primary
                  : theme.surface,
              borderColor: error ? "#FF4444" : theme.primary,
            },
          ]}
        />
      ))}
    </Animated.View>
  );

  const renderKeypad = () => {
    const keys = [
      ["1", "2", "3"],
      ["4", "5", "6"],
      ["7", "8", "9"],
      ["bio", "0", "del"],
    ];

    return (
      <View style={styles.keypadContainer}>
        {keys.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.keypadRow}>
            {row.map((key) => {
              if (key === "bio") {
                return (
                  <AnimatedPressable
                    key={key}
                    style={[styles.keypadKey, { backgroundColor: theme.surface }]}
                    onPress={handleBiometric}
                    entering={FadeInDown.delay(300 + rowIndex * 50)}
                  >
                    <Fingerprint size={28} color={theme.primary} />
                  </AnimatedPressable>
                );
              }
              if (key === "del") {
                return (
                  <AnimatedPressable
                    key={key}
                    style={[styles.keypadKey, { backgroundColor: theme.surface }]}
                    onPress={handleDelete}
                    entering={FadeInDown.delay(300 + rowIndex * 50)}
                  >
                    <Delete size={24} color={theme.textSecondary} />
                  </AnimatedPressable>
                );
              }
              return (
                <AnimatedPressable
                  key={key}
                  style={[styles.keypadKey, { backgroundColor: theme.surface }]}
                  onPress={() => handlePinPress(key)}
                  entering={FadeInDown.delay(300 + rowIndex * 50)}
                >
                  <ThemedText
                    style={[styles.keypadKeyText, { color: theme.textPrimary }]}
                  >
                    {key}
                  </ThemedText>
                </AnimatedPressable>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
          paddingTop: insets.top + Spacing["3xl"],
          paddingBottom: insets.bottom + Spacing.xl,
        },
      ]}
    >
      <Animated.View style={styles.header} entering={FadeIn.delay(100)}>
        <Image
          source={require("../../assets/images/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <ThemedText
          style={[styles.appName, { color: theme.textPrimary }]}
          type="h2"
        >
          {t("appName")}
        </ThemedText>
      </Animated.View>

      <Animated.View style={styles.pinSection} entering={FadeIn.delay(200)}>
        <ThemedText
          style={[
            styles.subtitle,
            { color: error ? "#FF4444" : theme.textSecondary },
          ]}
        >
          {error ? t("auth.wrongPin") : t("auth.enterPin")}
        </ThemedText>
        {renderPinDots()}
      </Animated.View>

      {renderKeypad()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing["4xl"],
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: Spacing.lg,
  },
  appName: {
    letterSpacing: 4,
    textTransform: "uppercase",
  },
  pinSection: {
    alignItems: "center",
    marginBottom: Spacing["4xl"],
  },
  subtitle: {
    fontSize: 16,
    marginBottom: Spacing.xl,
  },
  pinDotsContainer: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  keypadContainer: {
    gap: Spacing.md,
  },
  keypadRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  keypadKey: {
    width: (width - Spacing.xl * 2 - Spacing.md * 2) / 3,
    height: 70,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  keypadKeyText: {
    fontSize: 28,
    fontWeight: "500",
  },
});
