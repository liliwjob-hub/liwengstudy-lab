import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import { PracticeScreen } from './src/screens/PracticeScreen';
import { SessionScreen } from './src/screens/SessionScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { PaywallScreen } from './src/screens/PaywallScreen';
import { colors } from './src/constants/theme';
import type { MainTabParamList, RootStackParamList } from './src/navigation/types';
import {
  getOrCreateInstallTimestamp,
  getUserPaid,
  isTrialActive,
} from './src/storage/subscriptionStorage';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function TabIcon({ label }: { label: string }) {
  return <Text style={{ fontSize: 20 }}>{label}</Text>;
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tab.Screen
        name="PracticeTab"
        component={PracticeScreen}
        options={{
          title: '練平甩 V1 · Lian Ping Shuai',
          tabBarLabel: '練習 Practice',
          tabBarIcon: () => <TabIcon label="🧘" />,
        }}
      />
      <Tab.Screen
        name="HistoryTab"
        component={HistoryScreen}
        options={{
          title: '紀錄 History',
          tabBarLabel: '紀錄 History',
          tabBarIcon: () => <TabIcon label="📊" />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [userPaid, setUserPaidState] = useState(false);
  const [trialActive, setTrialActive] = useState(true);

  useEffect(() => {
    // Safety: never allow queued TTS to survive reloads/navigation glitches.
    Speech.stop();
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [paid, installTs] = await Promise.all([
          getUserPaid(),
          getOrCreateInstallTimestamp(),
        ]);
        if (!mounted) return;
        const trialInfo = isTrialActive(installTs);
        setUserPaidState(paid);
        setTrialActive(trialInfo.active);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const showPaywall = !loading && !userPaid && !trialActive;

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        {loading ? (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.background,
            }}
          >
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ marginTop: 12, color: colors.textMuted }}>Loading…</Text>
          </View>
        ) : (
          <Stack.Navigator initialRouteName={showPaywall ? 'Paywall' : 'MainTabs'}>
            <Stack.Screen
              name="MainTabs"
              component={MainTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Session"
              component={SessionScreen}
              options={{
                title: '練習中 In Session',
                headerStyle: { backgroundColor: colors.primaryDark },
                headerTintColor: '#fff',
                presentation: 'fullScreenModal',
              }}
            />
            <Stack.Screen
              name="Paywall"
              component={PaywallScreen}
              options={{
                headerShown: false,
                presentation: 'fullScreenModal',
              }}
            />
          </Stack.Navigator>
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
