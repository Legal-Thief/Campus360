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
import { COLORS, FONT, RADIUS } from "../../utils/theme";
import { Ionicons } from "@expo/vector-icons";

export default function Priority() {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

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
    setLoadingAnalytics(true);
    try {
      const res = await API.get(`/events/${event._id}/analytics`);
      setAnalytics(res.data);
    } catch {
      setAnalytics(null);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const handleGeneratePriority = async () => {
    if (!selectedEvent) return;
    Alert.alert(
      "Generate Priority",
      "This will recalculate rankings and time slots for all students. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Generate",
          onPress: async () => {
            try {
              setGenerating(true);
              const res = await API.get(`/events/${selectedEvent._id}/priority`);
              Alert.alert("Success", res.data.message || "Priority generated");
              // Refresh analytics
              const analyticsRes = await API.get(`/events/${selectedEvent._id}/analytics`);
              setAnalytics(analyticsRes.data);
            } catch (error: any) {
              Alert.alert("Error", error?.response?.data?.message || "Failed");
            } finally {
              setGenerating(false);
            }
          },
        },
      ]
    );
  };

  const getRankLabel = (rank: number) => {
    if (rank === 1) return { text: "#1", color: "#F59E0B" };  // gold
    if (rank === 2) return { text: "#2", color: "#CCCCCC" };  // silver
    if (rank === 3) return { text: "#3", color: "#CD7F32" };  // bronze
    return { text: `#${rank}`, color: COLORS.textMuted };
  };

  const formatSlot = (start: string, end: string) => {
    if (!start || !end) return "Not assigned";
    const fmt = (d: string) =>
      new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return `${fmt(start)} – ${fmt(end)}`;
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
      {/* Top accent + right vertical bar — admin screen rule */}
      <View style={styles.topAccent} />
      <View style={styles.rightBar} />
      {/* Top-right ambient glow */}
      <View style={styles.bgGlow} />
      <Text style={styles.title}>Priority Calculation</Text>
      <Text style={styles.subtitle}>Select an event to view rankings</Text>

      {/* Event picker */}
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
          <Ionicons name="trophy-outline" size={48} color={COLORS.border} />
          <Text style={styles.placeholderText}>
            Select an event above to view rankings
          </Text>
        </View>
      )}

      {selectedEvent && (
        <>
          {/* Stats cards */}
          {analytics?.stats && (
            <View style={styles.statsRow}>
              {[
                { label: "Participants", value: analytics.stats.total },
                { label: "Avg Score", value: analytics.stats.average },
                { label: "Highest", value: analytics.stats.highest },
                { label: "Lowest", value: analytics.stats.lowest },
              ].map((s) => (
                <View key={s.label} style={styles.statCard}>
                  <Text style={styles.statLabel}>{s.label}</Text>
                  <Text style={styles.statValue}>{s.value}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Generate button */}
          <TouchableOpacity
            style={[styles.generateBtn, generating && styles.generateBtnDisabled]}
            onPress={handleGeneratePriority}
            disabled={generating}
          >
            {generating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="flash-outline" size={16} color="#fff" />
                <Text style={styles.generateBtnText}>
                  {analytics?.attempts?.some((a: any) => a.priority)
                    ? "Recalculate Priority"
                    : "Generate Priority"}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Rankings table */}
          {loadingAnalytics ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
          ) : analytics?.attempts?.length > 0 ? (
            <FlatList
              data={analytics.attempts}
              keyExtractor={(item) => item._id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
              renderItem={({ item, index }) => {
                const rankLabel = getRankLabel(item.priority || index + 1);
                return (
                  <View style={styles.rankRow}>
                    <Text style={[styles.rankMedal, { color: rankLabel.color }]}>{rankLabel.text}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rankName}>
                      {item.userId?.name || "Unknown"}
                    </Text>
                    <Text style={styles.rankId}>
                      {item.userId?.studentId || item.userId?.email}
                    </Text>
                    {item.slotStart && (
                      <Text style={styles.rankSlot}>
                        Slot: {formatSlot(item.slotStart, item.slotEnd)}
                      </Text>
                    )}
                  </View>
                  <View style={styles.scoreBox}>
                    <Text style={styles.scoreValue}>{item.score}</Text>
                    <Text style={styles.scoreLabel}>pts</Text>
                  </View>
                </View>
              );
              }}
            />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>
                No quiz submissions yet for this event.
              </Text>
            </View>
          )}
        </>
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
  topAccent: {
    position: "absolute", top: 0, left: 0, right: 0,
    height: 3, backgroundColor: COLORS.primary,
  },
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
    marginBottom: 16,
    flexGrow: 0,
  },
  eventChip: {
    backgroundColor: COLORS.surface,
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
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    alignItems: "center",
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontFamily: "DMSans_500Medium",
    marginBottom: 4,
  },
  statValue: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontFamily: "DMSans_700Bold",
  },
  generateBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.button,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 20,
  },
  generateBtnDisabled: {
    opacity: 0.6,
  },
  generateBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "DMSans_700Bold",
  },
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 8,
  },
  rankMedal: {
    fontSize: 20,
    width: 36,
    textAlign: "center",
  },
  rankName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontFamily: "DMSans_600SemiBold",
  },
  rankId: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
    marginTop: 2,
  },
  rankSlot: {
    color: COLORS.primary,
    fontSize: 11,
    fontFamily: "DMSans_500Medium",
    marginTop: 3,
  },
  scoreBox: {
    alignItems: "center",
  },
  scoreValue: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontFamily: "DMSans_800ExtraBold",
  },
  scoreLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontFamily: "DMSans_400Regular",
  },
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    paddingTop: 60,
  },
  placeholderText: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: "center",
    fontFamily: "DMSans_400Regular",
  },
});
