# MemLab Analysis Skill

## Overview

The `memlab-analysis` skill provides expert capabilities for JavaScript memory leak detection using Facebook's MemLab framework. It enables AI-powered memory profiling including scenario development, automated leak detection, heap snapshot analysis, and CI/CD integration.

## Quick Start

### Prerequisites

1. **Node.js 16+** - Recommended 18+ for best compatibility
2. **MemLab CLI** - `npm install -g memlab`
3. **Chrome/Chromium** - For browser-based testing
4. **Optional** - Puppeteer for custom scenarios

### Installation

The skill is included in the babysitter-sdk. No additional installation required.

Install MemLab:

```bash
# Install MemLab globally
npm install -g memlab

# Verify installation
memlab version

# Or use npx
npx memlab run --scenario scenario.js
```

## Usage

### Basic Operations

```bash
# Create scenario from URL
/skill memlab-analysis create-scenario \
  --url https://app.example.com \
  --output scenario.js

# Run leak detection
/skill memlab-analysis run --scenario scenario.js

# Analyze existing heap snapshots
/skill memlab-analysis analyze --heap-dir ./snapshots
```

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(memlabTask, {
  operation: 'detect-leaks',
  scenario: './memlab/dashboard-scenario.js',
  iterations: 3,
  outputDir: './memlab-results'
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **Scenario Development** | Create MemLab test scenarios |
| **Leak Detection** | Automated memory leak finding |
| **Heap Analysis** | Parse and analyze heap snapshots |
| **DOM Leak Detection** | Find detached DOM elements |
| **Event Listener Leaks** | Detect listener accumulation |
| **CI Integration** | GitHub Actions, Jenkins workflows |

## Examples

### Example 1: Basic Scenario

```bash
# Generate scenario for a page
/skill memlab-analysis generate-scenario \
  --url https://app.example.com/dashboard \
  --action "click:#analytics-btn" \
  --back "click:#home-btn" \
  --output dashboard-scenario.js
```

Generated scenario:
```javascript
module.exports = {
  name: 'dashboard-scenario',
  url: () => 'https://app.example.com/dashboard',
  async action(page) {
    await page.click('#analytics-btn');
    await page.waitForNetworkIdle();
  },
  async back(page) {
    await page.click('#home-btn');
    await page.waitForNetworkIdle();
  }
};
```

### Example 2: Run Leak Detection

```bash
# Run with detailed output
/skill memlab-analysis run \
  --scenario scenario.js \
  --iterations 5 \
  --verbose
```

### Example 3: Analyze Results

```bash
# Generate human-readable report
/skill memlab-analysis report \
  --work-dir ./memlab-results \
  --format markdown \
  --include-retainer-paths
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MEMLAB_HEADLESS` | Run in headless mode | `true` |
| `MEMLAB_CHROMIUM_PATH` | Custom Chrome path | System Chrome |
| `MEMLAB_TIMEOUT` | Page load timeout | `30000` |

### Skill Configuration

```yaml
# .babysitter/skills/memlab-analysis.yaml
memlab-analysis:
  browser:
    headless: true
    chromiumPath: /usr/bin/chromium
  defaults:
    iterations: 3
    timeout: 60000
  thresholds:
    maxLeakCount: 5
    maxLeakSizeMB: 10
  reporting:
    includeRetainers: true
    includeSourceMaps: true
```

## Scenario Reference

### Basic Structure

```javascript
module.exports = {
  // Scenario name
  name: 'my-scenario',

  // Starting URL
  url: () => 'https://example.com',

  // Optional setup
  async setup(page) {
    // Login, set cookies, etc.
  },

  // Action that may leak
  async action(page) {
    // User interaction
  },

  // Return to clean state
  async back(page) {
    // Navigate away
  },

  // Optional: filter false positives
  leakFilter(node) {
    return node.retainedSize > 1024;
  },

  // Optional: repeat action
  repeat: () => 3
};
```

### Puppeteer API in Scenarios

Common Puppeteer operations:

| Operation | Code |
|-----------|------|
| Click | `await page.click('#selector')` |
| Type | `await page.type('#input', 'text')` |
| Wait | `await page.waitForSelector('.elem')` |
| Navigate | `await page.goto('https://...')` |
| Network idle | `await page.waitForNetworkIdle()` |
| Screenshot | `await page.screenshot({path: 'ss.png'})` |

## Common Leak Patterns

### 1. Detached DOM Elements

```javascript
// Problem: DOM removed but references retained
const element = document.createElement('div');
document.body.appendChild(element);
// element removed from DOM but variable still holds reference
```

**Detection:** Look for `Detached HTMLElement` in leak report.

### 2. Event Listener Leaks

```javascript
// Problem: Listeners not removed on cleanup
window.addEventListener('resize', handler);
// Component unmounts but listener remains
```

**Detection:** Increasing `EventListener` count across iterations.

### 3. Closure Leaks

```javascript
// Problem: Closure holds large scope
function setup() {
  const largeData = fetchLargeData();
  return function handler() {
    // largeData retained in closure
    console.log(largeData.length);
  };
}
```

**Detection:** Large `closure` objects in retained size.

### 4. Timer Leaks

```javascript
// Problem: setInterval not cleared
const intervalId = setInterval(update, 1000);
// Component unmounts but interval continues
```

**Detection:** `Timeout` or `Interval` objects in leak report.

## Process Integration

### Processes Using This Skill

1. **memory-leak-detection.js** - Leak detection workflows
2. **memory-profiling-analysis.js** - Memory analysis

### Example Process Integration

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const memoryLeakCheckTask = defineTask({
  name: 'check-memory-leaks',
  description: 'Run MemLab memory leak detection',

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Memory leak check: ${inputs.scenario}`,
      skill: {
        name: 'memlab-analysis',
        context: {
          operation: 'detect-leaks',
          scenario: inputs.scenario,
          iterations: inputs.iterations || 3,
          thresholds: {
            maxLeaks: 5,
            maxSizeMB: 10
          }
        }
      },
      io: {
        inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
        outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
      }
    };
  }
});
```

## CI/CD Integration

### GitHub Actions

```yaml
- name: Run MemLab
  run: |
    memlab run --scenario ./tests/leak-scenario.js --headless
    memlab find-leaks --json > leaks.json
    if [ $(jq '.length' leaks.json) -gt 0 ]; then
      exit 1
    fi
```

### Jest Integration

```javascript
// __tests__/memory.test.js
const { run } = require('@memlab/api');

test('no memory leaks on dashboard', async () => {
  const result = await run({
    scenario: require('./scenarios/dashboard'),
  });
  expect(result.leaks.length).toBe(0);
}, 120000);
```

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Chrome not found | Set `MEMLAB_CHROMIUM_PATH` or install Chrome |
| Timeout errors | Increase timeout, check network |
| No leaks found | Increase iterations, verify scenario actions |
| OOM during analysis | Use `--max-old-space-size=8192` |
| False positives | Implement `leakFilter` in scenario |

### Debug Mode

```bash
# Verbose output
/skill memlab-analysis run --scenario scenario.js --debug

# Keep browser open
/skill memlab-analysis run --scenario scenario.js --no-headless

# Save heap snapshots
/skill memlab-analysis run --scenario scenario.js --save-snapshots
```

## Related Skills

- **nodejs-profiling** - Node.js memory profiling
- **heap-dump-analysis** - General heap analysis
- **browser-devtools** - Chrome DevTools integration

## References

- [MemLab Documentation](https://facebook.github.io/memlab/)
- [MemLab GitHub](https://github.com/facebook/memlab)
- [JavaScript Memory Management](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_Management)
- [Chrome Memory Profiling](https://developer.chrome.com/docs/devtools/memory-problems/)
- [Clinic.js](https://clinicjs.org/) - Node.js profiling alternative

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-017
**Category:** Memory Profiling
**Status:** Active
