import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { Event } from '@/types';
import { formatCurrency, formatDate } from '@/utils/format';

interface EventCardProps {
  event: Event;
  featured?: boolean;
}

export function EventCard({ event, featured = false }: EventCardProps) {
  const colors = useColors();
  const router = useRouter();
  const lowestPrice = Math.min(...event.ticketTypes.map((t) => t.price));
  const currency = event.ticketTypes[0]?.currency ?? 'NGN';

  const handlePress = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/event/${event.id}`);
  };

  if (featured) {
    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.featured,
          { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.92 : 1 },
        ]}
      >
        <View style={[styles.featuredTopBar, { backgroundColor: event.accentColor }]} />
        <View style={styles.featuredBadgeWrap}>
          <Text style={[styles.featuredBadgeText, { color: colors.primary }]}>FEATURED</Text>
        </View>
        <View style={styles.featuredBody}>
          <View style={styles.metaRow}>
            <View style={[styles.catPill, { backgroundColor: event.accentColor + '25' }]}>
              <Text style={[styles.catPillText, { color: event.accentColor }]}>{event.category}</Text>
            </View>
            <Ionicons name="location-outline" size={12} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
              {event.city}, {event.country}
            </Text>
          </View>
          <Text style={[styles.featuredTitle, { color: colors.foreground }]} numberOfLines={2}>
            {event.title}
          </Text>
          <View style={styles.featuredFooter}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={13} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                {formatDate(event.date)} · {event.time}
              </Text>
            </View>
            <View style={[styles.priceChip, { backgroundColor: colors.primary }]}>
              <Text style={[styles.priceChipText, { color: colors.primaryForeground }]}>
                From {formatCurrency(lowestPrice, currency)}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.88 : 1 },
      ]}
    >
      <View style={[styles.accentBar, { backgroundColor: event.accentColor }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardHead}>
          <View style={[styles.catPill, { backgroundColor: event.accentColor + '25' }]}>
            <Text style={[styles.catPillText, { color: event.accentColor }]}>{event.category}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
        </View>
        <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={2}>
          {event.title}
        </Text>
        <View style={styles.cardMeta}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={12} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{formatDate(event.date)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={12} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{event.city}</Text>
          </View>
          <Text style={[styles.cardPrice, { color: colors.primary }]}>
            From {formatCurrency(lowestPrice, currency)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  featured: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
  },
  featuredTopBar: {
    height: 4,
  },
  featuredBadgeWrap: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  featuredBadgeText: {
    fontSize: 10,
    fontWeight: '800' as const,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.5,
  },
  featuredBody: {
    padding: 18,
    paddingTop: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  catPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  catPillText: {
    fontSize: 11,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.3,
  },
  metaText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  featuredTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
    lineHeight: 28,
    marginBottom: 14,
  },
  featuredFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceChip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  priceChipText: {
    fontSize: 13,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 1,
    flexDirection: 'row',
  },
  accentBar: {
    width: 4,
  },
  cardBody: {
    flex: 1,
    padding: 14,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 22,
    marginBottom: 8,
  },
  cardMeta: {
    gap: 3,
  },
  cardPrice: {
    fontSize: 14,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
    marginTop: 4,
  },
});
