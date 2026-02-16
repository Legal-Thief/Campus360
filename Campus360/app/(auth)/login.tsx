import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useApp } from '../../context/AppContext';
import AsyncStorage from '@react-native-async-storage/async-storage'
import { loginUser, getCurrentUser } from '../../utils/api'


/* 🎨 COLOR SYSTEM */
const BLUE = '#2563EB';
const BLUE_DARK = '#1D4ED8';
const GRAY_100 = '#F8FAFF';
const GRAY_200 = '#E5E7EB';
const GRAY_400 = '#94A3B8';
const GRAY_500 = '#64748B';
const GRAY_700 = '#334155';
const RED = '#EF4444';
const RED_BG = '#FEF2F2';
const WHITE = '#FFFFFF';

export default function LoginScreen() {
  const router = useRouter();
  const { setRole } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const showEmailError = email.length > 0 && !email.includes('@');
  const showPasswordError = password.length > 0 && password.length < 6;

  // 🔐 LOGIN HANDLER (LOGIC ONLY)
  const handleLogin = async () => {
  try {
    const data = await loginUser(email, password)

    if (!data.success) {
      alert(data.message)
      return
    }

    // Save token
    await AsyncStorage.setItem('token', data.token)

    // Verify token
    const userData = await getCurrentUser(data.token)

    if (userData.success) {
      router.replace('/(main)/dashboard')  // adjust route if needed
    }

  } catch (error) {
    console.log(error)
    alert('Login failed')
  }
}


  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ height: Platform.OS === 'ios' ? 56 : 44 }} />

      {/* 🔷 LOGO */}
      <View style={styles.logoBlock}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoIcon}>C</Text>
        </View>
        <Text style={styles.logoTitle}>Campus360</Text>
        <Text style={styles.logoSub}>
          Smart campus access, all in one place
        </Text>
      </View>

      {/* 🧊 CARD */}
      <View style={styles.card}>
        {/* EMAIL */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Email Address</Text>
          <View
            style={[
              styles.inputRow,
              emailFocused && styles.inputFocused,
              showEmailError && styles.inputError,
            ]}
          >
            <Text style={styles.inputIcon}>✉</Text>
            <TextInput
              style={styles.input}
              placeholder="you@college.edu"
              placeholderTextColor={GRAY_400}
              value={email}
              onChangeText={setEmail}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
          {showEmailError && (
            <Text style={styles.errorText}>
              Enter a valid email address
            </Text>
          )}
        </View>

        {/* PASSWORD */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Password</Text>
          <View
            style={[
              styles.inputRow,
              passwordFocused && styles.inputFocused,
              showPasswordError && styles.inputError,
            ]}
          >
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter password"
              placeholderTextColor={GRAY_400}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
            />
          </View>
          {showPasswordError && (
            <Text style={styles.errorText}>
              Minimum 6 characters required
            </Text>
          )}
        </View>

        {/* FORGOT */}
        <Pressable style={styles.forgotRow}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </Pressable>

        {/* CTA */}
        <Pressable
          style={({ pressed }) => [
            styles.submitBtn,
            pressed && styles.submitPressed,
          ]}
          onPress={handleLogin}
        >
          <Text style={styles.submitText}>Sign In</Text>
        </Pressable>

        {/* DIVIDER */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* SSO */}
        <Pressable style={styles.ssoBtn}>
          <Text style={styles.ssoIcon}>🏛</Text>
          <Text style={styles.ssoText}>Sign in with College SSO</Text>
        </Pressable>
      </View>

      {/* REGISTER */}
      <View style={styles.registerRow}>
        <Text style={styles.registerText}>New here? </Text>
        <Link href="/(auth)/register">
          <Text style={styles.registerLink}>Create account</Text>
        </Link>
      </View>
    </ScrollView>
  );
}

/* 💅 STYLES */
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#EEF2FF',
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  logoBlock: {
    alignItems: 'center',
    marginTop: 48,
    marginBottom: 36,
  },
  logoCircle: {
    width: 76,
    height: 76,
    borderRadius: 26,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 12,
  },
  logoIcon: {
    fontSize: 34,
    color: WHITE,
    fontWeight: '800',
  },
  logoTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: GRAY_700,
    marginTop: 18,
  },
  logoSub: {
    fontSize: 14,
    color: GRAY_500,
    marginTop: 6,
    textAlign: 'center',
  },

  card: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 24,
    padding: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },

  fieldGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: GRAY_700,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GRAY_100,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  inputFocused: {
    borderColor: BLUE,
    backgroundColor: '#EEF4FF',
  },
  inputError: {
    borderColor: RED,
    backgroundColor: RED_BG,
  },
  inputIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: GRAY_700,
  },
  errorText: {
    fontSize: 12,
    color: RED,
    marginTop: 6,
  },

  forgotRow: {
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  forgotText: {
    fontSize: 13,
    color: BLUE,
    fontWeight: '600',
  },

  submitBtn: {
    height: 54,
    borderRadius: 16,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  submitPressed: {
    backgroundColor: BLUE_DARK,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: WHITE,
    letterSpacing: 0.6,
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: GRAY_200,
  },
  dividerText: {
    fontSize: 12,
    color: GRAY_400,
    marginHorizontal: 12,
    fontWeight: '600',
  },

  ssoBtn: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: GRAY_200,
    backgroundColor: '#F9FAFB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ssoIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  ssoText: {
    fontSize: 14,
    fontWeight: '600',
    color: GRAY_700,
  },

  registerRow: {
    flexDirection: 'row',
    marginTop: 28,
  },
  registerText: {
    fontSize: 14,
    color: GRAY_500,
  },
  registerLink: {
    fontSize: 14,
    color: BLUE,
    fontWeight: '700',
  },
});
