'use client';

import { useState } from 'react';

export function JitsiMeetingControls({ org = 'default', meetingRef = '', recordingActive = false }) {
  const [participantRef, setParticipantRef] = useState('');
  const [participantType, setParticipantType] = useState('user');
  const [joinUrl, setJoinUrl] = useState('');
  const [status, setStatus] = useState('');

  async function callMeetingAction(path, body = {}) {
    const response = await fetch(`/api/orgs/${org}/jitsi/meetings/${meetingRef}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.message || payload.error || 'Meeting action failed');
    return payload;
  }

  async function joinMeeting() {
    setStatus('Preparing join token...');
    try {
      const payload = await callMeetingAction('/join');
      setJoinUrl(`${payload.roomUrl}?jwt=${encodeURIComponent(payload.jwt)}`);
      setStatus('Join link ready');
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function inviteParticipant() {
    if (!participantRef.trim()) {
      setStatus('Enter a participant reference');
      return;
    }
    setStatus('Inviting participant...');
    try {
      await callMeetingAction('/invite', { participantType, participantRef });
      setParticipantRef('');
      setStatus('Participant invited');
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function toggleRecording() {
    setStatus(recordingActive ? 'Stopping recording...' : 'Starting recording...');
    try {
      await callMeetingAction('/record', { action: recordingActive ? 'stop' : 'start' });
      setStatus(recordingActive ? 'Recording stop requested' : 'Recording start requested');
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function endMeeting() {
    setStatus('Ending meeting...');
    const response = await fetch(`/api/orgs/${org}/jitsi/meetings/${meetingRef}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' } });
    setStatus(response.ok ? 'Meeting ended' : 'Could not end meeting');
  }

  return (
    <div className="card" style={{ display: 'grid', gap: '0.75rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button type="button" aria-label={`Join ${meetingRef}`} onClick={joinMeeting}>Join</button>
        <button type="button" aria-label={`Toggle recording for ${meetingRef}`} onClick={toggleRecording}>{recordingActive ? 'Stop recording' : 'Record'}</button>
        <button type="button" aria-label={`End ${meetingRef}`} onClick={endMeeting}>End meeting</button>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <select value={participantType} onChange={(event) => setParticipantType(event.target.value)} aria-label="Participant type">
          <option value="user">User</option>
          <option value="agentStack">Agent stack</option>
        </select>
        <input value={participantRef} onChange={(event) => setParticipantRef(event.target.value)} aria-label="Participant reference" placeholder="user or stack ref" />
        <button type="button" aria-label={`Invite participant to ${meetingRef}`} onClick={inviteParticipant}>Invite</button>
      </div>
      {joinUrl ? <p><a href={joinUrl}>Open join link</a></p> : null}
      {status ? <p className="muted" role="status">{status}</p> : null}
    </div>
  );
}
