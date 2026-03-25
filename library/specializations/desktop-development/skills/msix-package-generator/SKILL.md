---
name: msix-package-generator
description: Generate MSIX packaging configuration with manifest, assets, and signing for Windows applications
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
tags: [windows, msix, packaging, uwp, distribution]
---

# msix-package-generator

Generate MSIX packaging configuration for Windows applications with proper manifest, assets, signing configuration, and Store submission preparation. This skill handles the complete MSIX packaging workflow.

## Capabilities

- Generate Package.appxmanifest
- Create required visual assets (icons, tiles)
- Configure app capabilities and declarations
- Set up code signing for MSIX
- Configure auto-update settings
- Prepare for Microsoft Store submission
- Generate CI/CD packaging scripts
- Configure sideload deployment

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectPath": {
      "type": "string",
      "description": "Path to the project"
    },
    "appInfo": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "displayName": { "type": "string" },
        "publisher": { "type": "string" },
        "publisherDisplayName": { "type": "string" },
        "version": { "type": "string" },
        "description": { "type": "string" }
      },
      "required": ["name", "displayName", "publisher", "version"]
    },
    "capabilities": {
      "type": "array",
      "items": {
        "enum": ["internetClient", "privateNetworkClientServer", "documentsLibrary", "musicLibrary", "picturesLibrary", "webcam", "microphone", "location", "removableStorage", "appointments", "contacts"]
      }
    },
    "executables": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "target": { "type": "string" },
          "id": { "type": "string" },
          "subsystem": { "enum": ["windows", "console"] }
        }
      }
    },
    "distribution": {
      "enum": ["store", "sideload", "both"],
      "default": "sideload"
    }
  },
  "required": ["projectPath", "appInfo"]
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
          "type": { "enum": ["manifest", "assets", "priconfig", "signing"] }
        }
      }
    },
    "buildCommands": {
      "type": "object",
      "properties": {
        "package": { "type": "string" },
        "sign": { "type": "string" }
      }
    }
  },
  "required": ["success"]
}
```

## Package.appxmanifest

```xml
<?xml version="1.0" encoding="utf-8"?>
<Package xmlns="http://schemas.microsoft.com/appx/manifest/foundation/windows10"
         xmlns:uap="http://schemas.microsoft.com/appx/manifest/uap/windows10"
         xmlns:uap3="http://schemas.microsoft.com/appx/manifest/uap/windows10/3"
         xmlns:desktop="http://schemas.microsoft.com/appx/manifest/desktop/windows10"
         xmlns:rescap="http://schemas.microsoft.com/appx/manifest/foundation/windows10/restrictedcapabilities"
         IgnorableNamespaces="uap uap3 desktop rescap">

  <Identity Name="MyCompany.MyApp"
            Publisher="CN=My Company, O=My Company, L=City, S=State, C=US"
            Version="1.0.0.0"
            ProcessorArchitecture="x64"/>

  <Properties>
    <DisplayName>My Application</DisplayName>
    <PublisherDisplayName>My Company</PublisherDisplayName>
    <Logo>Assets\StoreLogo.png</Logo>
    <Description>A wonderful application</Description>
  </Properties>

  <Dependencies>
    <TargetDeviceFamily Name="Windows.Desktop"
                        MinVersion="10.0.17763.0"
                        MaxVersionTested="10.0.22621.0"/>
  </Dependencies>

  <Resources>
    <Resource Language="en-us"/>
  </Resources>

  <Applications>
    <Application Id="App"
                 Executable="MyApp.exe"
                 EntryPoint="Windows.FullTrustApplication">

      <uap:VisualElements
          DisplayName="My Application"
          Description="A wonderful application"
          BackgroundColor="transparent"
          Square150x150Logo="Assets\Square150x150Logo.png"
          Square44x44Logo="Assets\Square44x44Logo.png">

        <uap:DefaultTile
            Wide310x150Logo="Assets\Wide310x150Logo.png"
            Square310x310Logo="Assets\Square310x310Logo.png"
            Square71x71Logo="Assets\SmallTile.png"
            ShortName="MyApp">
          <uap:ShowNameOnTiles>
            <uap:ShowOn Tile="square150x150Logo"/>
            <uap:ShowOn Tile="wide310x150Logo"/>
            <uap:ShowOn Tile="square310x310Logo"/>
          </uap:ShowNameOnTiles>
        </uap:DefaultTile>

        <uap:SplashScreen Image="Assets\SplashScreen.png"/>

      </uap:VisualElements>

      <!-- File type associations -->
      <Extensions>
        <uap:Extension Category="windows.fileTypeAssociation">
          <uap:FileTypeAssociation Name="myapp">
            <uap:SupportedFileTypes>
              <uap:FileType>.myapp</uap:FileType>
            </uap:SupportedFileTypes>
          </uap:FileTypeAssociation>
        </uap:Extension>

        <!-- Protocol handler -->
        <uap:Extension Category="windows.protocol">
          <uap:Protocol Name="myapp">
            <uap:DisplayName>My App Protocol</uap:DisplayName>
          </uap:Protocol>
        </uap:Extension>

        <!-- Startup task -->
        <desktop:Extension Category="windows.startupTask">
          <desktop:StartupTask
              TaskId="MyAppStartupTask"
              Enabled="false"
              DisplayName="My App Background Service"/>
        </desktop:Extension>
      </Extensions>

    </Application>
  </Applications>

  <Capabilities>
    <Capability Name="internetClient"/>
    <rescap:Capability Name="runFullTrust"/>
  </Capabilities>

</Package>
```

## Visual Assets

```
Assets/
├── AppIcon.ico              # Traditional icon
├── StoreLogo.png            # 50x50
├── Square44x44Logo.png      # 44x44 (with .targetsize-* variants)
├── Square44x44Logo.targetsize-16.png
├── Square44x44Logo.targetsize-24.png
├── Square44x44Logo.targetsize-32.png
├── Square44x44Logo.targetsize-48.png
├── Square44x44Logo.targetsize-256.png
├── Square150x150Logo.png    # 150x150
├── Square310x310Logo.png    # 310x310
├── Wide310x150Logo.png      # 310x150
├── SmallTile.png            # 71x71
├── SplashScreen.png         # 620x300
└── BadgeLogo.png            # 24x24
```

## priconfig.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources targetOsVersion="10.0.0" majorVersion="1">
  <packaging>
    <autoResourcePackage qualifier="Language"/>
    <autoResourcePackage qualifier="Scale"/>
  </packaging>
  <index root="\" startIndexAt="\">
    <default>
      <qualifier name="Language" value="en-US"/>
      <qualifier name="Scale" value="100"/>
    </default>
    <indexer-config type="folder" foldernameAsQualifier="true" filenameAsQualifier="true"/>
    <indexer-config type="resw" convertDotsToSlashes="true" initialPath=""/>
    <indexer-config type="resfiles" qualifierDelimiter="."/>
    <indexer-config type="PRI"/>
  </index>
</resources>
```

## Build Commands

```powershell
# Build MSIX package
msbuild MyApp.wapproj /p:Configuration=Release /p:Platform=x64 /p:AppxBundle=Always

# Create package with makeappx
makeappx pack /d output\ /p MyApp.msix

# Sign package
signtool sign /fd SHA256 /a /f certificate.pfx /p password MyApp.msix

# Create self-signed certificate for testing
$cert = New-SelfSignedCertificate -Type Custom -Subject "CN=MyCompany" `
    -KeyUsage DigitalSignature -FriendlyName "MyApp Test Cert" `
    -CertStoreLocation "Cert:\CurrentUser\My"
Export-PfxCertificate -cert $cert -FilePath test.pfx -Password (ConvertTo-SecureString -String "password" -Force -AsPlainText)
```

## .csproj Configuration

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <OutputType>WinExe</OutputType>
    <TargetFramework>net8.0-windows</TargetFramework>
    <UseWPF>true</UseWPF>

    <!-- MSIX Packaging -->
    <EnableMsixTooling>true</EnableMsixTooling>
    <RuntimeIdentifiers>win-x64;win-arm64</RuntimeIdentifiers>
    <PublishProfile>MSIX</PublishProfile>

    <!-- Package identity -->
    <ApplicationId>MyCompany.MyApp</ApplicationId>
    <ApplicationDisplayVersion>1.0.0</ApplicationDisplayVersion>
    <ApplicationVersion>1</ApplicationVersion>
  </PropertyGroup>

  <ItemGroup>
    <Content Include="Assets\**" CopyToOutputDirectory="PreserveNewest"/>
  </ItemGroup>

</Project>
```

## GitHub Actions CI

```yaml
name: Build MSIX

on: [push]

jobs:
  build:
    runs-on: windows-latest

    steps:
    - uses: actions/checkout@v4

    - name: Setup .NET
      uses: actions/setup-dotnet@v4
      with:
        dotnet-version: '8.0.x'

    - name: Decode certificate
      run: |
        $bytes = [Convert]::FromBase64String("${{ secrets.SIGNING_CERTIFICATE }}")
        [IO.File]::WriteAllBytes("cert.pfx", $bytes)

    - name: Build MSIX
      run: |
        dotnet publish -c Release -p:PublishProfile=MSIX
        signtool sign /fd SHA256 /f cert.pfx /p "${{ secrets.CERT_PASSWORD }}" MyApp.msix

    - name: Upload artifact
      uses: actions/upload-artifact@v4
      with:
        name: msix-package
        path: '**/*.msix'
```

## Best Practices

1. **Use proper publisher identity**: Match your certificate
2. **Include all required assets**: All sizes for all display scales
3. **Test on multiple Windows versions**: MinVersion matters
4. **Sign with trusted certificate**: For production distribution
5. **Configure capabilities minimally**: Request only what you need
6. **Test sideload deployment**: Before Store submission

## Related Skills

- `windows-authenticode-signer` - Code signing
- `wpf-mvvm-scaffold` - Application setup
- `desktop-build-pipeline` process - CI/CD

## Related Agents

- `windows-platform-expert` - Windows expertise
- `release-manager` - Release workflow
