---
name: cross-platform-path-handler
description: Generate cross-platform path handling utilities for Windows, macOS, and Linux compatibility in CLI applications.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Cross-Platform Path Handler

Generate cross-platform path handling utilities.

## Capabilities

- Normalize path separators
- Handle home directory expansion
- Create platform-specific path utilities
- Configure config directory locations
- Handle UNC paths on Windows
- Generate path manipulation helpers

## Generated Patterns

### TypeScript Path Utilities

```typescript
import path from 'path';
import os from 'os';
import fs from 'fs';

export function normalizePath(p: string): string {
  return p.replace(/\\/g, '/');
}

export function toPlatformPath(p: string): string {
  return p.split('/').join(path.sep);
}

export function expandHome(p: string): string {
  if (p.startsWith('~')) {
    return path.join(os.homedir(), p.slice(1));
  }
  return p;
}

export function getConfigDir(appName: string): string {
  const platform = process.platform;
  if (platform === 'win32') {
    return path.join(process.env.APPDATA || '', appName);
  }
  if (platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', appName);
  }
  return path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'), appName);
}

export function getDataDir(appName: string): string {
  const platform = process.platform;
  if (platform === 'win32') {
    return path.join(process.env.LOCALAPPDATA || '', appName);
  }
  if (platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', appName);
  }
  return path.join(process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share'), appName);
}

export function getCacheDir(appName: string): string {
  const platform = process.platform;
  if (platform === 'win32') {
    return path.join(process.env.LOCALAPPDATA || '', appName, 'Cache');
  }
  if (platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Caches', appName);
  }
  return path.join(process.env.XDG_CACHE_HOME || path.join(os.homedir(), '.cache'), appName);
}
```

## Target Processes

- cross-platform-cli-compatibility
- configuration-management-system
- cli-application-bootstrap
