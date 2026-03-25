---
name: tokenomics
description: Token economics simulation and analysis. Supports supply modeling, staking mechanisms, liquidity mining, governance dynamics, agent-based simulations, and cadCAD integration.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# Token Economics Modeling Skill

Expert token economics simulation and analysis for protocol design.

## Capabilities

- **Supply Modeling**: Token supply and distribution
- **Staking Simulation**: Staking and reward mechanisms
- **Liquidity Mining**: LP incentive programs
- **Governance Dynamics**: Token governance modeling
- **Agent-Based Simulation**: cadCAD economic models
- **Inflation Analysis**: Inflation/deflation mechanisms
- **LP Economics**: DEX liquidity and impermanent loss

## Supply Distribution Models

### Vesting Schedule

```python
# vesting_model.py
import numpy as np
import pandas as pd

class VestingSchedule:
    def __init__(self, total_supply: int = 1_000_000_000):
        self.total_supply = total_supply

        # Allocation percentages
        self.allocation = {
            'team': 0.20,
            'investors': 0.15,
            'community': 0.30,
            'treasury': 0.20,
            'liquidity': 0.15
        }

        # Vesting parameters (months)
        self.vesting = {
            'team': {'cliff': 12, 'duration': 36},
            'investors': {'cliff': 6, 'duration': 24},
            'community': {'cliff': 0, 'duration': 48},
            'treasury': {'cliff': 0, 'duration': 60},
            'liquidity': {'cliff': 0, 'duration': 1}  # TGE
        }

    def get_unlocked(self, month: int) -> dict:
        unlocked = {}
        for category, params in self.vesting.items():
            allocation = self.total_supply * self.allocation[category]

            if month < params['cliff']:
                unlocked[category] = 0
            elif month >= params['cliff'] + params['duration']:
                unlocked[category] = allocation
            else:
                elapsed = month - params['cliff']
                unlocked[category] = allocation * (elapsed / params['duration'])

        return unlocked

    def get_circulating_supply(self, month: int) -> int:
        unlocked = self.get_unlocked(month)
        return sum(unlocked.values())
```

### Emission Schedule

```python
# emission_model.py
class EmissionSchedule:
    def __init__(
        self,
        initial_emission: float = 1000,
        decay_rate: float = 0.9,  # 10% decay per period
        period_length: int = 365  # days
    ):
        self.initial_emission = initial_emission
        self.decay_rate = decay_rate
        self.period_length = period_length

    def get_daily_emission(self, day: int) -> float:
        period = day // self.period_length
        return self.initial_emission * (self.decay_rate ** period)

    def get_cumulative_emission(self, days: int) -> float:
        total = 0
        for day in range(days):
            total += self.get_daily_emission(day)
        return total
```

## Staking Economics

### Staking Model

```python
# staking_model.py
class StakingPool:
    def __init__(
        self,
        total_staked: float = 0,
        reward_rate: float = 0.10,  # 10% APY
        lock_period: int = 30  # days
    ):
        self.total_staked = total_staked
        self.reward_rate = reward_rate
        self.lock_period = lock_period
        self.stakers = {}

    def stake(self, address: str, amount: float):
        if address not in self.stakers:
            self.stakers[address] = {
                'amount': 0,
                'reward_debt': 0,
                'lock_until': 0
            }

        self.stakers[address]['amount'] += amount
        self.stakers[address]['lock_until'] = self.lock_period
        self.total_staked += amount

    def calculate_rewards(self, address: str, days: int) -> float:
        if address not in self.stakers:
            return 0

        staker = self.stakers[address]
        share = staker['amount'] / self.total_staked if self.total_staked > 0 else 0
        daily_rate = self.reward_rate / 365
        return staker['amount'] * daily_rate * days

    def get_apy(self) -> float:
        return self.reward_rate * 100
```

### veToken Model (Vote Escrow)

```python
# ve_token_model.py
import math

class VeTokenModel:
    def __init__(self, max_lock_time: int = 4 * 365):  # 4 years max
        self.max_lock_time = max_lock_time
        self.locks = {}

    def lock(self, address: str, amount: float, lock_days: int):
        lock_days = min(lock_days, self.max_lock_time)
        ve_balance = amount * (lock_days / self.max_lock_time)

        self.locks[address] = {
            'amount': amount,
            'lock_days': lock_days,
            've_balance': ve_balance,
            'start_time': 0
        }

        return ve_balance

    def get_voting_power(self, address: str, current_day: int) -> float:
        if address not in self.locks:
            return 0

        lock = self.locks[address]
        remaining = max(0, lock['lock_days'] - current_day)
        return lock['amount'] * (remaining / self.max_lock_time)
```

## Liquidity Mining

### LP Rewards Model

```python
# lp_rewards_model.py
class LPRewardsPool:
    def __init__(
        self,
        reward_per_block: float = 10,
        total_lp_tokens: float = 0
    ):
        self.reward_per_block = reward_per_block
        self.total_lp_tokens = total_lp_tokens
        self.acc_reward_per_share = 0
        self.last_reward_block = 0
        self.users = {}

    def deposit(self, user: str, amount: float, block: int):
        self._update_pool(block)

        if user in self.users:
            pending = self._pending_rewards(user)
            self.users[user]['pending'] += pending

        if user not in self.users:
            self.users[user] = {'amount': 0, 'reward_debt': 0, 'pending': 0}

        self.users[user]['amount'] += amount
        self.users[user]['reward_debt'] = \
            self.users[user]['amount'] * self.acc_reward_per_share
        self.total_lp_tokens += amount

    def _update_pool(self, block: int):
        if self.total_lp_tokens == 0:
            self.last_reward_block = block
            return

        blocks = block - self.last_reward_block
        rewards = blocks * self.reward_per_block
        self.acc_reward_per_share += rewards / self.total_lp_tokens
        self.last_reward_block = block

    def _pending_rewards(self, user: str) -> float:
        if user not in self.users:
            return 0
        return self.users[user]['amount'] * self.acc_reward_per_share \
               - self.users[user]['reward_debt']
```

### Impermanent Loss Calculator

```python
# impermanent_loss.py
def calculate_impermanent_loss(price_ratio: float) -> float:
    """
    Calculate impermanent loss for Uniswap V2 style AMM.
    price_ratio: new_price / initial_price
    """
    return 2 * math.sqrt(price_ratio) / (1 + price_ratio) - 1

def il_vs_holding(initial_value: float, price_ratio: float) -> dict:
    il = calculate_impermanent_loss(price_ratio)
    lp_value = initial_value * (1 + il)
    hold_value = initial_value * (1 + price_ratio) / 2

    return {
        'lp_value': lp_value,
        'hold_value': hold_value,
        'il_percentage': il * 100,
        'il_dollar': hold_value - lp_value
    }
```

## cadCAD Simulation

### Basic cadCAD Model

```python
# cadcad_model.py
from cadCAD.configuration import Configuration
from cadCAD.engine import ExecutionMode, ExecutionContext, Executor

# State Variables
initial_state = {
    'token_price': 1.0,
    'total_supply': 100_000_000,
    'circulating_supply': 10_000_000,
    'staked_supply': 0,
    'treasury': 20_000_000
}

# Parameters
system_params = {
    'staking_apr': [0.10, 0.15, 0.20],
    'inflation_rate': [0.05],
    'buy_pressure': [0.01, 0.02]
}

# State Update Functions
def update_price(params, step, sL, s, _input):
    buy_pressure = params['buy_pressure']
    sell_pressure = s['circulating_supply'] * 0.001
    price_change = (buy_pressure - sell_pressure) / s['circulating_supply']
    new_price = max(0.01, s['token_price'] * (1 + price_change))
    return ('token_price', new_price)

def update_staking(params, step, sL, s, _input):
    staking_apr = params['staking_apr']
    stake_incentive = staking_apr * s['token_price']
    new_staked = s['staked_supply'] + s['circulating_supply'] * stake_incentive * 0.1
    return ('staked_supply', new_staked)

# Policies
def staking_policy(params, step, sL, s):
    return {'stake_action': 'stake' if s['token_price'] > 0.5 else 'unstake'}

# Configuration
partial_state_update_blocks = [
    {
        'policies': {'staking': staking_policy},
        'variables': {
            'token_price': update_price,
            'staked_supply': update_staking
        }
    }
]
```

## Governance Simulation

```python
# governance_model.py
class GovernanceSimulation:
    def __init__(self, total_voting_power: float):
        self.total_voting_power = total_voting_power
        self.proposals = {}
        self.quorum = 0.04  # 4% quorum
        self.pass_threshold = 0.5  # 50% to pass

    def create_proposal(self, id: str, description: str):
        self.proposals[id] = {
            'description': description,
            'for_votes': 0,
            'against_votes': 0,
            'abstain_votes': 0,
            'status': 'active'
        }

    def vote(self, proposal_id: str, voting_power: float, support: int):
        proposal = self.proposals[proposal_id]
        if support == 1:
            proposal['for_votes'] += voting_power
        elif support == 0:
            proposal['against_votes'] += voting_power
        else:
            proposal['abstain_votes'] += voting_power

    def execute(self, proposal_id: str) -> bool:
        proposal = self.proposals[proposal_id]
        total_votes = proposal['for_votes'] + proposal['against_votes']

        # Check quorum
        if total_votes < self.total_voting_power * self.quorum:
            proposal['status'] = 'defeated'
            return False

        # Check threshold
        if proposal['for_votes'] / total_votes >= self.pass_threshold:
            proposal['status'] = 'executed'
            return True
        else:
            proposal['status'] = 'defeated'
            return False
```

## Process Integration

| Process | Purpose |
|---------|---------|
| `economic-simulation.js` | Protocol economics |
| `staking-contract.js` | Staking design |
| `governance-system.js` | Governance modeling |
| `yield-aggregator.js` | Yield optimization |

## Best Practices

1. Model multiple scenarios
2. Include adversarial agents
3. Test edge cases (0 liquidity, 100% staked)
4. Validate against real protocol data
5. Consider MEV and arbitrage
6. Document all assumptions

## See Also

- `skills/defi-protocols/SKILL.md` - DeFi integration
- `agents/defi-architect/AGENT.md` - DeFi expert
- [cadCAD Documentation](https://cadcad.org/)
