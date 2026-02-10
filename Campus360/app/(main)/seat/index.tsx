import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../../../context/AppContext';


import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';

/* 🎨 COLORS */
const BLUE = '#2563EB';
const GRAY_400 = '#94A3B8';
const GRAY_500 = '#64748B';
const GRAY_700 = '#334155';
const WHITE = '#FFFFFF';
const RED = '#EF4444';
const GREEN = '#16A34A';
const SEAT_BG = '#E5E7EB';

const ROWS = 20; // A–F
const COLS = 12; // includes aisle
const MINI_SCALE = 0.15;

export default function SeatScreen() {
  const router = useRouter();
  const { eventState, setEventState } = useApp();

  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);

  /* 🚫 QUIZ GUARD */
  if (!eventState.quizCompleted) {
    return (
      <View style={styles.center}>
        <Text style={styles.blockText}>
          Complete the quiz before selecting a seat.
        </Text>
        <Pressable
          style={styles.backBtn}
          onPress={() => router.replace('/(main)/quiz')}
        >
          <Text style={styles.backText}>Go to Quiz</Text>
        </Pressable>
      </View>
    );
  }

  const phaseAllowed =
    eventState.priority !== null && eventState.priority >= 2;

  if (!phaseAllowed) {
    return (
      <View style={styles.center}>
        <Text style={styles.waitText}>
          Seats are currently full.
        </Text>
        <Text style={styles.waitSub}>
          You are in the waiting list.
        </Text>
      </View>
    );
  }

  /* ===================== ZOOM + PAN ===================== */

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.max(
        1,
        Math.min(savedScale.value * e.scale, 3)
      );
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value === 1) {
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedX.value = 0;
        savedY.value = 0;
      }
    });

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (scale.value > 1) {
        translateX.value = savedX.value + e.translationX;
        translateY.value = savedY.value + e.translationY;
      }
    })
    .onEnd(() => {
      savedX.value = translateX.value;
      savedY.value = translateY.value;
    });

  const gesture = Gesture.Simultaneous(pinch, pan);

  const animatedMapStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  /* ===================== MINI MAP ===================== */

  const viewportStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: -translateX.value * MINI_SCALE },
      { translateY: -translateY.value * MINI_SCALE },
    ],
    width: 140 / scale.value,
    height: 90 / scale.value,
  }));

  const miniPan = Gesture.Pan().onUpdate((e) => {
    translateX.value = -e.x / MINI_SCALE;
    translateY.value = -e.y / MINI_SCALE;
    savedX.value = translateX.value;
    savedY.value = translateY.value;
  });

  /* ===================== CONFIRM ===================== */

  const confirmSeat = () => {
    if (!selectedSeat) return;

    setEventState({
      ...eventState,
      seatSelected: true,
      qrGenerated: true,
    });

    router.replace('/(main)/qr/myqr');
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.header}>Select Your Seat</Text>
      <Text style={styles.subText}>
        Pinch to zoom • Drag to move
      </Text>

      {/* 🎬 STAGE */}
      <View style={styles.stageWrap}>
        <View style={styles.stage} />
        <Text style={styles.stageText}>STAGE</Text>
      </View>

      {/* 🧭 MINI MAP */}
      {scale.value > 1 && (
        <View style={styles.miniMapWrap}>
          <GestureDetector gesture={miniPan}>
            <View style={styles.miniMap}>
              {Array.from({ length: ROWS }).map((_, r) => (
                <View key={r} style={styles.miniRow}>
                  {Array.from({ length: COLS }).map((_, c) => (
                    <View key={c} style={styles.miniSeat} />
                  ))}
                </View>
              ))}
              <Animated.View
                style={[styles.viewportBox, viewportStyle]}
              />
            </View>
          </GestureDetector>
        </View>
      )}

      {/* 🎟️ SEAT MAP */}
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.map, animatedMapStyle]}>
          {Array.from({ length: ROWS }).map((_, row) => {
            const rowLabel = String.fromCharCode(65 + row);

            return (
              <View key={rowLabel} style={styles.row}>
                <Text style={styles.rowLabel}>{rowLabel}</Text>

                <View style={styles.seatRow}>
                  {Array.from({ length: COLS }).map((_, col) => {
                    if (col === COLS / 2)
                      return (
                        <View key={col} style={styles.aisle} />
                      );

                    const seatId = `${rowLabel}${col + 1}`;
                    const selected =
                      seatId === selectedSeat;

                    return (
                      <Pressable
                        key={seatId}
                        style={[
                          styles.seat,
                          selected && styles.seatSelected,
                        ]}
                        onPress={() =>
                          setSelectedSeat(seatId)
                        }
                      >
                        <Text
                          style={[
                            styles.seatText,
                            selected && { color: WHITE },
                          ]}
                        >
                          {col + 1}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </Animated.View>
      </GestureDetector>

      {/* CONFIRM */}
      <Pressable
        style={[
          styles.confirmBtn,
          !selectedSeat && { opacity: 0.5 },
        ]}
        disabled={!selectedSeat}
        onPress={confirmSeat}
      >
        <Text style={styles.confirmText}>
          Confirm Seat {selectedSeat || ''}
        </Text>
      </Pressable>
    </View>
  );
}

/* ===================== STYLES ===================== */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
  },
  header: {
    fontSize: 20,
    fontWeight: '800',
    color: GRAY_700,
  },
  subText: {
    fontSize: 13,
    color: GRAY_500,
    marginBottom: 10,
  },

  stageWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },
  stage: {
    width: '70%',
    height: 6,
    borderRadius: 6,
    backgroundColor: GRAY_400,
    opacity: 0.4,
  },
  stageText: {
    fontSize: 11,
    color: GRAY_400,
    marginTop: 4,
    letterSpacing: 1,
  },

  map: {
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  rowLabel: {
    width: 24,
    fontSize: 12,
    fontWeight: '700',
    color: GRAY_500,
    textAlign: 'center',
  },
  seatRow: {
    flexDirection: 'row',
  },

  seat: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: SEAT_BG,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  seatSelected: {
    backgroundColor: GREEN,
  },
  seatText: {
    fontSize: 10,
    fontWeight: '700',
    color: GRAY_700,
  },

  aisle: {
    width: 22,
  },

  /* MINI MAP */
  miniMapWrap: {
    position: 'absolute',
    top: 110,
    right: 16,
    zIndex: 20,
  },
  miniMap: {
    width: 140,
    height: 90,
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    padding: 4,
    overflow: 'hidden',
    elevation: 10,
  },
  miniRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  miniSeat: {
    width: 5,
    height: 5,
    margin: 1,
    borderRadius: 2,
    backgroundColor: '#9CA3AF',
  },
  viewportBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: BLUE,
    borderRadius: 4,
    backgroundColor: 'rgba(37,99,235,0.15)',
  },

  confirmBtn: {
    backgroundColor: BLUE,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  confirmText: {
    color: WHITE,
    fontSize: 15,
    fontWeight: '700',
  },

  /* GUARDS */
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  blockText: {
    fontSize: 15,
    color: GRAY_700,
    textAlign: 'center',
    marginBottom: 14,
  },
  backBtn: {
    backgroundColor: BLUE,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backText: {
    color: WHITE,
    fontWeight: '600',
  },
  waitText: {
    fontSize: 16,
    fontWeight: '800',
    color: RED,
    marginBottom: 8,
  },
  waitSub: {
    fontSize: 13,
    color: GRAY_500,
    textAlign: 'center',
  },
});



/**
 * 
 */