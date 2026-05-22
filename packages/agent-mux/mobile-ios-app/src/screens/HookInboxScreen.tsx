import React, { useMemo } from 'react';
import { PanResponder, Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { Card, Text, useGateway, useHookRequests } from '@a5c-ai/agent-mux-ui';

type Decision = 'allow' | 'deny';

function SwipeDecisionCard(props: {
  runId: string;
  hookRequestId: string;
  toolName: string;
  summary: string;
  secondsRemaining: number;
  onOpen(): void;
  onDecision(decision: Decision): Promise<void>;
}): JSX.Element {
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 18,
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx > 80) {
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            void props.onDecision('allow');
          } else if (gesture.dx < -80) {
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            void props.onDecision('deny');
          }
        },
      }),
    [props],
  );

  return (
    <Pressable onPress={props.onOpen}>
      <Card>
        <View {...panResponder.panHandlers}>
          <Text style={styles.title}>{props.toolName}</Text>
          <Text>{props.summary}</Text>
          <Text>Run {props.runId}</Text>
          <Text>{props.secondsRemaining}s remaining. Swipe right to allow, left to deny.</Text>
        </View>
      </Card>
    </Pressable>
  );
}

export function HookInboxScreen(props: { onOpenRun(runId: string): void }): JSX.Element {
  const { client } = useGateway();
  const hooks = useHookRequests();

  return (
    <View style={styles.list}>
      {hooks.map((hook) => (
        <SwipeDecisionCard
          key={hook.hookRequestId}
          runId={hook.runId}
          hookRequestId={hook.hookRequestId}
          toolName={String(hook.payload.toolName ?? hook.hookKind)}
          summary={String(hook.payload.summary ?? hook.payload.command ?? 'Pending hook approval')}
          secondsRemaining={Math.max(0, Math.floor((hook.deadlineTs - Date.now()) / 1000))}
          onOpen={() => props.onOpenRun(hook.runId)}
          onDecision={async (decision) => {
            await client.request({
              type: 'hook.decision',
              hookRequestId: hook.hookRequestId,
              decision,
            });
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    marginBottom: 6,
  },
});
