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
              {participant.name || participant.ref || participant.id} <span className="muted">{participant.type || 'user'}</span>
            </li>
          ))}
        </ul>
      ) : <p className="emptyText">No participants have joined yet.</p>}
    </section>
  );
}
