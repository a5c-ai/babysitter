import React from 'react';
import { HookInboxScreen } from '@a5c-ai/agent-mux-ui';

export function HookInboxPage(): JSX.Element {
  return (
    <section className="panel">
      <header><h2>Hook inbox</h2></header>
      <HookInboxScreen />
    </section>
  );
}
