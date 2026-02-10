import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../../../context/AppContext';

const BLUE = '#2563EB';
const RED = '#EF4444';
const GREEN = '#16A34A';
const GRAY_500 = '#64748B';
const GRAY_700 = '#334155';
const WHITE = '#FFFFFF';

export default function ScannerScreen() {
  const router = useRouter();
  const { eventState, setEventState } = useApp();
  const [status, setStatus] = useState<'idle' | 'inside' | 'break'>('idle');

  /* 🚫 GUARD */
  if (!eventState.qrGenerated) {
    return (
      <View style={styles.center}>
        <Text style={styles.blockText}>
          Invalid or expired QR.
        </Text>
      </View>
    );
  }

  /* 🎟️ ENTRY SCAN */
  const handleEntry = () => {
    const onTime = Math.random() > 0.3; // simulate timing

    if (onTime) {
      setEventState({
        ...eventState,
        attendanceMarked: true,
      });
      setStatus('inside');
    } else {
      /* Seat released */
      setEventState({
        registered: true,
        quizCompleted: true,
        priority: eventState.priority,
        seatSelected: false,
        qrGenerated: false,
        attendanceMarked: false,
      });
      setStatus('idle');
    }
  };

  /* 🚻 EXIT FOR BREAK */
  const handleExit = () => {
    setStatus('break');

    setTimeout(() => {
      const returned = Math.random() > 0.5;

      if (!returned) {
        /* Seat cancelled */
        setEventState({
          ...eventState,
          seatSelected: false,
          qrGenerated: false,
        });
        setStatus('idle');
      } else {
        setStatus('inside');
      }
    }, 5000); // break window
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.header}>QR Scanner</Text>

      {status === 'idle' && (
        <>
          <Text style={styles.info}>Scan QR to enter event</Text>
          <Pressable style={styles.primaryBtn} onPress={handleEntry}>
            <Text style={styles.btnText}>Scan Entry</Text>
          </Pressable>
        </>
      )}

      {status === 'inside' && (
        <>
          <Text style={[styles.info, { color: GREEN }]}>
            Attendance marked successfully
          </Text>
          <Pressable style={styles.secondaryBtn} onPress={handleExit}>
            <Text style={styles.btnText}>Exit for Break</Text>
          </Pressable>
        </>
      )}

      {status === 'break' && (
        <Text style={[styles.info, { color: RED }]}>
          Break in progress... return within time
        </Text>
      )}

      <Pressable
        style={styles.backBtn}
        onPress={() => router.replace('/(main)/dashboard')}
      >
        <Text style={styles.backText}>Back to Dashboard</Text>
      </Pressable>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 20,
    alignItems: 'center',
  },
  header: {
    fontSize: 20,
    fontWeight: '700',
    color: GRAY_700,
    marginBottom: 24,
  },
  info: {
    fontSize: 14,
    color: GRAY_700,
    marginBottom: 20,
    textAlign: 'center',
  },
  primaryBtn: {
    backgroundColor: BLUE,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  secondaryBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  btnText: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '600',
  },
  backBtn: {
    marginTop: 30,
  },
  backText: {
    fontSize: 13,
    color: GRAY_500,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blockText: {
    fontSize: 15,
    color: GRAY_700,
  },
});
