---
name: spectron-test-setup
description: Set up Spectron (deprecated) tests for legacy Electron application testing
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
tags: [electron, testing, spectron, legacy, deprecated]
---

# spectron-test-setup

Set up Spectron tests for legacy Electron applications. Note: Spectron is deprecated; use Playwright for new projects.

## Capabilities

- Configure Spectron test environment
- Generate test structure
- Set up WebDriverIO integration
- Handle application lifecycle
- Create page objects

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectPath": { "type": "string" },
    "electronPath": { "type": "string" }
  },
  "required": ["projectPath"]
}
```

## Example Test

```javascript
const Application = require('spectron').Application;
const path = require('path');

describe('Application launch', function () {
  beforeEach(function () {
    this.app = new Application({
      path: require('electron'),
      args: [path.join(__dirname, '..')]
    });
    return this.app.start();
  });

  afterEach(function () {
    if (this.app && this.app.isRunning()) {
      return this.app.stop();
    }
  });

  it('shows initial window', function () {
    return this.app.client.getWindowCount().then(count => {
      expect(count).toBe(1);
    });
  });
});
```

## Migration Note

Consider migrating to `playwright-electron-config` for modern Electron testing.

## Related Skills

- `playwright-electron-config`
- `electron-mock-factory`
