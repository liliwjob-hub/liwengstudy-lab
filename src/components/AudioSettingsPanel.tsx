import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { BilingualText } from './BilingualText';
import { colors, spacing } from '../constants/theme';
import {
  COUNT_SPEED_DEFAULT,
  COUNT_SPEED_MAX,
  COUNT_SPEED_MIN,
  getAudioPreferences,
  setCountSpeed,
} from '../storage/audioPreferencesStorage';

export function AudioSettingsPanel() {
  const [countSpeed, setCountSpeedState] = useState(COUNT_SPEED_DEFAULT);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const prefs = await getAudioPreferences();
      setCountSpeedState(prefs.countSpeed);
      setReady(true);
    })();
  }, []);

  const updateSpeed = (next: number) => {
    const clamped = Math.min(COUNT_SPEED_MAX, Math.max(COUNT_SPEED_MIN, next));
    setCountSpeedState(clamped);
    void setCountSpeed(clamped);
  };

  if (!ready) return null;

  return (
    <View style={styles.panel}>
      <BilingualText
        zh="數 1–5 語音速度"
        en="Count 1–5 voice speed"
        style={styles.sectionTitle}
        enStyle={styles.sectionTitleEn}
      />
      <Slider
        style={styles.slider}
        minimumValue={COUNT_SPEED_MIN}
        maximumValue={COUNT_SPEED_MAX}
        step={0.05}
        value={countSpeed}
        onValueChange={updateSpeed}
        minimumTrackTintColor={colors.primary}
        maximumTrackTintColor={colors.empty}
        thumbTintColor={colors.primaryDark}
      />
      <View style={styles.sliderLabels}>
        <Text style={styles.sliderLabel}>慢 Slow</Text>
        <Text style={styles.sliderValue}>{countSpeed.toFixed(2)}×</Text>
        <Text style={styles.sliderLabel}>快 Fast</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.primaryDark },
  sectionTitleEn: { fontSize: 12, color: colors.primary },
  slider: { width: '100%', height: 40, marginTop: spacing.sm },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    alignItems: 'center',
  },
  sliderLabel: { fontSize: 11, color: colors.textMuted },
  sliderValue: { fontSize: 12, fontWeight: '700', color: colors.primaryDark },
});
