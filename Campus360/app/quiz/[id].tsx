import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import API from "../../utils/api";
import { COLORS } from "../../utils/theme";
import { useAuth } from "../../context/AuthContext";

export default function QuizScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const [questions, setQuestions] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  // =====================
  // FETCH QUIZ
  // =====================
  useEffect(() => {
    fetchQuiz();
  }, []);

  const fetchQuiz = async () => {
    try {
      const res = await API.get(`/events/${id}/quiz`);
      setQuestions(res.data.questions);
      setTimeLeft(res.data.duration * 60);
    } catch (error) {
      Alert.alert("Error", "Failed to load quiz");
    } finally {
      setLoading(false);
    }
  };

  // =====================
  // TIMER (FIXED)
  // =====================
  useEffect(() => {
    // ❌ don't run before quiz loads
    if (questions.length === 0) return;

    if (timeLeft <= 0 && !submitted) {
      setSubmitted(true);
      handleSubmit();
      return;
    }

    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, submitted, questions]);

  // =====================
  // SELECT ANSWER
  // =====================
  const selectAnswer = (qIndex: number, optIndex: number) => {
    const updated = [...answers];

    updated[qIndex] = {
      originalQuestionIndex: qIndex,
      originalOptionIndex: optIndex,
    };

    setAnswers(updated);
  };

  // =====================
  // SUBMIT QUIZ
  // =====================
  const handleSubmit = async () => {
    if (submitted) return;

    setSubmitted(true);

    try {
      console.log("ANSWERS:", answers);

      const res = await API.post(`/events/${id}/submit-quiz`, {
        userId: user?.id,
        answers,
      });

      Alert.alert("Quiz Submitted", `Score: ${res.data.score}`);

      router.back();
    } catch (error: any) {
      console.log("ERROR:", error?.response?.data || error);
      Alert.alert("Error", "Submission failed");
    }
  };

  // =====================
  // LOADING UI
  // =====================
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={{ color: COLORS.textPrimary, marginTop: 10 }}>
          Loading Quiz...
        </Text>
      </View>
    );
  }

  // =====================
  // UI
  // =====================
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Text style={styles.timer}>
        Time Left: {Math.max(timeLeft, 0)}s
      </Text>

      <ScrollView style={styles.container}>
        {questions.map((q, qIndex) => (
          <View key={qIndex} style={styles.card}>
            <Text style={styles.question}>{q.question}</Text>

            {q.options.map((opt: string, optIndex: number) => (
              <TouchableOpacity
                key={optIndex}
                style={styles.option}
                onPress={() => selectAnswer(qIndex, optIndex)}
              >
                <Text style={styles.optionText}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        <TouchableOpacity style={styles.submit} onPress={handleSubmit}>
          <Text style={{ color: "#fff" }}>Submit</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// =====================
// STYLES
// =====================
const styles = StyleSheet.create({
  container: {
    padding: 20,
  },

  timer: {
    color: COLORS.danger,
    textAlign: "center",
    marginTop: 20,
    fontWeight: "bold",
  },

  card: {
    backgroundColor: "#111827",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#1E2D45",
  },

  question: {
    color: COLORS.textPrimary,
    marginBottom: 10,
    fontSize: 16,
  },

  option: {
    padding: 12,
    backgroundColor: "#1E293B",
    borderRadius: 8,
    marginBottom: 8,
  },

  optionText: {
    color: COLORS.textPrimary,
  },

  submit: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});