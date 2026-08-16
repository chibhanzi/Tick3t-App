import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, Image, ScrollView, StyleSheet, Pressable, Alert, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useApp, MOCK_ORGANIZERS } from '@/context/AppContext';
import { getAvailabilityPercent } from '@/utils/format';

export default function EventDetailScreen() {
  const C = Colors.dark;
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const {
    getEventById, purchaseTicket, followedOrganizers, toggleFollowOrganizer, connectedSocials,
    toggleWaitlist, toggleWatchlist, joinPool, joinedWaitlist, watchlist, joinedPools,
    getWaitlistCount, getPoolData,
  } = useApp();
  const event = getEventById(id ?? '');

  const [selectedTier, setSelectedTier] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [buying, setBuying] = useState(false);

  // Heart animation
  const heartScale = useRef(new Animated.Value(1)).current;
  const pulsHeart = useCallback(() => {
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.5, useNativeDriver: true, speed: 30, bounciness: 14 }),
      Animated.spring(heartScale, { toValue: 1,   useNativeDriver: true, speed: 20, bounciness: 6  }),
    ]).start();
  }, [heartScale]);

  if (!event) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={{ color: C.text, fontSize: 28 }}>←</Text>
        </Pressable>
        <View style={styles.notFound}>
          <Text style={[styles.notFoundText, { color: C.text }]}>Event not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const soldOut = event.available === 0;
  const tier = event.tiers[selectedTier];
  const total = tier.price * quantity;
  const availPct = getAvailabilityPercent(event.available, event.total);
  const almostGone = !soldOut && availPct >= 70;
  const inWaitlist = joinedWaitlist.has(event.id);
  const isWatched = watchlist.has(event.id);
  const inPool = joinedPools.has(event.id);

  const handleWaitlist = () => {
    if (!isAuthenticated) {
      Alert.alert('Sign in required', 'Create a free account to join the waitlist.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/(auth)/sign-in') },
      ]);
      return;
    }
    toggleWaitlist(event.id);
  };

  const handleJoinPool = () => {
    if (!isAuthenticated) {
      Alert.alert('Sign in required', 'Create a free account to join the ticket pool.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/(auth)/sign-in') },
      ]);
      return;
    }
    const pool = getPoolData(event.id);
    const share = Math.round((event.tiers[0]?.price ?? 50) / pool.target);
    Alert.alert(
      'Join Ticket Pool',
      `Commit $${share} to the pool.\n\nOnce ${pool.target} fans are in, the organiser releases a ticket lot and one pool member wins a ticket at face value. Everyone else gets a full refund.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: `Commit $${share} →`, onPress: () => joinPool(event.id) },
      ]
    );
  };

  const handleBuy = async () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Sign in to buy tickets',
        'You need a Tick3t account to purchase tickets.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/(auth)/sign-in') },
        ]
      );
      return;
    }
    Alert.alert(
      'Confirm Purchase',
      `${quantity}× ${tier.name}\n${event.title}\n\nTotal: $${total}\n\nSecure payment via Paynow · NFT ticket on TON blockchain`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Get Ticket →',
          onPress: async () => {
            setBuying(true);
            try {
              const ticket = await purchaseTicket(event, tier.id, quantity);
              router.replace(`/ticket/${ticket.id}`);
            } finally {
              setBuying(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <Image source={{ uri: event.image }} style={styles.heroImage} />
          <View style={styles.heroOverlay} />
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
          <Pressable style={styles.heartBtn} onPress={() => { pulsHeart(); toggleWatchlist(event.id); }}>
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Ionicons name={isWatched ? 'heart' : 'heart-outline'} size={22} color={isWatched ? '#F87171' : '#fff'} />
            </Animated.View>
          </Pressable>
          <View style={styles.heroContent}>
            <View style={styles.heroBadges}>
              <View style={[styles.badge, { backgroundColor: C.primary + 'CC' }]}>
                <Text style={styles.badgeText}>{event.category}</Text>
              </View>
              {event.isVerifiedOrganizer && (
                <View style={[styles.badge, { backgroundColor: '#16a34aCC' }]}>
                  <Text style={styles.badgeText}>✓ Verified Organizer</Text>
                </View>
              )}
              {soldOut && <View style={[styles.badge, { backgroundColor: '#EF4444CC' }]}><Text style={styles.badgeText}>Sold Out</Text></View>}
              {almostGone && !soldOut && <View style={[styles.badge, { backgroundColor: '#F59E0BCC' }]}><Text style={styles.badgeText}>Almost Sold Out</Text></View>}
            </View>
            <Text style={styles.heroTitle}>{event.title}</Text>
            <Text style={styles.heroOrganizer}>by {event.organizer}</Text>
          </View>
        </View>

        {/* Organizer card */}
        {(() => {
          const org = MOCK_ORGANIZERS[event.organizer];
          const isFollowing = followedOrganizers.has(event.organizer);
          const initials = event.organizer.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
          const color = org?.color ?? C.primary;

          const handleFollowPress = () => {
            if (!isAuthenticated) {
              Alert.alert(
                'Sign in to follow',
                'Create a free account to follow organizers and get notified of new events.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Sign In', onPress: () => router.push('/(auth)/sign-in') },
                ]
              );
              return;
            }
            toggleFollowOrganizer(event.organizer);
          };

          return (
            <View style={[styles.orgCard, { backgroundColor: C.card, borderColor: C.border }]}>
              <View style={styles.orgHeader}>
                <View style={[styles.orgAvatar, { backgroundColor: color + '22', borderColor: color + '55' }]}>
                  <Text style={[styles.orgInitials, { color }]}>{initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.orgNameRow}>
                    <Text style={[styles.orgName, { color: C.text }]} numberOfLines={1}>
                      {event.organizer}
                    </Text>
                    {event.isVerifiedOrganizer && (
                      <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                    )}
                  </View>
                  <Text style={[styles.orgStats, { color: C.textMuted }]}>
                    {org ? `${(org.followerCount / 1000).toFixed(1)}k followers · ${org.eventCount} events` : 'Organizer'}
                  </Text>
                </View>
                <Pressable
                  style={[
                    styles.followBtn,
                    isFollowing
                      ? { backgroundColor: '#22c55e15', borderColor: '#22c55e55' }
                      : { backgroundColor: color + '18', borderColor: color + '55' },
                  ]}
                  onPress={handleFollowPress}
                >
                  <Ionicons
                    name={isFollowing ? 'checkmark' : 'add'}
                    size={14}
                    color={isFollowing ? '#22c55e' : color}
                  />
                  <Text style={[styles.followBtnText, { color: isFollowing ? '#22c55e' : color }]}>
                    {isFollowing ? 'Following' : 'Follow'}
                  </Text>
                </Pressable>
              </View>
              {org?.bio && (
                <Text style={[styles.orgBio, { color: C.textSecondary }]}>{org.bio}</Text>
              )}
              {/* Social proof */}
              {(() => {
                let mutualNames: string[] = [];
                let mutualIcon = '';
                for (const platform of Object.keys(connectedSocials)) {
                  const names = (org?.mutuals as Record<string, string[]> | undefined)?.[platform] ?? [];
                  if (names.length > 0) { mutualNames = names; mutualIcon = platform === 'instagram' ? '📸' : '𝕏'; break; }
                }
                if (mutualNames.length === 0) return null;
                const text = mutualNames.length === 1
                  ? `${mutualNames[0]} follows this organizer`
                  : mutualNames.length === 2
                  ? `${mutualNames[0]} & ${mutualNames[1]} follow this organizer`
                  : `${mutualNames[0]}, ${mutualNames[1]} & ${mutualNames.length - 2} others follow this organizer`;
                return (
                  <View style={[styles.orgMutualRow, { backgroundColor: C.surface, borderColor: C.border }]}>
                    <Text style={styles.orgMutualIcon}>{mutualIcon}</Text>
                    <Text style={[styles.orgMutualText, { color: C.textSecondary }]}>{text}</Text>
                  </View>
                );
              })()}
            </View>
          );
        })()}

        {/* Unified info card */}
        <View style={[styles.infoUnified, { backgroundColor: C.card, borderColor: C.border }]}>
          {([
            { icon: 'calendar-outline', value: event.date.replace(/,?\s*\d{4}/, ''), sub: event.time },
            { icon: 'location-outline', value: event.location.split(',')[0], sub: 'Location' },
            { icon: 'people-outline', value: event.attendees >= 1000 ? `${(event.attendees / 1000).toFixed(1)}k` : String(event.attendees), sub: 'Going' },
            { icon: 'time-outline', value: '6h', sub: 'Duration' },
          ] as const).map((item, i) => (
            <View key={i} style={[styles.infoCol, i < 3 && { borderRightWidth: 1, borderRightColor: C.border }]}>
              <Ionicons name={item.icon} size={17} color={C.primary} />
              <Text style={[styles.infoColValue, { color: C.text }]} numberOfLines={1}>{item.value}</Text>
              <Text style={[styles.infoColSub, { color: C.textMuted }]} numberOfLines={1}>{item.sub}</Text>
            </View>
          ))}
        </View>

        {/* Availability bar */}
        {!soldOut && (
          <View style={styles.availSection}>
            <View style={[styles.availBar, { backgroundColor: C.border }]}>
              <View style={[styles.availFill, { width: `${availPct}%`, backgroundColor: almostGone ? '#F59E0B' : C.primary }]} />
            </View>
            <Text style={[styles.availText, { color: almostGone ? '#F59E0B' : C.textMuted }]}>
              {event.available} of {event.total} tickets left
            </Text>
          </View>
        )}

        <View style={styles.body}>
          {/* Description */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: C.text }]}>About</Text>
            <Text style={[styles.description, { color: C.textSecondary }]}>{event.description}</Text>
          </View>

          {/* Tags */}
          <View style={styles.tagRow}>
            {event.tags.map(tag => (
              <View key={tag} style={[styles.tag, { backgroundColor: C.card, borderColor: C.border }]}>
                <Text style={[styles.tagText, { color: C.textSecondary }]}>#{tag}</Text>
              </View>
            ))}
          </View>

          {/* Amenities */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: C.text }]}>Amenities</Text>
            <View style={styles.amenityGrid}>
              {event.amenities.map(a => (
                <View key={a} style={[styles.amenityItem, { backgroundColor: C.card, borderColor: C.border }]}>
                  <Ionicons name="checkmark-circle-outline" size={13} color="#22c55e" />
                  <Text style={[styles.amenityText, { color: C.textSecondary }]}>{a}</Text>
                </View>
              ))}
            </View>
          </View>

          {soldOut ? (
            <>
              {/* ── Waitlist ──────────────────────── */}
              <View style={styles.section}>
                <View style={[styles.waitlistCard, { backgroundColor: C.card, borderColor: C.border }]}>
                  <View style={styles.waitlistTop}>
                    <View style={[styles.waitlistIconBox, { backgroundColor: '#EF444418' }]}>
                      <Ionicons name="time-outline" size={22} color="#F87171" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.waitlistTitle, { color: C.text }]}>This event is sold out</Text>
                      <Text style={[styles.waitlistMeta, { color: '#F87171' }]}>
                        {getWaitlistCount(event.id).toLocaleString()} people are waiting
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.waitlistDesc, { color: C.textSecondary }]}>
                    Join the waitlist and we'll notify you the moment a ticket is released — or when the organiser announces their next event.
                  </Text>
                  <Pressable
                    style={[styles.waitlistBtn, inWaitlist
                      ? { backgroundColor: '#22c55e15', borderColor: '#22c55e55', borderWidth: 1 }
                      : { backgroundColor: '#EF4444' }]}
                    onPress={handleWaitlist}
                  >
                    <Ionicons
                      name={inWaitlist ? 'checkmark-circle' : 'notifications-outline'}
                      size={18}
                      color={inWaitlist ? '#22c55e' : '#fff'}
                    />
                    <Text style={[styles.waitlistBtnText, inWaitlist && { color: '#22c55e' }]}>
                      {inWaitlist ? "You're on the waitlist ✓" : `Join ${getWaitlistCount(event.id).toLocaleString()} on the waitlist`}
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* ── Ticket Pool ───────────────────── */}
              {(() => {
                const pool = getPoolData(event.id);
                const pct = Math.round((pool.raised / pool.target) * 100);
                const share = Math.round((event.tiers[0]?.price ?? 50) / pool.target);
                return (
                  <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: C.text }]}>Ticket Pool</Text>
                    <View style={[styles.poolCard, { backgroundColor: C.card, borderColor: C.border }]}>
                      <View style={styles.poolHeader}>
                        <View style={[styles.poolIconBox, { backgroundColor: C.primary + '18' }]}>
                          <Ionicons name="people-outline" size={20} color={C.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.poolTitle, { color: C.text }]}>Pool together, win a spot</Text>
                          <Text style={[styles.poolMeta, { color: C.textMuted }]}>
                            {pool.contributors} / {pool.target} committed · {pct}% to drop
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.poolTrack, { backgroundColor: C.border }]}>
                        <View style={[styles.poolFill, { width: `${Math.min(100, pct)}%` as any, backgroundColor: C.primary }]} />
                      </View>
                      <Text style={[styles.poolDesc, { color: C.textSecondary }]}>
                        When {pool.target} fans each commit ${share}, the organiser releases a ticket lot — one random pool member wins a ticket at face value and everyone else gets a full refund.
                      </Text>
                      {inPool ? (
                        <View style={[styles.poolJoined, { backgroundColor: '#22c55e15', borderColor: '#22c55e44' }]}>
                          <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                          <Text style={styles.poolJoinedText}>You're in the pool — good luck! 🎲</Text>
                        </View>
                      ) : (
                        <Pressable
                          style={[styles.poolJoinBtn, { backgroundColor: C.primary + '14', borderColor: C.primary + '44', borderWidth: 1 }]}
                          onPress={handleJoinPool}
                        >
                          <Ionicons name="add-circle-outline" size={18} color={C.primary} />
                          <Text style={[styles.poolJoinText, { color: C.primary }]}>Join pool — ${share} commitment</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                );
              })()}
            </>
          ) : (
            <>
              {/* ── Ticket tier selector ──────────── */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: C.text }]}>Select Ticket Type</Text>
                {event.tiers.map((t, i) => (
                  <Pressable
                    key={t.id}
                    style={[
                      styles.tierCard,
                      { backgroundColor: C.card, borderColor: selectedTier === i ? C.primary : C.border },
                      selectedTier === i && { borderWidth: 2 },
                    ]}
                    onPress={() => setSelectedTier(i)}
                  >
                    <View style={styles.tierHeader}>
                      <View>
                        <Text style={[styles.tierName, { color: C.text }]}>{t.name}</Text>
                        <Text style={[styles.tierPrice, { color: C.primary }]}>${t.price}</Text>
                      </View>
                      <View style={[styles.tierRadio, { borderColor: selectedTier === i ? C.primary : C.border }]}>
                        {selectedTier === i && <View style={[styles.tierRadioFill, { backgroundColor: C.primary }]} />}
                      </View>
                    </View>
                    <View style={styles.tierPerks}>
                      {t.perks.map(p => (
                        <Text key={p} style={[styles.tierPerk, { color: C.textSecondary }]}>✓ {p}</Text>
                      ))}
                    </View>
                  </Pressable>
                ))}
              </View>

              {/* ── Quantity picker ───────────────── */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: C.text }]}>Quantity</Text>
                <View style={styles.quantityRow}>
                  <Pressable
                    style={[styles.qtyBtn, { backgroundColor: C.card, borderColor: C.border }]}
                    onPress={() => setQuantity(q => Math.max(1, q - 1))}
                  >
                    <Text style={[styles.qtyBtnText, { color: C.text }]}>−</Text>
                  </Pressable>
                  <Text style={[styles.qtyValue, { color: C.text }]}>{quantity}</Text>
                  <Pressable
                    style={[styles.qtyBtn, { backgroundColor: C.card, borderColor: C.border }]}
                    onPress={() => setQuantity(q => Math.min(10, q + 1))}
                  >
                    <Text style={[styles.qtyBtnText, { color: C.text }]}>+</Text>
                  </Pressable>
                </View>
              </View>

              {/* ── Trust signals ─────────────────── */}
              <View style={[styles.trustRow, { backgroundColor: C.card, borderColor: C.border }]}>
                {[
                  { icon: 'lock-closed-outline', text: 'Secure via Paynow' },
                  { icon: 'cube-outline', text: 'NFT on TON blockchain' },
                  { icon: 'shield-checkmark-outline', text: 'Verified organizer' },
                ].map((t, i) => (
                  <View key={i} style={styles.trustItem}>
                    <Ionicons name={t.icon as any} size={18} color={C.primary} />
                    <Text style={[styles.trustText, { color: C.textMuted }]}>{t.text}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Sticky buy bar */}
      <View style={[styles.buyBar, { backgroundColor: C.card, borderTopColor: C.border }]}>
        {soldOut ? (
          <>
            <View>
              <Text style={[styles.buyTotal, { color: '#F87171', fontSize: 17, fontWeight: '800' }]}>Sold Out</Text>
              <Text style={[styles.buyBreakdown, { color: C.textMuted }]}>Check marketplace for resale</Text>
            </View>
            <Pressable
              style={[styles.buyBtn, { backgroundColor: C.primary }]}
              onPress={() => router.push('/(tabs)/marketplace')}
            >
              <Text style={styles.buyBtnText}>Browse Resale →</Text>
            </Pressable>
          </>
        ) : (
          <>
            <View>
              <Text style={[styles.buyTotal, { color: C.text }]}>${total}</Text>
              <Text style={[styles.buyBreakdown, { color: C.textMuted }]}>{quantity}× {tier.name}</Text>
            </View>
            <Pressable
              style={[styles.buyBtn, { backgroundColor: C.primary }]}
              onPress={handleBuy}
              disabled={buying}
            >
              <Text style={styles.buyBtnText}>{buying ? 'Processing…' : 'Get Ticket →'}</Text>
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  hero: { height: 320, position: 'relative' },
  heroImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,12,24,0.6)' },
  backBtn: { position: 'absolute', top: 16, left: 16, backgroundColor: 'rgba(5,12,24,0.6)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  backText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  heartBtn: { position: 'absolute', top: 16, right: 16, backgroundColor: 'rgba(5,12,24,0.6)', padding: 10, borderRadius: 20 },
  heartText: { fontSize: 20 },
  heroContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20 },
  heroBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  heroTitle: { color: '#fff', fontSize: 26, fontWeight: '900', letterSpacing: -0.5, marginBottom: 4 },
  heroOrganizer: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },

  infoUnified: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 4, borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  infoCol: { flex: 1, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 4, gap: 4 },
  infoColValue: { fontSize: 12, fontWeight: '700', marginBottom: 1, textAlign: 'center' },
  infoColSub: { fontSize: 10, textAlign: 'center' },

  availSection: { paddingHorizontal: 20, marginBottom: 8 },
  availBar: { height: 4, borderRadius: 2, marginBottom: 6, overflow: 'hidden' },
  availFill: { height: '100%', borderRadius: 2 },
  availText: { fontSize: 12 },

  body: { paddingHorizontal: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 17, fontWeight: '800', marginBottom: 12, letterSpacing: -0.2 },
  description: { fontSize: 14, lineHeight: 22 },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  tag: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  tagText: { fontSize: 12 },

  amenityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenityItem: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, borderWidth: 1 },
  amenityText: { fontSize: 12 },

  tierCard: { borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1 },
  tierHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  tierName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  tierPrice: { fontSize: 20, fontWeight: '800' },
  tierRadio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  tierRadioFill: { width: 10, height: 10, borderRadius: 5 },
  tierPerks: { gap: 4 },
  tierPerk: { fontSize: 13 },

  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  qtyBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  qtyBtnText: { fontSize: 22, fontWeight: '400' },
  qtyValue: { fontSize: 24, fontWeight: '800', minWidth: 36, textAlign: 'center' },

  orgCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 24 },
  orgHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  orgAvatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  orgInitials: { fontSize: 16, fontWeight: '900' },
  orgNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 },
  orgName: { fontSize: 15, fontWeight: '800', letterSpacing: -0.2, flexShrink: 1 },
  orgStats: { fontSize: 12 },
  followBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  followBtnText: { fontSize: 13, fontWeight: '700' },
  orgBio: { fontSize: 13, lineHeight: 19 },
  orgMutualRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 7 },
  orgMutualIcon: { fontSize: 14 },
  orgMutualText: { flex: 1, fontSize: 12, lineHeight: 17 },

  trustRow: { flexDirection: 'row', borderRadius: 12, padding: 14, borderWidth: 1, marginBottom: 8, gap: 0 },
  trustItem: { flex: 1, alignItems: 'center', gap: 4 },
  trustIcon: { fontSize: 18 },
  trustText: { fontSize: 10, textAlign: 'center', letterSpacing: 0.1 },

  buyBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16, paddingBottom: 30, borderTopWidth: 1 },
  buyTotal: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  buyBreakdown: { fontSize: 12, marginTop: 2 },
  buyBtn: { paddingHorizontal: 28, paddingVertical: 16, borderRadius: 16 },
  buyBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  // Waitlist
  waitlistCard: { borderRadius: 16, borderWidth: 1, padding: 16 },
  waitlistTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  waitlistIconBox: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  waitlistTitle: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  waitlistMeta: { fontSize: 13, fontWeight: '600' },
  waitlistDesc: { fontSize: 13, lineHeight: 19, marginBottom: 14 },
  waitlistBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: 14 },
  waitlistBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  // Pool
  poolCard: { borderRadius: 16, borderWidth: 1, padding: 16 },
  poolHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  poolIconBox: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  poolTitle: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  poolMeta: { fontSize: 12 },
  poolTrack: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 14 },
  poolFill: { height: '100%', borderRadius: 3 },
  poolDesc: { fontSize: 13, lineHeight: 19, marginBottom: 14 },
  poolJoined: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, borderWidth: 1, padding: 12 },
  poolJoinedText: { fontSize: 14, fontWeight: '700', color: '#22c55e' },
  poolJoinBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: 14 },
  poolJoinText: { fontSize: 14, fontWeight: '700' },

  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { fontSize: 18 },
});
