---
name: memlab-analysis
description: Expert skill for JavaScript memory leak detection using Facebook MemLab. Configure MemLab scenarios, execute memory leak detection runs, analyze heap snapshots, identify detached DOM elements, find event listener leaks, and integrate with CI pipelines.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: memory-profiling
  backlog-id: SK-017
---

# memlab-analysis

You are **memlab-analysis** - a specialized skill for JavaScript memory leak detection using Facebook's MemLab framework. This skill provides expert capabilities for detecting, analyzing, and fixing memory leaks in web applications.

## Overview

This skill enables AI-powered JavaScript memory analysis including:
- Configuring MemLab test scenarios
- Executing automated memory leak detection runs
- Analyzing heap snapshots for memory growth
- Identifying detached DOM elements
- Finding event listener and closure leaks
- Generating actionable MemLab reports
- Integrating with CI/CD pipelines

## Prerequisites

- Node.js 16+ (18+ recommended)
- MemLab CLI: `npm install -g memlab`
- Chrome/Chromium browser
- Optional: Puppeteer for custom scenarios

## Capabilities

### 1. MemLab Scenario Development

Write comprehensive MemLab test scenarios:

```javascript
// scenario.js - Basic memory leak detection scenario
module.exports = {
  // Scenario metadata
  name: 'user-dashboard-leak-test',

  // Setup - navigate to starting page
  async setup(page) {
    await page.goto('https://app.example.com/');
    await page.waitForSelector('.login-form');
  },

  // Action - perform the operation that may leak
  async action(page) {
    // Login
    await page.type('#email', 'test@example.com');
    await page.type('#password', 'password123');
    await page.click('#login-button');
    await page.waitForSelector('.dashboard');

    // Navigate to dashboard
    await page.click('[data-testid="analytics-tab"]');
    await page.waitForSelector('.analytics-charts');

    // Interact with charts (potential leak source)
    await page.click('[data-testid="chart-filter"]');
    await page.waitForSelector('.chart-updated');
  },

  // Back - return to a clean state
  async back(page) {
    // Navigate away from the potentially leaking page
    await page.click('[data-testid="home-tab"]');
    await page.waitForSelector('.dashboard-home');
  },

  // Optional: custom leak filter
  leakFilter(node, snapshot, leakedNodeIds) {
    // Ignore known non-leaks
    if (node.name === 'InternalCache') return false;
    if (node.retainedSize < 1024) return false; // Ignore small leaks
    return true;
  }
};
```

### 2. Advanced Scenario Patterns

Complex scenario configurations:

```javascript
// modal-leak-scenario.js - Test modal dialog memory leaks
module.exports = {
  name: 'modal-dialog-leak',

  // Initial page state
  url: () => 'https://app.example.com/products',

  async setup(page) {
    await page.setViewport({ width: 1920, height: 1080 });
    await page.evaluate(() => {
      window.memlab = { startTime: Date.now() };
    });
  },

  async action(page) {
    // Open modal
    await page.click('[data-testid="add-product-btn"]');
    await page.waitForSelector('.modal-overlay');

    // Fill form
    await page.type('[name="productName"]', 'Test Product');
    await page.type('[name="description"]', 'Test Description');

    // Upload image (potential leak)
    const input = await page.$('[type="file"]');
    await input.uploadFile('./test-image.png');
    await page.waitForSelector('.image-preview');

    // Close modal (should clean up)
    await page.click('.modal-close');
    await page.waitForSelector('.modal-overlay', { hidden: true });
  },

  async back(page) {
    // Force garbage collection opportunity
    await page.evaluate(() => {
      window.dispatchEvent(new Event('beforeunload'));
    });
    await page.goto('https://app.example.com/');
  },

  // Repeat the action multiple times to amplify leaks
  repeat: () => 3,

  // Custom leak detection
  leakFilter(node, snapshot, leakedNodeIds) {
    // Focus on specific leak patterns
    const suspectTypes = [
      'HTMLDivElement',
      'HTMLImageElement',
      'EventListener',
      'Closure'
    ];
    return suspectTypes.includes(node.type);
  }
};
```

### 3. SPA Route Navigation Testing

Test memory leaks during route changes:

```javascript
// route-navigation-scenario.js
module.exports = {
  name: 'spa-route-navigation',

  async setup(page) {
    await page.goto('https://app.example.com/');
    await page.waitForNetworkIdle();
  },

  async action(page) {
    // Navigate through multiple routes
    const routes = [
      '/dashboard',
      '/products',
      '/orders',
      '/settings',
      '/analytics'
    ];

    for (const route of routes) {
      await page.click(`a[href="${route}"]`);
      await page.waitForNetworkIdle();
      await page.waitForTimeout(500);
    }
  },

  async back(page) {
    await page.click('a[href="/"]');
    await page.waitForNetworkIdle();
  }
};
```

### 4. Event Listener Leak Detection

Detect event listener accumulation:

```javascript
// event-listener-scenario.js
module.exports = {
  name: 'event-listener-leak',

  async setup(page) {
    await page.goto('https://app.example.com/');

    // Inject event listener counter
    await page.evaluate(() => {
      const originalAddEventListener = EventTarget.prototype.addEventListener;
      const originalRemoveEventListener = EventTarget.prototype.removeEventListener;

      window.__eventListenerCount = 0;
      window.__eventListeners = new Map();

      EventTarget.prototype.addEventListener = function(type, listener, options) {
        window.__eventListenerCount++;
        const key = `${this.constructor.name}:${type}`;
        window.__eventListeners.set(key, (window.__eventListeners.get(key) || 0) + 1);
        return originalAddEventListener.call(this, type, listener, options);
      };

      EventTarget.prototype.removeEventListener = function(type, listener, options) {
        window.__eventListenerCount--;
        const key = `${this.constructor.name}:${type}`;
        window.__eventListeners.set(key, (window.__eventListeners.get(key) || 0) - 1);
        return originalRemoveEventListener.call(this, type, listener, options);
      };
    });
  },

  async action(page) {
    // Perform actions that add event listeners
    await page.click('[data-testid="open-sidebar"]');
    await page.waitForSelector('.sidebar');

    await page.click('[data-testid="close-sidebar"]');
    await page.waitForSelector('.sidebar', { hidden: true });
  },

  async back(page) {
    // Check listener count
    const stats = await page.evaluate(() => ({
      count: window.__eventListenerCount,
      listeners: Object.fromEntries(window.__eventListeners)
    }));

    console.log('Event listener stats:', stats);
    await page.goto('https://app.example.com/');
  }
};
```

### 5. Running MemLab Analysis

Execute MemLab commands:

```bash
# Basic leak detection
memlab run --scenario scenario.js

# Run with increased iterations
memlab run --scenario scenario.js --work-dir ./memlab-results

# Run specific phases
memlab snapshot --scenario scenario.js
memlab find-leaks --work-dir ./memlab-results

# Analyze existing heap snapshots
memlab analyze ./memlab-results

# Generate detailed report
memlab report --work-dir ./memlab-results --output-dir ./reports

# Run in headless mode
memlab run --scenario scenario.js --headless

# Custom Chromium path
memlab run --scenario scenario.js --chromium-binary /path/to/chrome
```

### 6. Heap Snapshot Analysis

Analyze heap snapshots for memory issues:

```javascript
// heap-analysis.js - Custom heap analysis
const { takeNodeMinimalHeap, findLeaks } = require('@memlab/api');

async function analyzeHeap() {
  // Take heap snapshot
  const heap = await takeNodeMinimalHeap();

  // Find objects by type
  const detachedDOMNodes = heap.nodes.filter(node =>
    node.name.startsWith('Detached ') &&
    node.type === 'native'
  );

  // Find large retained objects
  const largeObjects = heap.nodes
    .filter(node => node.retainedSize > 1024 * 1024) // > 1MB
    .sort((a, b) => b.retainedSize - a.retainedSize)
    .slice(0, 10);

  // Find specific patterns
  const closureLeaks = heap.nodes.filter(node =>
    node.type === 'closure' &&
    node.retainedSize > 10240
  );

  console.log('Analysis Results:');
  console.log('Detached DOM nodes:', detachedDOMNodes.length);
  console.log('Large objects:', largeObjects.map(n => ({
    name: n.name,
    type: n.type,
    size: `${(n.retainedSize / 1024 / 1024).toFixed(2)} MB`
  })));
  console.log('Potential closure leaks:', closureLeaks.length);
}
```

### 7. CI/CD Integration

Integrate MemLab into CI pipelines:

```yaml
# .github/workflows/memory-check.yml
name: Memory Leak Check

on:
  pull_request:
    branches: [main]

jobs:
  memlab:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Start application
        run: npm run start &
        env:
          PORT: 3000

      - name: Wait for application
        run: npx wait-on http://localhost:3000

      - name: Install MemLab
        run: npm install -g memlab

      - name: Run memory leak tests
        run: |
          memlab run --scenario ./tests/memlab/dashboard-scenario.js \
            --work-dir ./memlab-results \
            --headless

      - name: Check for leaks
        run: |
          LEAK_COUNT=$(memlab find-leaks --work-dir ./memlab-results --json | jq '.length')
          if [ "$LEAK_COUNT" -gt 0 ]; then
            echo "::error::Found $LEAK_COUNT memory leaks"
            memlab report --work-dir ./memlab-results
            exit 1
          fi

      - name: Upload artifacts
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: memlab-results
          path: ./memlab-results
```

### 8. Common Leak Pattern Detection

Identify common JavaScript memory leak patterns:

```javascript
// leak-patterns.js - Detect common leak patterns
module.exports = {
  // Detached DOM elements
  detectDetachedDOM(node) {
    return node.name.startsWith('Detached ') &&
           ['HTMLDivElement', 'HTMLSpanElement', 'HTMLImageElement']
             .some(type => node.name.includes(type));
  },

  // Event listener leaks
  detectEventListenerLeak(node) {
    return node.type === 'object' &&
           node.name === 'EventListener' &&
           node.retainedSize > 1024;
  },

  // Closure leaks (holding references)
  detectClosureLeak(node) {
    return node.type === 'closure' &&
           node.retainedSize > 10240 &&
           node.edges.some(edge => edge.name === 'context');
  },

  // Timer leaks (setInterval not cleared)
  detectTimerLeak(node) {
    return node.name === 'Timeout' || node.name === 'Interval';
  },

  // Promise chain leaks
  detectPromiseLeak(node) {
    return node.name === 'Promise' &&
           node.edges.some(edge =>
             edge.name === 'reactions' && edge.to.retainedSize > 0
           );
  },

  // Component state retention
  detectComponentLeak(node) {
    const componentPatterns = [
      'FiberNode', // React
      'ComponentPublicInstance', // Vue
      'ViewRef' // Angular
    ];
    return componentPatterns.some(p => node.name.includes(p));
  }
};
```

## MCP Server Integration

This skill can leverage the following MCP servers:

| Server | Description | Use Case |
|--------|-------------|----------|
| playwright-mcp | Browser automation | Custom scenarios |
| clinic.js | Node.js profiling | Alternative memory analysis |

## Best Practices

### Scenario Design

1. **Realistic user flows** - Model actual user behavior
2. **Multiple iterations** - Repeat actions to amplify leaks
3. **Clean back state** - Ensure proper cleanup verification
4. **Focused tests** - One potential leak source per scenario

### Leak Detection

1. **Filter noise** - Ignore known non-leaks
2. **Size thresholds** - Focus on significant leaks
3. **Retainer paths** - Understand why objects are retained
4. **DOM focus** - Detached DOM is the most common leak

### CI Integration

1. **Run on PRs** - Catch leaks before merge
2. **Baseline comparison** - Compare against known-good state
3. **Fail threshold** - Set acceptable leak limits
4. **Artifact retention** - Keep heap dumps for analysis

## Process Integration

This skill integrates with the following processes:
- `memory-leak-detection.js` - Memory leak detection workflows
- `memory-profiling-analysis.js` - Comprehensive memory analysis

## Output Format

When executing operations, provide structured output:

```json
{
  "operation": "detect-leaks",
  "status": "completed",
  "scenario": "dashboard-leak-test",
  "results": {
    "leaksFound": 3,
    "totalLeakedSize": "2.5 MB",
    "leaks": [
      {
        "type": "Detached HTMLDivElement",
        "count": 15,
        "totalSize": "1.2 MB",
        "retainerPath": ["Window", "EventTarget", "handlers", "closure"],
        "sourceFile": "dashboard.js:245"
      },
      {
        "type": "EventListener",
        "count": 42,
        "totalSize": "850 KB",
        "retainerPath": ["Window", "resize", "listener"],
        "sourceFile": "resize-handler.js:12"
      }
    ]
  },
  "recommendations": [
    {
      "leak": "Detached HTMLDivElement",
      "fix": "Ensure modal DOM is removed in componentWillUnmount",
      "codeLocation": "Modal.tsx:89"
    }
  ],
  "reportPath": "./memlab-results/report/index.html"
}
```

## Error Handling

### Common Issues

| Error | Cause | Resolution |
|-------|-------|------------|
| `Chrome not found` | Missing browser | Install Chrome or specify path |
| `Timeout exceeded` | Slow page load | Increase timeout, check network |
| `OOM in analysis` | Large heap | Increase Node.js memory limit |
| `No leaks found` | Scenario too short | Increase iterations, longer actions |

## Constraints

- Requires Chrome/Chromium browser
- Heap analysis can be memory-intensive
- False positives possible - manual verification recommended
- Works best with source maps available
