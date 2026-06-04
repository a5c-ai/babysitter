// Routes: /orgs/[org]/agents/directory and profile/create child pages.
import { loadKradleUi, orgHref, DegradedBanner, EmptyState } from '../lib/kradle-ui.jsx';
import { PageFrame } from '../lib/page-frame.jsx';
import { buildAgentIdentityProfiles, resourceItems } from '../lib/agent-identity.js';
import { AgentCreateWizard } from '../components/agent/agent-create-wizard.jsx';
import { AgentDirectory } from '../components/agent/agent-directory.jsx';
import { AgentProfilePage } from '../components/agent/agent-profile-page.jsx';

export async function AgentDirectoryPage({ org = null } = {}) {
  const ui = await loadKradleUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const profiles = buildAgentIdentityProfiles(ui.model);
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/agents/directory" eyebrow="agent identity" title="Agent Directory" text="Manage durable agent personas, profiles, voices, and deployments separately from runtime stacks." actions={[['/agents', 'Overview'], ['/agents/stacks', 'Stacks'], ['/agents/directory/new', 'New Agent']]} breadcrumbs={[['/', 'Kradle'], ['/agents', 'Agents'], ['/agents/directory', 'Directory']]}>
    <DegradedBanner model={ui.model} />
    <AgentDirectory org={activeOrg} profiles={profiles} newHref={orgHref(activeOrg, '/agents/directory/new')} />
  </PageFrame>;
}

export async function AgentProfileRoutePage({ org = null, name } = {}) {
  const ui = await loadKradleUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const profile = buildAgentIdentityProfiles(ui.model).find((item) => item.name === name) || null;
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/agents/directory" eyebrow={`agent persona / ${name}`} title={profile?.displayName || name || 'Agent profile'} text={profile ? `${profile.roleTitle} profile, deployments, soul, appearance, and voice.` : 'This agent persona was not found.'} actions={[['/agents/directory', 'Directory'], ['/agents/directory/new', 'New Agent']]} breadcrumbs={[['/', 'Kradle'], ['/agents', 'Agents'], ['/agents/directory', 'Directory'], [`/agents/directory/${name}`, name || 'Profile']]}>
    <DegradedBanner model={ui.model} />
    {profile ? <AgentProfilePage org={activeOrg} profile={profile} /> : <EmptyState title={`Agent ${name} not found`} text="Create a persona or check the current organization." cta={orgHref(activeOrg, '/agents/directory')} ctaLabel="Back to directory" />}
  </PageFrame>;
}

export async function AgentCreateRoutePage({ org = null } = {}) {
  const ui = await loadKradleUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const stacks = resourceItems(ui.model, 'AgentStack');
  const skills = resourceItems(ui.model, 'AgentSkill');
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/agents/directory" eyebrow="new agent persona" title="New Agent" text="Create identity, soul, appearance, voice, and deployment binding in one guided flow." actions={[['/agents/directory', 'Directory'], ['/agents/stacks', 'Stacks']]} breadcrumbs={[['/', 'Kradle'], ['/agents', 'Agents'], ['/agents/directory', 'Directory'], ['/agents/directory/new', 'New']]}>
    <DegradedBanner model={ui.model} />
    <AgentCreateWizard org={activeOrg} stacks={stacks} skills={skills} />
  </PageFrame>;
}
