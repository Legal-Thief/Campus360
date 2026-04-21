import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import API from "../../utils/api";
import { COLORS, RADIUS } from "../../utils/theme";
import { Ionicons } from "@expo/vector-icons";

const STATUS_FLOW = [
  "registration_open",
  "quiz_closed",
  "priority_calculated",
  "seat_selection",
  "completed",
];

const STATUS_LABELS: Record<string, string> = {
  registration_open: "Registration Open",
  quiz_closed: "Quiz Closed",
  priority_calculated: "Priority Set",
  seat_selection: "Seat Selection",
  completed: "Completed",
};

const STATUS_COLORS: Record<string, string> = {
  registration_open: "#10b981",
  quiz_closed: "#f59e0b",
  priority_calculated: "#6366f1",
  seat_selection: "#3b82f6",
  completed: "#64748b",
};

export default function ManageEvent() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [generatingPriority, setGeneratingPriority] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await API.get("/events/all");
      setEvents(res.data.events || []);
    } catch (error: any) {
      Alert.alert("Error", "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const openModal = (event: any) => {
    setSelectedEvent(event);
    setModalVisible(true);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedEvent) return;
    try {
      setUpdatingStatus(true);
      await API.patch(`/events/${selectedEvent._id}/status`, { status: newStatus });
      Alert.alert("Success", `Status updated to "${STATUS_LABELS[newStatus]}"`);
      setModalVisible(false);
      fetchEvents();
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.message || "Update failed");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleGeneratePriority = async (eventId: string) => {
    try {
      setGeneratingPriority(true);
      const res = await API.get(`/events/${eventId}/priority`);
      Alert.alert("Success", res.data.message || "Priority generated");
      fetchEvents();
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.message || "Failed");
    } finally {
      setGeneratingPriority(false);
    }
  };

  const handleProcessExpired = async (eventId: string) => {
    try {
      const res = await API.post(`/events/${eventId}/process-expired`);
      Alert.alert("Done", res.data.message);
    } catch (error: any) {
      Alert.alert("Error", "Failed to process expired seats");
    }
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
      <Text style={styles.title}>Manage Events</Text>
      <Text style={styles.subtitle}>
        {events.length} event{events.length !== 1 ? "s" : ""} total
      </Text>

      <FlatList
        data={events}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* Top row */}
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.cardVenue}>{item.venue}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: STATUS_COLORS[item.status] + "22" },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: STATUS_COLORS[item.status] },
                  ]}
                >
                  {STATUS_LABELS[item.status]}
                </Text>
              </View>
            </View>

            {/* Date */}
            <Text style={styles.cardDate}>
              {new Date(item.date).toDateString()} ·{" "}
              {item.quiz?.questions?.length || 0} questions
            </Text>

            {/* Actions */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => openModal(item)}
              >
                <Ionicons name="settings-outline" size={14} color={COLORS.primary} />
                <Text style={styles.actionBtnText}>Change Status</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handleGeneratePriority(item._id)}
                disabled={generatingPriority}
              >
                <Ionicons name="trophy-outline" size={14} color="#f59e0b" />
                <Text style={[styles.actionBtnText, { color: "#f59e0b" }]}>
                  Gen Priority
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() =>
                  router.push({
                    pathname: "/(admin)/quiz-analytics",
                    params: { eventId: item._id, eventTitle: item.title },
                  })
                }
              >
                <Ionicons name="bar-chart-outline" size={14} color="#10b981" />
                <Text style={[styles.actionBtnText, { color: "#10b981" }]}>
                  Analytics
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handleProcessExpired(item._id)}
              >
                <Ionicons name="refresh-outline" size={14} color="#ef4444" />
                <Text style={[styles.actionBtnText, { color: "#ef4444" }]}>
                  Expire Breaks
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No events yet. Create one first.</Text>
          </View>
        }
      />

      {/* Status Change Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Change Status</Text>
            <Text style={styles.modalSub} numberOfLines={1}>
              {selectedEvent?.title}
            </Text>

            <View style={styles.divider} />

            {STATUS_FLOW.map((status) => {
              const isCurrent = selectedEvent?.status === status;
              return (
                <TouchableOpacity
                  key={status}
                  style={[styles.statusOption, isCurrent && styles.statusOptionActive]}
                  onPress={() => handleStatusChange(status)}
                  disabled={updatingStatus || isCurrent}
                >
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: STATUS_COLORS[status] },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusOptionText,
                      isCurrent && { color: COLORS.textPrimary },
                    ]}
                  >
                    {STATUS_LABELS[status]}
                  </Text>
                  {isCurrent && (
                    <Ionicons name="checkmark" size={16} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontFamily: "DMSans_800ExtraBold",
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    marginTop: 4,
    marginBottom: 4,
  },
  card: {
    backgroundColor: "#111827",
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 6,
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontFamily: "DMSans_700Bold",
  },
  cardVenue: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
    marginTop: 2,
  },
  cardDate: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
    marginBottom: 14,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 11,
    fontFamily: "DMSans_600SemiBold",
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  actionBtnText: {
    color: COLORS.primary,
    fontSize: 12,
    fontFamily: "DMSans_600SemiBold",
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 15,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#0f172a",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontFamily: "DMSans_700Bold",
    marginBottom: 4,
  },
  modalSub: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
  statusOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 6,
  },
  statusOptionActive: {
    backgroundColor: "rgba(99,102,241,0.1)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.3)",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusOptionText: {
    flex: 1,
    color: COLORS.textMuted,
    fontSize: 15,
    fontFamily: "DMSans_500Medium",
  },
  cancelBtn: {
    marginTop: 12,
    alignItems: "center",
    paddingVertical: 14,
  },
  cancelText: {
    color: COLORS.danger,
    fontSize: 15,
    fontFamily: "DMSans_600SemiBold",
  },
});
