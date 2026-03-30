# Dependency Scanner Skill

## Overview

The Dependency Scanner skill provides comprehensive dependency scanning and inventory generation for codebases across multiple programming languages and package managers. It supports SBOM generation and integrates with security scanning tools.

## Quick Start

### Prerequisites

- Target codebase with package manifest files
- Package manager CLIs installed (npm, maven, pip, etc.)
- Optional: Trivy, Syft, or Snyk for enhanced scanning

### Basic Usage

1. **Navigate to target project**
   ```bash
   cd /path/to/target/project
   ```

2. **Run dependency scan**
   ```bash
   # The skill auto-detects package managers
   # Output includes dependency tree and SBOM
   ```

3. **Review results**
   - `dependency-report/inventory.json` - Full dependency list
   - `dependency-report/tree.json` - Hierarchical tree
   - `dependency-report/sbom.json` - CycloneDX SBOM
   - `dependency-report/licenses.md` - License summary

## Features

### Multi-Language Support

| Language | Package Manager | Manifest File |
|----------|----------------|---------------|
| JavaScript/TypeScript | npm, yarn, pnpm | package.json |
| Java | Maven, Gradle | pom.xml, build.gradle |
| Python | pip, pipenv, poetry | requirements.txt, Pipfile |
| Ruby | Bundler | Gemfile |
| Go | Go Modules | go.mod |
| Rust | Cargo | Cargo.toml |
| PHP | Composer | composer.json |
| .NET | NuGet | *.csproj, packages.config |

### SBOM Generation

Supports industry-standard SBOM formats:

| Format | Version | Use Case |
|--------|---------|----------|
| CycloneDX | 1.5 | Security scanning, compliance |
| SPDX | 2.3 | License compliance, supply chain |

### Conflict Detection

Automatically detects and reports:

- Version conflicts between direct dependencies
- Peer dependency violations
- Incompatible version ranges
- Multiple versions of the same package

### License Analysis

Tracks and categorizes licenses:

```json
{
  "licenses": {
    "permissive": ["MIT", "Apache-2.0", "BSD-3-Clause"],
    "copyleft": ["GPL-3.0", "LGPL-3.0"],
    "unknown": ["Custom", "UNLICENSED"]
  }
}
```

## Configuration

### Project Configuration

Create `.dependency-scanner.json`:

```json
{
  "packageManagers": ["auto"],
  "scanDepth": "full",
  "excludePaths": [
    "node_modules",
    ".git",
    "dist",
    "build"
  ],
  "includeDev": true,
  "includeOptional": false,
  "licensePolicy": {
    "allowed": [
      "MIT",
      "Apache-2.0",
      "BSD-2-Clause",
      "BSD-3-Clause",
      "ISC",
      "CC0-1.0"
    ],
    "flagged": [
      "GPL-3.0",
      "AGPL-3.0",
      "LGPL-3.0"
    ],
    "blocked": []
  },
  "sbomConfig": {
    "formats": ["cyclonedx", "spdx"],
    "includeVulnerabilities": true,
    "includeLicenses": true
  },
  "output": {
    "directory": "./dependency-report",
    "formats": ["json", "markdown"]
  }
}
```

### Environment Variables

```bash
# Optional: Configure registry access
NPM_TOKEN=your_npm_token
MAVEN_SETTINGS=path/to/settings.xml
PYPI_TOKEN=your_pypi_token
```

## Output Examples

### Dependency Inventory (JSON)

```json
{
  "scanId": "scan-20260124-143022",
  "timestamp": "2026-01-24T14:30:22Z",
  "summary": {
    "totalDependencies": 847,
    "directDependencies": 42,
    "transitiveDependencies": 805,
    "uniquePackages": 523,
    "treeDepth": 12
  },
  "packageManagers": [
    {
      "type": "npm",
      "manifestFile": "package.json",
      "lockFile": "package-lock.json"
    }
  ],
  "conflicts": [
    {
      "package": "lodash",
      "versions": ["4.17.21", "4.17.15"],
      "sources": ["express@4.18.2", "gulp@4.0.2"],
      "recommendation": "Upgrade gulp to resolve conflict"
    }
  ]
}
```

### License Summary (Markdown)

```markdown
# License Summary

## Overview
- Total packages: 523
- Unique licenses: 12
- Compliance issues: 2

## License Distribution

| License | Count | Percentage |
|---------|-------|------------|
| MIT | 342 | 65.4% |
| Apache-2.0 | 98 | 18.7% |
| ISC | 45 | 8.6% |
| BSD-3-Clause | 23 | 4.4% |
| GPL-3.0 | 2 | 0.4% |

## Flagged Packages

| Package | License | Action Required |
|---------|---------|-----------------|
| gpl-package@1.0.0 | GPL-3.0 | Legal review |
| other-gpl@2.0.0 | GPL-3.0 | Legal review |
```

### SBOM (CycloneDX)

```json
{
  "bomFormat": "CycloneDX",
  "specVersion": "1.5",
  "version": 1,
  "metadata": {
    "timestamp": "2026-01-24T14:30:22Z",
    "tools": [
      {
        "vendor": "Babysitter SDK",
        "name": "dependency-scanner",
        "version": "1.0.0"
      }
    ],
    "component": {
      "type": "application",
      "name": "my-project",
      "version": "1.0.0"
    }
  },
  "components": [
    {
      "type": "library",
      "name": "express",
      "version": "4.18.2",
      "purl": "pkg:npm/express@4.18.2",
      "licenses": [
        {
          "license": {
            "id": "MIT"
          }
        }
      ]
    }
  ]
}
```

## Integration with Babysitter SDK

### Using in a Process

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

export const scanDependenciesTask = defineTask('scan-dependencies', (args, ctx) => ({
  kind: 'skill',
  title: 'Dependency Scanning',
  skill: {
    name: 'dependency-scanner',
    context: {
      targetPath: args.projectPath,
      scanDepth: 'full',
      outputFormat: 'json',
      generateSbom: true
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

1. **dependency-analysis-updates** - Full dependency audit
2. **legacy-codebase-assessment** - Dependency inventory
3. **framework-upgrade** - Compatibility checking
4. **cloud-migration** - Portability assessment

## CLI Examples

### Generate Full Inventory

```bash
# Using npm
npm ls --all --json > deps.json

# Using Maven
mvn dependency:tree -DoutputType=json

# Using pip
pip-compile --generate-hashes requirements.in
```

### Generate SBOM with Trivy

```bash
# Generate CycloneDX SBOM
trivy fs --format cyclonedx --output sbom.json .

# Generate SPDX SBOM
trivy fs --format spdx-json --output sbom-spdx.json .
```

### Check for Outdated Dependencies

```bash
# npm
npm outdated --json

# Maven
mvn versions:display-dependency-updates

# pip
pip list --outdated --format=json
```

## Troubleshooting

### Common Issues

**Missing lock file**
```
Warning: No lock file found, results may vary
```
Solution: Generate lock file first (`npm install`, `mvn install`, etc.)

**Private registry access**
```
Error: 401 Unauthorized accessing private registry
```
Solution: Configure registry credentials in environment or config file

**Incomplete tree**
```
Warning: Some transitive dependencies could not be resolved
```
Solution: Ensure all registries are accessible and credentials are valid

### Debug Mode

Enable verbose logging:

```json
{
  "debug": true,
  "logLevel": "verbose",
  "showResolutionDetails": true
}
```

## Best Practices

1. **Lock Files**: Always commit lock files to version control
2. **Regular Scans**: Integrate scanning into CI/CD pipelines
3. **SBOM Archival**: Store SBOMs with each release
4. **License Reviews**: Review license changes in PRs
5. **Update Strategy**: Establish a regular update cadence

## Related Documentation

- [SKILL.md](./SKILL.md) - Full skill specification
- [Trivy Documentation](https://aquasecurity.github.io/trivy/)
- [CycloneDX Specification](https://cyclonedx.org/specification/overview/)
- [SPDX Specification](https://spdx.dev/specifications/)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |
