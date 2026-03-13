---
name: static-code-analyzer
description: Deep static analysis of codebases for quality, complexity, and migration readiness assessment
allowed-tools: ["Bash", "Read", "Write", "Grep", "Glob", "Edit"]
---

# Static Code Analyzer Skill

Performs comprehensive static analysis of codebases to assess code quality, complexity metrics, and migration readiness. This skill integrates with industry-standard tools to provide actionable insights for migration planning.

## Purpose

Enable deep static analysis of codebases for:
- Code quality assessment
- Complexity measurement
- Migration readiness evaluation
- Technical debt quantification
- Security vulnerability scanning (SAST)

## Capabilities

### 1. Cyclomatic Complexity Measurement
- Analyze control flow complexity
- Identify high-complexity functions/methods
- Generate complexity reports by module/package
- Track complexity trends over time

### 2. Code Duplication Detection (Clone Detection)
- Detect exact code clones
- Identify near-duplicates and structural clones
- Calculate duplication percentage
- Map clone relationships

### 3. Dead Code Identification
- Find unreachable code paths
- Identify unused functions/methods
- Detect orphaned imports and exports
- Flag obsolete feature flags

### 4. Security Vulnerability Scanning (SAST)
- Scan for common security anti-patterns
- Identify injection vulnerabilities
- Check for hardcoded secrets
- Assess authentication/authorization patterns

### 5. Maintainability Index Calculation
- Calculate composite maintainability scores
- Assess code readability metrics
- Evaluate documentation coverage
- Measure API surface complexity

### 6. Coding Standards Compliance
- Check against language-specific style guides
- Validate naming conventions
- Verify structural patterns
- Assess best practices adherence

## Tool Integrations

This skill can leverage the following external tools when available:

| Tool | Purpose | Integration Method |
|------|---------|-------------------|
| SonarQube | Comprehensive code quality | MCP Server / API |
| CodeClimate | Quality metrics | API |
| ESLint | JavaScript/TypeScript linting | CLI |
| PMD | Java static analysis | CLI |
| FindBugs/SpotBugs | Java bug detection | CLI |
| Checkstyle | Java code standards | CLI |
| ast-grep | AST-based pattern matching | MCP Server / CLI |
| Semgrep | Security-focused SAST | CLI |

## Usage

### Basic Analysis

```bash
# Invoke skill for basic analysis
# The skill will auto-detect language and apply appropriate analyzers

# Expected inputs:
# - targetPath: Path to codebase or directory to analyze
# - analysisScope: 'full' | 'quick' | 'security' | 'quality'
# - outputFormat: 'json' | 'markdown' | 'html'
```

### Analysis Workflow

1. **Discovery Phase**
   - Detect programming languages present
   - Identify project structure and build systems
   - Check for existing configuration files

2. **Tool Selection**
   - Select appropriate analyzers based on languages
   - Configure tool-specific settings
   - Validate tool availability

3. **Analysis Execution**
   - Run selected analyzers
   - Collect metrics and findings
   - Aggregate results

4. **Report Generation**
   - Consolidate findings
   - Calculate composite scores
   - Generate actionable recommendations

## Output Schema

```json
{
  "analysisId": "string",
  "timestamp": "ISO8601",
  "target": {
    "path": "string",
    "languages": ["string"],
    "filesAnalyzed": "number",
    "linesOfCode": "number"
  },
  "metrics": {
    "complexity": {
      "average": "number",
      "max": "number",
      "distribution": {}
    },
    "duplication": {
      "percentage": "number",
      "cloneCount": "number",
      "duplicatedLines": "number"
    },
    "maintainability": {
      "index": "number",
      "grade": "A-F"
    },
    "technicalDebt": {
      "estimatedHours": "number",
      "ratio": "number"
    }
  },
  "findings": [
    {
      "type": "string",
      "severity": "critical|high|medium|low|info",
      "file": "string",
      "line": "number",
      "message": "string",
      "rule": "string",
      "recommendation": "string"
    }
  ],
  "migrationReadiness": {
    "score": "number (0-100)",
    "blockers": [],
    "risks": [],
    "recommendations": []
  }
}
```

## Integration with Migration Processes

This skill integrates with the following Code Migration/Modernization processes:

- **legacy-codebase-assessment**: Primary tool for initial codebase evaluation
- **code-refactoring**: Identifies refactoring targets
- **technical-debt-remediation**: Quantifies and prioritizes debt

## Configuration

### Skill Configuration File

Create `.static-analyzer.json` in the project root:

```json
{
  "excludePaths": ["node_modules", "dist", "build", ".git"],
  "severityThreshold": "medium",
  "enabledChecks": {
    "complexity": true,
    "duplication": true,
    "security": true,
    "standards": true
  },
  "customRules": [],
  "reportFormats": ["json", "markdown"]
}
```

## MCP Server Integration

When SonarQube MCP Server is available:

```javascript
// Example MCP tool invocation
{
  "tool": "sonarqube_analyze",
  "arguments": {
    "project_key": "my-project",
    "sources": "./src",
    "language": "javascript"
  }
}
```

When ast-grep MCP Server is available:

```javascript
// Example AST pattern search
{
  "tool": "ast_grep_search",
  "arguments": {
    "pattern": "console.log($$$)",
    "language": "javascript",
    "path": "./src"
  }
}
```

## Best Practices

1. **Incremental Analysis**: For large codebases, use incremental analysis to reduce time
2. **Baseline Establishment**: Create baseline metrics before migration
3. **Threshold Configuration**: Set appropriate thresholds for your team's standards
4. **Trend Tracking**: Track metrics over time to measure improvement
5. **Integration Testing**: Validate analysis results against known issues

## Related Skills

- `code-smell-detector`: Specialized smell detection
- `technical-debt-quantifier`: Debt measurement and prioritization
- `test-coverage-analyzer`: Coverage gap identification

## Related Agents

- `legacy-system-archaeologist`: Uses this skill for codebase exploration
- `migration-readiness-assessor`: Uses this skill for readiness scoring
- `technical-debt-auditor`: Uses this skill for debt assessment

## References

- [SonarQube MCP Server](https://github.com/SonarSource/sonarqube-mcp-server)
- [ast-grep MCP Server](https://github.com/ast-grep/ast-grep-mcp)
- [SonarQube Documentation](https://docs.sonarsource.com/)
- [ast-grep Documentation](https://ast-grep.github.io/)
