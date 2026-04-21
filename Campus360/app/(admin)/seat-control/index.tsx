import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import API from "../../../utils/api";
import { COLORS, RADIUS } from "../../../utils/theme";
import { Ionicons } from "@expo/vector-icons";

export default function SeatControlIndex() {
  const router = useRouter();
  const [auditoriums, setAuditoriums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditoriums();
  }, []);

  const fetchAuditoriums = async () => {
    try {
      const res = await API.get("/auditoriums");
      setAuditoriums(res.data.auditoriums || []);
    } catch {
      Alert.alert("Error", "Failed to load auditoriums");
    } finally {
      setLoading(false);
    }
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
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Seat Control</Text>
          <Text style={styles.subtitle}>
            {auditoriums.length} auditorium{auditoriums.length !== 1 ? "s" : ""}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() =>
            router.push({
              pathname: "/(admin)/seat-control/[id]",
              params: { id: "new" },
            })
          }
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.createBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={auditoriums}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: "/(admin)/seat-control/[id]",
                params: { id: item._id },
              })
            }
          >
            <View style={styles.cardTop}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.rows.length} Rows</Text>
              </View>
            </View>
            <Text style={styles.info}>Seats per row: {item.seatsPerRow}</Text>
            <Text style={styles.info}>
              Total: {item.rows.length * item.seatsPerRow} seats
            </Text>
            <Text style={styles.info}>
              Blocked: {item.blockedSeats?.length || 0} seats
            </Text>
            <View style={styles.rowChips}>
              {item.rows.slice(0, 8).map((r: string) => (
                <View key={r} style={styles.rowChip}>
                  <Text style={styles.rowChipText}>{r}</Text>
                </View>
              ))}
              {item.rows.length > 8 && (
                <Text style={styles.moreText}>+{item.rows.length - 8} more</Text>
              )}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="business-outline" size={48} color={COLORS.border} />
            <Text style={styles.emptyTitle}>No auditoriums yet</Text>
            <Text style={styles.emptyText}>
              Tap "New" to create your first auditorium layout
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
    paddingTop: 60,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontFamily: "DMSans_800ExtraBold",
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    marginTop: 4,
  },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 4,
  },
  createBtnText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "DMSans_700Bold",
  },
  card: {
    backgroundColor: "#111827",
    borderRadius: RADIUS.card,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontFamily: "DMSans_700Bold",
  },
  badge: {
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "DMSans_600SemiBold",
  },
  info: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    marginTop: 3,
  },
  rowChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 12,
  },
  rowChip: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  rowChipText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontFamily: "DMSans_700Bold",
  },
  moreText: {
    color: COLORS.textMuted,
    fontSize: 11,
    alignSelf: "center",
  },
  empty: {
    alignItems: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontFamily: "DMSans_700Bold",
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    textAlign: "center",
  },
});
