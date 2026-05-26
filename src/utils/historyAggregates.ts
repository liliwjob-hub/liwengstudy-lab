import type { DaySummary, PracticeSession, WeekSummary, YearSummary } from '../types';
import { formatDate, getWeekKey, getWeekLabel } from '../storage/historyStorage';

export function groupByDay(sessions: PracticeSession[]): DaySummary[] {
  const map = new Map<string, PracticeSession[]>();
  for (const s of sessions) {
    const list = map.get(s.date) ?? [];
    list.push(s);
    map.set(s.date, list);
  }
  return Array.from(map.entries())
    .map(([date, daySessions]) => ({
      date,
      totalMinutes: daySessions.reduce((sum, x) => sum + x.durationMinutes, 0),
      sessions: daySessions.sort((a, b) => a.timestamp - b.timestamp),
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function groupByWeek(sessions: PracticeSession[]): WeekSummary[] {
  const dayMap = groupByDay(sessions);
  const weekMap = new Map<string, DaySummary[]>();
  for (const day of dayMap) {
    const key = getWeekKey(day.date);
    const list = weekMap.get(key) ?? [];
    list.push(day);
    weekMap.set(key, list);
  }
  return Array.from(weekMap.entries())
    .map(([weekKey, days]) => ({
      weekKey,
      weekLabel: getWeekLabel(weekKey),
      totalMinutes: days.reduce((sum, d) => sum + d.totalMinutes, 0),
      days: days.sort((a, b) => a.date.localeCompare(b.date)),
    }))
    .sort((a, b) => b.weekKey.localeCompare(a.weekKey));
}

export function groupByYear(sessions: PracticeSession[]): YearSummary[] {
  const map = new Map<number, number>();
  for (const s of sessions) {
    const year = parseInt(s.date.slice(0, 4), 10);
    map.set(year, (map.get(year) ?? 0) + s.durationMinutes);
  }
  return Array.from(map.entries())
    .map(([year, totalMinutes]) => ({ year, totalMinutes }))
    .sort((a, b) => b.year - a.year);
}

export function getBarColor(
  totalMinutes: number,
  threshold: number
): 'success' | 'warning' | 'empty' {
  if (totalMinutes <= 0) return 'empty';
  if (totalMinutes >= threshold) return 'success';
  return 'warning';
}

export function fillRecentDays(sessions: PracticeSession[], count: number): DaySummary[] {
  const lookup = new Map(groupByDay(sessions).map((d) => [d.date, d]));
  const result: DaySummary[] = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const date = formatDate(d);
    result.push(
      lookup.get(date) ?? { date, totalMinutes: 0, sessions: [] }
    );
  }
  return result;
}
