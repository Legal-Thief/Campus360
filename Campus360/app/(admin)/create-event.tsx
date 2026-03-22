import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { COLORS, RADIUS } from "../../utils/theme";
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
  const [venue, setVenue] = useState("");

  const [date, setDate] = useState<Date | null>(null);
  const [deadline, setDeadline] = useState<Date | null>(null);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);

  const [duration, setDuration] = useState("");

  const [questions, setQuestions] = useState<Question[]>([
    {
      question: "",
      options: ["", "", "", ""],
      correctAnswerIndex: null,
      expanded: true,
    },
  ]);

  const toggleExpand = (index: number) => {
    const updated = [...questions];
    updated[index].expanded = !updated[index].expanded;
    setQuestions(updated);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: "",
        options: ["", "", "", ""],
        correctAnswerIndex: null,
        expanded: true,
      },
    ]);
  };

  const removeQuestion = (index: number) => {
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
    if (!title || !venue || !date || !deadline || !duration) {
      Alert.alert("Error", "Fill all required fields");
      return;
    }

    try {
      await API.post("/events", {
        title,
        description,
        venue,
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

      Alert.alert("Success", "Event created successfully");
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to create event"
      );
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.pageTitle}>Create Event</Text>
        <Text style={styles.subtitle}>
          Configure event details and build the quiz
        </Text>

        <View style={styles.divider} />

        {/* EVENT DETAILS */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Event Configuration</Text>

          <Input placeholder="Event Title" value={title} onChangeText={setTitle} />
          <Input placeholder="Description" value={description} onChangeText={setDescription} />
          <Input placeholder="Venue" value={venue} onChangeText={setVenue} />

          {/* EVENT DATE */}
          <TouchableOpacity
            style={styles.dateBox}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateText}>
              {date ? date.toDateString() : "Select Event Date"}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={date || new Date()}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) setDate(selectedDate);
              }}
            />
          )}

          {/* DEADLINE */}
          <TouchableOpacity
            style={styles.dateBox}
            onPress={() => setShowDeadlinePicker(true)}
          >
            <Text style={styles.dateText}>
              {deadline ? deadline.toDateString() : "Select Registration Deadline"}
            </Text>
          </TouchableOpacity>

          {showDeadlinePicker && (
            <DateTimePicker
              value={deadline || new Date()}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
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
            placeholder="Quiz Duration (minutes)"
            value={duration}
            onChangeText={(val) => {
              if (/^\d*$/.test(val)) {
                setDuration(val); // only numbers allowed
              }
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
              <Text style={styles.questionHeaderText}>
                Question {qIndex + 1}
              </Text>
              <Ionicons
                name={q.expanded ? "chevron-up" : "chevron-down"}
                size={18}
                color={COLORS.textMuted}
              />
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
                    onPress={() =>
                      setCorrectAnswer(qIndex, optIndex)
                    }
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        q.correctAnswerIndex === optIndex &&
                          styles.radioSelected,
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

                <TouchableOpacity
                  onPress={() => removeQuestion(qIndex)}
                >
                  <Text style={styles.removeText}>
                    Remove Question
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        ))}

        <TouchableOpacity onPress={addQuestion}>
          <Text style={styles.addQuestion}>
            + Add Question
          </Text>
        </TouchableOpacity>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* STICKY BUTTON */}
      <View style={styles.bottomBar}>
        <Button title="Create Event" onPress={handleSubmit} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },

  pageTitle: {
    fontSize: 28,
    fontFamily: "DMSans_800ExtraBold",
    color: COLORS.textPrimary,
  },

  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 20,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 25,
  },

  sectionCard: {
    backgroundColor: "#111827",
    borderRadius: RADIUS.card,
    padding: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  sectionTitle: {
    fontSize: 16,
    fontFamily: "DMSans_700Bold",
    color: COLORS.textPrimary,
    marginBottom: 15,
  },

  dateBox: {
    backgroundColor: "#0F172A",
    borderRadius: RADIUS.button,
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 15,
  },

  dateText: {
    color: COLORS.textPrimary,
  },

  questionCard: {
    backgroundColor: "#111827",
    borderRadius: RADIUS.card,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  questionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  questionHeaderText: {
    color: COLORS.textPrimary,
    fontFamily: "DMSans_600SemiBold",
  },

  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },

  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginRight: 10,
  },

  radioSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },

  removeText: {
    color: COLORS.danger,
    marginTop: 15,
  },

  addQuestion: {
    color: COLORS.primary,
    fontFamily: "DMSans_600SemiBold",
    marginBottom: 30,
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
});