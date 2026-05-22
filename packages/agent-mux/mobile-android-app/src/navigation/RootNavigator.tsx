import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Text } from '@a5c-ai/agent-mux-ui';

import { HomeScreen } from '../screens/HomeScreen.js';
import { OnboardingScreen } from '../screens/OnboardingScreen.js';
import { ScanQRScreen } from '../screens/ScanQRScreen.js';
import { useTokenStore } from '../providers/TokenStoreProvider.js';

type Route = 'onboarding' | 'scan' | 'home';

export function RootNavigator(): JSX.Element {
  const { auth, hydrated, login } = useTokenStore();
  const [route, setRoute] = useState<Route>(auth ? 'home' : 'onboarding');

  if (!hydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
        <Text>Unlocking gateway credentials...</Text>
      </View>
    );
  }

  if (auth || route === 'home') {
    return <HomeScreen />;
  }

  if (route === 'scan') {
    return (
      <ScanQRScreen
        onBack={() => setRoute('onboarding')}
        onSuccess={async (nextAuth) => {
          await login(nextAuth);
          setRoute('home');
        }}
      />
    );
  }

  return <OnboardingScreen onScanPress={() => setRoute('scan')} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    gap: 12,
    justifyContent: 'center',
  },
});
