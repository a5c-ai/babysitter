# Desktop Development Skills and Agents Backlog

This document identifies specialized skills and agents that could enhance the Desktop Development processes beyond general-purpose capabilities. Each item represents a potential enhancement that brings domain-specific expertise.

## Phase 4: Skills and Agents Identification

---

## Skills Backlog

Skills are reusable, focused capabilities that can be invoked by agents or processes. They encapsulate specific technical expertise.

### Framework-Specific Skills

#### Electron Skills

| ID | Skill Name | Description | Used By Processes | Priority |
|----|------------|-------------|-------------------|----------|
| SK-E01 | `electron-ipc-security-audit` | Analyze Electron IPC implementations for security vulnerabilities (contextIsolation, nodeIntegration, preload scripts) | security-hardening, inter-app-communication | High |
| SK-E02 | `electron-builder-config` | Generate and validate electron-builder configuration for multi-platform builds | desktop-build-pipeline, linux-packaging, windows-features, macos-features | High |
| SK-E03 | `electron-main-preload-generator` | Generate secure main process and preload script boilerplate with proper context isolation | cross-platform-app-init, security-hardening | High |
| SK-E04 | `electron-auto-updater-setup` | Configure electron-updater with code signing verification, delta updates, and staged rollouts | auto-update-system | High |
| SK-E05 | `electron-memory-profiler` | Profile Electron app memory usage, detect leaks, analyze renderer process memory | performance-optimization | Medium |
| SK-E06 | `electron-tray-menu-builder` | Generate system tray and context menu configurations with platform-specific icons | system-tray-integration | Medium |
| SK-E07 | `electron-native-addon-builder` | Build and bundle native Node.js addons for Electron with proper ABI compatibility | cross-platform-app-init, windows-features, macos-features | Medium |
| SK-E08 | `electron-protocol-handler-setup` | Register and handle custom URL protocols (deep linking) across platforms | inter-app-communication | Medium |

#### Qt/C++ Skills

| ID | Skill Name | Description | Used By Processes | Priority |
|----|------------|-------------|-------------------|----------|
| SK-Q01 | `qt-cmake-project-generator` | Generate CMake-based Qt project with proper module dependencies and cross-compilation support | cross-platform-app-init, desktop-build-pipeline | High |
| SK-Q02 | `qt-qml-component-generator` | Generate QML components with proper property bindings and signal/slot connections | desktop-ui-implementation | High |
| SK-Q03 | `qt-widget-accessibility-audit` | Audit Qt Widget applications for accessibility compliance (QAccessible interface) | desktop-accessibility | Medium |
| SK-Q04 | `qt-translation-workflow` | Set up Qt Linguist workflow with .ts files and lrelease integration | desktop-i18n | Medium |
| SK-Q05 | `qt-installer-framework-config` | Configure Qt Installer Framework for cross-platform installers | desktop-build-pipeline, auto-update-system | Medium |
| SK-Q06 | `qt-test-fixture-generator` | Generate Qt Test fixtures with mock QObject signals and slots | desktop-unit-testing | Low |

#### WPF/.NET Skills

| ID | Skill Name | Description | Used By Processes | Priority |
|----|------------|-------------|-------------------|----------|
| SK-W01 | `wpf-mvvm-scaffold` | Generate WPF MVVM architecture with ViewModelBase, RelayCommand, and INotifyPropertyChanged | mvvm-implementation, cross-platform-app-init | High |
| SK-W02 | `wpf-xaml-style-generator` | Generate XAML styles, templates, and resource dictionaries with theme support | desktop-ui-implementation | High |
| SK-W03 | `msix-package-generator` | Generate MSIX packaging configuration with manifest, assets, and signing | windows-features, desktop-build-pipeline | High |
| SK-W04 | `wpf-high-dpi-analyzer` | Analyze and fix WPF applications for high DPI support | windows-features, performance-optimization | Medium |
| SK-W05 | `winui3-migration-helper` | Assist migration from WPF to WinUI 3 / Windows App SDK | desktop-migration | Medium |
| SK-W06 | `dotnet-clickonce-config` | Configure ClickOnce deployment with auto-update | auto-update-system | Low |

#### SwiftUI/AppKit Skills

| ID | Skill Name | Description | Used By Processes | Priority |
|----|------------|-------------|-------------------|----------|
| SK-S01 | `swiftui-view-generator` | Generate SwiftUI views with proper state management (@State, @Binding, @ObservedObject) | desktop-ui-implementation, cross-platform-app-init | High |
| SK-S02 | `macos-entitlements-generator` | Generate entitlements.plist with appropriate sandbox capabilities | macos-features, security-hardening, code-signing-setup | High |
| SK-S03 | `macos-notarization-workflow` | Automate Apple notarization with xcrun notarytool | code-signing-setup, macos-features | High |
| SK-S04 | `appkit-menu-bar-builder` | Generate NSMenu and NSStatusItem configurations for menu bar apps | system-tray-integration, macos-features | Medium |
| SK-S05 | `swift-package-manager-config` | Configure Swift Package Manager with platform-specific dependencies | cross-platform-app-init | Medium |
| SK-S06 | `macos-sparkle-config` | Configure Sparkle framework for macOS auto-updates | auto-update-system | Medium |
| SK-S07 | `xctest-ui-test-generator` | Generate XCTest UI tests for macOS applications | desktop-ui-testing | Low |

#### Cross-Platform Framework Skills

| ID | Skill Name | Description | Used By Processes | Priority |
|----|------------|-------------|-------------------|----------|
| SK-X01 | `tauri-project-setup` | Initialize Tauri project with Rust backend and frontend framework integration | cross-platform-app-init | High |
| SK-X02 | `flutter-desktop-config` | Configure Flutter for desktop platforms with platform channels | cross-platform-app-init, desktop-ui-implementation | High |
| SK-X03 | `maui-project-generator` | Generate .NET MAUI project with platform-specific handlers | cross-platform-app-init | Medium |
| SK-X04 | `avalonia-ui-setup` | Set up Avalonia UI project with cross-platform XAML | cross-platform-app-init, desktop-ui-implementation | Medium |
| SK-X05 | `neutralino-js-config` | Configure Neutralino.js lightweight desktop app | cross-platform-app-init | Low |

### Code Signing and Security Skills

| ID | Skill Name | Description | Used By Processes | Priority |
|----|------------|-------------|-------------------|----------|
| SK-CS01 | `windows-authenticode-signer` | Sign Windows executables with Authenticode (signtool) | code-signing-setup, windows-features | High |
| SK-CS02 | `macos-codesign-workflow` | Execute macOS code signing with Developer ID and hardened runtime | code-signing-setup, macos-features | High |
| SK-CS03 | `linux-gpg-signing` | Sign Linux packages with GPG keys | code-signing-setup, linux-packaging | High |
| SK-CS04 | `ev-certificate-validator` | Validate EV code signing certificate chain and timestamp | code-signing-setup, security-hardening | Medium |
| SK-CS05 | `keychain-credential-manager` | Manage credentials in OS keychain (Windows Credential Manager, macOS Keychain, libsecret) | security-hardening, system-services-integration | Medium |
| SK-CS06 | `sandbox-entitlements-auditor` | Audit and recommend minimal sandbox entitlements | security-hardening, macos-features | Medium |

### Native Integration Skills

| ID | Skill Name | Description | Used By Processes | Priority |
|----|------------|-------------|-------------------|----------|
| SK-N01 | `native-notification-builder` | Build native OS notifications with actions, images, and progress | native-notifications | High |
| SK-N02 | `file-dialog-abstraction` | Cross-platform file dialog implementation (open, save, directory) | file-system-integration | High |
| SK-N03 | `file-watcher-setup` | Set up cross-platform file system watching with debouncing | file-system-integration | Medium |
| SK-N04 | `global-shortcut-manager` | Register and manage global keyboard shortcuts across platforms | system-services-integration | Medium |
| SK-N05 | `clipboard-handler` | Cross-platform clipboard operations (text, images, files, rich content) | system-services-integration | Medium |
| SK-N06 | `power-management-monitor` | Monitor system power state (battery, AC, sleep, wake) | system-services-integration | Low |
| SK-N07 | `screen-capture-api` | Cross-platform screen and window capture | system-services-integration | Low |

### Build and Distribution Skills

| ID | Skill Name | Description | Used By Processes | Priority |
|----|------------|-------------|-------------------|----------|
| SK-B01 | `deb-package-builder` | Build Debian packages with proper control files and dependencies | linux-packaging | High |
| SK-B02 | `rpm-spec-generator` | Generate RPM spec files for Fedora/RHEL | linux-packaging | High |
| SK-B03 | `appimage-builder` | Build AppImage bundles with AppDir structure | linux-packaging | High |
| SK-B04 | `flatpak-manifest-generator` | Generate Flatpak manifest with proper permissions | linux-packaging | Medium |
| SK-B05 | `snap-yaml-generator` | Generate snapcraft.yaml with confinement settings | linux-packaging | Medium |
| SK-B06 | `dmg-creator` | Create macOS DMG installers with custom backgrounds | macos-features, desktop-build-pipeline | Medium |
| SK-B07 | `nsis-installer-generator` | Generate NSIS installer scripts for Windows | windows-features, desktop-build-pipeline | Medium |
| SK-B08 | `wix-toolset-config` | Configure WiX Toolset for Windows MSI installers | windows-features | Low |

### Testing Skills

| ID | Skill Name | Description | Used By Processes | Priority |
|----|------------|-------------|-------------------|----------|
| SK-T01 | `playwright-electron-config` | Configure Playwright for Electron application testing | desktop-ui-testing, cross-platform-testing | High |
| SK-T02 | `spectron-test-setup` | Set up Spectron (deprecated but legacy) tests | desktop-ui-testing | Low |
| SK-T03 | `electron-mock-factory` | Generate mocks for Electron APIs (ipcMain, ipcRenderer, dialog, etc.) | desktop-unit-testing | High |
| SK-T04 | `visual-regression-setup` | Configure visual regression testing (Percy, Chromatic, or custom) | desktop-ui-testing | Medium |
| SK-T05 | `accessibility-test-runner` | Run accessibility audits (axe-core, NVDA testing) | desktop-accessibility | Medium |
| SK-T06 | `cross-platform-test-matrix` | Generate CI test matrix for Windows/macOS/Linux combinations | cross-platform-testing | High |

### Performance and Analytics Skills

| ID | Skill Name | Description | Used By Processes | Priority |
|----|------------|-------------|-------------------|----------|
| SK-P01 | `startup-time-profiler` | Profile and optimize application startup time | performance-optimization | High |
| SK-P02 | `memory-leak-detector` | Detect memory leaks in desktop applications | performance-optimization | High |
| SK-P03 | `bundle-size-analyzer` | Analyze and optimize application bundle size | performance-optimization, desktop-build-pipeline | Medium |
| SK-P04 | `sentry-desktop-setup` | Configure Sentry for desktop crash reporting | desktop-analytics | High |
| SK-P05 | `amplitude-desktop-integration` | Integrate Amplitude analytics with privacy controls | desktop-analytics | Medium |
| SK-P06 | `gdpr-consent-manager` | Implement GDPR-compliant consent management | desktop-analytics | Medium |

---

## Agents Backlog

Agents are autonomous entities with specific domain expertise that can reason about complex tasks and coordinate multiple skills.

### Framework Expert Agents

| ID | Agent Name | Description | Expertise Domain | Used By Processes | Priority |
|----|------------|-------------|------------------|-------------------|----------|
| AG-E01 | `electron-architect` | Expert in Electron application architecture, IPC patterns, security best practices, and performance optimization | Electron framework, Node.js, Chromium | cross-platform-app-init, security-hardening, performance-optimization | High |
| AG-E02 | `qt-cpp-specialist` | Expert in Qt/C++ development, signal/slot patterns, memory management, and cross-platform Qt deployment | Qt Framework, C++, CMake | cross-platform-app-init, desktop-ui-implementation, performance-optimization | High |
| AG-E03 | `wpf-dotnet-expert` | Expert in WPF/XAML, MVVM patterns, .NET ecosystem, and Windows desktop development | WPF, .NET, C#, XAML | mvvm-implementation, windows-features, desktop-ui-implementation | High |
| AG-E04 | `swiftui-macos-expert` | Expert in SwiftUI, AppKit, macOS development, and Apple platform integration | Swift, SwiftUI, AppKit, macOS | macos-features, desktop-ui-implementation, cross-platform-app-init | High |
| AG-E05 | `tauri-rust-specialist` | Expert in Tauri framework, Rust backend development, and secure desktop app architecture | Tauri, Rust, WebView | cross-platform-app-init, security-hardening | Medium |
| AG-E06 | `flutter-desktop-expert` | Expert in Flutter desktop development, platform channels, and widget architecture | Flutter, Dart | cross-platform-app-init, desktop-ui-implementation | Medium |
| AG-E07 | `maui-xamarin-specialist` | Expert in .NET MAUI, Xamarin legacy migration, and cross-platform .NET development | .NET MAUI, C#, XAML | cross-platform-app-init, desktop-migration | Medium |

### Platform Expert Agents

| ID | Agent Name | Description | Expertise Domain | Used By Processes | Priority |
|----|------------|-------------|------------------|-------------------|----------|
| AG-P01 | `windows-platform-expert` | Deep expertise in Windows APIs, Win32, WinRT, registry, UAC, and Windows Store submission | Windows SDK, Win32 API, MSIX | windows-features, code-signing-setup, system-services-integration | High |
| AG-P02 | `macos-platform-expert` | Deep expertise in macOS APIs, Cocoa, sandbox, notarization, and App Store submission | macOS SDK, Cocoa, Xcode | macos-features, code-signing-setup, system-services-integration | High |
| AG-P03 | `linux-packaging-expert` | Expert in Linux packaging formats, desktop integration, and distribution repository setup | DEB, RPM, Flatpak, Snap, AppImage | linux-packaging, desktop-build-pipeline | High |
| AG-P04 | `cross-platform-abstraction-architect` | Designs platform abstraction layers for consistent behavior across Windows/macOS/Linux | Platform abstraction, Feature flags | cross-platform-app-init, cross-platform-testing | Medium |

### Security and Compliance Agents

| ID | Agent Name | Description | Expertise Domain | Used By Processes | Priority |
|----|------------|-------------|------------------|-------------------|----------|
| AG-S01 | `desktop-security-auditor` | Audits desktop applications for security vulnerabilities, insecure configurations, and attack vectors | Desktop security, Sandboxing, Code signing | security-hardening, code-signing-setup | High |
| AG-S02 | `code-signing-specialist` | Expert in code signing workflows across all platforms, certificate management, and timestamping | Authenticode, Developer ID, GPG | code-signing-setup, auto-update-system | High |
| AG-S03 | `privacy-compliance-auditor` | Ensures desktop apps comply with GDPR, CCPA, and platform-specific privacy requirements | Privacy regulations, Data handling | desktop-analytics, security-hardening | Medium |
| AG-S04 | `update-security-analyst` | Validates auto-update mechanisms for signature verification, MITM protection, and rollback safety | Update security, PKI | auto-update-system, security-hardening | Medium |

### Testing and Quality Agents

| ID | Agent Name | Description | Expertise Domain | Used By Processes | Priority |
|----|------------|-------------|------------------|-------------------|----------|
| AG-T01 | `desktop-test-architect` | Designs comprehensive testing strategies for desktop applications across platforms | Testing strategy, Test automation | desktop-unit-testing, desktop-ui-testing, cross-platform-testing | High |
| AG-T02 | `ui-automation-specialist` | Expert in desktop UI automation, page object patterns, and visual testing | Playwright, WebDriver, UI testing | desktop-ui-testing | High |
| AG-T03 | `accessibility-compliance-auditor` | Audits desktop apps for WCAG compliance, screen reader compatibility, and keyboard navigation | WCAG, ARIA, Assistive technology | desktop-accessibility | Medium |
| AG-T04 | `performance-test-engineer` | Specializes in desktop performance testing, profiling, and benchmark creation | Performance testing, Profiling | performance-optimization, cross-platform-testing | Medium |

### DevOps and Build Agents

| ID | Agent Name | Description | Expertise Domain | Used By Processes | Priority |
|----|------------|-------------|------------------|-------------------|----------|
| AG-D01 | `desktop-ci-architect` | Designs CI/CD pipelines for multi-platform desktop builds with caching and parallelization | CI/CD, GitHub Actions, Azure DevOps | desktop-build-pipeline, cross-platform-testing | High |
| AG-D02 | `release-manager` | Coordinates release process including versioning, changelog, signing, and distribution | Release management, Semantic versioning | auto-update-system, desktop-build-pipeline | High |
| AG-D03 | `artifact-distribution-specialist` | Expert in desktop app distribution channels, update servers, and CDN configuration | Distribution, CDN, Update servers | auto-update-system, linux-packaging | Medium |

### UX and Localization Agents

| ID | Agent Name | Description | Expertise Domain | Used By Processes | Priority |
|----|------------|-------------|------------------|-------------------|----------|
| AG-U01 | `desktop-ux-analyst` | Analyzes desktop UX patterns, platform conventions, and user interaction flows | Desktop UX, Platform HIG | desktop-ui-implementation, desktop-accessibility | Medium |
| AG-U02 | `localization-coordinator` | Coordinates translation workflows, manages locale-specific content, and validates RTL layouts | i18n, L10n, RTL support | desktop-i18n | Medium |
| AG-U03 | `platform-convention-advisor` | Advises on platform-specific UI conventions (Windows Fluent, macOS HIG, GNOME/KDE) | Platform design guidelines | desktop-ui-implementation, macos-features, windows-features | Medium |

### Migration and Architecture Agents

| ID | Agent Name | Description | Expertise Domain | Used By Processes | Priority |
|----|------------|-------------|------------------|-------------------|----------|
| AG-M01 | `desktop-migration-strategist` | Plans and executes migrations between desktop frameworks (WPF to Electron, Qt to Flutter, etc.) | Framework migration, Strangler pattern | desktop-migration | High |
| AG-M02 | `legacy-modernization-expert` | Specializes in modernizing legacy desktop apps (MFC, WinForms) to modern frameworks | Legacy code, Modernization | desktop-migration | Medium |
| AG-M03 | `architecture-pattern-advisor` | Advises on desktop architecture patterns (MVVM, MVC, Clean Architecture, Flux) | Architecture patterns | mvvm-implementation, cross-platform-app-init | Medium |

---

## Shared Candidates for Cross-Specialization Reuse

The following skills and agents have potential for reuse across multiple specializations:

### Skills with Cross-Specialization Value

| Skill ID | Skill Name | Potential Sharing With | Rationale |
|----------|------------|------------------------|-----------|
| SK-CS05 | `keychain-credential-manager` | Security-Compliance, Mobile-Development | Credential management is universal |
| SK-N02 | `file-dialog-abstraction` | Web-Development (Electron web apps) | File operations common in many contexts |
| SK-P04 | `sentry-desktop-setup` | Mobile-Development, Web-Development | Crash reporting is cross-platform |
| SK-P06 | `gdpr-consent-manager` | Mobile-Development, Web-Development | Privacy compliance is universal |
| SK-T04 | `visual-regression-setup` | Web-Development, Mobile-Development | Visual testing applies broadly |
| SK-T05 | `accessibility-test-runner` | Web-Development, Mobile-Development | Accessibility testing is universal |
| SK-T06 | `cross-platform-test-matrix` | Mobile-Development, DevOps-SRE-Platform | CI matrix patterns are reusable |

### Agents with Cross-Specialization Value

| Agent ID | Agent Name | Potential Sharing With | Rationale |
|----------|------------|------------------------|-----------|
| AG-S03 | `privacy-compliance-auditor` | Mobile-Development, Web-Development, Security-Compliance | Privacy expertise applies everywhere |
| AG-T03 | `accessibility-compliance-auditor` | Web-Development, Mobile-Development, UX-UI-Design | Accessibility is cross-platform concern |
| AG-D01 | `desktop-ci-architect` | DevOps-SRE-Platform | CI/CD patterns are adaptable |
| AG-U02 | `localization-coordinator` | Mobile-Development, Web-Development | i18n workflow is universal |
| AG-M03 | `architecture-pattern-advisor` | Software-Architecture | Architecture patterns apply broadly |

---

## Summary Statistics

### Skills Summary

| Category | Count | High Priority | Medium Priority | Low Priority |
|----------|-------|---------------|-----------------|--------------|
| Electron Skills | 8 | 4 | 4 | 0 |
| Qt/C++ Skills | 6 | 2 | 3 | 1 |
| WPF/.NET Skills | 6 | 3 | 2 | 1 |
| SwiftUI/AppKit Skills | 7 | 3 | 3 | 1 |
| Cross-Platform Framework Skills | 5 | 2 | 2 | 1 |
| Code Signing and Security Skills | 6 | 3 | 3 | 0 |
| Native Integration Skills | 7 | 2 | 3 | 2 |
| Build and Distribution Skills | 8 | 3 | 4 | 1 |
| Testing Skills | 6 | 3 | 2 | 1 |
| Performance and Analytics Skills | 6 | 3 | 3 | 0 |
| **Total Skills** | **65** | **28** | **29** | **8** |

### Agents Summary

| Category | Count | High Priority | Medium Priority |
|----------|-------|---------------|-----------------|
| Framework Expert Agents | 7 | 4 | 3 |
| Platform Expert Agents | 4 | 3 | 1 |
| Security and Compliance Agents | 4 | 2 | 2 |
| Testing and Quality Agents | 4 | 2 | 2 |
| DevOps and Build Agents | 3 | 2 | 1 |
| UX and Localization Agents | 3 | 0 | 3 |
| Migration and Architecture Agents | 3 | 1 | 2 |
| **Total Agents** | **28** | **14** | **14** |

### Shared Candidates Summary

| Type | Count |
|------|-------|
| Skills with Cross-Specialization Value | 7 |
| Agents with Cross-Specialization Value | 5 |
| **Total Shared Candidates** | **12** |

---

## Process Coverage Matrix

| Process | Skills Coverage | Agents Coverage |
|---------|-----------------|-----------------|
| cross-platform-app-init | SK-E03, SK-Q01, SK-W01, SK-S01, SK-X01-X05 | AG-E01-E07, AG-P04, AG-M03 |
| desktop-build-pipeline | SK-E02, SK-Q05, SK-B03, SK-B06, SK-B07, SK-P03 | AG-D01, AG-D02, AG-P03 |
| code-signing-setup | SK-CS01-CS04, SK-S02, SK-S03 | AG-S01, AG-S02, AG-P01, AG-P02 |
| desktop-ui-implementation | SK-E06, SK-Q02, SK-W02, SK-S01 | AG-E01-E06, AG-U01, AG-U03 |
| file-system-integration | SK-N02, SK-N03 | AG-P01, AG-P02, AG-P04 |
| system-tray-integration | SK-E06, SK-S04 | AG-E01, AG-P01, AG-P02 |
| performance-optimization | SK-E05, SK-W04, SK-P01-P03 | AG-E01, AG-T04 |
| native-notifications | SK-N01 | AG-P01, AG-P02 |
| inter-app-communication | SK-E01, SK-E08 | AG-E01, AG-S01 |
| system-services-integration | SK-CS05, SK-N04-N07 | AG-P01, AG-P02 |
| security-hardening | SK-E01, SK-E03, SK-CS05-CS06, SK-S02 | AG-S01, AG-S04 |
| auto-update-system | SK-E04, SK-Q05, SK-S06, SK-W06 | AG-S02, AG-S04, AG-D02, AG-D03 |
| windows-features | SK-E02, SK-W03-W04, SK-B07, SK-B08 | AG-P01, AG-E03, AG-U03 |
| macos-features | SK-E02, SK-E07, SK-S02-S04, SK-B06 | AG-P02, AG-E04, AG-U03 |
| linux-packaging | SK-B01-B05, SK-CS03 | AG-P03, AG-D03 |
| desktop-unit-testing | SK-Q06, SK-T03 | AG-T01 |
| desktop-ui-testing | SK-T01, SK-T02, SK-T04, SK-S07 | AG-T01, AG-T02 |
| cross-platform-testing | SK-T01, SK-T06 | AG-T01, AG-T04, AG-P04 |
| desktop-i18n | SK-Q04 | AG-U02 |
| desktop-accessibility | SK-Q03, SK-T05 | AG-T03, AG-U01 |
| desktop-analytics | SK-P04-P06 | AG-S03 |
| mvvm-implementation | SK-W01 | AG-E03, AG-M03 |
| desktop-migration | SK-W05 | AG-M01, AG-M02 |

---

## Implementation Priorities

### Immediate Priority (Phase 4A)

1. **Framework Expert Agents** (AG-E01 through AG-E04) - Core expertise for each major framework
2. **Platform Expert Agents** (AG-P01 through AG-P03) - Essential for platform-specific processes
3. **Code Signing Skills** (SK-CS01 through SK-CS03) - Critical for distribution
4. **Build Distribution Skills** (SK-B01 through SK-B03) - Essential for Linux packaging

### Near-Term Priority (Phase 4B)

1. **Security Agents** (AG-S01, AG-S02) - Security is fundamental
2. **Testing Skills** (SK-T01, SK-T03, SK-T06) - Testing infrastructure
3. **Electron Core Skills** (SK-E01 through SK-E04) - Most common framework

### Future Priority (Phase 4C)

1. **UX and Localization Agents** - Polish and internationalization
2. **Migration Agents** - Support legacy modernization
3. **Remaining framework-specific skills** - Complete coverage

---

**Created**: 2026-01-24
**Specialization**: Desktop Development
**Specialization Slug**: `desktop-development`
**Skills Identified**: 65
**Agents Identified**: 28
**Shared Candidates**: 12
**Status**: Phase 4 Complete - Ready for Phase 5 (Implementation)
