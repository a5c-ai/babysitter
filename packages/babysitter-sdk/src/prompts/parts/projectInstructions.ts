import type { PromptContext } from '../types';
import { discoverBabysitterMdFiles } from '../babysitterMdDiscovery';

/**
 * Renders a "Project Instructions" section from BABYSITTER.md files
 * found between the current directory and the git repo root.
 * Returns empty string if no files are found.
 */
export function renderProjectInstructions(_ctx: PromptContext): string {
  const files = discoverBabysitterMdFiles();
  if (files.length === 0) return '';

  const sections = files.map(f => {
    const header = files.length > 1
      ? `### ${f.relativePath}\n\n`
      : '';
    return header + f.content.trim();
  });

  return [
    '## Project Instructions (BABYSITTER.md)',
    '',
    ...(files.length > 1
      ? ['*Merged from ' + files.length + ' BABYSITTER.md files (repo root to current directory):*', '']
      : []),
    sections.join('\n\n'),
  ].join('\n');
}
