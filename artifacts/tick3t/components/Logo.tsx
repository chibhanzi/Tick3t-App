import React from 'react';
import { Image, View, StyleSheet, useColorScheme } from 'react-native';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
  sm: { width: 90, height: 31 },
  md: { width: 130, height: 44 },
  lg: { width: 180, height: 61 },
};

// The logo has white text + blue icon on a transparent background.
// On dark backgrounds it renders naturally; on light backgrounds we
// wrap it in a dark pill so the white text remains legible.
export default function Logo({ size = 'md' }: LogoProps) {
  const scheme = useColorScheme();
  const isDark = scheme !== 'light';
  const dim = SIZES[size];

  return isDark ? (
    <Image
      source={require('@/assets/images/logo.png')}
      style={[styles.logo, { width: dim.width, height: dim.height }]}
      resizeMode="contain"
    />
  ) : (
    <View style={[styles.lightContainer, { paddingHorizontal: dim.height * 0.3, paddingVertical: dim.height * 0.12, borderRadius: dim.height * 0.25 }]}>
      <Image
        source={require('@/assets/images/logo.png')}
        style={[styles.logo, { width: dim.width, height: dim.height }]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  logo: {},
  lightContainer: {
    backgroundColor: '#0D1B2E',
  },
});
