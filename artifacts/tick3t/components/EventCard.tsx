import React from 'react';
import { View, Text, Image, Pressable, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { Event } from '@/types';
import { getAvailabilityPercent } from '@/utils/format';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_CARD_WIDTH = (SCREEN_WIDTH - 36 - 10) / 2;

interface EventCardProps {
  event: Event;
  variant?: 'featured' | 'list' | 'grid';
}

export default function EventCard({ event, variant = 'list' }: EventCardProps) {
  const router = useRouter();
  const { colors: C } = useTheme();
  const soldOut = event.available === 0;
  const availPct = getAvailabilityPercent(event.available, event.total);
  const almostGone = !soldOut && availPct >= 70;
  const trending = event.attendees > 1000;

  // ── FEATURED ──────────────────────────────────────────────────────────────
  if (variant === 'featured') {
    return (
      <Pressable style={styles.featured} onPress={() => router.push(`/event/${event.id}`)}>
        <Image source={{ uri: event.image }} style={StyleSheet.absoluteFillObject} />
        <View style={styles.featuredOverlay} />
        <View style={styles.featuredContent}>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: 'rgba(22,163,74,0.9)' }]}>
              <Text style={styles.badgeText}>{event.category}</Text>
            </View>
            {trending && !soldOut && (
              <View style={[styles.badge, { backgroundColor: 'rgba(249,115,22,0.9)' }]}>
                <Text style={styles.badgeText}>🔥 Trending</Text>
              </View>
            )}
            {almostGone && (
              <View style={[styles.badge, { backgroundColor: 'rgba(239,68,68,0.9)' }]}>
                <Text style={styles.badgeText}>Almost Sold Out</Text>
              </View>
            )}
          </View>
          <Text style={styles.featuredTitle} numberOfLines={2}>{event.title}</Text>
          <Text style={styles.featuredMeta}>{event.date} · {event.time}</Text>
          <Text style={styles.featuredMeta}>📍 {event.location}</Text>
          <View style={styles.featuredFooter}>
            <Text style={styles.featuredAttendees}>{event.attendees.toLocaleString()} going</Text>
            <View style={[styles.priceChip, { backgroundColor: C.primary }]}>
              <Text style={styles.priceChipText}>From ${event.price}</Text>
            </View>
          </View>
        </View>
      </Pressable>
    );
  }

  // ── GRID (2-column) ───────────────────────────────────────────────────────
  if (variant === 'grid') {
    return (
      <Pressable
        style={[styles.gridCard, { backgroundColor: C.card, borderColor: C.border }]}
        onPress={() => router.push(`/event/${event.id}`)}
      >
        <View style={styles.gridImageWrap}>
          <Image source={{ uri: event.image }} style={styles.gridImage} />
          <View style={styles.gridBadgeRow}>
            <View style={[styles.smallBadge, { backgroundColor: 'rgba(5,12,24,0.75)' }]}>
              <Text style={styles.smallBadgeText}>{event.category}</Text>
            </View>
            {trending && !soldOut && (
              <View style={[styles.smallBadge, { backgroundColor: 'rgba(249,115,22,0.85)' }]}>
                <Text style={styles.smallBadgeText}>🔥</Text>
              </View>
            )}
          </View>
          {soldOut && (
            <View style={styles.soldOutOverlay}>
              <View style={styles.soldOutBadge}>
                <Text style={styles.soldOutText}>Sold Out</Text>
              </View>
            </View>
          )}
        </View>
        <View style={styles.gridBody}>
          <Text style={[styles.gridTitle, { color: C.text }]} numberOfLines={2}>{event.title}</Text>
          <Text style={[styles.gridMeta, { color: C.textSecondary }]} numberOfLines={1}>📅 {event.date}</Text>
          <Text style={[styles.gridMeta, { color: C.textSecondary }]} numberOfLines={1}>📍 {event.location}</Text>
          <View style={styles.gridFooter}>
            <Text style={[styles.gridAttendees, { color: C.textMuted }]}>
              {event.attendees >= 1000 ? `${(event.attendees / 1000).toFixed(1)}k` : event.attendees} going
            </Text>
            <Text style={[styles.gridPrice, { color: soldOut ? C.textMuted : C.primary }]}>
              {soldOut ? 'Resale' : `$${event.price}`}
            </Text>
          </View>
          {!soldOut && (
            <View style={[styles.availBar, { backgroundColor: C.border }]}>
              <View style={[styles.availFill, { width: `${availPct}%`, backgroundColor: almostGone ? '#EF4444' : C.primary }]} />
            </View>
          )}
        </View>
      </Pressable>
    );
  }

  // ── LIST ──────────────────────────────────────────────────────────────────
  return (
    <Pressable
      style={[styles.listCard, { backgroundColor: C.card, borderColor: C.border }]}
      onPress={() => router.push(`/event/${event.id}`)}
    >
      <Image source={{ uri: event.image }} style={styles.listImage} />
      <View style={styles.listBody}>
        <View style={styles.listBadgeRow}>
          <View style={[styles.smallBadge, { backgroundColor: C.primary + '22', borderWidth: 1, borderColor: C.primary + '55' }]}>
            <Text style={[styles.smallBadgeText, { color: C.primary }]}>{event.category}</Text>
          </View>
          {trending && !soldOut && (
            <View style={[styles.smallBadge, { backgroundColor: '#F9731622', borderWidth: 1, borderColor: '#F9731655' }]}>
              <Text style={[styles.smallBadgeText, { color: '#F97316' }]}>🔥 Trending</Text>
            </View>
          )}
          {soldOut && (
            <View style={[styles.smallBadge, { backgroundColor: '#EF444422', borderWidth: 1, borderColor: '#EF444455' }]}>
              <Text style={[styles.smallBadgeText, { color: '#F87171' }]}>Sold Out</Text>
            </View>
          )}
          {almostGone && (
            <View style={[styles.smallBadge, { backgroundColor: '#F59E0B22', borderWidth: 1, borderColor: '#F59E0B55' }]}>
              <Text style={[styles.smallBadgeText, { color: '#FBBF24' }]}>Almost Gone</Text>
            </View>
          )}
        </View>
        <Text style={[styles.listTitle, { color: C.text }]} numberOfLines={2}>{event.title}</Text>
        <Text style={[styles.listMeta, { color: C.textSecondary }]}>📅 {event.date} · {event.time}</Text>
        <Text style={[styles.listMeta, { color: C.textSecondary }]}>📍 {event.location}</Text>
        <View style={styles.listFooter}>
          <Text style={[styles.listAttendees, { color: C.textMuted }]}>{event.attendees.toLocaleString()} going</Text>
          <Text style={[styles.listPrice, { color: soldOut ? C.textMuted : C.primary }]}>
            {soldOut ? 'Resale only' : `From $${event.price}`}
          </Text>
        </View>
        {!soldOut && (
          <View style={[styles.availBar, { backgroundColor: C.border, marginTop: 10 }]}>
            <View style={[styles.availFill, { width: `${availPct}%`, backgroundColor: almostGone ? '#EF4444' : C.primary }]} />
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Featured
  featured: { borderRadius: 16, overflow: 'hidden', height: 280, marginBottom: 4 },
  featuredOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,12,24,0.6)' },
  featuredContent: { flex: 1, padding: 20, justifyContent: 'flex-end' },
  badgeRow: { flexDirection: 'row', gap: 6, marginBottom: 10, flexWrap: 'wrap' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  featuredTitle: { color: '#fff', fontSize: 24, fontWeight: '900', marginBottom: 6, letterSpacing: -0.5, lineHeight: 30 },
  featuredMeta: { color: 'rgba(255,255,255,0.72)', fontSize: 12, marginBottom: 3 },
  featuredFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
  featuredAttendees: { color: 'rgba(255,255,255,0.65)', fontSize: 12 },
  priceChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  priceChipText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  // Grid
  gridCard: { width: GRID_CARD_WIDTH, borderRadius: 14, overflow: 'hidden', borderWidth: 1 },
  gridImageWrap: { position: 'relative', height: 120 },
  gridImage: { width: '100%', height: '100%' },
  gridBadgeRow: { position: 'absolute', top: 6, left: 6, flexDirection: 'row', gap: 4 },
  smallBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20 },
  smallBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700', letterSpacing: 0.2 },
  soldOutOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.52)', alignItems: 'center', justifyContent: 'center' },
  soldOutBadge: { backgroundColor: '#EF4444', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  soldOutText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  gridBody: { padding: 10 },
  gridTitle: { fontSize: 13, fontWeight: '700', marginBottom: 5, lineHeight: 17 },
  gridMeta: { fontSize: 10, marginBottom: 2, lineHeight: 14 },
  gridFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 7 },
  gridAttendees: { fontSize: 10 },
  gridPrice: { fontSize: 14, fontWeight: '800' },
  availBar: { height: 3, borderRadius: 2, marginTop: 7, overflow: 'hidden' },
  availFill: { height: '100%', borderRadius: 2 },

  // List
  listCard: { borderRadius: 14, overflow: 'hidden', marginBottom: 12, borderWidth: 1 },
  listImage: { width: '100%', height: 160 },
  listBody: { padding: 14 },
  listBadgeRow: { flexDirection: 'row', gap: 6, marginBottom: 8, flexWrap: 'wrap' },
  listTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6, letterSpacing: -0.2 },
  listMeta: { fontSize: 12, marginBottom: 3 },
  listFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  listAttendees: { fontSize: 12 },
  listPrice: { fontSize: 15, fontWeight: '800' },
});
