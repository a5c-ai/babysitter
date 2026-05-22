---
name: screen-capture-api
description: Cross-platform screen and window capture for screenshots and recording
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
tags: [screen-capture, screenshots, recording, desktop, media]
graph:
  domains: [domain:software-engineering]
  specializations: [specialization:desktop-development]
  skillAreas: [skill-area:desktop-system-integration, skill-area:desktop-ui-frameworks]
  roles: [role:desktop-developer, role:fullstack-engineer]
  workflows: [workflow:feature-development, workflow:release-management]
---

# screen-capture-api

Implement cross-platform screen and window capture for screenshots and recording capabilities.

## Capabilities

- Capture full screen
- Capture specific windows
- Capture screen regions
- Handle multiple displays
- Stream screen content
- Handle permissions

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectPath": { "type": "string" },
    "framework": { "enum": ["electron", "native"] },
    "captureTypes": { "type": "array" }
  },
  "required": ["projectPath"]
}
```

## Electron Example

```javascript
const { desktopCapturer } = require('electron');

async function captureScreen() {
    const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: 1920, height: 1080 }
    });

    for (const source of sources) {
        const screenshot = source.thumbnail.toPNG();
        // Save or use screenshot
    }
}
```

## Related Skills

- `power-management-monitor`
- `system-services-integration` process
