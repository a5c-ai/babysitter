---
name: sentry-desktop-setup
description: Configure Sentry for comprehensive desktop application crash reporting, error monitoring, performance tracking, and release health for Electron and native desktop apps
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
tags: [desktop, monitoring, crash-reporting, sentry, electron, observability]
---

# sentry-desktop-setup

Configure Sentry for comprehensive desktop application monitoring including crash reporting, error tracking, performance monitoring, and release health. This skill sets up Sentry SDK integration for Electron and native desktop applications with source maps, session tracking, and custom instrumentation.

## Capabilities

- Configure Sentry SDK for Electron (main + renderer processes)
- Set up native crash reporting with minidump support
- Configure source map uploads for readable stack traces
- Implement performance monitoring and tracing
- Set up release tracking with commit integration
- Configure session tracking for release health
- Implement custom error boundaries and handlers
- Set up user feedback collection
- Configure environment-specific DSNs and sampling

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectPath": {
      "type": "string",
      "description": "Path to the desktop application project"
    },
    "framework": {
      "enum": ["electron", "tauri", "qt", "wpf", "macos-native"],
      "default": "electron"
    },
    "sentryConfig": {
      "type": "object",
      "properties": {
        "dsn": { "type": "string", "description": "Sentry DSN (or use env variable)" },
        "organization": { "type": "string" },
        "project": { "type": "string" },
        "environment": { "type": "string", "default": "production" }
      },
      "required": ["organization", "project"]
    },
    "features": {
      "type": "array",
      "items": {
        "enum": [
          "crashReporting",
          "errorTracking",
          "performanceMonitoring",
          "sessionTracking",
          "releaseHealth",
          "sourceMaps",
          "userFeedback",
          "customContext",
          "breadcrumbs",
          "nativeCrashes"
        ]
      },
      "default": ["crashReporting", "errorTracking", "performanceMonitoring", "sourceMaps"]
    },
    "sampling": {
      "type": "object",
      "properties": {
        "tracesSampleRate": { "type": "number", "default": 0.1 },
        "errorSampleRate": { "type": "number", "default": 1.0 },
        "profilesSampleRate": { "type": "number", "default": 0.1 }
      }
    },
    "privacy": {
      "type": "object",
      "properties": {
        "scrubData": { "type": "boolean", "default": true },
        "scrubFields": { "type": "array", "items": { "type": "string" } },
        "ipAddress": { "enum": ["auto", "off"], "default": "off" }
      }
    },
    "ci": {
      "type": "object",
      "properties": {
        "generateWorkflow": { "type": "boolean", "default": true },
        "provider": { "enum": ["github-actions", "azure-devops", "circleci"] }
      }
    }
  },
  "required": ["projectPath", "sentryConfig"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "files": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "path": { "type": "string" },
          "type": { "enum": ["config", "main", "renderer", "utils", "ci"] }
        }
      }
    },
    "commands": {
      "type": "object",
      "properties": {
        "uploadSourceMaps": { "type": "string" },
        "createRelease": { "type": "string" },
        "testIntegration": { "type": "string" }
      }
    },
    "envVariables": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "description": { "type": "string" }
        }
      }
    }
  },
  "required": ["success", "files"]
}
```

## Generated File Structure

```
src/
  main/
    sentry/
      sentry-main.ts       # Main process Sentry init
      crash-reporter.ts    # Native crash handling
      ipc-handlers.ts      # Sentry IPC handlers
  renderer/
    sentry/
      sentry-renderer.ts   # Renderer Sentry init
      error-boundary.tsx   # React error boundary
      user-feedback.ts     # Feedback dialog
  shared/
    sentry-config.ts       # Shared configuration
    context-utils.ts       # Context helpers
scripts/
  sentry-release.js        # Release script
.github/workflows/
  sentry-release.yml       # CI workflow
```

## Code Templates

### Main Process Sentry Configuration

```typescript
// src/main/sentry/sentry-main.ts
import * as Sentry from '@sentry/electron/main';
import { app } from 'electron';

export function initSentryMain() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'production',
    release: `${app.getName()}@${app.getVersion()}`,

    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: 0.1,

    // Session tracking
    autoSessionTracking: true,

    // Native crash reporting
    enableNative: true,

    // Privacy
    beforeSend(event) {
      // Scrub sensitive data
      if (event.user) {
        delete event.user.ip_address;
      }
      return event;
    },

    // Integrations
    integrations: [
      Sentry.electronMinidumpIntegration(),
      Sentry.mainProcessIntegration(),
    ],
  });

  // Set app context
  Sentry.setContext('app', {
    name: app.getName(),
    version: app.getVersion(),
    platform: process.platform,
    arch: process.arch,
    electron: process.versions.electron,
  });
}

export function captureMainException(error: Error, context?: Record<string, unknown>) {
  Sentry.withScope((scope) => {
    scope.setTag('process', 'main');
    if (context) {
      scope.setExtras(context);
    }
    Sentry.captureException(error);
  });
}
```

### Renderer Process Sentry Configuration

```typescript
// src/renderer/sentry/sentry-renderer.ts
import * as Sentry from '@sentry/electron/renderer';
import { init as sentryReactInit, browserTracingIntegration } from '@sentry/react';

export function initSentryRenderer() {
  sentryReactInit({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'production',
    release: window.electronAPI.getAppVersion(),

    // Performance
    tracesSampleRate: 0.1,

    // Integrations
    integrations: [
      browserTracingIntegration(),
      Sentry.electronRendererIntegration(),
    ],

    // Breadcrumbs
    beforeBreadcrumb(breadcrumb) {
      // Filter out noisy breadcrumbs
      if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
        return null;
      }
      return breadcrumb;
    },
  });

  // Add custom context
  Sentry.setTag('renderer', 'main-window');
}

// React Error Boundary wrapper
export function withSentryErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback: React.ReactNode
) {
  return Sentry.withErrorBoundary(Component, {
    fallback,
    showDialog: true,
  });
}
```

### React Error Boundary

```tsx
// src/renderer/sentry/error-boundary.tsx
import React from 'react';
import * as Sentry from '@sentry/react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  eventId: string | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, eventId: null };

  static getDerivedStateFromError(): State {
    return { hasError: true, eventId: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.withScope((scope) => {
      scope.setExtras({
        componentStack: errorInfo.componentStack,
      });
      const eventId = Sentry.captureException(error);
      this.setState({ eventId });
    });
  }

  handleReportClick = () => {
    if (this.state.eventId) {
      Sentry.showReportDialog({ eventId: this.state.eventId });
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="error-boundary">
            <h2>Something went wrong</h2>
            <p>We've been notified and are working on a fix.</p>
            <div className="error-actions">
              <button onClick={this.handleReportClick}>
                Report Feedback
              </button>
              <button onClick={this.handleReload}>
                Reload Application
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
```

### User Feedback Collection

```typescript
// src/renderer/sentry/user-feedback.ts
import * as Sentry from '@sentry/react';

export interface FeedbackData {
  name: string;
  email: string;
  comments: string;
}

export async function submitUserFeedback(
  eventId: string,
  feedback: FeedbackData
) {
  await Sentry.sendFeedback({
    event_id: eventId,
    name: feedback.name,
    email: feedback.email,
    message: feedback.comments,
  });
}

export function showFeedbackDialog(eventId?: string) {
  Sentry.showReportDialog({
    eventId,
    title: 'Help us improve',
    subtitle: 'Tell us what happened',
    subtitle2: 'Your feedback helps us fix issues faster',
    labelSubmit: 'Send Report',
    labelClose: 'Close',
  });
}

// Programmatic feedback capture
export function captureUserFeedback(
  category: string,
  message: string,
  metadata?: Record<string, unknown>
) {
  Sentry.captureMessage(message, {
    level: 'info',
    tags: { category, type: 'user-feedback' },
    extra: metadata,
  });
}
```

### Performance Monitoring

```typescript
// src/shared/sentry-performance.ts
import * as Sentry from '@sentry/electron/renderer';

// Custom transaction for app startup
export function measureAppStartup() {
  const transaction = Sentry.startTransaction({
    name: 'app-startup',
    op: 'app.startup',
  });

  return {
    finish: () => transaction.finish(),
    setMeasurement: (name: string, value: number, unit: string) => {
      transaction.setMeasurement(name, value, unit as any);
    },
  };
}

// Measure specific operations
export async function measureOperation<T>(
  name: string,
  operation: () => Promise<T>
): Promise<T> {
  const span = Sentry.startSpan({
    name,
    op: 'function',
  }, async (span) => {
    try {
      return await operation();
    } finally {
      span?.end();
    }
  });

  return span;
}

// Track custom metrics
export function trackMetric(
  name: string,
  value: number,
  unit: 'none' | 'millisecond' | 'byte' | 'percent' = 'none'
) {
  Sentry.setMeasurement(name, value, unit);
}
```

### Release Script

```javascript
// scripts/sentry-release.js
const { execSync } = require('child_process');
const pkg = require('../package.json');

const release = `${pkg.name}@${pkg.version}`;
const org = process.env.SENTRY_ORG;
const project = process.env.SENTRY_PROJECT;

console.log(`Creating Sentry release: ${release}`);

// Create release
execSync(`sentry-cli releases new ${release} --org ${org} --project ${project}`);

// Associate commits
execSync(`sentry-cli releases set-commits ${release} --auto --org ${org}`);

// Upload source maps
execSync(`sentry-cli releases files ${release} upload-sourcemaps ./dist --org ${org} --project ${project}`);

// Upload debug symbols (for native crashes)
if (process.platform === 'darwin' || process.platform === 'win32') {
  execSync(`sentry-cli upload-dif ./dist --org ${org} --project ${project}`);
}

// Finalize release
execSync(`sentry-cli releases finalize ${release} --org ${org}`);

// Create deployment
const environment = process.env.NODE_ENV || 'production';
execSync(`sentry-cli releases deploys ${release} new -e ${environment} --org ${org}`);

console.log('Sentry release complete!');
```

### GitHub Actions Workflow

```yaml
# .github/workflows/sentry-release.yml
name: Sentry Release

on:
  release:
    types: [published]

jobs:
  sentry:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # For commit association

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Create Sentry release
        env:
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
          SENTRY_ORG: ${{ vars.SENTRY_ORG }}
          SENTRY_PROJECT: ${{ vars.SENTRY_PROJECT }}
        run: |
          npm install -g @sentry/cli
          sentry-cli releases new "${{ github.event.release.tag_name }}"
          sentry-cli releases set-commits "${{ github.event.release.tag_name }}" --auto
          sentry-cli releases files "${{ github.event.release.tag_name }}" upload-sourcemaps ./dist
          sentry-cli releases finalize "${{ github.event.release.tag_name }}"
          sentry-cli releases deploys "${{ github.event.release.tag_name }}" new -e production
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SENTRY_DSN` | Sentry Data Source Name | Yes |
| `SENTRY_AUTH_TOKEN` | Authentication token for CLI | For releases |
| `SENTRY_ORG` | Sentry organization slug | For releases |
| `SENTRY_PROJECT` | Sentry project slug | For releases |

## Best Practices

1. **Use environment-specific DSNs** - Different projects for dev/staging/prod
2. **Enable source maps** - Critical for readable stack traces
3. **Set meaningful release names** - Include version and build number
4. **Configure sampling appropriately** - Balance data with cost
5. **Scrub sensitive data** - Remove PII before sending
6. **Track release health** - Monitor crash-free sessions

## Community References

- [Sentry MCP](https://docs.sentry.io/product/sentry-mcp/)
- [Sentry Electron SDK](https://docs.sentry.io/platforms/javascript/guides/electron/)
- [Sentry CLI Documentation](https://docs.sentry.io/product/cli/)

## Related Skills

- `electron-builder-config` - Build configuration
- `electron-auto-updater-setup` - Track update issues
- `gdpr-consent-manager` - Privacy compliance

## Related Agents

- `desktop-test-architect` - Testing strategy
- `release-manager` - Release coordination
