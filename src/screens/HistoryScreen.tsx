import React, { useCallback, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { BilingualText } from '../components/BilingualText';
import { HistoryBarRow } from '../components/HistoryBarRow';
import { colors, spacing, MAX_RETENTION_YEARS, YEAR_GOAL_DAY_MULTIPLIER } from '../constants/theme';
import {
  getAllSessions,
  getDailyThreshold,
  getWeeklyThreshold,
  getYearlyThreshold,
  setDailyThreshold,
} from '../storage/historyStorage';
import { fillRecentDays, getBarColor, groupByWeek, groupByYear } from '../utils/historyAggregates';
import type { HistoryViewMode, PracticeSession } from '../types';
import { getOrCreateInstallTimestamp, getUserPaid, isTrialActive } from '../storage/subscriptionStorage';

const DAY_DISPLAY_COUNT = 30;

const VIEW_MODES: { mode: HistoryViewMode; zh: string; en: string }[] = [
  { mode: 'day', zh: '按日', en: 'Day' },
  { mode: 'week', zh: '按週', en: 'Week' },
  { mode: 'year', zh: '按年', en: 'Year' },
];

export function HistoryScreen() {
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [threshold, setThreshold] = useState(60);
  const [thresholdInput, setThresholdInput] = useState('60');
  const [viewMode, setViewMode] = useState<HistoryViewMode>('day');
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);

  const load = useCallback(async () => {
    const [s, t] = await Promise.all([getAllSessions(), getDailyThreshold()]);
    setSessions(s);
    setThreshold(t);
    setThresholdInput(String(t));

    try {
      const paid = await getUserPaid();
      if (paid) {
        setTrialDaysLeft(null);
        return;
      }
      const ts = await getOrCreateInstallTimestamp();
      const trialInfo = isTrialActive(ts);
      setTrialDaysLeft(trialInfo.active ? trialInfo.daysLeft : null);
    } catch {
      // Ignore trial info errors.
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const weekThreshold = getWeeklyThreshold(threshold);
  const yearThreshold = getYearlyThreshold(threshold);

  const saveThreshold = async () => {
    const v = parseInt(thresholdInput, 10);
    if (!Number.isFinite(v) || v < 1) return;
    await setDailyThreshold(v);
    setThreshold(v);
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <BilingualText
        zh="練習紀錄"
        en="Practice History"
        stacked
        containerStyle={styles.titleWrap}
        style={styles.titleZh}
        enStyle={styles.titleEn}
      />
      {trialDaysLeft !== null ? (
        <BilingualText
          zh={`剩餘試用 ${trialDaysLeft} 天`}
          en={`Trial remaining: ${trialDaysLeft} day(s)`}
          stacked
          containerStyle={styles.trialWrap}
          style={styles.trialZh}
          enStyle={styles.trialEn}
        />
      ) : null}

      <View style={styles.thresholdBox}>
        <BilingualText zh="每日目標 (分鐘)" en="Daily goal (minutes)" style={styles.thresholdLabel} />
        <View style={styles.thresholdRow}>
          <TextInput
            style={styles.input}
            value={thresholdInput}
            onChangeText={setThresholdInput}
            keyboardType="number-pad"
          />
          <Pressable style={styles.saveBtn} onPress={saveThreshold}>
            <BilingualText zh="儲存" en="Save" style={styles.saveBtnText} enStyle={styles.saveBtnText} />
          </Pressable>
        </View>
        <Text style={styles.hint}>
          {`週 Week = ${threshold}×7 = ${weekThreshold} · 年 Year = ${threshold}×7×${YEAR_GOAL_DAY_MULTIPLIER} = ${yearThreshold}`}
        </Text>
      </View>

      <View style={styles.modeRow}>
        {VIEW_MODES.map(({ mode, zh, en }) => (
          <Pressable
            key={mode}
            style={[styles.modeBtn, viewMode === mode && styles.modeBtnActive]}
            onPress={() => setViewMode(mode)}
          >
            <BilingualText
              zh={zh}
              en={en}
              style={viewMode === mode ? styles.modeTextActive : styles.modeText}
              enStyle={viewMode === mode ? styles.modeTextActiveEn : styles.modeTextEn}
            />
          </Pressable>
        ))}
      </View>

      <BilingualText
        zh="綠=達標 · 黃=未達標 · 灰=0分"
        en="Green=met · Yellow=below · Gray=zero"
        style={styles.legend}
      />

      {viewMode === 'day' &&
        fillRecentDays(sessions, DAY_DISPLAY_COUNT).map((day) => {
          const [y, m, d] = day.date.split('-');
          return (
            <HistoryBarRow
              key={day.date}
              label={`${m}/${d}`}
              sublabel={y}
              totalMinutes={day.totalMinutes}
              threshold={threshold}
              barColor={getBarColor(day.totalMinutes, threshold)}
              detailLines={day.sessions.map(
                (s) =>
                  `${s.startTime}–${s.endTime} · ${s.durationMinutes}分 / ${s.durationMinutes} min`
              )}
            />
          );
        })}

      {viewMode === 'week' &&
        groupByWeek(sessions)
          .slice(0, 52)
          .map((week) => (
            <HistoryBarRow
              key={week.weekKey}
              label="週 Week"
              sublabel={week.weekLabel}
              totalMinutes={week.totalMinutes}
              threshold={weekThreshold}
              barColor={getBarColor(week.totalMinutes, weekThreshold)}
              maxBarMinutes={weekThreshold}
              detailLines={week.days
                .filter((d) => d.totalMinutes > 0)
                .map((d) => `${d.date.slice(5)}: ${d.totalMinutes}分 / ${d.totalMinutes} min`)}
            />
          ))}

      {viewMode === 'year' &&
        (() => {
          const years = groupByYear(sessions);
          const currentYear = new Date().getFullYear();
          const rows = [];
          for (let y = currentYear; y >= currentYear - MAX_RETENTION_YEARS + 1; y--) {
            const total = years.find((yr) => yr.year === y)?.totalMinutes ?? 0;
            rows.push(
              <HistoryBarRow
                key={y}
                label={String(y)}
                totalMinutes={total}
                threshold={yearThreshold}
                barColor={getBarColor(total, yearThreshold)}
                maxBarMinutes={yearThreshold}
              />
            );
          }
          return rows;
        })()}

      <BilingualText
        zh={`資料保留最多 ${MAX_RETENTION_YEARS} 年`}
        en={`Data kept up to ${MAX_RETENTION_YEARS} years`}
        style={styles.footer}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 48 },
  titleWrap: { marginBottom: spacing.md, alignItems: 'center' },
  titleZh: { fontSize: 22, fontWeight: '700', color: colors.primaryDark },
  titleEn: { fontSize: 16, color: colors.primary },
  trialWrap: { alignItems: 'center', marginTop: -spacing.sm, marginBottom: spacing.md },
  trialZh: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  trialEn: { fontSize: 11, color: colors.textMuted, fontWeight: '500' },
  thresholdBox: {
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  thresholdLabel: { marginBottom: spacing.sm },
  thresholdRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: 18,
    backgroundColor: '#fff',
  },
  saveBtn: { backgroundColor: colors.primary, padding: spacing.sm, borderRadius: 8 },
  saveBtnText: { color: '#fff' },
  hint: { fontSize: 11, color: colors.textMuted, marginTop: spacing.sm },
  modeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  modeBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  modeBtnActive: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  modeText: { fontSize: 13 },
  modeTextEn: { fontSize: 11, color: colors.textMuted },
  modeTextActive: { color: '#fff' },
  modeTextActiveEn: { color: '#e8f5ef', fontSize: 11 },
  legend: { fontSize: 11, marginBottom: spacing.md, textAlign: 'center' },
  footer: { fontSize: 11, textAlign: 'center', marginTop: spacing.lg },
});
