import React, { useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { TicketType } from '@/types';
import { formatCurrency, formatFullDate } from '@/utils/format';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { getEventById, purchaseTicket } = useApp();

  const event = getEventById(id);
  const [selectedType, setSelectedType] = useState<TicketType | null>(event?.ticketTypes[0] ?? null);
  const [quantity, setQuantity] = useState(1);
  const [purchasing, setPurchasing] = useState(false);

  if (!event) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.foreground }]}>Event not found</Text>
      </View>
    );
  }

  const total = (selectedType?.price ?? 0) * quantity;
  const currency = selectedType?.currency ?? 'NGN';

  const handleBuy = async () => {
    if (!selectedType) return;
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Alert.alert(
      'Confirm Purchase',
      `${quantity}x ${selectedType.name}\n${event.title}\n\nTotal: ${formatCurrency(total, currency)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Buy Now',
          onPress: async () => {
            setPurchasing(true);
            try {
              const ticket = await purchaseTicket(event, selectedType, quantity);
              if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert(
                'Key Secured',
                'Your digital key is now in your vault.',
                [{ text: 'View Key', onPress: () => router.replace(`/ticket/${ticket.id}`) }],
              );
            } finally {
              setPurchasing(false);
            }
          },
        },
      ],
    );
  };

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Custom header */}
      <View style={[styles.navBar, { paddingTop: topPadding + 6 }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.navBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="share-outline" size={20} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomPadding + 140 }}>
        {/* Hero section */}
        <View style={[styles.hero, { backgroundColor: event.accentColor + '20', borderBottomColor: event.accentColor + '40' }]}>
          <View style={styles.heroPadding}>
            {/* Category + tags */}
            <View style={styles.tagRow}>
              <View style={[styles.catPill, { backgroundColor: event.accentColor }]}>
                <Text style={styles.catPillText}>{event.category}</Text>
              </View>
              {event.tags.slice(0, 2).map((tag) => (
                <View key={tag} style={[styles.tagPill, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                  <Text style={[styles.tagText, { color: colors.mutedForeground }]}>{tag}</Text>
                </View>
              ))}
            </View>

            <Text style={[styles.heroTitle, { color: colors.foreground }]}>{event.title}</Text>

            {/* Key event details */}
            <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.detailRow}>
                <View style={[styles.detailIcon, { backgroundColor: event.accentColor + '20' }]}>
                  <Ionicons name="calendar" size={16} color={event.accentColor} />
                </View>
                <View>
                  <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Date</Text>
                  <Text style={[styles.detailValue, { color: colors.foreground }]}>{formatFullDate(event.date)}</Text>
                </View>
              </View>
              <View style={[styles.detailDivider, { backgroundColor: colors.border }]} />
              <View style={styles.detailRow}>
                <View style={[styles.detailIcon, { backgroundColor: event.accentColor + '20' }]}>
                  <Ionicons name="time" size={16} color={event.accentColor} />
                </View>
                <View>
                  <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Time</Text>
                  <Text style={[styles.detailValue, { color: colors.foreground }]}>{event.time}</Text>
                </View>
              </View>
              <View style={[styles.detailDivider, { backgroundColor: colors.border }]} />
              <View style={styles.detailRow}>
                <View style={[styles.detailIcon, { backgroundColor: event.accentColor + '20' }]}>
                  <Ionicons name="location" size={16} color={event.accentColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Venue</Text>
                  <Text style={[styles.detailValue, { color: colors.foreground }]}>
                    {event.venue}, {event.city}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>About</Text>
          <Text style={[styles.description, { color: colors.mutedForeground }]}>{event.description}</Text>
        </View>

        {/* Ticket types */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Select Your Key</Text>
          {event.ticketTypes.map((type) => (
            <Pressable
              key={type.id}
              onPress={() => setSelectedType(type)}
              style={[
                styles.ticketTypeCard,
                {
                  backgroundColor: colors.card,
                  borderColor: selectedType?.id === type.id ? event.accentColor : colors.border,
                  borderWidth: selectedType?.id === type.id ? 2 : 1,
                },
              ]}
            >
              <View style={styles.typeTop}>
                <View style={styles.typeNameRow}>
                  <View
                    style={[
                      styles.typeRadio,
                      {
                        borderColor: selectedType?.id === type.id ? event.accentColor : colors.border,
                        backgroundColor: selectedType?.id === type.id ? event.accentColor : 'transparent',
                      },
                    ]}
                  >
                    {selectedType?.id === type.id && <View style={styles.typeRadioDot} />}
                  </View>
                  <Text style={[styles.typeName, { color: colors.foreground }]}>{type.name}</Text>
                </View>
                <Text style={[styles.typePrice, { color: selectedType?.id === type.id ? event.accentColor : colors.foreground }]}>
                  {formatCurrency(type.price, type.currency)}
                </Text>
              </View>
              <Text style={[styles.typeDesc, { color: colors.mutedForeground }]}>{type.description}</Text>
              {type.perks && type.perks.length > 0 && (
                <View style={styles.perksRow}>
                  {type.perks.map((perk) => (
                    <View key={perk} style={[styles.perkChip, { backgroundColor: event.accentColor + '18' }]}>
                      <Ionicons name="checkmark" size={10} color={event.accentColor} />
                      <Text style={[styles.perkText, { color: event.accentColor }]}>{perk}</Text>
                    </View>
                  ))}
                </View>
              )}
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Bottom bar */}
      <View
        style={[
          styles.bottomBar,
          { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: bottomPadding + 8 },
        ]}
      >
        {/* Quantity */}
        <View style={styles.qtySection}>
          <Text style={[styles.qtyLabel, { color: colors.mutedForeground }]}>Qty</Text>
          <View style={styles.qtyControl}>
            <TouchableOpacity
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
              style={[styles.qtyBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
            >
              <Ionicons name="remove" size={18} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.qtyNum, { color: colors.foreground }]}>{quantity}</Text>
            <TouchableOpacity
              onPress={() => setQuantity(Math.min(10, quantity + 1))}
              style={[styles.qtyBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
            >
              <Ionicons name="add" size={18} color={colors.foreground} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Buy button */}
        <TouchableOpacity
          onPress={handleBuy}
          disabled={purchasing || !selectedType}
          style={[styles.buyBtn, { backgroundColor: purchasing ? colors.muted : colors.primary, flex: 1 }]}
        >
          <Text style={[styles.buyBtnText, { color: purchasing ? colors.mutedForeground : colors.primaryForeground }]}>
            {purchasing ? 'Processing...' : `Get Key · ${formatCurrency(total, currency)}`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  navBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    zIndex: 10,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    borderBottomWidth: 1,
    paddingTop: Platform.OS === 'web' ? 140 : 100,
    paddingBottom: 4,
  },
  heroPadding: {
    paddingHorizontal: 16,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  catPillText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
  },
  tagPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
    lineHeight: 34,
    marginBottom: 16,
  },
  detailCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  detailIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    fontFamily: 'Inter_600SemiBold',
  },
  detailDivider: {
    height: 1,
    marginHorizontal: 14,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: 'Inter_400Regular',
  },
  ticketTypeCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  typeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  typeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  typeRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeRadioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
  },
  typeName: {
    fontSize: 15,
    fontWeight: '600' as const,
    fontFamily: 'Inter_600SemiBold',
  },
  typePrice: {
    fontSize: 16,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
  },
  typeDesc: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginLeft: 30,
    marginBottom: 8,
  },
  perksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginLeft: 30,
  },
  perkChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  perkText: {
    fontSize: 11,
    fontWeight: '600' as const,
    fontFamily: 'Inter_600SemiBold',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  qtySection: {
    alignItems: 'center',
    gap: 4,
  },
  qtyLabel: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyNum: {
    fontSize: 18,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
    minWidth: 24,
    textAlign: 'center',
  },
  buyBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
});
