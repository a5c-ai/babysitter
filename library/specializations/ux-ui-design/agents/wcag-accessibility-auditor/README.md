# WCAG Accessibility Auditor Agent

## Overview

The `wcag-accessibility-auditor` agent is a specialized AI agent embodying the expertise of a Senior Accessibility Consultant. It provides comprehensive WCAG 2.1/2.2 compliance validation, VPAT documentation, and detailed remediation guidance for web applications.

## Persona

| Attribute | Value |
|-----------|-------|
| **Role** | Senior Accessibility Consultant |
| **Experience** | 10+ years digital accessibility |
| **Certifications** | IAAP CPACC, WAS, CPWA equivalent |
| **Background** | Enterprise a11y programs, legal compliance |

## Expertise Areas

| Area | Capabilities |
|------|--------------|
| **WCAG Compliance** | Level A, AA, AAA success criteria |
| **Automated Testing** | axe-core, Lighthouse, WAVE integration |
| **Manual Testing** | Keyboard, screen reader, cognitive testing |
| **Documentation** | VPAT, ACR, conformance reports |
| **Remediation** | Prioritized fixes with code examples |
| **Legal Compliance** | ADA, Section 508, EN 301 549 |

## Usage

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(wcagAccessibilityAuditorTask, {
  agentName: 'wcag-accessibility-auditor',
  prompt: {
    role: 'Senior Accessibility Consultant',
    task: 'Conduct comprehensive WCAG 2.1 AA audit',
    context: {
      url: 'https://example.com',
      targetLevel: 'AA',
      scope: ['homepage', 'checkout', 'account']
    },
    instructions: [
      'Run automated accessibility scans',
      'Conduct manual keyboard testing',
      'Test with screen readers',
      'Document all findings',
      'Provide remediation guidance'
    ],
    outputFormat: 'JSON'
  }
});
```

### Direct Invocation

```bash
# Full WCAG audit
/agent wcag-accessibility-auditor audit \
  --url https://example.com \
  --level AA \
  --output report.json

# Generate VPAT document
/agent wcag-accessibility-auditor vpat \
  --url https://example.com \
  --product-name "Example App" \
  --version "2.0.0"

# Component accessibility review
/agent wcag-accessibility-auditor review-component \
  --component button \
  --html "<button class='btn'>Click me</button>"
```

## Common Tasks

### 1. Comprehensive WCAG Audit

The agent can conduct full accessibility audits:

```bash
/agent wcag-accessibility-auditor audit \
  --url https://example.com \
  --level AA \
  --include automated,keyboard,screenreader \
  --output-format json,html,vpat
```

Output includes:
- Automated scan results (axe-core)
- Keyboard testing findings
- Screen reader compatibility
- WCAG criteria conformance matrix
- Prioritized remediation plan

### 2. VPAT Generation

Generate Voluntary Product Accessibility Template:

```bash
/agent wcag-accessibility-auditor generate-vpat \
  --url https://example.com \
  --product-name "My Application" \
  --version "2.0.0" \
  --standards wcag21,section508
```

Output:
- Complete VPAT document
- Conformance levels for each criterion
- Supporting remarks and evidence
- Recommended remediation actions

### 3. Remediation Planning

Create prioritized remediation roadmap:

```bash
/agent wcag-accessibility-auditor remediation-plan \
  --audit-results audit.json \
  --priority-factors impact,effort,risk \
  --timeline 3-months
```

Output:
- Prioritized issue backlog
- Effort estimates per fix
- Suggested sprint allocations
- Code examples for fixes

### 4. Component Review

Review individual UI components:

```bash
/agent wcag-accessibility-auditor review-component \
  --component modal \
  --framework react \
  --code-path ./components/Modal.tsx
```

Output:
- ARIA pattern compliance
- Keyboard interaction review
- Focus management analysis
- Specific code recommendations

## Process Integration

### Processes Using This Agent

| Process | Agent Role |
|---------|------------|
| `accessibility-audit.js` | Full WCAG compliance auditing |
| `component-library.js` | Component accessibility validation |
| `responsive-design.js` | Responsive accessibility testing |

### Task Definition Example

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const accessibilityAuditTask = defineTask({
  name: 'accessibility-audit',
  description: 'Conduct WCAG accessibility audit',

  async run(inputs, taskCtx) {
    return {
      kind: 'agent',
      title: `WCAG ${inputs.level} Audit: ${inputs.url}`,
      agent: {
        name: 'wcag-accessibility-auditor',
        prompt: {
          role: 'Senior Accessibility Consultant',
          task: `Conduct comprehensive WCAG ${inputs.level} audit`,
          context: {
            url: inputs.url,
            targetLevel: inputs.level,
            scope: inputs.pages
          },
          instructions: [
            'Run axe-core automated scans',
            'Test keyboard navigation',
            'Verify screen reader compatibility',
            'Document all WCAG violations',
            'Provide prioritized remediation plan'
          ],
          outputFormat: 'JSON'
        },
        outputSchema: {
          type: 'object',
          required: ['conformanceLevel', 'violations', 'recommendations'],
          properties: {
            conformanceLevel: { type: 'string', enum: ['Full', 'Partial', 'None'] },
            violations: { type: 'array', items: { type: 'object' } },
            recommendations: { type: 'array', items: { type: 'object' } }
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

## Knowledge Base

### WCAG Quick Reference

| Level | Focus | Examples |
|-------|-------|----------|
| **A** | Essential | Alt text, keyboard access, no seizure triggers |
| **AA** | Standard | Color contrast, resize text, error identification |
| **AAA** | Enhanced | Sign language, extended audio descriptions |

### Common Violations

| Violation | Impact | WCAG | Quick Fix |
|-----------|--------|------|-----------|
| Missing alt text | Critical | 1.1.1 | Add descriptive `alt` attribute |
| Low contrast | Serious | 1.4.3 | Increase color contrast to 4.5:1 |
| Missing labels | Critical | 1.3.1 | Associate `<label>` with form field |
| Keyboard trap | Critical | 2.1.2 | Ensure focus can leave component |
| Missing focus | Serious | 2.4.7 | Add visible focus indicator |

### Testing Tools

| Tool | Type | Coverage |
|------|------|----------|
| axe-core | Automated | ~30% of issues |
| WAVE | Automated | Visual overlay |
| Lighthouse | Automated | Accessibility score |
| NVDA | Manual | Screen reader |
| VoiceOver | Manual | macOS/iOS SR |

## Interaction Guidelines

### What to Expect

- **Comprehensive analysis** with WCAG criteria mapping
- **Prioritized recommendations** based on impact
- **Code-level fixes** with before/after examples
- **Legal compliance context** (ADA, Section 508)

### Best Practices

1. Provide full page URL or component code
2. Specify target WCAG level (A, AA, AAA)
3. Include any known exceptions
4. Mention compliance requirements (Section 508, etc.)

## Related Resources

- [axe-accessibility skill](../skills/axe-accessibility/) - Automated testing
- [lighthouse skill](../skills/lighthouse/) - Performance and a11y scores
- [screen-reader-compatibility-agent](../agents/screen-reader-compatibility/) - AT testing

## References

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [WCAG 2.2 Guidelines](https://www.w3.org/TR/WCAG22/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Section 508 Standards](https://www.section508.gov/)
- [Deque University](https://dequeuniversity.com/)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** AG-UX-001
**Category:** Accessibility
**Status:** Active
