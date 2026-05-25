import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  PanResponder,
  Animated,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import API from "../../../utils/api";
import { COLORS, RADIUS } from "../../../utils/theme";
import { Ionicons } from "@expo/vector-icons";

//  Types 
type RowItem = {
  id: string;
  type: "row";
  label: string;
  cols: number[]; // 1=available, -1=blocked, 0=aisle-gap
};

type DividerItem = {
  id: string;
  type: "divider";
  label: string;
};

type LayoutItem = RowItem | DividerItem;

type EditMode = "view" | "block" | "unblock" | "gap";

let _uid = 100;
const uid = () => `i${++_uid}`;

//  Seat chip
const SeatChip = ({
  col,
  label,
  mode,
  onPress,
}: {
  col: number;
  label: string;
  mode: EditMode;
  onPress: () => void;
}) => {
  const blocked = col === -1;
  const gap = col === 0;

  if (gap) {
    return (
      <TouchableOpacity onPress={onPress} style={styles.aisleGap}>
        <Text style={styles.aisleGapText}>╎</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.seat, blocked && styles.seatBlocked]}
    >
      <View style={styles.seatNotch} />
      {!blocked && <Text style={styles.seatLabel}>{label}</Text>}
    </TouchableOpacity>
  );
};

//  Main component 
export default function SeatControlDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const isNew = params.id === "new" || !params.id;

  // ── Existing auditorium view state ──
  const [auditorium, setAuditorium] = useState<any>(null);
  const [loading, setLoading] = useState(!isNew);

  // ── Create / Builder state ──
  const [audName, setAudName] = useState("");
  const [layout, setLayout] = useState<LayoutItem[]>([
    { id: uid(), type: "row", label: "A", cols: [1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1] },
    { id: uid(), type: "row", label: "B", cols: [1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1] },
    { id: uid(), type: "row", label: "C", cols: [1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1] },
    { id: uid(), type: "divider", label: "Stairs / Aisle" },
    { id: uid(), type: "row", label: "D", cols: [1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1] },
    { id: uid(), type: "row", label: "E", cols: [1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1] },
  ]);
  const [mode, setMode] = useState<EditMode>("view");
  const [creating, setCreating] = useState(false);

  // ── Drag-to-reorder ──
  const dragIndex = useRef<number | null>(null);
  const dragY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isNew && params.id) fetchAuditorium();
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

  // ── Layout helpers ──
  const addRow = () => {
    const rows = layout.filter((x) => x.type === "row") as RowItem[];
    const next = String.fromCharCode(65 + (rows.length % 26));
    setLayout((prev) => [
      ...prev,
      { id: uid(), type: "row", label: next, cols: [1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1] },
    ]);
  };

  const addDivider = () => {
    setLayout((prev) => [
      ...prev,
      { id: uid(), type: "divider", label: "Stairs / Aisle" },
    ]);
  };

  const deleteItem = (id: string) =>
    setLayout((prev) => prev.filter((x) => x.id !== id));

  const addSeatToRow = (id: string) => {
    setLayout((prev) =>
      prev.map((item) =>
        item.id === id && item.type === "row" && item.cols.length < 30
          ? { ...item, cols: [...item.cols, 1] }
          : item
      )
    );
  };

  const removeSeatFromRow = (id: string) => {
    setLayout((prev) =>
      prev.map((item) =>
        item.id === id && item.type === "row" && item.cols.length > 1
          ? { ...item, cols: item.cols.slice(0, -1) }
          : item
      )
    );
  };

  const editRowLabel = (id: string, val: string) => {
    setLayout((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, label: val.toUpperCase() } : item
      )
    );
  };

  const editDividerLabel = (id: string, val: string) => {
    setLayout((prev) =>
      prev.map((item) => (item.id === id ? { ...item, label: val } : item))
    );
  };

  const handleSeatPress = (rowId: string, colIdx: number) => {
    setLayout((prev) =>
      prev.map((item) => {
        if (item.id !== rowId || item.type !== "row") return item;
        const cols = [...item.cols];
        if (mode === "block" && cols[colIdx] === 1) cols[colIdx] = -1;
        else if (mode === "unblock" && cols[colIdx] === -1) cols[colIdx] = 1;
        else if (mode === "gap") cols[colIdx] = cols[colIdx] === 0 ? 1 : 0;
        return { ...item, cols };
      })
    );
  };

  // ── Reorder by swap ──
  const swapItems = (fromId: string, direction: "up" | "down") => {
    setLayout((prev) => {
      const idx = prev.findIndex((x) => x.id === fromId);
      if (idx < 0) return prev;
      const target = direction === "up" ? idx - 1 : idx + 1;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  // ── Stats ──
  const rows = layout.filter((x) => x.type === "row") as RowItem[];
  const totalSeats = rows.reduce(
    (a, r) => a + r.cols.filter((c) => c !== 0).length,
    0
  );
  const blockedSeats = rows.reduce(
    (a, r) => a + r.cols.filter((c) => c === -1).length,
    0
  );
  const aisleGaps = rows.reduce(
    (a, r) => a + r.cols.filter((c) => c === 0).length,
    0
  );

  // ── Create ──
  const handleCreate = async () => {
    if (!audName.trim()) {
      Alert.alert("Error", "Enter an auditorium name");
      return;
    }
    if (rows.length === 0) {
      Alert.alert("Error", "Add at least one row");
      return;
    }

    // Build the payload matching your existing backend model
    // rows: string[], seatsPerRow: number, blockedSeats: string[]
    // Since we now have variable cols, we use max cols as seatsPerRow
    // and encode aisle-gaps as part of blockedSeats with a special prefix
    const seatsPerRow = Math.max(...rows.map((r) => r.cols.length));
    const rowLabels = rows.map((r) => r.label);
    const blocked: string[] = [];

    rows.forEach((r) => {
      r.cols.forEach((c, i) => {
        if (c === -1) blocked.push(`${r.label}${i + 1}`);
      });
    });

    try {
      setCreating(true);
      await API.post("/auditoriums", {
        name: audName.trim(),
        rows: rowLabels,
        seatsPerRow,
        blockedSeats: blocked,
      });
      Alert.alert(
        "Created!",
        `"${audName}" created with ${totalSeats - blockedSeats} available seats`,
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || "Failed to create");
    } finally {
      setCreating(false);
    }
  };

  // LOADING
  
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // DETAIL VIEW (existing auditorium)
  
  if (!isNew && auditorium) {
    const aud = auditorium;
    const total = aud.rows.length * aud.seatsPerRow;

    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        {/* Top accent + right vertical bar — admin screen rule */}
        <View style={styles.topAccent} />
        <View style={styles.rightBar} />
        {/* Top-right ambient glow */}
        <View style={styles.bgGlow} />
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.pageTitle}>{aud.name}</Text>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {[
            { label: "Rows", value: aud.rows.length, accent: "#6366f1" },
            { label: "Per row", value: aud.seatsPerRow, accent: "#10b981" },
            { label: "Total", value: total, accent: "#3b82f6" },
            { label: "Blocked", value: aud.blockedSeats?.length || 0, accent: "#ef4444" },
          ].map((s) => (
            <View key={s.label} style={[styles.statCard, { borderColor: s.accent + "33" }]}>
              <Text style={[styles.statValue, { color: s.accent }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Layout preview */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Seat Layout</Text>

          {/* Stage */}
          <View style={styles.stageBanner}>
            <Text style={styles.stageBannerText}>▲  STAGE / PODIUM  ▲</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ paddingBottom: 8 }}>
              {aud.rows.map((row: string) => (
                <View key={row} style={styles.rowWrap}>
                  <Text style={styles.rowLabelText}>{row}</Text>
                  {Array.from({ length: Math.min(aud.seatsPerRow, 20) }, (_, i) => {
                    const seatNum = `${row}${i + 1}`;
                    const isBlocked = aud.blockedSeats?.includes(seatNum);
                    return (
                      <View
                        key={i}
                        style={[styles.previewSeat, isBlocked && styles.previewSeatBlocked]}
                      >
                        {!isBlocked && <View style={styles.previewNotch} />}
                      </View>
                    );
                  })}
                  {aud.seatsPerRow > 20 && (
                    <Text style={styles.moreTxt}>+{aud.seatsPerRow - 20}</Text>
                  )}
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: "#10b981" }]} />
              <Text style={styles.legendText}>Available</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: "#334155", opacity: 0.4 }]} />
              <Text style={styles.legendText}>Blocked</Text>
            </View>
          </View>
        </View>

        {/* Blocked seats */}
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

        {/* Row config */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Rows</Text>
          <View style={styles.chipWrap}>
            {aud.rows.map((r: string) => (
              <View key={r} style={[styles.chip, styles.chipPrimary]}>
                <Text style={[styles.chipText, { color: COLORS.primary }]}>
                  {r}1 – {r}{aud.seatsPerRow}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  }

  // CREATE NEW — Cinema-style interactive builder
  
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* Top accent + right vertical bar — admin screen rule */}
      <View style={styles.topAccent} />
      <View style={styles.rightBar} />
      {/* Top-right ambient glow */}
      <View style={styles.bgGlow} />
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>New Auditorium</Text>
        <Text style={styles.pageSubtitle}>
          Build your layout visually — drag rows, add aisles, toggle seats
        </Text>

        {/* Name input */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Name</Text>
          <TextInput
            style={styles.input}
            value={audName}
            onChangeText={setAudName}
            placeholder="e.g. Main Hall, Seminar Room A"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

        {/* Stats bar */}
        <View style={styles.statsRow}>
          {[
            { label: "Rows", value: rows.length, accent: "#6366f1" },
            { label: "Total", value: totalSeats, accent: "#10b981" },
            { label: "Blocked", value: blockedSeats, accent: "#ef4444" },
            { label: "Gaps", value: aisleGaps, accent: "#f59e0b" },
          ].map((s) => (
            <View key={s.label} style={[styles.statCard, { borderColor: s.accent + "33" }]}>
              <Text style={[styles.statValue, { color: s.accent }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Mode selector */}
        <View style={styles.modeRow}>
          {(["view", "block", "unblock", "gap"] as EditMode[]).map((m) => {
            const labels: Record<EditMode, string> = {
              view: "View",
              block: "Block",
              unblock: "Unblock",
              gap: "Gap / Aisle",
            };
            const active = mode === m;
            return (
              <TouchableOpacity
                key={m}
                style={[styles.modePill, active && styles.modePillActive]}
                onPress={() => setMode(m)}
              >
                <Text style={[styles.modePillText, active && styles.modePillTextActive]}>
                  {labels[m]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Add controls */}
        <View style={styles.addRow}>
          <TouchableOpacity style={styles.addBtn} onPress={addRow}>
            <Ionicons name="add" size={14} color={COLORS.primary} />
            <Text style={[styles.addBtnText, { color: COLORS.primary }]}>Row</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.addBtn, { borderColor: "#f59e0b33" }]} onPress={addDivider}>
            <Ionicons name="remove" size={14} color="#f59e0b" />
            <Text style={[styles.addBtnText, { color: "#f59e0b" }]}>Aisle Divider</Text>
          </TouchableOpacity>
        </View>

        {/* Stage */}
        <View style={styles.stageBanner}>
          <Text style={styles.stageBannerText}>▲  STAGE / PODIUM  ▲</Text>
        </View>

        {/* Builder grid */}
        <View style={styles.sectionCard}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ minWidth: "100%" }}>
              {layout.map((item, idx) => {
                if (item.type === "divider") {
                  return (
                    <View key={item.id} style={styles.dividerWrap}>
                      {/* Reorder arrows */}
                      <View style={styles.reorderCol}>
                        <TouchableOpacity
                          onPress={() => swapItems(item.id, "up")}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <Ionicons name="chevron-up" size={14} color={COLORS.textMuted} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => swapItems(item.id, "down")}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <Ionicons name="chevron-down" size={14} color={COLORS.textMuted} />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.dividerLine} />
                      <TextInput
                        style={styles.dividerLabel}
                        value={item.label}
                        onChangeText={(v) => editDividerLabel(item.id, v)}
                        selectTextOnFocus
                      />
                      <View style={styles.dividerLine} />

                      <TouchableOpacity
                        onPress={() => deleteItem(item.id)}
                        style={styles.deleteBtn}
                      >
                        <Ionicons name="close" size={13} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  );
                }

                // Row item
                const row = item as RowItem;
                return (
                  <View key={row.id} style={styles.rowWrap}>
                    {/* Reorder arrows */}
                    <View style={styles.reorderCol}>
                      <TouchableOpacity onPress={() => swapItems(row.id, "up")}>
                        <Ionicons name="chevron-up" size={12} color={COLORS.textMuted} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => swapItems(row.id, "down")}>
                        <Ionicons name="chevron-down" size={12} color={COLORS.textMuted} />
                      </TouchableOpacity>
                    </View>

                    {/* Editable label */}
                    <TextInput
                      style={styles.rowLabelInput}
                      value={row.label}
                      onChangeText={(v) => editRowLabel(row.id, v)}
                      maxLength={3}
                    />

                    {/* Seats */}
                    <View style={styles.seatsLine}>
                      {row.cols.map((c, ci) => (
                        <SeatChip
                          key={ci}
                          col={c}
                          label={`${row.label}${ci + 1}`}
                          mode={mode}
                          onPress={() => handleSeatPress(row.id, ci)}
                        />
                      ))}
                    </View>

                    {/* Row actions */}
                    <View style={styles.rowActions}>
                      <TouchableOpacity
                        style={styles.rowActionBtn}
                        onPress={() => removeSeatFromRow(row.id)}
                      >
                        <Text style={styles.rowActionText}>−</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.rowActionBtn}
                        onPress={() => addSeatToRow(row.id)}
                      >
                        <Text style={styles.rowActionText}>+</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.rowActionBtn, styles.rowActionDel]}
                        onPress={() => deleteItem(row.id)}
                      >
                        <Ionicons name="close" size={12} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}

              {layout.length === 0 && (
                <View style={styles.emptyGrid}>
                  <Ionicons name="grid-outline" size={36} color={COLORS.border} />
                  <Text style={styles.emptyGridText}>Tap "+ Row" to start building</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          {[
            { color: "#10b981", label: "Available" },
            { color: "#334155", label: "Blocked", opacity: 0.4 },
            { border: "#0ea5e9", label: "Seat gap" },
            { border: "#f59e0b", label: "Aisle divider" },
          ].map((l) => (
            <View key={l.label} style={styles.legendItem}>
              <View
                style={[
                  styles.legendBox,
                  l.color ? { backgroundColor: l.color, opacity: l.opacity || 1 } : {},
                  l.border ? { borderWidth: 1.5, borderColor: l.border, backgroundColor: "transparent", borderStyle: "dashed" } : {},
                ]}
              />
              <Text style={styles.legendText}>{l.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.tip}>
          Tip: Switch to Gap/Aisle mode and tap any seat to turn it into a passage gap.
          Drag rows with ↑ ↓ arrows.
        </Text>
      </ScrollView>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.createBtn, creating && { opacity: 0.6 }]}
          onPress={handleCreate}
          disabled={creating}
        >
          {creating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark" size={18} color="#fff" />
              <Text style={styles.createBtnText}>Create Auditorium</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Styles
const SEAT_W = 24;
const SEAT_H = 20;

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 60 },
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
    flex: 1, justifyContent: "center", alignItems: "center",
    backgroundColor: COLORS.background,
  },

  // Header
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    alignItems: "center", justifyContent: "center", marginBottom: 20,
  },
  pageTitle: {
    color: COLORS.textPrimary, fontSize: 26,
    fontFamily: "DMSans_800ExtraBold", marginBottom: 4,
  },
  pageSubtitle: {
    color: COLORS.textMuted, fontSize: 13,
    fontFamily: "DMSans_400Regular", marginBottom: 24,
  },

  // Section card
  sectionCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.card,
    borderWidth: 1, borderColor: COLORS.border,
    padding: 16, marginBottom: 16,
  },
  sectionTitle: {
    color: COLORS.textPrimary, fontSize: 14,
    fontFamily: "DMSans_700Bold", marginBottom: 14,
  },

  // Input
  input: {
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10, padding: 13,
    color: COLORS.textPrimary, fontSize: 14,
    fontFamily: "DMSans_400Regular",
  },

  // Stats
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.card,
    borderWidth: 1, padding: 12, alignItems: "center",
  },
  statValue: { fontSize: 20, fontFamily: "DMSans_800ExtraBold" },
  statLabel: {
    color: COLORS.textMuted, fontSize: 9,
    fontFamily: "DMSans_500Medium", marginTop: 2,
  },

  // Mode pills
  modeRow: {
    flexDirection: "row", gap: 8, marginBottom: 12, flexWrap: "wrap",
  },
  modePill: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  modePillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  modePillText: { color: COLORS.textMuted, fontSize: 12, fontFamily: "DMSans_500Medium" },
  modePillTextActive: { color: "#fff", fontFamily: "DMSans_700Bold" },

  // Add row/divider
  addRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  addBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
    borderWidth: 1, borderColor: COLORS.primaryBorder,
    backgroundColor: COLORS.primaryGlow,
  },
  addBtnText: { fontSize: 12, fontFamily: "DMSans_600SemiBold" },

  // Stage banner
  stageBanner: {
    backgroundColor: COLORS.surface, borderRadius: 8,
    borderWidth: 1, borderColor: COLORS.border,
    paddingVertical: 10, alignItems: "center", marginBottom: 4,
  },
  stageBannerText: {
    color: COLORS.textMuted, fontSize: 10,
    fontFamily: "DMSans_700Bold", letterSpacing: 3,
  },

  // Row
  rowWrap: {
    flexDirection: "row", alignItems: "center",
    marginBottom: 5, gap: 5,
  },
  rowLabelInput: {
    width: 26, color: COLORS.textMuted, fontSize: 10,
    fontFamily: "DMSans_700Bold", textAlign: "center",
    borderWidth: 0.5, borderColor: COLORS.border,
    borderRadius: 4, padding: 2, backgroundColor: COLORS.surface,
  },
  rowLabelText: {
    color: COLORS.textMuted, fontSize: 11,
    fontFamily: "DMSans_700Bold", width: 20, textAlign: "center",
  },

  // Seats
  seatsLine: { flexDirection: "row", flexWrap: "nowrap", gap: 3, flex: 1 },
  seat: {
    width: SEAT_W, height: SEAT_H,
    backgroundColor: "#10b981",
    borderTopLeftRadius: 5, borderTopRightRadius: 5,
    borderBottomLeftRadius: 2, borderBottomRightRadius: 2,
    overflow: "hidden",
    justifyContent: "center", alignItems: "center",
  },
  seatBlocked: { backgroundColor: "#334155", opacity: 0.4 },
  seatNotch: {
    position: "absolute", top: 0, alignSelf: "center",
    width: "55%", height: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderBottomLeftRadius: 2, borderBottomRightRadius: 2,
  },
  seatLabel: { color: "#fff", fontSize: 7, fontFamily: "DMSans_700Bold", marginTop: 6 },
  aisleGap: {
    width: SEAT_W, height: SEAT_H,
    borderWidth: 1.5, borderColor: "#0ea5e9",
    borderStyle: "dashed", borderRadius: 4,
    justifyContent: "center", alignItems: "center",
    opacity: 0.7,
  },
  aisleGapText: { color: "#0ea5e9", fontSize: 12 },

  // Row actions
  rowActions: { flexDirection: "row", gap: 3 },
  rowActionBtn: {
    width: 22, height: 22, borderRadius: 5,
    borderWidth: 0.5, borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    justifyContent: "center", alignItems: "center",
  },
  rowActionDel: { borderColor: "#ef444444" },
  rowActionText: { color: COLORS.textPrimary, fontSize: 14, lineHeight: 16 },

  // Reorder
  reorderCol: { gap: 0, justifyContent: "center", marginRight: 2 },

  // Divider
  dividerWrap: {
    flexDirection: "row", alignItems: "center",
    gap: 8, paddingVertical: 8, marginBottom: 4,
  },
  dividerLine: { flex: 1, height: 1.5, backgroundColor: "#f59e0b", opacity: 0.4 },
  dividerLabel: {
    color: "#f59e0b", fontSize: 10, fontFamily: "DMSans_600SemiBold",
    backgroundColor: "rgba(245,158,11,0.1)", paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 10,
    borderWidth: 0.5, borderColor: "#f59e0b44", minWidth: 80, textAlign: "center",
  },

  // Delete btn
  deleteBtn: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: "rgba(239,68,68,0.1)",
    justifyContent: "center", alignItems: "center",
    borderWidth: 0.5, borderColor: "#ef444444",
  },

  // Empty grid
  emptyGrid: { alignItems: "center", paddingVertical: 40, gap: 10 },
  emptyGridText: { color: COLORS.textMuted, fontSize: 13, fontFamily: "DMSans_400Regular" },

  // Legend
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 12 },
  legendRow: { flexDirection: "row", gap: 16, marginTop: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendBox: { width: SEAT_W, height: SEAT_H, borderRadius: 4 },
  legendText: { color: COLORS.textMuted, fontSize: 11, fontFamily: "DMSans_400Regular" },

  // Tip
  tip: {
    color: COLORS.textMuted, fontSize: 11,
    fontFamily: "DMSans_400Regular", lineHeight: 17,
    backgroundColor: COLORS.surface, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.border,
    padding: 12, marginBottom: 8,
  },

  // Preview (detail view)
  previewSeat: {
    width: SEAT_W, height: SEAT_H,
    backgroundColor: "#10b981",
    borderTopLeftRadius: 5, borderTopRightRadius: 5,
    borderBottomLeftRadius: 2, borderBottomRightRadius: 2,
    marginHorizontal: 2, overflow: "hidden",
  },
  previewSeatBlocked: { backgroundColor: COLORS.border, opacity: 0.4 },
  previewNotch: {
    position: "absolute", top: 0, alignSelf: "center",
    width: "55%", height: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  moreTxt: { color: COLORS.textMuted, fontSize: 10, alignSelf: "center", marginLeft: 4 },

  // Chips
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    backgroundColor: COLORS.surface, borderWidth: 1,
    borderColor: COLORS.border, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  chipPrimary: {
    borderColor: COLORS.primaryBorder,
    backgroundColor: "rgba(99,102,241,0.08)",
  },
  chipText: { color: COLORS.textPrimary, fontSize: 12, fontFamily: "DMSans_600SemiBold" },

  // Bottom bar
  bottomBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    padding: 20, backgroundColor: COLORS.background,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  createBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.button,
    paddingVertical: 15, flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: 8,
  },
  createBtnText: { color: "#fff", fontSize: 15, fontFamily: "DMSans_700Bold" },
});