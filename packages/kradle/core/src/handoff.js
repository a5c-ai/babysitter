export const HANDOFF_COMMANDS = Object.freeze({
  build: 'npm run build',
  demo: 'npm run demo',
  serve: 'npm run serve',
  check: 'npm run check',
  test: 'npm test',
  smoke: 'npm run smoke',
  validateDocs: 'npm run validate:docs',
  e2e: 'npm run e2e',
  packageCheck: 'npm run package:check',
  setupMinikube: 'npm run setup:minikube -- --dry-run',
  dev: 'npm run dev',
  uiBuild: 'npm run ui:build',
  uiValidate: 'npm run ui:validate'
});

export const HANDOFF_DOCS = Object.freeze([
  'docs/README.md',
  'docs/product-requirements.md',
  'docs/system-requirements.md',
  'docs/architecture-spec.md',
  'docs/user-stories.md',
  'docs/roadmap-mvp.md',
  'docs/local-minikube.md',
  'docs/install.md',
  'docs/ontology/README.md'
]);

export function createKradleHandoffSummary(demo, { packageInfo = {}, generatedAt = new Date().toISOString() } = {}) {
  const smoke = demo.smoke || { ok: true, assertions: [] };
  return {
    project: 'Kradle',
    description: 'Kubernetes-native forge runtime with Argo CD and Kradle-managed repository hosting',
    package: {
      name: packageInfo.name || 'kradle',
      version: packageInfo.version || '0.1.0',
      private: packageInfo.private !== false
    },
    entrypoints: {
      library: './src/index.js',
      cli: './bin/kradle-demo.mjs',
      runtimeServer: './bin/kradle-server.mjs',
      webPreview: './public/index.html',
      nextUi: './apps/web',
      generatedSummary: './dist/kradle-summary.json',
      lifecycleSnapshot: './dist/kradle-lifecycle.json',
      helmChart: './charts/kradle',
      minikubeSetup: './scripts/setup-minikube.mjs'
    },
    commands: { ...HANDOFF_COMMANDS },
    docs: [...HANDOFF_DOCS],
    components: demo.components || [],
    lifecycle: demo.lifecycle || null,
    resources: Object.fromEntries(Object.entries(demo.resources).map(([key, value]) => [key, value?.kind || 'workflow'])),
    storage: demo.controlPlane.storageReport(),
    excellentFlows: demo.ui.dashboard.excellentFlows,
    agents: demo.agents ? {
      stacks: demo.agents.stacks?.count || 0,
      runs: demo.agents.runs?.count || 0,
      activeRuns: demo.agents.runs?.active?.length || 0,
      rules: demo.agents.rules?.count || 0,
      sessions: demo.agents.sessions?.count || 0,
      workspaces: demo.agents.workspaces?.count || 0,
      pendingApprovals: demo.agents.approvals?.pending?.length || 0
    } : null,
    operations: { chartPackage: demo.operations.chartPackage, localSetup: demo.operations.localSetup },
    releaseGates: demo.operations.releaseGates,
    smoke: {
      ok: smoke.ok,
      assertions: smoke.assertions.map(([name, passed]) => ({ name, passed }))
    },
    generatedAt
  };
}

export function formatHandoffSummary(summary) {
  const lines = [
    `${summary.project} ${summary.package.version} — ${summary.description}`,
    '',
    'Entrypoints:',
    ...Object.entries(summary.entrypoints).map(([name, target]) => `- ${name}: ${target}`),
    '',
    'Commands:',
    ...Object.entries(summary.commands).map(([name, command]) => `- ${name}: ${command}`),
    '',
    'Storage boundary:',
    `- etcd: ${summary.storage.etcd.join(', ')}`,
    `- postgres: ${summary.storage.postgres.join(', ')}`,
    '',
    'Excellent flows:',
    ...summary.excellentFlows.map((flow) => `- ${flow}`),
    '',
    `Smoke: ${summary.smoke.ok ? 'pass' : 'fail'}`
  ];
  return `${lines.join('\n')}\n`;
}


