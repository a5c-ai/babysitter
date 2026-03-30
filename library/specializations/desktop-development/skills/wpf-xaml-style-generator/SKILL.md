---
name: wpf-xaml-style-generator
description: Generate XAML styles, templates, and resource dictionaries with theme support for WPF applications
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
tags: [wpf, xaml, styles, themes, ui]
---

# wpf-xaml-style-generator

Generate XAML styles, control templates, and resource dictionaries with theme support for WPF applications. This skill creates consistent, maintainable UI styling following modern design principles.

## Capabilities

- Generate control styles and templates
- Create resource dictionaries with theme support
- Set up light/dark theme switching
- Generate brush and color resources
- Create custom control templates
- Set up implicit vs explicit styles
- Generate animation resources
- Configure Fluent Design integration

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectPath": {
      "type": "string",
      "description": "Path to the WPF project"
    },
    "designSystem": {
      "enum": ["fluent", "material", "custom"],
      "default": "fluent"
    },
    "themes": {
      "type": "array",
      "items": { "enum": ["light", "dark", "high-contrast"] },
      "default": ["light", "dark"]
    },
    "controls": {
      "type": "array",
      "items": {
        "enum": ["button", "textbox", "combobox", "listbox", "datagrid", "menu", "all"]
      },
      "default": ["all"]
    },
    "accentColors": {
      "type": "object",
      "properties": {
        "primary": { "type": "string" },
        "secondary": { "type": "string" }
      }
    },
    "includeAnimations": {
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
    "files": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "path": { "type": "string" },
          "type": { "enum": ["colors", "brushes", "styles", "templates", "themes"] }
        }
      }
    },
    "mergedDictionaries": { "type": "array", "items": { "type": "string" } }
  },
  "required": ["success"]
}
```

## Resource Dictionary Structure

```
Resources/
├── Themes/
│   ├── Colors.Light.xaml
│   ├── Colors.Dark.xaml
│   └── Colors.HighContrast.xaml
├── Brushes.xaml
├── Styles/
│   ├── ButtonStyles.xaml
│   ├── TextBoxStyles.xaml
│   ├── ComboBoxStyles.xaml
│   └── DataGridStyles.xaml
├── Templates/
│   └── ControlTemplates.xaml
└── Themes.xaml (merged dictionary)
```

## Generated XAML Examples

### Colors.Light.xaml

```xml
<ResourceDictionary xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
                    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml">

    <!-- Background Colors -->
    <Color x:Key="BackgroundPrimary">#FFFFFF</Color>
    <Color x:Key="BackgroundSecondary">#F3F3F3</Color>
    <Color x:Key="BackgroundTertiary">#E5E5E5</Color>

    <!-- Foreground Colors -->
    <Color x:Key="ForegroundPrimary">#1A1A1A</Color>
    <Color x:Key="ForegroundSecondary">#666666</Color>
    <Color x:Key="ForegroundDisabled">#ABABAB</Color>

    <!-- Accent Colors -->
    <Color x:Key="AccentPrimary">#0078D4</Color>
    <Color x:Key="AccentSecondary">#005A9E</Color>
    <Color x:Key="AccentLight">#4BA0E8</Color>

    <!-- Border Colors -->
    <Color x:Key="BorderDefault">#D6D6D6</Color>
    <Color x:Key="BorderFocused">#0078D4</Color>
    <Color x:Key="BorderHover">#8A8A8A</Color>

    <!-- State Colors -->
    <Color x:Key="SuccessColor">#107C10</Color>
    <Color x:Key="WarningColor">#FF8C00</Color>
    <Color x:Key="ErrorColor">#D13438</Color>
    <Color x:Key="InfoColor">#0078D4</Color>

</ResourceDictionary>
```

### Brushes.xaml

```xml
<ResourceDictionary xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
                    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml">

    <!-- Dynamic Brushes (respond to theme changes) -->
    <SolidColorBrush x:Key="BackgroundPrimaryBrush"
                     Color="{DynamicResource BackgroundPrimary}"/>
    <SolidColorBrush x:Key="BackgroundSecondaryBrush"
                     Color="{DynamicResource BackgroundSecondary}"/>

    <SolidColorBrush x:Key="ForegroundPrimaryBrush"
                     Color="{DynamicResource ForegroundPrimary}"/>
    <SolidColorBrush x:Key="ForegroundSecondaryBrush"
                     Color="{DynamicResource ForegroundSecondary}"/>

    <SolidColorBrush x:Key="AccentBrush"
                     Color="{DynamicResource AccentPrimary}"/>
    <SolidColorBrush x:Key="AccentHoverBrush"
                     Color="{DynamicResource AccentSecondary}"/>

    <SolidColorBrush x:Key="BorderBrush"
                     Color="{DynamicResource BorderDefault}"/>
    <SolidColorBrush x:Key="BorderFocusBrush"
                     Color="{DynamicResource BorderFocused}"/>

    <!-- Gradient Brushes -->
    <LinearGradientBrush x:Key="AccentGradientBrush" StartPoint="0,0" EndPoint="0,1">
        <GradientStop Color="{DynamicResource AccentLight}" Offset="0"/>
        <GradientStop Color="{DynamicResource AccentPrimary}" Offset="1"/>
    </LinearGradientBrush>

</ResourceDictionary>
```

### ButtonStyles.xaml

```xml
<ResourceDictionary xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
                    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml">

    <!-- Base Button Style -->
    <Style x:Key="BaseButtonStyle" TargetType="Button">
        <Setter Property="Background" Value="{DynamicResource BackgroundSecondaryBrush}"/>
        <Setter Property="Foreground" Value="{DynamicResource ForegroundPrimaryBrush}"/>
        <Setter Property="BorderBrush" Value="{DynamicResource BorderBrush}"/>
        <Setter Property="BorderThickness" Value="1"/>
        <Setter Property="Padding" Value="16,8"/>
        <Setter Property="MinHeight" Value="32"/>
        <Setter Property="FontSize" Value="14"/>
        <Setter Property="Cursor" Value="Hand"/>
        <Setter Property="Template">
            <Setter.Value>
                <ControlTemplate TargetType="Button">
                    <Border x:Name="border"
                            Background="{TemplateBinding Background}"
                            BorderBrush="{TemplateBinding BorderBrush}"
                            BorderThickness="{TemplateBinding BorderThickness}"
                            CornerRadius="4"
                            SnapsToDevicePixels="True">
                        <ContentPresenter x:Name="contentPresenter"
                                          Focusable="False"
                                          HorizontalAlignment="{TemplateBinding HorizontalContentAlignment}"
                                          VerticalAlignment="{TemplateBinding VerticalContentAlignment}"
                                          Margin="{TemplateBinding Padding}"
                                          RecognizesAccessKey="True"/>
                    </Border>
                    <ControlTemplate.Triggers>
                        <Trigger Property="IsMouseOver" Value="True">
                            <Setter TargetName="border" Property="Background"
                                    Value="{DynamicResource BackgroundTertiaryBrush}"/>
                            <Setter TargetName="border" Property="BorderBrush"
                                    Value="{DynamicResource BorderHoverBrush}"/>
                        </Trigger>
                        <Trigger Property="IsPressed" Value="True">
                            <Setter TargetName="border" Property="Background"
                                    Value="{DynamicResource AccentBrush}"/>
                            <Setter Property="Foreground"
                                    Value="White"/>
                        </Trigger>
                        <Trigger Property="IsEnabled" Value="False">
                            <Setter Property="Opacity" Value="0.5"/>
                        </Trigger>
                    </ControlTemplate.Triggers>
                </ControlTemplate>
            </Setter.Value>
        </Setter>
    </Style>

    <!-- Primary Button Style -->
    <Style x:Key="PrimaryButtonStyle" TargetType="Button" BasedOn="{StaticResource BaseButtonStyle}">
        <Setter Property="Background" Value="{DynamicResource AccentBrush}"/>
        <Setter Property="Foreground" Value="White"/>
        <Setter Property="BorderBrush" Value="Transparent"/>
        <Setter Property="Template">
            <Setter.Value>
                <ControlTemplate TargetType="Button">
                    <Border x:Name="border"
                            Background="{TemplateBinding Background}"
                            BorderBrush="{TemplateBinding BorderBrush}"
                            BorderThickness="{TemplateBinding BorderThickness}"
                            CornerRadius="4"
                            SnapsToDevicePixels="True">
                        <ContentPresenter HorizontalAlignment="Center"
                                          VerticalAlignment="Center"
                                          Margin="{TemplateBinding Padding}"/>
                    </Border>
                    <ControlTemplate.Triggers>
                        <Trigger Property="IsMouseOver" Value="True">
                            <Setter TargetName="border" Property="Background"
                                    Value="{DynamicResource AccentHoverBrush}"/>
                        </Trigger>
                        <Trigger Property="IsPressed" Value="True">
                            <Setter TargetName="border" Property="Background"
                                    Value="{DynamicResource AccentSecondary}"/>
                        </Trigger>
                        <Trigger Property="IsEnabled" Value="False">
                            <Setter Property="Opacity" Value="0.5"/>
                        </Trigger>
                    </ControlTemplate.Triggers>
                </ControlTemplate>
            </Setter.Value>
        </Setter>
    </Style>

    <!-- Implicit style for all buttons -->
    <Style TargetType="Button" BasedOn="{StaticResource BaseButtonStyle}"/>

</ResourceDictionary>
```

### Theme Manager

```csharp
public class ThemeManager
{
    private const string ThemesPath = "pack://application:,,,/Resources/Themes/";

    public static void SetTheme(string themeName)
    {
        var app = Application.Current;
        var dictionaries = app.Resources.MergedDictionaries;

        // Remove existing theme
        var existingTheme = dictionaries.FirstOrDefault(d =>
            d.Source?.OriginalString.Contains("Colors.") ?? false);

        if (existingTheme != null)
        {
            dictionaries.Remove(existingTheme);
        }

        // Add new theme
        var themeUri = new Uri($"{ThemesPath}Colors.{themeName}.xaml");
        dictionaries.Insert(0, new ResourceDictionary { Source = themeUri });
    }

    public static string CurrentTheme { get; private set; } = "Light";

    public static void ToggleTheme()
    {
        CurrentTheme = CurrentTheme == "Light" ? "Dark" : "Light";
        SetTheme(CurrentTheme);
    }
}
```

### App.xaml

```xml
<Application x:Class="MyApp.App"
             xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml">
    <Application.Resources>
        <ResourceDictionary>
            <ResourceDictionary.MergedDictionaries>
                <!-- Theme colors (first so brushes can reference them) -->
                <ResourceDictionary Source="Resources/Themes/Colors.Light.xaml"/>

                <!-- Brushes -->
                <ResourceDictionary Source="Resources/Brushes.xaml"/>

                <!-- Control Styles -->
                <ResourceDictionary Source="Resources/Styles/ButtonStyles.xaml"/>
                <ResourceDictionary Source="Resources/Styles/TextBoxStyles.xaml"/>
                <ResourceDictionary Source="Resources/Styles/ComboBoxStyles.xaml"/>
                <ResourceDictionary Source="Resources/Styles/DataGridStyles.xaml"/>
            </ResourceDictionary.MergedDictionaries>
        </ResourceDictionary>
    </Application.Resources>
</Application>
```

## Best Practices

1. **Use DynamicResource**: For theme-switchable resources
2. **Organize by function**: Colors, brushes, styles separately
3. **Follow naming conventions**: Consistent resource key names
4. **Provide base styles**: Allow easy customization
5. **Test all themes**: Verify contrast and accessibility
6. **Document resources**: Comment complex templates

## Related Skills

- `wpf-mvvm-scaffold` - Application architecture
- `wpf-high-dpi-analyzer` - DPI scaling
- `desktop-ui-implementation` process - UI workflow

## Related Agents

- `wpf-dotnet-expert` - WPF expertise
- `platform-convention-advisor` - Design guidelines
