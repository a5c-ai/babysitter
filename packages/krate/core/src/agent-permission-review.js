import { createHash } from 'node:crypto';
import { clone } from './resource-model.js';

export const AGENT_PERMISSION_REVIEW_BOUNDARY = {
  role: 'agent-permission-review',
  scope: 'Deterministic permission review for agent dispatch decisions',
  owns: ['capability expansion', 'grant resolution', 'permission snapshot creation'],
  delegatesTo: ['resource-model'],
  mustNotOwn: ['secret values', 'native K8s API calls', 'runtime execution']
};

const VALID_APPROVAL_MODES = new Set(['yolo', 'prompt', 'deny']);

export function createPermissionReviewer(options = {}) {
  return {
    role: 'agent-permission-review',

    reviewPermissions({ repository, ref, actor, agentStack, triggerSource, taskKind, runnerPool, toolRefs = [], skillRefs = [], mcpServerRefs = [], contextLabelRefs = [], workspacePolicyRef, isFork = false, resources = {} }) {
      const reasons = [];
      const grants = [];
      const crossOrgDenials = [];
      const untrustedForkWarnings = [];

      // Step 1 — Resolve AgentStack
      const stacks = resources.AgentStack || [];
      const stack = stacks.find((s) => s.metadata?.name === agentStack);
      if (!stack) {
        return buildDecision({ decision: 'denied', reasons: [{ severity: 'error', message: `AgentStack not found: ${agentStack}` }], grants, capabilities: {}, actor, repository, ref, agentStack, taskKind, crossOrgDenials, untrustedForkWarnings });
      }

      // Step 1a — Validate approvalMode
      const approvalMode = stack.spec?.approvalMode;
      if (approvalMode !== undefined && !VALID_APPROVAL_MODES.has(approvalMode)) {
        reasons.push({ severity: 'error', message: `Invalid approvalMode '${approvalMode}': must be one of ${[...VALID_APPROVAL_MODES].join(', ')}` });
      }

      // Step 1b — Deny mode blocks everything immediately
      if (approvalMode === 'deny') {
        reasons.push({ severity: 'error', message: `approvalMode is 'deny': all requests are blocked by policy` });
        return buildDecision({ decision: 'denied', reasons, grants, capabilities: {}, actor, repository, ref, agentStack, taskKind, approvalMode, crossOrgDenials, untrustedForkWarnings });
      }

      // Step 2 — Cross-org denial check
      const agentOrg = stack.spec?.organizationRef;
      if (agentOrg && repository) {
        // repository format: '<org>/<repo>' or just '<repo>'
        const repoParts = repository.split('/');
        const repoOrg = repoParts.length >= 2 ? repoParts[0] : null;
        if (repoOrg && repoOrg !== agentOrg) {
          crossOrgDenials.push({ agentOrg, resourceOrg: repoOrg, resource: repository });
          reasons.push({ severity: 'error', message: `Cross-org access denied: agent org '${agentOrg}' cannot access repository in org '${repoOrg}'` });
        }
      }

      // Step 3 — Expand capabilities from stack spec
      const capabilities = {
        toolRefs: clone(stack.spec?.toolPolicy ? [stack.spec.toolPolicy] : toolRefs),
        mcpServerRefs: clone(stack.spec?.mcpServerRefs || mcpServerRefs),
        skillRefs: clone(stack.spec?.skillRefs || skillRefs),
        subagentRefs: clone(stack.spec?.subagentRefs || [])
      };

      // Step 4 — Untrusted fork detection
      const isForkRef = isFork || /^refs\/pull\/\d+\//.test(ref);
      if (isForkRef) {
        const blockedKinds = ['AgentServiceAccount', 'AgentSecretGrant'];
        untrustedForkWarnings.push({
          ref,
          isFork: true,
          blockedKinds,
          message: `Untrusted fork detected for ref '${ref}': privileged grants restricted`
        });
        reasons.push({ severity: 'warning', message: `Untrusted fork detected for ref '${ref}': privileged grants (${blockedKinds.join(', ')}) are not auto-approved` });
      }

      // Step 5 — Check runtime identity (AgentServiceAccount)
      const serviceAccountRef = stack.spec?.runtimeIdentity?.serviceAccountRef || stack.spec?.runtimeIdentity;
      const serviceAccounts = resources.AgentServiceAccount || [];
      const serviceAccount = serviceAccounts.find((sa) => sa.metadata?.name === serviceAccountRef);
      if (!serviceAccount) {
        reasons.push({ severity: 'error', message: `Missing AgentServiceAccount: ${serviceAccountRef}` });
      } else {
        const saGrant = { kind: 'AgentServiceAccount', name: serviceAccount.metadata.name, status: 'bound' };
        if (isForkRef) {
          saGrant.status = 'fork-restricted';
        }
        grants.push(saGrant);
      }

      // Step 6 — Check role bindings
      const roleBindings = resources.AgentRoleBinding || [];
      const matchedBindings = roleBindings.filter((rb) => rb.spec?.subject === serviceAccountRef || rb.spec?.subject === agentStack);
      for (const binding of matchedBindings) {
        grants.push({ kind: 'AgentRoleBinding', name: binding.metadata.name, roleRef: binding.spec?.roleRef, scope: binding.spec?.scope, status: 'bound' });
      }
      if (matchedBindings.length === 0 && serviceAccount) {
        reasons.push({ severity: 'warning', message: `No AgentRoleBinding found for subject: ${serviceAccountRef}` });
      }

      // Step 7 — Check secret grants
      const secretGrants = resources.AgentSecretGrant || [];
      const neededSecrets = collectSecretNeeds(stack, capabilities, resources);
      for (const need of neededSecrets) {
        const match = secretGrants.find((sg) => {
          if (sg.spec?.subject !== serviceAccountRef && sg.spec?.subject !== agentStack) return false;
          if (need.purpose && sg.spec?.purpose !== need.purpose) return false;
          if (sg.spec?.allowedRepositories && sg.spec.allowedRepositories.length > 0 && !sg.spec.allowedRepositories.includes(repository)) return false;
          if (sg.spec?.allowedRefs && sg.spec.allowedRefs.length > 0 && !sg.spec.allowedRefs.includes(ref)) return false;
          return true;
        });
        if (!match) {
          reasons.push({ severity: 'error', message: `Missing AgentSecretGrant for ${need.description} (purpose: ${need.purpose})` });
        } else {
          const grantEntry = { kind: 'AgentSecretGrant', name: match.metadata.name, purpose: match.spec?.purpose, status: 'granted' };
          if (isForkRef) {
            grantEntry.status = 'fork-restricted';
          } else if (match.spec?.requiredApproval) {
            grantEntry.status = 'requires-approval';
            grantEntry.requiredApproval = match.spec.requiredApproval;
            reasons.push({ severity: 'info', message: `AgentSecretGrant ${match.metadata.name} requires approval: ${match.spec.requiredApproval}` });
          }
          grants.push(grantEntry);
        }
      }

      // Step 8 — Check config grants
      const configGrants = resources.AgentConfigGrant || [];
      const neededConfigs = collectConfigNeeds(stack, capabilities, resources);
      for (const need of neededConfigs) {
        const match = configGrants.find((cg) => {
          if (cg.spec?.subject !== serviceAccountRef && cg.spec?.subject !== agentStack) return false;
          if (need.purpose && cg.spec?.purpose !== need.purpose) return false;
          return true;
        });
        if (!match) {
          reasons.push({ severity: 'error', message: `Missing AgentConfigGrant for ${need.description} (purpose: ${need.purpose})` });
        } else {
          grants.push({ kind: 'AgentConfigGrant', name: match.metadata.name, purpose: match.spec?.purpose, status: 'granted' });
        }
      }

      // Step 9 — Workspace policy enforcement
      if (workspacePolicyRef) {
        const policies = resources.KrateWorkspacePolicy || [];
        const policy = policies.find((p) => p.metadata?.name === workspacePolicyRef);
        if (policy) {
          // Check maxConcurrentSessions
          if (policy.spec?.maxConcurrentSessions === 0) {
            reasons.push({ severity: 'error', message: `Workspace policy '${workspacePolicyRef}' maxConcurrentSessions is 0: no sessions allowed` });
          }
          // Check deniedTools
          const deniedTools = policy.spec?.deniedTools || [];
          const requestedTools = capabilities.toolRefs;
          for (const tool of requestedTools) {
            if (deniedTools.includes(tool)) {
              reasons.push({ severity: 'error', message: `Tool '${tool}' is denied by workspace policy '${workspacePolicyRef}'` });
            }
          }
          // Check allowedTools (if specified, only those tools are permitted)
          const allowedTools = policy.spec?.allowedTools;
          if (allowedTools && allowedTools.length > 0) {
            for (const tool of requestedTools) {
              if (!allowedTools.includes(tool)) {
                reasons.push({ severity: 'error', message: `Tool '${tool}' is not in allowedTools for workspace policy '${workspacePolicyRef}'` });
              }
            }
          }
        }
      }

      // Step 10 — Decision
      const hasErrors = reasons.some((r) => r.severity === 'error');
      const hasApprovals = grants.some((g) => g.status === 'requires-approval');
      let decision;
      if (hasErrors) {
        decision = 'denied';
      } else if (hasApprovals) {
        decision = 'requires-approval';
      } else {
        decision = 'allowed';
      }

      return buildDecision({ decision, reasons, grants, capabilities, actor, repository, ref, agentStack, taskKind, approvalMode, crossOrgDenials, untrustedForkWarnings });
    },

    createPermissionSnapshot(reviewResult) {
      const snapshot = clone(reviewResult);
      snapshot.snapshotAt = new Date().toISOString();
      snapshot.frozen = true;
      snapshot.digest = reviewResult.digest;
      return Object.freeze(snapshot);
    }
  };
}

function collectSecretNeeds(stack, capabilities, resources) {
  const needs = [];
  if (stack.spec?.adapter) {
    needs.push({ description: `model provider for adapter ${stack.spec.adapter}`, purpose: 'model-provider' });
  }
  const mcpServers = resources.AgentMcpServer || [];
  for (const ref of capabilities.mcpServerRefs) {
    const server = mcpServers.find((s) => s.metadata?.name === ref);
    if (server?.spec?.secretRef) {
      needs.push({ description: `MCP server ${ref} secret`, purpose: `mcp-server:${ref}` });
    }
  }
  return needs;
}

function collectConfigNeeds(stack, capabilities, resources) {
  const needs = [];
  const mcpServers = resources.AgentMcpServer || [];
  for (const ref of capabilities.mcpServerRefs) {
    const server = mcpServers.find((s) => s.metadata?.name === ref);
    if (server?.spec?.configMapRef) {
      needs.push({ description: `MCP server ${ref} config`, purpose: `mcp-server:${ref}` });
    }
  }
  return needs;
}

function buildDecision({ decision, reasons, grants, capabilities, actor, repository, ref, agentStack, taskKind, approvalMode, crossOrgDenials = [], untrustedForkWarnings = [] }) {
  const result = {
    decision,
    actor,
    repository,
    ref,
    agentStack,
    taskKind,
    capabilities: clone(capabilities),
    grants: clone(grants),
    reasons: clone(reasons),
    crossOrgDenials: clone(crossOrgDenials),
    untrustedForkWarnings: clone(untrustedForkWarnings),
    reviewedAt: new Date().toISOString()
  };
  if (approvalMode !== undefined) {
    result.approvalMode = approvalMode;
  }
  result.digest = computeDigest(result);
  return result;
}

function computeDigest(result) {
  const keys = Object.keys(result).filter((k) => k !== 'digest' && k !== 'reviewedAt').sort();
  const canonical = {};
  for (const key of keys) canonical[key] = result[key];
  return createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
}
