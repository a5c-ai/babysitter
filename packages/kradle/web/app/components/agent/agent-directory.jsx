'use client';

import { AgentProfileCard } from './agent-profile-card.jsx';

export function AgentDirectory({ org, profiles = [], newHref }) {
  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0 }}>Agent Directory</h2>
          <p className="muted" style={{ margin: 0 }}>Persona identities, deployments, voices, and meeting presence.</p>
        </div>
        <a href={newHref} className="button" aria-label="Create new agent persona">New Agent</a>
      </div>
      {profiles.length ? (
        <div className="routeGrid three">
          {profiles.map((profile) => (
            <AgentProfileCard key={profile.name} profile={profile} href={`/orgs/${org}/agents/directory/${profile.name}`} />
          ))}
        </div>
      ) : (
        <div className="card emptyState">
          <h3>No agent personas</h3>
          <p>Create a persona to separate durable identity from runtime stack configuration.</p>
          <a href={newHref}>Create an agent</a>
        </div>
      )}
    </section>
  );
}
