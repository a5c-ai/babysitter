---
name: slither-analysis
description: Expert integration with Slither static analyzer for smart contract vulnerability detection, code quality analysis, and security reporting. Supports all Slither detectors and custom analysis configurations.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# Slither Static Analysis Skill

Expert-level integration with Slither, the leading static analysis framework for Solidity smart contracts.

## Capabilities

- **Full Detector Suite**: Execute Slither with all built-in detectors
- **Custom Configurations**: Configure analysis parameters and exclusions
- **Severity Classification**: Interpret and classify finding severity
- **False Positive Filtering**: Context-aware false positive identification
- **Visual Analysis**: Generate call graphs and inheritance diagrams
- **Custom Detectors**: Run and develop custom Slither detectors
- **Reporting**: Produce comprehensive security reports

## Installation

```bash
# Install via pip
pip install slither-analyzer

# Or via pipx for isolation
pipx install slither-analyzer

# Verify installation
slither --version
```

## Basic Usage

### Run Analysis

```bash
# Analyze single file
slither Contract.sol

# Analyze Foundry project
slither . --foundry-compile-all

# Analyze Hardhat project
slither . --hardhat-compile-all
```

### Output Formats

```bash
# Human readable (default)
slither .

# JSON output for processing
slither . --json output.json

# Markdown report
slither . --checklist

# SARIF for CI integration
slither . --sarif output.sarif
```

## Detector Categories

### High Severity Detectors

| Detector | Description |
|----------|-------------|
| `reentrancy-eth` | Reentrancy with ETH transfer |
| `reentrancy-no-eth` | Reentrancy without ETH |
| `arbitrary-send-eth` | Arbitrary ETH send |
| `controlled-delegatecall` | Controlled delegatecall |
| `suicidal` | Functions allowing anyone to destruct |
| `uninitialized-storage` | Uninitialized storage variables |

### Medium Severity Detectors

| Detector | Description |
|----------|-------------|
| `reentrancy-benign` | Benign reentrancy |
| `incorrect-equality` | Dangerous strict equality |
| `locked-ether` | Contracts that lock ether |
| `missing-zero-check` | Missing zero address validation |
| `unchecked-transfer` | Unchecked token transfers |

### Low Severity Detectors

| Detector | Description |
|----------|-------------|
| `naming-convention` | Naming convention violations |
| `external-function` | Functions that could be external |
| `constable-states` | State variables that could be constant |
| `immutable-states` | State variables that could be immutable |

## Configuration

### slither.config.json

```json
{
  "detectors_to_run": "all",
  "exclude_informational": false,
  "exclude_low": false,
  "exclude_medium": false,
  "exclude_high": false,
  "exclude_optimization": false,
  "fail_on": "high,medium",
  "filter_paths": [
    "node_modules",
    "lib",
    "test"
  ],
  "exclude_dependencies": true,
  "legacy_ast": false
}
```

### CLI Configuration

```bash
# Run specific detectors
slither . --detect reentrancy-eth,uninitialized-storage

# Exclude detectors
slither . --exclude naming-convention,external-function

# Filter by severity
slither . --exclude-informational --exclude-low

# Exclude specific paths
slither . --filter-paths "test|lib|node_modules"
```

## Advanced Features

### Call Graph Generation

```bash
# Generate call graph
slither . --print call-graph

# Generate inheritance graph
slither . --print inheritance-graph

# Generate contract summary
slither . --print contract-summary
```

### Function Analysis

```bash
# Print function summaries
slither . --print function-summary

# Print variable order (storage layout)
slither . --print variable-order

# Print data dependency
slither . --print data-dependency
```

### Custom Detectors

```python
# custom_detector.py
from slither.detectors.abstract_detector import AbstractDetector, DetectorClassification

class MyCustomDetector(AbstractDetector):
    ARGUMENT = "my-detector"
    HELP = "Detect my custom issue"
    IMPACT = DetectorClassification.HIGH
    CONFIDENCE = DetectorClassification.HIGH

    WIKI = "https://example.com/my-detector"
    WIKI_TITLE = "My Custom Detector"
    WIKI_DESCRIPTION = "Detects..."
    WIKI_EXPLOIT_SCENARIO = "..."
    WIKI_RECOMMENDATION = "..."

    def _detect(self):
        results = []
        for contract in self.compilation_unit.contracts_derived:
            for function in contract.functions:
                # Detection logic
                if self._has_issue(function):
                    info = [function, " has an issue\n"]
                    results.append(self.generate_result(info))
        return results
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Slither Analysis
on: [push, pull_request]

jobs:
  slither:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install Foundry
        uses: foundry-rs/foundry-toolchain@v1

      - name: Install Slither
        run: pip install slither-analyzer

      - name: Run Slither
        run: slither . --foundry-compile-all --fail-on high --sarif results.sarif

      - name: Upload SARIF
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: results.sarif
```

## Interpreting Results

### Result Structure

```json
{
  "success": true,
  "error": null,
  "results": {
    "detectors": [
      {
        "check": "reentrancy-eth",
        "impact": "High",
        "confidence": "Medium",
        "description": "Reentrancy in Contract.withdraw()...",
        "elements": [...],
        "first_markdown_element": "...",
        "id": "abc123"
      }
    ]
  }
}
```

### Triage Workflow

1. **High/Medium Impact** - Investigate immediately
2. **Check Confidence Level** - High confidence = likely real issue
3. **Review Code Context** - Understand the actual flow
4. **Verify with Tests** - Write tests to confirm behavior
5. **Document Decisions** - Mark false positives with rationale

## Process Integration

| Process | Purpose |
|---------|---------|
| `smart-contract-security-audit.js` | Primary security analysis |
| `smart-contract-development-lifecycle.js` | Development validation |
| `formal-verification.js` | Pre-verification checks |

## Tools Reference

| Tool | Purpose |
|------|---------|
| **Slither** | Core static analyzer |
| **crytic-compile** | Compilation framework |
| **slither-doctor** | Configuration debugger |

## Best Practices

- Run Slither on every commit in CI
- Configure appropriate exclusions to reduce noise
- Review all high/medium findings manually
- Write custom detectors for project-specific patterns
- Use `--triage-database` to track false positives

## See Also

- `skills/mythril-symbolic/SKILL.md` - Symbolic execution analysis
- `skills/echidna-fuzzer/SKILL.md` - Property-based fuzzing
- `agents/solidity-auditor/AGENT.md` - Security auditor agent
- [Slither Documentation](https://github.com/crytic/slither)
