import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, ScrollView, StatusBar } from "react-native";
import { useLocalSearchParams } from "expo-router";
import API from "../../../utils/api";
import { COLORS, FONT, RADIUS } from "../../../utils/theme";
import { useAlert } from "../../../components/CustomAlert";
import { useToast } from "../../../components/Toast";

export default function SeatBookingScreen() {
  const params = useLocalSearchParams();
  const id = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";
  const alert = useAlert();
  const toast = useToast();
  const [seats, setSeats] = useState<any[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [locking, setLocking] = useState(false);

  useEffect(() => { if (!id) return; fetchSeats(); }, [id]);

  const fetchSeats = async () => {
    try {
      const res = await API.get(`/events/${id}/seats`);
      setSeats(res.data.seats);
    } catch (error: any) {
      alert.show({ type: "error", title: "Error", message: "Failed to load seats" });
    } finally { setLoading(false); }
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
      toast.show(`Seat ${selectedSeat.seatNumber} booked successfully`, "success");
      setSelectedSeat(null);
      fetchSeats();
    } catch (error: any) {
      alert.show({ type: "error", title: "Booking Failed", message: error?.response?.data?.message || "Failed to book seat" });
    } finally { setLocking(false); }
  };

  const groupedSeats = seats.reduce((acc: any, seat: any) => {
    if (!acc[seat.row]) acc[seat.row] = [];
    acc[seat.row].push(seat);
    acc[seat.row].sort((a: any, b: any) => a.number - b.number);
    return acc;
  }, {});

  const renderSeat = ({ item }: any) => {
    let bg = "#10b981";
    if (item.status === "locked") bg = COLORS.warning;
    if (item.status === "booked") bg = COLORS.primary;
    const isSelected = selectedSeat?._id === item._id;
    return (
      <TouchableOpacity
        style={[styles.seat, { backgroundColor: bg }, item.status === "booked" && styles.bookedSeat, isSelected && styles.selectedSeat]}
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
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <View style={styles.loaderRing}><ActivityIndicator size="large" color={COLORS.primary} /></View>
        <Text style={styles.loadingLabel}>CAMPUS360</Text>
        <Text style={styles.loadingText}>Fetching available seats…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      {/* Top accent — student screen rule */}
      <View style={styles.topAccent} />
      {/* Top-right ambient glow */}
      <View style={styles.bgGlow} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>CAMPUS360</Text>
          <Text style={styles.headerTitle}>Select Your Seat</Text>
        </View>
        <View style={styles.hallTag}>
          <Text style={styles.hallTagText}>Hall A</Text>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legendRow}>
        {[
          { color: "#10b981", label: "Available" },
          { color: COLORS.warning, label: "Locked" },
          { color: COLORS.primary, label: "Booked" },
        ].map((item) => (
          <View key={item.label} style={styles.legendItem}>
            <View style={[styles.legendSeat, { backgroundColor: item.color }]} />
            <Text style={styles.legendText}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* Stage */}
      <View style={styles.stageContainer}>
        <View style={styles.stageBar}>
          <Text style={styles.stageText}>STAGE / PODIUM</Text>
        </View>
        <View style={styles.stageShadow} />
      </View>

      {/* Seat Grid */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {Object.keys(groupedSeats).map((row) => {
            const leftSeats  = groupedSeats[row].slice(0, 5);
            const rightSeats = groupedSeats[row].slice(5);
            return (
              <View key={row} style={styles.rowBlock}>
                <View style={styles.rowLabelBox}><Text style={styles.rowLabel}>{row}</Text></View>
                <View style={styles.seatRow}>
                  <FlatList horizontal data={leftSeats} keyExtractor={(item) => item._id} renderItem={renderSeat} scrollEnabled={false} />
                  <View style={styles.aisle} />
                  <FlatList horizontal data={rightSeats} keyExtractor={(item) => item._id} renderItem={renderSeat} scrollEnabled={false} />
                </View>
                <View style={styles.rowLabelBox}><Text style={styles.rowLabel}>{row}</Text></View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom booking bar */}
      {selectedSeat && (
        <View style={styles.bottomBar}>
          <View style={styles.bottomBarInner}>
            <View>
              <Text style={styles.bottomBarLabel}>SELECTED</Text>
              <View style={styles.seatChip}>
                <Text style={styles.seatChipText}>Seat {selectedSeat.seatNumber}</Text>
              </View>
            </View>
            <TouchableOpacity style={[styles.confirmButton, locking && styles.confirmButtonDisabled]} onPress={handleConfirmBooking} disabled={locking} activeOpacity={0.85}>
              {locking ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.confirmButtonText}>Confirm Booking</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingTop: 56, paddingHorizontal: 16 },
  center:    { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background, gap: 10 },
  loaderRing:   { width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: COLORS.primaryBorder, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  loadingLabel: { color: COLORS.primary, fontSize: 11, fontFamily: FONT.bold, letterSpacing: 3 },
  loadingText:  { color: COLORS.textMuted, fontSize: 13, fontFamily: FONT.regular },
  topAccent: { height: 3, backgroundColor: COLORS.primary },
  bgGlow:    { position: "absolute", top: -80, right: -80, width: 260, height: 260, borderRadius: 130, backgroundColor: COLORS.primary, opacity: 0.08 },
  header:    { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerLabel: { color: COLORS.primary, fontSize: 10, fontFamily: FONT.bold, letterSpacing: 3, marginBottom: 4 },
  headerTitle: { color: COLORS.textPrimary, fontSize: 22, fontFamily: FONT.extraBold, letterSpacing: 0.2 },
  hallTag:     { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginTop: 4 },
  hallTagText: { color: COLORS.textMuted, fontSize: 12, fontFamily: FONT.semiBold, letterSpacing: 0.5 },
  legendRow:   { flexDirection: "row", gap: 20, marginBottom: 20 },
  legendItem:  { flexDirection: "row", alignItems: "center", gap: 7 },
  legendSeat:  { width: 12, height: 10, borderTopLeftRadius: 3, borderTopRightRadius: 3, borderBottomLeftRadius: 1, borderBottomRightRadius: 1 },
  legendText:  { color: COLORS.textMuted, fontSize: 12, fontFamily: FONT.medium },
  stageContainer: { marginBottom: 24 },
  stageBar:    { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  stageText:   { color: COLORS.textMuted, fontSize: 11, fontFamily: FONT.bold, letterSpacing: 4 },
  stageShadow: { height: 5, marginHorizontal: 20, backgroundColor: COLORS.surface, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, opacity: 0.5 },
  rowBlock:    { flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 8 },
  rowLabelBox: { width: 22, height: 22, borderRadius: 5, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, justifyContent: "center", alignItems: "center" },
  rowLabel:    { color: COLORS.textMuted, fontSize: 10, fontFamily: FONT.bold },
  seatRow:     { flexDirection: "row", alignItems: "center" },
  aisle:       { width: 16, borderLeftWidth: 1, borderLeftColor: COLORS.border, height: 28, marginHorizontal: 4 },
  seat:        { width: 42, height: 36, marginHorizontal: 3, borderTopLeftRadius: 9, borderTopRightRadius: 9, borderBottomLeftRadius: 3, borderBottomRightRadius: 3, justifyContent: "center", alignItems: "center", elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.35, shadowRadius: 3 },
  seatNotch:   { position: "absolute", top: 0, width: "55%", height: 3, backgroundColor: "rgba(255,255,255,0.15)", borderBottomLeftRadius: 3, borderBottomRightRadius: 3 },
  bookedSeat:  { opacity: 0.4 },
  selectedSeat:{ borderWidth: 2, borderColor: COLORS.textPrimary, shadowColor: COLORS.textPrimary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 10 },
  seatText:    { color: "#fff", fontFamily: FONT.bold, fontSize: 10, letterSpacing: 0.2 },
  bottomBar:   { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },
  bottomBarInner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  bottomBarLabel: { color: COLORS.textMuted, fontSize: 10, fontFamily: FONT.bold, letterSpacing: 2.5, marginBottom: 6 },
  seatChip:    { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 7, alignSelf: "flex-start" },
  seatChipText:{ color: COLORS.textPrimary, fontFamily: FONT.bold, fontSize: 14, letterSpacing: 0.3 },
  confirmButton:         { backgroundColor: COLORS.primary, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", minWidth: 148 },
  confirmButtonDisabled: { backgroundColor: COLORS.border },
  confirmButtonText:     { color: "#fff", fontSize: 14, fontFamily: FONT.bold, letterSpacing: 0.4 },
});