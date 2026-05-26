/**
 * History on device via AsyncStorage (not a file in this folder).
 * @lianpingshuai/sessions — practice JSON array
 * @lianpingshuai/daily_threshold_minutes — daily goal (default 60)
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MAX_RETENTION_YEARS, YEAR_GOAL_DAY_MULTIPLIER } from '../constants/theme';
import type { PracticeSession } from '../types';

const SESSIONS_KEY = '@lianpingshuai/sessions';
const THRESHOLD_KEY = '@lianpingshuai/daily_threshold_minutes';

export async function getDailyThreshold(): Promise<number> {
  const raw = await AsyncStorage.getItem(THRESHOLD_KEY);
  const value = raw ? parseInt(raw, 10) : 60;
  return Number.isFinite(value) && value > 0 ? value : 60;
}

export async function setDailyThreshold(minutes: number): Promise<void> {
  await AsyncStorage.setItem(THRESHOLD_KEY, String(Math.max(1, Math.round(minutes))));
}

export function getWeeklyThreshold(dailyMinutes: number): number {
  return dailyMinutes * 7;
}

export function getYearlyThreshold(dailyMinutes: number): number {
  return dailyMinutes * 7 * YEAR_GOAL_DAY_MULTIPLIER;
}

export async function getAllSessions(): Promise<PracticeSession[]> {
  const raw = await AsyncStorage.getItem(SESSIONS_KEY);
  if (!raw) return [];
  try {
    return pruneOldSessions(JSON.parse(raw) as PracticeSession[]);
  } catch {
    return [];
  }
}

export async function addSession(session: PracticeSession): Promise<void> {
  const sessions = await getAllSessions();
  sessions.push(session);
  await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(pruneOldSessions(sessions)));
}

function pruneOldSessions(sessions: PracticeSession[]): PracticeSession[] {
  const cutoffYear = new Date().getFullYear() - MAX_RETENTION_YEARS;
  return sessions
    .filter((s) => parseInt(s.date.slice(0, 4), 10) >= cutoffYear)
    .sort((a, b) => b.timestamp - a.timestamp);
}

export function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatTime(d: Date): string {
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function getWeekKey(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return formatDate(monday);
}

export function getWeekLabel(weekKey: string): string {
  const start = new Date(weekKey + 'T12:00:00');
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = (dt: Date) => `${dt.getMonth() + 1}/${dt.getDate()}`;
  return `${fmt(start)} – ${fmt(end)}`;
}
