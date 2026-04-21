import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Modal, TextInput, FlatList,
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

  useEffect(() => {
    fetchAll();
  }, []);

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
    if (!reason.trim()) {
      Alert.alert("Error", "Please provide a reason");
      return;
    }
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
        text: "Yes, cancel",
        style: "destructive",
        onPress: async () => {
          try {
            await API.delete(`/hostel/requests/${requestId}`);
            fetchAll();
          } catch {
            Alert.alert("Error", "Could not cancel request");
          }
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
        <Ionicons name="business-outline" size={52} color={COLORS.border} />
        <Text style={styles.notHostellerTitle}>Day Scholar Account</Text>
        <Text style={styles.notHostellerText}>
          The hostel module is only available for hostellers.
          If you are a hosteller, please contact admin to update your account.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.pageTitle}>Hostel</Text>
          <Text style={styles.pageRoom}>
            {user.hostelBlock} · Room {user.roomNumber}
          </Text>
        </View>
        <TouchableOpacity style={styles.newBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.newBtnText}>New Request</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(["my", "swaps"] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === "my" ? "My Requests" : `Open Swaps (${openSwaps.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : tab === "my" ? (
        <FlatList
          data={myRequests}
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
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </Text>
                </View>
              </View>

              <Text style={styles.requestFrom}>
                From: {item.currentBlock} · {item.currentRoom}
              </Text>
              {item.preferredBlock && (
                <Text style={styles.requestTo}>
                  Requested: {item.preferredBlock} · {item.preferredRoom || "any"}
                </Text>
              )}
              <Text style={styles.requestReason} numberOfLines={2}>
                Reason: {item.reason}
              </Text>

              {item.status === "approved" && item.wardenNote ? (
                <View style={styles.wardenNote}>
                  <Text style={styles.wardenNoteText}>
                    Warden: {item.wardenNote}
                  </Text>
                </View>
              ) : null}

              {item.status === "rejected" && item.wardenNote ? (
                <View style={[styles.wardenNote, { borderColor: "rgba(239,68,68,0.3)", backgroundColor: "rgba(239,68,68,0.08)" }]}>
                  <Text style={[styles.wardenNoteText, { color: "#ef4444" }]}>
                    Rejected: {item.wardenNote}
                  </Text>
                </View>
              ) : null}

              {item.status === "pending" && (
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => handleCancelRequest(item._id)}
                >
                  <Text style={styles.cancelBtnText}>Cancel Request</Text>
                </TouchableOpacity>
              )}

              <Text style={styles.requestDate}>
                {new Date(item.createdAt).toDateString()}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="document-outline" size={40} color={COLORS.border} />
              <Text style={styles.emptyText}>No requests yet</Text>
              <Text style={styles.emptySubText}>Tap "New Request" to raise one</Text>
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
              <Text style={styles.swapStudentName}>
                {item.requestedBy?.name}
              </Text>
              <Text style={styles.requestFrom}>
                Their room: {item.currentBlock} · {item.currentRoom}
              </Text>
              {item.preferredBlock && (
                <Text style={styles.requestTo}>
                  Wants: {item.preferredBlock} · {item.preferredRoom || "any"}
                </Text>
              )}
              <Text style={styles.requestReason} numberOfLines={2}>
                Reason: {item.reason}
              </Text>
              <TouchableOpacity
                style={styles.swapBtn}
                onPress={() => handleOfferSwap(item._id)}
              >
                <Ionicons name="swap-horizontal-outline" size={14} color="#fff" />
                <Text style={styles.swapBtnText}>Offer My Room for Swap</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="swap-horizontal-outline" size={40} color={COLORS.border} />
              <Text style={styles.emptyText}>No open swap requests</Text>
            </View>
          }
        />
      )}

      {/* New Request Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalCard} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle}>New Hostel Request</Text>
            <Text style={styles.modalSub}>Current: {user.hostelBlock} · Room {user.roomNumber}</Text>

            <View style={styles.divider} />

            {/* Type picker */}
            <Text style={styles.inputLabel}>Request type</Text>
            <View style={styles.typeRow}>
              {(["room_change", "room_swap"] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeBtn, type === t && styles.typeBtnActive]}
                  onPress={() => setType(t)}
                >
                  <Text style={[styles.typeBtnText, type === t && styles.typeBtnTextActive]}>
                    {t === "room_change" ? "Room Change" : "Room Swap"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {type === "room_change" && (
              <>
                <Text style={styles.inputLabel}>Preferred Block (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={preferredBlock}
                  onChangeText={setPreferredBlock}
                  placeholder="e.g. Block B"
                  placeholderTextColor={COLORS.textMuted}
                />
                <Text style={styles.inputLabel}>Preferred Room (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={preferredRoom}
                  onChangeText={setPreferredRoom}
                  placeholder="e.g. B-101"
                  placeholderTextColor={COLORS.textMuted}
                />
              </>
            )}

            {type === "room_swap" && (
              <View style={styles.swapNote}>
                <Text style={styles.swapNoteText}>
                  Your request will appear in the "Open Swaps" list. Other students can offer to swap their room with yours. The warden will then review and approve.
                </Text>
              </View>
            )}

            <Text style={styles.inputLabel}>Reason *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={reason}
              onChangeText={setReason}
              placeholder="Explain why you need this change..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
              onPress={handleSubmitRequest}
              disabled={submitting}
            >
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Submit Request</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelModalText}>Cancel</Text>
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 20, paddingTop: 60 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 14, padding: 32 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  pageTitle: { color: COLORS.textPrimary, fontSize: 28, fontFamily: "DMSans_800ExtraBold" },
  pageRoom: { color: "#10b981", fontSize: 13, fontFamily: "DMSans_500Medium", marginTop: 4 },
  newBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#10b981", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginTop: 4,
  },
  newBtnText: { color: "#fff", fontSize: 13, fontFamily: "DMSans_700Bold" },
  tabRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.border, alignItems: "center",
    backgroundColor: "#111827",
  },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { color: COLORS.textMuted, fontSize: 13, fontFamily: "DMSans_500Medium" },
  tabTextActive: { color: "#fff", fontFamily: "DMSans_700Bold" },
  requestCard: {
    backgroundColor: "#111827", borderRadius: RADIUS.card,
    borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 12,
  },
  requestCardTop: { flexDirection: "row", gap: 8, marginBottom: 10 },
  typeBadge: {
    backgroundColor: "rgba(99,102,241,0.15)", borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  typeBadgeText: { color: COLORS.primary, fontSize: 11, fontFamily: "DMSans_600SemiBold" },
  statusBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontFamily: "DMSans_600SemiBold" },
  requestFrom: { color: COLORS.textMuted, fontSize: 13, fontFamily: "DMSans_400Regular", marginBottom: 4 },
  requestTo: { color: COLORS.primary, fontSize: 13, fontFamily: "DMSans_500Medium", marginBottom: 4 },
  requestReason: { color: COLORS.textMuted, fontSize: 12, fontFamily: "DMSans_400Regular", lineHeight: 18, marginBottom: 8 },
  requestDate: { color: COLORS.textMuted, fontSize: 10, fontFamily: "DMSans_400Regular", marginTop: 6 },
  wardenNote: {
    borderWidth: 1, borderColor: "rgba(16,185,129,0.3)",
    backgroundColor: "rgba(16,185,129,0.08)", borderRadius: 8, padding: 10, marginBottom: 8,
  },
  wardenNoteText: { color: "#10b981", fontSize: 12, fontFamily: "DMSans_400Regular" },
  cancelBtn: { alignSelf: "flex-start", marginTop: 4 },
  cancelBtnText: { color: "#ef4444", fontSize: 12, fontFamily: "DMSans_600SemiBold" },
  swapStudentName: { color: COLORS.textPrimary, fontSize: 15, fontFamily: "DMSans_700Bold", marginBottom: 6 },
  swapBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#10b981", borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 14, alignSelf: "flex-start", marginTop: 8,
  },
  swapBtnText: { color: "#fff", fontSize: 13, fontFamily: "DMSans_700Bold" },
  emptyBox: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyText: { color: COLORS.textPrimary, fontSize: 16, fontFamily: "DMSans_600SemiBold" },
  emptySubText: { color: COLORS.textMuted, fontSize: 13, fontFamily: "DMSans_400Regular" },
  notHostellerTitle: { color: COLORS.textPrimary, fontSize: 18, fontFamily: "DMSans_700Bold" },
  notHostellerText: { color: COLORS.textMuted, fontSize: 14, fontFamily: "DMSans_400Regular", textAlign: "center", lineHeight: 22 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalCard: {
    backgroundColor: "#0f172a", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, borderColor: COLORS.border, padding: 24, maxHeight: "90%",
  },
  modalTitle: { color: COLORS.textPrimary, fontSize: 18, fontFamily: "DMSans_700Bold", marginBottom: 4 },
  modalSub: { color: "#10b981", fontSize: 13, fontFamily: "DMSans_500Medium" },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 16 },
  inputLabel: { color: COLORS.textMuted, fontSize: 12, fontFamily: "DMSans_500Medium", marginBottom: 8 },
  input: {
    backgroundColor: "#111827", borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10, padding: 13, color: COLORS.textPrimary,
    fontSize: 14, fontFamily: "DMSans_400Regular", marginBottom: 14,
  },
  textArea: { height: 100, textAlignVertical: "top" },
  typeRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  typeBtn: {
    flex: 1, paddingVertical: 11, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.border, alignItems: "center", backgroundColor: "#111827",
  },
  typeBtnActive: { backgroundColor: "rgba(99,102,241,0.15)", borderColor: COLORS.primary },
  typeBtnText: { color: COLORS.textMuted, fontSize: 13, fontFamily: "DMSans_500Medium" },
  typeBtnTextActive: { color: COLORS.textPrimary, fontFamily: "DMSans_700Bold" },
  swapNote: {
    backgroundColor: "rgba(99,102,241,0.08)", borderWidth: 1,
    borderColor: "rgba(99,102,241,0.2)", borderRadius: 10, padding: 12, marginBottom: 14,
  },
  swapNoteText: { color: COLORS.primary, fontSize: 12, fontFamily: "DMSans_400Regular", lineHeight: 19 },
  submitBtn: {
    backgroundColor: "#10b981", borderRadius: 12,
    paddingVertical: 15, alignItems: "center", marginBottom: 10,
  },
  submitBtnText: { color: "#fff", fontSize: 15, fontFamily: "DMSans_700Bold" },
  cancelModalBtn: { alignItems: "center", paddingVertical: 12 },
  cancelModalText: { color: "#ef4444", fontSize: 14, fontFamily: "DMSans_600SemiBold" },
});
