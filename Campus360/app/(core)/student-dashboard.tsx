import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { COLORS, RADIUS } from "../../utils/theme";
import { useAuth } from "../../context/AuthContext";
import Card from "../../components/Card";

export default function Dashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const modules = [
    {
      title: "Event Registration",
      subtitle: "Register & manage event seats",
      route: "/(core)/events",
      roles: ["student", "admin"],
    },
    {
      title: "Hostel Management",
      subtitle: "Request & manage hostel rooms",
      route: "/(hostel)",
      roles: ["student"],
    },
    {
      title: "Lost & Found",
      subtitle: "Report or recover items",
      route: "/(lostfound)",
      roles: ["student"],
    },
  ];

  const filteredModules = modules.filter((m) =>
    m.roles.includes(user?.role || "")
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.welcome}>Welcome back,</Text>
        <Text style={styles.name}>{user?.name}</Text>

        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>
            {user?.role?.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Grid */}
      <FlatList
        data={filteredModules}
        keyExtractor={(item) => item.title}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.cardWrapper}
            onPress={() => router.push(item.route as any)}
          >
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>
                {item.subtitle}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Logout */}
      <TouchableOpacity style={styles.logout} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 20,
    paddingTop: 70,
  },

  header: {
    marginBottom: 30,
  },

  welcome: {
    color: COLORS.textMuted,
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
  },

  name: {
    color: COLORS.textPrimary,
    fontFamily: "DMSans_800ExtraBold",
    fontSize: 28,
    marginTop: 4,
  },

  roleBadge: {
    marginTop: 12,
    alignSelf: "flex-start",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.chip,
  },

  roleText: {
    color: "#fff",
    fontFamily: "DMSans_600SemiBold",
    fontSize: 12,
  },

  cardWrapper: {
    width: "48%",
    marginBottom: 18,
  },

  card: {
    backgroundColor: "#111827",
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    minHeight: 120,
    justifyContent: "center",
  },

  cardTitle: {
    color: COLORS.textPrimary,
    fontFamily: "DMSans_700Bold",
    fontSize: 16,
  },

  cardSubtitle: {
    color: COLORS.textMuted,
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    marginTop: 6,
  },

  logout: {
    marginTop: 10,
    alignItems: "center",
  },

  logoutText: {
    color: COLORS.danger,
    fontFamily: "DMSans_600SemiBold",
  },
});