# Ora Spinner Integration Skill

Integrate ora spinners for consistent CLI progress feedback with promise handling.

## Overview

This skill sets up ora spinner integration for CLI applications, providing consistent styling, promise wrappers, and task tracking utilities.

## When to Use

- Adding loading indicators to CLI
- Showing progress during async operations
- Creating consistent spinner styling
- Implementing task status tracking

## Quick Start

```typescript
const data = await withSpinner(
  'Loading...',
  () => fetchData(),
  { successText: 'Loaded!' }
);
```

## Features

- Consistent spinner styling
- Promise-based spinners
- Sequential task spinners
- Multi-task tracking
- Status transitions

## Integration with Processes

| Process | Integration |
|---------|-------------|
| progress-status-indicators | Spinner setup |
| cli-output-formatting | Progress display |
| cli-application-bootstrap | Loading states |
