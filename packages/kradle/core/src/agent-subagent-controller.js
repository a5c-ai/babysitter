import { createResource, clone } from './resource-model.js';

export const AGENT_SUBAGENT_CONTROLLER_BOUNDARY = {
  role: 'agent-subagent-controller',
  scope: 'Subagent dispatch orchestration with tool scoping, role-based routing, and supervision protocol',
  owns: ['subagent validation', 'dispatch record creation', 'tool scope resolution', 'task routing', 'supervision config'],
  delegatesTo: ['resource-model'],
  mustNotOwn: ['secret values', 'Agent Mux sessions', 'parent session lifecycle']
};

const DEFAULT_SUPERVISION = {
  monitorInterval: 60,
  maxDuration: 7200,
  autoTerminate: false
};

export function createAgentSubagentController() {
  return {
    role: 'agent-subagent-controller',

    /**
     * Validate an AgentSubagent resource.
     * Checks for required fields beyond what the CRD spec.requiredSpec covers:
     * - metadata.name
     * - spec.parentStackRef
     * - spec.role
     */
    validate(subagent) {
      const errors = [];

      if (!subagent?.metadata?.name) {
        errors.push('metadata.name is required');
      }

      const spec = subagent?.spec || {};

      if (!spec.parentStackRef) {
        errors.push('spec.parentStackRef is required');
      }

      if (!spec.role) {
        errors.push('spec.role is required');
      }

      return {
        valid: errors.length === 0,
        errors
      };
    },

    /**
     * Get the tool scope for a subagent.
     * Returns { unrestricted: true, allowed: [], denied: [] } when no toolScope is set.
     * Returns { unrestricted: false, allowed: [...], denied: [...] } when toolScope is configured.
     */
    getToolScope(subagent) {
      const toolScope = subagent?.spec?.toolScope;
      if (!toolScope) {
        return {
          unrestricted: true,
          allowed: [],
          denied: []
        };
      }
      return {
        unrestricted: false,
        allowed: clone(toolScope.allowed || []),
        denied: clone(toolScope.denied || [])
      };
    },

    /**
     * Get the list of explicitly denied tools for a subagent.
     */
    getDeniedTools(subagent) {
      const toolScope = subagent?.spec?.toolScope;
      return clone(toolScope?.denied || []);
    },

    /**
     * Dispatch a subagent — creates a dispatch record linking the subagent to
     * a parent session. Requires parentSessionRef to be provided.
     */
    dispatchSubagent({ subagent, parentSessionRef, taskKind, namespace = 'default', organizationRef = 'default', resources = {} }) {
      if (!parentSessionRef) {
        return {
          error: true,
          reason: 'parentSessionRef-required',
          message: 'parentSessionRef is required to dispatch a subagent'
        };
      }

      const subagentName = subagent?.metadata?.name;
      const parentStackRef = subagent?.spec?.parentStackRef;
      const role = subagent?.spec?.role;
      const recordName = `subagent-dispatch-${subagentName}-${Date.now()}`;

      const dispatchRecord = createResource(
        'AgentDispatchRun',
        { name: recordName, namespace },
        {
          organizationRef,
          repository: resources.AgentStack?.[0]?.spec?.repositoryRef || 'unknown',
          sourceRefs: [],
          agentStack: parentStackRef || 'unknown',
          taskKind: taskKind || 'general',
          parentSessionRef,
          subagentRef: subagentName,
          subagentRole: role
        }
      );

      dispatchRecord.status = { phase: 'Queued', queuedAt: new Date().toISOString() };

      return {
        dispatchRecord: clone(dispatchRecord)
      };
    },

    /**
     * Get supervision configuration for the subagent.
     * Returns configured values or defaults when supervision is not set.
     */
    getSupervisionConfig(subagent) {
      const supervision = subagent?.spec?.supervision;
      if (!supervision) {
        return { ...DEFAULT_SUPERVISION };
      }
      return {
        monitorInterval: supervision.monitorInterval !== undefined ? supervision.monitorInterval : DEFAULT_SUPERVISION.monitorInterval,
        maxDuration: supervision.maxDuration !== undefined ? supervision.maxDuration : DEFAULT_SUPERVISION.maxDuration,
        autoTerminate: supervision.autoTerminate !== undefined ? supervision.autoTerminate : DEFAULT_SUPERVISION.autoTerminate
      };
    },

    /**
     * Validate task routing: checks that the requested role maps to an available subagent.
     */
    validateTaskRouting({ role, taskKind, subagents = [] }) {
      const match = subagents.find(s => s?.spec?.role === role);
      if (!match) {
        return {
          valid: false,
          error: `No subagent found for role '${role}'`
        };
      }
      return {
        valid: true,
        matchedSubagent: clone(match)
      };
    },

    /**
     * Get current status of a subagent from its status field.
     */
    getSubagentStatus(subagent) {
      return clone(subagent?.status || { phase: 'idle' });
    }
  };
}
