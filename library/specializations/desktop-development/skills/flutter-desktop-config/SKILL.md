---
name: flutter-desktop-config
description: Configure Flutter for desktop platforms with platform channels and native integrations
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
tags: [flutter, dart, cross-platform, desktop, ui]
graph:
  domains: [domain:software-engineering]
  specializations: [specialization:desktop-development]
  skillAreas: [skill-area:desktop-ui-frameworks, skill-area:cross-platform-desktop, skill-area:flutter-development]
  roles: [role:desktop-developer, role:fullstack-engineer]
  workflows: [workflow:feature-development, workflow:release-management]
---

# flutter-desktop-config

Configure Flutter for desktop platforms (Windows, macOS, Linux) with platform channels, native integrations, and platform-specific configurations.

## Capabilities

- Enable Flutter desktop support
- Configure platform channels for native code
- Set up platform-specific runners
- Configure window management
- Set up menu bar and system tray
- Configure app icons and metadata
- Set up MSIX/DMG/DEB packaging
- Configure plugin support

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectPath": { "type": "string" },
    "platforms": { "type": "array", "items": { "enum": ["windows", "macos", "linux"] } },
    "windowConfig": { "type": "object" },
    "nativeChannels": { "type": "array" }
  },
  "required": ["projectPath"]
}
```

## Platform Channel Example

```dart
// Dart side
class NativeService {
  static const platform = MethodChannel('com.example/native');

  Future<String> getSystemInfo() async {
    return await platform.invokeMethod('getSystemInfo');
  }
}
```

```swift
// macOS (Swift)
let controller = FlutterViewController()
let channel = FlutterMethodChannel(name: "com.example/native",
                                   binaryMessenger: controller.engine.binaryMessenger)
channel.setMethodCallHandler { call, result in
    if call.method == "getSystemInfo" {
        result(ProcessInfo.processInfo.operatingSystemVersionString)
    }
}
```

## Related Skills

- `cross-platform-test-matrix`
- `desktop-build-pipeline` process
