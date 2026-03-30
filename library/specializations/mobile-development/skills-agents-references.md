# Mobile Development - Skills and Agents References

This document catalogs community-created Claude skills, agents, plugins, and MCP servers that match the skills and agents identified in the [skills-agents-backlog.md](./skills-agents-backlog.md). These external resources can accelerate implementation of the specialized capabilities needed for mobile development processes.

---

## Table of Contents

1. [Overview](#overview)
2. [React Native Skills and Agents](#react-native-skills-and-agents)
3. [Flutter Skills and Agents](#flutter-skills-and-agents)
4. [iOS/Swift/SwiftUI Skills and Agents](#iosswiftswiftui-skills-and-agents)
5. [Android/Kotlin Skills and Agents](#androidkotlin-skills-and-agents)
6. [Mobile CI/CD and Distribution](#mobile-cicd-and-distribution)
7. [Mobile Testing](#mobile-testing)
8. [Firebase and Backend Integration](#firebase-and-backend-integration)
9. [GraphQL Mobile Integration](#graphql-mobile-integration)
10. [Mobile Security](#mobile-security)
11. [Mobile Accessibility](#mobile-accessibility)
12. [Mobile Performance](#mobile-performance)
13. [General Mobile Development](#general-mobile-development)
14. [Summary Statistics](#summary-statistics)

---

## Overview

### Purpose
This reference document maps external community resources to the skills and agents identified in Phase 4 (skills-agents-backlog.md). It serves as a foundation for Phase 5 implementation by identifying existing tools that can be adopted, adapted, or used as reference implementations.

### Resource Categories
- **Skills**: Claude Code skills that extend Claude's capabilities for specific tasks
- **Agents/Subagents**: Specialized agent personas with domain expertise
- **MCP Servers**: Model Context Protocol servers that connect Claude to external services
- **Plugins**: Installable packages combining skills, agents, and tools

---

## React Native Skills and Agents

### Skills

| Resource | Description | Backlog Mapping | Link |
|----------|-------------|-----------------|------|
| **react-native-best-practices** | Callstack's optimization guide covering JS profiling, FPS analysis, state management, animations, native profiling, bundle optimization | SK-001 | [GitHub](https://github.com/callstackincubator/agent-skills) |
| **React Native Expo Modern Stack** | Accelerates cross-platform development using Expo SDK 52+ and React Native New Architecture (Fabric/TurboModules) | SK-001 | [MCP Market](https://mcpmarket.com/tools/skills/react-native-expo-modern-stack) |
| **React Native Expo Development** | Specialized guidance for building high-performance mobile applications with Expo | SK-001 | [MCP Market](https://mcpmarket.com/tools/skills/react-native-expo-development-1) |
| **Mobile Debugging Expert** | Diagnoses React Native and Expo issues including Metro bundler errors, native build failures, Flipper integration | SK-001, SK-020 | [MCP Market](https://mcpmarket.com/tools/skills/mobile-app-debugging-1) |
| **React Native Setup Expert** | Guides initial project setup and configuration | SK-001 | [MCP Market](https://mcpmarket.com/tools/skills/react-native-setup-expert) |
| **React Native Expert** | Comprehensive React Native development expertise | SK-001 | [MCP Market](https://mcpmarket.com/tools/skills/react-native-expert-2) |

### Agent Systems

| Resource | Description | Backlog Mapping | Link |
|----------|-------------|-----------------|------|
| **claude-code-reactnative-expo-agent-system** | 7 production agents for React Native/Expo: Grand Architect, Design Token Guardian, A11y Compliance Enforcer, Smart Test Generator, Performance Budget Enforcer, Performance Prophet, Security Penetration Specialist. Includes /feature, /review, /test commands | AG-001, AG-006, AG-007 | [GitHub](https://github.com/senaiverse/claude-code-reactnative-expo-agent-system) |

### MCP Servers

| Resource | Description | Backlog Mapping | Link |
|----------|-------------|-----------------|------|
| **react-native-mcp-guide** | MCP server enabling AI to generate PR-ready fixes, intelligent dependency management, security auditing, compatibility validation | SK-001 | [npm](https://www.npmjs.com/package/@mrnitro360/react-native-mcp-guide) |

### Installation Examples

```bash
# Callstack Agent Skills (Claude Code CLI)
/plugin marketplace add callstackincubator/agent-skills
/plugin install react-native-best-practices@callstack-agent-skills

# React Native MCP Guide
npm install -g @mrnitro360/react-native-mcp-guide
claude mcp add react-native-guide npx @mrnitro360/react-native-mcp-guide

# Expo Agent System (PowerShell)
cd claude-code-expo-system\scripts
.\install-agents.ps1 -Scope project
```

---

## Flutter Skills and Agents

### Skills

| Resource | Description | Backlog Mapping | Link |
|----------|-------------|-----------------|------|
| **flutter-development** (FastMCP) | Cross-platform mobile development with widgets, state management (Provider/BLoC), navigation, API integration, Material Design | SK-002 | [FastMCP](https://fastmcp.me/Skills/Details/242/flutter-development) |
| **Flutter App Development** | Comprehensive Flutter mobile app skill | SK-002 | [MCP Market](https://mcpmarket.com/tools/skills/flutter-app-development-1) |
| **Flutter Animations Motion** | Motion design and animation implementation in Flutter | SK-016 | [MCP Market](https://mcpmarket.com/tools/skills/flutter-animations-motion) |

### Agent Systems

| Resource | Description | Backlog Mapping | Link |
|----------|-------------|-----------------|------|
| **flutter-claude-code** | 19 specialized agents and 1 skill in 6 categories: UI Pipeline (5 agents), Architecture (2 agents), Platform Integration (3 agents), Performance (2 agents), Backend (4 agents), Deployment (3 agents) | AG-002, AG-005, AG-010 | [GitHub](https://github.com/cleydson/flutter-claude-code) |
| **flutter-expert** (VoltAgent) | Flutter 3+ cross-platform mobile expert subagent | AG-002 | [GitHub](https://github.com/VoltAgent/awesome-claude-code-subagents) |

### Plugins

| Resource | Description | Backlog Mapping | Link |
|----------|-------------|-----------------|------|
| **custom-plugin-flutter** | 8 agents and 12 skills for Flutter development | SK-002, AG-002 | [GitHub](https://github.com/pluginagentmarketplace/custom-plugin-flutter) |
| **pleaseai-flutter** | Flutter/Dart plugin with 5 commands, 1 skill, 1 MCP server for app creation, package management, debugging | SK-002 | [ClaudePluginHub](https://www.claudepluginhub.com/plugins/pleaseai-flutter) |

### Installation Examples

```bash
# Flutter Claude Code (all agents)
/plugin marketplace add https://github.com/cleydson/flutter-claude-code
/plugin install flutter-all@flutter-claude-code

# Category-specific installation
/plugin install flutter-ui@flutter-claude-code
/plugin install flutter-architecture@flutter-claude-code
/plugin install flutter-backend@flutter-claude-code
/plugin install flutter-deployment@flutter-claude-code

# Plugin Marketplace Flutter
/plugin marketplace add pluginagentmarketplace/custom-plugin-flutter
/plugin install custom-plugin-flutter@pluginagentmarketplace-flutter
```

---

## iOS/Swift/SwiftUI Skills and Agents

### Skills

| Resource | Description | Backlog Mapping | Link |
|----------|-------------|-----------------|------|
| **ios-simulator-skill** | 21 production scripts for building, testing, automation. Semantic navigation, accessibility audits, visual comparisons, device lifecycle management. 96% token savings | SK-003, SK-011, SK-019 | [GitHub](https://github.com/conorluddy/ios-simulator-skill) |
| **Axiom** | Battle-tested skills for xOS development: Liquid Glass UI, SwiftUI 26, accessibility auditing, memory debugging, Swift Concurrency, SwiftData, GRDB | SK-003, SK-005, SK-019, SK-020 | [GitHub](https://github.com/CharlesWiltgen/Axiom) |
| **iOS App Builder** | Native iPhone apps using Swift and SwiftUI via CLI-only workflow | SK-003 | [MCP Market](https://mcpmarket.com/tools/skills/ios-app-builder) |
| **Developing with Swift** | Swift-specific rules and best practices with SwiftUI architecture, Apple native patterns | SK-003 | [MCP Market](https://mcpmarket.com/tools/skills/developing-with-swift) |
| **iOS Swift Development** | SwiftUI, MVVM architecture, modern Swift concurrency patterns | SK-003 | [MCP Market](https://mcpmarket.com/tools/skills/ios-swift-development) |
| **SwiftUI Development Guidelines** | State management, navigation, UI patterns for iOS/macOS/watchOS/visionOS | SK-003 | [MCP Market](https://mcpmarket.com/tools/skills/swiftui-development-guidelines) |
| **SwiftUI Performance** | Performance optimization using Instruments 26 and iOS 26, 120Hz ProMotion | SK-003, SK-020 | [MCP Market](https://mcpmarket.com/tools/skills/swiftui-performance) |
| **Professional iOS App Builder** | Professional iOS development skill | SK-003 | [MCP Market](https://mcpmarket.com/tools/skills/professional-ios-app-builder-1) |

### Guides and Frameworks

| Resource | Description | Backlog Mapping | Link |
|----------|-------------|-----------------|------|
| **claude-code-ios-dev-guide** | Comprehensive setup for Claude Code CLI with PRD-driven workflows, extended thinking (ultrathink), planning modes for Swift/SwiftUI. XcodeBuildMCP integration | SK-003, AG-003 | [GitHub](https://github.com/keskinonur/claude-code-ios-dev-guide) |

### Subagents

| Resource | Description | Backlog Mapping | Link |
|----------|-------------|-----------------|------|
| **swift-expert** (VoltAgent) | iOS and macOS specialist subagent | AG-003 | [GitHub](https://github.com/VoltAgent/awesome-claude-code-subagents) |

### Installation Examples

```bash
# iOS Simulator Skill
git clone https://github.com/conorluddy/ios-simulator-skill.git ~/.claude/skills/ios-simulator-skill

# Axiom
/plugin marketplace add CharlesWiltgen/Axiom

# VoltAgent Language Specialists
claude plugin install voltagent-lang
```

---

## Android/Kotlin Skills and Agents

### Skills

| Resource | Description | Backlog Mapping | Link |
|----------|-------------|-----------------|------|
| **claude-android-skill** | Modern Android apps with Clean Architecture, MVVM, Jetpack Compose, Room, Retrofit, Hilt, Coroutines/Flow, testing strategies | SK-004, SK-006 | [GitHub](https://github.com/dpconde/claude-android-skill) |
| **android-kotlin-development** (FastMCP) | Native Android with MVVM, Jetpack, Compose UI, Retrofit API calls, Room storage, navigation architecture | SK-004 | [FastMCP](https://fastmcp.me/Skills/Details/241/android-kotlin-development) |
| **Kotlin Specialist** | Senior Kotlin engineer expertise: Coroutines, Flow, KMP cross-platform | SK-004 | [MCP Market](https://mcpmarket.com/tools/skills/kotlin-specialist) |
| **Android Development Assistant** | Kotlin 2.2, Jetpack Compose, MVVM/MVI, Gradle version catalogs, Detekt/ktlint, GitHub Actions CI/CD | SK-004, SK-008 | [MCP Market](https://mcpmarket.com/tools/skills/android-development-assistant) |

### Agent Systems

| Resource | Description | Backlog Mapping | Link |
|----------|-------------|-----------------|------|
| **kmp-claude-code-subagents** | 3 production-ready KMP subagents: translation-updater (localization), datalayer-architect (Room, Koin, repository patterns), compose-architect (MVVM, UI state) | SK-004, SK-006, AG-004 | [GitHub](https://github.com/ChrisKruegerDev/kmp-claude-code-subagents) |

### Installation Examples

```bash
# Claude Android Skill
git clone https://github.com/dpconde/claude-android-skill.git ~/.claude/skills/claude-android-skill

# KMP Subagents - copy from repository /agents directory
```

---

## Mobile CI/CD and Distribution

### App Store Connect

| Resource | Description | Backlog Mapping | Link |
|----------|-------------|-----------------|------|
| **pabal-mcp** | App Store / Play Store ASO workflows: metadata sync, release management, app registration. Local-first architecture | SK-009, SK-010 | [GitHub](https://github.com/quartz-labs-dev/pabal-mcp) |

### Google Play Console

| Resource | Description | Backlog Mapping | Link |
|----------|-------------|-----------------|------|
| **play-store-mcp** | Deploy versions, promote releases between tracks, query release status. Supports APK/AAB, gradual rollout | SK-010 | [GitHub](https://github.com/antoniolg/play-store-mcp) |
| **mcp-google-play** | Google Play Store command line tools integration for AI assistants | SK-010 | [LobeHub](https://lobehub.com/mcp/blocktopusltd-mcp-google-play) |

### Fastlane Integration

| Resource | Description | Backlog Mapping | Link |
|----------|-------------|-----------------|------|
| **Fastlane CI/CD Plugin** | Collection of Fastlane helper actions for CI/CD | SK-008 | [GitHub](https://github.com/gematik/Fastlane-Plugin-CI-CD) |
| **Fastlane Setup Skill** | Claude Code skill for automated Fastlane setup | SK-008 | [GitHub Discussion](https://github.com/fastlane/fastlane/discussions/29838) |

### Mobile DevOps Subagent

| Resource | Description | Backlog Mapping | Link |
|----------|-------------|-----------------|------|
| **mobile-developer** (VoltAgent) | Cross-platform mobile specialist with CI/CD, biometric auth, offline sync, push notifications, Universal Links | AG-005 | [GitHub](https://github.com/VoltAgent/awesome-claude-code-subagents/blob/main/categories/01-core-development/mobile-developer.md) |

### Installation Examples

```bash
# Pabal MCP
npm install -g pabal-mcp

# Play Store MCP - configure with service account
# See: https://github.com/antoniolg/play-store-mcp

# Add to Claude Code MCP config
claude mcp add-json "play-store" '{"command":"java","args":["-jar","path/to/play-store-mcp.jar"]}'
```

---

## Mobile Testing

### Testing Frameworks

| Resource | Description | Backlog Mapping | Link |
|----------|-------------|-----------------|------|
| **mobile-app-tester** | Automated testing with Appium, Detox, XCUITest, Espresso. E2E test generation, page object models, device farm configuration | SK-011, AG-006 | [Claude Plugins](https://claude-plugins.dev/skills/@jeremylongshore/claude-code-plugins-plus/mobile-app-tester) |
| **mobile-testing** | QE testing skill for mobile platforms | SK-011 | [Claude Plugins](https://claude-plugins.dev/skills/@proffesor-for-testing/agentic-qe/mobile-testing) |

### Appium Integration

| Resource | Description | Backlog Mapping | Link |
|----------|-------------|-----------------|------|
| **appium-claude-android** | Transforms Appium into MCP server for AI-powered Android testing. Auto-starts Appium, detects devices, natural language UI testing | SK-011 | [MCP Market](https://mcpmarket.com/server/appium-claude-android) |

### Maestro Integration

| Resource | Description | Backlog Mapping | Link |
|----------|-------------|-----------------|------|
| **Maestro MCP** | Control emulators, interact with apps, write and debug UI tests. Outputs readable Maestro code | SK-011 | [Glama](https://glama.ai/mcp/servers/@mobile-dev-inc/Maestro) |

### Installation Examples

```bash
# Maestro MCP
claude mcp add maestro

# Appium MCP - configure with device connection
# Mobile plugin (includes Appium)
claude plugin install mobile@paddo-tools
```

---

## Firebase and Backend Integration

### Firebase MCP Server

| Resource | Description | Backlog Mapping | Link |
|----------|-------------|-----------------|------|
| **firebase-mcp** (Official) | Firestore, Storage, Authentication, Analytics, Crashlytics. Works with Claude Code, Cursor, VS Code | SK-018 | [Firebase Docs](https://firebase.google.com/docs/ai-assistance/mcp-server) |
| **firebase-mcp** (Community) | Firestore documents, Storage uploads, Authentication user management | SK-018 | [GitHub](https://github.com/gannonh/firebase-mcp) |
| **mcp-firestore-server** | Firestore MCP server for Claude Code | SK-018 | [GitHub](https://github.com/markhilton/mcp-firestore-server) |

### Firebase Crashlytics

| Resource | Description | Backlog Mapping | Link |
|----------|-------------|-----------------|------|
| **Firebase Crashlytics MCP** | AI-assisted crash analysis, debugging, and prioritization | SK-012, SK-018 | [Firebase Docs](https://firebase.google.com/docs/crashlytics/ai-assistance-mcp) |

### Installation Examples

```json
// Claude Desktop / Claude Code config
{
  "mcpServers": {
    "firebase": {
      "command": "npx",
      "args": ["-y", "firebase-tools@latest", "mcp"]
    }
  }
}
```

```bash
# Or install Firebase plugin
claude plugin install firebase
```

---

## GraphQL Mobile Integration

### Apollo MCP Server

| Resource | Description | Backlog Mapping | Link |
|----------|-------------|-----------------|------|
| **apollo-mcp-server** | Bridge between AI and GraphQL APIs. Exposes GraphQL operations as MCP tools. Works with any GraphQL API | SK-017 | [Apollo Docs](https://www.apollographql.com/docs/apollo-mcp-server) |

### GraphQL Skills

| Resource | Description | Backlog Mapping | Link |
|----------|-------------|-----------------|------|
| **graphql-1** | Integrate GraphQL APIs with Claude AI | SK-017 | [MCP Market](https://mcpmarket.com/server/graphql-1) |

### Installation Examples

```bash
# Apollo MCP Server
claude mcp add-json "apollo-mcp-server" '{"command":"npx","args":["-y","apollo-mcp-server"]}'
```

---

## Mobile Security

### OWASP Security

| Resource | Description | Backlog Mapping | Link |
|----------|-------------|-----------------|------|
| **owasp-mobile-security-checker** | Security analysis based on OWASP Mobile Top 10 (2024). Covers Android Keystore, iOS Keychain, Network Security Config, ATS | SK-015 | [Claude Plugins](https://claude-plugins.dev/skills/@Harishwarrior/flutter-claude-skills/owasp-mobile-security-checker) |
| **OWASP Compliance Checker** | Automated security audits with OWASP Top 10 framework | SK-015 | [MCP Market](https://mcpmarket.com/tools/skills/owasp-compliance-checker-1) |
| **Reviewing Security OWASP Top 10** | Security review skill | SK-015 | [MCP Market](https://mcpmarket.com/tools/skills/reviewing-security-owasp-top-10) |

### Security Agents

| Resource | Description | Backlog Mapping | Link |
|----------|-------------|-----------------|------|
| **Security Penetration Specialist** (Senaiverse) | OWASP Mobile Top 10 security audits for React Native/Expo | AG-007 | [GitHub](https://github.com/senaiverse/claude-code-reactnative-expo-agent-system) |

---

## Mobile Accessibility

### Accessibility Skills

| Resource | Description | Backlog Mapping | Link |
|----------|-------------|-----------------|------|
| **Axiom Accessibility** | WCAG compliance, VoiceOver testing, Dynamic Type support, color contrast validation for iOS | SK-019 | [GitHub](https://github.com/CharlesWiltgen/Axiom) |
| **A11y Compliance Enforcer** (Senaiverse) | WCAG 2.2 accessibility validation for React Native/Expo | SK-019, AG-008 | [GitHub](https://github.com/senaiverse/claude-code-reactnative-expo-agent-system) |

### Accessibility Subagents

| Resource | Description | Backlog Mapping | Link |
|----------|-------------|-----------------|------|
| **accessibility-tester** (VoltAgent) | WCAG 2.1 Level AA compliance, keyboard navigation, screen reader optimization (NVDA/JAWS/VoiceOver) | SK-019, AG-008 | [GitHub](https://github.com/VoltAgent/awesome-claude-code-subagents/blob/main/categories/04-quality-security/accessibility-tester.md) |

---

## Mobile Performance

### Performance Skills

| Resource | Description | Backlog Mapping | Link |
|----------|-------------|-----------------|------|
| **profiling-application-performance** | Application profiling skill | SK-020 | [Claude Plugins](https://claude-plugins.dev/skills/@jeremylongshore/claude-code-plugins-plus/application-profiler) |
| **mobile-debugging** | Mobile debugging with Flipper, Instruments, performance analysis | SK-020 | [Claude Plugins](https://claude-plugins.dev/skills/@anton-abyzov/specweave/mobile-debugging) |
| **SwiftUI Performance** | iOS 26 Instruments, 120Hz ProMotion optimization | SK-003, SK-020 | [MCP Market](https://mcpmarket.com/tools/skills/swiftui-performance) |
| **Mobile Debugging Expert** | Flipper, React DevTools, Chrome DevTools for performance profiling | SK-020 | [MCP Market](https://mcpmarket.com/tools/skills/mobile-app-debugging-expert) |

### Performance Agents

| Resource | Description | Backlog Mapping | Link |
|----------|-------------|-----------------|------|
| **Performance Budget Enforcer** (Senaiverse) | Tracks and maintains performance metrics | AG-006 | [GitHub](https://github.com/senaiverse/claude-code-reactnative-expo-agent-system) |
| **Performance Prophet** (Senaiverse) | Predictive performance analysis | AG-006 | [GitHub](https://github.com/senaiverse/claude-code-reactnative-expo-agent-system) |
| **flutter-performance-analyzer** | Flutter performance bottleneck identification | AG-002 | [GitHub](https://github.com/cleydson/flutter-claude-code) |
| **flutter-performance-optimizer** | Flutter performance improvements implementation | AG-002 | [GitHub](https://github.com/cleydson/flutter-claude-code) |

---

## General Mobile Development

### Mobile Developer Subagents

| Resource | Description | Backlog Mapping | Link |
|----------|-------------|-----------------|------|
| **mobile-developer** (VoltAgent) | Cross-platform mobile specialist | General | [GitHub](https://github.com/VoltAgent/awesome-claude-code-subagents/blob/main/categories/01-core-development/mobile-developer.md) |
| **mobile-app-developer** (VoltAgent) | Mobile application specialist | General | [GitHub](https://github.com/VoltAgent/awesome-claude-code-subagents/blob/main/categories/07-specialized-domains/mobile-app-developer.md) |

### Mobile Plugins

| Resource | Description | Backlog Mapping | Link |
|----------|-------------|-----------------|------|
| **react-native-dev** (ccplugins) | React Native mobile application development plugin | SK-001 | [GitHub](https://github.com/ccplugins/awesome-claude-code-plugins) |
| **flutter-mobile-app-dev** (ccplugins) | Flutter cross-platform mobile development plugin | SK-002 | [GitHub](https://github.com/ccplugins/awesome-claude-code-plugins) |
| **mobile-app-builder** (ccplugins) | General mobile application builder | General | [GitHub](https://github.com/ccplugins/awesome-claude-code-plugins) |
| **mobile-ux-optimizer** (ccplugins) | Mobile UX optimization plugin | AG-008 | [GitHub](https://github.com/ccplugins/awesome-claude-code-plugins) |
| **mobile** (paddo-tools) | Mobile plugin with auto-installed Appium | SK-011 | [paddo.dev](https://paddo.dev/blog/claude-tools-plugin-marketplace/) |

### Resource Collections

| Resource | Description | Link |
|----------|-------------|------|
| **awesome-claude-skills** (ComposioHQ) | Curated list of Claude skills including mobile | [GitHub](https://github.com/ComposioHQ/awesome-claude-skills) |
| **awesome-claude-skills** (travisvn) | Curated list of Claude skills and resources | [GitHub](https://github.com/travisvn/awesome-claude-skills) |
| **awesome-claude-code-plugins** | Skills, subagents, MCP servers, hooks for Claude Code | [GitHub](https://github.com/ccplugins/awesome-claude-code-plugins) |
| **awesome-claude-code-subagents** (VoltAgent) | Collection of Claude Code subagents by category | [GitHub](https://github.com/VoltAgent/awesome-claude-code-subagents) |
| **claude-flow** | Mobile development wiki and agent orchestration | [GitHub Wiki](https://github.com/ruvnet/claude-flow/wiki/CLAUDE-MD-Mobile-Development) |

---

## Summary Statistics

| Category | Resources Found |
|----------|-----------------|
| React Native Skills | 6 |
| React Native Agents | 1 |
| React Native MCP Servers | 1 |
| Flutter Skills | 3 |
| Flutter Agent Systems | 2 |
| Flutter Plugins | 2 |
| iOS/Swift Skills | 8 |
| iOS Guides | 1 |
| iOS Subagents | 1 |
| Android/Kotlin Skills | 4 |
| Android Agent Systems | 1 |
| App Store MCP Servers | 3 |
| Fastlane Resources | 2 |
| Mobile Testing Tools | 4 |
| Firebase MCP Servers | 3 |
| GraphQL MCP Servers | 2 |
| Security Skills | 3 |
| Accessibility Skills/Agents | 3 |
| Performance Skills/Agents | 8 |
| General Mobile Resources | 10 |
| **Total References** | **68** |

### Backlog Coverage

| Backlog Item | External Resources Found |
|--------------|-------------------------|
| SK-001 (React Native) | 8 resources |
| SK-002 (Flutter/Dart) | 7 resources |
| SK-003 (Swift/SwiftUI) | 10 resources |
| SK-004 (Kotlin/Compose) | 5 resources |
| SK-005 (Core Data/Realm) | 2 resources |
| SK-006 (Room Database) | 2 resources |
| SK-007 (Push Notifications) | 0 resources |
| SK-008 (Fastlane CI/CD) | 3 resources |
| SK-009 (App Store Connect) | 1 resource |
| SK-010 (Google Play Console) | 3 resources |
| SK-011 (Mobile Testing) | 5 resources |
| SK-012 (Mobile Analytics) | 1 resource |
| SK-013 (Deep Linking) | 1 resource |
| SK-014 (Offline Storage) | 0 resources |
| SK-015 (Mobile Security) | 4 resources |
| SK-016 (Lottie Animation) | 1 resource |
| SK-017 (GraphQL Mobile) | 2 resources |
| SK-018 (Firebase Mobile) | 4 resources |
| SK-019 (Accessibility Testing) | 4 resources |
| SK-020 (Performance Profiling) | 6 resources |
| AG-001 (React Native Expert) | 2 resources |
| AG-002 (Flutter Expert) | 3 resources |
| AG-003 (iOS Native Expert) | 2 resources |
| AG-004 (Android Native Expert) | 2 resources |
| AG-005 (Mobile DevOps) | 2 resources |
| AG-006 (Mobile QA Engineer) | 4 resources |
| AG-007 (Mobile Security Engineer) | 1 resource |
| AG-008 (Mobile UX Engineer) | 3 resources |
| AG-009 (ASO Expert) | 0 resources |
| AG-010 (Backend Integration) | 3 resources |

### Gaps Identified

The following backlog items have limited or no external resources:
1. **SK-007 (Push Notifications)**: No dedicated skill found
2. **SK-014 (Mobile Offline Storage)**: No dedicated skill found
3. **AG-009 (ASO Expert)**: No dedicated agent found

---

## Sources and Credits

This document was compiled from the following sources:

- [GitHub Topics: claude-skills](https://github.com/topics/claude-skills)
- [awesome-claude-skills (ComposioHQ)](https://github.com/ComposioHQ/awesome-claude-skills)
- [awesome-claude-code-plugins](https://github.com/ccplugins/awesome-claude-code-plugins)
- [awesome-claude-code-subagents (VoltAgent)](https://github.com/VoltAgent/awesome-claude-code-subagents)
- [MCP Market](https://mcpmarket.com)
- [FastMCP](https://fastmcp.me)
- [Claude Plugins Directory](https://claude-plugins.dev)
- [LobeHub MCP Servers](https://lobehub.com/mcp)
- [Glama MCP Servers](https://glama.ai/mcp/servers)

---

**Created**: 2026-01-24
**Version**: 1.0.0
**Status**: Phase 5 - External Resources Cataloged
**Next Step**: Phase 6 - Implement specialized skills and agents using identified resources
