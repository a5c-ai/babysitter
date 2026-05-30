'use client';

import { JitsiCreateMeetingForm } from './jitsi-create-meeting-form.jsx';
import { JitsiMeetingCard } from './jitsi-meeting-card.jsx';
import { JitsiRecordingList } from './jitsi-recording-list.jsx';

export function JitsiMeetingManager({ org = 'default', meetings = [], templates = [], recordings = [] }) {
  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <JitsiCreateMeetingForm org={org} templates={templates} />
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
        {meetings.length ? meetings.map((meeting) => <JitsiMeetingCard key={meeting.metadata?.name} meeting={meeting} org={org} />) : <div className="card emptyState"><h3>No meetings</h3><p>Create a meeting to start a room.</p></div>}
      </section>
      <JitsiRecordingList recordings={recordings} org={org} />
    </div>
  );
}
