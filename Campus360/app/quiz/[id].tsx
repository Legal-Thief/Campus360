import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, SafeAreaView, StatusBar } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import API from "../../utils/api";
import { COLORS, FONT, RADIUS } from "../../utils/theme";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useAlert } from "../../components/CustomAlert";
import { useToast } from "../../components/Toast";

export default function QuizScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const id = String(params.id);
  const alert  = useAlert();
  const toast  = useToast();
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
    } catch { alert.show({ type: "error", title: "Error", message: "Failed to load quiz" }); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (questions.length === 0 || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(timer); if (!hasSubmitted.current) handleSubmit(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [questions]);

  const selectAnswer = (qIndex: number, optIndex: number) => {
    setAnswers((prev) => ({ ...prev, [qIndex]: { originalQuestionIndex: qIndex, originalOptionIndex: optIndex } }));
  };

  const handleSubmit = async () => {
    if (hasSubmitted.current) return;
    hasSubmitted.current = true;
    try {
      await API.post(`/events/${id}/submit-quiz`, { answers: Object.values(answers) });
      router.push({ pathname: "/(core)/result/[id]", params: { id: String(id) } });
    } catch (error: any) {
      alert.show({ type: "error", title: "Submission Failed", message: error?.response?.data?.message || "Please try again" });
      hasSubmitted.current = false;
    }
  };

  const formatTime = (s: number) => `${Math.floor(Math.max(s,0)/60)}:${(Math.max(s,0)%60).toString().padStart(2,"0")}`;
  const getSelectedOption = (qIndex: number) => answers[qIndex]?.originalOptionIndex;
  const answeredCount = Object.keys(answers).length;
  const isUrgent = timeLeft <= 60 && timeLeft > 0;

  if (loading) {
    return (
      <View style={styles.center}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <View style={styles.loaderRing}><ActivityIndicator size="large" color={COLORS.primary} /></View>
        <Text style={styles.loadingLabel}>CAMPUS360</Text>
        <Text style={styles.loadingText}>Loading Quiz…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <View style={styles.topAccent} />
      <View style={styles.bgGlow} />
      <View style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Event Quiz</Text>
            <Text style={styles.subtitle}>Answer all questions before time runs out</Text>
          </View>
        </View>

        <View style={styles.topStats}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Questions</Text>
            <Text style={styles.statValue}>{questions.length}</Text>
          </View>
          <View style={[styles.statCard, styles.timerCard, isUrgent && styles.timerCardUrgent]}>
            <Text style={styles.statLabel}>Time Left</Text>
            <Text style={[styles.timerValue, isUrgent && { color: COLORS.primary }]}>{formatTime(timeLeft)}</Text>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          {questions.map((q, qIndex) => (
            <View key={qIndex} style={styles.card}>
              <View style={styles.questionRow}>
                <View style={styles.questionBadge}>
                  <Text style={styles.questionBadgeText}>Q{qIndex + 1}</Text>
                </View>
                <Text style={styles.question}>{q.question}</Text>
              </View>
              <View style={{ gap: 10 }}>
                {q.options.map((opt: string, optIndex: number) => {
                  const isSelected = getSelectedOption(qIndex) === optIndex;
                  return (
                    <TouchableOpacity key={optIndex} style={[styles.option, isSelected && styles.optionSelected]} onPress={() => selectAnswer(qIndex, optIndex)} activeOpacity={0.85}>
                      <View style={[styles.optionCircle, isSelected && styles.optionCircleSelected]}>
                        <Text style={[styles.optionCircleText, isSelected && { color: "#fff" }]}>{String.fromCharCode(65 + optIndex)}</Text>
                      </View>
                      <Text style={[styles.optionText, isSelected && { fontFamily: FONT.bold }]}>{opt}</Text>
                      {isSelected && <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />}
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
            <Text style={styles.bottomInfoValue}>{answeredCount}/{questions.length}</Text>
          </View>
          <TouchableOpacity style={[styles.submit, hasSubmitted.current && { opacity: 0.55 }]} onPress={handleSubmit} disabled={hasSubmitted.current} activeOpacity={0.85}>
            <Text style={styles.submitText}>{hasSubmitted.current ? "Submitting…" : "Submit Quiz"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.background },
  screen: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background, gap: 10 },
  loaderRing: { width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: COLORS.primaryBorder, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  loadingLabel: { color: COLORS.primary, fontSize: 11, fontFamily: FONT.bold, letterSpacing: 3 },
  loadingText:  { color: COLORS.textMuted, fontSize: 13, fontFamily: FONT.regular },
  topAccent: { height: 3, backgroundColor: COLORS.primary },
  bgGlow:    { position: "absolute", top: -80, right: -80, width: 260, height: 260, borderRadius: 130, backgroundColor: COLORS.primary, opacity: 0.08 },
  header:    { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10 },
  backBtn:   { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center", marginRight: 12 },
  title:     { color: COLORS.textPrimary, fontSize: 24, fontFamily: FONT.extraBold },
  subtitle:  { color: COLORS.textMuted, fontSize: 13, fontFamily: FONT.regular, marginTop: 2 },
  topStats:  { flexDirection: "row", paddingHorizontal: 20, gap: 12, marginTop: 10, marginBottom: 8 },
  statCard:  { flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.card, borderWidth: 1, borderColor: COLORS.border, paddingVertical: 14, paddingHorizontal: 16 },
  timerCard: { borderColor: COLORS.primaryBorder },
  timerCardUrgent: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryGlow },
  statLabel:  { color: COLORS.textMuted, fontSize: 12, fontFamily: FONT.medium, marginBottom: 6 },
  statValue:  { color: COLORS.textPrimary, fontSize: 20, fontFamily: FONT.bold },
  timerValue: { color: COLORS.primary, fontSize: 20, fontFamily: FONT.bold },
  scroll: { flex: 1, paddingHorizontal: 20, marginTop: 12 },
  card:   { backgroundColor: COLORS.surface, borderRadius: RADIUS.card, borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 16 },
  questionRow:   { flexDirection: "row", alignItems: "flex-start", marginBottom: 14 },
  questionBadge: { minWidth: 38, height: 30, borderRadius: 999, backgroundColor: COLORS.primaryGlow, borderWidth: 1, borderColor: COLORS.primaryBorder, alignItems: "center", justifyContent: "center", marginRight: 10, marginTop: 1 },
  questionBadgeText: { color: COLORS.primary, fontSize: 12, fontFamily: FONT.bold },
  question:   { flex: 1, color: COLORS.textPrimary, fontSize: 16, lineHeight: 24, fontFamily: FONT.semiBold },
  option:     { minHeight: 54, borderRadius: 14, backgroundColor: COLORS.surfaceHigh, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 14, flexDirection: "row", alignItems: "center" },
  optionSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryGlow },
  optionCircle:   { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center", marginRight: 12 },
  optionCircleSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  optionCircleText: { color: COLORS.textMuted, fontSize: 12, fontFamily: FONT.bold },
  optionText:   { flex: 1, color: COLORS.textPrimary, fontSize: 14, fontFamily: FONT.medium },
  bottomBar:    { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  bottomInfoLabel: { color: COLORS.textMuted, fontSize: 12, fontFamily: FONT.medium },
  bottomInfoValue: { color: COLORS.textPrimary, fontSize: 18, fontFamily: FONT.bold, marginTop: 2 },
  submit:      { backgroundColor: COLORS.primary, paddingHorizontal: 22, paddingVertical: 14, borderRadius: RADIUS.button, minWidth: 150, alignItems: "center" },
  submitText:  { color: "#fff", fontSize: 15, fontFamily: FONT.bold },
});