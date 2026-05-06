import React, { useEffect, useState, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, SafeAreaView, StatusBar,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import API from "../../utils/api";
import { COLORS, FONT, RADIUS } from "../../utils/theme";

export default function QuizScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const id = String(params.id);

  const [questions, setQuestions] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answers, setAnswers] = useState<Record<number, { originalQuestionIndex: number; originalOptionIndex: number }>>({});
  const [loading, setLoading] = useState(true);
  const hasSubmitted = useRef(false);

  useEffect(() => { fetchQuiz(); }, []);

  const fetchQuiz = async () => {
    try {
      const res = await API.get(`/events/${id}/quiz`);
      setQuestions(res.data.questions);
      setTimeLeft(res.data.duration * 60);
    } catch {
      Alert.alert("Error", "Failed to load quiz");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (questions.length === 0 || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!hasSubmitted.current) handleSubmit();
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
      [qIndex]: { originalQuestionIndex: qIndex, originalOptionIndex: optIndex },
    }));
  };

  const handleSubmit = async () => {
    if (hasSubmitted.current) return;
    hasSubmitted.current = true;
    try {
      await API.post(`/events/${id}/submit-quiz`, { answers: Object.values(answers) });
      router.push({ pathname: "/(core)/result/[id]", params: { id: String(id) } });
    } catch (error: any) {
      Alert.alert("Error", error?.response?.data?.message || "Submission failed");
      hasSubmitted.current = false;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(Math.max(seconds, 0) / 60);
    const secs = Math.max(seconds, 0) % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const answeredCount = Object.keys(answers).length;
  const isLowTime = timeLeft > 0 && timeLeft <= 60;

  if (loading) {
    return (
      <View style={styles.center}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading Quiz…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <View style={styles.topAccent} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Event Quiz</Text>
          <Text style={styles.subtitle}>Answer all questions before time runs out</Text>
        </View>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>QUESTIONS</Text>
          <Text style={styles.statValue}>{questions.length}</Text>
        </View>
        <View style={[styles.statCard, styles.timerCard, isLowTime && styles.timerCardUrgent]}>
          <Text style={[styles.statLabel, isLowTime && styles.timerLabelUrgent]}>TIME LEFT</Text>
          <Text style={[styles.timerValue, isLowTime && styles.timerValueUrgent]}>
            {formatTime(timeLeft)}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>ANSWERED</Text>
          <Text style={styles.statValue}>{answeredCount}/{questions.length}</Text>
        </View>
      </View>

      {/* Questions */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {questions.map((q, qIndex) => {
          const selectedOpt = answers[qIndex]?.originalOptionIndex;
          return (
            <View key={qIndex} style={styles.questionCard}>
              {/* Left status strip */}
              <View style={[
                styles.questionStrip,
                { backgroundColor: selectedOpt !== undefined ? COLORS.primary : COLORS.border }
              ]} />

              <View style={styles.questionInner}>
                <View style={styles.questionHeader}>
                  <View style={[
                    styles.questionBadge,
                    selectedOpt !== undefined && styles.questionBadgeAnswered,
                  ]}>
                    <Text style={[
                      styles.questionBadgeText,
                      selectedOpt !== undefined && styles.questionBadgeTextAnswered,
                    ]}>
                      Q{qIndex + 1}
                    </Text>
                  </View>
                  {selectedOpt !== undefined && (
                    <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
                  )}
                </View>

                <Text style={styles.questionText}>{q.question}</Text>

                <View style={styles.options}>
                  {q.options.map((opt: string, optIndex: number) => {
                    const isSelected = selectedOpt === optIndex;
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
                          <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          );
        })}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Submit Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View style={[
              styles.progressFill,
              { width: `${questions.length > 0 ? (answeredCount / questions.length) * 100 : 0}%` }
            ]} />
          </View>
          <Text style={styles.progressLabel}>
            {answeredCount} of {questions.length} answered
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.submitBtn, hasSubmitted.current && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={hasSubmitted.current}
          activeOpacity={0.85}
        >
          <Text style={styles.submitBtnText}>
            {hasSubmitted.current ? "Submitting…" : "Submit Quiz"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  center: {
    flex: 1, justifyContent: "center", alignItems: "center",
    backgroundColor: COLORS.background, gap: 12,
  },
  loadingText: { color: COLORS.textSecondary, fontSize: 15, fontFamily: FONT.medium },
  topAccent: { height: 3, backgroundColor: COLORS.primary },

  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10, gap: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    justifyContent: "center", alignItems: "center",
  },
  headerText: { flex: 1 },
  title: { color: COLORS.textPrimary, fontSize: 22, fontFamily: FONT.extraBold },
  subtitle: { color: COLORS.textMuted, fontSize: 12, fontFamily: FONT.regular, marginTop: 2 },

  statsRow: { flexDirection: "row", paddingHorizontal: 20, gap: 10, marginBottom: 12 },
  statCard: {
    flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.sm,
    borderWidth: 1, borderColor: COLORS.border,
    paddingVertical: 12, paddingHorizontal: 10, alignItems: "center",
  },
  timerCard: { borderColor: COLORS.border },
  timerCardUrgent: { borderColor: COLORS.primaryBorder, backgroundColor: COLORS.primaryGlow },
  statLabel: {
    color: COLORS.textMuted, fontSize: 9, fontFamily: FONT.bold,
    letterSpacing: 1.5, marginBottom: 4,
  },
  timerLabelUrgent: { color: COLORS.primary },
  statValue: { color: COLORS.textPrimary, fontSize: 18, fontFamily: FONT.bold },
  timerValue: { color: COLORS.warning, fontSize: 18, fontFamily: FONT.bold },
  timerValueUrgent: { color: COLORS.primary },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 4 },

  questionCard: {
    flexDirection: "row",
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
    marginBottom: 14, overflow: "hidden",
  },
  questionStrip: { width: 4 },
  questionInner: { flex: 1, padding: 16 },
  questionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  questionBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.chip,
    backgroundColor: COLORS.surfaceHigh, borderWidth: 1, borderColor: COLORS.border,
  },
  questionBadgeAnswered: {
    backgroundColor: COLORS.primaryGlow, borderColor: COLORS.primaryBorder,
  },
  questionBadgeText: { color: COLORS.textMuted, fontSize: 11, fontFamily: FONT.bold },
  questionBadgeTextAnswered: { color: COLORS.primary },
  questionText: {
    color: COLORS.textPrimary, fontSize: 15, fontFamily: FONT.semiBold,
    lineHeight: 22, marginBottom: 14,
  },

  options: { gap: 8 },
  option: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.sm,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  optionSelected: {
    borderColor: COLORS.primary, backgroundColor: COLORS.primaryGlow,
  },
  optionCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    alignItems: "center", justifyContent: "center",
  },
  optionCircleSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  optionCircleText: { color: COLORS.textMuted, fontSize: 11, fontFamily: FONT.bold },
  optionCircleTextSelected: { color: "#fff" },
  optionText: { flex: 1, color: COLORS.textSecondary, fontSize: 14, fontFamily: FONT.medium },
  optionTextSelected: { color: COLORS.textPrimary, fontFamily: FONT.semiBold },

  bottomBar: {
    backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24, gap: 12,
  },
  progressWrap: { gap: 6 },
  progressTrack: {
    height: 3, backgroundColor: COLORS.border, borderRadius: 2, overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: COLORS.primary, borderRadius: 2 },
  progressLabel: { color: COLORS.textMuted, fontSize: 11, fontFamily: FONT.medium },
  submitBtn: {
    backgroundColor: COLORS.primary, paddingVertical: 15,
    borderRadius: RADIUS.md, alignItems: "center",
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: "#fff", fontSize: 15, fontFamily: FONT.bold },
});