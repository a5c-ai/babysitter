---
name: wcag
description: WCAG 2.1/2.2 compliance, auditing, and remediation.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# WCAG Skill

Expert assistance for WCAG accessibility compliance.

## Capabilities

- Audit for WCAG compliance
- Implement WCAG criteria
- Remediate issues
- Test accessibility
- Document compliance

## WCAG Principles (POUR)

- **Perceivable**: Text alternatives, captions, adaptable
- **Operable**: Keyboard accessible, enough time, navigable
- **Understandable**: Readable, predictable, input assistance
- **Robust**: Compatible with assistive technologies

## Common Fixes

```tsx
// Images
<img src="photo.jpg" alt="Descriptive text" />

// Forms
<label htmlFor="email">Email</label>
<input id="email" type="email" aria-describedby="email-help" />
<span id="email-help">We'll never share your email</span>

// Focus management
<button ref={focusRef} tabIndex={-1}>Focused after action</button>
```

## Target Processes

- accessibility-audit
- wcag-compliance
- remediation
