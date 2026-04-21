import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, ScrollView, Modal, TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { COLORS, RADIUS } from "../../utils/theme";
import API from "../../utils/api";

const STATUS_COLOR: Record<string, string> = {
  pending: "#f59e0b",
  approved: "#10b981",
  rejected: "#ef4444",
};

export default function WardenDashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<"pending" | "all" | "summary">("pending");
  const [requests, setRequests] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Review modal
  const [reviewModal, setReviewModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [wardenNote, setWardenNote] = useState("");
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    fetchData();
  }, [tab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (tab === "summary") {
        const res = await API.get("/hostel/summary");
        setSummary(res.data);
      } else {
        const status = tab === "pending" ? "pending" : undefined;
        const params = status ? `?status=${status}` : "";
        const res = await API.get(`/hostel/requests${params}`);
        setRequests(res.data.requests || []);
      }
    } catch {
      Alert.alert("Error", "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const openReview = (req: any) => {
    setSelectedRequest(req);
    setWardenNote("");
    setReviewModal(true);
  };

  const handleReview = async (status: "approved" | "rejected") => {
    try {
      setReviewing(true);
      await API.patch(`/hostel/requests/${selectedRequest._id}/review`, {
        status,
        wardenNote: wardenNote.trim(),
      });
      Alert.alert("Done", `Request ${status}`);
      setReviewModal(false);
      fetchData();
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.message || "Failed");
    } finally {
      setReviewing(false);
    }
  };

  const TABS = [
    { key: "pending", label: "Pending" },
    { key: "all", label: "All" },
    { key: "summary", label: "Summary" },
  ] as const;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.pageLabel}>CAMPUS360</Text>
          <Text style={styles.pageTitle}>Warden Panel</Text>
          <Text style={styles.pageSub}>{user?.name}</Text>
        </View>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : tab === "summary" && summary ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Stats */}
          <View style={styles.statsRow}>
            {[
              { label: "Total Hostellers", value: summary.stats.total, color: COLORS.primary },
              { label: "Pending", value: summary.stats.pending, color: "#f59e0b" },
              { label: "Approved", value: summary.stats.approved, color: "#10b981" },
              { label: "Rejected", value: summary.stats.rejected, color: "#ef4444" },
            ].map((s) => (
              <View key={s.label} style={styles.statCard}>
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Hostellers by block */}
          {Object.entries(summary.blocks || {}).map(([block, students]: any) => (
            <View key={block} style={styles.blockCard}>
              <Text style={styles.blockTitle}>{block}</Text>
              <Text style={styles.blockCount}>{students.length} students</Text>
              {students.map((s: any) => (
                <View key={s._id} style={styles.studentRow}>
                  <View style={styles.studentRoomTag}>
                    <Text style={styles.studentRoomText}>{s.roomNumber}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.studentName}>{s.name}</Text>
                    <Text style={styles.studentId}>{s.studentId}</Text>
                  </View>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item }) => (
            <View style={styles.requestCard}>
              <View style={styles.requestCardTop}>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>
                    {item.type === "room_change" ? "Room Change" : "Room Swap"}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[item.status] + "22" }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLOR[item.status] }]}>
                    {item.status}
                  </Text>
                </View>
              </View>

              {/* Student info */}
              <Text style={styles.studentNameLarge}>{item.requestedBy?.name}</Text>
              <Text style={styles.studentMeta}>
                {item.requestedBy?.studentId} · {item.currentBlock} · {item.currentRoom}
              </Text>

              {item.preferredBlock && (
                <Text style={styles.wantsText}>
                  Wants → {item.preferredBlock} · {item.preferredRoom || "any"}
                </Text>
              )}

              {/* Swap partner */}
              {item.swapWithUser && (
                <View style={styles.swapPartner}>
                  <Ionicons name="swap-horizontal-outline" size={14} color={COLORS.primary} />
                  <Text style={styles.swapPartnerText}>
                    Swap with {item.swapWithUser?.name} ({item.swapWithBlock} · {item.swapWithRoom})
                  </Text>
                </View>
              )}

              <Text style={styles.reasonText} numberOfLines={2}>Reason: {item.reason}</Text>

              {item.wardenNote ? (
                <Text style={styles.noteText}>Note: {item.wardenNote}</Text>
              ) : null}

              <Text style={styles.dateText}>{new Date(item.createdAt).toDateString()}</Text>

              {item.status === "pending" && (
                <TouchableOpacity style={styles.reviewBtn} onPress={() => openReview(item)}>
                  <Text style={styles.reviewBtnText}>Review</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="document-outline" size={40} color={COLORS.border} />
              <Text style={styles.emptyText}>
                {tab === "pending" ? "No pending requests" : "No requests yet"}
              </Text>
            </View>
          }
        />
      )}

      {/* Review Modal */}
      <Modal visible={reviewModal} transparent animationType="slide" onRequestClose={() => setReviewModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Review Request</Text>
            {selectedRequest && (
              <>
                <Text style={styles.modalStudentName}>{selectedRequest.requestedBy?.name}</Text>
                <Text style={styles.modalDetails}>
                  {selectedRequest.currentBlock} · {selectedRequest.currentRoom}
                  {selectedRequest.preferredBlock ? ` → ${selectedRequest.preferredBlock} · ${selectedRequest.preferredRoom}` : ""}
                </Text>
                <Text style={styles.modalReason}>{selectedRequest.reason}</Text>
              </>
            )}

            <View style={styles.divider} />

            <Text style={styles.inputLabel}>Note (optional)</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: "top" }]}
              value={wardenNote}
              onChangeText={setWardenNote}
              placeholder="Add a note for the student..."
              placeholderTextColor={COLORS.textMuted}
              multiline
            />

            {reviewing ? (
              <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 16 }} />
            ) : (
              <View style={styles.reviewBtnRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.rejectBtn]}
                  onPress={() => handleReview("rejected")}
                >
                  <Ionicons name="close-outline" size={16} color="#ef4444" />
                  <Text style={[styles.actionBtnText, { color: "#ef4444" }]}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.approveBtn]}
                  onPress={() => handleReview("approved")}
                >
                  <Ionicons name="checkmark-outline" size={16} color="#fff" />
                  <Text style={[styles.actionBtnText, { color: "#fff" }]}>Approve</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity style={{ alignItems: "center", paddingVertical: 12 }} onPress={() => setReviewModal(false)}>
              <Text style={{ color: COLORS.textMuted, fontFamily: "DMSans_500Medium" }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 20, paddingTop: 60 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, paddingTop: 60 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  pageLabel: { color: COLORS.primary, fontSize: 10, fontFamily: "DMSans_700Bold", letterSpacing: 3 },
  pageTitle: { color: COLORS.textPrimary, fontSize: 28, fontFamily: "DMSans_800ExtraBold" },
  pageSub: { color: COLORS.textMuted, fontSize: 13, fontFamily: "DMSans_400Regular", marginTop: 2 },
  logoutText: { color: COLORS.danger, fontFamily: "DMSans_600SemiBold", fontSize: 14, marginTop: 8 },
  tabRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1,
    borderColor: COLORS.border, alignItems: "center", backgroundColor: "#111827",
  },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { color: COLORS.textMuted, fontSize: 13, fontFamily: "DMSans_500Medium" },
  tabTextActive: { color: "#fff", fontFamily: "DMSans_700Bold" },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: "#111827", borderRadius: RADIUS.card,
    borderWidth: 1, borderColor: COLORS.border, padding: 12, alignItems: "center",
  },
  statValue: { fontSize: 22, fontFamily: "DMSans_800ExtraBold" },
  statLabel: { color: COLORS.textMuted, fontSize: 10, fontFamily: "DMSans_500Medium", marginTop: 4, textAlign: "center" },
  blockCard: {
    backgroundColor: "#111827", borderRadius: RADIUS.card,
    borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 12,
  },
  blockTitle: { color: COLORS.textPrimary, fontSize: 16, fontFamily: "DMSans_700Bold" },
  blockCount: { color: COLORS.textMuted, fontSize: 12, fontFamily: "DMSans_400Regular", marginBottom: 12 },
  studentRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: COLORS.border },
  studentRoomTag: {
    backgroundColor: "#0f172a", borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4,
  },
  studentRoomText: { color: COLORS.textPrimary, fontSize: 11, fontFamily: "DMSans_700Bold" },
  studentName: { color: COLORS.textPrimary, fontSize: 13, fontFamily: "DMSans_600SemiBold" },
  studentId: { color: COLORS.textMuted, fontSize: 11, fontFamily: "DMSans_400Regular" },
  requestCard: {
    backgroundColor: "#111827", borderRadius: RADIUS.card,
    borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 12,
  },
  requestCardTop: { flexDirection: "row", gap: 8, marginBottom: 10 },
  typeBadge: { backgroundColor: "rgba(99,102,241,0.15)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  typeBadgeText: { color: COLORS.primary, fontSize: 11, fontFamily: "DMSans_600SemiBold" },
  statusBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontFamily: "DMSans_600SemiBold" },
  studentNameLarge: { color: COLORS.textPrimary, fontSize: 16, fontFamily: "DMSans_700Bold", marginBottom: 2 },
  studentMeta: { color: COLORS.textMuted, fontSize: 12, fontFamily: "DMSans_400Regular", marginBottom: 6 },
  wantsText: { color: COLORS.primary, fontSize: 13, fontFamily: "DMSans_500Medium", marginBottom: 6 },
  swapPartner: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  swapPartnerText: { color: COLORS.textMuted, fontSize: 12, fontFamily: "DMSans_400Regular" },
  reasonText: { color: COLORS.textMuted, fontSize: 12, fontFamily: "DMSans_400Regular", lineHeight: 18, marginBottom: 6 },
  noteText: { color: "#f59e0b", fontSize: 12, fontFamily: "DMSans_500Medium", marginBottom: 4 },
  dateText: { color: COLORS.textMuted, fontSize: 10, fontFamily: "DMSans_400Regular", marginBottom: 10 },
  reviewBtn: {
    backgroundColor: COLORS.primary, borderRadius: 10,
    paddingVertical: 10, alignItems: "center",
  },
  reviewBtnText: { color: "#fff", fontSize: 13, fontFamily: "DMSans_700Bold" },
  emptyText: { color: COLORS.textMuted, fontSize: 15, fontFamily: "DMSans_500Medium" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalCard: {
    backgroundColor: "#0f172a", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, borderColor: COLORS.border, padding: 24, paddingBottom: 40,
  },
  modalTitle: { color: COLORS.textPrimary, fontSize: 18, fontFamily: "DMSans_700Bold", marginBottom: 4 },
  modalStudentName: { color: COLORS.textPrimary, fontSize: 16, fontFamily: "DMSans_600SemiBold", marginBottom: 2 },
  modalDetails: { color: COLORS.primary, fontSize: 13, fontFamily: "DMSans_500Medium", marginBottom: 4 },
  modalReason: { color: COLORS.textMuted, fontSize: 13, fontFamily: "DMSans_400Regular", lineHeight: 20 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 16 },
  inputLabel: { color: COLORS.textMuted, fontSize: 12, fontFamily: "DMSans_500Medium", marginBottom: 8 },
  input: {
    backgroundColor: "#111827", borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10, padding: 13, color: COLORS.textPrimary,
    fontSize: 14, fontFamily: "DMSans_400Regular", marginBottom: 16,
  },
  reviewBtnRow: { flexDirection: "row", gap: 10 },
  actionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 14, borderRadius: 12, borderWidth: 1,
  },
  approveBtn: { backgroundColor: "#10b981", borderColor: "#10b981" },
  rejectBtn: { backgroundColor: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.3)" },
  actionBtnText: { fontSize: 14, fontFamily: "DMSans_700Bold" },
});
