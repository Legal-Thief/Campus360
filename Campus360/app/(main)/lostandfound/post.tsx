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
const AMBER = '#D97706';
const AMBER_BG = '#FEF3C7';
const GREEN = '#16A34A';
const GREEN_BG = '#DCFCE7';
const WHITE = '#FFFFFF';

export default function PostItemScreen() {
  const router = useRouter();
  const [type, setType] = useState<'lost' | 'found'>('lost');
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [contact, setContact] = useState('');
  const [nameFocused, setNameFocused] = useState(false);
  const [descFocused, setDescFocused] = useState(false);
  const [contactFocused, setContactFocused] = useState(false);

  const allFilled = itemName.trim().length > 0 && description.trim().length > 0 && contact.trim().length > 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <View style={{ height: Platform.OS === 'ios' ? 54 : 44 }} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Post Item</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Type toggle */}
      <View style={styles.toggleContainer}>
        <Pressable
          style={[styles.toggleBtn, type === 'lost' && styles.toggleBtnActiveLost]}
          onPress={() => setType('lost')}
        >
          <Text style={styles.toggleIcon}>🔍</Text>
          <Text style={[styles.toggleText, type === 'lost' && styles.toggleTextActiveLost]}>I Lost Something</Text>
        </Pressable>
        <Pressable
          style={[styles.toggleBtn, type === 'found' && styles.toggleBtnActiveFound]}
          onPress={() => setType('found')}
        >
          <Text style={styles.toggleIcon}>✓</Text>
          <Text style={[styles.toggleText, type === 'found' && styles.toggleTextActiveFound]}>I Found Something</Text>
        </Pressable>
      </View>

      {/* Info note */}
      <View style={[styles.infoNote, type === 'lost' ? styles.infoNoteLost : styles.infoNoteFound]}>
        <Text style={styles.infoNoteIcon}>{type === 'lost' ? '💡' : '🙌'}</Text>
        <Text style={[styles.infoNoteText, type === 'lost' ? styles.infoNoteTextLost : styles.infoNoteTextFound]}>
          {type === 'lost'
            ? 'Describe your lost item so others can help find it.'
            : 'Help reunite someone with their lost belongings.'}
        </Text>
      </View>

      {/* Form card */}
      <View style={styles.card}>
        {/* Item name */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Item Name *</Text>
          <View style={[styles.inputRow, nameFocused && styles.inputRowFocused]}>
            <Text style={styles.inputIcon}>📦</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Black Backpack"
              placeholderTextColor={GRAY_400}
              value={itemName}
              onChangeText={setItemName}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
            />
          </View>
        </View>

        {/* Description */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Description *</Text>
          <View style={[styles.textareaRow, descFocused && styles.inputRowFocused]}>
            <TextInput
              style={styles.textarea}
              placeholder="Describe the item, any distinguishing features, and where it was last seen..."
              placeholderTextColor={GRAY_400}
              value={description}
              onChangeText={setDescription}
              onFocus={() => setDescFocused(true)}
              onBlur={() => setDescFocused(false)}
              multiline
              maxHeight={140}
            />
          </View>
        </View>

        {/* Contact info */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Contact Info *</Text>
          <View style={[styles.inputRow, contactFocused && styles.inputRowFocused]}>
            <Text style={styles.inputIcon}>📧</Text>
            <TextInput
              style={styles.input}
              placeholder="Email or phone number"
              placeholderTextColor={GRAY_400}
              value={contact}
              onChangeText={setContact}
              onFocus={() => setContactFocused(true)}
              onBlur={() => setContactFocused(false)}
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Location (optional) */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Location <Text style={styles.optionalTag}>(optional)</Text></Text>
          <View style={styles.inputRow}>
            <Text style={styles.inputIcon}>📍</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Library, Block B"
              placeholderTextColor={GRAY_400}
              autoCapitalize="words"
            />
          </View>
        </View>

        {/* Submit button */}
        <Pressable
          style={[styles.submitBtn, allFilled && styles.submitBtnActive]}
          onPress={() => { if (allFilled) router.back(); }}
          disabled={!allFilled}
        >
          <Text style={[styles.submitBtnText, !allFilled && styles.submitBtnTextDisabled]}>
            Post {type === 'lost' ? 'Lost' : 'Found'} Item
          </Text>
        </Pressable>
      </View>
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

  // Toggle
  toggleContainer: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: WHITE, borderWidth: 1.5, borderColor: GRAY_200 },
  toggleBtnActiveLost: { borderColor: AMBER, backgroundColor: AMBER_BG },
  toggleBtnActiveFound: { borderColor: GREEN, backgroundColor: GREEN_BG },
  toggleIcon: { fontSize: 16 },
  toggleText: { fontSize: 13, fontWeight: '500', color: GRAY_500 },
  toggleTextActiveLost: { color: AMBER, fontWeight: '600' },
  toggleTextActiveFound: { color: GREEN, fontWeight: '600' },

  // Info note
  infoNote: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: 10, padding: 12, marginBottom: 18 },
  infoNoteLost: { backgroundColor: AMBER_BG },
  infoNoteFound: { backgroundColor: GREEN_BG },
  infoNoteIcon: { fontSize: 16, marginRight: 8, flexShrink: 0 },
  infoNoteText: { fontSize: 13, flex: 1, lineHeight: 18 },
  infoNoteTextLost: { color: AMBER },
  infoNoteTextFound: { color: GREEN },

  // Card
  card: { backgroundColor: WHITE, borderRadius: 18, padding: 22, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },

  // Fields
  fieldGroup: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '600', color: GRAY_700, marginBottom: 8 },
  optionalTag: { fontWeight: '400', color: GRAY_500 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: GRAY_100, borderRadius: 12, borderWidth: 1.5, borderColor: 'transparent', paddingHorizontal: 14, height: 48 },
  inputRowFocused: { borderColor: BLUE, backgroundColor: '#F0F7FF' },
  inputIcon: { fontSize: 18, marginRight: 10, width: 22, textAlign: 'center' },
  input: { flex: 1, fontSize: 14, color: GRAY_700 },
  textareaRow: { backgroundColor: GRAY_100, borderRadius: 12, borderWidth: 1.5, borderColor: 'transparent', padding: 14, minHeight: 100 },
  textarea: { flex: 1, fontSize: 14, color: GRAY_700, lineHeight: 21 },

  // Submit
  submitBtn: { width: '100%', height: 50, borderRadius: 12, backgroundColor: GRAY_200, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  submitBtnActive: { backgroundColor: BLUE, shadowColor: BLUE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 5 },
  submitBtnText: { fontSize: 16, fontWeight: '600', color: WHITE },
  submitBtnTextDisabled: { color: GRAY_500 },
});
