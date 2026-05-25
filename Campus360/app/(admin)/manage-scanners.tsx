import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, Modal, TextInput, StatusBar,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import API from "../../utils/api";
import { COLORS, RADIUS } from "../../utils/theme";

//  Types 
type EventItem = {
  _id: string;
  title: string;
  date: string;
  status: string;
  clubName?: string;
  scanners?: any[];
};

type ScannerEntry = {
  _id: string;
  userId: { _id: string; name: string; studentId: string; email: string; role: string };
  grantedBy?: { name: string };
  grantedAt: string;
};

type UserResult = {
  _id: string;
  name: string;
  studentId: string;
  email: string;
  role: string;
};

//  Status pill 
const STATUS_COLOR: Record<string, string> = {
  registration_open:   "#10b981",
  quiz_closed:         "#f59e0b",
  priority_calculated: "#6366f1",
  seat_selection:      "#3b82f6",
  completed:           "#64748b",
};

const StatusPill = ({ status }: { status: string }) => (
  <View style={[styles.pill, { backgroundColor: (STATUS_COLOR[status] ?? "#64748b") + "22" }]}>
    <Text style={[styles.pillText, { color: STATUS_COLOR[status] ?? "#64748b" }]}>
      {status.replace(/_/g, " ")}
    </Text>
  </View>
);

//  Role badge 
const RoleBadge = ({ role }: { role: string }) => (
  <View style={styles.roleBadge}>
    <Text style={styles.roleBadgeText}>{role}</Text>
  </View>
);


// Main Screen

export default function ManageScannersScreen() {
  const router = useRouter();

  // Events list
  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  // Selected event → scanner list
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [scanners, setScanners] = useState<ScannerEntry[]>([]);
  const [scannersLoading, setScannersLoading] = useState(false);

  // Add scanner modal
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);

  //  Fetch all events
  const fetchEvents = useCallback(async () => {
    try {
      setEventsLoading(true);
      const res = await API.get("/events/all");
      setEvents(res.data.events ?? []);
    } catch {
      Alert.alert("Error", "Failed to load events");
    } finally {
      setEventsLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  //  Fetch scanners for selected event 
  const fetchScanners = useCallback(async (eventId: string) => {
    try {
      setScannersLoading(true);
      const res = await API.get(`/events/${eventId}/scanners`);
      setScanners(res.data.scanners ?? []);
    } catch {
      Alert.alert("Error", "Failed to load scanners");
    } finally {
      setScannersLoading(false);
    }
  }, []);

  const selectEvent = (event: EventItem) => {
    setSelectedEvent(event);
    fetchScanners(event._id);
  };

  //  Search users to add 
  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      Alert.alert("Too short", "Enter at least 2 characters to search.");
      return;
    }
    try {
      setSearching(true);
      setSearchResults([]);
      const res = await API.get(`/admin/users?search=${encodeURIComponent(q)}`);
      setSearchResults(res.data.users ?? []);
    } catch {
      Alert.alert("Error", "User search failed");
    } finally {
      setSearching(false);
    }
  };

  //  Grant scanner access 
  const grantAccess = async (userId: string) => {
    if (!selectedEvent) return;
    try {
      setAdding(true);
      await API.post(`/events/${selectedEvent._id}/scanners`, { userIds: [userId] });
      Alert.alert("Success", "Scanner access granted");
      setAddModalVisible(false);
      setSearchQuery("");
      setSearchResults([]);
      fetchScanners(selectedEvent._id);
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || "Failed to grant access");
    } finally {
      setAdding(false);
    }
  };

  //  Revoke scanner access 
  const revokeAccess = (scanner: ScannerEntry) => {
    Alert.alert(
      "Revoke Access",
      `Remove ${scanner.userId.name} as a scanner for this event?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Revoke",
          style: "destructive",
          onPress: async () => {
            try {
              await API.delete(`/events/${selectedEvent!._id}/scanners/${scanner.userId._id}`);
              fetchScanners(selectedEvent!._id);
            } catch {
              Alert.alert("Error", "Failed to revoke access");
            }
          },
        },
      ]
    );
  };

  //  Already-a-scanner guard 
  const isAlreadyScanner = (userId: string) =>
    scanners.some((s) => s.userId._id === userId);

  //  Renders 

  const renderEvent = ({ item }: { item: EventItem }) => {
    const isSelected = selectedEvent?._id === item._id;
    return (
      <TouchableOpacity
        style={[styles.eventCard, isSelected && styles.eventCardSelected]}
        onPress={() => selectEvent(item)}
        activeOpacity={0.75}
      >
        <View style={styles.eventCardLeft}>
          <Text style={styles.eventTitle} numberOfLines={1}>{item.title}</Text>
          {item.clubName ? (
            <View style={styles.clubRow}>
              <Ionicons name="people-outline" size={11} color={COLORS.primary} />
              <Text style={styles.clubName}>{item.clubName}</Text>
            </View>
          ) : null}
          <Text style={styles.eventDate}>
            {new Date(item.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </Text>
        </View>
        <View style={styles.eventCardRight}>
          <StatusPill status={item.status} />
          <View style={styles.scannerCount}>
            <Ionicons name="qr-code-outline" size={12} color={COLORS.textMuted} />
            <Text style={styles.scannerCountText}>{(item.scanners?.length ?? 0)} scanners</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderScanner = ({ item }: { item: ScannerEntry }) => (
    <View style={styles.scannerCard}>
      <View style={styles.scannerAvatar}>
        <Text style={styles.scannerAvatarText}>
          {item.userId.name?.charAt(0).toUpperCase() ?? "?"}
        </Text>
      </View>
      <View style={styles.scannerInfo}>
        <Text style={styles.scannerName}>{item.userId.name}</Text>
        <Text style={styles.scannerMeta}>{item.userId.studentId || item.userId.email}</Text>
        <RoleBadge role={item.userId.role} />
      </View>
      <TouchableOpacity style={styles.revokeBtn} onPress={() => revokeAccess(item)}>
        <Ionicons name="close-circle" size={22} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );

  const renderUserResult = ({ item }: { item: UserResult }) => {
    const already = isAlreadyScanner(item._id);
    return (
      <View style={styles.userResultCard}>
        <View style={styles.scannerInfo}>
          <Text style={styles.scannerName}>{item.name}</Text>
          <Text style={styles.scannerMeta}>{item.studentId || item.email}</Text>
          <RoleBadge role={item.role} />
        </View>
        <TouchableOpacity
          style={[styles.grantBtn, already && styles.grantBtnDone]}
          onPress={() => !already && grantAccess(item._id)}
          disabled={already || adding}
        >
          {adding ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.grantBtnText}>{already ? "Added" : "Grant"}</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  //  Main layout
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      {/* Top accent + right vertical bar — admin screen rule */}
      <View style={styles.topAccent} />
      <View style={styles.rightBar} />
      {/* Top-right ambient glow */}
      <View style={styles.bgGlow} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Scanner Management</Text>
          <Text style={styles.headerSub}>Assign QR scanning access per event</Text>
        </View>
      </View>

      <View style={styles.body}>
        {/* ── Left panel: event list ── */}
        <View style={styles.eventPanel}>
          <Text style={styles.panelLabel}>EVENTS</Text>
          {eventsLoading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: 24 }} />
          ) : (
            <FlatList
              data={events}
              keyExtractor={(i) => i._id}
              renderItem={renderEvent}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 24 }}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No events found</Text>
              }
            />
          )}
        </View>

        {/* ── Right panel: scanners ── */}
        <View style={styles.scannerPanel}>
          {!selectedEvent ? (
            <View style={styles.emptyState}>
              <Ionicons name="qr-code-outline" size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyStateText}>Select an event to manage its scanners</Text>
            </View>
          ) : (
            <>
              {/* Panel header */}
              <View style={styles.scannerPanelHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.panelLabel}>SCANNERS</Text>
                  <Text style={styles.selectedEventTitle} numberOfLines={1}>
                    {selectedEvent.title}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => { setAddModalVisible(true); setSearchResults([]); setSearchQuery(""); }}
                >
                  <Ionicons name="person-add-outline" size={15} color="#fff" />
                  <Text style={styles.addBtnText}>Add</Text>
                </TouchableOpacity>
              </View>

              {/* Scanner list */}
              {scannersLoading ? (
                <ActivityIndicator color={COLORS.primary} style={{ marginTop: 24 }} />
              ) : (
                <FlatList
                  data={scanners}
                  keyExtractor={(i) => i._id}
                  renderItem={renderScanner}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 24 }}
                  ListEmptyComponent={
                    <View style={styles.emptyState}>
                      <Ionicons name="people-outline" size={32} color={COLORS.textMuted} />
                      <Text style={styles.emptyStateText}>No scanners assigned yet</Text>
                      <Text style={styles.emptyStateSub}>
                        Tap "Add" to grant QR scanning access to coordinators or students.
                      </Text>
                    </View>
                  }
                />
              )}
            </>
          )}
        </View>
      </View>

      {/* ── Add Scanner Modal ── */}
      <Modal visible={addModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalSheet}>
            {/* Modal header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Scanner</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <Ionicons name="close" size={22} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Search by name, student ID, or email to assign QR scanning access.
            </Text>

            {/* Search bar */}
            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Name / Student ID / Email"
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="none"
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={searching}>
                {searching
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Ionicons name="search" size={18} color="#fff" />
                }
              </TouchableOpacity>
            </View>

            {/* Results */}
            <FlatList
              data={searchResults}
              keyExtractor={(i) => i._id}
              renderItem={renderUserResult}
              style={styles.resultsList}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                !searching ? (
                  <Text style={styles.emptyText}>
                    {searchQuery.trim().length >= 2
                      ? "No users found matching your search."
                      : "Type a name, student ID, or email and tap search."}
                  </Text>
                ) : null
              }
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}


// Styles

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
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

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.border,
    justifyContent: "center", alignItems: "center",
  },
  headerTitle: { color: COLORS.textPrimary, fontSize: 20, fontFamily: "DMSans_800ExtraBold" },
  headerSub:   { color: COLORS.textMuted, fontSize: 12, marginTop: 2, fontFamily: "DMSans_400Regular" },

  // Body split
  body: { flex: 1, flexDirection: "row" },

  // Event panel (left)
  eventPanel: {
    width: "42%",
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.06)",
    paddingTop: 14,
    paddingHorizontal: 12,
  },
  panelLabel: { color: COLORS.textMuted, fontSize: 10, fontFamily: "DMSans_700Bold", letterSpacing: 1.5, marginBottom: 10 },

  eventCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  eventCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryGlow,
  },
  eventCardLeft:  { flex: 1, marginRight: 8 },
  eventCardRight: { alignItems: "flex-end", gap: 6 },
  eventTitle:     { color: COLORS.textPrimary, fontSize: 13, fontFamily: "DMSans_700Bold" },
  clubRow:        { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  clubName:       { color: COLORS.primary, fontSize: 11, fontFamily: "DMSans_600SemiBold" },
  eventDate:      { color: COLORS.textMuted, fontSize: 11, marginTop: 4, fontFamily: "DMSans_400Regular" },
  scannerCount:   { flexDirection: "row", alignItems: "center", gap: 4 },
  scannerCountText: { color: COLORS.textMuted, fontSize: 10, fontFamily: "DMSans_400Regular" },

  // Status pill
  pill: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  pillText: { fontSize: 10, fontWeight: "700", textTransform: "capitalize" },

  // Scanner panel (right)
  scannerPanel: { flex: 1, paddingTop: 14, paddingHorizontal: 14 },
  scannerPanelHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  selectedEventTitle: { color: "#e2e8f0", fontSize: 14, fontWeight: "700", marginTop: 2 },

  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },

  scannerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    gap: 10,
  },
  scannerAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.primaryGlow,
    borderWidth: 1, borderColor: COLORS.primaryBorder,
    justifyContent: "center", alignItems: "center",
  },
  scannerAvatarText: { color: COLORS.primary, fontSize: 16, fontFamily: "DMSans_800ExtraBold" },
  scannerInfo: { flex: 1 },
  scannerName: { color: COLORS.textPrimary, fontSize: 13, fontFamily: "DMSans_700Bold" },
  scannerMeta: { color: COLORS.textMuted, fontSize: 11, marginTop: 2, fontFamily: "DMSans_400Regular" },

  roleBadge: {
    alignSelf: "flex-start",
    marginTop: 5,
    backgroundColor: COLORS.surface,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  roleBadgeText: { color: COLORS.textMuted, fontSize: 10, fontFamily: "DMSans_700Bold", textTransform: "uppercase", letterSpacing: 0.8 },

  revokeBtn: { padding: 4 },

  // Empty states
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 60, gap: 10 },
  emptyStateText: { color: COLORS.textMuted, fontSize: 13, textAlign: "center", fontFamily: "DMSans_400Regular" },
  emptyStateSub:  { color: COLORS.textMuted, fontSize: 12, textAlign: "center", lineHeight: 18, paddingHorizontal: 16, fontFamily: "DMSans_400Regular" },
  emptyText: { color: COLORS.textMuted, fontSize: 12, textAlign: "center", marginTop: 20, fontFamily: "DMSans_400Regular" },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "80%",
    borderTopWidth: 1,
    borderColor: COLORS.borderBright,
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  modalTitle:  { color: COLORS.textPrimary, fontSize: 18, fontFamily: "DMSans_800ExtraBold" },
  modalSub:    { color: COLORS.textMuted, fontSize: 13, lineHeight: 20, marginBottom: 16, fontFamily: "DMSans_400Regular" },

  searchRow:  { flexDirection: "row", gap: 10, marginBottom: 14 },
  searchInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    color: COLORS.textPrimary,
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
  },
  searchBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
  },

  resultsList: { maxHeight: 300 },
  userResultCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    gap: 10,
  },
  grantBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 64,
    alignItems: "center",
  },
  grantBtnDone: { backgroundColor: "#1e293b" },
  grantBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
});
