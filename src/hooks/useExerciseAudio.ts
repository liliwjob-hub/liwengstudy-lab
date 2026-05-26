import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { getMusicTrack, type MusicTrackId } from '../constants/music';
import {
  ARM_BACK_MS,
  ARM_FRONT_MS,
  CHINESE_COUNTS,
  COUNT_CYCLE_MS,
} from '../constants/theme';
import { COUNT_SPEED_DEFAULT } from '../storage/audioPreferencesStorage';

export type PingShuaiCountPhase = 1 | 2 | 3 | 4 | 5;

export type ExerciseAudioOptions = {
  musicTrackId?: MusicTrackId;
  countSpeed?: number;
};

export function useExerciseAudio(active: boolean, options: ExerciseAudioOptions = {}) {
  const musicTrackId = options.musicTrackId ?? 'piano1';
  const countSpeed = options.countSpeed ?? COUNT_SPEED_DEFAULT;

  const [countPhase, setCountPhase] = useState<PingShuaiCountPhase>(1);
  const countIndexRef = useRef(0);
  const cycleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  const unloadPiano = useCallback(async () => {
    if (!soundRef.current) return;
    try {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
    } catch {
      /* ignore */
    }
    soundRef.current = null;
  }, []);

  const startLoopingMusic = useCallback(async () => {
    await unloadPiano();
    if (musicTrackId === 'none') return;

    const track = getMusicTrack(musicTrackId);
    if (!track?.source) return;

    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });

      const { sound } = await Audio.Sound.createAsync(track.source, {
        isLooping: true,
        volume: 0.4,
      });
      soundRef.current = sound;
      await sound.playAsync();
    } catch {
      /* optional */
    }
  }, [musicTrackId, unloadPiano]);

  const stopAll = useCallback(async () => {
    if (cycleTimeoutRef.current) {
      clearTimeout(cycleTimeoutRef.current);
      cycleTimeoutRef.current = null;
    }
    if (firstTimeoutRef.current) {
      clearTimeout(firstTimeoutRef.current);
      firstTimeoutRef.current = null;
    }
    Speech.stop();
    await unloadPiano();
  }, [unloadPiano]);

  useEffect(() => {
    if (!active) {
      void stopAll();
      setCountPhase(1);
      countIndexRef.current = 0;
      return;
    }

    void startLoopingMusic();

    const countCycleMs = Math.round(COUNT_CYCLE_MS / countSpeed);
    const speakAtBackSwing = Math.round(
      (ARM_FRONT_MS + Math.floor(ARM_BACK_MS * 0.12)) / countSpeed
    );
    const speechRate = Math.min(1.5, Math.max(0.4, 0.9 * countSpeed));

    countIndexRef.current = 0;
    setCountPhase(1);

    const speakCount = (index: number) => {
      const phase = ((index % 5) + 1) as PingShuaiCountPhase;
      setCountPhase(phase);
      Speech.speak(CHINESE_COUNTS[index % 5], {
        language: 'zh-CN',
        rate: speechRate,
      });
    };

    const tick = () => {
      speakCount(countIndexRef.current);
      countIndexRef.current += 1;
      cycleTimeoutRef.current = setTimeout(tick, countCycleMs);
    };

    firstTimeoutRef.current = setTimeout(tick, speakAtBackSwing);

    return () => {
      if (firstTimeoutRef.current) {
        clearTimeout(firstTimeoutRef.current);
        firstTimeoutRef.current = null;
      }
      void stopAll();
    };
  }, [active, countSpeed, musicTrackId, startLoopingMusic, stopAll]);

  return {
    stopAll,
    countPhase,
    countSpeed,
    armFrontMs: Math.round(ARM_FRONT_MS / countSpeed),
    armBackMs: Math.round(ARM_BACK_MS / countSpeed),
    countCycleMs: Math.round(COUNT_CYCLE_MS / countSpeed),
  };
}
