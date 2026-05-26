import React, { useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { BilingualText } from './BilingualText';
import { getMusicTrack, MUSIC_TRACKS, type MusicTrackId } from '../constants/music';
import { colors, spacing } from '../constants/theme';
import {
  COUNT_SPEED_DEFAULT,
  COUNT_SPEED_MAX,
  COUNT_SPEED_MIN,
  getAudioPreferences,
  setCountSpeed,
  setMusicTrackId,
} from '../storage/audioPreferencesStorage';

export function AudioSettingsPanel() {
  const [musicTrackId, setMusicTrackIdState] = useState<MusicTrackId>('piano1');
  const [countSpeed, setCountSpeedState] = useState(COUNT_SPEED_DEFAULT);
  const [ready, setReady] = useState(false);
  const previewRef = useRef<Audio.Sound | null>(null);

  const stopPreview = async () => {
    if (!previewRef.current) return;
    try {
      await previewRef.current.stopAsync();
      await previewRef.current.unloadAsync();
    } catch {
      /* ignore */
    }
    previewRef.current = null;
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const prefs = await getAudioPreferences();
      if (!mounted) return;
      setMusicTrackIdState(prefs.musicTrackId);
      setCountSpeedState(prefs.countSpeed);
      setReady(true);
    })();
    return () => {
      mounted = false;
      void stopPreview();
    };
  }, []);

  const selectMusic = async (id: MusicTrackId) => {
    setMusicTrackIdState(id);
    await setMusicTrackId(id);
    await stopPreview();

    if (id === 'none') return;

    const track = getMusicTrack(id);
    if (!track?.source) return;

    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
      });
      const { sound } = await Audio.Sound.createAsync(track.source, {
        shouldPlay: true,
        volume: 0.4,
      });
      previewRef.current = sound;
      setTimeout(() => {
        void stopPreview();
      }, 2500);
    } catch {
      /* preview optional */
    }
  };

  const updateSpeed = (next: number) => {
    const clamped = Math.min(COUNT_SPEED_MAX, Math.max(COUNT_SPEED_MIN, next));
    setCountSpeedState(clamped);
    void setCountSpeed(clamped);
  };

  if (!ready) return null;

  return (
    <View style={styles.panel}>
      <BilingualText
        zh="背景音樂（練習全程循環）"
        en="Background music (loops for full session)"
        style={styles.sectionTitle}
        enStyle={styles.sectionTitleEn}
      />
      <View style={styles.musicRow}>
        {MUSIC_TRACKS.map((track) => {
          const selected = musicTrackId === track.id;
          return (
            <Pressable
              key={track.id}
              style={[styles.musicBtn, selected && styles.musicBtnActive]}
              onPress={() => selectMusic(track.id)}
            >
              <BilingualText
                zh={track.labelZh}
                en={track.labelEn}
                stacked
                style={selected ? styles.musicTextActive : styles.musicText}
                enStyle={selected ? styles.musicTextActiveEn : styles.musicTextEn}
              />
            </Pressable>
          );
        })}
      </View>

      <BilingualText
        zh="數 1–5 語音速度"
        en="Count 1–5 voice speed"
        style={[styles.sectionTitle, styles.sectionTitleSpaced]}
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
  sectionTitleSpaced: { marginTop: spacing.md },
  musicRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  musicBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    minWidth: '22%',
    flexGrow: 1,
    alignItems: 'center',
  },
  musicBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  musicText: { fontSize: 13, textAlign: 'center' },
  musicTextEn: { fontSize: 11, textAlign: 'center' },
  musicTextActive: { fontSize: 13, color: '#fff', textAlign: 'center' },
  musicTextActiveEn: { fontSize: 11, color: '#e8f5ef', textAlign: 'center' },
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
