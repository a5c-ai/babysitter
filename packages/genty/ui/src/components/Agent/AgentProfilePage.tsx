import React from 'react';
import { AgentAppearanceEditor, AgentAppearanceSpec } from './AgentAppearanceEditor.js';
import { AgentPersonaEditor, AgentPersonaValue } from './AgentPersonaEditor.js';
import { AgentSoulEditor } from './AgentSoulEditor.js';
import { AgentVoiceEditor, AgentVoiceSpec } from './AgentVoiceEditor.js';
import { AgentAvatar } from './AgentProfileCard.js';

export interface AgentSoulResource {
  spec?: { content?: string; version?: string };
}

export interface AgentPersonaResource {
  spec?: {
    soul?: { inline?: string };
    personality?: {
      tone?: string;
      communicationStyle?: string;
      explanationDepth?: string;
      traits?: string[];
    };
  } & AgentPersonaValue;
}

export interface AgentDefinitionResource {
  metadata?: { name?: string };
  spec?: { stackRef?: string };
}

export interface AgentAppearanceResource {
  spec?: AgentAppearanceSpec & { badge?: { text?: string } };
}

export interface AgentVoiceProfileResource {
  metadata?: { name?: string };
  spec?: AgentVoiceSpec;
}

export interface AgentProfilePageData {
  name?: string;
  displayName?: string;
  roleTitle?: string;
  roleDomain?: string;
  tagline?: string;
  avatar?: AgentAvatar;
  status?: {
    phase?: string;
    dispatchCount?: number;
    averageRating?: number;
  };
  skillRefs?: string[];
  definitions?: AgentDefinitionResource[];
  soul?: AgentSoulResource;
  persona?: AgentPersonaResource;
  appearance?: AgentAppearanceResource;
  voiceProfile?: AgentVoiceProfileResource;
}

interface AvatarDisplayProps {
  profile: AgentProfilePageData;
}

function AvatarDisplay({ profile }: AvatarDisplayProps) {
  const avatar = profile?.avatar || {};
  const style: React.CSSProperties = {
    width: 88,
    height: 88,
    borderRadius: 8,
    background: avatar.color || '#2563eb',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.75rem',
    fontWeight: 800,
  };
  if (avatar.url) {
    return (
      <img src={avatar.url} alt={`${profile.displayName} avatar`} style={{ ...style, objectFit: 'cover' }} />
    );
  }
  return (
    <span role="img" aria-label={`${profile?.displayName || 'Agent'} avatar`} style={style}>
      {avatar.emoji || avatar.initials || 'AI'}
    </span>
  );
}

export interface AgentProfilePageProps {
  org: string;
  profile?: AgentProfilePageData | null;
}

export function AgentProfilePage({ org, profile }: AgentProfilePageProps) {
  if (!profile) return null;
  const soulContent = profile.soul?.spec?.content || profile.persona?.spec?.soul?.inline || '';
  return (
    <section className="stack">
      <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <AvatarDisplay profile={profile} />
        <div>
          <h2 style={{ margin: 0 }}>{profile.displayName}</h2>
          <p style={{ margin: '0.25rem 0' }}>{profile.roleTitle}</p>
          <p className="muted" style={{ margin: 0 }}>{profile.roleDomain || profile.tagline}</p>
        </div>
        <span className="pill good">{profile.status?.phase || 'Active'}</span>
        <span className="pill neutral">{profile.status?.dispatchCount || 0} runs</span>
        {profile.status?.averageRating ? (
          <span className="pill good">{profile.status.averageRating} rating</span>
        ) : null}
      </div>
      <div className="routeGrid two">
        <article className="card">
          <div className="cardTitle">
            <h3>Soul</h3>
            <span>{profile.soul?.spec?.version || 'draft'}</span>
          </div>
          <p style={{ whiteSpace: 'pre-wrap' }}>{soulContent || 'No soul document has been attached.'}</p>
          <AgentSoulEditor value={soulContent} />
        </article>
        <article className="card">
          <div className="cardTitle">
            <h3>Personality</h3>
            <span>{profile.persona?.spec?.personality?.tone || 'professional'}</span>
          </div>
          <dl className="kv">
            <dt>Style</dt>
            <dd>{profile.persona?.spec?.personality?.communicationStyle || 'direct'}</dd>
            <dt>Depth</dt>
            <dd>{profile.persona?.spec?.personality?.explanationDepth || 'moderate'}</dd>
            <dt>Traits</dt>
            <dd>{(profile.persona?.spec?.personality?.traits || []).join(', ') || 'none'}</dd>
          </dl>
          <AgentPersonaEditor value={profile.persona?.spec || {}} />
        </article>
        <article className="card">
          <div className="cardTitle">
            <h3>Skills</h3>
            <span>{profile.skillRefs?.length ?? 0}</span>
          </div>
          {profile.skillRefs?.length ? (
            <ul className="compactList">
              {profile.skillRefs.map((skill) => (
                <li key={skill}>{skill}</li>
              ))}
            </ul>
          ) : (
            <p className="emptyText">No skills linked.</p>
          )}
        </article>
        <article className="card">
          <div className="cardTitle">
            <h3>Deployments</h3>
            <span>{profile.definitions?.length ?? 0}</span>
          </div>
          {profile.definitions?.length ? (
            <ul className="compactList">
              {profile.definitions.map((definition) => (
                <li key={definition.metadata?.name}>
                  {definition.metadata?.name} {'->'} {definition.spec?.stackRef}
                </li>
              ))}
            </ul>
          ) : (
            <p className="emptyText">No AgentDefinition deployments.</p>
          )}
        </article>
        <article className="card">
          <div className="cardTitle">
            <h3>Appearance</h3>
            <span>{profile.appearance?.spec?.badge?.text || 'profile'}</span>
          </div>
          <AgentAppearanceEditor value={profile.appearance?.spec || {}} />
        </article>
        <article className="card">
          <div className="cardTitle">
            <h3>Voice</h3>
            <span>{profile.voiceProfile?.spec?.ttsProvider || 'none'}</span>
          </div>
          <AgentVoiceEditor
            org={org}
            name={profile.voiceProfile?.metadata?.name || `${profile.name}-voice`}
            value={profile.voiceProfile?.spec || { ttsProvider: 'openai' }}
          />
        </article>
      </div>
    </section>
  );
}
