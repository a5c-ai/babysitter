---
name: snap-yaml-generator
description: Generate snapcraft.yaml with confinement settings for Ubuntu Snap packages
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
tags: [linux, snap, ubuntu, packaging, distribution]
---

# snap-yaml-generator

Generate snapcraft.yaml configuration for Ubuntu Snap packages with proper confinement and interfaces.

## Capabilities

- Generate snapcraft.yaml
- Configure confinement levels
- Set up interfaces/plugs
- Configure parts and build
- Set up desktop integration
- Configure auto-refresh

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectPath": { "type": "string" },
    "snapName": { "type": "string" },
    "confinement": { "enum": ["strict", "classic", "devmode"] },
    "interfaces": { "type": "array" }
  },
  "required": ["projectPath", "snapName"]
}
```

## snapcraft.yaml Example

```yaml
name: myapp
version: '1.0.0'
summary: My Application
description: |
  A longer description of my application.

base: core22
confinement: strict
grade: stable

apps:
  myapp:
    command: bin/myapp
    desktop: share/applications/myapp.desktop
    plugs:
      - desktop
      - desktop-legacy
      - home
      - network
      - x11
      - wayland

parts:
  myapp:
    plugin: dump
    source: .
    stage-packages:
      - libgtk-3-0
```

## Build Commands

```bash
snapcraft
sudo snap install myapp_1.0.0_amd64.snap --dangerous
```

## Related Skills

- `flatpak-manifest-generator`
- `deb-package-builder`
