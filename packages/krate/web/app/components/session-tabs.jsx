'use client';
import { useState } from 'react';

export function SessionDetailTabs({ transcriptContent, flowContent }) {
  const [tab, setTab] = useState('transcript');
  return (
    <div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        <button onClick={() => setTab('transcript')} style={{ padding: '6px 16px', borderRadius: 4, border: '1px solid #d1d5db', backgroundColor: tab === 'transcript' ? '#1e293b' : 'transparent', color: tab === 'transcript' ? '#fff' : '#374151', cursor: 'pointer', fontSize: 13 }}>Transcript</button>
        <button onClick={() => setTab('flow')} style={{ padding: '6px 16px', borderRadius: 4, border: '1px solid #d1d5db', backgroundColor: tab === 'flow' ? '#1e293b' : 'transparent', color: tab === 'flow' ? '#fff' : '#374151', cursor: 'pointer', fontSize: 13 }}>Flow</button>
      </div>
      {tab === 'transcript' ? transcriptContent : flowContent}
    </div>
  );
}
