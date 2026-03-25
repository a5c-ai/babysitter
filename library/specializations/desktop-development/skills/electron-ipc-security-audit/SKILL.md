---
name: electron-ipc-security-audit
description: Analyze Electron IPC implementations for security vulnerabilities including contextIsolation, nodeIntegration, preload scripts, and channel validation
allowed-tools: Read, Grep, Glob, Bash
tags: [electron, security, ipc, audit, desktop]
---

# electron-ipc-security-audit

Analyze Electron IPC implementations for security vulnerabilities. This skill performs comprehensive security audits of inter-process communication patterns, checking for contextIsolation issues, nodeIntegration risks, preload script security, and IPC channel validation.

## Capabilities

- Audit IPC channel implementations for security vulnerabilities
- Check contextIsolation and nodeIntegration configuration
- Analyze preload scripts for unsafe patterns
- Validate IPC message handling and sanitization
- Detect prototype pollution risks
- Check for remote code execution vulnerabilities
- Review Content Security Policy headers
- Identify exposed APIs through contextBridge

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectPath": {
      "type": "string",
      "description": "Path to the Electron project root"
    },
    "auditScope": {
      "type": "array",
      "items": {
        "enum": ["ipc-channels", "preload-scripts", "main-process", "renderer-security", "csp", "all"]
      },
      "default": ["all"]
    },
    "severity": {
      "enum": ["all", "critical", "high", "medium"],
      "default": "all",
      "description": "Minimum severity level to report"
    },
    "includeRecommendations": {
      "type": "boolean",
      "default": true
    }
  },
  "required": ["projectPath"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "summary": {
      "type": "object",
      "properties": {
        "totalIssues": { "type": "number" },
        "critical": { "type": "number" },
        "high": { "type": "number" },
        "medium": { "type": "number" },
        "low": { "type": "number" }
      }
    },
    "findings": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "severity": { "enum": ["critical", "high", "medium", "low"] },
          "category": { "type": "string" },
          "title": { "type": "string" },
          "description": { "type": "string" },
          "file": { "type": "string" },
          "line": { "type": "number" },
          "recommendation": { "type": "string" },
          "codeExample": { "type": "string" }
        }
      }
    },
    "securityScore": {
      "type": "number",
      "description": "Security score 0-100"
    }
  },
  "required": ["success", "findings"]
}
```

## Security Checks

### Critical Checks

1. **nodeIntegration enabled**: Check for `nodeIntegration: true` in BrowserWindow
2. **contextIsolation disabled**: Check for `contextIsolation: false`
3. **sandbox disabled**: Check for `sandbox: false`
4. **Direct ipcRenderer exposure**: Check for exposing ipcRenderer without contextBridge
5. **Remote module usage**: Check for deprecated remote module
6. **eval/Function execution**: Check for dynamic code execution in IPC handlers

### High Severity Checks

1. **Unrestricted IPC channels**: Check for `ipcMain.on('*')` patterns
2. **Missing input validation**: Check for unsanitized IPC arguments
3. **webSecurity disabled**: Check for `webSecurity: false`
4. **Unsafe protocol registration**: Check for custom protocol handlers
5. **Missing CSP headers**: Check for Content Security Policy

### Medium Severity Checks

1. **Overly permissive file access**: Check for broad file system access
2. **Insecure web preferences**: Check deprecated options
3. **Missing channel whitelisting**: Check preload script exposure
4. **Navigation to untrusted URLs**: Check navigation handlers

## Usage Instructions

1. **Scan project structure**: Identify main process, preload, and renderer files
2. **Check BrowserWindow configurations**: Audit webPreferences settings
3. **Analyze IPC implementations**: Review ipcMain/ipcRenderer usage
4. **Review preload scripts**: Check contextBridge API exposure
5. **Validate CSP headers**: Ensure proper Content Security Policy
6. **Generate report**: Compile findings with severity and recommendations

## Vulnerability Patterns

### Critical: Direct ipcRenderer Exposure

```javascript
// BAD: Exposing ipcRenderer directly
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: ipcRenderer // CRITICAL VULNERABILITY
});

// GOOD: Expose only specific channels
contextBridge.exposeInMainWorld('electron', {
  send: (channel, data) => {
    const validChannels = ['file:read', 'file:write'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  }
});
```

### Critical: Missing Context Isolation

```javascript
// BAD: Context isolation disabled
new BrowserWindow({
  webPreferences: {
    contextIsolation: false, // CRITICAL
    preload: path.join(__dirname, 'preload.js')
  }
});

// GOOD: Context isolation enabled
new BrowserWindow({
  webPreferences: {
    contextIsolation: true,
    sandbox: true,
    preload: path.join(__dirname, 'preload.js')
  }
});
```

### High: Unrestricted IPC Handler

```javascript
// BAD: Executing arbitrary commands
ipcMain.handle('execute', async (event, cmd) => {
  return exec(cmd); // HIGH RISK
});

// GOOD: Whitelisted commands only
const ALLOWED_COMMANDS = ['list-files', 'get-info'];
ipcMain.handle('execute', async (event, cmd, args) => {
  if (!ALLOWED_COMMANDS.includes(cmd)) {
    throw new Error('Command not allowed');
  }
  return executeWhitelistedCommand(cmd, args);
});
```

## Best Practices

1. **Always enable contextIsolation**: Prevents prototype pollution
2. **Use sandbox mode**: Restricts renderer process capabilities
3. **Whitelist IPC channels**: Only expose necessary channels
4. **Validate all IPC inputs**: Never trust renderer input
5. **Avoid dynamic code execution**: No eval/Function in IPC handlers
6. **Implement CSP headers**: Restrict script sources
7. **Use invoke/handle pattern**: Prefer over send/on for request-response

## Related Skills

- `electron-main-preload-generator` - Generate secure boilerplate
- `electron-builder-config` - Build configuration
- `desktop-security-auditor` agent - Comprehensive security review

## Related Agents

- `electron-architect` - Architecture guidance
- `desktop-security-auditor` - Security expertise

## References

- [Electron Security Tutorial](https://www.electronjs.org/docs/latest/tutorial/security)
- [Context Isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation)
- [Process Sandboxing](https://www.electronjs.org/docs/latest/tutorial/sandbox)
