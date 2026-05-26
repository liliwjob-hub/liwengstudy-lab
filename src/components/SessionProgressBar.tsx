import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../constants/theme';

export function SessionProgressBar({
  progress,
  elapsedZh,
  elapsedEn,
  remainingZh,
  remainingEn,
}: {
  progress: number;
  elapsedZh: string;
  elapsedEn: string;
  remainingZh: string;
  remainingEn: string;
}) {
  const pct = Math.min(100, Math.max(0, progress * 100));
  return (
    <View style={styles.wrap}>
      <View style={styles.labels}>
        <View>
          <Text style={styles.label}>{elapsedZh}</Text>
          <Text style={styles.labelEn}>{elapsedEn}</Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.label}>{remainingZh}</Text>
          <Text style={styles.labelEn}>{remainingEn}</Text>
        </View>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.percent}>
        進度 {Math.round(pct)}% · Progress {Math.round(pct)}%
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', paddingHorizontal: spacing.md },
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  right: { alignItems: 'flex-end' },
  label: { fontSize: 13, color: colors.text, fontWeight: '600' },
  labelEn: { fontSize: 11, color: colors.textMuted },
  track: { height: 14, backgroundColor: colors.border, borderRadius: 7, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.accent, borderRadius: 7 },
  percent: { textAlign: 'center', marginTop: spacing.xs, fontWeight: '700', color: colors.primary },
});
