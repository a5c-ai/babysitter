import React from 'react';
import { View } from 'react-native';

import { SessionListItem } from '../components/SessionListItem.js';
import { useSessions } from '../hooks/useSessions.js';

export function SessionListScreen(props: { onSelect: (sessionId: string) => void }): JSX.Element {
  const sessions = useSessions();
  return (
    <View>
      {sessions.map((session) => (
        <SessionListItem
          key={session.sessionId}
          title={session.sessionId}
          subtitle={typeof session.title === 'string' ? session.title : undefined}
          onPress={() => props.onSelect(session.sessionId)}
        />
      ))}
    </View>
  );
}
