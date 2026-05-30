'use client';

export function JitsiRecordingList({ recordings = [], org = 'default' }) {
  return (
    <section className="card">
      <div className="cardTitle"><h3>Recordings</h3><span>{recordings.length}</span></div>
      {recordings.length ? (
        <ul className="compactList">
          {recordings.map((recording) => (
            <li key={recording.metadata?.name}>
              <a href={`/orgs/${org}/meetings/recordings/${recording.metadata?.name}`}>{recording.metadata?.name}</a>
              <span className="muted"> {recording.status?.phase || 'Processing'}</span>
            </li>
          ))}
        </ul>
      ) : <p className="emptyText">No recordings are available.</p>}
    </section>
  );
}
