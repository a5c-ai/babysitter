---
name: flatpak-manifest-generator
description: Generate Flatpak manifest with proper permissions and sandboxing
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
tags: [linux, flatpak, sandbox, packaging, distribution]
---

# flatpak-manifest-generator

Generate Flatpak manifests with proper permissions, sandboxing, and Flathub compatibility.

## Capabilities

- Generate YAML/JSON manifests
- Configure sandbox permissions
- Set up build modules
- Configure finish-args
- Set up Flathub submission
- Handle extensions

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectPath": { "type": "string" },
    "appId": { "type": "string" },
    "runtime": { "type": "string" },
    "permissions": { "type": "array" }
  },
  "required": ["projectPath", "appId"]
}
```

## Manifest Example

```yaml
app-id: com.example.MyApp
runtime: org.freedesktop.Platform
runtime-version: '23.08'
sdk: org.freedesktop.Sdk
command: myapp
finish-args:
  - --share=ipc
  - --socket=x11
  - --socket=wayland
  - --device=dri
  - --share=network
  - --filesystem=home
modules:
  - name: myapp
    buildsystem: simple
    build-commands:
      - install -D myapp /app/bin/myapp
    sources:
      - type: archive
        url: https://example.com/myapp-1.0.0.tar.gz
        sha256: abc123...
```

## Build Commands

```bash
flatpak-builder build-dir com.example.MyApp.yaml
flatpak-builder --install --user build-dir com.example.MyApp.yaml
```

## Related Skills

- `snap-yaml-generator`
- `appimage-builder`
