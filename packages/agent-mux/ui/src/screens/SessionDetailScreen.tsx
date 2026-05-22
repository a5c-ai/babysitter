import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

import { CostMeter } from '../components/CostMeter.js';
import { InputBar } from '../components/InputBar.js';
import { RunStatusBadge } from '../components/RunStatusBadge.js';
import { SessionFlowView, type SessionFlowViewMode } from '../components/session-flow/SessionFlowView.js';
import { Text } from '../components/primitives/Text.js';
import { useGateway } from '../hooks/useGateway.js';
import { useSendSessionMessage } from '../hooks/useSendSessionMessage.js';
import { useSession } from '../hooks/useSession.js';
import { accumulateEventCost, buildSessionFlowModel } from '../session-flow.js';
import type { GatewayStoreState } from '../store/index.js';

export function SessionDetailScreen(props: { sessionId: string }): JSX.Element {
  const { store } = useGateway();
  const session = useSession(props.sessionId);
  const runs = useStore(
    store,
    useShallow((state: GatewayStoreState) =>
      Object.values(state.runs.byId)
        .filter((run) => run.sessionId === props.sessionId)
        .sort((left, right) => Number(right.startedAt ?? 0) - Number(left.startedAt ?? 0)),
    ),
  );
  const eventBuffers = useStore(store, (state: GatewayStoreState) => state.events.byRunId);
  const [viewMode, setViewMode] = useState<SessionFlowViewMode>('transcript');
  const sendSessionMessage = useSendSessionMessage();

  const flowModel = useMemo(() => buildSessionFlowModel(runs, eventBuffers), [eventBuffers, runs]);
  const cost = useMemo(
    () => accumulateEventCost(runs.map((run: Record<string, unknown>) => String(run.runId ?? '')), eventBuffers),
    [eventBuffers, runs],
  );

  return (
    <View style={styles.screen}>
      <RunStatusBadge status={String(session?.status ?? 'unknown')} />
      <CostMeter totalUsd={cost?.totalUsd ?? 0} />
      <Text style={styles.heading}>{String(session?.agent ?? 'unknown')} · {props.sessionId}</Text>

      <SessionFlowView model={flowModel} viewMode={viewMode} onViewModeChange={setViewMode} />

      <InputBar
        onSubmit={(value) => {
          if (!value.trim()) {
            return;
          }
          void sendSessionMessage({
            sessionId: props.sessionId,
            prompt: value,
            agent: typeof session?.agent === 'string' ? session.agent : undefined,
          });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    gap: 12,
  },
  heading: {
    fontWeight: '700',
  },
});
