import type { DurationOption } from '../types';

export type RootStackParamList = {
  MainTabs: undefined;
  Session: { durationMinutes: DurationOption };
  Paywall: undefined;
};

export type MainTabParamList = {
  PracticeTab: undefined;
  HistoryTab: undefined;
};
