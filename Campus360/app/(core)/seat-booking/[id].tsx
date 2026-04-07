import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import API from "../../../utils/api";
import { COLORS } from "../../../utils/theme";

export default function SeatBookingScreen() {
  const params = useLocalSearchParams();

  const id =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
      ? params.id[0]
      : "";

  const [seats, setSeats] = useState<any[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [locking, setLocking] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchSeats();
  }, [id]);

  const fetchSeats = async () => {
    try {
      const res = await API.get(`/events/${id}/seats`);
      setSeats(res.data.seats);
    } catch (error: any) {
      console.log("SEAT FETCH ERROR:", error?.response?.data || error);
      Alert.alert("Error", "Failed to load seats");
    } finally {
      setLoading(false);
    }
  };

  const handleSeatPress = (seat: any) => {
    if (seat.status === "booked") return;
    setSelectedSeat(seat);
  };

  const handleConfirmBooking = async () => {
    if (!selectedSeat) return;
    try {
      setLocking(true);
      await API.post(`/events/${id}/seats/${selectedSeat._id}/lock`);
      await API.post(`/events/${id}/seats/${selectedSeat._id}/confirm`);
      Alert.alert("Success", `Seat ${selectedSeat.seatNumber} booked successfully`);
      setSelectedSeat(null);
      fetchSeats();
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to book seat"
      );
    } finally {
      setLocking(false);
    }
  };

  const groupedSeats = seats.reduce((acc: any, seat: any) => {
    if (!acc[seat.row]) acc[seat.row] = [];
    acc[seat.row].push(seat);
    acc[seat.row].sort((a: any, b: any) => a.number - b.number);
    return acc;
  }, {});

  const renderSeat = ({ item }: any) => {
    let backgroundColor = "#10b981";
    if (item.status === "locked") backgroundColor = "#f59e0b";
    if (item.status === "booked") backgroundColor = "#ef4444";

    const isSelected = selectedSeat?._id === item._id;

    return (
      <TouchableOpacity
        style={[
          styles.seat,
          { backgroundColor },
          item.status === "booked" && styles.bookedSeat,
          isSelected && styles.selectedSeat,
        ]}
        disabled={item.status === "booked"}
        onPress={() => handleSeatPress(item)}
        activeOpacity={0.75}
      >
        <View style={styles.seatNotch} />
        <Text style={styles.seatText}>{item.seatNumber}</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <View style={styles.loaderRing}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
        <Text style={styles.loadingTitle}>Campus360</Text>
        <Text style={styles.loadingText}>Fetching available seats…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>CAMPUS360</Text>
          <Text style={styles.headerTitle}>Select Your Seat</Text>
        </View>
        <View style={styles.hallTag}>
          <Text style={styles.hallTagText}>Hall A</Text>
        </View>
      </View>

      {/* ── Legend ── */}
      <View style={styles.legendRow}>
        {[
          { color: "#10b981", label: "Available" },
          { color: "#f59e0b", label: "Locked" },
          { color: "#ef4444", label: "Booked" },
        ].map((item) => (
          <View key={item.label} style={styles.legendItem}>
            <View style={[styles.legendSeat, { backgroundColor: item.color }]} />
            <Text style={styles.legendText}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* ── Stage ── */}
      <View style={styles.stageContainer}>
        <View style={styles.stageBar}>
          <Text style={styles.stageText}>STAGE / PODIUM</Text>
        </View>
        <View style={styles.stageShadow} />
      </View>

      {/* ── Seat Grid ── */}
     <ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
>
  <View>
    {Object.keys(groupedSeats).map((row) => {
      const leftSeats = groupedSeats[row].slice(0, 5);
      const rightSeats = groupedSeats[row].slice(5);

      return (
        <View key={row} style={styles.rowBlock}>
          <View style={styles.rowLabelBox}>
            <Text style={styles.rowLabel}>{row}</Text>
          </View>

          <View style={styles.seatRow}>
            <FlatList
              horizontal
              data={leftSeats}
              keyExtractor={(item) => item._id}
              renderItem={renderSeat}
              scrollEnabled={false}
            />

            <View style={styles.aisle} />

            <FlatList
              horizontal
              data={rightSeats}
              keyExtractor={(item) => item._id}
              renderItem={renderSeat}
              scrollEnabled={false}
            />
          </View>

          <View style={styles.rowLabelBox}>
            <Text style={styles.rowLabel}>{row}</Text>
          </View>
        </View>
      );
    })}
  </View>
</ScrollView>

      {/* ── Bottom Booking Bar ── */}
      {selectedSeat && (
        <View style={styles.bottomBar}>
          <View style={styles.bottomBarInner}>
            <View>
              <Text style={styles.bottomBarLabel}>SELECTED</Text>
              <View style={styles.seatChip}>
                <Text style={styles.seatChipText}>
                  Seat {selectedSeat.seatNumber}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.confirmButton,
                locking && styles.confirmButtonDisabled,
              ]}
              onPress={handleConfirmBooking}
              disabled={locking}
              activeOpacity={0.85}
            >
              {locking ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.confirmButtonText}>Confirm Booking</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
    paddingTop: 56,
    paddingHorizontal: 16,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#020617",
    gap: 10,
  },

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

  /* ── Header ── */
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#0f172a",
  },

  headerLabel: {
    color: "#4f46e5",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 3,
    marginBottom: 4,
  },

  headerTitle: {
    color: "#f1f5f9",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.2,
  },

  hallTag: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#1e293b",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 4,
  },

  hallTagText: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },

  /* ── Legend ── */
  legendRow: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 20,
  },

  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  legendSeat: {
    width: 12,
    height: 10,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    borderBottomLeftRadius: 1,
    borderBottomRightRadius: 1,
  },

  legendText: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "500",
  },

  /* ── Stage ── */
  stageContainer: {
    marginBottom: 24,
  },

  stageBar: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#1e293b",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },

  stageText: {
    color: "#334155",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 4,
  },

  stageShadow: {
    height: 5,
    marginHorizontal: 20,
    backgroundColor: "#0f172a",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    opacity: 0.5,
  },

  /* ── Seat Grid ── */
  scrollContent: {
    paddingBottom: 20,
  },

  rowBlock: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },

  rowLabelBox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#1e293b",
    justifyContent: "center",
    alignItems: "center",
  },

  rowLabel: {
    color: "#475569",
    fontSize: 10,
    fontWeight: "700",
  },

  seatRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  aisle: {
    width: 16,
    borderLeftWidth: 1,
    borderLeftColor: "#1e293b",
    height: 28,
    marginHorizontal: 4,
  },

  /* ── Seat ── */
  seat: {
    width: 42,
    height: 36,
    marginHorizontal: 3,
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
  },

  seatNotch: {
    position: "absolute",
    top: 0,
    width: "55%",
    height: 3,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },

  bookedSeat: {
    opacity: 0.4,
  },

  selectedSeat: {
    borderWidth: 2,
    borderColor: "#fbbf24",
    shadowColor: "#fbbf24",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 10,
  },

  seatText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 10,
    letterSpacing: 0.2,
  },

  /* ── Bottom Bar ── */
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#0a0f1e",
    borderTopWidth: 1,
    borderTopColor: "#0f172a",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },

  bottomBarInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  bottomBarLabel: {
    color: "#334155",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2.5,
    marginBottom: 6,
  },

  seatChip: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#1e293b",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 7,
    alignSelf: "flex-start",
  },

  seatChipText: {
    color: "#e2e8f0",
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 0.3,
  },

  confirmButton: {
    backgroundColor: "#4f46e5",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 148,
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },

  confirmButtonDisabled: {
    backgroundColor: "#1e293b",
    shadowOpacity: 0,
    elevation: 0,
  },

  confirmButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
});