import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../utils/theme";

export default function CoreLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0D0D0D",
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 68,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textDim,
        tabBarLabelStyle: { fontSize: 10, fontFamily: "DMSans_600SemiBold" },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, string> = {
            "student-dashboard": "home-outline",
            events: "calendar-outline",
            hostel: "business-outline",
            chatbot: "map-outline",
            profile: "person-outline",
          };
          return <Ionicons name={(icons[route.name] || "ellipse-outline") as any} size={22} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="student-dashboard" options={{ title: "Home" }} />
      <Tabs.Screen name="events" options={{ title: "Events" }} />
      <Tabs.Screen name="hostel" options={{ title: "Hostel" }} />
      <Tabs.Screen name="chatbot" options={{ title: "Navigate" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      <Tabs.Screen name="lost-found" options={{ href: null }} />
      <Tabs.Screen name="result/[id]" options={{ href: null }} />
      <Tabs.Screen name="seat-booking/[id]" options={{ href: null }} />
    </Tabs>
  );
}