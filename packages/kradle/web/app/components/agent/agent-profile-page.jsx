'use client';

import { AgentAppearanceEditor } from './agent-appearance-editor.jsx';
import { AgentPersonaEditor } from './agent-persona-editor.jsx';
import { AgentSoulEditor } from './agent-soul-editor.jsx';
import { AgentVoiceEditor } from './agent-voice-editor.jsx';

function Avatar({ profile }) {
  const avatar = profile?.avatar || {};
  const style = { width: 88, height: 88, borderRadius: 8, background: avatar.color || 'var(--accent)', color: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', fontWeight: 800 };
  if (avatar.url) return <img src={avatar.url} alt={`${profile.displayName} avatar`} style={{ ...style, objectFit: 'cover' }} />;
  return <span role="img" aria-label={`${profile?.displayName || 'Agent'} avatar`} style={style}>{avatar.emoji || avatar.initials || 'AI'}</span>;
}

export function AgentProfilePage({ org, profile }) {
  if (!profile) return null;
  const soulContent = profile.soul?.spec?.content || profile.persona?.spec?.soul?.inline || '';
  return (
    <section className="stack">
      <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <Avatar profile={profile} />
        <div>
          <h2 style={{ margin: 0 }}>{profile.displayName}</h2>
          <p style={{ margin: '0.25rem 0' }}>{profile.roleTitle}</p>
          <p className="muted" style={{ margin: 0 }}>{profile.roleDomain || profile.tagline}</p>
        </div>
        <span className="pill good">{profile.status?.phase || 'Active'}</span>
        <span className="pill neutral">{profile.status?.dispatchCount || 0} runs</span>
        {profile.status?.averageRating ? <span className="pill good">{profile.status.averageRating} rating</span> : null}
      </div>
      <div className="routeGrid two">
        <article className="card">
          <div className="cardTitle"><h3>Soul</h3><span>{profile.soul?.spec?.version || 'draft'}</span></div>
          <p style={{ whiteSpace: 'pre-wrap' }}>{soulContent || 'No soul document has been attached.'}</p>
          <AgentSoulEditor value={soulContent} />
        </article>
        <article className="card">
          <div className="cardTitle"><h3>Personality</h3><span>{profile.persona?.spec?.personality?.tone || 'professional'}</span></div>
          <dl className="kv">
            <dt>Style</dt><dd>{profile.persona?.spec?.personality?.communicationStyle || 'direct'}</dd>
            <dt>Depth</dt><dd>{profile.persona?.spec?.personality?.explanationDepth || 'moderate'}</dd>
            <dt>Traits</dt><dd>{(profile.persona?.spec?.personality?.traits || []).join(', ') || 'none'}</dd>
          </dl>
          <AgentPersonaEditor value={profile.persona?.spec || {}} />
        </article>
        <article className="card">
          <div className="cardTitle"><h3>Skills</h3><span>{profile.skillRefs.length}</span></div>
          {profile.skillRefs.length ? <ul className="compactList">{profile.skillRefs.map((skill) => <li key={skill}>{skill}</li>)}</ul> : <p className="emptyText">No skills linked.</p>}
        </article>
        <article className="card">
          <div className="cardTitle"><h3>Deployments</h3><span>{profile.definitions.length}</span></div>
          {profile.definitions.length ? <ul className="compactList">{profile.definitions.map((definition) => <li key={definition.metadata?.name}>{definition.metadata?.name} {'->'} {definition.spec?.stackRef}</li>)}</ul> : <p className="emptyText">No AgentDefinition deployments.</p>}
        </article>
        <article className="card">
          <div className="cardTitle"><h3>Appearance</h3><span>{profile.appearance?.spec?.badge?.text || 'profile'}</span></div>
          <AgentAppearanceEditor value={profile.appearance?.spec || {}} />
        </article>
        <article className="card">
          <div className="cardTitle"><h3>Voice</h3><span>{profile.voiceProfile?.spec?.ttsProvider || 'none'}</span></div>
          <AgentVoiceEditor org={org} name={profile.voiceProfile?.metadata?.name || `${profile.name}-voice`} value={profile.voiceProfile?.spec || { ttsProvider: 'openai' }} />
        </article>
      </div>
    </section>
  );
}
