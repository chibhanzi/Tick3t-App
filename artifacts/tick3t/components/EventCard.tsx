import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Event } from '@/types';
import { getAvailabilityPercent } from '@/utils/format';

interface EventCardProps {
  event: Event;
  variant?: 'featured' | 'list' | 'compact';
}

export default function EventCard({ event, variant = 'list' }: EventCardProps) {
  const router = useRouter();
  const C = Colors.dark;
  const soldOut = event.available === 0;
  const almostGone = !soldOut && getAvailabilityPercent(event.available, event.total) >= 70;
  const selling = !soldOut && !almostGone && getAvailabilityPercent(event.available, event.total) >= 40;
  const trending = event.attendees >= 2000;

  const badge = soldOut ? { label: 'Sold Out', bg: '#EF4444' }
    : almostGone ? { label: 'Almost Sold Out', bg: '#F59E0B' }
    : selling ? { label: 'Selling Fast', bg: '#6366F1' }
    : null;

  if (variant === 'featured') {
    return (
      <Pressable style={styles.featured} onPress={() => router.push(`/event/${event.id}`)}>
        <Image source={{ uri: event.image }} style={styles.featuredImage} />
        <View style={styles.featuredOverlay} />
        <View style={styles.featuredContent}>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: 'rgba(22,163,74,0.9)' }]}>
              <Text style={styles.badgeText}>{event.category}</Text>
            </View>
            {trending && (
              <View style={[styles.badge, { backgroundColor: 'rgba(99,102,241,0.9)' }]}>
                <Text style={styles.badgeText}>🔥 Trending</Text>
              </View>
            )}
            {badge && !trending && (
              <View style={[styles.badge, { backgroundColor: badge.bg + 'E6' }]}>
                <Text style={styles.badgeText}>{badge.label}</Text>
              </View>
            )}
          </View>
          <Text style={styles.featuredTitle} numberOfLines={2}>{event.title}</Text>
          <Text style={styles.featuredSub}>{event.date} • {event.time}</Text>
          <Text style={styles.featuredSub}>{event.location}</Text>
          <View style={styles.featuredFooter}>
            <Text style={styles.featuredAttendees}>{event.attendees.toLocaleString()} going</Text>
            <View style={[styles.priceTag, { backgroundColor: C.primary }]}>
              <Text style={styles.priceTagText}>From ${event.price}</Text>
            </View>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable style={styles.card} onPress={() => router.push(`/event/${event.id}`)}>
      <Image source={{ uri: event.image }} style={styles.cardImage} />
      <View style={styles.cardBody}>
        <View style={styles.cardBadgeRow}>
          <View style={[styles.smallBadge, { backgroundColor: C.primary + '22', borderColor: C.primary + '55' }]}>
            <Text style={[styles.smallBadgeText, { color: C.primary }]}>{event.category}</Text>
          </View>
          {badge && (
            <View style={[styles.smallBadge, { backgroundColor: badge.bg + '22', borderColor: badge.bg + '55' }]}>
              <Text style={[styles.smallBadgeText, { color: badge.bg }]}>{badge.label}</Text>
            </View>
          )}
        </View>
        <Text style={styles.cardTitle} numberOfLines={2}>{event.title}</Text>
        <Text style={styles.cardMeta}>📅 {event.date} · {event.time}</Text>
        <Text style={styles.cardMeta}>📍 {event.location}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.cardAttendees}>{event.attendees.toLocaleString()} going</Text>
          <Text style={styles.cardPrice}>From ${event.price}</Text>
        </View>
        {/* Availability bar */}
        {!soldOut && (
          <View style={styles.availBar}>
            <View style={[styles.availFill, { width: `${getAvailabilityPercent(event.available, event.total)}%`, backgroundColor: almostGone ? '#F59E0B' : C.primary }]} />
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  featured: { borderRadius: 16, overflow: 'hidden', height: 280, marginBottom: 4 },
  featuredImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  featuredOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,12,24,0.65)' },
  featuredContent: { flex: 1, padding: 20, justifyContent: 'flex-end' },
  badgeRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  featuredTitle: { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 6, letterSpacing: -0.3 },
  featuredSub: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginBottom: 2 },
  featuredFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  featuredAttendees: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  priceTag: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  priceTagText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  card: { backgroundColor: Colors.dark.card, borderRadius: 14, overflow: 'hidden', marginBottom: 12, borderWidth: 1, borderColor: Colors.dark.border },
  cardImage: { width: '100%', height: 160 },
  cardBody: { padding: 14 },
  cardBadgeRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  smallBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  smallBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  cardTitle: { color: Colors.dark.text, fontSize: 16, fontWeight: '700', marginBottom: 6, letterSpacing: -0.2 },
  cardMeta: { color: Colors.dark.textSecondary, fontSize: 12, marginBottom: 3 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  cardAttendees: { color: Colors.dark.textMuted, fontSize: 12 },
  cardPrice: { color: Colors.dark.primary, fontSize: 15, fontWeight: '800' },
  availBar: { height: 3, backgroundColor: Colors.dark.border, borderRadius: 2, marginTop: 10, overflow: 'hidden' },
  availFill: { height: '100%', borderRadius: 2 },
});
