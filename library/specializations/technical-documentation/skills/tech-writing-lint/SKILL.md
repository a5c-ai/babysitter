---
name: tech-writing-lint
description: Automated technical writing style and quality enforcement. Lint documentation with Vale, check for inclusive language, enforce style guides, and analyze readability metrics.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
backlog-id: SK-007
metadata:
  author: babysitter-sdk
  version: "1.0.0"
---

# Technical Writing Lint Skill

Automated technical writing style and quality enforcement.

## Capabilities

- Vale linting with custom style rules
- Write-good suggestions for clarity
- Alex.js for inclusive language checking
- Proselint for style violations
- Readability scoring (Flesch-Kincaid, Gunning Fog)
- Terminology consistency checking
- Microsoft/Google style guide compliance
- Custom vocabulary/jargon management

## Usage

Invoke this skill when you need to:
- Enforce writing style standards
- Check documentation quality
- Validate terminology consistency
- Analyze content readability
- Ensure inclusive language

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| inputPath | string | Yes | Path to documentation file or directory |
| action | string | Yes | lint, readability, terminology, inclusive |
| styleGuide | string | No | Style guide to apply (google, microsoft, custom) |
| configPath | string | No | Path to Vale or custom config |
| glossaryPath | string | No | Path to terminology glossary |
| minReadability | number | No | Minimum readability score (0-100) |

### Input Example

```json
{
  "inputPath": "./docs",
  "action": "lint",
  "styleGuide": "google",
  "configPath": ".vale.ini",
  "minReadability": 60
}
```

## Output Structure

### Lint Output

```json
{
  "files": 25,
  "errors": 8,
  "warnings": 34,
  "suggestions": 56,
  "issues": [
    {
      "file": "docs/api/authentication.md",
      "line": 42,
      "column": 15,
      "rule": "Google.Passive",
      "message": "In general, use active voice instead of passive voice.",
      "severity": "warning",
      "context": "The token is validated by the server."
    }
  ],
  "readabilityScores": {
    "fleschKincaid": 62.5,
    "gunningFog": 10.2,
    "avgSentenceLength": 18.3,
    "avgWordLength": 5.1
  }
}
```

### Terminology Report

```json
{
  "inconsistencies": [
    {
      "term": "backend",
      "variants": ["back-end", "back end", "Backend"],
      "preferred": "backend",
      "occurrences": [
        { "file": "docs/arch.md", "line": 15, "found": "back-end" },
        { "file": "docs/guide.md", "line": 42, "found": "Backend" }
      ]
    }
  ],
  "undefined": [
    {
      "term": "microservice",
      "occurrences": 12,
      "suggestion": "Add to glossary with definition"
    }
  ]
}
```

## Vale Configuration

### .vale.ini

```ini
StylesPath = .vale/styles

MinAlertLevel = suggestion

Packages = Google, Microsoft, write-good, alex

[*.md]
BasedOnStyles = Vale, Google, write-good

# Custom rules
Google.Passive = warning
Google.We = suggestion
Google.Will = warning
Google.Wordiness = warning

write-good.Passive = warning
write-good.Weasel = warning
write-good.TooWordy = suggestion

# Disable specific rules
Vale.Spelling = NO

[*.mdx]
BasedOnStyles = Vale, Google

[CHANGELOG.md]
BasedOnStyles = Vale
```

### Custom Vale Rule

```yaml
# .vale/styles/Custom/Terminology.yml
extends: substitution
message: "Use '%s' instead of '%s'."
level: error
ignorecase: true
swap:
  back-end: backend
  front-end: frontend
  e-mail: email
  log-in: login
  set-up: setup
  on-premise: on-premises
  blacklist: blocklist
  whitelist: allowlist
  master: main
  slave: replica
```

### Style Guide Rules

```yaml
# .vale/styles/Custom/ActiveVoice.yml
extends: existence
message: "Avoid passive voice: '%s'"
level: warning
tokens:
  - 'is being'
  - 'was being'
  - 'has been'
  - 'have been'
  - 'had been'
  - 'will be'
  - 'is done'
  - 'was done'
  - 'are done'
  - 'were done'
```

## Alex.js Integration

### alex Configuration

```json
{
  "allow": [
    "execute"
  ],
  "profanitySureness": 2,
  "noBinary": true
}
```

### Inclusive Language Checks

```markdown
<!-- Before -->
The user himself must configure the whitelist.
Click the master switch to enable.

<!-- After -->
The user must configure the allowlist.
Click the primary switch to enable.
```

## Readability Analysis

### Metrics Explained

| Metric | Range | Interpretation |
|--------|-------|----------------|
| Flesch-Kincaid | 0-100 | Higher = easier (60-70 ideal for docs) |
| Gunning Fog | 0-20 | Lower = easier (8-12 ideal) |
| SMOG Index | 0-20 | Years of education needed |
| Coleman-Liau | 0-20 | Grade level |

### Readability Report

```json
{
  "file": "docs/quickstart.md",
  "metrics": {
    "fleschKincaid": 65.2,
    "gunningFog": 9.8,
    "smog": 10.1,
    "colemanLiau": 11.2,
    "automatedReadability": 10.5
  },
  "statistics": {
    "sentences": 45,
    "words": 823,
    "syllables": 1247,
    "complexWords": 89,
    "avgSentenceLength": 18.3,
    "avgWordLength": 4.8
  },
  "suggestions": [
    "Break up long sentences (3 sentences over 30 words)",
    "Simplify complex words: 'implementation' -> 'setup'",
    "Reduce jargon density in paragraphs 3-5"
  ]
}
```

## Terminology Glossary

### glossary.yml

```yaml
terms:
  - term: API
    definition: Application Programming Interface
    usage: Always use uppercase API, not Api or api

  - term: backend
    definition: Server-side application code
    usage: One word, lowercase (not back-end or back end)

  - term: SDK
    definition: Software Development Kit
    usage: Always use uppercase SDK
    expansion_first_use: true

  - term: OAuth
    definition: Open Authorization standard
    usage: Capital O, lowercase auth

prohibited:
  - term: simple
    reason: Subjective; what's simple for one may not be for another

  - term: easy
    reason: Subjective; use specific guidance instead

  - term: just
    reason: Minimizing; implies task is trivial

  - term: obviously
    reason: May make readers feel inadequate
```

## Workflow

1. **Load configuration** - Parse Vale and custom configs
2. **Scan files** - Find all documentation files
3. **Run linters** - Apply Vale, alex, write-good
4. **Analyze readability** - Calculate metrics
5. **Check terminology** - Validate against glossary
6. **Generate report** - Output findings and suggestions

## Dependencies

```json
{
  "devDependencies": {
    "vale": "^3.0.0",
    "alex": "^11.0.0",
    "write-good": "^1.0.0",
    "textstat": "^0.7.0",
    "proselint": "^0.13.0"
  }
}
```

## CLI Commands

```bash
# Install Vale packages
vale sync

# Lint documentation
vale docs/

# Check inclusive language
npx alex docs/

# Write-good analysis
npx write-good docs/**/*.md

# Generate readability report
node scripts/readability.js docs/
```

## Style Guide Comparison

| Rule | Google | Microsoft | Vale Default |
|------|--------|-----------|--------------|
| Passive Voice | Warning | Warning | Suggestion |
| Future Tense | Warning | Off | Off |
| First Person | Suggestion | Off | Off |
| Contractions | Allowed | Discouraged | Off |
| Oxford Comma | Required | Required | Off |

## Best Practices Applied

- Use active voice
- Keep sentences under 25 words
- One idea per paragraph
- Define acronyms on first use
- Use consistent terminology
- Avoid jargon where possible
- Write for a global audience

## References

- Vale: https://vale.sh/
- Alex: https://alexjs.com/
- Google Developer Docs Style Guide: https://developers.google.com/style
- Microsoft Style Guide: https://docs.microsoft.com/en-us/style-guide/
- write-good: https://github.com/btford/write-good

## Target Processes

- style-guide-enforcement.js
- docs-testing.js
- docs-audit.js
- terminology-management.js
