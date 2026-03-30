# Static Code Analyzer Skill

## Overview

The Static Code Analyzer skill provides comprehensive static analysis capabilities for assessing codebase quality, complexity, and migration readiness. It integrates with industry-standard tools like SonarQube and ast-grep to deliver actionable insights.

## Quick Start

### Prerequisites

- Node.js 18+ (for running analysis scripts)
- One or more static analysis tools installed (optional but recommended):
  - SonarQube Server or Cloud account
  - ast-grep CLI
  - ESLint (for JavaScript/TypeScript)
  - PMD (for Java)

### Basic Usage

1. **Prepare the target codebase**
   ```bash
   # Ensure you're in the project root
   cd /path/to/target/codebase
   ```

2. **Run basic analysis**
   ```bash
   # The skill will auto-detect languages and run appropriate analyzers
   # Output will be written to ./analysis-report/
   ```

3. **Review results**
   - Check `analysis-report/summary.json` for overall metrics
   - Review `analysis-report/findings.md` for detailed issues
   - Use `analysis-report/migration-readiness.json` for migration planning

## Features

### Code Quality Metrics

| Metric | Description | Target Range |
|--------|-------------|--------------|
| Cyclomatic Complexity | Control flow complexity | < 10 per function |
| Code Duplication | Percentage of duplicated code | < 5% |
| Maintainability Index | Composite maintainability score | > 70 |
| Technical Debt Ratio | Debt vs. development time | < 5% |

### Security Scanning

The skill includes SAST (Static Application Security Testing) capabilities:

- SQL Injection detection
- XSS vulnerability identification
- Hardcoded credentials detection
- Insecure deserialization
- Path traversal vulnerabilities

### Language Support

| Language | Primary Tool | Secondary Tools |
|----------|-------------|-----------------|
| JavaScript/TypeScript | ESLint | ast-grep, SonarQube |
| Java | PMD | SpotBugs, Checkstyle, SonarQube |
| Python | Pylint | Bandit, SonarQube |
| Go | golangci-lint | SonarQube |
| C# | StyleCop | SonarQube |

## Configuration

### Project Configuration

Create `.static-analyzer.json` in your project root:

```json
{
  "excludePaths": [
    "node_modules",
    "dist",
    "build",
    ".git",
    "vendor",
    "__pycache__"
  ],
  "severityThreshold": "medium",
  "enabledChecks": {
    "complexity": true,
    "duplication": true,
    "security": true,
    "standards": true,
    "deadCode": true
  },
  "languageSpecific": {
    "javascript": {
      "eslintConfig": ".eslintrc.js",
      "useTypescript": true
    },
    "java": {
      "pmdRuleset": "rulesets/java/quickstart.xml"
    }
  },
  "reporting": {
    "formats": ["json", "markdown", "html"],
    "outputDir": "./analysis-report"
  }
}
```

### SonarQube Integration

If using SonarQube MCP Server:

```json
{
  "sonarqube": {
    "serverUrl": "https://sonarcloud.io",
    "projectKey": "my-organization_my-project",
    "token": "${SONAR_TOKEN}"
  }
}
```

### ast-grep Configuration

For custom AST patterns, create `.ast-grep.yml`:

```yaml
rules:
  - id: no-console-log
    language: javascript
    rule:
      pattern: console.log($$$)
    message: Remove console.log statements before production
    severity: warning
```

## Output Examples

### Summary Report (JSON)

```json
{
  "analysisId": "analysis-20260124-143022",
  "timestamp": "2026-01-24T14:30:22Z",
  "target": {
    "path": "./src",
    "languages": ["javascript", "typescript"],
    "filesAnalyzed": 245,
    "linesOfCode": 28450
  },
  "metrics": {
    "complexity": {
      "average": 4.2,
      "max": 28,
      "hotspots": 12
    },
    "duplication": {
      "percentage": 3.8,
      "cloneCount": 24,
      "duplicatedLines": 1082
    },
    "maintainability": {
      "index": 78,
      "grade": "B"
    },
    "technicalDebt": {
      "estimatedHours": 42,
      "ratio": 2.1
    }
  },
  "migrationReadiness": {
    "score": 72,
    "grade": "B",
    "recommendation": "Proceed with migration with moderate remediation"
  }
}
```

### Findings Report (Markdown)

```markdown
# Static Analysis Findings

## Critical Issues (2)
- **src/auth/login.js:45** - Hardcoded API key detected
- **src/db/queries.js:123** - Potential SQL injection

## High Severity (8)
- **src/utils/parser.js:67** - Cyclomatic complexity of 28 (threshold: 10)
...
```

## Integration with Babysitter SDK

### Using in a Process

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

export const analyzeCodebaseTask = defineTask('analyze-codebase', (args, ctx) => ({
  kind: 'skill',
  title: 'Static Code Analysis',
  skill: {
    name: 'static-code-analyzer',
    context: {
      targetPath: args.targetPath,
      analysisScope: args.scope || 'full',
      outputFormat: 'json'
    }
  },
  io: {
    inputJsonPath: `tasks/${ctx.effectId}/input.json`,
    outputJsonPath: `tasks/${ctx.effectId}/result.json`
  }
}));
```

### Process Integration

This skill is used by these migration processes:

1. **legacy-codebase-assessment** - Initial assessment phase
2. **migration-planning-roadmap** - Risk identification
3. **code-refactoring** - Target identification
4. **technical-debt-remediation** - Debt prioritization

## Troubleshooting

### Common Issues

**Tool not found**
```
Error: eslint command not found
```
Solution: Install the missing tool or configure the skill to skip it.

**Out of memory**
```
Error: JavaScript heap out of memory
```
Solution: Increase Node.js memory limit or use incremental analysis.

**Timeout on large codebases**
```
Error: Analysis timed out after 30 minutes
```
Solution: Use `analysisScope: 'quick'` or exclude large directories.

### Debug Mode

Enable verbose logging:

```json
{
  "debug": true,
  "logLevel": "verbose"
}
```

## Best Practices

1. **Establish Baselines**: Run analysis before starting migration to establish baseline metrics
2. **Incremental Scanning**: For CI/CD, scan only changed files
3. **Custom Rules**: Add project-specific rules for domain patterns
4. **Regular Reviews**: Schedule periodic full scans
5. **Track Trends**: Monitor metrics over time to measure progress

## Related Documentation

- [SKILL.md](./SKILL.md) - Full skill specification
- [SonarQube MCP Server](https://github.com/SonarSource/sonarqube-mcp-server)
- [ast-grep Documentation](https://ast-grep.github.io/)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |
