import React from 'react';

export interface AgentAvatar {
  url?: string;
  emoji?: string;
  initials?: string;
  color?: string;
}

export interface AgentProfileStatus {
  dispatchCount?: number;
  averageRating?: number;
  meetingCount?: number;
  phase?: string;
}

export interface AgentDefinitionRef {
  metadata?: { name?: string };
  spec?: { stackRef?: string };
  status?: { dispatchCount?: number };
}

export interface AgentProfile {
  name?: string;
  displayName?: string;
  roleTitle?: string;
  roleDomain?: string;
  tagline?: string;
  avatar?: AgentAvatar;
  status?: AgentProfileStatus;
  definitions?: AgentDefinitionRef[];
  skillRefs?: string[];
}

interface AvatarProps {
  avatar?: AgentAvatar;
  label: string;
  size?: number;
}

function Avatar({ avatar, label, size = 48 }: AvatarProps) {
  const style: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: 8,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: avatar?.color || '#2563eb',
    color: '#fff',
    fontWeight: 800,
    flexShrink: 0,
  };
  if (avatar?.url) {
    return <img src={avatar.url} alt={`${label} avatar`} style={{ ...style, objectFit: 'cover' }} />;
  }
  return (
    <span role="img" aria-label={`${label} avatar`} style={style}>
      {avatar?.emoji || avatar?.initials || 'AI'}
    </span>
  );
}

export interface AgentProfileCardProps {
  profile: AgentProfile;
  href: string;
}

export function AgentProfileCard({ profile, href }: AgentProfileCardProps) {
  const runCount =
    profile?.status?.dispatchCount ??
    profile?.definitions?.reduce(
      (sum, definition) => sum + Number(definition.status?.dispatchCount || 0),
      0
    ) ??
    0;
  const rating = profile?.status?.averageRating;
  return (
    <article className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: 220 }}>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <Avatar avatar={profile?.avatar} label={profile?.displayName || 'Agent'} />
        <div>
          <h3 style={{ margin: 0 }}>{profile?.displayName || profile?.name}</h3>
          <p className="muted" style={{ margin: 0 }}>{profile?.roleTitle || 'Agent persona'}</p>
        </div>
      </div>
      <p style={{ margin: 0, color: 'var(--text-muted)' }}>
        {profile?.tagline || profile?.roleDomain || 'Reusable identity for Krate dispatch and meetings.'}
      </p>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: 'auto' }}>
        <span className="pill neutral">{runCount} runs</span>
        {rating ? <span className="pill good">{rating} avg</span> : null}
        {profile?.status?.meetingCount ? (
          <span className="pill neutral">{profile.status.meetingCount} meetings</span>
        ) : null}
      </div>
      <a href={href} aria-label={`View ${profile?.displayName || profile?.name} profile`}>
        View profile
      </a>
    </article>
  );
}
