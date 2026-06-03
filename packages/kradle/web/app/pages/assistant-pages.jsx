// Routes: /orgs/[org]/assistant — AI assistant chat and structured generation.
import { loadKrateUi, DegradedBanner } from '../lib/krate-ui.jsx';
import { PageFrame } from '../lib/page-frame.jsx';
import { AssistantChat } from '../components/assistant/assistant-chat.jsx';
import { AssistantGenerate } from '../components/assistant/assistant-generate.jsx';

export async function AssistantPage({ org = null } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';

  // Gather available stack names from the model
  const stacks = (ui.model.agents?.stacks?.items || ui.model.resources?.find?.((r) => r.kind === 'AgentStack')?.names || [])
    .map((s) => typeof s === 'string' ? s : s?.metadata?.name || s?.name)
    .filter(Boolean);
  if (!stacks.includes('assistant')) stacks.unshift('assistant');

  return (
    <PageFrame
      org={activeOrg}
      orgs={ui.model.orgs}
      currentPath="/assistant"
      eyebrow="AI assistant"
      title="Assistant"
      text="Chat with the Krate assistant or generate structured content using your agent stacks."
      actions={[['/', 'Home'], ['/agents/stacks', 'Stacks']]}
      breadcrumbs={[['/', 'Krate'], ['/assistant', 'Assistant']]}
    >
      <DegradedBanner model={ui.model} />
      <AssistantShell org={activeOrg} stacks={stacks} />
    </PageFrame>
  );
}

// Client wrapper for tab switching between Chat and Generate
import { AssistantTabs } from '../components/assistant/assistant-tabs.jsx';

function AssistantShell({ org, stacks }) {
  return <AssistantTabs org={org} stacks={stacks} />;
}
