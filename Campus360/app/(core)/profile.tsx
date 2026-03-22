import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../../utils/theme";
import { useAuth } from "../../context/AuthContext";

export default function Profile() {
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Name: {user?.name}</Text>
      <Text style={styles.text}>Role: {user?.role}</Text>
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
    fontSize: 16,
    marginBottom: 8,
  },
});