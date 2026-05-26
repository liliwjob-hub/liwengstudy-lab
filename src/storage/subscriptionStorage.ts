import AsyncStorage from '@react-native-async-storage/async-storage';

const INSTALL_TS_KEY = '@lianpingshuai/install_timestamp';
const USER_PAID_KEY = '@lianpingshuai/user_paid';

export type SubscriptionState = {
  installTimestamp: number;
  userPaid: boolean;
};

const TRIAL_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function getTrialDays(): number {
  return TRIAL_DAYS;
}

export async function getOrCreateInstallTimestamp(): Promise<number> {
  const existing = await AsyncStorage.getItem(INSTALL_TS_KEY);
  if (existing) {
    const parsed = parseInt(existing, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  const now = Date.now();
  await AsyncStorage.setItem(INSTALL_TS_KEY, String(now));
  return now;
}

export async function getUserPaid(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(USER_PAID_KEY);
  return raw === 'true';
}

export async function setUserPaid(value: boolean): Promise<void> {
  await AsyncStorage.setItem(USER_PAID_KEY, value ? 'true' : 'false');
}

export function isTrialActive(installTimestamp: number, now: number = Date.now()): {
  active: boolean;
  daysLeft: number;
} {
  const elapsedMs = Math.max(0, now - installTimestamp);
  const elapsedDays = Math.floor(elapsedMs / MS_PER_DAY);
  const daysLeft = Math.max(0, TRIAL_DAYS - elapsedDays);
  return {
    active: daysLeft > 0,
    daysLeft,
  };
}

