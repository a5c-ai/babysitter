// StreamingOutputPanel.ts — Streaming output panel management (GAP-UX-001f)
// Pure TypeScript: manages panels of streaming output with scrollback.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StreamPanel {
  id: string;
  title: string;
  lines: string[];
  maxLines: number;
  autoScroll: boolean;
}

// ---------------------------------------------------------------------------
// StreamPanelManager
// ---------------------------------------------------------------------------

export class StreamPanelManager {
  private panels = new Map<string, StreamPanel>();

  addPanel(id: string, title: string, opts?: { maxLines?: number; autoScroll?: boolean }): StreamPanel {
    const panel: StreamPanel = {
      id,
      title,
      lines: [],
      maxLines: opts?.maxLines ?? 500,
      autoScroll: opts?.autoScroll ?? true,
    };
    this.panels.set(id, panel);
    return panel;
  }

  appendLine(panelId: string, line: string): void {
    const panel = this.panels.get(panelId);
    if (!panel) return;
    panel.lines.push(line);
    // Trim from front if exceeding maxLines
    if (panel.lines.length > panel.maxLines) {
      const excess = panel.lines.length - panel.maxLines;
      panel.lines.splice(0, excess);
    }
  }

  getPanel(id: string): StreamPanel | undefined {
    return this.panels.get(id);
  }

  listPanels(): StreamPanel[] {
    return Array.from(this.panels.values());
  }

  removePanel(id: string): boolean {
    return this.panels.delete(id);
  }

  clear(panelId: string): void {
    const panel = this.panels.get(panelId);
    if (panel) panel.lines = [];
  }
}

// ---------------------------------------------------------------------------
// Panel text rendering
// ---------------------------------------------------------------------------

function repeatChar(char: string, count: number): string {
  return count > 0 ? char.repeat(count) : '';
}

export function formatPanelOutput(panel: StreamPanel, width: number = 80): string {
  const innerWidth = Math.max(width - 4, 10); // 2 border chars + 2 padding
  const titleText = ` ${panel.title} `;
  const titlePadding = Math.max(innerWidth - titleText.length, 0);
  const leftPad = Math.floor(titlePadding / 2);
  const rightPad = titlePadding - leftPad;

  const lines: string[] = [];

  // Top border with title
  lines.push(
    `┌${repeatChar('─', leftPad)}${titleText}${repeatChar('─', rightPad)}┐`,
  );

  // Content lines
  if (panel.lines.length === 0) {
    lines.push(`│ ${repeatChar(' ', innerWidth)} │`);
  } else {
    for (const line of panel.lines) {
      const truncated = line.length > innerWidth ? line.slice(0, innerWidth - 1) + '…' : line;
      const padded = truncated + repeatChar(' ', innerWidth - truncated.length);
      lines.push(`│ ${padded} │`);
    }
  }

  // Bottom border
  lines.push(`└${repeatChar('─', innerWidth + 2)}┘`);

  return lines.join('\n');
}
