import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BilingualText } from '../components/BilingualText';
import { colors, spacing } from '../constants/theme';
import type { RootStackParamList } from '../navigation/types';
import {
  getOrCreateInstallTimestamp,
  isTrialActive,
  setUserPaid,
} from '../storage/subscriptionStorage';

type Props = NativeStackScreenProps<RootStackParamList, 'Paywall'>;

const STRIPE_URL = 'https://buy.stripe.com/3cI8wIb6x9iP59Zh2iawo00';
const VALID_ACTIVATION_CODE = 'ABCD-1234PINGSH002';

export function PaywallScreen({ navigation }: Props) {
  const [activationCode, setActivationCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const isWide = width >= 720;

  // In case user just installed but something went wrong with root logic,
  // we still compute days from install for display.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const ts = await getOrCreateInstallTimestamp();
        const { daysLeft } = isTrialActive(ts);
        if (!mounted) return;
        if (daysLeft > 0) {
          setInfo(`Your free trial still has ${daysLeft} day(s) remaining.`);
        } else {
          setInfo(null);
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handlePurchasePress = async () => {
    setError(null);
    try {
      const supported = await Linking.canOpenURL(STRIPE_URL);
      if (!supported) {
        setError('Cannot open purchase link on this device.');
        return;
      }
      await Linking.openURL(STRIPE_URL);
    } catch {
      setError('Failed to open purchase link. Please try again.');
    }
  };

  const handleActivate = async () => {
    setError(null);
    const trimmed = activationCode.trim();
    if (!trimmed) {
      setError('Please enter your activation code.');
      return;
    }

    if (trimmed === VALID_ACTIVATION_CODE) {
      await setUserPaid(true);
      Alert.alert(
        'Activation successful!',
        'You now have full access.'
      );
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
      return;
    }

    setError('Activation code is not valid. Please check and try again.');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.box}>
        <BilingualText
          zh="解鎖完整使用權"
          en="Unlock Full Access"
          stacked
          containerStyle={styles.titleWrap}
          style={styles.titleZh}
          enStyle={styles.titleEn}
        />

        {info ? <Text style={styles.info}>{info}</Text> : null}

        <View style={[styles.twoCol, !isWide && styles.twoColStack]}>
          <View style={[styles.section, isWide && styles.sectionLeft]}>
            <Text style={styles.sectionTitle}>Unlock Full Access</Text>
            <Text style={styles.message}>
              Your 7-day free trial has ended.{'\n'}
              Please purchase to continue using the app and support us. Thank you!
            </Text>

            <Pressable style={styles.purchaseBtn} onPress={handlePurchasePress}>
              <Text style={styles.purchaseText}>Purchase</Text>
            </Pressable>
          </View>

          <View style={[styles.divider, isWide ? styles.dividerVertical : styles.dividerHorizontal]} />

          <View style={[styles.section, isWide && styles.sectionRight]}>
            <Text style={styles.sectionTitle}>Activation</Text>
            <Text style={styles.message}>
              If you have already purchased and received your activation code by email, please enter it
              below to unlock the app.
            </Text>

            <Text style={styles.inputLabel}>Activation code</Text>
            <TextInput
              style={styles.input}
              value={activationCode}
              onChangeText={(v) => {
                setActivationCode(v);
                if (error) setError(null);
              }}
              autoCapitalize="characters"
              autoCorrect={false}
              placeholder="Enter activation code"
              placeholderTextColor={colors.textMuted}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable style={styles.activateBtn} onPress={handleActivate}>
              <Text style={styles.activateText}>Activate</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  box: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  titleWrap: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  titleZh: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  titleEn: {
    fontSize: 16,
    color: colors.primary,
  },
  message: {
    fontSize: 14,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  twoCol: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  twoColStack: {
    flexDirection: 'column',
  },
  section: {
    flex: 1,
  },
  sectionLeft: {
    paddingRight: spacing.md,
  },
  sectionRight: {
    paddingLeft: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryDark,
    marginBottom: spacing.sm,
  },
  info: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  purchaseBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 10,
    alignItems: 'center',
  },
  purchaseText: {
    color: '#fff',
    fontWeight: '600',
  },
  divider: {
    backgroundColor: colors.border,
  },
  dividerVertical: {
    width: 1,
    marginHorizontal: spacing.lg,
  },
  dividerHorizontal: {
    height: 1,
    marginVertical: spacing.lg,
  },
  inputLabel: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  error: {
    marginTop: spacing.sm,
    color: colors.danger,
    fontSize: 13,
  },
  activateBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primaryDark,
    paddingVertical: spacing.md,
    borderRadius: 10,
    alignItems: 'center',
  },
  activateText: {
    color: '#fff',
    fontWeight: '600',
  },
});

