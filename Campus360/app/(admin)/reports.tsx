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
} from "react-native";
import API from "../../utils/api";
import { COLORS, RADIUS } from "../../utils/theme";
import { Ionicons } from "@expo/vector-icons";

export default function Reports() {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await API.get("/events/all");
      setEvents(res.data.events || []);
    } catch {
      Alert.alert("Error", "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const selectEvent = async (event: any) => {
    setSelectedEvent(event);
    setLoadingReport(true);
    try {
      const res = await API.get(`/events/${event._id}/report`);
      setReport(res.data);
    } catch {
      setReport(null);
      Alert.alert("Error", "Failed to load report");
    } finally {
      setLoadingReport(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const StatusRow = ({
    label,
    value,
    color,
  }: {
    label: string;
    value: number;
    color: string;
  }) => (
    <View style={styles.statRow}>
      <View style={[styles.statDot, { backgroundColor: color }]} />
      <Text style={styles.statRowLabel}>{label}</Text>
      <Text style={[styles.statRowValue, { color }]}>{value}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reports</Text>
      <Text style={styles.subtitle}>Select an event to view its full report</Text>

      {/* Event selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.eventScroll}
        contentContainerStyle={{ gap: 10, paddingRight: 20 }}
      >
        {events.map((ev) => (
          <TouchableOpacity
            key={ev._id}
            style={[
              styles.eventChip,
              selectedEvent?._id === ev._id && styles.eventChipActive,
            ]}
            onPress={() => selectEvent(ev)}
          >
            <Text
              style={[
                styles.eventChipText,
                selectedEvent?._id === ev._id && styles.eventChipTextActive,
              ]}
            >
              {ev.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {!selectedEvent && (
        <View style={styles.placeholder}>
          <Ionicons name="document-text-outline" size={48} color={COLORS.border} />
          <Text style={styles.placeholderText}>Pick an event above</Text>
        </View>
      )}

      {selectedEvent && loadingReport && (
        <View style={styles.placeholder}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      )}

      {report && !loadingReport && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Event info */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{report.event?.title}</Text>
            <Text style={styles.cardSub}>
              {report.event?.venue} · {new Date(report.event?.date).toDateString()}
            </Text>
            <View style={styles.divider} />
            <Text style={styles.metaText}>
              Quiz participants: {report.quizParticipants}
            </Text>
          </View>

          {/* Seat stats */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Seat Summary</Text>
            <StatusRow label="Total seats" value={report.seatStats.total} color={COLORS.textMuted} />
            <StatusRow label="Booked" value={report.seatStats.booked} color="#6366f1" />
            <StatusRow label="Available" value={report.seatStats.available} color="#10b981" />
            <StatusRow label="Blocked" value={report.seatStats.blocked} color="#64748b" />
            <StatusRow label="Locked (pending)" value={report.seatStats.locked} color="#f59e0b" />

            {/* Visual fill bar */}
            <View style={styles.fillBarWrap}>
              <View
                style={[
                  styles.fillBar,
                  {
                    width: `${Math.round(
                      (report.seatStats.booked / report.seatStats.total) * 100
                    )}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.fillLabel}>
              {Math.round((report.seatStats.booked / report.seatStats.total) * 100)}% seats filled
            </Text>
          </View>

          {/* Attendance stats */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Attendance</Text>
            <StatusRow label="Total bookings" value={report.attendanceStats.totalBookings} color={COLORS.textMuted} />
            <StatusRow label="Present" value={report.attendanceStats.present} color="#10b981" />
            <StatusRow label="On break" value={report.attendanceStats.onBreak} color="#f59e0b" />
            <StatusRow label="Break expired" value={report.attendanceStats.breakExpired} color="#ef4444" />
            <StatusRow label="Not yet scanned" value={report.attendanceStats.confirmed} color="#64748b" />
          </View>

          {/* Bookings list */}
          <Text style={styles.sectionTitle2}>Booking Details</Text>
          {report.bookings?.map((b: any, i: number) => (
            <View key={b._id || i} style={styles.bookingRow}>
              <View style={styles.seatTag}>
                <Text style={styles.seatTagText}>{b.seatNumber}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bookingName}>{b.userId?.name || "Unknown"}</Text>
                <Text style={styles.bookingId}>{b.userId?.studentId || b.userId?.email}</Text>
              </View>
              <View
                style={[
                  styles.statusPill,
                  {
                    backgroundColor:
                      b.status === "present"
                        ? "rgba(16,185,129,0.15)"
                        : b.status === "on_break"
                        ? "rgba(245,158,11,0.15)"
                        : b.status === "break_expired"
                        ? "rgba(239,68,68,0.15)"
                        : "rgba(99,102,241,0.15)",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusPillText,
                    {
                      color:
                        b.status === "present"
                          ? "#10b981"
                          : b.status === "on_break"
                          ? "#f59e0b"
                          : b.status === "break_expired"
                          ? "#ef4444"
                          : COLORS.primary,
                    },
                  ]}
                >
                  {b.status?.replace("_", " ")}
                </Text>
              </View>
            </View>
          ))}
          {!report.bookings?.length && (
            <Text style={styles.placeholderText}>No bookings yet.</Text>
          )}
        </ScrollView>
      )}
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
    marginBottom: 16,
  },
  eventScroll: {
    flexGrow: 0,
    marginBottom: 16,
  },
  eventChip: {
    backgroundColor: "#111827",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  eventChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  eventChipText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontFamily: "DMSans_500Medium",
  },
  eventChipTextActive: {
    color: "#fff",
    fontFamily: "DMSans_600SemiBold",
  },
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  placeholderText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
  },
  card: {
    backgroundColor: "#111827",
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 14,
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontFamily: "DMSans_700Bold",
  },
  cardSub: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  metaText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
  },
  sectionCard: {
    backgroundColor: "#111827",
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontFamily: "DMSans_700Bold",
    marginBottom: 14,
  },
  sectionTitle2: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontFamily: "DMSans_700Bold",
    marginBottom: 10,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statRowLabel: {
    flex: 1,
    color: COLORS.textMuted,
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
  },
  statRowValue: {
    fontSize: 16,
    fontFamily: "DMSans_700Bold",
  },
  fillBarWrap: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    marginTop: 10,
    overflow: "hidden",
  },
  fillBar: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  fillLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontFamily: "DMSans_400Regular",
    marginTop: 6,
    textAlign: "right",
  },
  bookingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#111827",
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    marginBottom: 8,
  },
  seatTag: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  seatTagText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontFamily: "DMSans_700Bold",
  },
  bookingName: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontFamily: "DMSans_600SemiBold",
  },
  bookingId: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontFamily: "DMSans_400Regular",
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusPillText: {
    fontSize: 10,
    fontFamily: "DMSans_600SemiBold",
    textTransform: "capitalize",
  },
});
