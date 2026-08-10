import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Image, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';

const FILTERS = ['All', 'Music Festival', 'Art & Culture', 'Tech & Networking', 'Gaming', 'Fashion'];

export default function MarketplaceScreen() {
  const { colors: C } = useTheme();
  const { isAuthenticated } = useAuth();
  const { marketplace } = useApp();
  const router = useRouter();
  const [active, setActive] = useState('All');

  const filtered = active === 'All' ? marketplace : marketplace.filter(l => l.eventCategory === active);

  const handleBuy = (listing: typeof marketplace[0]) => {
    if (!isAuthenticated) {
      Alert.alert(
        'Sign in to buy',
        'You need a Tick3t account to purchase tickets.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/(auth)/sign-in') },
        ]
      );
      return;
    }
    Alert.alert(
      'Buy Ticket',
      `Purchase 1× ${listing.tierName} for ${listing.eventTitle}?\n\nResale Price: $${listing.resalePrice}\n\nSecured via Paynow · NFT on TON blockchain`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Buy Now', style: 'default', onPress: () => Alert.alert('Order Placed', 'Your ticket will appear in your Vault shortly.') },
      ]
    );
  };

  const handleOffer = (listing: typeof marketplace[0]) => {
    if (!isAuthenticated) {
      Alert.alert('Sign in to make offers', 'Create a free account to make offers on resale tickets.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/(auth)/sign-in') },
      ]);
      return;
    }
    Alert.alert('Make Offer', 'Offer functionality coming soon — join the waitlist instead.', [{ text: 'OK' }]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: C.text }]}>Marketplace</Text>
          <Text style={[styles.subtitle, { color: C.textSecondary }]}>Verified ticket resale</Text>
        </View>
        <View style={[styles.liveBadge, { backgroundColor: C.primary + '22', borderColor: C.primary + '55' }]}>
          <View style={[styles.liveDot, { backgroundColor: C.primary }]} />
          <Text style={[styles.liveText, { color: C.primary }]}>LIVE</Text>
        </View>
      </View>

      {/* Category filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {FILTERS.map(f => (
          <Pressable
            key={f}
            style={[styles.pill, { backgroundColor: active === f ? C.primary : C.card, borderColor: active === f ? C.primary : C.border }]}
            onPress={() => setActive(f)}
          >
            <Text style={[styles.pillText, { color: active === f ? '#fff' : C.textSecondary }]}>{f}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {/* Info banner */}
        <View style={[styles.banner, { backgroundColor: C.primary + '15', borderColor: C.primary + '40' }]}>
          <Text style={[styles.bannerText, { color: C.primary }]}>
            🔒 All resale tickets are verified NFTs on the TON blockchain. Safe & secure.
          </Text>
        </View>

        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyEmoji]}>🏷️</Text>
            <Text style={[styles.emptyTitle, { color: C.text }]}>No listings found</Text>
            <Text style={[styles.emptyText, { color: C.textMuted }]}>No resale tickets in this category right now.</Text>
          </View>
        ) : (
          filtered.map(listing => {
            const premium = listing.resalePrice > listing.originalPrice;
            const premiumPct = Math.round(((listing.resalePrice - listing.originalPrice) / listing.originalPrice) * 100);
            return (
              <View key={listing.id} style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}>
                <Image source={{ uri: listing.eventImage }} style={styles.cardImage} />
                <View style={styles.cardBody}>
                  <View style={styles.cardBadgeRow}>
                    <View style={[styles.badge, { backgroundColor: C.primary + '22', borderColor: C.primary + '44' }]}>
                      <Text style={[styles.badgeText, { color: C.primary }]}>{listing.eventCategory}</Text>
                    </View>
                    {listing.sellerVerified && (
                      <View style={[styles.badge, { backgroundColor: '#6366F122', borderColor: '#6366F144' }]}>
                        <Text style={[styles.badgeText, { color: '#818CF8' }]}>✓ Verified Seller</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.cardTitle, { color: C.text }]} numberOfLines={1}>{listing.eventTitle}</Text>
                  <Text style={[styles.cardMeta, { color: C.textSecondary }]}>{listing.eventDate}</Text>
                  <Text style={[styles.cardMeta, { color: C.textSecondary }]}>📍 {listing.eventLocation}</Text>
                  <Text style={[styles.cardMeta, { color: C.textSecondary }]}>🎫 {listing.tierName} · Qty: {listing.quantity}</Text>
                  <Text style={[styles.cardMeta, { color: C.textMuted }]}>by @{listing.seller} · {listing.listed}</Text>

                  <View style={styles.priceRow}>
                    <View>
                      <Text style={[styles.resalePrice, { color: C.primary }]}>${listing.resalePrice}</Text>
                      <Text style={[styles.originalPrice, { color: C.textMuted }]}>Original: ${listing.originalPrice}
                        {premium && <Text style={{ color: '#F59E0B' }}> +{premiumPct}%</Text>}
                      </Text>
                    </View>
                    <View style={styles.actionButtons}>
                      <Pressable style={[styles.offerBtn, { borderColor: C.border }]} onPress={() => handleOffer(listing)}>
                        <Text style={[styles.offerBtnText, { color: C.textSecondary }]}>Make Offer</Text>
                      </Pressable>
                      <Pressable style={[styles.buyBtn, { backgroundColor: C.primary }]} onPress={() => handleBuy(listing)}>
                        <Text style={styles.buyBtnText}>Buy Now</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </View>
            );
          })
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 2 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveText: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },

  filterScroll: { maxHeight: 50 },
  filterContent: { paddingHorizontal: 20, gap: 8, alignItems: 'center' },
  pill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  pillText: { fontSize: 13, fontWeight: '600' },

  list: { flex: 1 },
  listContent: { padding: 20 },

  banner: { borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1 },
  bannerText: { fontSize: 13, fontWeight: '600', lineHeight: 19 },

  empty: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptyText: { fontSize: 14, textAlign: 'center' },

  card: { borderRadius: 14, overflow: 'hidden', marginBottom: 16, borderWidth: 1 },
  cardImage: { width: '100%', height: 140 },
  cardBody: { padding: 14 },
  cardBadgeRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  cardMeta: { fontSize: 12, marginBottom: 2 },

  priceRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 12 },
  resalePrice: { fontSize: 22, fontWeight: '800' },
  originalPrice: { fontSize: 12, marginTop: 2 },
  actionButtons: { flexDirection: 'row', gap: 8 },
  offerBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  offerBtnText: { fontSize: 13, fontWeight: '600' },
  buyBtn: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 10 },
  buyBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
