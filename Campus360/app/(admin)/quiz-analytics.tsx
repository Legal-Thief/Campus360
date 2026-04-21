import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import API from "../../utils/api";
import { COLORS, RADIUS } from "../../utils/theme";
import { Ionicons } from "@expo/vector-icons";

export default function QuizAnalytics() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const eventId = String(params.eventId || "");
  const eventTitle = String(params.eventTitle || "Event");

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) return;
    fetchAnalytics();
  }, [eventId]);

  const fetchAnalytics = async () => {
    try {
      const res = await API.get(`/events/${eventId}/analytics`);
      setData(res.data);
    } catch (error: any) {
      Alert.alert("Error", "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!data || !data.attempts?.length) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.center}>
          <Ionicons name="bar-chart-outline" size={48} color={COLORS.border} />
          <Text style={styles.emptyText}>No quiz submissions yet</Text>
        </View>
      </View>
    );
  }

  const { attempts, stats } = data;

  // Score distribution buckets
  const maxScore = attempts[0]?.eventId?.quiz?.questions?.length || stats.highest;
  const buckets: Record<string, number> = {};
  attempts.forEach((a: any) => {
    const key = `${a.score}`;
    buckets[key] = (buckets[key] || 0) + 1;
  });
  const bucketEntries = Object.entries(buckets).sort(
    (a, b) => Number(a[0]) - Number(b[0])
  );
  const maxBucket = Math.max(...Object.values(buckets));

  const getMedal = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return null;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
      </TouchableOpacity>

      <Text style={styles.title}>Quiz Analytics</Text>
      <Text style={styles.subtitle} numberOfLines={1}>
        {eventTitle}
      </Text>

      <FlatList
        data={attempts}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListHeaderComponent={
          <>
            {/* Stats */}
            <View style={styles.statsGrid}>
              {[
                { label: "Total", value: stats.total, icon: "people-outline" },
                { label: "Average", value: stats.average, icon: "analytics-outline" },
                { label: "Highest", value: stats.highest, icon: "arrow-up-outline" },
                { label: "Lowest", value: stats.lowest, icon: "arrow-down-outline" },
              ].map((s) => (
                <View key={s.label} style={styles.statCard}>
                  <Ionicons name={s.icon as any} size={18} color={COLORS.primary} />
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* Score distribution chart */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Score distribution</Text>
              <View style={styles.chart}>
                {bucketEntries.map(([score, count]) => (
                  <View key={score} style={styles.barGroup}>
                    <Text style={styles.barCount}>{count}</Text>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: Math.max(12, (count / maxBucket) * 80),
                          backgroundColor:
                            Number(score) >= stats.highest * 0.7
                              ? "#10b981"
                              : Number(score) >= stats.highest * 0.4
                              ? "#f59e0b"
                              : "#ef4444",
                        },
                      ]}
                    />
                    <Text style={styles.barLabel}>{score}</Text>
                  </View>
                ))}
              </View>
            </View>

            <Text style={styles.sectionTitle2}>Leaderboard</Text>
          </>
        }
        renderItem={({ item, index }) => (
          <View style={[styles.rankRow, index < 3 && styles.rankRowTop]}>
            <Text style={styles.rankNum}>
              {getMedal(item.priority || index + 1) || `#${item.priority || index + 1}`}
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.rankName}>{item.userId?.name || "Unknown"}</Text>
              <Text style={styles.rankId}>
                {item.userId?.studentId || item.userId?.email}
              </Text>
            </View>
            <View
              style={[
                styles.scorePill,
                {
                  backgroundColor:
                    item.score >= stats.highest * 0.7
                      ? "rgba(16,185,129,0.15)"
                      : "rgba(99,102,241,0.15)",
                },
              ]}
            >
              <Text
                style={[
                  styles.scorePillText,
                  {
                    color:
                      item.score >= stats.highest * 0.7 ? "#10b981" : COLORS.primary,
                  },
                ]}
              >
                {item.score} pts
              </Text>
            </View>
          </View>
        )}
      />
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
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 26,
    fontFamily: "DMSans_800ExtraBold",
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    marginTop: 4,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#111827",
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontFamily: "DMSans_700Bold",
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontFamily: "DMSans_500Medium",
  },
  sectionCard: {
    backgroundColor: "#111827",
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontFamily: "DMSans_600SemiBold",
    marginBottom: 16,
  },
  sectionTitle2: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontFamily: "DMSans_700Bold",
    marginBottom: 12,
  },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    height: 110,
  },
  barGroup: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  barCount: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontFamily: "DMSans_500Medium",
  },
  bar: {
    width: "100%",
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontFamily: "DMSans_500Medium",
  },
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#111827",
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 8,
  },
  rankRowTop: {
    borderColor: "rgba(99,102,241,0.3)",
  },
  rankNum: {
    fontSize: 18,
    width: 36,
    textAlign: "center",
    color: COLORS.textPrimary,
    fontFamily: "DMSans_700Bold",
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
  scorePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  scorePillText: {
    fontSize: 13,
    fontFamily: "DMSans_700Bold",
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 15,
    fontFamily: "DMSans_400Regular",
  },
});
