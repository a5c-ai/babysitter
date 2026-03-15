---
name: deb-package-builder
description: Build Debian packages with proper control files, dependencies, and maintainer scripts
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
tags: [linux, debian, packaging, deb, distribution]
---

# deb-package-builder

Build Debian packages (.deb) with proper control files, dependencies, and maintainer scripts for Ubuntu, Debian, and derivatives.

## Capabilities

- Generate DEBIAN/control file
- Configure package dependencies
- Create maintainer scripts (postinst, prerm, etc.)
- Set up desktop integration
- Configure file permissions
- Build package with dpkg-deb
- Sign packages with GPG

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectPath": { "type": "string" },
    "packageName": { "type": "string" },
    "version": { "type": "string" },
    "dependencies": { "type": "array" },
    "architecture": { "enum": ["amd64", "arm64", "all"] }
  },
  "required": ["projectPath", "packageName", "version"]
}
```

## DEBIAN/control

```
Package: myapp
Version: 1.0.0
Section: utils
Priority: optional
Architecture: amd64
Depends: libc6 (>= 2.17), libgtk-3-0
Maintainer: Your Name <email@example.com>
Description: My Application
 A longer description of my application
 that can span multiple lines.
```

## Build Command

```bash
dpkg-deb --build --root-owner-group myapp_1.0.0_amd64
```

## Related Skills

- `rpm-spec-generator`
- `linux-gpg-signing`
