---
name: avalonia-ui-setup
description: Set up Avalonia UI project with cross-platform XAML for Windows, macOS, and Linux
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
tags: [avalonia, dotnet, cross-platform, xaml, ui]
---

# avalonia-ui-setup

Set up Avalonia UI project with cross-platform XAML for true cross-platform desktop development on Windows, macOS, and Linux with a single codebase.

## Capabilities

- Create Avalonia project structure
- Configure MVVM with ReactiveUI
- Set up platform-specific features
- Configure Fluent/Simple themes
- Set up native menu integration
- Configure build for all platforms
- Set up hot reload
- Generate platform-specific publishing

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectPath": { "type": "string" },
    "projectName": { "type": "string" },
    "theme": { "enum": ["fluent", "simple", "custom"] },
    "mvvmFramework": { "enum": ["reactiveui", "community-toolkit", "custom"] }
  },
  "required": ["projectPath", "projectName"]
}
```

## Project Structure

```
MyAvaloniaApp/
├── App.axaml
├── MainWindow.axaml
├── ViewModels/
├── Views/
├── Models/
└── Program.cs
```

## MainWindow.axaml

```xml
<Window xmlns="https://github.com/avaloniaui"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="My Avalonia App">
    <StackPanel>
        <TextBlock Text="{Binding Greeting}"/>
        <Button Command="{Binding ClickCommand}">Click Me</Button>
    </StackPanel>
</Window>
```

## Related Skills

- `wpf-xaml-style-generator`
- `cross-platform-test-matrix`
