import React from "react";
import { View, Platform, StyleSheet } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { HeaderButton } from "@react-navigation/elements";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";
import { ArrowLeft, ArrowRight, X, Search, MoreVertical, Lock, Shield } from "lucide-react-native";

import AuthScreen from "@/screens/AuthScreen";
import PersonaSelectorScreen from "@/screens/PersonaSelectorScreen";
import ChatListScreen from "@/screens/ChatListScreen";
import ChatRoomScreen from "@/screens/ChatRoomScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import { ThemedText } from "@/components/ThemedText";
import { useApp } from "@/context/AppContext";
import { useChatMenu } from "@/context/ChatMenuContext";
import { PersonaColorsDark, PersonaColorsLight, PersonaType, Spacing } from "@/constants/theme";

export type RootStackParamList = {
  Auth: undefined;
  PersonaSelector: undefined;
  ChatList: { persona: PersonaType };
  ChatRoom: { persona: PersonaType; chatId: string; chatName: string };
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function ChatRoomHeaderTitle({
  chatName,
  colors,
  isRTL,
}: {
  chatName: string;
  colors: typeof PersonaColorsDark.family;
  isRTL: boolean;
}) {
  return (
    <View style={[styles.headerTitleContainer, isRTL && styles.headerTitleContainerRTL]}>
      <ThemedText style={[styles.headerTitle, { color: colors.textPrimary }]}>
        {chatName}
      </ThemedText>
      <View style={[styles.encryptedBadge, { backgroundColor: `${colors.primary}20` }]}>
        <Lock size={10} color={colors.primary} />
        <ThemedText style={[styles.encryptedText, { color: colors.primary }]}>
          P2P
        </ThemedText>
      </View>
    </View>
  );
}

function ChatListHeaderTitle({
  title,
  colors,
  isRTL,
}: {
  title: string;
  colors: typeof PersonaColorsDark.family;
  isRTL: boolean;
}) {
  return (
    <View style={[styles.headerTitleContainer, isRTL && styles.headerTitleContainerRTL]}>
      <Shield size={16} color={colors.primary} style={styles.shieldIcon} />
      <ThemedText style={[styles.headerTitle, { color: colors.textPrimary }]}>
        {title}
      </ThemedText>
    </View>
  );
}

function ChatRoomMenuButton({ colors }: { colors: typeof PersonaColorsDark.family }) {
  const { setShowMenu } = useChatMenu();

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setShowMenu(true);
  };

  return (
    <HeaderButton
      onPress={handlePress}
      pressColor="transparent"
      pressOpacity={0.7}
      accessibilityLabel="Chat menu"
    >
      <MoreVertical size={22} color={colors.textPrimary} />
    </HeaderButton>
  );
}

export default function RootStackNavigator() {
  const { t } = useTranslation();
  const { isAuthenticated, isRTL, language, isDarkMode } = useApp();

  const BackArrow = isRTL ? ArrowRight : ArrowLeft;
  const getPersonaColors = (persona: PersonaType) => 
    isDarkMode ? PersonaColorsDark[persona] : PersonaColorsLight[persona];

  return (
    <Stack.Navigator
      screenOptions={{
        gestureEnabled: true,
      }}
    >
      {!isAuthenticated ? (
        <Stack.Screen
          name="Auth"
          component={AuthScreen}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <Stack.Screen
            name="PersonaSelector"
            component={PersonaSelectorScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ChatList"
            component={ChatListScreen}
            options={({ route, navigation }) => {
              const persona = route.params?.persona || "family";
              const colors = getPersonaColors(persona);
              return {
                headerTitle: () => (
                  <ChatListHeaderTitle
                    title={t(`personas.${persona}`)}
                    colors={colors}
                    isRTL={isRTL}
                  />
                ),
                headerTintColor: colors.textPrimary,
                headerStyle: {
                  backgroundColor: colors.surface,
                },
                contentStyle: {
                  backgroundColor: colors.background,
                },
                headerLeft: () => (
                  <HeaderButton
                    onPress={() => navigation.goBack()}
                    pressColor="transparent"
                    pressOpacity={0.7}
                  >
                    <BackArrow size={24} color={colors.textPrimary} />
                  </HeaderButton>
                ),
                headerRight: () => (
                  <HeaderButton
                    onPress={() => {}}
                    pressColor="transparent"
                    pressOpacity={0.7}
                  >
                    <Search size={22} color={colors.textPrimary} />
                  </HeaderButton>
                ),
              };
            }}
          />
          <Stack.Screen
            name="ChatRoom"
            component={ChatRoomScreen}
            options={({ route, navigation }) => {
              const persona = route.params?.persona || "family";
              const colors = getPersonaColors(persona);
              return {
                headerTitle: () => (
                  <ChatRoomHeaderTitle
                    chatName={route.params?.chatName || t("chat.messages")}
                    colors={colors}
                    isRTL={isRTL}
                  />
                ),
                headerTintColor: colors.textPrimary,
                headerStyle: {
                  backgroundColor: colors.surface,
                },
                contentStyle: {
                  backgroundColor: colors.background,
                },
                headerLeft: () => (
                  <HeaderButton
                    onPress={() => navigation.goBack()}
                    pressColor="transparent"
                    pressOpacity={0.7}
                  >
                    <BackArrow size={24} color={colors.textPrimary} />
                  </HeaderButton>
                ),
                headerRight: () => <ChatRoomMenuButton colors={colors} />,
              };
            }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={({ navigation }) => {
              const colors = getPersonaColors("neutral");
              return {
                presentation: "modal",
                headerTitle: t("settings.title"),
                headerTintColor: colors.textPrimary,
                headerStyle: {
                  backgroundColor: colors.surface,
                },
                headerTitleStyle: {
                  color: colors.textPrimary,
                },
                contentStyle: {
                  backgroundColor: colors.background,
                },
                headerLeft: () => (
                  <HeaderButton
                    onPress={() => {
                      if (Platform.OS !== "web") {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      navigation.goBack();
                    }}
                    pressColor="transparent"
                    pressOpacity={0.7}
                    accessibilityLabel="Close settings"
                  >
                    <X size={24} color={colors.textPrimary} />
                  </HeaderButton>
                ),
              };
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  headerTitleContainerRTL: {
    flexDirection: "row-reverse",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  shieldIcon: {
    marginRight: 2,
  },
  encryptedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  encryptedText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
