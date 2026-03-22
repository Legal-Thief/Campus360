import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../../utils/theme";

export default function Hostel() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hostel Management</Text>
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
    fontSize: 18,
  },
});