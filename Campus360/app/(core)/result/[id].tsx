import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, ScrollView, StatusBar,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import QRCode from "react-native-qrcode-svg";
import { Ionicons } from "@expo/vector-icons";
import API from "../../../utils/api";
import { COLORS, FONT, RADIUS } from "../../../utils/theme";

const SCAN_STATUS: Record<string, { label: string; color: string }> = {
  confirmed:     { label: "Not yet scanned",           color: COLORS.textMuted },
  present:       { label: "Scanned in — present",      color: COLORS.success },
  on_break:      { label: "On break",                  color: COLORS.warning },
  break_expired: { label: "Break expired — forfeited", color: COLORS.primary },
  absent:        { label: "Absent",                    color: COLORS.primary },
};

export default function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const id = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    fetchStatus();
  }, [id]);

  const fetchStatus = async () => {
    try {
      const res = await API.get(`/events/${id}/my-status`);
      setData(res.data);
    } catch (err: any) {
      console.log("Error fetching status:", err?.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (loading) {
    return (
      <View style={styles.center}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <View style={styles.loaderRing}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
        <Text style={styles.loadingTitle}>CAMPUS360</Text>
        <Text style={styles.loadingText}>Fetching your result…</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.center}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <View style={styles.errorBox}>
          <View style={styles.errorIcon}>
            <Ionicons name="alert-circle-outline" size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.errorTitle}>No Result Found</Text>
          <Text style={styles.errorSub}>
            Your result hasn't been published yet or the event ID is invalid.
          </Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── BOOKED: show QR ticket ──────────────────────────────────────────────
  if (data.booking) {
    const b = data.booking;
    const scanInfo = SCAN_STATUS[b.status] || SCAN_STATUS.confirmed;

    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <View style={styles.topAccent} />

        <TouchableOpacity style={styles.headerBackBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.pageLabel}>CAMPUS360</Text>
        <Text style={styles.pageTitle}>Your Ticket</Text>

        {/* QR Card */}
        <View style={styles.qrCard}>
          <View style={styles.qrBox}>
            <QRCode
              value={b.qrToken}
              size={180}
              color={COLORS.textPrimary}
              backgroundColor="transparent"
            />
          </View>

          <View style={styles.divider} />

          <Text style={styles.qrSeatLabel}>SEAT</Text>
          <Text style={styles.qrSeatNumber}>{b.seatNumber}</Text>

          <View style={[styles.statusChip, { backgroundColor: scanInfo.color + "20" }]}>
            <View style={[styles.statusDot, { backgroundColor: scanInfo.color }]} />
            <Text style={[styles.statusChipText, { color: scanInfo.color }]}>
              {scanInfo.label}
            </Text>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          {[
            { label: "SCORE", value: `${data.score} pts` },
            { label: "RANK", value: `#${data.priority}` },
            { label: "QR TOKEN", value: b.qrToken.slice(0, 8) + "…", mono: true },
          ].map((row, i) => (
            <View key={row.label} style={[styles.infoRow, i > 0 && styles.infoRowBorder]}>
              <Text style={styles.infoLabel}>{row.label}</Text>
              <Text style={[styles.infoValue, row.mono && styles.mono]}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* Scan History */}
        {(b.entryTime || b.exitTime) && (
          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>SCAN HISTORY</Text>
            {b.entryTime && (
              <View style={[styles.infoRow, styles.infoRowBorder]}>
                <Text style={styles.infoLabel}>ENTERED</Text>
                <Text style={[styles.infoValue, { color: COLORS.success }]}>{formatTime(b.entryTime)}</Text>
              </View>
            )}
            {b.exitTime && (
              <View style={[styles.infoRow, styles.infoRowBorder]}>
                <Text style={styles.infoLabel}>BREAK START</Text>
                <Text style={[styles.infoValue, { color: COLORS.warning }]}>{formatTime(b.exitTime)}</Text>
              </View>
            )}
            {b.reEntryTime && (
              <View style={[styles.infoRow, styles.infoRowBorder]}>
                <Text style={styles.infoLabel}>RE-ENTERED</Text>
                <Text style={[styles.infoValue, { color: COLORS.success }]}>{formatTime(b.reEntryTime)}</Text>
              </View>
            )}
          </View>
        )}

        <Text style={styles.qrHint}>
          Show this QR at the entry gate to confirm your seat.
        </Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    );
  }

  // ── NOT BOOKED: show result + booking CTA ───────────────────────────────
  const canBook =
    !data.booking && data.slotStart && new Date() >= new Date(data.slotStart);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <View style={styles.topAccent} />

      <TouchableOpacity style={styles.headerBackBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={18} color={COLORS.textPrimary} />
      </TouchableOpacity>

      <Text style={styles.pageLabel}>CAMPUS360</Text>
      <Text style={styles.pageTitle}>Your Result</Text>

      {/* Score Hero */}
      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>SCORE</Text>
        <Text style={styles.heroValue}>{data.score}</Text>
        <View style={styles.divider} />
        <View style={styles.heroRow}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatLabel}>RANK</Text>
            <Text style={styles.heroStatValue}>#{data.priority}</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatLabel}>STATUS</Text>
            <Text style={[styles.heroStatValue, { color: COLORS.success }]}>Qualified</Text>
          </View>
        </View>
      </View>

      {/* Time Slot */}
      <View style={styles.slotCard}>
        <View style={styles.slotLeft}>
          <View style={styles.slotDot} />
          <View style={{ flex: 1 }}>
            <Text style={styles.slotLabel}>ASSIGNED TIME SLOT</Text>
            <Text style={styles.slotValue}>
              {data.slotStart && data.slotEnd
                ? `${formatTime(data.slotStart)} — ${formatTime(data.slotEnd)}`
                : "Not assigned yet"}
            </Text>
          </View>
        </View>
        {data.slotStart && (
          <View style={styles.slotBadge}>
            <Text style={styles.slotBadgeText}>
              {new Date(data.slotStart).toLocaleDateString([], { month: "short", day: "numeric" })}
            </Text>
          </View>
        )}
      </View>

      {/* Book CTA */}
      <TouchableOpacity
        style={[styles.bookBtn, !canBook && styles.bookBtnDisabled]}
        disabled={!canBook}
        onPress={() => router.push(`/(core)/seat-booking/${id}`)}
        activeOpacity={0.85}
      >
        <Text style={[styles.bookBtnText, !canBook && styles.bookBtnTextDisabled]}>
          {canBook ? "Book Your Seat →" : "Booking Not Open Yet"}
        </Text>
      </TouchableOpacity>

      {!canBook && data.slotStart && (
        <Text style={styles.bookingNote}>
          Your slot opens at {formatTime(data.slotStart)}.
        </Text>
      )}
      {!canBook && !data.slotStart && (
        <Text style={styles.bookingNote}>
          Slot not assigned yet. Admin will generate priority soon.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },
  center: {
    flex: 1, justifyContent: "center", alignItems: "center",
    backgroundColor: COLORS.background, gap: 12, padding: 24,
  },
  topAccent: { height: 3, backgroundColor: COLORS.primary },
  headerBackBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    justifyContent: "center", alignItems: "center",
    marginHorizontal: 20, marginTop: 16, marginBottom: 20,
  },
  pageLabel: {
    color: COLORS.primary, fontSize: 10, fontFamily: FONT.bold,
    letterSpacing: 3, marginBottom: 4, marginHorizontal: 20,
  },
  pageTitle: {
    color: COLORS.textPrimary, fontSize: 32, fontFamily: FONT.extraBold,
    marginBottom: 24, marginHorizontal: 20,
  },

  // Loader
  loaderRing: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 2, borderColor: COLORS.primaryBorder,
    justifyContent: "center", alignItems: "center", marginBottom: 8,
  },
  loadingTitle: { color: COLORS.textPrimary, fontSize: 18, fontFamily: FONT.extraBold, letterSpacing: 2 },
  loadingText: { color: COLORS.textMuted, fontSize: 13, fontFamily: FONT.regular },

  // Error
  errorBox: {
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.lg, padding: 28, alignItems: "center", gap: 10, width: "100%",
  },
  errorIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: COLORS.primaryGlow, borderWidth: 1, borderColor: COLORS.primaryBorder,
    justifyContent: "center", alignItems: "center", marginBottom: 4,
  },
  errorTitle: { color: COLORS.primary, fontSize: 17, fontFamily: FONT.bold },
  errorSub: { color: COLORS.textMuted, fontSize: 13, fontFamily: FONT.regular, textAlign: "center", lineHeight: 20 },
  backBtn: {
    marginTop: 8, paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: RADIUS.md, borderWidth: 1,
    borderColor: COLORS.primaryBorder, backgroundColor: COLORS.primaryGlow,
  },
  backBtnText: { color: COLORS.primary, fontSize: 14, fontFamily: FONT.bold },

  // QR Card
  qrCard: {
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.xl, padding: 28, alignItems: "center",
    marginHorizontal: 20, marginBottom: 14,
  },
  qrBox: { marginBottom: 24 },
  qrSeatLabel: { color: COLORS.textMuted, fontSize: 10, fontFamily: FONT.bold, letterSpacing: 3, marginBottom: 6 },
  qrSeatNumber: { color: COLORS.textPrimary, fontSize: 48, fontFamily: FONT.extraBold, letterSpacing: -1, marginBottom: 16 },
  statusChip: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: RADIUS.chip,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusChipText: { fontSize: 13, fontFamily: FONT.semiBold },

  // Info Card
  infoCard: {
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.lg, padding: 16, marginHorizontal: 20, marginBottom: 12,
  },
  infoCardTitle: {
    color: COLORS.textMuted, fontSize: 10, fontFamily: FONT.bold,
    letterSpacing: 2, marginBottom: 12,
  },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10 },
  infoRowBorder: { borderTopWidth: 1, borderTopColor: COLORS.border },
  infoLabel: { color: COLORS.textMuted, fontSize: 10, fontFamily: FONT.bold, letterSpacing: 2 },
  infoValue: { color: COLORS.textPrimary, fontSize: 14, fontFamily: FONT.semiBold },
  mono: { fontFamily: "monospace", fontSize: 12 },
  divider: { width: "100%", height: 1, backgroundColor: COLORS.border, marginVertical: 20 },
  qrHint: { color: COLORS.textDim, fontSize: 12, fontFamily: FONT.regular, textAlign: "center", marginTop: 8, marginHorizontal: 20 },

  // Hero Score
  heroCard: {
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.xl, padding: 28, alignItems: "center",
    marginHorizontal: 20, marginBottom: 14,
  },
  heroLabel: { color: COLORS.textMuted, fontSize: 10, fontFamily: FONT.bold, letterSpacing: 3, marginBottom: 10 },
  heroValue: {
    color: COLORS.textPrimary, fontSize: 64, fontFamily: FONT.extraBold,
    letterSpacing: -2, lineHeight: 72,
  },
  heroRow: { flexDirection: "row", width: "100%", justifyContent: "space-around", alignItems: "center" },
  heroStat: { alignItems: "center", flex: 1 },
  heroStatDivider: { width: 1, height: 36, backgroundColor: COLORS.border },
  heroStatLabel: { color: COLORS.textMuted, fontSize: 10, fontFamily: FONT.bold, letterSpacing: 2, marginBottom: 6 },
  heroStatValue: { color: COLORS.textPrimary, fontSize: 22, fontFamily: FONT.bold },

  // Slot Card
  slotCard: {
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.lg, padding: 18,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginHorizontal: 20, marginBottom: 28,
  },
  slotLeft: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  slotDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
  slotLabel: { color: COLORS.textMuted, fontSize: 10, fontFamily: FONT.bold, letterSpacing: 2, marginBottom: 4 },
  slotValue: { color: COLORS.textPrimary, fontSize: 15, fontFamily: FONT.semiBold },
  slotBadge: {
    backgroundColor: COLORS.primaryGlow, borderWidth: 1, borderColor: COLORS.primaryBorder,
    borderRadius: RADIUS.xs, paddingHorizontal: 10, paddingVertical: 5,
  },
  slotBadgeText: { color: COLORS.primary, fontSize: 12, fontFamily: FONT.bold },

  // Book Button
  bookBtn: {
    backgroundColor: COLORS.primary, paddingVertical: 16,
    borderRadius: RADIUS.md, alignItems: "center", marginHorizontal: 20,
  },
  bookBtnDisabled: {
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
  },
  bookBtnText: { color: "#fff", fontSize: 15, fontFamily: FONT.bold },
  bookBtnTextDisabled: { color: COLORS.textMuted },
  bookingNote: {
    color: COLORS.textMuted, fontSize: 12, fontFamily: FONT.regular,
    textAlign: "center", marginTop: 12, marginHorizontal: 20,
  },
});