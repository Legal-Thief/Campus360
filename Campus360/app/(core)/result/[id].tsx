import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import API from "../../../utils/api";
import { COLORS } from "../../../utils/theme";

export default function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  console.log("RESULT PARAMS:", params);

  const id =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
      ? params.id[0]
      : "";

  console.log("RESULT SCREEN ID:", id);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      console.log("INVALID RESULT ID");
      setLoading(false);
      return;
    }
    fetchStatus();
  }, [id]);

  const fetchStatus = async () => {
    try {
      console.log("FETCHING STATUS FOR:", id);
      const res = await API.get(`/events/${id}/my-status`);
      setData(res.data);
    } catch (err: any) {
      console.log("Error fetching status:", err?.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <View style={styles.loaderRing}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
        <Text style={styles.loadingTitle}>Campus360</Text>
        <Text style={styles.loadingText}>Fetching your result…</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.center}>
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>No Result Found</Text>
          <Text style={styles.errorSub}>
            Your result hasn't been published yet or the event ID is invalid.
          </Text>
        </View>
      </View>
    );
  }

  const canBook =
    true &&
    data.slotStart &&
    new Date() >= new Date(data.slotStart);

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <View style={styles.container}>

      {/* ── Page Header ── */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageLabel}>CAMPUS360</Text>
        <Text style={styles.pageTitle}>Your Result</Text>
      </View>

      {/* ── Score Card (Hero) ── */}
      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>SCORE</Text>
        <Text style={styles.heroValue}>{data.score}</Text>
        <View style={styles.heroDivider} />
        <View style={styles.heroRow}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatLabel}>RANK</Text>
            <Text style={styles.heroStatValue}>{data.priority}</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatLabel}>STATUS</Text>
            <Text style={[styles.heroStatValue, { color: "#10b981" }]}>
              Qualified
            </Text>
          </View>
        </View>
      </View>

      {/* ── Time Slot Card ── */}
      <View style={styles.slotCard}>
        <View style={styles.slotLeft}>
          <View style={styles.slotDot} />
          <View>
            <Text style={styles.slotLabel}>ASSIGNED TIME SLOT</Text>
            <Text style={styles.slotValue}>
              {data.slotStart && data.slotEnd
                ? `${formatTime(data.slotStart)} — ${formatTime(data.slotEnd)}`
                : "Not assigned yet"}
            </Text>
          </View>
        </View>
        {data.slotStart && (
          <View style={styles.slotBadge}>
            <Text style={styles.slotBadgeText}>
              {new Date(data.slotStart).toLocaleDateString([], {
                month: "short",
                day: "numeric",
              })}
            </Text>
          </View>
        )}
      </View>

      {/* ── Book Seat Button ── */}
      <TouchableOpacity
  style={[styles.button, !canBook && styles.buttonDisabled]}
  disabled={!canBook}
  onPress={() => {
    console.log("GOING TO SEAT BOOKING:", id);
    router.push(`/(core)/seat-booking/${id}`);
  }}
>
  <Text style={styles.buttonText}>
    {canBook ? "Book Your Seat" : "Booking Not Open Yet"}
  </Text>
</TouchableOpacity>

      {!canBook && (
        <Text style={styles.bookingNote}>
          Seat booking opens at your assigned slot time.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
    paddingHorizontal: 20,
    paddingTop: 64,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#020617",
    gap: 12,
    padding: 24,
  },

  /* ── Loader ── */
  loaderRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: "#312e81",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },

  loadingTitle: {
    color: "#e2e8f0",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 2,
  },

  loadingText: {
    color: "#475569",
    fontSize: 13,
    letterSpacing: 0.4,
  },

  /* ── Error ── */
  errorBox: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#1e293b",
    borderRadius: 16,
    padding: 28,
    alignItems: "center",
    gap: 10,
  },

  errorTitle: {
    color: "#ef4444",
    fontSize: 17,
    fontWeight: "700",
  },

  errorSub: {
    color: "#64748b",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },

  /* ── Page Header ── */
  pageHeader: {
    marginBottom: 28,
  },

  pageLabel: {
    color: "#4f46e5",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 3,
    marginBottom: 4,
  },

  pageTitle: {
    color: "#f1f5f9",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0.2,
  },

  /* ── Hero Score Card ── */
  heroCard: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#1e293b",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    marginBottom: 16,
  },

  heroLabel: {
    color: "#475569",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 3,
    marginBottom: 10,
  },

  heroValue: {
    color: "#f1f5f9",
    fontSize: 56,
    fontWeight: "800",
    letterSpacing: -1,
    lineHeight: 64,
  },

  heroDivider: {
    width: "100%",
    height: 1,
    backgroundColor: "#1e293b",
    marginVertical: 20,
  },

  heroRow: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-around",
    alignItems: "center",
  },

  heroStat: {
    alignItems: "center",
    flex: 1,
  },

  heroStatDivider: {
    width: 1,
    height: 36,
    backgroundColor: "#1e293b",
  },

  heroStatLabel: {
    color: "#475569",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: 6,
  },

  heroStatValue: {
    color: "#f1f5f9",
    fontSize: 22,
    fontWeight: "700",
  },

  /* ── Slot Card ── */
  slotCard: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#1e293b",
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 32,
  },

  slotLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },

  slotDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4f46e5",
  },

  slotLabel: {
    color: "#475569",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: 4,
  },

  slotValue: {
    color: "#e2e8f0",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  slotBadge: {
    backgroundColor: "#1e1b4b",
    borderWidth: 1,
    borderColor: "#3730a3",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  slotBadgeText: {
    color: "#a5b4fc",
    fontSize: 12,
    fontWeight: "700",
  },

  /* ── Button ── */
  button: {
    backgroundColor: "#4f46e5",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },

  buttonDisabled: {
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    shadowOpacity: 0,
    elevation: 0,
  },

  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  bookingNote: {
    color: "#475569",
    fontSize: 12,
    textAlign: "center",
    marginTop: 12,
    letterSpacing: 0.3,
  },
});