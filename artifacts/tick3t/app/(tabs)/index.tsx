import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { EventCard } from '@/components/EventCard';
import { Event, EventCategory } from '@/types';

const CATEGORIES: EventCategory[] = ['All', 'Music', 'Sports', 'Arts', 'Tech', 'Food'];

function CategoryIcon({ cat, color }: { cat: EventCategory; color: string }) {
  const iconMap: Record<EventCategory, string> = {
    All: 'grid-outline',
    Music: 'musical-notes-outline',
    Sports: 'football-outline',
    Arts: 'color-palette-outline',
    Tech: 'hardware-chip-outline',
    Food: 'restaurant-outline',
  };
  return <Ionicons name={iconMap[cat] as any} size={14} color={color} />;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DiscoverScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { events, user } = useApp();

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<EventCategory>('All');

  const firstName = user.name.split(' ')[0];
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const filtered = useMemo<Event[]>(() => {
    return events.filter((e) => {
      const matchCat = activeCategory === 'All' || e.category === activeCategory;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        e.title.toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q) ||
        e.city.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [events, search, activeCategory]);

  const featuredEvent = events.find((e) => e.featured);
  const regularEvents = filtered.filter((e) => !e.featured || search || activeCategory !== 'All');

  const ListHeader = (
    <View>
      {/* Greeting header */}
      <View style={[styles.header, { paddingTop: topPadding + 8 }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>{getGreeting()}</Text>
          <Text style={[styles.name, { color: colors.foreground }]}>{firstName}</Text>
        </View>
        <View style={[styles.notifBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="notifications-outline" size={22} color={colors.foreground} />
        </View>
      </View>

      {/* Search bar */}
      <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={18} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="Search events, venues, cities..."
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {!!search && (
          <Pressable onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catScroll}
      >
        {CATEGORIES.map((cat) => {
          const active = cat === activeCategory;
          return (
            <Pressable
              key={cat}
              onPress={() => setActiveCategory(cat)}
              style={[
                styles.catBtn,
                active
                  ? { backgroundColor: colors.primary }
                  : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
              ]}
            >
              <CategoryIcon cat={cat} color={active ? colors.primaryForeground : colors.mutedForeground} />
              <Text
                style={[
                  styles.catText,
                  { color: active ? colors.primaryForeground : colors.mutedForeground },
                  active && styles.catTextActive,
                ]}
              >
                {cat}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Featured event */}
      {featuredEvent && !search && activeCategory === 'All' && (
        <View style={styles.featuredSection}>
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Featured</Text>
          <EventCard event={featuredEvent} featured />
        </View>
      )}

      {/* Section label for event list */}
      <View style={styles.eventsLabelRow}>
        <Text style={[styles.sectionLabel, { color: colors.foreground }]}>
          {search || activeCategory !== 'All' ? `Results (${filtered.length})` : 'Upcoming Events'}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <FlatList<Event>
        data={regularEvents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <EventCard event={item} />}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No events found</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Try a different search or category
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginBottom: 2,
  },
  name: {
    fontSize: 26,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
  },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  catScroll: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 16,
  },
  catBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  catText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  catTextActive: {
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
  },
  featuredSection: {
    paddingHorizontal: 16,
  },
  eventsLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
    marginBottom: 12,
  },
  listContent: {
    paddingHorizontal: 0,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
  },
  emptySub: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
});
