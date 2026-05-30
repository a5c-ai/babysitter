import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(...parts) {
  return fs.readFileSync(path.join(webRoot, ...parts), 'utf8');
}

function exists(...parts) {
  return fs.existsSync(path.join(webRoot, ...parts));
}

const pages = [
  ['meetings', 'MeetingsPage'],
  ['meetings/[id]', 'MeetingDetailPage'],
  ['meetings/new', 'CreateMeetingPage'],
  ['meetings/templates', 'MeetingTemplatesPage'],
  ['meetings/templates/[id]', 'MeetingTemplateDetailPage'],
  ['meetings/recordings', 'RecordingsPage'],
  ['meetings/recordings/[id]', 'RecordingDetailPage'],
];

const components = [
  ['jitsi-meeting-manager.jsx', 'JitsiMeetingManager'],
  ['jitsi-meeting-card.jsx', 'JitsiMeetingCard'],
  ['jitsi-create-meeting-form.jsx', 'JitsiCreateMeetingForm'],
  ['jitsi-template-form.jsx', 'JitsiTemplateForm'],
  ['jitsi-participant-list.jsx', 'JitsiParticipantList'],
  ['jitsi-recording-list.jsx', 'JitsiRecordingList'],
  ['jitsi-embedded-meeting.jsx', 'JitsiEmbeddedMeeting'],
  ['jitsi-meeting-experience.jsx', 'JitsiMeetingExperience'],
  ['jitsi-meeting-controls.jsx', 'JitsiMeetingControls'],
  ['jitsi-provider-config.jsx', 'JitsiProviderConfig'],
];

const routes = [
  ['providers/route.js', ['GET', 'POST'], true],
  ['providers/[name]/route.js', ['GET', 'PATCH', 'DELETE'], true],
  ['meetings/route.js', ['GET', 'POST'], true],
  ['meetings/[id]/route.js', ['GET', 'PATCH', 'DELETE'], true],
  ['meetings/[id]/join/route.js', ['POST'], true],
  ['meetings/[id]/invite/route.js', ['POST'], true],
  ['meetings/[id]/record/route.js', ['POST'], true],
  ['templates/route.js', ['GET', 'POST'], true],
  ['templates/[id]/route.js', ['GET', 'PATCH', 'DELETE'], true],
  ['recordings/route.js', ['GET'], true],
  ['recordings/[id]/route.js', ['GET', 'DELETE'], true],
  ['webhooks/ingest/route.js', ['POST'], false],
];

test('Meetings navigation group exposes meetings, templates, and recordings', () => {
  const src = read('app', 'lib', 'krate-ui.jsx');
  assert.match(src, /title:\s*'Meetings'/);
  assert.match(src, /\['\/meetings',\s*'Meetings'/);
  assert.match(src, /\['\/meetings\/templates',\s*'Templates'/);
  assert.match(src, /\['\/meetings\/recordings',\s*'Recordings'/);
});

test('Jitsi meeting pages exist and render the named page components', () => {
  for (const [route, component] of pages) {
    const pagePath = ['app', 'orgs', '[org]', ...route.split('/'), 'page.jsx'];
    assert.ok(exists(...pagePath), `missing ${pagePath.join('/')}`);
    const src = read(...pagePath);
    assert.match(src, /dynamic\s*=\s*'force-dynamic'/);
    assert.match(src, /export\s+const\s+metadata\s*=/);
    assert.match(src, new RegExp(`import \\{ ${component} \\} from`));
    assert.match(src, new RegExp(`<${component} org=\\{org\\}`));
  }
});

test('Jitsi components exist, are client components, and export named symbols', () => {
  for (const [file, symbol] of components) {
    const src = read('app', 'components', 'jitsi', file);
    const firstLine = src.split('\n').find((line) => line.trim());
    assert.equal(firstLine.trim(), "'use client';");
    assert.match(src, new RegExp(`export (function|const) ${symbol}\\b`));
  }
  const barrel = read('app', 'components', 'index.js');
  for (const [, symbol] of components) {
    assert.match(barrel, new RegExp(`\\b${symbol}\\b`), `components/index.js must export ${symbol}`);
  }
});

test('Jitsi forms and controls call org-scoped API routes', () => {
  const createForm = read('app', 'components', 'jitsi', 'jitsi-create-meeting-form.jsx');
  assert.match(createForm, /fetch\(`\/api\/orgs\/\$\{org\}\/jitsi\/meetings`/);
  assert.match(createForm, /method:\s*'POST'/);

  const templateForm = read('app', 'components', 'jitsi', 'jitsi-template-form.jsx');
  assert.match(templateForm, /\/api\/orgs\/\$\{org\}\/jitsi\/templates/);
  assert.match(templateForm, /method\s*=\s*template\.metadata\?\.name\s*\?\s*'PATCH'\s*:\s*'POST'/);

  const providerConfig = read('app', 'components', 'jitsi', 'jitsi-provider-config.jsx');
  assert.match(providerConfig, /\/api\/orgs\/\$\{org\}\/jitsi\/providers/);
  assert.match(providerConfig, /method\s*=\s*provider\.metadata\?\.name\s*\?\s*'PATCH'\s*:\s*'POST'/);

  const controls = read('app', 'components', 'jitsi', 'jitsi-meeting-controls.jsx');
  for (const suffix of ['/join', '/invite', '/record']) {
    assert.match(controls, new RegExp(`\\$\\{meetingRef\\}\\$\\{path\\}|${suffix}`));
  }
  assert.match(controls, /method:\s*'DELETE'/);
});

test('Jitsi meeting detail performs authenticated embedded join before iframe rendering', () => {
  const page = read('app', 'pages', 'jitsi-pages.jsx');
  assert.match(page, /JitsiMeetingExperience/);
  assert.doesNotMatch(page, /status\?\.jwtToken/);

  const experience = read('app', 'components', 'jitsi', 'jitsi-meeting-experience.jsx');
  assert.match(experience, /\/api\/orgs\/\$\{org\}\/jitsi\/meetings\/\$\{meetingRef\}\/join/);
  assert.match(experience, /method:\s*'POST'/);
  assert.match(experience, /credentials:\s*'same-origin'/);
  assert.match(experience, /useEffect\(\(\)\s*=>\s*\{\s*requestJoin\(\)/s);
  assert.match(experience, /roomUrl\s*=\s*joinPayload\?\.roomUrl\s*\|\|\s*''/);
  assert.match(experience, /<JitsiEmbeddedMeeting/);
  assert.match(experience, /<JitsiMeetingControls/);
  assert.match(experience, /<JitsiParticipantList/);
});

test('Jitsi embedded meeting loads External API script and owns iframe lifecycle', () => {
  const embedded = read('app', 'components', 'jitsi', 'jitsi-embedded-meeting.jsx');
  assert.match(embedded, /JITSI_EXTERNAL_API_SRC\s*=\s*'https:\/\/meet\.krate\.local\/external_api\.js'/);
  assert.match(embedded, /document\.createElement\('script'\)/);
  assert.match(embedded, /window\.JitsiMeetExternalAPI/);
  assert.match(embedded, /new window\.JitsiMeetExternalAPI/);
  assert.match(embedded, /prejoinConfig:\s*\{\s*enabled:\s*false\s*\}/);
  for (const button of ['microphone', 'camera', 'desktop', 'chat', 'recording', 'participants-pane']) {
    assert.match(embedded, new RegExp(`'${button}'`));
  }
  for (const eventName of ['participantJoined', 'participantLeft', 'readyToClose', 'videoConferenceJoined', 'videoConferenceLeft']) {
    assert.match(embedded, new RegExp(`addEventListener\\('${eventName}'`));
  }
  assert.match(embedded, /apiRef\.current\.dispose\(\)/);
});

test('Jitsi controls drive External API commands and Krate meeting actions', () => {
  const controls = read('app', 'components', 'jitsi', 'jitsi-meeting-controls.jsx');
  for (const command of ['toggleAudio', 'toggleVideo', 'toggleShareScreen', 'toggleChat', 'startRecording', 'stopRecording', 'hangup']) {
    assert.match(controls, new RegExp(`'${command}'`));
  }
  assert.match(controls, /onRecordingChange\?\.\(!recordingActive\)/);
  assert.match(controls, /onMeetingEnded\?\.\(\)/);
  assert.match(controls, /Open direct Jitsi link/);
});

test('Jitsi end meeting preserves post-meeting resource state', () => {
  const route = read('app', 'api', 'orgs', '[org]', 'jitsi', 'meetings', '[id]', 'route.js');
  assert.match(route, /phase:\s*'Ended'/);
  assert.match(route, /endedAt:\s*new Date\(\)\.toISOString\(\)/);
  assert.match(route, /eventType:\s*'meeting-ended'/);
  assert.doesNotMatch(route, /deleteJitsiResource/);
});

test('Jitsi context panel includes metadata, invited agents, dispatch links, and post-meeting links', () => {
  const context = read('app', 'components', 'jitsi', 'jitsi-participant-list.jsx');
  for (const label of ['Room', 'Template', 'Org', 'Phase', 'TTL']) {
    assert.match(context, new RegExp(`\\['${label}'`));
  }
  assert.match(context, /agentStack/);
  assert.match(context, /agents\/runs/);
  assert.match(context, /meetings\/recordings/);
  assert.match(context, /Transcript/);
  assert.match(context, /Recording finalization/);
});

test('Jitsi embedded meeting layout collapses context below iframe on mobile', () => {
  const css = read('app', 'globals.css');
  assert.match(css, /\.jitsiMeetingExperience\s*\{/);
  assert.match(css, /grid-template-columns:\s*minmax\(0,\s*1fr\)\s*minmax\(300px,\s*360px\)/);
  assert.match(css, /@media\s*\(max-width:\s*960px\)[\s\S]*\.jitsiMeetingExperience\s*\{\s*grid-template-columns:\s*1fr;\s*\}/);
  assert.match(css, /@media\s*\(max-width:\s*560px\)[\s\S]*\.jitsiEmbed,\s*\.jitsiEmbedFrame,\s*\.jitsiEmbedFrame iframe\s*\{\s*min-height:\s*430px;/);
});

test('Jitsi join and webhook helpers scope tokens and do not require development secrets in production', () => {
  const service = read('app', 'lib', 'jitsi-service.js');
  assert.match(service, /org:\s*meeting\.spec\?\.organizationRef/);
  assert.match(service, /NODE_ENV\s*===\s*'production'/);
  assert.match(service, /missing_webhook_secret/);
});

test('Jitsi settings fields are present in app settings', () => {
  const src = read('app', 'components', 'settings', 'app-settings.jsx');
  for (const field of ['jitsiProvider', 'defaultRoomTTL', 'autoRecord', 'lobbyEnabled', 'maxAgentsPerRoom', 'agentAutoJoin']) {
    assert.match(src, new RegExp(field), `missing ${field}`);
  }
  assert.match(src, /Meetings \(Jitsi\)/);
});

test('Jitsi org API routes exist with auth on non-webhook routes and mandatory webhook signatures', () => {
  for (const [route, methods, requiresAuth] of routes) {
    const src = read('app', 'api', 'orgs', '[org]', 'jitsi', ...route.split('/'));
    assert.match(src, /dynamic\s*=\s*'force-dynamic'/, `${route} must be dynamic`);
    for (const method of methods) {
      assert.match(src, new RegExp(`export\\s+(const\\s+)?${method}\\b`), `${route} missing ${method}`);
    }
    if (requiresAuth) {
      assert.match(src, /withAuth/, `${route} must use withAuth`);
    } else {
      assert.doesNotMatch(src, /withAuth/, `${route} must not use session auth`);
      assert.match(src, /x-jitsi-signature/i, `${route} must read X-Jitsi-Signature`);
      assert.match(src, /timingSafeEqual|verifyJitsiWebhookSignature/, `${route} must compare signatures safely`);
      assert.doesNotMatch(src, /NODE_ENV\s*===\s*'production'/, `${route} must not allow unsigned non-production webhooks`);
    }
  }
});
