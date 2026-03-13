# Migration Readiness Assessor Agent

## Overview

The Migration Readiness Assessor agent evaluates the overall readiness of systems, teams, and organizations for migration initiatives. It provides multi-dimensional scoring, identifies blockers, and delivers actionable go/no-go recommendations.

## Quick Start

### Prerequisites

- Target codebase for analysis
- Access to infrastructure documentation
- Stakeholder availability for organizational assessment
- Clear migration goal and target platform

### Basic Usage

1. **Define migration parameters**
   ```json
   {
     "targetPath": "./legacy-system",
     "migrationGoal": "cloud-native modernization",
     "targetPlatform": "AWS",
     "timeline": "6 months",
     "constraints": {
       "budget": "$500,000",
       "downtime": "< 4 hours",
       "team": "8 engineers"
     }
   }
   ```

2. **Run assessment**
   ```javascript
   const result = await ctx.task(readinessAssessmentTask, {
     codebasePath: './legacy-system',
     goal: 'cloud-native modernization',
     platform: 'AWS'
   });
   ```

3. **Review outputs**
   - `assessment-report.md` - Full assessment
   - `readiness-score.json` - Detailed scores
   - `remediation-roadmap.md` - Action plan
   - `executive-summary.md` - Decision brief

## Features

### Multi-Dimensional Scoring

| Dimension | Weight | Factors Evaluated |
|-----------|--------|-------------------|
| Technical | 25% | Code quality, architecture, dependencies |
| Infrastructure | 20% | Target environment, networking, capacity |
| Organizational | 20% | Skills, resources, stakeholder alignment |
| Process | 15% | CI/CD, testing, documentation |
| Data | 10% | Quality, volume, migration complexity |
| Security | 10% | Vulnerabilities, compliance, controls |

### Readiness Grades

| Grade | Score | Status | Recommendation |
|-------|-------|--------|----------------|
| A | 90-100 | Ready | Proceed immediately |
| B | 80-89 | Ready | Proceed with minor prep |
| C | 60-79 | Conditional | Proceed after remediation |
| D | 40-59 | Not Ready | Significant work needed |
| F | 0-39 | Critical | Major blockers present |

### Blocker Categories

- **Hard Blockers**: Must resolve before proceeding
- **Soft Blockers**: Should resolve, workarounds possible
- **Risks**: May cause issues, monitor closely
- **Dependencies**: External factors to track

## Configuration

### Assessment Configuration

Create `readiness-assessment-config.json`:

```json
{
  "assessment": {
    "scope": "comprehensive",
    "targetMigration": "cloud-native",
    "targetPlatform": "AWS",
    "timeline": "6-months"
  },
  "weights": {
    "technical": 0.25,
    "infrastructure": 0.20,
    "organizational": 0.20,
    "process": 0.15,
    "data": 0.10,
    "security": 0.10
  },
  "thresholds": {
    "ready": 80,
    "conditionallyReady": 60,
    "notReady": 40
  },
  "analysis": {
    "runCodeAnalysis": true,
    "runDependencyScan": true,
    "runSecurityScan": true,
    "runArchitectureAnalysis": true
  },
  "surveys": {
    "organizationalReadiness": true,
    "skillsAssessment": true,
    "stakeholderAlignment": true
  },
  "output": {
    "directory": "./readiness-assessment",
    "formats": ["json", "markdown", "html"]
  }
}
```

### Custom Weight Profiles

```json
{
  "profiles": {
    "cloud-migration": {
      "infrastructure": 0.30,
      "technical": 0.25,
      "security": 0.20,
      "process": 0.15,
      "data": 0.05,
      "organizational": 0.05
    },
    "modernization": {
      "technical": 0.35,
      "process": 0.20,
      "organizational": 0.20,
      "data": 0.15,
      "security": 0.05,
      "infrastructure": 0.05
    },
    "replatform": {
      "data": 0.30,
      "infrastructure": 0.25,
      "technical": 0.20,
      "process": 0.10,
      "security": 0.10,
      "organizational": 0.05
    }
  }
}
```

## Output Examples

### Executive Summary

```markdown
# Migration Readiness Assessment - Executive Summary

## Assessment Overview
- **System**: Legacy ERP Application
- **Migration Goal**: Cloud-Native Modernization
- **Target Platform**: AWS (EKS, RDS, S3)
- **Assessment Date**: 2026-01-24

## Key Findings

### Overall Readiness: 67/100 (Grade C - Conditionally Ready)

**Recommendation**: PROCEED WITH CONDITIONS

The system can proceed to migration after addressing critical security
vulnerabilities and improving test coverage. Estimated preparation time:
6-8 weeks.

### Dimension Summary

| Dimension | Score | Status |
|-----------|-------|--------|
| Technical | 72 | Good |
| Infrastructure | 65 | Fair |
| Organizational | 80 | Good |
| Process | 55 | Fair |
| Data | 70 | Good |
| Security | 45 | Poor |

### Critical Blockers

1. **3 Critical Security Vulnerabilities** (CVE-2024-xxxxx)
   - Impact: Cannot deploy to production
   - Resolution: 1-2 weeks

2. **Database Compatibility Issue**
   - Impact: Oracle-specific features need refactoring
   - Resolution: 3-4 weeks

### Recommended Actions

1. Immediately address security vulnerabilities
2. Complete database compatibility analysis
3. Improve test coverage from 35% to 60%
4. Establish CI/CD pipeline

### Timeline to Ready State

With focused effort, the system can reach "Ready" status in 8 weeks.
```

### Detailed Score Breakdown

```json
{
  "assessmentId": "assess-20260124-143022",
  "timestamp": "2026-01-24T14:30:22Z",
  "overallScore": {
    "score": 67,
    "grade": "C",
    "status": "conditionally-ready"
  },
  "dimensions": {
    "technical": {
      "score": 72,
      "weight": 0.25,
      "weightedScore": 18.0,
      "factors": [
        { "name": "Code Quality", "score": 75, "details": "Maintainability index: 68" },
        { "name": "Test Coverage", "score": 35, "details": "Line coverage: 35%" },
        { "name": "Technical Debt", "score": 65, "details": "Debt ratio: 8.2%" },
        { "name": "Architecture", "score": 80, "details": "Modular structure" },
        { "name": "Dependencies", "score": 78, "details": "2 outdated major deps" }
      ]
    },
    "security": {
      "score": 45,
      "weight": 0.10,
      "weightedScore": 4.5,
      "factors": [
        { "name": "Vulnerabilities", "score": 30, "details": "3 critical, 8 high" },
        { "name": "Compliance", "score": 60, "details": "SOC2 gaps identified" },
        { "name": "Access Controls", "score": 55, "details": "Legacy auth system" }
      ]
    }
  },
  "blockers": {
    "hard": [
      {
        "id": "B001",
        "description": "3 critical security vulnerabilities",
        "impact": "Cannot deploy to production",
        "remediation": "Upgrade affected packages",
        "estimatedEffort": "1-2 weeks"
      },
      {
        "id": "B002",
        "description": "Oracle-specific SQL incompatible with PostgreSQL",
        "impact": "Data layer will not function",
        "remediation": "Refactor database access layer",
        "estimatedEffort": "3-4 weeks"
      }
    ],
    "soft": [
      {
        "id": "S001",
        "description": "Low test coverage (35%)",
        "impact": "Higher risk of regression bugs",
        "remediation": "Increase coverage to 60%",
        "estimatedEffort": "4 weeks"
      }
    ]
  },
  "recommendations": {
    "decision": "proceed-with-conditions",
    "conditions": [
      "Resolve all critical security vulnerabilities",
      "Complete database compatibility remediation",
      "Achieve minimum 50% test coverage"
    ],
    "actions": [
      {
        "priority": 1,
        "action": "Patch critical vulnerabilities",
        "owner": "Security Team",
        "timeline": "2 weeks"
      },
      {
        "priority": 2,
        "action": "Refactor Oracle-specific code",
        "owner": "Development Team",
        "timeline": "4 weeks"
      }
    ]
  }
}
```

### Remediation Roadmap

```markdown
# Remediation Roadmap

## Phase 1: Critical (Weeks 1-2)

### Security Remediation
| CVE | Package | Current | Target | Status |
|-----|---------|---------|--------|--------|
| CVE-2024-38816 | spring-core | 5.3.18 | 5.3.34 | Pending |
| CVE-2024-22234 | spring-security | 5.7.3 | 5.7.12 | Pending |
| CVE-2024-22259 | spring-web | 5.3.18 | 5.3.34 | Pending |

**Effort**: 8 developer-hours
**Owner**: Security Team

## Phase 2: Technical Preparation (Weeks 3-6)

### Database Compatibility
- Analyze Oracle-specific SQL usage
- Refactor PL/SQL procedures to application code
- Update ORM configurations
- Test with PostgreSQL instance

**Effort**: 120 developer-hours
**Owner**: Backend Team

### Test Coverage Improvement
- Generate characterization tests for critical paths
- Add unit tests for business logic
- Create integration tests for APIs
- Target: 60% line coverage

**Effort**: 80 developer-hours
**Owner**: QA Team

## Phase 3: Process Readiness (Weeks 7-8)

### CI/CD Pipeline Setup
- Configure GitHub Actions workflows
- Set up staging environment
- Implement deployment automation
- Configure monitoring and alerts

**Effort**: 40 developer-hours
**Owner**: DevOps Team

## Summary Timeline

```
Week 1-2:  ████ Security Remediation
Week 3-4:  ████████ Database Compatibility
Week 5-6:  ████████ Database + Testing
Week 7-8:  ████ CI/CD + Final Prep
           ──────────────────────────
           Target Ready Date: Week 8
```
```

## Integration with Babysitter SDK

### Process Definition

```javascript
import { defineTask, defineProcess } from '@a5c-ai/babysitter-sdk';

export const readinessAssessmentProcess = defineProcess('migration-readiness', {
  description: 'Comprehensive migration readiness assessment',

  tasks: {
    assess: defineTask('assess', (args, ctx) => ({
      kind: 'agent',
      title: 'Migration Readiness Assessment',
      agent: {
        name: 'migration-readiness-assessor',
        prompt: {
          role: 'Migration Readiness Expert',
          task: 'Evaluate migration readiness',
          context: args,
          instructions: [
            'Run technical analysis using skills',
            'Score all readiness dimensions',
            'Identify blockers and risks',
            'Generate actionable recommendations',
            'Provide go/no-go decision'
          ]
        }
      },
      io: {
        inputJsonPath: `tasks/${ctx.effectId}/input.json`,
        outputJsonPath: `tasks/${ctx.effectId}/result.json`
      }
    }))
  },

  flow: async (inputs, ctx) => {
    const assessment = await ctx.task(tasks.assess, {
      targetPath: inputs.codebasePath,
      migrationGoal: inputs.goal,
      targetPlatform: inputs.platform,
      constraints: inputs.constraints
    });

    return {
      assessment,
      ready: assessment.overallScore.score >= 80,
      decision: assessment.recommendations.decision
    };
  }
});
```

## CLI Examples

### Run Full Assessment

```bash
# Full comprehensive assessment
claude --agent migration-readiness-assessor \
  --input '{
    "targetPath": "./legacy-app",
    "migrationGoal": "cloud-native",
    "targetPlatform": "AWS"
  }'
```

### Quick Assessment

```bash
# Technical-only quick check
claude --agent migration-readiness-assessor \
  --config '{"assessment": {"scope": "technical-only"}}'
```

### Custom Weights

```bash
# Security-focused assessment
claude --agent migration-readiness-assessor \
  --config '{
    "weights": {
      "security": 0.40,
      "technical": 0.30,
      "infrastructure": 0.20,
      "process": 0.10
    }
  }'
```

## Troubleshooting

### Common Issues

**Incomplete data**
```
Warning: Could not assess organizational readiness
```
Solution: Provide stakeholder survey data or skip dimension

**Analysis timeout**
```
Error: Code analysis exceeded time limit
```
Solution: Increase timeout or use sampling for large codebases

**Missing permissions**
```
Error: Cannot access infrastructure details
```
Solution: Provide read-only access or accept estimated scores

### Debug Mode

```json
{
  "debug": {
    "enabled": true,
    "showScoringDetails": true,
    "logSkillInvocations": true
  }
}
```

## Best Practices

1. **Gather Complete Data**: More data = more accurate assessment
2. **Involve Stakeholders**: Include organizational perspectives
3. **Be Conservative**: Err on side of caution when uncertain
4. **Reassess Regularly**: Re-run after remediation
5. **Document Assumptions**: Note when estimates are used
6. **Track Progress**: Compare scores over time

## Related Documentation

- [AGENT.md](./AGENT.md) - Full agent specification
- [AWS Migration Hub](https://aws.amazon.com/migration-hub/)
- [Azure Migrate](https://azure.microsoft.com/en-us/services/azure-migrate/)
- [Cloud Migration Strategies](https://aws.amazon.com/blogs/enterprise-strategy/6-strategies-for-migrating-applications-to-the-cloud/)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |
