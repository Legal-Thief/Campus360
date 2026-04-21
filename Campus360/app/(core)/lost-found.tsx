import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, RADIUS } from "../../utils/theme";
import API from "../../utils/api";

type Item = {
  _id: string;
  title: string;
  description: string;
  category: "lost" | "found";
  location: string;
  contactInfo: string;
  status: "open" | "resolved";
  reportedBy: { name: string };
  createdAt: string;
};

const CATEGORY_COLOR = { lost: "#ef4444", found: "#10b981" };

export default function LostFound() {
  const [tab, setTab] = useState<"lost" | "found">("lost");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formCategory, setFormCategory] = useState<"lost" | "found">("lost");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [contactInfo, setContactInfo] = useState("");

  useEffect(() => {
    fetchItems();
  }, [tab]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/lost-found?category=${tab}`);
      setItems(res.data.items || []);
    } catch {
      Alert.alert("Error", "Failed to load items");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !location.trim() || !contactInfo.trim()) {
      Alert.alert("Error", "All fields are required");
      return;
    }
    try {
      setSubmitting(true);
      await API.post("/lost-found", {
        category: formCategory,
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        contactInfo: contactInfo.trim(),
      });
      Alert.alert("Posted", "Your report has been submitted.");
      setModalVisible(false);
      setTitle(""); setDescription(""); setLocation(""); setContactInfo("");
      if (formCategory === tab) fetchItems();
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.pageTitle}>Lost & Found</Text>
          <Text style={styles.pageSub}>Report or recover lost items</Text>
        </View>
        <TouchableOpacity style={styles.newBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.newBtnText}>Report</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(["lost", "found"] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === "lost" ? "🔍 Lost" : "✅ Found"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={[styles.catBadge, { backgroundColor: CATEGORY_COLOR[item.category] + "22" }]}>
                  <Text style={[styles.catText, { color: CATEGORY_COLOR[item.category] }]}>
                    {item.category.toUpperCase()}
                  </Text>
                </View>
                {item.status === "resolved" && (
                  <View style={styles.resolvedBadge}>
                    <Text style={styles.resolvedText}>RESOLVED</Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
              <Text style={styles.cardMeta}>
                <Ionicons name="location-outline" size={12} /> {item.location}
              </Text>
              <Text style={styles.cardMeta}>
                <Ionicons name="call-outline" size={12} /> {item.contactInfo}
              </Text>
              <Text style={styles.cardMeta}>
                Reported by {item.reportedBy?.name} · {new Date(item.createdAt).toDateString()}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="search-outline" size={40} color={COLORS.border} />
              <Text style={styles.emptyText}>No {tab} items reported</Text>
            </View>
          }
        />
      )}

      {/* Report Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalCard} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle}>Report an Item</Text>

            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.typeRow}>
              {(["lost", "found"] as const).map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.typeBtn, formCategory === c && styles.typeBtnActive]}
                  onPress={() => setFormCategory(c)}
                >
                  <Text style={[styles.typeBtnText, formCategory === c && styles.typeBtnTextActive]}>
                    {c === "lost" ? "🔍 Lost" : "✅ Found"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Item Title *</Text>
            <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="e.g. Blue water bottle" placeholderTextColor={COLORS.textMuted} />

            <Text style={styles.inputLabel}>Description *</Text>
            <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholder="Describe the item..." placeholderTextColor={COLORS.textMuted} multiline numberOfLines={3} />

            <Text style={styles.inputLabel}>Location *</Text>
            <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="Where was it lost/found?" placeholderTextColor={COLORS.textMuted} />

            <Text style={styles.inputLabel}>Contact Info *</Text>
            <TextInput style={styles.input} value={contactInfo} onChangeText={setContactInfo} placeholder="Phone or email to reach you" placeholderTextColor={COLORS.textMuted} />

            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Submit Report</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 20, paddingTop: 60 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, paddingTop: 60 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  pageTitle: { color: COLORS.textPrimary, fontSize: 28, fontFamily: "DMSans_800ExtraBold" },
  pageSub: { color: COLORS.textMuted, fontSize: 13, fontFamily: "DMSans_400Regular", marginTop: 4 },
  newBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#f59e0b", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginTop: 4 },
  newBtnText: { color: "#fff", fontSize: 13, fontFamily: "DMSans_700Bold" },
  tabRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", backgroundColor: "#111827" },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { color: COLORS.textMuted, fontSize: 13, fontFamily: "DMSans_500Medium" },
  tabTextActive: { color: "#fff", fontFamily: "DMSans_700Bold" },
  card: { backgroundColor: "#111827", borderRadius: RADIUS.card, borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 12 },
  cardTop: { flexDirection: "row", gap: 8, marginBottom: 10 },
  catBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  catText: { fontSize: 11, fontFamily: "DMSans_600SemiBold" },
  resolvedBadge: { backgroundColor: "rgba(99,102,241,0.15)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  resolvedText: { color: COLORS.primary, fontSize: 11, fontFamily: "DMSans_600SemiBold" },
  cardTitle: { color: COLORS.textPrimary, fontSize: 15, fontFamily: "DMSans_700Bold", marginBottom: 6 },
  cardDesc: { color: COLORS.textMuted, fontSize: 13, fontFamily: "DMSans_400Regular", lineHeight: 18, marginBottom: 8 },
  cardMeta: { color: COLORS.textMuted, fontSize: 12, fontFamily: "DMSans_400Regular", marginBottom: 4 },
  emptyText: { color: COLORS.textMuted, fontSize: 15, fontFamily: "DMSans_500Medium" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#0f172a", borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: COLORS.border, padding: 24, maxHeight: "90%" },
  modalTitle: { color: COLORS.textPrimary, fontSize: 18, fontFamily: "DMSans_700Bold", marginBottom: 16 },
  inputLabel: { color: COLORS.textMuted, fontSize: 12, fontFamily: "DMSans_500Medium", marginBottom: 8 },
  input: { backgroundColor: "#111827", borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 13, color: COLORS.textPrimary, fontSize: 14, fontFamily: "DMSans_400Regular", marginBottom: 14 },
  textArea: { height: 90, textAlignVertical: "top" },
  typeRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  typeBtn: { flex: 1, paddingVertical: 11, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", backgroundColor: "#111827" },
  typeBtnActive: { backgroundColor: "rgba(99,102,241,0.15)", borderColor: COLORS.primary },
  typeBtnText: { color: COLORS.textMuted, fontSize: 13, fontFamily: "DMSans_500Medium" },
  typeBtnTextActive: { color: COLORS.textPrimary, fontFamily: "DMSans_700Bold" },
  submitBtn: { backgroundColor: "#f59e0b", borderRadius: 12, paddingVertical: 15, alignItems: "center", marginBottom: 10 },
  submitBtnText: { color: "#fff", fontSize: 15, fontFamily: "DMSans_700Bold" },
  cancelBtn: { alignItems: "center", paddingVertical: 12 },
  cancelBtnText: { color: "#ef4444", fontSize: 14, fontFamily: "DMSans_600SemiBold" },
});
