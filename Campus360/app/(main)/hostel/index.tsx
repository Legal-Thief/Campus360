import React from 'react';
import { View, Text, Pressable, FlatList, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';

const BLUE = '#2563EB';
const BLUE_LIGHT = '#EFF6FF';
const GRAY_100 = '#F1F5F9';
const GRAY_200 = '#E2E8F0';
const GRAY_500 = '#64748B';
const GRAY_700 = '#334155';
const WHITE = '#FFFFFF';
const GREEN = '#16A34A';
const GREEN_BG = '#DCFCE7';
const AMBER = '#D97706';
const AMBER_BG = '#FEF3C7';
const RED = '#DC2626';
const RED_BG = '#FEF2F2';

const REQUESTS = [
  { id: '1', from: 'Block A – 204', to: 'Block C – 112', reason: 'Closer to campus center for accessibility.',         status: 'pending',  date: 'Feb 1, 2025' },
  { id: '2', from: 'Block B – 318', to: 'Block A – 205', reason: 'Roommate conflict. Requesting single occupancy.',    status: 'approved', date: 'Jan 28, 2025' },
  { id: '3', from: 'Block C – 101', to: 'Block B – 215', reason: 'Medical reasons — need ground floor room.',          status: 'pending',  date: 'Jan 25, 2025' },
  { id: '4', from: 'Block A – 108', to: 'Block D – 302', reason: 'Prefer AC room for health reasons.',                 status: 'rejected', date: 'Jan 20, 2025' },
  { id: '5', from: 'Block D – 401', to: 'Block A – 110', reason: 'Shifting to new academic block nearby.',             status: 'approved', date: 'Jan 15, 2025' },
];

const STATUS_CONFIG = {
  pending:  { label: 'Pending',  bg: AMBER_BG,  text: AMBER,  icon: '⏳' },
  approved: { label: 'Approved', bg: GREEN_BG,  text: GREEN,  icon: '✓'  },
  rejected: { label: 'Rejected', bg: RED_BG,    text: RED,    icon: '✗'  },
};

export default function HostelScreen() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <View style={{ height: Platform.OS === 'ios' ? 54 : 44 }} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Hostel Requests</Text>
        <Pressable style={styles.wardenBtn} onPress={() => router.push('/(main)/hostel/warden')}>
          <Text style={styles.wardenBtnText}>Warden</Text>
        </Pressable>
      </View>

      {/* Summary pills */}
      <View style={styles.summaryRow}>
        <SummaryPill label="Total" value={REQUESTS.length}           color={BLUE} />
        <SummaryPill label="Pending" value={REQUESTS.filter(r => r.status === 'pending').length}  color={AMBER} />
        <SummaryPill label="Approved" value={REQUESTS.filter(r => r.status === 'approved').length} color={GREEN} />
        <SummaryPill label="Rejected" value={REQUESTS.filter(r => r.status === 'rejected').length} color={RED} />
      </View>

      {/* Requests list */}
      <FlatList
        data={REQUESTS}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <RequestCard item={item} />}
        contentContainerStyle={styles.listContent}
      />

      {/* FAB */}
      <View style={styles.fabContainer}>
        <Pressable
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
          onPress={() => router.push('/(main)/hostel/request')}
        >
          <Text style={styles.fabIcon}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function SummaryPill({ label, value, color }) {
  return (
    <View style={styles.summaryPill}>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function RequestCard({ item }) {
  const cfg = STATUS_CONFIG[item.status];
  return (
    <View style={styles.card}>
      {/* Top row: room info + status */}
      <View style={styles.cardTop}>
        <View style={styles.roomFlow}>
          <View style={styles.roomBadge}>
            <Text style={styles.roomBadgeText}>{item.from}</Text>
          </View>
          <Text style={styles.arrowText}>→</Text>
          <View style={[styles.roomBadge, styles.roomBadgeTo]}>
            <Text style={[styles.roomBadgeText, styles.roomBadgeTextTo]}>{item.to}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
          <Text style={[styles.statusText, { color: cfg.text }]}>{cfg.icon} {cfg.label}</Text>
        </View>
      </View>

      {/* Reason */}
      <Text style={styles.cardReason}>{item.reason}</Text>

      {/* Date */}
      <Text style={styles.cardDate}>Submitted: {item.date}</Text>
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
  wardenBtn: { backgroundColor: BLUE_LIGHT, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  wardenBtnText: { fontSize: 13, color: BLUE, fontWeight: '600' },

  // Summary
  summaryRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginTop: 16, marginBottom: 4 },
  summaryPill: { flex: 1, backgroundColor: WHITE, borderRadius: 12, padding: 10, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  summaryValue: { fontSize: 20, fontWeight: '700' },
  summaryLabel: { fontSize: 10, color: GRAY_500, marginTop: 2, fontWeight: '500' },

  // List
  listContent: { paddingHorizontal: 20, paddingVertical: 12, paddingBottom: 80 },

  // Card
  card: { backgroundColor: WHITE, borderRadius: 15, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  roomFlow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  roomBadge: { backgroundColor: GRAY_100, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  roomBadgeTo: { backgroundColor: BLUE_LIGHT },
  roomBadgeText: { fontSize: 11, fontWeight: '600', color: GRAY_700 },
  roomBadgeTextTo: { color: BLUE },
  arrowText: { fontSize: 14, color: GRAY_500, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '600' },
  cardReason: { fontSize: 13, color: GRAY_500, lineHeight: 18, marginBottom: 8 },
  cardDate: { fontSize: 11, color: GRAY_500 },

  // FAB
  fabContainer: { position: 'absolute', bottom: 28, right: 24 },
  fab: { width: 56, height: 56, borderRadius: 18, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center', shadowColor: BLUE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
  fabPressed: { backgroundColor: '#1D4ED8', shadowOpacity: 0.2 },
  fabIcon: { fontSize: 28, color: WHITE, fontWeight: '700' },
});
