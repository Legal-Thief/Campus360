import React, { useState, useCallback, useRef } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Image, ActivityIndicator, Modal, ScrollView,
  KeyboardAvoidingView, Platform, Animated, Dimensions, StatusBar,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import API from "../../utils/api";
import { COLORS, FONT, RADIUS } from "../../utils/theme";
import { uploadImageToCloudinary } from "../../utils/uploadImage";
import { useAuth } from "../../context/AuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAlert } from "../../components/CustomAlert";
import { useToast } from "../../components/Toast";

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
  lost:  { color: COLORS.primary,  bg: COLORS.primaryGlow,               border: COLORS.primaryBorder,  label: "Lost Items",  icon: "search-outline",           accent: COLORS.primary },
  found: { color: COLORS.success,  bg: COLORS.successBg,                  border: COLORS.successBorder,  label: "Found Items", icon: "checkmark-circle-outline", accent: COLORS.success },
};

export default function LostFoundScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const alert  = useAlert();
  const toast  = useToast();
  const [tab, setTab] = useState<"lost" | "found">("lost");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [reportType, setReportType] = useState<"lost" | "found">("lost");
  const [searchFocused, setSearchFocused] = useState(false);

  const [form, setForm] = useState({
    title: "", category: "electronics", description: "",
    location: "", date: "", studentId: user?.studentId || "",
    studentName: user?.name || "", mobileNumber: "", address: "",
  });
  const [image, setImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const fetchItems = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const params: any = {};
      if (category !== "all") params.category = category;
      if (searchQuery) params.search = searchQuery;
      const res = await API.get(`/lost-found/${tab}`, { params });
      setItems(res.data.items || []);
    } catch { setItems([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, [tab, category, searchQuery]);

  useFocusEffect(useCallback(() => { fetchItems(); }, [fetchItems]));

  const switchTab = (t: "lost" | "found") => {
    setTab(t); setCategory("all"); setSearch(""); setSearchQuery("");
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
    if (!granted) { alert.show({ type: "warning", title: "Permission Needed", message: "Allow gallery access to upload a photo" }); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7, aspect: [4, 3], allowsEditing: true,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const submitReport = async () => {
    const { title, category: cat, location, date, studentId, mobileNumber } = form;
    if (!title || !cat || !location || !date || !studentId || !mobileNumber) {
      alert.show({ type: "warning", title: "Missing Fields", message: "Please fill all required (*) fields" }); return;
    }
    setSubmitting(true);
    try {
      let imageUrl = "";
      if (image) imageUrl = await uploadImageToCloudinary(image);
      await API.post("/lost-found/add", { ...form, type: reportType, imageUrl, status: "pending" });
      setModalVisible(false);
      toast.show("Report submitted — under admin review", "success");
    } catch (err: any) {
      alert.show({ type: "error", title: "Error", message: err?.response?.data?.message || "Submission failed" });
    } finally { setSubmitting(false); }
  };

  const cfg = TAB_CONFIG[tab];

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
      ) : (
        <View style={[styles.cardImagePlaceholder, { backgroundColor: cfg.bg }]}>
          <Ionicons name={CATEGORIES.find(c => c.key === item.category)?.icon as any || "help-circle-outline"} size={36} color={cfg.color} />
        </View>
      )}
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <View style={[styles.typeBadge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
            <Ionicons name={cfg.icon as any} size={11} color={cfg.color} />
            <Text style={[styles.typeBadgeText, { color: cfg.color }]}>{item.type.toUpperCase()}</Text>
          </View>
          <View style={styles.catBadge}>
            <Text style={styles.catBadgeText}>{item.category.replace("_", " ")}</Text>
          </View>
        </View>
        <Text style={styles.cardTitle}>{item.title}</Text>
        {item.description ? <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text> : null}
        <View style={styles.cardMeta}>
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={12} color={COLORS.textMuted} />
            <Text style={styles.metaText}>{item.location}</Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={12} color={COLORS.textMuted} />
            <Text style={styles.metaText}>{item.date}</Text>
          </View>
        </View>
        <View style={styles.contactRow}>
          <Ionicons name="call-outline" size={13} color={COLORS.primary} />
          <Text style={styles.contactText}>{item.mobileNumber}</Text>
          {item.studentId && (
            <>
              <View style={styles.dot} />
              <Text style={styles.contactText}>ID: {item.studentId}</Text>
            </>
          )}
        </View>
        {tab === "found" && (
          <TouchableOpacity style={styles.claimBtn} onPress={() => openReport("lost")} activeOpacity={0.85}>
            <Ionicons name="hand-left-outline" size={14} color="#fff" />
            <Text style={styles.claimBtnText}>This is Mine</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <View style={styles.topAccent} />
      {/* Top-right ambient glow */}
      <View style={styles.bgGlow} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Lost & Found</Text>
          <Text style={styles.headerSub}>Report or recover items on campus</Text>
        </View>
        <TouchableOpacity style={[styles.reportFab, { backgroundColor: cfg.color }]} onPress={() => openReport(tab)} activeOpacity={0.85}>
          <Ionicons name="add" size={18} color="#fff" />
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
              <Ionicons name={tc.icon as any} size={15} color={active ? tc.color : COLORS.textMuted} />
              <Text style={[styles.tabText, active && { color: tc.color, fontFamily: FONT.bold }]}>{tc.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Search bar */}
      <View style={[styles.searchWrap, searchFocused && styles.searchFocused]}>
        <Ionicons name="search-outline" size={16} color={searchFocused ? COLORS.primary : COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search items..."
          placeholderTextColor={COLORS.textDim}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => setSearchQuery(search)}
          returnKeyType="search"
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
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
              activeOpacity={0.8}
            >
              <Ionicons name={c.icon as any} size={12} color={active ? cfg.color : COLORS.textMuted} />
              <Text style={[styles.catChipText, active && { color: cfg.color }]}>{c.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={cfg.color} />
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
                <Ionicons name={cfg.icon as any} size={36} color={cfg.color} />
              </View>
              <Text style={styles.emptyTitle}>No {tab} items found</Text>
              <Text style={styles.emptyText}>
                {tab === "lost" ? "Lost something? Tap Report to let everyone know." : "Found something? Help someone get it back!"}
              </Text>
              <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: cfg.color }]} onPress={() => openReport(tab)} activeOpacity={0.85}>
                <Text style={styles.emptyBtnText}>Report {tab === "lost" ? "Lost" : "Found"} Item</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Report Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, justifyContent: "flex-end" }}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>{reportType === "lost" ? "Report Lost Item" : "Report Found Item"}</Text>
                  <Text style={styles.modalSub}>Fill in the details below</Text>
                </View>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                  <Ionicons name="close" size={18} color={COLORS.textPrimary} />
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
                        activeOpacity={0.8}
                      >
                        <Ionicons name={tc.icon as any} size={15} color={reportType === t ? tc.color : COLORS.textMuted} />
                        <Text style={[styles.typeToggleText, reportType === t && { color: tc.color }]}>
                          {t === "lost" ? "I Lost It" : "I Found It"}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Section 01 */}
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionNum}><Text style={styles.sectionNumText}>01</Text></View>
                  <Text style={styles.sectionLabel}>ITEM DETAILS</Text>
                </View>

                <View style={[styles.inputWrap, focusedField === "title" && styles.inputFocused]}>
                  <Ionicons name="pricetag-outline" size={16} color={focusedField === "title" ? COLORS.primary : COLORS.textMuted} />
                  <TextInput
                    style={styles.input}
                    placeholder="Item title *"
                    placeholderTextColor={COLORS.textDim}
                    value={form.title}
                    onChangeText={(v) => setForm({ ...form, title: v })}
                    onFocus={() => setFocusedField("title")}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>

                <Text style={styles.inputLabel}>Category *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 2 }}>
                    {CATEGORIES.filter(c => c.key !== "all").map((c) => {
                      const active = form.category === c.key;
                      const tc = TAB_CONFIG[reportType];
                      return (
                        <TouchableOpacity
                          key={c.key}
                          style={[styles.catChip, active && { backgroundColor: tc.bg, borderColor: tc.color }]}
                          onPress={() => setForm({ ...form, category: c.key })}
                          activeOpacity={0.8}
                        >
                          <Ionicons name={c.icon as any} size={12} color={active ? tc.color : COLORS.textMuted} />
                          <Text style={[styles.catChipText, active && { color: tc.color }]}>{c.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>

                <View style={[styles.inputWrap, styles.textAreaWrap, focusedField === "desc" && styles.inputFocused]}>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Description (optional)"
                    placeholderTextColor={COLORS.textDim}
                    value={form.description}
                    onChangeText={(v) => setForm({ ...form, description: v })}
                    multiline numberOfLines={3}
                    onFocus={() => setFocusedField("desc")}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>

                <View style={styles.rowInputs}>
                  <View style={[styles.inputWrap, { flex: 1 }, focusedField === "location" && styles.inputFocused]}>
                    <Ionicons name="location-outline" size={16} color={focusedField === "location" ? COLORS.primary : COLORS.textMuted} />
                    <TextInput style={styles.input} placeholder="Location *" placeholderTextColor={COLORS.textDim} value={form.location} onChangeText={(v) => setForm({ ...form, location: v })} onFocus={() => setFocusedField("location")} onBlur={() => setFocusedField(null)} />
                  </View>
                  <View style={[styles.inputWrap, { flex: 1 }, focusedField === "date" && styles.inputFocused]}>
                    <Ionicons name="calendar-outline" size={16} color={focusedField === "date" ? COLORS.primary : COLORS.textMuted} />
                    <TextInput style={styles.input} placeholder="Date * (dd-mm-yy)" placeholderTextColor={COLORS.textDim} value={form.date} onChangeText={(v) => setForm({ ...form, date: v })} onFocus={() => setFocusedField("date")} onBlur={() => setFocusedField(null)} />
                  </View>
                </View>

                {/* Image picker */}
                <TouchableOpacity style={styles.imagePickBtn} onPress={pickImage} activeOpacity={0.8}>
                  <Ionicons name="camera-outline" size={18} color={COLORS.textMuted} />
                  <Text style={styles.imagePickText}>{image ? "Change Photo" : "Add Photo (optional)"}</Text>
                </TouchableOpacity>
                {image && (
                  <View style={styles.imagePreviewWrap}>
                    <Image source={{ uri: image }} style={styles.imagePreview} />
                    <TouchableOpacity style={styles.removeImageBtn} onPress={() => setImage(null)}>
                      <Ionicons name="close-circle" size={24} color={COLORS.primary} />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Section 02 */}
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionNum}><Text style={styles.sectionNumText}>02</Text></View>
                  <Text style={styles.sectionLabel}>YOUR CONTACT INFO</Text>
                </View>

                <View style={[styles.inputWrap, focusedField === "sname" && styles.inputFocused]}>
                  <Ionicons name="person-outline" size={16} color={focusedField === "sname" ? COLORS.primary : COLORS.textMuted} />
                  <TextInput style={styles.input} placeholder="Your name" placeholderTextColor={COLORS.textDim} value={form.studentName} onChangeText={(v) => setForm({ ...form, studentName: v })} onFocus={() => setFocusedField("sname")} onBlur={() => setFocusedField(null)} />
                </View>

                <View style={styles.rowInputs}>
                  <View style={[styles.inputWrap, { flex: 1 }, focusedField === "sid" && styles.inputFocused]}>
                    <Ionicons name="id-card-outline" size={16} color={focusedField === "sid" ? COLORS.primary : COLORS.textMuted} />
                    <TextInput style={styles.input} placeholder="Student ID *" placeholderTextColor={COLORS.textDim} value={form.studentId} onChangeText={(v) => setForm({ ...form, studentId: v })} keyboardType="numeric" onFocus={() => setFocusedField("sid")} onBlur={() => setFocusedField(null)} />
                  </View>
                  <View style={[styles.inputWrap, { flex: 1 }, focusedField === "mobile" && styles.inputFocused]}>
                    <Ionicons name="call-outline" size={16} color={focusedField === "mobile" ? COLORS.primary : COLORS.textMuted} />
                    <TextInput style={styles.input} placeholder="Mobile *" placeholderTextColor={COLORS.textDim} value={form.mobileNumber} onChangeText={(v) => setForm({ ...form, mobileNumber: v })} keyboardType="phone-pad" onFocus={() => setFocusedField("mobile")} onBlur={() => setFocusedField(null)} />
                  </View>
                </View>

                <View style={[styles.inputWrap, focusedField === "addr" && styles.inputFocused]}>
                  <Ionicons name="home-outline" size={16} color={focusedField === "addr" ? COLORS.primary : COLORS.textMuted} />
                  <TextInput style={styles.input} placeholder="Hostel / Block / Address" placeholderTextColor={COLORS.textDim} value={form.address} onChangeText={(v) => setForm({ ...form, address: v })} onFocus={() => setFocusedField("addr")} onBlur={() => setFocusedField(null)} />
                </View>

                <TouchableOpacity
                  style={[styles.submitBtn, { backgroundColor: TAB_CONFIG[reportType].color }, submitting && { opacity: 0.65 }]}
                  onPress={submitReport}
                  disabled={submitting}
                  activeOpacity={0.85}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="paper-plane-outline" size={17} color="#fff" />
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
  topAccent: { height: 3, backgroundColor: COLORS.primary },
  bgGlow:    { position: "absolute", top: -80, right: -80, width: 260, height: 260, borderRadius: 130, backgroundColor: COLORS.primary, opacity: 0.08 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
  headerTitle: { color: COLORS.textPrimary, fontSize: 32, fontFamily: FONT.extraBold },
  headerSub: { color: COLORS.textMuted, fontSize: 13, fontFamily: FONT.regular, marginTop: 4 },
  reportFab: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 11, borderRadius: RADIUS.md, marginTop: 4 },
  reportFabText: { color: "#fff", fontSize: 13, fontFamily: FONT.bold },
  tabContainer: { flexDirection: "row", gap: 10, paddingHorizontal: 20, marginBottom: 12 },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingVertical: 12, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  tabText: { color: COLORS.textMuted, fontSize: 13, fontFamily: FONT.medium },
  searchWrap: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 20, backgroundColor: COLORS.surface, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 12 },
  searchFocused: { borderColor: COLORS.primary, backgroundColor: COLORS.surfaceHigh },
  searchInput: { flex: 1, color: COLORS.textPrimary, fontSize: 14, fontFamily: FONT.regular },
  catScroll: { marginBottom: 4, flexGrow: 0 },
  catChip: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: COLORS.surface, borderRadius: RADIUS.chip, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12, paddingVertical: 7 },
  catChipText: { color: COLORS.textMuted, fontSize: 11, fontFamily: FONT.medium },
  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 60, gap: 12 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, justifyContent: "center", alignItems: "center", marginBottom: 4 },
  emptyTitle: { color: COLORS.textPrimary, fontSize: 18, fontFamily: FONT.bold },
  emptyText: { color: COLORS.textMuted, fontSize: 13, fontFamily: FONT.regular, textAlign: "center", paddingHorizontal: 40 },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 13, borderRadius: RADIUS.md, marginTop: 8 },
  emptyBtnText: { color: "#fff", fontSize: 14, fontFamily: FONT.bold },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, overflow: "hidden" },
  cardImage: { width: "100%", height: 180 },
  cardImagePlaceholder: { width: "100%", height: 120, justifyContent: "center", alignItems: "center" },
  cardBody: { padding: 14 },
  cardTopRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  typeBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.chip, borderWidth: 1 },
  typeBadgeText: { fontSize: 10, fontFamily: FONT.bold, letterSpacing: 0.8 },
  catBadge: { backgroundColor: COLORS.white20, paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.chip, borderWidth: 1, borderColor: COLORS.border },
  catBadgeText: { color: COLORS.textMuted, fontSize: 11, fontFamily: FONT.medium },
  cardTitle: { color: COLORS.textPrimary, fontSize: 16, fontFamily: FONT.bold, marginBottom: 6 },
  cardDesc: { color: COLORS.textMuted, fontSize: 13, fontFamily: FONT.regular, lineHeight: 19, marginBottom: 10 },
  cardMeta: { gap: 5, marginBottom: 10 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { color: COLORS.textMuted, fontSize: 12, fontFamily: FONT.regular },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: COLORS.primaryGlow, borderRadius: RADIUS.xs, borderWidth: 1, borderColor: COLORS.primaryBorder, paddingHorizontal: 10, paddingVertical: 8 },
  contactText: { color: COLORS.primary, fontSize: 12, fontFamily: FONT.semiBold },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: COLORS.textDim },
  claimBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, backgroundColor: COLORS.primary, borderRadius: RADIUS.sm, paddingVertical: 11, marginTop: 12 },
  claimBtnText: { color: "#fff", fontSize: 13, fontFamily: FONT.bold },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.78)" },
  modalSheet: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: COLORS.borderBright, borderBottomWidth: 0, paddingHorizontal: 22, paddingBottom: 0, maxHeight: "92%", paddingTop: 12 },
  modalHandle: { width: 40, height: 4, backgroundColor: COLORS.borderBright, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  modalTitle: { color: COLORS.textPrimary, fontSize: 20, fontFamily: FONT.bold },
  modalSub: { color: COLORS.textMuted, fontSize: 13, fontFamily: FONT.regular, marginTop: 2 },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.surfaceHigh, borderWidth: 1, borderColor: COLORS.border, justifyContent: "center", alignItems: "center" },
  typeToggleRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  typeToggle: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.background },
  typeToggleText: { color: COLORS.textMuted, fontSize: 13, fontFamily: FONT.semiBold },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12, marginTop: 4 },
  sectionNum: { backgroundColor: COLORS.primary, borderRadius: RADIUS.xs, paddingHorizontal: 7, paddingVertical: 2 },
  sectionNumText: { color: "#fff", fontSize: 11, fontFamily: FONT.bold },
  sectionLabel: { color: COLORS.textMuted, fontSize: 11, fontFamily: FONT.bold, letterSpacing: 2 },
  inputLabel: { color: COLORS.textMuted, fontSize: 12, fontFamily: FONT.medium, marginBottom: 8 },
  rowInputs: { flexDirection: "row", gap: 10 },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 10 },
  inputFocused: { borderColor: COLORS.primary, backgroundColor: COLORS.surfaceHigh },
  input: { flex: 1, color: COLORS.textPrimary, fontSize: 14, fontFamily: FONT.regular },
  textAreaWrap: { alignItems: "flex-start", paddingVertical: 12 },
  textArea: { height: 72, textAlignVertical: "top" },
  imagePickBtn: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 14, marginBottom: 12, borderStyle: "dashed" },
  imagePickText: { color: COLORS.textMuted, fontSize: 13, fontFamily: FONT.regular },
  imagePreviewWrap: { position: "relative", marginBottom: 12 },
  imagePreview: { width: "100%", height: 180, borderRadius: RADIUS.sm },
  removeImageBtn: { position: "absolute", top: 8, right: 8 },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: RADIUS.md, paddingVertical: 16, marginTop: 8 },
  submitBtnText: { color: "#fff", fontSize: 15, fontFamily: FONT.bold },
});
