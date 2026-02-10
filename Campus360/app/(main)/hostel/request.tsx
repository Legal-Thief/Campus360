import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';

const BLUE = '#2563EB';
const BLUE_DARK = '#1D4ED8';
const GRAY_100 = '#F1F5F9';
const GRAY_200 = '#E2E8F0';
const GRAY_400 = '#94A3B8';
const GRAY_500 = '#64748B';
const GRAY_700 = '#334155';
const WHITE = '#FFFFFF';

const BLOCKS = ['Block A', 'Block B', 'Block C', 'Block D'];
const ROOMS_PER_BLOCK = ['101','102','103','104','105','201','202','203','204','205','301','302','303','304','305','401','402','403','404','405'];

export default function RequestRoomScreen() {
  const router = useRouter();

  const [currentBlock, setCurrentBlock] = useState('Block A');
  const [currentRoom, setCurrentRoom] = useState('204');
  const [desiredBlock, setDesiredBlock] = useState('Block C');
  const [desiredRoom, setDesiredRoom] = useState('112');
  const [reason, setReason] = useState('');
  const [reasonFocused, setReasonFocused] = useState(false);

  // Dropdown open states
  const [openCurrentBlock, setOpenCurrentBlock] = useState(false);
  const [openDesiredBlock, setOpenDesiredBlock] = useState(false);

  const allFilled = reason.trim().length > 10;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <View style={{ height: Platform.OS === 'ios' ? 54 : 44 }} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Request Room Change</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Info banner */}
      <View style={styles.infoBanner}>
        <Text style={styles.infoBannerIcon}>📋</Text>
        <Text style={styles.infoBannerText}>
          Your request will be reviewed by the hostel warden. Please provide a valid reason for the change.
        </Text>
      </View>

      {/* Current room card */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Current Room</Text>
        <View style={styles.roomRow}>
          <View style={styles.roomDisplay}>
            <Text style={styles.roomDisplayLabel}>Block</Text>
            <Pressable
              style={styles.roomDropdown}
              onPress={() => { setOpenCurrentBlock(!openCurrentBlock); setOpenDesiredBlock(false); }}
            >
              <Text style={styles.roomDropdownText}>{currentBlock}</Text>
              <Text style={styles.roomDropdownArrow}>{openCurrentBlock ? '▲' : '▼'}</Text>
            </Pressable>
            {openCurrentBlock && (
              <View style={styles.dropdownOptions}>
                {BLOCKS.map(b => (
                  <Pressable key={b} style={[styles.dropdownOption, currentBlock === b && styles.dropdownOptionActive]} onPress={() => { setCurrentBlock(b); setOpenCurrentBlock(false); }}>
                    <Text style={[styles.dropdownOptionText, currentBlock === b && styles.dropdownOptionTextActive]}>{b}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
          <View style={styles.roomDisplay}>
            <Text style={styles.roomDisplayLabel}>Room No.</Text>
            <View style={styles.roomInput}>
              <Text style={styles.roomInputText}>{currentRoom}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Arrow */}
      <View style={styles.arrowRow}>
        <View style={styles.arrowCircle}>
          <Text style={styles.arrowText}>↓</Text>
        </View>
      </View>

      {/* Desired room card */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Desired Room</Text>
        <View style={styles.roomRow}>
          <View style={styles.roomDisplay}>
            <Text style={styles.roomDisplayLabel}>Block</Text>
            <Pressable
              style={[styles.roomDropdown, styles.roomDropdownDesired]}
              onPress={() => { setOpenDesiredBlock(!openDesiredBlock); setOpenCurrentBlock(false); }}
            >
              <Text style={[styles.roomDropdownText, styles.roomDropdownTextDesired]}>{desiredBlock}</Text>
              <Text style={[styles.roomDropdownArrow, { color: BLUE }]}>{openDesiredBlock ? '▲' : '▼'}</Text>
            </Pressable>
            {openDesiredBlock && (
              <View style={styles.dropdownOptions}>
                {BLOCKS.map(b => (
                  <Pressable key={b} style={[styles.dropdownOption, desiredBlock === b && styles.dropdownOptionActive]} onPress={() => { setDesiredBlock(b); setOpenDesiredBlock(false); }}>
                    <Text style={[styles.dropdownOptionText, desiredBlock === b && styles.dropdownOptionTextActive]}>{b}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
          <View style={styles.roomDisplay}>
            <Text style={styles.roomDisplayLabel}>Room No.</Text>
            <View style={[styles.roomInput, styles.roomInputDesired]}>
              <TextInput
                style={[styles.roomInputText, { color: BLUE }]}
                value={desiredRoom}
                onChangeText={setDesiredRoom}
                keyboardType="numeric"
                placeholder="e.g. 112"
                placeholderTextColor={GRAY_400}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Reason */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Reason for Change *</Text>
        <View style={[styles.textareaRow, reasonFocused && styles.textareaRowFocused]}>
          <TextInput
            style={styles.textarea}
            placeholder="Please explain why you need a room change..."
            placeholderTextColor={GRAY_400}
            value={reason}
            onChangeText={setReason}
            onFocus={() => setReasonFocused(true)}
            onBlur={() => setReasonFocused(false)}
            multiline
            maxHeight={160}
          />
        </View>
        <Text style={styles.charCount}>{reason.length} characters (min. 10)</Text>
      </View>

      {/* Submit */}
      <Pressable
        style={[styles.submitBtn, allFilled && styles.submitBtnActive]}
        onPress={() => { if (allFilled) router.back(); }}
        disabled={!allFilled}
      >
        <Text style={[styles.submitBtnText, !allFilled && styles.submitBtnTextDisabled]}>
          Submit Request
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 36 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, marginBottom: 16 },
  backBtn: { width: 38, height: 38, borderRadius: 11, backgroundColor: WHITE, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  backIcon: { fontSize: 20, color: GRAY_700 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: GRAY_700 },

  // Info banner
  infoBanner: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#EFF6FF', borderRadius: 12, padding: 14, marginBottom: 18 },
  infoBannerIcon: { fontSize: 18, marginRight: 10, flexShrink: 0 },
  infoBannerText: { fontSize: 13, color: BLUE, lineHeight: 19, flex: 1 },

  // Card
  card: { backgroundColor: WHITE, borderRadius: 16, padding: 18, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: GRAY_700, marginBottom: 12, letterSpacing: 0.3 },

  // Room row
  roomRow: { flexDirection: 'row', gap: 12 },
  roomDisplay: { flex: 1, position: 'relative' },
  roomDisplayLabel: { fontSize: 11, color: GRAY_500, marginBottom: 5, fontWeight: '500' },
  roomDropdown: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: GRAY_100, borderRadius: 10, paddingHorizontal: 12, height: 42 },
  roomDropdownDesired: { backgroundColor: '#EFF6FF', borderWidth: 1.5, borderColor: BLUE },
  roomDropdownText: { fontSize: 14, fontWeight: '600', color: GRAY_700 },
  roomDropdownTextDesired: { color: BLUE },
  roomDropdownArrow: { fontSize: 10, color: GRAY_400 },
  roomInput: { backgroundColor: GRAY_100, borderRadius: 10, paddingHorizontal: 12, height: 42, alignItems: 'center', justifyContent: 'center' },
  roomInputDesired: { backgroundColor: '#EFF6FF', borderWidth: 1.5, borderColor: BLUE },
  roomInputText: { fontSize: 14, fontWeight: '600', color: GRAY_700 },

  // Dropdown
  dropdownOptions: { position: 'absolute', top: 52, left: 0, right: 0, backgroundColor: WHITE, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: GRAY_200, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5, zIndex: 10 },
  dropdownOption: { paddingHorizontal: 14, paddingVertical: 10 },
  dropdownOptionActive: { backgroundColor: '#EFF6FF' },
  dropdownOptionText: { fontSize: 14, color: GRAY_700 },
  dropdownOptionTextActive: { color: BLUE, fontWeight: '600' },

  // Arrow between cards
  arrowRow: { alignItems: 'center', marginVertical: 2 },
  arrowCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center', shadowColor: BLUE, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3 },
  arrowText: { fontSize: 18, color: WHITE, fontWeight: '700' },

  // Textarea
  textareaRow: { backgroundColor: GRAY_100, borderRadius: 12, borderWidth: 1.5, borderColor: 'transparent', padding: 14, minHeight: 100 },
  textareaRowFocused: { borderColor: BLUE, backgroundColor: '#F0F7FF' },
  textarea: { flex: 1, fontSize: 14, color: GRAY_700, lineHeight: 21 },
  charCount: { fontSize: 11, color: GRAY_500, marginTop: 6, textAlign: 'right' },

  // Submit
  submitBtn: { width: '100%', height: 50, borderRadius: 12, backgroundColor: GRAY_200, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  submitBtnActive: { backgroundColor: BLUE, shadowColor: BLUE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 5 },
  submitBtnText: { fontSize: 16, fontWeight: '600', color: WHITE },
  submitBtnTextDisabled: { color: GRAY_500 },
});
