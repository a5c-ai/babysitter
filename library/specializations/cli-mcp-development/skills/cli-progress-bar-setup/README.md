# CLI Progress Bar Setup Skill

Configure cli-progress with custom formatters and multi-bar support for progress indication.

## Overview

This skill sets up cli-progress for CLI applications, providing single bars, multi-bars, and progress utilities for batch processing.

## When to Use

- Showing download/upload progress
- Displaying multi-task progress
- Creating custom progress formats
- Processing batches with feedback

## Quick Start

```typescript
await processBatch(
  files,
  async (file) => processFile(file),
  { label: 'Processing files' }
);
```

## Features

- Single and multi-bar progress
- Custom format templates
- ETA calculations
- Batch processing utilities
- Parallel task progress

## Integration with Processes

| Process | Integration |
|---------|-------------|
| progress-status-indicators | Progress bars |
| cli-output-formatting | Display formatting |
| cli-application-bootstrap | Progress utilities |
