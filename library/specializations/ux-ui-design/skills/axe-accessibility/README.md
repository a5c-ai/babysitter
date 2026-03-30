# Axe Accessibility Skill

## Overview

The `axe-accessibility` skill provides automated accessibility testing using the axe-core engine. It enables comprehensive WCAG compliance validation, violation reporting, and actionable remediation guidance for web applications and components.

## Quick Start

### Prerequisites

1. **Node.js** - Version 18 or higher
2. **Browser Automation** - Playwright, Puppeteer, or Cypress
3. **axe-core packages** - `@axe-core/playwright` or similar
4. **Optional MCP Server** - Enhanced capabilities with A11y MCP

### Installation

The skill is included in the babysitter-sdk. Install dependencies:

```bash
# Using Playwright (recommended)
npm install @axe-core/playwright playwright

# Using Puppeteer
npm install @axe-core/puppeteer puppeteer

# Using Cypress
npm install cypress-axe axe-core
```

To add MCP server integration:

```bash
# Option 1: A11y MCP
npm install a11y-mcp

# Option 2: Via Claude MCP
claude mcp add a11y -- npx a11y-mcp
```

## Usage

### Basic Operations

```bash
# Run accessibility scan on a URL
/skill axe-accessibility scan --url https://example.com --level AA

# Scan with specific tags
/skill axe-accessibility scan --url https://example.com --tags wcag2aa,wcag21aa

# Generate HTML report
/skill axe-accessibility report --url https://example.com --format html --output a11y-report.html

# Scan multiple pages
/skill axe-accessibility scan-sitemap --sitemap https://example.com/sitemap.xml --level AA
```

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(axeAccessibilityTask, {
  operation: 'scan',
  url: 'https://example.com',
  wcagLevel: 'AA',
  includeRules: ['color-contrast', 'label', 'image-alt'],
  generateReport: true
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **WCAG Scanning** | Validate Level A, AA, AAA compliance |
| **Violation Reporting** | Detailed reports with impact levels |
| **Code Fix Suggestions** | Actionable remediation guidance |
| **Debt Tracking** | Track and prioritize accessibility debt |
| **CI/CD Integration** | Automated testing in pipelines |
| **Component Testing** | Test isolated UI components |

## Examples

### Example 1: Full Page Accessibility Audit

```bash
# Comprehensive audit with all WCAG 2.1 AA rules
/skill axe-accessibility audit \
  --url https://example.com \
  --level AA \
  --include-best-practices \
  --output-format json,html \
  --screenshot-violations
```

### Example 2: Component Library Validation

```javascript
// Test all Storybook components
const components = await getStorybookComponents();
const results = [];

for (const component of components) {
  const result = await ctx.task(axeAccessibilityTask, {
    operation: 'scan-component',
    componentUrl: component.url,
    wcagLevel: 'AA'
  });
  results.push({ component: component.name, ...result });
}
```

### Example 3: CI/CD Pipeline Integration

```yaml
# GitHub Actions workflow
jobs:
  accessibility:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install dependencies
        run: npm ci
      - name: Run accessibility tests
        run: |
          /skill axe-accessibility scan \
            --url http://localhost:3000 \
            --level AA \
            --fail-on critical,serious \
            --output a11y-results.json
      - name: Upload results
        uses: actions/upload-artifact@v4
        with:
          name: accessibility-report
          path: a11y-results.json
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `AXE_WCAG_LEVEL` | Default WCAG compliance level | `AA` |
| `AXE_INCLUDE_BEST_PRACTICES` | Include best practice rules | `true` |
| `AXE_FAIL_THRESHOLD` | Impact level to fail builds | `serious` |

### Skill Configuration

```yaml
# .babysitter/skills/axe-accessibility.yaml
axe-accessibility:
  defaultLevel: AA
  includeRules:
    - color-contrast
    - label
    - image-alt
    - link-name
    - button-name
  excludeRules: []
  failOnImpact: serious
  generateHtmlReport: true
  screenshotViolations: true
  mcpServer:
    enabled: true
    provider: ronantakizawa
```

## Process Integration

### Processes Using This Skill

1. **accessibility-audit.js** - Comprehensive WCAG compliance auditing
2. **component-library.js** - Component accessibility validation
3. **responsive-design.js** - Responsive accessibility testing

### Example Process Integration

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const accessibilityAuditTask = defineTask({
  name: 'accessibility-audit',
  description: 'Run accessibility audit using axe-core',

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Accessibility Audit: ${inputs.url}`,
      skill: {
        name: 'axe-accessibility',
        context: {
          operation: 'audit',
          url: inputs.url,
          wcagLevel: inputs.level || 'AA',
          includeRules: inputs.rules,
          generateReport: true
        }
      },
      io: {
        inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
        outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
      }
    };
  }
});
```

## MCP Server Reference

### A11y MCP (ronantakizawa)

Primary MCP server for accessibility testing.

**Features:**
- axe-core integration
- Puppeteer browser automation
- WCAG compliance checking
- Violation reporting

**Installation:**
```bash
npm install a11y-mcp
claude mcp add a11y -- npx a11y-mcp
```

**GitHub:** https://github.com/priyankark/a11y-mcp

### Deque axe MCP Server

Enterprise-grade accessibility testing.

**Features:**
- Contextualized guidance
- Enterprise support
- Advanced reporting
- Rule customization

**Reference:** https://www.deque.com/blog/a-closer-look-at-axe-mcp-server/

## WCAG Reference

### Common Violations

| Rule ID | WCAG Criteria | Impact | Description |
|---------|---------------|--------|-------------|
| `color-contrast` | 1.4.3 | serious | Insufficient color contrast |
| `image-alt` | 1.1.1 | critical | Missing alt text on images |
| `label` | 1.3.1 | critical | Form inputs missing labels |
| `link-name` | 2.4.4 | serious | Links must have discernible text |
| `button-name` | 4.1.2 | critical | Buttons must have accessible names |

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `Page not loaded` | Increase timeout or wait for specific elements |
| `iframe not scanned` | Use `AxeBuilder.include('iframe')` |
| `Dynamic content missed` | Add explicit waits for content to load |
| `False positives` | Configure rule exclusions for known exceptions |

### Debug Mode

Enable verbose output for troubleshooting:

```bash
AXE_DEBUG=true /skill axe-accessibility scan --url https://example.com
```

## Related Skills

- **lighthouse** - Performance and accessibility scoring
- **screenshot-comparison** - Visual regression with accessibility annotations
- **contrast-checker** - Color contrast calculations

## References

- [axe-core Documentation](https://www.deque.com/axe/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [axe-core Rules](https://dequeuniversity.com/rules/axe/)
- [Playwright Accessibility Testing](https://playwright.dev/docs/accessibility-testing)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-UX-001
**Category:** Accessibility Testing
**Status:** Active
