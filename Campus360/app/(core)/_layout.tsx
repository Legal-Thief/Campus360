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
          fontSize: 11,
        },
        tabBarIcon: ({ color }) => {
          const iconMap: Record<string, string> = {
            "student-dashboard": "home-outline",
            "events": "calendar-outline",
            "hostel": "business-outline",
            "chatbot": "map-outline",
            "profile": "person-outline",
          };
          const iconName = (iconMap[route.name] || "ellipse-outline") as any;
          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="student-dashboard" options={{ title: "Home" }} />
      <Tabs.Screen name="events" options={{ title: "Events" }} />
      <Tabs.Screen name="hostel" options={{ title: "Hostel" }} />
      <Tabs.Screen name="chatbot" options={{ title: "Navigate" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />

      {/* Hidden screens — they exist in the route group but not shown as tabs */}
      <Tabs.Screen name="lost-found" options={{ href: null }} />
      <Tabs.Screen name="result/[id]" options={{ href: null }} />
      <Tabs.Screen name="seat-booking/[id]" options={{ href: null }} />
    </Tabs>
  );
}
