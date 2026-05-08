import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, ActivityIndicator, Alert, Modal, TextInput,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import API from "../../utils/api";
import { COLORS, RADIUS } from "../../utils/theme";

// ─── Config ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  pending:  { color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  icon: "time-outline" },
  approved: { color: "#10b981", bg: "rgba(16,185,129,0.12)",  icon: "checkmark-circle-outline" },
  rejected: { color: "#ef4444", bg: "rgba(239,68,68,0.12)",   icon: "close-circle-outline" },
};

const TYPE_CONFIG: Record<string, { color: string; bg: string }> = {
  lost:  { color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  found: { color: "#10b981", bg: "rgba(16,185,129,0.12)" },
};

// ─── Types ─────────────────────────────────────────────────────────────────

type Tab = "pending" | "all" | "summary";

// ─── Component ─────────────────────────────────────────────────────────────

export default function LostFoundAdminDashboard() {
  const { user, logout } = useAuth();

  const [tab, setTab] = useState<Tab>("pending");
  const [items, setItems] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [filterType, setFilterType] = useState<"all" | "lost" | "found">("all");

  // Review modal
  const [reviewModal, setReviewModal] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [pendingAction, setPendingAction] = useState<"approved" | "rejected" | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [processing, setProcessing] = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchData();
    fetchStats();
  }, [tab, filterType]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (tab === "summary") {
        // stats already fetched separately
        setLoading(false);
        return;
      }
      const params: any = {};
      if (tab === "pending") params.status = "pending";
      if (filterType !== "all") params.type = filterType;
      const res = await API.get("/lost-found/all", { params });
      setItems(res.data.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await API.get("/lost-found/stats");
      setStats(res.data.stats);
    } catch {}
  };

  // ── Review actions ───────────────────────────────────────────────────────

  const openReview = (item: any, action: "approved" | "rejected") => {
    setSelected(item);
    setPendingAction(action);
    setAdminNote("");
    setReviewModal(true);
  };

  const confirmReview = async () => {
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
      setReviewModal(false);
      fetchData();
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
      `Remove "${item.title}" from public listings?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Resolve",
          style: "destructive",
          onPress: async () => {
            try {
              await API.put(`/lost-found/resolve/${item._id}`);
              Alert.alert("Done", "Marked as resolved.");
              fetchData();
              fetchStats();
            } catch {
              Alert.alert("Error", "Failed to resolve");
            }
          },
        },
      ]
    );
  };

  // ── Tabs ─────────────────────────────────────────────────────────────────

  const TABS = [
    { key: "pending", label: "Pending" },
    { key: "all",     label: "All" },
    { key: "summary", label: "Summary" },
  ] as const;

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Top accent + right vertical bar — admin (lostfound) screen rule */}
      <View style={styles.topAccent} />
      <View style={styles.rightBar} />
      {/* Top-right ambient glow */}
      <View style={styles.bgGlow} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.pageLabel}>CAMPUS360</Text>
          <Text style={styles.pageTitle}>Lost & Found</Text>
          <Text style={styles.pageSub}>{user?.name}</Text>
        </View>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Type filter (only for pending/all tabs) */}
      {tab !== "summary" && (
        <View style={styles.typeFilterRow}>
          {(["all", "lost", "found"] as const).map((t) => {
            const active = filterType === t;
            const tc = TYPE_CONFIG[t];
            return (
              <TouchableOpacity
                key={t}
                style={[
                  styles.typeChip,
                  active && tc && { backgroundColor: tc.bg, borderColor: tc.color },
                ]}
                onPress={() => setFilterType(t)}
              >
                <Text
                  style={[
                    styles.typeChipText,
                    active && tc && { color: tc.color },
                  ]}
                >
                  {t === "all" ? "All Types" : t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : tab === "summary" && stats ? (
        <SummaryView stats={stats} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item, i) => item._id || String(i)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40, gap: 12 }}
          renderItem={({ item }) => (
            <ItemCard
              item={item}
              onApprove={() => openReview(item, "approved")}
              onReject={() => openReview(item, "rejected")}
              onResolve={() => handleResolve(item)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="folder-open-outline" size={44} color={COLORS.border} />
              <Text style={styles.emptyText}>
                {tab === "pending" ? "No pending items" : "No items found"}
              </Text>
            </View>
          }
        />
      )}

      {/* Review Modal */}
      <Modal
        visible={reviewModal}
        transparent
        animationType="slide"
        onRequestClose={() => setReviewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {pendingAction === "approved" ? "✅ Approve Item" : "❌ Reject Item"}
            </Text>
            <Text style={styles.modalSub}>{selected?.title}</Text>
            {selected && (
              <Text style={styles.modalMeta}>
                {selected.studentName} · {selected.studentId}
              </Text>
            )}

            <View style={styles.divider} />

            <Text style={styles.inputLabel}>Note (optional)</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: "top" }]}
              value={adminNote}
              onChangeText={setAdminNote}
              placeholder="Add a note for your records..."
              placeholderTextColor={COLORS.textMuted}
              multiline
            />

            {processing ? (
              <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 16 }} />
            ) : (
              <View style={styles.reviewBtnRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.cancelBtn]}
                  onPress={() => setReviewModal(false)}
                >
                  <Text style={[styles.actionBtnText, { color: COLORS.textMuted }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    pendingAction === "approved" ? styles.approveBtn : styles.rejectBtn,
                  ]}
                  onPress={confirmReview}
                >
                  <Ionicons
                    name={pendingAction === "approved" ? "checkmark-outline" : "close-outline"}
                    size={16}
                    color="#fff"
                  />
                  <Text style={[styles.actionBtnText, { color: "#fff" }]}>
                    {pendingAction === "approved" ? "Approve" : "Reject"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Summary View ───────────────────────────────────────────────────────────

function SummaryView({ stats }: { stats: any }) {
  const STAT_ITEMS = [
    { label: "Total",    value: stats.total,      color: COLORS.primary },
    { label: "Pending",  value: stats.pending,    color: "#f59e0b" },
    { label: "Active",   value: stats.approved,   color: "#10b981" },
    { label: "Resolved", value: stats.resolved,   color: "#8b5cf6" },
    { label: "Lost",     value: stats.lostCount,  color: "#ef4444" },
    { label: "Found",    value: stats.foundCount, color: "#10b981" },
  ];

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.statsGrid}>
        {STAT_ITEMS.map((s) => (
          <View key={s.label} style={[styles.statCard, { borderColor: s.color + "33" }]}>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value ?? "—"}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.legendCard}>
        <Text style={styles.legendTitle}>Quick Guide</Text>
        {[
          { icon: "time-outline",             color: "#f59e0b", text: "Pending — awaiting your review" },
          { icon: "checkmark-circle-outline", color: "#10b981", text: "Active — approved and publicly visible" },
          { icon: "close-circle-outline",     color: "#ef4444", text: "Rejected — not shown to students" },
          { icon: "trophy-outline",           color: "#8b5cf6", text: "Resolved — item was returned/found" },
        ].map((l) => (
          <View key={l.text} style={styles.legendRow}>
            <Ionicons name={l.icon as any} size={16} color={l.color} />
            <Text style={styles.legendText}>{l.text}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ─── Item Card ──────────────────────────────────────────────────────────────

function ItemCard({
  item,
  onApprove,
  onReject,
  onResolve,
}: {
  item: any;
  onApprove: () => void;
  onReject: () => void;
  onResolve: () => void;
}) {
  const sc = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
  const tc = TYPE_CONFIG[item.type]    || TYPE_CONFIG.lost;

  return (
    <View style={styles.card}>
      {/* Image */}
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.cardImg} />
      ) : (
        <View style={[styles.cardImgPlaceholder, { backgroundColor: tc.bg }]}>
          <Ionicons
            name={item.type === "lost" ? "search-outline" : "hand-left-outline"}
            size={28}
            color={tc.color}
          />
        </View>
      )}

      <View style={styles.cardBody}>
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
        <Text style={styles.cardMeta}>
          {item.category?.replace("_", " ")} · {item.location}
        </Text>
        {item.description ? (
          <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
        ) : null}

        {/* Reporter */}
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
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={12} color={COLORS.textMuted} />
            <Text style={styles.addressText}>{item.address}</Text>
          </View>
        ) : null}

        <Text style={styles.dateText}>
          Reported: {new Date(item.createdAt).toDateString()}
        </Text>

        {/* Admin note */}
        {item.adminNote ? (
          <View style={styles.noteBox}>
            <Text style={styles.noteLabel}>Admin Note:</Text>
            <Text style={styles.noteText}>{item.adminNote}</Text>
          </View>
        ) : null}

        {/* Actions */}
        {!item.resolved && (
          <View style={styles.actionRow}>
            {item.status !== "approved" && (
              <TouchableOpacity style={[styles.btn, styles.approveBtn]} onPress={onApprove}>
                <Ionicons name="checkmark-outline" size={14} color="#fff" />
                <Text style={styles.btnText}>Approve</Text>
              </TouchableOpacity>
            )}
            {item.status !== "rejected" && (
              <TouchableOpacity style={[styles.btn, styles.rejectBtn]} onPress={onReject}>
                <Ionicons name="close-outline" size={14} color="#fff" />
                <Text style={styles.btnText}>Reject</Text>
              </TouchableOpacity>
            )}
            {item.status === "approved" && (
              <TouchableOpacity style={[styles.btn, styles.resolveBtn]} onPress={onResolve}>
                <Ionicons name="trophy-outline" size={14} color="#fff" />
                <Text style={styles.btnText}>Mark Resolved</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

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
    gap: 12,
    paddingTop: 60,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 15,
    fontFamily: "DMSans_500Medium",
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  pageLabel: {
    color: COLORS.primary,
    fontSize: 10,
    fontFamily: "DMSans_700Bold",
    letterSpacing: 3,
  },
  pageTitle: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontFamily: "DMSans_800ExtraBold",
  },
  pageSub: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    marginTop: 2,
  },
  logoutText: {
    color: COLORS.danger,
    fontFamily: "DMSans_600SemiBold",
    fontSize: 14,
    marginTop: 8,
  },

  // Tabs
  tabRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    backgroundColor: COLORS.surface,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontFamily: "DMSans_500Medium",
  },
  tabTextActive: {
    color: "#fff",
    fontFamily: "DMSans_700Bold",
  },

  // Type filter chips
  typeFilterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  typeChipText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: "DMSans_500Medium",
  },

  // Summary
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    width: "30%",
    flexGrow: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
    gap: 6,
  },
  statValue: {
    fontSize: 26,
    fontFamily: "DMSans_800ExtraBold",
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontFamily: "DMSans_500Medium",
  },
  legendCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 12,
  },
  legendTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontFamily: "DMSans_700Bold",
    marginBottom: 4,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  legendText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
  },

  // Item card
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  cardImg: {
    width: "100%",
    height: 150,
  },
  cardImgPlaceholder: {
    width: "100%",
    height: 70,
    justifyContent: "center",
    alignItems: "center",
  },
  cardBody: {
    padding: 14,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 10,
    flexWrap: "wrap",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: "DMSans_700Bold",
    letterSpacing: 0.5,
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontFamily: "DMSans_700Bold",
    marginBottom: 4,
  },
  cardMeta: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
    marginBottom: 6,
    textTransform: "capitalize",
  },
  cardDesc: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    lineHeight: 19,
    marginBottom: 10,
  },
  reporterBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 6,
    flexWrap: "wrap",
  },
  reporterText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.textMuted,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 4,
  },
  addressText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
  },
  dateText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontFamily: "DMSans_400Regular",
    marginBottom: 10,
  },
  noteBox: {
    backgroundColor: "rgba(245,158,11,0.08)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.2)",
    padding: 10,
    marginBottom: 12,
  },
  noteLabel: {
    color: "#f59e0b",
    fontSize: 11,
    fontFamily: "DMSans_600SemiBold",
    marginBottom: 3,
  },
  noteText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 11,
    borderRadius: 10,
    minWidth: 90,
  },
  btnText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "DMSans_700Bold",
  },
  approveBtn: { backgroundColor: "#10b981" },
  rejectBtn:  { backgroundColor: "#ef4444" },
  resolveBtn: { backgroundColor: "#8b5cf6" },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontFamily: "DMSans_700Bold",
    marginBottom: 4,
  },
  modalSub: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontFamily: "DMSans_600SemiBold",
    marginBottom: 2,
  },
  modalMeta: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
  inputLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: "DMSans_500Medium",
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 13,
    color: COLORS.textPrimary,
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    marginBottom: 16,
  },
  reviewBtnRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionBtnText: {
    fontSize: 14,
    fontFamily: "DMSans_700Bold",
  },
  cancelBtn: {
    backgroundColor: COLORS.border,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});