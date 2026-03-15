---
name: scoop-manifest-generator
description: Generate Scoop manifest for Windows CLI distribution.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Scoop Manifest Generator

Generate Scoop manifest for Windows distribution.

## Generated Patterns

```json
{
  "version": "1.0.0",
  "description": "My CLI application",
  "homepage": "https://github.com/myuser/myapp",
  "license": "MIT",
  "url": "https://github.com/myuser/myapp/releases/download/v1.0.0/myapp-win-x64.zip",
  "hash": "sha256:abc123...",
  "bin": "myapp.exe",
  "checkver": "github",
  "autoupdate": {
    "url": "https://github.com/myuser/myapp/releases/download/v$version/myapp-win-x64.zip"
  }
}
```

## Target Processes

- package-manager-publishing
- cli-binary-distribution
