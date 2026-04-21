import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { COLORS, RADIUS } from "../../utils/theme";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";

export default function AdminDashboard() {
  const router = useRouter();
  const { logout } = useAuth();

  const actions = [
    {
      title: "Create Event",
      subtitle: "Create quiz based event",
      icon: "add-circle-outline",
      route: "/(admin)/create-event",
    },
    {
      title: "Manage Events",
      subtitle: "Edit and manage events",
      icon: "calendar-outline",
      route: "/(admin)/manage-event",
    },
    {
      title: "Quiz Analytics",
      subtitle: "See quiz scores and stats",
      icon: "bar-chart-outline",
      route: "/(admin)/quiz-analytics",
    },
    {
      title: "Calculate Priority",
      subtitle: "Generate rank and slots",
      icon: "trophy-outline",
      route: "/(admin)/priority",
    },
    {
      title: "Seat Control",
      subtitle: "Create auditorium layouts",
      icon: "grid-outline",
      route: "/(admin)/seat-control",
    },
    {
      title: "Reports",
      subtitle: "Export and view reports",
      icon: "document-text-outline",
      route: "/(admin)/reports",
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Admin Dashboard</Text>
          <Text style={styles.subtitle}>
            Manage events and auditorium layouts
          </Text>
        </View>

        <TouchableOpacity onPress={logout}>
          <Text style={styles.logout}>Logout</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={actions}
        keyExtractor={(item) => item.title}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.row}
        contentContainerStyle={{ paddingBottom: 30 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.cardWrapper}
            activeOpacity={0.85}
            onPress={() => router.push(item.route as any)}
          >
            <View style={styles.card}>
              <View style={styles.iconBox}>
                <Ionicons
                  name={item.icon as any}
                  size={24}
                  color={COLORS.primary}
                />
              </View>

              <Text style={styles.cardTitle}>
                {item.title}
              </Text>

              <Text style={styles.cardSubtitle}>
                {item.subtitle}
              </Text>
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
    marginBottom: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  title: {
    color: COLORS.textPrimary,
    fontSize: 30,
    fontFamily: "DMSans_800ExtraBold",
  },

  subtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 6,
    maxWidth: 220,
    fontFamily: "DMSans_400Regular",
  },

  logout: {
    color: COLORS.danger,
    fontSize: 14,
    marginTop: 8,
    fontFamily: "DMSans_600SemiBold",
  },

  row: {
    justifyContent: "space-between",
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
    padding: 18,
    minHeight: 150,
    justifyContent: "space-between",
  },

  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(59,130,246,0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },

  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontFamily: "DMSans_700Bold",
    marginBottom: 8,
  },

  cardSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: "DMSans_400Regular",
  },
});