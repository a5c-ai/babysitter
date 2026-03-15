# electron-architect

Expert agent for Electron application architecture, security, and performance.

## Overview

The electron-architect agent provides expert guidance on Electron application development, including architecture design, IPC patterns, security hardening, performance optimization, and cross-platform deployment strategies.

## Quick Start

### Architecture Review

```javascript
const result = await invokeAgent('electron-architect', {
  task: 'Review the architecture of our Electron app',
  context: {
    projectPath: '/path/to/electron-app',
    electronVersion: '28.0.0',
    concerns: ['security', 'performance', 'maintainability']
  }
});
```

### Security Audit

```javascript
const result = await invokeAgent('electron-architect', {
  task: 'Perform security audit',
  context: {
    projectPath: '/path/to/electron-app',
    features: ['file-access', 'network-requests', 'native-modules']
  },
  analysisDepth: 'comprehensive'
});
```

## Expertise Areas

### Architecture Design

- Main/renderer process separation
- IPC communication patterns
- State management strategies
- Multi-window architectures
- Plugin systems

### Security

- Context isolation implementation
- Preload script security
- IPC channel validation
- Content Security Policy
- Code signing and notarization

### Performance

- Startup time optimization
- Memory leak detection
- Bundle size reduction
- Lazy loading strategies
- V8 optimization

### Cross-Platform

- Platform abstraction layers
- Native module integration
- Platform-specific features
- Unified API design

## Common Tasks

### Design IPC Architecture

```javascript
const result = await invokeAgent('electron-architect', {
  task: 'Design IPC architecture for file management feature',
  context: {
    requirements: [
      'CRUD operations for files',
      'Progress reporting for large files',
      'Cancellation support',
      'Error handling with retry'
    ]
  }
});

// Output includes:
// - IPC channel definitions
// - Request/response schemas
// - Error handling patterns
// - Security considerations
```

### Optimize Performance

```javascript
const result = await invokeAgent('electron-architect', {
  task: 'Optimize application startup time',
  context: {
    currentStartupTime: '8 seconds',
    projectPath: '/path/to/app',
    electronVersion: '28.0.0'
  }
});

// Output includes:
// - Startup analysis
// - Bottleneck identification
// - Optimization recommendations
// - Code examples
```

### Plan Migration

```javascript
const result = await invokeAgent('electron-architect', {
  task: 'Plan migration from Electron 22 to 30',
  context: {
    projectPath: '/path/to/app',
    currentVersion: '22.3.0',
    targetVersion: '30.0.0'
  }
});

// Output includes:
// - Breaking changes list
// - Deprecated API replacements
// - Migration steps
// - Testing requirements
```

## Output Format

### Analysis Report

```json
{
  "analysis": {
    "summary": "Application architecture is solid but has security gaps",
    "findings": [
      {
        "area": "IPC Security",
        "observation": "IPC channels not whitelisted in preload",
        "severity": "critical",
        "recommendation": "Implement channel whitelist"
      }
    ]
  },
  "recommendations": [
    {
      "title": "Enable Context Isolation",
      "description": "Context isolation prevents prototype pollution",
      "priority": "critical",
      "effort": "small",
      "codeExample": "contextIsolation: true"
    }
  ]
}
```

### Architecture Diagram

```
┌─────────────────────────────────────────┐
│              Main Process               │
├─────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  │
│  │ IPC     │  │ File    │  │ Window  │  │
│  │ Handler │  │ Manager │  │ Manager │  │
│  └────┬────┘  └────┬────┘  └────┬────┘  │
└───────┼────────────┼────────────┼───────┘
        │ contextBridge            │
┌───────┼────────────┼────────────┼───────┐
│       ▼            ▼            ▼       │
│  ┌─────────────────────────────────┐    │
│  │         Preload Script          │    │
│  │      (Context Isolated)         │    │
│  └─────────────────────────────────┘    │
│              Renderer Process           │
├─────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  │
│  │ React   │  │ State   │  │ API     │  │
│  │ UI      │  │ Store   │  │ Client  │  │
│  └─────────┘  └─────────┘  └─────────┘  │
└─────────────────────────────────────────┘
```

## Security Guidelines

### Must Have

1. **Context Isolation**: Always `contextIsolation: true`
2. **Node Integration**: Always `nodeIntegration: false`
3. **Sandbox**: Enable `sandbox: true`
4. **Web Security**: Never disable `webSecurity`
5. **IPC Whitelist**: Only expose needed channels

### Should Have

1. Content Security Policy headers
2. Permission request handlers
3. Navigation guards
4. Code signing (all platforms)
5. Notarization (macOS)

### Avoid

1. `nodeIntegration: true` in production
2. Exposing `ipcRenderer` directly
3. Using `remote` module
4. Loading remote content without CSP
5. Executing user-provided code

## Performance Benchmarks

| Metric | Good | Acceptable | Poor |
|--------|------|------------|------|
| Cold Start | < 2s | < 5s | > 8s |
| Memory (idle) | < 100MB | < 200MB | > 400MB |
| Bundle Size | < 80MB | < 150MB | > 250MB |
| IPC Latency | < 5ms | < 20ms | > 50ms |

## Integration with Skills

The electron-architect agent works with these skills:

| Skill | Use Case |
|-------|----------|
| `electron-builder-config` | Build configuration guidance |
| `electron-main-preload-generator` | Generate secure boilerplate |
| `electron-ipc-security-audit` | Deep IPC security analysis |
| `electron-auto-updater-setup` | Auto-update architecture |
| `playwright-electron-config` | Testing strategy |

## Best Practices

### Architecture

1. Keep main process lightweight
2. Use utility processes for heavy computation
3. Minimize IPC round trips
4. Implement proper error boundaries
5. Design for offline-first

### Development

1. Use TypeScript for type safety
2. Implement proper logging
3. Add comprehensive tests
4. Document IPC contracts
5. Version your IPC API

### Deployment

1. Test on all target platforms
2. Implement staged rollouts
3. Monitor crash reports
4. Track performance metrics
5. Plan for rollback

## Resources

### Official Documentation

- [Electron Documentation](https://www.electronjs.org/docs)
- [Security Tutorial](https://www.electronjs.org/docs/latest/tutorial/security)
- [Performance Tutorial](https://www.electronjs.org/docs/latest/tutorial/performance)

### Community Resources

- [electron-pro subagent](https://github.com/VoltAgent/awesome-claude-code-subagents)
- [Electron GitHub](https://github.com/electron/electron)
- [Electron Fiddle](https://www.electronjs.org/fiddle)

## Version Compatibility

| Agent Version | Electron Versions |
|---------------|-------------------|
| 1.0.x | 22.x - 28.x |
| 1.1.x | 28.x - 30.x |
| 1.2.x | 30.x - latest |

## Related Agents

- `desktop-security-auditor`
- `desktop-ci-architect`
- `desktop-test-architect`
- `release-manager`
