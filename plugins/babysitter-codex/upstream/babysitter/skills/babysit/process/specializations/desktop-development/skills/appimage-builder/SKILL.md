---
name: appimage-builder
description: Build AppImage bundles with AppDir structure for portable Linux applications
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
tags: [linux, appimage, portable, packaging, distribution]
---

# appimage-builder

Build AppImage bundles for portable Linux application distribution that runs on most distributions.

## Capabilities

- Create AppDir structure
- Generate .desktop files
- Bundle dependencies
- Configure AppRun script
- Use appimagetool or linuxdeploy
- Configure update information
- Sign AppImages

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectPath": { "type": "string" },
    "appName": { "type": "string" },
    "executablePath": { "type": "string" },
    "iconPath": { "type": "string" },
    "updateUrl": { "type": "string" }
  },
  "required": ["projectPath", "appName", "executablePath"]
}
```

## AppDir Structure

```
MyApp.AppDir/
├── AppRun
├── myapp.desktop
├── myapp.png
└── usr/
    ├── bin/
    │   └── myapp
    └── lib/
        └── [bundled libraries]
```

## Build Commands

```bash
# Using appimagetool
ARCH=x86_64 appimagetool MyApp.AppDir MyApp-x86_64.AppImage

# Using linuxdeploy
linuxdeploy --appdir MyApp.AppDir --output appimage
```

## Related Skills

- `deb-package-builder`
- `flatpak-manifest-generator`
