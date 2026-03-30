---
name: nsis-installer-generator
description: Generate NSIS installer scripts for Windows with custom UI and features
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
tags: [windows, nsis, installer, distribution, packaging]
---

# nsis-installer-generator

Generate NSIS (Nullsoft Scriptable Install System) installer scripts for Windows applications.

## Capabilities

- Generate NSIS scripts
- Configure installer UI
- Set up components selection
- Configure file associations
- Add registry entries
- Create shortcuts
- Configure uninstaller

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectPath": { "type": "string" },
    "appName": { "type": "string" },
    "version": { "type": "string" },
    "components": { "type": "array" },
    "createShortcuts": { "type": "boolean" }
  },
  "required": ["projectPath", "appName", "version"]
}
```

## NSIS Script Example

```nsi
!include "MUI2.nsh"

Name "My Application"
OutFile "MyApp-Setup.exe"
InstallDir "$PROGRAMFILES\MyApp"
RequestExecutionLevel admin

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_LANGUAGE "English"

Section "Install"
  SetOutPath $INSTDIR
  File /r "dist\*.*"
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  CreateShortcut "$DESKTOP\MyApp.lnk" "$INSTDIR\MyApp.exe"
SectionEnd

Section "Uninstall"
  Delete "$DESKTOP\MyApp.lnk"
  RMDir /r "$INSTDIR"
SectionEnd
```

## Related Skills

- `wix-toolset-config`
- `windows-authenticode-signer`
