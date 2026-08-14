import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, Image, FlatList, Alert,
  Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { PurchasedTicket } from '@/types';
import ListForResaleModal from '@/components/ListForResaleModal';
import AuthPrompt from '@/components/AuthPrompt';

type Filter = 'upcoming' | 'past';

// ── Transfer Modal ────────────────────────────────────────────────────────────

function TransferModal({
  visible,
  ticket,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  ticket: PurchasedTicket | null;
  onClose: () => void;
  onConfirm: (ticketId: string, recipient: string) => void;
}) {
  const { colors: C } = useTheme();
  const [recipient, setRecipient] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const reset = () => { setRecipient(''); setLoading(false); setDone(false); setError(''); };
  const handleClose = () => { reset(); onClose(); };

  const handleSend = async () => {
    const val = recipient.trim();
    if (!val) { setError('Enter an email address or TON wallet address.'); return; }
    if (!val.includes('@') && !val.startsWith('EQ') && !val.startsWith('UQ')) {
      setError('Enter a valid email or TON wallet address (starts with EQ… or UQ…).');
      return;
    }
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 1400));
    setLoading(false);
    setDone(true);
    setTimeout(() => {
      onConfirm(ticket!.id, val);
      handleClose();
    }, 1600);
  };

  if (!ticket) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetWrap}>
        <View style={[styles.sheet, { backgroundColor: C.card }]}>
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: C.border }]} />

          {done ? (
            <View style={styles.doneWrap}>
              <View style={[styles.doneCircle, { backgroundColor: '#22c55e22' }]}>
                <Ionicons name="checkmark-circle" size={52} color="#22c55e" />
              </View>
              <Text style={[styles.doneTitle, { color: C.text }]}>Transfer Sent!</Text>
              <Text style={[styles.doneSub, { color: C.textMuted }]}>
                Your ticket for {ticket.eventTitle} has been transferred to{'\n'}
                <Text style={{ color: C.text, fontWeight: '700' }}>{recipient.trim()}</Text>
              </Text>
            </View>
          ) : (
            <>
              <Text style={[styles.modalTitle, { color: C.text }]}>Transfer Ticket</Text>
              <Text style={[styles.modalSub, { color: C.textMuted }]}>
                Send your ticket to another Tick3t user or TON wallet address. This cannot be undone.
              </Text>

              {/* Ticket summary */}
              <View style={[styles.ticketSummary, { backgroundColor: C.background, borderColor: C.border }]}>
                <Image source={{ uri: ticket.eventImage }} style={styles.summaryImage} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.summaryTitle, { color: C.text }]} numberOfLines={1}>
                    {ticket.eventTitle}
                  </Text>
                  <Text style={[styles.summarySub, { color: C.textMuted }]}>
                    {ticket.tierName} · ×{ticket.quantity}
                  </Text>
                </View>
              </View>

              <Text style={[styles.inputLabel, { color: C.textMuted }]}>Recipient</Text>
              <View style={[styles.inputWrap, { borderColor: error ? '#EF4444' : C.border, backgroundColor: C.background }]}>
                <Ionicons name="person-outline" size={16} color={C.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.input, { color: C.text }]}
                  placeholder="Email or TON wallet (EQ…)"
                  placeholderTextColor={C.textMuted}
                  value={recipient}
                  onChangeText={t => { setRecipient(t); setError(''); }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                />
              </View>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <View style={[styles.warnBox, { backgroundColor: '#F59E0B15', borderColor: '#F59E0B40' }]}>
                <Ionicons name="warning-outline" size={14} color="#F59E0B" />
                <Text style={[styles.warnText, { color: '#F59E0B' }]}>
                  Transferred tickets are permanently removed from your Vault.
                </Text>
              </View>

              <View style={styles.modalActions}>
                <Pressable style={[styles.cancelBtn, { borderColor: C.border }]} onPress={handleClose}>
                  <Text style={[styles.cancelBtnText, { color: C.textSecondary }]}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.transferBtn, loading && { opacity: 0.7 }]}
                  onPress={handleSend}
                  disabled={loading}
                >
                  {loading
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.transferBtnText}>Transfer →</Text>
                  }
                </Pressable>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Vault Ticket Card ─────────────────────────────────────────────────────────

function VaultTicketCard({
  ticket,
  isListed,
  listedListingId,
  onListResale,
  onCancelListing,
  onTransfer,
}: {
  ticket: PurchasedTicket;
  isListed: boolean;
  listedListingId?: string;
  onListResale: (t: PurchasedTicket) => void;
  onCancelListing: (listingId: string) => void;
  onTransfer: (t: PurchasedTicket) => void;
}) {
  const { colors: C } = useTheme();
  const router = useRouter();
  const upcoming = ticket.status === 'upcoming';

  const handleCancelListing = () => {
    Alert.alert(
      'Cancel Listing',
      'Remove this ticket from the Marketplace? You can relist it any time.',
      [
        { text: 'Keep Listed', style: 'cancel' },
        {
          text: 'Cancel Listing',
          style: 'destructive',
          onPress: () => listedListingId && onCancelListing(listedListingId),
        },
      ]
    );
  };

  return (
    <View style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}>
      {/* Top: event image — tap to view ticket detail */}
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
            <Text style={styles.eventSub}>{ticket.eventDate}{ticket.eventTime ? ` · ${ticket.eventTime}` : ''}</Text>
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

        {/* Primary actions row */}
        <View style={styles.actionsRow}>
          <Pressable
            style={[styles.viewBtn, { borderColor: C.border }]}
            onPress={() => router.push(`/ticket/${ticket.id}`)}
          >
            <Ionicons name="qr-code-outline" size={14} color={C.textSecondary} />
            <Text style={[styles.viewBtnText, { color: C.textSecondary }]}>View Ticket</Text>
          </Pressable>

          {upcoming && (
            <Pressable
              style={[styles.transferBtn2, { borderColor: C.border }]}
              onPress={() => onTransfer(ticket)}
            >
              <Ionicons name="arrow-redo-outline" size={14} color={C.textSecondary} />
              <Text style={[styles.viewBtnText, { color: C.textSecondary }]}>Transfer</Text>
            </Pressable>
          )}
        </View>

        {/* Resale action row */}
        {upcoming && (
          <View style={styles.resaleRow}>
            {isListed ? (
              <Pressable
                style={[styles.cancelListingBtn, { backgroundColor: '#F59E0B15', borderColor: '#F59E0B44' }]}
                onPress={handleCancelListing}
              >
                <Ionicons name="close-circle-outline" size={14} color="#F59E0B" />
                <Text style={[styles.cancelListingText, { color: '#F59E0B' }]}>Cancel Listing</Text>
              </Pressable>
            ) : (
              <Pressable
                style={[styles.resaleBtn, { backgroundColor: C.primary }]}
                onPress={() => onListResale(ticket)}
              >
                <Ionicons name="storefront-outline" size={14} color="#fff" />
                <Text style={styles.resaleBtnText}>List for Resale</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

// ── Vault Screen ──────────────────────────────────────────────────────────────

export default function VaultScreen() {
  const { colors: C } = useTheme();
  const { isAuthenticated } = useAuth();
  const { tickets, listedTicketIds, marketplace, addMarketplaceListing, cancelListing, transferTicket } = useApp();
  const router = useRouter();

  // All hooks must be called unconditionally before any early returns
  const [filter, setFilter] = useState<Filter>('upcoming');
  const [modalTicket, setModalTicket] = useState<PurchasedTicket | null>(null);
  const [transferTicketItem, setTransferTicketItem] = useState<PurchasedTicket | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[{ flex: 1 }, { backgroundColor: C.background }]} edges={['top']}>
        <AuthPrompt
          screen="Your Vault"
          description="Sign in to access your tickets. Every ticket you purchase is stored here as a blockchain-verified NFT."
          icon="wallet-outline"
          perks={[
            'View all your upcoming & past tickets',
            'Access your NFT ticket QR codes for entry',
            'List tickets for resale in the Marketplace',
            'Transfer tickets to friends instantly',
          ]}
        />
      </SafeAreaView>
    );
  }

  const filtered = tickets.filter(t => t.status === filter);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const handleConfirmListing = (ticket: PurchasedTicket, price: number) => {
    addMarketplaceListing(ticket, price);
    setModalTicket(null);
    showSuccess(`Listed for $${price}! Your ticket is now live in the Marketplace.`);
  };

  const handleCancelListing = (listingId: string) => {
    cancelListing(listingId);
    showSuccess('Listing cancelled. Ticket returned to your Vault.');
  };

  const handleTransferConfirm = async (ticketId: string, recipient: string) => {
    await transferTicket(ticketId);
    showSuccess(`Ticket transferred to ${recipient}.`);
  };

  // Find the marketplace listing ID for a given ticket (so we can cancel it)
  const getListingId = (ticketId: string) =>
    marketplace.find(l => l.ticketId === ticketId)?.id;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: C.text }]}>My Vault</Text>
          <Text style={[styles.subtitle, { color: C.textSecondary }]}>Your tickets & NFT keys</Text>
        </View>
        <View style={[styles.countBadge, { backgroundColor: C.primary + '22', borderColor: C.primary + '55' }]}>
          <Ionicons name="wallet-outline" size={13} color={C.primary} />
          <Text style={[styles.countText, { color: C.primary }]}>{tickets.length} ticket{tickets.length !== 1 ? 's' : ''}</Text>
        </View>
      </View>

      {/* Success / info banner */}
      {successMsg ? (
        <View style={[styles.successBanner, { backgroundColor: C.primary + '20', borderColor: C.primary + '50' }]}>
          <Ionicons name="checkmark-circle" size={16} color={C.primary} />
          <Text style={[styles.successText, { color: C.primary }]}>{successMsg}</Text>
        </View>
      ) : null}

      {/* NFT info banner (only when user has tickets) */}
      {tickets.length > 0 && !successMsg && (
        <View style={[styles.nftBanner, { backgroundColor: '#6366F115', borderColor: '#6366F140' }]}>
          <Text style={styles.nftBannerText}>⬡ Your tickets are NFTs on the TON blockchain · Show QR at entry</Text>
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
          <Ionicons name={filter === 'upcoming' ? 'ticket-outline' : 'time-outline'} size={60} color={C.textMuted} />
          <Text style={[styles.emptyTitle, { color: C.text }]}>
            {filter === 'upcoming' ? 'No upcoming tickets' : 'No past events'}
          </Text>
          <Text style={[styles.emptyText, { color: C.textMuted }]}>
            {filter === 'upcoming'
              ? 'Buy a ticket from Discover — it appears here as a blockchain-verified NFT.'
              : 'Events you attend will show up here after the event date.'}
          </Text>
          {filter === 'upcoming' && (
            <Pressable
              style={[styles.discoverBtn, { backgroundColor: C.primary }]}
              onPress={() => router.push('/(tabs)/')}
            >
              <Ionicons name="search-outline" size={15} color="#fff" />
              <Text style={styles.discoverBtnText}>Browse Events</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={t => t.id}
          renderItem={({ item }) => (
            <VaultTicketCard
              ticket={item}
              isListed={listedTicketIds.has(item.id)}
              listedListingId={getListingId(item.id)}
              onListResale={setModalTicket}
              onCancelListing={handleCancelListing}
              onTransfer={setTransferTicketItem}
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

      <TransferModal
        visible={transferTicketItem !== null}
        ticket={transferTicketItem}
        onClose={() => setTransferTicketItem(null)}
        onConfirm={handleTransferConfirm}
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 2 },
  countBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  countText: { fontSize: 13, fontWeight: '700' },

  successBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 20, borderRadius: 10, padding: 12, borderWidth: 1, marginBottom: 8 },
  successText: { fontSize: 13, fontWeight: '600', flex: 1 },

  nftBanner: { marginHorizontal: 20, borderRadius: 10, padding: 12, borderWidth: 1, marginBottom: 12 },
  nftBannerText: { color: '#818CF8', fontSize: 12, fontWeight: '600' },

  filterRow: { flexDirection: 'row', marginHorizontal: 20, borderRadius: 12, borderWidth: 1, overflow: 'hidden', marginBottom: 16 },
  filterTab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  filterTabText: { fontSize: 14, fontWeight: '700' },
  filterCount: { fontSize: 13, fontWeight: '600' },

  list: { paddingHorizontal: 20, paddingBottom: 100 },

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

  bottom: { padding: 14, gap: 10 },
  infoRow: { flexDirection: 'row', marginBottom: 4 },
  infoItem: { flex: 1 },
  infoLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 3 },
  infoValue: { fontSize: 14, fontWeight: '700' },

  actionsRow: { flexDirection: 'row', gap: 8 },
  viewBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  viewBtnText: { fontSize: 13, fontWeight: '600' },
  transferBtn2: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },

  resaleRow: { flexDirection: 'row' },
  resaleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 10 },
  resaleBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  cancelListingBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  cancelListingText: { fontSize: 13, fontWeight: '700' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingBottom: 60, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 21 },
  discoverBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 50, marginTop: 8 },
  discoverBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  // Transfer modal
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheetWrap: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },

  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 6, letterSpacing: -0.3 },
  modalSub: { fontSize: 13, lineHeight: 19, marginBottom: 18 },

  ticketSummary: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, padding: 12, borderWidth: 1, marginBottom: 18 },
  summaryImage: { width: 44, height: 44, borderRadius: 8 },
  summaryTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  summarySub: { fontSize: 12 },

  inputLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 6 },
  input: { flex: 1, fontSize: 15 },
  errorText: { color: '#EF4444', fontSize: 12, marginBottom: 10 },

  warnBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 10, padding: 12, borderWidth: 1, marginTop: 10, marginBottom: 20 },
  warnText: { flex: 1, fontSize: 12, lineHeight: 17 },

  modalActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  cancelBtnText: { fontSize: 15, fontWeight: '700' },
  transferBtn: { flex: 2, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#22c55e' },
  transferBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  doneWrap: { alignItems: 'center', paddingVertical: 24, gap: 10 },
  doneCircle: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  doneTitle: { fontSize: 22, fontWeight: '800' },
  doneSub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
