import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, Image, FlatList, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { PurchasedTicket } from '@/types';
import ListForResaleModal from '@/components/ListForResaleModal';
import AuthPrompt from '@/components/AuthPrompt';

type Filter = 'upcoming' | 'past';

function VaultTicketCard({
  ticket,
  isListed,
  onListResale,
}: {
  ticket: PurchasedTicket;
  isListed: boolean;
  onListResale: (t: PurchasedTicket) => void;
}) {
  const { colors: C } = useTheme();
  const router = useRouter();
  const upcoming = ticket.status === 'upcoming';

  return (
    <View style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}>
      {/* Top: event image */}
      <Pressable onPress={() => router.push(`/ticket/${ticket.id}`)}>
        <View style={styles.imageWrap}>
          <Image source={{ uri: ticket.eventImage }} style={styles.image} />
          <View style={styles.imageOverlay} />
          <View style={styles.imageBadges}>
            <View style={[styles.badge, { backgroundColor: upcoming ? C.primary + 'CC' : '#475569CC' }]}>
              <Text style={styles.badgeText}>{upcoming ? '🎟 Upcoming' : '✓ Attended'}</Text>
            </View>
            {ticket.isNFT && (
              <View style={[styles.badge, { backgroundColor: '#6366F1CC' }]}>
                <Text style={styles.badgeText}>⬡ NFT</Text>
              </View>
            )}
            {isListed && (
              <View style={[styles.badge, { backgroundColor: '#F59E0BCC' }]}>
                <Text style={styles.badgeText}>🏷 Listed</Text>
              </View>
            )}
          </View>
          <View style={styles.imageContent}>
            <Text style={styles.eventTitle} numberOfLines={1}>{ticket.eventTitle}</Text>
            <Text style={styles.eventSub}>{ticket.eventDate} · {ticket.eventTime}</Text>
            <Text style={styles.eventSub}>📍 {ticket.eventLocation}</Text>
          </View>
        </View>
      </Pressable>

      {/* Perforation */}
      <View style={[styles.perf, { backgroundColor: C.background }]}>
        <View style={[styles.circle, { marginLeft: -12, backgroundColor: C.background }]} />
        <View style={[styles.dash, { borderColor: C.border }]} />
        <View style={[styles.circle, { marginRight: -12, backgroundColor: C.background }]} />
      </View>

      {/* Bottom: info + actions */}
      <View style={styles.bottom}>
        <View style={styles.infoRow}>
          {[
            { label: 'TIER', value: ticket.tierName },
            { label: 'QTY', value: `×${ticket.quantity}` },
            { label: 'PAID', value: `$${ticket.totalPaid}` },
          ].map((item, i) => (
            <View key={i} style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: C.textMuted }]}>{item.label}</Text>
              <Text style={[styles.infoValue, { color: C.text }]}>{item.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <Pressable
            style={[styles.viewBtn, { borderColor: C.border }]}
            onPress={() => router.push(`/ticket/${ticket.id}`)}
          >
            <Text style={[styles.viewBtnText, { color: C.textSecondary }]}>View Key</Text>
          </Pressable>

          {upcoming && (
            isListed ? (
              <View style={[styles.listedBadge, { backgroundColor: '#F59E0B22', borderColor: '#F59E0B44' }]}>
                <Text style={[styles.listedBadgeText, { color: '#F59E0B' }]}>🏷 Listed for Resale</Text>
              </View>
            ) : (
              <Pressable
                style={[styles.resaleBtn, { backgroundColor: C.primary }]}
                onPress={() => onListResale(ticket)}
              >
                <Text style={styles.resaleBtnText}>List for Resale →</Text>
              </Pressable>
            )
          )}
        </View>
      </View>
    </View>
  );
}

export default function VaultScreen() {
  const { colors: C } = useTheme();
  const { isAuthenticated } = useAuth();
  const { tickets, listedTicketIds, addMarketplaceListing } = useApp();

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[{ flex: 1 }, { backgroundColor: C.background }]} edges={['top']}>
        <AuthPrompt
          screen="Your Vault"
          description="Sign in to access your digital event keys. Every ticket you purchase is stored here as a blockchain-verified NFT."
          icon="wallet-outline"
          perks={[
            'View all your upcoming & past tickets',
            'Access your NFT keys on TON blockchain',
            'List tickets for resale in the Marketplace',
          ]}
        />
      </SafeAreaView>
    );
  }
  const [filter, setFilter] = useState<Filter>('upcoming');
  const [modalTicket, setModalTicket] = useState<PurchasedTicket | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const filtered = tickets.filter(t => t.status === filter);

  const handleConfirmListing = (ticket: PurchasedTicket, price: number) => {
    addMarketplaceListing(ticket, price);
    setModalTicket(null);
    setSuccessMsg(`Listed for $${price}! Your ticket is now live in the Marketplace.`);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]} edges={['top']}>
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

      {/* Success message */}
      {successMsg ? (
        <View style={[styles.successBanner, { backgroundColor: C.primary + '20', borderColor: C.primary + '50' }]}>
          <Text style={[styles.successText, { color: C.primary }]}>✓ {successMsg}</Text>
        </View>
      ) : null}

      {/* NFT info banner */}
      {tickets.length > 0 && (
        <View style={[styles.nftBanner, { backgroundColor: '#6366F115', borderColor: '#6366F140' }]}>
          <Text style={styles.nftBannerText}>⬡ Your tickets are NFTs secured on the TON blockchain · Tap "List for Resale" to sell</Text>
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
              {'  '}
              <Text style={[styles.filterCount, { color: filter === f ? C.primary : C.textMuted }]}>
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
              ? 'Buy a ticket from Discover — it will appear here as an NFT key.'
              : "Events you've attended will show up here."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={t => t.id}
          renderItem={({ item }) => (
            <VaultTicketCard
              ticket={item}
              isListed={listedTicketIds.has(item.id)}
              onListResale={setModalTicket}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <ListForResaleModal
        visible={modalTicket !== null}
        ticket={modalTicket}
        onClose={() => setModalTicket(null)}
        onConfirm={handleConfirmListing}
      />
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

  successBanner: { marginHorizontal: 20, borderRadius: 10, padding: 12, borderWidth: 1, marginBottom: 8 },
  successText: { fontSize: 13, fontWeight: '600' },

  nftBanner: { marginHorizontal: 20, borderRadius: 10, padding: 12, borderWidth: 1, marginBottom: 12 },
  nftBannerText: { color: '#818CF8', fontSize: 12, fontWeight: '600' },

  filterRow: { flexDirection: 'row', marginHorizontal: 20, borderRadius: 12, borderWidth: 1, overflow: 'hidden', marginBottom: 16 },
  filterTab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  filterTabText: { fontSize: 14, fontWeight: '700' },
  filterCount: { fontSize: 13, fontWeight: '600' },

  list: { paddingHorizontal: 20, paddingBottom: 30 },

  card: { borderRadius: 16, overflow: 'hidden', marginBottom: 16, borderWidth: 1 },
  imageWrap: { height: 170, position: 'relative' },
  image: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  imageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,12,24,0.6)' },
  imageBadges: { position: 'absolute', top: 14, left: 14, flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  imageContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14 },
  eventTitle: { color: '#fff', fontSize: 17, fontWeight: '800', marginBottom: 4 },
  eventSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginBottom: 2 },

  perf: { flexDirection: 'row', alignItems: 'center', height: 24 },
  circle: { width: 24, height: 24, borderRadius: 12 },
  dash: { flex: 1, borderTopWidth: 2, borderStyle: 'dashed', marginHorizontal: 6 },

  bottom: { padding: 14 },
  infoRow: { flexDirection: 'row', marginBottom: 14 },
  infoItem: { flex: 1 },
  infoLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 3 },
  infoValue: { fontSize: 14, fontWeight: '700' },

  actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  viewBtn: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  viewBtnText: { fontSize: 13, fontWeight: '600' },
  resaleBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  resaleBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  listedBadge: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center', borderWidth: 1 },
  listedBadgeText: { fontSize: 13, fontWeight: '700' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingBottom: 60 },
  emptyEmoji: { fontSize: 64, marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 10, textAlign: 'center' },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 21 },
});
