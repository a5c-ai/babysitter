'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { btnSecondary, pillStyle } from './artifact-registry-helpers.jsx';
import { RegistryCard, CreateRegistryForm, FeedBrowser } from './artifact-registry-list.jsx';
import { VersionList, AccessPolicyManager } from './artifact-version-list.jsx';

// ── Main export: ArtifactRegistryManager ─────────────────────────────
export function ArtifactRegistryManager({ org, registries: initialRegistries = [], feeds: initialFeeds = [], externalProviders = [] }) {
  const router = useRouter();
  const [registries, setRegistries] = useState(initialRegistries);
  const [feeds] = useState(initialFeeds);
  const [selectedRegistry, setSelectedRegistry] = useState(null);
  const [selectedFeed, setSelectedFeed] = useState(null);
  const [view, setView] = useState('list'); // list | detail | versions

  function handleRegistryCreated(result) {
    const item = result?.items?.[0] || result;
    if (item?.metadata?.name) setRegistries((prev) => [...prev, item]);
    else router.refresh();
  }

  function handleSelectRegistry(registry) {
    setSelectedRegistry(registry);
    setSelectedFeed(null);
    setView('detail');
  }

  function handleSelectFeed(feed) {
    setSelectedFeed(feed);
    setView('versions');
  }

  function handleBack() {
    if (view === 'versions') {
      setSelectedFeed(null);
      setView('detail');
    } else {
      setSelectedRegistry(null);
      setView('list');
    }
  }

  // ── Versions view ──────────────────────────────────────────────────
  if (view === 'versions' && selectedFeed) {
    const regType = selectedRegistry?.spec?.registryType || 'generic';
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <VersionList org={org} feed={selectedFeed} registryType={regType} onBack={handleBack} />
        <AccessPolicyManager org={org} feed={selectedFeed} />
      </div>
    );
  }

  // ── Registry detail view (feed browser) ────────────────────────────
  if (view === 'detail' && selectedRegistry) {
    const regName = selectedRegistry.metadata?.name || 'unnamed';
    const regFeeds = feeds.filter((f) => f.spec?.registryRef === regName);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button style={btnSecondary} onClick={handleBack} aria-label="Back to registries">Back to registries</button>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{regName}</h3>
          <span style={pillStyle('neutral')}>{selectedRegistry.spec?.registryType || 'generic'}</span>
        </div>
        <FeedBrowser org={org} feeds={regFeeds} registries={registries} onSelectFeed={handleSelectFeed} />
      </div>
    );
  }

  // ── Registry list view ─────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <section className="routeGrid two" style={{ alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Artifact registries</h3>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{registries.length} configured</p>
            </div>
          </div>

          {registries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--bg-subtle)', borderRadius: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No artifact registries configured. Create one to start managing packages and build artifacts.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {registries.map((registry) => (
                <RegistryCard key={registry.metadata?.name} registry={registry} feeds={feeds} onSelect={handleSelectRegistry} />
              ))}
            </div>
          )}

          {feeds.length > 0 && (
            <div style={{ marginTop: '0.5rem' }}>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 600 }}>All feeds</h3>
              <FeedBrowser org={org} feeds={feeds} registries={registries} onSelectFeed={(f) => {
                const reg = registries.find((r) => r.metadata?.name === f.spec?.registryRef);
                if (reg) setSelectedRegistry(reg);
                handleSelectFeed(f);
              }} />
            </div>
          )}
        </div>

        <CreateRegistryForm org={org} onCreated={handleRegistryCreated} externalProviders={externalProviders} />
      </section>
    </div>
  );
}
