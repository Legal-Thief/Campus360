import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { COLORS, RADIUS } from "../../utils/theme";
import API from "../../utils/api";

export default function Profile() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await API.get("/events");
      setEvents(res.data.events || []);
    } catch {
      // silent — profile still works without event list
    } finally {
      setLoading(false);
    }
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w: string) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const roleColors: Record<string, string> = {
    student: "#6366f1",
    admin: "#10b981",
    superadmin: "#f59e0b",
    warden: "#ef4444",
    faculty: "#3b82f6",
  };

  const roleColor = roleColors[user?.role || "student"] || "#6366f1";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar + name */}
      <View style={styles.avatarSection}>
        <View style={[styles.avatar, { backgroundColor: roleColor + "22" }]}>
          <Text style={[styles.avatarText, { color: roleColor }]}>{initials}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={[styles.roleBadge, { backgroundColor: roleColor + "18" }]}>
          <Text style={[styles.roleText, { color: roleColor }]}>
            {user?.role?.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Account info */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Account Info</Text>
        {[
          { label: "Full name", value: user?.name, icon: "person-outline" },
          { label: "Email", value: user?.email, icon: "mail-outline" },
          {
            label: "Student ID",
            value: user?.studentId || "—",
            icon: "id-card-outline",
          },
          { label: "Role", value: user?.role, icon: "shield-outline" },
        ].map((row) => (
          <View key={row.label} style={styles.infoRow}>
            <Ionicons
              name={row.icon as any}
              size={16}
              color={COLORS.textMuted}
              style={{ width: 22 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>{row.label}</Text>
              <Text style={styles.infoValue}>{row.value}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Quick links */}
      {user?.role === "student" && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Quick Links</Text>
          {[
            {
              label: "My Events & Quizzes",
              icon: "calendar-outline",
              onPress: () => router.push("/(core)/events"),
            },
            {
              label: "Hostel Room Requests",
              icon: "business-outline",
              onPress: () => router.push("/(core)/hostel"),
            },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.linkRow}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <Ionicons name={item.icon as any} size={18} color={COLORS.primary} />
              <Text style={styles.linkText}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={14} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Admin quick links */}
      {(user?.role === "admin" || user?.role === "superadmin") && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Admin Tools</Text>
          {[
            {
              label: "Manage Events",
              icon: "settings-outline",
              onPress: () => router.push("/(admin)/manage-event"),
            },
            {
              label: "Priority & Rankings",
              icon: "trophy-outline",
              onPress: () => router.push("/(admin)/priority"),
            },
            {
              label: "QR Entry Scanner",
              icon: "qr-code-outline",
              onPress: () => router.push("/qr-scanner"),
            },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.linkRow}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <Ionicons name={item.icon as any} size={18} color="#10b981" />
              <Text style={styles.linkText}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={14} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={18} color="#ef4444" />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Campus360 · v1.0</Text>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 28,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  avatarText: {
    fontSize: 28,
    fontFamily: "DMSans_800ExtraBold",
  },
  name: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontFamily: "DMSans_700Bold",
    marginBottom: 4,
  },
  email: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    marginBottom: 10,
  },
  roleBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 999,
  },
  roleText: {
    fontSize: 11,
    fontFamily: "DMSans_700Bold",
    letterSpacing: 1.5,
  },
  sectionCard: {
    backgroundColor: "#111827",
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontFamily: "DMSans_700Bold",
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontFamily: "DMSans_500Medium",
    marginBottom: 3,
  },
  infoValue: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontFamily: "DMSans_500Medium",
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  linkText: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 14,
    fontFamily: "DMSans_500Medium",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(239,68,68,0.1)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 16,
  },
  logoutText: {
    color: "#ef4444",
    fontSize: 15,
    fontFamily: "DMSans_700Bold",
  },
  version: {
    color: COLORS.textMuted,
    fontSize: 11,
    textAlign: "center",
    fontFamily: "DMSans_400Regular",
    marginBottom: 8,
  },
});
