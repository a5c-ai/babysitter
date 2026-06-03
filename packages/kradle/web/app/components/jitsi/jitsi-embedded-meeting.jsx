'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

export const JITSI_EXTERNAL_API_SRC = 'https://meet.krate.local/external_api.js';
export const JITSI_TOOLBAR_BUTTONS = [
  'microphone',
  'camera',
  'desktop',
  'chat',
  'raisehand',
  'tileview',
  'hangup',
  'recording',
  'participants-pane',
];

let externalApiScriptPromise = null;

function loadJitsiExternalApi() {
  if (typeof window === 'undefined') return Promise.reject(new Error('Jitsi can only load in a browser'));
  if (window.JitsiMeetExternalAPI) return Promise.resolve();
  if (externalApiScriptPromise) return externalApiScriptPromise;

  externalApiScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${JITSI_EXTERNAL_API_SRC}"]`);
    const script = existing || document.createElement('script');
    const cleanup = () => {
      script.removeEventListener('load', handleLoad);
      script.removeEventListener('error', handleError);
    };
    const handleLoad = () => {
      cleanup();
      if (window.JitsiMeetExternalAPI) resolve();
      else reject(new Error('Jitsi External API script loaded without JitsiMeetExternalAPI'));
    };
    const handleError = () => {
      cleanup();
      externalApiScriptPromise = null;
      reject(new Error('Could not load Jitsi External API'));
    };

    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener('error', handleError, { once: true });
    if (!existing) {
      script.src = JITSI_EXTERNAL_API_SRC;
      script.async = true;
      script.dataset.krateJitsiExternalApi = 'true';
      document.head.appendChild(script);
    }
  });

  return externalApiScriptPromise;
}

function parseRoom(roomUrl) {
  if (!roomUrl) return null;
  try {
    const url = new URL(roomUrl);
    return {
      domain: url.hostname,
      roomName: decodeURIComponent(url.pathname.replace(/^\/+/, '')),
    };
  } catch {
    return null;
  }
}

export function JitsiEmbeddedMeeting({
  roomUrl,
  jwt,
  displayName = 'Krate user',
  onApiReady,
  onParticipantJoined,
  onParticipantLeft,
  onMeetingEnded,
}) {
  const containerRef = useRef(null);
  const apiRef = useRef(null);
  const [state, setState] = useState(roomUrl ? 'loading' : 'waiting');
  const [error, setError] = useState('');
  const room = useMemo(() => parseRoom(roomUrl), [roomUrl]);

  useEffect(() => {
    let cancelled = false;
    if (!roomUrl) {
      setState('waiting');
      return undefined;
    }
    if (!room || !room.roomName) {
      setState('error');
      setError('Meeting room URL is invalid.');
      return undefined;
    }
    if (!containerRef.current || typeof window === 'undefined') return undefined;

    setState('loading');
    setError('');

    loadJitsiExternalApi()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        containerRef.current.replaceChildren();
        const api = new window.JitsiMeetExternalAPI(room.domain, {
          roomName: room.roomName,
          jwt,
          parentNode: containerRef.current,
          width: '100%',
          height: '100%',
          userInfo: { displayName },
          configOverwrite: {
            prejoinConfig: { enabled: false },
            startWithAudioMuted: false,
            startWithVideoMuted: true,
            toolbarButtons: JITSI_TOOLBAR_BUTTONS,
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_BRAND_WATERMARK: false,
            DEFAULT_BACKGROUND: '#09090b',
          },
        });
        apiRef.current = api;
        if (onParticipantJoined) api.addEventListener('participantJoined', onParticipantJoined);
        if (onParticipantLeft) api.addEventListener('participantLeft', onParticipantLeft);
        if (onMeetingEnded) api.addEventListener('readyToClose', onMeetingEnded);
        api.addEventListener('videoConferenceJoined', () => setState('ready'));
        if (onMeetingEnded) api.addEventListener('videoConferenceLeft', onMeetingEnded);
        onApiReady?.(api);
        setState('ready');
      })
      .catch((loadError) => {
        if (cancelled) return;
        setState('error');
        setError(loadError.message || 'Could not load Jitsi.');
      });

    return () => {
      cancelled = true;
      onApiReady?.(null);
      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }
    };
  }, [displayName, jwt, onApiReady, onMeetingEnded, onParticipantJoined, onParticipantLeft, room, roomUrl]);

  return (
    <section className="jitsiEmbed" aria-label="Embedded Jitsi meeting">
      <div ref={containerRef} className="jitsiEmbedFrame" />
      {state !== 'ready' ? (
        <div className="jitsiEmbedState" role={state === 'error' ? 'alert' : 'status'}>
          <strong>{state === 'error' ? 'Meeting unavailable' : state === 'waiting' ? 'Preparing meeting' : 'Loading Jitsi'}</strong>
          <span>{state === 'error' ? error : 'Krate is opening the authenticated embedded room.'}</span>
        </div>
      ) : null}
    </section>
  );
}
