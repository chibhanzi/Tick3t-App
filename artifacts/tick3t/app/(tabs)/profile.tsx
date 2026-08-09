import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, TextInput,
  SafeAreaView, Alert,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { useApp } from '@/context/AppContext';

export default function ProfileScreen() {
  const C = Colors.dark;
  const { user, tickets, updateUser } = useApp();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');

  const upcoming = tickets.filter(t => t.status === 'upcoming').length;
  const past = tickets.filter(t => t.status === 'past').length;
  const initials = (user?.name ?? 'G').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const handleSave = () => {
    updateUser({ name, email });
    setEditing(false);
  };

  const menuItems = [
    { icon: '🎟', label: 'My Tickets', value: `${tickets.length} total`, onPress: () => {} },
    { icon: '⬡', label: 'NFT Wallet', value: 'TON Blockchain', onPress: () => Alert.alert('NFT Wallet', 'Connect your TON wallet to manage NFT tickets.\n\nWallet integration coming soon.') },
    { icon: '🔔', label: 'Notifications', value: 'On', onPress: () => Alert.alert('Notifications', 'Manage your notification preferences.') },
    { icon: '🔒', label: 'Security', value: '', onPress: () => Alert.alert('Security', 'Two-factor authentication and account security settings.') },
    { icon: '📱', label: 'Paynow', value: 'Not linked', onPress: () => Alert.alert('Paynow', 'Link your Paynow account for secure, seamless payments.') },
    { icon: '🏷', label: 'Refer Friends', value: '', onPress: () => Alert.alert('Referrals', 'Share your referral code to earn free tickets!') },
    { icon: '⚙️', label: 'Settings', value: '', onPress: () => {} },
    { icon: '❓', label: 'Help & Support', value: '', onPress: () => Alert.alert('Support', 'Contact us at support@tick3rt.com') },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
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
          <View style={[styles.avatar, { backgroundColor: C.primary + '33', borderColor: C.primary }]}>
            <Text style={[styles.initials, { color: C.primary }]}>{initials}</Text>
          </View>
          {editing ? (
            <View style={styles.editFields}>
              <TextInput
                style={[styles.editInput, { color: C.text, borderColor: C.border, backgroundColor: C.card }]}
                value={name}
                onChangeText={setName}
                placeholder="Display name"
                placeholderTextColor={C.textMuted}
              />
              <TextInput
                style={[styles.editInput, { color: C.text, borderColor: C.border, backgroundColor: C.card }]}
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor={C.textMuted}
                keyboardType="email-address"
              />
            </View>
          ) : (
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: C.text }]}>{user?.name}</Text>
              <Text style={[styles.userEmail, { color: C.textSecondary }]}>{user?.email}</Text>
              <View style={styles.roleBadgeRow}>
                <View style={[styles.roleBadge, { backgroundColor: C.primary + '22', borderColor: C.primary + '44' }]}>
                  <Text style={[styles.roleBadgeText, { color: C.primary }]}>🎫 Attendee</Text>
                </View>
                {user?.isVerified && (
                  <View style={[styles.roleBadge, { backgroundColor: '#6366F122', borderColor: '#6366F144' }]}>
                    <Text style={[styles.roleBadgeText, { color: '#818CF8' }]}>✓ Verified</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={[styles.statsGrid, { backgroundColor: C.card, borderColor: C.border }]}>
          {[
            { label: 'Upcoming', value: upcoming, icon: '🎟' },
            { label: 'Attended', value: past, icon: '✓' },
            { label: 'NFT Keys', value: tickets.filter(t => t.isNFT).length, icon: '⬡' },
          ].map((s, i) => (
            <View key={i} style={[styles.statItem, i < 2 && { borderRightWidth: 1, borderRightColor: C.border }]}>
              <Text style={styles.statIcon}>{s.icon}</Text>
              <Text style={[styles.statValue, { color: C.text }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: C.textMuted }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Upgrade banner */}
        <Pressable
          style={[styles.upgradeBanner, { backgroundColor: C.primary + '15', borderColor: C.primary + '40' }]}
          onPress={() => Alert.alert('Become an Organizer', 'Create and manage your own events on Tick3rt.\n\nOrganizer upgrade coming soon!')}
        >
          <View>
            <Text style={[styles.upgradeTitle, { color: C.primary }]}>Become an Organizer</Text>
            <Text style={[styles.upgradeDesc, { color: C.textSecondary }]}>Create events, sell tickets, track analytics</Text>
          </View>
          <Text style={[styles.upgradeArrow, { color: C.primary }]}>→</Text>
        </Pressable>

        {/* Menu */}
        <View style={[styles.menuCard, { backgroundColor: C.card, borderColor: C.border }]}>
          {menuItems.map((item, i) => (
            <Pressable
              key={i}
              style={[styles.menuRow, i > 0 && { borderTopWidth: 1, borderTopColor: C.border }]}
              onPress={item.onPress}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={[styles.menuLabel, { color: C.text }]}>{item.label}</Text>
              <View style={styles.menuRight}>
                {item.value ? <Text style={[styles.menuValue, { color: C.textMuted }]}>{item.value}</Text> : null}
                <Text style={[styles.menuArrow, { color: C.textMuted }]}>›</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: C.textMuted }]}>Tick3rt · Digital Event Key Platform</Text>
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

  avatarSection: { alignItems: 'center', paddingVertical: 24 },
  avatar: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', borderWidth: 3, marginBottom: 16 },
  initials: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  editFields: { width: '100%', paddingHorizontal: 24, gap: 10 },
  editInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  userInfo: { alignItems: 'center' },
  userName: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3, marginBottom: 4 },
  userEmail: { fontSize: 14, marginBottom: 12 },
  roleBadgeRow: { flexDirection: 'row', gap: 8 },
  roleBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  roleBadgeText: { fontSize: 12, fontWeight: '700' },

  statsGrid: { flexDirection: 'row', marginHorizontal: 20, borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 16, gap: 3 },
  statIcon: { fontSize: 20 },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8 },

  upgradeBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', margin: 20, borderRadius: 14, padding: 16, borderWidth: 1 },
  upgradeTitle: { fontSize: 15, fontWeight: '800', marginBottom: 3 },
  upgradeDesc: { fontSize: 12 },
  upgradeArrow: { fontSize: 22, fontWeight: '700' },

  menuCard: { marginHorizontal: 20, borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  menuRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  menuIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '600' },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  menuValue: { fontSize: 13 },
  menuArrow: { fontSize: 20 },

  footer: { alignItems: 'center', paddingTop: 24, gap: 4 },
  footerText: { fontSize: 11 },
});
