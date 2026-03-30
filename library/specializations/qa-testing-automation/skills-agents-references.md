# QA, Testing, and Test Automation - Skills, Agents, and MCP References

This document provides curated references to community-created Claude skills, agents, plugins, and MCP (Model Context Protocol) servers that align with the skills and agents identified in the QA/Testing backlog. These resources can accelerate implementation and provide production-ready integrations.

---

## Table of Contents

1. [Overview](#overview)
2. [E2E Testing Resources](#e2e-testing-resources)
3. [Unit/Integration Testing Resources](#unitintegration-testing-resources)
4. [API Testing Resources](#api-testing-resources)
5. [Performance Testing Resources](#performance-testing-resources)
6. [Visual Regression Testing Resources](#visual-regression-testing-resources)
7. [Accessibility Testing Resources](#accessibility-testing-resources)
8. [Contract Testing Resources](#contract-testing-resources)
9. [Security Testing Resources](#security-testing-resources)
10. [Mobile Testing Resources](#mobile-testing-resources)
11. [Test Data Generation Resources](#test-data-generation-resources)
12. [Test Environment Resources](#test-environment-resources)
13. [Test Reporting Resources](#test-reporting-resources)
14. [BDD/Cucumber Resources](#bddcucumber-resources)
15. [Code Coverage Resources](#code-coverage-resources)
16. [General Testing Skills](#general-testing-skills)
17. [Curated Collections](#curated-collections)
18. [Summary](#summary)

---

## Overview

### Purpose
This reference document maps community resources to the skills and agents identified in `skills-agents-backlog.md`. Each section corresponds to a skill or agent category and provides:
- MCP Servers for tool integration
- Claude Skills for workflow automation
- GitHub repositories with relevant implementations
- Documentation and tutorials

### Resource Types
- **MCP Server**: Model Context Protocol servers enabling Claude to interact with external tools
- **Claude Skill**: Markdown-based skill definitions for Claude Code
- **Plugin**: Claude Code plugins providing extended functionality
- **Repository**: GitHub repositories with relevant implementations or examples

---

## E2E Testing Resources

### SK-001: Playwright E2E Testing

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| **Microsoft Playwright MCP (Official)** | MCP Server | https://github.com/microsoft/playwright-mcp | Official Microsoft Playwright MCP server, enabling LLMs to interact with web pages through structured accessibility snapshots |
| **executeautomation/mcp-playwright** | MCP Server | https://github.com/executeautomation/mcp-playwright | Tool to automate browsers and APIs in Claude Desktop, Cline, Cursor IDE |
| **Playwright MCP Docs** | Documentation | https://executeautomation.github.io/mcp-playwright/docs/intro | Comprehensive documentation for Playwright MCP Server |
| **playwright-skill** | Claude Skill | https://github.com/lackeyjb/playwright-skill | Model-invoked Playwright automation for testing and validating web applications |
| **webapp-testing** | Claude Skill | https://github.com/anthropics/skills/tree/main/skills/webapp-testing | Official Anthropic skill for testing local web applications using Playwright |
| **Automata-Labs-team/MCP-Server-Playwright** | MCP Server | https://github.com/Automata-Labs-team/MCP-Server-Playwright | MCP server for browser automation using Playwright |

**Related Articles:**
- [Playwright MCP Claude Code Guide](https://testomat.io/blog/playwright-mcp-claude-code/) - Comprehensive setup and usage guide
- [Testing with Playwright and Claude Code](https://nikiforovall.blog/ai/2025/09/06/playwright-claude-code-testing.html) - Practical testing workflows
- [Using Playwright MCP with Claude Code](https://til.simonwillison.net/claude-code/playwright-mcp-claude-code) - Simon Willison's tutorial

---

### SK-002: Cypress E2E Testing

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| **Cypress Fundamentals Skill** | Claude Skill | https://mcpmarket.com/tools/skills/cypress-fundamentals | Empowers Claude to architect comprehensive E2E testing suites with Cypress |

**Related Articles:**
- [E2E Testing with Claude Code](https://shipyard.build/blog/e2e-testing-claude-code/) - TDD approach for E2E testing with Cypress

---

### SK-003: Selenium WebDriver

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| **angiejones/mcp-selenium** | MCP Server | https://github.com/angiejones/mcp-selenium | MCP implementation for Selenium WebDriver by Angie Jones |
| **PhungXuanAnh/selenium-mcp-server** | MCP Server | https://github.com/PhungXuanAnh/selenium-mcp-server | Python MCP server providing web automation through Selenium WebDriver |
| **naveenanimation20/selenium-mcp** | MCP Server | https://github.com/naveenanimation20/selenium-mcp | Selenium MCP by Naveen Automation Labs |
| **themindmod/selenium-mcp-server** | MCP Server | https://github.com/themindmod/selenium-mcp-server | Alternative Selenium MCP server implementation |
| **brutalzinn/simple-mcp-selenium** | MCP Server | https://github.com/brutalzinn/simple-mcp-selenium | Simple MCP Selenium server for controlling browsers with natural language |

**Related Articles:**
- [Supercharging Selenium with MCP Server and Claude AI](https://anandhik.medium.com/supercharging-selenium-with-mcp-server-and-claude-ai-42d7e269555a) - Integration guide

---

### Browser Automation (General)

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| **browserbase/mcp-server-browserbase** | MCP Server | https://github.com/browserbase/mcp-server-browserbase | Cloud-based browser automation for web navigation and data extraction |
| **browsermcp/mcp** | MCP Server | https://github.com/browsermcp/mcp | Automate your local Chrome browser |
| **serkan-ozal/browser-devtools-mcp** | MCP Server | https://github.com/serkan-ozal/browser-devtools-mcp | Enables AI assistants to test, debug, and validate web applications |
| **freema/firefox-devtools-mcp** | MCP Server | https://github.com/freema/firefox-devtools-mcp | Firefox browser automation via WebDriver BiDi |
| **co-browser/browser-use-mcp-server** | MCP Server | https://github.com/co-browser/browser-use-mcp-server | browser-use packaged as MCP server with Docker support |

---

## Unit/Integration Testing Resources

### SK-004: Jest Testing

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| **Automated Unit Test Generator** | Claude Skill | https://mcpmarket.com/tools/skills/automated-unit-test-generator-2 | Generates robust unit tests by analyzing code, detecting frameworks like Jest, pytest, JUnit |
| **Vitest Unit Testing Skill** | Claude Skill | https://github.com/ThamJiaHe/claude-prompt-engineering-guide/blob/main/skills/examples/vitest-unit-testing-skill.md | Unit testing skill compatible with Claude Opus 4.5 and Claude Code v2.x |

**Related Articles:**
- [Test-Driven Development with Claude Code](https://stevekinney.com/courses/ai-development/test-driven-development-with-claude) - TDD course with Jest examples
- [How to Generate Unit Tests with Claude Code Plugin](https://skywork.ai/blog/how-to-generate-documentation-unit-tests-claude-code-plugin/) - Unit test generation guide

---

### SK-005: pytest Testing

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| **pytest-test Skill** | Claude Skill | https://mcpmarket.com/tools/skills/python-testing-with-pytest | Automates generation and execution of pytest suites with fixtures, parametrization, and mocking |

---

## API Testing Resources

### SK-006: API Testing (REST/GraphQL)

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| **mcp-rest-api** | MCP Server | https://github.com/dkmaker/mcp-rest-api | TypeScript-based MCP server for testing REST APIs through Claude |
| **API Tester MCP** | MCP Server | https://mcpservers.org/servers/github-com-kirti676-apitestermcp | Supports OpenAPI/Swagger, Postman collections, GraphQL schemas with test generation |
| **mcp-graphql** | MCP Server | https://github.com/blurrah/mcp-graphql | Model Context Protocol server for GraphQL |
| **Apollo MCP Server** | MCP Server | https://github.com/apollographql/apollo-mcp-server | Exposes GraphQL operations as MCP tools for AI models |
| **GitHub GraphQL MCP Server** | MCP Server | https://github.com/QuentinCody/github-graphql-mcp-server | MCP server for GitHub's GraphQL API |

**Related Articles:**
- [Getting Started with Apollo MCP Server](https://www.apollographql.com/blog/getting-started-with-apollo-mcp-server-for-any-graphql-api) - Apollo GraphQL integration guide
- [Integrate GraphQL APIs with Claude AI](https://mcpmarket.com/server/graphql-1) - GraphQL integration tutorial

---

## Performance Testing Resources

### SK-007: k6 Performance Testing

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| **QAInsights/k6-mcp-server** | MCP Server | https://github.com/QAInsights/k6-mcp-server | k6 MCP server for running load tests through LLM clients |
| **oleiade/k6-mcp** | MCP Server | https://github.com/oleiade/k6-mcp | Experimental MCP server for k6 |
| **k6 Load Testing MCP** | MCP Server | https://playbooks.com/mcp/qainsights-k6-load-testing | k6 load testing integration for AI agents |

---

### SK-008: JMeter Performance Testing

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| **ebadAhmed10/jmeter-mcp** | MCP Server | https://glama.ai/mcp/servers/@ebadAhmed10/jmeter-mcp | JMeter MCP Server for AI-driven performance testing |
| **JMeter MCP Server** | MCP Server | https://playbooks.com/mcp/qainsights-jmeter | Execute JMeter tests and analyze results through MCP clients |

**Related Articles:**
- [JMeter MCP Server Guide](https://skywork.ai/skypage/en/jmeter-ai-performance-testing/1981556767218307072) - Performance testing with AI

---

## Visual Regression Testing Resources

### SK-009: Percy Visual Testing

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| **BrowserStack Percy MCP** | MCP Server | https://www.browserstack.com/docs/browserstack-mcp-server/tools/percy | Run Percy visual tests with BrowserStack MCP server |

**Related Articles:**
- [Visual Regression Testing: Percy vs Chromatic vs BackstopJS](https://medium.com/@sohail_saifi/visual-regression-testing-percy-vs-chromatic-vs-backstopjs-0291477a23ef) - Comparison guide

---

### SK-010: BackstopJS Visual Testing

*No dedicated MCP server found. Consider using Playwright MCP with visual comparison libraries.*

**Related Resources:**
- [BackstopJS Official Repository](https://github.com/garris/BackstopJS) - Open-source visual regression testing
- [Visual Regression Testing with BackstopJS](https://www.morpht.com/blog/visual-regression-testing-backstopjs-win) - Implementation guide

---

## Accessibility Testing Resources

### SK-011: axe-core Accessibility Testing

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| **ronantakizawa/a11ymcp** | MCP Server | https://github.com/ronantakizawa/a11ymcp | Verified MCP Server for Web Accessibility Testing (~5000+ downloads) |
| **priyankark/a11y-mcp** | MCP Server | https://github.com/priyankark/a11y-mcp | MCP server for accessibility audits using axe-core |
| **PashaBoiko/playwright-axe-mcp** | MCP Server | https://glama.ai/mcp/servers/@PashaBoiko/playwright-axe-mcp | Playwright Accessibility Testing MCP Server |
| **mcp-accessibility-scanner** | MCP Server | https://playbooks.com/mcp/justasmonkev/mcp-accessibility-scanner | Accessibility scanner using Playwright and Axe-core |
| **Deque axe MCP Server** | MCP Server | https://www.deque.com/blog/a-closer-look-at-axe-mcp-server/ | Official Deque axe MCP Server |

**Related Articles:**
- [A11y MCP for Web Accessibility Testing](https://medium.com/@ronantech/a11y-mcp-an-mcp-server-for-web-accessibility-testing-e5aeeb322af3) - Setup and usage guide
- [AI-Powered Accessibility Deep Dive](https://skywork.ai/skypage/en/ai-accessibility-mcp-servers/1979090626584813568) - A11y MCP servers overview

---

## Contract Testing Resources

### SK-012: Pact Contract Testing

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| **PactFlow MCP Server** | MCP Server | https://pactflow.io/blog/pactflow-mcp-server/ | AI-powered contract testing in your IDE with PactFlow |

**Related Articles:**
- [PactFlow MCP Server Announcement](https://pactflow.io/blog/pactflow-mcp-server/) - Official PactFlow MCP introduction
- [Best Contract Testing Tools of 2026](https://www.testsprite.com/use-cases/en/the-best-contract-testing-tools) - Contract testing comparison

---

## Security Testing Resources

### SK-017: OWASP ZAP Security Testing

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| **dtkmn/mcp-zap-server** | MCP Server | https://github.com/dtkmn/mcp-zap-server | Spring Boot app exposing OWASP ZAP as MCP server for spider, active scan, OpenAPI import, reports |
| **ajtazer/ZAP-MCP** | MCP Server | https://github.com/ajtazer/ZAP-MCP | Python-based OWASP ZAP MCP integration |
| **ZAP-MCP** | MCP Server | https://mcp.so/server/ZAP-MCP | Model Context Protocol for OWASP ZAP |

**Related Articles:**
- [OWASP ZAP MCP Server Deep Dive](https://skywork.ai/skypage/en/ai-security-owasp-zap-mcp/1981276589861765120) - Security testing with AI
- [A Security Engineer's Guide to MCP](https://semgrep.dev/blog/2025/a-security-engineers-guide-to-mcp/) - Security considerations for MCP

---

## Mobile Testing Resources

### SK-016: Appium Mobile Testing

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| **appium/appium-mcp** | MCP Server | https://github.com/appium/appium-mcp | Official Appium MCP on Steroids |
| **Rahulec08/appium-mcp** | MCP Server | https://github.com/Rahulec08/appium-mcp | AI-powered mobile automation with visual element detection |
| **appium-mcp (npm)** | MCP Server | https://www.npmjs.com/package/appium-mcp | NPM package for Appium MCP |
| **mcp-appium-visual** | MCP Server | https://socket.dev/npm/package/mcp-appium-visual | MCP Server for Appium with visual recovery capabilities |
| **mobile-testing Skill** | Claude Skill | https://claude-plugins.dev/skills/@proffesor-for-testing/agentic-qe/mobile-testing | Mobile testing skill for Claude |
| **mobile-app-tester Skill** | Claude Skill | https://claude-plugins.dev/skills/@jeremylongshore/claude-code-plugins-plus/mobile-app-tester | Automating mobile app testing |

**Alternative:**
| **Maestro MCP** | MCP Server | https://glama.ai/mcp/servers/@mobile-dev-inc/Maestro | UI testing framework for Mobile and Web |

**Related Articles:**
- [Appium MCP for Mobile App QA Testing](https://www.getpanto.ai/blog/appium-mcp-for-mobile-app-qa-testing) - Mobile testing guide
- [Creating AI Agent to Control Smartphone](https://dev.to/tiagodanin/creating-an-ai-agent-in-claude-code-to-control-my-smartphone-1e3e) - Mobile automation tutorial

---

## Test Data Generation Resources

### SK-015: Test Data Generation

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| **funsjanssen/faker-mcp** | MCP Server | https://github.com/funsjanssen/faker-mcp | MCP server for generating fake/mock data using Faker.js |

**Features:**
- Basic data generation (person, company)
- Structured datasets with referential integrity
- Custom patterns (regex, enum, format, range)
- Multi-locale support (English, French, German, Spanish, Japanese)
- Reproducible seed-based generation
- High performance (1000+ records/second)

---

## Test Environment Resources

### SK-020: Docker Test Environments

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| **QuantGeekDev/docker-mcp** | MCP Server | https://github.com/QuantGeekDev/docker-mcp | Docker MCP Server for container management |
| **Docker MCP Toolkit** | Tool | https://www.docker.com/blog/connect-mcp-servers-to-claude-desktop-with-mcp-toolkit/ | Official Docker MCP Toolkit |
| **MCP Docker Server** | MCP Server | https://williajm.github.io/mcp_docker/ | MCP server for Docker management with AI assistants |
| **Docker Hub MCP Server** | MCP Server | https://www.docker.com/blog/introducing-docker-hub-mcp-server/ | Official Docker Hub MCP Server |

**Related Articles:**
- [MCP with Docker](https://www.docker.com/blog/the-model-context-protocol-simplifying-building-ai-apps-with-anthropic-claude-desktop-and-docker/) - Docker and MCP integration
- [Add MCP Servers to Claude Code with MCP Toolkit](https://www.docker.com/blog/add-mcp-servers-to-claude-code-with-mcp-toolkit/) - Setup guide
- [Docker MCP Catalog](https://www.docker.com/blog/docker-mcp-catalog-secure-way-to-discover-and-run-mcp-servers/) - Discover and run MCP servers

---

## Test Reporting Resources

### SK-018: Allure Reporting

*No dedicated MCP server found for Allure.*

**Related Resources:**
- [Allure Framework](https://github.com/allure-framework) - Official Allure repository
- Visual testing tools with Allure support integrate screen diffs in reports

---

## BDD/Cucumber Resources

### SK-019: Cucumber BDD Testing

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| **Cucumber Best Practices Skill** | Claude Skill | https://mcpmarket.com/tools/skills/cucumber-best-practices-for-claude-code | Expert BDD consultant for writing Cucumber scenarios and Gherkin steps |
| **Gherkin Acceptance Criteria Skill** | Claude Skill | https://mcpmarket.com/tools/skills/gherkin-acceptance-criteria | Generates structured Gherkin acceptance criteria using Given-When-Then syntax |
| **BDD Scenarios Skill** | Claude Skill | https://mcpmarket.com/tools/skills/bdd-scenario-builder | Write high-quality Gherkin specifications that are human-readable and test-ready |
| **Playwright BDD + MCP Template** | MCP Server | https://lobehub.com/mcp/nexusadobo-generative-automation-testing | Playwright-BDD with MCP for AI-powered test generation |

**Related Articles:**
- [Building Modern Test Automation: API + Playwright + BDD + Cucumber + MCP](https://medium.com/@pachanihardik37/building-a-modern-test-automation-framework-api-playwright-bdd-cucumber-mcp-2137426afedf) - Comprehensive framework guide
- [AI for Better BDD](https://www.humanizingwork.com/ai-for-better-bdd/) - Using AI to improve BDD practices

---

## Code Coverage Resources

### SK-013: Code Coverage

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| **SonarQube MCP Server** | MCP Server | https://github.com/SonarSource/sonarqube-mcp-server | Official SonarQube MCP Server for code quality and coverage |
| **SonarQube MCP** | MCP Server | https://playbooks.com/mcp/sapientpants-sonarqube | SonarQube integration for AI agents |

**Related Articles:**
- [Announcing SonarQube MCP Server](https://www.sonarsource.com/blog/announcing-sonarqube-mcp-server/) - Official announcement
- [AI Code Assurance with SonarQube](https://nljug.org/foojay/%F0%9F%9A%80-the-future-is-now-ai-code-assurance-and-mcp-with-sonarqube-part-4/) - SonarQube and MCP integration guide
- [SonarQube MCP Server VS Code Docs](https://docs.sonarsource.com/sonarqube-for-vs-code/ai-capabilities/sonarqube-mcp-server) - VS Code integration

---

## General Testing Skills

### Test-Driven Development

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| **Test-Driven Development Skill** | Claude Skill | https://github.com/obra/superpowers/tree/main/skills/test-driven-development | Use when implementing features or bugfixes before writing implementation code |
| **pypict-claude-skill** | Claude Skill | https://github.com/omkaral/pypict-claude-skill | Generates optimized test suites using pairwise combinatorial testing |
| **Integration Test Runner** | Claude Skill | https://mcpmarket.com/tools/skills/integration-test-runner | Run integration tests from Claude Code |

### Testing Framework (MCP Testing)

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| **haakco/mcp-testing-framework** | MCP Server | https://github.com/haakco/mcp-testing-framework | Comprehensive testing framework for MCP servers with automated test generation |

---

## Curated Collections

### Awesome Lists

| Resource | URL | Description |
|----------|-----|-------------|
| **Awesome MCP Servers** | https://github.com/punkpeye/awesome-mcp-servers | Curated list of production-ready MCP servers |
| **Awesome MCP Servers (hireblackout)** | https://github.com/hireblackout/awesome-mcp-servers | Comprehensive list with rankings from GitHub, Reddit |
| **Awesome Claude Skills** | https://github.com/travisvn/awesome-claude-skills | Curated list of Claude Skills and resources |
| **Awesome Claude Skills (VoltAgent)** | https://github.com/VoltAgent/awesome-claude-skills | Collection of Claude Skills |
| **Awesome Claude Skills (Composio)** | https://github.com/ComposioHQ/awesome-claude-skills | Skills for customizing Claude AI workflows |
| **Awesome Claude Code Plugins** | https://github.com/ccplugins/awesome-claude-code-plugins | Custom plugins for Claude Code |
| **MCP Awesome Directory** | https://mcp-awesome.com/ | 1200+ quality-verified MCP servers |
| **Official MCP Servers** | https://github.com/modelcontextprotocol/servers | Model Context Protocol Servers repository |

### Plugin Directories

| Resource | URL | Description |
|----------|-----|-------------|
| **MCP Market** | https://mcpmarket.com/ | Marketplace for MCP servers and Claude skills |
| **MCP Servers Directory** | https://mcpservers.org/ | Searchable MCP server directory |
| **Docker MCP Catalog** | https://www.docker.com/blog/docker-mcp-catalog-secure-way-to-discover-and-run-mcp-servers/ | Docker's MCP server catalog |
| **LobeHub MCP** | https://lobehub.com/mcp | MCP server collection |
| **Glama MCP** | https://glama.ai/mcp/servers | MCP server listings |
| **Playbooks MCP** | https://playbooks.com/mcp | MCP server integrations |

---

## Claude Code Plugins (ccplugins)

These plugins from the awesome-claude-code-plugins repository are relevant for QA/Testing:

| Plugin | Description |
|--------|-------------|
| **api-tester** | API testing capabilities |
| **bug-detective** | Bug identification and detection |
| **code-review** | Code review automation |
| **code-review-assistant** | Assisted code review functionality |
| **code-reviewer** | Automated code review analysis |
| **database-performance-optimizer** | Database performance testing and optimization |
| **debug-session** | Debugging session management |
| **debugger** | Interactive debugging tool |
| **double-check** | Verification and validation |
| **optimize** | Code optimization |
| **performance-benchmarker** | Performance benchmarking and metrics |
| **test-file** | Test file generation and management |
| **test-results-analyzer** | Test result analysis |
| **test-writer-fixer** | Test writing and repair |
| **unit-test-generator** | Automated unit test creation |

Source: https://github.com/ccplugins/awesome-claude-code-plugins

---

## Summary

### Statistics

| Category | Resources Found |
|----------|-----------------|
| E2E Testing (Playwright) | 9 |
| E2E Testing (Cypress) | 1 |
| E2E Testing (Selenium) | 6 |
| Browser Automation (General) | 5 |
| Unit/Integration Testing | 3 |
| API Testing (REST/GraphQL) | 5 |
| Performance Testing (k6) | 3 |
| Performance Testing (JMeter) | 2 |
| Visual Regression Testing | 1 |
| Accessibility Testing | 5 |
| Contract Testing | 1 |
| Security Testing (OWASP ZAP) | 3 |
| Mobile Testing (Appium) | 6 |
| Test Data Generation | 1 |
| Test Environment (Docker) | 4 |
| BDD/Cucumber | 4 |
| Code Coverage (SonarQube) | 2 |
| General Testing Skills | 3 |
| ccplugins Testing Plugins | 15 |
| Curated Collections | 14 |
| **Total References** | **88** |

### Coverage Analysis

| Backlog Item | Coverage Status |
|--------------|-----------------|
| SK-001: Playwright E2E | Excellent - Multiple MCP servers and skills |
| SK-002: Cypress E2E | Limited - One skill found |
| SK-003: Selenium WebDriver | Good - Multiple MCP servers |
| SK-004: Jest Testing | Moderate - General unit test skills |
| SK-005: pytest Testing | Moderate - Dedicated skill available |
| SK-006: API Testing | Good - REST and GraphQL MCP servers |
| SK-007: k6 Performance | Good - Dedicated MCP servers |
| SK-008: JMeter Performance | Good - Dedicated MCP servers |
| SK-009: Percy Visual | Limited - BrowserStack integration |
| SK-010: BackstopJS Visual | None - No dedicated MCP found |
| SK-011: axe Accessibility | Excellent - Multiple MCP servers |
| SK-012: Pact Contracts | Limited - PactFlow MCP available |
| SK-013: Code Coverage | Moderate - SonarQube integration |
| SK-014: Stryker Mutation | None - No dedicated MCP found |
| SK-015: Test Data Generation | Limited - Faker.js MCP available |
| SK-016: Appium Mobile | Good - Multiple MCP servers |
| SK-017: OWASP ZAP Security | Good - Multiple MCP servers |
| SK-018: Allure Reporting | None - No dedicated MCP found |
| SK-019: Cucumber BDD | Good - Multiple skills available |
| SK-020: Docker Test Environments | Good - Multiple MCP servers |

### Recommendations

1. **Immediate Adoption**: Playwright MCP, k6 MCP, OWASP ZAP MCP, Appium MCP, and axe accessibility MCP servers are production-ready and should be prioritized for integration.

2. **Skill Development Needed**: BackstopJS visual testing, Stryker mutation testing, and Allure reporting lack dedicated MCP servers - consider developing custom integrations.

3. **Framework Gaps**: Cypress and Jest have limited dedicated tooling - the general-purpose unit test generator and webapp-testing skills may suffice initially.

4. **SonarQube Integration**: Provides comprehensive code quality and coverage analysis - recommended as the primary coverage tool integration.

---

**Created**: 2026-01-24
**Version**: 1.0.0
**Status**: Phase 5 - Skills and Agents References Compiled
**Next Step**: Phase 6 - Implement priority integrations based on coverage analysis
