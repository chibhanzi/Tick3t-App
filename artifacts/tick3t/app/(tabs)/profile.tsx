import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import AuthPrompt from '@/components/AuthPrompt';

export default function ProfileScreen() {
  const { colors: C, isDark, toggleTheme } = useTheme();
  const { user: authUser, signOut, isAuthenticated } = useAuth();
  const { tickets, updateUser, user } = useApp();
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(authUser?.name ?? user?.name ?? '');
  const [email, setEmail] = useState(authUser?.email ?? user?.email ?? '');

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[{ flex: 1 }, { backgroundColor: C.background }]} edges={['top']}>
        <AuthPrompt
          screen="Your Profile"
          description="Sign in to manage your account, view your ticket history, and connect your Paynow and TON wallets."
          icon="person-circle-outline"
          perks={[
            'Edit your name, email and avatar',
            'Track upcoming & attended events',
            'Connect Paynow & TON NFT wallet',
          ]}
        />
      </SafeAreaView>
    );
  }

  const upcoming = tickets.filter(t => t.status === 'upcoming').length;
  const past = tickets.filter(t => t.status === 'past').length;
  const displayName = authUser?.name ?? user?.name ?? 'Guest';
  const displayEmail = authUser?.email ?? user?.email ?? '';
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  const handleSave = () => { updateUser({ name, email }); setEditing(false); };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await signOut(); router.replace('/(auth)/sign-in'); } },
    ]);
  };

  const menuItems = [
    { icon: 'ticket-outline' as const, label: 'My Tickets', value: `${tickets.length} total`, onPress: () => {} },
    { icon: 'cube-outline' as const, label: 'NFT Wallet', value: 'TON Blockchain', onPress: () => Alert.alert('NFT Wallet', 'Connect your TON wallet to manage NFT tickets.\n\nWallet integration coming soon.') },
    { icon: 'notifications-outline' as const, label: 'Notifications', value: 'On', onPress: () => Alert.alert('Notifications', 'Manage your notification preferences.') },
    { icon: 'shield-checkmark-outline' as const, label: 'Security', value: '', onPress: () => Alert.alert('Security', 'Two-factor authentication and account security settings.') },
    { icon: 'card-outline' as const, label: 'Paynow', value: 'Not linked', onPress: () => Alert.alert('Paynow', 'Link your Paynow account for secure, seamless payments.') },
    { icon: 'gift-outline' as const, label: 'Refer Friends', value: '', onPress: () => Alert.alert('Referrals', 'Share your referral code to earn free tickets!') },
    { icon: 'help-circle-outline' as const, label: 'Help & Support', value: '', onPress: () => Alert.alert('Support', 'Contact us at support@tick3t.com') },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.screenTitle, { color: C.text }]}>Profile</Text>
          <Pressable
            style={[styles.editBtn, { borderColor: C.border }]}
            onPress={() => editing ? handleSave() : setEditing(true)}
          >
            <Text style={[styles.editBtnText, { color: editing ? C.primary : C.textSecondary }]}>
              {editing ? 'Save' : 'Edit'}
            </Text>
          </Pressable>
        </View>

        {/* Avatar + info */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatarRing, { borderColor: C.primary + '50' }]}>
            <View style={[styles.avatar, { backgroundColor: C.primary + '22' }]}>
              <Text style={[styles.initials, { color: C.primary }]}>{initials}</Text>
            </View>
          </View>
          {editing ? (
            <View style={styles.editFields}>
              <TextInput style={[styles.editInput, { color: C.text, borderColor: C.border, backgroundColor: C.card }]} value={name} onChangeText={setName} placeholder="Display name" placeholderTextColor={C.textMuted} />
              <TextInput style={[styles.editInput, { color: C.text, borderColor: C.border, backgroundColor: C.card }]} value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor={C.textMuted} keyboardType="email-address" />
            </View>
          ) : (
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: C.text }]}>{displayName}</Text>
              <Text style={[styles.userEmail, { color: C.textSecondary }]}>{displayEmail}</Text>
              <View style={styles.roleBadgeRow}>
                <View style={[styles.roleBadge, { backgroundColor: C.primary + '22', borderColor: C.primary + '44' }]}>
                  <Ionicons name="ticket-outline" size={11} color={C.primary} />
                  <Text style={[styles.roleBadgeText, { color: C.primary }]}>Attendee</Text>
                </View>
                <View style={[styles.roleBadge, { backgroundColor: '#6366F122', borderColor: '#6366F144' }]}>
                  <Ionicons name="cube-outline" size={11} color="#818CF8" />
                  <Text style={[styles.roleBadgeText, { color: '#818CF8' }]}>NFT Member</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={[styles.statsGrid, { backgroundColor: C.card, borderColor: C.border }]}>
          {[
            { label: 'Upcoming', value: upcoming, icon: 'ticket-outline' as const },
            { label: 'Attended', value: past, icon: 'checkmark-circle-outline' as const },
            { label: 'NFT Keys', value: tickets.filter(t => t.isNFT).length, icon: 'cube-outline' as const },
          ].map((s, i) => (
            <View key={i} style={[styles.statItem, i < 2 && { borderRightWidth: 1, borderRightColor: C.border }]}>
              <Ionicons name={s.icon} size={20} color={C.primary} />
              <Text style={[styles.statValue, { color: C.text }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: C.textMuted }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Upgrade banner */}
        <Pressable
          style={[styles.upgradeBanner, { backgroundColor: C.primary + '12', borderColor: C.primary + '35' }]}
          onPress={() => Alert.alert('Become an Organizer', 'Create and manage your own events on Tick3t.\n\nOrganizer upgrade coming soon!')}
        >
          <View style={[styles.upgradeIcon, { backgroundColor: C.primary + '20' }]}>
            <Ionicons name="megaphone-outline" size={20} color={C.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.upgradeTitle, { color: C.primary }]}>Become an Organizer</Text>
            <Text style={[styles.upgradeDesc, { color: C.textSecondary }]}>Create events, sell tickets, track analytics</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={C.primary} />
        </Pressable>

        {/* Theme toggle */}
        <View style={[styles.themeCard, { backgroundColor: C.card, borderColor: C.border }]}>
          <View style={styles.themeRow}>
            <View style={[styles.themeIconBox, { backgroundColor: isDark ? '#1a2a4a' : '#f0f9ff' }]}>
              <Ionicons name={isDark ? 'moon' : 'sunny'} size={20} color={isDark ? '#60A5FA' : '#F59E0B'} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={[styles.themeLabel, { color: C.text }]}>{isDark ? 'Dark Mode' : 'Light Mode'}</Text>
              <Text style={[styles.themeDesc, { color: C.textMuted }]}>{isDark ? 'Switch to light theme' : 'Switch to dark theme'}</Text>
            </View>
            <Pressable onPress={toggleTheme} style={[styles.togglePill, { backgroundColor: isDark ? C.primary : C.border }]}>
              <View style={[styles.toggleKnob, { transform: [{ translateX: isDark ? 20 : 0 }] }]} />
            </Pressable>
          </View>
        </View>

        {/* Menu */}
        <View style={[styles.menuCard, { backgroundColor: C.card, borderColor: C.border }]}>
          {menuItems.map((item, i) => (
            <Pressable
              key={i}
              style={[styles.menuRow, i > 0 && { borderTopWidth: 1, borderTopColor: C.border }]}
              onPress={item.onPress}
            >
              <View style={[styles.menuIconBox, { backgroundColor: C.surface }]}>
                <Ionicons name={item.icon} size={18} color={C.textSecondary} />
              </View>
              <Text style={[styles.menuLabel, { color: C.text }]}>{item.label}</Text>
              <View style={styles.menuRight}>
                {item.value ? <Text style={[styles.menuValue, { color: C.textMuted }]}>{item.value}</Text> : null}
                <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
              </View>
            </Pressable>
          ))}
        </View>

        {/* Sign Out */}
        <Pressable
          style={[styles.signOutBtn, { backgroundColor: '#EF444415', borderColor: '#EF444430' }]}
          onPress={handleSignOut}
        >
          <Ionicons name="log-out-outline" size={18} color="#F87171" />
          <Text style={[styles.signOutText, { color: '#F87171' }]}>Sign Out</Text>
        </Pressable>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: C.textMuted }]}>Tick3t · Own Your Access</Text>
          <Text style={[styles.footerText, { color: C.textMuted }]}>v1.0.0 · NFT powered by TON · Payments by Paynow</Text>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  screenTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  editBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  editBtnText: { fontSize: 14, fontWeight: '600' },

  avatarSection: { alignItems: 'center', paddingVertical: 20 },
  avatarRing: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, padding: 4, marginBottom: 14 },
  avatar: { flex: 1, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  initials: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  editFields: { width: '100%', paddingHorizontal: 24, gap: 10 },
  editInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  userInfo: { alignItems: 'center' },
  userName: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3, marginBottom: 4 },
  userEmail: { fontSize: 14, marginBottom: 12 },
  roleBadgeRow: { flexDirection: 'row', gap: 8 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  roleBadgeText: { fontSize: 12, fontWeight: '700' },

  statsGrid: { flexDirection: 'row', marginHorizontal: 20, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 16, gap: 4 },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8 },

  upgradeBanner: { flexDirection: 'row', alignItems: 'center', gap: 14, margin: 20, borderRadius: 16, padding: 14, borderWidth: 1 },
  upgradeIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  upgradeTitle: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  upgradeDesc: { fontSize: 12 },

  themeCard: { marginHorizontal: 20, marginBottom: 14, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  themeRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  themeIconBox: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  themeLabel: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  themeDesc: { fontSize: 12 },
  togglePill: { width: 46, height: 26, borderRadius: 13, justifyContent: 'center', paddingHorizontal: 3 },
  toggleKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },

  menuCard: { marginHorizontal: 20, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  menuRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  menuIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '600' },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  menuValue: { fontSize: 13 },

  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 20, marginTop: 14, borderRadius: 16, borderWidth: 1, paddingVertical: 14 },
  signOutText: { fontSize: 15, fontWeight: '700' },

  footer: { alignItems: 'center', paddingTop: 20, gap: 6 },
  footerText: { fontSize: 11 },
});
