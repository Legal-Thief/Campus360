import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../../utils/theme";

export default function Reports() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Reports</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: COLORS.textPrimary,
    fontSize: 20,
  },
});