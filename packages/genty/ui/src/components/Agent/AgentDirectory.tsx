import React from 'react';
import { AgentProfileCard, AgentProfile } from './AgentProfileCard.js';

export interface AgentDirectoryProps {
  org: string;
  profiles?: AgentProfile[];
  onNavigate?: (path: string) => void;
  newHref?: string;
}

export function AgentDirectory({ org, profiles = [], onNavigate, newHref }: AgentDirectoryProps) {
  const resolvedNewHref = newHref ?? `/orgs/${org}/agents/directory/new`;
  return (
    <section>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '1rem',
          alignItems: 'center',
          marginBottom: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Agent Directory</h2>
          <p className="muted" style={{ margin: 0 }}>
            Persona identities, deployments, voices, and meeting presence.
          </p>
        </div>
        <a
          href={resolvedNewHref}
          className="button"
          aria-label="Create new agent persona"
          onClick={
            onNavigate
              ? (e) => {
                  e.preventDefault();
                  onNavigate(resolvedNewHref);
                }
              : undefined
          }
        >
          New Agent
        </a>
      </div>
      {profiles.length ? (
        <div className="routeGrid three">
          {profiles.map((profile) => (
            <AgentProfileCard
              key={profile.name}
              profile={profile}
              href={`/orgs/${org}/agents/directory/${profile.name}`}
            />
          ))}
        </div>
      ) : (
        <div className="card emptyState">
          <h3>No agent personas</h3>
          <p>Create a persona to separate durable identity from runtime stack configuration.</p>
          <a href={resolvedNewHref}>Create an agent</a>
        </div>
      )}
    </section>
  );
}
