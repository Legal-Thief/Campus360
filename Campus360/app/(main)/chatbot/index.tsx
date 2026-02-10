import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';

const BLUE = '#2563EB';
const BLUE_LIGHT = '#EFF6FF';
const GRAY_100 = '#F1F5F9';
const GRAY_200 = '#E2E8F0';
const GRAY_500 = '#64748B';
const GRAY_700 = '#334155';
const WHITE = '#FFFFFF';
const TEAL = '#0891B2';
const TEAL_LIGHT = '#F0FDFA';

const STATIC_MESSAGES = [
  { id: 1, from: 'bot',  text: 'Hi there! 👋 I\'m Campus Guide, your virtual assistant for all things Campus360. How can I help you today?' },
  { id: 2, from: 'user', text: 'What are the library hours?' },
  { id: 3, from: 'bot',  text: 'The university library is open Monday to Friday from 8:00 AM to 10:00 PM, and on Saturdays from 9:00 AM to 6:00 PM. Sunday it remains closed.' },
  { id: 4, from: 'user', text: 'Where is the admission office located?' },
  { id: 5, from: 'bot',  text: 'The Admission Office is located in Block A, Room 101, near the main entrance. You can also reach them at ext. 1042.' },
  { id: 6, from: 'user', text: 'Are there any events this week?' },
  { id: 7, from: 'bot',  text: 'Yes! There\'s a Tech Symposium on Feb 15 at the Main Auditorium and a Cultural Fest on Feb 22 at the Open Ground. Want me to help you register?' },
];

export default function ChatbotScreen() {
  const router = useRouter();
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState(STATIC_MESSAGES);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Scroll to bottom on mount and message change
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  const handleSend = () => {
    if (inputText.trim() === '') return;
    const newMsg = { id: messages.length + 1, from: 'user', text: inputText.trim() };
    const botReply = { id: messages.length + 2, from: 'bot', text: 'Thanks for your message! I\'m a UI-only demo, so I don\'t have a real response yet. Feel free to ask anything!' };
    setMessages([...messages, newMsg, botReply]);
    setInputText('');
  };

  return (
    <View style={styles.screen}>
      <View style={{ height: Platform.OS === 'ios' ? 54 : 44 }} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <View style={styles.botAvatar}>
            <Text style={styles.botAvatarIcon}>🤖</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Campus Guide</Text>
            <Text style={styles.headerOnline}>● Online</Text>
          </View>
        </View>
        <Pressable style={styles.infoBtn} onPress={() => {}}>
          <Text style={styles.infoIcon}>ℹ</Text>
        </Pressable>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {/* Date divider */}
        <View style={styles.dateDivider}>
          <View style={styles.dateDividerLine} />
          <Text style={styles.dateDividerText}>Today</Text>
          <View style={styles.dateDividerLine} />
        </View>

        {messages.map((msg) => (
          <View key={msg.id} style={[styles.messageRow, msg.from === 'user' && styles.messageRowUser]}>
            {/* Bot avatar on left */}
            {msg.from === 'bot' && (
              <View style={styles.msgAvatar}>
                <Text style={styles.msgAvatarText}>🤖</Text>
              </View>
            )}

            {/* Bubble */}
            <View style={[
              styles.bubble,
              msg.from === 'bot' ? styles.bubbleBot : styles.bubbleUser,
            ]}>
              <Text style={[styles.bubbleText, msg.from === 'user' && styles.bubbleTextUser]}>
                {msg.text}
              </Text>
            </View>

            {/* User avatar on right */}
            {msg.from === 'user' && (
              <View style={styles.msgAvatarUser}>
                <Text style={styles.msgAvatarUserText}>J</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Input bar */}
      <View style={styles.inputBar}>
        <View style={styles.inputRow}>
          <Pressable style={styles.attachBtn} onPress={() => {}}>
            <Text style={styles.attachIcon}>📎</Text>
          </Pressable>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={GRAY_500}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            multiline
            maxHeight={100}
          />
          <Pressable
            style={[styles.sendBtn, inputText.trim().length > 0 && styles.sendBtnActive]}
            onPress={handleSend}
            disabled={inputText.trim().length === 0}
          >
            <Text style={styles.sendIcon}>↑</Text>
          </Pressable>
        </View>
        <Text style={styles.inputDisclaimer}>Campus Guide is a demo bot — responses are static.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: WHITE, borderBottomWidth: 1, borderBottomColor: GRAY_200 },
  backBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 20, color: GRAY_700 },
  headerCenter: { flexDirection: 'row', alignItems: 'center' },
  botAvatar: { width: 38, height: 38, borderRadius: 12, backgroundColor: TEAL_LIGHT, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  botAvatarIcon: { fontSize: 20 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: GRAY_700 },
  headerOnline: { fontSize: 11, color: '#16A34A', fontWeight: '500' },
  infoBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  infoIcon: { fontSize: 18, color: GRAY_500 },

  // Messages
  messagesContainer: { flex: 1 },
  messagesContent: { paddingHorizontal: 16, paddingVertical: 12 },

  dateDivider: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  dateDividerLine: { flex: 1, height: 1, backgroundColor: GRAY_200 },
  dateDividerText: { fontSize: 12, color: GRAY_500, marginHorizontal: 12, fontWeight: '500' },

  messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10 },
  messageRowUser: { justifyContent: 'flex-end' },

  msgAvatar: { width: 30, height: 30, borderRadius: 10, backgroundColor: TEAL_LIGHT, alignItems: 'center', justifyContent: 'center', marginRight: 8, flexShrink: 0 },
  msgAvatarText: { fontSize: 16 },
  msgAvatarUser: { width: 28, height: 28, borderRadius: 9, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center', marginLeft: 8, flexShrink: 0 },
  msgAvatarUserText: { fontSize: 13, color: WHITE, fontWeight: '700' },

  bubble: { maxWidth: '75%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleBot: { backgroundColor: WHITE, borderBottomLeftRadius: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  bubbleUser: { backgroundColor: BLUE, borderBottomRightRadius: 4, shadowColor: BLUE, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 3 },
  bubbleText: { fontSize: 14, color: GRAY_700, lineHeight: 21 },
  bubbleTextUser: { color: WHITE },

  // Input bar
  inputBar: { backgroundColor: WHITE, borderTopWidth: 1, borderTopColor: GRAY_200, padding: 12, paddingBottom: Platform.OS === 'ios' ? 28 : 16 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: GRAY_100, borderRadius: 14, paddingHorizontal: 8, paddingVertical: 4 },
  attachBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  attachIcon: { fontSize: 18 },
  input: { flex: 1, fontSize: 14, color: GRAY_700, paddingVertical: 6, minHeight: 36 },
  sendBtn: { width: 38, height: 38, borderRadius: 11, backgroundColor: GRAY_200, alignItems: 'center', justifyContent: 'center' },
  sendBtnActive: { backgroundColor: BLUE, shadowColor: BLUE, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3 },
  sendIcon: { fontSize: 18, color: WHITE, fontWeight: '700' },
  inputDisclaimer: { fontSize: 11, color: GRAY_500, textAlign: 'center', marginTop: 6 },
});
