import type { DurationOption } from '../types';

export const DURATION_OPTIONS: {
  minutes: DurationOption;
  zh: string;
  en: string;
}[] = [
  { minutes: 60, zh: '平甩功 60分鐘', en: '60 minutes' },
  { minutes: 30, zh: '平甩功 30分鐘', en: '30 minutes' },
  { minutes: 20, zh: '平甩功 20分鐘', en: '20 minutes' },
  { minutes: 10, zh: '平甩功 10分鐘', en: '10 minutes' },
];

export function durationLabel(minutes: number): { zh: string; en: string } {
  const opt = DURATION_OPTIONS.find((o) => o.minutes === minutes);
  return opt
    ? { zh: opt.zh, en: opt.en }
    : { zh: `平甩功 ${minutes}分鐘`, en: `${minutes} minutes` };
}
