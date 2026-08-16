import React, { useRef, useState, useEffect, useCallback } from 'react';
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

// ── Undo Toast ────────────────────────────────────────────────────────────────

const UNDO_DURATION_MS = 3000;

function UndoToast({
  count,
  isAllCleared,
  onUndo,
  visible: toastVisible,
}: {
  count: number;
  isAllCleared: boolean;
  onUndo: () => void;
  visible: boolean;
}) {
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: toastVisible ? 1 : 0,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  }, [toastVisible]);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [80, 0],
  });
  const opacity = slideAnim.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0, 1, 1],
  });

  const label = isAllCleared
    ? 'All notifications cleared'
    : count === 1
    ? 'Notification dismissed'
    : `${count} notifications dismissed`;

  return (
    <Animated.View
      style={[styles.toast, { opacity, transform: [{ translateY }], pointerEvents: toastVisible ? 'auto' : 'none' }]}
    >
      <Text style={styles.toastLabel}>{label}</Text>
      <Pressable onPress={onUndo} style={styles.undoBtn} hitSlop={8}>
        <Text style={styles.undoBtnText}>Undo</Text>
      </Pressable>
    </Animated.View>
  );
}

// ── Main sheet ────────────────────────────────────────────────────────────────

interface Props { visible: boolean; onClose: () => void }

export default function NotificationCenter({ visible, onClose }: Props) {
  const { colors: C } = useTheme();
  const router = useRouter();
  const {
    notifications, markAllRead, markNotifRead, dismissNotif, notifPrefs, setPendingDismissedIds,
  } = useApp();

  // ── Pending-dismissal (undo) state ────────────────────────────────────────
  const [pendingDismissals, setPendingDismissals] = useState<AppNotification[]>([]);
  const [isAllCleared, setIsAllCleared] = useState(false);
  const pendingRef = useRef<AppNotification[]>([]);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissNotifRef = useRef(dismissNotif);
  useEffect(() => { dismissNotifRef.current = dismissNotif; }, [dismissNotif]);

  // Keep context badge in sync with optimistically-hidden notifications
  useEffect(() => {
    setPendingDismissedIds(new Set(pendingDismissals.map(n => n.id)));
  }, [pendingDismissals, setPendingDismissedIds]);

  // Commit pending dismissals to context (writes AsyncStorage)
  const commitPending = useCallback(() => {
    const toCommit = pendingRef.current;
    toCommit.forEach(n => dismissNotifRef.current(n.id));
    pendingRef.current = [];
    setPendingDismissals([]);
    setIsAllCleared(false);
  }, []);

  // Schedule auto-commit
  const scheduleCommit = useCallback((pending: AppNotification[]) => {
    pendingRef.current = pending;
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(commitPending, UNDO_DURATION_MS);
  }, [commitPending]);

  // When modal closes, commit any outstanding dismissals immediately
  useEffect(() => {
    if (!visible && pendingRef.current.length > 0) {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      commitPending();
    }
  }, [visible, commitPending]);

  // Cleanup on unmount
  useEffect(() => () => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
  }, []);

  // Handle single dismiss — optimistically hide, schedule commit
  const handleDismiss = useCallback((id: string) => {
    const notif = notifications.find(n => n.id === id);
    if (!notif) return;
    const newPending = [...pendingRef.current, notif];
    setPendingDismissals(newPending);
    setIsAllCleared(false);
    scheduleCommit(newPending);
  }, [notifications, scheduleCommit]);

  // Handle clear all — queues every notification in context (matching original
  // dismissAllNotifs behaviour), not just the preference-visible subset.
  const handleClearAll = useCallback(() => {
    if (notifications.length === 0) return;
    const combined = [...notifications];
    setPendingDismissals(combined);
    setIsAllCleared(true);
    scheduleCommit(combined);
  }, [notifications, scheduleCommit]);

  // Handle undo
  const handleUndo = useCallback(() => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = null;
    pendingRef.current = [];
    setPendingDismissals([]);
    setIsAllCleared(false);
  }, []);

  // ── Derived visible list (excludes pending dismissals) ────────────────────
  const pendingIdSet = new Set(pendingDismissals.map(n => n.id));
  const visible_notifs = notifications.filter(n => {
    const pref = TYPE_TO_PREF[n.type] as keyof typeof notifPrefs;
    return notifPrefs[pref] !== false && !pendingIdSet.has(n.id);
  });

  const unreadCount = visible_notifs.filter(n => !n.read).length;
  // Also count pending unread for the badge — pending are temporarily hidden
  const showClearAll = visible_notifs.length > 0 || pendingDismissals.length > 0;

  const handleRow = (n: AppNotification) => {
    markNotifRead(n.id);
    onClose();
    if (n.deepLink) {
      setTimeout(() => router.push(n.deepLink as never), 200);
    }
  };

  const toastVisible = pendingDismissals.length > 0;

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
              {showClearAll && (
                <Pressable onPress={handleClearAll}>
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
            contentContainerStyle={{ paddingBottom: toastVisible ? 64 : 24 }}
          >
            {visible_notifs.length === 0 && !toastVisible ? (
              <View style={styles.emptyState}>
                <Ionicons name="notifications-off-outline" size={52} color={C.textMuted} />
                <Text style={[styles.emptyTitle, { color: C.text }]}>All caught up!</Text>
                <Text style={[styles.emptyBody, { color: C.textMuted }]}>
                  No notifications right now. We'll let you know when something happens.
                </Text>
              </View>
            ) : visible_notifs.length === 0 && toastVisible ? (
              // Empty placeholder while undo window is open
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle-outline" size={52} color={C.textMuted} />
                <Text style={[styles.emptyTitle, { color: C.text }]}>Notifications cleared</Text>
                <Text style={[styles.emptyBody, { color: C.textMuted }]}>
                  Tap Undo below to restore them.
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
                          onDismiss={handleDismiss}
                        />
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Undo Toast */}
          <UndoToast
            count={pendingDismissals.length}
            isAllCleared={isAllCleared}
            onUndo={handleUndo}
            visible={toastVisible}
          />
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

  // ── Toast ──────────────────────────────────────────────────────────────────
  toast: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  toastLabel: {
    color: '#FFFFFFCC',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  undoBtn: {
    marginLeft: 16,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  undoBtnText: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '800',
  },
});
