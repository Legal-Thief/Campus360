import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../../../context/AppContext';


const BLUE = '#2563EB';
const BLUE_LIGHT = '#EFF6FF';
const GRAY_100 = '#F1F5F9';
const GRAY_500 = '#64748B';
const GRAY_700 = '#334155';
const WHITE = '#FFFFFF';

/* ================= MENU DEFINITIONS ================= */

const STUDENT_MENU = [
  { title: 'Events', icon: '🎪', color: '#2563EB', bg: '#EFF6FF', route: '/(main)/events' },
  { title: 'Campus Chatbot', icon: '💬', color: '#0891B2', bg: '#F0FDFA', route: '/(main)/chatbot' },
  { title: 'Lost & Found', icon: '🔍', color: '#D97706', bg: '#FFFBEB', route: '/(main)/lostandfound' },
  { title: 'Hostel', icon: '🏠', color: '#059669', bg: '#F0FDF4', route: '/(main)/hostel' },
];

const ADMIN_MENU = [
  { title: 'Manage Events', icon: '🗂️', color: '#2563EB', bg: '#EFF6FF', route: '/(main)/events' },
];

const WARDEN_MENU = [
  { title: 'Hostel Requests', icon: '🏠', color: '#059669', bg: '#F0FDF4', route: '/(main)/hostel/warden' },
];

/* ================= COMPONENT ================= */

export default function DashboardScreen() {
  const router = useRouter();
  const { role } = useApp(); // student | admin | warden | superadmin

  const menu =
    role === 'admin'
      ? ADMIN_MENU
      : role === 'warden'
      ? WARDEN_MENU
      : STUDENT_MENU;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      <View style={{ height: Platform.OS === 'ios' ? 54 : 44 }} />

      {/* Header */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>C</Text>
          </View>
          <View>
            <Text style={styles.headerGreeting}>Welcome,</Text>
            <Text style={styles.headerName}>
              {role === 'student' && 'Student'}
              {role === 'admin' && 'Department Admin'}
              {role === 'warden' && 'Hostel Warden'}
            </Text>
          </View>
        </View>
      </View>

      {/* Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerContent}>
          <Text style={styles.bannerTitle}>Campus360</Text>
          <Text style={styles.bannerSub}>
            Smart, disciplined campus management
          </Text>
        </View>
        <Text style={styles.bannerEmoji}>🎓</Text>
      </View>

      {/* Section */}
      <Text style={styles.sectionTitle}>Quick Access</Text>

      {/* Menu Grid */}
      <View style={styles.grid}>
        {menu.map((card) => (
          <Pressable
            key={card.title}
            style={({ pressed }) => [styles.menuCard, pressed && styles.menuCardPressed]}
            onPress={() => router.push(card.route)}
          >
            <View style={[styles.menuIconBg, { backgroundColor: card.bg }]}>
              <Text style={styles.menuIcon}>{card.icon}</Text>
            </View>
            <Text style={styles.menuTitle}>{card.title}</Text>
            <Text style={[styles.menuArrow, { color: card.color }]}>→</Text>
          </Pressable>
        ))}
      </View>

      {/* Upcoming Event (Student Only) */}
      {role === 'student' && (
        <>
          <Text style={styles.sectionTitle}>Upcoming Event</Text>
          <View style={styles.upcomingCard}>
            <View style={styles.upcomingDateBox}>
              <Text style={styles.upcomingDay}>15</Text>
              <Text style={styles.upcomingMonth}>FEB</Text>
            </View>
            <View style={styles.upcomingInfo}>
              <Text style={styles.upcomingTitle}>Tech Symposium 2025</Text>
              <Text style={styles.upcomingDetail}>
                Main Auditorium • 2:00 PM
              </Text>
            </View>
            <Pressable
              style={styles.upcomingBtn}
              onPress={() => router.push('/(main)/events')}
            >
              <Text style={styles.upcomingBtnText}>View</Text>
            </Pressable>
          </View>
        </>
      )}
    </ScrollView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarLetter: { fontSize: 18, color: WHITE, fontWeight: '700' },
  headerGreeting: { fontSize: 12, color: GRAY_500 },
  headerName: { fontSize: 16, fontWeight: '700', color: GRAY_700 },

  banner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: BLUE,
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
  },
  bannerContent: { flex: 1 },
  bannerTitle: { fontSize: 18, fontWeight: '700', color: WHITE },
  bannerSub: { fontSize: 13, color: '#BFDBFE', marginTop: 3 },
  bannerEmoji: { fontSize: 36 },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: GRAY_700,
    marginBottom: 12,
  },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  menuCard: {
    width: '47%',
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 16,
    elevation: 3,
  },
  menuCardPressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },
  menuIconBg: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  menuIcon: { fontSize: 20 },
  menuTitle: { fontSize: 14, fontWeight: '600', color: GRAY_700 },
  menuArrow: { fontSize: 16, fontWeight: '700', marginTop: 6 },

  upcomingCard: {
    flexDirection: 'row',
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 14,
    marginTop: 6,
    elevation: 3,
  },
  upcomingDateBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: BLUE_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  upcomingDay: { fontSize: 18, fontWeight: '700', color: BLUE },
  upcomingMonth: { fontSize: 9, fontWeight: '600', color: BLUE },
  upcomingInfo: { flex: 1 },
  upcomingTitle: { fontSize: 14, fontWeight: '600', color: GRAY_700 },
  upcomingDetail: { fontSize: 12, color: GRAY_500 },
  upcomingBtn: {
    backgroundColor: BLUE,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  upcomingBtnText: { fontSize: 12, color: WHITE, fontWeight: '600' },
});
