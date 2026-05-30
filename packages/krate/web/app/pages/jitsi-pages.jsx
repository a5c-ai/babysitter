import { loadKrateUi, DegradedBanner } from '../lib/krate-ui.jsx';
import { PageFrame } from '../lib/page-frame.jsx';
import { JitsiCreateMeetingForm, JitsiMeetingExperience, JitsiMeetingManager, JitsiProviderConfig, JitsiRecordingList, JitsiTemplateForm } from '../components/index.js';

function items(ui, kind) {
  return ui.model.resources?.find((resource) => resource.kind === kind)?.items || [];
}

function findItem(ui, kind, name) {
  return items(ui, kind).find((resource) => resource.metadata?.name === name) || null;
}

async function jitsiFrame(org, currentPath, title, text, children) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  return (
    <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath={currentPath} eyebrow="meetings" title={title} text={text} actions={[['/meetings/new', 'New meeting'], ['/meetings/templates', 'Templates'], ['/meetings/recordings', 'Recordings']]} breadcrumbs={[['/', 'Krate'], ['/meetings', 'Meetings']]}>
      <DegradedBanner model={ui.model} />
      {children(ui, activeOrg)}
    </PageFrame>
  );
}

export async function MeetingsPage({ org = 'default' } = {}) {
  return jitsiFrame(org, '/meetings', 'Meetings', 'Create, join, and manage Jitsi rooms for this organization.', (ui, activeOrg) => (
    <JitsiMeetingManager org={activeOrg} meetings={items(ui, 'JitsiMeeting')} templates={items(ui, 'JitsiMeetingTemplate')} recordings={items(ui, 'JitsiRecording')} />
  ));
}

export async function MeetingDetailPage({ org = 'default', id } = {}) {
  return jitsiFrame(org, `/meetings/${id}`, 'Meeting detail', 'Join the room and inspect Krate meeting context.', (ui) => {
    const meeting = findItem(ui, 'JitsiMeeting', id) || { metadata: { name: id }, spec: { roomId: id, displayName: id }, status: { phase: 'Scheduled', participants: { current: [] } } };
    const recordings = items(ui, 'JitsiRecording');
    return <JitsiMeetingExperience org={meeting.spec?.organizationRef || org} meeting={meeting} recordings={recordings} />;
  });
}

export async function CreateMeetingPage({ org = 'default' } = {}) {
  return jitsiFrame(org, '/meetings/new', 'New meeting', 'Create an ad hoc Jitsi room or start from a reusable template.', (ui, activeOrg) => (
    <JitsiCreateMeetingForm org={activeOrg} templates={items(ui, 'JitsiMeetingTemplate')} />
  ));
}

export async function MeetingTemplatesPage({ org = 'default' } = {}) {
  return jitsiFrame(org, '/meetings/templates', 'Meeting templates', 'Manage reusable meeting configuration for recurring rooms.', (ui, activeOrg) => (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <JitsiTemplateForm org={activeOrg} />
      <ul className="compactList">
        {items(ui, 'JitsiMeetingTemplate').map((template) => <li key={template.metadata?.name}>{template.spec?.displayName || template.metadata?.name}</li>)}
      </ul>
    </div>
  ));
}

export async function MeetingTemplateDetailPage({ org = 'default', id } = {}) {
  return jitsiFrame(org, `/meetings/templates/${id}`, 'Meeting template', 'Edit template defaults, participants, recording, and agent behavior.', (ui, activeOrg) => (
    <JitsiTemplateForm org={activeOrg} template={findItem(ui, 'JitsiMeetingTemplate', id) || { metadata: { name: id }, spec: {} }} />
  ));
}

export async function RecordingsPage({ org = 'default' } = {}) {
  return jitsiFrame(org, '/meetings/recordings', 'Recordings', 'Browse meeting recordings and transcript availability.', (ui, activeOrg) => (
    <JitsiRecordingList recordings={items(ui, 'JitsiRecording')} org={activeOrg} />
  ));
}

export async function RecordingDetailPage({ org = 'default', id } = {}) {
  return jitsiFrame(org, `/meetings/recordings/${id}`, 'Recording detail', 'Review recording playback metadata and transcript status.', (ui) => {
    const recording = findItem(ui, 'JitsiRecording', id) || { metadata: { name: id }, status: { phase: 'Processing', transcript: { available: false } } };
    return (
      <div className="card">
        <div className="cardTitle"><h3>{recording.metadata?.name}</h3><span>{recording.status?.phase}</span></div>
        <p>Transcript: {recording.status?.transcript?.available ? 'Available' : 'Not available'}</p>
        <pre><code>{JSON.stringify(recording.status?.transcript || {}, null, 2)}</code></pre>
      </div>
    );
  });
}

export async function JitsiProviderSettingsPage({ org = 'default' } = {}) {
  return jitsiFrame(org, '/meetings/providers', 'Jitsi provider', 'Configure the Jitsi endpoint used by meetings.', (ui, activeOrg) => (
    <JitsiProviderConfig org={activeOrg} provider={items(ui, 'JitsiMeetProvider')[0]} />
  ));
}
