---
name: qt-installer-framework-config
description: Configure Qt Installer Framework for cross-platform installers with component management, online updates, and custom UI
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
tags: [qt, installer, deployment, distribution, packaging]
---

# qt-installer-framework-config

Configure Qt Installer Framework (IFW) for cross-platform installers. This skill generates installer configurations with component management, online updates, maintenance tool, and custom branding.

## Capabilities

- Generate installer configuration files
- Set up component structure with dependencies
- Configure online repository for updates
- Customize installer UI and branding
- Set up maintenance tool configuration
- Configure uninstaller behavior
- Generate component scripts
- Set up platform-specific settings

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "projectPath": {
      "type": "string",
      "description": "Path to the project"
    },
    "installerName": {
      "type": "string",
      "description": "Name of the installer"
    },
    "appInfo": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "version": { "type": "string" },
        "publisher": { "type": "string" },
        "url": { "type": "string" }
      },
      "required": ["name", "version", "publisher"]
    },
    "components": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "displayName": { "type": "string" },
          "description": { "type": "string" },
          "version": { "type": "string" },
          "required": { "type": "boolean" },
          "dependencies": { "type": "array" }
        }
      }
    },
    "onlineRepository": {
      "type": "object",
      "properties": {
        "enabled": { "type": "boolean" },
        "url": { "type": "string" }
      }
    },
    "targetPlatforms": {
      "type": "array",
      "items": { "enum": ["windows", "macos", "linux"] }
    }
  },
  "required": ["projectPath", "installerName", "appInfo"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "structure": {
      "type": "object",
      "properties": {
        "configDir": { "type": "string" },
        "packagesDir": { "type": "string" }
      }
    },
    "buildCommands": {
      "type": "object",
      "properties": {
        "offline": { "type": "string" },
        "online": { "type": "string" },
        "repository": { "type": "string" }
      }
    }
  },
  "required": ["success"]
}
```

## Directory Structure

```
installer/
├── config/
│   ├── config.xml
│   ├── controller.qs
│   └── style.qss
├── packages/
│   ├── com.company.app/
│   │   ├── meta/
│   │   │   ├── package.xml
│   │   │   ├── installscript.qs
│   │   │   └── license.txt
│   │   └── data/
│   │       └── [application files]
│   └── com.company.app.plugins/
│       ├── meta/
│       │   └── package.xml
│       └── data/
│           └── [plugin files]
└── build/
    └── [generated installer]
```

## Configuration Files

### config.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Installer>
    <Name>My Application</Name>
    <Version>1.0.0</Version>
    <Title>My Application Installer</Title>
    <Publisher>My Company</Publisher>
    <StartMenuDir>My Application</StartMenuDir>
    <TargetDir>@HomeDir@/MyApplication</TargetDir>

    <!-- UI Customization -->
    <WizardStyle>Modern</WizardStyle>
    <StyleSheet>style.qss</StyleSheet>
    <TitleColor>#2196F3</TitleColor>
    <Logo>logo.png</Logo>
    <Watermark>watermark.png</Watermark>
    <Banner>banner.png</Banner>

    <!-- Behavior -->
    <AllowNonAsciiCharacters>true</AllowNonAsciiCharacters>
    <AllowSpaceInPath>true</AllowSpaceInPath>
    <MaintenanceToolName>MaintenanceTool</MaintenanceToolName>

    <!-- Online Updates -->
    <RemoteRepositories>
        <Repository>
            <Url>https://updates.mycompany.com/repo</Url>
            <Enabled>1</Enabled>
        </Repository>
    </RemoteRepositories>

    <!-- Controller Script -->
    <ControlScript>controller.qs</ControlScript>
</Installer>
```

### package.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Package>
    <DisplayName>My Application</DisplayName>
    <Description>Main application component</Description>
    <Version>1.0.0</Version>
    <ReleaseDate>2024-01-15</ReleaseDate>
    <Name>com.company.app</Name>
    <Dependencies>com.company.app.runtime</Dependencies>
    <Default>true</Default>
    <Essential>true</Essential>
    <ForcedInstallation>true</ForcedInstallation>

    <!-- Platform-specific -->
    <Licenses>
        <License name="EULA" file="license.txt"/>
    </Licenses>

    <Script>installscript.qs</Script>
</Package>
```

### installscript.qs

```javascript
function Component() {
    // Constructor
}

Component.prototype.createOperations = function() {
    component.createOperations();

    if (systemInfo.productType === "windows") {
        // Create Start Menu shortcut
        component.addOperation("CreateShortcut",
            "@TargetDir@/MyApp.exe",
            "@StartMenuDir@/My Application.lnk",
            "workingDirectory=@TargetDir@",
            "iconPath=@TargetDir@/MyApp.exe",
            "iconId=0",
            "description=Launch My Application");

        // Create Desktop shortcut
        component.addOperation("CreateShortcut",
            "@TargetDir@/MyApp.exe",
            "@DesktopDir@/My Application.lnk");

        // Register file association
        component.addOperation("RegisterFileType",
            "myapp",
            "@TargetDir@/MyApp.exe '%1'",
            "My Application File",
            "text/x-myapp",
            "@TargetDir@/MyApp.exe,0",
            "ProgId=MyCompany.MyApp");
    }

    if (systemInfo.productType === "osx") {
        // macOS specific operations
        component.addOperation("Execute",
            "/bin/ln", "-s",
            "@TargetDir@/MyApp.app",
            "/Applications/MyApp.app");
    }

    if (systemInfo.productType === "linux") {
        // Create .desktop file
        component.addOperation("CreateDesktopEntry",
            "@TargetDir@/myapp.desktop",
            "Type=Application\n" +
            "Name=My Application\n" +
            "Exec=@TargetDir@/MyApp\n" +
            "Icon=@TargetDir@/myapp.png\n" +
            "Categories=Utility;");
    }
}
```

### controller.qs

```javascript
function Controller() {
    installer.autoRejectMessageBoxes();
    installer.installationFinished.connect(this, Controller.prototype.installationFinishedPageCallback);
}

Controller.prototype.IntroductionPageCallback = function() {
    // Skip intro page in unattended mode
    if (installer.isUnattended()) {
        gui.clickButton(buttons.NextButton);
    }
}

Controller.prototype.TargetDirectoryPageCallback = function() {
    // Set custom target directory
    var widget = gui.currentPageWidget();
    widget.TargetDirectoryLineEdit.setText(installer.value("HomeDir") + "/MyApp");
}

Controller.prototype.ComponentSelectionPageCallback = function() {
    // Pre-select components
    var widget = gui.currentPageWidget();
    widget.selectAll();
}

Controller.prototype.LicenseAgreementPageCallback = function() {
    gui.currentPageWidget().AcceptLicenseRadioButton.setChecked(true);
}

Controller.prototype.installationFinishedPageCallback = function() {
    // Launch app after installation
    if (installer.isInstaller() && installer.status === QInstaller.Success) {
        var widget = gui.currentPageWidget();
        if (widget.RunItCheckBox) {
            widget.RunItCheckBox.setChecked(true);
        }
    }
}
```

## Build Commands

```bash
# Build offline installer
binarycreator -c config/config.xml -p packages MyAppInstaller

# Build online installer (small, downloads components)
binarycreator -c config/config.xml -p packages -n MyAppOnlineInstaller

# Create/update repository
repogen -p packages repository

# Update existing repository
repogen --update-new-components -p packages repository
```

## Online Update Repository

```bash
# Initial repository creation
repogen -p packages output/repository

# Upload to server
rsync -avz output/repository/ user@server:/var/www/updates/

# Update with new version
repogen --update-new-components -p packages output/repository
```

## Best Practices

1. **Version components independently**: Allow granular updates
2. **Use online repository**: Enable auto-updates
3. **Customize UI**: Match application branding
4. **Test on all platforms**: Verify installer behavior
5. **Sign installers**: Code sign for trust
6. **Include maintenance tool**: Allow updates/uninstall

## Related Skills

- `qt-cmake-project-generator` - Build system setup
- `auto-update-system` process - Update workflow
- `windows-authenticode-signer` - Windows signing
- `macos-notarization-workflow` - macOS notarization

## Related Agents

- `qt-cpp-specialist` - Qt expertise
- `release-manager` - Release workflow
