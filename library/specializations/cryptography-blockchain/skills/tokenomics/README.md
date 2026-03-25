# Token Economics Modeling Skill

Token economics simulation and analysis for protocol design.

## Overview

This skill provides comprehensive capabilities for modeling and simulating token economics including supply distribution, staking mechanisms, and governance dynamics.

## Key Capabilities

- **Supply Modeling**: Vesting schedules, emission curves
- **Staking Analysis**: APY calculations, veToken models
- **LP Economics**: Impermanent loss, liquidity mining
- **Governance Simulation**: Voting dynamics, quorum analysis

## Quick Example

```python
# Impermanent Loss Calculation
def calculate_il(price_ratio):
    return 2 * sqrt(price_ratio) / (1 + price_ratio) - 1

# veToken Model
ve_balance = amount * (lock_days / max_lock_time)
```

## Related Resources

- [SKILL.md](./SKILL.md) - Full skill specification
- [cadCAD](https://cadcad.org/)
- [Token Engineering](https://tokenengineeringcommunity.github.io/)

## Process Integration

- `economic-simulation.js`
- `staking-contract.js`
- `governance-system.js`
