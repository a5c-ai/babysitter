# QA, Testing, and Test Automation References

## Testing Frameworks and Tools

### End-to-End (E2E) Testing Frameworks
- **Selenium** - Industry-standard browser automation framework, supports multiple languages (Java, Python, JavaScript, C#), WebDriver protocol, cross-browser testing
- **Cypress** - Modern JavaScript E2E testing framework, real-time reloading, automatic waiting, time-travel debugging, network traffic control
- **Playwright** - Microsoft's cross-browser automation, supports Chromium/Firefox/WebKit, parallel execution, auto-wait, headless/headed modes
- **Puppeteer** - Google's Node.js library for Chrome/Chromium automation, headless browser testing, performance profiling, PDF generation
- **WebdriverIO** - Next-gen browser and mobile automation, built on WebDriver protocol, supports Appium for mobile testing
- **TestCafe** - Node.js E2E testing, no WebDriver needed, automatic waiting, concurrent test execution

### Unit Testing Frameworks
- **Jest** - JavaScript testing framework by Meta, zero-config, snapshot testing, coverage reports, mocking capabilities, parallel test execution
- **JUnit** - Java unit testing framework, annotations-based, parameterized tests, test suites, widely integrated with CI/CD
- **pytest** - Python testing framework, simple assertions, fixtures, parameterization, extensive plugin ecosystem
- **Mocha** - Flexible JavaScript testing framework, asynchronous testing, browser and Node.js support, multiple assertion libraries
- **Jasmine** - Behavior-driven testing framework, no dependencies, clean syntax, spies and mocks
- **NUnit** - .NET testing framework, data-driven tests, parallel execution, rich assertions
- **RSpec** - Ruby BDD testing framework, expressive syntax, shared examples, custom matchers

### Integration Testing
- **Testcontainers** - Docker-based integration testing, disposable database/service containers, supports multiple languages
- **Spring Test** - Java/Spring framework integration testing, context caching, transaction management, MockMvc for web layer
- **Supertest** - HTTP assertion library for Node.js, API endpoint testing, chainable assertions
- **RestAssured** - Java library for REST API testing, fluent interface, JSONPath/XPath support, authentication handling

### Mobile Testing
- **Appium** - Cross-platform mobile automation, supports iOS/Android, WebDriver protocol, native/hybrid/web apps
- **Espresso** - Android UI testing framework by Google, fast and reliable, synchronization with UI thread
- **XCUITest** - Apple's UI testing framework for iOS, integration with Xcode, accessibility-based element finding
- **Detox** - Gray box E2E testing for React Native, synchronization with app, cross-platform support

## BDD/TDD Tools and Practices

### Behavior-Driven Development (BDD)
- **Cucumber** - BDD framework using Gherkin syntax, plain-text feature files, supports multiple languages, living documentation
- **SpecFlow** - BDD framework for .NET, Gherkin syntax, integration with Visual Studio, test report generation
- **Behave** - Python BDD framework, Gherkin syntax, step definitions, scenario outlines
- **JBehave** - Java BDD framework, story-based testing, dependency injection support

### Test-Driven Development (TDD)
- **Red-Green-Refactor cycle** - Write failing test, make it pass, refactor code
- **Test doubles** - Mocks, stubs, fakes, spies, dummies for isolation
- **Test coverage tools** - Istanbul/nyc (JavaScript), JaCoCo (Java), Coverage.py (Python)
- **Continuous testing** - Watch mode, automatic test execution on code changes

### Property-Based Testing
- **QuickCheck** - Haskell property-based testing, automatic test case generation
- **fast-check** - JavaScript property-based testing, shrinking capabilities, arbitrary data generation
- **Hypothesis** - Python property-based testing, example database, shrinking, stateful testing
- **JSVerify** - JavaScript property-based testing, inspired by QuickCheck

## Test Pyramids and Testing Strategies

### Testing Pyramid
- **Unit tests (base)** - Fast, isolated, abundant (70%), test individual components
- **Integration tests (middle)** - Moderate speed, test component interactions (20%)
- **E2E tests (top)** - Slow, expensive, comprehensive (10%), test user workflows
- **Balance principle** - More unit tests, fewer E2E tests for optimal speed and coverage

### Testing Trophy (Modern Approach)
- **Static analysis** - Linting, type checking, code analysis
- **Unit tests** - Component/function testing
- **Integration tests (emphasis)** - Most valuable tests, test component integration
- **E2E tests** - Critical user journeys only

### Testing Strategies
- **Smoke testing** - Verify critical functionality after deployment
- **Regression testing** - Ensure existing functionality still works after changes
- **Sanity testing** - Quick verification of specific functionality
- **Acceptance testing** - Verify system meets business requirements
- **Exploratory testing** - Unscripted testing to discover edge cases
- **Chaos testing** - Deliberately introduce failures to test resilience

## Performance Testing

### Load and Performance Testing Tools
- **JMeter** - Apache's open-source load testing tool, GUI/CLI modes, distributed testing, extensive protocol support (HTTP, JDBC, FTP, SOAP)
- **k6** - Modern load testing tool by Grafana Labs, JavaScript scripting, cloud/local execution, performance metrics, threshold assertions
- **Gatling** - Scala-based performance testing, high-performance engine, real-time monitoring, detailed reports
- **Locust** - Python-based load testing, distributed execution, web UI, user behavior simulation
- **Artillery** - Modern load testing toolkit, YAML/JSON scenarios, serverless testing, CI/CD integration

### Performance Testing Types
- **Load testing** - Test system behavior under expected load
- **Stress testing** - Push system beyond normal limits to find breaking point
- **Spike testing** - Sudden large increase in load
- **Soak testing** - Sustained load over extended period (memory leaks, degradation)
- **Scalability testing** - Verify system scales with increased load

### Performance Monitoring
- **Lighthouse** - Google's automated performance auditing, Core Web Vitals, accessibility checks
- **WebPageTest** - Web performance testing, waterfall charts, filmstrip view, multiple locations
- **New Relic** - Application performance monitoring (APM), real user monitoring, distributed tracing
- **Datadog** - Infrastructure and application monitoring, metrics, traces, logs

## Visual Regression Testing

### Visual Testing Tools
- **Percy** - Visual testing platform by BrowserStack, snapshot comparison, CI/CD integration, responsive testing
- **Applitools** - AI-powered visual testing, cross-browser testing, Visual AI for intelligent comparisons
- **BackstopJS** - Visual regression testing for web apps, responsive viewport testing, headless browser support
- **Chromatic** - Visual testing for Storybook, component snapshots, UI review workflow
- **Playwright Visual Comparisons** - Built-in screenshot comparison, pixel-by-pixel diffing
- **jest-image-snapshot** - Jest matcher for image comparison, threshold configuration

### Visual Testing Strategies
- **Baseline images** - Reference screenshots for comparison
- **Threshold tolerance** - Acceptable pixel difference percentage
- **Dynamic content handling** - Mask/ignore dynamic areas (dates, ads, animations)
- **Cross-browser testing** - Verify visual consistency across browsers
- **Responsive testing** - Multiple viewport sizes and orientations

## Mutation Testing

### Mutation Testing Tools
- **Stryker** - Mutation testing for JavaScript/TypeScript/C#, mutant types (arithmetic, logical, conditional), HTML reports
- **PIT (Pitest)** - Java mutation testing, byte-code manipulation, fast execution, IDE integration
- **mutmut** - Python mutation testing, simple CLI, parallel execution
- **Mutant** - Ruby mutation testing, integration with RSpec/Minitest

### Mutation Testing Concepts
- **Mutants** - Modified versions of code with small changes (e.g., + to -, == to !=)
- **Killed mutants** - Tests detect the mutation (good coverage)
- **Survived mutants** - Tests don't detect the mutation (weak coverage)
- **Mutation score** - Percentage of mutants killed, indicates test quality
- **Equivalent mutants** - Mutations that don't change behavior (false positives)

## Contract Testing

### Contract Testing Tools
- **Pact** - Consumer-driven contract testing, supports multiple languages, contract verification, provider states
- **Spring Cloud Contract** - JVM-based contract testing, stub generation, WireMock integration
- **Postman Contract Testing** - API contract validation using Postman collections

### Contract Testing Principles
- **Consumer-driven contracts** - Consumers define expectations of providers
- **Provider verification** - Providers verify they meet consumer contracts
- **Independent deployment** - Teams deploy services independently with confidence
- **Contract versioning** - Manage breaking changes through contract evolution

## Test Data Management

### Test Data Tools
- **Faker.js** - Generate realistic fake data, localization support, extensive data types
- **Factory Bot** - Ruby test data generation, associations, traits, sequences
- **Fixtures** - Static test data files (JSON, YAML, CSV)
- **Database seeding** - Populate test databases with known data
- **Snapshot testing** - Capture and compare data/UI state snapshots

### Test Data Strategies
- **Data builders** - Fluent APIs for creating test objects
- **Object mothers** - Factory methods for common test scenarios
- **Data anonymization** - Protect sensitive data in test environments
- **Synthetic data generation** - AI-generated realistic test data
- **Test data isolation** - Each test has independent data (no shared state)

## API Testing

### API Testing Tools
- **Postman** - API development and testing platform, collections, environments, automated testing, mock servers
- **Insomnia** - REST/GraphQL client, request chaining, code generation, plugin ecosystem
- **SoapUI** - API testing for REST/SOAP/GraphQL, data-driven testing, security testing
- **Newman** - Postman CLI runner, CI/CD integration, multiple reporters
- **Karate DSL** - API testing using Gherkin syntax, parallel execution, UI automation

### API Testing Strategies
- **Contract testing** - Verify API adheres to specification (OpenAPI, GraphQL schema)
- **Schema validation** - JSON Schema, GraphQL schema validation
- **Response time testing** - Performance assertions on API endpoints
- **Error handling** - Test error responses, status codes, error messages
- **Authentication testing** - OAuth, JWT, API keys, session management

## Accessibility (a11y) Testing

### Accessibility Testing Tools
- **axe-core** - Accessibility testing engine, rule-based violations detection, detailed reporting
- **Lighthouse** - Google's automated accessibility audits, WCAG compliance checks
- **Pa11y** - Automated accessibility testing, CI/CD integration, dashboard
- **WAVE** - Web accessibility evaluation tool, browser extension, visual feedback
- **aXe DevTools** - Browser extension for accessibility testing, intelligent guided tests

### Accessibility Standards
- **WCAG 2.1/2.2** - Web Content Accessibility Guidelines (A, AA, AAA levels)
- **Section 508** - U.S. federal accessibility requirements
- **ARIA** - Accessible Rich Internet Applications specifications
- **Keyboard navigation** - Tab order, focus management, keyboard shortcuts
- **Screen reader testing** - NVDA, JAWS, VoiceOver compatibility

## Security Testing

### Security Testing Tools
- **OWASP ZAP** - Web application security scanner, automated scanning, proxy mode, fuzzing
- **Burp Suite** - Web security testing platform, intercepting proxy, vulnerability scanning
- **Snyk** - Dependency vulnerability scanning, container scanning, infrastructure as code testing
- **SonarQube** - Static code analysis, security hotspots, code quality gates
- **npm audit / yarn audit** - JavaScript dependency vulnerability scanning

### Security Testing Types
- **SAST (Static Application Security Testing)** - Source code analysis for vulnerabilities
- **DAST (Dynamic Application Security Testing)** - Running application testing
- **Penetration testing** - Simulated attacks to find vulnerabilities
- **Dependency scanning** - Known vulnerabilities in third-party libraries
- **Secrets scanning** - Detect hardcoded credentials, API keys

## Test Reporting and Documentation

### Test Reporting Tools
- **Allure** - Test reporting framework, detailed reports, historical trends, integration with multiple frameworks
- **ReportPortal** - AI-powered test reporting, real-time analytics, defect triaging
- **Extent Reports** - HTML reporting for test automation, rich dashboards, logging
- **Mochawesome** - Mocha test reporter, HTML/JSON output, screenshots, custom data

### Test Documentation
- **Living documentation** - BDD feature files as executable specifications
- **Test plans** - Scope, approach, resources, schedule, risks
- **Test cases** - Detailed steps, expected results, preconditions
- **Defect reports** - Bug tracking with steps to reproduce, severity, priority
- **Test metrics** - Coverage, pass/fail rates, defect density, test velocity

## CI/CD Integration and Test Automation

### CI/CD Platforms
- **GitHub Actions** - Workflow automation, matrix builds, artifact storage, marketplace integrations
- **GitLab CI/CD** - Built-in pipelines, parallel jobs, environments, review apps
- **Jenkins** - Open-source automation server, extensive plugin ecosystem, distributed builds
- **CircleCI** - Cloud-native CI/CD, Docker support, parallel testing, orbs (reusable configs)
- **Azure DevOps** - Microsoft's DevOps platform, pipelines, test plans, artifact management

### Test Automation Best Practices
- **Parallel execution** - Run tests concurrently for faster feedback
- **Flaky test handling** - Retry mechanisms, isolation, deterministic tests
- **Test environment management** - Docker containers, ephemeral environments, infrastructure as code
- **Shift-left testing** - Test early in development cycle, unit tests in IDE
- **Test maintenance** - Refactor tests, remove obsolete tests, keep tests DRY

## Quality Metrics and KPIs

### Code Quality Metrics
- **Code coverage** - Line, branch, function coverage percentage
- **Test coverage** - Percentage of requirements covered by tests
- **Defect density** - Defects per lines of code or function points
- **Cyclomatic complexity** - Code complexity measure, maintainability indicator
- **Technical debt** - Code quality issues, maintainability cost

### Testing Metrics
- **Test execution time** - Total time to run test suites
- **Test pass rate** - Percentage of passing tests
- **Flakiness rate** - Percentage of flaky/unstable tests
- **Defect detection rate** - Defects found in testing vs production
- **Test automation ROI** - Time/cost savings from automation
- **Mean time to detect (MTTD)** - Average time to find defects
- **Mean time to resolve (MTTR)** - Average time to fix defects

## Specialized Testing Types

### Smoke and Sanity Testing
- **Build verification** - Quick tests to verify build stability
- **Critical path testing** - Core functionality validation
- **Deployment verification** - Post-deployment health checks

### Compatibility Testing
- **Cross-browser testing** - Chrome, Firefox, Safari, Edge compatibility
- **Cross-platform testing** - Windows, macOS, Linux compatibility
- **Device testing** - Mobile devices, tablets, different screen sizes
- **Browser versions** - Test against multiple browser versions

### Localization and Internationalization Testing
- **i18n testing** - Character encoding, text expansion, RTL languages
- **l10n testing** - Translations, date/time formats, currency, cultural considerations
- **Pseudo-localization** - Test UI with placeholder translations

## Reference Count
This document contains references to **150+ tools, frameworks, strategies, and practices** across testing frameworks (E2E, unit, integration, mobile), BDD/TDD tools, test pyramids, performance testing, visual regression, mutation testing, contract testing, test data management, API testing, accessibility testing, security testing, test reporting, CI/CD integration, quality metrics, and specialized testing types.
