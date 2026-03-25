---
name: accessibility-report
description: Generate accessibility compliance reports including VPAT and ACR documents
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Accessibility Report Skill

## Purpose

Generate comprehensive accessibility compliance reports including VPAT (Voluntary Product Accessibility Template) and ACR (Accessibility Conformance Report) documents.

## Capabilities

- Generate VPAT 2.4 documents
- Create ACR (Accessibility Conformance Reports)
- Complete WCAG 2.1/2.2 checklists
- Generate remediation roadmaps
- Track accessibility debt over time
- Export in multiple formats

## Target Processes

- accessibility-audit.js (vpatGenerationTask)
- component-library.js

## Integration Points

- VPAT 2.4 template
- WCAG 2.1/2.2 success criteria
- Section 508 requirements
- EN 301 549 standard

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "reportType": {
      "type": "string",
      "enum": ["vpat", "acr", "wcag-checklist", "remediation-roadmap"],
      "default": "vpat"
    },
    "productName": {
      "type": "string",
      "description": "Name of the product being evaluated"
    },
    "productVersion": {
      "type": "string",
      "description": "Version of the product"
    },
    "evaluationDate": {
      "type": "string",
      "format": "date"
    },
    "wcagLevel": {
      "type": "string",
      "enum": ["A", "AA", "AAA"],
      "default": "AA"
    },
    "auditResults": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "criterion": { "type": "string" },
          "level": { "type": "string" },
          "conformance": { "type": "string" },
          "remarks": { "type": "string" }
        }
      }
    },
    "outputFormat": {
      "type": "string",
      "enum": ["docx", "pdf", "html", "markdown"],
      "default": "markdown"
    }
  },
  "required": ["reportType", "productName", "auditResults"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "reportPath": {
      "type": "string",
      "description": "Path to generated report"
    },
    "summary": {
      "type": "object",
      "properties": {
        "overallConformance": { "type": "string" },
        "criteriaPass": { "type": "number" },
        "criteriaFail": { "type": "number" },
        "criteriaPartial": { "type": "number" }
      }
    },
    "remediationItems": {
      "type": "array",
      "description": "Prioritized remediation tasks"
    },
    "timeline": {
      "type": "object",
      "description": "Suggested remediation timeline"
    }
  }
}
```

## Usage Example

```javascript
const result = await skill.execute({
  reportType: 'vpat',
  productName: 'MyApp Web Portal',
  productVersion: '2.1.0',
  wcagLevel: 'AA',
  auditResults: [
    { criterion: '1.1.1', level: 'A', conformance: 'Supports', remarks: 'All images have alt text' },
    { criterion: '1.4.3', level: 'AA', conformance: 'Partially Supports', remarks: 'Some low contrast text in footer' }
  ],
  outputFormat: 'markdown'
});
```
