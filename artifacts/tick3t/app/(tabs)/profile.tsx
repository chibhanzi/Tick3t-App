import React, { useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { isEventUpcoming } from '@/utils/format';

function MenuItem({
  icon,
  label,
  sublabel,
  color,
  onPress,
}: {
  icon: string;
  label: string;
  sublabel?: string;
  color?: string;
  onPress?: () => void;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.menuItem, { borderBottomColor: colors.border }]}
    >
      <View style={[styles.menuIcon, { backgroundColor: (color ?? colors.primary) + '18' }]}>
        <Ionicons name={icon as any} size={18} color={color ?? colors.primary} />
      </View>
      <View style={styles.menuLabel}>
        <Text style={[styles.menuText, { color: colors.foreground }]}>{label}</Text>
        {sublabel ? <Text style={[styles.menuSub, { color: colors.mutedForeground }]}>{sublabel}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, purchasedTickets, updateUser } = useApp();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editEmail, setEditEmail] = useState(user.email);

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const upcoming = purchasedTickets.filter((t) => isEventUpcoming(t.event.date) && t.status !== 'used').length;
  const attended = purchasedTickets.filter((t) => !isEventUpcoming(t.event.date) || t.status === 'used').length;

  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleSave = async () => {
    if (!editName.trim()) return;
    await updateUser({ ...user, name: editName.trim(), email: editEmail.trim() });
    setEditing(false);
  };

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 8 }]}>
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>Profile</Text>
        <TouchableOpacity onPress={() => setEditing(!editing)}>
          <Ionicons name={editing ? 'close-outline' : 'create-outline'} size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={[styles.initials, { color: colors.primaryForeground }]}>{initials}</Text>
        </View>
        {editing ? (
          <View style={styles.editFields}>
            <TextInput
              style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
              value={editName}
              onChangeText={setEditName}
              placeholder="Your name"
              placeholderTextColor={colors.mutedForeground}
            />
            <TextInput
              style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
              value={editEmail}
              onChangeText={setEditEmail}
              placeholder="Your email"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={[styles.userName, { color: colors.foreground }]}>{user.name}</Text>
            <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>{user.email}</Text>
          </>
        )}
      </View>

      {/* Stats */}
      <View style={[styles.statsRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: colors.primary }]}>{upcoming}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Upcoming</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: colors.foreground }]}>{attended}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Attended</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: colors.foreground }]}>{purchasedTickets.length}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>All Keys</Text>
        </View>
      </View>

      {/* Menu sections */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <MenuItem icon="ticket-outline" label="My Orders" sublabel="View all purchases" />
        <MenuItem icon="heart-outline" label="Saved Events" sublabel="Events you liked" />
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 16 }]}>
        <MenuItem icon="notifications-outline" label="Notifications" />
        <MenuItem icon="shield-outline" label="Privacy & Security" />
        <MenuItem icon="help-circle-outline" label="Help & Support" />
        <MenuItem icon="information-circle-outline" label="About tick3t" sublabel="v1.0.0" />
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 16 }]}>
        <MenuItem
          icon="log-out-outline"
          label="Sign Out"
          color="#EF4444"
          onPress={() =>
            Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Sign Out', style: 'destructive' },
            ])
          }
        />
      </View>
    </ScrollView>
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
    paddingBottom: 8,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  initials: {
    fontSize: 28,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
  },
  userEmail: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
  },
  editFields: {
    width: '100%',
    gap: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  saveBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 26,
    fontWeight: '700' as const,
    fontFamily: 'Inter_700Bold',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    marginVertical: 4,
  },
  section: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
  },
  menuText: {
    fontSize: 15,
    fontWeight: '500' as const,
    fontFamily: 'Inter_500Medium',
  },
  menuSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
  },
});
