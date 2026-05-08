import React from "react";
import { Pressable, Text, StyleSheet, ViewStyle, View } from "react-native";
import { COLORS, FONT, RADIUS } from "../utils/theme";

type Variant = "primary" | "secondary" | "destructive" | "success" | "warning" | "danger" | "disabled";

type Props = {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  variant?: Variant;
  disabled?: boolean;
};

export default function Button({
  title,
  onPress,
  style,
  variant = "primary",
  disabled = false,
}: Props) {
  const resolvedVariant: Variant = disabled ? "disabled" : variant;

  const containerStyle = [
    styles.button,
    resolvedVariant === "primary"    && styles.primary,
    resolvedVariant === "secondary"  && styles.secondary,
    resolvedVariant === "destructive"&& styles.destructive,
    resolvedVariant === "success"    && styles.success,
    resolvedVariant === "warning"    && styles.warning,
    resolvedVariant === "danger"     && styles.danger,
    resolvedVariant === "disabled"   && styles.disabledBtn,
    style,
  ];

  const textStyle = [
    styles.text,
    resolvedVariant === "secondary"  && styles.textSecondary,
    resolvedVariant === "destructive"&& styles.textDestructive,
    resolvedVariant === "success"    && styles.textSuccess,
    resolvedVariant === "warning"    && styles.textWarning,
    resolvedVariant === "danger"     && styles.textDanger,
    resolvedVariant === "disabled"   && styles.textDisabled,
  ];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || resolvedVariant === "disabled"}
      style={containerStyle}
    >
      <Text style={textStyle}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: RADIUS.md,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  // Primary — solid red, white text
  primary: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  // Secondary — transparent, red border, red text
  secondary: {
    backgroundColor: "transparent",
    borderColor: COLORS.primary,
  },
  // Destructive — red glow bg + red border (NOT solid red)
  destructive: {
    backgroundColor: COLORS.primaryGlow,
    borderColor: COLORS.primaryBorder,
  },
  // Success — solid green
  success: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  // Warning — solid amber
  warning: {
    backgroundColor: COLORS.warning,
    borderColor: COLORS.warning,
  },
  // Danger — solid red (alias for primary, used in old code)
  danger: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  // Disabled — surface bg, dim border, muted text
  disabledBtn: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
  },

  // Text styles
  text: {
    color: "#FFFFFF",
    fontFamily: FONT.bold,
    fontSize: 16,
    letterSpacing: 0.3,
  },
  textSecondary:   { color: COLORS.primary },
  textDestructive: { color: COLORS.primary },
  textSuccess:     { color: "#FFFFFF" },
  textWarning:     { color: "#FFFFFF" },
  textDanger:      { color: "#FFFFFF" },
  textDisabled:    { color: COLORS.textMuted },
});