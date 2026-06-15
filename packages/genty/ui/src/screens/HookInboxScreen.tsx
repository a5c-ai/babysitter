import React from 'react';
import { View } from 'react-native';

import { HookApprovalPrompt } from '../components/HookApprovalPrompt.js';
import { useGateway } from '../hooks/useGateway.js';
import { useHookRequests } from '../hooks/useHookRequests.js';

export function HookInboxScreen(): JSX.Element {
  const hooks = useHookRequests();
  const { client } = useGateway();
  return (
    <View>
      {hooks.map((hook) => (
        <HookApprovalPrompt
          key={hook.hookRequestId}
          agent="claude"
          toolName={String(hook.payload.toolName ?? hook.hookKind)}
          input={hook.payload}
          secondsRemaining={Math.max(0, Math.floor((hook.deadlineTs - Date.now()) / 1000))}
          onAllow={() =>
            void client.request({
              type: 'hook.decision',
              hookRequestId: hook.hookRequestId,
              decision: 'allow',
            })
          }
          onDeny={() =>
            void client.request({
              type: 'hook.decision',
              hookRequestId: hook.hookRequestId,
              decision: 'deny',
            })
          }
        />
      ))}
    </View>
  );
}
