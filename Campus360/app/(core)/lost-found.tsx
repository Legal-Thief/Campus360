import React, { useState, useCallback, useRef } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Image, ActivityIndicator, Modal, ScrollView,
  KeyboardAvoidingView, Platform, Alert, Animated, Dimensions,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import API from "../../utils/api";
import { COLORS, RADIUS } from "../../utils/theme";
import { uploadImageToCloudinary } from "../../utils/uploadImage";
import { useAuth } from "../../context/AuthContext";

const { width } = Dimensions.get("window");

const CATEGORIES = [
  { key: "all", label: "All", icon: "apps-outline" },
  { key: "electronics", label: "Electronics", icon: "phone-portrait-outline" },
  { key: "clothing", label: "Clothing", icon: "shirt-outline" },
  { key: "accessories", label: "Accessories", icon: "watch-outline" },
  { key: "books", label: "Books", icon: "book-outline" },
  { key: "id_card", label: "ID Card", icon: "card-outline" },
  { key: "keys", label: "Keys", icon: "key-outline" },
  { key: "wallet", label: "Wallet", icon: "wallet-outline" },
  { key: "bag", label: "Bag", icon: "briefcase-outline" },
  { key: "other", label: "Other", icon: "ellipsis-horizontal-outline" },
];

const TAB_CONFIG = {
  lost: { color: "#ef4444", bg: "rgba(239,68,68,0.12)", label: "Lost Items", icon: "search-outline", accent: "#ef4444" },
  found: { color: "#10b981", bg: "rgba(16,185,129,0.12)", label: "Found Items", icon: "checkmark-circle-outline", accent: "#10b981" },
};

export default function LostFoundScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [tab, setTab] = useState<"lost" | "found">("lost");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [reportType, setReportType] = useState<"lost" | "found">("lost");

  // Form state
  const [form, setForm] = useState({
    title: "", category: "electronics", description: "",
    location: "", date: "", studentId: user?.studentId || "",
    studentName: user?.name || "", mobileNumber: "", address: "",
  });
  const [image, setImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const tabAnim = useRef(new Animated.Value(0)).current;

  const fetchItems = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const params: any = {};
      if (category !== "all") params.category = category;
      if (searchQuery) params.search = searchQuery;
      const res = await API.get(`/lost-found/${tab}`, { params });
      setItems(res.data.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tab, category, searchQuery]);

  useFocusEffect(useCallback(() => { fetchItems(); }, [fetchItems]));

  const switchTab = (t: "lost" | "found") => {
    setTab(t);
    setCategory("all");
    setSearch("");
    setSearchQuery("");
    Animated.spring(tabAnim, {
      toValue: t === "lost" ? 0 : 1,
      useNativeDriver: false,
      tension: 80,
      friction: 10,
    }).start();
  };

  const openReport = (type: "lost" | "found") => {
    setReportType(type);
    setForm({
      title: "", category: "electronics", description: "",
      location: "", date: "", studentId: user?.studentId || "",
      studentName: user?.name || "", mobileNumber: "", address: "",
    });
    setImage(null);
    setModalVisible(true);
  };

  const pickImage = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) { Alert.alert("Permission needed", "Allow gallery access"); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      aspect: [4, 3],
      allowsEditing: true,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const submitReport = async () => {
    const { title, category: cat, location, date, studentId, mobileNumber } = form;
    if (!title || !cat || !location || !date || !studentId || !mobileNumber) {
      Alert.alert("Missing fields", "Please fill all required (*) fields");
      return;
    }
    setSubmitting(true);
    try {
      let imageUrl = "";
      if (image) imageUrl = await uploadImageToCloudinary(image);
      await API.post("/lost-found/add", { ...form, type: reportType, imageUrl, status: "pending" });
      Alert.alert("Submitted! 🎉", "Your report is under admin review and will appear once approved.");
      setModalVisible(false);
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const cfg = TAB_CONFIG[tab];

  const renderItem = ({ item, index }: any) => (
    <Animated.View style={styles.card}>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
      ) : (
        <View style={[styles.cardImagePlaceholder, { backgroundColor: cfg.bg }]}>
          <Ionicons name={CATEGORIES.find(c => c.key === item.category)?.icon as any || "help-circle-outline"} size={36} color={cfg.color} />
        </View>
      )}

      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <View style={[styles.typeBadge, { backgroundColor: cfg.bg }]}>
            <Ionicons name={cfg.icon as any} size={11} color={cfg.color} />
            <Text style={[styles.typeBadgeText, { color: cfg.color }]}>{item.type.toUpperCase()}</Text>
          </View>
          <View style={styles.catBadge}>
            <Text style={styles.catBadgeText}>{item.category.replace("_", " ")}</Text>
          </View>
        </View>

        <Text style={styles.cardTitle}>{item.title}</Text>
        {item.description ? (
          <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
        ) : null}

        <View style={styles.cardMeta}>
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={13} color={COLORS.textMuted} />
            <Text style={styles.metaText}>{item.location}</Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={13} color={COLORS.textMuted} />
            <Text style={styles.metaText}>{item.date}</Text>
          </View>
        </View>

        <View style={styles.contactRow}>
          <Ionicons name="call-outline" size={13} color={COLORS.primary} />
          <Text style={styles.contactText}>{item.mobileNumber}</Text>
          {item.studentId ? (
            <>
              <View style={styles.dot} />
              <Text style={styles.contactText}>ID: {item.studentId}</Text>
            </>
          ) : null}
        </View>

        {tab === "found" && (
          <TouchableOpacity
            style={styles.claimBtn}
            onPress={() => openReport("lost")}
          >
            <Ionicons name="hand-left-outline" size={14} color="#fff" />
            <Text style={styles.claimBtnText}>This is Mine</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Lost & Found</Text>
          <Text style={styles.headerSub}>Report or recover items on campus</Text>
        </View>
        <TouchableOpacity
          style={[styles.reportFab, { backgroundColor: cfg.color }]}
          onPress={() => openReport(tab)}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.reportFabText}>Report</Text>
        </TouchableOpacity>
      </View>

      {/* Tab switcher */}
      <View style={styles.tabContainer}>
        {(["lost", "found"] as const).map((t) => {
          const tc = TAB_CONFIG[t];
          const active = tab === t;
          return (
            <TouchableOpacity
              key={t}
              style={[styles.tab, active && { backgroundColor: tc.bg, borderColor: tc.color }]}
              onPress={() => switchTab(t)}
              activeOpacity={0.8}
            >
              <Ionicons name={tc.icon as any} size={16} color={active ? tc.color : COLORS.textMuted} />
              <Text style={[styles.tabText, active && { color: tc.color, fontFamily: "DMSans_700Bold" }]}>
                {tc.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={16} color={COLORS.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search items..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => setSearchQuery(search)}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => { setSearch(""); setSearchQuery(""); }}>
            <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category filter */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={styles.catScroll}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingBottom: 4 }}
      >
        {CATEGORIES.map((c) => {
          const active = category === c.key;
          return (
            <TouchableOpacity
              key={c.key}
              style={[styles.catChip, active && { backgroundColor: cfg.bg, borderColor: cfg.color }]}
              onPress={() => setCategory(c.key)}
            >
              <Ionicons name={c.icon as any} size={13} color={active ? cfg.color : COLORS.textMuted} />
              <Text style={[styles.catChipText, active && { color: cfg.color }]}>{c.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={cfg.color} />
          <Text style={[styles.emptyText, { marginTop: 12 }]}>Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item, i) => item._id || String(i)}
          renderItem={renderItem}
          refreshing={refreshing}
          onRefresh={() => fetchItems(true)}
          contentContainerStyle={{ padding: 20, paddingBottom: 100, gap: 12 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.center}>
              <View style={[styles.emptyIcon, { backgroundColor: cfg.bg }]}>
                <Ionicons name={cfg.icon as any} size={40} color={cfg.color} />
              </View>
              <Text style={styles.emptyTitle}>No {tab} items found</Text>
              <Text style={styles.emptyText}>
                {tab === "lost"
                  ? "Lost something? Tap Report to let everyone know."
                  : "Found something? Help someone get it back!"}
              </Text>
              <TouchableOpacity
                style={[styles.emptyBtn, { backgroundColor: cfg.color }]}
                onPress={() => openReport(tab)}
              >
                <Text style={styles.emptyBtnText}>Report {tab === "lost" ? "Lost" : "Found"} Item</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Report Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1, justifyContent: "flex-end" }}
          >
            <View style={styles.modalSheet}>
              {/* Modal handle */}
              <View style={styles.modalHandle} />

              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>
                    {reportType === "lost" ? "🔍 Report Lost Item" : "✅ Report Found Item"}
                  </Text>
                  <Text style={styles.modalSub}>Fill in the details below</Text>
                </View>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                  <Ionicons name="close" size={20} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {/* Type toggle */}
                <View style={styles.typeToggleRow}>
                  {(["lost", "found"] as const).map((t) => {
                    const tc = TAB_CONFIG[t];
                    return (
                      <TouchableOpacity
                        key={t}
                        style={[styles.typeToggle, reportType === t && { backgroundColor: tc.bg, borderColor: tc.color }]}
                        onPress={() => setReportType(t)}
                      >
                        <Ionicons name={tc.icon as any} size={16} color={reportType === t ? tc.color : COLORS.textMuted} />
                        <Text style={[styles.typeToggleText, reportType === t && { color: tc.color }]}>
                          {t === "lost" ? "I Lost It" : "I Found It"}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Item details section */}
                <Text style={styles.sectionLabel}>ITEM DETAILS</Text>

                <TextInput
                  style={styles.input}
                  placeholder="Item title *"
                  placeholderTextColor={COLORS.textMuted}
                  value={form.title}
                  onChangeText={(v) => setForm({ ...form, title: v })}
                />

                {/* Category selector */}
                <Text style={styles.inputLabel}>Category *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                  <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 2 }}>
                    {CATEGORIES.filter(c => c.key !== "all").map((c) => {
                      const active = form.category === c.key;
                      const tc = TAB_CONFIG[reportType];
                      return (
                        <TouchableOpacity
                          key={c.key}
                          style={[styles.catChip, active && { backgroundColor: tc.bg, borderColor: tc.color }]}
                          onPress={() => setForm({ ...form, category: c.key })}
                        >
                          <Ionicons name={c.icon as any} size={13} color={active ? tc.color : COLORS.textMuted} />
                          <Text style={[styles.catChipText, active && { color: tc.color }]}>{c.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>

                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Description (optional)"
                  placeholderTextColor={COLORS.textMuted}
                  value={form.description}
                  onChangeText={(v) => setForm({ ...form, description: v })}
                  multiline
                  numberOfLines={3}
                />

                <View style={styles.row}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Location *"
                    placeholderTextColor={COLORS.textMuted}
                    value={form.location}
                    onChangeText={(v) => setForm({ ...form, location: v })}
                  />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Date * (dd-mm-yyyy)"
                    placeholderTextColor={COLORS.textMuted}
                    value={form.date}
                    onChangeText={(v) => setForm({ ...form, date: v })}
                  />
                </View>

                {/* Image picker */}
                <TouchableOpacity style={styles.imagePickBtn} onPress={pickImage}>
                  <Ionicons name="camera-outline" size={18} color={COLORS.textMuted} />
                  <Text style={styles.imagePickText}>{image ? "Change Photo" : "Add Photo (optional)"}</Text>
                </TouchableOpacity>
                {image && (
                  <View style={styles.imagePreviewWrap}>
                    <Image source={{ uri: image }} style={styles.imagePreview} />
                    <TouchableOpacity style={styles.removeImageBtn} onPress={() => setImage(null)}>
                      <Ionicons name="close-circle" size={22} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Contact section */}
                <Text style={styles.sectionLabel}>YOUR CONTACT INFO</Text>

                <TextInput
                  style={styles.input}
                  placeholder="Your name"
                  placeholderTextColor={COLORS.textMuted}
                  value={form.studentName}
                  onChangeText={(v) => setForm({ ...form, studentName: v })}
                />

                <View style={styles.row}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Student ID *"
                    placeholderTextColor={COLORS.textMuted}
                    value={form.studentId}
                    onChangeText={(v) => setForm({ ...form, studentId: v })}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Mobile * "
                    placeholderTextColor={COLORS.textMuted}
                    value={form.mobileNumber}
                    onChangeText={(v) => setForm({ ...form, mobileNumber: v })}
                    keyboardType="phone-pad"
                  />
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="Hostel / Block / Address"
                  placeholderTextColor={COLORS.textMuted}
                  value={form.address}
                  onChangeText={(v) => setForm({ ...form, address: v })}
                />

                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    { backgroundColor: TAB_CONFIG[reportType].color },
                    submitting && { opacity: 0.6 },
                  ]}
                  onPress={submitReport}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="paper-plane-outline" size={18} color="#fff" />
                      <Text style={styles.submitBtnText}>Submit for Approval</Text>
                    </>
                  )}
                </TouchableOpacity>

                <View style={{ height: 40 }} />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  headerTitle: { color: COLORS.textPrimary, fontSize: 28, fontFamily: "DMSans_800ExtraBold" },
  headerSub: { color: COLORS.textMuted, fontSize: 13, fontFamily: "DMSans_400Regular", marginTop: 4 },
  reportFab: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 14, marginTop: 4 },
  reportFabText: { color: "#fff", fontSize: 14, fontFamily: "DMSans_700Bold" },

  tabContainer: { flexDirection: "row", gap: 10, paddingHorizontal: 20, marginBottom: 14 },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, backgroundColor: "#111827" },
  tabText: { color: COLORS.textMuted, fontSize: 14, fontFamily: "DMSans_500Medium" },

  searchWrap: { flexDirection: "row", alignItems: "center", marginHorizontal: 20, backgroundColor: "#111827", borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 12 },
  searchInput: { flex: 1, color: COLORS.textPrimary, fontSize: 14, fontFamily: "DMSans_400Regular" },

  catScroll: { marginBottom: 4, flexGrow: 0 },
  catChip: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#111827", borderRadius: 999, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12, paddingVertical: 7 },
  catChipText: { color: COLORS.textMuted, fontSize: 12, fontFamily: "DMSans_500Medium" },

  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 60, gap: 12 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, justifyContent: "center", alignItems: "center", marginBottom: 4 },
  emptyTitle: { color: COLORS.textPrimary, fontSize: 18, fontFamily: "DMSans_700Bold" },
  emptyText: { color: COLORS.textMuted, fontSize: 13, fontFamily: "DMSans_400Regular", textAlign: "center", paddingHorizontal: 40 },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 13, borderRadius: 12, marginTop: 8 },
  emptyBtnText: { color: "#fff", fontSize: 14, fontFamily: "DMSans_700Bold" },

  card: { backgroundColor: "#111827", borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, overflow: "hidden" },
  cardImage: { width: "100%", height: 180 },
  cardImagePlaceholder: { width: "100%", height: 120, justifyContent: "center", alignItems: "center" },
  cardBody: { padding: 14 },
  cardTopRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  typeBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  typeBadgeText: { fontSize: 10, fontFamily: "DMSans_700Bold", letterSpacing: 0.5 },
  catBadge: { backgroundColor: "rgba(255,255,255,0.07)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  catBadgeText: { color: COLORS.textMuted, fontSize: 11, fontFamily: "DMSans_500Medium" },
  cardTitle: { color: COLORS.textPrimary, fontSize: 16, fontFamily: "DMSans_700Bold", marginBottom: 6 },
  cardDesc: { color: COLORS.textMuted, fontSize: 13, fontFamily: "DMSans_400Regular", lineHeight: 19, marginBottom: 10 },
  cardMeta: { gap: 5, marginBottom: 10 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { color: COLORS.textMuted, fontSize: 12, fontFamily: "DMSans_400Regular" },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(99,102,241,0.08)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  contactText: { color: COLORS.primary, fontSize: 12, fontFamily: "DMSans_600SemiBold" },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: COLORS.textMuted },
  claimBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, backgroundColor: "#10b981", borderRadius: 10, paddingVertical: 11, marginTop: 12 },
  claimBtnText: { color: "#fff", fontSize: 13, fontFamily: "DMSans_700Bold" },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)" },
  modalSheet: { backgroundColor: "#0B1220", borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: COLORS.border, borderBottomWidth: 0, paddingHorizontal: 20, paddingBottom: 0, maxHeight: "92%", paddingTop: 12 },
  modalHandle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  modalTitle: { color: COLORS.textPrimary, fontSize: 20, fontFamily: "DMSans_800ExtraBold" },
  modalSub: { color: COLORS.textMuted, fontSize: 13, fontFamily: "DMSans_400Regular", marginTop: 2 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#111827", borderWidth: 1, borderColor: COLORS.border, justifyContent: "center", alignItems: "center" },

  typeToggleRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  typeToggle: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, backgroundColor: "#111827" },
  typeToggleText: { color: COLORS.textMuted, fontSize: 14, fontFamily: "DMSans_600SemiBold" },

  sectionLabel: { color: COLORS.textMuted, fontSize: 11, fontFamily: "DMSans_600SemiBold", letterSpacing: 1, marginBottom: 12, marginTop: 4 },
  inputLabel: { color: COLORS.textMuted, fontSize: 12, fontFamily: "DMSans_500Medium", marginBottom: 8 },
  input: { backgroundColor: "#111827", borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 13, color: COLORS.textPrimary, fontSize: 14, fontFamily: "DMSans_400Regular", marginBottom: 12 },
  textArea: { height: 80, textAlignVertical: "top" },
  row: { flexDirection: "row", gap: 10 },

  imagePickBtn: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#111827", borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 14, marginBottom: 12, borderStyle: "dashed" },
  imagePickText: { color: COLORS.textMuted, fontSize: 14, fontFamily: "DMSans_400Regular" },
  imagePreviewWrap: { position: "relative", marginBottom: 12 },
  imagePreview: { width: "100%", height: 180, borderRadius: 10 },
  removeImageBtn: { position: "absolute", top: 8, right: 8 },

  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 14, paddingVertical: 16, marginTop: 8 },
  submitBtnText: { color: "#fff", fontSize: 16, fontFamily: "DMSans_700Bold" },
});
