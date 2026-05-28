import AsyncStorage from '@react-native-async-storage/async-storage';
const COUNT_SPEED_KEY = '@lianpingshuai/count_speed';

export const COUNT_SPEED_MIN = 0.5;
export const COUNT_SPEED_MAX = 2;
export const COUNT_SPEED_DEFAULT = 1;

export type AudioPreferences = {
  countSpeed: number;
};

function clampCountSpeed(value: number): number {
  return Math.min(COUNT_SPEED_MAX, Math.max(COUNT_SPEED_MIN, value));
}

export async function getAudioPreferences(): Promise<AudioPreferences> {
  const speedRaw = await AsyncStorage.getItem(COUNT_SPEED_KEY);

  const parsedSpeed = speedRaw ? parseFloat(speedRaw) : COUNT_SPEED_DEFAULT;
  const countSpeed = Number.isFinite(parsedSpeed)
    ? clampCountSpeed(parsedSpeed)
    : COUNT_SPEED_DEFAULT;

  return { countSpeed };
}

export async function setCountSpeed(speed: number): Promise<void> {
  await AsyncStorage.setItem(COUNT_SPEED_KEY, String(clampCountSpeed(speed)));
}
