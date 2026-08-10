import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Image, Alert,
  Modal, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { MarketplaceListing } from '@/context/AppContext';

const FILTERS = ['All', 'Music Festival', 'Art & Culture', 'Tech & Networking', 'Gaming', 'Fashion'];

export default function MarketplaceScreen() {
  const { colors: C } = useTheme();
  const { isAuthenticated } = useAuth();
  const { marketplace, purchaseMarketplaceTicket } = useApp();
  const router = useRouter();
  const [active, setActive] = useState('All');
  const [buying, setBuying] = useState<string | null>(null);

  // Offer modal state
  const [offerItem, setOfferItem] = useState<MarketplaceListing | null>(null);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerSent, setOfferSent] = useState(false);
  const [sendingOffer, setSendingOffer] = useState(false);

  const filtered = active === 'All' ? marketplace : marketplace.filter(l => l.eventCategory === active);

  const requireAuth = (action: () => void) => {
    if (!isAuthenticated) {
      Alert.alert(
        'Sign in required',
        'Create a free Tick3t account to buy and make offers on tickets.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/(auth)/sign-in') },
        ]
      );
      return;
    }
    action();
  };

  const handleBuy = (listing: MarketplaceListing) => {
    requireAuth(async () => {
      Alert.alert(
        'Confirm Purchase',
        `${listing.quantity}× ${listing.tierName}\n${listing.eventTitle}\n\nResale Price: $${listing.resalePrice}\nSecured via Paynow · NFT on TON blockchain`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Buy Now',
            onPress: async () => {
              setBuying(listing.id);
              try {
                const ticket = await purchaseMarketplaceTicket(listing);
                Alert.alert(
                  '🎫 Ticket Secured!',
                  `Your ticket for ${listing.eventTitle} is now in your Vault.`,
                  [
                    { text: 'View Vault', onPress: () => router.push('/(tabs)/vault') },
                    { text: 'Stay here', style: 'cancel' },
                  ]
                );
              } catch {
                Alert.alert('Purchase failed', 'Something went wrong. Please try again.');
              } finally {
                setBuying(null);
              }
            },
          },
        ]
      );
    });
  };

  const handleOffer = (listing: MarketplaceListing) => {
    requireAuth(() => {
      setOfferItem(listing);
      setOfferAmount(String(Math.round(listing.resalePrice * 0.9)));
      setOfferSent(false);
    });
  };

  const submitOffer = async () => {
    const amount = Number(offerAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid offer amount.');
      return;
    }
    setSendingOffer(true);
    // Simulate network delay
    await new Promise(r => setTimeout(r, 1200));
    setSendingOffer(false);
    setOfferSent(true);
  };

  const closeOfferModal = () => {
    setOfferItem(null);
    setOfferAmount('');
    setOfferSent(false);
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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
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
          <Ionicons name="shield-checkmark-outline" size={15} color={C.primary} />
          <Text style={[styles.bannerText, { color: C.primary }]}>
            All resale tickets are verified on the TON blockchain. Safe &amp; secure.
          </Text>
        </View>

        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="pricetag-outline" size={48} color={C.textMuted} />
            <Text style={[styles.emptyTitle, { color: C.text }]}>No listings found</Text>
            <Text style={[styles.emptyText, { color: C.textMuted }]}>No resale tickets in this category right now.</Text>
          </View>
        ) : (
          filtered.map(listing => {
            const premium = listing.resalePrice > listing.originalPrice;
            const premiumPct = Math.round(((listing.resalePrice - listing.originalPrice) / listing.originalPrice) * 100);
            const isBuying = buying === listing.id;
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
                        <Ionicons name="checkmark-circle" size={11} color="#818CF8" />
                        <Text style={[styles.badgeText, { color: '#818CF8' }]}>Verified Seller</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.cardTitle, { color: C.text }]} numberOfLines={1}>{listing.eventTitle}</Text>
                  <View style={styles.metaRow}>
                    <Ionicons name="calendar-outline" size={12} color={C.textSecondary} />
                    <Text style={[styles.cardMeta, { color: C.textSecondary }]}>{listing.eventDate}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Ionicons name="location-outline" size={12} color={C.textSecondary} />
                    <Text style={[styles.cardMeta, { color: C.textSecondary }]}>{listing.eventLocation}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Ionicons name="ticket-outline" size={12} color={C.textSecondary} />
                    <Text style={[styles.cardMeta, { color: C.textSecondary }]}>{listing.tierName} · Qty: {listing.quantity}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Ionicons name="person-outline" size={12} color={C.textMuted} />
                    <Text style={[styles.cardMeta, { color: C.textMuted }]}>@{listing.seller} · {listing.listed}</Text>
                  </View>

                  <View style={styles.priceRow}>
                    <View>
                      <Text style={[styles.resalePrice, { color: C.primary }]}>${listing.resalePrice}</Text>
                      <Text style={[styles.originalPrice, { color: C.textMuted }]}>
                        Original: ${listing.originalPrice}
                        {premium && <Text style={{ color: '#F59E0B' }}> +{premiumPct}%</Text>}
                      </Text>
                    </View>
                    <View style={styles.actionButtons}>
                      <Pressable
                        style={[styles.offerBtn, { borderColor: C.border, backgroundColor: C.surface }]}
                        onPress={() => handleOffer(listing)}
                      >
                        <Ionicons name="chatbubble-outline" size={13} color={C.textSecondary} />
                        <Text style={[styles.offerBtnText, { color: C.textSecondary }]}>Offer</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.buyBtn, { backgroundColor: isBuying ? C.primary + 'aa' : C.primary }]}
                        onPress={() => handleBuy(listing)}
                        disabled={isBuying}
                      >
                        {isBuying
                          ? <ActivityIndicator size="small" color="#fff" />
                          : <Text style={styles.buyBtnText}>Buy Now</Text>
                        }
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

      {/* ── Make Offer Modal ─────────────────────────────────────────────── */}
      <Modal
        visible={!!offerItem}
        transparent
        animationType="slide"
        onRequestClose={closeOfferModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={StyleSheet.absoluteFillObject} onPress={closeOfferModal} />
          <View style={[styles.modalSheet, { backgroundColor: C.card, borderColor: C.border }]}>
            {/* Handle bar */}
            <View style={[styles.handle, { backgroundColor: C.border }]} />

            {offerSent ? (
              /* ── Success state ── */
              <View style={styles.successWrap}>
                <View style={[styles.successIcon, { backgroundColor: C.primary + '20' }]}>
                  <Ionicons name="checkmark-circle" size={48} color={C.primary} />
                </View>
                <Text style={[styles.successTitle, { color: C.text }]}>Offer Sent!</Text>
                <Text style={[styles.successDesc, { color: C.textMuted }]}>
                  Your offer of{' '}
                  <Text style={{ color: C.primary, fontWeight: '700' }}>${offerAmount}</Text>
                  {' '}has been sent to @{offerItem?.seller}. You'll be notified if they accept.
                </Text>
                <Pressable
                  style={[styles.doneBtn, { backgroundColor: C.primary }]}
                  onPress={closeOfferModal}
                >
                  <Text style={styles.doneBtnText}>Done</Text>
                </Pressable>
              </View>
            ) : (
              /* ── Offer input state ── */
              <>
                <Text style={[styles.modalTitle, { color: C.text }]}>Make an Offer</Text>
                {offerItem && (
                  <View style={[styles.offerEventRow, { backgroundColor: C.surface, borderColor: C.border }]}>
                    <Image source={{ uri: offerItem.eventImage }} style={styles.offerThumb} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.offerEventTitle, { color: C.text }]} numberOfLines={1}>
                        {offerItem.eventTitle}
                      </Text>
                      <Text style={[styles.offerEventMeta, { color: C.textMuted }]}>
                        {offerItem.tierName} · Asking ${offerItem.resalePrice}
                      </Text>
                    </View>
                  </View>
                )}

                <Text style={[styles.offerLabel, { color: C.textSecondary }]}>Your offer amount (USD)</Text>
                <View style={[styles.offerInputWrap, { borderColor: C.border, backgroundColor: C.surface }]}>
                  <Text style={[styles.dollarSign, { color: C.primary }]}>$</Text>
                  <TextInput
                    style={[styles.offerInput, { color: C.text }]}
                    placeholder="0"
                    placeholderTextColor={C.textMuted}
                    keyboardType="numeric"
                    value={offerAmount}
                    onChangeText={setOfferAmount}
                    autoFocus
                  />
                </View>

                {offerItem && (
                  <Text style={[styles.offerHint, { color: C.textMuted }]}>
                    Suggested: ${Math.round(offerItem.resalePrice * 0.85)}–${Math.round(offerItem.resalePrice * 0.95)}
                  </Text>
                )}

                <View style={styles.modalActions}>
                  <Pressable
                    style={[styles.cancelBtn, { borderColor: C.border }]}
                    onPress={closeOfferModal}
                  >
                    <Text style={[styles.cancelBtnText, { color: C.textSecondary }]}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.sendBtn, { backgroundColor: C.primary, opacity: sendingOffer ? 0.7 : 1 }]}
                    onPress={submitOffer}
                    disabled={sendingOffer}
                  >
                    {sendingOffer
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Text style={styles.sendBtnText}>Send Offer</Text>
                    }
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  listContent: { padding: 20, gap: 16 },

  banner: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 14, borderWidth: 1 },
  bannerText: { fontSize: 13, fontWeight: '600', lineHeight: 19, flex: 1 },

  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyText: { fontSize: 14, textAlign: 'center' },

  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  cardImage: { width: '100%', height: 140 },
  cardBody: { padding: 14 },
  cardBadgeRow: { flexDirection: 'row', gap: 6, marginBottom: 8, flexWrap: 'wrap' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  cardTitle: { fontSize: 16, fontWeight: '800', marginBottom: 8, letterSpacing: -0.2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 },
  cardMeta: { fontSize: 12, flex: 1 },

  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  resalePrice: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  originalPrice: { fontSize: 11, marginTop: 2 },
  actionButtons: { flexDirection: 'row', gap: 8 },
  offerBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  offerBtnText: { fontSize: 13, fontWeight: '600' },
  buyBtn: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10, minWidth: 80, alignItems: 'center', justifyContent: 'center' },
  buyBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.4, marginBottom: 16 },

  offerEventRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 20 },
  offerThumb: { width: 52, height: 52, borderRadius: 8 },
  offerEventTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  offerEventMeta: { fontSize: 12 },

  offerLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  offerInputWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 16, height: 58, marginBottom: 8 },
  dollarSign: { fontSize: 22, fontWeight: '800', marginRight: 4 },
  offerInput: { flex: 1, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  offerHint: { fontSize: 12, marginBottom: 24 },

  modalActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, height: 50, borderRadius: 50, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600' },
  sendBtn: { flex: 2, height: 50, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  sendBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  // Success
  successWrap: { alignItems: 'center', paddingVertical: 16 },
  successIcon: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  successTitle: { fontSize: 24, fontWeight: '900', marginBottom: 10 },
  successDesc: { fontSize: 14, lineHeight: 21, textAlign: 'center', marginBottom: 28, maxWidth: 300 },
  doneBtn: { width: '100%', height: 52, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
