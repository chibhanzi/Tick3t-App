import React from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Modal,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/context/AppContext';
import { AppNotification, NotificationType } from '@/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

// pref category → which notification types belong to it
const TYPE_TO_PREF: Record<NotificationType, keyof ReturnType<typeof useApp>['notifPrefs']> = {
  event_reminder:        'events',
  saved_almost_sold_out: 'events',
  offer_received:        'resale',
  listing_sold:          'resale',
  transfer_received:     'transfers',
};

const TYPE_META: Record<NotificationType, { icon: string; color: string }> = {
  event_reminder:        { icon: 'calendar-outline',          color: '#6366F1' },
  saved_almost_sold_out: { icon: 'heart-outline',             color: '#F87171' },
  offer_received:        { icon: 'pricetag-outline',          color: '#F59E0B' },
  listing_sold:          { icon: 'checkmark-circle-outline',  color: '#22C55E' },
  transfer_received:     { icon: 'swap-horizontal-outline',   color: '#A78BFA' },
};

// ── Row ───────────────────────────────────────────────────────────────────────

function NotifRow({ n, onPress }: { n: AppNotification; onPress: () => void }) {
  const { colors: C } = useTheme();
  const meta = TYPE_META[n.type];
  return (
    <Pressable
      style={[
        styles.row,
        { backgroundColor: n.read ? C.card : C.primary + '0D', borderColor: C.border },
      ]}
      onPress={onPress}
    >
      {/* Icon */}
      <View style={[styles.iconBox, { backgroundColor: meta.color + '20' }]}>
        <Ionicons name={meta.icon as any} size={20} color={meta.color} />
      </View>
      {/* Text */}
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={[styles.rowTitle, { color: C.text }]} numberOfLines={1}>{n.title}</Text>
        <Text style={[styles.rowBody, { color: C.textSecondary }]} numberOfLines={2}>{n.body}</Text>
        <Text style={[styles.rowTime, { color: C.textMuted }]}>{relativeTime(n.timestamp)}</Text>
      </View>
      {/* Unread dot */}
      {!n.read && <View style={[styles.unreadDot, { backgroundColor: C.primary }]} />}
    </Pressable>
  );
}

// ── Main sheet ────────────────────────────────────────────────────────────────

interface Props { visible: boolean; onClose: () => void }

export default function NotificationCenter({ visible, onClose }: Props) {
  const { colors: C } = useTheme();
  const router = useRouter();
  const { notifications, markAllRead, markNotifRead, notifPrefs } = useApp();

  // Filter by prefs
  const visible_notifs = notifications.filter(n => {
    const pref = TYPE_TO_PREF[n.type] as keyof typeof notifPrefs;
    return notifPrefs[pref] !== false;
  });

  const unreadCount = visible_notifs.filter(n => !n.read).length;

  const handleOpen = () => {
    markAllRead();
    onClose();
  };

  const handleRow = (n: AppNotification) => {
    markNotifRead(n.id);
    onClose();
    if (n.deepLink) {
      // small delay to let sheet close
      setTimeout(() => router.push(n.deepLink as never), 200);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, justifyContent: 'flex-end' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: C.card, borderColor: C.border }]}>
          <View style={[styles.handle, { backgroundColor: C.border }]} />

          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={[styles.sheetTitle, { color: C.text }]}>Notifications</Text>
              {unreadCount > 0 && (
                <View style={[styles.unreadBadge, { backgroundColor: C.primary }]}>
                  <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {unreadCount > 0 && (
                <Pressable onPress={() => markAllRead()}>
                  <Text style={[styles.markAllBtn, { color: C.primary }]}>Mark all read</Text>
                </Pressable>
              )}
              <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: C.surface }]}>
                <Ionicons name="close" size={18} color={C.textSecondary} />
              </Pressable>
            </View>
          </View>

          {/* Feed */}
          <ScrollView
            style={{ maxHeight: 520 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            {visible_notifs.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="notifications-off-outline" size={52} color={C.textMuted} />
                <Text style={[styles.emptyTitle, { color: C.text }]}>All caught up!</Text>
                <Text style={[styles.emptyBody, { color: C.textMuted }]}>
                  No notifications right now. We'll let you know when something happens.
                </Text>
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                {visible_notifs.map(n => (
                  <NotifRow key={n.id} n={n} onPress={() => handleRow(n)} />
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderWidth: 1, paddingTop: 12, paddingHorizontal: 20, paddingBottom: 44,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16,
  },
  sheetTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.3 },
  unreadBadge: {
    minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5,
  },
  unreadBadgeText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  markAllBtn: { fontSize: 13, fontWeight: '700', alignSelf: 'center' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },

  row: {
    flexDirection: 'row', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, alignItems: 'flex-start',
  },
  iconBox: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 14, fontWeight: '700' },
  rowBody:  { fontSize: 13, lineHeight: 18 },
  rowTime:  { fontSize: 11 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },

  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '800' },
  emptyBody:  { fontSize: 13, textAlign: 'center', maxWidth: 240, lineHeight: 19 },
});
