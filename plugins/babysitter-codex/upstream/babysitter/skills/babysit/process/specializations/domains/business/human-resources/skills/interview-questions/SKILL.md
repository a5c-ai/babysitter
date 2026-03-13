---
name: interview-questions
description: Generate competency-based and behavioral interview questions with legal compliance validation
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
  skill-id: SK-003
  dependencies:
    - Competency frameworks
    - Question banks
---

# Interview Question Generator Skill

## Overview

The Interview Question Generator skill provides capabilities for creating structured, competency-based, and behavioral interview questions. This skill ensures consistent evaluation, legal compliance, and effective candidate assessment across all interview stages.

## Capabilities

### Behavioral Question Generation
- Generate STAR-format behavioral interview questions
- Create questions targeting specific competencies
- Adapt questions for experience levels
- Provide follow-up probe questions
- Include situation-specific scenarios

### Competency-Based Questions
- Create competency-based question sets by role
- Map questions to competency frameworks
- Generate role-specific technical questions
- Build leadership assessment questions
- Develop culture-fit evaluation questions

### Technical Assessment
- Build technical assessment frameworks
- Create coding challenge guidelines
- Develop case study scenarios
- Generate system design questions
- Build portfolio review guides

### Scorecard Development
- Generate interview scorecards with rating criteria
- Create anchored rating scales
- Define evaluation rubrics
- Build consensus decision frameworks
- Design debrief guides

### Situational Judgment
- Create situational judgment questions
- Build role-play scenarios
- Develop hypothetical situation responses
- Generate problem-solving assessments
- Create prioritization exercises

### Compliance Validation
- Validate questions for legal compliance
- Flag potentially discriminatory questions
- Ensure ADA compliance considerations
- Review for protected class implications
- Generate compliant alternatives

## Usage

### Behavioral Question Set
```javascript
const questionRequest = {
  competency: 'Problem Solving',
  level: 'Senior',
  role: 'Software Engineer',
  format: 'STAR',
  count: 5,
  includeFollowUps: true,
  compliance: {
    jurisdiction: 'US',
    checkProtectedClasses: true
  }
};

// Example output:
// "Tell me about a time when you faced a significant technical
// challenge with limited resources. What was the situation,
// what actions did you take, and what was the outcome?"
```

### Scorecard Generation
```javascript
const scorecardConfig = {
  role: 'Product Manager',
  competencies: [
    'Strategic Thinking',
    'Stakeholder Management',
    'Data-Driven Decision Making',
    'Communication'
  ],
  ratingScale: {
    type: 'behaviorally-anchored',
    levels: 5,
    anchors: true
  },
  sections: ['Technical', 'Behavioral', 'Culture Fit'],
  includeNotes: true,
  includeRecommendation: true
};
```

## Process Integration

This skill integrates with the following HR processes:

| Process | Integration Points |
|---------|-------------------|
| structured-interview-design.js | Question development, scorecard creation |
| full-cycle-recruiting.js | Interview preparation |
| leadership-development-program.js | Assessment questions |

## Best Practices

1. **Consistency**: Use the same questions for all candidates in a role
2. **Competency Mapping**: Ensure questions map to required competencies
3. **Legal Review**: Have legal review novel question types
4. **Training**: Train interviewers on question usage and probing
5. **Calibration**: Regularly calibrate interviewer scoring
6. **Updates**: Refresh question banks annually

## Question Categories

| Category | Purpose | Example Topics |
|----------|---------|----------------|
| Behavioral | Past performance prediction | Leadership, conflict, failure |
| Situational | Problem-solving approach | Hypothetical scenarios |
| Technical | Skills validation | Role-specific knowledge |
| Cultural | Values alignment | Collaboration, growth mindset |
| Motivational | Engagement prediction | Career goals, interests |

## Related Skills

- SK-001: ATS Integration (interview workflow)
- SK-002: Resume Screening (evaluation continuity)
