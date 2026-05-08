import { Stack, useRouter } from "expo-router";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { useEffect } from "react";
import { AlertProvider } from "../components/CustomAlert";
import { ToastProvider } from "../components/Toast";
import { SafeAreaProvider } from "react-native-safe-area-context";

function RootNavigator() {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!token) { router.replace("/(auth)/login"); return; }
    const role = user?.role;
    if (role === "warden") {
      router.replace("/(warden)/dashboard");
    } else if (role === "lostfound_admin") {
      router.replace("/(lostfound)/dashboard");
    } else if (role === "admin" || role === "superadmin") {
      router.replace("/(admin)/dashboard");
    } else {
      router.replace("/(core)/student-dashboard");
    }
  }, [loading, token, user?.role]);

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function Layout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AlertProvider>
          <ToastProvider>
            <RootNavigator />
          </ToastProvider>
        </AlertProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}