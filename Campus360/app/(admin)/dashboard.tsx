import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { COLORS, RADIUS } from "../../utils/theme";
import { useAuth } from "../../context/AuthContext";

export default function AdminDashboard() {
  const router = useRouter();
  const { logout } = useAuth();

  const actions = [
    { title: "Create Event", route: "/(admin)/create-event" },
    { title: "Manage Events", route: "/(admin)/manage-event" },
    { title: "Quiz Analytics", route: "/(admin)/quiz-analytics" },
    { title: "Calculate Priority", route: "/(admin)/priority" },
    { title: "Seat Control", route: "/(admin)/seat-control" },
    { title: "Reports", route: "/(admin)/reports" },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Admin Dashboard</Text>
          <Text style={styles.subtitle}>
            Manage events and control seat allocation
          </Text>
        </View>

        {/* Logout Button */}
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logout}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Actions Grid */}
      <FlatList
        data={actions}
        keyExtractor={(item) => item.title}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.cardWrapper}
            onPress={() => router.push(item.route as any)}
          >
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.title}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 20,
    paddingTop: 70,
  },

  header: {
    marginBottom: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    color: COLORS.textPrimary,
    fontFamily: "DMSans_800ExtraBold",
    fontSize: 28,
  },

  subtitle: {
    color: COLORS.textMuted,
    fontFamily: "DMSans_400Regular",
    marginTop: 6,
  },

  logout: {
    color: COLORS.danger,
    fontFamily: "DMSans_600SemiBold",
  },

  cardWrapper: {
    width: "48%",
    marginBottom: 18,
  },

  card: {
    backgroundColor: "#111827",
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    minHeight: 100,
    justifyContent: "center",
  },

  cardTitle: {
    color: COLORS.textPrimary,
    fontFamily: "DMSans_600SemiBold",
    fontSize: 15,
  },
});