---
name: background-checker
description: Integrates with background check services, social media analysis, reference verification
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - WebFetch
metadata:
  specialization: venture-capital
  domain: business
  skill-id: vc-skill-018
---

# Background Checker

## Overview

The Background Checker skill provides comprehensive background verification for founders and key executives during management team due diligence. It integrates with background check services and aggregates information to verify credentials and identify potential concerns.

## Capabilities

### Background Verification
- Verify employment history and dates
- Confirm educational credentials
- Check professional licenses and certifications
- Verify board positions and affiliations

### Criminal and Legal Checks
- Integrate with background check services
- Search litigation databases
- Check regulatory enforcement actions
- Review bankruptcy filings

### Social Media Analysis
- Aggregate public social media presence
- Identify potential reputation risks
- Analyze professional network connections
- Monitor for concerning content or associations

### Reference Verification
- Coordinate reference calls
- Verify reference authenticity
- Track reference feedback patterns
- Identify reference gaps or concerns

## Usage

### Run Background Check
```
Input: Name, identifying information, check level
Process: Submit to services, aggregate results
Output: Background check report, findings summary
```

### Verify Credentials
```
Input: Resume/CV, claimed credentials
Process: Verify employment, education, licenses
Output: Verification report, discrepancies
```

### Analyze Social Media
```
Input: Name, social media handles
Process: Aggregate and analyze presence
Output: Social media report, risk flags
```

### Coordinate References
```
Input: Reference list, contact information
Process: Verify references, conduct calls
Output: Reference report, patterns identified
```

## Check Categories

| Category | Sources |
|----------|---------|
| Employment | LinkedIn, company verification, references |
| Education | Institution verification services |
| Criminal | County, state, federal database searches |
| Civil | Litigation databases, court records |
| Regulatory | SEC, state AG, industry regulators |
| Credit | Business credit reports (with consent) |

## Integration Points

- **Management Team Assessment**: Core background skills
- **Legal Due Diligence**: Coordinate legal searches
- **People Evaluator (Agent)**: Support agent analysis
- **DD Coordinator (Agent)**: Part of overall DD

## Red Flags

- Employment gaps or inconsistencies
- Credential misrepresentation
- Undisclosed litigation or bankruptcies
- Regulatory actions or sanctions
- Negative reference patterns
- Concerning social media content
- Undisclosed conflicts of interest

## Best Practices

1. Obtain proper consent before checks
2. Use appropriate check levels by role
3. Allow opportunity to explain findings
4. Maintain confidentiality of results
5. Focus on material findings relevant to role
