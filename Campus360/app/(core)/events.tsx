import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import API from "../../utils/api";
import { COLORS, FONT, RADIUS } from "../../utils/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAlert } from "../../components/CustomAlert";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  registration_open:    { label: "Registration Open", color: COLORS.success,  bg: COLORS.successBg,  icon: "checkmark-circle-outline" },
  quiz_closed:          { label: "Quiz Closed",        color: COLORS.warning,  bg: COLORS.warningBg,  icon: "time-outline" },
  priority_calculated:  { label: "Priority Set",       color: COLORS.primary,  bg: COLORS.primaryGlow, icon: "trophy-outline" },
  seat_selection:       { label: "Seat Selection",     color: COLORS.info,     bg: COLORS.infoBg,     icon: "grid-outline" },
  completed:            { label: "Completed",           color: COLORS.textMuted, bg: COLORS.white10,   icon: "checkmark-done-outline" },
};

const ACTION_LABEL: Record<string, string> = {
  registration_open:   "Take Quiz →",
  quiz_closed:         "Results Pending",
  priority_calculated: "View Result & Book →",
  seat_selection:      "Book Your Seat →",
  completed:           "View Ticket →",
};

export default function Events() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const alert   = useAlert();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await API.get("/events");
      setEvents(res.data.events || []);
    } catch {
      alert.show({ type: "error", title: "Error", message: "Failed to load events" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, []);

  const handleAction = (event: any) => {
    const s = event.status;
    if (s === "registration_open") { router.push(`/quiz/${event._id}`); return; }
    if (["priority_calculated", "seat_selection", "completed"].includes(s)) {
      router.push(`/(core)/result/${event._id}`); return;
    }
    alert.show({ type: "info", title: "Not Available", message: "This event is not currently accepting actions." });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <View style={styles.topAccent} />
      {/* Top-right ambient glow */}
      <View style={styles.bgGlow} />

      <FlatList
        data={events}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchEvents(); }} tintColor={COLORS.primary} />}
        ListHeaderComponent={
          <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) + 10 }]}>
            <Text style={styles.title}>Events</Text>
            <Text style={styles.subtitle}>{events.length} available</Text>
          </View>
        }
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}
        renderItem={({ item }) => {
          const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.registration_open;
          const disabled = item.status === "quiz_closed";
          return (
            <View style={styles.card}>
              {/* status strip */}
              <View style={[styles.statusStrip, { backgroundColor: cfg.color }]} />

              <View style={styles.cardInner}>
                {/* Status badge */}
                <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                  <Ionicons name={cfg.icon as any} size={11} color={cfg.color} />
                  <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>

                <Text style={styles.eventTitle}>{item.title}</Text>
                {item.description ? (
                  <Text style={styles.eventDesc} numberOfLines={2}>{item.description}</Text>
                ) : null}

                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Ionicons name="calendar-outline" size={12} color={COLORS.textMuted} />
                    <Text style={styles.metaText}>{new Date(item.date).toDateString()}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="help-circle-outline" size={12} color={COLORS.textMuted} />
                    <Text style={styles.metaText}>{item.quiz?.questions?.length || 0} questions</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="timer-outline" size={12} color={COLORS.textMuted} />
                    <Text style={styles.metaText}>{item.quiz?.duration || "?"} min</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.actionBtn, disabled && styles.actionBtnDisabled]}
                  onPress={() => handleAction(item)}
                  disabled={disabled}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.actionBtnText, disabled && styles.actionBtnTextDisabled]}>
                    {ACTION_LABEL[item.status] || "View"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="calendar-outline" size={36} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>No Events Yet</Text>
            <Text style={styles.emptyText}>Check back when an admin publishes one</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background },
  topAccent: { height: 3, backgroundColor: COLORS.primary, marginBottom: 0 },
  bgGlow: {
    position: "absolute", top: -80, right: -80,
    width: 260, height: 260, borderRadius: 130,
    backgroundColor: COLORS.primary, opacity: 0.08,
  },
  header: { paddingTop: 24, paddingBottom: 20 },
  title: { color: COLORS.textPrimary, fontSize: 32, fontFamily: FONT.extraBold },
  subtitle: { color: COLORS.textMuted, fontSize: 13, fontFamily: FONT.regular, marginTop: 4 },
  card: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
    overflow: "hidden",
  },
  statusStrip: { width: 4 },
  cardInner: { flex: 1, padding: 16 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.chip,
    marginBottom: 10,
  },
  statusText: { fontSize: 11, fontFamily: FONT.semiBold },
  eventTitle: { color: COLORS.textPrimary, fontSize: 17, fontFamily: FONT.bold, marginBottom: 5 },
  eventDesc: { color: COLORS.textMuted, fontSize: 13, fontFamily: FONT.regular, lineHeight: 19, marginBottom: 12 },
  metaRow: { flexDirection: "row", gap: 14, marginBottom: 14, flexWrap: "wrap" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { color: COLORS.textMuted, fontSize: 11, fontFamily: FONT.regular },
  actionBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.sm,
    paddingVertical: 11,
    alignItems: "center",
  },
  actionBtnDisabled: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  actionBtnText: { color: "#fff", fontSize: 13, fontFamily: FONT.bold },
  actionBtnTextDisabled: { color: COLORS.textMuted },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: COLORS.primaryGlow,
    borderWidth: 1, borderColor: COLORS.primaryBorder,
    justifyContent: "center", alignItems: "center",
  },
  emptyTitle: { color: COLORS.textPrimary, fontSize: 18, fontFamily: FONT.bold },
  emptyText: { color: COLORS.textMuted, fontSize: 13, fontFamily: FONT.regular },
});