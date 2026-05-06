import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, ActivityIndicator, Alert, Modal, TextInput,
  ScrollView, StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import API from "../../utils/api";
import { COLORS, FONT, RADIUS } from "../../utils/theme";

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; icon: string }> = {
  pending:  { color: COLORS.warning, bg: COLORS.warningBg,  border: COLORS.warningBorder, icon: "time-outline" },
  approved: { color: COLORS.success, bg: COLORS.successBg,  border: COLORS.successBorder, icon: "checkmark-circle-outline" },
  rejected: { color: COLORS.primary, bg: COLORS.dangerBg,   border: COLORS.primaryBorder, icon: "close-circle-outline" },
};

const TYPE_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  lost:  { color: COLORS.primary, bg: COLORS.primaryGlow, border: COLORS.primaryBorder },
  found: { color: COLORS.success, bg: COLORS.successBg,   border: COLORS.successBorder },
};

const FILTER_TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Active" },
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
  const [noteFocused, setNoteFocused] = useState(false);

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
    setSelected(item); setPendingAction(action); setAdminNote(""); setNoteModal(true);
  };

  const confirmAction = async () => {
    if (!selected || !pendingAction) return;
    setProcessing(true);
    try {
      await API.put(`/lost-found/status/${selected._id}`, { status: pendingAction, adminNote });
      Alert.alert(pendingAction === "approved" ? "Approved" : "Rejected", `Item has been ${pendingAction}.`);
      setNoteModal(false);
      fetchAll(); fetchStats();
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || "Failed");
    } finally { setProcessing(false); }
  };

  const handleResolve = (item: any) => {
    Alert.alert("Mark as Resolved", `Remove "${item.title}" from public listings?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Resolve", style: "destructive",
        onPress: async () => {
          try {
            await API.put(`/lost-found/resolve/${item._id}`);
            Alert.alert("Done", "Item marked as resolved.");
            fetchAll(); fetchStats();
          } catch { Alert.alert("Error", "Failed to resolve"); }
        },
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <View style={styles.topAccent} />

      <View style={styles.header}>
        <Text style={styles.title}>Lost & Found</Text>
        <Text style={styles.subtitle}>Review and manage all submitted reports</Text>
      </View>

      {/* Stats row */}
      {stats && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={styles.statsScroll}
          contentContainerStyle={{ gap: 10, paddingHorizontal: 20, paddingBottom: 4 }}>
          {[
            { label: "Total",    value: stats.total,      color: COLORS.primary, icon: "list-outline" },
            { label: "Pending",  value: stats.pending,    color: COLORS.warning, icon: "time-outline" },
            { label: "Active",   value: stats.approved,   color: COLORS.success, icon: "checkmark-circle-outline" },
            { label: "Resolved", value: stats.resolved,   color: COLORS.info,    icon: "trophy-outline" },
            { label: "Lost",     value: stats.lostCount,  color: COLORS.primary, icon: "search-outline" },
            { label: "Found",    value: stats.foundCount, color: COLORS.success, icon: "hand-left-outline" },
          ].map((s) => (
            <View key={s.label} style={[styles.statCard, { borderColor: s.color + "44" }]}>
              <View style={[styles.statIcon, { backgroundColor: s.color + "20" }]}>
                <Ionicons name={s.icon as any} size={16} color={s.color} />
              </View>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value ?? "—"}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingBottom: 4 }}>
        {FILTER_TABS.map((f) => {
          const active = filterStatus === f.key;
          const sc = STATUS_CONFIG[f.key];
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, active && sc && { backgroundColor: sc.bg, borderColor: sc.color }]}
              onPress={() => setFilterStatus(f.key)}
              activeOpacity={0.8}
            >
              {sc && <Ionicons name={sc.icon as any} size={12} color={active ? sc.color : COLORS.textMuted} />}
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
              activeOpacity={0.8}
            >
              <Text style={[styles.filterChipText, active && tc && { color: tc.color }]}>
                {t === "all" ? "All Types" : t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
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
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.cardImg} />
                ) : (
                  <View style={[styles.cardImgPlaceholder, { backgroundColor: tc.bg }]}>
                    <Ionicons name={item.type === "lost" ? "search-outline" : "checkmark-circle-outline"} size={32} color={tc.color} />
                  </View>
                )}
                <View style={styles.cardContent}>
                  <View style={styles.badgeRow}>
                    <View style={[styles.badge, { backgroundColor: tc.bg, borderColor: tc.border }]}>
                      <Text style={[styles.badgeText, { color: tc.color }]}>{item.type?.toUpperCase()}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
                      <Ionicons name={sc.icon as any} size={10} color={sc.color} />
                      <Text style={[styles.badgeText, { color: sc.color }]}>{item.status?.toUpperCase()}</Text>
                    </View>
                    {item.resolved && (
                      <View style={[styles.badge, { backgroundColor: COLORS.infoBg, borderColor: COLORS.info + "44" }]}>
                        <Text style={[styles.badgeText, { color: COLORS.info }]}>RESOLVED</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardCategory}>{item.category?.replace("_", " ")}  ·  {item.location}</Text>
                  {item.description ? <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text> : null}

                  <View style={styles.reporterBox}>
                    <Ionicons name="person-outline" size={12} color={COLORS.textMuted} />
                    <Text style={styles.reporterText}>{item.studentName || "Unknown"}  ·  {item.studentId}</Text>
                    <View style={styles.dot} />
                    <Ionicons name="call-outline" size={12} color={COLORS.textMuted} />
                    <Text style={styles.reporterText}>{item.mobileNumber}</Text>
                  </View>

                  <Text style={styles.dateText}>Reported: {new Date(item.createdAt).toDateString()}</Text>

                  {item.adminNote ? (
                    <View style={styles.adminNoteBox}>
                      <Text style={styles.adminNoteLabel}>Admin Note</Text>
                      <Text style={styles.adminNoteText}>{item.adminNote}</Text>
                    </View>
                  ) : null}

                  {!item.resolved && (
                    <View style={styles.actionRow}>
                      {item.status !== "approved" && (
                        <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={() => initiateAction(item, "approved")} activeOpacity={0.85}>
                          <Ionicons name="checkmark-outline" size={14} color="#fff" />
                          <Text style={styles.actionBtnText}>Approve</Text>
                        </TouchableOpacity>
                      )}
                      {item.status !== "rejected" && (
                        <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => initiateAction(item, "rejected")} activeOpacity={0.85}>
                          <Ionicons name="close-outline" size={14} color="#fff" />
                          <Text style={styles.actionBtnText}>Reject</Text>
                        </TouchableOpacity>
                      )}
                      {item.status === "approved" && (
                        <TouchableOpacity style={[styles.actionBtn, styles.resolveBtn]} onPress={() => handleResolve(item)} activeOpacity={0.85}>
                          <Ionicons name="trophy-outline" size={14} color="#fff" />
                          <Text style={styles.actionBtnText}>Resolve</Text>
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
              <View style={styles.emptyIcon}>
                <Ionicons name="folder-open-outline" size={32} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>No items found</Text>
            </View>
          }
        />
      )}

      {/* Approve/Reject modal */}
      <Modal visible={noteModal} transparent animationType="fade" onRequestClose={() => setNoteModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalTitleRow}>
              <View style={[styles.modalIconBox, { backgroundColor: pendingAction === "approved" ? COLORS.successBg : COLORS.dangerBg }]}>
                <Ionicons name={pendingAction === "approved" ? "checkmark-outline" : "close-outline"} size={20} color={pendingAction === "approved" ? COLORS.success : COLORS.primary} />
              </View>
              <View>
                <Text style={styles.modalTitle}>{pendingAction === "approved" ? "Approve Item" : "Reject Item"}</Text>
                <Text style={styles.modalSub} numberOfLines={1}>{selected?.title}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <Text style={styles.inputLabel}>Admin Note (optional)</Text>
            <View style={[styles.inputWrap, styles.textAreaWrap, noteFocused && styles.inputFocused]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add a note for your records..."
                placeholderTextColor={COLORS.textDim}
                value={adminNote}
                onChangeText={setAdminNote}
                multiline numberOfLines={3}
                onFocus={() => setNoteFocused(true)}
                onBlur={() => setNoteFocused(false)}
              />
            </View>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelModalBtn]} onPress={() => setNoteModal(false)} activeOpacity={0.8}>
                <Text style={styles.cancelModalText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { flex: 1.5, backgroundColor: pendingAction === "approved" ? COLORS.success : COLORS.primary }, processing && { opacity: 0.65 }]}
                onPress={confirmAction} disabled={processing} activeOpacity={0.85}
              >
                {processing ? <ActivityIndicator color="#fff" size="small" /> :
                  <Text style={styles.actionBtnText}>{pendingAction === "approved" ? "Approve" : "Reject"}</Text>}
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
  topAccent: { height: 3, backgroundColor: COLORS.primary },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
  title: { color: COLORS.textPrimary, fontSize: 32, fontFamily: FONT.extraBold },
  subtitle: { color: COLORS.textMuted, fontSize: 13, fontFamily: FONT.regular, marginTop: 4 },
  statsScroll: { flexGrow: 0, marginBottom: 12 },
  statCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, padding: 12, alignItems: "center", minWidth: 80, gap: 5 },
  statIcon: { width: 34, height: 34, borderRadius: 17, justifyContent: "center", alignItems: "center" },
  statValue: { fontSize: 20, fontFamily: FONT.extraBold },
  statLabel: { color: COLORS.textMuted, fontSize: 10, fontFamily: FONT.medium },
  filtersScroll: { flexGrow: 0, marginBottom: 12 },
  filterChip: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: COLORS.surface, borderRadius: RADIUS.chip, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12, paddingVertical: 8 },
  filterChipText: { color: COLORS.textMuted, fontSize: 12, fontFamily: FONT.medium },
  filterDivider: { width: 1, backgroundColor: COLORS.border, marginHorizontal: 4 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 60, gap: 12 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.primaryGlow, borderWidth: 1, borderColor: COLORS.primaryBorder, justifyContent: "center", alignItems: "center" },
  emptyTitle: { color: COLORS.textMuted, fontSize: 16, fontFamily: FONT.medium },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, overflow: "hidden" },
  cardImg: { width: "100%", height: 160 },
  cardImgPlaceholder: { width: "100%", height: 80, justifyContent: "center", alignItems: "center" },
  cardContent: { padding: 14 },
  badgeRow: { flexDirection: "row", gap: 6, marginBottom: 10, flexWrap: "wrap" },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.chip, borderWidth: 1 },
  badgeText: { fontSize: 10, fontFamily: FONT.bold, letterSpacing: 0.5 },
  cardTitle: { color: COLORS.textPrimary, fontSize: 16, fontFamily: FONT.bold, marginBottom: 3 },
  cardCategory: { color: COLORS.textMuted, fontSize: 12, fontFamily: FONT.regular, marginBottom: 6, textTransform: "capitalize" },
  cardDesc: { color: COLORS.textMuted, fontSize: 13, fontFamily: FONT.regular, lineHeight: 19, marginBottom: 10 },
  reporterBox: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: COLORS.white10, borderRadius: RADIUS.xs, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 6, flexWrap: "wrap" },
  reporterText: { color: COLORS.textMuted, fontSize: 12, fontFamily: FONT.regular },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: COLORS.textDim },
  dateText: { color: COLORS.textDim, fontSize: 11, fontFamily: FONT.regular, marginBottom: 10 },
  adminNoteBox: { backgroundColor: COLORS.warningBg, borderRadius: RADIUS.xs, borderWidth: 1, borderColor: COLORS.warningBorder, padding: 10, marginBottom: 12 },
  adminNoteLabel: { color: COLORS.warning, fontSize: 10, fontFamily: FONT.bold, letterSpacing: 1, marginBottom: 3 },
  adminNoteText: { color: COLORS.textMuted, fontSize: 12, fontFamily: FONT.regular },
  actionRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 11, borderRadius: RADIUS.sm, minWidth: 90 },
  approveBtn: { backgroundColor: COLORS.success },
  rejectBtn: { backgroundColor: COLORS.primary },
  resolveBtn: { backgroundColor: COLORS.info },
  actionBtnText: { color: "#fff", fontSize: 13, fontFamily: FONT.bold },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "center", padding: 24 },
  modalCard: { backgroundColor: COLORS.surface, borderRadius: 20, borderWidth: 1, borderColor: COLORS.borderBright, padding: 22 },
  modalTitleRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 },
  modalIconBox: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  modalTitle: { color: COLORS.textPrimary, fontSize: 17, fontFamily: FONT.bold },
  modalSub: { color: COLORS.textMuted, fontSize: 13, fontFamily: FONT.regular, marginTop: 2 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 16 },
  inputLabel: { color: COLORS.textMuted, fontSize: 12, fontFamily: FONT.medium, marginBottom: 8 },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 16 },
  inputFocused: { borderColor: COLORS.primary, backgroundColor: COLORS.surfaceHigh },
  input: { flex: 1, color: COLORS.textPrimary, fontSize: 14, fontFamily: FONT.regular },
  textAreaWrap: { alignItems: "flex-start", paddingVertical: 12 },
  textArea: { height: 80, textAlignVertical: "top" },
  modalBtns: { flexDirection: "row", gap: 10 },
  modalBtn: { paddingVertical: 14, borderRadius: RADIUS.md, alignItems: "center", justifyContent: "center", flex: 1 },
  cancelModalBtn: { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border },
  cancelModalText: { color: COLORS.textMuted, fontFamily: FONT.semiBold },
});
