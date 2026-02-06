import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  Platform,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { Plus, MessageCircle, Users, Heart, Briefcase, Building, Ghost, Bot, X } from "lucide-react-native";
import { doc, getDoc, collection, query, where, onSnapshot, orderBy, Timestamp } from "firebase/firestore";

import { db } from "@/config/firebase";
import { ThemedText } from "@/components/ThemedText";
import { useApp } from "@/context/AppContext";
import { PersonaColorsDark, PersonaColorsLight, Spacing, BorderRadius, PersonaType } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type ChatListRouteProp = RouteProp<RootStackParamList, "ChatList">;

interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  avatarType?: "user" | "heart" | "briefcase" | "building" | "ghost" | "bot";
}

function formatTimestamp(timestamp: Timestamp | null): string {
  if (!timestamp) return "";
  
  const date = timestamp.toDate();
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: "long" });
  } else {
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  }
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function PersonaAvatar({
  persona,
  avatarType,
  size = 52,
  colors,
}: {
  persona: PersonaType;
  avatarType?: Chat["avatarType"];
  size?: number;
  colors: typeof PersonaColorsDark.family;
}) {
  
  const getIcon = () => {
    const iconSize = size * 0.5;
    
    if (persona === "family") {
      if (avatarType === "heart") {
        return <Heart size={iconSize} color={colors.primary} fill={colors.primary} />;
      }
      return <Users size={iconSize} color={colors.primary} />;
    }
    
    if (persona === "work") {
      if (avatarType === "building") {
        return <Building size={iconSize} color={colors.primary} />;
      }
      return <Briefcase size={iconSize} color={colors.primary} />;
    }
    
    if (persona === "ghost") {
      if (avatarType === "bot") {
        return <Bot size={iconSize} color={colors.primary} />;
      }
      return <Ghost size={iconSize} color={colors.primary} />;
    }
    
    return <Users size={iconSize} color={colors.primary} />;
  };

  return (
    <View
      style={[
        styles.avatarContainer,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.surface,
          borderWidth: 2,
          borderColor: `${colors.primary}40`,
        },
      ]}
    >
      {getIcon()}
    </View>
  );
}

function ChatItem({
  chat,
  persona,
  index,
  onPress,
  isRTL,
  colors,
}: {
  chat: Chat;
  persona: PersonaType;
  index: number;
  onPress: () => void;
  isRTL: boolean;
  colors: typeof PersonaColorsDark.family;
}) {

  return (
    <AnimatedPressable
      onPress={onPress}
      entering={FadeInDown.delay(index * 50)}
      style={({ pressed }) => [
        styles.chatItem,
        isRTL && styles.chatItemRTL,
        {
          backgroundColor: pressed ? colors.surface : "transparent",
        },
      ]}
    >
      <View style={isRTL ? styles.avatarRTL : undefined}>
        <PersonaAvatar persona={persona} avatarType={chat.avatarType} colors={colors} />
      </View>
      <View style={styles.chatContent}>
        <View style={[styles.chatHeader, isRTL && styles.chatHeaderRTL]}>
          <ThemedText
            style={[
              styles.chatName,
              { color: colors.textPrimary },
              chat.unread > 0 && styles.unreadName,
              isRTL && styles.textRTL,
            ]}
          >
            {chat.name}
          </ThemedText>
          <ThemedText style={[styles.timestamp, { color: colors.textSecondary }]}>
            {chat.timestamp}
          </ThemedText>
        </View>
        <View style={[styles.chatFooter, isRTL && styles.chatFooterRTL]}>
          <ThemedText
            style={[
              styles.lastMessage,
              { color: colors.textSecondary },
              chat.unread > 0 && { color: colors.textPrimary },
              isRTL && styles.textRTL,
            ]}
            numberOfLines={1}
          >
            {chat.lastMessage}
          </ThemedText>
          {chat.unread > 0 ? (
            <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
              <ThemedText style={styles.unreadText}>{chat.unread}</ThemedText>
            </View>
          ) : null}
        </View>
      </View>
    </AnimatedPressable>
  );
}

function EmptyState({ persona, colors }: { persona: PersonaType; colors: typeof PersonaColorsDark.family }) {
  const { t } = useTranslation();

  return (
    <Animated.View style={styles.emptyState} entering={FadeIn.delay(200)}>
      <View style={[styles.emptyIconContainer, { backgroundColor: colors.surface }]}>
        <MessageCircle size={48} color={colors.primary} />
      </View>
      <ThemedText style={[styles.emptyTitle, { color: colors.textPrimary }]} type="h4">
        {t("chat.noMessages")}
      </ThemedText>
      <ThemedText style={[styles.emptyDescription, { color: colors.textSecondary }]}>
        {t("chat.startConversation")}
      </ThemedText>
    </Animated.View>
  );
}

function NewConnectionModal({
  visible,
  onClose,
  onAdd,
  colors,
  isRTL,
  language,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (id: string) => void;
  colors: typeof PersonaColorsDark.family;
  isRTL: boolean;
  language: string;
}) {
  const [inputValue, setInputValue] = useState("");

  const handleAdd = () => {
    onAdd(inputValue);
    setInputValue("");
  };

  const handleCancel = () => {
    setInputValue("");
    onClose();
  };

  const rtlTextStyle = isRTL ? { textAlign: "right" as const, writingDirection: "rtl" as const } : {};

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <Pressable style={styles.modalOverlay} onPress={handleCancel}>
        <Pressable style={[styles.modalContent, { backgroundColor: colors.surface }]} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.modalHeader, isRTL && styles.modalHeaderRTL]}>
            <ThemedText style={[styles.modalTitle, { color: colors.textPrimary }, rtlTextStyle]}>
              {language === "ar" ? "اتصال جديد" : "New Connection"}
            </ThemedText>
            <Pressable onPress={handleCancel} hitSlop={12}>
              <X size={20} color={colors.textSecondary} />
            </Pressable>
          </View>
          
          <TextInput
            style={[
              styles.modalInput,
              {
                backgroundColor: colors.background,
                color: colors.textPrimary,
                textAlign: isRTL ? "right" : "left",
                writingDirection: isRTL ? "rtl" : "ltr",
              },
            ]}
            placeholder={language === "ar" ? "أدخل المعرف أو الرقم" : "Enter ID or Number"}
            placeholderTextColor={colors.textSecondary}
            value={inputValue}
            onChangeText={setInputValue}
            autoFocus
          />
          
          <View style={[styles.modalButtons, isRTL && styles.modalButtonsRTL]}>
            <Pressable
              onPress={handleCancel}
              style={[styles.modalButton, { backgroundColor: colors.background }]}
            >
              <ThemedText style={[styles.modalButtonText, { color: colors.textPrimary }, rtlTextStyle]}>
                {language === "ar" ? "إلغاء" : "Cancel"}
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={handleAdd}
              style={[styles.modalButton, { backgroundColor: colors.primary }]}
            >
              <ThemedText style={[styles.modalButtonText, { color: "#000" }, rtlTextStyle]}>
                {language === "ar" ? "إضافة" : "Add"}
              </ThemedText>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function ChatListScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<ChatListRouteProp>();
  const { t } = useTranslation();
  const { isRTL, language, spectraID, isDarkMode } = useApp();
  
  const [showNewConnectionModal, setShowNewConnectionModal] = useState(false);
  const [activeChats, setActiveChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const persona = route.params?.persona || "family";
  const colors = isDarkMode ? PersonaColorsDark[persona] : PersonaColorsLight[persona];

  useEffect(() => {
    if (!spectraID) {
      setIsLoading(false);
      return;
    }

    const normalizedSpectraID = spectraID.toUpperCase();
    const chatsRef = collection(db, "chats");
    const q = query(
      chatsRef,
      where("participants", "array-contains", normalizedSpectraID)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedChats: Chat[] = snapshot.docs.map((docSnapshot) => {
        const data = docSnapshot.data();
        const updatedAt = data.updatedAt as Timestamp | null;
        const participants = (data.participants || []) as string[];
        const otherParticipantIndex = participants.findIndex(p => p !== normalizedSpectraID);
        const otherParticipant = otherParticipantIndex >= 0 ? participants[otherParticipantIndex] : docSnapshot.id;
        
        const displayNameField = otherParticipantIndex === 0 ? "displayName_user1" : "displayName_user2";
        const displayName = data[displayNameField] || data.chatName || otherParticipant;
        
        return {
          id: docSnapshot.id,
          name: displayName,
          lastMessage: data.lastMessage || "",
          timestamp: formatTimestamp(updatedAt),
          unread: 0,
          avatarType: persona === "family" ? "heart" : persona === "work" ? "briefcase" : "ghost",
        };
      });

      fetchedChats.sort((a, b) => {
        if (!a.timestamp) return 1;
        if (!b.timestamp) return -1;
        return 0;
      });

      setActiveChats(fetchedChats);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching chats:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [spectraID, persona]);

  const chats = activeChats;

  const handleChatPress = (chat: Chat) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate("ChatRoom", { persona, chatId: chat.id, chatName: chat.name });
  };

  const handleNewChat = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setShowNewConnectionModal(true);
  };

  const handleAddConnection = async (id: string) => {
    if (!id.trim()) {
      Alert.alert(
        language === "ar" ? "خطأ" : "Error",
        language === "ar" ? "يرجى إدخال معرف المستخدم" : "Please enter a user ID",
        [{ text: language === "ar" ? "حسناً" : "OK" }]
      );
      return;
    }

    setShowNewConnectionModal(false);
    
    try {
      const normalizedId = id.trim().toUpperCase().startsWith("@") 
        ? id.trim().toUpperCase() 
        : `@${id.trim().toUpperCase()}`;
      
      const userDocRef = doc(db, "users", normalizedId);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        Alert.alert(
          language === "ar" ? "غير موجود" : "User not found",
          language === "ar" ? "لم يتم العثور على المستخدم بهذا المعرف" : "No user found with this ID",
          [{ text: language === "ar" ? "حسناً" : "OK" }]
        );
        return;
      }
      
      const userData = userDoc.data();
      
      if (!spectraID) {
        Alert.alert(
          language === "ar" ? "خطأ" : "Error",
          language === "ar" ? "لم يتم تحميل معرفك بعد" : "Your ID is not loaded yet",
          [{ text: language === "ar" ? "حسناً" : "OK" }]
        );
        return;
      }

      const participants = [spectraID.toUpperCase(), normalizedId].sort();
      const sharedChatId = participants.join("_");
      
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      navigation.navigate("ChatRoom", {
        persona,
        chatId: sharedChatId,
        chatName: normalizedId,
      });
      
    } catch (error) {
      console.error("Error finding user:", error);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert(
        language === "ar" ? "خطأ" : "Error",
        language === "ar" ? "حدث خطأ أثناء البحث عن المستخدم" : "An error occurred while searching for the user",
        [{ text: language === "ar" ? "حسناً" : "OK" }]
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <ChatItem
            chat={item}
            persona={persona}
            index={index}
            onPress={() => handleChatPress(item)}
            isRTL={isRTL}
            colors={colors}
          />
        )}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop: Spacing.md,
            paddingBottom: insets.bottom + 80,
          },
          chats.length === 0 && styles.emptyListContent,
        ]}
        ListEmptyComponent={<EmptyState persona={persona} colors={colors} />}
        showsVerticalScrollIndicator={false}
      />

      <Pressable
        onPress={handleNewChat}
        style={[
          styles.fab,
          {
            backgroundColor: colors.primary,
            bottom: insets.bottom + Spacing.xl,
            right: isRTL ? undefined : Spacing.xl,
            left: isRTL ? Spacing.xl : undefined,
          },
        ]}
      >
        <Plus size={28} color="#000" />
      </Pressable>

      <NewConnectionModal
        visible={showNewConnectionModal}
        onClose={() => setShowNewConnectionModal(false)}
        onAdd={handleAddConnection}
        colors={colors}
        isRTL={isRTL}
        language={language}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: "center",
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  chatItemRTL: {
    flexDirection: "row-reverse",
  },
  avatarContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  avatarRTL: {
    marginRight: 0,
    marginLeft: Spacing.md,
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  chatHeaderRTL: {
    flexDirection: "row-reverse",
  },
  chatName: {
    fontSize: 16,
    fontWeight: "500",
  },
  unreadName: {
    fontWeight: "700",
  },
  textRTL: {
    textAlign: "right",
  },
  timestamp: {
    fontSize: 12,
  },
  chatFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chatFooterRTL: {
    flexDirection: "row-reverse",
  },
  lastMessage: {
    fontSize: 14,
    flex: 1,
    marginRight: Spacing.sm,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  unreadText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    padding: Spacing["3xl"],
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    marginBottom: Spacing.sm,
  },
  emptyDescription: {
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  modalContent: {
    width: "100%",
    maxWidth: 340,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xl,
  },
  modalHeaderRTL: {
    flexDirection: "row-reverse",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  modalInput: {
    height: 48,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    marginBottom: Spacing.xl,
  },
  modalButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  modalButtonsRTL: {
    flexDirection: "row-reverse",
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
