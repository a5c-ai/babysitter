// EffectTreeView.ts — Effect tree construction and rendering (GAP-UX-001 + UX-001a)
// Pure TypeScript: builds a tree from a flat effect list, renders ASCII or HTML.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EffectStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface EffectTreeNode {
  id: string;
  parentId: string | null;
  kind: string;
  title: string;
  status: EffectStatus;
  children: EffectTreeNode[];
  depth: number;
}

export interface FlatEffect {
  id: string;
  parentId?: string | null;
  kind: string;
  title: string;
  status: EffectStatus;
}

// ---------------------------------------------------------------------------
// Tree construction
// ---------------------------------------------------------------------------

export function buildEffectTree(effects: FlatEffect[]): EffectTreeNode[] {
  const nodeMap = new Map<string, EffectTreeNode>();

  // First pass: create nodes
  for (const effect of effects) {
    nodeMap.set(effect.id, {
      id: effect.id,
      parentId: effect.parentId ?? null,
      kind: effect.kind,
      title: effect.title,
      status: effect.status,
      children: [],
      depth: 0,
    });
  }

  // Second pass: wire parent-child relationships
  const roots: EffectTreeNode[] = [];

  for (const node of nodeMap.values()) {
    if (node.parentId && nodeMap.has(node.parentId)) {
      nodeMap.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // Third pass: compute depths
  function setDepth(node: EffectTreeNode, depth: number): void {
    node.depth = depth;
    for (const child of node.children) {
      setDepth(child, depth + 1);
    }
  }
  for (const root of roots) {
    setDepth(root, 0);
  }

  return roots;
}

// ---------------------------------------------------------------------------
// ASCII tree rendering (terminal)
// ---------------------------------------------------------------------------

const STATUS_ICON: Record<EffectStatus, string> = {
  pending: '○',   // ○
  running: '◔',   // ◔
  completed: '✔', // ✔
  failed: '✘',    // ✘
  skipped: '–',   // –
};

function renderNodeText(node: EffectTreeNode, prefix: string, isLast: boolean, lines: string[]): void {
  const connector = isLast ? '└── ' : '├── ';
  const icon = STATUS_ICON[node.status] ?? '?';
  lines.push(`${prefix}${connector}${icon} [${node.kind}] ${node.title} (${node.status})`);

  const childPrefix = prefix + (isLast ? '    ' : '│   ');
  for (let i = 0; i < node.children.length; i++) {
    renderNodeText(node.children[i], childPrefix, i === node.children.length - 1, lines);
  }
}

export function formatEffectTreeText(tree: EffectTreeNode[]): string {
  if (tree.length === 0) return '(empty tree)';

  const lines: string[] = [];
  for (let i = 0; i < tree.length; i++) {
    const root = tree[i];
    const icon = STATUS_ICON[root.status] ?? '?';
    lines.push(`${icon} [${root.kind}] ${root.title} (${root.status})`);

    const childPrefix = i < tree.length - 1 ? '│   ' : '    ';
    for (let j = 0; j < root.children.length; j++) {
      renderNodeText(root.children[j], childPrefix, j === root.children.length - 1, lines);
    }
  }
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// HTML tree rendering (collapsible)
// ---------------------------------------------------------------------------

const STATUS_CLASS: Record<EffectStatus, string> = {
  pending: 'effect-pending',
  running: 'effect-running',
  completed: 'effect-completed',
  failed: 'effect-failed',
  skipped: 'effect-skipped',
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderNodeHtml(node: EffectTreeNode): string {
  const cls = STATUS_CLASS[node.status] ?? 'effect-pending';
  const icon = STATUS_ICON[node.status] ?? '?';
  const hasChildren = node.children.length > 0;

  let html = `<li class="effect-node ${cls}" data-effect-id="${escapeHtml(node.id)}" data-depth="${node.depth}">`;
  if (hasChildren) {
    html += `<details open>`;
    html += `<summary>${icon} <span class="effect-kind">[${escapeHtml(node.kind)}]</span> ${escapeHtml(node.title)} <span class="effect-status">(${node.status})</span></summary>`;
    html += `<ul>`;
    for (const child of node.children) {
      html += renderNodeHtml(child);
    }
    html += `</ul></details>`;
  } else {
    html += `${icon} <span class="effect-kind">[${escapeHtml(node.kind)}]</span> ${escapeHtml(node.title)} <span class="effect-status">(${node.status})</span>`;
  }
  html += `</li>`;
  return html;
}

export function renderEffectTreeHtml(tree: EffectTreeNode[]): string {
  if (tree.length === 0) return '<ul class="effect-tree"><li>(empty tree)</li></ul>';

  let html = '<ul class="effect-tree">';
  for (const root of tree) {
    html += renderNodeHtml(root);
  }
  html += '</ul>';
  return html;
}
