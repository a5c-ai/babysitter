# sentry-desktop-setup

Configure Sentry for comprehensive desktop application crash reporting and monitoring.

## Overview

This skill sets up Sentry SDK integration for desktop applications, providing crash reporting, error tracking, performance monitoring, and release health tracking. It supports Electron, Tauri, and native desktop frameworks.

## Quick Start

### Basic Electron Setup

```javascript
const result = await invokeSkill('sentry-desktop-setup', {
  projectPath: '/path/to/electron-app',
  framework: 'electron',
  sentryConfig: {
    organization: 'my-org',
    project: 'my-desktop-app'
  }
});
```

### Full Configuration

```javascript
const result = await invokeSkill('sentry-desktop-setup', {
  projectPath: '/path/to/electron-app',
  framework: 'electron',
  sentryConfig: {
    organization: 'my-org',
    project: 'my-desktop-app',
    environment: 'production'
  },
  features: [
    'crashReporting',
    'errorTracking',
    'performanceMonitoring',
    'sessionTracking',
    'releaseHealth',
    'sourceMaps',
    'userFeedback',
    'nativeCrashes'
  ],
  sampling: {
    tracesSampleRate: 0.1,
    errorSampleRate: 1.0,
    profilesSampleRate: 0.1
  },
  privacy: {
    scrubData: true,
    scrubFields: ['password', 'token', 'secret'],
    ipAddress: 'off'
  },
  ci: {
    generateWorkflow: true,
    provider: 'github-actions'
  }
});
```

## Features

### Monitoring Capabilities

| Feature | Description |
|---------|-------------|
| Crash Reporting | Native and JS crash capture |
| Error Tracking | Unhandled exceptions and rejections |
| Performance | Transaction tracing and metrics |
| Session Tracking | User session analytics |
| Release Health | Crash-free session rates |
| Source Maps | Readable stack traces |
| User Feedback | Crash report dialog |

### Framework Support

- **Electron** - Full support (main + renderer)
- **Tauri** - Rust backend + frontend
- **Qt** - C++ integration
- **WPF/.NET** - .NET SDK
- **macOS Native** - Swift/Objective-C SDK

## Generated Files

```
src/
  main/sentry/
    sentry-main.ts        # Main process init
    crash-reporter.ts     # Native crashes
  renderer/sentry/
    sentry-renderer.ts    # Renderer init
    error-boundary.tsx    # React boundary
    user-feedback.ts      # Feedback dialog
scripts/
  sentry-release.js       # Release script
```

## Usage

### Initialize in Main Process

```typescript
// main.ts
import { initSentryMain } from './sentry/sentry-main';

app.on('ready', () => {
  initSentryMain();
  createWindow();
});
```

### Initialize in Renderer

```typescript
// renderer/index.tsx
import { initSentryRenderer } from './sentry/sentry-renderer';

initSentryRenderer();

ReactDOM.render(<App />, document.getElementById('root'));
```

### Wrap with Error Boundary

```tsx
import { ErrorBoundary } from './sentry/error-boundary';

function App() {
  return (
    <ErrorBoundary>
      <MainContent />
    </ErrorBoundary>
  );
}
```

### Capture Custom Errors

```typescript
import { captureMainException } from './sentry/sentry-main';

try {
  await riskyOperation();
} catch (error) {
  captureMainException(error, {
    operation: 'riskyOperation',
    userId: currentUser.id
  });
}
```

## Performance Monitoring

### Track App Startup

```typescript
import { measureAppStartup } from './sentry/sentry-performance';

const startup = measureAppStartup();

// Measure different phases
startup.setMeasurement('window-created', Date.now() - startTime, 'millisecond');
startup.setMeasurement('dom-ready', Date.now() - startTime, 'millisecond');

startup.finish();
```

### Custom Spans

```typescript
import { measureOperation } from './sentry/sentry-performance';

const data = await measureOperation('load-user-data', async () => {
  return await fetchUserData();
});
```

## Release Management

### Create Release

```bash
# Set environment variables
export SENTRY_AUTH_TOKEN=your-token
export SENTRY_ORG=my-org
export SENTRY_PROJECT=my-app

# Create release
npm run sentry:release
```

### Upload Source Maps

```bash
sentry-cli releases files "my-app@1.0.0" upload-sourcemaps ./dist
```

### Associate Commits

```bash
sentry-cli releases set-commits "my-app@1.0.0" --auto
```

## Configuration Options

### Sampling

```typescript
{
  // Error sampling (1.0 = 100% of errors)
  errorSampleRate: 1.0,

  // Transaction sampling (0.1 = 10% of transactions)
  tracesSampleRate: 0.1,

  // Profile sampling (subset of traced transactions)
  profilesSampleRate: 0.1,

  // Custom sampler
  tracesSampler: (samplingContext) => {
    if (samplingContext.transactionContext.name === 'critical-operation') {
      return 1.0; // Always sample critical operations
    }
    return 0.1;
  }
}
```

### Privacy

```typescript
{
  beforeSend(event) {
    // Remove sensitive data
    if (event.request?.data) {
      delete event.request.data.password;
      delete event.request.data.creditCard;
    }

    // Anonymize user
    if (event.user) {
      event.user.id = hashUserId(event.user.id);
      delete event.user.email;
    }

    return event;
  },

  // IP address handling
  sendDefaultPii: false,
}
```

### Context

```typescript
// Set user context
Sentry.setUser({
  id: user.id,
  username: user.username,
  subscription: user.plan
});

// Set custom context
Sentry.setContext('feature-flags', {
  betaFeatures: true,
  experimentGroup: 'A'
});

// Set tags
Sentry.setTag('app-region', 'us-west');
```

## User Feedback

### Show Feedback Dialog

```typescript
import { showFeedbackDialog } from './sentry/user-feedback';

// After catching an error
try {
  await operation();
} catch (error) {
  const eventId = Sentry.captureException(error);
  showFeedbackDialog(eventId);
}
```

### Custom Feedback Form

```tsx
import { submitUserFeedback } from './sentry/user-feedback';

function FeedbackForm({ eventId }) {
  const handleSubmit = async (data) => {
    await submitUserFeedback(eventId, {
      name: data.name,
      email: data.email,
      comments: data.message
    });
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

## CI/CD Integration

### GitHub Actions

```yaml
- name: Create Sentry Release
  env:
    SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
  run: npm run sentry:release
```

### Environment Variables

```bash
# Required
SENTRY_DSN=https://xxx@sentry.io/xxx

# For release management
SENTRY_AUTH_TOKEN=your-auth-token
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
```

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Events not appearing | Wrong DSN | Verify `SENTRY_DSN` |
| Minified stack traces | Missing source maps | Upload source maps |
| Native crashes missing | SDK not initialized | Init before app ready |
| High data usage | Sampling too high | Lower `tracesSampleRate` |
| PII in events | beforeSend not configured | Add data scrubbing |

## Best Practices

1. **Initialize early** - Before any error can occur
2. **Use meaningful releases** - `appname@version+build`
3. **Upload source maps** - Essential for debugging
4. **Configure sampling** - Balance data vs cost
5. **Scrub PII** - Comply with privacy regulations
6. **Track release health** - Monitor crash-free rates

## References

- [Sentry Electron SDK](https://docs.sentry.io/platforms/javascript/guides/electron/)
- [Sentry CLI](https://docs.sentry.io/product/cli/)
- [Release Management](https://docs.sentry.io/product/releases/)
- [Performance Monitoring](https://docs.sentry.io/product/performance/)

## Related Skills

- `electron-builder-config`
- `electron-auto-updater-setup`
- `gdpr-consent-manager`

## Version History

- **1.0.0** - Initial release with crash reporting
- **1.1.0** - Added performance monitoring
- **1.2.0** - Added release health tracking
- **1.3.0** - Added user feedback integration
