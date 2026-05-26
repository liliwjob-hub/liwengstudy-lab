import React from 'react';
import { StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { colors } from '../constants/theme';

/** Shows Chinese with English beside it, e.g. "停止 · Stop" */
export function BilingualText({
  zh,
  en,
  style,
  enStyle,
  containerStyle,
  stacked = false,
}: {
  zh: string;
  en: string;
  style?: TextStyle;
  enStyle?: TextStyle;
  containerStyle?: ViewStyle;
  stacked?: boolean;
}) {
  if (stacked) {
    return (
      <View style={containerStyle}>
        <Text style={[styles.zh, style]}>{zh}</Text>
        <Text style={[styles.en, enStyle]}>{en}</Text>
      </View>
    );
  }
  return (
    <Text style={[styles.inline, style, containerStyle as TextStyle]}>
      <Text style={styles.zh}>{zh}</Text>
      <Text style={[styles.sep, enStyle]}> · </Text>
      <Text style={[styles.en, enStyle]}>{en}</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  inline: { textAlign: 'center' },
  zh: { color: colors.text, fontWeight: '600' },
  en: { color: colors.textMuted, fontWeight: '500' },
  sep: { color: colors.textMuted },
});
