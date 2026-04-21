import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, RADIUS } from "../../utils/theme";
import ChatInput from "../../components/chatbot/ChatInput";
import MessageBubble from "../../components/chatbot/MessageBubble";
import { CHATBOT_BASE_URL } from "../../utils/api";

const QUICK_ACTIONS = [
  "Library",
  "Admin Block",
  "Girls Mess",
  "Sarabhai Hall",
  "Nursing Block",
  "Chenab Hall",
  "Tuck Shop",
];

type Message = {
  id: string;
  text: string;
  isUser: boolean;
  image?: string;
};

export default function ChatbotScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = async (text: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      text,
      isUser: true,
    };
    setMessages((prev) => [...prev, userMsg]);
    setTyping(true);

    try {
      const response = await fetch(`${CHATBOT_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      // Main reply text (some backends return data.reply, some return data.steps directly)
      if (data.reply) {
        const botReply: Message = {
          id: Date.now().toString() + "bot",
          text: data.reply,
          isUser: false,
        };
        setMessages((prev) => [...prev, botReply]);
      }

      // Navigation steps with optional images
      if (data.steps && data.steps.length > 0) {
        const stepMsgs: Message[] = data.steps.map(
          (step: { instruction: string; image?: string }, index: number) => ({
            id: Date.now().toString() + "step" + index,
            text: step.instruction,
            isUser: false,
            image: step.image,
          })
        );
        setMessages((prev) => [...prev, ...stepMsgs]);
      }

      // If neither reply nor steps — show fallback
      if (!data.reply && (!data.steps || data.steps.length === 0)) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString() + "fallback",
            text: "Sorry, I couldn't find directions for that. Try asking about a specific location like 'Library' or 'Admin Block'.",
            isUser: false,
          },
        ]);
      }
    } catch (error) {
      console.log("Chatbot error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + "err",
          text: "Unable to reach the campus navigation server. Please check your connection and try again.",
          isUser: false,
        },
      ]);
    } finally {
      setTyping(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <Ionicons name="map-outline" size={20} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Campus Navigator</Text>
              <Text style={styles.headerSub}>Find your way around campus</Text>
            </View>
          </View>
          {messages.length > 0 && (
            <TouchableOpacity onPress={clearChat} style={styles.clearBtn}>
              <Ionicons name="refresh-outline" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Chat body */}
        <View style={styles.flex}>
          {messages.length === 0 ? (
            // Empty state with quick action chips
            <View style={styles.emptyState}>
              <View style={styles.emptyIconBox}>
                <Ionicons name="navigate-outline" size={36} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>Campus Navigation Assistant</Text>
              <Text style={styles.emptySub}>
                Ask me how to get anywhere on campus. I'll give you step-by-step
                directions with map images.
              </Text>

              <Text style={styles.chipsLabel}>Quick search</Text>
              <View style={styles.chips}>
                {QUICK_ACTIONS.map((place) => (
                  <TouchableOpacity
                    key={place}
                    style={styles.chip}
                    onPress={() => sendMessage(place)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="location-outline" size={12} color={COLORS.primary} />
                    <Text style={styles.chipText}>{place}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <>
              <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <MessageBubble
                    message={item.text}
                    isUser={item.isUser}
                    image={item.image}
                    baseUrl={CHATBOT_BASE_URL}
                  />
                )}
                contentContainerStyle={styles.messageList}
                onContentSizeChange={() =>
                  flatListRef.current?.scrollToEnd({ animated: true })
                }
                onLayout={() =>
                  flatListRef.current?.scrollToEnd({ animated: false })
                }
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              />

              {typing && (
                <View style={styles.typingRow}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={styles.typingText}>Finding directions…</Text>
                </View>
              )}
            </>
          )}

          <ChatInput onSend={sendMessage} disabled={typing} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#020617",
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: "#020617",
    borderBottomWidth: 1,
    borderBottomColor: "#0f172a",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(99,102,241,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#f1f5f9",
    fontSize: 17,
    fontFamily: "DMSans_700Bold",
  },
  headerSub: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
    marginTop: 1,
  },
  clearBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#1e293b",
  },

  // Empty state
  emptyState: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: "rgba(99,102,241,0.12)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    color: "#f1f5f9",
    fontSize: 20,
    fontFamily: "DMSans_700Bold",
    marginBottom: 8,
  },
  emptySub: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    lineHeight: 21,
    marginBottom: 28,
  },
  chipsLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: "DMSans_600SemiBold",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1e293b",
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: RADIUS.chip,
  },
  chipText: {
    color: "#e2e8f0",
    fontSize: 13,
    fontFamily: "DMSans_500Medium",
  },

  // Messages
  messageList: {
    paddingTop: 12,
    paddingBottom: 8,
  },
  typingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  typingText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
  },
});
