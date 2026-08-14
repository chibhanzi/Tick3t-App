import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Image, Alert, Share, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { Colors } from '@/constants/colors';
import { useApp } from '@/context/AppContext';
import { formatPurchaseDate } from '@/utils/format';

export default function TicketDetailScreen() {
  const C = Colors.dark;
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getTicketById } = useApp();
  const ticket = getTicketById(id ?? '');

  if (!ticket) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]} edges={['top']}>
        <Pressable style={styles.closeBtn} onPress={() => router.back()}>
          <Text style={{ color: C.text, fontSize: 24 }}>✕</Text>
        </Pressable>
        <View style={styles.notFound}>
          <Text style={[styles.notFoundText, { color: C.text }]}>Ticket not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const upcoming = ticket.status === 'upcoming';

  const qrData = JSON.stringify({
    keyCode: ticket.keyCode,
    event: ticket.eventTitle,
    tier: ticket.tierName,
    holder: ticket.holderName,
    qty: ticket.quantity,
    isNFT: ticket.isNFT,
  });

  const handleCopyCode = async () => {
    if (Platform.OS === 'web') {
      try {
        await (navigator as any).clipboard?.writeText(ticket.keyCode);
        Alert.alert('Copied!', `Key code ${ticket.keyCode} copied to clipboard.`);
      } catch {
        Alert.alert('Key Code', ticket.keyCode);
      }
    } else {
      Alert.alert('Key Code', ticket.keyCode, [{ text: 'OK' }]);
    }
  };

  const handleShare = async () => {
    const text = `🎟 ${ticket.eventTitle}\n${ticket.tierName} × ${ticket.quantity}\n📍 ${ticket.eventLocation}\n\nKey: ${ticket.keyCode}\n\nPowered by Tick3t — Own Your Access`;
    if (Platform.OS === 'web') {
      try { await (navigator as any).share?.({ text }); } catch {
        try { await (navigator as any).clipboard?.writeText(text); Alert.alert('Copied!', 'Ticket info copied to clipboard.'); }
        catch { Alert.alert('Share', text); }
      }
    } else {
      await Share.share({ message: text });
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backRow} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={18} color={C.textSecondary} />
          <Text style={[styles.closeText, { color: C.textSecondary }]}>Back</Text>
        </Pressable>
        <Pressable style={styles.shareRow} onPress={handleShare}>
          <Ionicons name="share-outline" size={16} color={C.primary} />
          <Text style={[styles.shareText, { color: C.primary }]}>Share</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Ticket card */}
        <View style={[styles.ticketCard, { backgroundColor: C.card, borderColor: C.border }]}>
          {/* Event image */}
          <View style={styles.imageSection}>
            <Image source={{ uri: ticket.eventImage }} style={styles.eventImage} />
            <View style={styles.imageOverlay} />
            <View style={styles.imageContent}>
              <View style={styles.imageBadges}>
                <View style={[styles.badge, { backgroundColor: upcoming ? C.primary + 'CC' : '#475569CC' }]}>
                  <Text style={styles.badgeText}>{upcoming ? '🎟 Upcoming' : '✓ Attended'}</Text>
                </View>
                {ticket.isNFT && (
                  <View style={[styles.badge, { backgroundColor: '#6366F1CC' }]}>
                    <Text style={styles.badgeText}>⬡ NFT</Text>
                  </View>
                )}
              </View>
              <Text style={styles.eventTitle}>{ticket.eventTitle}</Text>
              <Text style={styles.eventSub}>{ticket.eventDate}{ticket.eventTime ? ` · ${ticket.eventTime}` : ''}</Text>
              <Text style={styles.eventSub}>📍 {ticket.eventLocation}</Text>
            </View>
          </View>

          {/* Perforation */}
          <View style={[styles.perforation, { backgroundColor: C.background }]}>
            <View style={[styles.circle, styles.circleLeft, { backgroundColor: C.background }]} />
            <View style={[styles.dashLine, { borderColor: C.border }]} />
            <View style={[styles.circle, styles.circleRight, { backgroundColor: C.background }]} />
          </View>

          {/* QR section */}
          <View style={styles.qrSection}>
            <Text style={[styles.presentLabel, { color: C.textMuted }]}>PRESENT AT ENTRY</Text>
            <View style={[styles.qrWrapper, { backgroundColor: '#fff', borderColor: C.border }]}>
              <QRCode
                value={qrData}
                size={200}
                color="#050C18"
                backgroundColor="#fff"
              />
            </View>
            {/* Tap to copy key code */}
            <Pressable onPress={handleCopyCode} style={styles.keyCodeRow}>
              <Text style={[styles.keyCode, { color: C.textMuted }]}>{ticket.keyCode}</Text>
              <Ionicons name="copy-outline" size={14} color={C.textMuted} style={{ marginLeft: 6 }} />
            </Pressable>
            <Text style={[styles.tapHint, { color: C.textMuted }]}>Tap to copy key code</Text>
          </View>

          {/* Perforation */}
          <View style={[styles.perforation, { backgroundColor: C.background }]}>
            <View style={[styles.circle, styles.circleLeft, { backgroundColor: C.background }]} />
            <View style={[styles.dashLine, { borderColor: C.border }]} />
            <View style={[styles.circle, styles.circleRight, { backgroundColor: C.background }]} />
          </View>

          {/* Details grid */}
          <View style={styles.detailsGrid}>
            {[
              { label: 'HOLDER', value: ticket.holderName },
              { label: 'TIER', value: ticket.tierName },
              { label: 'QUANTITY', value: `×${ticket.quantity}` },
              { label: 'TOTAL PAID', value: `$${ticket.totalPaid}` },
              { label: 'PURCHASED', value: formatPurchaseDate(ticket.purchasedAt) },
              { label: 'STATUS', value: upcoming ? 'Active' : 'Used' },
            ].map((row, i) => (
              <View key={i} style={[styles.detailRow, i > 0 && { borderTopWidth: 1, borderTopColor: C.border }]}>
                <Text style={[styles.detailLabel, { color: C.textMuted }]}>{row.label}</Text>
                <Text style={[styles.detailValue, { color: C.text }]}>{row.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* NFT info */}
        {ticket.isNFT && (
          <View style={[styles.nftCard, { backgroundColor: '#6366F115', borderColor: '#6366F140' }]}>
            <Text style={[styles.nftTitle, { color: '#818CF8' }]}>⬡ NFT Ticket on TON Blockchain</Text>
            <Text style={[styles.nftDesc, { color: C.textSecondary }]}>
              This ticket is a verified NFT secured on the TON blockchain. It is unique, tamper-proof, and transferable. Connect your TON wallet to claim full ownership.
            </Text>
            <Pressable
              style={[styles.walletBtn, { borderColor: '#6366F1' }]}
              onPress={() => Alert.alert('Connect Wallet', 'TON wallet integration coming soon.')}
            >
              <Ionicons name="wallet-outline" size={14} color="#818CF8" />
              <Text style={[styles.walletBtnText, { color: '#818CF8' }]}>Connect TON Wallet</Text>
            </Pressable>
          </View>
        )}

        {/* Payment info */}
        <View style={[styles.payCard, { backgroundColor: C.card, borderColor: C.border }]}>
          <Text style={[styles.payTitle, { color: C.textMuted }]}>🔒 Payment secured via Paynow</Text>
          <Text style={[styles.payDesc, { color: C.textMuted }]}>
            Your transaction is encrypted and verified. Receipt sent to {ticket.holderName}.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  shareRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  closeText: { fontSize: 15, fontWeight: '600' },
  shareText: { fontSize: 15, fontWeight: '700' },
  closeBtn: {},

  scroll: { paddingHorizontal: 20, paddingBottom: 20 },

  ticketCard: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, marginBottom: 16 },

  imageSection: { height: 200, position: 'relative' },
  eventImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  imageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,12,24,0.65)' },
  imageContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 18 },
  imageBadges: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  eventTitle: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: -0.3, marginBottom: 4 },
  eventSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginBottom: 2 },

  perforation: { flexDirection: 'row', alignItems: 'center', height: 24 },
  circle: { width: 24, height: 24, borderRadius: 12 },
  circleLeft: { marginLeft: -12 },
  circleRight: { marginRight: -12 },
  dashLine: { flex: 1, borderTopWidth: 2, borderStyle: 'dashed', marginHorizontal: 6 },

  qrSection: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 20 },
  presentLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 20 },
  qrWrapper: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  keyCodeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  keyCode: { fontFamily: 'monospace', fontSize: 14, letterSpacing: 2 },
  tapHint: { fontSize: 10, letterSpacing: 0.5 },

  detailsGrid: { paddingHorizontal: 20, paddingBottom: 20 },
  detailRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  detailLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  detailValue: { fontSize: 14, fontWeight: '600' },

  nftCard: { borderRadius: 14, padding: 16, borderWidth: 1, marginBottom: 12 },
  nftTitle: { fontSize: 15, fontWeight: '800', marginBottom: 8 },
  nftDesc: { fontSize: 13, lineHeight: 20, marginBottom: 14 },
  walletBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10, alignSelf: 'flex-start' },
  walletBtnText: { fontSize: 13, fontWeight: '700' },

  payCard: { borderRadius: 12, padding: 14, borderWidth: 1 },
  payTitle: { fontSize: 13, fontWeight: '700', marginBottom: 6 },
  payDesc: { fontSize: 12, lineHeight: 18 },

  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { fontSize: 18 },
});
