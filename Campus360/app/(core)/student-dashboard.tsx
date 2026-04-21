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

type Module = {
  title: string;
  subtitle: string;
  route: string;
  icon: string;
  color: string;
  show: boolean;
};

export default function StudentDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const isHosteller = user?.residentType === "hosteller";

  const modules: Module[] = [
    {
      title: "Event Registration",
      subtitle: "Quiz-based seat booking for events",
      route: "/(core)/events",
      icon: "calendar-outline",
      color: "#6366f1",
      show: true,
    },
    {
      title: "Hostel Management",
      subtitle: "Room change & swap requests",
      route: "/(core)/hostel",
      icon: "business-outline",
      color: "#10b981",
      show: isHosteller,
    },
    {
      title: "Lost & Found",
      subtitle: "Report or recover lost items",
      route: "/(core)/lost-found",
      icon: "search-outline",
      color: "#f59e0b",
      show: true,
    },
    {
      title: "Campus Navigator",
      subtitle: "Get directions anywhere on campus",
      route: "/(core)/chatbot",
      icon: "map-outline",
      color: "#06b6d4",
      show: true,
    },
  ].filter((m) => m.show);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>Welcome back,</Text>
          <Text style={styles.name}>{user?.name}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user?.role?.toUpperCase()}</Text>
            </View>
            <View
              style={[
                styles.residentBadge,
                isHosteller
                  ? styles.residentBadgeHostel
                  : styles.residentBadgeDay,
              ]}
            >
              <Text
                style={[
                  styles.residentText,
                  isHosteller ? { color: "#10b981" } : { color: "#6366f1" },
                ]}
              >
                {isHosteller ? "🏢 Hosteller" : "🏠 Day Scholar"}
              </Text>
            </View>
          </View>
          {isHosteller && user?.hostelBlock && (
            <Text style={styles.roomInfo}>
              {user.hostelBlock} · Room {user.roomNumber}
            </Text>
          )}
        </View>
      </View>

      {/* Module grid */}
      <FlatList
        data={modules}
        keyExtractor={(item) => item.title}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.cardWrapper}
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.8}
          >
            <View style={styles.card}>
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: item.color + "18" },
                ]}
              >
                <Ionicons name={item.icon as any} size={24} color={item.color} />
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Ionicons name="log-out-outline" size={16} color={COLORS.danger} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
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
  header: { marginBottom: 30 },
  welcome: {
    color: COLORS.textMuted,
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
  },
  name: {
    color: COLORS.textPrimary,
    fontFamily: "DMSans_800ExtraBold",
    fontSize: 28,
    marginTop: 4,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    flexWrap: "wrap",
  },
  roleBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.chip,
  },
  roleText: {
    color: "#fff",
    fontFamily: "DMSans_600SemiBold",
    fontSize: 11,
  },
  residentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.chip,
    borderWidth: 1,
  },
  residentBadgeHostel: {
    backgroundColor: "rgba(16,185,129,0.1)",
    borderColor: "rgba(16,185,129,0.3)",
  },
  residentBadgeDay: {
    backgroundColor: "rgba(99,102,241,0.1)",
    borderColor: "rgba(99,102,241,0.3)",
  },
  residentText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 11,
  },
  roomInfo: {
    color: "#10b981",
    fontFamily: "DMSans_500Medium",
    fontSize: 12,
    marginTop: 8,
  },
  cardWrapper: { width: "48%", marginBottom: 18 },
  card: {
    backgroundColor: "#111827",
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    minHeight: 140,
    justifyContent: "space-between",
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontFamily: "DMSans_700Bold",
    fontSize: 15,
  },
  cardSubtitle: {
    color: COLORS.textMuted,
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
    marginBottom: 20,
  },
  logoutText: {
    color: COLORS.danger,
    fontFamily: "DMSans_600SemiBold",
    fontSize: 14,
  },
});
