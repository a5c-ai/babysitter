// Routes: /orgs/[org]/agents/memory — agent memory repositories, ontology, and imports.
import { loadKrateUi, orgHref, StatusPill, DegradedBanner, EmptyState } from '../lib/krate-ui.jsx';
import { PageFrame } from '../lib/page-frame.jsx';
import { MemorySearchForm } from '../components/workspace/memory-search-form.jsx';
import { MemoryOntologyEditor } from '../components/workspace/memory-ontology-editor.jsx';
import { MemoryImportReview } from '../components/workspace/memory-import-review.jsx';
import { MemoryRepoEditForm } from '../components/workspace/memory-repo-edit-form.jsx';
import { ResourceActions, InlineCreateForm } from '../components/resource-crud-actions.jsx';

function buildMemoryRepoSpec(formData) {
  const spec = {};
  const repoUrl = formData.get('repoUrl');
  if (repoUrl) spec.repoUrl = repoUrl;
  const description = formData.get('description');
  if (description) spec.description = description;
  return spec;
}

export async function AgentMemoryPage({ org = null } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const memoryView = ui.model.agents?.memory || { repositories: { count: 0, items: [] }, snapshots: { count: 0 }, imports: { pending: 0, items: [] }, ontologies: { count: 0, items: [] } };
  const repoCount = memoryView.repositories?.count ?? (memoryView.repositories?.items?.length || 0);
  const snapshotCount = memoryView.snapshots?.count ?? 0;
  const pendingImports = memoryView.imports?.pending ?? 0;
  const ontologyCount = memoryView.ontologies?.count ?? (memoryView.ontologies?.items?.length || 0);
  const hasRepos = repoCount > 0;
  const memoryRepoFields = [
    { name: 'name', label: 'Name', placeholder: 'my-memory-repo', required: true },
    { name: 'repoUrl', label: 'Repository URL', type: 'url', placeholder: 'https://github.com/acme/memory', required: true },
    { name: 'description', label: 'Description', placeholder: 'What knowledge does this repo store?', required: false }
  ];
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/agents" eyebrow="agent memory" title="Memory repositories and imports" text="Manage agent memory repositories, search stored knowledge, review pending imports, and configure ontologies." actions={[['/agents/memory/search', 'Search'], ['/agents/memory/imports', 'Imports'], ['/agents/memory/ontology', 'Ontology']]} breadcrumbs={[['/', 'Krate'], ['/agents', 'Agents'], ['/agents/memory', 'Memory']]}>
    <DegradedBanner model={ui.model} />
    {hasRepos ? <>
      <section className="routeGrid four">
        <a href={orgHref(activeOrg, '/agents/memory')} className="card quickAction" style={{ textDecoration: 'none' }}>
          <div className="cardTitle"><h3>Repositories</h3><StatusPill tone="good">{repoCount}</StatusPill></div>
          <p className="emptyText">Memory repositories configured</p>
        </a>
        <div className="card">
          <div className="cardTitle"><h3>Snapshots</h3><StatusPill tone={snapshotCount ? 'good' : 'neutral'}>{snapshotCount}</StatusPill></div>
          <p className="emptyText">Point-in-time snapshots</p>
        </div>
        <a href={orgHref(activeOrg, '/agents/memory/imports')} className="card quickAction" style={{ textDecoration: 'none' }}>
          <div className="cardTitle"><h3>Pending imports</h3><StatusPill tone={pendingImports ? 'warn' : 'neutral'}>{pendingImports}</StatusPill></div>
          <p className="emptyText">Imports awaiting review</p>
        </a>
        <a href={orgHref(activeOrg, '/agents/memory/ontology')} className="card quickAction" style={{ textDecoration: 'none' }}>
          <div className="cardTitle"><h3>Ontologies</h3><StatusPill tone={ontologyCount ? 'good' : 'neutral'}>{ontologyCount}</StatusPill></div>
          <p className="emptyText">Graph schema definitions</p>
        </a>
      </section>
      <section className="routeGrid two" style={{ alignItems: 'start' }}>
        <div className="card">
          <div className="cardTitle"><h3>Repositories</h3><StatusPill tone="good">{repoCount}</StatusPill></div>
          <div className="resourceTable">{(memoryView.repositories?.items || []).map((repo) => {
            const repoName = repo.metadata?.name;
            return <div key={repoName} className="resourceRow" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <strong>{repoName}</strong>
                <span style={{ color: '#6b7280', fontSize: '0.8125rem' }}>{repo.spec?.repoUrl || repo.spec?.description || ''}</span>
                <StatusPill tone={repo.status?.phase === 'Active' ? 'good' : 'neutral'}>{repo.status?.phase || 'Unknown'}</StatusPill>
                <MemoryRepoEditForm org={activeOrg} repo={repo} />
                <ResourceActions org={activeOrg} apiPath={`resources/AgentMemoryRepository/${repoName}`} actions={['delete']} />
              </div>
            </div>;
          })}</div>
        </div>
        <InlineCreateForm
          org={activeOrg}
          kind="AgentMemoryRepository"
          title="Add repository"
          fields={memoryRepoFields}
          buildSpec={buildMemoryRepoSpec}
          successText={(body) => `Added repository ${body.resource?.metadata?.name || ''}`}
        />
      </section>
      <section className="routeGrid three">
        <a href={orgHref(activeOrg, '/agents/memory/search')} className="card quickAction" style={{ textDecoration: 'none' }}>
          <div className="cardTitle"><h3>Search memory</h3></div>
          <p style={{ color: '#6b7280', fontSize: '0.8125rem' }}>Query structured records or full-text search across markdown documents.</p>
        </a>
        <a href={orgHref(activeOrg, '/agents/memory/imports')} className="card quickAction" style={{ textDecoration: 'none' }}>
          <div className="cardTitle"><h3>Review imports</h3></div>
          <p style={{ color: '#6b7280', fontSize: '0.8125rem' }}>Inspect pending memory imports from agent runs and sessions.</p>
        </a>
        <a href={orgHref(activeOrg, '/agents/memory/ontology')} className="card quickAction" style={{ textDecoration: 'none' }}>
          <div className="cardTitle"><h3>Configure ontology</h3></div>
          <p style={{ color: '#6b7280', fontSize: '0.8125rem' }}>Define node kinds, edge kinds, and graph schema for memory repositories.</p>
        </a>
      </section>
    </> : <section className="routeGrid two" style={{ alignItems: 'start' }}>
      <EmptyState title="No memory repositories configured" text="Memory repositories store structured knowledge extracted from agent runs. Use the form on the right to add one." cta={orgHref(activeOrg, '/agents')} ctaLabel="Agent overview" />
      <InlineCreateForm
        org={activeOrg}
        kind="AgentMemoryRepository"
        title="Add repository"
        fields={memoryRepoFields}
        successText="Repository added"
      />
    </section>}
  </PageFrame>;
}

export async function AgentMemorySearchPage({ org = null } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const memoryView = ui.model.agents?.memory || { repositories: { count: 0 } };
  const hasRepos = (memoryView.repositories?.count ?? 0) > 0;
  const exampleYaml = `apiVersion: krate.a5c.ai/v1alpha1
kind: AgentMemoryQuery
metadata:
  name: example-search
spec:
  repositoryRef: my-memory-repo
  mode: graph-and-grep
  graph:
    nodeKind: Service
    traverse:
      - edge: depends_on
        depth: 2
  grep:
    pattern: "deployment pipeline"
    fileGlob: "*.md"
  limit: 25`;
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/agents" eyebrow="memory search" title="Search agent memory" text="Query structured graph records or full-text search across markdown documents stored in memory repositories." actions={[['/agents/memory', 'Overview'], ['/agents/memory/imports', 'Imports']]} breadcrumbs={[['/', 'Krate'], ['/agents', 'Agents'], ['/agents/memory', 'Memory'], ['/agents/memory/search', 'Search']]}>
    <DegradedBanner model={ui.model} />
    <div className="card">
      <div className="cardTitle"><h2>Search</h2><StatusPill tone="good">live</StatusPill></div>
      <MemorySearchForm org={activeOrg} />
    </div>
    <section className="routeGrid three">
      <div className="card">
        <div className="cardTitle"><h3>Graph</h3><StatusPill tone="neutral">mode</StatusPill></div>
        <p style={{ color: '#6b7280', fontSize: '0.8125rem' }}>Query structured records by node kind, traverse edges. Best for exploring relationships between services, teams, decisions, and runbooks.</p>
      </div>
      <div className="card">
        <div className="cardTitle"><h3>Grep</h3><StatusPill tone="neutral">mode</StatusPill></div>
        <p style={{ color: '#6b7280', fontSize: '0.8125rem' }}>Full-text search across markdown documents. Best for finding specific content, code references, or text patterns in stored knowledge.</p>
      </div>
      <div className="card">
        <div className="cardTitle"><h3>Graph + Grep</h3><StatusPill tone="neutral">mode</StatusPill></div>
        <p style={{ color: '#6b7280', fontSize: '0.8125rem' }}>Graph narrows candidates by node kind and edge traversal, then grep searches within matched documents. Best for targeted, precise queries.</p>
      </div>
    </section>
    <div className="card">
      <div className="cardTitle"><h3>Example AgentMemoryQuery resource</h3><StatusPill tone="neutral">reference</StatusPill></div>
      <pre style={{ background: '#1e1e2e', color: '#cdd6f4', padding: '1rem', borderRadius: '0.5rem', fontSize: '0.8125rem', lineHeight: '1.6', overflow: 'auto' }}><code>{exampleYaml}</code></pre>
    </div>
  </PageFrame>;
}

export async function AgentMemoryImportsPage({ org = null } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const memoryView = ui.model.agents?.memory || { imports: { items: [] } };
  const imports = memoryView.imports?.items || [];
  const awaitingReview = imports.filter((imp) => imp.status?.phase === 'AwaitingReview');
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/agents" eyebrow="memory imports" title="Memory imports" text="Review agent run memory imports as they progress through collection, redaction, normalization, and review phases." actions={[['/agents/memory', 'Overview'], ['/agents/memory/search', 'Search']]} breadcrumbs={[['/', 'Krate'], ['/agents', 'Agents'], ['/agents/memory', 'Memory'], ['/agents/memory/imports', 'Imports']]}>
    <DegradedBanner model={ui.model} />
    {awaitingReview.length > 0 && (
      <div className="card">
        <div className="cardTitle"><h2>Pending review</h2><StatusPill tone="info">{awaitingReview.length} awaiting</StatusPill></div>
        <MemoryImportReview org={activeOrg} imports={awaitingReview} />
      </div>
    )}
    <div className="card">
      <div className="cardTitle"><h2>All imports</h2><StatusPill tone={imports.length ? 'good' : 'neutral'}>{imports.length} imports</StatusPill></div>
      {imports.length ? <div className="resourceTable">
        <div className="resourceRow" style={{ fontWeight: 600, fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <span>Name</span><span>Source</span><span>Phase</span><span>Repository</span><span>Created</span>
        </div>
        {imports.map((imp) => <a key={imp.metadata?.name} href={orgHref(activeOrg, `/agents/memory/imports/${imp.metadata?.name}`)} className="resourceRow" style={{ textDecoration: 'none' }}>
          <strong>{imp.metadata?.name}</strong>
          <span>{imp.spec?.source?.kind || 'unknown'}{imp.spec?.source?.runId ? ` / ${imp.spec.source.runId}` : ''}</span>
          <StatusPill tone={imp.status?.phase === 'AwaitingReview' ? 'info' : imp.status?.phase === 'Merged' ? 'good' : imp.status?.phase === 'Rejected' || imp.status?.phase === 'Failed' ? 'danger' : imp.status?.phase && ['Collecting','Redacting','Normalizing','Validating'].includes(imp.status.phase) ? 'warn' : 'neutral'}>{imp.status?.phase || 'Pending'}</StatusPill>
          <span>{imp.spec?.source?.repositoryRef || imp.spec?.repositoryRef || 'unassigned'}</span>
          <small>{imp.metadata?.creationTimestamp || ''}</small>
        </a>)}
      </div> : <EmptyState title="No memory imports yet" text="Memory imports appear when agent runs produce knowledge artifacts. Each import progresses through collection, redaction, normalization, validation, and review before merging into a memory repository." cta={orgHref(activeOrg, '/agents/runs')} ctaLabel="Dispatch a run" />}
    </div>
  </PageFrame>;
}

export async function AgentMemoryImportDetailPage({ org = null, importId } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const memoryView = ui.model.agents?.memory || { imports: { items: [] } };
  const imp = (memoryView.imports?.items || []).find((i) => i.metadata?.name === importId) || null;
  const importPhaseTone = (phase) => {
    if (!phase || phase === 'Pending') return 'neutral';
    if (phase === 'Collecting' || phase === 'Redacting' || phase === 'Normalizing' || phase === 'Validating') return 'warn';
    if (phase === 'AwaitingReview') return 'info';
    if (phase === 'Merged') return 'good';
    if (phase === 'Rejected' || phase === 'Failed') return 'danger';
    return 'neutral';
  };
  const source = imp?.spec?.source || {};
  const includeConfig = imp?.spec?.include || {};
  const phaseTransitions = imp?.status?.phaseTransitions || imp?.status?.history || [];
  const allPhases = ['Pending', 'Collecting', 'Redacting', 'Normalizing', 'Validating', 'AwaitingReview', 'Merged'];
  const currentPhaseIndex = allPhases.indexOf(imp?.status?.phase);
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/agents" eyebrow={`memory import / ${importId}`} title={importId || 'Import detail'} text={imp ? `Memory import from ${source.kind || 'unknown source'} with phase ${imp.status?.phase || 'Pending'}.` : 'This memory import was not found in the current workspace.'} actions={[['/agents/memory/imports', 'All imports'], ['/agents/memory', 'Memory overview']]} breadcrumbs={[['/', 'Krate'], ['/agents', 'Agents'], ['/agents/memory', 'Memory'], ['/agents/memory/imports', 'Imports'], [`/agents/memory/imports/${importId}`, importId || 'Detail']]}>
    <DegradedBanner model={ui.model} />
    {imp ? <>
      <section className="routeGrid two">
        <div className="card">
          <div className="cardTitle"><h3>{importId}</h3><StatusPill tone={importPhaseTone(imp.status?.phase)}>{imp.status?.phase || 'Pending'}</StatusPill></div>
          <dl className="kv">
            <dt>Name</dt><dd>{imp.metadata?.name}</dd>
            <dt>Namespace</dt><dd>{imp.metadata?.namespace || ui.model.namespace}</dd>
            <dt>Created</dt><dd>{imp.metadata?.creationTimestamp || 'unknown'}</dd>
          </dl>
        </div>
        <div className="card">
          <div className="cardTitle"><h3>Source</h3><StatusPill tone="neutral">{source.kind || 'unknown'}</StatusPill></div>
          <dl className="kv">
            <dt>Kind</dt><dd>{source.kind || 'not specified'}</dd>
            <dt>Run ID</dt><dd>{source.runId || 'none'}</dd>
            <dt>Session ID</dt><dd>{source.sessionId || 'none'}</dd>
            <dt>Repository</dt><dd>{source.repositoryRef || imp.spec?.repositoryRef || 'unassigned'}</dd>
          </dl>
        </div>
      </section>
      <section className="routeGrid two">
        <div className="card">
          <div className="cardTitle"><h3>Include configuration</h3><StatusPill tone="neutral">spec</StatusPill></div>
          {Object.keys(includeConfig).length ? <ul className="compactList">{Object.entries(includeConfig).map(([key, value]) => <li key={key}><strong>{key}</strong>: {String(value)}</li>)}</ul> : <p className="emptyText">No include configuration specified. All available artifacts will be imported.</p>}
        </div>
        <div className="card">
          <div className="cardTitle"><h3>Lifecycle</h3><StatusPill tone={phaseTransitions.length ? 'good' : 'neutral'}>{phaseTransitions.length || allPhases.length} phases</StatusPill></div>
          {phaseTransitions.length ? <ul className="compactList">{phaseTransitions.map((entry, index) => <li key={index}>{entry.timestamp || entry.time || 'unknown'}: {entry.phase || entry.status || 'unknown'}{entry.reason ? ` / ${entry.reason}` : ''}</li>)}</ul> : <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>{allPhases.map((phase, index) => {
            const isComplete = currentPhaseIndex > index;
            const isCurrent = currentPhaseIndex === index;
            return <div key={phase} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: isComplete ? '#22c55e' : isCurrent ? '#eab308' : '#d1d5db', flexShrink: 0 }} />
              <span style={{ color: isComplete || isCurrent ? '#111827' : '#9ca3af', fontWeight: isCurrent ? 600 : 400 }}>{phase}</span>
            </div>;
          })}</div>}
        </div>
      </section>
      <div className="card">
        <div className="cardTitle"><h3>Actions</h3><StatusPill tone={imp.status?.phase === 'AwaitingReview' ? 'info' : 'neutral'}>{imp.status?.phase === 'AwaitingReview' ? 'review required' : 'read-only'}</StatusPill></div>
        <MemoryImportReview org={activeOrg} imports={[imp]} />
      </div>
    </> : <EmptyState title={`Import ${importId} not found`} text="This memory import does not exist in the current workspace. Memory imports are created when agent runs produce knowledge artifacts." cta={orgHref(activeOrg, '/agents/memory/imports')} ctaLabel="View all imports" />}
  </PageFrame>;
}

export async function AgentMemoryOntologyPage({ org = null } = {}) {
  const ui = await loadKrateUi(org);
  const activeOrg = ui.model.org?.slug || org || 'default';
  const memoryView = ui.model.agents?.memory || { ontologies: { count: 0, items: [] } };
  const ontologies = memoryView.ontologies?.items || [];
  const primaryOntology = ontologies[0] || null;
  return <PageFrame org={activeOrg} orgs={ui.model.orgs} currentPath="/agents" eyebrow="memory ontology" title="Memory ontology" text="Define graph schema for memory repositories, including supported node kinds and edge relationship types." actions={[['/agents/memory', 'Overview'], ['/agents/memory/search', 'Search']]} breadcrumbs={[['/', 'Krate'], ['/agents', 'Agents'], ['/agents/memory', 'Memory'], ['/agents/memory/ontology', 'Ontology']]}>
    <DegradedBanner model={ui.model} />
    {!primaryOntology && (
      <div className="card" style={{ borderLeft: '3px solid var(--color-info, #3b82f6)', marginBottom: '0.5rem' }}>
        <div className="cardTitle"><h3>No ontology configured</h3><StatusPill tone="neutral">new</StatusPill></div>
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>No AgentMemoryOntology resource exists yet. Use the editor below to define node kinds and edge kinds, then save to create one.</p>
      </div>
    )}
    {primaryOntology && (
      <div className="card" style={{ marginBottom: '0.5rem' }}>
        <div className="cardTitle"><h2>{primaryOntology.metadata?.name || 'default'}</h2><StatusPill tone="good">{primaryOntology.status?.phase || 'Active'}</StatusPill></div>
        <dl className="kv">
          <dt>Namespace</dt><dd>{primaryOntology.metadata?.namespace || ui.model.namespace}</dd>
          <dt>Node kinds</dt><dd>{(primaryOntology.spec?.nodeKinds || []).length}</dd>
          <dt>Edge kinds</dt><dd>{(primaryOntology.spec?.edgeKinds || []).length}</dd>
        </dl>
      </div>
    )}
    <MemoryOntologyEditor org={activeOrg} initialOntology={primaryOntology} />
  </PageFrame>;
}
