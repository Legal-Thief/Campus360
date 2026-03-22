import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { COLORS } from "../../utils/theme";
import Button from "../../components/Button";
import Input from "../../components/Input";
import Card from "../../components/Card";
import { useAuth } from "../../context/AuthContext";
import API from "../../utils/api";

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
  if (!email || !password) {
    Alert.alert("Error", "All fields are required");
    return;
  }

  try {
    const res = await API.post("/auth/login", {
      email,
      password,
    });

    const { token, user } = res.data;

    await login(token, user);

  } catch (error: any) {
    Alert.alert(
      "Error",
      error.response?.data?.message || "Login failed"
    );
  }
};

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <View style={styles.inner}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Campus360</Text>
          <Text style={styles.subtitle}>
            Smart campus management simplified.
          </Text>
        </View>

        {/* Card */}
        <Card>
          <Text style={styles.cardTitle}>Sign In</Text>

          <Input
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <View style={{ height: 10 }} />

          <Button title="Login" onPress={handleLogin} />
        </Card>

        {/* Register Link */}
        <TouchableOpacity
          style={styles.registerContainer}
          onPress={() => router.push("/(auth)/register")}
        >
          <Text style={styles.registerText}>
            Don’t have an account?{" "}
            <Text style={styles.registerLink}>Create one</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
  },

  inner: {
    flex: 1,
    justifyContent: "center",
  },

  header: {
    alignItems: "center",
    marginBottom: 32,
  },

  title: {
    fontSize: 36,
    fontFamily: "DMSans_800ExtraBold",
    color: COLORS.textPrimary,
  },

  subtitle: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    color: COLORS.textMuted,
    marginTop: 6,
    textAlign: "center",
  },

  cardTitle: {
    fontSize: 18,
    fontFamily: "DMSans_700Bold",
    color: COLORS.textPrimary,
    marginBottom: 20,
  },

  registerContainer: {
    marginTop: 24,
    alignItems: "center",
  },

  registerText: {
    fontFamily: "DMSans_400Regular",
    color: COLORS.textMuted,
  },

  registerLink: {
    color: COLORS.primary,
    fontFamily: "DMSans_600SemiBold",
  },
});