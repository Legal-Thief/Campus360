import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, StatusBar, Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import API from "../../utils/api";
import { COLORS, FONT, RADIUS } from "../../utils/theme";

const { width } = Dimensions.get("window");

type Module = {
  title: string;
  subtitle: string;
  route: string;
  icon: string;
  tag: string;
  show: boolean;
};

export default function StudentDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const isHosteller = user?.residentType === "hosteller";
  const [hasScannerEvents, setHasScannerEvents] = useState(false);

  // Check if this user has been assigned as a QR scanner for any event
  useEffect(() => {
    const checkScannerRole = async () => {
      try {
        const res = await API.get("/events/my-scanner-events");
        setHasScannerEvents((res.data.events ?? []).length > 0);
      } catch {
        // silently fail — no scanner access tile shown
      }
    };
    checkScannerRole();
  }, []);

  const modules: Module[] = [
    {
      title: "Event Registration",
      subtitle: "Quiz-based seat booking",
      route: "/(core)/events",
      icon: "calendar",
      tag: "LIVE",
      show: true,
    },
    {
      title: "Hostel Management",
      subtitle: "Room change & swap requests",
      route: "/(core)/hostel",
      icon: "business",
      tag: "ROOM",
      show: isHosteller,
    },
    {
      title: "Lost & Found",
      subtitle: "Report or recover items",
      route: "/(core)/lost-found",
      icon: "search",
      tag: "NEW",
      show: true,
    },
    {
      title: "Campus Navigator",
      subtitle: "Step-by-step directions",
      route: "/(core)/chatbot",
      icon: "map",
      tag: "AI",
      show: true,
    },
    {
      title: "QR Scanner",
      subtitle: "Scan student entry QR codes",
      route: "/qr-scanner",
      icon: "qr-code",
      tag: "SCAN",
      show: hasScannerEvents,
    },
  ].filter((m) => m.show);

  const initials = user?.name
    ? user.name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
    : "??";

  return (
    <View style={styles.wrapper}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Full-width 3px red top accent — student core rule */}
      <View style={styles.topAccent} />
      {/* Top-right ambient glow */}
      <View style={styles.bgGlow} />

      <View style={styles.container}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View>
            <Text style={styles.greeting}>Good day,</Text>
            <Text style={styles.userName} numberOfLines={1}>{user?.name?.split(" ")[0]}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={18} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* ── ID Badge ── */}
      <View style={styles.idBadge}>
        <View style={styles.idLeft}>
          <View style={styles.redDot} />
          <View>
            <Text style={styles.idLabel}>STUDENT ID</Text>
            <Text style={styles.idValue}>{user?.studentId || "—"}</Text>
          </View>
        </View>
        <View style={[styles.rolePill, isHosteller && styles.rolePillHostel]}>
          <Text style={styles.rolePillText}>
            {isHosteller ? "HOSTELLER" : "DAY SCHOLAR"}
          </Text>
        </View>
      </View>

      {isHosteller && user?.hostelBlock && (
        <View style={styles.roomBadge}>
          <Ionicons name="bed-outline" size={13} color={COLORS.primary} />
          <Text style={styles.roomBadgeText}>{user.hostelBlock}  ·  Room {user.roomNumber}</Text>
        </View>
      )}

      {/* ── Section title ── */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>MODULES</Text>
        <View style={styles.sectionLine} />
      </View>

      {/* ── Module grid ── */}
      <FlatList
        data={modules}
        keyExtractor={(item) => item.title}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        contentContainerStyle={{ gap: 12, paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[styles.card, index === 0 && styles.cardFeatured]}
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.8}
          >
            {/* Tag */}
            <View style={[styles.tag, index === 0 && styles.tagFeatured]}>
              <Text style={[styles.tagText, index === 0 && styles.tagTextFeatured]}>{item.tag}</Text>
            </View>

            {/* Icon */}
            <View style={[styles.iconBox, index === 0 && styles.iconBoxFeatured]}>
              <Ionicons
                name={item.icon as any}
                size={22}
                color={index === 0 ? "#fff" : COLORS.primary}
              />
            </View>

            <Text style={[styles.cardTitle, index === 0 && styles.cardTitleFeatured]}>
              {item.title}
            </Text>
            <Text style={[styles.cardSubtitle, index === 0 && styles.cardSubtitleFeatured]}>
              {item.subtitle}
            </Text>

            {/* Arrow */}
            <View style={styles.cardArrow}>
              <Ionicons
                name="arrow-forward"
                size={14}
                color={index === 0 ? "rgba(255,255,255,0.6)" : COLORS.textDim}
              />
            </View>
          </TouchableOpacity>
        )}
      />
      </View>
    </View>
  );
}

const CARD_W = (width - 52) / 2;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topAccent: {
    height: 3,
    backgroundColor: COLORS.primary,
  },
  bgGlow: {
    position: "absolute", top: -80, right: -80,
    width: 260, height: 260, borderRadius: 130,
    backgroundColor: COLORS.primary, opacity: 0.08,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 57,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#fff", fontSize: 17, fontFamily: FONT.bold },
  greeting: { color: COLORS.textMuted, fontSize: 12, fontFamily: FONT.regular },
  userName: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontFamily: FONT.extraBold,
    maxWidth: 180,
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    backgroundColor: COLORS.primaryGlow,
    justifyContent: "center",
    alignItems: "center",
  },
  idBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
  },
  idLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  idLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontFamily: FONT.bold,
    letterSpacing: 2,
    marginBottom: 2,
  },
  idValue: { color: COLORS.textPrimary, fontSize: 15, fontFamily: FONT.bold },
  rolePill: {
    backgroundColor: COLORS.white20,
    borderRadius: RADIUS.chip,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rolePillHostel: {
    backgroundColor: COLORS.primaryGlow,
    borderColor: COLORS.primaryBorder,
  },
  rolePillText: { color: COLORS.textMuted, fontSize: 10, fontFamily: FONT.bold, letterSpacing: 1 },
  roomBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  roomBadgeText: { color: COLORS.primary, fontSize: 12, fontFamily: FONT.medium },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
    marginTop: 4,
  },
  sectionTitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontFamily: FONT.bold,
    letterSpacing: 3,
  },
  sectionLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  card: {
    width: CARD_W,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    minHeight: 160,
    justifyContent: "space-between",
  },
  cardFeatured: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tag: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.white20,
    borderRadius: RADIUS.chip,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tagFeatured: {
    backgroundColor: "rgba(0,0,0,0.25)",
    borderColor: "rgba(255,255,255,0.2)",
  },
  tagText: { color: COLORS.textMuted, fontSize: 9, fontFamily: FONT.bold, letterSpacing: 1.5 },
  tagTextFeatured: { color: "rgba(255,255,255,0.8)" },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primaryGlow,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  iconBoxFeatured: {
    backgroundColor: "rgba(0,0,0,0.25)",
    borderColor: "rgba(255,255,255,0.2)",
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontFamily: FONT.bold,
    marginBottom: 4,
  },
  cardTitleFeatured: { color: "#fff" },
  cardSubtitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontFamily: FONT.regular,
    lineHeight: 16,
  },
  cardSubtitleFeatured: { color: "rgba(255,255,255,0.7)" },
  cardArrow: { alignSelf: "flex-end", marginTop: 8 },
});