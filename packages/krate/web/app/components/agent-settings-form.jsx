'use client';

import { GatewaySection } from './settings-gateway.jsx';
import { AdaptersSection } from './settings-adapters.jsx';
import { ProvidersSection } from './settings-providers.jsx';
import { RbacSection } from './settings-rbac.jsx';

export function AgentSettingsForm({ org, gateway, adapters, providers, secrets, serviceAccounts }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <GatewaySection org={org} gateway={gateway} />
      <AdaptersSection org={org} initialAdapters={adapters} />
      <ProvidersSection org={org} initialProviders={providers} secrets={secrets} />
      <RbacSection org={org} initialServiceAccounts={serviceAccounts} />
    </div>
  );
}
