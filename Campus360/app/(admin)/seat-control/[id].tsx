import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  FlatList,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import API from "../../../utils/api";
import { COLORS, RADIUS } from "../../../utils/theme";
import { Ionicons } from "@expo/vector-icons";

export default function SeatControlDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // If id === "new", show create form; otherwise show detail
  const isNew = params.id === "new" || !params.id;

  const [auditorium, setAuditorium] = useState<any>(null);
  const [loading, setLoading] = useState(!isNew);

  // Create form state
  const [name, setName] = useState("");
  const [rowInput, setRowInput] = useState("A,B,C,D,E");
  const [seatsPerRow, setSeatsPerRow] = useState("10");
  const [blockedInput, setBlockedInput] = useState("");
  const [creating, setCreating] = useState(false);

  // Block seat modal
  const [blockModalVisible, setBlockModalVisible] = useState(false);
  const [toggleInput, setToggleInput] = useState("");
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (!isNew && params.id) {
      fetchAuditorium();
    }
  }, [params.id]);

  const fetchAuditorium = async () => {
    try {
      const res = await API.get(`/auditoriums/${params.id}`);
      setAuditorium(res.data.auditorium);
    } catch {
      Alert.alert("Error", "Failed to load auditorium");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    const rows = rowInput
      .split(",")
      .map((r) => r.trim().toUpperCase())
      .filter(Boolean);

    if (!name.trim() || rows.length === 0 || !seatsPerRow) {
      Alert.alert("Error", "Fill all required fields");
      return;
    }

    const spr = parseInt(seatsPerRow);
    if (isNaN(spr) || spr < 1 || spr > 50) {
      Alert.alert("Error", "Seats per row must be between 1 and 50");
      return;
    }

    const blocked = blockedInput
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);

    try {
      setCreating(true);
      await API.post("/auditoriums", {
        name: name.trim(),
        rows,
        seatsPerRow: spr,
        blockedSeats: blocked,
      });
      Alert.alert(
        "Created",
        `Auditorium "${name}" created with ${rows.length * spr} seats`,
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.message || "Failed to create");
    } finally {
      setCreating(false);
    }
  };

  // Preview seat grid for create form
  const previewRows = rowInput
    .split(",")
    .map((r) => r.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 6); // show max 6 rows in preview

  const previewSpr = Math.min(parseInt(seatsPerRow) || 5, 12);
  const previewBlocked = blockedInput
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // ─── CREATE NEW AUDITORIUM ───
  if (isNew) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        <ScrollView contentContainerStyle={styles.container}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <Text style={styles.pageTitle}>New Auditorium</Text>
          <Text style={styles.subtitle}>
            Define rows, seats per row, and blocked seats
          </Text>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Basic Info</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Auditorium name (e.g. Main Hall)"
              placeholderTextColor={COLORS.textMuted}
            />
            <Text style={styles.inputLabel}>
              Rows (comma-separated, e.g. A,B,C,D,E)
            </Text>
            <TextInput
              style={styles.input}
              value={rowInput}
              onChangeText={setRowInput}
              placeholder="A,B,C,D,E"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="characters"
            />
            <Text style={styles.inputLabel}>Seats per row</Text>
            <TextInput
              style={styles.input}
              value={seatsPerRow}
              onChangeText={(v) => {
                if (/^\d*$/.test(v)) setSeatsPerRow(v);
              }}
              placeholder="10"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="numeric"
            />
            <Text style={styles.inputLabel}>
              Blocked seats (comma-separated, e.g. A1,E10)
            </Text>
            <TextInput
              style={styles.input}
              value={blockedInput}
              onChangeText={setBlockedInput}
              placeholder="A1,E10 (optional)"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="characters"
            />
          </View>

          {/* SEAT PREVIEW */}
          {previewRows.length > 0 && previewSpr > 0 && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Preview</Text>
              <Text style={styles.previewMeta}>
                {previewRows.length} rows × {previewSpr} seats (
                {previewRows.length * previewSpr} total)
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View>
                  {previewRows.map((row) => (
                    <View key={row} style={styles.previewRow}>
                      <Text style={styles.previewRowLabel}>{row}</Text>
                      {Array.from({ length: previewSpr }, (_, i) => {
                        const seatNum = `${row}${i + 1}`;
                        const isBlocked = previewBlocked.includes(seatNum);
                        return (
                          <View
                            key={i}
                            style={[
                              styles.previewSeat,
                              isBlocked && styles.previewSeatBlocked,
                            ]}
                          >
                            {!isBlocked && (
                              <View style={styles.previewSeatNotch} />
                            )}
                          </View>
                        );
                      })}
                    </View>
                  ))}
                  {/* Stage indicator */}
                  <View style={styles.stageHint}>
                    <Text style={styles.stageHintText}>▲ STAGE</Text>
                  </View>
                </View>
              </ScrollView>
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.createBtn, creating && styles.createBtnDisabled]}
            onPress={handleCreate}
            disabled={creating}
          >
            {creating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.createBtnText}>Create Auditorium</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── AUDITORIUM DETAIL VIEW ───
  const aud = auditorium;
  const totalSeats = aud.rows.length * aud.seatsPerRow;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      contentContainerStyle={styles.container}
    >
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
      </TouchableOpacity>

      <Text style={styles.pageTitle}>{aud.name}</Text>

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { label: "Rows", value: aud.rows.length },
          { label: "Per Row", value: aud.seatsPerRow },
          { label: "Total", value: totalSeats },
          { label: "Blocked", value: aud.blockedSeats?.length || 0 },
        ].map((s) => (
          <View key={s.label} style={styles.statCard}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Visual layout */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Seat Layout</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {aud.rows.map((row: string) => (
              <View key={row} style={styles.previewRow}>
                <Text style={styles.previewRowLabel}>{row}</Text>
                {Array.from({ length: Math.min(aud.seatsPerRow, 15) }, (_, i) => {
                  const seatNum = `${row}${i + 1}`;
                  const isBlocked = aud.blockedSeats?.includes(seatNum);
                  return (
                    <View
                      key={i}
                      style={[
                        styles.previewSeat,
                        isBlocked && styles.previewSeatBlocked,
                      ]}
                    >
                      {!isBlocked && <View style={styles.previewSeatNotch} />}
                    </View>
                  );
                })}
                {aud.seatsPerRow > 15 && (
                  <Text style={styles.moreText}>+{aud.seatsPerRow - 15}</Text>
                )}
              </View>
            ))}
            <View style={styles.stageHint}>
              <Text style={styles.stageHintText}>▲ STAGE / PODIUM</Text>
            </View>
          </View>
        </ScrollView>

        {/* Legend */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.previewSeat, { marginHorizontal: 0, marginBottom: 0 }]} />
            <Text style={styles.legendText}>Available</Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.previewSeat,
                styles.previewSeatBlocked,
                { marginHorizontal: 0, marginBottom: 0 },
              ]}
            />
            <Text style={styles.legendText}>Blocked</Text>
          </View>
        </View>
      </View>

      {/* Blocked seats list */}
      {aud.blockedSeats?.length > 0 && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Blocked Seats</Text>
          <View style={styles.chipWrap}>
            {aud.blockedSeats.map((s: string) => (
              <View key={s} style={styles.chip}>
                <Text style={styles.chipText}>{s}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Row list */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Row Configuration</Text>
        <View style={styles.chipWrap}>
          {aud.rows.map((r: string) => (
            <View key={r} style={[styles.chip, styles.chipRow]}>
              <Text style={styles.chipText}>
                {r} (seats {r}1–{r}
                {aud.seatsPerRow})
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 60,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
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
    marginBottom: 20,
  },
  pageTitle: {
    color: COLORS.textPrimary,
    fontSize: 26,
    fontFamily: "DMSans_800ExtraBold",
    marginBottom: 4,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    marginBottom: 24,
  },
  sectionCard: {
    backgroundColor: "#111827",
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontFamily: "DMSans_700Bold",
    marginBottom: 14,
  },
  inputLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: "DMSans_500Medium",
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 13,
    color: COLORS.textPrimary,
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    marginBottom: 12,
  },
  statsRow: {
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
  },
  statValue: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontFamily: "DMSans_700Bold",
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontFamily: "DMSans_500Medium",
    marginTop: 2,
  },
  previewMeta: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
    marginBottom: 12,
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  previewRowLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontFamily: "DMSans_700Bold",
    width: 20,
    textAlign: "center",
    marginRight: 4,
  },
  previewSeat: {
    width: 22,
    height: 18,
    backgroundColor: "#10b981",
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    marginHorizontal: 2,
    marginBottom: 2,
    overflow: "hidden",
  },
  previewSeatBlocked: {
    backgroundColor: "#1e293b",
    opacity: 0.4,
  },
  previewSeatNotch: {
    position: "absolute",
    top: 0,
    alignSelf: "center",
    width: "55%",
    height: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  stageHint: {
    alignItems: "center",
    marginTop: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  stageHintText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontFamily: "DMSans_700Bold",
    letterSpacing: 2,
  },
  moreText: {
    color: COLORS.textMuted,
    fontSize: 10,
    alignSelf: "center",
    marginLeft: 4,
  },
  legendRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipRow: {
    borderColor: "rgba(99,102,241,0.3)",
    backgroundColor: "rgba(99,102,241,0.08)",
  },
  chipText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontFamily: "DMSans_600SemiBold",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  createBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.button,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  createBtnDisabled: { opacity: 0.6 },
  createBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "DMSans_700Bold",
  },
});
