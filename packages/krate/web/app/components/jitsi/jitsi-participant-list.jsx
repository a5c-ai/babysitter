'use client';

function participantKey(participant) {
  return participant.id || participant.ref || participant.name || participant.email || JSON.stringify(participant);
}

function participantLabel(participant) {
  return participant.name || participant.displayName || participant.ref || participant.id || 'Participant';
}

function participantType(participant) {
  return participant.type || participant.participantType || (participant.agentStackRef ? 'agentStack' : 'user');
}

function dispatchRunRef(participant) {
  return participant.dispatchRunRef || participant.runRef || participant.dispatchRun || participant.status?.dispatchRunRef || '';
}

function initials(label) {
  return String(label || 'K')
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'K';
}

function recordingHref(org, recording) {
  const id = recording?.metadata?.name || recording?.status?.recordingId || recording?.spec?.recordingId;
  return id ? `/orgs/${encodeURIComponent(org)}/meetings/recordings/${encodeURIComponent(id)}` : '';
}

export function JitsiParticipantList({
  org = 'default',
  meeting = null,
  participants = [],
  invited = [],
  recordings = [],
  recordingActive = false,
  ended = false,
}) {
  const items = Array.isArray(participants) ? participants : [];
  const invitedItems = Array.isArray(invited) ? invited : [];
  const recordingItems = Array.isArray(recordings)
    ? recordings.filter((recording) => !meeting?.metadata?.name || recording.spec?.meetingRef === meeting.metadata.name || recording.status?.meetingRef === meeting.metadata.name)
    : [];
  const metadataRows = [
    ['Room', meeting?.spec?.roomId],
    ['Template', meeting?.spec?.templateRef],
    ['Org', meeting?.spec?.organizationRef || org],
    ['Phase', ended ? 'Ended' : meeting?.status?.phase],
    ['TTL', meeting?.spec?.ttlMinutes ? `${meeting.spec.ttlMinutes} min` : null],
  ].filter(([, value]) => value);

  return (
    <aside className="card jitsiContextPanel" aria-label="Krate meeting context">
      <div className="cardTitle">
        <h3>Context</h3>
        <span>{recordingActive ? 'Recording active' : ended ? 'Ended' : 'Live'}</span>
      </div>
      {metadataRows.length ? (
        <dl className="jitsiMetadata">
          {metadataRows.map(([label, value]) => (
            <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
          ))}
        </dl>
      ) : null}
      <div className="cardTitle jitsiContextTitle"><h3>Participants</h3><span>{items.length}</span></div>
      {items.length ? (
        <ul className="compactList jitsiParticipantList">
          {items.map((participant) => (
            <li key={participantKey(participant)}>
              <span className={`jitsiAvatar ${participantType(participant) === 'agentStack' ? 'agent' : ''}`}>{initials(participantLabel(participant))}</span>
              <span>
                <strong>{participantLabel(participant)}</strong>
                <small>{participantType(participant)} {participant.role ? `/ ${participant.role}` : ''}</small>
              </span>
              {dispatchRunRef(participant) ? (
                <a href={`/orgs/${encodeURIComponent(org)}/agents/runs/${encodeURIComponent(dispatchRunRef(participant))}`}>Dispatch {dispatchRunRef(participant)}</a>
              ) : null}
              <span aria-hidden="true">{participant.persona?.avatar?.emoji || participant.avatar || (participant.type === 'agentDefinition' ? 'AI' : '')}</span>
              {participant.persona?.displayName || participant.name || participant.ref || participant.id} <span className="muted">{participant.persona?.roleTitle || participant.role || participant.agentStack || participant.stackRef || participant.type || 'user'}</span>
              {participant.persona?.voiceProfile || participant.voiceProfile ? <span className="muted"> voice</span> : null}
            </li>
          ))}
        </ul>
      ) : <p className="emptyText">No participants have joined yet.</p>}
      {invitedItems.length ? (
        <>
          <div className="cardTitle jitsiContextTitle"><h3>Invited</h3><span>{invitedItems.length}</span></div>
          <ul className="compactList jitsiInviteList">
            {invitedItems.map((participant) => (
              <li key={participantKey(participant)}>
                <span className={`jitsiAvatar pending ${participantType(participant) === 'agentStack' ? 'agent' : ''}`}>{initials(participantLabel(participant))}</span>
                <span><strong>{participantLabel(participant)}</strong><small>{participantType(participant)} {participant.role ? `/ ${participant.role}` : ''}</small></span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {recordingItems.length ? (
        <>
          <div className="cardTitle jitsiContextTitle"><h3>Post-meeting</h3><span>{recordingItems.length}</span></div>
          <ul className="compactList">
            {recordingItems.map((recording) => {
              const href = recordingHref(org, recording);
              const transcript = recording.status?.transcript || {};
              return (
                <li key={recording.metadata?.name || recording.status?.recordingId}>
                  <span><strong>{recording.metadata?.name || recording.status?.recordingId}</strong><small>{recording.status?.phase || 'Processing'}</small></span>
                  {href ? <a href={href}>Recording</a> : null}
                  {transcript.available && (transcript.url || href) ? <a href={transcript.url || href}>Transcript</a> : null}
                </li>
              );
            })}
          </ul>
        </>
      ) : ended ? <p className="emptyText">Recording finalization has not produced a transcript yet.</p> : null}
    </aside>
  );
}
