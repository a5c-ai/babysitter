# Desktop Development Skills and Agents - Community References

This document catalogs community-created Claude skills, agents, plugins, and MCP servers that align with the skills and agents identified in the Desktop Development backlog. These resources can be leveraged, adapted, or serve as references for implementing the identified capabilities.

## Phase 5: Community References and Resources

---

## MCP Servers

### Framework-Specific MCP Servers

#### Electron

| Reference | URL | Aligned Backlog Items | Description |
|-----------|-----|----------------------|-------------|
| electron-mcp-manager | [GitHub](https://github.com/DrBenedictPorkins/electron-mcp-manager) | SK-E01 to SK-E08, AG-E01 | Desktop app for managing MCP servers in Claude Code/Desktop with GUI for toggling servers |
| Electron Official CLAUDE.md | [GitHub](https://github.com/electron/electron/blob/main/CLAUDE.md) | AG-E01 | Official Electron repository's Claude configuration for development guidance |

#### Tauri

| Reference | URL | Aligned Backlog Items | Description |
|-----------|-----|----------------------|-------------|
| tauri-mcp (dirvine) | [GitHub](https://github.com/dirvine/tauri-mcp) | SK-X01, AG-E05 | MCP server for testing and interacting with Tauri v2 applications |
| tauri-plugin-mcp-gui | [GitHub](https://github.com/delorenj/tauri-mcp-server) | SK-X01, AG-E05 | Tauri plugin enabling AI agents to interact with desktop GUIs through screenshots and input simulation |
| tauri-plugin-mcp | [Docs.rs](https://docs.rs/crate/tauri-plugin-mcp/latest) | SK-X01, AG-E05 | Tauri plugin for interacting with MCP servers (Rust 1.77.2+) |
| Tauri Skill | [Claude Plugins](https://claude-plugins.dev/skills/@delorenj/skills/tauri) | SK-X01, AG-E05 | Claude skill for Tauri development |

#### macOS / Swift / Xcode

| Reference | URL | Aligned Backlog Items | Description |
|-----------|-----|----------------------|-------------|
| XcodeBuildMCP | [GitHub](https://github.com/cameroncooke/XcodeBuildMCP) | SK-S01 to SK-S07, AG-E04, AG-P02 | Comprehensive MCP server for Xcode project management, builds, simulators, and device deployment |
| xcode-mcp-server | [GitHub](https://github.com/r-huijts/xcode-mcp-server) | SK-S01 to SK-S07, AG-E04 | MCP server for Xcode integration with project management and simulator control |
| apple-docs-mcp | [GitHub](https://github.com/kimsungwhee/apple-docs-mcp) | AG-E04, AG-P02 | MCP server for Apple Developer Documentation, SwiftUI, UIKit, and WWDC videos |
| mcp-swift-sdk | [GitHub](https://github.com/gsabran/mcp-swift-sdk) | AG-E04 | Swift SDK for building MCP servers and clients |
| MCP Xcode | [Glama](https://glama.ai/mcp/servers/@Stefan-Nitu/mcp-xcode) | SK-S01 to SK-S07 | MCP server for managing Apple platform projects including SwiftUI previews and Swift Testing |

#### Windows / .NET / WPF / WinForms

| Reference | URL | Aligned Backlog Items | Description |
|-----------|-----|----------------------|-------------|
| Windows-MCP.Net | [GitHub](https://github.com/AIDotNet/Windows-MCP.Net) | SK-W01 to SK-W06, AG-E03, AG-P01 | .NET-based Windows desktop automation MCP with WPF, WinForms, and UWP support |
| winforms-mcp | [GitHub](https://github.com/rhom6us/winforms-mcp) | SK-W01, AG-E03, AG-P01 | MCP server for headless WinForms automation using FlaUI library |
| mcp-windows-desktop-automation | [GitHub](https://github.com/mario-andreschak/mcp-windows-desktop-automation) | AG-P01, SK-N04 | TypeScript MCP server wrapping AutoIt for Windows desktop automation |
| Windows-MCP (CursorTouch) | [GitHub](https://github.com/CursorTouch/Windows-MCP) | AG-P01, SK-N01 to SK-N07 | Featured as Desktop Extension in Claude Desktop for Windows UI interaction |
| MCP C# SDK (Official) | [GitHub](https://github.com/modelcontextprotocol/csharp-sdk) | SK-W01 to SK-W06, SK-X03 | Official C# SDK for building MCP servers, maintained with Microsoft |
| FlaUI | [GitHub](https://github.com/FlaUI/FlaUI) | SK-W01, AG-T02 | .NET UI automation library for Win32, WinForms, WPF, and Store Apps |

### Cross-Platform and Build MCP Servers

| Reference | URL | Aligned Backlog Items | Description |
|-----------|-----|----------------------|-------------|
| Filesystem MCP | [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) | SK-N02, SK-N03 | Secure file operations with configurable access controls |
| Git MCP | [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers) | AG-D01, AG-D02 | Tools to read, search, and manipulate Git repositories |
| Playwright MCP | [microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp) | SK-T01, SK-T04, AG-T02 | Official Microsoft Playwright MCP for browser automation |
| GitHub MCP Server | [github/github-mcp-server](https://github.com/github/github-mcp-server) | AG-D01, AG-D02, SK-T06 | GitHub's official MCP server for repository management and CI/CD |
| GitHub Actions MCP Server | [GitHub](https://github.com/ko1ynnky/github-actions-mcp-server) | AG-D01, SK-T06 | MCP server for managing GitHub Actions workflows |
| Azure DevOps MCP | [microsoft/azure-devops-mcp](https://github.com/microsoft/azure-devops-mcp) | AG-D01 | MCP server for Azure DevOps integration |
| CircleCI MCP | [CircleCI-Public/mcp-server-circleci](https://github.com/CircleCI-Public/mcp-server-circleci) | AG-D01, SK-T06 | MCP server for CircleCI build management |
| Buildkite MCP | [buildkite/buildkite-mcp-server](https://github.com/buildkite/buildkite-mcp-server) | AG-D01 | MCP server for Buildkite pipeline management |
| Terraform MCP | [hashicorp/terraform-mcp-server](https://github.com/hashicorp/terraform-mcp-server) | AG-D01 | Official Terraform MCP for Infrastructure as Code |
| Pulumi MCP | [pulumi/mcp-server](https://github.com/pulumi/mcp-server) | AG-D01 | Pulumi Automation API MCP server |

### Testing and Quality MCP Servers

| Reference | URL | Aligned Backlog Items | Description |
|-----------|-----|----------------------|-------------|
| Sentry MCP | [Sentry Docs](https://docs.sentry.io/product/sentry-mcp/) | SK-P04, AG-T04 | Official Sentry MCP for crash reporting and error monitoring integration |
| A11y MCP | [GitHub](https://github.com/ronantakizawa/a11ymcp) | SK-T05, SK-Q03, AG-T03 | Web accessibility testing MCP server using Axe-core for WCAG compliance |
| Currents MCP | [currents-dev/currents-mcp](https://github.com/currents-dev/currents-mcp) | SK-T01, AG-T02 | MCP for fixing Playwright test failures |
| BrowserStack MCP | [browserstack/mcp-server](https://github.com/browserstack/mcp-server) | SK-T06, AG-T01 | BrowserStack Test Platform integration |
| Semgrep MCP | [semgrep/mcp](https://github.com/semgrep/mcp) | AG-S01 | Security code scanning integration |
| SonarQube MCP | [SonarSource/sonarqube-mcp-server](https://github.com/SonarSource/sonarqube-mcp-server) | AG-S01, AG-T01 | Code quality analysis integration |

### macOS Native Integration

| Reference | URL | Aligned Backlog Items | Description |
|-----------|-----|----------------------|-------------|
| Apple Reminders MCP | [FradSer/mcp-server-apple-reminders](https://github.com/FradSer/mcp-server-apple-reminders) | SK-N01, AG-P02 | macOS Apple Reminders integration |
| Apple Shortcuts MCP | [recursechat/mcp-server-apple-shortcuts](https://github.com/recursechat/mcp-server-apple-shortcuts) | AG-P02 | macOS Apple Shortcuts automation framework |

---

## Claude Skills

### Framework-Specific Skills

#### Electron

| Reference | URL | Aligned Backlog Items | Description |
|-----------|-----|----------------------|-------------|
| electron-scaffold | [Claude Plugins](https://claude-plugins.dev/skills/@chrisvoncsefalvay/claude-skills/electron-scaffold) | SK-E03, SK-E01 | Production-ready Electron app scaffolding with security best practices (Electron v28+, Forge v7+, Builder v24+) |
| Electron Distribution & Auto-Update | [MCP Market](https://mcpmarket.com/tools/skills/electron-distribution-auto-update) | SK-E02, SK-E04, AG-D02 | Packaging, code signing, and automated update delivery for Electron apps |

#### Cross-Platform

| Reference | URL | Aligned Backlog Items | Description |
|-----------|-----|----------------------|-------------|
| cross-platform-builds | [Claude Plugins](https://claude-plugins.dev/skills/@yebot/rad-cc-plugins/cross-platform-builds) | SK-B01 to SK-B08, AG-D01 | Cross-platform build automation skill |
| iPlug2 CMake Build System | [MCP Market](https://mcpmarket.com/tools/skills/iplug2-cmake-build-system) | SK-Q01, AG-E02 | CMake-based cross-platform build system (applicable to Qt projects) |

### Testing Skills

| Reference | URL | Aligned Backlog Items | Description |
|-----------|-----|----------------------|-------------|
| Playwright Skill | [GitHub](https://github.com/lackeyjb/playwright-skill) | SK-T01, SK-T04, AG-T02 | Model-invoked browser automation with Playwright for testing and validation |
| playwright-e2e-skill | [Claude Plugins](https://claude-plugins.dev/skills/@amo-tech-ai/event-studio/playwright-e2e-skill) | SK-T01, AG-T02 | Testing web apps with Playwright end-to-end |
| Claude Code Test Runner | [GitHub](https://github.com/firstloophq/claude-code-test-runner) | SK-T01, SK-T06, AG-T01 | Automated E2E natural language test runner |

### Accessibility Skills

| Reference | URL | Aligned Backlog Items | Description |
|-----------|-----|----------------------|-------------|
| Accessibility Engineer | [Claude Plugins](https://claude-plugins.dev/skills/@daffy0208/ai-dev-standards/accessibility-engineer) | SK-T05, SK-Q03, AG-T03 | WCAG compliance, screen readers, keyboard navigation, ARIA |
| accessibility-testing | [Claude Plugins](https://claude-plugins.dev/skills/@conorluddy/xclaude-plugin/accessibility-testing) | SK-T05, AG-T03 | Accessibility testing skill |
| accessibility-test-scanner | [Claude Plugins](https://claude-plugins.dev/skills/@jeremylongshore/claude-code-plugins-plus/accessibility-test-scanner) | SK-T05, AG-T03 | WCAG 2.1/2.2 compliance scanning with ARIA validation |
| Chrome DevTools MCP Skill | [Claude Plugins](https://claude-plugins.dev/skills/@justfinethanku/cc_chrome_devtools_mcp_skill/SKILL.md) | SK-T05, SK-P01 | Accessibility tree inspection for WCAG compliance |

### Performance and Profiling Skills

| Reference | URL | Aligned Backlog Items | Description |
|-----------|-----|----------------------|-------------|
| application-profiler | [Claude Plugins](https://claude-plugins.dev/skills/@jeremylongshore/claude-code-plugins-plus/application-profiler) | SK-P01, SK-P02, AG-T04 | CPU usage, memory allocation, and execution time analysis |
| memory-profiling | [Claude Plugins](https://claude-plugins.dev/skills/@greyhaven-ai/claude-code-config/memory-profiling) | SK-P02, SK-E05, AG-T04 | Memory leak detection, heap snapshot analysis, allocation profiling |
| performance-testing | [Claude Plugins](https://claude-plugins.dev/skills/@proffesor-for-testing/sentinel-api-testing/performance-testing) | SK-P01, AG-T04 | Performance testing skill |

### i18n and Localization Skills

| Reference | URL | Aligned Backlog Items | Description |
|-----------|-----|----------------------|-------------|
| i18n-expert | [GitHub](https://github.com/daymade/claude-code-skills) | SK-Q04, AG-U02 | Complete i18n setup and auditing, locale parity validation |
| Next-intl Localization | [MCP Market](https://mcpmarket.com/tools/skills/next-intl-localization) | SK-Q04, AG-U02 | Translation key management for Next.js (patterns applicable to desktop) |
| i18n Enforcer | [MCP Market](https://mcpmarket.com/tools/skills/i18n-enforcer) | AG-U02 | Zero hardcoded text enforcement |
| i18n-manager | [MCP Market](https://mcpmarket.com/tools/skills/i18n-manager) | SK-Q04, AG-U02 | Multi-language application workflow management |
| translations | [Claude Plugins](https://claude-plugins.dev/skills/@zoonk/zoonk/translations) | AG-U02 | Working with PO files and translations |

---

## Claude Code Subagents

### Desktop Development Subagents

| Reference | URL | Aligned Backlog Items | Description |
|-----------|-----|----------------------|-------------|
| electron-pro | [VoltAgent](https://github.com/VoltAgent/awesome-claude-code-subagents/blob/main/categories/01-core-development/electron-pro.md) | AG-E01, SK-E01 to SK-E08 | Desktop application expert for secure Electron apps (Windows 10+, macOS 11+, Ubuntu 20.04+) |
| desktop-app-dev | [ccplugins](https://github.com/ccplugins/awesome-claude-code-plugins/blob/main/plugins/desktop-app-dev) | AG-E01 to AG-E07 | Specialized agent for building desktop applications |
| powershell-ui-architect | [VoltAgent](https://github.com/VoltAgent/awesome-claude-code-subagents/blob/main/categories/06-developer-experience/powershell-ui-architect.md) | AG-E03, SK-W02, AG-U03 | PowerShell UI/UX specialist for WinForms, WPF, Metro frameworks |

### Build and DevOps Subagents

| Reference | URL | Aligned Backlog Items | Description |
|-----------|-----|----------------------|-------------|
| build-engineer | [VoltAgent](https://github.com/VoltAgent/awesome-claude-code-subagents/blob/main/categories/06-developer-experience/build-engineer.md) | AG-D01, SK-B01 to SK-B08 | Build system specialist |
| deployment-engineer | [VoltAgent](https://github.com/VoltAgent/awesome-claude-code-subagents/blob/main/categories/03-infrastructure/deployment-engineer.md) | AG-D02, AG-D03 | Deployment automation specialist |
| devops-engineer | [VoltAgent](https://github.com/VoltAgent/awesome-claude-code-subagents/blob/main/categories/03-infrastructure/devops-engineer.md) | AG-D01, SK-T06 | CI/CD and automation expert |
| terraform-engineer | [VoltAgent](https://github.com/VoltAgent/awesome-claude-code-subagents/blob/main/categories/03-infrastructure/terraform-engineer.md) | AG-D01 | Infrastructure as Code expert |

### Testing and Quality Subagents

| Reference | URL | Aligned Backlog Items | Description |
|-----------|-----|----------------------|-------------|
| qa-expert | [VoltAgent](https://github.com/VoltAgent/awesome-claude-code-subagents/blob/main/categories/04-quality-security/qa-expert.md) | AG-T01, AG-T02 | Quality assurance specialist |
| test-automator | [VoltAgent](https://github.com/VoltAgent/awesome-claude-code-subagents/blob/main/categories/04-quality-security/test-automator.md) | AG-T01, AG-T02, SK-T01 | Test automation specialist |
| accessibility-tester | [VoltAgent](https://github.com/VoltAgent/awesome-claude-code-subagents/blob/main/categories/04-quality-security/accessibility-tester.md) | AG-T03, SK-T05 | WCAG compliance expert with screen reader and keyboard navigation testing |

### Migration and Architecture Subagents

| Reference | URL | Aligned Backlog Items | Description |
|-----------|-----|----------------------|-------------|
| refactoring-specialist | [VoltAgent](https://github.com/VoltAgent/awesome-claude-code-subagents) | AG-M01, AG-M02 | Code refactoring and modernization |
| legacy-modernizer | [VoltAgent](https://github.com/VoltAgent/awesome-claude-code-subagents) | AG-M02, SK-W05 | Legacy code modernization support |
| mcp-developer | [VoltAgent](https://github.com/VoltAgent/awesome-claude-code-subagents) | All MCP-related | MCP server development expertise |

---

## Claude Code Plugins

### Desktop Development Plugins

| Reference | URL | Aligned Backlog Items | Description |
|-----------|-----|----------------------|-------------|
| desktop-app-dev | [ccplugins](https://github.com/ccplugins/awesome-claude-code-plugins/blob/main/plugins/desktop-app-dev) | AG-E01 to AG-E07 | Specialized plugin for desktop application development |
| flutter-mobile-app-dev | [ccplugins](https://github.com/ccplugins/awesome-claude-code-plugins/blob/main/plugins/flutter-mobile-app-dev) | SK-X02, AG-E06 | Flutter development (supports desktop targets) |
| code-architect | [ccplugins](https://github.com/ccplugins/awesome-claude-code-plugins/blob/main/plugins/code-architect) | AG-M03 | General architectural guidance |

---

## Curated Resource Lists

### Awesome Lists

| Reference | URL | Description |
|-----------|-----|-------------|
| awesome-mcp-servers (wong2) | [GitHub](https://github.com/wong2/awesome-mcp-servers) | Curated list of MCP servers (7,260+ servers) |
| awesome-mcp-servers (punkpeye) | [GitHub](https://github.com/punkpeye/awesome-mcp-servers) | Production-ready and experimental MCP servers |
| awesome-mcp-servers (TensorBlock) | [GitHub](https://github.com/TensorBlock/awesome-mcp-servers) | Comprehensive MCP server collection |
| best-of-mcp-servers | [GitHub](https://github.com/tolkonepiu/best-of-mcp-servers) | Ranked list of MCP servers (updated weekly) |
| MCP Awesome Directory | [mcp-awesome.com](https://mcp-awesome.com/) | 1200+ quality-verified MCP servers |
| awesome-claude-code-subagents | [VoltAgent](https://github.com/VoltAgent/awesome-claude-code-subagents) | 100+ specialized Claude Code subagents |
| awesome-claude-code-plugins | [ccplugins](https://github.com/ccplugins/awesome-claude-code-plugins) | Claude Code plugins collection |
| awesome-claude-skills | [ComposioHQ](https://github.com/ComposioHQ/awesome-claude-skills) | Curated Claude skills collection |
| awesome-claude-code | [hesreallyhim](https://github.com/hesreallyhim/awesome-claude-code) | Skills, hooks, slash-commands, and plugins |
| claude-code-subagents | [0xfurai](https://github.com/0xfurai/claude-code-subagents) | 100+ production-ready development subagents |

---

## Development Tools and Libraries

### Qt/C++ Development

| Reference | URL | Aligned Backlog Items | Description |
|-----------|-----|----------------------|-------------|
| QodeAssist | [GitHub](https://github.com/Palm1r/QodeAssist) | AG-E02, SK-Q01 to SK-Q06 | AI-powered coding assistant plugin for Qt Creator (supports Claude, Ollama, local models) |
| Qt AI Assistant | [Qt Blog](https://www.qt.io/blog/more-time-for-coding-with-the-qt-ai-assistant) | AG-E02 | Official Qt AI Assistant using Claude 3.5 Sonnet |

### Code Signing Tools

| Reference | URL | Aligned Backlog Items | Description |
|-----------|-----|----------------------|-------------|
| signing_tools (ddev) | [GitHub](https://github.com/ddev/signing_tools) | SK-CS01, SK-CS02, SK-S03 | macOS and Windows signing and notarization tools |
| electron-builder Code Signing | [electron.build](https://www.electron.build/code-signing.html) | SK-CS01, SK-CS02, SK-E02 | Electron code signing documentation |
| Electron Code Signing Guide | [Electron Docs](https://www.electronjs.org/docs/latest/tutorial/code-signing) | SK-CS01, SK-CS02 | Official Electron code signing tutorial |

### UI Automation Libraries

| Reference | URL | Aligned Backlog Items | Description |
|-----------|-----|----------------------|-------------|
| Python-UIAutomation-for-Windows | [GitHub](https://github.com/yinkaisheng/Python-UIAutomation-for-Windows) | AG-T02, SK-T01 | Python wrapper for Windows UIAutomation (MFC, WinForms, WPF, Qt, browsers) |
| FlaUI | [GitHub](https://github.com/FlaUI/FlaUI) | AG-T02, SK-T01 | .NET UI automation library |

---

## Summary Statistics

### References by Category

| Category | Count |
|----------|-------|
| MCP Servers | 35 |
| Claude Skills | 18 |
| Claude Code Subagents | 12 |
| Claude Code Plugins | 3 |
| Curated Resource Lists | 10 |
| Development Tools | 6 |
| **Total References** | **84** |

### Coverage by Framework

| Framework | MCP Servers | Skills | Subagents | Total |
|-----------|-------------|--------|-----------|-------|
| Electron | 2 | 2 | 1 | 5 |
| Tauri | 4 | 1 | 0 | 5 |
| macOS/Swift/Xcode | 7 | 0 | 0 | 7 |
| Windows/.NET/WPF | 6 | 0 | 1 | 7 |
| Cross-Platform | 12 | 2 | 4 | 18 |
| Testing | 6 | 5 | 3 | 14 |
| Build/CI-CD | 7 | 1 | 4 | 12 |
| i18n/Localization | 0 | 5 | 0 | 5 |
| Performance | 1 | 3 | 0 | 4 |
| Accessibility | 1 | 4 | 1 | 6 |

### Backlog Coverage Analysis

| Backlog Category | Items Covered | Items Partially Covered | Items Without References |
|------------------|---------------|------------------------|-------------------------|
| Electron Skills (SK-E01 to SK-E08) | 4 | 3 | 1 |
| Qt/C++ Skills (SK-Q01 to SK-Q06) | 2 | 2 | 2 |
| WPF/.NET Skills (SK-W01 to SK-W06) | 4 | 2 | 0 |
| SwiftUI/AppKit Skills (SK-S01 to SK-S07) | 5 | 2 | 0 |
| Cross-Platform Skills (SK-X01 to SK-X05) | 3 | 1 | 1 |
| Code Signing Skills (SK-CS01 to SK-CS06) | 3 | 2 | 1 |
| Native Integration Skills (SK-N01 to SK-N07) | 3 | 2 | 2 |
| Build/Distribution Skills (SK-B01 to SK-B08) | 2 | 4 | 2 |
| Testing Skills (SK-T01 to SK-T06) | 5 | 1 | 0 |
| Performance Skills (SK-P01 to SK-P06) | 4 | 2 | 0 |
| Framework Expert Agents (AG-E01 to AG-E07) | 4 | 2 | 1 |
| Platform Expert Agents (AG-P01 to AG-P04) | 3 | 1 | 0 |
| Security Agents (AG-S01 to AG-S04) | 2 | 1 | 1 |
| Testing Agents (AG-T01 to AG-T04) | 4 | 0 | 0 |
| DevOps Agents (AG-D01 to AG-D03) | 3 | 0 | 0 |
| UX/Localization Agents (AG-U01 to AG-U03) | 2 | 1 | 0 |
| Migration Agents (AG-M01 to AG-M03) | 2 | 1 | 0 |

### Gap Analysis

The following skills/agents have **no direct community references** and require custom implementation:

#### Skills Requiring Custom Development
- SK-E07: `electron-native-addon-builder` - Native Node.js addon building
- SK-Q05: `qt-installer-framework-config` - Qt Installer Framework configuration
- SK-Q06: `qt-test-fixture-generator` - Qt Test fixtures
- SK-X05: `neutralino-js-config` - Neutralino.js configuration
- SK-CS04: `ev-certificate-validator` - EV certificate chain validation
- SK-N06: `power-management-monitor` - System power state monitoring
- SK-N07: `screen-capture-api` - Cross-platform screen capture
- SK-B04: `flatpak-manifest-generator` - Flatpak manifest generation
- SK-B05: `snap-yaml-generator` - Snapcraft.yaml generation

#### Agents Requiring Custom Development
- AG-E07: `maui-xamarin-specialist` - .NET MAUI expertise (partial coverage via C# SDK)
- AG-S04: `update-security-analyst` - Auto-update security validation

---

## Implementation Recommendations

### High-Priority Adoptions

1. **XcodeBuildMCP** - Comprehensive macOS/iOS development support
2. **Windows-MCP.Net** - Full Windows automation with WPF/WinForms support
3. **tauri-mcp** - Modern cross-platform desktop framework support
4. **Playwright MCP** - Browser automation for Electron testing
5. **Sentry MCP** - Crash reporting and error monitoring

### Recommended Skill Combinations

1. **Electron Development Stack**:
   - electron-scaffold + Electron Distribution & Auto-Update
   - electron-pro subagent
   - Playwright Skill for testing

2. **macOS Development Stack**:
   - XcodeBuildMCP + apple-docs-mcp
   - accessibility-testing skill
   - Sentry MCP for crash reporting

3. **Windows Development Stack**:
   - Windows-MCP.Net + winforms-mcp
   - powershell-ui-architect subagent
   - FlaUI for UI automation

4. **Cross-Platform Testing Stack**:
   - Playwright MCP + BrowserStack MCP
   - A11y MCP for accessibility
   - Currents MCP for test failure analysis

---

**Created**: 2026-01-24
**Specialization**: Desktop Development
**Specialization Slug**: `desktop-development`
**Total References Found**: 84
**Categories Covered**: 10
**Status**: Phase 5 Complete - Ready for Implementation
