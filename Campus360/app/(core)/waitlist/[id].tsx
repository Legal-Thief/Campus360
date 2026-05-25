import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, StatusBar, RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import API from "../../../utils/api";
import { COLORS, FONT, RADIUS } from "../../../utils/theme";
import { useAlert } from "../../../components/CustomAlert";
import { useToast } from "../../../components/Toast";

export default function WaitlistScreen() {
  const params  = useLocalSearchParams();
  const router  = useRouter();
  const alert   = useAlert();
  const toast   = useToast();

  const id = typeof params.id === "string"
    ? params.id
    : Array.isArray(params.id) ? params.id[0] : "";

  const [status, setStatus]       = useState<any>(null);   // my-status data
  const [loading, setLoading]     = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing]       = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await API.get(`/events/${id}/my-status`);
      setStatus(res.data);
    } catch (err: any) {
      alert.show({
        type: "error", title: "Error",
        message: err?.response?.data?.message || "Failed to load status",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => { if (id) fetchStatus(); }, [id]);

  const handleJoin = async () => {
    try {
      setActionLoading(true);
      await API.post(`/events/${id}/waitlist/join`);
      toast.show("You've joined the waitlist!", "success");
      fetchStatus();
    } catch (err: any) {
      alert.show({
        type: "error", title: "Could Not Join",
        message: err?.response?.data?.message || "Failed to join waitlist",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    alert.show({
      type: "warning",
      title: "Leave Waitlist?",
      message: "You will lose your position. You can rejoin but may get a lower priority.",
      confirmText: "Leave",
      onConfirm: async () => {
        try {
          setActionLoading(true);
          await API.delete(`/events/${id}/waitlist/leave`);
          toast.show("Removed from waitlist", "success");
          fetchStatus();
        } catch (err: any) {
          alert.show({
            type: "error", title: "Error",
            message: err?.response?.data?.message || "Failed to leave waitlist",
          });
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.center}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <View style={styles.loaderRing}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
        <Text style={styles.loadingLabel}>CAMPUS360</Text>
        <Text style={styles.loadingText}>Checking waitlist status…</Text>
      </View>
    );
  }

  const onWaitlist  = !!status?.waitlistEntry;
  const hasBooking  = !!status?.booking;
  const priority    = status?.waitlistEntry?.priority;
  const joinedAt    = status?.waitlistEntry?.joinedAt;

  // ── Already has a booking ──────────────────────────────────────────────────
  if (hasBooking) {
    return (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <View style={styles.topAccent} />
        <View style={styles.bgGlow} />
        <Text style={styles.pageLabel}>CAMPUS360</Text>
        <Text style={styles.pageTitle}>Waitlist</Text>

        <View style={[styles.statusCard, styles.successCard]}>
          <Ionicons name="checkmark-circle" size={48} color={COLORS.success} />
          <Text style={styles.statusTitle}>Seat Secured!</Text>
          <Text style={styles.statusSub}>
            You already have seat{" "}
            <Text style={styles.highlight}>{status.booking.seatNumber}</Text> booked.
            No need for the waitlist.
          </Text>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/(core)/result/${id}`)}>
            <Text style={styles.actionBtnText}>View My Ticket</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStatus(); }}
          tintColor={COLORS.primary} />
      }
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <View style={styles.topAccent} />
      <View style={styles.bgGlow} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.pageLabel}>CAMPUS360</Text>
          <Text style={styles.pageTitle}>Waitlist</Text>
        </View>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Explanation card */}
      <View style={styles.infoCard}>
        <View style={styles.infoIconRow}>
          <Ionicons name="information-circle-outline" size={20} color={COLORS.info} />
          <Text style={styles.infoTitle}>How the Waitlist Works</Text>
        </View>
        <Text style={styles.infoText}>
          When all seats are taken, you can join the waitlist. If a student's break expires
          or they forfeit their seat, it is automatically assigned to the next person in line
          — ordered by your quiz rank.
        </Text>
      </View>

      {/* Current position card */}
      {onWaitlist ? (
        <View style={styles.positionCard}>
          <View style={styles.positionBadge}>
            <Text style={styles.positionBadgeLabel}>YOUR RANK</Text>
            <Text style={styles.positionBadgeValue}>#{priority}</Text>
          </View>
          <View style={styles.positionDetails}>
            <Text style={styles.positionTitle}>You're on the waitlist</Text>
            <Text style={styles.positionSub}>
              Joined{" "}
              {joinedAt
                ? new Date(joinedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "—"}
            </Text>
            <View style={styles.waitingPing}>
              <View style={styles.pingDot} />
              <Text style={styles.waitingText}>Waiting for a seat to open…</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Ionicons name="time-outline" size={36} color={COLORS.textDim} />
          <Text style={styles.emptyTitle}>Not on Waitlist</Text>
          <Text style={styles.emptySub}>
            All seats are full. Join the waitlist to be automatically assigned a seat
            if one becomes available.
          </Text>
        </View>
      )}

      {/* Your quiz rank info */}
      {status?.priority && (
        <View style={styles.rankCard}>
          <Text style={styles.rankLabel}>YOUR QUIZ RANK</Text>
          <Text style={styles.rankValue}>#{status.priority}</Text>
          <Text style={styles.rankNote}>
            Lower rank = higher priority. You'll be assigned a seat before students
            with a higher rank number.
          </Text>
        </View>
      )}

      {/* Action button */}
      {onWaitlist ? (
        <TouchableOpacity
          style={[styles.leaveBtn, actionLoading && styles.btnDisabled]}
          onPress={handleLeave}
          disabled={actionLoading}
          activeOpacity={0.85}
        >
          {actionLoading
            ? <ActivityIndicator size="small" color={COLORS.primary} />
            : <>
                <Ionicons name="exit-outline" size={18} color={COLORS.primary} />
                <Text style={styles.leaveBtnText}>Leave Waitlist</Text>
              </>
          }
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.joinBtn, actionLoading && styles.btnDisabled]}
          onPress={handleJoin}
          disabled={actionLoading}
          activeOpacity={0.85}
        >
          {actionLoading
            ? <ActivityIndicator size="small" color="#fff" />
            : <>
                <Ionicons name="add-circle-outline" size={18} color="#fff" />
                <Text style={styles.joinBtnText}>Join Waitlist</Text>
              </>
          }
        </TouchableOpacity>
      )}

      <Text style={styles.hint}>Pull down to refresh your status</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll:      { flex: 1, backgroundColor: COLORS.background },
  container:   { padding: 20, paddingTop: 56, paddingBottom: 40 },
  center:      { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background, gap: 10 },
  loaderRing:  { width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: COLORS.primaryBorder, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  loadingLabel:{ color: COLORS.primary, fontSize: 11, fontFamily: FONT.bold, letterSpacing: 3 },
  loadingText: { color: COLORS.textMuted, fontSize: 13, fontFamily: FONT.regular },

  topAccent:  { height: 3, backgroundColor: COLORS.primary },
  bgGlow:     { position: "absolute", top: -80, right: -80, width: 260, height: 260, borderRadius: 130, backgroundColor: COLORS.primary, opacity: 0.08 },

  header:     { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 },
  pageLabel:  { color: COLORS.primary, fontSize: 11, fontFamily: FONT.bold, letterSpacing: 3, marginBottom: 4 },
  pageTitle:  { color: COLORS.textPrimary, fontSize: 28, fontFamily: FONT.extraBold, letterSpacing: 0.2 },
  backBtn:    { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center", marginTop: 4 },

  infoCard:     { backgroundColor: COLORS.infoBg, borderWidth: 1, borderColor: "rgba(59,130,246,0.25)", borderRadius: RADIUS.card, padding: 16, marginBottom: 20 },
  infoIconRow:  { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  infoTitle:    { color: COLORS.info, fontSize: 13, fontFamily: FONT.bold },
  infoText:     { color: COLORS.textSecondary, fontSize: 13, fontFamily: FONT.regular, lineHeight: 20 },

  positionCard:   { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.primaryBorder, borderRadius: RADIUS.card, padding: 20, flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 16 },
  positionBadge:  { backgroundColor: COLORS.primaryGlow, borderWidth: 1, borderColor: COLORS.primaryBorder, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, alignItems: "center", minWidth: 72 },
  positionBadgeLabel: { color: COLORS.primary, fontSize: 9, fontFamily: FONT.bold, letterSpacing: 2, marginBottom: 4 },
  positionBadgeValue: { color: COLORS.primary, fontSize: 28, fontFamily: FONT.extraBold },
  positionDetails:    { flex: 1 },
  positionTitle:  { color: COLORS.textPrimary, fontSize: 16, fontFamily: FONT.bold, marginBottom: 4 },
  positionSub:    { color: COLORS.textMuted, fontSize: 12, fontFamily: FONT.regular, marginBottom: 10 },
  waitingPing:    { flexDirection: "row", alignItems: "center", gap: 7 },
  pingDot:        { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.warning },
  waitingText:    { color: COLORS.warning, fontSize: 12, fontFamily: FONT.medium },

  emptyCard:   { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.card, padding: 28, alignItems: "center", gap: 10, marginBottom: 16 },
  emptyTitle:  { color: COLORS.textPrimary, fontSize: 16, fontFamily: FONT.bold },
  emptySub:    { color: COLORS.textMuted, fontSize: 13, fontFamily: FONT.regular, textAlign: "center", lineHeight: 20 },

  rankCard:    { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.card, padding: 16, alignItems: "center", marginBottom: 24 },
  rankLabel:   { color: COLORS.textMuted, fontSize: 10, fontFamily: FONT.bold, letterSpacing: 2.5, marginBottom: 6 },
  rankValue:   { color: COLORS.textPrimary, fontSize: 36, fontFamily: FONT.extraBold, marginBottom: 8 },
  rankNote:    { color: COLORS.textMuted, fontSize: 12, fontFamily: FONT.regular, textAlign: "center", lineHeight: 18 },

  joinBtn:        { backgroundColor: COLORS.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: RADIUS.button, marginBottom: 12 },
  joinBtnText:    { color: "#fff", fontSize: 15, fontFamily: FONT.bold, letterSpacing: 0.4 },
  leaveBtn:       { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.primaryBorder, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: RADIUS.button, marginBottom: 12 },
  leaveBtnText:   { color: COLORS.primary, fontSize: 15, fontFamily: FONT.bold, letterSpacing: 0.4 },
  btnDisabled:    { opacity: 0.5 },

  actionBtn:     { marginTop: 16, backgroundColor: COLORS.primary, paddingVertical: 12, paddingHorizontal: 24, borderRadius: RADIUS.button },
  actionBtnText: { color: "#fff", fontFamily: FONT.bold, fontSize: 14 },

  statusCard:    { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.xl, padding: 28, alignItems: "center", gap: 10, marginTop: 16 },
  successCard:   { borderColor: COLORS.successBorder, backgroundColor: COLORS.successBg },
  statusTitle:   { color: COLORS.textPrimary, fontSize: 20, fontFamily: FONT.extraBold },
  statusSub:     { color: COLORS.textMuted, fontSize: 14, fontFamily: FONT.regular, textAlign: "center", lineHeight: 22 },
  highlight:     { color: COLORS.success, fontFamily: FONT.bold },

  hint:    { color: COLORS.textDim, fontSize: 12, fontFamily: FONT.regular, textAlign: "center", marginTop: 4 },
});
