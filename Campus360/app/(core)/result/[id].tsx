import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, StatusBar } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import QRCode from "react-native-qrcode-svg";
import API from "../../../utils/api";
import { COLORS, FONT, RADIUS } from "../../../utils/theme";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAlert } from "../../../components/CustomAlert";

export default function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const id = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!id) { setLoading(false); return; } fetchStatus(); }, [id]);

  const fetchStatus = async () => {
    try {
      const res = await API.get(`/events/${id}/my-status`);
      setData(res.data);
    } catch (err: any) { console.log("Error fetching status:", err?.response?.data || err); }
    finally { setLoading(false); }
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (loading) {
    return (
      <View style={styles.center}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <View style={styles.loaderRing}><ActivityIndicator size="large" color={COLORS.primary} /></View>
        <Text style={styles.loadingLabel}>CAMPUS360</Text>
        <Text style={styles.loadingText}>Fetching your result…</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.center}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={40} color={COLORS.primary} />
          <Text style={styles.errorTitle}>No Result Found</Text>
          <Text style={styles.errorSub}>Your result hasn't been published yet or the event ID is invalid.</Text>
        </View>
      </View>
    );
  }

  const canBook = !data.booking && data.slotStart && new Date() >= new Date(data.slotStart);

  //  QR / Ticket view 
  if (data.booking) {
    const b = data.booking;
    const scanStatus: Record<string, { label: string; color: string }> = {
      confirmed:     { label: "Not yet scanned",             color: COLORS.textMuted },
      present:       { label: "Scanned in — present",        color: COLORS.success },
      on_break:      { label: "On break",                    color: COLORS.warning },
      break_expired: { label: "Break expired — seat forfeited", color: COLORS.primary },
      absent:        { label: "Absent",                      color: COLORS.primary },
    };
    const scanInfo = scanStatus[b.status] || scanStatus.confirmed;

    return (
      <ScrollView style={{ flex: 1, backgroundColor: COLORS.background }} contentContainerStyle={styles.qrContainer} showsVerticalScrollIndicator={false}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <View style={styles.topAccent} />
        <View style={styles.bgGlow} />
        <Text style={styles.pageLabel}>CAMPUS360</Text>
        <Text style={styles.pageTitle}>Your Ticket</Text>

        <View style={styles.qrCard}>
          <View style={styles.qrBox}>
            <QRCode value={b.qrToken} size={180} color={COLORS.textPrimary} backgroundColor="transparent" />
          </View>
          <View style={styles.qrDivider} />
          <Text style={styles.qrSeatLabel}>SEAT</Text>
          <Text style={styles.qrSeatNumber}>{b.seatNumber}</Text>
          <View style={[styles.statusChip, { backgroundColor: scanInfo.color + "22" }]}>
            <View style={[styles.statusDot, { backgroundColor: scanInfo.color }]} />
            <Text style={[styles.statusChipText, { color: scanInfo.color }]}>{scanInfo.label}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          {[
            { label: "SCORE", value: `${data.score} pts` },
            { label: "RANK",  value: `#${data.priority}` },
            { label: "QR TOKEN", value: b.qrToken.slice(0, 8) + "…", mono: true },
          ].map((row) => (
            <View key={row.label} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{row.label}</Text>
              <Text style={[styles.infoValue, row.mono && styles.mono]}>{row.value}</Text>
            </View>
          ))}
        </View>

        {(b.entryTime || b.exitTime) && (
          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Scan History</Text>
            {b.entryTime && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>ENTERED</Text>
                <Text style={[styles.infoValue, { color: COLORS.success }]}>{formatTime(b.entryTime)}</Text>
              </View>
            )}
            {b.exitTime && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>BREAK START</Text>
                <Text style={[styles.infoValue, { color: COLORS.warning }]}>{formatTime(b.exitTime)}</Text>
              </View>
            )}
            {b.reEntryTime && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>RE-ENTERED</Text>
                <Text style={[styles.infoValue, { color: COLORS.success }]}>{formatTime(b.reEntryTime)}</Text>
              </View>
            )}
          </View>
        )}

        <Text style={styles.qrHint}>Show this QR code at the entry gate to confirm your seat.</Text>

        {/* OD Status Link */}
        <TouchableOpacity
          style={styles.odLink}
          onPress={() => router.push(`/(core)/my-od/${id}`)}
          activeOpacity={0.85}
        >
          <Ionicons name="ribbon-outline" size={16} color={COLORS.success} />
          <Text style={styles.odLinkText}>View OD / Attendance Status</Text>
          <Ionicons name="chevron-forward" size={14} color={COLORS.success} />
        </TouchableOpacity>
      </ScrollView>
    );
  }

  //  Result / score view
  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 20) + 16 }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <View style={styles.topAccent} />
      <View style={styles.bgGlow} />

      <View style={styles.pageHeader}>
        <Text style={styles.pageLabel}>CAMPUS360</Text>
        <Text style={styles.pageTitle}>Your Result</Text>
      </View>

      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>SCORE</Text>
        <Text style={styles.heroValue}>{data.score}</Text>
        <View style={styles.heroDivider} />
        <View style={styles.heroRow}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatLabel}>RANK</Text>
            <Text style={styles.heroStatValue}>{data.priority}</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatLabel}>STATUS</Text>
            <Text style={[styles.heroStatValue, { color: COLORS.success }]}>Qualified</Text>
          </View>
        </View>
      </View>

      <View style={styles.slotCard}>
        <View style={styles.slotLeft}>
          <View style={styles.slotDot} />
          <View>
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

      <TouchableOpacity
        style={[styles.button, !canBook && styles.buttonDisabled]}
        disabled={!canBook}
        onPress={() => router.push(`/(core)/seat-booking/${id}`)}
        activeOpacity={0.85}
      >
        <Text style={styles.buttonText}>{canBook ? "Book Your Seat" : "Booking Not Open Yet"}</Text>
      </TouchableOpacity>

      {!canBook && (
        <Text style={styles.bookingNote}>
          {data.slotStart
            ? `Your slot opens at ${formatTime(data.slotStart)}.`
            : "Slot not assigned yet. Admin will generate priority soon."}
        </Text>
      )}

      {/* Waitlist button — shown when slot is active but booking not yet possible (seats full) */}
      {data.slotStart && (
        <TouchableOpacity
          style={styles.waitlistBtn}
          onPress={() => router.push(`/(core)/waitlist/${id}`)}
          activeOpacity={0.85}
        >
          <Ionicons name="list-outline" size={16} color={COLORS.textMuted} />
          <Text style={styles.waitlistBtnText}>Join Waitlist (if seats are full)</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 20, paddingTop: 64 },
  center:    { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background, gap: 12, padding: 24 },
  loaderRing:   { width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: COLORS.primaryBorder, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  loadingLabel: { color: COLORS.primary, fontSize: 11, fontFamily: FONT.bold, letterSpacing: 3 },
  loadingText:  { color: COLORS.textMuted, fontSize: 13, fontFamily: FONT.regular },
  errorBox:  { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, padding: 28, alignItems: "center", gap: 10 },
  errorTitle:{ color: COLORS.primary, fontSize: 17, fontFamily: FONT.bold },
  errorSub:  { color: COLORS.textMuted, fontSize: 13, fontFamily: FONT.regular, textAlign: "center", lineHeight: 20 },

  topAccent: { height: 3, backgroundColor: COLORS.primary },
  bgGlow:    { position: "absolute", top: -80, right: -80, width: 260, height: 260, borderRadius: 130, backgroundColor: COLORS.primary, opacity: 0.08 },

  pageHeader:   { marginBottom: 28 },
  pageLabel:    { color: COLORS.primary, fontSize: 11, fontFamily: FONT.bold, letterSpacing: 3, marginBottom: 4 },
  pageTitle:    { color: COLORS.textPrimary, fontSize: 28, fontFamily: FONT.extraBold, letterSpacing: 0.2 },

  heroCard: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 20, padding: 28, alignItems: "center", marginBottom: 16 },
  heroLabel:    { color: COLORS.textMuted, fontSize: 11, fontFamily: FONT.bold, letterSpacing: 3, marginBottom: 10 },
  heroValue:    { color: COLORS.textPrimary, fontSize: 56, fontFamily: FONT.extraBold, letterSpacing: -1, lineHeight: 64 },
  heroDivider:  { width: "100%", height: 1, backgroundColor: COLORS.border, marginVertical: 20 },
  heroRow:      { flexDirection: "row", width: "100%", justifyContent: "space-around", alignItems: "center" },
  heroStat:     { alignItems: "center", flex: 1 },
  heroStatDivider: { width: 1, height: 36, backgroundColor: COLORS.border },
  heroStatLabel: { color: COLORS.textMuted, fontSize: 10, fontFamily: FONT.bold, letterSpacing: 2, marginBottom: 6 },
  heroStatValue: { color: COLORS.textPrimary, fontSize: 22, fontFamily: FONT.bold },

  slotCard:   { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, padding: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 32 },
  slotLeft:   { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  slotDot:    { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
  slotLabel:  { color: COLORS.textMuted, fontSize: 10, fontFamily: FONT.bold, letterSpacing: 2, marginBottom: 4 },
  slotValue:  { color: COLORS.textPrimary, fontSize: 15, fontFamily: FONT.semiBold, letterSpacing: 0.3 },
  slotBadge:  { backgroundColor: COLORS.primaryGlow, borderWidth: 1, borderColor: COLORS.primaryBorder, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  slotBadgeText: { color: COLORS.primary, fontSize: 12, fontFamily: FONT.bold },

  button:         { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 14, alignItems: "center" },
  buttonDisabled: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  buttonText:     { color: "#fff", fontSize: 15, fontFamily: FONT.bold, letterSpacing: 0.5 },
  bookingNote:    { color: COLORS.textMuted, fontSize: 12, fontFamily: FONT.regular, textAlign: "center", marginTop: 12 },

  qrContainer:  { padding: 24, paddingTop: 64, alignItems: "center" },
  qrCard:       { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 24, padding: 28, alignItems: "center", width: "100%", marginBottom: 16 },
  qrBox:        { marginBottom: 24 },
  qrDivider:    { width: "100%", height: 1, backgroundColor: COLORS.border, marginBottom: 20 },
  qrSeatLabel:  { color: COLORS.textMuted, fontSize: 11, fontFamily: FONT.bold, letterSpacing: 3, marginBottom: 6 },
  qrSeatNumber: { color: COLORS.textPrimary, fontSize: 44, fontFamily: FONT.extraBold, letterSpacing: -1, marginBottom: 16 },
  statusChip:   { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999 },
  statusDot:    { width: 8, height: 8, borderRadius: 4 },
  statusChipText: { fontSize: 13, fontFamily: FONT.semiBold },
  infoCard:     { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, padding: 18, width: "100%", marginBottom: 12 },
  sectionTitle: { color: COLORS.textPrimary, fontSize: 14, fontFamily: FONT.bold, marginBottom: 14 },
  infoRow:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  infoLabel:    { color: COLORS.textMuted, fontSize: 10, fontFamily: FONT.bold, letterSpacing: 2 },
  infoValue:    { color: COLORS.textPrimary, fontSize: 14, fontFamily: FONT.semiBold },
  mono:         { fontFamily: "monospace", fontSize: 12 },
  qrHint:       { color: COLORS.textDim, fontSize: 12, fontFamily: FONT.regular, textAlign: "center", marginTop: 8, lineHeight: 18 },
  odLink:       { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: COLORS.successBg, borderWidth: 1, borderColor: COLORS.successBorder, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, width: "100%", marginTop: 4 },
  odLinkText:   { color: COLORS.success, fontSize: 13, fontFamily: FONT.semiBold, flex: 1 },
  waitlistBtn:  { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, marginTop: 10 },
  waitlistBtnText: { color: COLORS.textMuted, fontSize: 13, fontFamily: FONT.medium, flex: 1 },
});
