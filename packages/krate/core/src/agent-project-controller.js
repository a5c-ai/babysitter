// Agent Project Controller — Slice 1.2d
// Manages KrateProject resources: validation, workflow columns, board state, and issue assignment.

export const AGENT_PROJECT_CONTROLLER_BOUNDARY = {
  role: 'agent-project-controller',
  scope: 'KrateProject lifecycle: validation, workflow column definitions, board state management, issue assignment tracking',
  owns: ['project validation', 'workflow columns', 'board state', 'default column resolution', 'issue assignment tracking'],
  delegatesTo: ['resource-model'],
  mustNotOwn: ['issue content', 'PR lifecycle', 'dispatch execution', 'Agent Mux sessions']
};

const VALID_BOARD_STATES = ['active', 'archived'];

/**
 * Validate a KrateProject resource. Returns { valid, errors }.
 * @param {object} resource
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateAgentProject(resource) {
  const errors = [];

  // Guard against null/undefined resource
  if (resource == null) {
    errors.push('resource must not be null or undefined');
    return { valid: false, errors };
  }

  // Validate metadata.name
  if (!resource?.metadata?.name) {
    errors.push('metadata.name is required');
  }

  const spec = resource?.spec || {};

  // Validate organizationRef
  if (!spec.organizationRef) {
    errors.push('spec.organizationRef is required');
  }

  // Validate workflowColumns — must be a non-empty array
  const cols = spec.workflowColumns;
  if (!Array.isArray(cols) || cols.length === 0) {
    errors.push('spec.workflowColumns must be a non-empty array');
  } else {
    // Check for duplicate column IDs
    const seen = new Set();
    for (const col of cols) {
      if (seen.has(col.id)) {
        errors.push(`spec.workflowColumns contains duplicate column ID: "${col.id}"`);
        break;
      }
      seen.add(col.id);
    }
  }

  // Validate boardState if explicitly set
  const boardState = spec.boardState;
  if (boardState != null && !VALID_BOARD_STATES.includes(boardState)) {
    errors.push(`spec.boardState "${boardState}" is not supported; valid states are: ${VALID_BOARD_STATES.join(', ')}`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Factory that returns a KrateProject controller instance.
 */
export function createAgentProjectController() {
  return {
    role: 'agent-project-controller',

    /**
     * Validate a KrateProject resource.
     * @param {object} resource
     * @returns {{ valid: boolean, errors: string[] }}
     */
    validate(resource) {
      return validateAgentProject(resource);
    },

    /**
     * Return the workflow columns for a project, in order.
     * @param {object} resource
     * @returns {Array<{ id: string, displayName: string, color: string, default?: boolean }>}
     */
    getWorkflowColumns(resource) {
      const cols = resource?.spec?.workflowColumns;
      if (!Array.isArray(cols)) {
        return [];
      }
      return [...cols];
    },

    /**
     * Return the default column — the one marked `default: true`, or the first column.
     * @param {object} resource
     * @returns {{ id: string, displayName: string, color: string, default?: boolean } | undefined}
     */
    getDefaultColumn(resource) {
      const cols = Array.isArray(resource?.spec?.workflowColumns)
        ? resource.spec.workflowColumns
        : [];
      const marked = cols.find((c) => c.default === true);
      return marked ?? cols[0];
    },

    /**
     * Return the board state for a project.
     * Defaults to 'active' when spec.boardState is not set.
     * @param {object} resource
     * @returns {string}
     */
    getBoardState(resource) {
      return resource?.spec?.boardState ?? 'active';
    }
  };
}
