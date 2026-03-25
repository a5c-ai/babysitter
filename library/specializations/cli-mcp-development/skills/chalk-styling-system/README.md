# Chalk Styling System Skill

Create consistent chalk-based color and styling system for CLI output.

## Overview

This skill sets up a comprehensive styling system using chalk, providing themed colors, semantic helpers, and formatting utilities for CLI applications.

## When to Use

- Creating consistent CLI color schemes
- Defining semantic output styling
- Building text formatting utilities
- Supporting multiple themes

## Quick Start

```typescript
import { style, log, box } from './styling';

log.success('Operation completed');
log.error('Something went wrong');

console.log(style.primary('Important text'));
console.log(box('Content here', { title: 'Box Title' }));
```

## Features

- Color theme system
- Semantic log helpers
- Box drawing utilities
- Table formatting
- Conditional styling

## Integration with Processes

| Process | Integration |
|---------|-------------|
| cli-output-formatting | Styling utilities |
| error-handling-user-feedback | Error formatting |
| cli-application-bootstrap | Theme setup |
