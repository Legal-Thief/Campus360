import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { COLORS } from "../../utils/theme";
import Button from "../../components/Button";
import Input from "../../components/Input";
import Card from "../../components/Card";
import API from "../../utils/api";

export default function Register() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Allow only numbers & max 10 digits
  const handleStudentIdChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, "");
    if (numericValue.length <= 10) {
      setStudentId(numericValue);
    }
  };

  const handleRegister = async () => {
  if (!name || !studentId || !email || !password || !confirmPassword) {
    Alert.alert("Error", "All fields are required");
    return;
  }

  if (studentId.length !== 10) {
    Alert.alert("Error", "Student ID must be exactly 10 digits");
    return;
  }

  if (password !== confirmPassword) {
    Alert.alert("Error", "Passwords do not match");
    return;
  }

  try {
    const res = await API.post("/auth/register", {
      name,
      studentId,
      email,
      password,
    });

    Alert.alert("Success", "Account created successfully!");
    router.replace("/(auth)/login");

  } catch (error: any) {
    Alert.alert(
      "Error",
      error.response?.data?.message || "Registration failed"
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
            Create your student account
          </Text>
        </View>

        {/* Card */}
        <Card>
          <Text style={styles.cardTitle}>Register</Text>

          <Input
            label="Full Name"
            placeholder="Enter your full name"
            value={name}
            onChangeText={setName}
          />

          <Input
            label="Student ID"
            placeholder="Enter 10-digit student ID"
            value={studentId}
            onChangeText={handleStudentIdChange}
          />

          <Input
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
          />

          <Input
            label="Password"
            placeholder="Create a password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Input
            label="Confirm Password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <View style={{ height: 10 }} />

          <Button title="Create Account" onPress={handleRegister} />
        </Card>

        {/* Back to Login */}
        <TouchableOpacity
          style={styles.registerContainer}
          onPress={() => router.replace("/(auth)/login")}
        >
          <Text style={styles.registerText}>
            Already have an account?{" "}
            <Text style={styles.registerLink}>Sign in</Text>
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