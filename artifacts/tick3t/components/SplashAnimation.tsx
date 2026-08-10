import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  Dimensions,
  Image,
  Text,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface SplashAnimationProps {
  onFinish: () => void;
}

const CHARS = ['T', 'i', 'c', 'k', '3', 't'];
const STAGGER = 110; // ms between each domino piece
const FALL_FROM = -200;

export default function SplashAnimation({ onFinish }: SplashAnimationProps) {
  // 7 animated pieces: icon + 6 characters
  const pieces = useRef(
    Array.from({ length: 7 }, () => ({
      y: new Animated.Value(FALL_FROM),
      opacity: new Animated.Value(0),
      rot: new Animated.Value(-20),
    }))
  ).current;

  const taglineY = useRef(new Animated.Value(18)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const poweredOpacity = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(1)).current;

  // Subtle ambient glow pulse
  const glowScale = useRef(new Animated.Value(0.85)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Glow fades in while dominoes fall
    Animated.timing(glowOpacity, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    const glowPulse = Animated.loop(
      Animated.sequence([
        Animated.timing(glowScale, { toValue: 1.15, duration: 1800, useNativeDriver: true }),
        Animated.timing(glowScale, { toValue: 0.85, duration: 1800, useNativeDriver: true }),
      ])
    );
    glowPulse.start();

    // Domino cascade — each piece falls in sequence
    const dominoAnimations = pieces.map((piece, i) =>
      Animated.sequence([
        Animated.delay(i * STAGGER),
        Animated.parallel([
          // Fall down with overshoot (spring)
          Animated.spring(piece.y, {
            toValue: 0,
            friction: 6,
            tension: 80,
            useNativeDriver: true,
          }),
          // Rotate from tilted to upright
          Animated.spring(piece.rot, {
            toValue: 0,
            friction: 6,
            tension: 80,
            useNativeDriver: true,
          }),
          // Fade in quickly as it falls
          Animated.timing(piece.opacity, {
            toValue: 1,
            duration: 180,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    const lastPieceDelay = (pieces.length - 1) * STAGGER + 380;

    Animated.sequence([
      Animated.delay(180),
      // All pieces fall in staggered
      Animated.parallel(dominoAnimations),
    ]).start();

    // After last piece lands, tagline slides up
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(taglineY, {
          toValue: 0,
          friction: 8,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(poweredOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }, 180 + lastPieceDelay);

    // Fade out everything
    const totalHold = 180 + lastPieceDelay + 500 + 1100;
    setTimeout(() => {
      glowPulse.stop();
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 520,
        useNativeDriver: true,
      }).start(() => onFinish());
    }, totalHold);
  }, []);

  return (
    <Animated.View
      style={[StyleSheet.absoluteFillObject, styles.container, { opacity: overlayOpacity }]}
      pointerEvents="none"
    >
      <LinearGradient
        colors={['#040A14', '#071120', '#040A14']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Ambient glow behind logo */}
      <Animated.View
        style={[
          styles.glowCircle,
          { opacity: glowOpacity, transform: [{ scale: glowScale }] },
        ]}
      />

      {/* Domino row: icon + letters */}
      <View style={styles.logoRow}>
        {/* Piece 0 — Ticket icon */}
        <Animated.View
          style={[
            styles.piece,
            {
              opacity: pieces[0].opacity,
              transform: [
                { translateY: pieces[0].y },
                {
                  rotate: pieces[0].rot.interpolate({
                    inputRange: [-20, 0],
                    outputRange: ['-18deg', '0deg'],
                  }),
                },
              ],
            },
          ]}
        >
          <Image
            source={require('@/assets/images/ticket-logo.png')}
            style={styles.icon}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Pieces 1–6 — Characters */}
        {CHARS.map((char, i) => {
          const piece = pieces[i + 1];
          const isItalic = char === 'i';
          return (
            <Animated.View
              key={char + i}
              style={[
                styles.piece,
                {
                  opacity: piece.opacity,
                  transform: [
                    { translateY: piece.y },
                    {
                      rotate: piece.rot.interpolate({
                        inputRange: [-20, 0],
                        outputRange: ['-18deg', '0deg'],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={[styles.char, isItalic && styles.charI]}>{char}</Text>
            </Animated.View>
          );
        })}
      </View>

      {/* Tagline slides up */}
      <Animated.Text
        style={[
          styles.tagline,
          {
            opacity: taglineOpacity,
            transform: [{ translateY: taglineY }],
          },
        ]}
      >
        Own Your Access
      </Animated.Text>

      {/* Bottom powered-by */}
      <Animated.Text style={[styles.poweredBy, { opacity: poweredOpacity }]}>
        Powered by TON · Secured by Paynow
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowCircle: {
    position: 'absolute',
    width: 340,
    height: 200,
    borderRadius: 170,
    backgroundColor: 'rgba(30, 130, 240, 0.13)',
    // soft blue glow matching the ticket icon
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
    // overflow hidden so pieces don't show above this container
    overflow: 'visible',
  },
  piece: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 62,
    height: 62,
    marginRight: 10,
  },
  char: {
    fontSize: 58,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 66,
    letterSpacing: -1.5,
  },
  charI: {
    // 'i' is narrower — tighten spacing slightly
    letterSpacing: -2,
  },
  tagline: {
    marginTop: 22,
    color: 'rgba(255,255,255,0.38)',
    fontSize: 12,
    letterSpacing: 3.5,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  poweredBy: {
    position: 'absolute',
    bottom: 52,
    color: 'rgba(255,255,255,0.18)',
    fontSize: 10,
    letterSpacing: 1.2,
  },
});
