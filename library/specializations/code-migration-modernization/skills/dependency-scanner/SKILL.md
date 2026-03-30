---
name: dependency-scanner
description: Comprehensive dependency scanning, inventory generation, and SBOM creation for migration readiness assessment
allowed-tools: ["Bash", "Read", "Write", "Grep", "Glob", "Edit"]
---

# Dependency Scanner Skill

Performs comprehensive dependency scanning and inventory generation for codebases, supporting migration planning and security assessments through SBOM (Software Bill of Materials) generation.

## Purpose

Enable comprehensive dependency management for:
- Direct and transitive dependency extraction
- Dependency tree visualization
- Version conflict detection
- Circular dependency identification
- License extraction and compliance
- SBOM generation (CycloneDX, SPDX formats)

## Capabilities

### 1. Direct/Transitive Dependency Extraction
- Parse package manifests (package.json, pom.xml, requirements.txt, etc.)
- Resolve full dependency trees including transitive dependencies
- Identify version constraints and resolution results
- Track dependency sources and registries

### 2. Dependency Tree Visualization
- Generate hierarchical dependency graphs
- Export to DOT, JSON, or Mermaid formats
- Highlight problematic paths
- Calculate tree depth and breadth metrics

### 3. Version Conflict Detection
- Identify version conflicts in dependency trees
- Detect peer dependency violations
- Find incompatible version ranges
- Suggest resolution strategies

### 4. Circular Dependency Identification
- Detect circular dependency chains
- Map dependency cycles
- Assess impact of circular dependencies
- Recommend breaking strategies

### 5. License Extraction
- Extract license information from dependencies
- Identify license types (MIT, Apache, GPL, etc.)
- Flag copyleft licenses
- Track dual-licensed packages

### 6. SBOM Generation
- Generate CycloneDX format SBOMs
- Generate SPDX format SBOMs
- Include vulnerability references
- Support machine-readable and human-readable outputs

## Tool Integrations

This skill can leverage the following external tools when available:

| Tool | Purpose | Integration Method |
|------|---------|-------------------|
| npm/yarn/pnpm | Node.js dependencies | CLI |
| Maven | Java dependencies | CLI |
| Gradle | Java/Kotlin dependencies | CLI |
| pip/pipenv/poetry | Python dependencies | CLI |
| Bundler | Ruby dependencies | CLI |
| Cargo | Rust dependencies | CLI |
| Go Modules | Go dependencies | CLI |
| Snyk | Security scanning | CLI / API |
| OWASP Dependency-Check | Vulnerability scanning | CLI |
| Trivy | SBOM generation | MCP Server / CLI |
| Syft | SBOM generation | CLI |

## Usage

### Basic Scanning

```bash
# Invoke skill for dependency scanning
# The skill will auto-detect package managers and scan accordingly

# Expected inputs:
# - targetPath: Path to project root
# - scanDepth: 'direct' | 'transitive' | 'full'
# - outputFormat: 'json' | 'tree' | 'sbom-cyclonedx' | 'sbom-spdx'
# - includeLicenses: boolean
```

### Scanning Workflow

1. **Detection Phase**
   - Identify package managers in use
   - Locate manifest files
   - Check for lock files

2. **Extraction Phase**
   - Parse manifest files
   - Resolve dependency trees
   - Extract version information

3. **Analysis Phase**
   - Detect conflicts
   - Identify circular dependencies
   - Extract licenses

4. **Output Generation**
   - Generate inventory reports
   - Create SBOMs if requested
   - Produce visualization artifacts

## Output Schema

```json
{
  "scanId": "string",
  "timestamp": "ISO8601",
  "target": {
    "path": "string",
    "packageManagers": ["string"],
    "manifestFiles": ["string"]
  },
  "summary": {
    "totalDependencies": "number",
    "directDependencies": "number",
    "transitiveDependencies": "number",
    "uniquePackages": "number",
    "treeDepth": "number"
  },
  "dependencies": [
    {
      "name": "string",
      "version": "string",
      "type": "direct|transitive",
      "parent": "string|null",
      "license": "string",
      "repository": "string",
      "depth": "number"
    }
  ],
  "conflicts": [
    {
      "package": "string",
      "versions": ["string"],
      "sources": ["string"],
      "recommendation": "string"
    }
  ],
  "circularDependencies": [
    {
      "chain": ["string"],
      "severity": "high|medium|low"
    }
  ],
  "licenses": {
    "summary": {
      "MIT": "number",
      "Apache-2.0": "number",
      "GPL-3.0": "number"
    },
    "copyleft": ["string"],
    "unknown": ["string"]
  },
  "sbom": {
    "format": "cyclonedx|spdx",
    "version": "string",
    "path": "string"
  }
}
```

## Integration with Migration Processes

This skill integrates with the following Code Migration/Modernization processes:

- **dependency-analysis-updates**: Primary tool for dependency assessment
- **legacy-codebase-assessment**: Dependency inventory for legacy systems
- **framework-upgrade**: Compatibility analysis for upgrades
- **cloud-migration**: Dependency portability assessment

## Configuration

### Skill Configuration File

Create `.dependency-scanner.json` in the project root:

```json
{
  "packageManagers": ["auto"],
  "excludePaths": ["node_modules", ".git"],
  "scanDepth": "full",
  "includeDev": true,
  "includeOptional": false,
  "licensePolicy": {
    "allowed": ["MIT", "Apache-2.0", "BSD-3-Clause", "ISC"],
    "flagged": ["GPL-3.0", "AGPL-3.0"],
    "blocked": []
  },
  "sbomConfig": {
    "format": "cyclonedx",
    "version": "1.5",
    "includeVulnerabilities": true
  }
}
```

## MCP Server Integration

When Trivy SBOM Generator MCP Server is available:

```javascript
// Example MCP tool invocation
{
  "tool": "trivy_generate_sbom",
  "arguments": {
    "target": "./",
    "format": "cyclonedx",
    "output": "./sbom.json"
  }
}
```

When GitHub Dependabot MCP Server is available:

```javascript
// Example dependency update check
{
  "tool": "dependabot_check_updates",
  "arguments": {
    "repo": "owner/repo",
    "ecosystem": "npm"
  }
}
```

## Package Manager Support

### Node.js (npm/yarn/pnpm)

```bash
# Auto-detected files:
# - package.json
# - package-lock.json
# - yarn.lock
# - pnpm-lock.yaml
```

### Java (Maven/Gradle)

```bash
# Auto-detected files:
# - pom.xml
# - build.gradle
# - build.gradle.kts
```

### Python (pip/pipenv/poetry)

```bash
# Auto-detected files:
# - requirements.txt
# - Pipfile
# - pyproject.toml
# - setup.py
```

### Ruby (Bundler)

```bash
# Auto-detected files:
# - Gemfile
# - Gemfile.lock
```

### Go (Modules)

```bash
# Auto-detected files:
# - go.mod
# - go.sum
```

### Rust (Cargo)

```bash
# Auto-detected files:
# - Cargo.toml
# - Cargo.lock
```

## Best Practices

1. **Lock File Usage**: Always include lock files for reproducible scans
2. **Regular Scanning**: Integrate into CI/CD for continuous monitoring
3. **SBOM Storage**: Store SBOMs alongside releases for compliance
4. **License Reviews**: Review license changes in dependency updates
5. **Conflict Resolution**: Address version conflicts before migration

## Related Skills

- `vulnerability-scanner`: Security scanning of dependencies
- `license-compliance-checker`: Detailed license analysis
- `dependency-updater`: Automated dependency updates

## Related Agents

- `dependency-modernization-agent`: Uses this skill for dependency management
- `migration-readiness-assessor`: Uses this skill for readiness evaluation
- `security-vulnerability-assessor`: Uses this skill for dependency security

## References

- [SBOM Generator MCP Server (Trivy)](https://playbooks.com/mcp/trivy-sbom-generator)
- [GitHub Dependabot MCP Server](https://mcp.so/server/github-dependabot-mcp-server)
- [Renovate](https://github.com/renovatebot/renovate)
- [OWASP Dependency-Check](https://github.com/jeremylong/DependencyCheck)
- [CycloneDX Specification](https://cyclonedx.org/)
- [SPDX Specification](https://spdx.dev/)
