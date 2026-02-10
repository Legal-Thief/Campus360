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

/* 🎨 COLORS */
const BLUE = '#2563EB';
const BLUE_DARK = '#1D4ED8';
const GRAY_100 = '#F8FAFF';
const GRAY_200 = '#E5E7EB';
const GRAY_400 = '#94A3B8';
const GRAY_500 = '#64748B';
const GRAY_700 = '#334155';
const RED = '#EF4444';
const RED_BG = '#FEF2F2';
const GREEN = '#16A34A';
const GREEN_BG = '#F0FDF4';
const WHITE = '#FFFFFF';

const ROLES = ['Student', 'Faculty', 'Staff'];

export default function RegisterScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [enrollment, setEnrollment] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [roleIdx, setRoleIdx] = useState(0);
  const [rolePickerOpen, setRolePickerOpen] = useState(false);

  /* 🔍 STATIC VALIDATION */
  const showNameError = name.length > 0 && name.trim().split(' ').length < 2;
  const showEnrollError = enrollment.length > 0 && enrollment.length < 8;
  const showPwdError = password.length > 0 && password.length < 6;
  const showConfirmError =
    confirmPassword.length > 0 && password !== confirmPassword;

  const allGood =
    name.trim().split(' ').length >= 2 &&
    enrollment.length >= 8 &&
    password.length >= 6 &&
    password === confirmPassword;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ height: Platform.OS === 'ios' ? 56 : 44 }} />

      {/* 🔙 HEADER */}
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Create Account</Text>
        <View style={{ width: 36 }} />
      </View>

      <Text style={styles.headerSub}>
        Join Campus360 in just a few steps
      </Text>

      {/* 🧊 CARD */}
      <View style={styles.card}>
        <Field
          label="Full Name"
          icon="👤"
          placeholder="John Doe"
          value={name}
          onChangeText={setName}
          error={
            showNameError
              ? 'Please enter first & last name'
              : null
          }
          autoCapitalize="words"
        />

        <Field
          label="Enrollment Number"
          icon="🎓"
          placeholder="2024CS100123"
          value={enrollment}
          onChangeText={setEnrollment}
          error={
            showEnrollError
              ? 'Minimum 8 characters required'
              : null
          }
          autoCapitalize="characters"
        />

        {/* ROLE */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Role</Text>
          <Pressable
            style={[
              styles.dropdownRow,
              rolePickerOpen && styles.inputFocused,
            ]}
            onPress={() => setRolePickerOpen(!rolePickerOpen)}
          >
            <Text style={styles.inputIcon}>🎭</Text>
            <Text style={styles.dropdownValue}>
              {ROLES[roleIdx]}
            </Text>
            <Text style={styles.dropdownArrow}>
              {rolePickerOpen ? '▲' : '▼'}
            </Text>
          </Pressable>

          {rolePickerOpen && (
            <View style={styles.dropdownOptions}>
              {ROLES.map((role, i) => (
                <Pressable
                  key={role}
                  style={[
                    styles.dropdownOption,
                    i === roleIdx && styles.dropdownOptionActive,
                  ]}
                  onPress={() => {
                    setRoleIdx(i);
                    setRolePickerOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownOptionText,
                      i === roleIdx &&
                        styles.dropdownOptionTextActive,
                    ]}
                  >
                    {role}
                  </Text>
                  {i === roleIdx && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <Field
          label="Password"
          icon="🔒"
          placeholder="Create password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          error={
            showPwdError
              ? 'At least 6 characters'
              : null
          }
        />

        {/* CONFIRM PASSWORD */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Confirm Password</Text>
          <View
            style={[
              styles.inputRow,
              showConfirmError && styles.inputError,
              !showConfirmError &&
                confirmPassword.length >= 6 &&
                password === confirmPassword &&
                styles.inputSuccess,
            ]}
          >
            <Text style={styles.inputIcon}>🔑</Text>
            <TextInput
              style={styles.input}
              placeholder="Re-enter password"
              placeholderTextColor={GRAY_400}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
            {confirmPassword.length > 0 && (
              <Text style={{ fontSize: 16 }}>
                {showConfirmError ? '✗' : '✓'}
              </Text>
            )}
          </View>
          {showConfirmError && (
            <Text style={styles.errorText}>
              Passwords do not match
            </Text>
          )}
        </View>

        {/* TERMS */}
        <View style={styles.termsRow}>
          <Text style={styles.termsText}>
            By registering, you agree to our{' '}
          </Text>
          <Text style={styles.termsLink}>Terms</Text>
          <Text style={styles.termsText}> & </Text>
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </View>

        {/* CTA */}
        <Pressable
          style={({ pressed }) => [
            styles.submitBtn,
            allGood && styles.submitBtnActive,
            pressed && allGood && styles.submitBtnPressed,
          ]}
          onPress={() => {
            if (allGood) router.push('/(auth)/login');
          }}
        >
          <Text
            style={[
              styles.submitBtnText,
              !allGood && styles.submitBtnTextDisabled,
            ]}
          >
            Create Account
          </Text>
        </Pressable>
      </View>

      {/* LOGIN */}
      <View style={styles.loginRow}>
        <Text style={styles.loginText}>
          Already have an account?{' '}
        </Text>
        <Link href="/(auth)/login">
          <Text style={styles.loginLink}>Sign In</Text>
        </Link>
      </View>
    </ScrollView>
  );
}

/* 🧱 REUSABLE FIELD */
function Field({
  label,
  icon,
  placeholder,
  value,
  onChangeText,
  error,
  secureTextEntry,
  autoCapitalize,
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputRow,
          focused && styles.inputFocused,
          error && styles.inputError,
        ]}
      >
        <Text style={styles.inputIcon}>{icon}</Text>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={GRAY_400}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize || 'none'}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

/* 💅 STYLES */
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EEF2FF' },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  backIcon: { fontSize: 20, color: GRAY_700 },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: GRAY_700,
  },
  headerSub: {
    fontSize: 14,
    color: GRAY_500,
    marginTop: 8,
    marginBottom: 24,
    textAlign: 'center',
  },

  card: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 24,
    padding: 26,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },

  fieldGroup: { marginBottom: 18 },
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
  inputSuccess: {
    borderColor: GREEN,
    backgroundColor: GREEN_BG,
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

  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GRAY_100,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  dropdownValue: {
    flex: 1,
    fontSize: 15,
    color: GRAY_700,
    fontWeight: '600',
  },
  dropdownArrow: {
    fontSize: 11,
    color: GRAY_400,
  },
  dropdownOptions: {
    marginTop: 6,
    backgroundColor: WHITE,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GRAY_200,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  dropdownOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
  },
  dropdownOptionActive: {
    backgroundColor: '#EFF6FF',
  },
  dropdownOptionText: {
    fontSize: 14,
    color: GRAY_700,
  },
  dropdownOptionTextActive: {
    color: BLUE,
    fontWeight: '700',
  },
  checkmark: {
    fontSize: 14,
    color: BLUE,
    fontWeight: '700',
  },

  termsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  termsText: { fontSize: 12, color: GRAY_500 },
  termsLink: {
    fontSize: 12,
    color: BLUE,
    fontWeight: '600',
  },

  submitBtn: {
    height: 54,
    borderRadius: 16,
    backgroundColor: GRAY_200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnActive: {
    backgroundColor: BLUE,
    shadowColor: BLUE,
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  submitBtnPressed: {
    backgroundColor: BLUE_DARK,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: WHITE,
    letterSpacing: 0.6,
  },
  submitBtnTextDisabled: {
    color: GRAY_500,
  },

  loginRow: {
    flexDirection: 'row',
    marginTop: 28,
  },
  loginText: { fontSize: 14, color: GRAY_500 },
  loginLink: {
    fontSize: 14,
    color: BLUE,
    fontWeight: '700',
  },
});
