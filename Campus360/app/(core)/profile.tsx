import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { COLORS, FONT, RADIUS } from "../../utils/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Profile() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const initials = user?.name
    ? user.name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
    : "??";

  const roleColor: Record<string, string> = {
    student: COLORS.primary, admin: COLORS.success,
    superadmin: COLORS.warning, warden: "#8B5CF6", faculty: COLORS.info,
  };
  const rc = roleColor[user?.role || "student"] || COLORS.primary;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" />
      <View style={styles.topAccent} />
      {/* Top-right ambient glow */}
      <View style={styles.bgGlow} />

      {/* Avatar */}
      <View style={[styles.avatarSection, { paddingTop: Math.max(insets.top, 20) + 16 }]}>
        <View style={[styles.avatarRing, { borderColor: rc }]}>
          <View style={[styles.avatar, { backgroundColor: rc + "22" }]}>
            <Text style={[styles.avatarText, { color: rc }]}>{initials}</Text>
          </View>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={[styles.roleBadge, { backgroundColor: rc + "18", borderColor: rc + "44" }]}>
          <Text style={[styles.roleText, { color: rc }]}>{user?.role?.toUpperCase()}</Text>
        </View>
      </View>

      {/* Info card */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>ACCOUNT INFO</Text>
        {[
          { icon: "person-outline", label: "Full Name", value: user?.name },
          { icon: "mail-outline", label: "Email", value: user?.email },
          { icon: "id-card-outline", label: "Student ID", value: user?.studentId || "—" },
          { icon: "shield-outline", label: "Role", value: user?.role },
          { icon: "home-outline", label: "Resident Type", value: user?.residentType?.replace("_", " ") || "—" },
        ].map((row, i) => (
          <View key={i} style={[styles.infoRow, i > 0 && styles.infoRowBorder]}>
            <Ionicons name={row.icon as any} size={16} color={COLORS.textMuted} />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>{row.label}</Text>
              <Text style={styles.infoValue}>{row.value}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Quick links */}
      {user?.role === "student" && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>QUICK LINKS</Text>
          {[
            { label: "My Events & Quizzes", icon: "calendar-outline", route: "/(core)/events" },
            { label: "Hostel Requests", icon: "business-outline", route: "/(core)/hostel" },
            { label: "Lost & Found", icon: "search-outline", route: "/(core)/lost-found" },
          ].map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.linkRow, i > 0 && styles.infoRowBorder]}
              onPress={() => router.push(item.route as any)}
            >
              <View style={styles.linkIcon}>
                <Ionicons name={item.icon as any} size={17} color={COLORS.primary} />
              </View>
              <Text style={styles.linkText}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={14} color={COLORS.textDim} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Admin links */}
      {(user?.role === "admin" || user?.role === "superadmin") && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>ADMIN TOOLS</Text>
          {[
            { label: "Manage Events", icon: "settings-outline", route: "/(admin)/manage-event" },
            { label: "Priority & Rankings", icon: "trophy-outline", route: "/(admin)/priority" },
            { label: "QR Entry Scanner", icon: "qr-code-outline", route: "/qr-scanner" },
          ].map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.linkRow, i > 0 && styles.infoRowBorder]}
              onPress={() => router.push(item.route as any)}
            >
              <View style={[styles.linkIcon, { backgroundColor: COLORS.successBg, borderColor: COLORS.successBorder }]}>
                <Ionicons name={item.icon as any} size={17} color={COLORS.success} />
              </View>
              <Text style={styles.linkText}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={14} color={COLORS.textDim} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.85}>
        <Ionicons name="log-out-outline" size={18} color={COLORS.primary} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Campus360 · v1.0</Text>
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: 20, paddingBottom: 20 },
  topAccent: { height: 3, backgroundColor: COLORS.primary, marginBottom: 0 },
  bgGlow: {
    position: "absolute", top: -80, right: -80,
    width: 260, height: 260, borderRadius: 130,
    backgroundColor: COLORS.primary, opacity: 0.08,
  },
  avatarSection: { alignItems: "center", paddingTop: 36, paddingBottom: 28 },
  avatarRing: {
    width: 90, height: 90, borderRadius: 45,
    borderWidth: 2, padding: 3, marginBottom: 14,
  },
  avatar: { flex: 1, borderRadius: 40, justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 28, fontFamily: FONT.extraBold },
  name: { color: COLORS.textPrimary, fontSize: 22, fontFamily: FONT.bold, marginBottom: 4 },
  email: { color: COLORS.textMuted, fontSize: 13, fontFamily: FONT.regular, marginBottom: 12 },
  roleBadge: {
    paddingHorizontal: 14, paddingVertical: 5,
    borderRadius: RADIUS.chip, borderWidth: 1,
  },
  roleText: { fontSize: 11, fontFamily: FONT.bold, letterSpacing: 2 },
  card: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 14,
  },
  cardLabel: {
    color: COLORS.textMuted, fontSize: 10, fontFamily: FONT.bold,
    letterSpacing: 2, marginBottom: 14,
  },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 11 },
  infoRowBorder: { borderTopWidth: 1, borderTopColor: COLORS.border },
  infoLabel: { color: COLORS.textMuted, fontSize: 11, fontFamily: FONT.medium, marginBottom: 2 },
  infoValue: { color: COLORS.textPrimary, fontSize: 14, fontFamily: FONT.medium, textTransform: "capitalize" },
  linkRow: {
    flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12,
  },
  linkIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.primaryGlow, borderWidth: 1, borderColor: COLORS.primaryBorder,
    justifyContent: "center", alignItems: "center",
  },
  linkText: { flex: 1, color: COLORS.textPrimary, fontSize: 14, fontFamily: FONT.medium },
  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: COLORS.primaryGlow, borderWidth: 1, borderColor: COLORS.primaryBorder,
    borderRadius: RADIUS.md, paddingVertical: 15, marginBottom: 16,
  },
  logoutText: { color: COLORS.primary, fontSize: 15, fontFamily: FONT.bold },
  version: { color: COLORS.textDim, fontSize: 11, textAlign: "center", fontFamily: FONT.regular },
});