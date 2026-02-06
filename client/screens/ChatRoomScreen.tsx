import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  Platform,
  Modal,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, RouteProp } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import * as Haptics from "expo-haptics";
import Animated, { FadeInUp, FadeIn, FadeInDown } from "react-native-reanimated";
import { Send, MessageCircle, Flame, Clock, X, Trash2, Ban, Edit3 } from "lucide-react-native";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/config/firebase";
import { ThemedText } from "@/components/ThemedText";
import { useApp } from "@/context/AppContext";
import { useChatMenu } from "@/context/ChatMenuContext";
import { PersonaColorsDark, PersonaColorsLight, Spacing, BorderRadius, PersonaType } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type ChatRoomRouteProp = RouteProp<RootStackParamList, "ChatRoom">;

type BurnTimer = "off" | "10s" | "1h" | "24h";

interface Message {
  id: string;
  text: string;
  isSent: boolean;
  timestamp: string;
  burnTimer?: BurnTimer;
  createdAt?: Timestamp;
  senderId?: string;
}

const BURN_TIMER_OPTIONS: { value: BurnTimer; label: string; labelAr: string }[] = [
  { value: "off", label: "Off", labelAr: "إيقاف" },
  { value: "10s", label: "10 Seconds", labelAr: "10 ثواني" },
  { value: "1h", label: "1 Hour", labelAr: "ساعة واحدة" },
  { value: "24h", label: "24 Hours", labelAr: "24 ساعة" },
];

function getBurnTimerMs(timer: BurnTimer): number {
  switch (timer) {
    case "10s":
      return 10 * 1000;
    case "1h":
      return 60 * 60 * 1000;
    case "24h":
      return 24 * 60 * 60 * 1000;
    default:
      return 0;
  }
}

function BurnTimerIndicator({ timer }: { timer: BurnTimer }) {
  if (timer === "off") return null;
  
  const timerLabels: Record<BurnTimer, string> = {
    off: "",
    "10s": "10s",
    "1h": "1h",
    "24h": "24h",
  };

  return (
    <View style={[styles.burnIndicator, { backgroundColor: "rgba(255,100,50,0.3)" }]}>
      <Flame size={10} color="#FF6432" />
      <ThemedText style={styles.burnIndicatorText}>{timerLabels[timer]}</ThemedText>
    </View>
  );
}

function MessageBubble({
  message,
  persona,
  index,
  isRTL,
  colors,
}: {
  message: Message;
  persona: PersonaType;
  index: number;
  isRTL: boolean;
  colors: typeof PersonaColorsDark.family;
}) {

  const getSentBubbleStyle = () => {
    if (isRTL) {
      return {
        alignSelf: "flex-start" as const,
        borderBottomLeftRadius: Spacing.xs,
        borderBottomRightRadius: BorderRadius.lg,
      };
    }
    return {
      alignSelf: "flex-end" as const,
      borderBottomRightRadius: Spacing.xs,
    };
  };

  const getReceivedBubbleStyle = () => {
    if (isRTL) {
      return {
        alignSelf: "flex-end" as const,
        borderBottomRightRadius: Spacing.xs,
        borderBottomLeftRadius: BorderRadius.lg,
      };
    }
    return {
      alignSelf: "flex-start" as const,
      borderBottomLeftRadius: Spacing.xs,
    };
  };

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 30)}
      style={[
        styles.messageBubble,
        message.isSent
          ? [{ backgroundColor: colors.primary }, getSentBubbleStyle()]
          : [{ backgroundColor: colors.surface }, getReceivedBubbleStyle()],
      ]}
    >
      <ThemedText
        style={[
          styles.messageText,
          { color: message.isSent ? "#000" : colors.textPrimary },
          isRTL && styles.textRTL,
        ]}
      >
        {message.text}
      </ThemedText>
      <View style={[styles.messageFooter, isRTL && styles.messageFooterRTL]}>
        {message.burnTimer && message.burnTimer !== "off" ? (
          <BurnTimerIndicator timer={message.burnTimer} />
        ) : null}
        <ThemedText
          style={[
            styles.messageTimestamp,
            { color: message.isSent ? "rgba(0,0,0,0.5)" : colors.textSecondary },
          ]}
        >
          {message.timestamp}
        </ThemedText>
      </View>
    </Animated.View>
  );
}

function EmptyState({ persona, colors }: { persona: PersonaType; colors: typeof PersonaColorsDark.family }) {
  const { t } = useTranslation();

  return (
    <Animated.View style={styles.emptyState} entering={FadeIn.delay(200)}>
      <View style={[styles.emptyIconContainer, { backgroundColor: colors.surface }]}>
        <MessageCircle size={40} color={colors.primary} />
      </View>
      <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
        {t("chat.startConversation")}
      </ThemedText>
    </Animated.View>
  );
}

function BurnTimerModal({
  visible,
  onClose,
  onSelect,
  currentTimer,
  colors,
  isRTL,
  language,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (timer: BurnTimer) => void;
  currentTimer: BurnTimer;
  colors: typeof PersonaColorsDark.family;
  isRTL: boolean;
  language: string;
}) {
  const rtlTextStyle = isRTL ? { textAlign: "right" as const, writingDirection: "rtl" as const } : {};

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Animated.View
          entering={FadeInDown.springify()}
          style={[styles.burnTimerSheet, { backgroundColor: colors.surface }]}
        >
          <View style={[styles.sheetHeader, isRTL && styles.sheetHeaderRTL]}>
            <View style={[styles.sheetTitleRow, isRTL && styles.sheetTitleRowRTL]}>
              <Flame size={20} color={colors.primary} />
              <ThemedText style={[styles.sheetTitle, { color: colors.textPrimary }, rtlTextStyle]}>
                {language === "ar" ? "مؤقت التدمير الذاتي" : "Self-Destruct Timer"}
              </ThemedText>
            </View>
            <Pressable onPress={onClose} hitSlop={12}>
              <X size={20} color={colors.textSecondary} />
            </Pressable>
          </View>
          {BURN_TIMER_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              style={[
                styles.timerOption,
                isRTL && styles.timerOptionRTL,
                currentTimer === option.value && { backgroundColor: colors.background },
              ]}
              onPress={() => {
                onSelect(option.value);
                onClose();
              }}
            >
              <View style={[styles.timerOptionContent, isRTL && styles.timerOptionContentRTL]}>
                {option.value !== "off" ? (
                  <Clock size={18} color={currentTimer === option.value ? colors.primary : colors.textSecondary} />
                ) : null}
                <ThemedText
                  style={[
                    styles.timerOptionText,
                    { color: currentTimer === option.value ? colors.primary : colors.textPrimary },
                    rtlTextStyle,
                  ]}
                >
                  {language === "ar" ? option.labelAr : option.label}
                </ThemedText>
              </View>
              {currentTimer === option.value ? (
                <View style={[styles.timerCheck, { backgroundColor: colors.primary }]} />
              ) : null}
            </Pressable>
          ))}
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

function NicknameEditModal({
  visible,
  onClose,
  onSave,
  currentNickname,
  colors,
  isRTL,
  language,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (nickname: string) => void;
  currentNickname: string;
  colors: typeof PersonaColorsDark.family;
  isRTL: boolean;
  language: string;
}) {
  const [nickname, setNickname] = useState(currentNickname);
  const rtlTextStyle = isRTL ? { textAlign: "right" as const, writingDirection: "rtl" as const } : {};

  useEffect(() => {
    if (visible) {
      setNickname(currentNickname);
    }
  }, [visible, currentNickname]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Animated.View
          entering={FadeInDown.springify()}
          style={[styles.nicknameSheet, { backgroundColor: colors.surface }]}
        >
          <View style={[styles.sheetHeader, isRTL && styles.sheetHeaderRTL]}>
            <ThemedText style={[styles.sheetTitle, { color: colors.textPrimary }, rtlTextStyle]}>
              {language === "ar" ? "تعديل الاسم المستعار" : "Edit Nickname"}
            </ThemedText>
            <Pressable onPress={onClose} hitSlop={12}>
              <X size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <TextInput
            style={[
              styles.nicknameInput,
              {
                backgroundColor: colors.background,
                color: colors.textPrimary,
                borderColor: colors.primary,
              },
              rtlTextStyle,
            ]}
            value={nickname}
            onChangeText={setNickname}
            placeholder={language === "ar" ? "أدخل الاسم المستعار" : "Enter nickname"}
            placeholderTextColor={colors.textSecondary}
            autoFocus
          />

          <View style={[styles.nicknameButtonRow, isRTL && styles.nicknameButtonRowRTL]}>
            <Pressable
              style={[styles.nicknameCancelButton, { backgroundColor: colors.background }]}
              onPress={onClose}
            >
              <ThemedText style={[styles.cancelButtonText, { color: colors.textPrimary }, rtlTextStyle]}>
                {language === "ar" ? "إلغاء" : "Cancel"}
              </ThemedText>
            </Pressable>
            <Pressable
              style={[styles.nicknameSaveButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                onSave(nickname.trim());
                onClose();
              }}
            >
              <ThemedText style={[styles.saveButtonText, { color: "#000" }, rtlTextStyle]}>
                {language === "ar" ? "حفظ" : "Save"}
              </ThemedText>
            </Pressable>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

function ChatMenuModal({
  visible,
  onClose,
  onClearHistory,
  onBlockUser,
  onEditNickname,
  colors,
  isRTL,
  language,
}: {
  visible: boolean;
  onClose: () => void;
  onClearHistory: () => void;
  onBlockUser: () => void;
  onEditNickname: () => void;
  colors: typeof PersonaColorsDark.family;
  isRTL: boolean;
  language: string;
}) {
  const rtlTextStyle = isRTL ? { textAlign: "right" as const, writingDirection: "rtl" as const } : {};

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Animated.View
          entering={FadeInDown.springify()}
          style={[styles.menuSheet, { backgroundColor: colors.surface }]}
        >
          <View style={[styles.sheetHeader, isRTL && styles.sheetHeaderRTL]}>
            <ThemedText style={[styles.sheetTitle, { color: colors.textPrimary }, rtlTextStyle]}>
              {language === "ar" ? "خيارات" : "Options"}
            </ThemedText>
            <Pressable onPress={onClose} hitSlop={12}>
              <X size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <Pressable
            style={[styles.menuOption, isRTL && styles.menuOptionRTL]}
            onPress={() => {
              onClose();
              onEditNickname();
            }}
          >
            <View style={[styles.menuOptionContent, isRTL && styles.menuOptionContentRTL]}>
              <View style={[styles.menuIconContainer, { backgroundColor: `${colors.primary}20` }]}>
                <Edit3 size={18} color={colors.primary} />
              </View>
              <ThemedText style={[styles.menuOptionText, { color: colors.textPrimary }, rtlTextStyle]}>
                {language === "ar" ? "تعديل الاسم المستعار" : "Edit Nickname"}
              </ThemedText>
            </View>
          </Pressable>

          <Pressable
            style={[styles.menuOption, isRTL && styles.menuOptionRTL]}
            onPress={() => {
              onClose();
              onClearHistory();
            }}
          >
            <View style={[styles.menuOptionContent, isRTL && styles.menuOptionContentRTL]}>
              <View style={[styles.menuIconContainer, { backgroundColor: "rgba(255,59,48,0.15)" }]}>
                <Trash2 size={18} color="#FF3B30" />
              </View>
              <ThemedText style={[styles.menuOptionText, { color: "#FF3B30" }, rtlTextStyle]}>
                {language === "ar" ? "مسح سجل المحادثة" : "Clear Chat History"}
              </ThemedText>
            </View>
          </Pressable>

          <Pressable
            style={[styles.menuOption, isRTL && styles.menuOptionRTL]}
            onPress={() => {
              onClose();
              onBlockUser();
            }}
          >
            <View style={[styles.menuOptionContent, isRTL && styles.menuOptionContentRTL]}>
              <View style={[styles.menuIconContainer, { backgroundColor: colors.background }]}>
                <Ban size={18} color={colors.textSecondary} />
              </View>
              <ThemedText style={[styles.menuOptionText, { color: colors.textPrimary }, rtlTextStyle]}>
                {language === "ar" ? "حظر المستخدم" : "Block User"}
              </ThemedText>
            </View>
          </Pressable>

          <Pressable
            style={[styles.cancelButton, { backgroundColor: colors.background }]}
            onPress={onClose}
          >
            <ThemedText style={[styles.cancelButtonText, { color: colors.textPrimary }, rtlTextStyle]}>
              {language === "ar" ? "إلغاء" : "Cancel"}
            </ThemedText>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

export default function ChatRoomScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<ChatRoomRouteProp>();
  const { t } = useTranslation();
  const { isRTL, language, spectraID, isDarkMode } = useApp();
  const { showMenu, setShowMenu, setOnClearHistory, setOnBlockUser } = useChatMenu();
  const flatListRef = useRef<FlatList>(null);

  const persona = route.params?.persona || "family";
  const chatId = route.params?.chatId || "default";
  const chatName = route.params?.chatName || "Chat";
  const colors = isDarkMode ? PersonaColorsDark[persona] : PersonaColorsLight[persona];

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [burnTimer, setBurnTimer] = useState<BurnTimer>("off");
  const [showBurnModal, setShowBurnModal] = useState(false);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [displayName, setDisplayName] = useState(chatName);

  useEffect(() => {
    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));
    const burnTimers: NodeJS.Timeout[] = [];

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages: Message[] = snapshot.docs.map((docSnapshot) => {
        const data = docSnapshot.data();
        const createdAt = data.createdAt as Timestamp | null;
        const msgSenderId = data.senderId || "";
        const isSent = spectraID ? msgSenderId.toUpperCase() === spectraID.toUpperCase() : data.isSent || false;
        const burnTimer = (data.burnTimer || "off") as BurnTimer;

        if (burnTimer !== "off" && createdAt) {
          const burnDurationMs = getBurnTimerMs(burnTimer);
          const messageCreatedTime = createdAt.toDate().getTime();
          const expiryTime = messageCreatedTime + burnDurationMs;
          const now = Date.now();
          const timeRemaining = expiryTime - now;

          if (timeRemaining <= 0) {
            deleteDoc(doc(db, "chats", chatId, "messages", docSnapshot.id)).catch(console.error);
          } else {
            const timer = setTimeout(() => {
              deleteDoc(doc(db, "chats", chatId, "messages", docSnapshot.id)).catch(console.error);
            }, timeRemaining);
            burnTimers.push(timer);
          }
        }

        return {
          id: docSnapshot.id,
          text: data.text || "",
          isSent: isSent,
          timestamp: createdAt
            ? createdAt.toDate().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "",
          burnTimer: burnTimer,
          createdAt: createdAt || undefined,
          senderId: msgSenderId,
        };
      });
      setMessages(fetchedMessages.reverse());
    });

    return () => {
      unsubscribe();
      burnTimers.forEach(timer => clearTimeout(timer));
    };
  }, [chatId]);

  const handleClearHistory = useCallback(async () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    try {
      const messagesRef = collection(db, "chats", chatId, "messages");
      const snapshot = await getDocs(messagesRef);
      const deletePromises = snapshot.docs.map((docSnapshot) =>
        deleteDoc(doc(db, "chats", chatId, "messages", docSnapshot.id))
      );
      await Promise.all(deletePromises);
      Alert.alert(
        language === "ar" ? "تم" : "Done",
        language === "ar" ? "تم مسح سجل المحادثة" : "Chat history cleared",
        [{ text: language === "ar" ? "حسناً" : "OK" }]
      );
    } catch (error) {
      console.error("Error clearing history:", error);
    }
  }, [language, chatId]);

  const handleBlockUser = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    Alert.alert(
      language === "ar" ? "تم" : "Done",
      language === "ar" ? "تم حظر المستخدم" : "User blocked",
      [{ text: language === "ar" ? "حسناً" : "OK" }]
    );
  }, [language]);

  const handleSaveNickname = useCallback(async (nickname: string) => {
    if (!nickname.trim()) return;
    
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    try {
      const chatDocRef = doc(db, "chats", chatId);
      const myId = spectraID?.toUpperCase() || "";
      const participants = chatId.split("_");
      const otherParticipant = participants.find(p => p !== myId) || "";
      
      const displayNameField = participants.indexOf(otherParticipant) === 0 
        ? "displayName_user1" 
        : "displayName_user2";

      await updateDoc(chatDocRef, {
        [displayNameField]: nickname.trim(),
        chatName: nickname.trim(),
      });

      setDisplayName(nickname.trim());

      Alert.alert(
        language === "ar" ? "تم" : "Done",
        language === "ar" ? "تم حفظ الاسم المستعار" : "Nickname saved",
        [{ text: language === "ar" ? "حسناً" : "OK" }]
      );
    } catch (error) {
      console.error("Error saving nickname:", error);
      Alert.alert(
        language === "ar" ? "خطأ" : "Error",
        language === "ar" ? "حدث خطأ أثناء حفظ الاسم" : "Failed to save nickname",
        [{ text: language === "ar" ? "حسناً" : "OK" }]
      );
    }
  }, [chatId, spectraID, language]);

  useEffect(() => {
    setOnClearHistory(handleClearHistory);
    setOnBlockUser(handleBlockUser);
    return () => {
      setOnClearHistory(null);
      setOnBlockUser(null);
    };
  }, [handleClearHistory, handleBlockUser, setOnClearHistory, setOnBlockUser]);

  const handleSend = useCallback(async () => {
    if (!inputText.trim()) return;
    if (!spectraID) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const messageText = inputText.trim();
    setInputText("");

    try {
      const chatDocRef = doc(db, "chats", chatId);
      await setDoc(chatDocRef, {
        updatedAt: serverTimestamp(),
        participants: chatId.split("_"),
        lastMessage: messageText,
        chatName: chatName,
        persona: persona,
      }, { merge: true });

      const messagesRef = collection(db, "chats", chatId, "messages");
      await addDoc(messagesRef, {
        text: messageText,
        senderId: spectraID.toUpperCase(),
        burnTimer: burnTimer,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error sending message:", error);
      setInputText(messageText);
    }
  }, [inputText, burnTimer, chatId, spectraID, chatName, persona]);

  const handleBurnTimerPress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowBurnModal(true);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <MessageBubble message={item} persona={persona} index={index} isRTL={isRTL} colors={colors} />
        )}
        inverted={messages.length > 0}
        contentContainerStyle={[
          styles.messageList,
          messages.length === 0 && styles.emptyListContent,
        ]}
        ListEmptyComponent={<EmptyState persona={persona} colors={colors} />}
        showsVerticalScrollIndicator={false}
      />

      <View
        style={[
          styles.inputContainer,
          isRTL && styles.inputContainerRTL,
          {
            backgroundColor: colors.surface,
            paddingBottom: insets.bottom > 0 ? insets.bottom : Spacing.md,
          },
        ]}
      >
        <Pressable
          onPress={handleBurnTimerPress}
          style={[
            styles.burnButton,
            burnTimer !== "off" && { backgroundColor: "rgba(255,100,50,0.2)" },
          ]}
        >
          <Flame
            size={22}
            color={burnTimer !== "off" ? "#FF6432" : colors.textSecondary}
          />
        </Pressable>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.background,
              color: colors.textPrimary,
              textAlign: isRTL ? "right" : "left",
            },
          ]}
          placeholder={t("chat.typeMessage")}
          placeholderTextColor={colors.textSecondary}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={1000}
        />
        <Pressable
          onPress={handleSend}
          disabled={!inputText.trim()}
          style={[
            styles.sendButton,
            {
              backgroundColor: inputText.trim() ? colors.primary : colors.background,
            },
          ]}
        >
          <Send
            size={20}
            color={inputText.trim() ? "#000" : colors.textSecondary}
            style={isRTL ? { transform: [{ scaleX: -1 }] } : undefined}
          />
        </Pressable>
      </View>

      <BurnTimerModal
        visible={showBurnModal}
        onClose={() => setShowBurnModal(false)}
        onSelect={setBurnTimer}
        currentTimer={burnTimer}
        colors={colors}
        isRTL={isRTL}
        language={language}
      />

      <ChatMenuModal
        visible={showMenu}
        onClose={() => setShowMenu(false)}
        onClearHistory={handleClearHistory}
        onBlockUser={handleBlockUser}
        onEditNickname={() => setShowNicknameModal(true)}
        colors={colors}
        isRTL={isRTL}
        language={language}
      />

      <NicknameEditModal
        visible={showNicknameModal}
        onClose={() => setShowNicknameModal(false)}
        onSave={handleSaveNickname}
        currentNickname={displayName}
        colors={colors}
        isRTL={isRTL}
        language={language}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messageList: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: "center",
  },
  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  textRTL: {
    textAlign: "right",
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: Spacing.xs,
    gap: Spacing.sm,
  },
  messageFooterRTL: {
    flexDirection: "row-reverse",
    justifyContent: "flex-start",
  },
  messageTimestamp: {
    fontSize: 11,
  },
  burnIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3,
  },
  burnIndicatorText: {
    fontSize: 9,
    color: "#FF6432",
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  emptyText: {
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  inputContainerRTL: {
    flexDirection: "row-reverse",
  },
  burnButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  burnTimerSheet: {
    borderTopLeftRadius: BorderRadius["2xl"],
    borderTopRightRadius: BorderRadius["2xl"],
    padding: Spacing.xl,
    paddingBottom: Spacing["3xl"],
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  sheetHeaderRTL: {
    flexDirection: "row-reverse",
  },
  sheetTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  sheetTitleRowRTL: {
    flexDirection: "row-reverse",
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  timerOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  timerOptionRTL: {
    flexDirection: "row-reverse",
  },
  timerOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  timerOptionContentRTL: {
    flexDirection: "row-reverse",
  },
  timerOptionText: {
    fontSize: 16,
  },
  timerCheck: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  menuSheet: {
    borderTopLeftRadius: BorderRadius["2xl"],
    borderTopRightRadius: BorderRadius["2xl"],
    padding: Spacing.xl,
    paddingBottom: Spacing["3xl"],
  },
  menuOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  menuOptionRTL: {
    flexDirection: "row-reverse",
  },
  menuOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  menuOptionContentRTL: {
    flexDirection: "row-reverse",
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  menuOptionText: {
    fontSize: 16,
    fontWeight: "500",
  },
  cancelButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  nicknameSheet: {
    borderTopLeftRadius: BorderRadius["2xl"],
    borderTopRightRadius: BorderRadius["2xl"],
    padding: Spacing.xl,
    paddingBottom: Spacing["3xl"],
  },
  nicknameInput: {
    height: 50,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  nicknameButtonRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  nicknameButtonRowRTL: {
    flexDirection: "row-reverse",
  },
  nicknameCancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
  nicknameSaveButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
