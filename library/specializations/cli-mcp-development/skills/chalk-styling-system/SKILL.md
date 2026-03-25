---
name: chalk-styling-system
description: Create consistent chalk-based color and styling system for CLI output with themes, semantic colors, and formatting utilities.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Chalk Styling System

Create consistent chalk-based styling for CLI output.

## Capabilities

- Create color theme systems
- Define semantic color utilities
- Set up text formatting helpers
- Implement conditional styling
- Create box and border utilities
- Generate styling documentation

## Usage

Invoke this skill when you need to:
- Create consistent CLI color schemes
- Define semantic output styling
- Build formatting utilities
- Support multiple themes

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| language | string | Yes | Target language |
| theme | object | No | Custom color theme |
| utilities | array | No | Formatting utilities needed |

## Generated Patterns

### TypeScript Styling System

```typescript
import chalk, { ChalkInstance } from 'chalk';

// Theme definition
export interface Theme {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  muted: string;
}

const defaultTheme: Theme = {
  primary: '#3498db',
  secondary: '#9b59b6',
  success: '#2ecc71',
  warning: '#f39c12',
  error: '#e74c3c',
  info: '#00bcd4',
  muted: '#95a5a6',
};

// Create themed chalk instance
export function createTheme(theme: Partial<Theme> = {}): {
  primary: ChalkInstance;
  secondary: ChalkInstance;
  success: ChalkInstance;
  warning: ChalkInstance;
  error: ChalkInstance;
  info: ChalkInstance;
  muted: ChalkInstance;
} {
  const t = { ...defaultTheme, ...theme };
  return {
    primary: chalk.hex(t.primary),
    secondary: chalk.hex(t.secondary),
    success: chalk.hex(t.success),
    warning: chalk.hex(t.warning),
    error: chalk.hex(t.error),
    info: chalk.hex(t.info),
    muted: chalk.hex(t.muted),
  };
}

// Default styled outputs
export const style = createTheme();

// Semantic helpers
export const log = {
  success: (msg: string) => console.log(style.success('✓ ') + msg),
  error: (msg: string) => console.error(style.error('✗ ') + msg),
  warning: (msg: string) => console.log(style.warning('⚠ ') + msg),
  info: (msg: string) => console.log(style.info('ℹ ') + msg),
  debug: (msg: string) => console.log(style.muted('⋯ ') + msg),
};

// Text formatting
export const format = {
  bold: chalk.bold,
  dim: chalk.dim,
  italic: chalk.italic,
  underline: chalk.underline,
  strikethrough: chalk.strikethrough,
  code: (text: string) => chalk.bgGray.white(` ${text} `),
  link: (text: string, url: string) => chalk.blue.underline(text) + ` (${chalk.dim(url)})`,
};

// Box drawing
export function box(content: string, options?: {
  title?: string;
  padding?: number;
  borderColor?: string;
}): string {
  const lines = content.split('\n');
  const maxWidth = Math.max(...lines.map(l => l.length), options?.title?.length || 0);
  const padding = options?.padding || 1;
  const borderColor = options?.borderColor || '#888';
  const border = chalk.hex(borderColor);

  const horizontalBorder = border('─'.repeat(maxWidth + padding * 2 + 2));
  const emptyLine = border('│') + ' '.repeat(maxWidth + padding * 2) + border('│');

  const result: string[] = [];

  // Top border with optional title
  if (options?.title) {
    const titlePadding = Math.floor((maxWidth + padding * 2 - options.title.length) / 2);
    result.push(
      border('┌') +
      border('─'.repeat(titlePadding)) +
      ` ${options.title} ` +
      border('─'.repeat(maxWidth + padding * 2 - titlePadding - options.title.length - 2)) +
      border('┐')
    );
  } else {
    result.push(border('┌') + horizontalBorder.slice(1, -1) + border('┐'));
  }

  // Padding top
  for (let i = 0; i < padding; i++) {
    result.push(emptyLine);
  }

  // Content
  for (const line of lines) {
    result.push(
      border('│') +
      ' '.repeat(padding) +
      line.padEnd(maxWidth) +
      ' '.repeat(padding) +
      border('│')
    );
  }

  // Padding bottom
  for (let i = 0; i < padding; i++) {
    result.push(emptyLine);
  }

  // Bottom border
  result.push(border('└') + horizontalBorder.slice(1, -1) + border('┘'));

  return result.join('\n');
}

// Table formatting
export function table(
  headers: string[],
  rows: string[][],
  options?: { headerColor?: string }
): string {
  const headerColor = chalk.hex(options?.headerColor || '#3498db').bold;
  const colWidths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map(r => (r[i] || '').length))
  );

  const headerRow = headers
    .map((h, i) => headerColor(h.padEnd(colWidths[i])))
    .join('  ');

  const separator = colWidths.map(w => '─'.repeat(w)).join('──');

  const dataRows = rows.map(row =>
    row.map((cell, i) => (cell || '').padEnd(colWidths[i])).join('  ')
  );

  return [headerRow, separator, ...dataRows].join('\n');
}
```

## Dependencies

```json
{
  "dependencies": {
    "chalk": "^5.0.0"
  }
}
```

## Target Processes

- cli-output-formatting
- error-handling-user-feedback
- cli-application-bootstrap
