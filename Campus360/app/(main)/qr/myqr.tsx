import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../../../context/AppContext';

const BLUE = '#2563EB';
const GRAY_500 = '#64748B';
const GRAY_700 = '#334155';
const WHITE = '#FFFFFF';

export default function MyQRScreen() {
  const router = useRouter();
  const { eventState } = useApp();

  /* 🚫 GUARD: QR only after seat allocation */
  if (!eventState.qrGenerated) {
    return (
      <View style={styles.center}>
        <Text style={styles.blockText}>
          No active QR available.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.header}>My Event QR</Text>

      {/* QR Placeholder */}
      <View style={styles.qrBox}>
        <Text style={styles.qrText}>QR CODE</Text>
      </View>

      <Text style={styles.info}>
        Seat confirmed. Please scan this QR before the event starts.
      </Text>

      <Pressable
        style={styles.scanBtn}
        onPress={() => router.push('/(main)/qr/scanner')}
      >
        <Text style={styles.scanText}>Go to Scanner</Text>
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
  qrBox: {
    width: 220,
    height: 220,
    borderRadius: 16,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    marginBottom: 20,
  },
  qrText: {
    fontSize: 16,
    fontWeight: '700',
    color: GRAY_500,
  },
  info: {
    fontSize: 13,
    color: GRAY_500,
    textAlign: 'center',
    marginBottom: 20,
  },
  scanBtn: {
    backgroundColor: BLUE,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  scanText: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '600',
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockText: {
    fontSize: 15,
    color: GRAY_700,
  },
});
