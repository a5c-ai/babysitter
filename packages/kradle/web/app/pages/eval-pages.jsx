// Routes: /orgs/[org]/evals — evaluation suites, cases, and runs.
import { loadKradleUi, DegradedBanner } from '../lib/kradle-ui.jsx';
import { PageFrame } from '../lib/page-frame.jsx';
import { EvalSuiteManager } from '../components/eval/eval-suite-manager.jsx';
import { EvalCaseEditor } from '../components/eval/eval-case-editor.jsx';
import { EvalRunResults } from '../components/eval/eval-run-results.jsx';
import { EvalComparison } from '../components/eval/eval-comparison.jsx';

export async function EvalSuitesPage({ org = null } = {}) {
  const ui = await loadKradleUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const allResources = ui.model.resources || [];
  const suites = allResources.filter((r) => r.kind === 'EvalSuite').flatMap((r) => r.items || []);
  const cases = allResources.filter((r) => r.kind === 'EvalCase').flatMap((r) => r.items || []);
  const runs = allResources.filter((r) => r.kind === 'EvalRun').flatMap((r) => r.items || []);
  return (
    <PageFrame
      org={activeOrg}
      orgs={ui.model.orgs}
      currentPath="/evals"
      eyebrow="quality"
      title="Evaluation Suites"
      text="Create and manage agent evaluation suites. Define test cases, run evaluations against models, and compare results."
      actions={[['/evals', 'Refresh']]}
      breadcrumbs={[['/', 'Kradle'], ['/evals', 'Evaluations']]}
    >
      <DegradedBanner model={ui.model} />
      <EvalSuiteManager org={activeOrg} suites={suites} cases={cases} runs={runs} />
    </PageFrame>
  );
}

export async function EvalSuiteDetailPage({ org = null, suiteId = null } = {}) {
  const ui = await loadKradleUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const allResources = ui.model.resources || [];
  const suites = allResources.filter((r) => r.kind === 'EvalSuite').flatMap((r) => r.items || []);
  const cases = allResources.filter((r) => r.kind === 'EvalCase').flatMap((r) => r.items || []);
  const runs = allResources.filter((r) => r.kind === 'EvalRun').flatMap((r) => r.items || []);
  const suite = suiteId ? suites.find((s) => s.metadata?.name === suiteId) : null;
  const suiteCases = cases.filter((c) => c.spec?.suiteRef === suiteId);
  const suiteRuns = runs.filter((r) => r.spec?.suiteRef === suiteId);
  return (
    <PageFrame
      org={activeOrg}
      orgs={ui.model.orgs}
      currentPath="/evals"
      eyebrow="eval suite"
      title={suite?.spec?.displayName || suiteId || 'Eval Suite'}
      text={suite?.spec?.description || `Manage test cases and review evaluation runs for this suite.`}
      actions={[['/evals', 'All suites']]}
      breadcrumbs={[['/', 'Kradle'], ['/evals', 'Evaluations'], ...(suiteId ? [[`/evals/${suiteId}`, suiteId]] : [])]}
    >
      <DegradedBanner model={ui.model} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <EvalCaseEditor org={activeOrg} suiteRef={suiteId} cases={suiteCases} />
        {suiteRuns.length > 0 && (
          <div>
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 600 }}>Eval runs ({suiteRuns.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {suiteRuns.map((run) => (
                <a
                  key={run.metadata?.name}
                  href={`${suiteId}/runs/${run.metadata?.name}`}
                  style={{ padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.5rem', textDecoration: 'none', color: 'inherit', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div>
                    <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{run.metadata?.name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                      Models: {(run.spec?.models || []).join(', ')}
                    </span>
                  </div>
                  <span className={`pill ${run.status?.phase === 'Completed' ? 'good' : 'neutral'}`}>{run.status?.phase || 'pending'}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageFrame>
  );
}

export async function EvalRunDetailPage({ org = null, suiteId = null, runId = null } = {}) {
  const ui = await loadKradleUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const allResources = ui.model.resources || [];
  const runs = allResources.filter((r) => r.kind === 'EvalRun').flatMap((r) => r.items || []);
  const results = allResources.filter((r) => r.kind === 'EvalResult').flatMap((r) => r.items || []);
  const cases = allResources.filter((r) => r.kind === 'EvalCase').flatMap((r) => r.items || []);
  const run = runId ? runs.find((r) => r.metadata?.name === runId) : null;
  const runResults = results.filter((r) => r.spec?.runRef === runId);
  const suiteCases = cases.filter((c) => c.spec?.suiteRef === suiteId);
  const models = run?.spec?.models || [];
  return (
    <PageFrame
      org={activeOrg}
      orgs={ui.model.orgs}
      currentPath="/evals"
      eyebrow="eval run"
      title={runId || 'Eval Run'}
      text={`${runResults.length} results across ${models.length} model${models.length !== 1 ? 's' : ''}. ${run?.status?.phase || 'Running'}.`}
      actions={[[`/evals/${suiteId}`, 'Back to suite'], ['/evals', 'All suites']]}
      breadcrumbs={[['/', 'Kradle'], ['/evals', 'Evaluations'], ...(suiteId ? [[`/evals/${suiteId}`, suiteId]] : []), ...(runId ? [[`/evals/${suiteId}/runs/${runId}`, runId]] : [])]}
    >
      <DegradedBanner model={ui.model} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <EvalRunResults org={activeOrg} run={run} results={runResults} cases={suiteCases} />
        {models.length > 1 && (
          <EvalComparison org={activeOrg} results={runResults} cases={suiteCases} models={models} />
        )}
      </div>
    </PageFrame>
  );
}
