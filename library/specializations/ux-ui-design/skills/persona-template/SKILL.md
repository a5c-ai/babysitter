---
name: persona-template
description: Generate user persona documents and empathy maps from templates
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Persona Template Skill

## Purpose

Generate professional user persona documents and empathy map visualizations from structured data and templates.

## Capabilities

- Fill persona templates with research data
- Generate persona cards in multiple formats
- Create empathy map visualizations
- Export to PDF, PNG, and Markdown
- Support multiple persona template styles
- Generate persona comparison views

## Target Processes

- persona-development.js (personaDocumentationTask)
- user-research.js (personaCreationTask)

## Integration Points

- Template engines (Handlebars, EJS)
- PDF generation (Puppeteer, PDFKit)
- Image generation for persona cards

## Input Schema

```json
{
  "type": "object",
  "properties": {
    "personaData": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "photo": { "type": "string" },
        "demographics": {
          "type": "object",
          "properties": {
            "age": { "type": "number" },
            "occupation": { "type": "string" },
            "location": { "type": "string" },
            "education": { "type": "string" }
          }
        },
        "goals": { "type": "array", "items": { "type": "string" } },
        "frustrations": { "type": "array", "items": { "type": "string" } },
        "behaviors": { "type": "array", "items": { "type": "string" } },
        "quote": { "type": "string" },
        "bio": { "type": "string" }
      }
    },
    "empathyMap": {
      "type": "object",
      "properties": {
        "says": { "type": "array" },
        "thinks": { "type": "array" },
        "does": { "type": "array" },
        "feels": { "type": "array" }
      }
    },
    "templateStyle": {
      "type": "string",
      "enum": ["minimal", "detailed", "visual", "ux-agency"],
      "default": "detailed"
    },
    "outputFormat": {
      "type": "string",
      "enum": ["pdf", "png", "markdown", "html"],
      "default": "markdown"
    }
  },
  "required": ["personaData"]
}
```

## Output Schema

```json
{
  "type": "object",
  "properties": {
    "personaDocument": {
      "type": "string",
      "description": "Path to generated persona document"
    },
    "empathyMapDocument": {
      "type": "string",
      "description": "Path to generated empathy map"
    },
    "cardImage": {
      "type": "string",
      "description": "Path to persona card image"
    },
    "markdownContent": {
      "type": "string",
      "description": "Markdown content if applicable"
    }
  }
}
```

## Usage Example

```javascript
const result = await skill.execute({
  personaData: {
    name: 'Sarah Chen',
    demographics: {
      age: 34,
      occupation: 'Product Manager',
      location: 'San Francisco, CA'
    },
    goals: ['Streamline team workflows', 'Reduce meeting overhead'],
    frustrations: ['Too many tools', 'Information silos'],
    quote: 'I need to see the big picture while managing details'
  },
  empathyMap: {
    says: ['We need better collaboration'],
    thinks: ['Is there an easier way?'],
    does: ['Checks multiple apps daily'],
    feels: ['Overwhelmed by notifications']
  },
  templateStyle: 'detailed',
  outputFormat: 'pdf'
});
```
