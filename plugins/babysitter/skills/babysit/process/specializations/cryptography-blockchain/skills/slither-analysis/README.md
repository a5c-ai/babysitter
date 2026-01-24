# Slither Static Analysis Skill

Expert integration with Slither, the leading static analysis framework for Solidity smart contracts.

## Overview

This skill provides comprehensive capabilities for using Slither to detect vulnerabilities, analyze code quality, and generate security reports for Solidity smart contracts.

## Key Capabilities

- **Vulnerability Detection**: Run 80+ built-in security detectors
- **Code Quality**: Identify optimization opportunities and style issues
- **Visual Analysis**: Generate call graphs and inheritance diagrams
- **CI/CD Integration**: Automate security checks in pipelines
- **Custom Detectors**: Develop project-specific analysis rules

## Quick Start

```bash
# Install Slither
pip install slither-analyzer

# Run analysis
slither . --foundry-compile-all

# Generate JSON report
slither . --json report.json
```

## Common Commands

```bash
# Run specific detectors
slither . --detect reentrancy-eth,unchecked-transfer

# Exclude paths
slither . --filter-paths "test|lib"

# Generate call graph
slither . --print call-graph
```

## Related Resources

- [SKILL.md](./SKILL.md) - Full skill specification
- [Slither GitHub](https://github.com/crytic/slither)
- [Detector Documentation](https://github.com/crytic/slither/wiki/Detector-Documentation)

## Process Integration

- `smart-contract-security-audit.js`
- `smart-contract-development-lifecycle.js`
- `formal-verification.js`
