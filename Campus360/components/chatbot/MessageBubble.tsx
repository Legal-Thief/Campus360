import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { COLORS } from "../../utils/theme";

interface Props {
  message: string;
  isUser: boolean;
  image?: string;
  baseUrl: string;
}

export default function MessageBubble({ message, isUser, image, baseUrl }: Props) {
  return (
    <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}>
      {!isUser && (
        <View style={styles.botAvatar}>
          <Text style={styles.botAvatarText}>🗺</Text>
        </View>
      )}
      <View style={[styles.content, isUser ? styles.userContent : styles.botContent]}>
        {image ? (
          <Image
            source={{ uri: `${baseUrl}${image}` }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : null}
        {message ? (
          <Text style={[styles.text, isUser ? styles.userText : styles.botText]}>
            {message}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    flexDirection: "row",
    marginVertical: 5,
    marginHorizontal: 14,
    alignItems: "flex-end",
    gap: 8,
  },
  userBubble: {
    justifyContent: "flex-end",
  },
  botBubble: {
    justifyContent: "flex-start",
  },
  botAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#1e293b",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  botAvatarText: {
    fontSize: 14,
  },
  content: {
    maxWidth: "78%",
    borderRadius: 16,
    overflow: "hidden",
  },
  userContent: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  botContent: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1e293b",
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  image: {
    width: 220,
    height: 140,
    borderRadius: 10,
    marginBottom: 6,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: "#fff",
    fontFamily: "DMSans_400Regular",
  },
  botText: {
    color: "#e2e8f0",
    fontFamily: "DMSans_400Regular",
  },
});
