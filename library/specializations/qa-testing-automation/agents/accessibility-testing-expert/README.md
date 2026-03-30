# Accessibility Testing Expert Agent

## Overview

The `accessibility-testing-expert` agent is a specialized AI agent embodying the expertise of an Accessibility Testing Specialist. It provides deep knowledge for WCAG compliance testing, screen reader validation, keyboard navigation, color contrast analysis, ARIA implementation review, and remediation guidance.

## Persona

| Attribute | Value |
|-----------|-------|
| **Role** | Accessibility Testing Specialist |
| **Experience** | 5+ years accessibility testing |
| **Certifications** | IAAP CPACC/WAS equivalent |
| **Background** | Assistive technology, inclusive design |

## Expertise Areas

| Area | Capabilities |
|------|--------------|
| **WCAG Compliance** | 2.0, 2.1, 2.2 testing (A, AA, AAA) |
| **Screen Readers** | NVDA, JAWS, VoiceOver testing |
| **Keyboard Navigation** | Tab order, focus, keyboard traps |
| **Color Contrast** | Contrast ratios, color blindness |
| **ARIA** | Implementation review, best practices |
| **Remediation** | Fix recommendations, code examples |

## Usage

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(a11yExpertTask, {
  agentName: 'accessibility-testing-expert',
  prompt: {
    role: 'Accessibility Testing Specialist',
    task: 'Perform WCAG 2.1 AA compliance audit',
    context: {
      url: 'https://example.com',
      pages: ['/', '/about', '/contact'],
      wcagLevel: 'AA'
    },
    instructions: [
      'Test all WCAG 2.1 Level AA criteria',
      'Identify violations with severity',
      'Provide remediation for each issue',
      'Recommend manual testing areas'
    ],
    outputFormat: 'JSON'
  }
});
```

### Direct Invocation

```bash
# Full accessibility audit
/agent accessibility-testing-expert audit \
  --url https://example.com \
  --wcag-level AA \
  --output-format report

# Test specific component
/agent accessibility-testing-expert test-component \
  --selector "#modal-dialog" \
  --focus keyboard,aria

# Get remediation advice
/agent accessibility-testing-expert remediate \
  --violation color-contrast \
  --context "nav links on dark background"
```

## Common Tasks

### 1. WCAG Compliance Audit

Comprehensive accessibility evaluation:

```bash
/agent accessibility-testing-expert audit \
  --url https://example.com \
  --pages "/,/about,/contact,/form" \
  --wcag-level AA \
  --include automated,manual-checklist
```

Output includes:
- Automated scan results
- Manual test checklist
- Prioritized violations
- Remediation guidance

### 2. Screen Reader Testing

Validate screen reader experience:

```bash
/agent accessibility-testing-expert screen-reader-test \
  --url https://example.com \
  --flow "login,navigate-to-dashboard,view-data"
```

### 3. Keyboard Navigation Review

Test keyboard accessibility:

```bash
/agent accessibility-testing-expert keyboard-test \
  --url https://example.com \
  --check tab-order,focus-visible,skip-links,traps
```

### 4. Component Accessibility Review

Review specific UI components:

```bash
/agent accessibility-testing-expert component-review \
  --component modal \
  --framework react \
  --include focus-trap,aria-attributes,keyboard
```

## Process Integration

### Processes Using This Agent

| Process | Agent Role |
|---------|------------|
| `accessibility-testing.js` | All a11y testing phases |
| `e2e-test-suite.js` | A11y integration in E2E |
| `quality-gates.js` | A11y compliance gates |
| `visual-regression.js` | A11y in visual testing |

### Task Definition Example

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const a11yAuditTask = defineTask({
  name: 'accessibility-audit',
  description: 'Run accessibility audit with expert agent',

  async run(inputs, taskCtx) {
    return {
      kind: 'agent',
      title: 'Accessibility Audit',
      agent: {
        name: 'accessibility-testing-expert',
        prompt: {
          role: 'Accessibility Testing Specialist',
          task: 'Perform comprehensive accessibility audit',
          context: {
            url: inputs.url,
            wcagLevel: inputs.wcagLevel || 'AA',
            scope: inputs.scope || 'full-page'
          },
          instructions: [
            'Run automated accessibility scans',
            'Identify WCAG violations',
            'Categorize by impact and WCAG criteria',
            'Provide specific remediation steps',
            'List required manual tests'
          ],
          outputFormat: 'JSON'
        },
        outputSchema: {
          type: 'object',
          required: ['violations', 'summary', 'manualTests'],
          properties: {
            violations: { type: 'array' },
            summary: { type: 'object' },
            manualTests: { type: 'array' }
          }
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

## WCAG Quick Reference

### Level A (Minimum)
- Text alternatives for images
- Captions for audio/video
- Information not conveyed by color alone
- Keyboard accessible
- No flashing content
- Page titles

### Level AA (Standard)
- Color contrast 4.5:1 (normal), 3:1 (large)
- Text resizable to 200%
- Multiple ways to find pages
- Focus visible
- Consistent navigation
- Error identification

### Level AAA (Enhanced)
- Color contrast 7:1 (normal), 4.5:1 (large)
- Sign language for video
- Extended audio descriptions
- No timing requirements
- No interruptions

## Impact Levels

| Impact | Priority | Response |
|--------|----------|----------|
| **Critical** | P1 | Users completely blocked |
| **Serious** | P2 | Major barriers |
| **Moderate** | P3 | Some difficulty |
| **Minor** | P4 | Inconvenience |

## Interaction Guidelines

### What to Expect

- **Detailed findings** with WCAG mapping
- **Prioritized issues** by impact
- **Code-level fixes** with examples
- **Manual test guidance**
- **Assistive technology insights**

### Best Practices

1. Provide specific pages/components to test
2. Specify WCAG conformance level target
3. Include user flows to validate
4. Mention any known issues
5. Share target user demographics

## Related Resources

- [axe-accessibility skill](../skills/axe-accessibility/) - Automated scanning
- [playwright-e2e skill](../skills/playwright-e2e/) - E2E with a11y
- [test-environment-expert agent](../agents/test-environment-expert/) - Test setup

## References

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM](https://webaim.org/)
- [Deque University](https://dequeuniversity.com/)
- [A11y Project](https://www.a11yproject.com/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** AG-008
**Category:** Accessibility Testing
**Status:** Active
