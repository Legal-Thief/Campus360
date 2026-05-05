// import React, { useEffect, useState, useCallback } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   FlatList,
//   TouchableOpacity,
//   ActivityIndicator,
//   RefreshControl,
//   Alert,
// } from "react-native";
// import { useRouter } from "expo-router";
// import API from "../../utils/api";
// import { COLORS, RADIUS } from "../../utils/theme";
// import { Ionicons } from "@expo/vector-icons";
// import { useAuth } from "../../context/AuthContext";

// const STATUS_INFO: Record<string, { label: string; color: string; icon: string }> = {
//   registration_open: { label: "Registration Open", color: "#10b981", icon: "checkmark-circle-outline" },
//   quiz_closed: { label: "Quiz Closed", color: "#f59e0b", icon: "time-outline" },
//   priority_calculated: { label: "Priority Set", color: "#6366f1", icon: "trophy-outline" },
//   seat_selection: { label: "Seat Selection Open", color: "#3b82f6", icon: "grid-outline" },
//   completed: { label: "Event Completed", color: "#64748b", icon: "checkmark-done-outline" },
// };

// export default function Events() {
//   const router = useRouter();
//   const { user } = useAuth();
//   const [events, setEvents] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   // Track which events this user has already attempted the quiz for
//   const [myAttempts, setMyAttempts] = useState<Record<string, any>>({});

//   useEffect(() => {
//     fetchEvents();
//   }, []);

//   const fetchEvents = async () => {
//     try {
//       const res = await API.get("/events");
//       setEvents(res.data.events || []);
//     } catch {
//       Alert.alert("Error", "Failed to load events");
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   };

//   const onRefresh = () => {
//     setRefreshing(true);
//     fetchEvents();
//   };

//   const handleEventAction = (event: any) => {
//     const status = event.status;

//     if (status === "registration_open") {
//       // Go to quiz
//       router.push(`/quiz/${event._id}`);
//       return;
//     }

//     if (
//       status === "priority_calculated" ||
//       status === "seat_selection" ||
//       status === "completed"
//     ) {
//       // Go to result / ticket
//       router.push(`/(core)/result/${event._id}`);
//       return;
//     }

//     Alert.alert(
//       STATUS_INFO[status]?.label || "Event",
//       "This event is not currently accepting actions."
//     );
//   };

//   const getActionLabel = (status: string) => {
//     switch (status) {
//       case "registration_open":
//         return "Take Quiz";
//       case "quiz_closed":
//         return "Awaiting Results";
//       case "priority_calculated":
//         return "View Result & Book";
//       case "seat_selection":
//         return "Book Your Seat";
//       case "completed":
//         return "View Ticket";
//       default:
//         return "View";
//     }
//   };

//   const getActionDisabled = (status: string) =>
//     status === "quiz_closed";

//   if (loading) {
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" color={COLORS.primary} />
//       </View>
//     );
//   }

//   return (
//     <FlatList
//       style={styles.container}
//       data={events}
//       keyExtractor={(item) => item._id}
//       refreshControl={
//         <RefreshControl
//           refreshing={refreshing}
//           onRefresh={onRefresh}
//           tintColor={COLORS.primary}
//         />
//       }
//       ListHeaderComponent={
//         <View style={styles.header}>
//           <Text style={styles.headerTitle}>Events</Text>
//           <Text style={styles.headerSub}>
//             {events.length} upcoming event{events.length !== 1 ? "s" : ""}
//           </Text>
//         </View>
//       }
//       renderItem={({ item }) => {
//         const info = STATUS_INFO[item.status] || STATUS_INFO.registration_open;
//         const disabled = getActionDisabled(item.status);

//         return (
//           <View style={styles.card}>
//             {/* Status badge */}
//             <View
//               style={[
//                 styles.statusBadge,
//                 { backgroundColor: info.color + "18" },
//               ]}
//             >
//               <Ionicons name={info.icon as any} size={12} color={info.color} />
//               <Text style={[styles.statusText, { color: info.color }]}>
//                 {info.label}
//               </Text>
//             </View>

//             {/* Title & venue */}
//             <Text style={styles.eventTitle}>{item.title}</Text>
//             {item.description ? (
//               <Text style={styles.eventDesc} numberOfLines={2}>
//                 {item.description}
//               </Text>
//             ) : null}

//             {/* Meta row */}
//             <View style={styles.metaRow}>
//               <View style={styles.metaItem}>
//                 <Ionicons
//                   name="business-outline"
//                   size={13}
//                   color={COLORS.textMuted}
//                 />
//                 <Text style={styles.metaText}>{item.venue}</Text>
//               </View>
//               <View style={styles.metaItem}>
//                 <Ionicons
//                   name="calendar-outline"
//                   size={13}
//                   color={COLORS.textMuted}
//                 />
//                 <Text style={styles.metaText}>
//                   {new Date(item.date).toDateString()}
//                 </Text>
//               </View>
//             </View>

//             {/* Quiz info */}
//             <View style={styles.quizInfo}>
//               <View style={styles.quizInfoItem}>
//                 <Ionicons
//                   name="help-circle-outline"
//                   size={13}
//                   color={COLORS.textMuted}
//                 />
//                 <Text style={styles.metaText}>
//                   {item.quiz?.questions?.length || 0} questions
//                 </Text>
//               </View>
//               <View style={styles.quizInfoItem}>
//                 <Ionicons
//                   name="timer-outline"
//                   size={13}
//                   color={COLORS.textMuted}
//                 />
//                 <Text style={styles.metaText}>
//                   {item.quiz?.duration || "?"} min
//                 </Text>
//               </View>
//               {item.auditoriumId?.name && (
//                 <View style={styles.quizInfoItem}>
//                   <Ionicons
//                     name="grid-outline"
//                     size={13}
//                     color={COLORS.textMuted}
//                   />
//                   <Text style={styles.metaText}>{item.auditoriumId.name}</Text>
//                 </View>
//               )}
//             </View>

//             {/* Action button */}
//             <TouchableOpacity
//               style={[styles.actionBtn, disabled && styles.actionBtnDisabled]}
//               onPress={() => handleEventAction(item)}
//               disabled={disabled}
//               activeOpacity={0.8}
//             >
//               <Text
//                 style={[
//                   styles.actionBtnText,
//                   disabled && styles.actionBtnTextDisabled,
//                 ]}
//               >
//                 {getActionLabel(item.status)}
//               </Text>
//               {!disabled && (
//                 <Ionicons name="arrow-forward" size={14} color="#fff" />
//               )}
//             </TouchableOpacity>
//           </View>
//         );
//       }}
//       ListEmptyComponent={
//         <View style={styles.empty}>
//           <Ionicons name="calendar-outline" size={52} color={COLORS.border} />
//           <Text style={styles.emptyTitle}>No events yet</Text>
//           <Text style={styles.emptyText}>
//             Check back when an admin publishes an event
//           </Text>
//         </View>
//       }
//       contentContainerStyle={{ paddingBottom: 30 }}
//     />
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: COLORS.background,
//     paddingHorizontal: 16,
//   },
//   center: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: COLORS.background,
//   },
//   header: {
//     paddingTop: 60,
//     paddingBottom: 16,
//   },
//   headerTitle: {
//     color: COLORS.textPrimary,
//     fontSize: 28,
//     fontFamily: "DMSans_800ExtraBold",
//   },
//   headerSub: {
//     color: COLORS.textMuted,
//     fontSize: 13,
//     fontFamily: "DMSans_400Regular",
//     marginTop: 4,
//   },
//   card: {
//     backgroundColor: "#111827",
//     borderRadius: RADIUS.card,
//     padding: 18,
//     marginBottom: 14,
//     borderWidth: 1,
//     borderColor: COLORS.border,
//   },
//   statusBadge: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 5,
//     alignSelf: "flex-start",
//     paddingHorizontal: 10,
//     paddingVertical: 4,
//     borderRadius: 999,
//     marginBottom: 10,
//   },
//   statusText: {
//     fontSize: 11,
//     fontFamily: "DMSans_600SemiBold",
//   },
//   eventTitle: {
//     color: COLORS.textPrimary,
//     fontSize: 18,
//     fontFamily: "DMSans_700Bold",
//     marginBottom: 4,
//   },
//   eventDesc: {
//     color: COLORS.textMuted,
//     fontSize: 13,
//     fontFamily: "DMSans_400Regular",
//     lineHeight: 20,
//     marginBottom: 6,
//   },
//   metaRow: {
//     flexDirection: "row",
//     gap: 16,
//     marginTop: 8,
//     flexWrap: "wrap",
//   },
//   metaItem: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 5,
//   },
//   metaText: {
//     color: COLORS.textMuted,
//     fontSize: 12,
//     fontFamily: "DMSans_400Regular",
//   },
//   quizInfo: {
//     flexDirection: "row",
//     gap: 16,
//     marginTop: 6,
//     marginBottom: 14,
//     flexWrap: "wrap",
//   },
//   quizInfoItem: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 5,
//   },
//   actionBtn: {
//     backgroundColor: COLORS.primary,
//     borderRadius: 12,
//     paddingVertical: 13,
//     paddingHorizontal: 18,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     gap: 8,
//   },
//   actionBtnDisabled: {
//     backgroundColor: "#1e293b",
//     borderWidth: 1,
//     borderColor: COLORS.border,
//   },
//   actionBtnText: {
//     color: "#fff",
//     fontSize: 14,
//     fontFamily: "DMSans_700Bold",
//   },
//   actionBtnTextDisabled: {
//     color: COLORS.textMuted,
//   },
//   empty: {
//     alignItems: "center",
//     paddingTop: 80,
//     gap: 12,
//   },
//   emptyTitle: {
//     color: COLORS.textPrimary,
//     fontSize: 18,
//     fontFamily: "DMSans_700Bold",
//   },
//   emptyText: {
//     color: COLORS.textMuted,
//     fontSize: 14,
//     fontFamily: "DMSans_400Regular",
//     textAlign: "center",
//   },
// });


import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import API from "../../utils/api";
import { COLORS, FONT, RADIUS } from "../../utils/theme";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  registration_open:    { label: "Registration Open", color: COLORS.success,  bg: COLORS.successBg,  icon: "checkmark-circle-outline" },
  quiz_closed:          { label: "Quiz Closed",        color: COLORS.warning,  bg: COLORS.warningBg,  icon: "time-outline" },
  priority_calculated:  { label: "Priority Set",       color: COLORS.primary,  bg: COLORS.primaryGlow, icon: "trophy-outline" },
  seat_selection:       { label: "Seat Selection",     color: COLORS.info,     bg: COLORS.infoBg,     icon: "grid-outline" },
  completed:            { label: "Completed",           color: COLORS.textMuted, bg: COLORS.white10,   icon: "checkmark-done-outline" },
};

const ACTION_LABEL: Record<string, string> = {
  registration_open:   "Take Quiz →",
  quiz_closed:         "Results Pending",
  priority_calculated: "View Result & Book →",
  seat_selection:      "Book Your Seat →",
  completed:           "View Ticket →",
};

export default function Events() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await API.get("/events");
      setEvents(res.data.events || []);
    } catch {
      Alert.alert("Error", "Failed to load events");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, []);

  const handleAction = (event: any) => {
    const s = event.status;
    if (s === "registration_open") { router.push(`/quiz/${event._id}`); return; }
    if (["priority_calculated", "seat_selection", "completed"].includes(s)) {
      router.push(`/(core)/result/${event._id}`); return;
    }
    Alert.alert("Not Available", "This event is not currently accepting actions.");
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <View style={styles.topAccent} />

      <FlatList
        data={events}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchEvents(); }} tintColor={COLORS.primary} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Events</Text>
            <Text style={styles.subtitle}>{events.length} available</Text>
          </View>
        }
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}
        renderItem={({ item }) => {
          const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.registration_open;
          const disabled = item.status === "quiz_closed";
          return (
            <View style={styles.card}>
              {/* status strip */}
              <View style={[styles.statusStrip, { backgroundColor: cfg.color }]} />

              <View style={styles.cardInner}>
                {/* Status badge */}
                <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                  <Ionicons name={cfg.icon as any} size={11} color={cfg.color} />
                  <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>

                <Text style={styles.eventTitle}>{item.title}</Text>
                {item.description ? (
                  <Text style={styles.eventDesc} numberOfLines={2}>{item.description}</Text>
                ) : null}

                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Ionicons name="calendar-outline" size={12} color={COLORS.textMuted} />
                    <Text style={styles.metaText}>{new Date(item.date).toDateString()}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="help-circle-outline" size={12} color={COLORS.textMuted} />
                    <Text style={styles.metaText}>{item.quiz?.questions?.length || 0} questions</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="timer-outline" size={12} color={COLORS.textMuted} />
                    <Text style={styles.metaText}>{item.quiz?.duration || "?"} min</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.actionBtn, disabled && styles.actionBtnDisabled]}
                  onPress={() => handleAction(item)}
                  disabled={disabled}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.actionBtnText, disabled && styles.actionBtnTextDisabled]}>
                    {ACTION_LABEL[item.status] || "View"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="calendar-outline" size={36} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>No Events Yet</Text>
            <Text style={styles.emptyText}>Check back when an admin publishes one</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background },
  topAccent: { height: 3, backgroundColor: COLORS.primary, marginBottom: 0 },
  header: { paddingTop: 24, paddingBottom: 20 },
  title: { color: COLORS.textPrimary, fontSize: 32, fontFamily: FONT.extraBold },
  subtitle: { color: COLORS.textMuted, fontSize: 13, fontFamily: FONT.regular, marginTop: 4 },
  card: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
    overflow: "hidden",
  },
  statusStrip: { width: 4 },
  cardInner: { flex: 1, padding: 16 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.chip,
    marginBottom: 10,
  },
  statusText: { fontSize: 11, fontFamily: FONT.semiBold },
  eventTitle: { color: COLORS.textPrimary, fontSize: 17, fontFamily: FONT.bold, marginBottom: 5 },
  eventDesc: { color: COLORS.textMuted, fontSize: 13, fontFamily: FONT.regular, lineHeight: 19, marginBottom: 12 },
  metaRow: { flexDirection: "row", gap: 14, marginBottom: 14, flexWrap: "wrap" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { color: COLORS.textMuted, fontSize: 11, fontFamily: FONT.regular },
  actionBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.sm,
    paddingVertical: 11,
    alignItems: "center",
  },
  actionBtnDisabled: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  actionBtnText: { color: "#fff", fontSize: 13, fontFamily: FONT.bold },
  actionBtnTextDisabled: { color: COLORS.textMuted },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: COLORS.primaryGlow,
    borderWidth: 1, borderColor: COLORS.primaryBorder,
    justifyContent: "center", alignItems: "center",
  },
  emptyTitle: { color: COLORS.textPrimary, fontSize: 18, fontFamily: FONT.bold },
  emptyText: { color: COLORS.textMuted, fontSize: 13, fontFamily: FONT.regular },
});