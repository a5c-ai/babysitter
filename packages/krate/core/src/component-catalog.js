export const KRATE_COMPONENTS = Object.freeze([
  { id: 'control-plane', title: 'Control Plane', area: 'api', resources: ['Repository', 'BranchProtection', 'RefPolicy'], evidence: ['src/control-plane.js', 'charts/krate/crds'] },
  { id: 'data-plane', title: 'Repository Data Plane', area: 'git', resources: ['Repository'], evidence: ['src/data-plane.js', 'src/gitea-backend.js', 'charts/krate/templates/gitea.yaml'] },
  { id: 'identity-policy', title: 'Identity, RBAC, and Policy', area: 'security', resources: ['BranchProtection', 'RefPolicy'], evidence: ['src/identity-policy.js', 'examples/policy-kyverno-pr-title.yaml'] },
  { id: 'runners-ci', title: 'Runners and CI', area: 'automation', resources: ['RunnerPool', 'Pipeline', 'Job'], evidence: ['src/runners-ci.js', 'docs/components/runners-ci.md'] },
  { id: 'hooks-events', title: 'Hooks and Events', area: 'integrations', resources: ['WebhookSubscription', 'WebhookDelivery'], evidence: ['src/hooks-events.js', 'docs/components/hooks-events.md'] },
  { id: 'operations-publishing', title: 'Operations and Publishing', area: 'release', resources: ['APIService', 'Deployment'], evidence: ['src/operations.js', 'charts/krate', 'scripts/setup-minikube.mjs'] },
  { id: 'web-ui', title: 'Web UI', area: 'experience', resources: ['View'], evidence: ['src/web-ui.js', 'public/index.html'] }
]);

export function createKrateComponentCatalog(demo) {
  const resourceKinds = new Set(Object.values(demo.resources).flatMap((value) => value?.kind ? [value.kind] : [value?.pipeline?.kind, ...(value?.jobs || []).map((job) => job.kind)]).filter(Boolean));
  return KRATE_COMPONENTS.map((component) => ({
    ...component,
    implemented: component.resources.some((kind) => resourceKinds.has(kind)) || component.id === 'operations-publishing' || component.id === 'web-ui',
    resourceCount: component.resources.filter((kind) => resourceKinds.has(kind)).length,
    docs: `docs/components/${component.id}.md`
  }));
}

export function createKrateLifecycleSnapshot(demo, { packageInfo = {}, generatedAt = new Date().toISOString() } = {}) {
  const catalog = createKrateComponentCatalog(demo);
  const smoke = demo.smoke || { ok: true, assertions: [] };
  return {
    project: 'Krate',
    version: packageInfo.version || '0.1.0',
    generatedAt,
    status: smoke.ok && catalog.every((component) => component.implemented) ? 'ready-for-local-development' : 'needs-attention',
    components: catalog,
    resources: Object.fromEntries(Object.entries(demo.resources).map(([name, value]) => [name, value?.kind || value?.pipeline?.kind || 'workflow'])),
    storage: demo.controlPlane.storageReport(),
    flows: demo.ui.dashboard.excellentFlows,
    operations: {
      chart: demo.operations.chartPackage.chart,
      setup: demo.operations.localSetup.script,
      releaseGates: demo.operations.releaseGates,
      observability: demo.operations.observability
    },
    validation: smoke.assertions.map(([name, passed]) => ({ name, passed }))
  };
}
