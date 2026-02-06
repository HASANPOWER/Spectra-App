import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Image,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as LocalAuthentication from "expo-local-authentication";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import { Fingerprint, Delete, X } from "lucide-react-native";

import { ThemedText } from "@/components/ThemedText";
import { useApp } from "@/context/AppContext";
import { Spacing, BorderRadius, PersonaColorsDark, PersonaColorsLight } from "@/constants/theme";

const KEYPAD_NUMBERS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["", "0", "delete"],
];

const KEY_SIZE = 70;
const DOT_SIZE = 16;
const PIN_LENGTH = 4;

function KeypadButton({
  value,
  onPress,
  colors,
  isBiometric,
  onBiometricPress,
}: {
  value: string;
  onPress: (val: string) => void;
  colors: typeof PersonaColorsDark.neutral;
  isBiometric?: boolean;
  onBiometricPress?: () => void;
}) {
  const scale = useSharedValue(1);
  const bgOpacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor:
      bgOpacity.value > 0
        ? `${colors.primary}${Math.round(bgOpacity.value * 255)
            .toString(16)
            .padStart(2, "0")}`
        : "transparent",
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9);
    bgOpacity.value = withTiming(0.2, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
    bgOpacity.value = withTiming(0, { duration: 200 });
  };

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (value === "delete") {
      onPress("delete");
    } else if (value === "" && isBiometric && onBiometricPress) {
      onBiometricPress();
    } else if (value !== "") {
      onPress(value);
    }
  };

  if (value === "" && !isBiometric) {
    return <View style={styles.keypadButtonEmpty} />;
  }

  if (value === "" && isBiometric) {
    return (
      <Animated.View style={[styles.keypadButton, animatedStyle]}>
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.keypadButtonInner}
        >
          <Fingerprint size={28} color={colors.primary} />
        </Pressable>
      </Animated.View>
    );
  }

  if (value === "delete") {
    return (
      <Animated.View style={[styles.keypadButton, animatedStyle]}>
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.keypadButtonInner}
        >
          <Delete size={24} color={colors.textSecondary} />
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.keypadButton, animatedStyle]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.keypadButtonInner}
      >
        <ThemedText style={[styles.keypadNumber, { color: colors.textPrimary }]}>
          {value}
        </ThemedText>
      </Pressable>
    </Animated.View>
  );
}

function PinDot({
  filled,
  error,
  colors,
  index,
}: {
  filled: boolean;
  error: boolean;
  colors: typeof PersonaColorsDark.neutral;
  index: number;
}) {
  const shakeX = useSharedValue(0);

  useEffect(() => {
    if (error) {
      shakeX.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
  }, [error]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
    backgroundColor: error
      ? "#FF3B30"
      : filled
      ? colors.primary
      : "transparent",
    borderColor: error ? "#FF3B30" : colors.primary,
  }));

  return (
    <Animated.View
      entering={FadeIn.delay(100 + index * 50)}
      style={[styles.pinDot, animatedStyle]}
    />
  );
}

export default function LockScreen() {
  const insets = useSafeAreaInsets();
  const {
    language,
    isDarkMode,
    isPinEnabled,
    isBiometricEnabled,
    storedPin,
    setIsAppLocked,
  } = useApp();

  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const colors = isDarkMode ? PersonaColorsDark.neutral : PersonaColorsLight.neutral;

  useEffect(() => {
    if (isBiometricEnabled && Platform.OS !== "web") {
      attemptBiometricAuth();
    }
  }, []);

  useEffect(() => {
    if (pin.length === PIN_LENGTH) {
      verifyPin();
    }
  }, [pin]);

  const attemptBiometricAuth = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: language === "ar" ? "فتح التطبيق" : "Unlock Spectra",
        fallbackLabel: language === "ar" ? "استخدام الرمز" : "Use PIN",
        disableDeviceFallback: true,
      });

      if (result.success) {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        setIsAppLocked(false);
      }
    } catch (err) {
      console.log("Biometric auth error:", err);
    }
  };

  const verifyPin = useCallback(() => {
    if (pin === storedPin) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setIsAppLocked(false);
    } else {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      setError(true);
      setAttempts((prev) => prev + 1);
      setTimeout(() => {
        setPin("");
        setError(false);
      }, 500);
    }
  }, [pin, storedPin, setIsAppLocked]);

  const handleKeyPress = (value: string) => {
    if (error) return;

    if (value === "delete") {
      setPin((prev) => prev.slice(0, -1));
    } else if (pin.length < PIN_LENGTH) {
      setPin((prev) => prev + value);
    }
  };

  const handleCancel = () => {
    setPin("");
    setError(false);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
        },
      ]}
    >
      <Animated.View entering={FadeIn.delay(100)} style={styles.logoContainer}>
        <Image
          source={require("../../assets/images/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <ThemedText style={[styles.appName, { color: colors.textPrimary }]}>
          SPECTRA
        </ThemedText>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200)} style={styles.content}>
        <ThemedText style={[styles.title, { color: colors.textPrimary }]}>
          {language === "ar" ? "أدخل رمز PIN" : "Enter PIN"}
        </ThemedText>

        {attempts > 0 && !error ? (
          <ThemedText style={[styles.attemptsText, { color: colors.textSecondary }]}>
            {language === "ar"
              ? `المحاولات المتبقية: ${5 - attempts}`
              : `Attempts remaining: ${5 - attempts}`}
          </ThemedText>
        ) : null}

        <View style={styles.pinDotsContainer}>
          {Array.from({ length: PIN_LENGTH }).map((_, index) => (
            <PinDot
              key={index}
              index={index}
              filled={index < pin.length}
              error={error}
              colors={colors}
            />
          ))}
        </View>

        <View style={styles.keypadContainer}>
          {KEYPAD_NUMBERS.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.keypadRow}>
              {row.map((value, colIndex) => (
                <KeypadButton
                  key={`${rowIndex}-${colIndex}`}
                  value={value}
                  onPress={handleKeyPress}
                  colors={colors}
                  isBiometric={value === "" && isBiometricEnabled}
                  onBiometricPress={attemptBiometricAuth}
                />
              ))}
            </View>
          ))}
        </View>

        <Pressable onPress={handleCancel} style={styles.cancelButton}>
          <X size={20} color={colors.textSecondary} />
          <ThemedText style={[styles.cancelText, { color: colors.textSecondary }]}>
            {language === "ar" ? "إلغاء" : "Cancel"}
          </ThemedText>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: Spacing.sm,
  },
  appName: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 4,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingHorizontal: Spacing.xl,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  attemptsText: {
    fontSize: 14,
    marginBottom: Spacing.md,
  },
  pinDotsContainer: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginBottom: Spacing["3xl"],
    marginTop: Spacing.lg,
  },
  pinDot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    borderWidth: 2,
  },
  keypadContainer: {
    gap: Spacing.lg,
  },
  keypadRow: {
    flexDirection: "row",
    gap: Spacing.xl,
  },
  keypadButton: {
    width: KEY_SIZE,
    height: KEY_SIZE,
    borderRadius: KEY_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  keypadButtonEmpty: {
    width: KEY_SIZE,
    height: KEY_SIZE,
  },
  keypadButtonInner: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  keypadNumber: {
    fontSize: 28,
    fontWeight: "500",
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing["3xl"],
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  cancelText: {
    fontSize: 16,
  },
});
