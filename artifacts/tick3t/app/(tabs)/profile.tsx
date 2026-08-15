import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, TextInput, Alert,
  Modal, KeyboardAvoidingView, Platform, Switch, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import AuthPrompt from '@/components/AuthPrompt';

// ── Shared bottom-sheet wrapper ───────────────────────────────────────────────

function BottomSheet({
  visible, onClose, title, children,
}: { visible: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const { colors: C } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1, justifyContent: 'flex-end' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={[bs.sheet, { backgroundColor: C.card, borderColor: C.border }]}>
          <View style={[bs.handle, { backgroundColor: C.border }]} />
          <View style={bs.sheetHeader}>
            <Text style={[bs.sheetTitle, { color: C.text }]}>{title}</Text>
            <Pressable onPress={onClose} style={[bs.closeBtn, { backgroundColor: C.surface }]}>
              <Ionicons name="close" size={18} color={C.textSecondary} />
            </Pressable>
          </View>
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const bs = StyleSheet.create({
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, paddingTop: 12, paddingHorizontal: 24, paddingBottom: 44 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.3 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});

// ── Main screen ───────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { colors: C, isDark, toggleTheme } = useTheme();
  const { user: authUser, signOut, isAuthenticated } = useAuth();
  const { tickets, updateUser, user, marketplace, listedTicketIds } = useApp();
  const router = useRouter();

  // Profile edit
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(authUser?.name ?? user?.name ?? '');
  const [email, setEmail] = useState(authUser?.email ?? user?.email ?? '');

  // Modal visibility
  const [paynowModal, setPaynowModal] = useState(false);
  const [walletModal, setWalletModal] = useState(false);
  const [notifModal, setNotifModal] = useState(false);
  const [securityModal, setSecurityModal] = useState(false);
  const [referModal, setReferModal] = useState(false);
  const [helpModal, setHelpModal] = useState(false);

  // Paynow form
  const [paynowPhone, setPaynowPhone] = useState('');
  const [paynowName, setPaynowName] = useState('');
  const [paynowEmail, setPaynowEmail] = useState('');
  const [paynowSaved, setPaynowSaved] = useState(false);

  // Wallet form
  const [walletAddress, setWalletAddress] = useState('');
  const [walletSaved, setWalletSaved] = useState(false);

  // Notifications
  const [notifEvents, setNotifEvents] = useState(true);
  const [notifResale, setNotifResale] = useState(true);
  const [notifTransfers, setNotifTransfers] = useState(true);
  const [notifMarketing, setNotifMarketing] = useState(false);

  // Security
  const [twoFA, setTwoFA] = useState(false);
  const [biometric, setBiometric] = useState(true);

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
  const totalSpent = tickets.reduce((s, t) => s + t.totalPaid, 0);
  const activeListings = [...listedTicketIds].length;
  const displayName = authUser?.name ?? user?.name ?? 'Guest';
  const displayEmail = authUser?.email ?? user?.email ?? '';
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
  const referralCode = `TICK3T-${(displayName.replace(/\s/g, '').toUpperCase().slice(0, 4) || 'USER')}-${Math.abs(displayName.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 9000) + 1000}`;

  const handleSave = () => { updateUser({ name, email }); setEditing(false); };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await signOut(); router.replace('/(auth)/sign-in'); } },
    ]);
  };

  const handleSavePaynow = () => {
    if (!paynowPhone.trim()) { Alert.alert('Required', 'Please enter your Paynow phone number.'); return; }
    setPaynowSaved(true);
    setTimeout(() => { setPaynowSaved(false); setPaynowModal(false); }, 1200);
  };

  const handleConnectWallet = () => {
    if (!walletAddress.trim().startsWith('EQ') && !walletAddress.trim().startsWith('UQ')) {
      Alert.alert('Invalid address', 'TON wallet addresses start with EQ… or UQ…');
      return;
    }
    setWalletSaved(true);
    setTimeout(() => { setWalletSaved(false); setWalletModal(false); }, 1200);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join Tick3t and get blockchain-verified NFT tickets! Use my referral code ${referralCode} for a bonus.\n\nhttps://tick3t.app/refer/${referralCode}`,
        title: 'Invite to Tick3t',
      });
    } catch { /* dismissed */ }
  };

  const menuItems = [
    {
      icon: 'ticket-outline' as const, label: 'My Tickets', value: `${tickets.length} total`,
      onPress: () => router.push('/(tabs)/vault'),
      chevronColor: C.primary,
    },
    {
      icon: 'cube-outline' as const, label: 'NFT Wallet',
      value: walletAddress ? walletAddress.slice(0, 8) + '…' : 'TON Blockchain',
      onPress: () => setWalletModal(true),
    },
    {
      icon: 'notifications-outline' as const, label: 'Notifications',
      value: [notifEvents, notifResale, notifTransfers, notifMarketing].filter(Boolean).length + ' active',
      onPress: () => setNotifModal(true),
    },
    {
      icon: 'shield-checkmark-outline' as const, label: 'Security',
      value: twoFA ? '2FA On' : 'Standard',
      onPress: () => setSecurityModal(true),
    },
    {
      icon: 'card-outline' as const, label: 'Paynow',
      value: paynowPhone ? paynowPhone : 'Not linked',
      onPress: () => setPaynowModal(true),
    },
    {
      icon: 'gift-outline' as const, label: 'Refer Friends',
      value: referralCode,
      onPress: () => setReferModal(true),
    },
    {
      icon: 'help-circle-outline' as const, label: 'Help & Support',
      value: '', onPress: () => setHelpModal(true),
    },
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
            { label: 'Listed', value: activeListings, icon: 'storefront-outline' as const },
          ].map((s, i) => (
            <Pressable
              key={i}
              style={[styles.statItem, i < 3 && { borderRightWidth: 1, borderRightColor: C.border }]}
              onPress={i === 0 || i === 1 ? () => router.push('/(tabs)/vault') : i === 2 ? () => router.push('/(tabs)/vault') : undefined}
            >
              <Ionicons name={s.icon} size={18} color={C.primary} />
              <Text style={[styles.statValue, { color: C.text }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: C.textMuted }]}>{s.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Spending summary */}
        {totalSpent > 0 && (
          <View style={[styles.spendCard, { backgroundColor: C.card, borderColor: C.border }]}>
            <View style={styles.spendRow}>
              <View style={[styles.spendIcon, { backgroundColor: C.primary + '20' }]}>
                <Ionicons name="trending-up-outline" size={18} color={C.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.spendLabel, { color: C.textMuted }]}>Total spent on events</Text>
                <Text style={[styles.spendValue, { color: C.text }]}>${totalSpent.toLocaleString()}</Text>
              </View>
              <Pressable onPress={() => router.push('/(tabs)/vault')}>
                <Text style={[styles.spendLink, { color: C.primary }]}>View Vault →</Text>
              </Pressable>
            </View>
          </View>
        )}

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
                {item.value ? <Text style={[styles.menuValue, { color: C.textMuted }]} numberOfLines={1}>{item.value}</Text> : null}
                <Ionicons name="chevron-forward" size={16} color={item.chevronColor ?? C.textMuted} />
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

      {/* ── Paynow Modal ─────────────────────────────────────────── */}
      <BottomSheet visible={paynowModal} onClose={() => setPaynowModal(false)} title="Link Paynow">
        <Text style={[styles.sheetDesc, { color: C.textMuted }]}>
          Add your Paynow details for faster ticket purchases and resale withdrawals.
        </Text>
        <View style={styles.formField}>
          <Text style={[styles.fieldLabel, { color: C.textSecondary }]}>Phone number</Text>
          <View style={[styles.fieldInput, { borderColor: C.border, backgroundColor: C.surface }]}>
            <Ionicons name="call-outline" size={16} color={C.textMuted} />
            <TextInput style={[styles.fieldText, { color: C.text }]} placeholder="e.g. 0771234567" placeholderTextColor={C.textMuted} value={paynowPhone} onChangeText={setPaynowPhone} keyboardType="phone-pad" />
          </View>
        </View>
        <View style={styles.formField}>
          <Text style={[styles.fieldLabel, { color: C.textSecondary }]}>Account holder name</Text>
          <View style={[styles.fieldInput, { borderColor: C.border, backgroundColor: C.surface }]}>
            <Ionicons name="person-outline" size={16} color={C.textMuted} />
            <TextInput style={[styles.fieldText, { color: C.text }]} placeholder="Your full name" placeholderTextColor={C.textMuted} value={paynowName} onChangeText={setPaynowName} />
          </View>
        </View>
        <View style={styles.formField}>
          <Text style={[styles.fieldLabel, { color: C.textSecondary }]}>Email (optional)</Text>
          <View style={[styles.fieldInput, { borderColor: C.border, backgroundColor: C.surface }]}>
            <Ionicons name="mail-outline" size={16} color={C.textMuted} />
            <TextInput style={[styles.fieldText, { color: C.text }]} placeholder="email@example.com" placeholderTextColor={C.textMuted} value={paynowEmail} onChangeText={setPaynowEmail} keyboardType="email-address" autoCapitalize="none" />
          </View>
        </View>
        <Text style={[styles.sheetNote, { color: C.textMuted }]}>
          Your payment details are encrypted and only used for ticket purchases and resale payouts.
        </Text>
        <Pressable
          style={[styles.sheetBtn, { backgroundColor: paynowSaved ? '#22c55e' : C.primary }]}
          onPress={handleSavePaynow}
        >
          {paynowSaved
            ? <><Ionicons name="checkmark-circle" size={18} color="#fff" /><Text style={styles.sheetBtnText}>Saved!</Text></>
            : <Text style={styles.sheetBtnText}>Save Payment Details</Text>
          }
        </Pressable>
      </BottomSheet>

      {/* ── NFT Wallet Modal ─────────────────────────────────────── */}
      <BottomSheet visible={walletModal} onClose={() => setWalletModal(false)} title="TON Wallet">
        <Text style={[styles.sheetDesc, { color: C.textMuted }]}>
          Connect your TON wallet to receive NFT tickets directly on-chain. Not required — tickets are also delivered to your Vault automatically.
        </Text>
        <View style={[styles.tonInfoRow, { backgroundColor: '#6366F115', borderColor: '#6366F140' }]}>
          <Ionicons name="cube-outline" size={20} color="#818CF8" />
          <Text style={[styles.tonInfoText, { color: '#818CF8' }]}>Every Tick3t ticket is an NFT on the TON blockchain, unique and non-duplicable.</Text>
        </View>
        <View style={styles.formField}>
          <Text style={[styles.fieldLabel, { color: C.textSecondary }]}>Wallet address</Text>
          <View style={[styles.fieldInput, { borderColor: C.border, backgroundColor: C.surface }]}>
            <Ionicons name="wallet-outline" size={16} color={C.textMuted} />
            <TextInput style={[styles.fieldText, { color: C.text }]} placeholder="EQx… or UQx…" placeholderTextColor={C.textMuted} value={walletAddress} onChangeText={setWalletAddress} autoCapitalize="none" autoCorrect={false} />
          </View>
        </View>
        <Pressable
          style={[styles.sheetBtn, { backgroundColor: walletSaved ? '#22c55e' : C.primary }]}
          onPress={handleConnectWallet}
        >
          {walletSaved
            ? <><Ionicons name="checkmark-circle" size={18} color="#fff" /><Text style={styles.sheetBtnText}>Connected!</Text></>
            : <><Ionicons name="link-outline" size={18} color="#fff" /><Text style={styles.sheetBtnText}>Connect Wallet</Text></>
          }
        </Pressable>
      </BottomSheet>

      {/* ── Notifications Modal ──────────────────────────────────── */}
      <BottomSheet visible={notifModal} onClose={() => setNotifModal(false)} title="Notifications">
        {[
          { label: 'Upcoming events', desc: 'Reminders before your events', value: notifEvents, setter: setNotifEvents },
          { label: 'Resale activity', desc: 'When your listings get offers or sell', value: notifResale, setter: setNotifResale },
          { label: 'Ticket transfers', desc: 'When tickets are sent or received', value: notifTransfers, setter: setNotifTransfers },
          { label: 'Promotions', desc: 'New events, deals, and announcements', value: notifMarketing, setter: setNotifMarketing },
        ].map((item, i) => (
          <View key={i} style={[styles.settingRow, i > 0 && { borderTopWidth: 1, borderTopColor: C.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: C.text }]}>{item.label}</Text>
              <Text style={[styles.settingDesc, { color: C.textMuted }]}>{item.desc}</Text>
            </View>
            <Switch
              value={item.value}
              onValueChange={item.setter}
              trackColor={{ false: C.border, true: C.primary + '88' }}
              thumbColor={item.value ? C.primary : C.textMuted}
            />
          </View>
        ))}
      </BottomSheet>

      {/* ── Security Modal ───────────────────────────────────────── */}
      <BottomSheet visible={securityModal} onClose={() => setSecurityModal(false)} title="Security">
        {[
          { label: 'Two-factor authentication', desc: 'Require a code when signing in', value: twoFA, setter: setTwoFA, accent: true },
          { label: 'Biometric unlock', desc: 'Use Face ID or fingerprint', value: biometric, setter: setBiometric, accent: false },
        ].map((item, i) => (
          <View key={i} style={[styles.settingRow, i > 0 && { borderTopWidth: 1, borderTopColor: C.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: C.text }]}>{item.label}</Text>
              <Text style={[styles.settingDesc, { color: C.textMuted }]}>{item.desc}</Text>
            </View>
            <Switch
              value={item.value}
              onValueChange={item.setter}
              trackColor={{ false: C.border, true: C.primary + '88' }}
              thumbColor={item.value ? C.primary : C.textMuted}
            />
          </View>
        ))}
        <Pressable
          style={[styles.settingRow, { borderTopWidth: 1, borderTopColor: C.border }]}
          onPress={() => Alert.alert('Change Password', 'A password reset link will be sent to ' + displayEmail)}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.settingLabel, { color: C.text }]}>Change password</Text>
            <Text style={[styles.settingDesc, { color: C.textMuted }]}>Send a reset link to your email</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
        </Pressable>
      </BottomSheet>

      {/* ── Refer Friends Modal ──────────────────────────────────── */}
      <BottomSheet visible={referModal} onClose={() => setReferModal(false)} title="Refer Friends">
        <Text style={[styles.sheetDesc, { color: C.textMuted }]}>
          Share your referral code with friends. When they buy their first ticket you both get a bonus.
        </Text>
        <View style={[styles.referCodeBox, { backgroundColor: C.surface, borderColor: C.primary + '44' }]}>
          <Text style={[styles.referCodeLabel, { color: C.textMuted }]}>Your referral code</Text>
          <Text style={[styles.referCode, { color: C.primary }]}>{referralCode}</Text>
        </View>
        <View style={styles.referPerks}>
          {['You get $10 off your next ticket', 'Your friend gets $5 off their first ticket', 'Bonus NFT badge for every 5 referrals'].map((perk, i) => (
            <View key={i} style={styles.referPerk}>
              <Ionicons name="checkmark-circle-outline" size={16} color={C.primary} />
              <Text style={[styles.referPerkText, { color: C.textSecondary }]}>{perk}</Text>
            </View>
          ))}
        </View>
        <Pressable style={[styles.sheetBtn, { backgroundColor: C.primary }]} onPress={handleShare}>
          <Ionicons name="share-outline" size={18} color="#fff" />
          <Text style={styles.sheetBtnText}>Share Referral Code</Text>
        </Pressable>
      </BottomSheet>

      {/* ── Help & Support Modal ─────────────────────────────────── */}
      <BottomSheet visible={helpModal} onClose={() => setHelpModal(false)} title="Help & Support">
        {[
          { icon: 'mail-outline' as const, title: 'Email Support', desc: 'support@tick3t.app', onPress: () => Alert.alert('Email us', 'Send your query to support@tick3t.app') },
          { icon: 'chatbubble-ellipses-outline' as const, title: 'Live Chat', desc: 'Avg. response < 2 minutes', onPress: () => Alert.alert('Live Chat', 'Live chat opens Mon–Fri 9am–6pm CAT.') },
          { icon: 'document-text-outline' as const, title: 'FAQs', desc: 'Browse common questions', onPress: () => Alert.alert('FAQs', 'How do I get my ticket?\n→ Tickets appear instantly in your Vault.\n\nHow do I resell a ticket?\n→ Tap "List for Resale" in your Vault.\n\nHow are tickets verified?\n→ Every ticket is an NFT on the TON blockchain.') },
          { icon: 'bug-outline' as const, title: 'Report a Bug', desc: 'Help us improve the app', onPress: () => Alert.alert('Report Bug', 'Please email bugs@tick3t.app with a description and your device model. Thank you!') },
        ].map((item, i) => (
          <Pressable
            key={i}
            style={[styles.helpRow, i > 0 && { borderTopWidth: 1, borderTopColor: C.border }]}
            onPress={item.onPress}
          >
            <View style={[styles.helpIcon, { backgroundColor: C.surface }]}>
              <Ionicons name={item.icon} size={18} color={C.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.helpTitle, { color: C.text }]}>{item.title}</Text>
              <Text style={[styles.helpDesc, { color: C.textMuted }]}>{item.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
          </Pressable>
        ))}
      </BottomSheet>
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
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 3 },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.8 },

  spendCard: { marginHorizontal: 20, marginTop: 12, borderRadius: 14, borderWidth: 1, padding: 14 },
  spendRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  spendIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  spendLabel: { fontSize: 11, marginBottom: 2 },
  spendValue: { fontSize: 18, fontWeight: '800' },
  spendLink: { fontSize: 13, fontWeight: '700' },

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
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: 120 },
  menuValue: { fontSize: 12, flex: 1, textAlign: 'right' },

  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 20, marginTop: 14, borderRadius: 16, borderWidth: 1, paddingVertical: 14 },
  signOutText: { fontSize: 15, fontWeight: '700' },

  footer: { alignItems: 'center', paddingTop: 20, gap: 6 },
  footerText: { fontSize: 11 },

  // Sheet content
  sheetDesc: { fontSize: 13, lineHeight: 19, marginBottom: 20 },
  sheetNote: { fontSize: 11, lineHeight: 17, marginBottom: 16 },
  formField: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' },
  fieldInput: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  fieldText: { flex: 1, fontSize: 15 },
  sheetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: 50, marginTop: 4 },
  sheetBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  tonInfoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 18 },
  tonInfoText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '600' },

  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  settingLabel: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  settingDesc: { fontSize: 12 },

  referCodeBox: { borderWidth: 1.5, borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16 },
  referCodeLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  referCode: { fontSize: 22, fontWeight: '900', letterSpacing: 2 },
  referPerks: { gap: 10, marginBottom: 20 },
  referPerk: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  referPerkText: { fontSize: 13, flex: 1 },

  helpRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  helpIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  helpTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  helpDesc: { fontSize: 12 },
});
