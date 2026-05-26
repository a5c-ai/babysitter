import { createPermissionReviewer } from './agent-permission-review.js';
import { clone } from './resource-model.js';

export const AGENT_STACK_CONTROLLER_BOUNDARY = {
  role: 'agent-stack-controller',
  scope: 'Stack readiness reconciliation with capability resolution and condition management',
  owns: ['capability resolution', 'stack conditions', 'readiness computation', 'mcp health checks'],
  delegatesTo: ['agent-permission-review', 'resource-model'],
  mustNotOwn: ['secret values', 'dispatch execution', 'Agent Mux sessions']
};

const MCP_HEALTH_TIMEOUT_MS = 3000;

/**
 * Perform an HTTP health check for an MCP server endpoint.
 * @param {string} url
 * @param {Function|null} fetchFn
 * @returns {Promise<{ status: string, latencyMs: number, error?: string }>}
 */
async function performMcpHealthCheck(url, fetchFn) {
  const fn = fetchFn || globalThis.fetch;
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), MCP_HEALTH_TIMEOUT_MS);
    let response;
    try {
      response = await fn(url, { signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
    const latencyMs = Date.now() - start;
    if (response.ok) {
      return { status: 'healthy', latencyMs };
    }
    return { status: 'unhealthy', latencyMs, error: `HTTP ${response.status}` };
  } catch (err) {
    const latencyMs = Date.now() - start;
    return { status: 'unhealthy', latencyMs, error: err.message || String(err) };
  }
}

export function createAgentStackController(options = {}) {
  const permissionReviewer = options.permissionReviewer || createPermissionReviewer();
  const fetchFn = options.fetch || null;

  return {
    role: 'agent-stack-controller',

    reconcileStack(stack, resources = {}) {
      const spec = stack?.spec || {};
      const conditions = [];
      const missing = [];

      // --- Resolve capability refs from stack spec ---
      const resolvedTools = [];
      const resolvedMcpServers = [];
      const resolvedSkills = [];
      const resolvedSubagents = [];
      const resolvedContextLabels = [];

      // toolPolicyRef
      const toolPolicyRef = spec.toolPolicy || spec.toolPolicyRef || null;
      let toolPolicyFound = true;
      if (toolPolicyRef) {
        const profiles = resources.AgentToolProfile || [];
        const profile = profiles.find((p) => p.metadata?.name === toolPolicyRef);
        if (profile) {
          resolvedTools.push(profile.metadata.name);
        } else {
          toolPolicyFound = false;
          missing.push(`AgentToolProfile/${toolPolicyRef}`);
        }
      }

      // mcpServerRefs — support both flat spec.mcpServerRefs and structured spec.externalTools.mcpServerRefs
      const mcpServerRefs = [
        ...(spec.mcpServerRefs || []),
        ...(spec.externalTools?.mcpServerRefs || [])
      ].filter((v, i, a) => a.indexOf(v) === i); // dedupe
      let allMcpFound = true;
      for (const ref of mcpServerRefs) {
        const servers = resources.AgentMcpServer || [];
        const server = servers.find((s) => s.metadata?.name === ref);
        if (server) {
          resolvedMcpServers.push(server.metadata.name);
        } else {
          allMcpFound = false;
          missing.push(`AgentMcpServer/${ref}`);
        }
      }

      // memoryRepositoryRefs — resolve memory repository associations
      const memoryRepositoryRefs = spec.memoryRepositoryRefs || [];
      const resolvedMemoryRepos = [];
      let allMemoryReposFound = true;
      for (const ref of memoryRepositoryRefs) {
        const repos = resources.AgentMemoryRepository || [];
        const repo = repos.find((r) => r.metadata?.name === ref);
        if (repo) {
          resolvedMemoryRepos.push(repo.metadata.name);
        } else {
          allMemoryReposFound = false;
          missing.push(`AgentMemoryRepository/${ref}`);
        }
      }

      // skillRefs
      const skillRefs = spec.skillRefs || [];
      let allSkillsFound = true;
      let allSkillsValid = true;
      for (const ref of skillRefs) {
        const skills = resources.AgentSkill || [];
        const skill = skills.find((s) => s.metadata?.name === ref);
        if (skill) {
          resolvedSkills.push(skill.metadata.name);
          if (!skill.spec?.format || !skill.spec?.sourceRef) {
            allSkillsValid = false;
          }
        } else {
          allSkillsFound = false;
          allSkillsValid = false;
          missing.push(`AgentSkill/${ref}`);
        }
      }

      // subagentRefs
      const subagentRefs = spec.subagentRefs || [];
      let allSubagentsFound = true;
      let allSubagentsValid = true;
      for (const ref of subagentRefs) {
        const subagents = resources.AgentSubagent || [];
        const subagent = subagents.find((s) => s.metadata?.name === ref);
        if (subagent) {
          resolvedSubagents.push(subagent.metadata.name);
          if (!subagent.spec?.taskKinds || subagent.spec.taskKinds.length === 0) {
            allSubagentsValid = false;
          }
        } else {
          allSubagentsFound = false;
          allSubagentsValid = false;
          missing.push(`AgentSubagent/${ref}`);
        }
      }

      // contextLabelRefs
      const contextLabelRefs = spec.contextLabelRefs || [];
      let allContextLabelsFound = true;
      for (const ref of contextLabelRefs) {
        const labels = resources.AgentContextLabel || [];
        const label = labels.find((l) => l.metadata?.name === ref);
        if (label) {
          resolvedContextLabels.push(label.metadata.name);
        } else {
          allContextLabelsFound = false;
          missing.push(`AgentContextLabel/${ref}`);
        }
      }

      // --- Build conditions ---
      const allRefsFound = missing.length === 0;
      conditions.push({
        type: 'CapabilitiesResolved',
        status: allRefsFound ? 'True' : 'False',
        reason: allRefsFound ? 'AllRefsResolved' : 'MissingRefs',
        message: allRefsFound ? 'All capability references resolved' : `Missing: ${missing.join(', ')}`
      });

      conditions.push({
        type: 'ToolsAdmitted',
        status: (toolPolicyFound || !toolPolicyRef) ? 'True' : 'False',
        reason: !toolPolicyRef ? 'NoToolPolicyRef' : toolPolicyFound ? 'ToolPolicyResolved' : 'ToolPolicyMissing',
        message: !toolPolicyRef ? 'No tool policy reference set' : toolPolicyFound ? 'Tool policy resolved' : `AgentToolProfile/${toolPolicyRef} not found`
      });

      conditions.push({
        type: 'McpHealthy',
        status: allMcpFound ? 'True' : 'False',
        reason: allMcpFound ? 'AllMcpServersExist' : 'MissingMcpServers',
        message: allMcpFound ? 'All MCP servers exist (health check deferred)' : `Missing MCP servers: ${mcpServerRefs.filter((ref) => !resolvedMcpServers.includes(ref)).join(', ')}`
      });

      conditions.push({
        type: 'SkillsValidated',
        status: (allSkillsFound && allSkillsValid) ? 'True' : 'False',
        reason: !allSkillsFound ? 'MissingSkills' : !allSkillsValid ? 'InvalidSkillFormat' : 'AllSkillsValid',
        message: !allSkillsFound ? `Missing skills: ${skillRefs.filter((ref) => !resolvedSkills.includes(ref)).join(', ')}` : !allSkillsValid ? 'Some skills have invalid format or missing sourceRef' : 'All skills validated'
      });

      conditions.push({
        type: 'SubagentsValid',
        status: (allSubagentsFound && allSubagentsValid) ? 'True' : 'False',
        reason: !allSubagentsFound ? 'MissingSubagents' : !allSubagentsValid ? 'InvalidSubagentTaskKinds' : 'AllSubagentsValid',
        message: !allSubagentsFound ? `Missing subagents: ${subagentRefs.filter((ref) => !resolvedSubagents.includes(ref)).join(', ')}` : !allSubagentsValid ? 'Some subagents have invalid or empty taskKinds' : 'All subagents validated'
      });

      conditions.push({
        type: 'ContextLabelsValid',
        status: allContextLabelsFound ? 'True' : 'False',
        reason: allContextLabelsFound ? 'AllContextLabelsExist' : 'MissingContextLabels',
        message: allContextLabelsFound ? 'All context labels exist' : `Missing context labels: ${contextLabelRefs.filter((ref) => !resolvedContextLabels.includes(ref)).join(', ')}`
      });

      const memoryBound = memoryRepositoryRefs.length === 0 || allMemoryReposFound;
      conditions.push({
        type: 'MemoryBound',
        status: memoryBound ? 'True' : 'False',
        reason: memoryRepositoryRefs.length === 0 ? 'NoMemoryRefsConfigured' : allMemoryReposFound ? 'AllMemoryReposResolved' : 'MissingMemoryRepos',
        message: memoryRepositoryRefs.length === 0 ? 'No memory repository references configured' : allMemoryReposFound ? 'All memory repositories resolved' : `Missing memory repositories: ${memoryRepositoryRefs.filter((ref) => !resolvedMemoryRepos.includes(ref)).join(', ')}`
      });

      // --- Permission review conditions via permissionReviewer ---
      const serviceAccountRef = spec.runtimeIdentity?.serviceAccountRef || spec.runtimeIdentity;
      const serviceAccounts = resources.AgentServiceAccount || [];
      const serviceAccount = serviceAccounts.find((sa) => sa.metadata?.name === serviceAccountRef);
      const runtimeIdentityReady = Boolean(serviceAccount);

      conditions.push({
        type: 'RuntimeIdentityReady',
        status: runtimeIdentityReady ? 'True' : 'False',
        reason: runtimeIdentityReady ? 'ServiceAccountBound' : 'MissingServiceAccount',
        message: runtimeIdentityReady ? `AgentServiceAccount ${serviceAccountRef} bound` : `AgentServiceAccount ${serviceAccountRef || 'undefined'} not found`
      });

      // Run permission review for roles, secrets, config
      const permissionReview = permissionReviewer.reviewPermissions({
        repository: stack?.metadata?.labels?.repository || 'unknown',
        ref: stack?.metadata?.labels?.ref || 'main',
        actor: stack?.metadata?.labels?.actor || 'system',
        agentStack: stack?.metadata?.name,
        triggerSource: 'reconciliation',
        taskKind: spec.taskKind || 'general',
        resources
      });

      const rolesAdmitted = !permissionReview.reasons.some((r) => r.severity === 'error' && r.message.includes('AgentRoleBinding'));
      const secretsAdmitted = !permissionReview.reasons.some((r) => r.severity === 'error' && r.message.includes('AgentSecretGrant'));
      const configAdmitted = !permissionReview.reasons.some((r) => r.severity === 'error' && r.message.includes('AgentConfigGrant'));

      conditions.push({
        type: 'RolesAdmitted',
        status: rolesAdmitted ? 'True' : 'False',
        reason: rolesAdmitted ? 'RoleBindingsResolved' : 'MissingRoleBindings',
        message: rolesAdmitted ? 'Role bindings satisfied' : 'Missing required AgentRoleBinding resources'
      });

      conditions.push({
        type: 'SecretsAdmitted',
        status: secretsAdmitted ? 'True' : 'False',
        reason: secretsAdmitted ? 'SecretGrantsResolved' : 'MissingSecretGrants',
        message: secretsAdmitted ? 'Secret grants satisfied' : 'Missing required AgentSecretGrant resources'
      });

      conditions.push({
        type: 'ConfigAdmitted',
        status: configAdmitted ? 'True' : 'False',
        reason: configAdmitted ? 'ConfigGrantsResolved' : 'MissingConfigGrants',
        message: configAdmitted ? 'Config grants satisfied' : 'Missing required AgentConfigGrant resources'
      });

      // --- Ready condition: true only if ALL other conditions are true ---
      const allTrue = conditions.every((c) => c.status === 'True');
      const hasErrors = conditions.some((c) => c.status === 'False');

      conditions.push({
        type: 'Ready',
        status: allTrue ? 'True' : 'False',
        reason: allTrue ? 'StackReady' : 'StackNotReady',
        message: allTrue ? 'All conditions met' : `Failing conditions: ${conditions.filter((c) => c.status === 'False').map((c) => c.type).join(', ')}`
      });

      return {
        conditions: clone(conditions),
        capabilities: {
          tools: clone(resolvedTools),
          mcpServers: clone(resolvedMcpServers),
          skills: clone(resolvedSkills),
          subagents: clone(resolvedSubagents),
          contextLabels: clone(resolvedContextLabels),
          memoryRepos: clone(resolvedMemoryRepos)
        },
        validation: allTrue ? 'valid' : hasErrors ? 'invalid' : 'warning',
        permissionDecision: permissionReview.decision
      };
    },

    listStackCapabilities(stack, resources = {}) {
      const spec = stack?.spec || {};
      const capabilities = [];

      // Tools
      const toolPolicyRef = spec.toolPolicy || spec.toolPolicyRef || null;
      if (toolPolicyRef) {
        const profiles = resources.AgentToolProfile || [];
        const profile = profiles.find((p) => p.metadata?.name === toolPolicyRef);
        capabilities.push({
          kind: 'tool',
          name: toolPolicyRef,
          status: profile ? 'resolved' : 'missing',
          ref: toolPolicyRef
        });
      }

      // MCP Servers
      for (const ref of spec.mcpServerRefs || []) {
        const servers = resources.AgentMcpServer || [];
        const server = servers.find((s) => s.metadata?.name === ref);
        capabilities.push({
          kind: 'mcp',
          name: ref,
          status: server ? 'resolved' : 'missing',
          ref
        });
      }

      // Skills
      for (const ref of spec.skillRefs || []) {
        const skills = resources.AgentSkill || [];
        const skill = skills.find((s) => s.metadata?.name === ref);
        capabilities.push({
          kind: 'skill',
          name: ref,
          status: skill ? 'resolved' : 'missing',
          ref
        });
      }

      // Subagents
      for (const ref of spec.subagentRefs || []) {
        const subagents = resources.AgentSubagent || [];
        const subagent = subagents.find((s) => s.metadata?.name === ref);
        capabilities.push({
          kind: 'subagent',
          name: ref,
          status: subagent ? 'resolved' : 'missing',
          ref
        });
      }

      // Context Labels
      for (const ref of spec.contextLabelRefs || []) {
        const labels = resources.AgentContextLabel || [];
        const label = labels.find((l) => l.metadata?.name === ref);
        capabilities.push({
          kind: 'contextLabel',
          name: ref,
          status: label ? 'resolved' : 'missing',
          ref
        });
      }

      return capabilities;
    },

    /**
     * Perform a health check for an AgentMcpServer resource.
     * If no endpoint is configured in spec, returns { status: 'unknown', reason: 'no-endpoint' }.
     * Otherwise performs a real HTTP GET with a 3s timeout.
     * @param {object} mcpServer
     * @returns {Promise<{ serverName: string, status: string, latencyMs?: number, reason?: string, error?: string }>}
     */
    async checkMcpHealth(mcpServer) {
      const serverName = mcpServer?.metadata?.name;
      const endpoint = mcpServer?.spec?.endpoint;

      if (!endpoint) {
        return { serverName, status: 'unknown', reason: 'no-endpoint' };
      }

      const checkResult = await performMcpHealthCheck(endpoint, fetchFn);
      return { serverName, ...checkResult };
    }
  };
}
