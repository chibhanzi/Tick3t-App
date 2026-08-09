import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, TextInput,
  StatusBar, Image, Animated, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useApp } from '@/context/AppContext';
import EventCard from '@/components/EventCard';
import Logo from '@/components/Logo';
import { EventCategory } from '@/types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = Math.round(SCREEN_HEIGHT * 0.60);

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

// ── Hero slider ──────────────────────────────────────────────────────────────
function HeroSlider({
  onSearch,
  onGetTicket,
}: {
  onSearch: (q: string) => void;
  onGetTicket: (id: string) => void;
}) {
  const [slide, setSlide] = useState(0);
  const [search, setSearch] = useState('');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const goTo = (next: number) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
    setTimeout(() => setSlide(next), 300);
  };

  useEffect(() => {
    const id = setInterval(() => goTo((slide + 1) % HERO_SLIDES.length), 6000);
    return () => clearInterval(id);
  }, [slide]);

  const current = HERO_SLIDES[slide];

  return (
    <View style={[styles.hero, { height: HERO_HEIGHT }]}>
      {/* Stacked background images */}
      {HERO_SLIDES.map((s, i) => (
        <Image
          key={s.id}
          source={{ uri: s.image }}
          style={[StyleSheet.absoluteFillObject, { opacity: i === slide ? 1 : 0 }]}
          resizeMode="cover"
        />
      ))}

      {/* Top dark scrim */}
      <View style={styles.scrimTop} />
      {/* Bottom dark scrim */}
      <View style={styles.scrimBottom} />

      {/* Logo + search — top overlay */}
      <SafeAreaView edges={['top']} style={styles.heroTopArea}>
        <View style={styles.heroLogoRow}>
          <Logo size="md" />
        </View>
        {/* Frosted glass search (RN-compatible: semi-transparent bg, no backdropFilter) */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search events, artists, or venues…"
              placeholderTextColor="rgba(255,255,255,0.45)"
              value={search}
              onChangeText={t => { setSearch(t); onSearch(t); }}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <Pressable onPress={() => { setSearch(''); onSearch(''); }}>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>✕</Text>
              </Pressable>
            )}
          </View>
        </View>
      </SafeAreaView>

      {/* Slide content — bottom */}
      <Animated.View style={[styles.heroContent, { opacity: fadeAnim }]}>
        <View style={styles.heroCategoryBadge}>
          <Text style={styles.heroCategoryText}>{current.category}</Text>
        </View>
        <Text style={styles.heroTitle} numberOfLines={2}>{current.title}</Text>
        <Text style={styles.heroDesc} numberOfLines={2}>{current.description}</Text>
        <View style={styles.heroMeta}>
          <Text style={styles.heroMetaText}>📅 {current.date} · {current.time}</Text>
          <Text style={styles.heroMetaText}>📍 {current.venue}</Text>
        </View>
        <View style={styles.heroCTAs}>
          <Pressable style={styles.ctaWhite} onPress={() => onGetTicket(current.id)}>
            <Text style={styles.ctaWhiteText}>Get Tickets</Text>
          </Pressable>
          <Pressable style={styles.ctaOutline} onPress={() => {}}>
            <Text style={styles.ctaOutlineText}>Browse Events</Text>
          </Pressable>
        </View>
      </Animated.View>

      {/* Slide controls — very bottom */}
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
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────
export default function DiscoverScreen() {
  const C = Colors.dark;
  const router = useRouter();
  const { events } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<EventCategory | null>(null);

  const almostSoldOut = useMemo(
    () => events.filter(e => e.available > 0 && e.available < 100),
    [events]
  );
  const trending = useMemo(
    () => events.filter(e => e.available > 0 && e.attendees >= 800),
    [events]
  );

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

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Hero ── */}
        <HeroSlider
          onSearch={setSearchQuery}
          onGetTicket={id => router.push(`/event/${id}`)}
        />

        {showingResults ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: C.text }]}>
                {searchQuery ? `"${searchQuery}"` : activeCategory}
                {'  '}
                <Text style={{ color: C.textMuted, fontSize: 14 }}>({results.length})</Text>
              </Text>
              <Pressable onPress={() => { setSearchQuery(''); setActiveCategory(null); }}>
                <Text style={[styles.clearBtn, { color: C.primary }]}>Clear ✕</Text>
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
              <View style={styles.catGrid}>
                {CATEGORIES.map(cat => (
                  <Pressable key={cat.label} style={styles.catTile} onPress={() => setActiveCategory(cat.cat)}>
                    <Image source={{ uri: cat.image }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
                    {/* Gradient simulation: semi-opaque bottom overlay */}
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

// ── Styles ───────────────────────────────────────────────────────────────────
const CARD_W = (SCREEN_WIDTH - 36 - 10) / 2;

const styles = StyleSheet.create({
  // Hero
  hero: { width: '100%', position: 'relative' },

  scrimTop: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 200, zIndex: 1,
    backgroundColor: 'rgba(5,12,24,0.55)',
  },
  scrimBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 320, zIndex: 1,
    backgroundColor: 'rgba(5,12,24,0.72)',
  },

  heroTopArea: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  heroLogoRow: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 8 },

  searchRow: { paddingHorizontal: 16, paddingBottom: 10 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', height: 46,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 50, borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 16,
  },
  searchIcon: { fontSize: 15, marginRight: 8, color: 'rgba(255,255,255,0.55)' },
  searchInput: { flex: 1, color: '#fff', fontSize: 14, paddingVertical: 0 },

  heroContent: {
    position: 'absolute', bottom: 52, left: 0, right: 0, zIndex: 10, paddingHorizontal: 20,
  },
  heroCategoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(22,163,74,0.9)',
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 50, marginBottom: 10,
  },
  heroCategoryText: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  heroTitle: {
    color: '#fff', fontSize: 27, fontWeight: '900',
    letterSpacing: -0.5, marginBottom: 8, lineHeight: 33,
  },
  heroDesc: {
    color: 'rgba(255,255,255,0.72)', fontSize: 13, lineHeight: 19, marginBottom: 12,
  },
  heroMeta: { gap: 3, marginBottom: 16 },
  heroMetaText: { color: 'rgba(255,255,255,0.68)', fontSize: 12 },
  heroCTAs: { flexDirection: 'row', gap: 10 },
  ctaWhite: {
    backgroundColor: '#fff', borderRadius: 50,
    paddingHorizontal: 24, paddingVertical: 12,
  },
  ctaWhiteText: { color: '#050C18', fontSize: 14, fontWeight: '800' },
  ctaOutline: {
    borderRadius: 50, borderWidth: 1, borderColor: 'rgba(255,255,255,0.32)',
    paddingHorizontal: 24, paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.09)',
  },
  ctaOutlineText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  slideControls: {
    position: 'absolute', bottom: 14, left: 0, right: 0, zIndex: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  slideArrows: { flexDirection: 'row', gap: 8 },
  arrowBtn: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.09)',
  },
  arrowText: { color: 'rgba(255,255,255,0.7)', fontSize: 20, lineHeight: 22 },
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.32)' },
  dotActive: { width: 22, borderRadius: 4, backgroundColor: '#fff' },
  slideCounter: {
    color: 'rgba(255,255,255,0.42)', fontSize: 11, fontFamily: 'monospace', marginLeft: 4,
  },

  // Sections
  section: { paddingHorizontal: 18, paddingTop: 26 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  clearBtn: { fontSize: 13, fontWeight: '600' },
  limitedPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  limitedText: { fontSize: 10, fontWeight: '700' },
  viewAllPill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  viewAllText: { fontSize: 12, fontWeight: '600' },

  // Category grid
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catTile: {
    width: CARD_W, aspectRatio: 4 / 3,
    borderRadius: 14, overflow: 'hidden', position: 'relative',
  },
  catBottomScrim: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: '65%',
    backgroundColor: 'rgba(5,12,24,0.68)',
  },
  catContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 10 },
  catLabel: { color: '#fff', fontSize: 13, fontWeight: '700', marginBottom: 2 },
  catTagline: { color: 'rgba(255,255,255,0.6)', fontSize: 10, lineHeight: 13 },

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
  trustCard: {
    width: CARD_W, borderRadius: 12, padding: 14, borderWidth: 1,
  },
  trustIcon: { fontSize: 22, marginBottom: 8 },
  trustTitle: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  trustDesc: { fontSize: 11, lineHeight: 15 },

  // Empty state
  emptyBox: { alignItems: 'center', paddingVertical: 48 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyText: { fontSize: 14 },
});
