import { createResource, clone } from './resource-model.js';

export const AGENT_WORKSPACE_CONTROLLER_BOUNDARY = {
  role: 'agent-workspace-controller',
  scope: 'Volume-backed git workspace provisioning with PVC lifecycle, git ops, runner mount, reuse, codespace management, and workspace associations',
  owns: ['workspace creation', 'PVC manifest generation', 'git command specs', 'mount specs', 'workspace reuse', 'codespace lifecycle', 'workspace associations', 'run history'],
  delegatesTo: ['resource-model'],
  mustNotOwn: ['git execution', 'Kubernetes API calls', 'secret values']
};

export function createAgentWorkspaceController() {
  return {
    role: 'agent-workspace-controller',

    // --- Volume lifecycle ---

    createWorkspace({ name, organizationRef, repository, volumeSpec = {}, branch, namespace = 'default' }) {
      if (!organizationRef) {
        return { error: true, reason: 'missing-org', message: 'organizationRef is required' };
      }
      if (!repository) {
        return { error: true, reason: 'missing-repository', message: 'repository is required' };
      }

      const workspaceName = name || `ws-${repository.replace(/[^a-z0-9-]/gi, '-').toLowerCase()}-${Date.now()}`;
      const pvcName = `krate-ws-${workspaceName}`;
      const storageClassName = volumeSpec.storageClassName || 'standard';
      const capacity = volumeSpec.capacity || '10Gi';
      const accessModes = volumeSpec.accessModes || ['ReadWriteOnce'];

      const workspace = createResource('KrateWorkspace', { name: workspaceName, namespace }, {
        organizationRef,
        repository,
        volumeSpec: {
          storageClassName,
          capacity,
          accessModes,
        },
        branch: branch || 'main',
        pvcName,
      });
      workspace.status = {
        phase: 'Pending',
        volumeStatus: 'Pending',
        createdAt: new Date().toISOString(),
      };

      const pvcManifest = {
        apiVersion: 'v1',
        kind: 'PersistentVolumeClaim',
        metadata: {
          name: pvcName,
          namespace,
          labels: {
            'krate.a5c.ai/workspace': workspaceName,
            'krate.a5c.ai/org': organizationRef,
          },
        },
        spec: {
          storageClassName,
          accessModes,
          resources: {
            requests: { storage: capacity },
          },
        },
      };

      return { error: false, workspace, pvcManifest };
    },

    deleteWorkspace({ name, namespace = 'default', resources = {} }) {
      if (!name) {
        return { error: true, reason: 'missing-name', message: 'workspace name is required' };
      }

      const workspaces = resources.KrateWorkspace || [];
      const workspace = workspaces.find((w) => w.metadata?.name === name);
      if (!workspace) {
        return { error: true, reason: 'not-found', message: `KrateWorkspace not found: ${name}` };
      }

      const pvcName = workspace.spec?.pvcName || `krate-ws-${name}`;
      const updated = clone(workspace);
      updated.status = {
        ...updated.status,
        phase: 'Terminating',
        terminatingAt: new Date().toISOString(),
      };

      const pvcDeleteManifest = {
        apiVersion: 'v1',
        kind: 'PersistentVolumeClaim',
        metadata: {
          name: pvcName,
          namespace: workspace.metadata?.namespace || namespace,
        },
        action: 'delete',
      };

      return { error: false, workspace: updated, pvcDeleteManifest };
    },

    getWorkspaceStatus({ name, resources = {} }) {
      if (!name) {
        return { error: true, reason: 'missing-name', message: 'workspace name is required' };
      }

      const workspaces = resources.KrateWorkspace || [];
      const workspace = workspaces.find((w) => w.metadata?.name === name);
      if (!workspace) {
        return { error: true, reason: 'not-found', message: `KrateWorkspace not found: ${name}` };
      }

      return {
        error: false,
        name,
        volumeStatus: workspace.status?.volumeStatus || 'Pending',
        phase: workspace.status?.phase || 'Pending',
        repository: workspace.spec?.repository,
        branch: workspace.spec?.branch,
        runRef: workspace.status?.runRef || null,
        pvcName: workspace.spec?.pvcName,
        capacity: workspace.spec?.volumeSpec?.capacity,
      };
    },

    // --- Git operations (intent-based) ---

    initializeWorkspace({ workspace, mountPath = '/workspace' }) {
      if (!workspace) {
        return { error: true, reason: 'missing-workspace', message: 'workspace resource is required' };
      }

      const repoUrl = workspace.spec?.repository || '';
      const isSsh = repoUrl.startsWith('git@') || repoUrl.includes('ssh://');

      const env = {};
      if (isSsh) {
        env.GIT_SSH_COMMAND = 'ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null';
      }

      return {
        error: false,
        commandSpec: {
          command: 'git',
          args: ['clone', repoUrl, mountPath],
          env,
        },
      };
    },

    checkoutBranch({ workspace, branch }) {
      if (!workspace) {
        return { error: true, reason: 'missing-workspace', message: 'workspace resource is required' };
      }
      if (!branch) {
        return { error: true, reason: 'missing-branch', message: 'branch is required' };
      }

      return {
        error: false,
        commandSpec: {
          command: 'git',
          args: ['checkout', branch],
          cwd: '/workspace',
        },
      };
    },

    syncWorkspace({ workspace }) {
      if (!workspace) {
        return { error: true, reason: 'missing-workspace', message: 'workspace resource is required' };
      }

      const branch = workspace.spec?.branch || 'main';

      return {
        error: false,
        commandSpecs: [
          {
            command: 'git',
            args: ['fetch', 'origin'],
            cwd: '/workspace',
          },
          {
            command: 'git',
            args: ['reset', '--hard', `origin/${branch}`],
            cwd: '/workspace',
          },
        ],
      };
    },

    // --- Runner mount spec ---

    getMountSpec({ workspace }) {
      if (!workspace) {
        return { error: true, reason: 'missing-workspace', message: 'workspace resource is required' };
      }

      const pvcName = workspace.spec?.pvcName || `krate-ws-${workspace.metadata?.name}`;

      return {
        error: false,
        volume: {
          name: 'workspace',
          persistentVolumeClaim: { claimName: pvcName },
        },
        volumeMount: {
          name: 'workspace',
          mountPath: '/workspace',
        },
      };
    },

    // --- Workspace reuse ---

    findReusableWorkspace({ organizationRef, repository, branch, resources = {} }) {
      const workspaces = resources.KrateWorkspace || [];
      const match = workspaces.find((w) =>
        w.spec?.organizationRef === organizationRef &&
        w.spec?.repository === repository &&
        (w.spec?.branch || 'main') === (branch || 'main') &&
        w.status?.phase === 'Ready'
      );

      return match ? clone(match) : null;
    },

    claimWorkspace({ name, runRef, resources = {} }) {
      if (!name) {
        return { error: true, reason: 'missing-name', message: 'workspace name is required' };
      }
      if (!runRef) {
        return { error: true, reason: 'missing-run-ref', message: 'runRef is required' };
      }

      const workspaces = resources.KrateWorkspace || [];
      const workspace = workspaces.find((w) => w.metadata?.name === name);
      if (!workspace) {
        return { error: true, reason: 'not-found', message: `KrateWorkspace not found: ${name}` };
      }

      if (workspace.status?.phase === 'InUse') {
        return { error: true, reason: 'already-in-use', message: `KrateWorkspace ${name} is already in use by ${workspace.status.runRef}` };
      }

      const updated = clone(workspace);
      updated.status = {
        ...updated.status,
        phase: 'InUse',
        runRef,
        claimedAt: new Date().toISOString(),
      };

      return { error: false, workspace: updated };
    },

    releaseWorkspace({ name, resources = {} }) {
      if (!name) {
        return { error: true, reason: 'missing-name', message: 'workspace name is required' };
      }

      const workspaces = resources.KrateWorkspace || [];
      const workspace = workspaces.find((w) => w.metadata?.name === name);
      if (!workspace) {
        return { error: true, reason: 'not-found', message: `KrateWorkspace not found: ${name}` };
      }

      if (workspace.status?.phase !== 'InUse') {
        return { error: true, reason: 'not-in-use', message: `KrateWorkspace ${name} is not in use (current phase: ${workspace.status?.phase || 'Unknown'})` };
      }

      const updated = clone(workspace);
      updated.status = {
        ...updated.status,
        phase: 'Ready',
        runRef: undefined,
        claimedAt: undefined,
        releasedAt: new Date().toISOString(),
      };

      return { error: false, workspace: updated };
    },

    // --- Legacy compat helpers ---

    provisionWorkspace({ repository, ref, branch, dispatchRun, policy, namespace = 'default', organizationRef = 'default' }) {
      if (!repository) {
        return { error: true, reason: 'missing-repository', message: 'repository is required' };
      }
      if (!dispatchRun) {
        return { error: true, reason: 'missing-dispatch-run', message: 'dispatchRun is required' };
      }

      const result = this.createWorkspace({
        organizationRef,
        repository,
        branch: branch || 'main',
        namespace,
        volumeSpec: {},
      });

      if (result.error) return result;

      // Mark as InUse with the dispatch run
      result.workspace.status.phase = 'InUse';
      result.workspace.status.runRef = dispatchRun;
      result.workspace.status.volumeStatus = 'Bound';

      const runtimeName = `rt-${result.workspace.metadata.name}`;
      const runtime = createResource('KrateWorkspaceRuntime', { name: runtimeName, namespace }, {
        organizationRef,
        workspaceRef: result.workspace.metadata.name,
        status: 'provisioning'
      });
      runtime.status = { phase: 'Provisioning', createdAt: new Date().toISOString() };

      return { error: false, workspace: result.workspace, runtime, pvcManifest: result.pvcManifest };
    },

    archiveWorkspace({ workspaceName, reason, resources = {} }) {
      if (!workspaceName) {
        return { error: true, reason: 'missing-workspace-name', message: 'workspaceName is required' };
      }

      const workspaces = resources.KrateWorkspace || [];
      const workspace = workspaces.find((w) => w.metadata?.name === workspaceName);
      if (!workspace) {
        return { error: true, reason: 'not-found', message: `KrateWorkspace not found: ${workspaceName}` };
      }

      const now = new Date().toISOString();
      const updated = clone(workspace);
      updated.status = {
        ...updated.status,
        phase: 'Archived',
        archivedAt: now,
        archiveReason: reason || 'No reason provided'
      };

      return { error: false, workspace: updated };
    },

    recoverWorkspace({ workspaceName, resources = {} }) {
      if (!workspaceName) {
        return { error: true, reason: 'missing-workspace-name', message: 'workspaceName is required' };
      }

      const workspaces = resources.KrateWorkspace || [];
      const workspace = workspaces.find((w) => w.metadata?.name === workspaceName);
      if (!workspace) {
        return { error: true, reason: 'not-found', message: `KrateWorkspace not found: ${workspaceName}` };
      }

      if (workspace.status?.phase !== 'Archived') {
        return { error: true, reason: 'not-archived', message: `KrateWorkspace ${workspaceName} is not archived (current phase: ${workspace.status?.phase || 'Unknown'})` };
      }

      const updated = clone(workspace);
      updated.status = {
        ...updated.status,
        phase: 'Active',
        archivedAt: undefined,
        archiveReason: undefined
      };

      return { error: false, workspace: updated };
    },

    bindSession({ workspaceName, sessionRef, agent, namespace = 'default', organizationRef = 'default', resources = {} }) {
      if (!workspaceName) {
        return { error: true, reason: 'missing-workspace-name', message: 'workspaceName is required' };
      }
      if (!sessionRef) {
        return { error: true, reason: 'missing-session-ref', message: 'sessionRef is required' };
      }

      const workspaces = resources.KrateWorkspace || [];
      const workspace = workspaces.find((w) => w.metadata?.name === workspaceName);
      if (!workspace) {
        return { error: true, reason: 'not-found', message: `KrateWorkspace not found: ${workspaceName}` };
      }

      const updated = clone(workspace);
      if (!updated.status) updated.status = {};
      if (!Array.isArray(updated.status.boundSessions)) updated.status.boundSessions = [];
      updated.status.boundSessions.push({
        sessionRef,
        agent: agent || undefined,
        boundAt: new Date().toISOString()
      });

      return { error: false, workspace: updated };
    },

    linkWorkItem({ workspaceName, workItemRef, workItemKind, namespace = 'default', organizationRef = 'default' }) {
      if (!workspaceName) {
        return { error: true, reason: 'missing-workspace-name', message: 'workspaceName is required' };
      }
      if (!workItemRef) {
        return { error: true, reason: 'missing-work-item-ref', message: 'workItemRef is required' };
      }

      const linkName = `wiwl-${workspaceName}-${workItemRef}-${Date.now()}`;
      const link = createResource('WorkItemWorkspaceLink', { name: linkName, namespace }, {
        organizationRef,
        workItemRef,
        workItemKind: workItemKind || 'Issue',
        workspace: workspaceName
      });
      link.status = { phase: 'Active', createdAt: new Date().toISOString() };

      return { error: false, link };
    },

    linkWorkItemToSession({ workItemRef, workItemKind, sessionRef, namespace = 'default', organizationRef = 'default' }) {
      if (!workItemRef) {
        return { error: true, reason: 'missing-work-item-ref', message: 'workItemRef is required' };
      }
      if (!sessionRef) {
        return { error: true, reason: 'missing-session-ref', message: 'sessionRef is required' };
      }

      const linkName = `wisl-${sessionRef}-${workItemRef}-${Date.now()}`;
      const link = createResource('WorkItemSessionLink', { name: linkName, namespace }, {
        organizationRef,
        workItemRef,
        workItemKind: workItemKind || 'Issue',
        agentSession: sessionRef
      });
      link.status = { phase: 'Active', createdAt: new Date().toISOString() };

      return { error: false, link };
    },

    listWorkspacesForRepo({ repository, resources = {} }) {
      const workspaces = resources.KrateWorkspace || [];
      return workspaces.filter((w) => w.spec?.repository === repository).map(clone);
    },

    listWorkspacesForRun({ dispatchRun, resources = {} }) {
      const workspaces = resources.KrateWorkspace || [];
      return workspaces.filter((w) => w.status?.runRef === dispatchRun).map(clone);
    },

    // --- Codespace lifecycle ---

    launchCodespace(workspace, options = {}) {
      if (!workspace) {
        return { error: true, reason: 'missing-workspace', message: 'workspace is required' };
      }

      // Only one codespace per workspace
      if (workspace.status?.codespace?.running) {
        return { error: true, reason: 'codespace-already-running', message: `Codespace already running for workspace ${workspace.metadata?.name}` };
      }

      const wsName = workspace.metadata?.name || 'unknown';
      const namespace = workspace.metadata?.namespace || 'default';
      const orgRef = workspace.spec?.organizationRef || 'default';
      const pvcName = workspace.spec?.pvcName || `krate-ws-${wsName}`;
      const image = options.image || 'codercom/code-server:latest';
      const cpuLimit = options.cpu || '1';
      const memoryLimit = options.memory || '2Gi';
      const port = options.port || 8080;
      const passwordSecretRef = options.passwordSecretRef || null;

      const podName = `codespace-${wsName}`;
      const serviceName = `codespace-svc-${wsName}`;

      const podSpec = {
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: {
          name: podName,
          namespace,
          labels: {
            'krate.a5c.ai/workspace': wsName,
            'krate.a5c.ai/org': orgRef,
            'krate.a5c.ai/component': 'codespace',
          },
        },
        spec: {
          containers: [
            {
              name: 'code-server',
              image,
              ports: [{ containerPort: port, name: 'http' }],
              resources: {
                limits: { cpu: cpuLimit, memory: memoryLimit },
                requests: { cpu: '250m', memory: '512Mi' },
              },
              env: [
                { name: 'KRATE_WORKSPACE', value: wsName },
                { name: 'KRATE_ORG', value: orgRef },
                { name: 'GIT_AUTHOR_NAME', value: options.gitAuthorName || 'krate-agent' },
                { name: 'GIT_AUTHOR_EMAIL', value: options.gitAuthorEmail || `agent@${orgRef}.krate.local` },
              ],
              volumeMounts: [
                { name: 'workspace', mountPath: '/workspace' },
              ],
            },
          ],
          volumes: [
            {
              name: 'workspace',
              persistentVolumeClaim: { claimName: pvcName },
            },
          ],
          restartPolicy: 'Always',
        },
      };

      if (passwordSecretRef) {
        podSpec.spec.containers[0].env.push({
          name: 'PASSWORD',
          valueFrom: { secretKeyRef: passwordSecretRef },
        });
      }

      const serviceSpec = {
        apiVersion: 'v1',
        kind: 'Service',
        metadata: {
          name: serviceName,
          namespace,
          labels: {
            'krate.a5c.ai/workspace': wsName,
            'krate.a5c.ai/org': orgRef,
            'krate.a5c.ai/component': 'codespace',
          },
        },
        spec: {
          selector: {
            'krate.a5c.ai/workspace': wsName,
            'krate.a5c.ai/component': 'codespace',
          },
          ports: [
            { port, targetPort: port, protocol: 'TCP', name: 'http' },
          ],
          type: 'ClusterIP',
        },
      };

      const codespaceUrl = `http://${serviceName}.${namespace}.svc.cluster.local:${port}`;

      return { error: false, podSpec, serviceSpec, codespaceUrl };
    },

    stopCodespace(workspace) {
      if (!workspace) {
        return { error: true, reason: 'missing-workspace', message: 'workspace is required' };
      }

      const wsName = workspace.metadata?.name || 'unknown';
      const namespace = workspace.metadata?.namespace || 'default';

      const podDeleteManifest = {
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: { name: `codespace-${wsName}`, namespace },
        action: 'delete',
      };

      const serviceDeleteManifest = {
        apiVersion: 'v1',
        kind: 'Service',
        metadata: { name: `codespace-svc-${wsName}`, namespace },
        action: 'delete',
      };

      return { error: false, podDeleteManifest, serviceDeleteManifest };
    },

    getCodespaceStatus(workspace, podStatus = null) {
      if (!workspace) {
        return { error: true, reason: 'missing-workspace', message: 'workspace is required' };
      }

      const wsName = workspace.metadata?.name || 'unknown';
      const namespace = workspace.metadata?.namespace || 'default';
      const running = podStatus?.phase === 'Running';
      const port = 8080;
      const serviceName = `codespace-svc-${wsName}`;
      const url = running ? `http://${serviceName}.${namespace}.svc.cluster.local:${port}` : null;

      return {
        error: false,
        running,
        url,
        port,
        uptime: podStatus?.startTime ? new Date().toISOString() : null,
        startTime: podStatus?.startTime || null,
        connectedUsers: podStatus?.connectedUsers || 0,
        phase: podStatus?.phase || 'Unknown',
      };
    },

    // --- Workspace associations ---

    addAssociation(workspace, ref) {
      if (!workspace) {
        return { error: true, reason: 'missing-workspace', message: 'workspace is required' };
      }
      if (!ref || !ref.kind || !ref.name) {
        return { error: true, reason: 'invalid-ref', message: 'ref must have kind and name' };
      }
      const validKinds = ['AgentDispatchRun', 'User', 'AgentSession'];
      if (!validKinds.includes(ref.kind)) {
        return { error: true, reason: 'invalid-ref-kind', message: `ref.kind must be one of: ${validKinds.join(', ')}` };
      }

      const updated = clone(workspace);
      if (!updated.spec) updated.spec = {};
      if (!Array.isArray(updated.spec.associations)) updated.spec.associations = [];

      // Prevent duplicates
      const exists = updated.spec.associations.some(
        (a) => a.kind === ref.kind && a.name === ref.name
      );
      if (exists) {
        return { error: true, reason: 'duplicate-association', message: `Association ${ref.kind}/${ref.name} already exists` };
      }

      updated.spec.associations.push({
        kind: ref.kind,
        name: ref.name,
        addedAt: new Date().toISOString(),
      });

      return { error: false, workspace: updated };
    },

    removeAssociation(workspace, ref) {
      if (!workspace) {
        return { error: true, reason: 'missing-workspace', message: 'workspace is required' };
      }
      if (!ref || !ref.kind || !ref.name) {
        return { error: true, reason: 'invalid-ref', message: 'ref must have kind and name' };
      }

      const updated = clone(workspace);
      if (!updated.spec) updated.spec = {};
      if (!Array.isArray(updated.spec.associations)) updated.spec.associations = [];

      const before = updated.spec.associations.length;
      updated.spec.associations = updated.spec.associations.filter(
        (a) => !(a.kind === ref.kind && a.name === ref.name)
      );

      if (updated.spec.associations.length === before) {
        return { error: true, reason: 'not-found', message: `Association ${ref.kind}/${ref.name} not found` };
      }

      return { error: false, workspace: updated };
    },

    listAssociations(workspace) {
      if (!workspace) {
        return { error: true, reason: 'missing-workspace', message: 'workspace is required' };
      }

      const associations = workspace.spec?.associations || [];
      return { error: false, associations: clone(associations) };
    },

    // --- Run history ---

    getWorkspaceRuns(workspace, allRuns = []) {
      if (!workspace) {
        return { error: true, reason: 'missing-workspace', message: 'workspace is required' };
      }

      const wsName = workspace.metadata?.name;
      const active = [];
      const history = [];

      for (const run of allRuns) {
        const refersToWs =
          run.status?.workspaceRef === wsName ||
          run.spec?.workspaceRef === wsName ||
          (workspace.spec?.associations || []).some(
            (a) => a.kind === 'AgentDispatchRun' && a.name === run.metadata?.name
          );

        if (!refersToWs) continue;

        const phase = run.status?.phase || 'Unknown';
        const isActive = phase === 'Running' || phase === 'Queued' || phase === 'Pending' || phase === 'Dispatched';

        if (isActive) {
          active.push(clone(run));
        } else {
          history.push(clone(run));
        }
      }

      return { error: false, active, history };
    }
  };
}
