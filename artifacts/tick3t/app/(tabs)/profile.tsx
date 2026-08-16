import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, TextInput, Alert,
  Modal, KeyboardAvoidingView, Platform, Switch, Share, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useApp, MOCK_ORGANIZERS, MOCK_SOCIAL_FRIENDS } from '@/context/AppContext';
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

// ── Buzzing avatar for ongoing events ────────────────────────────────────────

function BuzzingRing({ color, initials }: { color: string; initials: string }) {
  const [pulse] = useState(() => new Animated.Value(1));

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.3, duration: 600, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: false }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  return (
    <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{
        position: 'absolute', width: 44, height: 44, borderRadius: 22,
        borderWidth: 2.5, borderColor: color,
        opacity: pulse.interpolate({ inputRange: [1, 1.3], outputRange: [0.85, 0] }),
        transform: [{ scale: pulse.interpolate({ inputRange: [1, 1.3], outputRange: [1, 1.3] }) }],
      }} />
      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: color + '28',
        alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: color }}>
        <Text style={{ color, fontSize: 13, fontWeight: '900' }}>{initials}</Text>
      </View>
    </View>
  );
}

// ── Date helpers ─────────────────────────────────────────────────────────────

function parseDateStr(s: string): Date {
  const d = new Date(s); d.setHours(0, 0, 0, 0); return d;
}
function todayDate(): Date {
  const d = new Date(); d.setHours(0, 0, 0, 0); return d;
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { colors: C, isDark, toggleTheme } = useTheme();
  const { user: authUser, signOut, isAuthenticated } = useAuth();
  const { events, tickets, updateUser, user, marketplace, listedTicketIds, followedOrganizers, toggleFollowOrganizer, connectedSocials, connectSocial, disconnectSocial, getOrganizerEvents, primarySocial, setPrimarySocial, notifPrefs, setNotifPrefs } = useApp();
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
  const [socialModal, setSocialModal] = useState<string | null>(null);
  const [socialHandle, setSocialHandle] = useState('');
  const [activeOrgSheet, setActiveOrgSheet] = useState<string | null>(null);
  const [settingsModal, setSettingsModal] = useState(false);
  const [expandedFriend, setExpandedFriend] = useState<string | null>(null);

  // Paynow form
  const [paynowPhone, setPaynowPhone] = useState('');
  const [paynowName, setPaynowName] = useState('');
  const [paynowEmail, setPaynowEmail] = useState('');
  const [paynowSaved, setPaynowSaved] = useState(false);

  // Wallet form
  const [walletAddress, setWalletAddress] = useState('');
  const [walletSaved, setWalletSaved] = useState(false);

  // Notifications — prefs live in AppContext for cross-screen access

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
      value: Object.values(notifPrefs).filter(Boolean).length + ' active',
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
          <View style={styles.headerRight}>
            <Pressable
              style={[styles.cogBtn, { borderColor: C.border, backgroundColor: C.card }]}
              onPress={() => setSettingsModal(true)}
            >
              <Ionicons name="settings-outline" size={18} color={C.textSecondary} />
            </Pressable>
            <Pressable
              style={[styles.editBtn, { borderColor: C.border }]}
              onPress={() => editing ? handleSave() : setEditing(true)}
            >
              <Text style={[styles.editBtnText, { color: editing ? C.primary : C.textSecondary }]}>
                {editing ? 'Save' : 'Edit'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Avatar + info */}
        {(() => {
          const BRAND: Record<string, { color: string; bg: string; label: string; ionicon?: string }> = {
            instagram: { color: '#E1306C', bg: '#E1306C22', label: 'Instagram', ionicon: 'logo-instagram' },
            twitter:   { color: '#1A8CD8', bg: '#1A8CD822', label: 'X / Twitter' },
          };
          const active = primarySocial && connectedSocials[primarySocial] ? primarySocial : null;
          const brand = active ? BRAND[active] : null;
          const ringColor  = brand ? brand.color : C.primary;
          const avatarBg   = brand ? brand.bg    : C.primary + '22';
          const accentText = brand ? brand.color  : C.primary;
          const socialHandle = active ? '@' + connectedSocials[active] : null;

          return (
            <View style={styles.avatarSection}>
              <View style={{ position: 'relative' }}>
                <View style={[styles.avatarRing, { borderColor: ringColor + '70' }]}>
                  <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
                    {brand?.ionicon
                      ? <Ionicons name={brand.ionicon as any} size={34} color={brand.color} />
                      : brand
                        ? <Text style={{ fontSize: 28, fontWeight: '900', color: brand.color }}>𝕏</Text>
                        : <Text style={[styles.initials, { color: C.primary }]}>{initials}</Text>
                    }
                  </View>
                </View>
                {brand && (
                  <View style={[styles.socialBadge, { backgroundColor: brand.color, borderColor: C.card }]}>
                    {brand.ionicon
                      ? <Ionicons name={brand.ionicon as any} size={11} color="#fff" />
                      : <Text style={{ fontSize: 10, fontWeight: '900', color: '#fff' }}>𝕏</Text>
                    }
                  </View>
                )}
              </View>
              {editing ? (
                <View style={styles.editFields}>
                  <TextInput style={[styles.editInput, { color: C.text, borderColor: C.border, backgroundColor: C.card }]} value={name} onChangeText={setName} placeholder="Display name" placeholderTextColor={C.textMuted} />
                  <TextInput style={[styles.editInput, { color: C.text, borderColor: C.border, backgroundColor: C.card }]} value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor={C.textMuted} keyboardType="email-address" />
                </View>
              ) : (
                <View style={styles.userInfo}>
                  <Text style={[styles.userName, { color: C.text }]}>{displayName}</Text>
                  {socialHandle
                    ? <Text style={[styles.userEmail, { color: accentText, fontWeight: '700' }]}>{socialHandle}</Text>
                    : <Text style={[styles.userEmail, { color: C.textSecondary }]}>{displayEmail}</Text>
                  }
                  <View style={styles.roleBadgeRow}>
                    <View style={[styles.roleBadge, { backgroundColor: C.primary + '22', borderColor: C.primary + '44' }]}>
                      <Ionicons name="ticket-outline" size={11} color={C.primary} />
                      <Text style={[styles.roleBadgeText, { color: C.primary }]}>Attendee</Text>
                    </View>
                    {brand && (
                      <View style={[styles.roleBadge, { backgroundColor: brand.color + '22', borderColor: brand.color + '44' }]}>
                        {brand.ionicon
                          ? <Ionicons name={brand.ionicon as any} size={11} color={brand.color} />
                          : <Text style={{ fontSize: 11, color: brand.color, fontWeight: '900' }}>𝕏</Text>
                        }
                        <Text style={[styles.roleBadgeText, { color: brand.color }]}>{brand.label}</Text>
                      </View>
                    )}
                    <View style={[styles.roleBadge, { backgroundColor: '#6366F122', borderColor: '#6366F144' }]}>
                      <Ionicons name="cube-outline" size={11} color="#818CF8" />
                      <Text style={[styles.roleBadgeText, { color: '#818CF8' }]}>NFT Member</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          );
        })()}

        {/* Following — Instagram/X stories row */}
        {followedOrganizers.size > 0 && (
          <View style={styles.followingSection}>
            <View style={styles.followingHeader}>
              <Text style={[styles.followingTitle, { color: C.text }]}>Following</Text>
              <Text style={[styles.followingCount, { color: C.textMuted }]}>{followedOrganizers.size} organizer{followedOrganizers.size !== 1 ? 's' : ''}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesRow}>
              {[...followedOrganizers].map(name => {
                const org = MOCK_ORGANIZERS[name];
                const color = org?.color ?? C.primary;
                const initials = name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
                const shortName = name.split(' ')[0];
                return (
                  <Pressable
                    key={name}
                    style={styles.storyItem}
                    onPress={() => setActiveOrgSheet(name)}
                  >
                    <View style={[styles.storyRing, { borderColor: color }]}>
                      <View style={[styles.storyAvatar, { backgroundColor: color + '25' }]}>
                        <Text style={[styles.storyInitials, { color }]}>{initials}</Text>
                      </View>
                    </View>
                    <Text style={[styles.storyName, { color: C.textSecondary }]} numberOfLines={1}>{shortName}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Party Animals */}
        {(() => {
          const today = todayDate().getTime();

          const friendsWithMeta = MOCK_SOCIAL_FRIENDS.map(friend => {
            const friendEvents = friend.attendingEventIds
              .map(eid => events.find(e => e.id === eid))
              .filter(Boolean) as typeof events;
            const dates = friendEvents.map(ev => parseDateStr(ev.date).getTime());
            const isLive = dates.some(d => d === today);
            const earliest = dates.length ? Math.min(...dates) : Infinity;
            return { friend, friendEvents, isLive, earliest };
          }).sort((a, b) => {
            if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
            return a.earliest - b.earliest;
          });

          return (
            <View style={styles.partySection}>
              <View style={styles.partyHeader}>
                <Text style={[styles.partyTitle, { color: C.text }]}>Party Animals 🎉</Text>
                <Text style={[styles.partySub, { color: C.textMuted }]}>Your circle, their plans</Text>
              </View>
              <View style={styles.partyFeed}>
                {friendsWithMeta.map(({ friend, friendEvents, isLive }) => {
                  const isExpanded = expandedFriend === friend.id;
                  return (
                    <View key={friend.id}>
                      <Pressable
                        style={[
                          styles.partyRow,
                          { backgroundColor: C.card, borderColor: isLive ? friend.color + '55' : C.border },
                          isLive && { borderWidth: 1.5 },
                        ]}
                        onPress={() => setExpandedFriend(isExpanded ? null : friend.id)}
                      >
                        {isLive
                          ? <BuzzingRing color={friend.color} initials={friend.initials} />
                          : (
                            <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: friend.color + '22',
                                alignItems: 'center', justifyContent: 'center' }}>
                                <Text style={{ color: friend.color, fontSize: 13, fontWeight: '900' }}>{friend.initials}</Text>
                              </View>
                            </View>
                          )
                        }
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={[styles.partyFriendName, { color: C.text }]}>{friend.name}</Text>
                            {isLive && (
                              <View style={[styles.partyLiveChip, { backgroundColor: friend.color + '22', borderColor: friend.color + '55' }]}>
                                <Text style={[styles.partyLiveText, { color: friend.color }]}>● LIVE</Text>
                              </View>
                            )}
                          </View>
                          <Text style={[styles.partyHandle, { color: C.textMuted }]}>{friend.handle}</Text>
                        </View>
                        <View style={[styles.partyCountChip, { backgroundColor: C.surface, borderColor: C.border }]}>
                          <Text style={[styles.partyCountText, { color: C.textSecondary }]}>
                            {friendEvents.length} {friendEvents.length === 1 ? 'event' : 'events'}
                          </Text>
                        </View>
                        <Ionicons
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={16}
                          color={C.textMuted}
                        />
                      </Pressable>

                      {isExpanded && (
                        <View style={styles.partyExpanded}>
                          {/* Events */}
                          {friendEvents.map(ev => {
                            const evDate = parseDateStr(ev.date).getTime();
                            const isEvLive = evDate === today;
                            return (
                              <Pressable
                                key={ev.id}
                                style={[styles.partyEventRow, { backgroundColor: C.surface, borderColor: C.border }]}
                                onPress={() => router.push(`/event/${ev.id}` as never)}
                              >
                                <Ionicons name="ticket-outline" size={14} color={friend.color} />
                                <Text style={[styles.partyEventTitle, { color: C.text }]} numberOfLines={1}>{ev.title}</Text>
                                {isEvLive ? (
                                  <View style={[styles.partyLiveChip, { backgroundColor: friend.color + '22', borderColor: friend.color + '55' }]}>
                                    <Text style={[styles.partyLiveText, { color: friend.color }]}>NOW</Text>
                                  </View>
                                ) : (
                                  <View style={[styles.partyDateChip, { backgroundColor: C.card, borderColor: C.border }]}>
                                    <Text style={[styles.partyDateText, { color: C.textMuted }]}>
                                      {ev.date.split(',')[0].split(' ').slice(0, 2).join(' ')}
                                    </Text>
                                  </View>
                                )}
                                <Ionicons name="chevron-forward" size={13} color={C.textMuted} />
                              </Pressable>
                            );
                          })}
                          {/* Socials */}
                          {friend.socials.length > 0 && (
                            <View style={[styles.partySocialsRow, { borderColor: C.border }]}>
                              <Ionicons name="share-social-outline" size={13} color={C.textMuted} />
                              <Text style={[styles.partySocialsLabel, { color: C.textMuted }]}>Find on</Text>
                              {friend.socials.map(s => {
                                const igColor = '#E1306C';
                                const twColor = '#1A8CD8';
                                const col = s.platform === 'instagram' ? igColor : twColor;
                                return (
                                  <View
                                    key={s.platform}
                                    style={[styles.partySocialChip, { backgroundColor: col + '18', borderColor: col + '44' }]}
                                  >
                                    {s.platform === 'instagram'
                                      ? <Ionicons name="logo-instagram" size={11} color={col} />
                                      : <Text style={{ fontSize: 10, color: col, fontWeight: '900', lineHeight: 13 }}>𝕏</Text>
                                    }
                                    <Text style={[styles.partySocialHandle, { color: col }]}>@{s.handle}</Text>
                                  </View>
                                );
                              })}
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })()}

        {/* Social connect modal */}
        {socialModal !== null && (
          <BottomSheet
            visible
            onClose={() => { setSocialModal(null); setSocialHandle(''); }}
            title={`Connect ${socialModal === 'instagram' ? 'Instagram' : 'X (Twitter)'}`}
          >
            <Text style={[styles.sheetDesc, { color: C.textMuted }]}>
              Enter your @handle so we can surface when people you follow also attend events. We never post on your behalf.
            </Text>
            <View style={styles.formField}>
              <Text style={[styles.fieldLabel, { color: C.textSecondary }]}>Your handle</Text>
              <View style={[styles.fieldInput, { borderColor: C.border, backgroundColor: C.surface }]}>
                <Text style={{ color: C.textMuted, fontSize: 14, paddingRight: 2 }}>@</Text>
                <TextInput
                  style={[styles.fieldText, { color: C.text }]}
                  placeholder={socialModal === 'instagram' ? 'yourhandle' : 'yourhandle'}
                  placeholderTextColor={C.textMuted}
                  value={socialHandle}
                  onChangeText={setSocialHandle}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>
            <Pressable
              style={[styles.sheetBtn, { backgroundColor: C.primary, opacity: socialHandle.trim() ? 1 : 0.45 }]}
              onPress={() => {
                if (!socialHandle.trim()) return;
                connectSocial(socialModal!, '@' + socialHandle.replace('@', '').trim());
                setSocialModal(null);
                setSocialHandle('');
              }}
            >
              <Text style={styles.sheetBtnText}>Connect Account</Text>
            </Pressable>
          </BottomSheet>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Organizer detail sheet ───────────────────────────────── */}
      {activeOrgSheet !== null && (() => {
        const org = MOCK_ORGANIZERS[activeOrgSheet];
        const color = org?.color ?? C.primary;
        const initials = activeOrgSheet.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
        const isFollowing = followedOrganizers.has(activeOrgSheet);
        const orgEvents = getOrganizerEvents(activeOrgSheet).slice(0, 4);
        return (
          <Modal visible transparent animationType="slide" onRequestClose={() => setActiveOrgSheet(null)}>
            <KeyboardAvoidingView style={{ flex: 1, justifyContent: 'flex-end' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setActiveOrgSheet(null)} />
              <View style={[bs.sheet, { backgroundColor: C.card, borderColor: C.border, maxHeight: '82%' }]}>
                <View style={[bs.handle, { backgroundColor: C.border }]} />
                {/* Organizer header */}
                <View style={[styles.orgSheetHeader, { borderColor: color + '33', backgroundColor: color + '0C' }]}>
                  <View style={[styles.orgSheetAvatar, { backgroundColor: color + '22', borderColor: color }]}>
                    <Text style={[styles.orgSheetInitials, { color }]}>{initials}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.orgSheetName, { color: C.text }]} numberOfLines={1}>{activeOrgSheet}</Text>
                      <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                    </View>
                    <Text style={[styles.orgSheetStats, { color: C.textMuted }]}>
                      {org ? `${(org.followerCount / 1000).toFixed(1)}k followers · ${org.eventCount} events` : 'Organizer'}
                    </Text>
                  </View>
                  <Pressable
                    style={[styles.orgSheetFollowBtn, isFollowing
                      ? { backgroundColor: '#22c55e15', borderColor: '#22c55e55' }
                      : { backgroundColor: color + '18', borderColor: color + '66' }]}
                    onPress={() => toggleFollowOrganizer(activeOrgSheet)}
                  >
                    <Ionicons name={isFollowing ? 'checkmark' : 'add'} size={14} color={isFollowing ? '#22c55e' : color} />
                    <Text style={[styles.orgSheetFollowText, { color: isFollowing ? '#22c55e' : color }]}>
                      {isFollowing ? 'Following' : 'Follow'}
                    </Text>
                  </Pressable>
                </View>
                <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 4 }}>
                  {org?.bio && (
                    <Text style={[styles.orgSheetBio, { color: C.textSecondary }]}>{org.bio}</Text>
                  )}
                  {orgEvents.length > 0 && (
                    <View style={styles.orgSheetEventsSection}>
                      <Text style={[styles.orgSheetSectionTitle, { color: C.textMuted }]}>Upcoming Events</Text>
                      {orgEvents.map(ev => (
                        <Pressable
                          key={ev.id}
                          style={[styles.orgSheetEventRow, { backgroundColor: C.surface, borderColor: C.border }]}
                          onPress={() => { setActiveOrgSheet(null); router.push(`/event/${ev.id}` as never); }}
                        >
                          <View style={[styles.orgSheetEventDot, { backgroundColor: color }]} />
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.orgSheetEventName, { color: C.text }]} numberOfLines={1}>{ev.name}</Text>
                            <Text style={[styles.orgSheetEventMeta, { color: C.textMuted }]} numberOfLines={1}>
                              {ev.date} · {ev.location.split(',')[0]}
                            </Text>
                          </View>
                          <Text style={[styles.orgSheetEventPrice, { color: C.primary }]}>${ev.tiers[0]?.price ?? '?'}</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                  {isFollowing && (
                    <Pressable
                      style={[styles.orgSheetUnfollow, { borderColor: '#EF444430' }]}
                      onPress={() => { toggleFollowOrganizer(activeOrgSheet); setActiveOrgSheet(null); }}
                    >
                      <Ionicons name="person-remove-outline" size={16} color="#F87171" />
                      <Text style={styles.orgSheetUnfollowText}>Unfollow Organizer</Text>
                    </Pressable>
                  )}
                  <View style={{ height: 20 }} />
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </Modal>
        );
      })()}

      {/* ── Settings sheet ────────────────────────────────────────── */}
      {settingsModal && (
        <Modal visible transparent animationType="slide" onRequestClose={() => setSettingsModal(false)}>
          <KeyboardAvoidingView style={{ flex: 1, justifyContent: 'flex-end' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setSettingsModal(false)} />
            <View style={[bs.sheet, { backgroundColor: C.card, borderColor: C.border, maxHeight: '90%' }]}>
              <View style={[bs.handle, { backgroundColor: C.border }]} />
              <View style={bs.sheetHeader}>
                <Text style={[bs.sheetTitle, { color: C.text }]}>Settings</Text>
                <Pressable onPress={() => setSettingsModal(false)} style={[bs.closeBtn, { backgroundColor: C.surface }]}>
                  <Ionicons name="close" size={18} color={C.textSecondary} />
                </Pressable>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Theme */}
                <View style={[styles.themeCard, { backgroundColor: C.surface, borderColor: C.border, marginHorizontal: 0, marginBottom: 0 }]}>
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
                {/* Connected Socials */}
                <View style={[styles.socialCard, { backgroundColor: C.surface, borderColor: C.border, marginHorizontal: 0, marginTop: 14 }]}>
                  <View style={styles.socialCardHeader}>
                    <Text style={[styles.socialCardTitle, { color: C.text }]}>Connected Socials</Text>
                    <Text style={[styles.socialCardSubtitle, { color: C.textMuted }]}>Primary platform sets your profile look</Text>
                  </View>
                  {([
                    { platform: 'instagram', icon: '📸', label: 'Instagram', color: '#E1306C' },
                    { platform: 'twitter', icon: '𝕏', label: 'X (Twitter)', color: '#1DA1F2' },
                  ] as const).map((s, i) => {
                    const connected = !!connectedSocials[s.platform];
                    const isPrimary = primarySocial === s.platform;
                    return (
                      <View key={s.platform} style={[styles.socialRow, i > 0 && { borderTopWidth: 1, borderTopColor: C.border }]}>
                        <View style={[styles.socialIconBox, { backgroundColor: s.color + '18' }]}>
                          <Text style={styles.socialIconText}>{s.icon}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={[styles.socialLabel, { color: C.text }]}>{s.label}</Text>
                            {isPrimary && (
                              <View style={[styles.primaryChip, { backgroundColor: s.color + '22', borderColor: s.color + '55' }]}>
                                <Text style={[styles.primaryChipText, { color: s.color }]}>Primary</Text>
                              </View>
                            )}
                          </View>
                          <Text style={[styles.socialHandleText, { color: connected ? s.color : C.textMuted }]}>
                            {connected ? '@' + connectedSocials[s.platform] : 'Not connected'}
                          </Text>
                        </View>
                        <View style={{ gap: 6 }}>
                          {connected && (
                            <Pressable
                              onPress={() => setPrimarySocial(isPrimary ? null : s.platform)}
                              style={[styles.primaryBtn, isPrimary
                                ? { backgroundColor: s.color + '22', borderColor: s.color + '55' }
                                : { backgroundColor: C.card, borderColor: C.border }]}
                            >
                              <Text style={[styles.primaryBtnText, { color: isPrimary ? s.color : C.textMuted }]}>
                                {isPrimary ? '★ Primary' : '☆ Set Primary'}
                              </Text>
                            </Pressable>
                          )}
                          {connected ? (
                            <Pressable onPress={() => disconnectSocial(s.platform)} style={styles.socialDisconnect}>
                              <Text style={styles.socialDisconnectText}>Disconnect</Text>
                            </Pressable>
                          ) : (
                            <Pressable
                              onPress={() => { setSocialModal(s.platform); setSocialHandle(''); setSettingsModal(false); }}
                              style={[styles.socialConnect, { backgroundColor: s.color + '18', borderColor: s.color + '44' }]}
                            >
                              <Text style={[styles.socialConnectText, { color: s.color }]}>Connect</Text>
                            </Pressable>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
                {/* Menu items */}
                <View style={[styles.menuCard, { backgroundColor: C.surface, borderColor: C.border, marginHorizontal: 0, marginTop: 14 }]}>
                  {menuItems.map((item, i) => (
                    <Pressable
                      key={i}
                      style={[styles.menuRow, i > 0 && { borderTopWidth: 1, borderTopColor: C.border }]}
                      onPress={() => { setSettingsModal(false); item.onPress(); }}
                    >
                      <View style={[styles.menuIconBox, { backgroundColor: C.card }]}>
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
                {/* Become Organizer */}
                <Pressable
                  style={[styles.upgradeBanner, { backgroundColor: C.primary + '12', borderColor: C.primary + '35', marginTop: 14 }]}
                  onPress={() => { setSettingsModal(false); Alert.alert('Become an Organizer', 'Create and manage your own events on Tick3t.\n\nOrganizer upgrade coming soon!'); }}
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
                {/* Sign out */}
                <Pressable
                  style={[styles.signOutBtn, { backgroundColor: '#EF444415', borderColor: '#EF444430', marginHorizontal: 0, marginTop: 14 }]}
                  onPress={() => { setSettingsModal(false); handleSignOut(); }}
                >
                  <Ionicons name="log-out-outline" size={18} color="#F87171" />
                  <Text style={[styles.signOutText, { color: '#F87171' }]}>Sign Out</Text>
                </Pressable>
                {/* Footer */}
                <View style={[styles.footer, { paddingTop: 16 }]}>
                  <Text style={[styles.footerText, { color: C.textMuted }]}>Tick3t · Own Your Access</Text>
                  <Text style={[styles.footerText, { color: C.textMuted }]}>v1.0.0 · NFT powered by TON · Payments by Paynow</Text>
                </View>
                <View style={{ height: 20 }} />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}

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
        {([
          { label: 'Upcoming events', desc: 'Reminders before your events', key: 'events' as const },
          { label: 'Resale activity', desc: 'When your listings get offers or sell', key: 'resale' as const },
          { label: 'Ticket transfers', desc: 'When tickets are sent or received', key: 'transfers' as const },
          { label: 'Promotions', desc: 'New events, deals, and announcements', key: 'marketing' as const },
        ]).map((item, i) => (
          <View key={i} style={[styles.settingRow, i > 0 && { borderTopWidth: 1, borderTopColor: C.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: C.text }]}>{item.label}</Text>
              <Text style={[styles.settingDesc, { color: C.textMuted }]}>{item.desc}</Text>
            </View>
            <Switch
              value={notifPrefs[item.key]}
              onValueChange={v => setNotifPrefs({ [item.key]: v })}
              trackColor={{ false: C.border, true: C.primary + '88' }}
              thumbColor={notifPrefs[item.key] ? C.primary : C.textMuted}
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
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cogBtn: { width: 36, height: 36, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  editBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  editBtnText: { fontSize: 14, fontWeight: '600' },

  // Organizer sheet
  orgSheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1 },
  orgSheetAvatar: { width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  orgSheetInitials: { fontSize: 18, fontWeight: '900' },
  orgSheetName: { fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
  orgSheetStats: { fontSize: 12, marginTop: 2 },
  orgSheetFollowBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  orgSheetFollowText: { fontSize: 13, fontWeight: '700' },
  orgSheetBio: { fontSize: 14, lineHeight: 21, marginTop: 14, marginBottom: 20 },
  orgSheetEventsSection: { marginBottom: 18 },
  orgSheetSectionTitle: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  orgSheetEventRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  orgSheetEventDot: { width: 8, height: 32, borderRadius: 4 },
  orgSheetEventName: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  orgSheetEventMeta: { fontSize: 11 },
  orgSheetEventPrice: { fontSize: 14, fontWeight: '800' },
  orgSheetUnfollow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderRadius: 16, paddingVertical: 13, marginBottom: 4 },
  orgSheetUnfollowText: { fontSize: 14, fontWeight: '700', color: '#F87171' },

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

  // Party Animals
  partySection: { marginHorizontal: 20, marginTop: 14 },
  partyHeader: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 14 },
  partyTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
  partySub: { fontSize: 12 },
  partyFeed: { gap: 8 },
  partyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1 },
  partyFriendName: { fontSize: 14, fontWeight: '800', letterSpacing: -0.1 },
  partyHandle: { fontSize: 12, marginTop: 1 },
  partyLiveChip: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, borderWidth: 1 },
  partyLiveText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  partyCountChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  partyCountText: { fontSize: 11, fontWeight: '600' },
  partyExpanded: { marginTop: 4, marginLeft: 18, gap: 4, marginBottom: 4 },
  partyEventRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 9, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1 },
  partyEventTitle: { flex: 1, fontSize: 13, fontWeight: '600' },
  partyDateChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  partyDateText: { fontSize: 10, fontWeight: '600' },

  // Avatar social badge
  socialBadge: { position: 'absolute', bottom: 2, right: 2, width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },

  // Primary social chips & buttons (Settings sheet)
  primaryChip: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, borderWidth: 1 },
  primaryChipText: { fontSize: 10, fontWeight: '800' },
  primaryBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  primaryBtnText: { fontSize: 11, fontWeight: '700' },

  // Party Animal — socials row in expanded view
  partySocialsRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, paddingTop: 8, marginTop: 4, borderTopWidth: StyleSheet.hairlineWidth },
  partySocialsLabel: { fontSize: 11 },
  partySocialChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  partySocialHandle: { fontSize: 11, fontWeight: '700' },

  socialCard: { marginHorizontal: 20, marginTop: 14, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  socialCardHeader: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10 },
  socialCardTitle: { fontSize: 15, fontWeight: '800', letterSpacing: -0.2, marginBottom: 2 },
  socialCardSubtitle: { fontSize: 12 },
  socialRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  socialIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  socialIconText: { fontSize: 18 },
  socialLabel: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  socialHandleText: { fontSize: 12 },
  socialConnect: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  socialConnectText: { fontSize: 12, fontWeight: '700' },
  socialDisconnect: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#EF444444' },
  socialDisconnectText: { fontSize: 12, fontWeight: '700', color: '#F87171' },

  followingSection: { marginHorizontal: 20, marginTop: 14 },
  followingHeader: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 14 },
  followingTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
  followingCount: { fontSize: 12 },
  storiesRow: { gap: 18, paddingBottom: 4 },
  storyItem: { alignItems: 'center', width: 62 },
  storyRing: { width: 62, height: 62, borderRadius: 31, borderWidth: 2, padding: 3, marginBottom: 6 },
  storyAvatar: { flex: 1, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  storyInitials: { fontSize: 18, fontWeight: '900' },
  storyName: { fontSize: 11, fontWeight: '600', textAlign: 'center' },

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
