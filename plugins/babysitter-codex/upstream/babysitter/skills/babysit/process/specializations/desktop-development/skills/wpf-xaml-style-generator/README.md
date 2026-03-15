# wpf-xaml-style-generator

Generate XAML styles, templates, and resource dictionaries with theme support.

## Overview

This skill creates consistent, maintainable UI styling for WPF applications including control styles, templates, and light/dark theme support.

## Quick Start

```javascript
const result = await invokeSkill('wpf-xaml-style-generator', {
  projectPath: '/path/to/wpf-project',
  designSystem: 'fluent',
  themes: ['light', 'dark'],
  controls: ['all'],
  accentColors: {
    primary: '#0078D4',
    secondary: '#005A9E'
  },
  includeAnimations: true
});
```

## Features

### Design Systems

| System | Description |
|--------|-------------|
| fluent | Windows 11 Fluent Design |
| material | Material Design |
| custom | Custom design system |

### Generated Resources

- Color dictionaries (per theme)
- Brush resources
- Control styles and templates
- Animation resources
- Theme manager class

## Structure

```
Resources/
├── Themes/
│   ├── Colors.Light.xaml
│   └── Colors.Dark.xaml
├── Brushes.xaml
└── Styles/
    ├── ButtonStyles.xaml
    └── TextBoxStyles.xaml
```

## Related Skills

- `wpf-mvvm-scaffold`
- `wpf-high-dpi-analyzer`

## Related Agents

- `wpf-dotnet-expert`
- `platform-convention-advisor`
