'use client';

export function JitsiParticipantList({ participants = [] }) {
  const items = Array.isArray(participants) ? participants : [];
  return (
    <section className="card">
      <div className="cardTitle"><h3>Participants</h3><span>{items.length}</span></div>
      {items.length ? (
        <ul className="compactList">
          {items.map((participant) => (
            <li key={participant.id || participant.ref || participant.name}>
              <span aria-hidden="true">{participant.persona?.avatar?.emoji || participant.avatar || (participant.type === 'agentDefinition' ? 'AI' : '')}</span>
              {participant.persona?.displayName || participant.name || participant.ref || participant.id} <span className="muted">{participant.persona?.roleTitle || participant.role || participant.agentStack || participant.stackRef || participant.type || 'user'}</span>
              {participant.persona?.voiceProfile || participant.voiceProfile ? <span className="muted"> voice</span> : null}
            </li>
          ))}
        </ul>
      ) : <p className="emptyText">No participants have joined yet.</p>}
    </section>
  );
}
