import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BilingualText } from '../components/BilingualText';
import { PingShuaiFigure } from '../components/PingShuaiFigure';
import { SessionProgressBar } from '../components/SessionProgressBar';
import { useExerciseAudio } from '../hooks/useExerciseAudio';
import { durationLabel } from '../constants/labels';
import { addSession, formatDate, formatTime } from '../storage/historyStorage';
import { colors, spacing } from '../constants/theme';
import type { RootStackParamList } from '../navigation/types';
import {
  COUNT_SPEED_DEFAULT,
  getAudioPreferences,
} from '../storage/audioPreferencesStorage';
import { getOrCreateInstallTimestamp, getUserPaid, isTrialActive } from '../storage/subscriptionStorage';
import type { MusicTrackId } from '../constants/music';

type Props = NativeStackScreenProps<RootStackParamList, 'Session'>;

function formatMmSs(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function practicedMinutesFromElapsed(elapsedMs: number, plannedMinutes: number): number {
  if (elapsedMs <= 0) return 0;
  const minutes = Math.ceil(elapsedMs / 60000);
  return Math.min(plannedMinutes, Math.max(1, minutes));
}

export function SessionScreen({ route, navigation }: Props) {
  const { durationMinutes } = route.params;
  const totalMs = durationMinutes * 60 * 1000;
  const labels = durationLabel(durationMinutes);

  const [elapsedMs, setElapsedMs] = useState(0);
  const [running, setRunning] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [stopModalVisible, setStopModalVisible] = useState(false);
  const [frozenElapsedMs, setFrozenElapsedMs] = useState(0);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [musicTrackId, setMusicTrackId] = useState<MusicTrackId>('piano1');
  const [countSpeed, setCountSpeed] = useState(COUNT_SPEED_DEFAULT);

  const startRef = useRef(new Date());
  const elapsedMsRef = useRef(0);
  const savedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { stopAll, countPhase } = useExerciseAudio(audioReady && running, {
    musicTrackId,
    countSpeed,
  });
  elapsedMsRef.current = elapsedMs;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const saveAndFinish = useCallback(
    async (practicedMinutes: number) => {
      if (savedRef.current) return;
      savedRef.current = true;
      clearTimer();
      setRunning(false);
      setStopModalVisible(false);
      await stopAll();

      const end = new Date();
      await addSession({
        id: String(Date.now()),
        date: formatDate(startRef.current),
        startTime: formatTime(startRef.current),
        endTime: formatTime(end),
        durationMinutes: practicedMinutes,
        timestamp: startRef.current.getTime(),
      });

      navigation.navigate('MainTabs');
    },
    [clearTimer, navigation, stopAll]
  );

  const finishFullSession = useCallback(() => {
    saveAndFinish(durationMinutes);
  }, [durationMinutes, saveAndFinish]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const prefs = await getAudioPreferences();
      if (!mounted) return;
      setMusicTrackId(prefs.musicTrackId);
      setCountSpeed(prefs.countSpeed);
      setAudioReady(true);
      setRunning(true);
    })();
    return () => {
      mounted = false;
    };
  }, []);

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
        // Ignore trial info errors.
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!running) {
      clearTimer();
      return;
    }

    intervalRef.current = setInterval(() => {
      setElapsedMs((prev) => {
        const next = prev + 1000;
        if (next >= totalMs) {
          clearTimer();
          finishFullSession();
          return totalMs;
        }
        return next;
      });
    }, 1000);

    return clearTimer;
  }, [running, totalMs, finishFullSession, clearTimer]);

  const pauseForStop = () => {
    clearTimer();
    setRunning(false);
    setFrozenElapsedMs(elapsedMsRef.current);
    setStopModalVisible(true);
  };

  const handleStopPress = () => {
    pauseForStop();
  };

  const practiced = practicedMinutesFromElapsed(frozenElapsedMs, durationMinutes);
  const elapsedLabel = formatMmSs(Math.floor(frozenElapsedMs / 1000));

  const progress = (stopModalVisible ? frozenElapsedMs : elapsedMs) / totalMs;
  const displayMs = stopModalVisible ? frozenElapsedMs : elapsedMs;
  const remainingSec = Math.max(0, Math.ceil((totalMs - displayMs) / 1000));
  const elapsedSec = Math.floor(displayMs / 1000);

  return (
    <View style={styles.container}>
      <BilingualText
        zh={labels.zh}
        en={labels.en}
        style={styles.titleZh}
        enStyle={styles.titleEn}
        stacked
        containerStyle={styles.titleWrap}
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
      <BilingualText
        zh="前平伸直 → 向後甩（數 1–5）· 五彎腿兩次"
        en="Arms straight front → swing back (count 1–5) · On 5 bend legs twice"
        style={styles.subtitleZh}
        enStyle={styles.subtitleEn}
      />

      <PingShuaiFigure animating={running} countPhase={countPhase} speedMultiplier={countSpeed} />

      <SessionProgressBar
        progress={progress}
        elapsedZh={`已練 ${formatMmSs(elapsedSec)}`}
        elapsedEn={`Elapsed ${formatMmSs(elapsedSec)}`}
        remainingZh={`剩餘 ${formatMmSs(remainingSec)}`}
        remainingEn={`Left ${formatMmSs(remainingSec)}`}
      />

      <Pressable style={styles.stopBtn} onPress={handleStopPress}>
        <BilingualText zh="停止" en="Stop" style={styles.stopTextZh} enStyle={styles.stopTextEn} />
      </Pressable>

      <Modal visible={stopModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {practiced <= 0 ? (
              <>
                <BilingualText
                  zh="結束練習？"
                  en="End practice?"
                  stacked
                  containerStyle={styles.modalTitle}
                />
                <BilingualText
                  zh="尚未開始計時"
                  en="Timer has not started yet"
                  stacked
                  containerStyle={styles.modalMsg}
                />
                <View style={styles.modalRow}>
                  <Pressable
                    style={[styles.modalBtn, styles.modalBtnPrimary]}
                    onPress={() => {
                      setStopModalVisible(false);
                      setRunning(true);
                    }}
                  >
                    <BilingualText zh="繼續" en="Continue" style={styles.modalBtnText} enStyle={styles.modalBtnText} />
                  </Pressable>
                  <Pressable
                    style={[styles.modalBtn, styles.modalBtnDanger]}
                    onPress={async () => {
                      setStopModalVisible(false);
                      await stopAll();
                      navigation.goBack();
                    }}
                  >
                    <BilingualText zh="離開" en="Leave" style={styles.modalBtnText} enStyle={styles.modalBtnText} />
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <BilingualText
                  zh="停止練習？"
                  en="Stop practice?"
                  stacked
                  containerStyle={styles.modalTitle}
                />
                <Text style={styles.modalDetail}>
                  {`已練 ${elapsedLabel} · Elapsed ${elapsedLabel}`}
                </Text>
                <Text style={styles.modalDetail}>
                  {`將記錄 ${practiced} 分鐘 · Will save ${practiced} min`}
                </Text>
                <View style={styles.modalRow}>
                  <Pressable
                    style={[styles.modalBtn, styles.modalBtnPrimary]}
                    onPress={() => {
                      setStopModalVisible(false);
                      setRunning(true);
                    }}
                  >
                    <BilingualText zh="繼續" en="Continue" style={styles.modalBtnText} enStyle={styles.modalBtnText} />
                  </Pressable>
                  <Pressable
                    style={[styles.modalBtn, styles.modalBtnDanger]}
                    onPress={() => saveAndFinish(practiced)}
                  >
                    <BilingualText zh="停止並儲存" en="Stop & Save" style={styles.modalBtnText} enStyle={styles.modalBtnText} />
                  </Pressable>
                </View>
                <Pressable
                  style={styles.modalLink}
                  onPress={async () => {
                    setStopModalVisible(false);
                    await stopAll();
                    navigation.goBack();
                  }}
                >
                  <BilingualText zh="離開不儲存" en="Leave without saving" />
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  titleWrap: { alignItems: 'center', marginBottom: spacing.xs },
  titleZh: { fontSize: 22, fontWeight: '700', color: colors.primaryDark },
  titleEn: { fontSize: 16, color: colors.primary },
  subtitleZh: { fontSize: 16, textAlign: 'center', marginBottom: spacing.md },
  subtitleEn: { fontSize: 14 },
  trialWrap: { alignItems: 'center', marginTop: -spacing.sm, marginBottom: spacing.md },
  trialZh: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  trialEn: { fontSize: 11, color: colors.textMuted, fontWeight: '500' },
  stopBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.danger,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  stopTextZh: { color: '#fff', fontSize: 18 },
  stopTextEn: { color: '#ffe0e0', fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalBox: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.lg,
  },
  modalTitle: { alignItems: 'center', marginBottom: spacing.md },
  modalMsg: { alignItems: 'center', marginBottom: spacing.lg },
  modalDetail: {
    textAlign: 'center',
    color: colors.textMuted,
    marginBottom: spacing.sm,
    fontSize: 14,
  },
  modalRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  modalBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalBtnPrimary: { backgroundColor: colors.primary },
  modalBtnDanger: { backgroundColor: colors.danger },
  modalBtnText: { color: '#fff' },
  modalLink: { marginTop: spacing.md, alignItems: 'center' },
});
