import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import API from "../../utils/api";
import { COLORS, RADIUS } from "../../utils/theme";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";

export default function QuizScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const id = String(params.id);

  const [questions, setQuestions] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  // FIX: use a Record instead of sparse array — no empty slots
  const [answers, setAnswers] = useState<Record<number, { originalQuestionIndex: number; originalOptionIndex: number }>>({});
  const [loading, setLoading] = useState(true);

  // FIX: use a ref to track submission — avoids stale closure bug with setState
  const hasSubmitted = useRef(false);

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

  // Timer
  useEffect(() => {
    if (questions.length === 0 || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // FIX: auto-submit via ref check — no stale state issue
          if (!hasSubmitted.current) {
            handleSubmit();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [questions]);

  const selectAnswer = (qIndex: number, optIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [qIndex]: {
        originalQuestionIndex: qIndex,
        originalOptionIndex: optIndex,
      },
    }));
  };

  const handleSubmit = async () => {
    // FIX: ref-based guard — always reliable regardless of render cycle
    if (hasSubmitted.current) return;
    hasSubmitted.current = true;

    try {
      // FIX: convert Record to clean array with no null/empty slots
      const answersArray = Object.values(answers);

      await API.post(`/events/${id}/submit-quiz`, { answers: answersArray });

      router.push({
        pathname: "/(core)/result/[id]",
        params: { id: String(id) },
      });
    } catch (error: any) {
      console.log("SUBMIT ERROR:", error?.response?.data || error);
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Submission failed"
      );
      // FIX: reset ref so user can retry on actual errors
      hasSubmitted.current = false;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(Math.max(seconds, 0) / 60);
    const secs = Math.max(seconds, 0) % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const getSelectedOption = (qIndex: number) => {
    return answers[qIndex]?.originalOptionIndex;
  };

  const answeredCount = Object.keys(answers).length;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading Quiz...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Event Quiz</Text>
            <Text style={styles.subtitle}>
              Answer all questions before time runs out
            </Text>
          </View>
        </View>

        <View style={styles.topStats}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Questions</Text>
            <Text style={styles.statValue}>{questions.length}</Text>
          </View>
          <View style={[styles.statCard, styles.timerCard]}>
            <Text style={styles.statLabel}>Time Left</Text>
            <Text style={styles.timerValue}>{formatTime(timeLeft)}</Text>
          </View>
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {questions.map((q, qIndex) => (
            <View key={qIndex} style={styles.card}>
              <View style={styles.questionRow}>
                <View style={styles.questionBadge}>
                  <Text style={styles.questionBadgeText}>Q{qIndex + 1}</Text>
                </View>
                <Text style={styles.question}>{q.question}</Text>
              </View>

              <View style={styles.optionsWrap}>
                {q.options.map((opt: string, optIndex: number) => {
                  const isSelected = getSelectedOption(qIndex) === optIndex;
                  return (
                    <TouchableOpacity
                      key={optIndex}
                      style={[styles.option, isSelected && styles.optionSelected]}
                      onPress={() => selectAnswer(qIndex, optIndex)}
                      activeOpacity={0.85}
                    >
                      <View style={[styles.optionCircle, isSelected && styles.optionCircleSelected]}>
                        <Text style={[styles.optionCircleText, isSelected && styles.optionCircleTextSelected]}>
                          {String.fromCharCode(65 + optIndex)}
                        </Text>
                      </View>
                      <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                        {opt}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.bottomBar}>
          <View>
            <Text style={styles.bottomInfoLabel}>Answered</Text>
            <Text style={styles.bottomInfoValue}>
              {answeredCount}/{questions.length}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.submit, hasSubmitted.current && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={hasSubmitted.current}
          >
            <Text style={styles.submitText}>
              {hasSubmitted.current ? "Submitting..." : "Submit Quiz"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  screen: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background },
  loadingText: { color: COLORS.textPrimary, marginTop: 12, fontFamily: "DMSans_500Medium", fontSize: 15 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10 },
  backBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#111827", borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center", marginRight: 12 },
  headerTextWrap: { flex: 1 },
  title: { color: COLORS.textPrimary, fontSize: 24, fontFamily: "DMSans_800ExtraBold" },
  subtitle: { color: COLORS.textMuted, fontSize: 13, fontFamily: "DMSans_400Regular", marginTop: 2 },
  topStats: { flexDirection: "row", paddingHorizontal: 20, gap: 12, marginTop: 10, marginBottom: 8 },
  statCard: { flex: 1, backgroundColor: "#111827", borderRadius: RADIUS.card, borderWidth: 1, borderColor: COLORS.border, paddingVertical: 14, paddingHorizontal: 16 },
  timerCard: { borderColor: "rgba(239,68,68,0.35)" },
  statLabel: { color: COLORS.textMuted, fontSize: 12, fontFamily: "DMSans_500Medium", marginBottom: 6 },
  statValue: { color: COLORS.textPrimary, fontSize: 20, fontFamily: "DMSans_700Bold" },
  timerValue: { color: COLORS.danger, fontSize: 20, fontFamily: "DMSans_700Bold" },
  container: { flex: 1, paddingHorizontal: 20, marginTop: 12 },
  card: { backgroundColor: "#111827", borderRadius: RADIUS.card, borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 16 },
  questionRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 14 },
  questionBadge: { minWidth: 38, height: 30, borderRadius: 999, backgroundColor: "rgba(59,130,246,0.16)", alignItems: "center", justifyContent: "center", marginRight: 10, marginTop: 1 },
  questionBadgeText: { color: COLORS.primary, fontSize: 12, fontFamily: "DMSans_700Bold" },
  question: { flex: 1, color: COLORS.textPrimary, fontSize: 16, lineHeight: 24, fontFamily: "DMSans_600SemiBold" },
  optionsWrap: { gap: 10 },
  option: { minHeight: 54, borderRadius: 14, backgroundColor: "#1E293B", borderWidth: 1, borderColor: "transparent", paddingHorizontal: 14, flexDirection: "row", alignItems: "center" },
  optionSelected: { borderColor: COLORS.primary, backgroundColor: "rgba(59,130,246,0.14)" },
  optionCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#0F172A", alignItems: "center", justifyContent: "center", marginRight: 12 },
  optionCircleSelected: { backgroundColor: COLORS.primary },
  optionCircleText: { color: COLORS.textMuted, fontSize: 12, fontFamily: "DMSans_700Bold" },
  optionCircleTextSelected: { color: "#fff" },
  optionText: { flex: 1, color: COLORS.textPrimary, fontSize: 14, fontFamily: "DMSans_500Medium" },
  optionTextSelected: { color: COLORS.textPrimary, fontFamily: "DMSans_700Bold" },
  bottomBar: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: "#0B1220", borderTopWidth: 1, borderTopColor: COLORS.border, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  bottomInfoLabel: { color: COLORS.textMuted, fontSize: 12, fontFamily: "DMSans_500Medium" },
  bottomInfoValue: { color: COLORS.textPrimary, fontSize: 18, fontFamily: "DMSans_700Bold", marginTop: 2 },
  submit: { backgroundColor: COLORS.primary, paddingHorizontal: 22, paddingVertical: 14, borderRadius: RADIUS.button, minWidth: 150, alignItems: "center" },
  submitDisabled: { opacity: 0.65 },
  submitText: { color: "#fff", fontSize: 15, fontFamily: "DMSans_700Bold" },
});