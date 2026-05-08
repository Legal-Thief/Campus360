import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, Modal, StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import API from "../../utils/api";
import { COLORS, FONT, RADIUS } from "../../utils/theme";
import { Ionicons } from "@expo/vector-icons";

const STATUS_FLOW = [
  "registration_open",
  "quiz_closed",
  "priority_calculated",
  "seat_selection",
  "completed",
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  registration_open:   { label: "Registration Open", color: COLORS.success,  bg: COLORS.successBg },
  quiz_closed:         { label: "Quiz Closed",        color: COLORS.warning,  bg: COLORS.warningBg },
  priority_calculated: { label: "Priority Set",       color: COLORS.primary,  bg: COLORS.primaryGlow },
  seat_selection:      { label: "Seat Selection",     color: COLORS.info,     bg: COLORS.infoBg },
  completed:           { label: "Completed",           color: COLORS.textMuted, bg: COLORS.white10 },
};

export default function ManageEvent() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [generatingPriority, setGeneratingPriority] = useState(false);

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    try {
      const res = await API.get("/events/all");
      setEvents(res.data.events || []);
    } catch { Alert.alert("Error", "Failed to load events"); }
    finally { setLoading(false); }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedEvent) return;
    try {
      setUpdatingStatus(true);
      await API.patch(`/events/${selectedEvent._id}/status`, { status: newStatus });
      Alert.alert("Updated", `Status → ${STATUS_CONFIG[newStatus]?.label}`);
      setModalVisible(false);
      fetchEvents();
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.message || "Update failed");
    } finally { setUpdatingStatus(false); }
  };

  const handleGeneratePriority = async (eventId: string) => {
    try {
      setGeneratingPriority(true);
      const res = await API.get(`/events/${eventId}/priority`);
      Alert.alert("Done", res.data.message || "Priority generated");
      fetchEvents();
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.message || "Failed");
    } finally { setGeneratingPriority(false); }
  };

  const handleProcessExpired = async (eventId: string) => {
    try {
      const res = await API.post(`/events/${eventId}/process-expired`);
      Alert.alert("Done", res.data.message);
    } catch { Alert.alert("Error", "Failed to process expired seats"); }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <View style={styles.topAccent} />
      {/* Right vertical bar — admin screen rule */}
      <View style={styles.rightBar} />
      {/* Top-right ambient glow */}
      <View style={styles.bgGlow} />

      <View style={styles.header}>
        <Text style={styles.title}>Manage Events</Text>
        <Text style={styles.subtitle}>{events.length} event{events.length !== 1 ? "s" : ""} total</Text>
      </View>

      <FlatList
        data={events}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.completed;
          return (
            <View style={styles.card}>
              <View style={[styles.statusStrip, { backgroundColor: cfg.color }]} />
              <View style={styles.cardInner}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.cardVenue}>{item.venue}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                    <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <Ionicons name="calendar-outline" size={12} color={COLORS.textMuted} />
                  <Text style={styles.metaText}>{new Date(item.date).toDateString()}</Text>
                  <Ionicons name="help-circle-outline" size={12} color={COLORS.textMuted} />
                  <Text style={styles.metaText}>{item.quiz?.questions?.length || 0} questions</Text>
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => { setSelectedEvent(item); setModalVisible(true); }} activeOpacity={0.8}>
                    <Ionicons name="settings-outline" size={13} color={COLORS.primary} />
                    <Text style={styles.actionBtnText}>Status</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleGeneratePriority(item._id)} disabled={generatingPriority} activeOpacity={0.8}>
                    <Ionicons name="trophy-outline" size={13} color={COLORS.warning} />
                    <Text style={[styles.actionBtnText, { color: COLORS.warning }]}>Priority</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => router.push({ pathname: "/(admin)/quiz-analytics", params: { eventId: item._id, eventTitle: item.title } })}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="bar-chart-outline" size={13} color={COLORS.success} />
                    <Text style={[styles.actionBtnText, { color: COLORS.success }]}>Analytics</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleProcessExpired(item._id)} activeOpacity={0.8}>
                    <Ionicons name="refresh-outline" size={13} color={COLORS.primary} />
                    <Text style={styles.actionBtnText}>Expire</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="calendar-outline" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>No events yet</Text>
            <Text style={styles.emptyText}>Create one from the admin dashboard</Text>
          </View>
        }
      />

      {/* Status Change Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Change Status</Text>
                <Text style={styles.modalSub} numberOfLines={1}>{selectedEvent?.title}</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={18} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={styles.divider} />

            {STATUS_FLOW.map((status) => {
              const cfg = STATUS_CONFIG[status];
              const isCurrent = selectedEvent?.status === status;
              return (
                <TouchableOpacity
                  key={status}
                  style={[styles.statusOption, isCurrent && { backgroundColor: cfg.bg, borderWidth: 1, borderColor: cfg.color }]}
                  onPress={() => handleStatusChange(status)}
                  disabled={updatingStatus || isCurrent}
                  activeOpacity={0.8}
                >
                  <View style={[styles.statusDot, { backgroundColor: cfg.color }]} />
                  <Text style={[styles.statusOptionText, isCurrent && { color: COLORS.textPrimary }]}>{cfg.label}</Text>
                  {isCurrent && <Ionicons name="checkmark" size={16} color={cfg.color} />}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelModalText}>Cancel</Text>
            </TouchableOpacity>
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
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background },
  header: { marginBottom: 16 },
  title: { color: COLORS.textPrimary, fontSize: 32, fontFamily: FONT.extraBold },
  subtitle: { color: COLORS.textMuted, fontSize: 13, fontFamily: FONT.regular, marginTop: 4 },
  card: { flexDirection: "row", backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12, overflow: "hidden" },
  statusStrip: { width: 4 },
  cardInner: { flex: 1, padding: 14 },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 },
  cardTitle: { color: COLORS.textPrimary, fontSize: 16, fontFamily: FONT.bold },
  cardVenue: { color: COLORS.textMuted, fontSize: 12, fontFamily: FONT.regular, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.chip, alignSelf: "flex-start" },
  statusText: { fontSize: 10, fontFamily: FONT.bold, letterSpacing: 0.5 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  metaText: { color: COLORS.textMuted, fontSize: 11, fontFamily: FONT.regular, marginRight: 6 },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.xs, paddingHorizontal: 10, paddingVertical: 7 },
  actionBtnText: { color: COLORS.primary, fontSize: 11, fontFamily: FONT.semiBold },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.primaryGlow, borderWidth: 1, borderColor: COLORS.primaryBorder, justifyContent: "center", alignItems: "center" },
  emptyTitle: { color: COLORS.textPrimary, fontSize: 17, fontFamily: FONT.bold },
  emptyText: { color: COLORS.textMuted, fontSize: 13, fontFamily: FONT.regular },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: COLORS.borderBright, borderBottomWidth: 0, padding: 22, paddingTop: 12, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, backgroundColor: COLORS.borderBright, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 },
  modalTitle: { color: COLORS.textPrimary, fontSize: 18, fontFamily: FONT.bold },
  modalSub: { color: COLORS.textMuted, fontSize: 13, fontFamily: FONT.regular, marginTop: 2 },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.surfaceHigh, borderWidth: 1, borderColor: COLORS.border, justifyContent: "center", alignItems: "center" },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 16 },
  statusOption: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, paddingHorizontal: 12, borderRadius: RADIUS.md, marginBottom: 6 },
  statusDot: { width: 9, height: 9, borderRadius: 5 },
  statusOptionText: { flex: 1, color: COLORS.textMuted, fontSize: 15, fontFamily: FONT.medium },
  cancelModalBtn: { marginTop: 8, alignItems: "center", paddingVertical: 14 },
  cancelModalText: { color: COLORS.primary, fontSize: 14, fontFamily: FONT.semiBold },
});
