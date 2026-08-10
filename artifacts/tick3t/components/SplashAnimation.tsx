import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions, Image, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface SplashAnimationProps {
  onFinish: () => void;
}

export default function SplashAnimation({ onFinish }: SplashAnimationProps) {
  const logoScale = useRef(new Animated.Value(0.55)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const dotsOpacity = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  const ringScale1 = useRef(new Animated.Value(0.4)).current;
  const ringScale2 = useRef(new Animated.Value(0.4)).current;
  const ringOpacity1 = useRef(new Animated.Value(0.6)).current;
  const ringOpacity2 = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    // Pulse rings
    const pulseRings = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(ringScale1, { toValue: 1.8, duration: 1800, useNativeDriver: true }),
          Animated.timing(ringScale1, { toValue: 0.4, duration: 0, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(ringOpacity1, { toValue: 0, duration: 1800, useNativeDriver: true }),
          Animated.timing(ringOpacity1, { toValue: 0.6, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    const pulseRings2 = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.delay(600),
          Animated.timing(ringScale2, { toValue: 1.8, duration: 1800, useNativeDriver: true }),
          Animated.timing(ringScale2, { toValue: 0.4, duration: 0, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.delay(600),
          Animated.timing(ringOpacity2, { toValue: 0, duration: 1800, useNativeDriver: true }),
          Animated.timing(ringOpacity2, { toValue: 0.4, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );

    pulseRings.start();
    pulseRings2.start();

    // Main sequence
    Animated.sequence([
      Animated.delay(100),
      // Logo appears
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      Animated.delay(200),
      // Tagline fades in
      Animated.timing(taglineOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.delay(150),
      // Loading dots
      Animated.timing(dotsOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      // Hold
      Animated.delay(900),
      // Fade out everything
      Animated.timing(overlayOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start(() => {
      pulseRings.stop();
      pulseRings2.stop();
      onFinish();
    });
  }, []);

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, styles.container, { opacity: overlayOpacity }]} pointerEvents="none">
      <LinearGradient
        colors={['#050C18', '#0A1628', '#050C18']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Radial glow behind logo */}
      <View style={styles.glowWrap}>
        <View style={styles.glow} />
        {/* Pulse rings */}
        <Animated.View style={[styles.ring, { transform: [{ scale: ringScale1 }], opacity: ringOpacity1 }]} />
        <Animated.View style={[styles.ring, { transform: [{ scale: ringScale2 }], opacity: ringOpacity2 }]} />
      </View>

      {/* Logo */}
      <Animated.View style={[styles.logoWrap, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        <Image
          source={require('@/assets/images/ticket-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.brandName}>Tick3t</Text>
      </Animated.View>

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        Own Your Access
      </Animated.Text>

      {/* Loading dots */}
      <Animated.View style={[styles.dotsRow, { opacity: dotsOpacity }]}>
        {[0, 1, 2].map(i => (
          <View key={i} style={styles.dot} />
        ))}
      </Animated.View>

      {/* Bottom branding */}
      <Animated.Text style={[styles.poweredBy, { opacity: taglineOpacity }]}>
        Powered by TON · Secured by Paynow
      </Animated.Text>
    </Animated.View>
  );
}

const LOGO_SIZE = 200;
const RING_SIZE = 140;

const styles = StyleSheet.create({
  container: {
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowWrap: {
    position: 'absolute',
    width: RING_SIZE * 2,
    height: RING_SIZE * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    backgroundColor: 'rgba(34,197,94,0.12)',
  },
  ring: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 1.5,
    borderColor: 'rgba(34,197,94,0.5)',
  },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  brandName: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
    marginTop: 16,
    textAlign: 'center',
  },
  tagline: {
    marginTop: 16,
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 40,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#22c55e',
    opacity: 0.7,
  },
  poweredBy: {
    position: 'absolute',
    bottom: 48,
    color: 'rgba(255,255,255,0.2)',
    fontSize: 10,
    letterSpacing: 1,
  },
});
