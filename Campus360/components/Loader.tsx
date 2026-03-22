import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { COLORS } from "../utils/theme";

export default function Loader() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
});