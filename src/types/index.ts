export type DurationOption = 10 | 20 | 30 | 60;

export interface PracticeSession {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  timestamp: number;
}

export type HistoryViewMode = 'day' | 'week' | 'year';

export interface DaySummary {
  date: string;
  totalMinutes: number;
  sessions: PracticeSession[];
}

export interface WeekSummary {
  weekKey: string;
  weekLabel: string;
  totalMinutes: number;
  days: DaySummary[];
}

export interface YearSummary {
  year: number;
  totalMinutes: number;
}
