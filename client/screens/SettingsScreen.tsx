import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Platform,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";
import * as LocalAuthentication from "expo-local-authentication";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import {
  Check,
  Globe,
  Moon,
  Sun,
  Shield,
  Lock,
  Fingerprint,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  X,
} from "lucide-react-native";

import { ThemedText } from "@/components/ThemedText";
import { useApp } from "@/context/AppContext";
import { languageNames } from "@/i18n/translations";
import { Spacing, BorderRadius } from "@/constants/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const LANGUAGES = ["en", "ar", "fr", "tr", "es"];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const {
    language,
    setLanguage,
    isDarkMode,
    setIsDarkMode,
    personaTheme,
    isRTL,
    isPinEnabled,
    setIsPinEnabled,
    isBiometricEnabled,
    setIsBiometricEnabled,
    setStoredPin,
  } = useApp();

  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [confirmPinInput, setConfirmPinInput] = useState("");
  const [pinStep, setPinStep] = useState<"enter" | "confirm">("enter");
  const [pinError, setPinError] = useState("");

  const colors = personaTheme;
  const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

  const handleLanguageSelect = async (lang: string) => {
    if (lang !== language) {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      await setLanguage(lang);
    }
  };

  const handleThemeToggle = (value: boolean) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsDarkMode(value);
  };

  const handleBiometricsToggle = async (value: boolean) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (value) {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        if (!hasHardware) {
          Alert.alert(
            language === "ar" ? "غير مدعوم" : "Not Supported",
            language === "ar"
              ? "جهازك لا يدعم المصادقة البيومترية"
              : "Your device does not support biometric authentication",
            [{ text: language === "ar" ? "حسناً" : "OK" }]
          );
          return;
        }

        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (!isEnrolled) {
          Alert.alert(
            language === "ar" ? "غير مُعدّ" : "Not Configured",
            language === "ar"
              ? "لم يتم إعداد المصادقة البيومترية على جهازك"
              : "Biometric authentication is not set up on your device",
            [{ text: language === "ar" ? "حسناً" : "OK" }]
          );
          return;
        }

        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: language === "ar" ? "تأكيد هويتك" : "Confirm your identity",
          fallbackLabel: language === "ar" ? "استخدام الرمز" : "Use PIN",
        });

        if (result.success) {
          await setIsBiometricEnabled(true);
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }
      } catch (error) {
        console.error("Biometric auth error:", error);
        Alert.alert(
          language === "ar" ? "خطأ" : "Error",
          language === "ar"
            ? "حدث خطأ أثناء المصادقة البيومترية"
            : "An error occurred during biometric authentication",
          [{ text: language === "ar" ? "حسناً" : "OK" }]
        );
      }
    } else {
      await setIsBiometricEnabled(false);
    }
  };

  const handlePinToggle = async (value: boolean) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (value) {
      setPinInput("");
      setConfirmPinInput("");
      setPinStep("enter");
      setPinError("");
      setShowPinModal(true);
    } else {
      await setIsPinEnabled(false);
    }
  };

  const handlePinSubmit = async () => {
    if (pinStep === "enter") {
      if (pinInput.length !== 4) {
        setPinError(language === "ar" ? "الرمز يجب أن يكون 4 أرقام" : "PIN must be 4 digits");
        return;
      }
      setPinStep("confirm");
      setPinError("");
    } else {
      if (confirmPinInput !== pinInput) {
        setPinError(language === "ar" ? "الرمز غير متطابق" : "PINs do not match");
        setConfirmPinInput("");
        return;
      }

      await setStoredPin(pinInput);
      await setIsPinEnabled(true);
      setShowPinModal(false);
      setPinInput("");
      setConfirmPinInput("");

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  };

  const handlePinModalClose = () => {
    setShowPinModal(false);
    setPinInput("");
    setConfirmPinInput("");
    setPinStep("enter");
    setPinError("");
  };

  const handleChangePIN = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setPinInput("");
    setConfirmPinInput("");
    setPinStep("enter");
    setPinError("");
    setShowPinModal(true);
  };

  const handlePanicButton = () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    Alert.alert(
      language === "ar" ? "تحذير!" : "Warning!",
      language === "ar"
        ? "هل أنت متأكد أنك تريد حذف جميع البيانات؟ لا يمكن التراجع عن هذا الإجراء."
        : "Are you sure you want to delete all data? This action cannot be undone.",
      [
        {
          text: language === "ar" ? "إلغاء" : "Cancel",
          style: "cancel",
        },
        {
          text: language === "ar" ? "حذف الكل" : "Delete All",
          style: "destructive",
          onPress: () => {
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{
          paddingTop: Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
      >
        <Animated.View entering={FadeInDown.delay(100)} style={styles.section}>
          <View style={[styles.sectionHeader, isRTL && styles.sectionHeaderRTL]}>
            <Globe size={20} color={colors.primary} />
            <ThemedText
              style={[
                styles.sectionTitle,
                { color: colors.textPrimary },
                isRTL && styles.sectionTitleRTL,
              ]}
            >
              {t("settings.language")}
            </ThemedText>
          </View>
          <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
            {LANGUAGES.map((lang, index) => (
              <AnimatedPressable
                key={lang}
                onPress={() => handleLanguageSelect(lang)}
                entering={FadeInDown.delay(150 + index * 50)}
                style={[
                  styles.languageItem,
                  isRTL && styles.languageItemRTL,
                  index < LANGUAGES.length - 1 && [
                    styles.languageItemBorder,
                    { borderBottomColor: colors.background },
                  ],
                ]}
              >
                <ThemedText
                  style={[
                    styles.languageName,
                    { color: colors.textPrimary },
                    language === lang && { color: colors.primary, fontWeight: "600" },
                  ]}
                >
                  {languageNames[lang]}
                </ThemedText>
                {language === lang ? <Check size={20} color={colors.primary} /> : null}
              </AnimatedPressable>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
          <View style={[styles.sectionHeader, isRTL && styles.sectionHeaderRTL]}>
            {isDarkMode ? (
              <Moon size={20} color={colors.primary} />
            ) : (
              <Sun size={20} color={colors.primary} />
            )}
            <ThemedText
              style={[
                styles.sectionTitle,
                { color: colors.textPrimary },
                isRTL && styles.sectionTitleRTL,
              ]}
            >
              {t("settings.appearance")}
            </ThemedText>
          </View>
          <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.themeToggle, isRTL && styles.themeToggleRTL]}>
              <ThemedText style={[styles.themeLabel, { color: colors.textPrimary }]}>
                {isDarkMode ? t("settings.darkMode") : t("settings.lightMode")}
              </ThemedText>
              <Switch
                value={isDarkMode}
                onValueChange={handleThemeToggle}
                trackColor={{ false: colors.background, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
          <View style={[styles.sectionHeader, isRTL && styles.sectionHeaderRTL]}>
            <Shield size={20} color={colors.primary} />
            <ThemedText
              style={[
                styles.sectionTitle,
                { color: colors.textPrimary },
                isRTL && styles.sectionTitleRTL,
              ]}
            >
              {language === "ar" ? "الأمان" : "Security"}
            </ThemedText>
          </View>
          <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
            <View
              style={[
                styles.securityItem,
                isRTL && styles.securityItemRTL,
                styles.securityItemBorder,
                { borderBottomColor: colors.background },
              ]}
            >
              <View style={[styles.securityItemLeft, isRTL && styles.securityItemLeftRTL]}>
                <View style={[styles.securityIconContainer, { backgroundColor: colors.background }]}>
                  <Lock size={18} color={colors.primary} />
                </View>
                <ThemedText style={[styles.securityLabel, { color: colors.textPrimary }]}>
                  {language === "ar" ? "تفعيل رمز PIN" : "Enable PIN Code"}
                </ThemedText>
              </View>
              <Switch
                value={isPinEnabled}
                onValueChange={handlePinToggle}
                trackColor={{ false: colors.background, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            {isPinEnabled ? (
              <Pressable
                onPress={handleChangePIN}
                style={[
                  styles.securityItem,
                  isRTL && styles.securityItemRTL,
                  styles.securityItemBorder,
                  { borderBottomColor: colors.background },
                ]}
              >
                <View style={[styles.securityItemLeft, isRTL && styles.securityItemLeftRTL]}>
                  <View style={[styles.securityIconContainer, { backgroundColor: colors.background }]}>
                    <Lock size={18} color={colors.primary} />
                  </View>
                  <ThemedText style={[styles.securityLabel, { color: colors.textPrimary }]}>
                    {language === "ar" ? "تغيير رمز PIN" : "Change PIN Code"}
                  </ThemedText>
                </View>
                <ChevronIcon size={20} color={colors.textSecondary} />
              </Pressable>
            ) : null}

            <View
              style={[
                styles.securityItem,
                isRTL && styles.securityItemRTL,
                styles.securityItemBorder,
                { borderBottomColor: colors.background },
              ]}
            >
              <View style={[styles.securityItemLeft, isRTL && styles.securityItemLeftRTL]}>
                <View style={[styles.securityIconContainer, { backgroundColor: colors.background }]}>
                  <Fingerprint size={18} color={colors.primary} />
                </View>
                <ThemedText style={[styles.securityLabel, { color: colors.textPrimary }]}>
                  {language === "ar" ? "تفعيل البصمة" : "Enable Biometrics"}
                </ThemedText>
              </View>
              <Switch
                value={isBiometricEnabled}
                onValueChange={handleBiometricsToggle}
                trackColor={{ false: colors.background, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.panicSection}>
              <ThemedText
                style={[
                  styles.panicWarning,
                  { color: colors.textSecondary },
                  isRTL && styles.textRTL,
                ]}
              >
                {language === "ar"
                  ? "سيؤدي هذا إلى حذف جميع الرسائل وجهات الاتصال والإعدادات نهائياً"
                  : "This will permanently delete all messages, contacts, and settings"}
              </ThemedText>
              <Pressable
                onPress={handlePanicButton}
                style={[styles.panicButton, { backgroundColor: "#FF3B30" }]}
              >
                <AlertTriangle size={20} color="#FFFFFF" />
                <ThemedText style={styles.panicButtonText}>
                  {language === "ar" ? "حذف جميع البيانات" : "Delete All Data"}
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      <Modal
        visible={showPinModal}
        transparent
        animationType="fade"
        onRequestClose={handlePinModalClose}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            entering={FadeIn}
            style={[styles.modalContent, { backgroundColor: colors.surface }]}
          >
            <View style={[styles.modalHeader, isRTL && styles.modalHeaderRTL]}>
              <ThemedText style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {pinStep === "enter"
                  ? language === "ar"
                    ? "إدخال رمز PIN"
                    : "Enter PIN Code"
                  : language === "ar"
                  ? "تأكيد رمز PIN"
                  : "Confirm PIN Code"}
              </ThemedText>
              <Pressable onPress={handlePinModalClose} hitSlop={12}>
                <X size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ThemedText style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              {pinStep === "enter"
                ? language === "ar"
                  ? "أدخل رمز مكون من 4 أرقام"
                  : "Enter a 4-digit PIN code"
                : language === "ar"
                ? "أعد إدخال الرمز للتأكيد"
                : "Re-enter your PIN to confirm"}
            </ThemedText>

            <TextInput
              style={[
                styles.pinInput,
                {
                  backgroundColor: colors.background,
                  color: colors.textPrimary,
                  borderColor: pinError ? "#FF3B30" : colors.primary,
                },
              ]}
              value={pinStep === "enter" ? pinInput : confirmPinInput}
              onChangeText={(text) => {
                const numericText = text.replace(/[^0-9]/g, "").slice(0, 4);
                if (pinStep === "enter") {
                  setPinInput(numericText);
                } else {
                  setConfirmPinInput(numericText);
                }
                setPinError("");
              }}
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
              placeholder="••••"
              placeholderTextColor={colors.textSecondary}
              textAlign="center"
              autoFocus
            />

            {pinError ? (
              <ThemedText style={styles.pinError}>{pinError}</ThemedText>
            ) : null}

            <Pressable
              onPress={handlePinSubmit}
              style={[styles.pinSubmitButton, { backgroundColor: colors.primary }]}
            >
              <ThemedText style={styles.pinSubmitText}>
                {pinStep === "enter"
                  ? language === "ar"
                    ? "التالي"
                    : "Next"
                  : language === "ar"
                  ? "تأكيد"
                  : "Confirm"}
              </ThemedText>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  sectionHeaderRTL: {
    flexDirection: "row-reverse",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  sectionTitleRTL: {
    textAlign: "right",
  },
  sectionContent: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  languageItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  languageItemRTL: {
    flexDirection: "row-reverse",
  },
  languageItemBorder: {
    borderBottomWidth: 1,
  },
  languageName: {
    fontSize: 16,
  },
  themeToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  themeToggleRTL: {
    flexDirection: "row-reverse",
  },
  themeLabel: {
    fontSize: 16,
  },
  securityItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  securityItemRTL: {
    flexDirection: "row-reverse",
  },
  securityItemBorder: {
    borderBottomWidth: 1,
  },
  securityItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  securityItemLeftRTL: {
    flexDirection: "row-reverse",
  },
  securityIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  securityLabel: {
    fontSize: 16,
  },
  panicSection: {
    padding: Spacing.lg,
    alignItems: "center",
  },
  panicWarning: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: Spacing.lg,
    lineHeight: 18,
  },
  textRTL: {
    textAlign: "right",
  },
  panicButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing["3xl"],
    borderRadius: BorderRadius.lg,
    width: "100%",
  },
  panicButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  modalContent: {
    width: "100%",
    maxWidth: 360,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  modalHeaderRTL: {
    flexDirection: "row-reverse",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  pinInput: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: 12,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    marginBottom: Spacing.lg,
  },
  pinError: {
    color: "#FF3B30",
    fontSize: 14,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  pinSubmitButton: {
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
  pinSubmitText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
