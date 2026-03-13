# wpf-mvvm-scaffold

Generate WPF MVVM architecture with ViewModelBase, RelayCommand, and DI setup.

## Overview

This skill creates a production-ready MVVM foundation for WPF applications, including base classes, commands, navigation services, and dependency injection configuration.

## Quick Start

```javascript
const result = await invokeSkill('wpf-mvvm-scaffold', {
  projectPath: '/path/to/wpf-project',
  projectName: 'MyWpfApp',
  mvvmFramework: 'mvvm-toolkit',
  features: ['navigation', 'validation', 'dialogs', 'design-time'],
  diFramework: 'microsoft-di',
  generateViewModels: ['MainViewModel', 'SettingsViewModel']
});
```

## Features

### MVVM Frameworks

| Framework | Description |
|-----------|-------------|
| custom | Hand-rolled base classes |
| mvvm-toolkit | CommunityToolkit.Mvvm |
| prism | Prism Library |
| caliburn | Caliburn.Micro |

### Generated Components

- ViewModelBase with INotifyPropertyChanged
- RelayCommand / AsyncRelayCommand
- Navigation service
- Dialog service
- DI bootstrapper

## Project Structure

```
MyApp/
├── ViewModels/
│   ├── Base/
│   │   ├── ViewModelBase.cs
│   │   └── RelayCommand.cs
│   └── MainViewModel.cs
├── Views/
│   └── MainView.xaml
├── Services/
│   └── NavigationService.cs
└── Infrastructure/
    └── Bootstrapper.cs
```

## Related Skills

- `wpf-xaml-style-generator`
- `msix-package-generator`

## Related Agents

- `wpf-dotnet-expert`
- `architecture-pattern-advisor`
