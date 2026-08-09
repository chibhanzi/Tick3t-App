import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, TextInput,
  SafeAreaView, FlatList, StatusBar,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { useApp } from '@/context/AppContext';
import EventCard from '@/components/EventCard';
import Logo from '@/components/Logo';
import { EventCategory } from '@/types';

const CATEGORIES: EventCategory[] = ['All', 'Music Festival', 'Art & Culture', 'Tech & Networking', 'Gaming', 'Beach Party', 'Fashion'];
const PRICE_FILTERS = ['All', 'Under $100', '$100–$200', 'Over $200'];

export default function DiscoverScreen() {
  const C = Colors.dark;
  const { events } = useApp();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<EventCategory>('All');
  const [priceFilter, setPriceFilter] = useState('All');

  const filtered = useMemo(() => {
    return events.filter(e => {
      const matchSearch =
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.location.toLowerCase().includes(search.toLowerCase()) ||
        e.organizer.toLowerCase().includes(search.toLowerCase());
      const matchCat = category === 'All' || e.category === category;
      let matchPrice = true;
      if (priceFilter === 'Under $100') matchPrice = e.price < 100;
      else if (priceFilter === '$100–$200') matchPrice = e.price >= 100 && e.price <= 200;
      else if (priceFilter === 'Over $200') matchPrice = e.price > 200;
      return matchSearch && matchCat && matchPrice;
    });
  }, [events, search, category, priceFilter]);

  const featured = events.find(e => e.featured);
  const totalAvailable = events.reduce((s, e) => s + e.available, 0);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[0]}>
        {/* Sticky header */}
        <View style={[styles.stickyHeader, { backgroundColor: C.background }]}>
          {/* Branding row */}
          <View style={styles.brandRow}>
            <Logo size="md" />
            <View style={[styles.nftChip, { backgroundColor: '#6366F122', borderColor: '#6366F144' }]}>
              <Text style={[styles.nftChipText, { color: '#818CF8' }]}>⬡ NFT Tickets</Text>
            </View>
          </View>

          {/* Search */}
          <View style={[styles.searchBar, { backgroundColor: C.card, borderColor: C.border }]}>
            <Text style={[styles.searchIcon, { color: C.textMuted }]}>🔍</Text>
            <TextInput
              style={[styles.searchInput, { color: C.text }]}
              placeholder="Search events, artists, or venues…"
              placeholderTextColor={C.textMuted}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')}>
                <Text style={{ color: C.textMuted, fontSize: 16, paddingRight: 4 }}>✕</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Stats bar */}
        <View style={[styles.statsBar, { backgroundColor: C.card, borderColor: C.border }]}>
          {[
            { icon: '📅', value: `${events.length}`, label: 'Live Events' },
            { icon: '🎫', value: `${totalAvailable.toLocaleString()}`, label: 'Tickets Avail.' },
            { icon: '📍', value: '6', label: 'Cities' },
          ].map((s, i) => (
            <View key={i} style={[styles.statItem, i < 2 && { borderRightWidth: 1, borderRightColor: C.border }]}>
              <Text style={styles.statIcon}>{s.icon}</Text>
              <Text style={[styles.statValue, { color: C.text }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: C.textMuted }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Category pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={styles.catContent}>
          {CATEGORIES.map(cat => (
            <Pressable
              key={cat}
              style={[styles.catPill, { backgroundColor: category === cat ? C.primary : C.card, borderColor: category === cat ? C.primary : C.border }]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.catPillText, { color: category === cat ? '#fff' : C.textSecondary }]}>{cat}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Price filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.priceScroll} contentContainerStyle={styles.catContent}>
          {PRICE_FILTERS.map(pf => (
            <Pressable
              key={pf}
              style={[styles.pricePill, { backgroundColor: priceFilter === pf ? C.accent + '33' : 'transparent', borderColor: priceFilter === pf ? C.accent : C.border }]}
              onPress={() => setPriceFilter(pf)}
            >
              <Text style={[styles.pricePillText, { color: priceFilter === pf ? C.accent : C.textMuted }]}>{pf}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.content}>
          {/* Featured event */}
          {!search && category === 'All' && priceFilter === 'All' && featured && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: C.text }]}>⭐ Featured</Text>
              </View>
              <EventCard event={featured} variant="featured" />
            </View>
          )}

          {/* Event listing */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: C.text }]}>
                {search || category !== 'All' || priceFilter !== 'All' ? `Results (${filtered.length})` : 'All Events'}
              </Text>
            </View>

            {filtered.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>🎪</Text>
                <Text style={[styles.emptyTitle, { color: C.text }]}>No events found</Text>
                <Text style={[styles.emptyText, { color: C.textMuted }]}>Try a different search or category.</Text>
              </View>
            ) : (
              filtered.map(event => <EventCard key={event.id} event={event} variant="list" />)
            )}
          </View>

          {/* Trust signals */}
          <View style={[styles.trustCard, { backgroundColor: C.card, borderColor: C.border }]}>
            <Text style={[styles.trustTitle, { color: C.text }]}>Why Tick3rt?</Text>
            {[
              { icon: '⬡', title: 'NFT Tickets', desc: 'Every ticket is secured on the TON blockchain.' },
              { icon: '🔒', title: 'Secure Payment', desc: 'Pay safely via Paynow — encrypted & verified.' },
              { icon: '✓', title: 'Verified Resale', desc: 'All marketplace listings are seller-verified.' },
              { icon: '🎨', title: 'Custom Ticket Design', desc: 'Personalized digital keys unique to each event.' },
            ].map((t, i) => (
              <View key={i} style={[styles.trustRow, i > 0 && { borderTopWidth: 1, borderTopColor: C.border }]}>
                <Text style={styles.trustIcon}>{t.icon}</Text>
                <View style={styles.trustText}>
                  <Text style={[styles.trustItemTitle, { color: C.text }]}>{t.title}</Text>
                  <Text style={[styles.trustItemDesc, { color: C.textMuted }]}>{t.desc}</Text>
                </View>
              </View>
            ))}
          </View>
          <View style={{ height: 24 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  stickyHeader: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  nftChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  nftChipText: { fontSize: 12, fontWeight: '700' },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, height: 48, gap: 10 },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 15 },

  statsBar: { flexDirection: 'row', marginHorizontal: 20, borderRadius: 14, borderWidth: 1, overflow: 'hidden', marginTop: 14 },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 3 },
  statIcon: { fontSize: 18 },
  statValue: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
  statLabel: { fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.8 },

  catScroll: { marginTop: 14 },
  catContent: { paddingHorizontal: 20, gap: 8 },
  catPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  catPillText: { fontSize: 13, fontWeight: '600' },

  priceScroll: { marginTop: 8 },
  pricePill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  pricePillText: { fontSize: 12, fontWeight: '500' },

  content: { paddingHorizontal: 20 },
  section: { marginTop: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },

  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyText: { fontSize: 14 },

  trustCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginTop: 24 },
  trustTitle: { fontSize: 16, fontWeight: '800', padding: 16, paddingBottom: 12 },
  trustRow: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 14 },
  trustIcon: { fontSize: 20, marginTop: 2 },
  trustText: { flex: 1 },
  trustItemTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  trustItemDesc: { fontSize: 12, lineHeight: 18 },
});
