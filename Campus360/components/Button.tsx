import React from "react";
import { Pressable, Text, StyleSheet, ViewStyle } from "react-native";
import { COLORS, RADIUS } from "../utils/theme";

type Props = {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  variant?: "primary" | "success" | "warning" | "danger";
};

export default function Button({
  title,
  onPress,
  style,
  variant = "primary",
}: Props) {
  const backgroundColor =
    variant === "primary"
      ? COLORS.primary
      : variant === "success"
      ? COLORS.success
      : variant === "warning"
      ? COLORS.warning
      : COLORS.danger;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.button, { backgroundColor }, style]}
    >
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 50,
    borderRadius: RADIUS.button,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: COLORS.textPrimary,
    fontFamily: "DMSans_600SemiBold",
    fontSize: 16,
  },
});