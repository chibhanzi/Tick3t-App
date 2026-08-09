import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { PurchasedTicket } from '@/types';
import { formatCurrency, formatDate } from '@/utils/format';

interface TicketCardProps {
  ticket: PurchasedTicket;
}

export function TicketCard({ ticket }: TicketCardProps) {
  const colors = useColors();
  const router = useRouter();

  const handlePress = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/ticket/${ticket.id}`);
  };

  const statusColor = ticket.status === 'upcoming' ? colors.primary : ticket.status === 'active' ? '#22C55E' : colors.mutedForeground;
  const statusLabel = ticket.status === 'upcoming' ? 'Upcoming' : ticket.status === 'active' ? 'Active' : 'Used';

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.88 : 1 },
      ]}
    >
      {/* Left accent + perforation effect */}
      <View style={[styles.leftSection, { backgroundColor: ticket.event.accentColor + '18' }]}>
        <View style={[styles.accentDot, { backgroundColor: ticket.event.accentColor }]} />
        <View style={[styles.perfoLine, { borderColor: colors.border }]} />
      </View>

      <View style={styles.body}>
        {/* Top row */}
        <View style={styles.topRow}>
          <View style={[styles.catPill, { backgroundColor: ticket.event.accentColor + '22' }]}>
            <Text style={[styles.catText, { color: ticket.event.accentColor }]}>{ticket.event.category}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>
          {ticket.event.title}
        </Text>

        {/* Meta row */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={12} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{formatDate(ticket.event.date)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={12} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{ticket.event.time}</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { borderColor: colors.border }]} />

        {/* Bottom row */}
        <View style={styles.bottomRow}>
          <View>
            <Text style={[styles.ticketTypeName, { color: colors.foreground }]}>{ticket.ticketType.name}</Text>
            <Text style={[styles.keyCodeText, { color: colors.mutedForeground }]}>
              {ticket.keyCode.substring(0, 12)}···
            </Text>
          </View>
          <View style={styles.priceQty}>
            <Text style={[styles.priceText, { color: colors.primary }]}>
              {formatCurrency(ticket.totalAmount, ticket.ticketType.currency)}
            </Text>
            {ticket.quantity > 1 && (
              <Text style={[styles.qtyText, { color: colors.mutedForeground }]}>x{ticket.quantity}</Text>
            )}
          </View>
        </View>
      </View>

      {/* QR hint */}
      <View style={styles.rightSection}>
        <Ionicons name="qr-code-outline" size={22} color={colors.mutedForeground} />
        <Ionicons name="chevron-forward" size={14} color={colors.mutedForeground} style={{ marginTop: 4 }} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 12,
  },
  leftSection: {
    width: 36,
    alignItems: 'center',
    paddingVertical: 14,
    gap: 4,
  },
  accentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 6,
  },
  perfoLine: {
    flex: 1,
    width: 1,
    borderLeftWidth: 1,
    borderStyle: 'dashed',
  },
  body: {
    flex: 1,
    padding: 14,
    paddingLeft: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  catPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  catText: {
    fontSize: 10,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600' as const,
    fontFamily: 'Inter_600SemiBold',
  },
  title: {
    fontSize: 15,
    fontWeight: '600' as const,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 20,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  divider: {
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    marginBottom: 10,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  ticketTypeName: {
    fontSize: 13,
    fontWeight: '600' as const,
    fontFamily: 'Inter_600SemiBold',
  },
  keyCodeText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  priceQty: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
  },
  qtyText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  rightSection: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
});
