import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ActivityIndicator,
  ScrollView, StatusBar, TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import API from "../../../utils/api";
import { COLORS, FONT, RADIUS } from "../../../utils/theme";
import { useAlert } from "../../../components/CustomAlert";

export default function MyODScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const alert  = useAlert();

  const id = typeof params.id === "string"
    ? params.id
    : Array.isArray(params.id) ? params.id[0] : "";

  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    fetchOD();
  }, [id]);

  const fetchOD = async () => {
    try {
      const res = await API.get(`/events/${id}/my-od`);
      setData(res.data);
    } catch (err: any) {
      alert.show({
        type: "error", title: "Error",
        message: err?.response?.data?.message || "Could not fetch OD status",
      });
    } finally {
      setLoading(false);
    }
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
        <Text style={styles.loadingText}>Fetching your OD status…</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.center}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <View style={styles.errorBox}>
          <Ionicons name="document-outline" size={40} color={COLORS.textDim} />
          <Text style={styles.errorTitle}>No Data Found</Text>
          <Text style={styles.errorSub}>
            OD details are not available yet, or you did not attend this event.
          </Text>
          <TouchableOpacity style={styles.backBtnSolo} onPress={() => router.back()}>
            <Text style={styles.backBtnSoloText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const issued      = data.odIssued;
  const mins        = data.attendedMinutes ?? 0;
  const hours       = Math.floor(mins / 60);
  const minutesPart = mins % 60;

  // Build visual ring percentage (capped at 100)
  const percent = Math.min(100, Math.round((mins / Math.max(mins + 30, 1)) * 100));

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <View style={styles.topAccent} />
      <View style={styles.bgGlow} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.pageLabel}>CAMPUS360</Text>
          <Text style={styles.pageTitle}>OD Certificate</Text>
        </View>
      </View>

      {/* Status hero */}
      <View style={[styles.heroCard, issued ? styles.heroSuccess : styles.heroDanger]}>
        <View style={[styles.iconCircle, { backgroundColor: issued ? COLORS.successBg : COLORS.dangerBg }]}>
          <Ionicons
            name={issued ? "ribbon-outline" : "close-circle-outline"}
            size={40}
            color={issued ? COLORS.success : COLORS.primary}
          />
        </View>
        <Text style={[styles.heroStatus, { color: issued ? COLORS.success : COLORS.primary }]}>
          {issued ? "OD Issued" : "OD Not Issued"}
        </Text>
        <Text style={styles.heroMessage}>{data.message}</Text>
      </View>

      {/* Attendance detail */}
      <View style={styles.attendCard}>
        <Text style={styles.sectionLabel}>ATTENDANCE BREAKDOWN</Text>

        <View style={styles.timeRow}>
          <View style={styles.timeStat}>
            <Ionicons name="time-outline" size={20} color={COLORS.primary} />
            <Text style={styles.timeStatLabel}>HOURS</Text>
            <Text style={styles.timeStatValue}>{hours}</Text>
          </View>
          <View style={styles.timeDivider} />
          <View style={styles.timeStat}>
            <Ionicons name="hourglass-outline" size={20} color={COLORS.primary} />
            <Text style={styles.timeStatLabel}>MINUTES</Text>
            <Text style={styles.timeStatValue}>{minutesPart}</Text>
          </View>
          <View style={styles.timeDivider} />
          <View style={styles.timeStat}>
            <Ionicons name="bar-chart-outline" size={20} color={COLORS.primary} />
            <Text style={styles.timeStatLabel}>TOTAL MINS</Text>
            <Text style={styles.timeStatValue}>{mins}</Text>
          </View>
        </View>
      </View>

      {/* Duration string */}
      <View style={styles.durationCard}>
        <Ionicons name="checkmark-done-circle-outline" size={20} color={COLORS.textMuted} />
        <Text style={styles.durationText}>
          You attended{" "}
          <Text style={styles.durationHighlight}>{data.durationString || "0 minutes"}</Text>
          {" "}of this event.
        </Text>
      </View>

      {/* OD eligibility explanation */}
      {!issued && mins > 0 && (
        <View style={styles.tipCard}>
          <Ionicons name="information-circle-outline" size={18} color={COLORS.warning} />
          <Text style={styles.tipText}>
            OD is issued to students who attend at least{" "}
            <Text style={{ color: COLORS.warning, fontFamily: FONT.bold }}>50%</Text>
            {" "}of the event duration. Keep attending future events!
          </Text>
        </View>
      )}

      {/* OD badge — shown if issued */}
      {issued && (
        <View style={styles.certificateBadge}>
          <Ionicons name="shield-checkmark" size={24} color={COLORS.success} />
          <View style={{ flex: 1 }}>
            <Text style={styles.certTitle}>On-Duty Certificate</Text>
            <Text style={styles.certSub}>
              Your attendance qualifies for an official OD letter. Contact your faculty coordinator to collect it.
            </Text>
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.backBtnBottom} onPress={() => router.back()} activeOpacity={0.85}>
        <Text style={styles.backBtnBottomText}>Back to Event</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll:      { flex: 1, backgroundColor: COLORS.background },
  container:   { padding: 20, paddingTop: 56, paddingBottom: 48 },
  center:      { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background, gap: 12, padding: 24 },
  loaderRing:  { width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: COLORS.primaryBorder, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  loadingLabel:{ color: COLORS.primary, fontSize: 11, fontFamily: FONT.bold, letterSpacing: 3 },
  loadingText: { color: COLORS.textMuted, fontSize: 13, fontFamily: FONT.regular },
  errorBox:    { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, padding: 28, alignItems: "center", gap: 10 },
  errorTitle:  { color: COLORS.textPrimary, fontSize: 17, fontFamily: FONT.bold },
  errorSub:    { color: COLORS.textMuted, fontSize: 13, fontFamily: FONT.regular, textAlign: "center", lineHeight: 20 },
  backBtnSolo: { marginTop: 8, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, paddingVertical: 10, paddingHorizontal: 24, borderRadius: RADIUS.button },
  backBtnSoloText: { color: COLORS.textMuted, fontFamily: FONT.medium, fontSize: 14 },

  topAccent:  { height: 3, backgroundColor: COLORS.primary },
  bgGlow:     { position: "absolute", top: -80, right: -80, width: 260, height: 260, borderRadius: 130, backgroundColor: COLORS.primary, opacity: 0.08 },

  header:     { flexDirection: "row", alignItems: "center", marginBottom: 28 },
  backBtn:    { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  pageLabel:  { color: COLORS.primary, fontSize: 11, fontFamily: FONT.bold, letterSpacing: 3, marginBottom: 2 },
  pageTitle:  { color: COLORS.textPrimary, fontSize: 26, fontFamily: FONT.extraBold },

  heroCard:    { borderWidth: 1, borderRadius: RADIUS.xl, padding: 28, alignItems: "center", gap: 12, marginBottom: 16 },
  heroSuccess: { backgroundColor: COLORS.successBg, borderColor: COLORS.successBorder },
  heroDanger:  { backgroundColor: COLORS.dangerBg, borderColor: COLORS.primaryBorder },
  iconCircle:  { width: 72, height: 72, borderRadius: 36, justifyContent: "center", alignItems: "center" },
  heroStatus:  { fontSize: 20, fontFamily: FONT.extraBold, letterSpacing: 0.3 },
  heroMessage: { color: COLORS.textSecondary, fontSize: 14, fontFamily: FONT.regular, textAlign: "center", lineHeight: 22 },

  attendCard:  { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.card, padding: 20, marginBottom: 14 },
  sectionLabel:{ color: COLORS.textMuted, fontSize: 10, fontFamily: FONT.bold, letterSpacing: 2.5, marginBottom: 18 },
  timeRow:     { flexDirection: "row", justifyContent: "space-around", alignItems: "center" },
  timeStat:    { alignItems: "center", flex: 1, gap: 6 },
  timeDivider: { width: 1, height: 48, backgroundColor: COLORS.border },
  timeStatLabel: { color: COLORS.textMuted, fontSize: 9, fontFamily: FONT.bold, letterSpacing: 2, marginTop: 2 },
  timeStatValue: { color: COLORS.textPrimary, fontSize: 28, fontFamily: FONT.extraBold },

  durationCard:  { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.card, padding: 16, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  durationText:  { color: COLORS.textSecondary, fontSize: 14, fontFamily: FONT.regular, flex: 1, lineHeight: 22 },
  durationHighlight: { color: COLORS.textPrimary, fontFamily: FONT.bold },

  tipCard:   { backgroundColor: COLORS.warningBg, borderWidth: 1, borderColor: COLORS.warningBorder, borderRadius: RADIUS.card, padding: 14, flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 20 },
  tipText:   { color: COLORS.textSecondary, fontSize: 13, fontFamily: FONT.regular, flex: 1, lineHeight: 20 },

  certificateBadge: { backgroundColor: COLORS.successBg, borderWidth: 1, borderColor: COLORS.successBorder, borderRadius: RADIUS.card, padding: 16, flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 24 },
  certTitle:  { color: COLORS.success, fontSize: 14, fontFamily: FONT.bold, marginBottom: 4 },
  certSub:    { color: COLORS.textSecondary, fontSize: 12, fontFamily: FONT.regular, lineHeight: 18 },

  backBtnBottom:     { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, paddingVertical: 14, borderRadius: RADIUS.button, alignItems: "center" },
  backBtnBottomText: { color: COLORS.textMuted, fontFamily: FONT.semiBold, fontSize: 14 },
});
