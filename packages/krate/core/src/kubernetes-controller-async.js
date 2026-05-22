// Async kubectl helpers for parallel snapshot fetching.
//
// Exports:
//  - runKubectlAsync       -- Promise-based kubectl wrapper using child_process.spawn
//  - getControllerSnapshotAsync -- parallel version of getControllerSnapshot
//  - getPartialSnapshot    -- query only a subset of resource kinds
//  - watchResourceChanges  -- lightweight watch that invalidates the snapshot cache

import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import {
  KRATE_API_GROUP,
  KRATE_API_VERSIONED_GROUP,
  KUBEVELA_API_GROUP,
  KYVERNO_API_GROUP,
  KYVERNO_POLICIES_API_GROUP,
  POLICY_REPORT_API_GROUP,
  KRATE_RESOURCES,
  KRATE_PLATFORM_NAMESPACE,
  findResourceDefinition,
  apiResourceName,
  orgNamespaceName
} from './kubernetes-controller.js';
import { clearSnapshotCache, setOrgCache } from './snapshot-cache.js';

// ---------------------------------------------------------------------------
// In-cluster kubectl args (same logic as the sync version, but using static
// node:fs imports instead of a lazy require helper).
// ---------------------------------------------------------------------------

function inClusterArgs(env) {
  if (String(env.KRATE_DISABLE_IN_CLUSTER_KUBECTL || '').toLowerCase() === 'true') return null;
  if (env.KUBECONFIG) return null;
  const host = env.KUBERNETES_SERVICE_HOST;
  const port = env.KUBERNETES_SERVICE_PORT || '443';
  if (!host) return null;
  const serviceAccountDir = env.KRATE_SERVICE_ACCOUNT_DIR || '/var/run/secrets/kubernetes.io/serviceaccount';
  const tokenPath = env.KRATE_SERVICE_ACCOUNT_TOKEN || `${serviceAccountDir}/token`;
  const caPath = env.KRATE_SERVICE_ACCOUNT_CA || `${serviceAccountDir}/ca.crt`;
  if (!existsSync(tokenPath) || !existsSync(caPath)) return null;
  const token = readFileSync(tokenPath, 'utf8').trim();
  if (!token) return null;
  return [
    `--server=https://${host}:${port}`,
    `--certificate-authority=${caPath}`,
    `--token=${token}`
  ];
}

function kubectlArgs(args, env) {
  const extra = inClusterArgs(env);
  return extra ? [...extra, ...args] : args;
}

function currentContextResult(env) {
  if (!inClusterArgs(env)) return null;
  return {
    ok: true,
    status: 0,
    signal: null,
    stdout: 'in-cluster\n',
    stderr: '',
    error: null,
    command: 'kubectl config current-context'
  };
}

// ---------------------------------------------------------------------------
// Low-level async kubectl runner
// ---------------------------------------------------------------------------

/**
 * Run a kubectl command asynchronously using child_process.spawn.
 * Returns a Promise that resolves to the same shape as runKubectl (sync).
 *
 * @param {string[]} args
 * @param {object} [options]
 * @param {string} [options.kubectl]
 * @param {number} [options.timeoutMs]
 * @param {object} [options.env]
 * @param {string} [options.input]
 * @param {boolean} [options.allowFailure]
 * @returns {Promise<{ok: boolean, status: number|null, signal: string|null, stdout: string, stderr: string, error: string|null, command: string}>}
 */
export function runKubectlAsync(args, options = {}) {
  const kubectl = options.kubectl || process.env.KRATE_KUBECTL || 'kubectl';
  const timeoutMs = Number(options.timeoutMs || process.env.KRATE_KUBECTL_TIMEOUT_MS || 3_000);
  const env = options.env || process.env;
  const command = `kubectl ${args.join(' ')}`;
  const effectiveArgs = kubectlArgs(args, env);

  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    let settled = false;

    const child = spawn(kubectl, effectiveArgs, {
      env,
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    if (options.input) {
      child.stdin.write(options.input);
    }
    child.stdin.end();

    child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try { child.kill('SIGTERM'); } catch { /* ignore */ }
      const result = {
        ok: false, status: null, signal: 'SIGTERM', stdout, stderr,
        error: `kubectl timed out after ${timeoutMs}ms`, command
      };
      if (options.allowFailure) resolve(result);
      else reject(new Error(result.error));
    }, timeoutMs);

    child.on('error', (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      const result = { ok: false, status: null, signal: null, stdout, stderr, error: error.message, command };
      if (options.allowFailure) resolve(result);
      else reject(error);
    });

    child.on('close', (code, signal) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      const ok = code === 0 && !signal;
      const result = { ok, status: code, signal: signal || null, stdout, stderr, error: null, command };
      if (!ok && !options.allowFailure) {
        const detail = (stderr || stdout || '').trim();
        reject(new Error(`${command}: ${detail || `exit ${code ?? 'unknown'}`}`));
      } else {
        resolve(result);
      }
    });
  });
}

// ---------------------------------------------------------------------------
// Parallel snapshot
// ---------------------------------------------------------------------------

/**
 * Fetch the full controller snapshot with all resource kinds queried in
 * parallel (Promise.all) instead of sequentially with spawnSync.
 *
 * Falls back to the synchronous getControllerSnapshot on any unexpected error.
 *
 * @param {object} [options]
 * @returns {Promise<object>}
 */
export async function getControllerSnapshotAsync(options = {}) {
  const kubectl = options.kubectl || process.env.KRATE_KUBECTL || 'kubectl';
  const namespace = options.namespace || process.env.KRATE_NAMESPACE || 'krate-system';
  const timeoutMs = Number(options.timeoutMs || process.env.KRATE_KUBECTL_TIMEOUT_MS || 3_000);
  const env = { ...process.env, ...(options.env || {}) };
  const correlationId = randomUUID();

  try {
    // Phase 1: context + version in parallel
    const inClusterContext = currentContextResult(env);
    const [contextResult, versionResult] = await Promise.all([
      inClusterContext || runKubectlAsync(['config', 'current-context'], { kubectl, timeoutMs, env, allowFailure: true }),
      runKubectlAsync(['version', '--client=true', '-o', 'json'], { kubectl, timeoutMs, env, allowFailure: true })
    ]);

    if (!contextResult.ok || !versionResult.ok) {
      return buildEmptySnapshot({ correlationId, namespace, kubectl, contextResult, versionResult, available: false });
    }

    // Phase 2: API service + CRD discovery in parallel
    const [apiServiceResult, crdResult] = await Promise.all([
      runKubectlAsync(['get', 'apiservice', KRATE_API_VERSIONED_GROUP, '-o', 'json'], { kubectl, timeoutMs, env, allowFailure: true }),
      runKubectlAsync(['get', 'crd', '-o', 'json'], { kubectl, timeoutMs, env, allowFailure: true })
    ]);

    if (!apiServiceResult.ok && !crdResult.ok) {
      return buildEmptySnapshot({ correlationId, namespace, kubectl, contextResult, versionResult, available: true });
    }

    const KYVERNO_DISCOVERY_GROUPS = new Set([KYVERNO_API_GROUP, KYVERNO_POLICIES_API_GROUP, POLICY_REPORT_API_GROUP]);
    const discoveredCrds = crdResult.ok
      ? parseKubernetesList(crdResult.stdout).items.filter((crd) =>
          [KRATE_API_GROUP, KUBEVELA_API_GROUP].includes(crd.spec?.group) ||
          KYVERNO_DISCOVERY_GROUPS.has(crd.spec?.group))
      : [];
    const discoveredPluralSet = new Set(
      discoveredCrds.map((crd) => `${crd.spec?.group || KRATE_API_GROUP}/${crd.spec?.names?.plural}`).filter(Boolean)
    );

    if (!apiServiceResult.ok && discoveredCrds.length === 0) {
      return buildEmptySnapshot({ correlationId, namespace, kubectl, contextResult, versionResult, available: true, apiServiceResult });
    }

    // Phase 3: list all resources in parallel
    const snapshotResources = KRATE_RESOURCES.filter((d) => d.storage !== 'core');
    const resources = Object.fromEntries(snapshotResources.map((d) => [d.kind, []]));

    const platformScopedDefs = snapshotResources.filter((d) => d.platformScoped);
    const orgScopedDefs = snapshotResources.filter((d) => !d.platformScoped);

    // Fetch platform-scoped resources first so we can derive org namespaces
    const platformResults = await Promise.all(
      platformScopedDefs
        .filter((d) => shouldListSnapshotDefinition(d, discoveredPluralSet))
        .map(async (definition) => {
          const resourceNamespace = definition.namespace || namespace;
          const result = await runKubectlAsync(
            ['get', apiResourceName(definition), ...namespaceArgs(definition, resourceNamespace), '-o', 'json', '--ignore-not-found'],
            { kubectl, timeoutMs, env, allowFailure: true }
          );
          return { definition, result };
        })
    );

    for (const { definition, result } of platformResults) {
      resources[definition.kind] = result.ok ? parseKubernetesList(result.stdout).items : [];
    }

    const orgNamespaces = resolveOrgNamespaces(resources.Organization, resources.OrgNamespaceBinding, namespace);

    // Fetch org-scoped resources in parallel
    const orgResults = await Promise.all(
      orgScopedDefs
        .filter((d) => shouldListSnapshotDefinition(d, discoveredPluralSet))
        .map(async (definition) => {
          const namespaces = definition.namespaced === false
            ? [null]
            : [definition.namespace || null].filter(Boolean).concat(definition.namespace ? [] : orgNamespaces);

          const itemArrays = await Promise.all(
            namespaces.map(async (resourceNamespace) => {
              const effectiveNamespace = resourceNamespace || namespace;
              const result = await runKubectlAsync(
                ['get', apiResourceName(definition), ...namespaceArgs(definition, effectiveNamespace), '-o', 'json', '--ignore-not-found'],
                { kubectl, timeoutMs, env, allowFailure: true }
              );
              return result.ok ? parseKubernetesList(result.stdout).items : [];
            })
          );
          return { definition, items: itemArrays.flat() };
        })
    );

    for (const { definition, items } of orgResults) {
      resources[definition.kind] = items;
    }

    const eventsResult = await runKubectlAsync(
      ['get', 'events', '-n', namespace, '-o', 'json', '--ignore-not-found'],
      { kubectl, timeoutMs, env, allowFailure: true }
    );

    return {
      source: 'kubernetes',
      mode: 'kubernetes-api',
      namespace,
      generatedAt: new Date().toISOString(),
      correlationId,
      kubectl: {
        binary: kubectl,
        context: contextResult.stdout.trim(),
        clientVersion: safeJson(versionResult.stdout)?.clientVersion?.gitVersion || null,
        available: true,
        errors: []
      },
      apiService: apiServiceResult.ok ? safeJson(apiServiceResult.stdout) : null,
      crds: discoveredCrds,
      resources,
      kyverno: emptyKyverno(),
      events: eventsResult.ok ? parseKubernetesList(eventsResult.stdout).items : [],
      permissions: [],
      storage: storageBoundaries(),
      commands: []
    };
  } catch (error) {
    // Fallback to synchronous snapshot
    const { getControllerSnapshot } = await import('./kubernetes-controller.js');
    return getControllerSnapshot(options);
  }
}

// ---------------------------------------------------------------------------
// Partial snapshot
// ---------------------------------------------------------------------------

/**
 * Fetch only the requested resource kinds from Kubernetes.
 * Useful for pages that only need a subset (e.g. only AgentStack, AgentSession).
 *
 * @param {string[]} kinds - Array of kind names or plurals to query
 * @param {object} [options]
 * @returns {Promise<object>} Snapshot with only the requested resource keys populated
 */
export async function getPartialSnapshot(kinds = [], options = {}) {
  if (!Array.isArray(kinds) || kinds.length === 0) {
    return { source: 'kubernetes', mode: 'partial', resources: {}, generatedAt: new Date().toISOString() };
  }

  const kubectl = options.kubectl || process.env.KRATE_KUBECTL || 'kubectl';
  const namespace = options.namespace || process.env.KRATE_NAMESPACE || 'krate-system';
  const timeoutMs = Number(options.timeoutMs || process.env.KRATE_KUBECTL_TIMEOUT_MS || 3_000);
  const env = { ...process.env, ...(options.env || {}) };

  // Resolve requested kinds to definition objects (ignore unknown)
  const requestedDefs = kinds
    .map((k) => { try { return findResourceDefinition(k); } catch { return null; } })
    .filter(Boolean);

  const resources = Object.fromEntries(requestedDefs.map((d) => [d.kind, []]));

  // Determine org namespaces only when necessary
  const needsOrgNs = requestedDefs.some((d) => !d.platformScoped && d.namespaced !== false && !d.namespace);
  let orgNamespaces = [namespace];

  if (needsOrgNs) {
    try {
      const orgDef = findResourceDefinition('Organization');
      const bindingDef = findResourceDefinition('OrgNamespaceBinding');
      const [orgResult, bindingResult] = await Promise.all([
        runKubectlAsync(['get', apiResourceName(orgDef), '-n', namespace, '-o', 'json', '--ignore-not-found'], { kubectl, timeoutMs, env, allowFailure: true }),
        runKubectlAsync(['get', apiResourceName(bindingDef), '-n', namespace, '-o', 'json', '--ignore-not-found'], { kubectl, timeoutMs, env, allowFailure: true })
      ]);
      orgNamespaces = resolveOrgNamespaces(
        orgResult.ok ? parseKubernetesList(orgResult.stdout).items : [],
        bindingResult.ok ? parseKubernetesList(bindingResult.stdout).items : [],
        namespace
      );
    } catch {
      orgNamespaces = [namespace];
    }
  }

  // Fetch all requested definitions in parallel
  await Promise.all(requestedDefs.map(async (definition) => {
    const namespaces = definition.namespaced === false
      ? [null]
      : definition.platformScoped
        ? [definition.namespace || namespace]
        : [definition.namespace || null].filter(Boolean).concat(definition.namespace ? [] : orgNamespaces);

    const itemArrays = await Promise.all(
      namespaces.map(async (resourceNamespace) => {
        const effectiveNamespace = resourceNamespace || namespace;
        const result = await runKubectlAsync(
          ['get', apiResourceName(definition), ...namespaceArgs(definition, effectiveNamespace), '-o', 'json', '--ignore-not-found'],
          { kubectl, timeoutMs, env, allowFailure: true }
        );
        return result.ok ? parseKubernetesList(result.stdout).items : [];
      })
    );
    resources[definition.kind] = itemArrays.flat();
  }));

  return {
    source: 'kubernetes',
    mode: 'partial',
    namespace,
    generatedAt: new Date().toISOString(),
    resources
  };
}

// ---------------------------------------------------------------------------
// Watch resource changes
// ---------------------------------------------------------------------------

/**
 * Watch key resource kinds with `kubectl get --watch -o json`.
 * On any change event, the snapshot cache is cleared so the next read
 * triggers a fresh fetch.
 *
 * @param {Function} callback - Called with (kind, item) on each watch event
 * @param {object} [options]
 * @param {string[]} [options.kinds] - Defaults to ['Organization', 'AgentStack', 'AgentSession']
 * @returns {{ stop: () => void }} Cleanup handle
 */
export function watchResourceChanges(callback, options = {}) {
  const kubectl = options.kubectl || process.env.KRATE_KUBECTL || 'kubectl';
  const namespace = options.namespace || process.env.KRATE_NAMESPACE || 'krate-system';
  const env = { ...process.env, ...(options.env || {}) };
  const watchKinds = options.kinds || ['Organization', 'AgentStack', 'AgentSession'];

  const children = [];

  for (const kind of watchKinds) {
    let definition;
    try { definition = findResourceDefinition(kind); } catch { continue; }

    const resourceNamespace = definition.namespace || namespace;
    const args = [
      'get', apiResourceName(definition),
      ...namespaceArgs(definition, resourceNamespace),
      '--watch', '-o', 'json'
    ];

    const child = spawn(kubectl, kubectlArgs(args, env), {
      env,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let buffer = '';
    child.stdout.on('data', (chunk) => {
      buffer += chunk.toString();
      let newlineIdx;
      while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newlineIdx).trim();
        buffer = buffer.slice(newlineIdx + 1);
        if (!line) continue;
        const item = safeJson(line);
        if (item) {
          // Invalidate the snapshot cache so the next read fetches fresh data
          clearSnapshotCache();
          try { callback(kind, item); } catch { /* user callback errors are non-fatal */ }
        }
      }
    });

    children.push(child);
  }

  return {
    stop() {
      for (const child of children) {
        try { child.kill('SIGTERM'); } catch { /* ignore */ }
      }
      children.length = 0;
    }
  };
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

function namespaceArgs(definition, namespace) {
  return definition.namespaced === false ? [] : ['-n', namespace];
}

function shouldListSnapshotDefinition(definition, discoveredPluralSet) {
  const group = definition.group || KRATE_API_GROUP;
  if (discoveredPluralSet.has(`${group}/${definition.plural}`)) return true;
  return group === KRATE_API_GROUP;
}

function parseKubernetesList(stdout) {
  const parsed = safeJson(stdout);
  if (!parsed) return { items: [] };
  if (Array.isArray(parsed.items)) return parsed;
  if (parsed.kind && parsed.metadata) return { items: [parsed] };
  return { items: [] };
}

function safeJson(text) {
  try { return text ? JSON.parse(text) : null; }
  catch { return null; }
}

function resolveOrgNamespaces(organizations = [], bindings = [], fallbackNamespace = KRATE_PLATFORM_NAMESPACE) {
  const namespaces = [...new Set([
    ...organizations.map((o) => o.spec?.namespaceName || o.metadata?.labels?.['krate.a5c.ai/namespace']).filter(Boolean),
    ...bindings.map((b) => b.spec?.namespace || b.metadata?.labels?.['krate.a5c.ai/namespace']).filter(Boolean)
  ])];
  if (namespaces.length) return namespaces;
  const fallbackOrgs = new Set();
  const adminOrg = process.env.KRATE_ADMIN_ORG;
  const defaultOrg = process.env.KRATE_ORG || 'default';
  if (adminOrg) fallbackOrgs.add(orgNamespaceName(adminOrg));
  fallbackOrgs.add(orgNamespaceName(defaultOrg));
  return fallbackOrgs.size ? [...fallbackOrgs] : [fallbackNamespace];
}

function storageBoundaries() {
  return {
    etcd: 'Krate CRDs: Organization, Repository, SSHKey, RepositoryPermission, BranchProtection, RefPolicy, WebhookSubscription, RunnerPool, View, Selector',
    kubevela: 'Krate deployment CRDs: Application, ApplicationRevision, ComponentDefinition, WorkloadDefinition, TraitDefinition, ScopeDefinition, PolicyDefinition, Policy, WorkflowStepDefinition, Workflow, ResourceTracker',
    postgres: 'Aggregated API resources: PullRequest, Issue, Review, Pipeline, Job, WebhookDelivery',
    repositories: 'Repository backend Deployment, repository storage, and integration plans',
    objects: 'Object storage referenced by Repository specs and Pipeline artifacts'
  };
}

function emptyKyverno() {
  return {
    mode: 'auto',
    detected: false,
    resources: {},
    reports: { policyReports: [], clusterPolicyReports: [], results: [], violations: [] },
    permissions: [],
    degraded: [],
    controllers: []
  };
}

function buildEmptySnapshot({ correlationId, namespace, kubectl, contextResult, versionResult, available, apiServiceResult }) {
  return {
    source: 'kubernetes',
    mode: 'kubernetes-api',
    namespace,
    generatedAt: new Date().toISOString(),
    correlationId,
    kubectl: {
      binary: kubectl,
      context: contextResult?.ok ? contextResult.stdout.trim() : null,
      clientVersion: versionResult?.ok ? safeJson(versionResult.stdout)?.clientVersion?.gitVersion || null : null,
      available: Boolean(available),
      errors: [contextResult, versionResult, apiServiceResult]
        .filter((r) => r && !r.ok)
        .map((r) => `${r.command}: ${(r.stderr || r.error || '').trim() || `exit ${r.status}`}`)
    },
    apiService: null,
    crds: [],
    resources: Object.fromEntries(KRATE_RESOURCES.filter((d) => d.storage !== 'core').map((d) => [d.kind, []])),
    kyverno: emptyKyverno(),
    events: [],
    permissions: [],
    storage: storageBoundaries(),
    commands: []
  };
}
