# Mythril Symbolic Execution Skill

Deep vulnerability detection through symbolic execution using Mythril, a security analysis tool for EVM bytecode.

## Overview

This skill enables comprehensive security analysis of smart contracts using Mythril's symbolic execution engine to discover vulnerabilities that static analysis might miss.

## Key Capabilities

- **Symbolic Execution**: Explore all possible execution paths
- **Vulnerability Detection**: Find reentrancy, integer issues, and more
- **PoC Generation**: Automatically generate exploit inputs
- **Bytecode Analysis**: Analyze both source and deployed contracts

## Quick Start

```bash
# Install Mythril
pip install mythril

# Analyze contract
myth analyze Contract.sol --solv 0.8.20

# Deep analysis
myth analyze Contract.sol --execution-timeout 300 -t 3
```

## Common Detections

- Reentrancy vulnerabilities (SWC-107)
- Integer overflow/underflow (SWC-101)
- Unprotected selfdestruct (SWC-106)
- Unchecked return values (SWC-104)

## Related Resources

- [SKILL.md](./SKILL.md) - Full skill specification
- [Mythril Documentation](https://mythril-classic.readthedocs.io/)
- [SWC Registry](https://swcregistry.io/)

## Process Integration

- `smart-contract-security-audit.js`
- `smart-contract-fuzzing.js`
- `invariant-testing.js`
