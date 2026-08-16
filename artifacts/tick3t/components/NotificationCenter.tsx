import React, { useRef } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Modal,
  KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function dateGroupLabel(iso: string): string {
  const now = new Date();
  const d = new Date(iso);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((todayStart - dStart) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return DAY_NAMES[d.getDay()];
  return 'Older';
}

interface NotifSection { title: string; data: AppNotification[] }

function groupNotifications(notifs: AppNotification[]): NotifSection[] {
  const map = new Map<string, AppNotification[]>();
  for (const n of notifs) {
    const label = dateGroupLabel(n.timestamp);
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(n);
  }
  // Sort rows within each section newest-first, then sort sections by their
  // most-recent notification timestamp, with "Older" always last.
  return [...map.entries()]
    .map(([title, data]) => ({
      title,
      data: [...data].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      ),
    }))
    .sort((a, b) => {
      if (a.title === 'Older') return 1;
      if (b.title === 'Older') return -1;
      return new Date(b.data[0].timestamp).getTime() - new Date(a.data[0].timestamp).getTime();
    });
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

function NotifRow({
  n,
  onPress,
  onDismiss,
}: {
  n: AppNotification;
  onPress: () => void;
  onDismiss: (id: string) => void;
}) {
  const { colors: C } = useTheme();
  const meta = TYPE_META[n.type];
  const swipeableRef = useRef<Swipeable>(null);

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    _dragX: Animated.AnimatedInterpolation<number>,
  ) => {
    const opacity = progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.7, 1] });
    const scale  = progress.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });
    return (
      <Animated.View style={[styles.deleteAction, { opacity }]}>
        <Pressable
          style={styles.deleteBtn}
          onPress={() => {
            swipeableRef.current?.close();
            onDismiss(n.id);
          }}
        >
          <Animated.View style={{ alignItems: 'center', gap: 4, transform: [{ scale }] }}>
            <Ionicons name="trash-outline" size={20} color="#fff" />
            <Text style={styles.deleteBtnText}>Delete</Text>
          </Animated.View>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      friction={2}
      overshootRight={false}
      renderRightActions={renderRightActions}
      containerStyle={{ borderRadius: 14, overflow: 'hidden' }}
    >
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
    </Swipeable>
  );
}

// ── Main sheet ────────────────────────────────────────────────────────────────

interface Props { visible: boolean; onClose: () => void }

export default function NotificationCenter({ visible, onClose }: Props) {
  const { colors: C } = useTheme();
  const router = useRouter();
  const {
    notifications, markAllRead, markNotifRead, dismissNotif, dismissAllNotifs, notifPrefs,
  } = useApp();

  // Filter by prefs
  const visible_notifs = notifications.filter(n => {
    const pref = TYPE_TO_PREF[n.type] as keyof typeof notifPrefs;
    return notifPrefs[pref] !== false;
  });

  const unreadCount = visible_notifs.filter(n => !n.read).length;

  const handleRow = (n: AppNotification) => {
    markNotifRead(n.id);
    onClose();
    if (n.deepLink) {
      setTimeout(() => router.push(n.deepLink as never), 200);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
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
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              {unreadCount > 0 && (
                <Pressable onPress={() => markAllRead()}>
                  <Text style={[styles.headerBtn, { color: C.primary }]}>Mark all read</Text>
                </Pressable>
              )}
              {visible_notifs.length > 0 && (
                <Pressable onPress={() => dismissAllNotifs()}>
                  <Text style={[styles.headerBtn, { color: C.textSecondary }]}>Clear all</Text>
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
              <View style={{ gap: 0 }}>
                {groupNotifications(visible_notifs).map(section => (
                  <View key={section.title}>
                    <View style={[styles.sectionHeader, { backgroundColor: C.card }]}>
                      <Text style={[styles.sectionLabel, { color: C.textMuted }]}>{section.title}</Text>
                    </View>
                    <View style={{ gap: 8 }}>
                      {section.data.map(n => (
                        <NotifRow
                          key={n.id}
                          n={n}
                          onPress={() => handleRow(n)}
                          onDismiss={dismissNotif}
                        />
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
      </GestureHandlerRootView>
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
  headerBtn: { fontSize: 13, fontWeight: '700' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },

  row: {
    flexDirection: 'row', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, alignItems: 'flex-start',
  },
  iconBox: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 14, fontWeight: '700' },
  rowBody:  { fontSize: 13, lineHeight: 18 },
  rowTime:  { fontSize: 11 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },

  deleteAction: {
    width: 80, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#EF4444', borderRadius: 14, marginLeft: 6,
  },
  deleteBtn: { flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' },
  deleteBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  sectionHeader: {
    paddingTop: 16, paddingBottom: 6,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase',
  },

  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '800' },
  emptyBody:  { fontSize: 13, textAlign: 'center', maxWidth: 240, lineHeight: 19 },
});
