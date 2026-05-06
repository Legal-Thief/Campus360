import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Modal, TextInput, FlatList, StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { COLORS, FONT, RADIUS } from "../../utils/theme";
import API from "../../utils/api";

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  pending:  { color: COLORS.warning,  bg: COLORS.warningBg,  border: COLORS.warningBorder },
  approved: { color: COLORS.success,  bg: COLORS.successBg,  border: COLORS.successBorder },
  rejected: { color: COLORS.primary,  bg: COLORS.dangerBg,   border: COLORS.primaryBorder },
};

export default function Hostel() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"my" | "swaps">("my");
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [openSwaps, setOpenSwaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [type, setType] = useState<"room_change" | "room_swap">("room_change");
  const [preferredBlock, setPreferredBlock] = useState("");
  const [preferredRoom, setPreferredRoom] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [myRes, swapRes] = await Promise.all([
        API.get("/hostel/requests/my"),
        API.get("/hostel/requests/open-swaps"),
      ]);
      setMyRequests(myRes.data.requests || []);
      setOpenSwaps(swapRes.data.requests || []);
    } catch {
      Alert.alert("Error", "Failed to load hostel data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (!reason.trim()) { Alert.alert("Error", "Please provide a reason"); return; }
    try {
      setSubmitting(true);
      await API.post("/hostel/requests", {
        type,
        preferredBlock: preferredBlock.trim() || undefined,
        preferredRoom: preferredRoom.trim() || undefined,
        reason: reason.trim(),
      });
      Alert.alert("Submitted", "Your request has been sent to the warden");
      setModalVisible(false);
      setPreferredBlock(""); setPreferredRoom(""); setReason("");
      fetchAll();
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    Alert.alert("Cancel Request", "Are you sure?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, cancel", style: "destructive",
        onPress: async () => {
          try { await API.delete(`/hostel/requests/${requestId}`); fetchAll(); }
          catch { Alert.alert("Error", "Could not cancel request"); }
        },
      },
    ]);
  };

  const handleOfferSwap = async (requestId: string) => {
    Alert.alert(
      "Offer Swap",
      `Offer to swap your room (${user?.hostelBlock} · ${user?.roomNumber}) with this student?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Offer Swap",
          onPress: async () => {
            try {
              await API.patch(`/hostel/requests/${requestId}/swap-offer`);
              Alert.alert("Done", "Swap offer submitted for warden review");
              fetchAll();
            } catch (error: any) {
              Alert.alert("Error", error?.response?.data?.message || "Failed");
            }
          },
        },
      ]
    );
  };

  if (user?.residentType !== "hosteller") {
    return (
      <View style={styles.center}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <View style={styles.emptyIcon}>
          <Ionicons name="business-outline" size={36} color={COLORS.primary} />
        </View>
        <Text style={styles.emptyTitle}>Day Scholar Account</Text>
        <Text style={styles.emptyText}>The hostel module is only available for hostellers.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <View style={styles.topAccent} />
      <View style={styles.header}>
        <View>
          <Text style={styles.pageTitle}>Hostel</Text>
          <View style={styles.roomRow}>
            <View style={styles.redDot} />
            <Text style={styles.pageRoom}>{user.hostelBlock}  ·  Room {user.roomNumber}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.newBtn} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={styles.newBtnText}>New Request</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        {(["my", "swaps"] as const).map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)} activeOpacity={0.8}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === "my" ? "My Requests" : `Open Swaps (${openSwaps.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={COLORS.primary} /></View>
      ) : tab === "my" ? (
        <FlatList
          data={myRequests}
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
                  <Text style={styles.requestFrom}>From: {item.currentBlock} · {item.currentRoom}</Text>
                  {item.preferredBlock && (
                    <Text style={styles.requestTo}>Requested: {item.preferredBlock} · {item.preferredRoom || "any"}</Text>
                  )}
                  <Text style={styles.requestReason} numberOfLines={2}>Reason: {item.reason}</Text>
                  {item.wardenNote && item.status === "approved" && (
                    <View style={[styles.wardenNote, { backgroundColor: COLORS.successBg, borderColor: COLORS.successBorder }]}>
                      <Ionicons name="checkmark-circle-outline" size={13} color={COLORS.success} />
                      <Text style={[styles.wardenNoteText, { color: COLORS.success }]}>Warden: {item.wardenNote}</Text>
                    </View>
                  )}
                  {item.wardenNote && item.status === "rejected" && (
                    <View style={[styles.wardenNote, { backgroundColor: COLORS.dangerBg, borderColor: COLORS.primaryBorder }]}>
                      <Ionicons name="close-circle-outline" size={13} color={COLORS.primary} />
                      <Text style={[styles.wardenNoteText, { color: COLORS.primary }]}>Rejected: {item.wardenNote}</Text>
                    </View>
                  )}
                  <View style={styles.cardFooter}>
                    <Text style={styles.requestDate}>{new Date(item.createdAt).toDateString()}</Text>
                    {item.status === "pending" && (
                      <TouchableOpacity onPress={() => handleCancelRequest(item._id)}>
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <View style={styles.emptyIcon}><Ionicons name="document-outline" size={32} color={COLORS.primary} /></View>
              <Text style={styles.emptyTitle}>No requests yet</Text>
              <Text style={styles.emptyText}>Tap "New Request" to raise one</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={openSwaps}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item }) => (
            <View style={styles.requestCard}>
              <View style={[styles.statusStrip, { backgroundColor: COLORS.info }]} />
              <View style={styles.cardInner}>
                <Text style={styles.swapStudentName}>{item.requestedBy?.name}</Text>
                <Text style={styles.requestFrom}>Their room: {item.currentBlock} · {item.currentRoom}</Text>
                {item.preferredBlock && <Text style={styles.requestTo}>Wants: {item.preferredBlock} · {item.preferredRoom || "any"}</Text>}
                <Text style={styles.requestReason} numberOfLines={2}>Reason: {item.reason}</Text>
                <TouchableOpacity style={styles.swapBtn} onPress={() => handleOfferSwap(item._id)} activeOpacity={0.85}>
                  <Ionicons name="swap-horizontal-outline" size={14} color="#fff" />
                  <Text style={styles.swapBtnText}>Offer My Room for Swap</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <View style={styles.emptyIcon}><Ionicons name="swap-horizontal-outline" size={32} color={COLORS.primary} /></View>
              <Text style={styles.emptyTitle}>No open swap requests</Text>
              <Text style={styles.emptyText}>No students are looking to swap right now</Text>
            </View>
          }
        />
      )}

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>New Request</Text>
                <Text style={styles.modalSub}>{user.hostelBlock}  ·  Room {user.roomNumber}</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={18} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={styles.divider} />
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNum}><Text style={styles.sectionNumText}>01</Text></View>
                <Text style={styles.sectionLabel}>REQUEST TYPE</Text>
              </View>
              <View style={styles.typeRow}>
                {(["room_change", "room_swap"] as const).map((t) => (
                  <TouchableOpacity key={t} style={[styles.typeBtn, type === t && styles.typeBtnActive]} onPress={() => setType(t)} activeOpacity={0.8}>
                    <Ionicons name={t === "room_change" ? "swap-vertical-outline" : "swap-horizontal-outline"} size={16} color={type === t ? "#fff" : COLORS.textMuted} />
                    <Text style={[styles.typeBtnText, type === t && styles.typeBtnTextActive]}>
                      {t === "room_change" ? "Room Change" : "Room Swap"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {type === "room_change" && (
                <>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionNum}><Text style={styles.sectionNumText}>02</Text></View>
                    <Text style={styles.sectionLabel}>PREFERENCE</Text>
                  </View>
                  <View style={styles.rowInputs}>
                    <View style={[styles.inputWrap, { flex: 1 }, focusedField === "block" && styles.inputFocused]}>
                      <Ionicons name="grid-outline" size={16} color={focusedField === "block" ? COLORS.primary : COLORS.textMuted} />
                      <TextInput style={styles.input} value={preferredBlock} onChangeText={setPreferredBlock} placeholder="Block (e.g. A)" placeholderTextColor={COLORS.textDim} onFocus={() => setFocusedField("block")} onBlur={() => setFocusedField(null)} />
                    </View>
                    <View style={[styles.inputWrap, { flex: 1 }, focusedField === "room" && styles.inputFocused]}>
                      <Ionicons name="bed-outline" size={16} color={focusedField === "room" ? COLORS.primary : COLORS.textMuted} />
                      <TextInput style={styles.input} value={preferredRoom} onChangeText={setPreferredRoom} placeholder="Room (e.g. A-204)" placeholderTextColor={COLORS.textDim} onFocus={() => setFocusedField("room")} onBlur={() => setFocusedField(null)} />
                    </View>
                  </View>
                </>
              )}

              {type === "room_swap" && (
                <View style={styles.swapNote}>
                  <Ionicons name="information-circle-outline" size={15} color={COLORS.primary} />
                  <Text style={styles.swapNoteText}>Your request will appear in the Open Swaps list. Other students can offer to swap rooms with you.</Text>
                </View>
              )}

              <View style={styles.sectionHeader}>
                <View style={styles.sectionNum}><Text style={styles.sectionNumText}>{type === "room_change" ? "03" : "02"}</Text></View>
                <Text style={styles.sectionLabel}>REASON</Text>
              </View>
              <View style={[styles.inputWrap, styles.textAreaWrap, focusedField === "reason" && styles.inputFocused]}>
                <TextInput style={[styles.input, styles.textArea]} value={reason} onChangeText={setReason} placeholder="Explain why you need this change..." placeholderTextColor={COLORS.textDim} multiline numberOfLines={4} onFocus={() => setFocusedField("reason")} onBlur={() => setFocusedField(null)} />
              </View>

              <TouchableOpacity style={[styles.submitBtn, submitting && { opacity: 0.65 }]} onPress={handleSubmitRequest} disabled={submitting} activeOpacity={0.85}>
                {submitting ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Ionicons name="paper-plane-outline" size={16} color="#fff" />
                    <Text style={styles.submitBtnText}>Submit Request</Text>
                  </>
                )}
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 20, paddingTop: 60 },
  topAccent: { position: "absolute", top: 0, left: 0, right: 0, height: 3, backgroundColor: COLORS.primary },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 14, padding: 32 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  pageTitle: { color: COLORS.textPrimary, fontSize: 32, fontFamily: FONT.extraBold },
  roomRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  redDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.primary },
  pageRoom: { color: COLORS.success, fontSize: 13, fontFamily: FONT.medium },
  newBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 10, marginTop: 4 },
  newBtnText: { color: "#fff", fontSize: 13, fontFamily: FONT.bold },
  tabRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 11, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", backgroundColor: COLORS.surface },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { color: COLORS.textMuted, fontSize: 13, fontFamily: FONT.medium },
  tabTextActive: { color: "#fff", fontFamily: FONT.bold },
  requestCard: { flexDirection: "row", backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12, overflow: "hidden" },
  statusStrip: { width: 4 },
  cardInner: { flex: 1, padding: 14 },
  cardTopRow: { flexDirection: "row", gap: 8, marginBottom: 10, flexWrap: "wrap" },
  typeBadge: { backgroundColor: COLORS.primaryGlow, borderRadius: RADIUS.chip, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: COLORS.primaryBorder },
  typeBadgeText: { color: COLORS.primary, fontSize: 10, fontFamily: FONT.bold, letterSpacing: 1 },
  statusBadge: { borderRadius: RADIUS.chip, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  statusText: { fontSize: 10, fontFamily: FONT.bold, letterSpacing: 0.8 },
  requestFrom: { color: COLORS.textMuted, fontSize: 13, fontFamily: FONT.regular, marginBottom: 3 },
  requestTo: { color: COLORS.primary, fontSize: 13, fontFamily: FONT.medium, marginBottom: 3 },
  requestReason: { color: COLORS.textMuted, fontSize: 12, fontFamily: FONT.regular, lineHeight: 18, marginBottom: 8 },
  wardenNote: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderWidth: 1, borderRadius: RADIUS.xs, padding: 10, marginBottom: 8 },
  wardenNoteText: { fontSize: 12, fontFamily: FONT.regular, flex: 1 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  requestDate: { color: COLORS.textDim, fontSize: 10, fontFamily: FONT.regular },
  cancelBtnText: { color: COLORS.primary, fontSize: 12, fontFamily: FONT.semiBold },
  swapStudentName: { color: COLORS.textPrimary, fontSize: 15, fontFamily: FONT.bold, marginBottom: 6 },
  swapBtn: { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: COLORS.primary, borderRadius: RADIUS.sm, paddingVertical: 10, paddingHorizontal: 14, alignSelf: "flex-start", marginTop: 8 },
  swapBtnText: { color: "#fff", fontSize: 13, fontFamily: FONT.bold },
  emptyBox: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.primaryGlow, borderWidth: 1, borderColor: COLORS.primaryBorder, justifyContent: "center", alignItems: "center" },
  emptyTitle: { color: COLORS.textPrimary, fontSize: 17, fontFamily: FONT.bold },
  emptyText: { color: COLORS.textMuted, fontSize: 13, fontFamily: FONT.regular, textAlign: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: COLORS.borderBright, borderBottomWidth: 0, paddingHorizontal: 22, paddingTop: 12, maxHeight: "92%" },
  modalHandle: { width: 40, height: 4, backgroundColor: COLORS.borderBright, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 },
  modalTitle: { color: COLORS.textPrimary, fontSize: 20, fontFamily: FONT.bold },
  modalSub: { color: COLORS.success, fontSize: 12, fontFamily: FONT.medium, marginTop: 3 },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.surfaceHigh, borderWidth: 1, borderColor: COLORS.border, justifyContent: "center", alignItems: "center" },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 16 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12, marginTop: 4 },
  sectionNum: { backgroundColor: COLORS.primary, borderRadius: RADIUS.xs, paddingHorizontal: 7, paddingVertical: 2 },
  sectionNumText: { color: "#fff", fontSize: 11, fontFamily: FONT.bold },
  sectionLabel: { color: COLORS.textMuted, fontSize: 11, fontFamily: FONT.bold, letterSpacing: 2 },
  typeRow: { flexDirection: "row", gap: 10, marginBottom: 18 },
  typeBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.background },
  typeBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeBtnText: { color: COLORS.textMuted, fontSize: 13, fontFamily: FONT.semiBold },
  typeBtnTextActive: { color: "#fff" },
  rowInputs: { flexDirection: "row", gap: 10, marginBottom: 18 },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 10 },
  inputFocused: { borderColor: COLORS.primary, backgroundColor: COLORS.surfaceHigh },
  input: { flex: 1, color: COLORS.textPrimary, fontSize: 14, fontFamily: FONT.regular },
  textAreaWrap: { alignItems: "flex-start", paddingVertical: 12 },
  textArea: { height: 90, textAlignVertical: "top" },
  swapNote: { flexDirection: "row", alignItems: "flex-start", gap: 9, backgroundColor: COLORS.primaryGlow, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.primaryBorder, paddingHorizontal: 12, paddingVertical: 11, marginBottom: 18 },
  swapNoteText: { color: COLORS.primary, fontSize: 12, fontFamily: FONT.regular, lineHeight: 19, flex: 1 },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 16, marginTop: 6, marginBottom: 10 },
  submitBtnText: { color: "#fff", fontSize: 15, fontFamily: FONT.bold },
});
