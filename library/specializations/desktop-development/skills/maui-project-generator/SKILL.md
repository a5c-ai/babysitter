---
name: maui-project-generator
description: Generate .NET MAUI project with platform-specific handlers for desktop and mobile
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
tags: [maui, dotnet, cross-platform, xaml, csharp]
---

# maui-project-generator

Generate .NET MAUI project with platform-specific handlers for Windows and macOS desktop development alongside mobile platforms.

## Capabilities

- Create MAUI project structure
- Configure platform-specific handlers
- Set up dependency injection
- Configure MVVM pattern
- Set up platform-specific UI
- Configure build targets
- Set up app lifecycle handling
- Generate platform-specific code

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectPath": { "type": "string" },
    "projectName": { "type": "string" },
    "platforms": { "type": "array", "items": { "enum": ["windows", "macos", "ios", "android"] } }
  },
  "required": ["projectPath", "projectName"]
}
```

## Project Structure

```
MyMauiApp/
├── MauiProgram.cs
├── App.xaml
├── MainPage.xaml
├── Platforms/
│   ├── Windows/
│   ├── MacCatalyst/
│   ├── iOS/
│   └── Android/
└── Resources/
```

## MauiProgram.cs

```csharp
public static MauiApp CreateMauiApp()
{
    var builder = MauiApp.CreateBuilder();
    builder.UseMauiApp<App>()
           .ConfigureFonts(fonts => {
               fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
           });
    return builder.Build();
}
```

## Related Skills

- `wpf-mvvm-scaffold`
- `cross-platform-test-matrix`
