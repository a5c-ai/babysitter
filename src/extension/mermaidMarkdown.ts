export function normalizeMermaidMarkdown(markdown: string): string {
  const text = typeof markdown === 'string' ? markdown : String(markdown ?? '');
  if (!text.trim()) {
    return '```mermaid\n```';
  }

  const hasCompleteMermaidFence = /```+\s*mermaid\b[\s\S]*?```+/i.test(text);
  if (hasCompleteMermaidFence) {
    return text;
  }

  let body = text;
  const leadingFence = body.match(/^\s*`{1,3}\s*(?:mermaid\b)?\s*\r?\n/i);
  if (leadingFence) {
    body = body.slice(leadingFence[0].length);
  }

  body = body.replace(/(?:\r?\n)?`{1,3}\s*$/, '');

  if (!body.trim()) {
    return '```mermaid\n```';
  }

  if (!/\r?\n$/.test(body)) {
    body += '\n';
  }

  return '```mermaid\n' + body + '```';
}

export type MermaidCodeBlock = {
  blockIndex: number;
  code: string;
};

export function extractMermaidCodeBlocks(
  markdown: string,
  options?: { preferMermaid?: boolean },
): MermaidCodeBlock[] {
  const preferMermaid = Boolean(options?.preferMermaid);
  let source = typeof markdown === 'string' ? markdown : String(markdown ?? '');
  if (preferMermaid) {
    source = normalizeMermaidMarkdown(source);
  }

  const lines = source.split(/\r?\n/);
  const blocks: MermaidCodeBlock[] = [];
  let inCode = false;
  let codeLang = '';
  let mermaidLines: string[] = [];

  for (const rawLine of lines) {
    const line = String(rawLine);
    const fence = line.match(/^```+\s*([a-zA-Z0-9_-]+)?\s*$/);
    if (fence) {
      if (!inCode) {
        inCode = true;
        codeLang = fence[1] || '';
        if (codeLang.toLowerCase() === 'mermaid') {
          mermaidLines = [];
        }
      } else {
        if (codeLang.toLowerCase() === 'mermaid') {
          blocks.push({ blockIndex: blocks.length, code: mermaidLines.join('\n') });
          mermaidLines = [];
        }
        inCode = false;
        codeLang = '';
      }
      continue;
    }

    if (inCode && codeLang.toLowerCase() === 'mermaid') {
      mermaidLines.push(line);
    }
  }

  return blocks;
}
