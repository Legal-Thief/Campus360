import React from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, StatusBar, Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { COLORS, FONT, RADIUS } from "../../utils/theme";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const CARD_W = (width - 52) / 2;

const actions = [
  { title: "Create Event", subtitle: "Quiz-based seat booking", icon: "add-circle-outline", route: "/(admin)/create-event", tag: "NEW" },
  { title: "Manage Events", subtitle: "Edit and control events", icon: "calendar-outline", route: "/(admin)/manage-event", tag: "LIVE" },
  { title: "Quiz Analytics", subtitle: "Scores and stats", icon: "bar-chart-outline", route: "/(admin)/quiz-analytics", tag: "DATA" },
  { title: "Priority", subtitle: "Generate rank and slots", icon: "trophy-outline", route: "/(admin)/priority", tag: "RANK" },
  { title: "Seat Control", subtitle: "Auditorium layouts", icon: "grid-outline", route: "/(admin)/seat-control", tag: "ROOM" },
  { title: "Reports", subtitle: "Export and view reports", icon: "document-text-outline", route: "/(admin)/reports", tag: "PDF" },
  { title: "Scanner Access", subtitle: "Assign QR scanning roles", icon: "qr-code-outline", route: "/(admin)/manage-scanners", tag: "QR" },
];

export default function AdminDashboard() {
  const router = useRouter();
  const { logout, user } = useAuth();

  const initials = user?.name
    ? user.name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
    : "AD";

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <View style={styles.topAccent} />
      {/* Right vertical bar — admin screen rule */}
      <View style={styles.rightBar} />
      {/* Top-right ambient glow */}
      <View style={styles.bgGlow} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View>
            <Text style={styles.adminLabel}>ADMIN PANEL</Text>
            <Text style={styles.title}>Dashboard</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={17} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Section header */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>MODULES</Text>
        <View style={styles.sectionLine} />
      </View>

      <FlatList
        data={actions}
        keyExtractor={(item) => item.title}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        contentContainerStyle={{ gap: 12, paddingBottom: 30 }}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[styles.card, index === 0 && styles.cardFeatured]}
            activeOpacity={0.82}
            onPress={() => router.push(item.route as any)}
          >
            {/* Tag */}
            <View style={[styles.tag, index === 0 && styles.tagFeatured]}>
              <Text style={[styles.tagText, index === 0 && styles.tagTextFeatured]}>{item.tag}</Text>
            </View>

            {/* Icon */}
            <View style={[styles.iconBox, index === 0 && styles.iconBoxFeatured]}>
              <Ionicons name={item.icon as any} size={22} color={index === 0 ? "#fff" : COLORS.primary} />
            </View>

            <Text style={[styles.cardTitle, index === 0 && styles.cardTitleFeatured]}>{item.title}</Text>
            <Text style={[styles.cardSubtitle, index === 0 && styles.cardSubtitleFeatured]}>{item.subtitle}</Text>

            <View style={styles.cardArrow}>
              <Ionicons name="arrow-forward" size={14} color={index === 0 ? "rgba(255,255,255,0.6)" : COLORS.textDim} />
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
    paddingTop: 60,
  },
  topAccent: {
    position: "absolute", top: 0, left: 0, right: 0,
    height: 3, backgroundColor: COLORS.primary,
  },
  rightBar: {
    position: "absolute", top: 0, right: 0,
    width: 3, height: 120,
    backgroundColor: COLORS.primary, opacity: 0.5,
  },
  bgGlow: {
    position: "absolute", top: -80, right: -80,
    width: 240, height: 240, borderRadius: 120,
    backgroundColor: COLORS.primary, opacity: 0.07,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: COLORS.primary,
    justifyContent: "center", alignItems: "center",
  },
  avatarText: { color: "#fff", fontSize: 17, fontFamily: FONT.bold },
  adminLabel: {
    color: COLORS.primary, fontSize: 9,
    fontFamily: FONT.bold, letterSpacing: 2.5, marginBottom: 2,
  },
  title: { color: COLORS.textPrimary, fontSize: 20, fontFamily: FONT.extraBold },
  logoutBtn: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.primaryBorder,
    backgroundColor: COLORS.primaryGlow,
    justifyContent: "center", alignItems: "center",
  },
  sectionRow: {
    flexDirection: "row", alignItems: "center",
    gap: 12, marginBottom: 16, marginTop: 4,
  },
  sectionTitle: { color: COLORS.textMuted, fontSize: 11, fontFamily: FONT.bold, letterSpacing: 3 },
  sectionLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  card: {
    width: CARD_W,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    minHeight: 160,
    justifyContent: "space-between",
  },
  cardFeatured: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tag: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.white20,
    borderRadius: RADIUS.chip,
    paddingHorizontal: 8, paddingVertical: 3,
    marginBottom: 14,
    borderWidth: 1, borderColor: COLORS.border,
  },
  tagFeatured: { backgroundColor: "rgba(0,0,0,0.25)", borderColor: "rgba(255,255,255,0.2)" },
  tagText: { color: COLORS.textMuted, fontSize: 9, fontFamily: FONT.bold, letterSpacing: 1.5 },
  tagTextFeatured: { color: "rgba(255,255,255,0.85)" },
  iconBox: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: COLORS.primaryGlow,
    borderWidth: 1, borderColor: COLORS.primaryBorder,
    justifyContent: "center", alignItems: "center",
    marginBottom: 12,
  },
  iconBoxFeatured: { backgroundColor: "rgba(0,0,0,0.25)", borderColor: "rgba(255,255,255,0.2)" },
  cardTitle: { color: COLORS.textPrimary, fontSize: 14, fontFamily: FONT.bold, marginBottom: 4 },
  cardTitleFeatured: { color: "#fff" },
  cardSubtitle: { color: COLORS.textMuted, fontSize: 11, fontFamily: FONT.regular, lineHeight: 16 },
  cardSubtitleFeatured: { color: "rgba(255,255,255,0.7)" },
  cardArrow: { alignSelf: "flex-end", marginTop: 8 },
});
