'use client';

export function JitsiMeetingCard({ meeting = {}, org = 'default' }) {
  const name = meeting.metadata?.name || 'meeting';
  const phase = meeting.status?.phase || 'Scheduled';
  return (
    <article className="card">
      <div className="cardTitle">
        <h3>{meeting.spec?.displayName || name}</h3>
        <span className="statusPill">{phase}</span>
      </div>
      <p>{meeting.spec?.roomId || 'Room pending'}</p>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <a className="button" href={`/orgs/${org}/meetings/${name}`}>Open</a>
        {phase === 'Active' ? <a className="button secondary" href={`/orgs/${org}/meetings/${name}`}>Join</a> : null}
      </div>
    </article>
  );
}
