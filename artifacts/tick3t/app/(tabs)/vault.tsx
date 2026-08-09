import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { TicketCard } from '@/components/TicketCard';
import { PurchasedTicket } from '@/types';
import { isEventUpcoming } from '@/utils/format';

type Filter = 'upcoming' | 'past';

export default function VaultScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { purchasedTickets } = useApp();
  const [filter, setFilter] = useState<Filter>('upcoming');

  const filtered = useMemo<PurchasedTicket[]>(() => {
    return purchasedTickets.filter((t) =>
      filter === 'upcoming'
        ? isEventUpcoming(t.event.date) && t.status !== 'used'
        : !isEventUpcoming(t.event.date) || t.status === 'used',
    );
  }, [purchasedTickets, filter]);

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 8, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>My Vault</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {purchasedTickets.length} {purchasedTickets.length === 1 ? 'key' : 'keys'} stored
          </Text>
        </View>
        <View style={[styles.keyIcon, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '40' }]}>
          <Ionicons name="shield-checkmark" size={22} color={colors.primary} />
        </View>
      </View>

      {/* Filter tabs */}
      <View style={[styles.filterRow, { borderBottomColor: colors.border }]}>
        {(['upcoming', 'past'] as Filter[]).map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[
              styles.filterBtn,
              filter === f && [styles.filterBtnActive, { borderBottomColor: colors.primary }],
            ]}
          >
            <Text
              style={[
                styles.filterText,
                { color: filter === f ? colors.primary : colors.mutedForeground },
                filter === f && styles.filterTextActive,
              ]}
            >
              {f === 'upcoming' ? 'Upcoming' : 'Past'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList<PurchasedTicket>
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TicketCard ticket={item} />}
        contentContainerStyle={[
          styles.list,
          filtered.length === 0 && styles.listEmpty,
          { paddingBottom: insets.bottom + 100 },
        ]}
        scrollEnabled={filtered.length > 0}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconCircle, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Ionicons name="shield-outline" size={40} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {filter === 'upcoming' ? 'No upcoming events' : 'No past events'}
            </Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              {filter === 'upcoming'
                ? 'Your purchased keys will appear here'
                : 'Events you have attended will show up here'}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
  },
  headerSub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  keyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  filterRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 20,
  },
  filterBtn: {
    paddingVertical: 14,
    marginRight: 28,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  filterBtnActive: {},
  filterText: {
    fontSize: 14,
    fontWeight: '500' as const,
    fontFamily: 'Inter_500Medium',
  },
  filterTextActive: {
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  listEmpty: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
});
