---
name: mythril-symbolic
description: Symbolic execution analysis using Mythril for deep vulnerability detection in smart contracts. Supports configurable transaction depth, timeout settings, and proof-of-concept exploit generation.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# Mythril Symbolic Execution Skill

Deep vulnerability detection through symbolic execution using Mythril, a security analysis tool for EVM bytecode.

## Capabilities

- **Symbolic Execution**: Configure and run symbolic execution analysis
- **Transaction Depth Control**: Set appropriate depth for complex interactions
- **Trace Analysis**: Interpret symbolic execution traces
- **Integer Issues**: Detect overflow/underflow paths (pre-0.8 Solidity)
- **State Analysis**: Find reentrancy via state change analysis
- **Assertion Detection**: Identify assertion failures and edge cases
- **PoC Generation**: Generate proof-of-concept exploit inputs

## Installation

```bash
# Install via pip
pip install mythril

# Or use Docker (recommended)
docker pull mythril/myth

# Verify installation
myth version
```

## Basic Usage

### Analyze Source Code

```bash
# Analyze single file
myth analyze Contract.sol

# Analyze with Solidity version
myth analyze Contract.sol --solv 0.8.20

# Analyze specific contract
myth analyze Contract.sol:MyContract
```

### Analyze Bytecode

```bash
# Analyze deployed contract
myth analyze -a 0x<address> --rpc <rpc_url>

# Analyze bytecode file
myth analyze --bin-runtime contract.bin
```

## Configuration Options

### Transaction Depth

```bash
# Default depth (2)
myth analyze Contract.sol

# Increased depth for complex interactions
myth analyze Contract.sol --execution-timeout 300 -t 3

# Deep analysis (slow)
myth analyze Contract.sol --execution-timeout 600 -t 4
```

### Timeout Settings

```bash
# Set execution timeout (seconds)
myth analyze Contract.sol --execution-timeout 300

# Set solver timeout
myth analyze Contract.sol --solver-timeout 10000

# Quick scan
myth analyze Contract.sol --execution-timeout 60 -t 2
```

### Module Selection

```bash
# Run specific modules
myth analyze Contract.sol --modules ether_thief,suicide

# Available modules
# - ether_thief
# - suicide
# - integer_overflow/underflow
# - delegatecall
# - arbitrary_write
# - state_change_external_call
```

## Output Formats

### Standard Output

```bash
myth analyze Contract.sol
```

### JSON Output

```bash
myth analyze Contract.sol -o json > report.json
```

### Markdown Output

```bash
myth analyze Contract.sol -o markdown > report.md
```

### JSONV2 (Detailed)

```bash
myth analyze Contract.sol -o jsonv2 > detailed.json
```

## Vulnerability Detection

### Reentrancy Detection

Mythril detects reentrancy by tracking:
- External calls
- State changes after calls
- ETH transfers

```
==== External Call To User-Supplied Address ====
SWC ID: 107
Severity: Low
Contract: Vulnerable
Function name: withdraw()
PC address: 1234
Estimated Gas Usage: 2500 - 10000
Type: Informational
...
```

### Integer Overflow/Underflow

```
==== Integer Overflow ====
SWC ID: 101
Severity: High
Contract: Token
Function name: transfer(address,uint256)
PC address: 567
Estimated Gas Usage: 3000 - 5000
A possible integer overflow exists in the function...
```

### Unprotected Self-Destruct

```
==== Unprotected Selfdestruct ====
SWC ID: 106
Severity: High
Contract: Vulnerable
Function name: kill()
Any sender can trigger self-destruction...
```

## Advanced Usage

### Concolic Execution

```bash
# Use concrete values where possible
myth analyze Contract.sol --strategy dfs --execution-timeout 300
```

### Custom Constraints

```bash
# Analyze with constraints file
myth analyze Contract.sol --constraints constraints.json
```

### State Space Pruning

```bash
# Limit state explosion
myth analyze Contract.sol --max-depth 30 --call-depth-limit 3
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Mythril Analysis
on: [push]

jobs:
  mythril:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run Mythril
        uses: docker://mythril/myth
        with:
          args: analyze /github/workspace/contracts/*.sol --solv 0.8.20
```

### Custom Script

```bash
#!/bin/bash
for file in contracts/*.sol; do
    myth analyze "$file" --solv 0.8.20 -o json > "reports/$(basename $file .sol).json"
done
```

## Interpreting Results

### Severity Levels

| Level | Description | Action |
|-------|-------------|--------|
| High | Critical vulnerability | Fix immediately |
| Medium | Potential issue | Investigate |
| Low | Minor concern | Consider fixing |
| Informational | Code quality | Optional fix |

### SWC Registry

| SWC ID | Name | Description |
|--------|------|-------------|
| SWC-101 | Integer Overflow | Arithmetic overflow |
| SWC-104 | Unchecked Return | Ignored return values |
| SWC-106 | Unprotected Destruct | Accessible selfdestruct |
| SWC-107 | Reentrancy | State change after call |
| SWC-110 | Assert Violation | Reachable assertion |
| SWC-116 | Timestamp Dependence | Block timestamp usage |

## Process Integration

| Process | Purpose |
|---------|---------|
| `smart-contract-security-audit.js` | Deep vulnerability analysis |
| `smart-contract-fuzzing.js` | Complement to fuzzing |
| `invariant-testing.js` | Property verification |

## Comparison with Other Tools

| Tool | Technique | Speed | Depth |
|------|-----------|-------|-------|
| **Mythril** | Symbolic Execution | Slow | Deep |
| **Slither** | Static Analysis | Fast | Surface |
| **Echidna** | Fuzzing | Medium | Medium |
| **Certora** | Formal Verification | Slow | Deepest |

## Best Practices

1. Start with quick scans, increase depth as needed
2. Use Docker for consistent environment
3. Run on CI for automated security checks
4. Combine with static analysis (Slither)
5. Verify findings manually before reporting
6. Use appropriate Solidity version flag

## Troubleshooting

### Out of Memory

```bash
# Increase timeout, reduce depth
myth analyze Contract.sol --execution-timeout 600 -t 2
```

### Solver Timeout

```bash
# Increase solver timeout
myth analyze Contract.sol --solver-timeout 30000
```

### Compilation Errors

```bash
# Specify Solidity version
myth analyze Contract.sol --solv 0.8.20

# Use specific compiler
myth analyze Contract.sol --solc-json solc.json
```

## See Also

- `skills/slither-analysis/SKILL.md` - Static analysis
- `skills/echidna-fuzzer/SKILL.md` - Property-based fuzzing
- `agents/solidity-auditor/AGENT.md` - Security auditor
- [Mythril Documentation](https://mythril-classic.readthedocs.io/)
