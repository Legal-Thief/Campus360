import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { COLORS, RADIUS } from "../utils/theme";

type Props = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
};

export default function Input({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
}: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.container}>
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={COLORS.textDim}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          style={styles.input}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 18,
  },

  label: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontFamily: "DMSans_600SemiBold",
    marginBottom: 6,
  },

  container: {
    height: 52,
    backgroundColor: "#0F172A",
    borderRadius: RADIUS.button,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
  },

  input: {
    paddingHorizontal: 16,
    color: COLORS.textPrimary,
    fontFamily: "DMSans_400Regular",
    fontSize: 15,
  },
});