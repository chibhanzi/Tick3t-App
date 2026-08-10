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
import Logo from '@/components/Logo';

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!agreed) { Alert.alert('Terms', 'Please agree to the Terms & Privacy Policy.'); return; }
    if (password !== confirmPassword) { Alert.alert('Password mismatch', 'Passwords do not match.'); return; }
    setLoading(true);
    try {
      await signUp(name, email.trim(), password);
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Sign Up Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ icon, placeholder, value, onChangeText, secure, keyboard, extra }: any) => (
    <View style={[styles.fieldWrap, { borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.05)' }]}>
      <Ionicons name={icon} size={18} color="rgba(255,255,255,0.4)" style={styles.fieldIcon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.3)"
        secureTextEntry={secure && !showPassword}
        keyboardType={keyboard ?? 'default'}
        autoCapitalize={keyboard === 'email-address' ? 'none' : 'words'}
        autoCorrect={false}
        value={value}
        onChangeText={onChangeText}
      />
      {extra}
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={['#050C18', '#0A1628', '#050C18']} style={StyleSheet.absoluteFillObject} />
      <View style={[styles.accentGlow, { left: -60, top: -60 }]} />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

            {/* Back + Logo */}
            <View style={styles.topRow}>
              <Pressable onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={22} color="rgba(255,255,255,0.6)" />
              </Pressable>
            </View>

            <View style={styles.logoArea}>
              <Logo size="md" />
            </View>

            <View style={[styles.card, { backgroundColor: 'rgba(13,27,46,0.95)', borderColor: 'rgba(255,255,255,0.08)' }]}>
              <Text style={styles.heading}>Create account</Text>
              <Text style={styles.subheading}>Join thousands of event-goers on Tick3t</Text>

              <Field icon="person-outline" placeholder="Full name" value={name} onChangeText={setName} />
              <Field icon="mail-outline" placeholder="Email address" value={email} onChangeText={setEmail} keyboard="email-address" />
              <Field
                icon="lock-closed-outline"
                placeholder="Password (min. 6 chars)"
                value={password}
                onChangeText={setPassword}
                secure
                extra={
                  <Pressable onPress={() => setShowPassword(v => !v)}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="rgba(255,255,255,0.4)" />
                  </Pressable>
                }
              />
              <Field icon="lock-closed-outline" placeholder="Confirm password" value={confirmPassword} onChangeText={setConfirmPassword} secure />

              {/* Terms */}
              <Pressable style={styles.termsRow} onPress={() => setAgreed(v => !v)}>
                <View style={[styles.checkbox, { borderColor: agreed ? '#22c55e' : 'rgba(255,255,255,0.2)', backgroundColor: agreed ? '#22c55e20' : 'transparent' }]}>
                  {agreed && <Ionicons name="checkmark" size={13} color="#22c55e" />}
                </View>
                <Text style={styles.termsText}>
                  I agree to the{' '}
                  <Text style={{ color: '#22c55e' }}>Terms of Service</Text>
                  {' & '}
                  <Text style={{ color: '#22c55e' }}>Privacy Policy</Text>
                </Text>
              </Pressable>

              {/* Create Account */}
              <Pressable
                style={[styles.primaryBtn, (loading || !agreed) && { opacity: 0.65 }]}
                onPress={handleSignUp}
                disabled={loading || !agreed}
              >
                <LinearGradient
                  colors={['#22c55e', '#16a34a']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.primaryBtnGradient}
                >
                  <Text style={styles.primaryBtnText}>{loading ? 'Creating…' : 'Create Account'}</Text>
                </LinearGradient>
              </Pressable>

              {/* NFT note */}
              <View style={styles.nftNote}>
                <Ionicons name="shield-checkmark-outline" size={14} color="rgba(129,140,248,0.7)" />
                <Text style={styles.nftNoteText}>Every ticket you buy is an NFT on the TON blockchain</Text>
              </View>
            </View>

            {/* Sign in link */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <Pressable onPress={() => router.push('/(auth)/sign-in')}>
                <Text style={styles.footerLink}> Sign in</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 32 },
  accentGlow: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(34,197,94,0.07)' },

  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },

  logoArea: { alignItems: 'center', marginBottom: 28 },

  card: { borderRadius: 24, borderWidth: 1, padding: 24 },
  heading: { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: -0.5, marginBottom: 6 },
  subheading: { color: 'rgba(255,255,255,0.45)', fontSize: 13, marginBottom: 22 },

  fieldWrap: { flexDirection: 'row', alignItems: 'center', height: 52, borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, marginBottom: 12 },
  fieldIcon: { marginRight: 10 },
  input: { flex: 1, color: '#fff', fontSize: 15, paddingVertical: 0 },

  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 20, marginTop: 4 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  termsText: { flex: 1, color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 19 },

  primaryBtn: { borderRadius: 50, overflow: 'hidden', marginBottom: 16 },
  primaryBtnGradient: { height: 52, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  nftNote: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(99,102,241,0.1)', borderRadius: 10, padding: 10 },
  nftNoteText: { color: 'rgba(129,140,248,0.7)', fontSize: 11, flex: 1, lineHeight: 16 },

  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  footerText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
  footerLink: { color: '#22c55e', fontSize: 14, fontWeight: '700' },
});
