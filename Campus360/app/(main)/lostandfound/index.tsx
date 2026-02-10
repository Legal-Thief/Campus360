import React, { useState } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';

const BLUE = '#2563EB';
const BLUE_LIGHT = '#EFF6FF';
const GRAY_100 = '#F1F5F9';
const GRAY_200 = '#E2E8F0';
const GRAY_500 = '#64748B';
const GRAY_700 = '#334155';
const WHITE = '#FFFFFF';
const AMBER = '#D97706';
const AMBER_BG = '#FEF3C7';
const GREEN = '#16A34A';
const GREEN_BG = '#DCFCE7';

const ITEMS = [
  { id: '1', type: 'lost',  title: 'Black Backpack',          desc: 'Nike backpack with laptop inside. Last seen near Library.',          contact: 'john.doe@college.edu',      date: 'Feb 1, 2025' },
  { id: '2', type: 'found', title: 'Gold Chain Necklace',     desc: 'Found near the cafeteria entrance. No name tag.',                   contact: 'priya.shah@college.edu',    date: 'Jan 30, 2025' },
  { id: '3', type: 'lost',  title: 'iPhone 15 Pro',           desc: 'Silver color. Lost somewhere in Block B ground floor.',            contact: '9876543210',                date: 'Jan 29, 2025' },
  { id: '4', type: 'found', title: 'Blue Water Bottle',       desc: 'Hydro Flask, blue. Found in the sports complex changing room.',    contact: 'rahul.k@college.edu',       date: 'Jan 28, 2025' },
  { id: '5', type: 'lost',  title: 'Casio Scientific Calculator', desc: 'Casio fx-991. Left in Room 204, Block A.',                     contact: 'anika.m@college.edu',       date: 'Jan 27, 2025' },
  { id: '6', type: 'found', title: 'Umbrella (Black)',         desc: 'Large black umbrella. Found at the bus stop near Gate 2.',        contact: 'vikram.p@college.edu',      date: 'Jan 26, 2025' },
];

export default function LostAndFoundScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'all' | 'lost' | 'found'>('all');

  const filtered = tab === 'all' ? ITEMS : ITEMS.filter(i => i.type === tab);

  return (
    <View style={styles.screen}>
      <View style={{ height: Platform.OS === 'ios' ? 54 : 44 }} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Lost & Found</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {(['all', 'lost', 'found'] as const).map(t => (
          <Pressable
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'all' ? `All (${ITEMS.length})` : t === 'lost' ? `Lost (${ITEMS.filter(i=>i.type==='lost').length})` : `Found (${ITEMS.filter(i=>i.type==='found').length})`}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Item list */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <ItemCard item={item} />}
        contentContainerStyle={styles.listContent}
      />

      {/* FAB */}
      <View style={styles.fabContainer}>
        <Pressable
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
          onPress={() => router.push('/(main)/lostandfound/post')}
        >
          <Text style={styles.fabIcon}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ItemCard({ item }) {
  const isLost = item.type === 'lost';
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={[styles.typeBadge, isLost ? styles.typeBadgeLost : styles.typeBadgeFound]}>
          <Text style={[styles.typeBadgeText, isLost ? styles.typeBadgeTextLost : styles.typeBadgeTextFound]}>
            {isLost ? '🔍 Lost' : '✓ Found'}
          </Text>
        </View>
        <Text style={styles.cardDate}>{item.date}</Text>
      </View>

      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardDesc}>{item.desc}</Text>

      <View style={styles.contactRow}>
        <Text style={styles.contactIcon}>📧</Text>
        <Text style={styles.contactText}>{item.contact}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 12 },
  backBtn: { width: 38, height: 38, borderRadius: 11, backgroundColor: WHITE, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  backIcon: { fontSize: 20, color: GRAY_700 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: GRAY_700 },

  // Tabs
  tabBar: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 14, marginBottom: 4, gap: 8 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 10, backgroundColor: WHITE, borderWidth: 1, borderColor: GRAY_200 },
  tabActive: { backgroundColor: BLUE, borderColor: BLUE },
  tabText: { fontSize: 13, color: GRAY_500, fontWeight: '500' },
  tabTextActive: { color: WHITE, fontWeight: '600' },

  // List
  listContent: { paddingHorizontal: 20, paddingVertical: 12, paddingBottom: 80 },

  // Card
  card: { backgroundColor: WHITE, borderRadius: 15, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  typeBadgeLost: { backgroundColor: AMBER_BG },
  typeBadgeFound: { backgroundColor: GREEN_BG },
  typeBadgeText: { fontSize: 12, fontWeight: '600' },
  typeBadgeTextLost: { color: AMBER },
  typeBadgeTextFound: { color: GREEN },
  cardDate: { fontSize: 11, color: GRAY_500 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: GRAY_700, marginBottom: 5 },
  cardDesc: { fontSize: 13, color: GRAY_500, lineHeight: 19, marginBottom: 10 },
  contactRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: GRAY_100, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  contactIcon: { fontSize: 13, marginRight: 6 },
  contactText: { fontSize: 12, color: GRAY_700, fontWeight: '500' },

  // FAB
  fabContainer: { position: 'absolute', bottom: 28, right: 24 },
  fab: { width: 56, height: 56, borderRadius: 18, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center', shadowColor: BLUE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
  fabPressed: { backgroundColor: '#1D4ED8', shadowOpacity: 0.2 },
  fabIcon: { fontSize: 28, color: WHITE, fontWeight: '700' },
});
