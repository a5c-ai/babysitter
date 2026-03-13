---
name: winui3-migration-helper
description: Assist migration from WPF to WinUI 3 / Windows App SDK with code transformation and compatibility guidance
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
tags: [winui, wpf, migration, windows-app-sdk, modernization]
---

# winui3-migration-helper

Assist migration from WPF to WinUI 3 / Windows App SDK. This skill analyzes WPF applications and provides migration paths, code transformations, and compatibility guidance for modernizing to WinUI 3.

## Capabilities

- Analyze WPF codebase for migration compatibility
- Identify API differences and required changes
- Generate WinUI 3 project structure
- Transform XAML syntax differences
- Migrate code-behind to modern patterns
- Handle namespace and type mappings
- Configure Windows App SDK dependencies
- Generate migration task list with priorities

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectPath": {
      "type": "string",
      "description": "Path to the WPF project"
    },
    "migrationStrategy": {
      "enum": ["full", "incremental", "analysis-only"],
      "default": "analysis-only"
    },
    "targetSdk": {
      "type": "string",
      "default": "1.5",
      "description": "Target Windows App SDK version"
    },
    "preserveWpfComponents": {
      "type": "array",
      "items": { "type": "string" },
      "description": "WPF components to keep via XAML Islands"
    },
    "generateReport": {
      "type": "boolean",
      "default": true
    }
  },
  "required": ["projectPath"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "compatibility": {
      "type": "object",
      "properties": {
        "score": { "type": "number" },
        "blockers": { "type": "array" },
        "warnings": { "type": "array" }
      }
    },
    "migrationTasks": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "category": { "type": "string" },
          "task": { "type": "string" },
          "effort": { "enum": ["low", "medium", "high"] },
          "automated": { "type": "boolean" }
        }
      }
    },
    "codeTransformations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "file": { "type": "string" },
          "original": { "type": "string" },
          "transformed": { "type": "string" }
        }
      }
    }
  },
  "required": ["success"]
}
```

## Key Differences

### Namespace Changes

| WPF | WinUI 3 |
|-----|---------|
| `System.Windows` | `Microsoft.UI.Xaml` |
| `System.Windows.Controls` | `Microsoft.UI.Xaml.Controls` |
| `System.Windows.Media` | `Microsoft.UI.Xaml.Media` |
| `System.Windows.Input` | `Microsoft.UI.Xaml.Input` |
| `System.Windows.Data` | `Microsoft.UI.Xaml.Data` |

### XAML Namespace

```xml
<!-- WPF -->
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml">

<!-- WinUI 3 -->
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        xmlns:local="using:MyApp">
```

### Window Creation

```csharp
// WPF
public partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();
    }
}

// WinUI 3
public sealed partial class MainWindow : Window
{
    public MainWindow()
    {
        this.InitializeComponent();

        // WinUI 3: No automatic window sizing
        this.SetWindowSize(800, 600);
    }

    private void SetWindowSize(int width, int height)
    {
        var hWnd = WinRT.Interop.WindowNative.GetWindowHandle(this);
        var windowId = Microsoft.UI.Win32Interop.GetWindowIdFromWindow(hWnd);
        var appWindow = Microsoft.UI.Windowing.AppWindow.GetFromWindowId(windowId);
        appWindow.Resize(new Windows.Graphics.SizeInt32(width, height));
    }
}
```

### Common Control Differences

```xml
<!-- WPF: DataGrid -->
<DataGrid ItemsSource="{Binding Items}"
          AutoGenerateColumns="False">
    <DataGrid.Columns>
        <DataGridTextColumn Header="Name" Binding="{Binding Name}"/>
    </DataGrid.Columns>
</DataGrid>

<!-- WinUI 3: Community Toolkit DataGrid -->
<toolkit:DataGrid ItemsSource="{x:Bind ViewModel.Items}"
                  AutoGenerateColumns="False">
    <toolkit:DataGrid.Columns>
        <toolkit:DataGridTextColumn Header="Name" Binding="{Binding Name}"/>
    </toolkit:DataGrid.Columns>
</toolkit:DataGrid>
```

### Binding Syntax

```xml
<!-- WPF: Classic binding -->
<TextBlock Text="{Binding Name}"/>
<Button Command="{Binding SaveCommand}"/>

<!-- WinUI 3: x:Bind (compiled bindings, recommended) -->
<TextBlock Text="{x:Bind ViewModel.Name, Mode=OneWay}"/>
<Button Command="{x:Bind ViewModel.SaveCommand}"/>

<!-- WinUI 3: Classic binding still works -->
<TextBlock Text="{Binding Name}"/>
```

### Resource Dictionaries

```xml
<!-- WPF -->
<ResourceDictionary>
    <SolidColorBrush x:Key="AccentBrush" Color="#0078D4"/>
    <Style TargetType="Button">
        <Setter Property="Background" Value="{StaticResource AccentBrush}"/>
    </Style>
</ResourceDictionary>

<!-- WinUI 3 -->
<ResourceDictionary>
    <SolidColorBrush x:Key="AccentBrush" Color="#0078D4"/>
    <Style TargetType="Button">
        <Setter Property="Background" Value="{StaticResource AccentBrush}"/>
    </Style>
</ResourceDictionary>
<!-- Note: Largely compatible, but some default styles differ -->
```

## Project Configuration

### WPF .csproj

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>WinExe</OutputType>
    <TargetFramework>net8.0-windows</TargetFramework>
    <UseWPF>true</UseWPF>
  </PropertyGroup>
</Project>
```

### WinUI 3 .csproj

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>WinExe</OutputType>
    <TargetFramework>net8.0-windows10.0.19041.0</TargetFramework>
    <TargetPlatformMinVersion>10.0.17763.0</TargetPlatformMinVersion>
    <UseWinUI>true</UseWinUI>
    <WindowsPackageType>None</WindowsPackageType>
    <Platforms>x64;x86;arm64</Platforms>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.WindowsAppSDK" Version="1.5.240227000"/>
    <PackageReference Include="Microsoft.Windows.SDK.BuildTools" Version="10.0.22621.756"/>
  </ItemGroup>
</Project>
```

## Migration Blockers

### Not Available in WinUI 3

| Feature | Alternative |
|---------|-------------|
| NavigationWindow | Custom navigation with Frame |
| DataGrid (built-in) | Community Toolkit DataGrid |
| RichTextBox | RichEditBox |
| WebBrowser | WebView2 |
| WindowsFormsHost | Not available (use XAML Islands in reverse) |
| System tray icons | Win32 APIs directly |

### Requires Changes

| WPF Feature | WinUI 3 Approach |
|-------------|------------------|
| Application.Current.Dispatcher | DispatcherQueue |
| RoutedUICommand | ICommand implementation |
| Triggers in styles | VisualStateManager |
| Effect (blur, etc.) | Composition APIs |
| DynamicResource | StaticResource (mostly) |

## Code Transformations

### Dispatcher

```csharp
// WPF
Application.Current.Dispatcher.Invoke(() => {
    // UI code
});

// WinUI 3
DispatcherQueue.GetForCurrentThread().TryEnqueue(() => {
    // UI code
});
```

### Triggers to VisualStateManager

```xml
<!-- WPF: Style Trigger -->
<Style TargetType="Button">
    <Style.Triggers>
        <Trigger Property="IsMouseOver" Value="True">
            <Setter Property="Background" Value="LightBlue"/>
        </Trigger>
    </Style.Triggers>
</Style>

<!-- WinUI 3: VisualStateManager -->
<Style TargetType="Button">
    <Setter Property="Template">
        <Setter.Value>
            <ControlTemplate TargetType="Button">
                <Border x:Name="RootBorder" Background="{TemplateBinding Background}">
                    <VisualStateManager.VisualStateGroups>
                        <VisualStateGroup x:Name="CommonStates">
                            <VisualState x:Name="PointerOver">
                                <Storyboard>
                                    <ColorAnimation Storyboard.TargetName="RootBorder"
                                                    Storyboard.TargetProperty="(Border.Background).(SolidColorBrush.Color)"
                                                    To="LightBlue"/>
                                </Storyboard>
                            </VisualState>
                        </VisualStateGroup>
                    </VisualStateManager.VisualStateGroups>
                    <ContentPresenter/>
                </Border>
            </ControlTemplate>
        </Setter.Value>
    </Setter>
</Style>
```

## Best Practices

1. **Start with analysis**: Understand scope before migrating
2. **Migrate incrementally**: Move feature by feature
3. **Use x:Bind**: Better performance than classic binding
4. **Embrace WinUI styles**: Don't fight the defaults
5. **Test on Windows 10 min version**: Verify compatibility
6. **Consider XAML Islands**: For gradual migration

## Related Skills

- `wpf-mvvm-scaffold` - MVVM pattern (works in both)
- `msix-package-generator` - WinUI 3 packaging
- `desktop-migration` process - Full migration workflow

## Related Agents

- `wpf-dotnet-expert` - WPF expertise
- `desktop-migration-strategist` - Migration planning
