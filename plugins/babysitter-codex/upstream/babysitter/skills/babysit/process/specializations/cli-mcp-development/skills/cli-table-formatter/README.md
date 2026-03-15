# CLI Table Formatter Skill

Generate table formatters for structured CLI output with various border styles.

## Overview

This skill creates table formatters for displaying structured data in CLI applications, supporting various border styles, column alignment, and custom formatting.

## When to Use

- Displaying tabular data in CLI
- Creating formatted list output
- Configuring column widths
- Supporting various border styles

## Quick Start

```typescript
import { table, TableFormatter } from './table';

console.log(table([
  { name: 'Alice', role: 'Admin' },
  { name: 'Bob', role: 'User' },
]));
```

## Features

- Multiple border styles
- Column alignment
- Custom cell formatters
- Responsive sizing
- Unicode support

## Integration with Processes

| Process | Integration |
|---------|-------------|
| cli-output-formatting | Table display |
| dashboard-monitoring-tui | Data tables |
| cli-application-bootstrap | Output utilities |
