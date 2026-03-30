# Certora Formal Verification Skill

Formal verification of smart contracts using Certora Prover with the CVL specification language.

## Overview

This skill enables mathematical proof of smart contract correctness through Certora's formal verification technology.

## Key Capabilities

- **CVL Specifications**: Write formal property specifications
- **Invariant Verification**: Prove state invariants hold
- **Parametric Rules**: Verify properties across all functions
- **Counterexample Analysis**: Debug verification failures

## Quick Start

```bash
# Install Certora
pip install certora-cli
export CERTORAKEY=<api-key>

# Run verification
certoraRun certora/conf/token.conf
```

## Example Specification

```cvl
invariant balanceUnderSupply(address user)
    balanceOf(user) <= totalSupply()

rule transferPreservesTotal(address to, uint256 amount) {
    uint256 before = totalSupply();
    transfer(e, to, amount);
    assert before == totalSupply();
}
```

## Related Resources

- [SKILL.md](./SKILL.md) - Full skill specification
- [Certora Docs](https://docs.certora.com/)
- [CVL Reference](https://docs.certora.com/en/latest/docs/cvl/index.html)

## Process Integration

- `formal-verification.js`
- `smart-contract-security-audit.js`
- `lending-protocol.js`
