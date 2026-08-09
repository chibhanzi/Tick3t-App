import React from 'react';
import { Tabs } from 'expo-router';
import { Platform, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors } from '@/constants/colors';

function TabIcon({ focused, emoji, label }: { focused: boolean; emoji: string; label: string }) {
  const C = Colors.dark;
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 2 }}>
      <View style={{ fontSize: 22 }}>
        {/* emoji placeholder handled by title */}
      </View>
    </View>
  );
}

export default function TabLayout() {
  const C = Colors.dark;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.tabIconDefault,
        tabBarStyle: {
          backgroundColor: C.card,
          borderTopColor: C.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.3,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color }) => (
            <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: color, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
              </View>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{
          title: 'Marketplace',
          tabBarIcon: ({ color, size }) => (
            <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: 18, height: 14, borderRadius: 3, borderWidth: 2, borderColor: color }} />
              <View style={{ position: 'absolute', bottom: 0, right: 4, width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="vault"
        options={{
          title: 'Vault',
          tabBarIcon: ({ color }) => (
            <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: 16, height: 14, borderRadius: 3, borderWidth: 2, borderColor: color, marginTop: 3 }} />
              <View style={{ width: 10, height: 6, borderRadius: 3, borderWidth: 2, borderColor: color, marginBottom: 2 }} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: color, marginBottom: 2 }} />
              <View style={{ width: 20, height: 8, borderRadius: 6, borderWidth: 2, borderColor: color }} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
