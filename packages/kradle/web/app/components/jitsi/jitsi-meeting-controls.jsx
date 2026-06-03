'use client';

import { useState } from 'react';

function executeJitsiCommand(api, command, payload) {
  if (!api?.executeCommand) return false;
  api.executeCommand(command, payload);
  return true;
}

export function JitsiMeetingControls({
  org = 'default',
  meetingRef = '',
  api = null,
  recordingActive = false,
  directJoinUrl = '',
  onJoin,
  onRecordingChange,
  onMeetingEnded,
}) {
  const [participantRef, setParticipantRef] = useState('');
  const [participantType, setParticipantType] = useState('user');
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
      if (onJoin) await onJoin();
      else await callMeetingAction('/join');
      setStatus('Embedded join ready');
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
      executeJitsiCommand(api, recordingActive ? 'stopRecording' : 'startRecording', { mode: 'file' });
      await callMeetingAction('/record', { action: recordingActive ? 'stop' : 'start' });
      onRecordingChange?.(!recordingActive);
      setStatus(recordingActive ? 'Recording stop requested' : 'Recording start requested');
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function endMeeting() {
    setStatus('Ending meeting...');
    executeJitsiCommand(api, 'hangup');
    const response = await fetch(`/api/orgs/${org}/jitsi/meetings/${meetingRef}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' } });
    setStatus(response.ok ? 'Meeting ended' : 'Could not end meeting');
    if (response.ok) onMeetingEnded?.();
  }

  function command(label, commandName, payload) {
    const ok = executeJitsiCommand(api, commandName, payload);
    setStatus(ok ? `${label} requested` : 'Jitsi meeting is not connected yet');
  }

  return (
    <div className="card jitsiControls">
      <div className="jitsiControlRow" aria-label="Meeting media controls">
        <button type="button" aria-label={`Toggle microphone for ${meetingRef}`} onClick={() => command('Microphone toggle', 'toggleAudio')}>Mute</button>
        <button type="button" aria-label={`Toggle camera for ${meetingRef}`} onClick={() => command('Camera toggle', 'toggleVideo')}>Camera</button>
        <button type="button" aria-label={`Share screen in ${meetingRef}`} onClick={() => command('Screen share', 'toggleShareScreen')}>Share screen</button>
        <button type="button" aria-label={`Open chat in ${meetingRef}`} onClick={() => command('Chat', 'toggleChat')}>Chat</button>
      </div>
      <div className="jitsiControlRow" aria-label="Meeting actions">
        <button type="button" aria-label={`Join ${meetingRef}`} onClick={joinMeeting}>Join</button>
        <button type="button" aria-label={`Toggle recording for ${meetingRef}`} onClick={toggleRecording}>{recordingActive ? 'Stop recording' : 'Record'}</button>
        <button type="button" aria-label={`End ${meetingRef}`} onClick={endMeeting}>End meeting</button>
      </div>
      <div className="jitsiControlRow">
        <select value={participantType} onChange={(event) => setParticipantType(event.target.value)} aria-label="Participant type">
          <option value="user">User</option>
          <option value="agentStack">Agent stack</option>
        </select>
        <input value={participantRef} onChange={(event) => setParticipantRef(event.target.value)} aria-label="Participant reference" placeholder="user or stack ref" />
        <button type="button" aria-label={`Invite participant to ${meetingRef}`} onClick={inviteParticipant}>Invite</button>
      </div>
      {directJoinUrl ? <p><a href={directJoinUrl}>Open direct Jitsi link</a></p> : null}
      {status ? <p className="muted" role="status">{status}</p> : null}
    </div>
  );
}
