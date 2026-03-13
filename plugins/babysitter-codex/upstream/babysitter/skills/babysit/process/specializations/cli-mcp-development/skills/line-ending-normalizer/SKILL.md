---
name: line-ending-normalizer
description: Normalize line endings for cross-platform file handling with CRLF/LF conversion and git configuration.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Line Ending Normalizer

Normalize line endings for cross-platform compatibility.

## Capabilities

- Detect line ending style
- Convert between CRLF and LF
- Configure git line ending settings
- Handle mixed line endings
- Set up .gitattributes

## Generated Patterns

```typescript
export type LineEnding = 'lf' | 'crlf' | 'mixed';

export function detectLineEnding(content: string): LineEnding {
  const crlf = (content.match(/\r\n/g) || []).length;
  const lf = (content.match(/(?<!\r)\n/g) || []).length;
  if (crlf > 0 && lf > 0) return 'mixed';
  if (crlf > 0) return 'crlf';
  return 'lf';
}

export function normalizeLineEndings(content: string, target: 'lf' | 'crlf' = 'lf'): string {
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  return target === 'crlf' ? normalized.replace(/\n/g, '\r\n') : normalized;
}

// .gitattributes content
export const gitattributes = `
* text=auto eol=lf
*.bat text eol=crlf
*.cmd text eol=crlf
*.ps1 text eol=crlf
*.sh text eol=lf
`;
```

## Target Processes

- cross-platform-cli-compatibility
- configuration-management-system
- shell-script-development
