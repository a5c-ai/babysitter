# winui3-migration-helper

Assist migration from WPF to WinUI 3 / Windows App SDK.

## Overview

This skill analyzes WPF applications and provides migration paths, code transformations, and compatibility guidance for modernizing to WinUI 3.

## Quick Start

```javascript
const result = await invokeSkill('winui3-migration-helper', {
  projectPath: '/path/to/wpf-project',
  migrationStrategy: 'analysis-only',
  targetSdk: '1.5',
  generateReport: true
});
```

## Features

### Migration Strategies

| Strategy | Description |
|----------|-------------|
| analysis-only | Assess compatibility, no changes |
| incremental | Migrate piece by piece |
| full | Complete migration |

### Key Differences

- Namespace changes (`System.Windows` to `Microsoft.UI.Xaml`)
- x:Bind recommended over Binding
- VisualStateManager instead of Triggers
- Window sizing is manual

## Blockers

- DataGrid (use Community Toolkit)
- WindowsFormsHost
- System tray icons (use Win32)

## Related Skills

- `wpf-mvvm-scaffold`
- `msix-package-generator`

## Related Agents

- `wpf-dotnet-expert`
- `desktop-migration-strategist`
