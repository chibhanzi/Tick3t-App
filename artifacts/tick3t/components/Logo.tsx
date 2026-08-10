import React from 'react';
import { Image, View, Text, StyleSheet } from 'react-native';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  /** Force white text regardless of theme (for use over dark hero images) */
  light?: boolean;
}

const SIZES = {
  sm: { icon: 22, font: 15 },
  md: { icon: 28, font: 19 },
  lg: { icon: 38, font: 26 },
};

export default function Logo({ size = 'md', light = false }: LogoProps) {
  const dim = SIZES[size];
  const textColor = light ? '#fff' : '#fff';

  return (
    <View style={styles.row}>
      <Image
        source={require('@/assets/images/ticket-logo.png')}
        style={{ width: dim.icon, height: dim.icon }}
        resizeMode="contain"
      />
      <Text style={[styles.text, { fontSize: dim.font, color: textColor }]}>
        Tick3t
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  text: { fontWeight: '900', letterSpacing: -0.5 },
});
