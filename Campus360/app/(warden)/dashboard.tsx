import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, ScrollView, Modal, TextInput, StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { COLORS, FONT, RADIUS } from "../../utils/theme";
import API from "../../utils/api";

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  pending:  { color: COLORS.warning, bg: COLORS.warningBg,  border: COLORS.warningBorder },
  approved: { color: COLORS.success, bg: COLORS.successBg,  border: COLORS.successBorder },
  rejected: { color: COLORS.primary, bg: COLORS.dangerBg,   border: COLORS.primaryBorder },
};

export default function WardenDashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<"pending" | "all" | "summary">("pending");
  const [requests, setRequests] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [wardenNote, setWardenNote] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [noteFocused, setNoteFocused] = useState(false);

  useEffect(() => { fetchData(); }, [tab]);

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
    } catch { Alert.alert("Error", "Failed to load data"); }
    finally { setLoading(false); }
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
        status, wardenNote: wardenNote.trim(),
      });
      Alert.alert("Done", `Request ${status}`);
      setReviewModal(false);
      fetchData();
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.message || "Failed");
    } finally { setReviewing(false); }
  };

  const TABS = [
    { key: "pending", label: "Pending" },
    { key: "all", label: "All" },
    { key: "summary", label: "Summary" },
  ] as const;

  const initials = user?.name
    ? user.name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
    : "WD";

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <View style={styles.topAccent} />
      {/* Right vertical bar — warden screen rule */}
      <View style={styles.rightBar} />
      {/* Top-right ambient glow */}
      <View style={styles.bgGlow} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View>
            <Text style={styles.pageLabel}>WARDEN PANEL</Text>
            <Text style={styles.pageTitle}>Dashboard</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={17} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={COLORS.primary} /></View>
      ) : tab === "summary" && summary ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Stats row */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}
            contentContainerStyle={{ gap: 10, paddingHorizontal: 2 }}>
            {[
              { label: "Hostellers", value: summary.stats.total, color: COLORS.primary },
              { label: "Pending", value: summary.stats.pending, color: COLORS.warning },
              { label: "Approved", value: summary.stats.approved, color: COLORS.success },
              { label: "Rejected", value: summary.stats.rejected, color: COLORS.primary },
            ].map((s) => (
              <View key={s.label} style={styles.statCard}>
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Section header */}
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>BY BLOCK</Text>
            <View style={styles.sectionLine} />
          </View>

          {Object.entries(summary.blocks || {}).map(([block, students]: any) => (
            <View key={block} style={styles.blockCard}>
              <View style={styles.blockCardHeader}>
                <View style={styles.blockBadge}>
                  <Text style={styles.blockBadgeText}>BLOCK {block}</Text>
                </View>
                <Text style={styles.blockCount}>{students.length} students</Text>
              </View>
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
          renderItem={({ item }) => {
            const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
            return (
              <View style={styles.requestCard}>
                <View style={[styles.statusStrip, { backgroundColor: cfg.color }]} />
                <View style={styles.cardInner}>
                  <View style={styles.cardTopRow}>
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeBadgeText}>{item.type === "room_change" ? "ROOM CHANGE" : "ROOM SWAP"}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
                      <Text style={[styles.statusText, { color: cfg.color }]}>{item.status.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={styles.studentNameLarge}>{item.requestedBy?.name}</Text>
                  <Text style={styles.studentMeta}>{item.requestedBy?.studentId}  ·  {item.currentBlock}  ·  {item.currentRoom}</Text>
                  {item.preferredBlock && (
                    <Text style={styles.wantsText}>Wants → {item.preferredBlock} · {item.preferredRoom || "any"}</Text>
                  )}
                  {item.swapWithUser && (
                    <View style={styles.swapPartner}>
                      <Ionicons name="swap-horizontal-outline" size={13} color={COLORS.primary} />
                      <Text style={styles.swapPartnerText}>
                        Swap with {item.swapWithUser?.name} ({item.swapWithBlock} · {item.swapWithRoom})
                      </Text>
                    </View>
                  )}
                  <Text style={styles.reasonText} numberOfLines={2}>Reason: {item.reason}</Text>
                  {item.wardenNote ? <Text style={styles.noteText}>Note: {item.wardenNote}</Text> : null}
                  <View style={styles.cardFooter}>
                    <Text style={styles.dateText}>{new Date(item.createdAt).toDateString()}</Text>
                    {item.status === "pending" && (
                      <TouchableOpacity style={styles.reviewBtn} onPress={() => openReview(item)} activeOpacity={0.85}>
                        <Text style={styles.reviewBtnText}>Review</Text>
                        <Ionicons name="arrow-forward" size={12} color="#fff" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.center}>
              <View style={styles.emptyIcon}>
                <Ionicons name="document-outline" size={32} color={COLORS.primary} />
              </View>
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
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Review Request</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setReviewModal(false)}>
                <Ionicons name="close" size={18} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {selectedRequest && (
              <View style={styles.modalStudentCard}>
                <View style={styles.redDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalStudentName}>{selectedRequest.requestedBy?.name}</Text>
                  <Text style={styles.modalDetails}>
                    {selectedRequest.currentBlock} · {selectedRequest.currentRoom}
                    {selectedRequest.preferredBlock ? ` → ${selectedRequest.preferredBlock} · ${selectedRequest.preferredRoom}` : ""}
                  </Text>
                  <Text style={styles.modalReason} numberOfLines={3}>{selectedRequest.reason}</Text>
                </View>
              </View>
            )}

            <View style={styles.divider} />

            <Text style={styles.inputLabel}>Note for student (optional)</Text>
            <View style={[styles.inputWrap, styles.textAreaWrap, noteFocused && styles.inputFocused]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={wardenNote}
                onChangeText={setWardenNote}
                placeholder="Add a note..."
                placeholderTextColor={COLORS.textDim}
                multiline
                onFocus={() => setNoteFocused(true)}
                onBlur={() => setNoteFocused(false)}
              />
            </View>

            {reviewing ? (
              <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 16 }} />
            ) : (
              <View style={styles.reviewBtnRow}>
                <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => handleReview("rejected")} activeOpacity={0.85}>
                  <Ionicons name="close-outline" size={16} color={COLORS.primary} />
                  <Text style={[styles.actionBtnText, { color: COLORS.primary }]}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={() => handleReview("approved")} activeOpacity={0.85}>
                  <Ionicons name="checkmark-outline" size={16} color="#fff" />
                  <Text style={[styles.actionBtnText, { color: "#fff" }]}>Approve</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 20, paddingTop: 60 },
  topAccent: { position: "absolute", top: 0, left: 0, right: 0, height: 3, backgroundColor: COLORS.primary },
  rightBar: {
    position: "absolute", top: 0, right: 0,
    width: 3, height: 120,
    backgroundColor: COLORS.primary, opacity: 0.5,
  },
  bgGlow: {
    position: "absolute", top: -80, right: -80,
    width: 240, height: 240, borderRadius: 120,
    backgroundColor: COLORS.primary, opacity: 0.07,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, paddingTop: 60 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.primary, justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontSize: 17, fontFamily: FONT.bold },
  pageLabel: { color: COLORS.primary, fontSize: 9, fontFamily: FONT.bold, letterSpacing: 2.5, marginBottom: 2 },
  pageTitle: { color: COLORS.textPrimary, fontSize: 20, fontFamily: FONT.extraBold },
  logoutBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: COLORS.primaryBorder, backgroundColor: COLORS.primaryGlow, justifyContent: "center", alignItems: "center" },
  tabRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 11, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", backgroundColor: COLORS.surface },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { color: COLORS.textMuted, fontSize: 13, fontFamily: FONT.medium },
  tabTextActive: { color: "#fff", fontFamily: FONT.bold },

  // Summary
  statCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, padding: 14, alignItems: "center", minWidth: 90 },
  statValue: { fontSize: 24, fontFamily: FONT.extraBold },
  statLabel: { color: COLORS.textMuted, fontSize: 10, fontFamily: FONT.medium, marginTop: 4, textAlign: "center" },
  sectionRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  sectionTitle: { color: COLORS.textMuted, fontSize: 11, fontFamily: FONT.bold, letterSpacing: 3 },
  sectionLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  blockCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 12 },
  blockCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  blockBadge: { backgroundColor: COLORS.primaryGlow, borderRadius: RADIUS.chip, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: COLORS.primaryBorder },
  blockBadgeText: { color: COLORS.primary, fontSize: 10, fontFamily: FONT.bold, letterSpacing: 1.5 },
  blockCount: { color: COLORS.textMuted, fontSize: 12, fontFamily: FONT.regular },
  studentRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: COLORS.border },
  studentRoomTag: { backgroundColor: COLORS.surfaceHigh, borderWidth: 1, borderColor: COLORS.borderBright, borderRadius: RADIUS.xs, paddingHorizontal: 8, paddingVertical: 4 },
  studentRoomText: { color: COLORS.textPrimary, fontSize: 11, fontFamily: FONT.bold },
  studentName: { color: COLORS.textPrimary, fontSize: 13, fontFamily: FONT.semiBold },
  studentId: { color: COLORS.textMuted, fontSize: 11, fontFamily: FONT.regular },

  // Request cards
  requestCard: { flexDirection: "row", backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12, overflow: "hidden" },
  statusStrip: { width: 4 },
  cardInner: { flex: 1, padding: 14 },
  cardTopRow: { flexDirection: "row", gap: 8, marginBottom: 10, flexWrap: "wrap" },
  typeBadge: { backgroundColor: COLORS.primaryGlow, borderRadius: RADIUS.chip, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: COLORS.primaryBorder },
  typeBadgeText: { color: COLORS.primary, fontSize: 10, fontFamily: FONT.bold, letterSpacing: 1 },
  statusBadge: { borderRadius: RADIUS.chip, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  statusText: { fontSize: 10, fontFamily: FONT.bold, letterSpacing: 0.8 },
  studentNameLarge: { color: COLORS.textPrimary, fontSize: 16, fontFamily: FONT.bold, marginBottom: 2 },
  studentMeta: { color: COLORS.textMuted, fontSize: 12, fontFamily: FONT.regular, marginBottom: 5 },
  wantsText: { color: COLORS.primary, fontSize: 13, fontFamily: FONT.medium, marginBottom: 5 },
  swapPartner: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 5 },
  swapPartnerText: { color: COLORS.textMuted, fontSize: 12, fontFamily: FONT.regular },
  reasonText: { color: COLORS.textMuted, fontSize: 12, fontFamily: FONT.regular, lineHeight: 18, marginBottom: 6 },
  noteText: { color: COLORS.warning, fontSize: 12, fontFamily: FONT.medium, marginBottom: 4 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  dateText: { color: COLORS.textDim, fontSize: 10, fontFamily: FONT.regular },
  reviewBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: COLORS.primary, borderRadius: RADIUS.sm, paddingVertical: 8, paddingHorizontal: 12 },
  reviewBtnText: { color: "#fff", fontSize: 12, fontFamily: FONT.bold },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.primaryGlow, borderWidth: 1, borderColor: COLORS.primaryBorder, justifyContent: "center", alignItems: "center" },
  emptyText: { color: COLORS.textMuted, fontSize: 15, fontFamily: FONT.medium },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: COLORS.borderBright, borderBottomWidth: 0, padding: 22, paddingTop: 12, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, backgroundColor: COLORS.borderBright, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { color: COLORS.textPrimary, fontSize: 18, fontFamily: FONT.bold },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.surfaceHigh, borderWidth: 1, borderColor: COLORS.border, justifyContent: "center", alignItems: "center" },
  modalStudentCard: { flexDirection: "row", alignItems: "flex-start", gap: 12, backgroundColor: COLORS.background, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 4 },
  redDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginTop: 5 },
  modalStudentName: { color: COLORS.textPrimary, fontSize: 16, fontFamily: FONT.semiBold, marginBottom: 2 },
  modalDetails: { color: COLORS.primary, fontSize: 13, fontFamily: FONT.medium, marginBottom: 4 },
  modalReason: { color: COLORS.textMuted, fontSize: 13, fontFamily: FONT.regular, lineHeight: 20 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 16 },
  inputLabel: { color: COLORS.textMuted, fontSize: 12, fontFamily: FONT.medium, marginBottom: 8 },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 16 },
  inputFocused: { borderColor: COLORS.primary, backgroundColor: COLORS.surfaceHigh },
  input: { flex: 1, color: COLORS.textPrimary, fontSize: 14, fontFamily: FONT.regular },
  textAreaWrap: { alignItems: "flex-start", paddingVertical: 12 },
  textArea: { height: 80, textAlignVertical: "top" },
  reviewBtnRow: { flexDirection: "row", gap: 10 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14, borderRadius: RADIUS.md, borderWidth: 1 },
  approveBtn: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  rejectBtn: { backgroundColor: COLORS.dangerBg, borderColor: COLORS.primaryBorder },
  actionBtnText: { fontSize: 14, fontFamily: FONT.bold },
});
