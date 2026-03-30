# wpf-high-dpi-analyzer

Analyze and fix WPF applications for high DPI support.

## Overview

This skill identifies and fixes DPI-related issues in WPF applications, ensuring proper display on high-resolution monitors with per-monitor DPI awareness.

## Quick Start

```javascript
const result = await invokeSkill('wpf-high-dpi-analyzer', {
  projectPath: '/path/to/wpf-project',
  targetDpiMode: 'per-monitor-v2',
  checkCategories: ['manifest', 'hardcoded-pixels', 'bitmaps', 'layouts'],
  generateFixes: true
});
```

## Features

### Check Categories

| Category | Issues Detected |
|----------|-----------------|
| manifest | Missing/incorrect DPI awareness |
| hardcoded-pixels | Fixed Width/Height values |
| bitmaps | Non-vector images, no multi-res |
| layouts | Transform scaling issues |
| fonts | Hardcoded font sizes |

### DPI Modes

- **System**: Single DPI for all monitors
- **Per-Monitor**: DPI per monitor (Win 8.1+)
- **Per-Monitor V2**: Best support (Win 10 1703+)

## Common Fixes

```xml
<!-- Before -->
<Button Width="100" Height="30"/>

<!-- After -->
<Button MinWidth="80" Padding="16,4"/>
```

## Related Skills

- `wpf-xaml-style-generator`
- `visual-regression-setup`

## Related Agents

- `wpf-dotnet-expert`
- `desktop-ux-analyst`
