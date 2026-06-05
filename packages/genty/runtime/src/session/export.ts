import type { SessionTree, TreeNode } from './tree.js';
import { getMessages } from './tree.js';

export function exportToHtml(tree: SessionTree, branchId?: string): string {
  const messages = getMessages(tree, branchId);
  const rows = messages.map(renderMessageHtml).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Genty Session Export</title>
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
    pre { background: #0d1117; padding: 1rem; border-radius: 4px; overflow-x: auto; }
    code { font-family: 'SF Mono', Menlo, monospace; }
  </style>
</head>
<body>
  <h1>Genty Session</h1>
${rows}
</body>
</html>`;
}

function renderMessageHtml(node: TreeNode): string {
  const escaped = escapeHtml(node.content);
  return `  <div class="message ${node.role}">
    <div class="role">${node.role}${node.bookmark ? ` — 🔖 ${escapeHtml(node.bookmark)}` : ''}</div>
    <div class="content">${escaped}</div>
    <div class="timestamp">${node.timestamp}</div>
  </div>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function exportToMarkdown(tree: SessionTree, branchId?: string): string {
  const messages = getMessages(tree, branchId);
  return messages.map(node => {
    const header = `### ${node.role.toUpperCase()}${node.bookmark ? ` 🔖 ${node.bookmark}` : ''}`;
    return `${header}\n\n${node.content}\n\n---\n`;
  }).join('\n');
}
