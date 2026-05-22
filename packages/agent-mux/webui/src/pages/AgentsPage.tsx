import React, { useState } from 'react';
import { AgentsScreen } from '@a5c-ai/agent-mux-ui';

export function AgentsPage(): JSX.Element {
  const [selected, setSelected] = useState<string | undefined>();
  return (
    <section className="panel">
      <header><h2>Agents</h2></header>
      <AgentsScreen selected={selected} onSelect={setSelected} />
    </section>
  );
}
