import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { COLORS, FONT, RADIUS } from "../../utils/theme";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { Ionicons } from "@expo/vector-icons";
import API from "../../utils/api";

type Question = {
  question: string;
  options: string[];
  correctAnswerIndex: number | null;
  expanded: boolean;
};

export default function CreateEvent() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date | null>(null);
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);
  const [duration, setDuration] = useState("");

  // Auditorium
  const [auditoriums, setAuditoriums] = useState<any[]>([]);
  const [selectedAuditorium, setSelectedAuditorium] = useState<any>(null);
  const [auditoriumModalVisible, setAuditoriumModalVisible] = useState(false);
  const [loadingAuditoriums, setLoadingAuditoriums] = useState(false);

  const [questions, setQuestions] = useState<Question[]>([
    { question: "", options: ["", "", "", ""], correctAnswerIndex: null, expanded: true },
  ]);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAuditoriums();
  }, []);

  const fetchAuditoriums = async () => {
    setLoadingAuditoriums(true);
    try {
      const res = await API.get("/auditoriums");
      setAuditoriums(res.data.auditoriums || []);
    } catch {
      Alert.alert("Error", "Failed to load auditoriums");
    } finally {
      setLoadingAuditoriums(false);
    }
  };

  const toggleExpand = (index: number) => {
    const updated = [...questions];
    updated[index].expanded = !updated[index].expanded;
    setQuestions(updated);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { question: "", options: ["", "", "", ""], correctAnswerIndex: null, expanded: true },
    ]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length === 1) {
      Alert.alert("Cannot remove", "At least one question is required");
      return;
    }
    const updated = [...questions];
    updated.splice(index, 1);
    setQuestions(updated);
  };

  const setCorrectAnswer = (qIndex: number, optIndex: number) => {
    const updated = [...questions];
    updated[qIndex].correctAnswerIndex = optIndex;
    setQuestions(updated);
  };

  const handleSubmit = async () => {
    if (!title || !date || !deadline || !duration || !selectedAuditorium) {
      Alert.alert("Error", "Fill all required fields and select an auditorium");
      return;
    }

    const invalidQ = questions.find(
      (q) =>
        !q.question.trim() ||
        q.options.some((o) => !o.trim()) ||
        q.correctAnswerIndex === null
    );

    if (invalidQ) {
      Alert.alert("Error", "Complete all questions and mark the correct answer");
      return;
    }

    try {
      setSubmitting(true);
      await API.post("/events", {
        title,
        description,
        auditoriumId: selectedAuditorium._id,
        date,
        registrationDeadline: deadline,
        quiz: {
          duration: Number(duration),
          questions: questions.map((q) => ({
            question: q.question,
            options: q.options,
            correctAnswerIndex: q.correctAnswerIndex,
          })),
        },
      });

      Alert.alert("Success", "Event created successfully", [
        {
          text: "OK",
          onPress: () => {
            setTitle("");
            setDescription("");
            setDate(null);
            setDeadline(null);
            setDuration("");
            setSelectedAuditorium(null);
            setQuestions([
              { question: "", options: ["", "", "", ""], correctAnswerIndex: null, expanded: true },
            ]);
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Failed to create event");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.pageTitle}>Create Event</Text>
        <Text style={styles.subtitle}>Configure event details and build the quiz</Text>

        <View style={styles.divider} />

        {/* EVENT DETAILS */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Event Details</Text>
          <Input placeholder="Event Title *" value={title} onChangeText={setTitle} />
          <Input placeholder="Description (optional)" value={description} onChangeText={setDescription} />

          {/* Auditorium Picker */}
          <TouchableOpacity
            style={styles.pickerBox}
            onPress={() => setAuditoriumModalVisible(true)}
          >
            <Ionicons
              name="business-outline"
              size={16}
              color={selectedAuditorium ? COLORS.textPrimary : COLORS.textMuted}
              style={{ marginRight: 8 }}
            />
            <Text
              style={[
                styles.pickerText,
                selectedAuditorium && { color: COLORS.textPrimary },
              ]}
            >
              {selectedAuditorium
                ? `${selectedAuditorium.name} · ${selectedAuditorium.rows.length} rows × ${selectedAuditorium.seatsPerRow} seats`
                : "Select Auditorium *"}
            </Text>
            <Ionicons name="chevron-down" size={14} color={COLORS.textMuted} />
          </TouchableOpacity>

          {/* Event Date */}
          <TouchableOpacity style={styles.dateBox} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.dateText}>
              {date ? date.toDateString() : "Select Event Date *"}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={date || new Date()}
              mode="date"
              display="default"
              onChange={(_, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) setDate(selectedDate);
              }}
            />
          )}

          {/* Registration Deadline */}
          <TouchableOpacity style={styles.dateBox} onPress={() => setShowDeadlinePicker(true)}>
            <Text style={styles.dateText}>
              {deadline ? deadline.toDateString() : "Registration Deadline *"}
            </Text>
          </TouchableOpacity>
          {showDeadlinePicker && (
            <DateTimePicker
              value={deadline || new Date()}
              mode="date"
              display="default"
              onChange={(_, selectedDate) => {
                setShowDeadlinePicker(false);
                if (selectedDate) setDeadline(selectedDate);
              }}
            />
          )}
        </View>

        {/* QUIZ SETTINGS */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Quiz Settings</Text>
          <Input
            placeholder="Quiz Duration (minutes) *"
            value={duration}
            onChangeText={(val) => {
              if (/^\d*$/.test(val)) setDuration(val);
            }}
          />
        </View>

        {/* QUESTIONS */}
        <Text style={styles.sectionTitle}>Questions</Text>

        {questions.map((q, qIndex) => (
          <View key={qIndex} style={styles.questionCard}>
            <TouchableOpacity
              style={styles.questionHeader}
              onPress={() => toggleExpand(qIndex)}
            >
              <Text style={styles.questionHeaderText}>Question {qIndex + 1}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                {q.correctAnswerIndex !== null && (
                  <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                )}
                <Ionicons
                  name={q.expanded ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={COLORS.textMuted}
                />
              </View>
            </TouchableOpacity>

            {q.expanded && (
              <>
                <Input
                  placeholder="Enter question"
                  value={q.question}
                  onChangeText={(val) => {
                    const updated = [...questions];
                    updated[qIndex].question = val;
                    setQuestions(updated);
                  }}
                />

                {q.options.map((opt, optIndex) => (
                  <TouchableOpacity
                    key={optIndex}
                    style={styles.optionRow}
                    onPress={() => setCorrectAnswer(qIndex, optIndex)}
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        q.correctAnswerIndex === optIndex && styles.radioSelected,
                      ]}
                    />
                    <View style={{ flex: 1 }}>
                      <Input
                        placeholder={`Option ${optIndex + 1}`}
                        value={opt}
                        onChangeText={(val) => {
                          const updated = [...questions];
                          updated[qIndex].options[optIndex] = val;
                          setQuestions(updated);
                        }}
                      />
                    </View>
                  </TouchableOpacity>
                ))}

                <TouchableOpacity onPress={() => removeQuestion(qIndex)}>
                  <Text style={styles.removeText}>Remove Question</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        ))}

        <TouchableOpacity onPress={addQuestion}>
          <Text style={styles.addQuestion}>+ Add Question</Text>
        </TouchableOpacity>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* STICKY SUBMIT */}
      <View style={styles.bottomBar}>
        {submitting ? (
          <ActivityIndicator color={COLORS.primary} />
        ) : (
          <Button title="Create Event" onPress={handleSubmit} />
        )}
      </View>

      {/* AUDITORIUM PICKER MODAL */}
      <Modal
        visible={auditoriumModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAuditoriumModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Auditorium</Text>
            <View style={styles.divider} />

            {loadingAuditoriums ? (
              <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 20 }} />
            ) : auditoriums.length === 0 ? (
              <Text style={styles.emptyText}>
                No auditoriums created yet. Create one from Seat Control.
              </Text>
            ) : (
              <FlatList
                data={auditoriums}
                keyExtractor={(item) => item._id}
                style={{ maxHeight: 360 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.auditoriumOption,
                      selectedAuditorium?._id === item._id && styles.auditoriumOptionActive,
                    ]}
                    onPress={() => {
                      setSelectedAuditorium(item);
                      setAuditoriumModalVisible(false);
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.auditoriumName}>{item.name}</Text>
                      <Text style={styles.auditoriumMeta}>
                        {item.rows.length} rows · {item.seatsPerRow} seats/row ·{" "}
                        {item.rows.length * item.seatsPerRow} total
                      </Text>
                    </View>
                    {selectedAuditorium?._id === item._id && (
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                )}
              />
            )}

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setAuditoriumModalVisible(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 60 },
  pageTitle: { fontSize: 28, fontFamily: "DMSans_800ExtraBold", color: COLORS.textPrimary },
  subtitle: { fontSize: 14, color: COLORS.textMuted, marginBottom: 20 },
  divider: { height: 1, backgroundColor: COLORS.border, marginBottom: 25 },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: { fontSize: 16, fontFamily: "DMSans_700Bold", color: COLORS.textPrimary, marginBottom: 15 },
  pickerBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F172A",
    borderRadius: RADIUS.button,
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 15,
  },
  pickerText: { flex: 1, color: COLORS.textMuted, fontSize: 14 },
  dateBox: {
    backgroundColor: "#0F172A",
    borderRadius: RADIUS.button,
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 15,
  },
  dateText: { color: COLORS.textPrimary },
  questionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  questionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  questionHeaderText: { color: COLORS.textPrimary, fontFamily: "DMSans_600SemiBold" },
  optionRow: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  radioCircle: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2, borderColor: COLORS.border, marginRight: 10,
  },
  radioSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  removeText: { color: COLORS.danger, marginTop: 15 },
  addQuestion: { color: COLORS.primary, fontFamily: "DMSans_600SemiBold", marginBottom: 30 },
  bottomBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    padding: 20, backgroundColor: COLORS.background,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, borderColor: COLORS.border,
    padding: 24, paddingBottom: 40,
  },
  modalTitle: { color: COLORS.textPrimary, fontSize: 18, fontFamily: "DMSans_700Bold", marginBottom: 4 },
  auditoriumOption: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 14, paddingHorizontal: 12,
    borderRadius: 12, marginBottom: 6,
    borderWidth: 1, borderColor: "transparent",
  },
  auditoriumOptionActive: { borderColor: COLORS.primary, backgroundColor: "rgba(99,102,241,0.1)" },
  auditoriumName: { color: COLORS.textPrimary, fontSize: 15, fontFamily: "DMSans_600SemiBold" },
  auditoriumMeta: { color: COLORS.textMuted, fontSize: 12, fontFamily: "DMSans_400Regular", marginTop: 2 },
  emptyText: { color: COLORS.textMuted, fontSize: 14, textAlign: "center", paddingVertical: 20 },
  cancelBtn: { marginTop: 12, alignItems: "center", paddingVertical: 14 },
  cancelText: { color: COLORS.danger, fontSize: 15, fontFamily: "DMSans_600SemiBold" },
});
