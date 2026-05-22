// Agent Secret/Config Grant Controller — Secret & ConfigMap grant lifecycle
//
// Provides:
//   - createAgentSecretGrantController() — validates AgentSecretGrant resources
//   - createAgentConfigGrantController() — validates AgentConfigGrant resources
//   - listGrantsForAgent(agentRef) — filter grants by target agent
//   - revokeGrant(grantName) — mark a grant as revoked

import { createResource, clone } from './resource-model.js';

export const AGENT_SECRET_GRANT_CONTROLLER_BOUNDARY = {
  role: 'agent-secret-grant-controller',
  scope: 'AgentSecretGrant lifecycle — creation, listing, revocation for agent-to-secret access grants',
  owns: ['grant creation', 'grant listing', 'grant revocation', 'input validation'],
  delegatesTo: ['resource-model'],
  mustNotOwn: ['Kubernetes Secret storage', 'agent execution', 'secret value decryption', 'UI rendering']
};

export const AGENT_CONFIG_GRANT_CONTROLLER_BOUNDARY = {
  role: 'agent-config-grant-controller',
  scope: 'AgentConfigGrant lifecycle — creation, listing, revocation for agent-to-configmap access grants',
  owns: ['grant creation', 'grant listing', 'grant revocation', 'input validation'],
  delegatesTo: ['resource-model'],
  mustNotOwn: ['Kubernetes ConfigMap storage', 'agent execution', 'UI rendering']
};

const VALID_PERMISSIONS = new Set(['read', 'use', 'mount']);

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

/**
 * Validate an AgentSecretGrant input.
 *
 * @param {object} input
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateAgentSecretGrant(input) {
  const errors = [];
  if (!input) return { valid: false, errors: ['input must not be null or undefined'] };
  if (!input.name || typeof input.name !== 'string') errors.push('name is required and must be a non-empty string');
  if (!input.orgRef || typeof input.orgRef !== 'string') errors.push('orgRef is required and must be a non-empty string');
  if (!input.secretName || typeof input.secretName !== 'string') errors.push('secretName is required and must be a non-empty string');
  if (!input.grantedTo || typeof input.grantedTo !== 'string') errors.push('grantedTo is required and must be a non-empty string');
  if (!Array.isArray(input.permissions) || input.permissions.length === 0) {
    errors.push('permissions is required and must be a non-empty array');
  } else {
    const invalid = input.permissions.filter((p) => !VALID_PERMISSIONS.has(p));
    if (invalid.length > 0) errors.push(`invalid permissions: ${invalid.join(', ')}. Valid values: ${[...VALID_PERMISSIONS].join(', ')}`);
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Validate an AgentConfigGrant input.
 *
 * @param {object} input
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateAgentConfigGrant(input) {
  const errors = [];
  if (!input) return { valid: false, errors: ['input must not be null or undefined'] };
  if (!input.name || typeof input.name !== 'string') errors.push('name is required and must be a non-empty string');
  if (!input.orgRef || typeof input.orgRef !== 'string') errors.push('orgRef is required and must be a non-empty string');
  if (!input.configMapName || typeof input.configMapName !== 'string') errors.push('configMapName is required and must be a non-empty string');
  if (!input.grantedTo || typeof input.grantedTo !== 'string') errors.push('grantedTo is required and must be a non-empty string');
  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// listGrantsForAgent — shared utility
// ---------------------------------------------------------------------------

/**
 * Filter grants by the grantedTo (agent ref) field from a collection of grant resources.
 *
 * @param {object[]} grants  Array of AgentSecretGrant or AgentConfigGrant resources
 * @param {string}   agentRef  The agent identifier to filter by
 * @returns {object[]}
 */
export function listGrantsForAgent(grants, agentRef) {
  if (!agentRef) return [];
  return grants.filter((g) => g.spec?.grantedTo === agentRef || g.spec?.subject === agentRef);
}

// ---------------------------------------------------------------------------
// revokeGrant — shared utility
// ---------------------------------------------------------------------------

/**
 * Mark a grant as revoked by returning an updated copy of the resource.
 *
 * @param {object[]} grants  Array of grant resources
 * @param {string}   grantName  Name of the grant to revoke
 * @returns {{ grant: object } | { error: true, reason: string, message: string }}
 */
export function revokeGrant(grants, grantName) {
  if (!grantName) return { error: true, reason: 'missing-name', message: 'grantName is required' };

  const found = grants.find((g) => g.metadata?.name === grantName);
  if (!found) return { error: true, reason: 'not-found', message: `Grant not found: ${grantName}` };

  if (found.status?.phase === 'Revoked') {
    return { error: true, reason: 'already-revoked', message: `Grant "${grantName}" is already revoked` };
  }

  const updated = clone(found);
  updated.status = {
    ...updated.status,
    phase: 'Revoked',
    revokedAt: new Date().toISOString()
  };

  return { grant: updated };
}

// ---------------------------------------------------------------------------
// createAgentSecretGrantController
// ---------------------------------------------------------------------------

/**
 * Create a controller for AgentSecretGrant resources.
 *
 * @param {{ persistFn?: (resource: object) => Promise<any> }} [opts]
 * @returns {object}
 */
export function createAgentSecretGrantController({ persistFn } = {}) {
  function persist(resource) {
    if (typeof persistFn === 'function') {
      Promise.resolve(persistFn(resource)).catch(() => {});
    }
  }

  return {
    role: 'agent-secret-grant-controller',

    /**
     * Create an AgentSecretGrant resource.
     *
     * @param {{ name, orgRef, secretName, grantedTo, permissions, namespace?, keys? }} input
     * @returns {{ grant: object } | { error: true, message: string }}
     */
    createSecretGrant({
      name,
      orgRef,
      secretName,
      grantedTo,
      permissions = ['read'],
      namespace = 'default',
      keys = []
    }) {
      const validation = validateAgentSecretGrant({ name, orgRef, secretName, grantedTo, permissions });
      if (!validation.valid) {
        return { error: true, message: validation.errors.join('; ') };
      }

      const now = new Date().toISOString();
      const grant = createResource('AgentSecretGrant', { name, namespace }, {
        organizationRef: orgRef,
        orgRef,
        secretName,
        secretRef: secretName,
        grantedTo,
        subject: grantedTo,
        permissions,
        keys,
        purpose: permissions.join(',')
      });
      grant.status = { phase: 'Active', createdAt: now };

      persist(grant);
      return { grant };
    },

    /**
     * List all grants for a specific agent.
     *
     * @param {string}   agentRef
     * @param {object[]} grants
     * @returns {object[]}
     */
    listGrantsForAgent(agentRef, grants = []) {
      return listGrantsForAgent(grants, agentRef);
    },

    /**
     * Revoke a grant by name.
     *
     * @param {string}   grantName
     * @param {object[]} grants
     * @returns {{ grant: object } | { error: true, reason: string, message: string }}
     */
    revokeGrant(grantName, grants = []) {
      const result = revokeGrant(grants, grantName);
      if (!result.error && result.grant) persist(result.grant);
      return result;
    }
  };
}

// ---------------------------------------------------------------------------
// createAgentConfigGrantController
// ---------------------------------------------------------------------------

/**
 * Create a controller for AgentConfigGrant resources.
 *
 * @param {{ persistFn?: (resource: object) => Promise<any> }} [opts]
 * @returns {object}
 */
export function createAgentConfigGrantController({ persistFn } = {}) {
  function persist(resource) {
    if (typeof persistFn === 'function') {
      Promise.resolve(persistFn(resource)).catch(() => {});
    }
  }

  return {
    role: 'agent-config-grant-controller',

    /**
     * Create an AgentConfigGrant resource.
     *
     * @param {{ name, orgRef, configMapName, grantedTo, namespace?, keys? }} input
     * @returns {{ grant: object } | { error: true, message: string }}
     */
    createConfigGrant({
      name,
      orgRef,
      configMapName,
      grantedTo,
      namespace = 'default',
      keys = []
    }) {
      const validation = validateAgentConfigGrant({ name, orgRef, configMapName, grantedTo });
      if (!validation.valid) {
        return { error: true, message: validation.errors.join('; ') };
      }

      const now = new Date().toISOString();
      const grant = createResource('AgentConfigGrant', { name, namespace }, {
        organizationRef: orgRef,
        orgRef,
        configMapName,
        configMapRef: configMapName,
        grantedTo,
        subject: grantedTo,
        keys,
        purpose: 'read'
      });
      grant.status = { phase: 'Active', createdAt: now };

      persist(grant);
      return { grant };
    },

    /**
     * List all grants for a specific agent.
     *
     * @param {string}   agentRef
     * @param {object[]} grants
     * @returns {object[]}
     */
    listGrantsForAgent(agentRef, grants = []) {
      return listGrantsForAgent(grants, agentRef);
    },

    /**
     * Revoke a grant by name.
     *
     * @param {string}   grantName
     * @param {object[]} grants
     * @returns {{ grant: object } | { error: true, reason: string, message: string }}
     */
    revokeGrant(grantName, grants = []) {
      const result = revokeGrant(grants, grantName);
      if (!result.error && result.grant) persist(result.grant);
      return result;
    }
  };
}
