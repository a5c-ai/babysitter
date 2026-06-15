// Routes: /orgs/[org]/guardrails — guardrail management.
import { loadKradleUi, DegradedBanner } from '../lib/kradle-ui.jsx';
import { PageFrame } from '../lib/page-frame.jsx';
import { GuardrailManager } from '../components/guardrail/guardrail-manager.jsx';
import { GuardrailRuleEditor } from '../components/guardrail/guardrail-rule-editor.jsx';
import { GuardrailEvents } from '../components/guardrail/guardrail-events.jsx';

export async function GuardrailsPage({ org = null } = {}) {
  const ui = await loadKradleUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const allResources = ui.model.resources || [];
  const guardrails = allResources.filter((r) => r.kind === 'Guardrail').flatMap((r) => r.items || []);
  const events = allResources.filter((r) => r.kind === 'GuardrailEvent').flatMap((r) => r.items || []);
  return (
    <PageFrame
      org={activeOrg}
      orgs={ui.model.orgs}
      currentPath="/guardrails"
      eyebrow="quality"
      title="Guardrails"
      text="Configure safety rules for agent behavior. Set content filters, budget limits, token limits, PII detection, and tool restrictions."
      actions={[['/guardrails', 'Refresh']]}
      breadcrumbs={[['/', 'Kradle'], ['/guardrails', 'Guardrails']]}
    >
      <DegradedBanner model={ui.model} />
      <GuardrailManager org={activeOrg} guardrails={guardrails} events={events} />
    </PageFrame>
  );
}

export async function GuardrailDetailPage({ org = null, guardrailId = null } = {}) {
  const ui = await loadKradleUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const allResources = ui.model.resources || [];
  const guardrails = allResources.filter((r) => r.kind === 'Guardrail').flatMap((r) => r.items || []);
  const events = allResources.filter((r) => r.kind === 'GuardrailEvent').flatMap((r) => r.items || []);
  const guardrail = guardrailId ? guardrails.find((g) => g.metadata?.name === guardrailId) : null;
  return (
    <PageFrame
      org={activeOrg}
      orgs={ui.model.orgs}
      currentPath="/guardrails"
      eyebrow="guardrail"
      title={guardrail?.spec?.displayName || guardrailId || 'Guardrail'}
      text={`${guardrail?.spec?.ruleType || 'content-filter'} rule with ${guardrail?.spec?.action || 'block'} action. ${guardrail?.spec?.enabled !== false ? 'Active' : 'Disabled'}.`}
      actions={[['/guardrails', 'All guardrails']]}
      breadcrumbs={[['/', 'Kradle'], ['/guardrails', 'Guardrails'], ...(guardrailId ? [[`/guardrails/${guardrailId}`, guardrailId]] : [])]}
    >
      <DegradedBanner model={ui.model} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <GuardrailRuleEditor org={activeOrg} guardrail={guardrail} />
        <GuardrailEvents org={activeOrg} events={events} guardrailName={guardrailId} />
      </div>
    </PageFrame>
  );
}
