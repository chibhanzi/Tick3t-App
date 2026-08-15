import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, Pressable, TextInput,
  ScrollView, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

const { height: SCREEN_H } = Dimensions.get('window');

const CATEGORIES = ['Music Festival', 'Art & Culture', 'Tech & Networking', 'Gaming', 'Fashion', 'Beach Party'];
const DATE_OPTIONS = ['Any time', 'Today', 'This week', 'This weekend', 'This month', 'Next 3 months'];
const CITIES = ['Miami', 'New York', 'Los Angeles', 'San Jose', 'Malibu'];

export interface FilterState {
  location: string;
  categories: string[];
  dateFilter: string;
  minPrice: string;
  maxPrice: string;
}

const DEFAULT_FILTERS: FilterState = {
  location: '',
  categories: [],
  dateFilter: 'Any time',
  minPrice: '',
  maxPrice: '',
};

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  activeFilters: FilterState;
}

export default function FilterModal({ visible, onClose, onApply, activeFilters }: FilterModalProps) {
  const { colors: C, isDark } = useTheme();
  const [filters, setFilters] = useState<FilterState>(activeFilters);

  const toggle = (cat: string) => {
    setFilters(f => ({
      ...f,
      categories: f.categories.includes(cat)
        ? f.categories.filter(c => c !== cat)
        : [...f.categories, cat],
    }));
  };

  const activeCount =
    (filters.location ? 1 : 0) +
    filters.categories.length +
    (filters.dateFilter !== 'Any time' ? 1 : 0) +
    (filters.minPrice || filters.maxPrice ? 1 : 0);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: C.card, borderColor: C.border }]}>
        {/* Handle */}
        <View style={[styles.handle, { backgroundColor: C.border }]} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: C.text }]}>Filter Events</Text>
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={24} color={C.textSecondary} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
          {/* Location */}
          <Text style={[styles.label, { color: C.textSecondary }]}>LOCATION</Text>
          <View style={[styles.textInputWrap, { backgroundColor: C.background, borderColor: C.border }]}>
            <Ionicons name="location-outline" size={18} color={C.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.textInput, { color: C.text }]}
              placeholder="City or venue…"
              placeholderTextColor={C.textMuted}
              value={filters.location}
              onChangeText={v => setFilters(f => ({ ...f, location: v }))}
            />
            {filters.location.length > 0 && (
              <Pressable onPress={() => setFilters(f => ({ ...f, location: '' }))}>
                <Ionicons name="close-circle" size={18} color={C.textMuted} />
              </Pressable>
            )}
          </View>

          {/* Quick city chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }} contentContainerStyle={{ gap: 8, paddingTop: 10 }}>
            {CITIES.map(city => {
              const active = filters.location === city;
              return (
                <Pressable
                  key={city}
                  style={[styles.chip, { backgroundColor: active ? C.primary : C.background, borderColor: active ? C.primary : C.border }]}
                  onPress={() => setFilters(f => ({ ...f, location: active ? '' : city }))}
                >
                  <Text style={[styles.chipText, { color: active ? '#fff' : C.textSecondary }]}>{city}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Category */}
          <Text style={[styles.label, { color: C.textSecondary }]}>CATEGORY</Text>
          <View style={styles.chips}>
            {CATEGORIES.map(cat => {
              const active = filters.categories.includes(cat);
              return (
                <Pressable
                  key={cat}
                  style={[styles.chip, { backgroundColor: active ? C.primary : C.background, borderColor: active ? C.primary : C.border }]}
                  onPress={() => toggle(cat)}
                >
                  <Text style={[styles.chipText, { color: active ? '#fff' : C.textSecondary }]}>{cat}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Date */}
          <Text style={[styles.label, { color: C.textSecondary }]}>DATE</Text>
          <View style={styles.chips}>
            {DATE_OPTIONS.map(opt => {
              const active = filters.dateFilter === opt;
              return (
                <Pressable
                  key={opt}
                  style={[styles.chip, { backgroundColor: active ? C.primary : C.background, borderColor: active ? C.primary : C.border }]}
                  onPress={() => setFilters(f => ({ ...f, dateFilter: opt }))}
                >
                  <Text style={[styles.chipText, { color: active ? '#fff' : C.textSecondary }]}>{opt}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Price range */}
          <Text style={[styles.label, { color: C.textSecondary }]}>PRICE RANGE (USD)</Text>
          <View style={styles.priceRow}>
            <View style={[styles.priceInput, { backgroundColor: C.background, borderColor: C.border }]}>
              <Text style={[styles.priceCurrency, { color: C.textMuted }]}>$</Text>
              <TextInput
                style={[styles.textInput, { color: C.text }]}
                placeholder="Min"
                placeholderTextColor={C.textMuted}
                keyboardType="numeric"
                value={filters.minPrice}
                onChangeText={v => setFilters(f => ({ ...f, minPrice: v }))}
              />
            </View>
            <Text style={[{ color: C.textMuted, fontSize: 16, marginHorizontal: 8 }]}>—</Text>
            <View style={[styles.priceInput, { backgroundColor: C.background, borderColor: C.border }]}>
              <Text style={[styles.priceCurrency, { color: C.textMuted }]}>$</Text>
              <TextInput
                style={[styles.textInput, { color: C.text }]}
                placeholder="Max"
                placeholderTextColor={C.textMuted}
                keyboardType="numeric"
                value={filters.maxPrice}
                onChangeText={v => setFilters(f => ({ ...f, maxPrice: v }))}
              />
            </View>
          </View>
        </ScrollView>

        {/* Actions */}
        <View style={[styles.footer, { borderTopColor: C.border }]}>
          <Pressable
            style={[styles.resetBtn, { borderColor: C.border }]}
            onPress={() => setFilters(DEFAULT_FILTERS)}
          >
            <Text style={[styles.resetText, { color: C.textSecondary }]}>Reset{activeCount > 0 ? ` (${activeCount})` : ''}</Text>
          </Pressable>
          <Pressable
            style={[styles.applyBtn, { backgroundColor: C.primary }]}
            onPress={() => { onApply(filters); onClose(); }}
          >
            <Text style={styles.applyText}>Apply Filters</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    maxHeight: SCREEN_H * 0.85,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, borderBottomWidth: 0,
    overflow: 'hidden',
  },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  title: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  body: { paddingHorizontal: 20, paddingBottom: 16 },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 10, marginTop: 4 },

  textInputWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, height: 46, marginBottom: 4 },
  textInput: { flex: 1, fontSize: 14, paddingVertical: 0 },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '600' },

  priceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  priceInput: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, height: 46 },
  priceCurrency: { fontSize: 15, marginRight: 4 },

  footer: { flexDirection: 'row', gap: 12, padding: 16, paddingBottom: 28, borderTopWidth: 1 },
  resetBtn: { flex: 1, height: 50, borderRadius: 50, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  resetText: { fontSize: 14, fontWeight: '700' },
  applyBtn: { flex: 2, height: 50, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  applyText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
