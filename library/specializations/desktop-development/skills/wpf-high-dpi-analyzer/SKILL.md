---
name: wpf-high-dpi-analyzer
description: Analyze and fix WPF applications for high DPI support, per-monitor DPI awareness, and scaling issues
allowed-tools: Read, Grep, Glob, Bash
tags: [wpf, dpi, scaling, accessibility, windows]
---

# wpf-high-dpi-analyzer

Analyze and fix WPF applications for high DPI support. This skill identifies DPI-related issues and provides fixes for per-monitor DPI awareness, bitmap scaling, and layout problems on high-resolution displays.

## Capabilities

- Detect DPI awareness configuration issues
- Find hardcoded pixel values
- Identify bitmap scaling problems
- Check for per-monitor DPI support
- Analyze transform and layout issues
- Review app.manifest DPI settings
- Generate fixes for common DPI problems
- Test multi-monitor DPI scenarios

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectPath": {
      "type": "string",
      "description": "Path to the WPF project"
    },
    "targetDpiMode": {
      "enum": ["system", "per-monitor", "per-monitor-v2"],
      "default": "per-monitor-v2"
    },
    "checkCategories": {
      "type": "array",
      "items": {
        "enum": ["manifest", "hardcoded-pixels", "bitmaps", "layouts", "transforms", "fonts"]
      },
      "default": ["manifest", "hardcoded-pixels", "bitmaps", "layouts"]
    },
    "generateFixes": {
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
    "dpiMode": { "type": "string" },
    "issues": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "severity": { "enum": ["critical", "high", "medium", "low"] },
          "category": { "type": "string" },
          "file": { "type": "string" },
          "line": { "type": "number" },
          "description": { "type": "string" },
          "fix": { "type": "string" }
        }
      }
    },
    "recommendations": {
      "type": "array",
      "items": { "type": "string" }
    }
  },
  "required": ["success", "issues"]
}
```

## DPI Awareness Modes

### System DPI Aware (Legacy)

```xml
<!-- app.manifest -->
<application xmlns="urn:schemas-microsoft-com:asm.v3">
  <windowsSettings>
    <dpiAware xmlns="http://schemas.microsoft.com/SMI/2005/WindowsSettings">true</dpiAware>
  </windowsSettings>
</application>
```

### Per-Monitor DPI Aware (Windows 8.1+)

```xml
<application xmlns="urn:schemas-microsoft-com:asm.v3">
  <windowsSettings>
    <dpiAware xmlns="http://schemas.microsoft.com/SMI/2005/WindowsSettings">true/PM</dpiAware>
  </windowsSettings>
</application>
```

### Per-Monitor V2 DPI Aware (Windows 10 1703+)

```xml
<application xmlns="urn:schemas-microsoft-com:asm.v3">
  <windowsSettings>
    <dpiAware xmlns="http://schemas.microsoft.com/SMI/2005/WindowsSettings">true/PM</dpiAware>
    <dpiAwareness xmlns="http://schemas.microsoft.com/SMI/2016/WindowsSettings">PerMonitorV2</dpiAwareness>
  </windowsSettings>
</application>
```

## Common Issues and Fixes

### Hardcoded Pixel Values

```xml
<!-- BAD: Hardcoded pixels -->
<Button Width="100" Height="30"/>
<Grid Margin="10,5,10,5"/>
<TextBlock FontSize="12"/>

<!-- GOOD: Use device-independent units or relative sizing -->
<Button MinWidth="80" MinHeight="24" Padding="16,4"/>
<Grid Margin="{StaticResource StandardMargin}"/>
<TextBlock Style="{StaticResource BodyTextStyle}"/>
```

### Bitmap Images

```xml
<!-- BAD: Single resolution bitmap -->
<Image Source="icon.png"/>

<!-- GOOD: Use vector or provide multiple resolutions -->
<Image>
  <Image.Source>
    <DrawingImage>
      <!-- Vector drawing -->
    </DrawingImage>
  </Image.Source>
</Image>

<!-- Or use BitmapScalingMode for crisp scaling -->
<Image Source="icon.png"
       RenderOptions.BitmapScalingMode="HighQuality"/>
```

### Dynamic DPI Handling

```csharp
// Handle DPI changes at runtime
public partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();

        // Get current DPI
        var dpiScale = VisualTreeHelper.GetDpi(this);
        Debug.WriteLine($"DPI: {dpiScale.PixelsPerDip * 96}");
    }

    protected override void OnDpiChanged(DpiScale oldDpi, DpiScale newDpi)
    {
        base.OnDpiChanged(oldDpi, newDpi);

        // Handle DPI change
        Debug.WriteLine($"DPI changed from {oldDpi.PixelsPerDip * 96} to {newDpi.PixelsPerDip * 96}");

        // Reload high-DPI assets if needed
        ReloadAssets(newDpi);
    }

    private void ReloadAssets(DpiScale dpi)
    {
        // Load appropriate resolution assets
        var scale = dpi.PixelsPerDip;
        string suffix = scale >= 2 ? "@2x" : scale >= 1.5 ? "@1.5x" : "";
        // Load assets with suffix
    }
}
```

### Per-Monitor V2 Setup

```csharp
// App.xaml.cs
public partial class App : Application
{
    protected override void OnStartup(StartupEventArgs e)
    {
        // Enable Per-Monitor V2 DPI awareness (Windows 10 1703+)
        if (Environment.OSVersion.Version >= new Version(10, 0, 15063))
        {
            // Per-Monitor V2 is automatic with manifest, but verify
            var awareness = GetProcessDpiAwareness();
            Debug.WriteLine($"DPI Awareness: {awareness}");
        }

        base.OnStartup(e);
    }

    [DllImport("shcore.dll")]
    private static extern int GetProcessDpiAwareness(IntPtr hprocess, out int awareness);

    private static int GetProcessDpiAwareness()
    {
        GetProcessDpiAwareness(IntPtr.Zero, out int awareness);
        return awareness;
    }
}
```

### Transform Issues

```csharp
// BAD: Manual scaling calculations
var scale = 96.0 / GetSystemDpi();
transform.ScaleX = scale;
transform.ScaleY = scale;

// GOOD: Let WPF handle scaling
// Use device-independent units, WPF handles the rest
<Canvas>
    <Rectangle Canvas.Left="10" Canvas.Top="10"
               Width="100" Height="50"/>
</Canvas>
```

### Font Scaling

```xml
<!-- BAD: Hardcoded font size -->
<TextBlock FontSize="14"/>

<!-- GOOD: Use named styles or relative sizing -->
<TextBlock Style="{DynamicResource MaterialDesignBody1TextBlock}"/>

<!-- Or use system font size -->
<TextBlock FontSize="{x:Static SystemFonts.MessageFontSize}"/>
```

## Project Configuration

```xml
<!-- .csproj -->
<PropertyGroup>
  <TargetFramework>net8.0-windows</TargetFramework>
  <UseWPF>true</UseWPF>

  <!-- Enable high DPI support -->
  <ApplicationHighDpiMode>PerMonitorV2</ApplicationHighDpiMode>
</PropertyGroup>

<!-- Include app.manifest -->
<ItemGroup>
  <None Update="app.manifest">
    <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
  </None>
</ItemGroup>
```

## Testing Multi-DPI

```powershell
# Change display scaling via PowerShell (requires restart)
Set-ItemProperty -Path "HKCU:\Control Panel\Desktop" -Name "LogPixels" -Value 144  # 150%

# Test with multiple monitors at different DPIs
# Use Windows display settings to set different scales per monitor
```

## Best Practices

1. **Use Per-Monitor V2**: Best scaling support on Windows 10+
2. **Avoid hardcoded pixels**: Use relative or auto sizing
3. **Use vector graphics**: SVG or DrawingImage for icons
4. **Provide multi-resolution bitmaps**: @1x, @1.5x, @2x
5. **Handle OnDpiChanged**: Reload assets when DPI changes
6. **Test at multiple DPI levels**: 100%, 125%, 150%, 200%

## Related Skills

- `wpf-xaml-style-generator` - DPI-aware styles
- `desktop-accessibility` process - Accessibility testing
- `visual-regression-setup` - Visual testing at different DPIs

## Related Agents

- `wpf-dotnet-expert` - WPF expertise
- `desktop-ux-analyst` - UX review
