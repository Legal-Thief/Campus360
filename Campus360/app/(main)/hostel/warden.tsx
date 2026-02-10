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
const GREEN = '#16A34A';
const GREEN_BG = '#DCFCE7';
const GREEN_LIGHT = '#BBFCE7';
const AMBER = '#D97706';
const AMBER_BG = '#FEF3C7';
const RED = '#DC2626';
const RED_BG = '#FEF2F2';
const RED_LIGHT = '#FECACA';

const WARDEN_REQUESTS = [
  { id: '1', student: 'John Doe',      enrollment: '2024CS100123', from: 'Block A – 204', to: 'Block C – 112', reason: 'Closer to campus center for accessibility.',        status: 'pending',  date: 'Feb 1, 2025' },
  { id: '2', student: 'Priya Shah',    enrollment: '2024EC200456', from: 'Block B – 318', to: 'Block A – 205', reason: 'Roommate conflict. Requesting single occupancy.',   status: 'pending',  date: 'Jan 28, 2025' },
  { id: '3', student: 'Rahul Kumar',   enrollment: '2024ME300789', from: 'Block C – 101', to: 'Block B – 215', reason: 'Medical reasons — need ground floor room.',         status: 'approved', date: 'Jan 25, 2025' },
  { id: '4', student: 'Anika Mehta',   enrollment: '2024BT400012', from: 'Block A – 108', to: 'Block D – 302', reason: 'Prefer AC room for health reasons.',                status: 'rejected', date: 'Jan 20, 2025' },
  { id: '5', student: 'Vikram Patel',  enrollment: '2024CS500345', from: 'Block D – 401', to: 'Block A – 110', reason: 'Shifting to new academic block nearby.',            status: 'approved', date: 'Jan 15, 2025' },
];

const STATUS_CONFIG = {
  pending:  { label: 'Pending',  bg: AMBER_BG,  text: AMBER,  icon: '⏳' },
  approved: { label: 'Approved', bg: GREEN_BG,  text: GREEN,  icon: '✓'  },
  rejected: { label: 'Rejected', bg: RED_BG,    text: RED,    icon: '✗'  },
};

export default function WardenScreen() {
  const router = useRouter();
  const [requests, setRequests] = useState(WARDEN_REQUESTS);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const handleAction = (id: string, action: 'approved' | 'rejected') => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: action } : r));
  };

  const filtered = filterStatus === 'all' ? requests : requests.filter(r => r.status === filterStatus);
  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <View style={styles.screen}>
      <View style={{ height: Platform.OS === 'ios' ? 54 : 44 }} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Warden Panel</Text>
          {pendingCount > 0 && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>{pendingCount} pending</Text>
            </View>
          )}
        </View>
        <View style={{ width: 38 }} />
      </View>

      {/* Filter tabs */}
      <View style={styles.tabBar}>
        {(['all', 'pending', 'approved', 'rejected'] as const).map(s => (
          <Pressable
            key={s}
            style={[styles.tab, filterStatus === s && styles.tabActive]}
            onPress={() => setFilterStatus(s)}
          >
            <Text style={[styles.tabText, filterStatus === s && styles.tabTextActive]}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
              {s !== 'all' && ` (${requests.filter(r => r.status === s).length})`}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Request cards */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <WardenCard item={item} onApprove={() => handleAction(item.id, 'approved')} onReject={() => handleAction(item.id, 'rejected')} />
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

function WardenCard({ item, onApprove, onReject }) {
  const cfg = STATUS_CONFIG[item.status];
  const isPending = item.status === 'pending';

  return (
    <View style={styles.card}>
      {/* Student info row */}
      <View style={styles.studentRow}>
        <View style={styles.studentAvatar}>
          <Text style={styles.studentAvatarText}>{item.student.charAt(0)}</Text>
        </View>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{item.student}</Text>
          <Text style={styles.studentEnrollment}>{item.enrollment}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
          <Text style={[styles.statusText, { color: cfg.text }]}>{cfg.icon} {cfg.label}</Text>
        </View>
      </View>

      {/* Room flow */}
      <View style={styles.roomFlowRow}>
        <View style={styles.roomPill}>
          <Text style={styles.roomPillLabel}>From</Text>
          <Text style={styles.roomPillValue}>{item.from}</Text>
        </View>
        <View style={styles.arrowCircle}>
          <Text style={styles.arrowText}>→</Text>
        </View>
        <View style={[styles.roomPill, styles.roomPillTo]}>
          <Text style={[styles.roomPillLabel, { color: BLUE }]}>To</Text>
          <Text style={[styles.roomPillValue, { color: BLUE }]}>{item.to}</Text>
        </View>
      </View>

      {/* Reason */}
      <View style={styles.reasonBox}>
        <Text style={styles.reasonLabel}>Reason</Text>
        <Text style={styles.reasonText}>{item.reason}</Text>
      </View>

      {/* Date */}
      <Text style={styles.dateText}>Submitted: {item.date}</Text>

      {/* Action buttons (only for pending) */}
      {isPending && (
        <View style={styles.actionsRow}>
          <Pressable style={styles.rejectBtn} onPress={onReject}>
            <Text style={styles.rejectBtnText}>✗ Reject</Text>
          </Pressable>
          <Pressable style={styles.approveBtn} onPress={onApprove}>
            <Text style={styles.approveBtnText}>✓ Approve</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 12 },
  backBtn: { width: 38, height: 38, borderRadius: 11, backgroundColor: WHITE, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  backIcon: { fontSize: 20, color: GRAY_700 },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: GRAY_700 },
  pendingBadge: { backgroundColor: AMBER_BG, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 3 },
  pendingBadgeText: { fontSize: 10, color: AMBER, fontWeight: '600' },

  // Tabs
  tabBar: { flexDirection: 'row', paddingHorizontal: 20, gap: 6, marginTop: 14, marginBottom: 6 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 9, backgroundColor: WHITE, borderWidth: 1, borderColor: GRAY_200 },
  tabActive: { backgroundColor: BLUE, borderColor: BLUE },
  tabText: { fontSize: 12, color: GRAY_500, fontWeight: '500' },
  tabTextActive: { color: WHITE, fontWeight: '600' },

  // List
  listContent: { paddingHorizontal: 20, paddingVertical: 10, paddingBottom: 30 },

  // Card
  card: { backgroundColor: WHITE, borderRadius: 16, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },

  // Student
  studentRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  studentAvatar: { width: 38, height: 38, borderRadius: 12, backgroundColor: BLUE_LIGHT, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  studentAvatarText: { fontSize: 17, fontWeight: '700', color: BLUE },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 15, fontWeight: '600', color: GRAY_700 },
  studentEnrollment: { fontSize: 11, color: GRAY_500, marginTop: 1 },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '600' },

  // Room flow
  roomFlowRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  roomPill: { flex: 1, backgroundColor: GRAY_100, borderRadius: 10, padding: 10, alignItems: 'center' },
  roomPillTo: { backgroundColor: BLUE_LIGHT },
  roomPillLabel: { fontSize: 10, color: GRAY_500, fontWeight: '500', marginBottom: 2 },
  roomPillValue: { fontSize: 13, fontWeight: '600', color: GRAY_700 },
  arrowCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: GRAY_200, alignItems: 'center', justifyContent: 'center', marginHorizontal: 6 },
  arrowText: { fontSize: 14, color: GRAY_500, fontWeight: '600' },

  // Reason
  reasonBox: { backgroundColor: GRAY_100, borderRadius: 10, padding: 10, marginBottom: 8 },
  reasonLabel: { fontSize: 10, color: GRAY_500, fontWeight: '600', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.4 },
  reasonText: { fontSize: 13, color: GRAY_700, lineHeight: 18 },

  dateText: { fontSize: 11, color: GRAY_500, marginBottom: 12 },

  // Actions
  actionsRow: { flexDirection: 'row', gap: 10 },
  rejectBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10, backgroundColor: RED_BG, borderWidth: 1, borderColor: RED_LIGHT },
  rejectBtnText: { fontSize: 14, fontWeight: '600', color: RED },
  approveBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10, backgroundColor: GREEN, shadowColor: GREEN, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3 },
  approveBtnText: { fontSize: 14, fontWeight: '600', color: WHITE },
});
