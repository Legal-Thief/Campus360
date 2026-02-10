import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../../../context/AppContext';

const BLUE = '#2563EB';
const GRAY_500 = '#64748B';
const GRAY_700 = '#334155';
const WHITE = '#FFFFFF';

const QUESTIONS = [
  {
    id: 1,
    question: 'What is the main theme of this event?',
    options: ['AI', 'Robotics', 'Cybersecurity', 'Cloud'],
    correct: 0,
  },
  {
    id: 2,
    question: 'Who is the keynote speaker?',
    options: ['Industry Expert', 'Professor', 'Researcher', 'Entrepreneur'],
    correct: 0,
  },
  {
    id: 3,
    question: 'What is the expected duration?',
    options: ['1 hour', '2 hours', 'Half day', 'Full day'],
    correct: 1,
  },
];

export default function QuizScreen() {
  const router = useRouter();
  const { eventState, setEventState } = useApp();

  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);

  /* 🚫 GUARD: Quiz only after registration */
  if (!eventState.registered) {
    return (
      <View style={styles.center}>
        <Text style={styles.blockText}>
          Please register for an event before attempting the quiz.
        </Text>
        <Pressable
          style={styles.backBtn}
          onPress={() => router.replace('/(main)/events')}
        >
          <Text style={styles.backText}>Go to Events</Text>
        </Pressable>
      </View>
    );
  }

  const question = QUESTIONS[current];

  const handleAnswer = (index: number) => {
    if (index === question.correct) {
      setScore((prev) => prev + 1);
    }

    if (current < QUESTIONS.length - 1) {
      setCurrent((prev) => prev + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    const priority = score + 1; // simple priority logic

    setEventState({
      ...eventState,
      quizCompleted: true,
      priority,
    });

    router.replace('/(main)/seat');
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.progress}>
        Question {current + 1} of {QUESTIONS.length}
      </Text>

      <Text style={styles.question}>{question.question}</Text>

      {question.options.map((opt, index) => (
        <Pressable
          key={index}
          style={({ pressed }) => [
            styles.optionBtn,
            pressed && { opacity: 0.9 },
          ]}
          onPress={() => handleAnswer(index)}
        >
          <Text style={styles.optionText}>{opt}</Text>
        </Pressable>
      ))}

      <Text style={styles.note}>
        Quiz score determines seat selection priority
      </Text>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  progress: {
    fontSize: 12,
    color: GRAY_500,
    marginBottom: 12,
    fontWeight: '500',
  },
  question: {
    fontSize: 18,
    fontWeight: '700',
    color: GRAY_700,
    marginBottom: 20,
  },
  optionBtn: {
    backgroundColor: WHITE,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    elevation: 2,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: GRAY_700,
  },
  note: {
    marginTop: 20,
    fontSize: 12,
    color: GRAY_500,
    textAlign: 'center',
  },

  /* Guard UI */
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  blockText: {
    fontSize: 15,
    color: GRAY_700,
    textAlign: 'center',
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: BLUE,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backText: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '600',
  },
});
