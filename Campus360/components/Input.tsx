import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONT, RADIUS } from "../utils/theme";

type Props = TextInputProps & {
  label?: string;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  rightElement?: React.ReactNode;
};

export default function Input({
  label,
  icon,
  rightElement,
  onFocus,
  onBlur,
  style,
  ...rest
}: Props) {
  const [focused, setFocused] = useState(false);

  const handleFocus = (e: any) => {
    setFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setFocused(false);
    onBlur?.(e);
  };

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.container, focused && styles.containerFocused]}>
        {icon ? (
          <Ionicons
            name={icon}
            size={17}
            color={focused ? COLORS.primary : COLORS.textMuted}
            style={styles.icon}
          />
        ) : null}
        <TextInput
          placeholderTextColor={COLORS.textDim}
          style={[styles.input, style]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...rest}
        />
        {rightElement}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontFamily: FONT.semiBold,
    letterSpacing: 1,
    marginBottom: 7,
    textTransform: "uppercase",
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 52,
  },
  containerFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surfaceHigh,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontFamily: FONT.regular,
    fontSize: 15,
  },
});