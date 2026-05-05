import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert,
  TextInput, StatusBar, Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import API from "../../utils/api";
import { COLORS, FONT, RADIUS } from "../../utils/theme";

const { width, height } = Dimensions.get("window");

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "All fields are required");
      return;
    }
    setLoading(true);
    try {
      const res = await API.post("/auth/login", { email, password });
      await login(res.data.token, res.data.user);
    } catch (error: any) {
      Alert.alert("Login Failed", error.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* BG accent — red glow top right */}
      <View style={styles.glowTR} />
      {/* diagonal stripe pattern */}
      <View style={styles.stripeOverlay} />

      <View style={styles.inner}>
        {/* Logo block */}
        <View style={styles.logoBlock}>
          <View style={styles.logoMark}>
            <Text style={styles.logoMarkText}>C</Text>
          </View>
          <View>
            <Text style={styles.logoName}>CAMPUS</Text>
            <Text style={styles.logoName360}>360</Text>
          </View>
        </View>

        <Text style={styles.headline}>Welcome{"\n"}Back.</Text>
        <Text style={styles.tagline}>Sign in to your campus account</Text>

        {/* Form */}
        <View style={styles.form}>
          {/* Email */}
          <View style={[styles.inputWrap, focused === "email" && styles.inputWrapFocused]}>
            <Ionicons name="mail-outline" size={18} color={focused === "email" ? COLORS.primary : COLORS.textMuted} />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor={COLORS.textDim}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              onFocus={() => setFocused("email")}
              onBlur={() => setFocused(null)}
            />
          </View>

          {/* Password */}
          <View style={[styles.inputWrap, focused === "pass" && styles.inputWrapFocused]}>
            <Ionicons name="lock-closed-outline" size={18} color={focused === "pass" ? COLORS.primary : COLORS.textMuted} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Password"
              placeholderTextColor={COLORS.textDim}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
              onFocus={() => setFocused("pass")}
              onBlur={() => setFocused(null)}
            />
            <TouchableOpacity onPress={() => setShowPass(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* CTA */}
          <TouchableOpacity
            style={[styles.loginBtn, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <View style={styles.loginBtnInner}>
              <Text style={styles.loginBtnText}>{loading ? "Signing in..." : "Sign In"}</Text>
              {!loading && <Ionicons name="arrow-forward" size={18} color="#fff" />}
            </View>
          </TouchableOpacity>
        </View>

        {/* Register */}
        <TouchableOpacity
          style={styles.registerLink}
          onPress={() => router.push("/(auth)/register")}
        >
          <Text style={styles.registerLinkText}>
            No account?{" "}
            <Text style={styles.registerLinkHighlight}>Create one →</Text>
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bottom wordmark */}
      <Text style={styles.bottomMark}>CAMPUS360</Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  glowTR: {
    position: "absolute",
    top: -80,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: COLORS.primary,
    opacity: 0.12,
  },
  stripeOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: COLORS.primary,
    opacity: 0.6,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: height * 0.1,
    paddingBottom: 40,
  },
  logoBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 48,
  },
  logoMark: {
    width: 44,
    height: 44,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  logoMarkText: {
    color: "#fff",
    fontSize: 24,
    fontFamily: FONT.extraBold,
  },
  logoName: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontFamily: FONT.bold,
    letterSpacing: 4,
    lineHeight: 16,
  },
  logoName360: {
    color: COLORS.primary,
    fontSize: 13,
    fontFamily: FONT.bold,
    letterSpacing: 4,
    lineHeight: 16,
  },
  headline: {
    color: COLORS.textPrimary,
    fontSize: 52,
    fontFamily: FONT.extraBold,
    lineHeight: 56,
    marginBottom: 10,
  },
  tagline: {
    color: COLORS.textMuted,
    fontSize: 15,
    fontFamily: FONT.regular,
    marginBottom: 40,
  },
  form: {
    gap: 14,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputWrapFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surfaceHigh,
  },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 15,
    fontFamily: FONT.regular,
  },
  loginBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 17,
    marginTop: 6,
    overflow: "hidden",
  },
  loginBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loginBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: FONT.bold,
    letterSpacing: 0.4,
  },
  registerLink: {
    marginTop: 28,
    alignItems: "center",
  },
  registerLinkText: {
    color: COLORS.textMuted,
    fontFamily: FONT.regular,
    fontSize: 14,
  },
  registerLinkHighlight: {
    color: COLORS.primary,
    fontFamily: FONT.semiBold,
  },
  bottomMark: {
    position: "absolute",
    bottom: 24,
    alignSelf: "center",
    color: COLORS.textDim,
    fontSize: 10,
    fontFamily: FONT.bold,
    letterSpacing: 6,
  },
});