import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  StatusBar, TouchableOpacity, RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import API from "../../utils/api";
import { COLORS, FONT, RADIUS } from "../../utils/theme";

export default function AdminWaitlistScreen() {
  const params    = useLocalSearchParams();
  const router    = useRouter();
  const eventId   = typeof params.eventId   === "string" ? params.eventId   : "";
  const eventTitle= typeof params.eventTitle === "string" ? params.eventTitle : "Event";

  const [waitlist, setWaitlist]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWaitlist = async () => {
    try {
      const res = await API.get(`/events/${eventId}/waitlist`);
      setWaitlist(res.data.waitlist || []);
    } catch (e) {
      console.error("Waitlist fetch error", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { if (eventId) fetchWaitlist(); }, [eventId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading waitlist…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <View style={styles.topAccent} />
      <View style={styles.rightBar} />
      <View style={styles.bgGlow} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.pageLabel}>ADMIN</Text>
          <Text style={styles.pageTitle}>Waitlist</Text>
          <Text style={styles.eventName} numberOfLines={1}>{eventTitle}</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{waitlist.length}</Text>
        </View>
      </View>

      {waitlist.length === 0 ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIcon}>
            <Ionicons name="people-outline" size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyTitle}>No one on waitlist</Text>
          <Text style={styles.emptyText}>Students will appear here when all seats are taken.</Text>
        </View>
      ) : (
        <FlatList
          data={waitlist}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchWaitlist(); }}
              tintColor={COLORS.primary}
            />
          }
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <View style={styles.card}>
              <View style={styles.rankCol}>
                <Text style={styles.rankNum}>#{index + 1}</Text>
                <Text style={styles.rankLabel}>QUEUE</Text>
              </View>
              <View style={styles.cardDivider} />
              <View style={styles.cardBody}>
                <Text style={styles.studentName}>{item.userId?.name || "—"}</Text>
                <Text style={styles.studentId}>{item.userId?.studentId || item.userId?.email || "—"}</Text>
                <View style={styles.metaRow}>
                  <View style={styles.priorityChip}>
                    <Ionicons name="trophy-outline" size={11} color={COLORS.warning} />
                    <Text style={styles.priorityChipText}>Quiz Rank #{item.priority}</Text>
                  </View>
                  <Text style={styles.joinedAt}>
                    Joined {item.joinedAt
                      ? new Date(item.joinedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : "—"}
                  </Text>
                </View>
              </View>
            </View>
          )}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Ionicons name="information-circle-outline" size={14} color={COLORS.textMuted} />
              <Text style={styles.listHeaderText}>
                Ordered by quiz rank — lowest number gets the next available seat automatically.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 20, paddingTop: 60 },
  center:      { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background, gap: 10 },
  loadingText: { color: COLORS.textMuted, fontSize: 13, fontFamily: FONT.regular },
  topAccent:   { position: "absolute", top: 0, left: 0, right: 0, height: 3, backgroundColor: COLORS.primary },
  rightBar:    { position: "absolute", top: 0, right: 0, width: 3, height: 120, backgroundColor: COLORS.primary, opacity: 0.5 },
  bgGlow:      { position: "absolute", top: -80, right: -80, width: 240, height: 240, borderRadius: 120, backgroundColor: COLORS.primary, opacity: 0.07 },

  header:      { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  backBtn:     { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  pageLabel:   { color: COLORS.primary, fontSize: 10, fontFamily: FONT.bold, letterSpacing: 3, marginBottom: 2 },
  pageTitle:   { color: COLORS.textPrimary, fontSize: 24, fontFamily: FONT.extraBold },
  eventName:   { color: COLORS.textMuted, fontSize: 12, fontFamily: FONT.regular, marginTop: 2 },
  countBadge:  { backgroundColor: COLORS.primaryGlow, borderWidth: 1, borderColor: COLORS.primaryBorder, width: 44, height: 44, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  countText:   { color: COLORS.primary, fontSize: 18, fontFamily: FONT.extraBold },

  listHeader:     { flexDirection: "row", alignItems: "flex-start", gap: 7, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.sm, padding: 12, marginBottom: 14 },
  listHeaderText: { color: COLORS.textMuted, fontSize: 12, fontFamily: FONT.regular, flex: 1, lineHeight: 18 },

  card:        { flexDirection: "row", backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.card, marginBottom: 10, overflow: "hidden" },
  rankCol:     { width: 56, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.background, padding: 12 },
  rankNum:     { color: COLORS.primary, fontSize: 20, fontFamily: FONT.extraBold },
  rankLabel:   { color: COLORS.textDim, fontSize: 8, fontFamily: FONT.bold, letterSpacing: 1.5, marginTop: 2 },
  cardDivider: { width: 1, backgroundColor: COLORS.border },
  cardBody:    { flex: 1, padding: 14, gap: 4 },
  studentName: { color: COLORS.textPrimary, fontSize: 15, fontFamily: FONT.bold },
  studentId:   { color: COLORS.textMuted, fontSize: 12, fontFamily: FONT.regular },
  metaRow:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 },
  priorityChip:{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: COLORS.warningBg, borderWidth: 1, borderColor: COLORS.warningBorder, borderRadius: RADIUS.chip, paddingHorizontal: 8, paddingVertical: 3 },
  priorityChipText: { color: COLORS.warning, fontSize: 10, fontFamily: FONT.bold },
  joinedAt:    { color: COLORS.textDim, fontSize: 11, fontFamily: FONT.regular },

  emptyWrap:  { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyIcon:  { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.primaryGlow, borderWidth: 1, borderColor: COLORS.primaryBorder, justifyContent: "center", alignItems: "center" },
  emptyTitle: { color: COLORS.textPrimary, fontSize: 17, fontFamily: FONT.bold },
  emptyText:  { color: COLORS.textMuted, fontSize: 13, fontFamily: FONT.regular, textAlign: "center" },
});
