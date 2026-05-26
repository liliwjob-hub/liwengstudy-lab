import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { BilingualText } from './BilingualText';
import type { PingShuaiCountPhase } from '../hooks/useExerciseAudio';
import {
  ARM_BACK_MS,
  ARM_FRONT_MS,
  ARM_RETURN_MS,
  colors,
  spacing,
} from '../constants/theme';

/**
 * 平甩功 motion (front view):
 * 1–4: arms straight line in front → swing straight back (count on back swing) → front again
 * 5: same arm swing back + legs bend up/down twice
 */
export function PingShuaiFigure({
  animating,
  countPhase = 1,
  speedMultiplier = 1,
}: {
  animating?: boolean;
  countPhase?: PingShuaiCountPhase;
  /** 1 = default; higher = faster arm motion (matches count voice speed). */
  speedMultiplier?: number;
}) {
  const scaleMs = (ms: number) => Math.max(80, Math.round(ms / speedMultiplier));
  const armSwing = useRef(new Animated.Value(0)).current;
  const legSquat = useRef(new Animated.Value(1)).current;
  const cycleRef = useRef<Animated.CompositeAnimation | null>(null);
  const legCycleRef = useRef<Animated.CompositeAnimation | null>(null);

  const runArmCycle = (phase: PingShuaiCountPhase) => {
    cycleRef.current?.stop();
    legCycleRef.current?.stop();

    armSwing.setValue(0);

    const toBack = Animated.timing(armSwing, {
      toValue: 1,
      duration: scaleMs(ARM_BACK_MS),
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    const toFront = Animated.timing(armSwing, {
      toValue: 0,
      duration: scaleMs(ARM_RETURN_MS),
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    });

    const armSeq = Animated.sequence([
      Animated.timing(armSwing, {
        toValue: 0,
        duration: scaleMs(ARM_FRONT_MS),
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      toBack,
      toFront,
    ]);

    if (phase === 5) {
      legSquat.setValue(1);
      const squatDown = Animated.timing(legSquat, {
        toValue: 0.72,
        duration: scaleMs(220),
        useNativeDriver: true,
      });
      const squatUp = Animated.timing(legSquat, {
        toValue: 1,
        duration: scaleMs(220),
        useNativeDriver: true,
      });
      legCycleRef.current = Animated.loop(
        Animated.sequence([squatDown, squatUp]),
        { iterations: 2 }
      );
      legCycleRef.current.start();
    }

    cycleRef.current = armSeq;
    armSeq.start();
  };

  useEffect(() => {
    if (!animating) {
      cycleRef.current?.stop();
      legCycleRef.current?.stop();
      armSwing.setValue(0);
      legSquat.setValue(1);
      return;
    }
    runArmCycle(countPhase);
  }, [animating, countPhase, speedMultiplier]);

  const armRotate = armSwing.interpolate({
    inputRange: [0, 1],
    outputRange: ['-88deg', '92deg'],
  });

  const armTranslateY = armSwing.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 8],
  });

  const legScaleY = legSquat;

  return (
    <View style={styles.container}>
      <View style={styles.stage}>
        <View style={styles.head} />
        <View style={styles.body} />

        <Animated.View
          style={[styles.legsWrap, { transform: [{ scaleY: legScaleY }] }]}
        >
          <View style={styles.legLeft} />
          <View style={styles.legRight} />
        </Animated.View>

        <Animated.View
          style={[
            styles.armsWrap,
            {
              transform: [
                { translateY: armTranslateY },
                { rotate: armRotate },
              ],
            },
          ]}
        >
          <View style={styles.armBar} />
          <View style={styles.handLeft} />
          <View style={styles.handRight} />
        </Animated.View>

        <View style={styles.shoulderMarker} />
      </View>

      <BilingualText
        zh={`第 ${countPhase} 式 · 前平後甩`}
        en={`Form ${countPhase} · Front then back swing`}
        style={styles.hintZh}
        enStyle={styles.hintEn}
      />
      {countPhase === 5 && (
        <BilingualText
          zh="五 · 雙腿彎曲兩次"
          en="Five · Bend legs twice"
          style={styles.phase5}
          enStyle={styles.phase5En}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', minHeight: 260 },
  stage: {
    width: 200,
    height: 220,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  head: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f5d0a8',
    borderWidth: 2,
    borderColor: colors.primaryDark,
    position: 'absolute',
    top: 8,
    zIndex: 5,
  },
  body: {
    width: 58,
    height: 88,
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
    position: 'absolute',
    top: 52,
    zIndex: 2,
  },
  shoulderMarker: {
    width: 64,
    height: 8,
    backgroundColor: colors.primaryDark,
    borderRadius: 4,
    position: 'absolute',
    top: 68,
    opacity: 0.35,
    zIndex: 3,
  },
  armsWrap: {
    position: 'absolute',
    top: 72,
    width: 150,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
  },
  armBar: {
    width: 140,
    height: 10,
    backgroundColor: '#e8b88a',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.primaryDark,
  },
  handLeft: {
    position: 'absolute',
    left: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#f5d0a8',
    borderWidth: 1,
    borderColor: colors.primaryDark,
  },
  handRight: {
    position: 'absolute',
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#f5d0a8',
    borderWidth: 1,
    borderColor: colors.primaryDark,
  },
  legsWrap: {
    position: 'absolute',
    top: 128,
    flexDirection: 'row',
    gap: 18,
    zIndex: 1,
  },
  legLeft: {
    width: 16,
    height: 72,
    backgroundColor: '#2d5a4a',
    borderRadius: 8,
  },
  legRight: {
    width: 16,
    height: 72,
    backgroundColor: '#2d5a4a',
    borderRadius: 8,
  },
  hintZh: { marginTop: spacing.sm, fontSize: 14, fontWeight: '600' },
  hintEn: { fontSize: 12 },
  phase5: { marginTop: 4, fontSize: 13, color: colors.accent },
  phase5En: { fontSize: 11, color: colors.accent },
});
