import React from 'react';
import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../../../context/AppContext';

const BLUE = '#2563EB';
const GRAY_100 = '#F1F5F9';
const GRAY_500 = '#64748B';
const GRAY_700 = '#334155';
const WHITE = '#FFFFFF';

const EVENTS = [
  {
    id: '1',
    title: 'Tech Symposium 2025',
    venue: 'Main Auditorium',
    time: '2:00 PM',
    seats: '300 Seats',
  },
  {
    id: '2',
    title: 'AI Guest Lecture',
    venue: 'Seminar Hall B',
    time: '11:00 AM',
    seats: '120 Seats',
  },
];

export default function EventsScreen() {
  const router = useRouter();
  const { eventState, setEventState } = useApp();

  const handleRegister = () => {
    setEventState({
      registered: true,
      quizCompleted: false,
      priority: null,
      seatSelected: false,
      qrGenerated: false,
      attendanceMarked: false,
    });

    router.push('/(main)/quiz');
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.header}>Campus Events</Text>

      <FlatList
        data={EVENTS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 30 }}
        renderItem={({ item }) => (
          <View style={styles.eventCard}>
            <View style={styles.eventInfo}>
              <Text style={styles.eventTitle}>{item.title}</Text>
              <Text style={styles.eventMeta}>
                {item.venue} • {item.time}
              </Text>
              <Text style={styles.eventSeats}>{item.seats}</Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.registerBtn,
                pressed && { opacity: 0.9 },
              ]}
              onPress={handleRegister}
            >
              <Text style={styles.registerText}>Register</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    fontSize: 20,
    fontWeight: '700',
    color: GRAY_700,
    marginBottom: 16,
  },
  eventCard: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    elevation: 3,
  },
  eventInfo: { marginBottom: 12 },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: GRAY_700,
  },
  eventMeta: {
    fontSize: 13,
    color: GRAY_500,
    marginTop: 4,
  },
  eventSeats: {
    fontSize: 12,
    color: BLUE,
    marginTop: 6,
    fontWeight: '600',
  },
  registerBtn: {
    backgroundColor: BLUE,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  registerText: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '600',
  },
});
