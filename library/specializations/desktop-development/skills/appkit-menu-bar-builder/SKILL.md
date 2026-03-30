---
name: appkit-menu-bar-builder
description: Generate NSMenu and NSStatusItem configurations for macOS menu bar applications
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
tags: [macos, appkit, menubar, statusitem, swift]
---

# appkit-menu-bar-builder

Generate NSMenu and NSStatusItem configurations for macOS menu bar applications. This skill creates menu bar apps with proper status items, menus, and SwiftUI integration.

## Capabilities

- Create NSStatusItem menu bar apps
- Generate NSMenu configurations
- Integrate SwiftUI popovers with AppKit
- Handle menu item actions
- Configure keyboard shortcuts
- Support dynamic menu updates
- Handle light/dark mode icons
- Generate agent app configurations (LSUIElement)

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectPath": { "type": "string" },
    "appType": { "enum": ["menu-only", "popover", "window-and-menu"] },
    "menuStructure": { "type": "array" },
    "iconType": { "enum": ["system", "custom", "dynamic"] },
    "useSwiftUI": { "type": "boolean", "default": true }
  },
  "required": ["projectPath"]
}
```

## Generated Code

```swift
import AppKit
import SwiftUI

class StatusBarController {
    private var statusItem: NSStatusItem
    private var popover: NSPopover

    init() {
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        popover = NSPopover()
        popover.contentSize = NSSize(width: 300, height: 400)
        popover.behavior = .transient
        popover.contentViewController = NSHostingController(rootView: ContentView())

        if let button = statusItem.button {
            button.image = NSImage(systemSymbolName: "star.fill", accessibilityDescription: "App")
            button.action = #selector(togglePopover)
            button.target = self
        }
    }

    @objc func togglePopover() {
        if popover.isShown {
            popover.performClose(nil)
        } else if let button = statusItem.button {
            popover.show(relativeTo: button.bounds, of: button, preferredEdge: .minY)
        }
    }
}
```

## Related Skills

- `swiftui-view-generator`
- `macos-entitlements-generator`
