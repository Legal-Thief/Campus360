import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, ActivityIndicator, Alert, Modal, TextInput,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import API from "../../utils/api";
import { COLORS, RADIUS } from "../../utils/theme";

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  pending:  { color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  icon: "time-outline" },
  approved: { color: "#10b981", bg: "rgba(16,185,129,0.12)",  icon: "checkmark-circle-outline" },
  rejected: { color: "#ef4444", bg: "rgba(239,68,68,0.12)",   icon: "close-circle-outline" },
};

const TYPE_CONFIG: Record<string, { color: string; bg: string }> = {
  lost:  { color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  found: { color: "#10b981", bg: "rgba(16,185,129,0.12)" },
};

const FILTER_TABS = [
  { key: "all",      label: "All" },
  { key: "pending",  label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

export default function AdminLostFound() {
  const [items, setItems] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [selected, setSelected] = useState<any>(null);
  const [noteModal, setNoteModal] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [pendingAction, setPendingAction] = useState<"approved" | "rejected" | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => { fetchAll(); fetchStats(); }, [filterStatus, filterType]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterStatus !== "all") params.status = filterStatus;
      if (filterType !== "all") params.type = filterType;
      const res = await API.get("/lost-found/all", { params });
      setItems(res.data.items || []);
    } catch { setItems([]); }
    finally { setLoading(false); }
  };

  const fetchStats = async () => {
    try {
      const res = await API.get("/lost-found/stats");
      setStats(res.data.stats);
    } catch {}
  };

  const initiateAction = (item: any, action: "approved" | "rejected") => {
    setSelected(item);
    setPendingAction(action);
    setAdminNote("");
    setNoteModal(true);
  };

  const confirmAction = async () => {
    if (!selected || !pendingAction) return;
    setProcessing(true);
    try {
      await API.put(`/lost-found/status/${selected._id}`, {
        status: pendingAction,
        adminNote,
      });
      Alert.alert(
        pendingAction === "approved" ? "✅ Approved" : "❌ Rejected",
        `Item has been ${pendingAction}.`
      );
      setNoteModal(false);
      fetchAll();
      fetchStats();
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || "Failed");
    } finally {
      setProcessing(false);
    }
  };

  const handleResolve = (item: any) => {
    Alert.alert(
      "Mark as Resolved",
      `This will remove "${item.title}" from public listings. Continue?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Resolve",
          style: "destructive",
          onPress: async () => {
            try {
              await API.put(`/lost-found/resolve/${item._id}`);
              Alert.alert("Done", "Item marked as resolved and removed from listings.");
              fetchAll(); fetchStats();
            } catch { Alert.alert("Error", "Failed to resolve"); }
          },
        },
      ]
    );
  };

  const StatCard = ({ label, value, color, icon }: any) => (
    <View style={[styles.statCard, { borderColor: color + "44" }]}>
      <View style={[styles.statIcon, { backgroundColor: color + "20" }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value ?? "—"}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Lost & Found</Text>
        <Text style={styles.subtitle}>Review and manage all submitted reports</Text>
      </View>

      {/* Stats */}
      {stats && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={styles.statsScroll}
          contentContainerStyle={{ gap: 10, paddingHorizontal: 20, paddingBottom: 4 }}>
          <StatCard label="Total"    value={stats.total}    color="#6366f1" icon="list-outline" />
          <StatCard label="Pending"  value={stats.pending}  color="#f59e0b" icon="time-outline" />
          <StatCard label="Active"   value={stats.approved} color="#10b981" icon="checkmark-circle-outline" />
          <StatCard label="Resolved" value={stats.resolved} color="#8b5cf6" icon="trophy-outline" />
          <StatCard label="Lost"     value={stats.lostCount}  color="#ef4444" icon="search-outline" />
          <StatCard label="Found"    value={stats.foundCount} color="#10b981" icon="hand-left-outline" />
        </ScrollView>
      )}

      {/* Filters */}
      <View style={styles.filtersWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}>
          {FILTER_TABS.map((f) => {
            const active = filterStatus === f.key;
            const sc = STATUS_CONFIG[f.key];
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterChip, active && sc && { backgroundColor: sc.bg, borderColor: sc.color }]}
                onPress={() => setFilterStatus(f.key)}
              >
                {sc && <Ionicons name={sc.icon as any} size={13} color={active ? sc.color : COLORS.textMuted} />}
                <Text style={[styles.filterChipText, active && sc && { color: sc.color }]}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}

          <View style={styles.filterDivider} />

          {["all", "lost", "found"].map((t) => {
            const active = filterType === t;
            const tc = TYPE_CONFIG[t];
            return (
              <TouchableOpacity
                key={t}
                style={[styles.filterChip, active && tc && { backgroundColor: tc.bg, borderColor: tc.color }]}
                onPress={() => setFilterType(t)}
              >
                <Text style={[styles.filterChipText, active && tc && { color: tc.color }]}>
                  {t === "all" ? "All Types" : t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item, i) => item._id || String(i)}
          contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const sc = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
            const tc = TYPE_CONFIG[item.type] || TYPE_CONFIG.lost;
            return (
              <View style={styles.card}>
                {/* Image */}
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.cardImg} />
                ) : (
                  <View style={[styles.cardImgPlaceholder, { backgroundColor: tc.bg }]}>
                    <Ionicons
                      name={item.type === "lost" ? "search-outline" : "checkmark-circle-outline"}
                      size={30} color={tc.color}
                    />
                  </View>
                )}

                <View style={styles.cardContent}>
                  {/* Badges */}
                  <View style={styles.badgeRow}>
                    <View style={[styles.badge, { backgroundColor: tc.bg }]}>
                      <Text style={[styles.badgeText, { color: tc.color }]}>{item.type.toUpperCase()}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: sc.bg }]}>
                      <Ionicons name={sc.icon as any} size={10} color={sc.color} />
                      <Text style={[styles.badgeText, { color: sc.color }]}>{item.status.toUpperCase()}</Text>
                    </View>
                    {item.resolved && (
                      <View style={[styles.badge, { backgroundColor: "rgba(139,92,246,0.12)" }]}>
                        <Text style={[styles.badgeText, { color: "#8b5cf6" }]}>RESOLVED</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardCategory}>{item.category?.replace("_", " ")} · {item.location}</Text>
                  {item.description ? (
                    <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
                  ) : null}

                  {/* Reporter info */}
                  <View style={styles.reporterBox}>
                    <Ionicons name="person-outline" size={13} color={COLORS.textMuted} />
                    <Text style={styles.reporterText}>
                      {item.studentName || "Unknown"} · {item.studentId}
                    </Text>
                    <View style={styles.dot} />
                    <Ionicons name="call-outline" size={13} color={COLORS.textMuted} />
                    <Text style={styles.reporterText}>{item.mobileNumber}</Text>
                  </View>
                  {item.address ? (
                    <Text style={styles.addressText}>
                      <Ionicons name="home-outline" size={12} /> {item.address}
                    </Text>
                  ) : null}

                  <Text style={styles.dateText}>
                    Reported: {new Date(item.createdAt).toDateString()}
                  </Text>

                  {/* Admin note if any */}
                  {item.adminNote ? (
                    <View style={styles.adminNoteBox}>
                      <Text style={styles.adminNoteLabel}>Admin Note:</Text>
                      <Text style={styles.adminNoteText}>{item.adminNote}</Text>
                    </View>
                  ) : null}

                  {/* Action buttons */}
                  {!item.resolved && (
                    <View style={styles.actionRow}>
                      {item.status !== "approved" && (
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.approveBtn]}
                          onPress={() => initiateAction(item, "approved")}
                        >
                          <Ionicons name="checkmark-outline" size={15} color="#fff" />
                          <Text style={styles.actionBtnText}>Approve</Text>
                        </TouchableOpacity>
                      )}
                      {item.status !== "rejected" && (
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.rejectBtn]}
                          onPress={() => initiateAction(item, "rejected")}
                        >
                          <Ionicons name="close-outline" size={15} color="#fff" />
                          <Text style={styles.actionBtnText}>Reject</Text>
                        </TouchableOpacity>
                      )}
                      {item.status === "approved" && (
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.resolveBtn]}
                          onPress={() => handleResolve(item)}
                        >
                          <Ionicons name="trophy-outline" size={15} color="#fff" />
                          <Text style={styles.actionBtnText}>Mark Resolved</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="folder-open-outline" size={48} color={COLORS.border} />
              <Text style={styles.emptyText}>No items found</Text>
            </View>
          }
        />
      )}

      {/* Approve/Reject note modal */}
      <Modal visible={noteModal} transparent animationType="fade" onRequestClose={() => setNoteModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {pendingAction === "approved" ? "✅ Approve Item" : "❌ Reject Item"}
            </Text>
            <Text style={styles.modalSub}>
              {selected?.title}
            </Text>

            <Text style={styles.inputLabel}>Admin Note (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add a note for your records..."
              placeholderTextColor={COLORS.textMuted}
              value={adminNote}
              onChangeText={setAdminNote}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "#1e293b", flex: 1 }]}
                onPress={() => setNoteModal(false)}
              >
                <Text style={{ color: COLORS.textMuted, fontFamily: "DMSans_600SemiBold" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  { flex: 1, backgroundColor: pendingAction === "approved" ? "#10b981" : "#ef4444" },
                  processing && { opacity: 0.6 },
                ]}
                onPress={confirmAction}
                disabled={processing}
              >
                {processing
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={{ color: "#fff", fontFamily: "DMSans_700Bold" }}>
                      {pendingAction === "approved" ? "Approve" : "Reject"}
                    </Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  title: { color: COLORS.textPrimary, fontSize: 28, fontFamily: "DMSans_800ExtraBold" },
  subtitle: { color: COLORS.textMuted, fontSize: 13, fontFamily: "DMSans_400Regular", marginTop: 4 },

  statsScroll: { flexGrow: 0, marginBottom: 12 },
  statCard: { backgroundColor: "#111827", borderRadius: 12, borderWidth: 1, padding: 14, alignItems: "center", minWidth: 90, gap: 6 },
  statIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  statValue: { fontSize: 22, fontFamily: "DMSans_800ExtraBold" },
  statLabel: { color: COLORS.textMuted, fontSize: 11, fontFamily: "DMSans_500Medium" },

  filtersWrap: { marginBottom: 12 },
  filterChip: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#111827", borderRadius: 999, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 13, paddingVertical: 8 },
  filterChipText: { color: COLORS.textMuted, fontSize: 12, fontFamily: "DMSans_500Medium" },
  filterDivider: { width: 1, backgroundColor: COLORS.border, marginHorizontal: 4, alignSelf: "stretch" },

  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 60, gap: 10 },
  emptyText: { color: COLORS.textMuted, fontFamily: "DMSans_500Medium", fontSize: 15 },

  card: { backgroundColor: "#111827", borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, overflow: "hidden" },
  cardImg: { width: "100%", height: 160 },
  cardImgPlaceholder: { width: "100%", height: 80, justifyContent: "center", alignItems: "center" },
  cardContent: { padding: 14 },
  badgeRow: { flexDirection: "row", gap: 6, marginBottom: 10, flexWrap: "wrap" },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 10, fontFamily: "DMSans_700Bold", letterSpacing: 0.5 },
  cardTitle: { color: COLORS.textPrimary, fontSize: 16, fontFamily: "DMSans_700Bold", marginBottom: 4 },
  cardCategory: { color: COLORS.textMuted, fontSize: 12, fontFamily: "DMSans_400Regular", marginBottom: 6, textTransform: "capitalize" },
  cardDesc: { color: COLORS.textMuted, fontSize: 13, fontFamily: "DMSans_400Regular", lineHeight: 19, marginBottom: 10 },

  reporterBox: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 6, flexWrap: "wrap" },
  reporterText: { color: COLORS.textMuted, fontSize: 12, fontFamily: "DMSans_400Regular" },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: COLORS.textMuted },
  addressText: { color: COLORS.textMuted, fontSize: 12, fontFamily: "DMSans_400Regular", marginBottom: 4 },
  dateText: { color: COLORS.textMuted, fontSize: 11, fontFamily: "DMSans_400Regular", marginBottom: 10 },

  adminNoteBox: { backgroundColor: "rgba(245,158,11,0.08)", borderRadius: 8, borderWidth: 1, borderColor: "rgba(245,158,11,0.2)", padding: 10, marginBottom: 12 },
  adminNoteLabel: { color: "#f59e0b", fontSize: 11, fontFamily: "DMSans_600SemiBold", marginBottom: 3 },
  adminNoteText: { color: COLORS.textMuted, fontSize: 12, fontFamily: "DMSans_400Regular" },

  actionRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 11, borderRadius: 10, minWidth: 90 },
  approveBtn: { backgroundColor: "#10b981" },
  rejectBtn: { backgroundColor: "#ef4444" },
  resolveBtn: { backgroundColor: "#8b5cf6" },
  actionBtnText: { color: "#fff", fontSize: 13, fontFamily: "DMSans_700Bold" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", padding: 24 },
  modalCard: { backgroundColor: "#0f172a", borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, padding: 24 },
  modalTitle: { color: COLORS.textPrimary, fontSize: 18, fontFamily: "DMSans_800ExtraBold", marginBottom: 4 },
  modalSub: { color: COLORS.textMuted, fontSize: 13, fontFamily: "DMSans_400Regular", marginBottom: 20 },
  inputLabel: { color: COLORS.textMuted, fontSize: 12, fontFamily: "DMSans_500Medium", marginBottom: 8 },
  input: { backgroundColor: "#111827", borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 13, color: COLORS.textPrimary, fontSize: 14, fontFamily: "DMSans_400Regular", marginBottom: 16 },
  textArea: { height: 90, textAlignVertical: "top" },
  modalBtns: { flexDirection: "row", gap: 10 },
  modalBtn: { paddingVertical: 14, borderRadius: 12, alignItems: "center", justifyContent: "center" },
});
