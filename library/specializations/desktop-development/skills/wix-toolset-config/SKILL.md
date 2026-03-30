---
name: wix-toolset-config
description: Configure WiX Toolset for Windows MSI installers
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
tags: [windows, wix, msi, installer, packaging]
---

# wix-toolset-config

Configure WiX Toolset for creating Windows MSI installers with proper component structure and features.

## Capabilities

- Generate WiX source files (.wxs)
- Configure product and package info
- Set up components and features
- Configure registry entries
- Set up services
- Handle upgrades
- Configure custom actions

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectPath": { "type": "string" },
    "productName": { "type": "string" },
    "version": { "type": "string" },
    "manufacturer": { "type": "string" },
    "upgradeCode": { "type": "string" }
  },
  "required": ["projectPath", "productName", "version"]
}
```

## WiX Example

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Wix xmlns="http://schemas.microsoft.com/wix/2006/wi">
  <Product Id="*"
           Name="My Application"
           Version="1.0.0.0"
           Manufacturer="My Company"
           Language="1033"
           UpgradeCode="PUT-GUID-HERE">

    <Package InstallerVersion="200"
             Compressed="yes"
             InstallScope="perMachine"/>

    <MajorUpgrade DowngradeErrorMessage="A newer version is already installed."/>

    <MediaTemplate EmbedCab="yes"/>

    <Feature Id="ProductFeature" Title="My Application" Level="1">
      <ComponentGroupRef Id="ProductComponents"/>
    </Feature>
  </Product>

  <Fragment>
    <Directory Id="TARGETDIR" Name="SourceDir">
      <Directory Id="ProgramFilesFolder">
        <Directory Id="INSTALLFOLDER" Name="MyApplication"/>
      </Directory>
    </Directory>
  </Fragment>

  <Fragment>
    <ComponentGroup Id="ProductComponents" Directory="INSTALLFOLDER">
      <Component Id="MainExecutable">
        <File Source="$(var.SourceDir)\MyApp.exe"/>
      </Component>
    </ComponentGroup>
  </Fragment>
</Wix>
```

## Related Skills

- `nsis-installer-generator`
- `msix-package-generator`
