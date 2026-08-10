import React from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
  sm: { width: 90, height: 31 },
  md: { width: 130, height: 44 },
  lg: { width: 180, height: 61 },
};

export default function Logo({ size = 'md' }: LogoProps) {
  const { isDark } = useTheme();
  const dim = SIZES[size];

  return isDark ? (
    <Image
      source={require('@/assets/images/logo.png')}
      style={[{ width: dim.width, height: dim.height }]}
      resizeMode="contain"
    />
  ) : (
    <View style={[styles.lightContainer, {
      paddingHorizontal: dim.height * 0.3,
      paddingVertical: dim.height * 0.12,
      borderRadius: dim.height * 0.25,
    }]}>
      <Image
        source={require('@/assets/images/logo.png')}
        style={[{ width: dim.width, height: dim.height }]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  lightContainer: { backgroundColor: '#0D1B2E' },
});
