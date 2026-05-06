import React, { useRef, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONT, RADIUS } from "../../utils/theme";
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
    const userMsg: Message = { id: Date.now().toString(), text, isUser: true };
    setMessages((prev) => [...prev, userMsg]);
    setTyping(true);

    try {
      const response = await fetch(`${CHATBOT_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data = await response.json();

      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString() + "bot", text: data.reply, isUser: false },
        ]);
      }

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
    } catch {
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* 3px top accent */}
      <View style={styles.topAccent} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconBox}>
            <Ionicons name="navigate-outline" size={22} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Campus Navigator</Text>
            <Text style={styles.headerSub}>Find your way around campus</Text>
          </View>
        </View>
        {messages.length > 0 && (
          <TouchableOpacity onPress={() => setMessages([])} style={styles.clearBtn} activeOpacity={0.8}>
            <Ionicons name="refresh-outline" size={17} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Body */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View style={styles.flex}>
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              {/* Hero icon */}
              <View style={styles.heroIconBox}>
                <Ionicons name="navigate-outline" size={40} color={COLORS.primary} />
              </View>

              <Text style={styles.emptyTitle}>Campus Navigation</Text>
              <Text style={styles.emptySub}>
                Ask me how to get anywhere on campus. I'll give you{"\n"}
                step-by-step directions with map images.
              </Text>

              {/* Section header — numbered style */}
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNum}>
                  <Text style={styles.sectionNumText}>01</Text>
                </View>
                <Text style={styles.sectionLabel}>QUICK SEARCH</Text>
                <View style={styles.sectionLine} />
              </View>

              {/* Quick search chips */}
              <View style={styles.chips}>
                {QUICK_ACTIONS.map((place) => (
                  <TouchableOpacity
                    key={place}
                    style={styles.chip}
                    onPress={() => sendMessage(place)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="location-outline" size={13} color={COLORS.primary} />
                    <Text style={styles.chipText}>{place}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Bottom hint */}
              <View style={styles.hintRow}>
                <Ionicons name="information-circle-outline" size={14} color={COLORS.textDim} />
                <Text style={styles.hintText}>
                  Or type any location in the box below
                </Text>
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
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: { flex: 1 },
  topAccent: {
    height: 3,
    backgroundColor: COLORS.primary,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIconBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primaryGlow,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontFamily: FONT.bold,
  },
  headerSub: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: FONT.regular,
    marginTop: 1,
  },
  clearBtn: {
    padding: 9,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // Empty state
  emptyState: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 36,
  },
  heroIconBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: COLORS.primaryGlow,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 26,
    fontFamily: FONT.extraBold,
    marginBottom: 10,
    lineHeight: 32,
  },
  emptySub: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontFamily: FONT.regular,
    lineHeight: 22,
    marginBottom: 30,
  },

  // Section header — numbered [01] style
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  sectionNum: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xs,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  sectionNumText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: FONT.bold,
  },
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontFamily: FONT.bold,
    letterSpacing: 2.5,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },

  // Chips
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 28,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: RADIUS.chip,
  },
  chipText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontFamily: FONT.medium,
  },

  // Hint
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  hintText: {
    color: COLORS.textDim,
    fontSize: 12,
    fontFamily: FONT.regular,
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
    fontFamily: FONT.regular,
  },
});