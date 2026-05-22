// Agent Session Transcript Controller — Slice 1.2e
// Manages AgentSessionTranscript resources: durable transcript storage,
// message indexing, and pagination support.

export const AGENT_SESSION_TRANSCRIPT_CONTROLLER_BOUNDARY = {
  role: 'agent-session-transcript-controller',
  scope: 'AgentSessionTranscript lifecycle: validation, message indexing, pagination, role/tool filtering',
  owns: ['transcript validation', 'message indexing', 'pagination', 'role filter', 'tool name filter'],
  delegatesTo: ['resource-model'],
  mustNotOwn: ['session lifecycle', 'dispatch execution', 'Agent Mux sessions', 'secret values']
};

const VALID_ROLES = ['user', 'assistant', 'tool', 'system'];

/**
 * Validate an AgentSessionTranscript resource. Returns { valid, errors }.
 * @param {object} resource
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateAgentSessionTranscript(resource) {
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

  // Validate sessionRef
  if (!spec.sessionRef) {
    errors.push('spec.sessionRef is required; provide the AgentSession ID this transcript is linked to');
  }

  // Validate messages — must be an array (can be empty for a new transcript)
  const messages = spec.messages;
  if (!Array.isArray(messages)) {
    errors.push('spec.messages must be an array');
  } else {
    // Validate each message shape
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (msg == null || typeof msg !== 'object') {
        errors.push(`spec.messages[${i}] must be an object`);
        continue;
      }
      if (!msg.role) {
        errors.push(`spec.messages[${i}].role is required`);
      } else if (!VALID_ROLES.includes(msg.role)) {
        errors.push(`spec.messages[${i}].role "${msg.role}" is not valid; valid roles are: ${VALID_ROLES.join(', ')}`);
      }
      if (msg.content == null) {
        errors.push(`spec.messages[${i}].content is required`);
      }
    }
  }

  // Validate pageSize if explicitly set
  const pageSize = spec.pageSize;
  if (pageSize != null && (!Number.isInteger(pageSize) || pageSize < 1)) {
    errors.push('spec.pageSize must be a positive integer when specified');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Factory that returns an AgentSessionTranscript controller instance.
 */
export function createAgentSessionTranscriptController() {
  return {
    role: 'agent-session-transcript-controller',

    /**
     * Validate an AgentSessionTranscript resource.
     * @param {object} resource
     * @returns {{ valid: boolean, errors: string[] }}
     */
    validate(resource) {
      return validateAgentSessionTranscript(resource);
    },

    /**
     * Return all messages in the transcript, in order.
     * @param {object} resource
     * @returns {Array<{ role: string, content: string, timestamp?: string, toolCalls?: object[] }>}
     */
    getMessages(resource) {
      if (resource == null) {
        throw new Error('resource must not be null or undefined');
      }
      const messages = resource?.spec?.messages;
      if (!Array.isArray(messages)) {
        return [];
      }
      return [...messages];
    },

    /**
     * Return the total number of messages in the transcript.
     * @param {object} resource
     * @returns {number}
     */
    getTotalMessages(resource) {
      if (resource == null) {
        throw new Error('resource must not be null or undefined');
      }
      const messages = resource?.spec?.messages;
      return Array.isArray(messages) ? messages.length : 0;
    },

    /**
     * Return a page of messages from the transcript.
     * @param {object} resource
     * @param {number} pageIndex - zero-based page index
     * @param {number} [pageSizeOverride] - override spec.pageSize (defaults to spec.pageSize or 20)
     * @returns {{ messages: object[], pageIndex: number, pageSize: number, totalMessages: number, totalPages: number }}
     */
    getPage(resource, pageIndex, pageSizeOverride) {
      if (resource == null) {
        throw new Error('resource must not be null or undefined');
      }
      const messages = Array.isArray(resource?.spec?.messages) ? resource.spec.messages : [];
      const pageSize = pageSizeOverride ?? resource?.spec?.pageSize ?? 20;
      const totalMessages = messages.length;
      const totalPages = Math.max(1, Math.ceil(totalMessages / pageSize));
      const safePageIndex = Math.max(0, Math.min(pageIndex, totalPages - 1));
      const start = safePageIndex * pageSize;
      const end = start + pageSize;
      return {
        messages: messages.slice(start, end),
        pageIndex: safePageIndex,
        pageSize,
        totalMessages,
        totalPages
      };
    },

    /**
     * Return all messages filtered by role.
     * @param {object} resource
     * @param {string} role - one of: user, assistant, tool, system
     * @returns {Array<object>}
     */
    getMessagesByRole(resource, role) {
      if (resource == null) {
        throw new Error('resource must not be null or undefined');
      }
      const messages = Array.isArray(resource?.spec?.messages) ? resource.spec.messages : [];
      return messages.filter((m) => m.role === role);
    },

    /**
     * Return all messages that contain a tool call with the given tool name.
     * @param {object} resource
     * @param {string} toolName
     * @returns {Array<object>}
     */
    getMessagesByToolName(resource, toolName) {
      if (resource == null) {
        throw new Error('resource must not be null or undefined');
      }
      const messages = Array.isArray(resource?.spec?.messages) ? resource.spec.messages : [];
      return messages.filter((m) => {
        if (!Array.isArray(m.toolCalls)) return false;
        return m.toolCalls.some((tc) => tc.name === toolName);
      });
    },

    /**
     * Return the list of valid message roles.
     * @returns {string[]}
     */
    getValidRoles() {
      return [...VALID_ROLES];
    }
  };
}
