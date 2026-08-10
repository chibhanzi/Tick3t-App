import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, TextInput,
  StatusBar, Image, Animated, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/context/AppContext';
import EventCard from '@/components/EventCard';
import Logo from '@/components/Logo';
import FilterModal, { FilterState } from '@/components/FilterModal';
import { EventCategory } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_W = (SCREEN_WIDTH - 36 - 10) / 2;

const HERO_SLIDES = [
  {
    id: '1',
    title: 'Bass Drop Festival 2024',
    description: 'The hottest DJs and producers for a night of non-stop dancing under the Miami stars.',
    date: 'MAR 15, 2024', time: '9:00 PM', venue: 'Miami Beach Arena',
    category: 'Music Festival',
    image: 'https://images.unsplash.com/photo-1470813740244-df37b8c1edcb?w=900&h=700&fit=crop',
  },
  {
    id: '3',
    title: 'Tech Innovation Summit',
    description: 'The premier tech conference — founders, investors, and engineers shaping the future.',
    date: 'MAR 28, 2024', time: '9:00 AM', venue: 'Silicon Valley Convention Center',
    category: 'Tech & Networking',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900&h=700&fit=crop',
  },
  {
    id: '6',
    title: 'Fashion Week Gala',
    description: 'Runway shows, designer meet-and-greets, and exclusive after-parties in Manhattan.',
    date: 'APR 20, 2024', time: '8:00 PM', venue: 'Manhattan Design Center',
    category: 'Fashion',
    image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=900&h=700&fit=crop',
  },
];

const CATEGORIES = [
  { label: 'Music', tagline: 'Concerts & festivals', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop', cat: 'Music Festival' as EventCategory },
  { label: 'Art', tagline: 'Galleries & showcases', image: 'https://images.unsplash.com/photo-1500673922987-e212871fec22?w=400&h=300&fit=crop', cat: 'Art & Culture' as EventCategory },
  { label: 'Tech', tagline: 'Conferences & summits', image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop', cat: 'Tech & Networking' as EventCategory },
  { label: 'Gaming', tagline: 'Esports & championships', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop', cat: 'Gaming' as EventCategory },
];

const DEFAULT_FILTERS: FilterState = { location: '', categories: [], dateFilter: 'Any time', minPrice: '', maxPrice: '' };

export default function DiscoverScreen() {
  const { colors: C, isDark } = useTheme();
  const router = useRouter();
  const { events } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<EventCategory | null>(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterState>(DEFAULT_FILTERS);

  // Hero slider
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

  // Apply all filters
  const searchResults = useMemo(() => {
    let pool = events;
    const q = searchQuery.toLowerCase();
    if (q) pool = pool.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.location.toLowerCase().includes(q) ||
      e.organizer.toLowerCase().includes(q)
    );
    if (activeCategory) pool = pool.filter(e => e.category === activeCategory);
    if (activeFilters.location) pool = pool.filter(e => e.location.toLowerCase().includes(activeFilters.location.toLowerCase()));
    if (activeFilters.categories.length) pool = pool.filter(e => activeFilters.categories.includes(e.category));
    if (activeFilters.minPrice) pool = pool.filter(e => e.price >= Number(activeFilters.minPrice));
    if (activeFilters.maxPrice) pool = pool.filter(e => e.price <= Number(activeFilters.maxPrice));
    return pool;
  }, [events, searchQuery, activeCategory, activeFilters]);

  const hasActiveFilters =
    activeFilters.location !== '' ||
    activeFilters.categories.length > 0 ||
    activeFilters.dateFilter !== 'Any time' ||
    activeFilters.minPrice !== '' ||
    activeFilters.maxPrice !== '';

  const activeFilterCount =
    (activeFilters.location ? 1 : 0) +
    activeFilters.categories.length +
    (activeFilters.dateFilter !== 'Any time' ? 1 : 0) +
    (activeFilters.minPrice || activeFilters.maxPrice ? 1 : 0);

  const showingResults = searchQuery.length > 0 || activeCategory !== null || hasActiveFilters;
  const current = HERO_SLIDES[slide];

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Hero slideshow (full-bleed, search bar is sticky outside) ──── */}
        <View style={styles.heroWrap}>
          {/* Background images */}
          {HERO_SLIDES.map((s, i) => (
            <Image key={s.id} source={{ uri: s.image }}
              style={[StyleSheet.absoluteFillObject, { opacity: i === slide ? 1 : 0 }]}
              resizeMode="cover"
            />
          ))}

          {/* Gradient scrims */}
          <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
            <LinearGradient
              colors={['rgba(5,12,24,0.6)', 'transparent']}
              style={{ height: 180 }}
            />
            <View style={{ flex: 1 }} />
            <LinearGradient
              colors={['transparent', 'rgba(5,12,24,0.88)']}
              style={{ height: 280 }}
            />
          </View>

          {/* ── Slide event info ─────────────────────────────────────────── */}
          <Animated.View style={[styles.slideInfo, { opacity: fadeAnim }]}>
            <View style={styles.heroCategoryBadge}>
              <Text style={styles.heroCategoryText}>{current.category}</Text>
            </View>
            <Text style={styles.heroTitle} numberOfLines={2}>{current.title}</Text>
            <Text style={styles.heroDesc} numberOfLines={2}>{current.description}</Text>
            <View style={styles.heroMeta}>
              <View style={styles.heroMetaItem}>
                <Ionicons name="calendar-outline" size={12} color="rgba(255,255,255,0.6)" />
                <Text style={styles.heroMetaText}>{current.date} · {current.time}</Text>
              </View>
              <View style={styles.heroMetaItem}>
                <Ionicons name="location-outline" size={12} color="rgba(255,255,255,0.6)" />
                <Text style={styles.heroMetaText}>{current.venue}</Text>
              </View>
            </View>
            <View style={styles.heroCTAs}>
              <Pressable style={styles.ctaWhite} onPress={() => router.push(`/event/${current.id}`)}>
                <Text style={styles.ctaWhiteText}>Get Tickets</Text>
              </Pressable>
              <Pressable style={styles.ctaOutline}>
                <Text style={styles.ctaOutlineText}>Browse Events</Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* Controls */}
          <View style={styles.slideControls}>
            <View style={styles.slideArrows}>
              <Pressable style={styles.arrowBtn} onPress={() => goTo((slide - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}>
                <Ionicons name="chevron-back" size={18} color="rgba(255,255,255,0.8)" />
              </Pressable>
              <Pressable style={styles.arrowBtn} onPress={() => goTo((slide + 1) % HERO_SLIDES.length)}>
                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.8)" />
              </Pressable>
            </View>
            <View style={styles.dotsRow}>
              {HERO_SLIDES.map((_, i) => (
                <Pressable key={i} onPress={() => goTo(i)}>
                  <View style={[styles.dot, i === slide && styles.dotActive]} />
                </Pressable>
              ))}
              <Text style={styles.slideCounter}>{String(slide + 1).padStart(2, '0')} / {String(HERO_SLIDES.length).padStart(2, '0')}</Text>
            </View>
          </View>
        </View>

        {/* ── Search / filter results ─────────────────────────────────────── */}
        {showingResults ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: C.text }]}>
                {searchQuery ? `"${searchQuery}"` : activeCategory ?? 'Filtered'}
                <Text style={{ color: C.textMuted, fontSize: 14 }}> ({searchResults.length})</Text>
              </Text>
              <Pressable onPress={() => { setSearchQuery(''); setActiveCategory(null); setActiveFilters(DEFAULT_FILTERS); }}>
                <Text style={{ color: C.primary, fontSize: 13, fontWeight: '600' }}>Clear ✕</Text>
              </Pressable>
            </View>
            {searchResults.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="search-outline" size={48} color={C.textMuted} />
                <Text style={[styles.emptyTitle, { color: C.text, marginTop: 12 }]}>No events found</Text>
                <Text style={[styles.emptyText, { color: C.textMuted }]}>Try adjusting your search or filters.</Text>
              </View>
            ) : (
              <View style={styles.twoCol}>
                {searchResults.map(e => <EventCard key={e.id} event={e} variant="grid" />)}
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
                    <Text style={[styles.sectionTitle, { color: C.text }]}>Almost Sold Out</Text>
                    <View style={[styles.limitedPill, { backgroundColor: '#EF444420', borderColor: '#EF444450' }]}>
                      <Ionicons name="time-outline" size={10} color="#F87171" />
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
                <Ionicons name="calendar-outline" size={16} color="#fff" />
                <Text style={styles.seeAllText}>See All Events</Text>
              </Pressable>
            </View>

            {/* ── Why Tick3t ── */}
            <View style={styles.whySection}>
              <Text style={[styles.sectionTitle, { color: C.text, marginBottom: 4 }]}>Why Tick3t?</Text>
              <Text style={[styles.whySubtitle, { color: C.textMuted }]}>The smarter way to experience events</Text>

              <View style={styles.whyGrid}>
                {[
                  {
                    icon: 'cube-outline' as const,
                    title: 'NFT Tickets',
                    desc: 'Every ticket lives on the TON blockchain — unforgeable, yours forever.',
                    gradColors: ['#1a2a4a', '#0f1e35'] as [string, string],
                    accent: '#60A5FA',
                  },
                  {
                    icon: 'shield-checkmark-outline' as const,
                    title: 'Secure Payments',
                    desc: 'Encrypted checkout powered by Paynow for instant, safe transactions.',
                    gradColors: ['#1a3a2a', '#0f2820'] as [string, string],
                    accent: '#34d399',
                  },
                  {
                    icon: 'storefront-outline' as const,
                    title: 'Verified Resale',
                    desc: 'Buy and sell tickets with confidence — every listing is identity-verified.',
                    gradColors: ['#2a1a3a', '#1f1030'] as [string, string],
                    accent: '#a78bfa',
                  },
                  {
                    icon: 'color-palette-outline' as const,
                    title: 'Custom Keys',
                    desc: 'Personalised digital ticket designs that are as unique as the event.',
                    gradColors: ['#3a2a1a', '#2a1a0f'] as [string, string],
                    accent: '#fb923c',
                  },
                ].map((item, i) => (
                  <LinearGradient
                    key={i}
                    colors={isDark ? item.gradColors : ['#f8fafc', '#f1f5f9']}
                    style={[styles.whyCard, { borderColor: isDark ? item.accent + '30' : C.border }]}
                  >
                    <View style={[styles.whyIconCircle, { backgroundColor: item.accent + '20' }]}>
                      <Ionicons name={item.icon} size={22} color={item.accent} />
                    </View>
                    <Text style={[styles.whyTitle, { color: C.text }]}>{item.title}</Text>
                    <Text style={[styles.whyDesc, { color: C.textMuted }]}>{item.desc}</Text>
                  </LinearGradient>
                ))}
              </View>
            </View>

            <View style={{ height: 32 }} />
          </>
        )}
      </ScrollView>

      {/* ── Sticky search header (floats above ScrollView) ──────────────── */}
      <SafeAreaView edges={['top']} style={styles.stickyHeader}>
        <View style={styles.stickyLogoRow}>
          <Logo size="md" light />
        </View>
        <View style={styles.stickySearchRow}>
          <View style={styles.stickySearchBar}>
            <Ionicons name="search" size={16} color="rgba(255,255,255,0.55)" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.stickySearchInput}
              placeholder="Search events, artists or venues…"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={searchQuery}
              onChangeText={t => { setSearchQuery(t); setActiveCategory(null); }}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.45)" />
              </Pressable>
            )}
          </View>
          <Pressable
            style={[styles.stickyFilterBtn, hasActiveFilters && { backgroundColor: C.primary, borderColor: C.primary }]}
            onPress={() => setFilterVisible(true)}
          >
            <Ionicons name="options-outline" size={18} color="#fff" />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
        {hasActiveFilters && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 8 }}
            contentContainerStyle={{ gap: 6, paddingHorizontal: 16 }}
          >
            {activeFilters.location ? (
              <View style={styles.stickyChip}>
                <Ionicons name="location-outline" size={11} color="#fff" />
                <Text style={styles.stickyChipText}>{activeFilters.location}</Text>
              </View>
            ) : null}
            {activeFilters.categories.map(cat => (
              <View key={cat} style={styles.stickyChip}>
                <Text style={styles.stickyChipText}>{cat}</Text>
              </View>
            ))}
            {activeFilters.dateFilter !== 'Any time' && (
              <View style={styles.stickyChip}>
                <Ionicons name="calendar-outline" size={11} color="#fff" />
                <Text style={styles.stickyChipText}>{activeFilters.dateFilter}</Text>
              </View>
            )}
            <Pressable
              style={[styles.stickyChip, { backgroundColor: 'rgba(239,68,68,0.55)', borderColor: 'rgba(239,68,68,0.7)' }]}
              onPress={() => { setActiveFilters(DEFAULT_FILTERS); setActiveCategory(null); setSearchQuery(''); }}
            >
              <Text style={styles.stickyChipText}>Clear all</Text>
              <Ionicons name="close" size={11} color="#fff" />
            </Pressable>
          </ScrollView>
        )}
      </SafeAreaView>

      {/* Filter modal */}
      <FilterModal
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onApply={setActiveFilters}
        activeFilters={activeFilters}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Sticky header (sits above ScrollView, absolute positioned) ──────────
  stickyHeader: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30,
    backgroundColor: 'rgba(5,12,24,0.78)',
  },
  stickyLogoRow: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8 },
  stickySearchRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 10 },
  stickySearchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', height: 44,
    borderRadius: 50, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14,
  },
  stickySearchInput: { flex: 1, fontSize: 14, paddingVertical: 0, color: '#fff' },
  stickyFilterBtn: {
    width: 44, height: 44, borderRadius: 50, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  filterBadge: { position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' },
  filterBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  stickyChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  stickyChipText: { fontSize: 11, fontWeight: '600', color: '#fff' },

  // ── Hero ─────────────────────────────────────────────────────────────────
  heroWrap: { width: '100%', height: 560, position: 'relative' },

  slideInfo: { position: 'absolute', bottom: 52, left: 0, right: 0, paddingHorizontal: 20 },
  heroCategoryBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(22,163,74,0.9)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 50, marginBottom: 10 },
  heroCategoryText: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  heroTitle: { color: '#fff', fontSize: 26, fontWeight: '900', letterSpacing: -0.5, marginBottom: 8, lineHeight: 32 },
  heroDesc: { color: 'rgba(255,255,255,0.72)', fontSize: 13, lineHeight: 18, marginBottom: 10 },
  heroMeta: { gap: 4, marginBottom: 14 },
  heroMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  heroMetaText: { color: 'rgba(255,255,255,0.68)', fontSize: 12 },
  heroCTAs: { flexDirection: 'row', gap: 10 },
  ctaWhite: { backgroundColor: '#fff', borderRadius: 50, paddingHorizontal: 22, paddingVertical: 11 },
  ctaWhiteText: { color: '#050C18', fontSize: 14, fontWeight: '800' },
  ctaOutline: { borderRadius: 50, borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)', paddingHorizontal: 22, paddingVertical: 11, backgroundColor: 'rgba(255,255,255,0.10)' },
  ctaOutlineText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  slideControls: { position: 'absolute', bottom: 12, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  slideArrows: { flexDirection: 'row', gap: 8 },
  arrowBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.10)' },
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.35)' },
  dotActive: { width: 20, borderRadius: 4, backgroundColor: '#fff' },
  slideCounter: { color: 'rgba(255,255,255,0.45)', fontSize: 11, fontFamily: 'monospace', marginLeft: 4 },

  section: { paddingHorizontal: 18, paddingTop: 26 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  limitedPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  limitedText: { fontSize: 10, fontWeight: '700' },
  viewAllPill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  viewAllText: { fontSize: 12, fontWeight: '600' },

  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catTile: { width: CARD_W, aspectRatio: 4 / 3, borderRadius: 14, overflow: 'hidden', position: 'relative' },
  catBottomScrim: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', backgroundColor: 'rgba(5,12,24,0.72)' },
  catContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 10 },
  catLabel: { color: '#fff', fontSize: 13, fontWeight: '700', marginBottom: 2 },
  catTagline: { color: 'rgba(255,255,255,0.65)', fontSize: 10, lineHeight: 13 },

  twoCol: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  leftBadge: { position: 'absolute', top: -4, right: -4, zIndex: 5, backgroundColor: '#EF4444', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  leftBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  ctaRow: { alignItems: 'center', paddingTop: 26, paddingHorizontal: 18 },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 50, paddingVertical: 14, width: '100%', justifyContent: 'center' },
  seeAllText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  // Why Tick3t
  whySection: { paddingHorizontal: 18, paddingTop: 32 },
  whySubtitle: { fontSize: 13, marginBottom: 18, marginTop: 2 },
  whyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  whyCard: { width: CARD_W, borderRadius: 16, borderWidth: 1, padding: 16 },
  whyIconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  whyTitle: { fontSize: 14, fontWeight: '800', marginBottom: 6, letterSpacing: -0.2 },
  whyDesc: { fontSize: 11, lineHeight: 16 },

  emptyBox: { alignItems: 'center', paddingVertical: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyText: { fontSize: 14 },
});
