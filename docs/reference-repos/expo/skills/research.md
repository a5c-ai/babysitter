# expo/skills

- **GitHub**: https://github.com/expo/skills
- **Stars**: 1,675
- **License**: MIT
- **Last pushed**: 2026-04-10
- **Topics**: (none)
- **Source**: gh-search

## Description

Official AI agent skills from the Expo team for building, deploying, and debugging Expo apps. Packaged as a Claude Code marketplace plugin with 12 skills covering the full Expo development lifecycle. Fine-tuned for Opus models per Expo's documentation.

## Archetype

**claude-plugin** -- Ships as a Claude Code marketplace plugin (`.claude-plugin/marketplace.json`) with 4 plugin entries (1 active `expo`, 3 deprecated aliases). Also installable via `bunx skills add`.

## Structure

- `.claude-plugin/marketplace.json` -- Claude Code marketplace manifest (name: `expo-plugins`)
- `plugins/expo/skills/` -- 12 skill directories:
  - `building-native-ui/` -- Native UI components
  - `expo-api-routes/` -- API routes
  - `expo-cicd-workflows/` -- CI/CD with EAS
  - `expo-deployment/` -- App Store/Play Store/web deployment
  - `expo-dev-client/` -- Development client setup
  - `expo-module/` -- Native module development
  - `expo-tailwind-setup/` -- Tailwind CSS integration
  - `expo-ui-jetpack-compose/` -- Android Jetpack Compose UI
  - `expo-ui-swift-ui/` -- iOS SwiftUI integration
  - `native-data-fetching/` -- Data fetching patterns
  - `upgrading-expo/` -- SDK version upgrades
  - `use-dom/` -- DOM components
- `CLAUDE.md` -- Claude Code instructions
- `CONTRIBUTING.md` -- Contribution guidelines

## Key Capabilities

- Full Expo development lifecycle: build, deploy, upgrade, debug
- Platform-specific UI: SwiftUI (iOS), Jetpack Compose (Android), DOM components (web)
- EAS (Expo Application Services) CI/CD integration
- Native module development patterns
- SDK upgrade workflows

---

## Processes

### 1. Mobile App Deployment Process

- **Placement**: `specializations/mobile/` (domain-specific)
- **Description**: Multi-step mobile app deployment workflow extracted from the `expo-deployment` and `expo-cicd-workflows` skills. Generalizable beyond Expo to any React Native or mobile deployment pipeline.
- **Steps**:
  1. Detect platform targets (iOS, Android, web)
  2. Validate build configuration and signing credentials
  3. Run pre-deployment checks (version bump, changelog, asset optimization)
  4. Breakpoint: confirm deployment targets and release channel
  5. Build for each platform
  6. Run platform-specific validation (App Store guidelines, Play Store policies)
  7. Breakpoint: review build artifacts before submission
  8. Submit to stores / deploy to web
  9. Monitor submission status
  10. Verify deployment success
- **Generalizability**: Medium. The workflow pattern (build -> validate -> submit -> monitor) is universal for mobile apps, but Expo-specific details would need abstraction.

### 2. SDK/Framework Upgrade Process

- **Placement**: `specializations/shared/` (cross-domain, applies to any framework upgrade)
- **Description**: Multi-step framework upgrade workflow extracted from the `upgrading-expo` skill. The pattern of version detection -> breaking changes analysis -> incremental migration -> verification is universal.
- **Steps**:
  1. Detect current SDK/framework version
  2. Identify target version and all intermediate versions
  3. Fetch breaking changes and migration guides for each version hop
  4. Analyze codebase for affected patterns
  5. Breakpoint: present migration plan with estimated effort
  6. Apply migrations incrementally (version by version)
  7. Run tests after each version hop
  8. Breakpoint: review test results and manual verification items
  9. Final validation and cleanup

## Plugin Ideas

### 1. Mobile Deployment Plugin

- **Category**: CI/CD Integration
- **Plugin name**: `mobile-deployment`
- **Description**: Orchestrates mobile app builds and store submissions with breakpoints for review. Wraps EAS Build, Fastlane, or native CLI tools.
- **install.md approach**: Detect mobile build toolchain (EAS, Fastlane, Xcode, Gradle), configure signing credentials, set up store API keys
- **Key features**:
  - Multi-platform build orchestration (iOS + Android + web)
  - Store submission with guideline pre-checks
  - Build artifact review breakpoints
  - Version management and changelog generation
- **Integration surface**: commands (`deploy:mobile`, `deploy:build`), hooks (`pre-commit` for version validation), breakpoint rules

## Skipped

- Individual skill content is Expo-specific instruction text, not orchestratable
- The Claude Code plugin marketplace format is already well-understood by babysitter
- Native UI skills (SwiftUI, Jetpack Compose) are reference material, not processes

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Mobile App Deployment Process | NEW | Multi-platform mobile deployment with store submission workflow | - | specializations/mobile/mobile-app-deployment.js |
| SDK/Framework Upgrade Process | NEW | Universal framework upgrade with breaking changes analysis | - | specializations/shared/framework-upgrade-process.js |
| EAS CI/CD Integration Pattern | NEW | Expo Application Services CI/CD automation patterns | - | specializations/devops-sre-platform/eas-cicd-integration.js |
| Native Module Development Workflow | NEW | Cross-platform native module development and integration | - | specializations/mobile/native-module-development.js |
| Platform-Specific UI Integration | NEW | SwiftUI/Jetpack Compose integration patterns for cross-platform apps | - | specializations/mobile/platform-specific-ui-integration.js |
| Mobile Build Configuration Management | NEW | Build configuration and signing credentials management workflow | - | specializations/devops-sre-platform/mobile-build-configuration.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Mobile Deployment | NEW | Multi-platform mobile build and store submission orchestration | - | plugins/a5c/marketplace/blueprints/mobile-deployment/ |
| Framework Upgrade Automation | NEW | SDK/framework upgrade with breaking changes analysis and incremental migration | - | plugins/a5c/marketplace/blueprints/framework-upgrade-automation/ |
