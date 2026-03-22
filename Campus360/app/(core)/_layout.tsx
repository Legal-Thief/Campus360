import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../utils/theme";

export default function CoreLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#111827",
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 70,
          paddingBottom: 10,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textDim,
        tabBarLabelStyle: {
          fontSize: 12,
        },
        tabBarIcon: ({ color }) => {
          let iconName: any;

          if (route.name === "student-dashboard") {
            iconName = "home-outline";
          } else if (route.name === "events") {
            iconName = "calendar-outline";
          } else if (route.name === "hostel") {
            iconName = "business-outline";
          } else if (route.name === "profile") {
            iconName = "person-outline";
          }

          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tabs.Screen
        name="student-dashboard"
        options={{ title: "Home" }}
      />

      <Tabs.Screen
        name="events"
        options={{ title: "Events" }}
      />

      <Tabs.Screen
        name="hostel"
        options={{ title: "Hostel" }}
      />

      <Tabs.Screen
        name="profile"
        options={{ title: "Profile" }}
      />
    </Tabs>
  );
}