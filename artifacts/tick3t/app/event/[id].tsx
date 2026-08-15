import React, { useState } from 'react';
import {
  View, Text, Image, ScrollView, StyleSheet, Pressable, Alert,
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
  const { getEventById, purchaseTicket, followedOrganizers, toggleFollowOrganizer } = useApp();
  const event = getEventById(id ?? '');

  const [selectedTier, setSelectedTier] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [liked, setLiked] = useState(false);
  const [buying, setBuying] = useState(false);

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

  const handleBuy = async () => {
    if (soldOut) {
      Alert.alert('Sold Out', 'This event is sold out. Check the Marketplace for resale tickets.', [
        { text: 'View Marketplace', onPress: () => router.push('/(tabs)/marketplace') },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }
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
          <Pressable style={styles.heartBtn} onPress={() => setLiked(!liked)}>
            <Text style={styles.heartText}>{liked ? '❤️' : '🤍'}</Text>
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
            </View>
          );
        })()}

        {/* Unified info card */}
        <View style={[styles.infoUnified, { backgroundColor: C.card, borderColor: C.border }]}>
          {[
            { icon: '📅', value: event.date.replace(/,?\s*\d{4}/, ''), sub: event.time },
            { icon: '📍', value: event.location.split(',')[0], sub: 'Location' },
            { icon: '👥', value: event.attendees >= 1000 ? `${(event.attendees / 1000).toFixed(1)}k` : String(event.attendees), sub: 'Going' },
            { icon: '⏱', value: '6h', sub: 'Duration' },
          ].map((item, i) => (
            <View key={i} style={[styles.infoCol, i < 3 && { borderRightWidth: 1, borderRightColor: C.border }]}>
              <Text style={styles.infoColIcon}>{item.icon}</Text>
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
                  <Text style={[styles.amenityText, { color: C.textSecondary }]}>✓ {a}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Ticket tier selector */}
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

          {/* Quantity picker */}
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

          {/* Trust signals */}
          <View style={[styles.trustRow, { backgroundColor: C.card, borderColor: C.border }]}>
            {[
              { icon: '🔒', text: 'Secure via Paynow' },
              { icon: '⬡', text: 'NFT on TON blockchain' },
              { icon: '✓', text: 'Verified organizer' },
            ].map((t, i) => (
              <View key={i} style={styles.trustItem}>
                <Text style={styles.trustIcon}>{t.icon}</Text>
                <Text style={[styles.trustText, { color: C.textMuted }]}>{t.text}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Sticky buy button */}
      <View style={[styles.buyBar, { backgroundColor: C.card, borderTopColor: C.border }]}>
        <View>
          <Text style={[styles.buyTotal, { color: C.text }]}>${total}</Text>
          <Text style={[styles.buyBreakdown, { color: C.textMuted }]}>{quantity}× {tier.name}</Text>
        </View>
        <Pressable
          style={[styles.buyBtn, { backgroundColor: soldOut ? C.textMuted : C.primary }]}
          onPress={handleBuy}
          disabled={buying}
        >
          <Text style={styles.buyBtnText}>
            {buying ? 'Processing…' : soldOut ? 'View Resale' : 'Get Ticket →'}
          </Text>
        </Pressable>
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
  infoCol: { flex: 1, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 4 },
  infoColIcon: { fontSize: 16, marginBottom: 5 },
  infoColValue: { fontSize: 12, fontWeight: '700', marginBottom: 2, textAlign: 'center' },
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
  amenityItem: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1 },
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

  trustRow: { flexDirection: 'row', borderRadius: 12, padding: 14, borderWidth: 1, marginBottom: 8, gap: 0 },
  trustItem: { flex: 1, alignItems: 'center', gap: 4 },
  trustIcon: { fontSize: 18 },
  trustText: { fontSize: 10, textAlign: 'center', letterSpacing: 0.1 },

  buyBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16, paddingBottom: 30, borderTopWidth: 1 },
  buyTotal: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  buyBreakdown: { fontSize: 12, marginTop: 2 },
  buyBtn: { paddingHorizontal: 28, paddingVertical: 16, borderRadius: 16 },
  buyBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { fontSize: 18 },
});
