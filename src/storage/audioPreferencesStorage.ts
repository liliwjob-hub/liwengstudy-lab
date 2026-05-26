import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MusicTrackId } from '../constants/music';

const MUSIC_KEY = '@lianpingshuai/music_track_id';
const COUNT_SPEED_KEY = '@lianpingshuai/count_speed';

export const COUNT_SPEED_MIN = 0.5;
export const COUNT_SPEED_MAX = 2;
export const COUNT_SPEED_DEFAULT = 1;

export type AudioPreferences = {
  musicTrackId: MusicTrackId;
  countSpeed: number;
};

function clampCountSpeed(value: number): number {
  return Math.min(COUNT_SPEED_MAX, Math.max(COUNT_SPEED_MIN, value));
}

export async function getAudioPreferences(): Promise<AudioPreferences> {
  const [musicRaw, speedRaw] = await Promise.all([
    AsyncStorage.getItem(MUSIC_KEY),
    AsyncStorage.getItem(COUNT_SPEED_KEY),
  ]);

  const musicTrackId =
    musicRaw === 'none' || musicRaw === 'piano1' || musicRaw === 'piano2' || musicRaw === 'piano3'
      ? musicRaw
      : 'piano1';

  const parsedSpeed = speedRaw ? parseFloat(speedRaw) : COUNT_SPEED_DEFAULT;
  const countSpeed = Number.isFinite(parsedSpeed)
    ? clampCountSpeed(parsedSpeed)
    : COUNT_SPEED_DEFAULT;

  return { musicTrackId, countSpeed };
}

export async function setMusicTrackId(id: MusicTrackId): Promise<void> {
  await AsyncStorage.setItem(MUSIC_KEY, id);
}

export async function setCountSpeed(speed: number): Promise<void> {
  await AsyncStorage.setItem(COUNT_SPEED_KEY, String(clampCountSpeed(speed)));
}
