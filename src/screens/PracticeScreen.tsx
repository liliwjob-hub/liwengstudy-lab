import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BilingualText } from '../components/BilingualText';
import { PingShuaiFigure } from '../components/PingShuaiFigure';
import { AudioSettingsPanel } from '../components/AudioSettingsPanel';
import { DurationButton } from '../components/DurationButton';
import { DURATION_OPTIONS } from '../constants/labels';
import { colors, spacing } from '../constants/theme';
import type { RootStackParamList } from '../navigation/types';
import { getOrCreateInstallTimestamp, getUserPaid, isTrialActive } from '../storage/subscriptionStorage';

export function PracticeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const paid = await getUserPaid();
        if (paid) {
          if (mounted) setTrialDaysLeft(null);
          return;
        }
        const ts = await getOrCreateInstallTimestamp();
        const trialInfo = isTrialActive(ts);
        if (mounted) setTrialDaysLeft(trialInfo.active ? trialInfo.daysLeft : null);
      } catch {
        // If anything goes wrong, just don't show the trial info.
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled
    >
      <BilingualText
        zh="練習平甩"
        en="Practice Ping Shuai"
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
      <View style={styles.figureBox}>
        <PingShuaiFigure animating={false} countPhase={1} />
      </View>
      <AudioSettingsPanel />
      <BilingualText
        zh="選擇練習時長"
        en="Choose duration"
        style={styles.pickLabel}
        containerStyle={styles.pickWrap}
      />
      {DURATION_OPTIONS.map((opt) => (
        <DurationButton
          key={opt.minutes}
          zh={opt.zh}
          en={opt.en}
          onPress={() => navigation.navigate('Session', { durationMinutes: opt.minutes })}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 48 },
  titleWrap: { alignItems: 'center', marginBottom: spacing.lg },
  titleZh: { fontSize: 28, fontWeight: '800', color: colors.primaryDark },
  titleEn: { fontSize: 18, color: colors.primary },
  trialWrap: { alignItems: 'center', marginTop: -spacing.sm, marginBottom: spacing.md },
  trialZh: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  trialEn: { fontSize: 11, color: colors.textMuted, fontWeight: '500' },
  figureBox: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pickWrap: { marginBottom: spacing.sm },
  pickLabel: { fontSize: 15, textAlign: 'center' },
});
