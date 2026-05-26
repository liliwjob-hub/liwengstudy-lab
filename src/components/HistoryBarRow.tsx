import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../constants/theme';

type BarColor = 'success' | 'warning' | 'empty';

const BAR_COLORS: Record<BarColor, string> = {
  success: colors.success,
  warning: colors.warning,
  empty: colors.empty,
};

export function HistoryBarRow({
  label,
  sublabel,
  totalMinutes,
  threshold,
  barColor,
  detailLines = [],
  maxBarMinutes,
}: {
  label: string;
  sublabel?: string;
  totalMinutes: number;
  threshold: number;
  barColor: BarColor;
  detailLines?: string[];
  maxBarMinutes?: number;
}) {
  const max = maxBarMinutes ?? Math.max(threshold, totalMinutes, 1);
  const widthPct = totalMinutes > 0 ? Math.min(100, (totalMinutes / max) * 100) : 0;

  return (
    <View style={[styles.row, barColor === 'success' && styles.rowSuccess]}>
      <View style={styles.labelCol}>
        <Text style={styles.label}>{label}</Text>
        {sublabel ? <Text style={styles.sublabel}>{sublabel}</Text> : null}
      </View>
      <View style={styles.barCol}>
        <View style={styles.track}>
          <View
            style={[
              styles.fill,
              { width: `${widthPct}%`, backgroundColor: BAR_COLORS[barColor] },
            ]}
          />
        </View>
        <Text style={styles.minutes}>
          {totalMinutes} 分鐘 · {totalMinutes} min / 目標 Goal {threshold}
        </Text>
        {detailLines.map((line, i) => (
          <Text key={i} style={styles.detail}>
            {line}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  rowSuccess: {
    borderLeftWidth: 6,
    borderLeftColor: colors.success,
    paddingLeft: spacing.sm,
  },
  labelCol: { width: 100 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  sublabel: { fontSize: 11, color: colors.textMuted },
  barCol: { flex: 1 },
  track: { height: 12, backgroundColor: colors.empty, borderRadius: 6, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 6 },
  minutes: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  detail: { fontSize: 11, color: colors.primary, marginTop: 2 },
});
