---
name: dotnet-clickonce-config
description: Configure ClickOnce deployment with auto-update, prerequisites, and publish settings for .NET applications
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
tags: [dotnet, clickonce, deployment, auto-update, windows]
---

# dotnet-clickonce-config

Configure ClickOnce deployment for .NET applications with auto-update capabilities, prerequisite management, and publish settings. This skill sets up the complete ClickOnce deployment pipeline.

## Capabilities

- Configure ClickOnce publish settings
- Set up automatic update checking
- Manage application prerequisites
- Configure file associations
- Set up signing with certificates
- Generate publish profiles
- Configure deployment manifest
- Set up web or file share deployment

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectPath": {
      "type": "string",
      "description": "Path to the .NET project"
    },
    "publishSettings": {
      "type": "object",
      "properties": {
        "publishUrl": { "type": "string" },
        "installUrl": { "type": "string" },
        "updateMode": { "enum": ["foreground", "background"] },
        "updateInterval": { "type": "number" },
        "minimumVersion": { "type": "string" }
      }
    },
    "prerequisites": {
      "type": "array",
      "items": { "type": "string" }
    },
    "fileAssociations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "extension": { "type": "string" },
          "description": { "type": "string" }
        }
      }
    },
    "signing": {
      "type": "object",
      "properties": {
        "certificatePath": { "type": "string" },
        "timestampUrl": { "type": "string" }
      }
    }
  },
  "required": ["projectPath", "publishSettings"]
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
          "type": { "enum": ["pubxml", "manifest", "settings"] }
        }
      }
    },
    "publishCommand": { "type": "string" }
  },
  "required": ["success"]
}
```

## .csproj Configuration

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <OutputType>WinExe</OutputType>
    <TargetFramework>net8.0-windows</TargetFramework>
    <UseWPF>true</UseWPF>

    <!-- ClickOnce settings -->
    <PublishUrl>https://myserver.com/myapp/</PublishUrl>
    <InstallUrl>https://myserver.com/myapp/</InstallUrl>
    <UpdateUrl>https://myserver.com/myapp/</UpdateUrl>
    <ApplicationRevision>1</ApplicationRevision>
    <ApplicationVersion>1.0.0.*</ApplicationVersion>
    <IsWebBootstrapper>true</IsWebBootstrapper>
    <PublisherName>My Company</PublisherName>
    <ProductName>My Application</ProductName>
    <MapFileExtensions>true</MapFileExtensions>
    <Install>true</Install>
    <InstallFrom>Web</InstallFrom>
    <UpdateEnabled>true</UpdateEnabled>
    <UpdateMode>Foreground</UpdateMode>
    <UpdateInterval>7</UpdateInterval>
    <UpdateIntervalUnits>Days</UpdateIntervalUnits>
    <UpdatePeriodically>true</UpdatePeriodically>
    <UpdateRequired>false</UpdateRequired>
  </PropertyGroup>

  <!-- Prerequisites -->
  <ItemGroup>
    <BootstrapperPackage Include=".NETFramework,Version=v4.8">
      <Visible>False</Visible>
      <ProductName>.NET Framework 4.8</ProductName>
      <Install>true</Install>
    </BootstrapperPackage>
  </ItemGroup>

</Project>
```

## Publish Profile (pubxml)

```xml
<!-- Properties/PublishProfiles/ClickOnce.pubxml -->
<?xml version="1.0" encoding="utf-8"?>
<Project>
  <PropertyGroup>
    <PublishProtocol>ClickOnce</PublishProtocol>
    <PublishDir>bin\publish\</PublishDir>
    <PublishUrl>https://myserver.com/myapp/</PublishUrl>
    <InstallUrl>https://myserver.com/myapp/</InstallUrl>
    <UpdateUrl>https://myserver.com/myapp/</UpdateUrl>
    <ApplicationVersion>1.0.0.*</ApplicationVersion>
    <Configuration>Release</Configuration>
    <Platform>Any CPU</Platform>
    <TargetFramework>net8.0-windows</TargetFramework>
    <SelfContained>false</SelfContained>
    <RuntimeIdentifier>win-x64</RuntimeIdentifier>
    <PublishSingleFile>false</PublishSingleFile>
    <PublishReadyToRun>false</PublishReadyToRun>

    <!-- Install settings -->
    <Install>true</Install>
    <InstallFrom>Web</InstallFrom>
    <CreateDesktopShortcut>true</CreateDesktopShortcut>
    <CreateWebPageOnPublish>true</CreateWebPageOnPublish>
    <WebPageFileName>publish.htm</WebPageFileName>

    <!-- Update settings -->
    <UpdateEnabled>true</UpdateEnabled>
    <UpdateMode>Foreground</UpdateMode>
    <UpdateInterval>7</UpdateInterval>
    <UpdateIntervalUnits>Days</UpdateIntervalUnits>
    <UpdatePeriodically>true</UpdatePeriodically>
    <UpdateRequired>false</UpdateRequired>

    <!-- Security -->
    <SignManifests>true</SignManifests>
    <ManifestCertificateThumbprint>1234567890ABCDEF</ManifestCertificateThumbprint>
    <ManifestTimestampRFC3161Url>http://timestamp.digicert.com</ManifestTimestampRFC3161Url>

    <!-- File associations -->
    <TargetCulture>en-US</TargetCulture>
    <ProductName>My Application</ProductName>
    <PublisherName>My Company</PublisherName>
    <OpenBrowserOnPublish>false</OpenBrowserOnPublish>
  </PropertyGroup>
</Project>
```

## Programmatic Update Checking

```csharp
using System.Deployment.Application;

public class UpdateManager
{
    public async Task<bool> CheckForUpdatesAsync()
    {
        if (!ApplicationDeployment.IsNetworkDeployed)
        {
            return false;
        }

        var deployment = ApplicationDeployment.CurrentDeployment;

        try
        {
            var info = deployment.CheckForDetailedUpdate();

            if (info.UpdateAvailable)
            {
                if (info.IsUpdateRequired)
                {
                    // Force update
                    deployment.Update();
                    Application.Restart();
                    return true;
                }
                else
                {
                    // Optional update - prompt user
                    var result = MessageBox.Show(
                        $"Version {info.AvailableVersion} is available. Update now?",
                        "Update Available",
                        MessageBoxButton.YesNo);

                    if (result == MessageBoxResult.Yes)
                    {
                        deployment.Update();
                        Application.Restart();
                        return true;
                    }
                }
            }
        }
        catch (DeploymentDownloadException ex)
        {
            MessageBox.Show($"Update failed: {ex.Message}");
        }

        return false;
    }

    public Version GetCurrentVersion()
    {
        if (ApplicationDeployment.IsNetworkDeployed)
        {
            return ApplicationDeployment.CurrentDeployment.CurrentVersion;
        }
        return Assembly.GetExecutingAssembly().GetName().Version;
    }
}
```

## Publishing Commands

```bash
# Publish via dotnet CLI
dotnet publish -p:PublishProfile=ClickOnce

# Publish via MSBuild
msbuild /t:Publish /p:PublishProfile=ClickOnce

# Publish with version increment
dotnet publish -p:PublishProfile=ClickOnce -p:ApplicationRevision=$(($(date +%s)))
```

## Signing Configuration

```xml
<!-- Sign manifests with certificate -->
<PropertyGroup>
  <SignManifests>true</SignManifests>
  <ManifestCertificateThumbprint>YOUR_CERT_THUMBPRINT</ManifestCertificateThumbprint>
  <ManifestTimestampRFC3161Url>http://timestamp.digicert.com</ManifestTimestampRFC3161Url>
</PropertyGroup>
```

```powershell
# Find certificate thumbprint
Get-ChildItem -Path Cert:\CurrentUser\My | Format-Table Thumbprint, Subject

# Sign manually
mage -sign MyApp.application -CertFile cert.pfx -Password mypassword
```

## Server Setup (IIS)

```xml
<!-- web.config for ClickOnce hosting -->
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <staticContent>
      <mimeMap fileExtension=".application" mimeType="application/x-ms-application"/>
      <mimeMap fileExtension=".manifest" mimeType="application/x-ms-manifest"/>
      <mimeMap fileExtension=".deploy" mimeType="application/octet-stream"/>
    </staticContent>
  </system.webServer>
</configuration>
```

## Best Practices

1. **Always sign manifests**: Required for production
2. **Use semantic versioning**: Clear version updates
3. **Set minimum version**: Force updates for critical fixes
4. **Test update flow**: Verify before releasing
5. **Use HTTPS**: Secure download channel
6. **Monitor publish folder**: Verify deployment success

## Related Skills

- `windows-authenticode-signer` - Code signing
- `auto-update-system` process - Update workflow
- `desktop-build-pipeline` process - CI/CD

## Related Agents

- `wpf-dotnet-expert` - .NET expertise
- `release-manager` - Release coordination
