import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, FlatList, ScrollView, StatusBar } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import API from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { COLORS, FONT, RADIUS } from "../utils/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAlert } from "../components/CustomAlert";

type EventOption = { _id: string; title: string; date: string; status: string; clubName?: string; venue?: string };
type ScanResult = {
  success: boolean; scanType?: "entry" | "exit" | "reentry"; message?: string;
  booking?: { studentName: string; studentId: string; seatNumber: string; eventTitle: string; status: string; entryTime?: string; exitTime?: string; reEntryTime?: string };
};

const SCAN_COLORS: Record<string, string> = { entry: COLORS.success, exit: COLORS.warning, reentry: COLORS.primary };
const SCAN_ICONS: Record<string, string>  = { entry: "log-in-outline", exit: "walk-outline", reentry: "refresh-outline" };
const fmtTime = (iso?: string) => iso ? new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—";

export default function QRScannerScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const alert  = useAlert();
  const [permission, requestPermission] = useCameraPermissions();
  const [events, setEvents]           = useState<EventOption[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EventOption | null>(null);
  const [scanning, setScanning]       = useState(false);
  const [processing, setProcessing]   = useState(false);
  const [result, setResult]           = useState<ScanResult | null>(null);
  const [showManual, setShowManual]   = useState(false);
  const [manualToken, setManualToken] = useState("");
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  const loadEvents = useCallback(async () => {
    try {
      setEventsLoading(true);
      const res = isAdmin ? await API.get("/events/all") : await API.get("/events/my-scanner-events");
      setEvents(res.data.events ?? []);
    } catch { alert.show({ type: "error", title: "Error", message: "Failed to load events" }); }
    finally { setEventsLoading(false); }
  }, [isAdmin]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const handleScan = async (token: string) => {
    if (processing || !selectedEvent) return;
    setProcessing(true); setScanning(false);
    try {
      const res = await API.post(`/events/${selectedEvent._id}/scan-qr`, { qrToken: token, eventId: selectedEvent._id });
      setResult(res.data);
    } catch (err: any) {
      setResult({ success: false, message: err?.response?.data?.message || "Invalid or unknown QR code" });
    } finally { setProcessing(false); }
  };

  const resetScan   = () => { setResult(null); setScanning(true); setManualToken(""); setShowManual(false); };
  const deselectEvent = () => { setSelectedEvent(null); setScanning(false); resetScan(); };

  if (!user) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <View style={styles.topAccent} />
        <InfoBox icon="lock-closed-outline" title="Not Logged In" sub="Please log in to access the scanner." />
      </View>
    );
  }

  if (!permission) return <View style={styles.container} />;

  // ── Event picker ──
  if (!selectedEvent) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <View style={styles.topAccent} />
        <View style={styles.bgGlow} />
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>QR Scanner</Text>
            <Text style={styles.headerSub}>Select the event to begin scanning</Text>
          </View>
        </View>

        <View style={styles.infoStrip}>
          <Ionicons name="shield-checkmark-outline" size={14} color={COLORS.primary} />
          <Text style={styles.infoStripText}>
            {isAdmin ? "You have admin access to all events." : "Showing events where you are an authorized scanner."}
          </Text>
        </View>

        {eventsLoading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : events.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}><Ionicons name="qr-code-outline" size={32} color={COLORS.primary} /></View>
            <Text style={styles.emptyTitle}>No Events Available</Text>
            <Text style={styles.emptySub}>{isAdmin ? "Create an event first." : "You have not been assigned as a scanner for any event."}</Text>
          </View>
        ) : (
          <FlatList
            data={events}
            keyExtractor={(e) => e._id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.eventCard} onPress={() => { setSelectedEvent(item); setScanning(true); }} activeOpacity={0.75}>
                <View style={styles.eventCardIcon}>
                  <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventCardTitle}>{item.title}</Text>
                  {item.clubName ? (
                    <View style={styles.clubRow}>
                      <Ionicons name="people-outline" size={11} color={COLORS.primary} />
                      <Text style={styles.clubName}>{item.clubName}</Text>
                    </View>
                  ) : null}
                  <Text style={styles.eventCardMeta}>
                    {new Date(item.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    {item.venue ? `  ·  ${item.venue}` : ""}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textDim} />
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    );
  }

  // ── Scanner view ──
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <View style={styles.topAccent} />
      <View style={styles.bgGlow} />
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={deselectEvent} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>{selectedEvent.title}</Text>
          <Text style={styles.headerSub}>
            {selectedEvent.clubName ? `${selectedEvent.clubName}  ·  ` : ""}
            {new Date(selectedEvent.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
        {!permission.granted && (
          <View style={styles.permissionBox}>
            <View style={styles.emptyIcon}><Ionicons name="camera-outline" size={32} color={COLORS.primary} /></View>
            <Text style={styles.permissionTitle}>Camera Access Required</Text>
            <Text style={styles.permissionSub}>Camera permission is needed to scan student QR codes at the entry gate.</Text>
            <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
              <Text style={styles.permissionBtnText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        )}

        {permission.granted && scanning && !result && (
          <View style={styles.cameraWrap}>
            <CameraView style={styles.camera} barcodeScannerSettings={{ barcodeTypes: ["qr"] }} onBarcodeScanned={({ data }) => handleScan(data)}>
              <View style={styles.overlay}>
                <View style={styles.scanFrame} />
                <Text style={styles.scanHint}>Align QR code within the frame</Text>
              </View>
            </CameraView>
          </View>
        )}

        {processing && (
          <View style={styles.processingBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.processingText}>Verifying QR code…</Text>
          </View>
        )}

        {result && (
          <View style={styles.resultBox}>
            {result.success && result.booking ? (
              <>
                <View style={[styles.resultIcon, { backgroundColor: SCAN_COLORS[result.scanType!] + "22" }]}>
                  <Ionicons name={SCAN_ICONS[result.scanType!] as any} size={36} color={SCAN_COLORS[result.scanType!]} />
                </View>
                <Text style={[styles.resultStatus, { color: SCAN_COLORS[result.scanType!] }]}>{result.message}</Text>
                <View style={styles.studentCard}>
                  {[
                    { label: "NAME",       value: result.booking.studentName },
                    { label: "STUDENT ID", value: result.booking.studentId },
                    { label: "SEAT",       value: result.booking.seatNumber },
                    { label: "EVENT",      value: result.booking.eventTitle },
                    { label: "STATUS",     value: result.booking.status?.replace(/_/g, " ") },
                    { label: "ENTRY",      value: fmtTime(result.booking.entryTime) },
                    ...(result.booking.exitTime   ? [{ label: "BREAK OUT", value: fmtTime(result.booking.exitTime) }]    : []),
                    ...(result.booking.reEntryTime? [{ label: "BREAK IN",  value: fmtTime(result.booking.reEntryTime) }] : []),
                  ].map((row) => (
                    <View key={row.label} style={styles.studentRow}>
                      <Text style={styles.studentLabel}>{row.label}</Text>
                      <Text style={styles.studentValue}>{row.value}</Text>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <>
                <View style={[styles.resultIcon, { backgroundColor: COLORS.primaryGlow }]}>
                  <Ionicons name="close-circle-outline" size={36} color={COLORS.primary} />
                </View>
                <Text style={[styles.resultStatus, { color: COLORS.primary }]}>Scan Failed</Text>
                <Text style={styles.resultError}>{result.message}</Text>
              </>
            )}
            <TouchableOpacity style={styles.resetBtn} onPress={resetScan} activeOpacity={0.85}>
              <Ionicons name="qr-code-outline" size={16} color="#fff" />
              <Text style={styles.resetBtnText}>Scan Next</Text>
            </TouchableOpacity>
          </View>
        )}

        {permission.granted && scanning && !result && (
          <View style={styles.manualSection}>
            <TouchableOpacity style={styles.manualToggle} onPress={() => setShowManual(!showManual)}>
              <Ionicons name="keypad-outline" size={14} color={COLORS.primary} />
              <Text style={styles.manualToggleText}>Enter token manually</Text>
            </TouchableOpacity>
            {showManual && (
              <View style={styles.manualRow}>
                <TextInput
                  style={styles.manualInput}
                  value={manualToken}
                  onChangeText={setManualToken}
                  placeholder="Paste QR token here"
                  placeholderTextColor={COLORS.textDim}
                  autoCapitalize="none"
                />
                <TouchableOpacity style={styles.manualSubmit} onPress={() => { if (manualToken.trim()) handleScan(manualToken.trim()); }}>
                  <Text style={styles.manualSubmitText}>Verify</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const InfoBox = ({ icon, title, sub }: { icon: any; title: string; sub: string }) => (
  <View style={styles.emptyState}>
    <View style={styles.emptyIcon}><Ionicons name={icon} size={32} color={COLORS.primary} /></View>
    <Text style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptySub}>{sub}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topAccent: { height: 3, backgroundColor: COLORS.primary },
  bgGlow:    { position: "absolute", top: -80, right: -80, width: 240, height: 240, borderRadius: 120, backgroundColor: COLORS.primary, opacity: 0.07 },

  header:    { flexDirection: "row", alignItems: "center", gap: 14, paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn:   { width: 38, height: 38, borderRadius: 10, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, justifyContent: "center", alignItems: "center" },
  headerTitle: { color: COLORS.textPrimary, fontSize: 20, fontFamily: FONT.extraBold },
  headerSub:   { color: COLORS.textMuted, fontSize: 12, fontFamily: FONT.regular, marginTop: 2 },

  infoStrip: { flexDirection: "row", alignItems: "center", gap: 8, margin: 16, backgroundColor: COLORS.primaryGlow, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: COLORS.primaryBorder },
  infoStripText: { color: COLORS.primary, fontSize: 12, fontFamily: FONT.medium, flex: 1 },

  eventCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  eventCardIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: COLORS.primaryGlow, borderWidth: 1, borderColor: COLORS.primaryBorder, justifyContent: "center", alignItems: "center" },
  eventCardTitle: { color: COLORS.textPrimary, fontSize: 14, fontFamily: FONT.bold },
  clubRow:        { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  clubName:       { color: COLORS.primary, fontSize: 11, fontFamily: FONT.semiBold },
  eventCardMeta:  { color: COLORS.textMuted, fontSize: 12, fontFamily: FONT.regular, marginTop: 4 },

  cameraWrap: { borderRadius: 20, overflow: "hidden", height: 340, marginBottom: 20 },
  camera:     { flex: 1 },
  overlay:    { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.45)", gap: 16 },
  scanFrame:  { width: 220, height: 220, borderWidth: 2, borderColor: COLORS.primary, borderRadius: 16, backgroundColor: "transparent" },
  scanHint:   { color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: FONT.medium },

  processingBox:  { alignItems: "center", paddingVertical: 60, gap: 16 },
  processingText: { color: COLORS.textMuted, fontSize: 15, fontFamily: FONT.medium },

  resultBox:    { alignItems: "center", gap: 16, paddingBottom: 20 },
  resultIcon:   { width: 80, height: 80, borderRadius: 40, justifyContent: "center", alignItems: "center" },
  resultStatus: { fontSize: 20, fontFamily: FONT.bold, textAlign: "center" },
  resultError:  { color: COLORS.textMuted, fontSize: 14, fontFamily: FONT.regular, textAlign: "center" },

  studentCard:  { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, padding: 18, width: "100%", gap: 12 },
  studentRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  studentLabel: { color: COLORS.textMuted, fontSize: 11, fontFamily: FONT.bold, letterSpacing: 1.5 },
  studentValue: { color: COLORS.textPrimary, fontSize: 14, fontFamily: FONT.semiBold },

  resetBtn:     { backgroundColor: COLORS.primary, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  resetBtnText: { color: "#fff", fontSize: 15, fontFamily: FONT.bold },

  manualSection: { marginTop: 8, gap: 10 },
  manualToggle:  { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "center" },
  manualToggleText: { color: COLORS.primary, fontSize: 13, fontFamily: FONT.semiBold },
  manualRow:    { flexDirection: "row", gap: 10 },
  manualInput:  { flex: 1, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 12, color: COLORS.textPrimary, fontSize: 13, fontFamily: FONT.regular },
  manualSubmit: { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 18, justifyContent: "center" },
  manualSubmitText: { color: "#fff", fontFamily: FONT.bold, fontSize: 14 },

  permissionBox:   { alignItems: "center", paddingVertical: 60, gap: 16 },
  permissionTitle: { color: COLORS.textPrimary, fontSize: 20, fontFamily: FONT.bold },
  permissionSub:   { color: COLORS.textMuted, fontSize: 14, fontFamily: FONT.regular, textAlign: "center", lineHeight: 22 },
  permissionBtn:   { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  permissionBtnText: { color: "#fff", fontSize: 15, fontFamily: FONT.bold },

  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", padding: 48, gap: 12 },
  emptyIcon:  { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.primaryGlow, borderWidth: 1, borderColor: COLORS.primaryBorder, justifyContent: "center", alignItems: "center" },
  emptyTitle: { color: COLORS.textPrimary, fontSize: 18, fontFamily: FONT.bold, textAlign: "center" },
  emptySub:   { color: COLORS.textMuted, fontSize: 14, fontFamily: FONT.regular, textAlign: "center", lineHeight: 22 },
});
