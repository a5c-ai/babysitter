'use client';

import { useEffect, useRef } from 'react';

export function JitsiEmbeddedMeeting({ roomUrl, jwt, displayName = 'Krate user' }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!roomUrl || !containerRef.current || typeof window === 'undefined' || !window.JitsiMeetExternalAPI) return undefined;
    const url = new URL(roomUrl);
    const api = new window.JitsiMeetExternalAPI(url.hostname, {
      roomName: url.pathname.slice(1),
      jwt,
      parentNode: containerRef.current,
      userInfo: { displayName },
      configOverwrite: { prejoinConfig: { enabled: false }, startWithVideoMuted: true },
      interfaceConfigOverwrite: { SHOW_JITSI_WATERMARK: false },
    });
    return () => api.dispose();
  }, [roomUrl, jwt, displayName]);

  return <div ref={containerRef} style={{ width: '100%', minHeight: 500, border: '1px solid var(--border)', borderRadius: 8 }} aria-label="Embedded Jitsi meeting" />;
}
