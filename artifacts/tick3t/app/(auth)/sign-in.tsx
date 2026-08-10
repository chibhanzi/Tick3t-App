import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import Logo from '@/components/Logo';

export default function SignInScreen() {
  const { colors: C } = useTheme();
  const { signIn } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Sign In Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={['#050C18', '#0A1628', '#050C18']} style={StyleSheet.absoluteFillObject} />

      {/* Green glow top-right accent */}
      <View style={styles.accentGlow} />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

            {/* Logo */}
            <View style={styles.logoArea}>
              <Logo size="lg" />
              <Text style={styles.logoTagline}>Digital Event Keys</Text>
            </View>

            {/* Card */}
            <View style={[styles.card, { backgroundColor: 'rgba(13,27,46,0.95)', borderColor: 'rgba(255,255,255,0.08)' }]}>
              <Text style={styles.heading}>Welcome back</Text>
              <Text style={styles.subheading}>Sign in to your Tick3t account</Text>

              {/* Email */}
              <View style={[styles.fieldWrap, { borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                <Ionicons name="mail-outline" size={18} color="rgba(255,255,255,0.4)" style={styles.fieldIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email address"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              {/* Password */}
              <View style={[styles.fieldWrap, { borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                <Ionicons name="lock-closed-outline" size={18} color="rgba(255,255,255,0.4)" style={styles.fieldIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <Pressable onPress={() => setShowPassword(v => !v)}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="rgba(255,255,255,0.4)" />
                </Pressable>
              </View>

              {/* Forgot password */}
              <Pressable style={styles.forgotRow}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </Pressable>

              {/* Sign In button */}
              <Pressable
                style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
                onPress={handleSignIn}
                disabled={loading}
              >
                <LinearGradient
                  colors={['#22c55e', '#16a34a']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.primaryBtnGradient}
                >
                  {loading ? (
                    <Text style={styles.primaryBtnText}>Signing in…</Text>
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={styles.primaryBtnText}>Sign In</Text>
                      <Ionicons name="arrow-forward" size={18} color="#fff" />
                    </View>
                  )}
                </LinearGradient>
              </Pressable>

              {/* OR divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google (UI only) */}
              <Pressable style={styles.socialBtn} onPress={() => Alert.alert('Coming soon', 'Google sign-in is coming in a future update.')}>
                <Ionicons name="logo-google" size={18} color="rgba(255,255,255,0.7)" />
                <Text style={styles.socialBtnText}>Continue with Google</Text>
              </Pressable>
            </View>

            {/* Sign up link */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account?</Text>
              <Pressable onPress={() => router.push('/(auth)/sign-up')}>
                <Text style={styles.footerLink}> Sign up free</Text>
              </Pressable>
            </View>

            {/* Skip (demo) */}
            <Pressable onPress={() => router.replace('/(tabs)')} style={styles.skipBtn}>
              <Text style={styles.skipText}>Explore as guest →</Text>
            </Pressable>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 32, alignItems: 'center' },
  accentGlow: {
    position: 'absolute', top: -60, right: -60,
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(34,197,94,0.08)',
  },

  logoArea: { alignItems: 'center', marginBottom: 36, marginTop: 12 },
  logoTagline: { color: 'rgba(255,255,255,0.35)', fontSize: 11, letterSpacing: 2.5, textTransform: 'uppercase', marginTop: 12 },

  card: { width: '100%', borderRadius: 24, borderWidth: 1, padding: 24 },
  heading: { color: '#fff', fontSize: 26, fontWeight: '900', letterSpacing: -0.5, marginBottom: 6 },
  subheading: { color: 'rgba(255,255,255,0.45)', fontSize: 14, marginBottom: 24 },

  fieldWrap: { flexDirection: 'row', alignItems: 'center', height: 52, borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, marginBottom: 12 },
  fieldIcon: { marginRight: 10 },
  input: { flex: 1, color: '#fff', fontSize: 15, paddingVertical: 0 },

  forgotRow: { alignItems: 'flex-end', marginBottom: 20 },
  forgotText: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },

  primaryBtn: { borderRadius: 50, overflow: 'hidden', marginBottom: 20 },
  primaryBtnGradient: { height: 52, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  dividerText: { color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: '600' },

  socialBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 50, borderRadius: 50, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.04)' },
  socialBtnText: { color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: '600' },

  footer: { flexDirection: 'row', alignItems: 'center', marginTop: 24 },
  footerText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
  footerLink: { color: '#22c55e', fontSize: 14, fontWeight: '700' },

  skipBtn: { marginTop: 16 },
  skipText: { color: 'rgba(255,255,255,0.25)', fontSize: 13 },
});
