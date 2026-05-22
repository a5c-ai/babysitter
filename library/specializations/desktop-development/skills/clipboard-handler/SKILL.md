---
name: clipboard-handler
description: Cross-platform clipboard operations for text, images, files, and rich content
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
tags: [clipboard, cross-platform, desktop, copy-paste, files]
graph:
  domains: [domain:software-engineering]
  specializations: [specialization:desktop-development]
  skillAreas: [skill-area:desktop-system-integration, skill-area:desktop-ui-frameworks]
  roles: [role:desktop-developer, role:fullstack-engineer]
  workflows: [workflow:feature-development, workflow:release-management]
---

# clipboard-handler

Implement cross-platform clipboard operations for text, images, files, and rich content.

## Capabilities

- Read/write text to clipboard
- Copy/paste images
- Handle file paths
- Support HTML/RTF content
- Monitor clipboard changes
- Clear clipboard

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectPath": { "type": "string" },
    "framework": { "enum": ["electron", "native"] },
    "contentTypes": { "type": "array" }
  },
  "required": ["projectPath"]
}
```

## Electron Example

```javascript
const { clipboard, nativeImage } = require('electron');

// Text
clipboard.writeText('Hello World');
const text = clipboard.readText();

// Image
const image = nativeImage.createFromPath('/path/to/image.png');
clipboard.writeImage(image);

// HTML
clipboard.writeHTML('<b>Hello</b>');
```

## Related Skills

- `global-shortcut-manager`
- `system-services-integration` process
