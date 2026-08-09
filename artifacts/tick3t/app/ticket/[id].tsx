import React from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { formatCurrency, formatFullDate, formatPurchaseDate } from '@/utils/format';

export default function TicketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { getTicketById } = useApp();
  const ticket = getTicketById(id);

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 34 : insets.bottom;

  if (!ticket) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.closeBtn, { top: topPadding + 8, backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Ionicons name="close" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.errorText, { color: colors.foreground }]}>Ticket not found</Text>
      </View>
    );
  }

  const accentColor = ticket.event.accentColor;
  const qrData = JSON.stringify({ key: ticket.keyCode, id: ticket.id, event: ticket.event.id });

  const statusColor =
    ticket.status === 'upcoming' ? colors.primary : ticket.status === 'active' ? '#22C55E' : colors.mutedForeground;
  const statusLabel =
    ticket.status === 'upcoming' ? 'Upcoming' : ticket.status === 'active' ? 'Active' : 'Used';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Close button */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={[styles.closeBtn, { top: topPadding + 8, backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <Ionicons name="close" size={20} color={colors.foreground} />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={{ paddingTop: topPadding + 56, paddingBottom: bottomPadding + 30, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Ticket card */}
        <View style={[styles.ticketCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Top color stripe */}
          <View style={[styles.topStripe, { backgroundColor: accentColor }]} />

          {/* Event header */}
          <View style={styles.ticketHeader}>
            <View style={[styles.catBadge, { backgroundColor: accentColor + '22' }]}>
              <Text style={[styles.catBadgeText, { color: accentColor }]}>{ticket.event.category}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          </View>

          <Text style={[styles.eventTitle, { color: colors.foreground }]}>{ticket.event.title}</Text>
          <Text style={[styles.venueLine, { color: colors.mutedForeground }]}>
            {ticket.event.venue} · {ticket.event.city}
          </Text>

          {/* Perforation */}
          <View style={styles.perfoRow}>
            <View style={[styles.perfoCircle, { backgroundColor: colors.background, left: -20 }]} />
            <View style={[styles.perfoLine, { borderColor: colors.border }]} />
            <View style={[styles.perfoCircle, { backgroundColor: colors.background, right: -20 }]} />
          </View>

          {/* QR Code */}
          <View style={styles.qrSection}>
            <Text style={[styles.qrLabel, { color: colors.mutedForeground }]}>Scan at the door</Text>
            <View style={[styles.qrWrap, { backgroundColor: '#FFFFFF', borderColor: colors.border }]}>
              <QRCode
                value={qrData}
                size={200}
                backgroundColor="#FFFFFF"
                color="#000000"
              />
            </View>
            <Text style={[styles.keyCode, { color: colors.foreground }]}>{ticket.keyCode}</Text>
            <Text style={[styles.keyCodeSub, { color: colors.mutedForeground }]}>Digital Key Code</Text>
          </View>

          {/* Perforation bottom */}
          <View style={styles.perfoRow}>
            <View style={[styles.perfoCircle, { backgroundColor: colors.background, left: -20 }]} />
            <View style={[styles.perfoLine, { borderColor: colors.border }]} />
            <View style={[styles.perfoCircle, { backgroundColor: colors.background, right: -20 }]} />
          </View>

          {/* Ticket details grid */}
          <View style={styles.detailGrid}>
            <View style={styles.detailCell}>
              <Text style={[styles.detailCellLabel, { color: colors.mutedForeground }]}>Date</Text>
              <Text style={[styles.detailCellValue, { color: colors.foreground }]}>{formatFullDate(ticket.event.date)}</Text>
            </View>
            <View style={styles.detailCell}>
              <Text style={[styles.detailCellLabel, { color: colors.mutedForeground }]}>Time</Text>
              <Text style={[styles.detailCellValue, { color: colors.foreground }]}>{ticket.event.time}</Text>
            </View>
            <View style={styles.detailCell}>
              <Text style={[styles.detailCellLabel, { color: colors.mutedForeground }]}>Ticket Type</Text>
              <Text style={[styles.detailCellValue, { color: colors.foreground }]}>{ticket.ticketType.name}</Text>
            </View>
            <View style={styles.detailCell}>
              <Text style={[styles.detailCellLabel, { color: colors.mutedForeground }]}>Holder</Text>
              <Text style={[styles.detailCellValue, { color: colors.foreground }]}>{ticket.holderName}</Text>
            </View>
            <View style={styles.detailCell}>
              <Text style={[styles.detailCellLabel, { color: colors.mutedForeground }]}>Quantity</Text>
              <Text style={[styles.detailCellValue, { color: colors.foreground }]}>x{ticket.quantity}</Text>
            </View>
            <View style={styles.detailCell}>
              <Text style={[styles.detailCellLabel, { color: colors.mutedForeground }]}>Total Paid</Text>
              <Text style={[styles.detailCellValue, { color: accentColor }]}>
                {formatCurrency(ticket.totalAmount, ticket.ticketType.currency)}
              </Text>
            </View>
          </View>

          {/* Purchase date footer */}
          <View style={[styles.ticketFooter, { borderTopColor: colors.border }]}>
            <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
            <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
              Secured {formatPurchaseDate(ticket.purchaseDate)} · tick3t
            </Text>
          </View>
        </View>

        {/* Present at door note */}
        <View style={[styles.presentNote, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '30' }]}>
          <Ionicons name="information-circle" size={18} color={colors.primary} />
          <Text style={[styles.presentText, { color: colors.primary }]}>
            Present this QR code at the venue entrance for entry
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  closeBtn: {
    position: 'absolute',
    right: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 120,
  },
  ticketCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  topStripe: {
    height: 6,
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 8,
  },
  catBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  catBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600' as const,
    fontFamily: 'Inter_600SemiBold',
  },
  eventTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
    paddingHorizontal: 16,
    lineHeight: 28,
  },
  venueLine: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
  },
  perfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    overflow: 'visible',
  },
  perfoCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    position: 'absolute',
    zIndex: 2,
  },
  perfoLine: {
    flex: 1,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    marginHorizontal: 12,
  },
  qrSection: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  qrLabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginBottom: 16,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  qrWrap: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  keyCode: {
    fontSize: 16,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 2,
  },
  keyCodeSub: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 0,
  },
  detailCell: {
    width: '50%',
    paddingVertical: 10,
    paddingRight: 8,
  },
  detailCellLabel: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailCellValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    fontFamily: 'Inter_600SemiBold',
  },
  ticketFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  footerText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  presentNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  presentText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    lineHeight: 20,
  },
});
