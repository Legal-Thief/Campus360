import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONT, RADIUS } from "../../utils/theme";

interface Props {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled = false }: Props) {
  const [message, setMessage] = useState("");
  const [focused, setFocused] = useState(false);

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setMessage("");
  };

  const canSend = !!message.trim() && !disabled;

  return (
    <View style={styles.container}>
      <View style={[styles.inputRow, focused && styles.inputRowFocused]}>
        <Ionicons
          name="search-outline"
          size={17}
          color={focused ? COLORS.primary : COLORS.textMuted}
          style={styles.prefixIcon}
        />
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Ask about campus navigation..."
          placeholderTextColor={COLORS.textDim}
          style={styles.input}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          editable={!disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        <TouchableOpacity
          onPress={handleSend}
          style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
          disabled={!canSend}
          activeOpacity={0.85}
        >
          <Ionicons name="send" size={17} color={canSend ? "#fff" : COLORS.textDim} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 6,
  },
  inputRowFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surfaceHigh,
  },
  prefixIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    paddingVertical: 8,
    fontFamily: FONT.regular,
  },
  sendBtn: {
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },
  sendBtnDisabled: {
    backgroundColor: COLORS.surfaceHigh,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});