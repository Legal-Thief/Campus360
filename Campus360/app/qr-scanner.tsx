import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import API from "../utils/api";
import { COLORS } from "../utils/theme";

export default function QRScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [manualToken, setManualToken] = useState("");
  const [showManual, setShowManual] = useState(false);

  const handleScan = async (token: string) => {
    if (processing) return;
    setProcessing(true);
    setScanning(false);

    try {
      const res = await API.post("/events/scan-qr", { qrToken: token });
      setResult(res.data);
    } catch (error: any) {
      setResult({
        success: false,
        message: error?.response?.data?.message || "Invalid or unknown QR code",
      });
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => {
    setResult(null);
    setScanning(true);
    setManualToken("");
    setShowManual(false);
  };

  const scanTypeColors: Record<string, string> = {
    entry: "#10b981",
    exit: "#f59e0b",
    reentry: "#6366f1",
  };

  const scanTypeIcons: Record<string, string> = {
    entry: "log-in-outline",
    exit: "walk-outline",
    reentry: "log-in-outline",
  };

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionBox}>
          <Ionicons name="camera-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionSub}>
            Camera permission is needed to scan student QR codes at the entry gate.
          </Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>QR Entry Scanner</Text>
      <Text style={styles.headerSub}>Scan student QR codes for entry, exit, and re-entry</Text>

      {/* Scanner */}
      {scanning && !result && (
        <View style={styles.cameraWrap}>
          <CameraView
            style={styles.camera}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={({ data }) => handleScan(data)}
          >
            <View style={styles.overlay}>
              <View style={styles.scanFrame} />
              <Text style={styles.scanHint}>Align QR code within the frame</Text>
            </View>
          </CameraView>
        </View>
      )}

      {/* Processing */}
      {processing && (
        <View style={styles.processingBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.processingText}>Verifying QR code…</Text>
        </View>
      )}

      {/* Result */}
      {result && (
        <View style={styles.resultBox}>
          {result.success ? (
            <>
              <View
                style={[
                  styles.resultIcon,
                  { backgroundColor: scanTypeColors[result.scanType] + "22" },
                ]}
              >
                <Ionicons
                  name={scanTypeIcons[result.scanType] as any}
                  size={36}
                  color={scanTypeColors[result.scanType]}
                />
              </View>
              <Text
                style={[styles.resultStatus, { color: scanTypeColors[result.scanType] }]}
              >
                {result.message}
              </Text>

              <View style={styles.studentCard}>
                {[
                  { label: "Name", value: result.booking.studentName },
                  { label: "Student ID", value: result.booking.studentId },
                  { label: "Seat", value: result.booking.seatNumber },
                  { label: "Event", value: result.booking.eventTitle },
                  { label: "Status", value: result.booking.status?.replace("_", " ") },
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
              <View style={[styles.resultIcon, { backgroundColor: "rgba(239,68,68,0.15)" }]}>
                <Ionicons name="close-circle-outline" size={36} color="#ef4444" />
              </View>
              <Text style={[styles.resultStatus, { color: "#ef4444" }]}>Scan Failed</Text>
              <Text style={styles.resultError}>{result.message}</Text>
            </>
          )}

          <TouchableOpacity style={styles.resetBtn} onPress={reset}>
            <Ionicons name="qr-code-outline" size={16} color="#fff" />
            <Text style={styles.resetBtnText}>Scan Next</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Manual entry fallback */}
      {scanning && !result && (
        <View style={styles.manualSection}>
          <TouchableOpacity
            style={styles.manualToggle}
            onPress={() => setShowManual(!showManual)}
          >
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
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.manualSubmit}
                onPress={() => {
                  if (manualToken.trim()) handleScan(manualToken.trim());
                }}
              >
                <Text style={styles.manualSubmitText}>Verify</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  headerTitle: {
    color: "#f1f5f9",
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 4,
  },
  headerSub: {
    color: "#475569",
    fontSize: 13,
    marginBottom: 20,
  },
  cameraWrap: {
    borderRadius: 20,
    overflow: "hidden",
    height: 340,
    marginBottom: 20,
  },
  camera: { flex: 1 },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    gap: 16,
  },
  scanFrame: {
    width: 220,
    height: 220,
    borderWidth: 2,
    borderColor: "#6366f1",
    borderRadius: 16,
    backgroundColor: "transparent",
  },
  scanHint: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
  },
  processingBox: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 16,
  },
  processingText: { color: "#64748b", fontSize: 15 },
  resultBox: {
    alignItems: "center",
    gap: 16,
    paddingBottom: 40,
  },
  resultIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  resultStatus: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  resultError: {
    color: "#64748b",
    fontSize: 14,
    textAlign: "center",
  },
  studentCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 18,
    width: "100%",
    gap: 12,
  },
  studentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  studentLabel: { color: "#475569", fontSize: 11, fontWeight: "700", letterSpacing: 1.5 },
  studentValue: { color: "#e2e8f0", fontSize: 14, fontWeight: "600" },
  resetBtn: {
    backgroundColor: "#4f46e5",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  resetBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  permissionBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    padding: 40,
  },
  permissionTitle: { color: "#f1f5f9", fontSize: 20, fontWeight: "700" },
  permissionSub: { color: "#64748b", fontSize: 14, textAlign: "center", lineHeight: 22 },
  permissionBtn: {
    backgroundColor: "#4f46e5",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  permissionBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  manualSection: { marginTop: 8, gap: 10 },
  manualToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "center",
  },
  manualToggleText: { color: COLORS.primary, fontSize: 13, fontWeight: "600" },
  manualRow: { flexDirection: "row", gap: 10 },
  manualInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    color: "#f1f5f9",
    fontSize: 13,
    fontFamily: "monospace",
  },
  manualSubmit: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 18,
    justifyContent: "center",
  },
  manualSubmitText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
