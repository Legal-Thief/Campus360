import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TextInput,
  ScrollView,
  StatusBar,
  NativeSyntheticEvent,
  TextInputFocusEventData,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONT, RADIUS } from "../../utils/theme"; // Assuming these are correctly imported
import API from "../../utils/api"; // Assuming this is correctly imported

// Define types for clarity and safety
type ResidentType = "day_scholar" | "hosteller";
type FocusedField = "name" | "sid" | "email" | "pass" | "cpass" | "block" | "room" | null;

// Constants for icon names
const PERSON_OUTLINE = "person-outline";
const ID_CARD_OUTLINE = "id-card-outline";
const MAIL_OUTLINE = "mail-outline";
const LOCK_CLOSED_OUTLINE = "lock-closed-outline";
const EYE_OUTLINE = "eye-outline";
const EYE_OFF_OUTLINE = "eye-off-outline";
const ARROW_BACK = "arrow-back";
const ARROW_FORWARD = "arrow-forward";
const HOME_OUTLINE = "home-outline";
const BUSINESS_OUTLINE = "business-outline";
const INFORMATION_CIRCLE_OUTLINE = "information-circle-outline";
const GRID_OUTLINE = "grid-outline";
const BED_OUTLINE = "bed-outline";

interface FieldProps {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: TextInput["props"]["keyboardType"];
  secureTextEntry?: boolean;
  fieldKey: string; // Use a more descriptive key if possible, e.g., 'name', 'studentId'
  right?: React.ReactNode;
  onFocus?: () => void;
  onBlur?: () => void;
}

const Field: React.FC<FieldProps> = ({
  icon,
  placeholder,
  value,
  onChangeText,
  keyboardType = "default",
  secureTextEntry = false,
  fieldKey,
  right,
  onFocus,
  onBlur,
}) => {
  const [isFocused, setIsFocused] = useState(false); // Local state for focus to avoid prop drilling if needed elsewhere

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  return (
    <View style={[styles.inputWrap, isFocused && styles.inputFocused]}>
      <Ionicons
        name={icon}
        size={17}
        color={isFocused ? COLORS.primary : COLORS.textMuted}
      />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textDim}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
      {right}
    </View>
  );
};

// Reusable component for hostel block and room number inputs
interface HostelInputProps {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  fieldKey: "block" | "room"; // Specific keys for hostel inputs
}

const HostelInput: React.FC<HostelInputProps> = ({ icon, placeholder, value, onChangeText, fieldKey }) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  return (
    <View style={[styles.inputWrap, { flex: 1 }, isFocused && styles.inputFocused]}>
      <Ionicons name={icon} size={17} color={isFocused ? COLORS.primary : COLORS.textMuted} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textDim}
        value={value}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
    </View>
  );
};


export default function Register() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [residentType, setResidentType] = useState<ResidentType>("day_scholar");
  const [hostelBlock, setHostelBlock] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [focusedField, setFocusedField] = useState<FocusedField>(null); // Renamed for clarity

  const handleStudentIdChange = useCallback((text: string) => {
    const numericValue = text.replace(/[^0-9]/g, "");
    if (numericValue.length <= 10) {
      setStudentId(numericValue);
    }
  }, []);

  const handleRegister = async () => {
    // Basic validation
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
      Alert.alert("Error", "Hostellers must enter their block and room");
      return;
    }

    // Prepare data for API
    const registrationData = {
      name,
      studentId,
      email,
      password,
      residentType,
      hostelBlock: residentType === "hosteller" ? hostelBlock.trim() : undefined,
      roomNumber: residentType === "hosteller" ? roomNumber.trim() : undefined,
    };

    try {
      await API.post("/auth/register", registrationData);
      Alert.alert("✅ Account Created", "Sign in to get started");
      router.replace("/(auth)/login");
    } catch (error: unknown) { // Use unknown for better type safety
      // Attempt to extract a meaningful message from the error
      let errorMessage = "Registration failed. Please try again.";
      if (error instanceof Error) {
        // Basic check for common error structures, e.g., from Axios
        if (typeof error.message === 'string') {
          errorMessage = error.message;
        }
        // More specific error handling could be added here if API error structure is known
        // e.g., if (axios.isAxiosError(error) && error.response?.data?.message) {
        //   errorMessage = error.response.data.message;
        // }
      }
      Alert.alert("Error", errorMessage);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <View style={styles.glowBL} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back + Header */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} accessibilityLabel="Go back">
          <Ionicons name={ARROW_BACK} size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <Text style={styles.headline}>Create{"\n"}Account.</Text>
        <Text style={styles.tagline}>Join your campus community</Text>

        {/* Step: Personal */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionNum}><Text style={styles.sectionNumText}>01</Text></View>
          <Text style={styles.sectionLabel}>PERSONAL INFO</Text>
        </View>

        <Field
          icon={PERSON_OUTLINE}
          placeholder="Full name"
          value={name}
          onChangeText={setName}
          fieldKey="name"
          onFocus={() => setFocusedField("name")}
          onBlur={() => setFocusedField(null)}
        />
        <Field
          icon={ID_CARD_OUTLINE}
          placeholder="Student ID (10 digits)"
          value={studentId}
          onChangeText={handleStudentIdChange}
          keyboardType="numeric"
          fieldKey="sid"
          onFocus={() => setFocusedField("sid")}
          onBlur={() => setFocusedField(null)}
        />
        <Field
          icon={MAIL_OUTLINE}
          placeholder="College email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address" // More specific keyboard type
          fieldKey="email"
          onFocus={() => setFocusedField("email")}
          onBlur={() => setFocusedField(null)}
        />

        {/* Step: Security */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionNum}><Text style={styles.sectionNumText}>02</Text></View>
          <Text style={styles.sectionLabel}>SECURITY</Text>
        </View>

        <Field
          icon={LOCK_CLOSED_OUTLINE}
          placeholder="Create password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPass}
          fieldKey="pass"
          onFocus={() => setFocusedField("pass")}
          onBlur={() => setFocusedField(null)}
          right={
            <TouchableOpacity onPress={() => setShowPass(v => !v)} accessibilityLabel={showPass ? "Hide password" : "Show password"}>
              <Ionicons name={showPass ? EYE_OFF_OUTLINE : EYE_OUTLINE} size={17} color={COLORS.textMuted} />
            </TouchableOpacity>
          }
        />
        <Field
          icon={LOCK_CLOSED_OUTLINE}
          placeholder="Confirm password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showPass}
          fieldKey="cpass"
          onFocus={() => setFocusedField("cpass")}
          onBlur={() => setFocusedField(null)}
        />

        {/* Step: Resident */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionNum}><Text style={styles.sectionNumText}>03</Text></View>
          <Text style={styles.sectionLabel}>RESIDENCY</Text>
        </View>

        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, residentType === "day_scholar" && styles.toggleActive]}
            onPress={() => setResidentType("day_scholar")}
            accessibilityRole="button"
            accessibilityState={{ selected: residentType === "day_scholar" }}
          >
            <Ionicons name={HOME_OUTLINE} size={18} color={residentType === "day_scholar" ? "#fff" : COLORS.textMuted} />
            <Text style={[styles.toggleText, residentType === "day_scholar" && styles.toggleTextActive]}>Day Scholar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, residentType === "hosteller" && styles.toggleActive]}
            onPress={() => setResidentType("hosteller")}
            accessibilityRole="button"
            accessibilityState={{ selected: residentType === "hosteller" }}
          >
            <Ionicons name={BUSINESS_OUTLINE} size={18} color={residentType === "hosteller" ? "#fff" : COLORS.textMuted} />
            <Text style={[styles.toggleText, residentType === "hosteller" && styles.toggleTextActive]}>Hosteller</Text>
          </TouchableOpacity>
        </View>

        {residentType === "hosteller" && (
          <>
            <View style={styles.hostelNote}>
              <Ionicons name={INFORMATION_CIRCLE_OUTLINE} size={15} color={COLORS.primary} />
              <Text style={styles.hostelNoteText}>Enter your current hostel details</Text>
            </View>
            <View style={styles.rowInputs}>
              <HostelInput
                icon={GRID_OUTLINE}
                placeholder="Block (e.g. A)"
                value={hostelBlock}
                onChangeText={setHostelBlock}
                fieldKey="block"
              />
              <HostelInput
                icon={BED_OUTLINE}
                placeholder="Room (e.g. A-204)"
                value={roomNumber}
                onChangeText={setRoomNumber}
                fieldKey="room"
              />
            </View>
          </>
        )}

        {/* Submit */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleRegister} activeOpacity={0.85} accessibilityLabel="Create Account">
          <Text style={styles.submitText}>Create Account</Text>
          <Ionicons name={ARROW_FORWARD} size={18} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.loginLink} onPress={() => router.replace("/(auth)/login")} accessibilityLabel="Sign in">
          <Text style={styles.loginLinkText}>
            Already registered?{" "}
            <Text style={styles.loginLinkHighlight}>Sign in →</Text>
          </Text>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  glowBL: {
    position: "absolute",
    bottom: -60,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: COLORS.primary,
    opacity: 0.08,
  },
  scroll: { paddingHorizontal: 26, paddingTop: 60, paddingBottom: 20 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
  },
  headline: {
    color: COLORS.textPrimary,
    fontSize: 46,
    fontFamily: FONT.extraBold,
    lineHeight: 50,
    marginBottom: 10,
  },
  tagline: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontFamily: FONT.regular,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
    marginTop: 8,
  },
  sectionNum: {
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  sectionNumText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: FONT.bold,
  },
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontFamily: FONT.bold,
    letterSpacing: 2,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 15,
    paddingVertical: 13,
    marginBottom: 10,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surfaceHigh,
  },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 14,
    fontFamily: FONT.regular,
  },
  rowInputs: { flexDirection: "row", gap: 10 },
  toggleRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  toggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  toggleActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  toggleText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontFamily: FONT.semiBold,
  },
  toggleTextActive: {
    color: "#fff",
  },
  hostelNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.primaryGlow,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  hostelNoteText: { color: COLORS.primary, fontSize: 12, fontFamily: FONT.medium },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 17,
    marginTop: 18,
    marginBottom: 16,
  },
  submitText: { color: "#fff", fontSize: 16, fontFamily: FONT.bold },
  loginLink: { alignItems: "center" },
  loginLinkText: { color: COLORS.textMuted, fontSize: 14, fontFamily: FONT.regular },
  loginLinkHighlight: { color: COLORS.primary, fontFamily: FONT.semiBold },
});