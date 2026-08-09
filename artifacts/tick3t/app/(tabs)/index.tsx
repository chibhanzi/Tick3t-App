import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, TextInput,
  StatusBar, Image, Animated, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/context/AppContext';
import EventCard from '@/components/EventCard';
import Logo from '@/components/Logo';
import { EventCategory } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_W = (SCREEN_WIDTH - 36 - 10) / 2;

const HERO_SLIDES = [
  {
    id: '1',
    title: 'Bass Drop Festival 2024',
    description: 'The hottest DJs and producers for a night of non-stop dancing under the Miami stars.',
    date: 'MAR 15, 2024',
    time: '9:00 PM',
    venue: 'Miami Beach Arena',
    category: 'Music Festival',
    image: 'https://images.unsplash.com/photo-1470813740244-df37b8c1edcb?w=900&h=700&fit=crop',
  },
  {
    id: '3',
    title: 'Tech Innovation Summit',
    description: 'The premier tech conference — founders, investors, and engineers shaping the future.',
    date: 'MAR 28, 2024',
    time: '9:00 AM',
    venue: 'Silicon Valley Convention Center',
    category: 'Tech & Networking',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900&h=700&fit=crop',
  },
  {
    id: '6',
    title: 'Fashion Week Gala',
    description: 'Runway shows, designer meet-and-greets, and exclusive after-parties in Manhattan.',
    date: 'APR 20, 2024',
    time: '8:00 PM',
    venue: 'Manhattan Design Center',
    category: 'Fashion',
    image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=900&h=700&fit=crop',
  },
];

const CATEGORIES = [
  { label: 'Music', tagline: 'Concerts, festivals & live sets', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop', cat: 'Music Festival' as EventCategory },
  { label: 'Art & Culture', tagline: 'Galleries, theater & showcases', image: 'https://images.unsplash.com/photo-1500673922987-e212871fec22?w=400&h=300&fit=crop', cat: 'Art & Culture' as EventCategory },
  { label: 'Tech', tagline: 'Conferences, summits & networking', image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop', cat: 'Tech & Networking' as EventCategory },
  { label: 'Gaming', tagline: 'Esports, championships & cons', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop', cat: 'Gaming' as EventCategory },
];

// ── Slide content (inside image) ─────────────────────────────────────────────
function HeroSlideContent({
  slide,
  fade,
  onGetTicket,
}: {
  slide: typeof HERO_SLIDES[0];
  fade: Animated.Value;
  onGetTicket: (id: string) => void;
}) {
  return (
    <Animated.View style={[styles.slideContent, { opacity: fade }]}>
      {/* Single unified scrim over the whole image */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {/* Darker at bottom for text legibility */}
        <View style={styles.imgScrimFull} />
        <View style={styles.imgScrimBottom} />
      </View>

      {/* Event info pinned to bottom */}
      <View style={styles.slideInfo}>
        <View style={styles.heroCategoryBadge}>
          <Text style={styles.heroCategoryText}>{slide.category}</Text>
        </View>
        <Text style={styles.heroTitle} numberOfLines={2}>{slide.title}</Text>
        <Text style={styles.heroDesc} numberOfLines={2}>{slide.description}</Text>
        <View style={styles.heroMeta}>
          <Text style={styles.heroMetaText}>📅 {slide.date} · {slide.time}</Text>
          <Text style={styles.heroMetaText}>📍 {slide.venue}</Text>
        </View>
        <View style={styles.heroCTAs}>
          <Pressable style={styles.ctaWhite} onPress={() => onGetTicket(slide.id)}>
            <Text style={styles.ctaWhiteText}>Get Tickets</Text>
          </Pressable>
          <Pressable style={styles.ctaOutline}>
            <Text style={styles.ctaOutlineText}>Browse Events</Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────
export default function DiscoverScreen() {
  const { colors: C, isDark } = useTheme();
  const router = useRouter();
  const { events } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<EventCategory | null>(null);
  const [slide, setSlide] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const goTo = (next: number) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
    ]).start();
    setTimeout(() => setSlide(next), 280);
  };

  useEffect(() => {
    const id = setInterval(() => goTo((slide + 1) % HERO_SLIDES.length), 6000);
    return () => clearInterval(id);
  }, [slide]);

  const almostSoldOut = useMemo(() => events.filter(e => e.available > 0 && e.available < 100), [events]);
  const trending = useMemo(() => events.filter(e => e.available > 0 && e.attendees >= 800), [events]);
  const searchResults = useMemo(() => {
    if (!searchQuery) return [];
    const q = searchQuery.toLowerCase();
    return events.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.location.toLowerCase().includes(q) ||
      e.organizer.toLowerCase().includes(q)
    );
  }, [events, searchQuery]);
  const categoryResults = useMemo(() => {
    if (!activeCategory) return [];
    return events.filter(e => e.category === activeCategory);
  }, [events, activeCategory]);

  const showingResults = searchQuery.length > 0 || activeCategory !== null;
  const results = searchQuery ? searchResults : categoryResults;

  const current = HERO_SLIDES[slide];

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* ── Fixed nav bar: logo + search ───────────────────────────────────── */}
      <SafeAreaView edges={['top']} style={[styles.navbar, { backgroundColor: C.card, borderBottomColor: C.border }]}>
        <View style={styles.navRow}>
          <Logo size="md" />
        </View>
        <View style={[styles.searchBar, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Text style={[styles.searchIcon, { color: C.textMuted }]}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: C.text }]}
            placeholder="Search events, artists, or venues…"
            placeholderTextColor={C.textMuted}
            value={searchQuery}
            onChangeText={t => { setSearchQuery(t); setActiveCategory(null); }}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Text style={{ color: C.textMuted, fontSize: 15, paddingHorizontal: 4 }}>✕</Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Hero slideshow ─────────────────────────────────────────────── */}
        <View style={styles.heroWrap}>
          {/* Stacked images — only current is visible */}
          {HERO_SLIDES.map((s, i) => (
            <Image
              key={s.id}
              source={{ uri: s.image }}
              style={[StyleSheet.absoluteFillObject, { opacity: i === slide ? 1 : 0 }]}
              resizeMode="cover"
            />
          ))}

          {/* Slide content + scrims */}
          <HeroSlideContent slide={current} fade={fadeAnim} onGetTicket={id => router.push(`/event/${id}`)} />

          {/* Controls bar at very bottom */}
          <View style={styles.slideControls}>
            <View style={styles.slideArrows}>
              <Pressable style={styles.arrowBtn} onPress={() => goTo((slide - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}>
                <Text style={styles.arrowText}>‹</Text>
              </Pressable>
              <Pressable style={styles.arrowBtn} onPress={() => goTo((slide + 1) % HERO_SLIDES.length)}>
                <Text style={styles.arrowText}>›</Text>
              </Pressable>
            </View>
            <View style={styles.dotsRow}>
              {HERO_SLIDES.map((_, i) => (
                <Pressable key={i} onPress={() => goTo(i)}>
                  <View style={[styles.dot, i === slide && styles.dotActive]} />
                </Pressable>
              ))}
              <Text style={styles.slideCounter}>
                {String(slide + 1).padStart(2, '0')} / {String(HERO_SLIDES.length).padStart(2, '0')}
              </Text>
            </View>
          </View>
        </View>

        {showingResults ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: C.text }]}>
                {searchQuery ? `"${searchQuery}"` : activeCategory}
                {'  '}
                <Text style={{ color: C.textMuted, fontSize: 14 }}>({results.length})</Text>
              </Text>
              <Pressable onPress={() => { setSearchQuery(''); setActiveCategory(null); }}>
                <Text style={{ color: C.primary, fontSize: 13, fontWeight: '600' }}>Clear ✕</Text>
              </Pressable>
            </View>
            {results.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyEmoji}>🎪</Text>
                <Text style={[styles.emptyTitle, { color: C.text }]}>No events found</Text>
                <Text style={[styles.emptyText, { color: C.textMuted }]}>Try a different search term.</Text>
              </View>
            ) : (
              <View style={styles.twoCol}>
                {results.map(e => <EventCard key={e.id} event={e} variant="grid" />)}
              </View>
            )}
          </View>
        ) : (
          <>
            {/* ── Browse by Category ── */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: C.text }]}>Browse by Category</Text>
              <View style={[styles.catGrid, { marginTop: 14 }]}>
                {CATEGORIES.map(cat => (
                  <Pressable key={cat.label} style={styles.catTile} onPress={() => setActiveCategory(cat.cat)}>
                    <Image source={{ uri: cat.image }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
                    <View style={styles.catBottomScrim} />
                    <View style={styles.catContent}>
                      <Text style={styles.catLabel}>{cat.label}</Text>
                      <Text style={styles.catTagline}>{cat.tagline}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* ── Almost Sold Out ── */}
            {almostSoldOut.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={[styles.sectionTitle, { color: C.text }]}>⏱ Almost Sold Out</Text>
                    <View style={[styles.limitedPill, { backgroundColor: '#EF444420', borderColor: '#EF444450' }]}>
                      <Text style={[styles.limitedText, { color: '#F87171' }]}>Limited</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.twoCol}>
                  {almostSoldOut.map(e => (
                    <View key={e.id} style={{ position: 'relative' }}>
                      <EventCard event={e} variant="grid" />
                      <View style={styles.leftBadge}>
                        <Text style={styles.leftBadgeText}>{e.available} left</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* ── Trending Events ── */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: C.text }]}>Trending Events</Text>
                <View style={[styles.viewAllPill, { borderColor: C.border }]}>
                  <Text style={[styles.viewAllText, { color: C.textSecondary }]}>View all</Text>
                </View>
              </View>
              <View style={styles.twoCol}>
                {trending.map(e => <EventCard key={e.id} event={e} variant="grid" />)}
              </View>
            </View>

            {/* ── See All CTA ── */}
            <View style={styles.ctaRow}>
              <Pressable style={[styles.seeAllBtn, { backgroundColor: C.primary }]}>
                <Text style={styles.seeAllText}>📅  See All Events</Text>
              </Pressable>
            </View>

            {/* ── Trust cards ── */}
            <View style={[styles.trustSection, { backgroundColor: C.card, borderColor: C.border }]}>
              <Text style={[styles.trustHeading, { color: C.text }]}>Why Tick3t?</Text>
              <View style={styles.twoCol}>
                {[
                  { icon: '⬡', title: 'NFT Tickets', desc: 'Every ticket secured on the TON blockchain' },
                  { icon: '🔒', title: 'Secure Payments', desc: 'Encrypted & verified via Paynow' },
                  { icon: '✓', title: 'Verified Resale', desc: 'All marketplace listings are verified' },
                  { icon: '🎨', title: 'Custom Design', desc: 'Personalised digital keys per event' },
                ].map((t, i) => (
                  <View key={i} style={[styles.trustCard, { backgroundColor: C.background, borderColor: C.border }]}>
                    <Text style={styles.trustIcon}>{t.icon}</Text>
                    <Text style={[styles.trustTitle, { color: C.text }]}>{t.title}</Text>
                    <Text style={[styles.trustDesc, { color: C.textMuted }]}>{t.desc}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={{ height: 32 }} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Nav bar (above hero)
  navbar: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  navRow: {
    paddingTop: 4,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', height: 44,
    borderRadius: 50, borderWidth: 1, paddingHorizontal: 14,
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 0 },

  // Hero
  heroWrap: { width: '100%', height: 420, position: 'relative' },

  slideContent: { ...StyleSheet.absoluteFillObject },

  imgScrimFull: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5,12,24,0.30)',
  },
  imgScrimBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 280,
    backgroundColor: 'rgba(5,12,24,0.72)',
  },

  slideInfo: {
    position: 'absolute', bottom: 52, left: 0, right: 0, paddingHorizontal: 20,
  },
  heroCategoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(22,163,74,0.9)',
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 50, marginBottom: 10,
  },
  heroCategoryText: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  heroTitle: {
    color: '#fff', fontSize: 26, fontWeight: '900',
    letterSpacing: -0.5, marginBottom: 8, lineHeight: 32,
  },
  heroDesc: { color: 'rgba(255,255,255,0.72)', fontSize: 13, lineHeight: 18, marginBottom: 10 },
  heroMeta: { gap: 3, marginBottom: 14 },
  heroMetaText: { color: 'rgba(255,255,255,0.68)', fontSize: 12 },
  heroCTAs: { flexDirection: 'row', gap: 10 },
  ctaWhite: { backgroundColor: '#fff', borderRadius: 50, paddingHorizontal: 22, paddingVertical: 11 },
  ctaWhiteText: { color: '#050C18', fontSize: 14, fontWeight: '800' },
  ctaOutline: {
    borderRadius: 50, borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
    paddingHorizontal: 22, paddingVertical: 11,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  ctaOutlineText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  slideControls: {
    position: 'absolute', bottom: 12, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  slideArrows: { flexDirection: 'row', gap: 8 },
  arrowBtn: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  arrowText: { color: 'rgba(255,255,255,0.8)', fontSize: 20, lineHeight: 22 },
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.35)' },
  dotActive: { width: 20, borderRadius: 4, backgroundColor: '#fff' },
  slideCounter: { color: 'rgba(255,255,255,0.45)', fontSize: 11, fontFamily: 'monospace', marginLeft: 4 },

  // Sections
  section: { paddingHorizontal: 18, paddingTop: 26 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  limitedPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  limitedText: { fontSize: 10, fontWeight: '700' },
  viewAllPill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  viewAllText: { fontSize: 12, fontWeight: '600' },

  // Category grid
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catTile: { width: CARD_W, aspectRatio: 4 / 3, borderRadius: 14, overflow: 'hidden', position: 'relative' },
  catBottomScrim: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%',
    backgroundColor: 'rgba(5,12,24,0.72)',
  },
  catContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 10 },
  catLabel: { color: '#fff', fontSize: 13, fontWeight: '700', marginBottom: 2 },
  catTagline: { color: 'rgba(255,255,255,0.65)', fontSize: 10, lineHeight: 13 },

  // 2-col grid
  twoCol: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },

  leftBadge: {
    position: 'absolute', top: -4, right: -4, zIndex: 5,
    backgroundColor: '#EF4444', borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  leftBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  // See all CTA
  ctaRow: { alignItems: 'center', paddingTop: 26, paddingHorizontal: 18 },
  seeAllBtn: { borderRadius: 50, paddingVertical: 14, width: '100%', alignItems: 'center' },
  seeAllText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  // Trust
  trustSection: { margin: 18, marginTop: 26, borderRadius: 18, padding: 18, borderWidth: 1 },
  trustHeading: { fontSize: 16, fontWeight: '800', marginBottom: 14, letterSpacing: -0.2 },
  trustCard: { width: CARD_W, borderRadius: 12, padding: 14, borderWidth: 1 },
  trustIcon: { fontSize: 22, marginBottom: 8 },
  trustTitle: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  trustDesc: { fontSize: 11, lineHeight: 15 },

  // Empty state
  emptyBox: { alignItems: 'center', paddingVertical: 48 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyText: { fontSize: 14 },
});
