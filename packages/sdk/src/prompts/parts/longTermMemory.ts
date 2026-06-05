import type { PromptContext } from '../types';

export function renderLongTermMemory(ctx: PromptContext): string {
  if (!ctx.longTermMemories?.length) return '';

  const grouped = new Map<string, string[]>();
  for (const mem of ctx.longTermMemories) {
    const key = mem.category;
    const list = grouped.get(key) ?? [];
    list.push(mem.content);
    grouped.set(key, list);
  }

  const sections: string[] = ['## Long-Term Memory\n'];
  for (const [category, entries] of grouped) {
    sections.push(`### ${category}`);
    for (const entry of entries) {
      sections.push(`- ${entry}`);
    }
    sections.push('');
  }

  return sections.join('\n');
}
