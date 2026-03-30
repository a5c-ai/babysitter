# Mobile Development - Skills and Agents Backlog

This document identifies specialized skills and agents (subagents) that could enhance the Mobile Development processes beyond general-purpose capabilities. These tools would provide domain-specific expertise, automation capabilities, and integration with specialized mobile development tooling.

---

## Table of Contents

1. [Overview](#overview)
2. [Skills Backlog](#skills-backlog)
3. [Agents Backlog](#agents-backlog)
4. [Process-to-Skill/Agent Mapping](#process-to-skillagent-mapping)
5. [Shared Candidates](#shared-candidates)
6. [Implementation Priority](#implementation-priority)

---

## Overview

### Current State
All 26 implemented processes in this specialization currently use general-purpose agents for task execution. While functional, this approach lacks domain-specific optimizations that specialized skills and agents could provide for mobile development workflows.

### Goals
- Provide deep expertise in specific mobile frameworks and platforms (React Native, Flutter, Swift, Kotlin)
- Enable automated validation and quality gates with real tool integration
- Reduce context-switching overhead for domain-specific tasks
- Improve accuracy and efficiency of mobile-specific operations
- Support app store deployment workflows with specialized tooling
- Enhance mobile testing, security, and performance optimization capabilities

---

## Skills Backlog

### SK-001: React Native Development Skill
**Slug**: `react-native-dev`
**Category**: Cross-Platform Development

**Description**: Deep integration with React Native ecosystem for cross-platform mobile development.

**Capabilities**:
- Execute React Native CLI commands and Expo CLI operations
- Generate and validate React Native components with TypeScript
- Analyze Metro bundler output and resolve build issues
- Configure React Navigation with type-safe routing
- Implement Redux Toolkit or Zustand state management patterns
- Debug React Native performance with Flipper and Reactotron
- Handle native module linking and pod installation
- Configure and execute Jest tests with React Native Testing Library

**Process Integration**:
- react-native-app-setup.js
- cross-platform-ui-library.js
- mobile-testing-strategy.js
- mobile-performance-optimization.js

**Dependencies**: React Native CLI, Expo CLI, Node.js, npm/yarn

---

### SK-002: Flutter/Dart Skill
**Slug**: `flutter-dart`
**Category**: Cross-Platform Development

**Description**: Specialized skill for Flutter app development and Dart programming.

**Capabilities**:
- Execute Flutter CLI commands (create, run, build, test)
- Generate and validate Dart code with null safety
- Analyze Flutter widget trees and render performance
- Configure state management (Bloc, Provider, Riverpod)
- Implement GoRouter or AutoRoute navigation
- Debug with Flutter DevTools and performance overlay
- Generate code with Freezed and JsonSerializable
- Run flutter analyze and fix linting issues
- Execute widget tests and integration tests

**Process Integration**:
- flutter-app-scaffolding.js
- cross-platform-ui-library.js
- mobile-testing-strategy.js
- mobile-performance-optimization.js

**Dependencies**: Flutter SDK, Dart SDK, Android SDK, Xcode

---

### SK-003: Swift/SwiftUI Skill
**Slug**: `swift-swiftui`
**Category**: Native iOS Development

**Description**: Expert skill for native iOS development with Swift and SwiftUI.

**Capabilities**:
- Generate SwiftUI views with proper state management
- Implement @State, @Binding, @ObservedObject, @StateObject patterns
- Configure NavigationStack and TabView navigation
- Implement Combine reactive patterns
- Generate and validate Swift package dependencies
- Run xcodebuild commands for building and archiving
- Configure code signing with automatic or manual profiles
- Execute XCTest unit and UI tests
- Analyze Instruments profiling data

**Process Integration**:
- swiftui-app-development.js
- ios-core-data-implementation.js
- ios-push-notifications.js
- ios-appstore-submission.js
- mobile-accessibility-implementation.js

**Dependencies**: Xcode, Swift, macOS

---

### SK-004: Kotlin/Jetpack Compose Skill
**Slug**: `kotlin-compose`
**Category**: Native Android Development

**Description**: Expert skill for native Android development with Kotlin and Jetpack Compose.

**Capabilities**:
- Generate Jetpack Compose composables with Material Design 3
- Implement state hoisting and ViewModel integration
- Configure Compose Navigation with type-safe arguments
- Generate Kotlin data classes and sealed classes
- Implement Kotlin Coroutines and Flow patterns
- Run Gradle commands for Android builds
- Configure KSP/KAPT annotation processing
- Execute JUnit tests and Compose UI tests
- Analyze Android Studio profiler data
- Debug recomposition issues with Layout Inspector

**Process Integration**:
- jetpack-compose-ui.js
- android-room-database.js
- firebase-cloud-messaging.js
- android-playstore-publishing.js

**Dependencies**: Android Studio, Android SDK, Gradle, Kotlin

---

### SK-005: Core Data/Realm Skill
**Slug**: `ios-persistence`
**Category**: iOS Data Storage

**Description**: Specialized skill for iOS local data persistence solutions.

**Capabilities**:
- Design and generate Core Data models (.xcdatamodel)
- Generate NSManagedObject subclasses
- Implement fetch requests, predicates, and sorting
- Configure Core Data migrations (lightweight and manual)
- Set up NSPersistentCloudKitContainer for iCloud sync
- Implement Realm Swift schema and migrations
- Configure background contexts and batch operations
- Debug Core Data performance issues

**Process Integration**:
- ios-core-data-implementation.js
- offline-first-architecture.js
- mobile-security-implementation.js

**Dependencies**: Xcode, Core Data Framework, Realm SDK

---

### SK-006: Room Database Skill
**Slug**: `android-room`
**Category**: Android Data Storage

**Description**: Expert skill for Android Room persistence library.

**Capabilities**:
- Generate Room entities, DAOs, and database classes
- Write complex @Query annotations with SQL
- Implement TypeConverters for custom types
- Configure Room database migrations
- Set up Flow/LiveData return types for reactive queries
- Integrate with Hilt dependency injection
- Test with in-memory database
- Analyze Room query performance

**Process Integration**:
- android-room-database.js
- offline-first-architecture.js
- mobile-security-implementation.js

**Dependencies**: Android Studio, Room library, Kotlin

---

### SK-007: Push Notifications Skill
**Slug**: `push-notifications`
**Category**: Mobile Notifications

**Description**: Multi-platform push notification implementation expertise.

**Capabilities**:
- Configure APNs certificates and keys
- Set up Firebase Cloud Messaging (FCM)
- Implement UNUserNotificationCenter for iOS
- Configure Android notification channels
- Generate rich notification payloads
- Implement deep linking from notifications
- Handle background notification processing
- Test push notifications with simulators and devices
- Debug notification delivery issues

**Process Integration**:
- ios-push-notifications.js
- firebase-cloud-messaging.js
- firebase-backend-integration.js

**Dependencies**: APNs, FCM, Xcode, Android Studio

---

### SK-008: Fastlane/Mobile CI-CD Skill
**Slug**: `fastlane-cicd`
**Category**: Mobile DevOps

**Description**: Automated mobile build, test, and deployment with Fastlane.

**Capabilities**:
- Generate Fastfile with lanes for iOS and Android
- Configure Fastlane Match for iOS code signing
- Set up Fastlane Snapshot for automated screenshots
- Configure Fastlane Deliver for App Store submissions
- Set up Fastlane Supply for Play Store uploads
- Integrate with GitHub Actions, Bitrise, CircleCI
- Generate Appfile and Matchfile configurations
- Implement version number automation
- Configure beta distribution (TestFlight, Firebase App Distribution)

**Process Integration**:
- mobile-cicd-fastlane.js
- automated-release-management.js
- ios-appstore-submission.js
- android-playstore-publishing.js
- beta-testing-setup.js

**Dependencies**: Fastlane, Ruby, Bundler

---

### SK-009: App Store Connect Skill
**Slug**: `app-store-connect`
**Category**: iOS Distribution

**Description**: Apple App Store submission and management expertise.

**Capabilities**:
- Interact with App Store Connect API
- Generate and validate app metadata
- Create and manage provisioning profiles
- Upload builds via Transporter or altool
- Configure in-app purchases and subscriptions
- Set up TestFlight beta distribution
- Manage app versions and releases
- Track review status and respond to rejections
- Generate App Privacy questionnaire responses

**Process Integration**:
- ios-appstore-submission.js
- beta-testing-setup.js
- app-store-optimization.js
- automated-release-management.js

**Dependencies**: App Store Connect API, Xcode, Transporter

---

### SK-010: Google Play Console Skill
**Slug**: `google-play-console`
**Category**: Android Distribution

**Description**: Google Play Store publishing and management expertise.

**Capabilities**:
- Interact with Google Play Developer API
- Generate and validate store listing metadata
- Upload AAB (Android App Bundle) files
- Configure release tracks (internal, alpha, beta, production)
- Set up staged rollouts and rollback
- Manage data safety declarations
- Configure in-app billing products
- Generate content rating questionnaire responses
- Track pre-launch report results

**Process Integration**:
- android-playstore-publishing.js
- beta-testing-setup.js
- app-store-optimization.js
- automated-release-management.js

**Dependencies**: Google Play Developer API, Google Cloud credentials

---

### SK-011: Mobile Testing Frameworks Skill
**Slug**: `mobile-testing`
**Category**: Quality Assurance

**Description**: Comprehensive mobile testing framework expertise.

**Capabilities**:
- Configure and execute Detox E2E tests
- Set up and run Maestro flows
- Execute XCUITest on iOS
- Run Espresso tests on Android
- Configure Appium for cross-platform testing
- Generate snapshot tests for UI components
- Set up device farm testing (AWS Device Farm, Firebase Test Lab)
- Analyze test coverage reports
- Mock native modules and APIs

**Process Integration**:
- mobile-testing-strategy.js
- mobile-accessibility-implementation.js
- mobile-security-implementation.js

**Dependencies**: Detox, Maestro, XCTest, Espresso, Appium

---

### SK-012: Mobile Analytics Skill
**Slug**: `mobile-analytics`
**Category**: Analytics & Monitoring

**Description**: Mobile app analytics and crash reporting integration.

**Capabilities**:
- Configure Firebase Analytics events and user properties
- Set up Firebase Crashlytics with custom keys
- Implement Mixpanel or Amplitude tracking
- Configure Segment data routing
- Generate analytics event schemas
- Set up conversion funnels and retention cohorts
- Configure crash alerting thresholds
- Analyze user behavior patterns
- Implement A/B testing with Firebase Remote Config

**Process Integration**:
- mobile-analytics-setup.js
- firebase-backend-integration.js
- mobile-performance-optimization.js

**Dependencies**: Firebase, Mixpanel, Amplitude, Segment SDKs

---

### SK-013: Deep Linking Skill
**Slug**: `deep-linking`
**Category**: Navigation & Routing

**Description**: Universal links and deep linking implementation.

**Capabilities**:
- Configure iOS Universal Links with AASA file
- Set up Android App Links with assetlinks.json
- Implement custom URL schemes
- Configure branch.io or Adjust deep linking
- Generate and validate deep link routing
- Implement deferred deep linking
- Debug deep link handling with simulators
- Test deep link attribution

**Process Integration**:
- firebase-cloud-messaging.js
- ios-push-notifications.js
- mobile-cicd-fastlane.js
- rest-api-integration.js

**Dependencies**: Branch.io, Adjust, Firebase Dynamic Links

---

### SK-014: Mobile Offline Storage Skill
**Slug**: `offline-storage`
**Category**: Data Persistence

**Description**: Cross-platform offline-first data management.

**Capabilities**:
- Configure WatermelonDB for React Native
- Set up Realm for cross-platform persistence
- Implement MMKV for fast key-value storage
- Configure AsyncStorage migration to newer solutions
- Design sync queue architectures
- Implement conflict resolution strategies
- Set up background sync with iOS Background Fetch
- Configure Android WorkManager for background tasks
- Test offline scenarios systematically

**Process Integration**:
- offline-first-architecture.js
- rest-api-integration.js
- graphql-apollo-integration.js
- firebase-backend-integration.js

**Dependencies**: WatermelonDB, Realm, MMKV, SQLite

---

### SK-015: Mobile Security Skill
**Slug**: `mobile-security`
**Category**: Security

**Description**: Mobile application security implementation.

**Capabilities**:
- Configure iOS Keychain Services for secure storage
- Set up Android Keystore for cryptographic operations
- Implement certificate pinning (TrustKit, OkHttp)
- Configure biometric authentication (Face ID, Touch ID, Fingerprint)
- Implement jailbreak/root detection
- Set up code obfuscation (ProGuard/R8, Swiftshield)
- Generate secure random tokens and encryption keys
- Analyze OWASP MASVS compliance
- Configure app transport security (ATS) policies

**Process Integration**:
- mobile-security-implementation.js
- secrets-management (cross-specialization)
- ios-appstore-submission.js

**Dependencies**: Keychain, Keystore, TrustKit, OWASP tools

---

### SK-016: Lottie Animation Skill
**Slug**: `lottie-animations`
**Category**: UI/UX

**Description**: Lottie animation integration across platforms.

**Capabilities**:
- Import and validate Lottie JSON files
- Configure lottie-react-native integration
- Set up lottie-ios and lottie-android
- Implement animation playback controls
- Optimize animation performance and file size
- Convert After Effects compositions
- Implement interactive animations with gestures
- Cache and preload animations

**Process Integration**:
- mobile-animation-design.js
- cross-platform-ui-library.js
- responsive-mobile-layout.js

**Dependencies**: Lottie libraries, After Effects (optional)

---

### SK-017: GraphQL Mobile Skill
**Slug**: `graphql-mobile`
**Category**: API Integration

**Description**: GraphQL client integration for mobile applications.

**Capabilities**:
- Configure Apollo Client for React Native
- Set up graphql_flutter for Flutter apps
- Implement Apollo iOS and Apollo Android
- Generate type-safe code from GraphQL schemas
- Configure normalized caching strategies
- Implement optimistic UI updates
- Set up GraphQL subscriptions for real-time data
- Handle authentication with GraphQL operations
- Debug with Apollo DevTools

**Process Integration**:
- graphql-apollo-integration.js
- offline-first-architecture.js
- mobile-performance-optimization.js

**Dependencies**: Apollo Client, graphql-codegen, GraphQL

---

### SK-018: Firebase Mobile Skill
**Slug**: `firebase-mobile`
**Category**: Backend Services

**Description**: Firebase backend services integration for mobile apps.

**Capabilities**:
- Configure Firebase project setup (iOS/Android)
- Implement Firebase Authentication methods
- Set up Cloud Firestore with security rules
- Configure Firebase Storage for media uploads
- Implement Firebase Cloud Functions triggers
- Set up Firebase Remote Config for feature flags
- Configure Firebase Performance Monitoring
- Integrate Firebase A/B Testing
- Debug with Firebase Emulator Suite

**Process Integration**:
- firebase-backend-integration.js
- firebase-cloud-messaging.js
- mobile-analytics-setup.js

**Dependencies**: Firebase SDK, Firebase CLI

---

### SK-019: Accessibility Testing Skill
**Slug**: `a11y-mobile`
**Category**: Accessibility

**Description**: Mobile accessibility testing and implementation.

**Capabilities**:
- Run iOS Accessibility Inspector audits
- Execute Android Accessibility Scanner
- Validate VoiceOver/TalkBack compatibility
- Test dynamic type and font scaling
- Verify color contrast ratios (WCAG compliance)
- Implement accessibility labels and hints
- Test keyboard navigation on iPadOS
- Generate accessibility compliance reports
- Configure reduced motion preferences

**Process Integration**:
- mobile-accessibility-implementation.js
- mobile-testing-strategy.js
- cross-platform-ui-library.js

**Dependencies**: Accessibility Inspector, Accessibility Scanner

---

### SK-020: Mobile Performance Profiling Skill
**Slug**: `mobile-perf`
**Category**: Performance

**Description**: Mobile app performance analysis and optimization.

**Capabilities**:
- Profile with Xcode Instruments (Time Profiler, Allocations)
- Analyze with Android Profiler (CPU, Memory, Network)
- Debug React Native with Flipper Performance plugin
- Use Flutter DevTools Performance view
- Identify memory leaks and retain cycles
- Analyze frame drops and jank
- Profile network request waterfall
- Measure app launch time cold/warm start
- Generate performance benchmark reports

**Process Integration**:
- mobile-performance-optimization.js
- mobile-testing-strategy.js
- jetpack-compose-ui.js
- swiftui-app-development.js

**Dependencies**: Xcode Instruments, Android Profiler, Flipper, DevTools

---

---

## Agents Backlog

### AG-001: React Native Expert Agent
**Slug**: `react-native-expert`
**Category**: Cross-Platform Development

**Description**: Specialized agent with deep React Native and JavaScript/TypeScript mobile expertise.

**Expertise Areas**:
- React Native architecture patterns (feature-based, layer-based)
- Performance optimization (Hermes, JSI, TurboModules)
- Native module development and bridging
- React Navigation advanced patterns
- State management architecture decisions
- Expo vs bare workflow trade-offs
- Cross-platform code sharing strategies

**Persona**:
- Role: Senior React Native Engineer
- Experience: 6+ years mobile development, 4+ years React Native
- Background: JavaScript ecosystem expert, some native experience

**Process Integration**:
- react-native-app-setup.js (all phases)
- cross-platform-ui-library.js (React Native components)
- mobile-performance-optimization.js (RN optimization)
- mobile-testing-strategy.js (Jest, Detox)

---

### AG-002: Flutter Expert Agent
**Slug**: `flutter-expert`
**Category**: Cross-Platform Development

**Description**: Specialized agent for Flutter and Dart development.

**Expertise Areas**:
- Flutter architecture patterns (Clean Architecture, MVVM)
- State management comparison (Bloc vs Provider vs Riverpod)
- Custom widget development and composition
- Platform channels and method channels
- Flutter performance optimization
- Dart best practices and null safety
- Flutter for web and desktop considerations

**Persona**:
- Role: Senior Flutter Developer
- Experience: 5+ years mobile, 3+ years Flutter
- Background: Strong OOP principles, mobile UI expertise

**Process Integration**:
- flutter-app-scaffolding.js (all phases)
- cross-platform-ui-library.js (Flutter widgets)
- mobile-performance-optimization.js (Flutter optimization)
- mobile-testing-strategy.js (widget tests)

---

### AG-003: iOS Native Expert Agent
**Slug**: `ios-native-expert`
**Category**: Native iOS Development

**Description**: Expert iOS developer with Swift and SwiftUI mastery.

**Expertise Areas**:
- SwiftUI architecture and data flow
- UIKit integration and interoperability
- Core Data advanced patterns
- iOS performance optimization with Instruments
- Apple Human Interface Guidelines expertise
- App Store submission best practices
- iOS security and Keychain Services
- Combine framework reactive patterns

**Persona**:
- Role: Senior iOS Engineer
- Experience: 8+ years iOS development
- Background: Objective-C to Swift transition, Apple platform expert

**Process Integration**:
- swiftui-app-development.js (all phases)
- ios-core-data-implementation.js (all phases)
- ios-push-notifications.js (APNs expertise)
- ios-appstore-submission.js (all phases)

---

### AG-004: Android Native Expert Agent
**Slug**: `android-native-expert`
**Category**: Native Android Development

**Description**: Expert Android developer with Kotlin and Jetpack mastery.

**Expertise Areas**:
- Jetpack Compose best practices
- Modern Android architecture (MVVM, MVI)
- Room and data persistence patterns
- Android performance optimization
- Material Design 3 implementation
- Play Store submission expertise
- Android security best practices
- Kotlin Coroutines and Flow patterns

**Persona**:
- Role: Senior Android Engineer
- Experience: 7+ years Android development
- Background: Java to Kotlin migration, Google ecosystem expert

**Process Integration**:
- jetpack-compose-ui.js (all phases)
- android-room-database.js (all phases)
- firebase-cloud-messaging.js (Android focus)
- android-playstore-publishing.js (all phases)

---

### AG-005: Mobile DevOps Agent
**Slug**: `mobile-devops`
**Category**: CI/CD and Release

**Description**: Mobile CI/CD and release automation specialist.

**Expertise Areas**:
- Fastlane configuration and optimization
- iOS code signing and provisioning
- Android signing key management
- CI/CD platform integration (GitHub Actions, Bitrise, CircleCI)
- Automated testing in CI pipelines
- Beta distribution workflows
- Release train management
- Staged rollouts and feature flags

**Persona**:
- Role: Mobile DevOps Engineer
- Experience: 5+ years DevOps, 3+ years mobile focus
- Background: Both iOS and Android build systems

**Process Integration**:
- mobile-cicd-fastlane.js (all phases)
- automated-release-management.js (all phases)
- beta-testing-setup.js (distribution setup)
- ios-appstore-submission.js (build automation)
- android-playstore-publishing.js (build automation)

---

### AG-006: Mobile QA Engineer Agent
**Slug**: `mobile-qa-expert`
**Category**: Quality Assurance

**Description**: Mobile testing and quality assurance specialist.

**Expertise Areas**:
- Mobile test strategy design
- E2E test framework selection (Detox, Maestro, Appium)
- Test automation architecture
- Device farm utilization
- Performance testing methodologies
- Accessibility testing compliance
- Security testing for mobile
- Manual testing checklist design

**Persona**:
- Role: Senior Mobile QA Engineer
- Experience: 6+ years QA, 4+ years mobile testing
- Background: Both automated and manual testing expertise

**Process Integration**:
- mobile-testing-strategy.js (all phases)
- mobile-accessibility-implementation.js (testing phases)
- mobile-security-implementation.js (security testing)
- mobile-performance-optimization.js (perf testing)

---

### AG-007: Mobile Security Engineer Agent
**Slug**: `mobile-security-expert`
**Category**: Security

**Description**: Mobile application security specialist.

**Expertise Areas**:
- OWASP Mobile Top 10 vulnerabilities
- iOS and Android secure storage patterns
- Certificate pinning implementation
- Biometric authentication integration
- Jailbreak/root detection strategies
- Code obfuscation techniques
- Mobile penetration testing
- Compliance requirements (HIPAA, PCI-DSS for mobile)

**Persona**:
- Role: Mobile Security Engineer
- Experience: 6+ years security, 4+ years mobile security
- Background: Penetration testing, secure development

**Process Integration**:
- mobile-security-implementation.js (all phases)
- ios-appstore-submission.js (security review)
- android-playstore-publishing.js (data safety)

---

### AG-008: Mobile UX Engineer Agent
**Slug**: `mobile-ux-engineer`
**Category**: UI/UX Implementation

**Description**: Mobile user experience implementation specialist.

**Expertise Areas**:
- Mobile design system implementation
- Cross-platform UI consistency
- Animation and micro-interaction design
- Responsive layout strategies
- Accessibility implementation
- Platform-specific design patterns (HIG, Material)
- Performance-conscious UI development
- Design-to-code translation

**Persona**:
- Role: Senior Mobile UX Engineer
- Experience: 6+ years frontend, 4+ years mobile
- Background: Design systems, animation, accessibility

**Process Integration**:
- mobile-animation-design.js (all phases)
- responsive-mobile-layout.js (all phases)
- mobile-accessibility-implementation.js (implementation)
- cross-platform-ui-library.js (component design)

---

### AG-009: App Store Optimization Agent
**Slug**: `aso-expert`
**Category**: Marketing & Distribution

**Description**: App Store Optimization and mobile growth specialist.

**Expertise Areas**:
- ASO keyword research and optimization
- Screenshot and preview video strategy
- Localization for app stores
- A/B testing store listings
- Review and rating management
- Competitor analysis
- Conversion rate optimization
- App Store and Play Store algorithm understanding

**Persona**:
- Role: ASO Specialist / Mobile Growth Manager
- Experience: 5+ years mobile marketing
- Background: Data-driven marketing, mobile analytics

**Process Integration**:
- app-store-optimization.js (all phases)
- ios-appstore-submission.js (metadata optimization)
- android-playstore-publishing.js (listing optimization)
- beta-testing-setup.js (beta feedback analysis)

---

### AG-010: Backend Integration Agent
**Slug**: `mobile-backend-expert`
**Category**: API Integration

**Description**: Mobile-backend integration and API specialist.

**Expertise Areas**:
- REST API client architecture
- GraphQL mobile implementation
- Firebase/BaaS integration patterns
- Offline-first data synchronization
- Authentication and token management
- API caching strategies
- Network error handling
- Real-time data with WebSockets

**Persona**:
- Role: Senior Full-Stack Mobile Engineer
- Experience: 7+ years development, strong backend
- Background: API design, distributed systems

**Process Integration**:
- rest-api-integration.js (all phases)
- graphql-apollo-integration.js (all phases)
- firebase-backend-integration.js (all phases)
- offline-first-architecture.js (sync strategies)

---

---

## Process-to-Skill/Agent Mapping

| Process File | Primary Skills | Primary Agents |
|-------------|---------------|----------------|
| react-native-app-setup.js | SK-001, SK-014 | AG-001 |
| flutter-app-scaffolding.js | SK-002 | AG-002 |
| cross-platform-ui-library.js | SK-001, SK-002, SK-016 | AG-001, AG-002, AG-008 |
| swiftui-app-development.js | SK-003, SK-020 | AG-003 |
| ios-core-data-implementation.js | SK-003, SK-005 | AG-003 |
| ios-push-notifications.js | SK-003, SK-007, SK-013 | AG-003 |
| jetpack-compose-ui.js | SK-004, SK-020 | AG-004 |
| android-room-database.js | SK-004, SK-006 | AG-004 |
| firebase-cloud-messaging.js | SK-004, SK-007, SK-018 | AG-004 |
| mobile-cicd-fastlane.js | SK-008, SK-009, SK-010 | AG-005 |
| ios-appstore-submission.js | SK-008, SK-009 | AG-003, AG-005, AG-009 |
| android-playstore-publishing.js | SK-008, SK-010 | AG-004, AG-005, AG-009 |
| app-store-optimization.js | SK-009, SK-010 | AG-009 |
| beta-testing-setup.js | SK-008, SK-009, SK-010 | AG-005, AG-006 |
| mobile-testing-strategy.js | SK-011, SK-019 | AG-006 |
| mobile-security-implementation.js | SK-015 | AG-007 |
| mobile-performance-optimization.js | SK-020 | AG-001, AG-002, AG-006 |
| mobile-animation-design.js | SK-016 | AG-008 |
| responsive-mobile-layout.js | SK-016 | AG-008 |
| mobile-accessibility-implementation.js | SK-019 | AG-006, AG-008 |
| rest-api-integration.js | SK-014, SK-017 | AG-010 |
| graphql-apollo-integration.js | SK-017 | AG-010 |
| firebase-backend-integration.js | SK-018 | AG-010 |
| offline-first-architecture.js | SK-005, SK-006, SK-014 | AG-010 |
| mobile-analytics-setup.js | SK-012, SK-018 | AG-005, AG-006 |
| automated-release-management.js | SK-008, SK-009, SK-010 | AG-005 |

---

## Shared Candidates

These skills and agents are strong candidates for extraction to a shared library as they apply across multiple specializations.

### Shared Skills

| ID | Skill | Potential Shared Specializations |
|----|-------|----------------------------------|
| SK-008 | Fastlane/Mobile CI-CD | DevOps/SRE, QA Testing |
| SK-011 | Mobile Testing Frameworks | QA Testing Automation |
| SK-012 | Mobile Analytics | Data Science, Product Analytics |
| SK-013 | Deep Linking | Web Development (PWA) |
| SK-015 | Mobile Security | Security Engineering |
| SK-017 | GraphQL Mobile | Web Development, Backend |
| SK-018 | Firebase Mobile | Web Development, Backend |
| SK-019 | Accessibility Testing | Web Development, UX/UI Design |

### Shared Agents

| ID | Agent | Potential Shared Specializations |
|----|-------|----------------------------------|
| AG-005 | Mobile DevOps | DevOps/SRE/Platform |
| AG-006 | Mobile QA Engineer | QA Testing Automation |
| AG-007 | Mobile Security Engineer | Security Engineering |
| AG-009 | App Store Optimization | Digital Marketing |
| AG-010 | Backend Integration | Backend Development, API Design |

---

## Implementation Priority

### Phase 1: Core Platform Skills (High Impact)
1. **SK-001**: React Native Development - Most popular cross-platform framework
2. **SK-003**: Swift/SwiftUI - Essential for iOS native
3. **SK-004**: Kotlin/Jetpack Compose - Essential for Android native
4. **SK-008**: Fastlane/Mobile CI-CD - Universal deployment need

### Phase 2: Core Platform Agents (High Impact)
1. **AG-001**: React Native Expert - High process coverage
2. **AG-003**: iOS Native Expert - Critical for iOS processes
3. **AG-004**: Android Native Expert - Critical for Android processes
4. **AG-005**: Mobile DevOps - Cross-cutting release concern

### Phase 3: Cross-Platform & Testing
1. **SK-002**: Flutter/Dart - Growing framework adoption
2. **SK-011**: Mobile Testing Frameworks - Quality assurance
3. **AG-002**: Flutter Expert - Framework coverage
4. **AG-006**: Mobile QA Engineer - Quality processes

### Phase 4: Data & Backend Integration
1. **SK-005**: Core Data/Realm - iOS persistence
2. **SK-006**: Room Database - Android persistence
3. **SK-014**: Mobile Offline Storage - Cross-platform
4. **SK-017**: GraphQL Mobile - Modern API patterns
5. **SK-018**: Firebase Mobile - Popular BaaS
6. **AG-010**: Backend Integration - API processes

### Phase 5: Distribution & Optimization
1. **SK-009**: App Store Connect - iOS distribution
2. **SK-010**: Google Play Console - Android distribution
3. **SK-012**: Mobile Analytics - Monitoring
4. **SK-020**: Mobile Performance Profiling - Optimization
5. **AG-009**: ASO Expert - Store optimization

### Phase 6: Security & UX
1. **SK-007**: Push Notifications - Engagement
2. **SK-013**: Deep Linking - Navigation
3. **SK-015**: Mobile Security - Protection
4. **SK-016**: Lottie Animation - Polish
5. **SK-019**: Accessibility Testing - Compliance
6. **AG-007**: Mobile Security Engineer - Security audit
7. **AG-008**: Mobile UX Engineer - UI polish

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Skills Identified | 20 |
| Agents Identified | 10 |
| Shared Skill Candidates | 8 |
| Shared Agent Candidates | 5 |
| Total Processes Covered | 26 |

---

**Created**: 2026-01-24
**Version**: 1.0.0
**Status**: Phase 4 - Skills and Agents Identified
**Next Step**: Phase 5 - Implement specialized skills and agents
