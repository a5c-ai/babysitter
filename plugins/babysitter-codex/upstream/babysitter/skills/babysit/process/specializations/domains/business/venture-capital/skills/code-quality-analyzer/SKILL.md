---
name: code-quality-analyzer
description: Static code analysis, technical debt assessment, engineering velocity metrics
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
  skill-id: vc-skill-014
---

# Code Quality Analyzer

## Overview

The Code Quality Analyzer skill provides detailed code-level analysis for technical due diligence. It performs static code analysis, assesses technical debt, and evaluates engineering team velocity to understand code health and development productivity.

## Capabilities

### Static Code Analysis
- Run automated code quality checks
- Identify code smells and anti-patterns
- Measure code complexity metrics
- Detect potential bugs and vulnerabilities

### Technical Debt Assessment
- Quantify technical debt backlog
- Identify high-priority refactoring needs
- Assess test coverage and quality
- Evaluate documentation completeness

### Engineering Velocity Metrics
- Measure deployment frequency
- Track lead time for changes
- Analyze cycle time and throughput
- Assess sprint velocity trends

### Code Health Indicators
- Analyze code churn patterns
- Review pull request metrics
- Assess code review practices
- Evaluate dependency management

## Usage

### Analyze Code Quality
```
Input: Repository access, analysis parameters
Process: Run static analysis, aggregate metrics
Output: Code quality report, issue summary
```

### Assess Technical Debt
```
Input: Codebase access, debt categorization
Process: Inventory debt, estimate remediation
Output: Technical debt assessment, prioritization
```

### Measure Engineering Velocity
```
Input: Git history, project management data
Process: Calculate velocity metrics
Output: Velocity report, trend analysis
```

### Review Code Health
```
Input: Repository data, team practices
Process: Analyze patterns, compare benchmarks
Output: Code health scorecard, recommendations
```

## Key Metrics

| Metric | Description | Target Range |
|--------|-------------|--------------|
| Test Coverage | % of code covered by tests | 70-90% |
| Code Complexity | Cyclomatic complexity average | < 10 |
| Tech Debt Ratio | Debt remediation time / dev time | < 5% |
| Deployment Frequency | Deployments per week | Daily to weekly |
| Change Failure Rate | % of deployments causing issues | < 15% |

## Integration Points

- **Technical Due Diligence**: Detailed code analysis for DD
- **Tech Stack Scanner**: Complement architecture review
- **Technical Assessor (Agent)**: Support agent analysis
- **IP Patent Analyzer**: Code-level IP assessment

## Analysis Tools Integration

- SonarQube for code quality
- CodeClimate for maintainability
- GitHub/GitLab analytics
- Jira/Linear for velocity data
- Custom scripts for specific checks

## Best Practices

1. Calibrate expectations by company stage
2. Focus on trends over absolute numbers
3. Consider context of rapid iteration
4. Balance debt against velocity needs
5. Assess relative to team size and resources
