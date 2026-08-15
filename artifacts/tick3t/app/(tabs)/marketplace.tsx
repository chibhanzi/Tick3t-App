import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Image, Alert,
  Modal, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { MarketplaceListing } from '@/context/AppContext';

const CATEGORIES = ['All', 'Music Festival', 'Art & Culture', 'Tech & Networking', 'Gaming', 'Fashion'];
const PRICE_RANGES = [
  { label: 'Any price', value: 'all' },
  { label: 'Under $100', value: 'under100' },
  { label: '$100–$200', value: '100-200' },
  { label: 'Over $200', value: 'over200' },
];
const SORT_OPTIONS = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price ↑', value: 'price-asc' },
  { label: 'Price ↓', value: 'price-desc' },
];

export default function MarketplaceScreen() {
  const { colors: C } = useTheme();
  const { isAuthenticated } = useAuth();
  const { marketplace, purchaseMarketplaceTicket } = useApp();
  const router = useRouter();

  // Filters
  const [active, setActive] = useState('All');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState('all');

  // Buy modal
  const [buyTarget, setBuyTarget] = useState<MarketplaceListing | null>(null);
  const [buyDone, setBuyDone] = useState(false);
  const [buying, setBuying] = useState(false);

  // Offer modal
  const [offerItem, setOfferItem] = useState<MarketplaceListing | null>(null);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerNote, setOfferNote] = useState('');
  const [offerSent, setOfferSent] = useState(false);
  const [sendingOffer, setSendingOffer] = useState(false);

  const filtered = useMemo(() => {
    let list = active === 'All' ? marketplace : marketplace.filter(l => l.eventCategory === active);

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(l =>
        l.eventTitle.toLowerCase().includes(q) ||
        l.eventLocation.toLowerCase().includes(q) ||
        l.seller.toLowerCase().includes(q)
      );
    }

    // Price range
    if (priceRange === 'under100') list = list.filter(l => l.resalePrice < 100);
    else if (priceRange === '100-200') list = list.filter(l => l.resalePrice >= 100 && l.resalePrice <= 200);
    else if (priceRange === 'over200') list = list.filter(l => l.resalePrice > 200);

    // Sort
    return [...list].sort((a, b) =>
      sortBy === 'price-asc' ? a.resalePrice - b.resalePrice :
      sortBy === 'price-desc' ? b.resalePrice - a.resalePrice : 0
    );
  }, [marketplace, active, search, priceRange, sortBy]);

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

  const handleBuy = (listing: MarketplaceListing) => requireAuth(() => setBuyTarget(listing));

  const closeBuyModal = () => { setBuyTarget(null); setBuyDone(false); };

  const confirmBuy = async () => {
    if (!buyTarget) return;
    setBuying(true);
    try {
      await purchaseMarketplaceTicket(buyTarget);
      setBuyDone(true);
    } catch {
      Alert.alert('Purchase failed', 'Something went wrong. Please try again.');
    } finally {
      setBuying(false);
    }
  };

  const handleSharePurchase = async () => {
    if (!buyTarget) return;
    try {
      await Share.share({
        message: `🎟️ I'm going to ${buyTarget.eventTitle}!\n📅 ${buyTarget.eventDate} · 📍 ${buyTarget.eventLocation}\n\nGet your ticket on Tick3t → https://tick3t.app`,
        title: `I'm attending ${buyTarget.eventTitle}`,
      });
    } catch { /* dismissed */ }
  };

  const handleOffer = (listing: MarketplaceListing) => {
    requireAuth(() => {
      setOfferItem(listing);
      setOfferAmount(String(Math.round(listing.resalePrice * 0.9)));
      setOfferNote('');
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
    await new Promise(r => setTimeout(r, 1200));
    setSendingOffer(false);
    setOfferSent(true);
  };

  const closeOfferModal = () => {
    setOfferItem(null);
    setOfferAmount('');
    setOfferNote('');
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

      {/* Search bar */}
      <View style={[styles.searchWrap, { backgroundColor: C.card, borderColor: C.border }]}>
        <Ionicons name="search-outline" size={16} color={C.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: C.text }]}
          placeholder="Search events, sellers, locations…"
          placeholderTextColor={C.textMuted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          autoCorrect={false}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={C.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {CATEGORIES.map(f => (
          <Pressable
            key={f}
            style={[styles.pill, { backgroundColor: active === f ? C.primary : C.card, borderColor: active === f ? C.primary : C.border }]}
            onPress={() => setActive(f)}
          >
            <Text style={[styles.pillText, { color: active === f ? '#fff' : C.textSecondary }]}>{f}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Sort + price filter row */}
      <View style={styles.sortRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortContent}>
          {SORT_OPTIONS.map(opt => (
            <Pressable
              key={opt.value}
              style={[styles.sortPill, { backgroundColor: sortBy === opt.value ? C.primary + '22' : C.surface, borderColor: sortBy === opt.value ? C.primary : C.border }]}
              onPress={() => setSortBy(opt.value)}
            >
              <Text style={[styles.sortPillText, { color: sortBy === opt.value ? C.primary : C.textMuted }]}>{opt.label}</Text>
            </Pressable>
          ))}
          <View style={[styles.sortDivider, { backgroundColor: C.border }]} />
          {PRICE_RANGES.map(opt => (
            <Pressable
              key={opt.value}
              style={[styles.sortPill, { backgroundColor: priceRange === opt.value ? '#F59E0B22' : C.surface, borderColor: priceRange === opt.value ? '#F59E0B' : C.border }]}
              onPress={() => setPriceRange(opt.value)}
            >
              <Text style={[styles.sortPillText, { color: priceRange === opt.value ? '#F59E0B' : C.textMuted }]}>{opt.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

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
            <Text style={[styles.emptyText, { color: C.textMuted }]}>
              {search ? `No results for "${search}"` : 'No resale tickets in this category right now.'}
            </Text>
            {(search || active !== 'All' || priceRange !== 'all') && (
              <Pressable
                style={[styles.clearFiltersBtn, { borderColor: C.border }]}
                onPress={() => { setSearch(''); setActive('All'); setPriceRange('all'); }}
              >
                <Text style={[styles.clearFiltersText, { color: C.textSecondary }]}>Clear filters</Text>
              </Pressable>
            )}
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
                        style={[styles.buyBtn, { backgroundColor: C.primary }]}
                        onPress={() => handleBuy(listing)}
                      >
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

      {/* ── Buy Confirmation Modal ──────────────────────────────────────────────── */}
      <Modal
        visible={!!buyTarget}
        transparent
        animationType="slide"
        onRequestClose={() => !buying && closeBuyModal()}
      >
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => !buying && closeBuyModal()} />
          <View style={[styles.modalSheet, { backgroundColor: C.card, borderColor: C.border }]}>
            <View style={[styles.handle, { backgroundColor: C.border }]} />

            {buyDone ? (
              /* ── Success screen ── */
              <View style={styles.successWrap}>
                <View style={[styles.successIcon, { backgroundColor: '#22c55e20' }]}>
                  <Ionicons name="checkmark-circle" size={52} color="#22c55e" />
                </View>
                <Text style={[styles.successTitle, { color: C.text }]}>You're Going! 🎉</Text>
                <Text style={[styles.successDesc, { color: C.textMuted }]}>
                  Your ticket for{' '}
                  <Text style={{ color: C.text, fontWeight: '700' }}>{buyTarget?.eventTitle}</Text>
                  {' '}is secured in your Vault as an NFT.
                </Text>
                <Pressable
                  style={[styles.shareBtn, { backgroundColor: '#22c55e' }]}
                  onPress={handleSharePurchase}
                >
                  <Ionicons name="share-social-outline" size={18} color="#fff" />
                  <Text style={styles.shareBtnText}>Share to Socials</Text>
                </Pressable>
                <View style={styles.modalActions}>
                  <Pressable
                    style={[styles.cancelBtn, { borderColor: C.border }]}
                    onPress={closeBuyModal}
                  >
                    <Text style={[styles.cancelBtnText, { color: C.textSecondary }]}>Done</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.confirmBuyBtn, { backgroundColor: C.primary }]}
                    onPress={() => { closeBuyModal(); router.push('/(tabs)/vault'); }}
                  >
                    <Ionicons name="wallet-outline" size={16} color="#fff" />
                    <Text style={styles.confirmBuyText}>View Vault</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              /* ── Confirmation screen ── */
              <>
                <Text style={[styles.modalTitle, { color: C.text }]}>Confirm Purchase</Text>

                {buyTarget && (
                  <>
                    <View style={[styles.buyEventRow, { backgroundColor: C.surface, borderColor: C.border }]}>
                      <Image source={{ uri: buyTarget.eventImage }} style={styles.buyThumb} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.buyEventTitle, { color: C.text }]} numberOfLines={2}>
                          {buyTarget.eventTitle}
                        </Text>
                        <Text style={[styles.buyEventMeta, { color: C.textMuted }]}>
                          {buyTarget.tierName} · ×{buyTarget.quantity}
                        </Text>
                        <Text style={[styles.buyEventMeta, { color: C.textMuted }]}>
                          {buyTarget.eventDate} · {buyTarget.eventLocation}
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.buyPriceRow, { backgroundColor: C.surface, borderColor: C.border }]}>
                      <View style={styles.buyPriceItem}>
                        <Text style={[styles.buyPriceLabel, { color: C.textMuted }]}>Resale Price</Text>
                        <Text style={[styles.buyPriceValue, { color: C.primary }]}>${buyTarget.resalePrice}</Text>
                      </View>
                      <View style={[styles.buyPriceDivider, { backgroundColor: C.border }]} />
                      <View style={styles.buyPriceItem}>
                        <Text style={[styles.buyPriceLabel, { color: C.textMuted }]}>Original</Text>
                        <Text style={[styles.buyPriceValue, { color: C.textSecondary }]}>${buyTarget.originalPrice}</Text>
                      </View>
                      <View style={[styles.buyPriceDivider, { backgroundColor: C.border }]} />
                      <View style={styles.buyPriceItem}>
                        <Text style={[styles.buyPriceLabel, { color: C.textMuted }]}>Seller</Text>
                        <Text style={[styles.buyPriceValue, { color: C.text }]}>@{buyTarget.seller}</Text>
                      </View>
                    </View>

                    <View style={[styles.buyTrustRow, { backgroundColor: '#6366F115', borderColor: '#6366F140' }]}>
                      <Ionicons name="shield-checkmark-outline" size={14} color="#818CF8" />
                      <Text style={[styles.buyTrustText, { color: '#818CF8' }]}>
                        Secured via Paynow · NFT transferred on TON blockchain
                      </Text>
                    </View>
                  </>
                )}

                <View style={styles.modalActions}>
                  <Pressable
                    style={[styles.cancelBtn, { borderColor: C.border }]}
                    onPress={closeBuyModal}
                    disabled={buying}
                  >
                    <Text style={[styles.cancelBtnText, { color: C.textSecondary }]}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.confirmBuyBtn, { backgroundColor: buying ? C.primary + 'aa' : C.primary }]}
                    onPress={confirmBuy}
                    disabled={buying}
                  >
                    {buying
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <>
                          <Ionicons name="bag-check-outline" size={16} color="#fff" />
                          <Text style={styles.confirmBuyText}>Buy Now · ${buyTarget?.resalePrice}</Text>
                        </>
                    }
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Make Offer Modal ─────────────────────────────────────────────────────── */}
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
            <View style={[styles.handle, { backgroundColor: C.border }]} />

            {offerSent ? (
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
                <Pressable style={[styles.doneBtn, { backgroundColor: C.primary }]} onPress={closeOfferModal}>
                  <Text style={styles.doneBtnText}>Done</Text>
                </Pressable>
              </View>
            ) : (
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

                <Text style={[styles.offerLabel, { color: C.textSecondary, marginTop: 12 }]}>Message (optional)</Text>
                <View style={[styles.offerNoteWrap, { borderColor: C.border, backgroundColor: C.surface }]}>
                  <TextInput
                    style={[styles.offerNote, { color: C.text }]}
                    placeholder="Hi, would you accept this price?"
                    placeholderTextColor={C.textMuted}
                    value={offerNote}
                    onChangeText={setOfferNote}
                    multiline
                    maxLength={200}
                  />
                </View>

                <View style={styles.modalActions}>
                  <Pressable style={[styles.cancelBtn, { borderColor: C.border }]} onPress={closeOfferModal}>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10 },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 2 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveText: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },

  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 20, marginBottom: 10, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 14 },

  filterScroll: { maxHeight: 46 },
  filterContent: { paddingHorizontal: 20, gap: 8, alignItems: 'center' },
  pill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  pillText: { fontSize: 13, fontWeight: '600' },

  sortRow: { marginBottom: 4 },
  sortContent: { paddingHorizontal: 20, gap: 6, paddingVertical: 8, alignItems: 'center' },
  sortPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  sortPillText: { fontSize: 12, fontWeight: '600' },
  sortDivider: { width: 1, height: 18, marginHorizontal: 4 },

  list: { flex: 1 },
  listContent: { padding: 20, gap: 16 },

  banner: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 14, borderWidth: 1 },
  bannerText: { fontSize: 13, fontWeight: '600', lineHeight: 19, flex: 1 },

  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyText: { fontSize: 14, textAlign: 'center' },
  clearFiltersBtn: { borderWidth: 1, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginTop: 4 },
  clearFiltersText: { fontSize: 13, fontWeight: '600' },

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

  // Modals
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, paddingTop: 12, paddingHorizontal: 24, paddingBottom: 44 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.4, marginBottom: 16 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelBtn: { flex: 1, height: 50, borderRadius: 50, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600' },

  // Buy modal
  buyEventRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 14 },
  buyThumb: { width: 64, height: 64, borderRadius: 10 },
  buyEventTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4, lineHeight: 20 },
  buyEventMeta: { fontSize: 12, marginBottom: 2 },
  buyPriceRow: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 14 },
  buyPriceItem: { flex: 1, alignItems: 'center', gap: 4 },
  buyPriceDivider: { width: 1, marginHorizontal: 6 },
  buyPriceLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  buyPriceValue: { fontSize: 16, fontWeight: '800' },
  buyTrustRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, padding: 12, borderWidth: 1 },
  buyTrustText: { flex: 1, fontSize: 12, fontWeight: '600' },
  confirmBuyBtn: { flex: 2, height: 50, borderRadius: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  confirmBuyText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  shareBtn: { width: '100%', height: 52, borderRadius: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 },
  shareBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  // Offer modal
  offerEventRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 20 },
  offerThumb: { width: 52, height: 52, borderRadius: 8 },
  offerEventTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  offerEventMeta: { fontSize: 12 },
  offerLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  offerInputWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 16, height: 58, marginBottom: 8 },
  dollarSign: { fontSize: 22, fontWeight: '800', marginRight: 4 },
  offerInput: { flex: 1, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  offerHint: { fontSize: 12, marginBottom: 4 },
  offerNoteWrap: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, minHeight: 72 },
  offerNote: { fontSize: 14, lineHeight: 20 },
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
