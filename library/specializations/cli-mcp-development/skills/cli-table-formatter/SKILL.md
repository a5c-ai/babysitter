---
name: cli-table-formatter
description: Generate table formatters for structured CLI output with column alignment, borders, and responsive sizing.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# CLI Table Formatter

Generate table formatters for structured CLI output.

## Capabilities

- Create table formatters with various styles
- Configure column alignment and width
- Implement responsive table sizing
- Support Unicode borders
- Handle multiline cells
- Generate table utilities

## Usage

Invoke this skill when you need to:
- Display tabular data in CLI
- Create formatted list output
- Configure column widths
- Support various border styles

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| language | string | Yes | Target language |
| style | string | No | Border style (simple, unicode, markdown) |
| features | array | No | Required features |

## Generated Patterns

### TypeScript Table Formatter

```typescript
import chalk from 'chalk';

export interface TableColumn {
  key: string;
  header: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  format?: (value: any) => string;
}

export interface TableOptions {
  columns: TableColumn[];
  borderStyle?: 'simple' | 'unicode' | 'none' | 'markdown';
  headerColor?: (text: string) => string;
  maxWidth?: number;
}

const borders = {
  simple: {
    top: '-', bottom: '-', left: '|', right: '|',
    topLeft: '+', topRight: '+', bottomLeft: '+', bottomRight: '+',
    horizontal: '-', vertical: '|', cross: '+',
  },
  unicode: {
    top: '─', bottom: '─', left: '│', right: '│',
    topLeft: '┌', topRight: '┐', bottomLeft: '└', bottomRight: '┘',
    horizontal: '─', vertical: '│', cross: '┼',
    midLeft: '├', midRight: '┤', topMid: '┬', bottomMid: '┴',
  },
  none: {
    top: '', bottom: '', left: '', right: '',
    topLeft: '', topRight: '', bottomLeft: '', bottomRight: '',
    horizontal: '', vertical: '  ', cross: '',
  },
};

export class TableFormatter {
  private columns: TableColumn[];
  private options: TableOptions;
  private border: typeof borders.unicode;

  constructor(options: TableOptions) {
    this.options = options;
    this.columns = options.columns;
    this.border = borders[options.borderStyle || 'unicode'];
  }

  private calculateWidths(data: Record<string, any>[]): number[] {
    return this.columns.map(col => {
      const headerWidth = col.header.length;
      const maxDataWidth = Math.max(
        ...data.map(row => String(row[col.key] ?? '').length)
      );
      return col.width || Math.max(headerWidth, maxDataWidth);
    });
  }

  private padCell(text: string, width: number, align: 'left' | 'center' | 'right' = 'left'): string {
    const padding = width - text.length;
    if (align === 'center') {
      const left = Math.floor(padding / 2);
      const right = padding - left;
      return ' '.repeat(left) + text + ' '.repeat(right);
    }
    if (align === 'right') {
      return ' '.repeat(padding) + text;
    }
    return text + ' '.repeat(padding);
  }

  format(data: Record<string, any>[]): string {
    const widths = this.calculateWidths(data);
    const lines: string[] = [];
    const b = this.border;

    // Top border
    if (b.top) {
      lines.push(
        b.topLeft +
        widths.map(w => b.top.repeat(w + 2)).join(b.topMid || b.cross) +
        b.topRight
      );
    }

    // Header
    const headerCells = this.columns.map((col, i) =>
      ' ' + this.padCell(col.header, widths[i], col.align) + ' '
    );
    const headerColor = this.options.headerColor || chalk.bold;
    lines.push(
      b.left +
      headerCells.map(c => headerColor(c)).join(b.vertical) +
      b.right
    );

    // Header separator
    if (b.horizontal) {
      lines.push(
        (b.midLeft || b.left) +
        widths.map(w => b.horizontal.repeat(w + 2)).join(b.cross) +
        (b.midRight || b.right)
      );
    }

    // Data rows
    for (const row of data) {
      const cells = this.columns.map((col, i) => {
        const value = row[col.key] ?? '';
        const formatted = col.format ? col.format(value) : String(value);
        return ' ' + this.padCell(formatted, widths[i], col.align) + ' ';
      });
      lines.push(b.left + cells.join(b.vertical) + b.right);
    }

    // Bottom border
    if (b.bottom) {
      lines.push(
        b.bottomLeft +
        widths.map(w => b.bottom.repeat(w + 2)).join(b.bottomMid || b.cross) +
        b.bottomRight
      );
    }

    return lines.join('\n');
  }
}

// Quick table function
export function table(
  data: Record<string, any>[],
  columns?: (string | TableColumn)[]
): string {
  const cols: TableColumn[] = columns
    ? columns.map(c => typeof c === 'string' ? { key: c, header: c } : c)
    : Object.keys(data[0] || {}).map(key => ({ key, header: key }));

  return new TableFormatter({ columns: cols }).format(data);
}
```

### Usage Examples

```typescript
// Simple table
console.log(table([
  { name: 'Alice', age: 30, role: 'Admin' },
  { name: 'Bob', age: 25, role: 'User' },
]));

// Custom columns
const formatter = new TableFormatter({
  columns: [
    { key: 'id', header: 'ID', width: 6, align: 'right' },
    { key: 'name', header: 'Name', width: 20 },
    { key: 'status', header: 'Status', format: (v) =>
      v === 'active' ? chalk.green(v) : chalk.red(v)
    },
  ],
  borderStyle: 'unicode',
  headerColor: chalk.cyan.bold,
});

console.log(formatter.format(data));
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
- dashboard-monitoring-tui
- cli-application-bootstrap
