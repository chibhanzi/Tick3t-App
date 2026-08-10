import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';

interface AuthPromptProps {
  /** Tab name shown in the headline, e.g. "Vault" or "Profile" */
  screen: string;
  /** Short description of what's behind the gate */
  description: string;
  /** Icon to display above the headline */
  icon: React.ComponentProps<typeof Ionicons>['name'];
  /** Bullet perks shown beneath the description */
  perks?: string[];
}

export default function AuthPrompt({ screen, description, icon, perks = [] }: AuthPromptProps) {
  const { colors: C, isDark } = useTheme();
  const router = useRouter();

  return (
    <LinearGradient
      colors={isDark ? ['#050C18', '#0A1628', '#050C18'] : ['#F8FAFC', '#EFF6FF', '#F8FAFC']}
      style={styles.container}
    >
      {/* Soft glow accent */}
      <View style={styles.glowWrap}>
        <View style={[styles.glow, { backgroundColor: isDark ? 'rgba(34,197,94,0.07)' : 'rgba(22,163,74,0.06)' }]} />
      </View>

      {/* Icon */}
      <View style={[styles.iconRing, { backgroundColor: C.primary + '18', borderColor: C.primary + '30' }]}>
        <View style={[styles.iconInner, { backgroundColor: C.primary + '22' }]}>
          <Ionicons name={icon} size={36} color={C.primary} />
        </View>
      </View>

      {/* Heading */}
      <Text style={[styles.heading, { color: C.text }]}>{screen}</Text>
      <Text style={[styles.sub, { color: C.textMuted }]}>{description}</Text>

      {/* Perks list */}
      {perks.length > 0 && (
        <View style={[styles.perksCard, { backgroundColor: C.card, borderColor: C.border }]}>
          {perks.map((perk, i) => (
            <View key={i} style={[styles.perkRow, i > 0 && { borderTopWidth: 1, borderTopColor: C.border }]}>
              <View style={[styles.perkCheck, { backgroundColor: C.primary + '20' }]}>
                <Ionicons name="checkmark" size={13} color={C.primary} />
              </View>
              <Text style={[styles.perkText, { color: C.textSecondary }]}>{perk}</Text>
            </View>
          ))}
        </View>
      )}

      {/* CTA buttons */}
      <Pressable
        style={[styles.primaryBtn, { backgroundColor: C.primary }]}
        onPress={() => router.push('/(auth)/sign-in')}
      >
        <Ionicons name="log-in-outline" size={18} color="#fff" />
        <Text style={styles.primaryBtnText}>Sign In</Text>
      </Pressable>

      <Pressable
        style={[styles.secondaryBtn, { borderColor: C.border, backgroundColor: C.card }]}
        onPress={() => router.push('/(auth)/sign-up')}
      >
        <Text style={[styles.secondaryBtnText, { color: C.textSecondary }]}>Create a free account</Text>
      </Pressable>

      <Text style={[styles.note, { color: C.textMuted }]}>
        NFT-backed tickets · Secure payments via Paynow
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  glowWrap: {
    position: 'absolute',
    top: '20%',
    alignItems: 'center',
  },
  glow: {
    width: 260,
    height: 260,
    borderRadius: 130,
  },

  iconRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  heading: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 10,
    textAlign: 'center',
  },
  sub: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 28,
    maxWidth: 280,
  },

  perksCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 28,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  perkCheck: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  perkText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },

  primaryBtn: {
    width: '100%',
    height: 52,
    borderRadius: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },

  secondaryBtn: {
    width: '100%',
    height: 50,
    borderRadius: 50,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },

  note: {
    fontSize: 11,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});
