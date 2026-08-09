import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, SafeAreaView, FlatList,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { useApp } from '@/context/AppContext';
import TicketCard from '@/components/TicketCard';

type Filter = 'upcoming' | 'past';

export default function VaultScreen() {
  const C = Colors.dark;
  const { tickets } = useApp();
  const [filter, setFilter] = useState<Filter>('upcoming');

  const filtered = tickets.filter(t => t.status === filter);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: C.text }]}>My Vault</Text>
          <Text style={[styles.subtitle, { color: C.textSecondary }]}>Your digital event keys</Text>
        </View>
        <View style={[styles.countBadge, { backgroundColor: C.primary + '22', borderColor: C.primary + '55' }]}>
          <Text style={[styles.countText, { color: C.primary }]}>{tickets.length} keys</Text>
        </View>
      </View>

      {/* NFT info banner */}
      {tickets.length > 0 && (
        <View style={[styles.nftBanner, { backgroundColor: '#6366F115', borderColor: '#6366F140' }]}>
          <Text style={styles.nftBannerText}>⬡ Your tickets are NFTs secured on the TON blockchain</Text>
        </View>
      )}

      {/* Filter tabs */}
      <View style={[styles.filterRow, { backgroundColor: C.card, borderColor: C.border }]}>
        {(['upcoming', 'past'] as Filter[]).map(f => (
          <Pressable
            key={f}
            style={[styles.filterTab, filter === f && { borderBottomColor: C.primary, borderBottomWidth: 2 }]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterTabText, { color: filter === f ? C.primary : C.textMuted }]}>
              {f === 'upcoming' ? '🎟 Upcoming' : '✓ Past'}
              {'  '}<Text style={[styles.filterCount, { color: filter === f ? C.primary : C.textMuted }]}>
                {tickets.filter(t => t.status === f).length}
              </Text>
            </Text>
          </Pressable>
        ))}
      </View>

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🔐</Text>
          <Text style={[styles.emptyTitle, { color: C.text }]}>
            {filter === 'upcoming' ? 'No upcoming events' : 'No past events'}
          </Text>
          <Text style={[styles.emptyText, { color: C.textMuted }]}>
            {filter === 'upcoming'
              ? 'Find an event and get your first digital key.'
              : 'Events you\'ve attended will show up here.'}
          </Text>
          <Text style={[styles.emptyHint, { color: C.textMuted }]}>
            Each ticket is a verified NFT on the TON blockchain.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={t => t.id}
          renderItem={({ item }) => <TicketCard ticket={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 2 },
  countBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  countText: { fontSize: 13, fontWeight: '700' },

  nftBanner: { marginHorizontal: 20, borderRadius: 10, padding: 12, borderWidth: 1, marginBottom: 12 },
  nftBannerText: { color: '#818CF8', fontSize: 12, fontWeight: '600' },

  filterRow: { flexDirection: 'row', marginHorizontal: 20, borderRadius: 12, borderWidth: 1, overflow: 'hidden', marginBottom: 16 },
  filterTab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  filterTabText: { fontSize: 14, fontWeight: '700' },
  filterCount: { fontSize: 13, fontWeight: '600' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingBottom: 60 },
  emptyEmoji: { fontSize: 64, marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 10, textAlign: 'center' },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 21, marginBottom: 12 },
  emptyHint: { fontSize: 12, textAlign: 'center' },

  list: { paddingHorizontal: 20, paddingBottom: 30 },
});
