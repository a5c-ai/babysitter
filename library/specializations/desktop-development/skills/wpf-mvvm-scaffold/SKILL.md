---
name: wpf-mvvm-scaffold
description: Generate WPF MVVM architecture with ViewModelBase, RelayCommand, INotifyPropertyChanged, and dependency injection setup
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
tags: [wpf, mvvm, dotnet, csharp, architecture]
---

# wpf-mvvm-scaffold

Generate WPF MVVM architecture scaffolding with ViewModelBase, RelayCommand, INotifyPropertyChanged implementation, and dependency injection setup. This skill creates a production-ready MVVM foundation for WPF applications.

## Capabilities

- Generate ViewModelBase with INotifyPropertyChanged
- Create RelayCommand/AsyncRelayCommand implementations
- Set up dependency injection with Microsoft.Extensions.DependencyInjection
- Generate navigation service pattern
- Create messenger/event aggregator
- Set up design-time data support
- Generate unit test scaffolding for ViewModels
- Configure MVVM toolkit integration

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectPath": {
      "type": "string",
      "description": "Path to the WPF project"
    },
    "projectName": {
      "type": "string",
      "description": "Project name"
    },
    "mvvmFramework": {
      "enum": ["custom", "mvvm-toolkit", "prism", "caliburn"],
      "default": "mvvm-toolkit"
    },
    "features": {
      "type": "array",
      "items": {
        "enum": ["navigation", "messenger", "validation", "dialogs", "design-time"]
      },
      "default": ["navigation", "validation"]
    },
    "diFramework": {
      "enum": ["microsoft-di", "autofac", "ninject"],
      "default": "microsoft-di"
    },
    "generateViewModels": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Initial ViewModels to generate"
    }
  },
  "required": ["projectPath", "projectName"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "files": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "path": { "type": "string" },
          "type": { "enum": ["base", "viewmodel", "service", "command"] }
        }
      }
    },
    "nugetPackages": {
      "type": "array",
      "items": { "type": "string" }
    }
  },
  "required": ["success"]
}
```

## Project Structure

```
MyApp/
├── App.xaml
├── App.xaml.cs
├── ViewModels/
│   ├── Base/
│   │   ├── ViewModelBase.cs
│   │   └── RelayCommand.cs
│   ├── MainViewModel.cs
│   ├── ShellViewModel.cs
│   └── Settings/
│       └── SettingsViewModel.cs
├── Views/
│   ├── MainView.xaml
│   ├── ShellView.xaml
│   └── Settings/
│       └── SettingsView.xaml
├── Services/
│   ├── INavigationService.cs
│   ├── NavigationService.cs
│   ├── IDialogService.cs
│   └── DialogService.cs
├── Models/
│   └── ...
└── Infrastructure/
    ├── Bootstrapper.cs
    ├── ServiceLocator.cs
    └── Messenger.cs
```

## Generated Code Examples

### ViewModelBase.cs

```csharp
using System.ComponentModel;
using System.Runtime.CompilerServices;

namespace MyApp.ViewModels.Base;

public abstract class ViewModelBase : INotifyPropertyChanged
{
    public event PropertyChangedEventHandler? PropertyChanged;

    protected virtual void OnPropertyChanged([CallerMemberName] string? propertyName = null)
    {
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
    }

    protected bool SetProperty<T>(ref T field, T value, [CallerMemberName] string? propertyName = null)
    {
        if (EqualityComparer<T>.Default.Equals(field, value))
            return false;

        field = value;
        OnPropertyChanged(propertyName);
        return true;
    }

    protected bool SetProperty<T>(ref T field, T value, Action onChanged,
        [CallerMemberName] string? propertyName = null)
    {
        if (SetProperty(ref field, value, propertyName))
        {
            onChanged?.Invoke();
            return true;
        }
        return false;
    }

    // Design-time support
    public static bool IsInDesignMode =>
        DesignerProperties.GetIsInDesignMode(new DependencyObject());
}
```

### RelayCommand.cs

```csharp
using System.Windows.Input;

namespace MyApp.ViewModels.Base;

public class RelayCommand : ICommand
{
    private readonly Action<object?> _execute;
    private readonly Predicate<object?>? _canExecute;

    public RelayCommand(Action<object?> execute, Predicate<object?>? canExecute = null)
    {
        _execute = execute ?? throw new ArgumentNullException(nameof(execute));
        _canExecute = canExecute;
    }

    public RelayCommand(Action execute, Func<bool>? canExecute = null)
        : this(_ => execute(), canExecute != null ? _ => canExecute() : null)
    {
    }

    public event EventHandler? CanExecuteChanged
    {
        add => CommandManager.RequerySuggested += value;
        remove => CommandManager.RequerySuggested -= value;
    }

    public bool CanExecute(object? parameter) => _canExecute?.Invoke(parameter) ?? true;

    public void Execute(object? parameter) => _execute(parameter);

    public void RaiseCanExecuteChanged() => CommandManager.InvalidateRequerySuggested();
}

public class AsyncRelayCommand : ICommand
{
    private readonly Func<object?, Task> _execute;
    private readonly Predicate<object?>? _canExecute;
    private bool _isExecuting;

    public AsyncRelayCommand(Func<object?, Task> execute, Predicate<object?>? canExecute = null)
    {
        _execute = execute ?? throw new ArgumentNullException(nameof(execute));
        _canExecute = canExecute;
    }

    public AsyncRelayCommand(Func<Task> execute, Func<bool>? canExecute = null)
        : this(_ => execute(), canExecute != null ? _ => canExecute() : null)
    {
    }

    public event EventHandler? CanExecuteChanged
    {
        add => CommandManager.RequerySuggested += value;
        remove => CommandManager.RequerySuggested -= value;
    }

    public bool CanExecute(object? parameter) =>
        !_isExecuting && (_canExecute?.Invoke(parameter) ?? true);

    public async void Execute(object? parameter)
    {
        if (!CanExecute(parameter)) return;

        _isExecuting = true;
        RaiseCanExecuteChanged();

        try
        {
            await _execute(parameter);
        }
        finally
        {
            _isExecuting = false;
            RaiseCanExecuteChanged();
        }
    }

    public void RaiseCanExecuteChanged() => CommandManager.InvalidateRequerySuggested();
}
```

### MainViewModel.cs

```csharp
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

namespace MyApp.ViewModels;

public partial class MainViewModel : ViewModelBase
{
    private readonly INavigationService _navigationService;
    private readonly IDataService _dataService;

    [ObservableProperty]
    [NotifyCanExecuteChangedFor(nameof(SaveCommand))]
    private string _title = string.Empty;

    [ObservableProperty]
    private bool _isLoading;

    [ObservableProperty]
    private ObservableCollection<ItemViewModel> _items = new();

    public MainViewModel(INavigationService navigationService, IDataService dataService)
    {
        _navigationService = navigationService;
        _dataService = dataService;

        if (IsInDesignMode)
        {
            LoadDesignTimeData();
        }
    }

    public ICommand SaveCommand => new RelayCommand(
        async () => await SaveAsync(),
        () => !string.IsNullOrEmpty(Title) && !IsLoading);

    public ICommand NavigateToSettingsCommand => new RelayCommand(
        () => _navigationService.NavigateTo<SettingsViewModel>());

    private async Task SaveAsync()
    {
        IsLoading = true;
        try
        {
            await _dataService.SaveAsync(Title);
        }
        finally
        {
            IsLoading = false;
        }
    }

    public async Task LoadDataAsync()
    {
        IsLoading = true;
        try
        {
            var data = await _dataService.GetItemsAsync();
            Items = new ObservableCollection<ItemViewModel>(data.Select(d => new ItemViewModel(d)));
        }
        finally
        {
            IsLoading = false;
        }
    }

    private void LoadDesignTimeData()
    {
        Title = "Design Time Title";
        Items = new ObservableCollection<ItemViewModel>
        {
            new("Item 1"),
            new("Item 2"),
            new("Item 3")
        };
    }
}
```

### App.xaml.cs with DI

```csharp
using Microsoft.Extensions.DependencyInjection;

namespace MyApp;

public partial class App : Application
{
    private readonly IServiceProvider _serviceProvider;

    public App()
    {
        var services = new ServiceCollection();
        ConfigureServices(services);
        _serviceProvider = services.BuildServiceProvider();
    }

    private void ConfigureServices(IServiceCollection services)
    {
        // Services
        services.AddSingleton<INavigationService, NavigationService>();
        services.AddSingleton<IDialogService, DialogService>();
        services.AddTransient<IDataService, DataService>();

        // ViewModels
        services.AddTransient<MainViewModel>();
        services.AddTransient<SettingsViewModel>();
        services.AddSingleton<ShellViewModel>();

        // Views
        services.AddTransient<MainView>();
        services.AddTransient<SettingsView>();
        services.AddSingleton<ShellView>();
    }

    protected override void OnStartup(StartupEventArgs e)
    {
        var shell = _serviceProvider.GetRequiredService<ShellView>();
        shell.DataContext = _serviceProvider.GetRequiredService<ShellViewModel>();
        shell.Show();

        base.OnStartup(e);
    }
}
```

### NavigationService.cs

```csharp
namespace MyApp.Services;

public interface INavigationService
{
    void NavigateTo<TViewModel>() where TViewModel : ViewModelBase;
    void NavigateTo<TViewModel>(object parameter) where TViewModel : ViewModelBase;
    void GoBack();
    bool CanGoBack { get; }
}

public class NavigationService : ViewModelBase, INavigationService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly Stack<ViewModelBase> _navigationStack = new();

    public NavigationService(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    private ViewModelBase? _currentViewModel;
    public ViewModelBase? CurrentViewModel
    {
        get => _currentViewModel;
        private set => SetProperty(ref _currentViewModel, value);
    }

    public bool CanGoBack => _navigationStack.Count > 1;

    public void NavigateTo<TViewModel>() where TViewModel : ViewModelBase
    {
        NavigateTo<TViewModel>(null);
    }

    public void NavigateTo<TViewModel>(object? parameter) where TViewModel : ViewModelBase
    {
        var viewModel = _serviceProvider.GetRequiredService<TViewModel>();

        if (viewModel is INavigationAware navigationAware)
        {
            navigationAware.OnNavigatedTo(parameter);
        }

        if (CurrentViewModel is INavigationAware currentNavigationAware)
        {
            currentNavigationAware.OnNavigatedFrom();
        }

        _navigationStack.Push(viewModel);
        CurrentViewModel = viewModel;
    }

    public void GoBack()
    {
        if (!CanGoBack) return;

        if (CurrentViewModel is INavigationAware currentNavigationAware)
        {
            currentNavigationAware.OnNavigatedFrom();
        }

        _navigationStack.Pop();
        CurrentViewModel = _navigationStack.Peek();

        if (CurrentViewModel is INavigationAware navigationAware)
        {
            navigationAware.OnNavigatedTo(null);
        }
    }
}
```

## NuGet Packages

```xml
<ItemGroup>
  <PackageReference Include="CommunityToolkit.Mvvm" Version="8.2.2" />
  <PackageReference Include="Microsoft.Extensions.DependencyInjection" Version="8.0.0" />
</ItemGroup>
```

## Best Practices

1. **Keep ViewModels UI-agnostic**: No references to WPF types
2. **Use async commands**: For long-running operations
3. **Implement INotifyDataErrorInfo**: For validation
4. **Design-time data**: Support Blend/VS designer
5. **Single responsibility**: One ViewModel per View
6. **Unit test ViewModels**: Mock services

## Related Skills

- `wpf-xaml-style-generator` - UI styling
- `msix-package-generator` - Packaging
- `desktop-unit-testing` process - Testing

## Related Agents

- `wpf-dotnet-expert` - WPF expertise
- `architecture-pattern-advisor` - MVVM patterns
