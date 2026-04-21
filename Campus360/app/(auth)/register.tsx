import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { COLORS, RADIUS } from "../../utils/theme";
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
  const [residentType, setResidentType] = useState<"day_scholar" | "hosteller">("day_scholar");
  const [hostelBlock, setHostelBlock] = useState("");
  const [roomNumber, setRoomNumber] = useState("");

  const handleStudentIdChange = (text: string) => {
    const numeric = text.replace(/[^0-9]/g, "");
    if (numeric.length <= 10) setStudentId(numeric);
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
    if (residentType === "hosteller" && (!hostelBlock.trim() || !roomNumber.trim())) {
      Alert.alert("Error", "Hostellers must enter their hostel block and room number");
      return;
    }

    try {
      await API.post("/auth/register", {
        name,
        studentId,
        email,
        password,
        residentType,
        hostelBlock: residentType === "hosteller" ? hostelBlock.trim() : undefined,
        roomNumber: residentType === "hosteller" ? roomNumber.trim() : undefined,
      });

      Alert.alert("Success", "Account created successfully!");
      router.replace("/(auth)/login");
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Registration failed");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.inner}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Campus360</Text>
          <Text style={styles.subtitle}>Create your student account</Text>
        </View>

        <Card>
          <Text style={styles.cardTitle}>Register</Text>

          <Input label="Full Name" placeholder="Enter your full name" value={name} onChangeText={setName} />
          <Input
            label="Student ID"
            placeholder="Enter 10-digit student ID"
            value={studentId}
            onChangeText={handleStudentIdChange}
            keyboardType="numeric"
          />
          <Input label="Email" placeholder="Enter your college email" value={email} onChangeText={setEmail} />
          <Input label="Password" placeholder="Create a password" value={password} onChangeText={setPassword} secureTextEntry />
          <Input label="Confirm Password" placeholder="Re-enter your password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

          {/* Resident Type Toggle */}
          <Text style={styles.toggleLabel}>I am a</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, residentType === "day_scholar" && styles.toggleBtnActive]}
              onPress={() => setResidentType("day_scholar")}
            >
              <Text style={[styles.toggleBtnText, residentType === "day_scholar" && styles.toggleBtnTextActive]}>
                🏠  Day Scholar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, residentType === "hosteller" && styles.toggleBtnActiveHostel]}
              onPress={() => setResidentType("hosteller")}
            >
              <Text style={[styles.toggleBtnText, residentType === "hosteller" && styles.toggleBtnTextActive]}>
                🏢  Hosteller
              </Text>
            </TouchableOpacity>
          </View>

          {/* Hostel fields — only shown for hostellers */}
          {residentType === "hosteller" && (
            <View style={styles.hostelFields}>
              <View style={styles.hostelNote}>
                <Text style={styles.hostelNoteText}>
                  Enter your current hostel details. These can be updated by the warden.
                </Text>
              </View>
              <Input
                label="Hostel Block"
                placeholder="e.g. Block A"
                value={hostelBlock}
                onChangeText={setHostelBlock}
              />
              <Input
                label="Room Number"
                placeholder="e.g. A-204"
                value={roomNumber}
                onChangeText={setRoomNumber}
              />
            </View>
          )}

          <View style={{ height: 12 }} />
          <Button title="Create Account" onPress={handleRegister} />
        </Card>

        <TouchableOpacity style={styles.loginLink} onPress={() => router.replace("/(auth)/login")}>
          <Text style={styles.loginLinkText}>
            Already have an account?{" "}
            <Text style={styles.loginLinkHighlight}>Sign in</Text>
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 24 },
  inner: { paddingTop: 60, paddingBottom: 20 },
  header: { alignItems: "center", marginBottom: 32 },
  title: { fontSize: 36, fontFamily: "DMSans_800ExtraBold", color: COLORS.textPrimary },
  subtitle: { fontSize: 14, fontFamily: "DMSans_400Regular", color: COLORS.textMuted, marginTop: 6, textAlign: "center" },
  cardTitle: { fontSize: 18, fontFamily: "DMSans_700Bold", color: COLORS.textPrimary, marginBottom: 20 },
  toggleLabel: { color: COLORS.textMuted, fontSize: 13, fontFamily: "DMSans_500Medium", marginBottom: 10 },
  toggleRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  toggleBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: "#0f172a", alignItems: "center",
  },
  toggleBtnActive: { borderColor: COLORS.primary, backgroundColor: "rgba(99,102,241,0.12)" },
  toggleBtnActiveHostel: { borderColor: "#10b981", backgroundColor: "rgba(16,185,129,0.12)" },
  toggleBtnText: { color: COLORS.textMuted, fontSize: 14, fontFamily: "DMSans_500Medium" },
  toggleBtnTextActive: { color: COLORS.textPrimary, fontFamily: "DMSans_700Bold" },
  hostelFields: { marginTop: 4 },
  hostelNote: {
    backgroundColor: "rgba(16,185,129,0.08)", borderWidth: 1,
    borderColor: "rgba(16,185,129,0.2)", borderRadius: 10, padding: 12, marginBottom: 12,
  },
  hostelNoteText: { color: "#10b981", fontSize: 12, fontFamily: "DMSans_400Regular", lineHeight: 18 },
  loginLink: { marginTop: 24, alignItems: "center" },
  loginLinkText: { fontFamily: "DMSans_400Regular", color: COLORS.textMuted },
  loginLinkHighlight: { color: COLORS.primary, fontFamily: "DMSans_600SemiBold" },
});
