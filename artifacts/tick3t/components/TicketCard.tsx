import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { PurchasedTicket } from '@/types';

interface TicketCardProps {
  ticket: PurchasedTicket;
}

export default function TicketCard({ ticket }: TicketCardProps) {
  const router = useRouter();
  const C = Colors.dark;
  const upcoming = ticket.status === 'upcoming';

  return (
    <Pressable style={styles.card} onPress={() => router.push(`/ticket/${ticket.id}`)}>
      {/* Top section */}
      <View style={styles.top}>
        <Image source={{ uri: ticket.eventImage }} style={styles.image} />
        <View style={styles.overlay} />
        <View style={styles.topContent}>
          <View style={styles.headerRow}>
            <View style={[styles.statusBadge, { backgroundColor: upcoming ? C.primary + 'CC' : '#475569CC' }]}>
              <Text style={styles.statusText}>{upcoming ? '🎟 Upcoming' : '✓ Attended'}</Text>
            </View>
            {ticket.isNFT && (
              <View style={[styles.statusBadge, { backgroundColor: '#6366F1CC' }]}>
                <Text style={styles.statusText}>⬡ NFT</Text>
              </View>
            )}
          </View>
          <Text style={styles.title} numberOfLines={2}>{ticket.eventTitle}</Text>
          <Text style={styles.sub}>{ticket.eventDate} · {ticket.eventTime}</Text>
        </View>
      </View>

      {/* Perforation */}
      <View style={styles.perforation}>
        <View style={styles.leftCircle} />
        <View style={styles.dash} />
        <View style={styles.rightCircle} />
      </View>

      {/* Bottom section */}
      <View style={styles.bottom}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>LOCATION</Text>
            <Text style={styles.infoValue} numberOfLines={1}>{ticket.eventLocation}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>TIER</Text>
            <Text style={styles.infoValue}>{ticket.tierName}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>QTY</Text>
            <Text style={styles.infoValue}>×{ticket.quantity}</Text>
          </View>
        </View>
        <View style={styles.bottomRow}>
          <Text style={styles.keyCode}>{ticket.keyCode}</Text>
          <Text style={styles.price}>${ticket.totalPaid}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  top: { height: 160, position: 'relative' },
  image: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,12,24,0.6)' },
  topContent: { flex: 1, padding: 16, justifyContent: 'flex-end' },
  headerRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  title: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: -0.2, marginBottom: 4 },
  sub: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },

  perforation: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 0,
    backgroundColor: Colors.dark.background,
  },
  leftCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.dark.background, marginLeft: -10 },
  dash: { flex: 1, borderTopWidth: 2, borderTopColor: Colors.dark.border, borderStyle: 'dashed', marginHorizontal: 8 },
  rightCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.dark.background, marginRight: -10 },

  bottom: { padding: 16 },
  infoRow: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  infoItem: { flex: 1 },
  infoLabel: { color: Colors.dark.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 3 },
  infoValue: { color: Colors.dark.text, fontSize: 13, fontWeight: '600' },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  keyCode: { color: Colors.dark.textMuted, fontSize: 11, fontFamily: 'monospace', letterSpacing: 1 },
  price: { color: Colors.dark.primary, fontSize: 18, fontWeight: '800' },
});
