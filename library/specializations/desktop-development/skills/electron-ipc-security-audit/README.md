# electron-ipc-security-audit

Analyze Electron IPC implementations for security vulnerabilities.

## Overview

This skill performs comprehensive security audits of Electron applications, focusing on inter-process communication patterns. It identifies vulnerabilities related to contextIsolation, nodeIntegration, preload scripts, and IPC channel security.

## Quick Start

```javascript
const result = await invokeSkill('electron-ipc-security-audit', {
  projectPath: '/path/to/electron-app',
  auditScope: ['all'],
  severity: 'all',
  includeRecommendations: true
});
```

## Features

### Security Checks

| Category | Checks Performed |
|----------|------------------|
| Context Isolation | contextIsolation, nodeIntegration, sandbox settings |
| IPC Security | Channel validation, input sanitization, whitelist enforcement |
| Preload Scripts | contextBridge usage, exposed APIs, prototype pollution |
| CSP | Content Security Policy headers, script-src directives |
| Code Execution | eval, Function, dynamic code risks |

### Severity Levels

- **Critical**: Immediate exploitation risk (nodeIntegration enabled, direct ipcRenderer exposure)
- **High**: Significant security weakness (missing input validation, webSecurity disabled)
- **Medium**: Best practice violation (overly permissive access, missing CSP)
- **Low**: Minor improvements recommended

## Output

```json
{
  "success": true,
  "summary": {
    "totalIssues": 5,
    "critical": 1,
    "high": 2,
    "medium": 2,
    "low": 0
  },
  "findings": [
    {
      "id": "IPC-001",
      "severity": "critical",
      "category": "IPC Security",
      "title": "Direct ipcRenderer exposure",
      "description": "ipcRenderer is exposed directly through contextBridge",
      "file": "src/preload.js",
      "line": 15,
      "recommendation": "Expose only whitelisted channels through contextBridge"
    }
  ],
  "securityScore": 45
}
```

## Common Findings

### Critical Issues

1. **nodeIntegration: true** - Allows renderer to access Node.js APIs
2. **contextIsolation: false** - Enables prototype pollution attacks
3. **Direct ipcRenderer exposure** - Allows arbitrary IPC communication

### Remediation Examples

```javascript
// Before (Vulnerable)
new BrowserWindow({
  webPreferences: {
    nodeIntegration: true,
    contextIsolation: false
  }
});

// After (Secure)
new BrowserWindow({
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    sandbox: true,
    preload: path.join(__dirname, 'preload.js')
  }
});
```

## Related Skills

- `electron-main-preload-generator`
- `electron-builder-config`

## Related Agents

- `electron-architect`
- `desktop-security-auditor`
