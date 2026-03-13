# Echidna Fuzzing Skill

Property-based testing and fuzzing for smart contracts using Echidna from Trail of Bits.

## Overview

This skill enables comprehensive property-based testing of smart contracts through Echidna's powerful fuzzing capabilities.

## Key Capabilities

- **Property Testing**: Define invariants that should never break
- **Assertion Mode**: Test internal contract assertions
- **Coverage Analysis**: Identify untested code paths
- **Extended Campaigns**: Run long fuzzing sessions

## Quick Start

```bash
# Install Echidna
docker pull ghcr.io/crytic/echidna/echidna:latest

# Run fuzzing
echidna contracts/Test.sol --contract Test
```

## Example Property

```solidity
contract TokenTest is Token {
    function echidna_totalSupply_constant() public view returns (bool) {
        return totalSupply == initialSupply;
    }
}
```

## Related Resources

- [SKILL.md](./SKILL.md) - Full skill specification
- [Echidna GitHub](https://github.com/crytic/echidna)
- [Trail of Bits Blog](https://blog.trailofbits.com/)

## Process Integration

- `smart-contract-fuzzing.js`
- `invariant-testing.js`
- `smart-contract-security-audit.js`
