import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { BilingualText } from './BilingualText';
import { colors, spacing } from '../constants/theme';

export function DurationButton({
  zh,
  en,
  onPress,
}: {
  zh: string;
  en: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
      onPress={onPress}
    >
      <BilingualText zh={zh} en={en} style={styles.labelZh} enStyle={styles.labelEn} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    marginVertical: spacing.sm,
    alignItems: 'center',
  },
  pressed: { backgroundColor: colors.primaryLight },
  labelZh: { fontSize: 18 },
  labelEn: { fontSize: 15 },
});
