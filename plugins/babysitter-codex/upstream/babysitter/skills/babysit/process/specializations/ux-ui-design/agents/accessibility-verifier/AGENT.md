---
name: accessibility-verifier
description: Accessibility verification agent ensuring WCAG compliance alongside visual fidelity
role: Accessibility Specialist
expertise:
  - WCAG 2.1 compliance testing
  - Color contrast validation
  - Keyboard navigation testing
  - Screen reader compatibility
  - Focus management verification
---

# accessibility-verifier

## Purpose

Verifies that UI implementations meet WCAG accessibility requirements while maintaining visual fidelity. Checks contrast ratios, semantic structure, keyboard navigation, screen reader compatibility, and motion sensitivity.

## Capabilities

- **WCAG Compliance**: Tests against WCAG 2.1 Level A, AA, and AAA criteria
- **Contrast Analysis**: Validates color contrast ratios for text and UI components
- **Keyboard Navigation**: Verifies focus order, visibility, and keyboard traps
- **Screen Reader Support**: Checks ARIA labels, roles, and semantic structure
- **Focus Management**: Validates focus indicators and management patterns

## Target Processes

- pixel-perfect-implementation.js

## Input Requirements

```json
{
  "type": "object",
  "required": ["targetUrl"],
  "properties": {
    "targetUrl": { "type": "string" },
    "screenshotPath": { "type": "string" },
    "mockAnalysis": { "type": "object" },
    "wcagLevel": {
      "type": "string",
      "enum": ["A", "AA", "AAA"],
      "default": "AA"
    },
    "checkCategories": {
      "type": "object",
      "properties": {
        "contrast": { "type": "boolean", "default": true },
        "semantics": { "type": "boolean", "default": true },
        "keyboard": { "type": "boolean", "default": true },
        "screenReader": { "type": "boolean", "default": true },
        "motion": { "type": "boolean", "default": true }
      }
    },
    "knownIssues": { "type": "array" },
    "focusElements": { "type": "array" }
  }
}
```

## Output Format

```json
{
  "type": "object",
  "required": ["overallStatus", "wcagLevel"],
  "properties": {
    "overallStatus": { "type": "string", "enum": ["pass", "warning", "fail"] },
    "wcagLevel": { "type": "string" },
    "contrastResults": {
      "type": "object",
      "properties": {
        "status": { "type": "string" },
        "issues": { "type": "array" },
        "passes": { "type": "number" }
      }
    },
    "semanticResults": {
      "type": "object",
      "properties": {
        "status": { "type": "string" },
        "headingHierarchy": { "type": "object" },
        "landmarks": { "type": "object" },
        "issues": { "type": "array" }
      }
    },
    "keyboardResults": {
      "type": "object",
      "properties": {
        "status": { "type": "string" },
        "focusOrder": { "type": "object" },
        "focusVisible": { "type": "object" },
        "keyboardTraps": { "type": "array" }
      }
    },
    "screenReaderResults": {
      "type": "object",
      "properties": {
        "status": { "type": "string" },
        "ariaUsage": { "type": "object" },
        "altText": { "type": "object" },
        "formLabels": { "type": "object" }
      }
    },
    "summary": {
      "type": "object",
      "properties": {
        "totalIssues": { "type": "number" },
        "critical": { "type": "number" },
        "major": { "type": "number" },
        "minor": { "type": "number" }
      }
    },
    "recommendations": { "type": "array" },
    "complianceStatement": { "type": "string" }
  }
}
```

## WCAG Criteria Reference

### Level A (Minimum)
- 1.1.1 Non-text Content (alt text)
- 1.3.1 Info and Relationships (semantic structure)
- 1.4.1 Use of Color (not sole indicator)
- 2.1.1 Keyboard (all functionality accessible)
- 2.1.2 No Keyboard Trap

### Level AA (Recommended)
- 1.4.3 Contrast (Minimum) - 4.5:1 for text, 3:1 for large
- 1.4.4 Resize Text (up to 200%)
- 1.4.11 Non-text Contrast - 3:1 for UI components
- 2.4.6 Headings and Labels
- 2.4.7 Focus Visible

### Level AAA (Enhanced)
- 1.4.6 Contrast (Enhanced) - 7:1 for text, 4.5:1 for large
- 2.4.9 Link Purpose
- 2.4.10 Section Headings

## Interaction Model

This agent works best when:
1. Given a running implementation URL to test
2. Configured with appropriate WCAG level target
3. Aware of known/accepted accessibility issues
4. Generating prioritized remediation recommendations
