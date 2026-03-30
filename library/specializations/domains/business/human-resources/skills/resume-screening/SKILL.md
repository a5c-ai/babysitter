---
name: resume-screening
description: Intelligent resume parsing and candidate screening with bias-reduction capabilities
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: human-resources
  domain: business
  category: Talent Acquisition
  skill-id: SK-002
  dependencies:
    - NLP libraries
    - Resume parsing engines
    - Skills taxonomies
---

# Resume Parsing and Screening Skill

## Overview

The Resume Parsing and Screening skill provides intelligent resume analysis and candidate evaluation capabilities. This skill enables structured data extraction, skills matching, fit scoring, and bias-reduction through standardized evaluation methods.

## Capabilities

### Resume Parsing
- Parse resumes in multiple formats (PDF, Word, text)
- Extract structured data (skills, experience, education)
- Normalize job titles and company names
- Handle international formats and languages
- Process LinkedIn profiles and portfolios

### Skills Matching
- Match candidates against job requirements
- Map candidate skills to role competencies
- Identify transferable skills
- Calculate skills gap analysis
- Suggest development areas

### Fit Scoring
- Calculate fit scores based on configurable criteria
- Weight experience vs. skills vs. education
- Apply minimum threshold filters
- Generate comparative rankings
- Provide score explanations

### Red Flag Detection
- Detect potential red flags (gaps, inconsistencies)
- Flag employment tenure concerns
- Identify career trajectory issues
- Note credential verification needs
- Surface information inconsistencies

### Candidate Summaries
- Generate candidate summaries for hiring managers
- Create comparison matrices
- Highlight strengths and development areas
- Summarize relevant experience
- Note cultural fit indicators

### Bias Reduction
- Support bias-reduction through standardized evaluation
- Remove identifying information for blind review
- Apply consistent scoring criteria
- Track demographic patterns in screening
- Generate diversity pipeline reports

## Usage

### Resume Parsing
```javascript
const parseConfig = {
  format: 'auto-detect',
  extractFields: [
    'contact',
    'experience',
    'education',
    'skills',
    'certifications'
  ],
  normalization: {
    titles: true,
    companies: true,
    skills: 'standard-taxonomy'
  },
  redFlagRules: {
    maxGapMonths: 12,
    minTenureMonths: 12,
    flagJobHopping: true
  }
};
```

### Candidate Scoring
```javascript
const scoringCriteria = {
  jobRequirements: {
    requiredSkills: ['Python', 'SQL', 'Machine Learning'],
    preferredSkills: ['AWS', 'Spark', 'Docker'],
    minExperienceYears: 5,
    education: {
      required: 'Bachelors',
      preferredFields: ['Computer Science', 'Data Science']
    }
  },
  weights: {
    requiredSkills: 40,
    preferredSkills: 20,
    experience: 25,
    education: 15
  },
  thresholds: {
    autoAdvance: 80,
    review: 60,
    autoReject: 40
  }
};
```

## Process Integration

This skill integrates with the following HR processes:

| Process | Integration Points |
|---------|-------------------|
| full-cycle-recruiting.js | Candidate screening, ranking |
| structured-interview-design.js | Interview focus areas |

## Best Practices

1. **Consistent Criteria**: Apply the same scoring criteria to all candidates
2. **Regular Calibration**: Review scoring outcomes for consistency
3. **Bias Monitoring**: Track outcomes by demographic groups
4. **Human Review**: Use AI scoring as input, not final decision
5. **Transparency**: Be prepared to explain scoring rationale
6. **Skills Updates**: Regularly update skills taxonomies

## Metrics and KPIs

| Metric | Description | Target |
|--------|-------------|--------|
| Screening Accuracy | Correlation with interview performance | >0.7 |
| Time to Screen | Minutes per resume | <5 min |
| Adverse Impact | Score distribution across groups | No significant difference |
| False Positive Rate | Low-fit candidates advanced | <15% |
| False Negative Rate | High-fit candidates rejected | <10% |

## Related Skills

- SK-001: ATS Integration (candidate sourcing)
- SK-003: Interview Questions (evaluation continuity)
