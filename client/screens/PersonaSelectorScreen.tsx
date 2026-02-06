import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Pressable,
  Image,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
  FadeInUp,
} from "react-native-reanimated";
import { Settings, Users, Briefcase, Ghost, Shield, Copy } from "lucide-react-native";

import { ThemedText } from "@/components/ThemedText";
import { Toast } from "@/components/Toast";
import { useApp } from "@/context/AppContext";
import { PersonaColorsDark, PersonaColorsLight, Spacing, BorderRadius, PersonaType } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { getSpectraIds, SpectraIds } from "@/utils/spectraId";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = width * 0.75;
const CARD_HEIGHT = height * 0.52;
const CARD_SPACING = (width - CARD_WIDTH) / 2;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PersonaData {
  id: PersonaType;
  icon: typeof Users;
}

const personaList: PersonaData[] = [
  { id: "family", icon: Users },
  { id: "work", icon: Briefcase },
  { id: "ghost", icon: Ghost },
];

function PersonaCard({
  persona,
  index,
  currentIndex,
  onPress,
  isRTL,
  spectraId,
  onCopyId,
  language,
  colors,
}: {
  persona: PersonaData;
  index: number;
  currentIndex: number;
  onPress: () => void;
  isRTL: boolean;
  spectraId: string;
  onCopyId: (id: string) => void;
  language: string;
  colors: typeof PersonaColorsDark.family;
}) {
  const { t } = useTranslation();
  const scale = useSharedValue(1);
  const isActive = index === currentIndex;

  const Icon = persona.icon;

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleCopyPress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onCopyId(spectraId);
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: isActive ? colors.primary : "transparent",
          shadowColor: colors.primary,
        },
        animatedStyle,
      ]}
    >
      <View
        style={[
          styles.cardGlow,
          {
            backgroundColor: colors.primary,
            opacity: isActive ? 0.15 : 0.05,
          },
        ]}
      />
      <View style={styles.cardContent}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: colors.background },
          ]}
        >
          <Icon size={42} color={colors.primary} />
        </View>
        <ThemedText
          style={[
            styles.cardTitle,
            { color: colors.textPrimary },
            isRTL && styles.textRTL,
          ]}
          type="h2"
        >
          {t(`personas.${persona.id}`)}
        </ThemedText>
        
        <Pressable
          onPress={handleCopyPress}
          style={[styles.spectraIdContainer, isRTL && styles.spectraIdContainerRTL]}
          hitSlop={8}
        >
          <ThemedText style={[styles.spectraIdText, { color: colors.primary }]}>
            {spectraId}
          </ThemedText>
          <Copy size={12} color={colors.primary} style={{ opacity: 0.8 }} />
        </Pressable>
        
        <ThemedText
          style={[
            styles.cardDescription,
            { color: colors.textSecondary },
            isRTL && styles.textRTL,
          ]}
        >
          {t(`personas.${persona.id}Desc`)}
        </ThemedText>
        <View style={[styles.securityBadge, { backgroundColor: `${colors.primary}20` }]}>
          <Shield size={12} color={colors.primary} />
          <ThemedText style={[styles.securityBadgeText, { color: colors.primary }]}>
            {language === "ar" ? "تشفير طرفي" : "End-to-End Encrypted"}
          </ThemedText>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <View
          style={[
            styles.tapIndicator,
            { backgroundColor: colors.primary },
          ]}
        >
          <ThemedText style={styles.tapIndicatorText}>
            {t("chat.messages")}
          </ThemedText>
        </View>
      </View>
    </AnimatedPressable>
  );
}

export default function PersonaSelectorScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useTranslation();
  const { setCurrentPersona, isRTL, language, setSpectraID, isDarkMode } = useApp();
  
  const getPersonaColors = (personaId: PersonaType) => 
    isDarkMode ? PersonaColorsDark[personaId] : PersonaColorsLight[personaId];
  const neutralColors = isDarkMode ? PersonaColorsDark.neutral : PersonaColorsLight.neutral;
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [spectraIds, setSpectraIds] = useState<SpectraIds | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    getSpectraIds().then(setSpectraIds);
  }, []);

  const handleCopyId = useCallback(async (id: string) => {
    try {
      await Clipboard.setStringAsync(id);
      setToastMessage(language === "ar" ? "تم نسخ المعرف" : "ID Copied");
      setShowToast(true);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  }, [language]);

  const handlePersonaSelect = async (persona: PersonaType) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setCurrentPersona(persona);
    
    if (spectraIds && persona !== "neutral") {
      const selectedId = spectraIds[persona as keyof SpectraIds];
      if (selectedId) {
        try {
          await AsyncStorage.setItem("@spectra_id", selectedId);
          setSpectraID(selectedId);
        } catch (error) {
          console.error("Error saving spectraID:", error);
        }
      }
    }
    
    navigation.navigate("ChatList", { persona });
  };

  const handleSettingsPress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate("Settings");
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / CARD_WIDTH);
    if (index !== currentIndex && index >= 0 && index < personaList.length) {
      setCurrentIndex(index);
      if (Platform.OS !== "web") {
        Haptics.selectionAsync();
      }
    }
  };

  const handleDotPress = (index: number) => {
    scrollViewRef.current?.scrollTo({
      x: index * CARD_WIDTH,
      animated: true,
    });
    setCurrentIndex(index);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: neutralColors.background,
          paddingTop: insets.top,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.header,
          isRTL && styles.headerRTL,
        ]}
        entering={FadeIn.delay(100)}
      >
        <View style={[styles.headerLeft, isRTL && styles.headerLeftRTL]}>
          <Image
            source={require("../../assets/images/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <ThemedText style={[styles.appName, { color: neutralColors.textPrimary }]} type="h4">
            {t("appName")}
          </ThemedText>
        </View>
        <Pressable
          onPress={handleSettingsPress}
          style={styles.settingsButton}
          hitSlop={12}
        >
          <Settings size={24} color={neutralColors.textPrimary} />
        </Pressable>
      </Animated.View>

      <Animated.View
        entering={FadeInUp.delay(200)}
        style={[styles.titleSection, isRTL && styles.titleSectionRTL]}
      >
        <ThemedText
          style={[
            styles.title,
            { color: neutralColors.textSecondary },
            isRTL && styles.titleRTL,
          ]}
        >
          {t("selectIdentity")}
        </ThemedText>
      </Animated.View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          isRTL && styles.scrollContentRTL,
        ]}
        snapToInterval={CARD_WIDTH}
        decelerationRate="fast"
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {personaList.map((persona, index) => (
          <View key={persona.id} style={styles.cardContainer}>
            <PersonaCard
              persona={persona}
              index={index}
              currentIndex={currentIndex}
              onPress={() => handlePersonaSelect(persona.id)}
              isRTL={isRTL}
              spectraId={spectraIds && persona.id !== "neutral" ? spectraIds[persona.id as keyof SpectraIds] : "..."}
              onCopyId={handleCopyId}
              language={language}
              colors={getPersonaColors(persona.id)}
            />
          </View>
        ))}
      </ScrollView>

      <View
        style={[
          styles.pagination,
          { paddingBottom: insets.bottom + Spacing.xl },
          isRTL && styles.paginationRTL,
        ]}
      >
        {personaList.map((persona, index) => (
          <Pressable
            key={persona.id}
            onPress={() => handleDotPress(index)}
            style={[
              styles.paginationDot,
              {
                backgroundColor:
                  index === currentIndex
                    ? getPersonaColors(persona.id).primary
                    : neutralColors.surface,
                width: index === currentIndex ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>

      <Toast
        visible={showToast}
        message={toastMessage}
        isRTL={isRTL}
        onHide={() => setShowToast(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  headerRTL: {
    flexDirection: "row-reverse",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerLeftRTL: {
    flexDirection: "row-reverse",
  },
  logo: {
    width: 32,
    height: 32,
    marginRight: Spacing.sm,
  },
  appName: {
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  settingsButton: {
    padding: Spacing.sm,
  },
  titleSection: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  titleSectionRTL: {
    alignItems: "flex-end",
  },
  title: {
    fontSize: 14,
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  titleRTL: {
    textAlign: "right",
    writingDirection: "rtl",
  },
  textRTL: {
    textAlign: "right",
    writingDirection: "rtl",
  },
  scrollContent: {
    paddingHorizontal: CARD_SPACING,
    alignItems: "center",
  },
  scrollContentRTL: {
    flexDirection: "row-reverse",
  },
  cardContainer: {
    width: CARD_WIDTH,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: CARD_WIDTH - Spacing.xl,
    minHeight: CARD_HEIGHT,
    borderRadius: BorderRadius["2xl"],
    borderWidth: 2,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  cardGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl + Spacing.md,
  },
  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  spectraIdContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  spectraIdContainerRTL: {
    flexDirection: "row-reverse",
  },
  spectraIdText: {
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.5,
    opacity: 0.8,
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
  },
  cardDescription: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  securityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  securityBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  cardFooter: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  tapIndicator: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  tapIndicatorText: {
    color: "#000",
    fontWeight: "600",
    fontSize: 14,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
  },
  paginationRTL: {
    flexDirection: "row-reverse",
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
  },
});
