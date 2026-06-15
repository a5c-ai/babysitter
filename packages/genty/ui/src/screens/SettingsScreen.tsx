import React from 'react';
import { View } from 'react-native';

import { ConnectionBanner } from '../components/ConnectionBanner.js';
import { useConnection } from '../hooks/useConnection.js';

export function SettingsScreen(): JSX.Element {
  const connection = useConnection();
  return (
    <View>
      <ConnectionBanner status={connection.status} error={connection.error} />
    </View>
  );
}
