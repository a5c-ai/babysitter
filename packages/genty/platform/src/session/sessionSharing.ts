/**
 * GAP-SESSION-005: Session Sharing.
 *
 * Provides utilities for preparing session trees for sharing,
 * with optional secret redaction and multiple output formats.
 */

// ---------------------------------------------------------------------------
// Types (local copies to avoid deep-path imports from runtime)
// ---------------------------------------------------------------------------

/** Minimal tree node shape for serialization. */
export interface ShareableTreeNode {
  id: string;
  parentId: string | null;
  branchId: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
  bookmark?: string;
}

/** Minimal session tree shape for sharing. */
export interface ShareableSessionTree {
  rootId: string;
  activeBranchId: string;
  activeNodeId: string;
  nodes: Map<string, ShareableTreeNode>;
  branches: Map<string, string[]>;
}

export type ShareFormat = 'link' | 'gist' | 'file';

export interface ShareOptions {
  /** Output format for the shared session. */
  format: ShareFormat;
  /** Whether to include the full message history. */
  includeHistory: boolean;
  /** Whether to redact secrets from the output. */
  redactSecrets: boolean;
}

export interface ShareResult {
  /** URL if format is 'link' or 'gist'. */
  url?: string;
  /** File path if format is 'file'. */
  filePath?: string;
  /** The format used. */
  format: ShareFormat;
  /** ISO timestamp when the share was created. */
  sharedAt: string;
  /** The prepared content (serialized). */
  content: string;
}

// ---------------------------------------------------------------------------
// Secret patterns
// ---------------------------------------------------------------------------

const SECRET_PATTERNS = [
  /(?:api[_-]?key|token|secret|password|credential|auth)[\s:=]+["']?[\w\-./+]{8,}["']?/gi,
  /(?:sk|pk|rk|at|rt)-[a-zA-Z0-9]{8,}/g,
  /Bearer\s+[a-zA-Z0-9\-._~+/]+=*/g,
  /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----[\s\S]*?-----END/g,
];

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Prepare a session tree for sharing by serializing and optionally redacting.
 */
export function prepareSessionForSharing(
  tree: ShareableSessionTree,
  options: ShareOptions,
): ShareResult {
  const nodes = options.includeHistory
    ? getAllNodes(tree)
    : getActiveNodes(tree);

  let content = serializeNodes(nodes);

  if (options.redactSecrets) {
    content = redactSecrets(content);
  }

  return {
    format: options.format,
    sharedAt: new Date().toISOString(),
    content,
  };
}

/**
 * Generate a shareable HTML page from a session tree.
 */
export function generateShareableHtml(tree: ShareableSessionTree): string {
  const nodes = getAllNodes(tree);
  const rows = nodes.map(renderNodeHtml).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Shared Session</title>
  <style>
    body { font-family: -apple-system, system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; background: #0d1117; color: #c9d1d9; }
    .message { margin: 1rem 0; padding: 1rem; border-radius: 8px; border-left: 3px solid; }
    .user { border-color: #58a6ff; background: #161b22; }
    .assistant { border-color: #3fb950; background: #161b22; }
    .system { border-color: #8b949e; background: #0d1117; }
    .tool { border-color: #d29922; background: #161b22; }
    .role { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; opacity: 0.7; }
    .content { white-space: pre-wrap; }
    .timestamp { font-size: 0.7rem; opacity: 0.5; margin-top: 0.5rem; }
  </style>
</head>
<body>
  <h1>Shared Session</h1>
${rows}
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getAllNodes(tree: ShareableSessionTree): ShareableTreeNode[] {
  return [...tree.nodes.values()].sort(
    (a, b) => a.timestamp.localeCompare(b.timestamp),
  );
}

function getActiveNodes(tree: ShareableSessionTree): ShareableTreeNode[] {
  const nodeIds = tree.branches.get(tree.activeBranchId) ?? [];
  return nodeIds
    .map((id) => tree.nodes.get(id))
    .filter((n): n is ShareableTreeNode => n !== undefined);
}

function serializeNodes(nodes: ShareableTreeNode[]): string {
  const serializable = nodes.map((n) => ({
    id: n.id,
    role: n.role,
    content: n.content,
    timestamp: n.timestamp,
    bookmark: n.bookmark,
  }));
  return JSON.stringify(serializable, null, 2);
}

function redactSecrets(text: string): string {
  let result = text;
  for (const pattern of SECRET_PATTERNS) {
    result = result.replace(pattern, '[REDACTED]');
  }
  return result;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderNodeHtml(node: ShareableTreeNode): string {
  const escaped = escapeHtml(node.content);
  return `  <div class="message ${node.role}">
    <div class="role">${node.role}</div>
    <div class="content">${escaped}</div>
    <div class="timestamp">${node.timestamp}</div>
  </div>`;
}
