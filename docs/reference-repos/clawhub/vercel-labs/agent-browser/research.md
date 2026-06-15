# vercel-labs/agent-browser

- **Archetype**: utility-with-skill
- **Stars**: 28,819
- **Last pushed**: 2026-04-12
- **License**: Apache-2.0
- **Discovered**: 2026-04-12
- **Source**: ClawHub skills (published as "steipete/agent-browser")
- **Skills found**: 6 skills (agent-browser, dogfood, electron, slack, vercel-sandbox, agentcore)
- **Fork**: No

## Summary

Native Rust browser automation CLI by Vercel Labs, designed specifically for AI agents. Uses Chrome/Chromium via CDP directly (no Playwright/Puppeteer dependency). Provides accessibility-tree snapshots with element refs for reliable interaction. Supports sessions, auth vault, state persistence, and video recording.

The SKILL.md is a meta-skill that loads sub-skills dynamically via `agent-browser skills get <name>`. Sub-skills cover: core browser automation, exploratory testing/QA (dogfood), Electron desktop app automation (VS Code, Slack, Discord, Figma), Slack workspace automation, Vercel Sandbox microVMs, and AWS Bedrock AgentCore cloud browsers.

Published on ClawHub as "steipete/agent-browser" (~unnamed downloads). steipete (OpenClaw co-founder) appears to publish this as a ClawHub skill wrapping the Vercel Labs CLI.

## Assessment

HIGH extractable value. Browser automation is foundational for many processes. The dogfooding/QA skill is directly useful as a process. The Electron app automation pattern (controlling VS Code, Slack, etc.) is novel and high-value. The accessibility-tree-based interaction model is more reliable than CSS selectors.

**Extraction priority**: HIGH

# Extractable Value: vercel-labs/agent-browser

## Processes

### 1. Exploratory QA / Dogfooding Process
- **Source**: dogfood skill (exploratory testing, bug hunts, app quality review)
- **Placement**: `specializations/shared/exploratory-qa-dogfooding.js`
- **Description**: Process for systematic exploratory testing of web applications: navigate to target app -> take accessibility snapshot -> identify interactive elements -> exercise core user flows -> capture screenshots at each step -> report visual/functional issues -> verify responsive behavior. Uses breakpoints for tester to confirm found issues.

### 2. Web Data Extraction Pipeline
- **Source**: Core agent-browser skill (navigate, snapshot, extract)
- **Placement**: `specializations/shared/web-data-extraction.js`
- **Description**: Process for structured data extraction from websites: navigate to URL -> take accessibility snapshot -> identify data elements via refs -> extract structured data -> paginate/follow links -> aggregate results. Handles authentication via auth vault.

### 3. Cross-Browser Form Testing
- **Source**: Browser automation (fill_form, click, snapshot, evaluate)
- **Placement**: `specializations/shared/form-testing-automation.js`
- **Description**: Process for automated form testing: identify all form fields -> generate test cases (valid, invalid, edge cases) -> fill and submit -> capture responses -> verify validation messages -> report results. Breakpoint before destructive form submissions.

## Plugin Ideas

### 1. Browser Automation Plugin
- **Category**: Tools Integration
- **install.md**: Installs agent-browser CLI (npm global or brew), runs `agent-browser install` for Chrome download, configures auth vault for common sites. Provides babysitter tasks for browser operations (navigate, snapshot, click, fill, screenshot). Enables web-based verification steps in any process.

### 2. Visual Regression Testing Plugin
- **Category**: QA & Testing
- **install.md**: Combines agent-browser screenshots with image comparison. Captures baseline screenshots of web app pages, then on subsequent runs compares against baselines to detect visual regressions. Stores baselines in project's .a5c/visual-baselines/. Reports diffs with annotated images.

### 3. Electron App Automation Plugin
- **Category**: Tools Integration
- **install.md**: Configures agent-browser's Electron skill for desktop app automation. Supports controlling VS Code, Slack, Discord, Figma, Notion, Spotify via accessibility tree. Enables processes that span IDE + browser + messaging workflows.

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Exploratory QA / Dogfooding Process | NEW | Systematic exploratory testing with accessibility snapshots and core user flow exercise | - | specializations/shared/exploratory-qa-dogfooding.js |
| Web Data Extraction Pipeline | NEW | Structured data extraction from websites with accessibility tree navigation | - | specializations/shared/web-data-extraction.js |
| Cross-Browser Form Testing | NEW | Automated form testing with test case generation and validation verification | - | specializations/shared/cross-browser-form-testing.js |
| Accessibility-Tree Navigation | NEW | Web interaction via accessibility snapshots and element refs instead of CSS selectors | - | specializations/shared/accessibility-tree-navigation.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Browser Automation Integration | UPGRADE | Native browser automation beyond existing dev-browser plugin | plugins/a5c/marketplace/blueprints/dev-browser/ | plugins/a5c/marketplace/blueprints/browser-automation-integration/ |
| Visual Regression Testing | NEW | Screenshot-based visual regression testing with baseline comparison | - | plugins/a5c/marketplace/blueprints/visual-regression-testing/ |
| Electron App Automation | NEW | Desktop app automation for VS Code, Slack, Discord, Figma via accessibility tree | - | plugins/a5c/marketplace/blueprints/electron-app-automation/ |

## Implicit Procedural Knowledge

- **Accessibility-tree-based interaction**: Using accessibility snapshots with element refs instead of CSS selectors is more robust for agent interaction. This pattern should inform how babysitter tasks interact with web UIs.
- **Dynamic skill loading pattern**: The meta-SKILL.md that loads sub-skills via CLI (`agent-browser skills get <name>`) is a pattern for versioned, on-demand skill delivery. Skills ship with the CLI rather than as static markdown.
- **Auth vault pattern**: Persistent authentication state management for web sessions, avoiding re-login on each automation run. Relevant for any plugin that needs to maintain authenticated sessions.
