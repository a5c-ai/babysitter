---
name: power-management-monitor
description: Monitor system power state including battery, AC, sleep, and wake events
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
tags: [power, battery, system, cross-platform, monitoring]
---

# power-management-monitor

Monitor system power state including battery level, AC/battery status, and sleep/wake events.

## Capabilities

- Monitor battery level and charging
- Detect AC/battery power source
- Handle sleep/wake events
- Prevent system sleep
- Low battery notifications
- Power-aware feature toggling

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectPath": { "type": "string" },
    "framework": { "enum": ["electron", "native"] },
    "events": { "type": "array" }
  },
  "required": ["projectPath"]
}
```

## Electron Example

```javascript
const { powerMonitor, powerSaveBlocker } = require('electron');

powerMonitor.on('suspend', () => console.log('System suspending'));
powerMonitor.on('resume', () => console.log('System resumed'));
powerMonitor.on('on-battery', () => console.log('On battery'));
powerMonitor.on('on-ac', () => console.log('On AC power'));

// Prevent sleep during important tasks
const id = powerSaveBlocker.start('prevent-app-suspension');
// ... do work ...
powerSaveBlocker.stop(id);
```

## Related Skills

- `screen-capture-api`
- `system-services-integration` process
