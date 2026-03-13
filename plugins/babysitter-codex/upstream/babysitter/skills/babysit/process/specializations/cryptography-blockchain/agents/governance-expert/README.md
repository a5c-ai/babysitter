# Governance Systems Expert Agent

## Overview

The Governance Expert agent provides specialized knowledge in designing, implementing, and securing on-chain governance systems for DAOs and DeFi protocols. This agent combines technical expertise with governance philosophy to create secure and effective governance structures.

## When to Use This Agent

Use this agent for tasks requiring:

- **Governance Design**: Token voting, delegation, timelocks
- **Governor Implementation**: OpenZeppelin Governor, custom governors
- **Security Review**: Governance attack vector analysis
- **Parameter Tuning**: Quorum, delays, thresholds
- **Integration**: Snapshot, Tally, on-chain execution

## Capabilities

### Design
- Voting mechanism selection and design
- Proposal lifecycle configuration
- Delegation system architecture
- Multi-sig and guardian roles

### Implementation
- OpenZeppelin Governor contracts
- TimelockController setup
- Snapshot space configuration
- Tally integration

### Security
- Flash loan attack prevention
- Vote manipulation detection
- Centralization risk assessment
- Emergency procedure design

## Agent Interaction

### Assigning Tasks

When using this agent in orchestration:

```javascript
const task = defineTask({
  name: 'design-governance',
  kind: 'agent',
  agent: {
    name: 'governance-expert',
    prompt: {
      role: 'Governance Systems Architect',
      task: 'Design token governance for DeFi protocol',
      context: {
        tokenSupply: '100,000,000',
        tvl: '$50M',
        existingMultisig: '3-of-5',
        requirements: [
          'Progressive decentralization',
          'Emergency action capability',
          'Delegation support'
        ]
      },
      instructions: [
        'Start with current multi-sig',
        'Add token voting layer',
        'Design timelock configuration',
        'Plan delegation system',
        'Address flash loan attacks'
      ],
      outputFormat: 'Governance specification with contracts'
    }
  }
});
```

### Expected Output

```json
{
  "status": "completed",
  "deliverables": {
    "contracts": [
      "contracts/governance/ProtocolGovernor.sol",
      "contracts/governance/Timelock.sol"
    ],
    "documentation": [
      "docs/governance-spec.md"
    ],
    "tests": [
      "test/governance/Governor.t.sol"
    ]
  },
  "parameters": {
    "votingDelay": "1 day",
    "votingPeriod": "7 days",
    "proposalThreshold": "100,000 tokens",
    "quorum": "4%",
    "timelockDelay": "2 days"
  },
  "securityAnalysis": {
    "attackVectors": ["flash loan", "vote buying", "griefing"],
    "mitigations": ["checkpoint voting", "timelock", "threshold"]
  }
}
```

## Process Integration

This agent is the primary assignee for:

| Process | Agent Role |
|---------|------------|
| `governance-system.js` | Primary architect |
| `staking-contract.js` | Voting power design |
| `economic-simulation.js` | Governance modeling |

## Governance Principles

The agent follows these principles:

1. **Minimal Governance**: Only govern what must be governed
2. **Progressive Decentralization**: Start simple, add complexity
3. **Defense in Depth**: Multiple security layers
4. **Transparency**: All actions verifiable on-chain
5. **Accessibility**: Low barriers to participation

## Common Configurations

### Standard DeFi Governance

```
Voting Delay: 1 day
Voting Period: 7 days
Timelock: 2 days
Quorum: 4%
Threshold: 0.1% of supply
```

### Emergency Governance

```
Voting Delay: 0
Voting Period: 1 day
Timelock: 0 (Guardian-gated)
Quorum: 20%
Threshold: 1% of supply
```

### Community Governance

```
Voting Delay: 0
Voting Period: 3 days
Timelock: 1 day
Quorum: 10%
Threshold: Snapshot-based
```

## Common Use Cases

### 1. New Protocol Governance
```
Task: Design governance from scratch
Input: Token details, TVL, requirements
Output: Full governance specification
```

### 2. Governance Upgrade
```
Task: Migrate from multi-sig to token governance
Input: Current governance, migration constraints
Output: Upgrade plan, new contracts
```

### 3. Security Assessment
```
Task: Review governance for vulnerabilities
Input: Governor contracts, configuration
Output: Security findings, recommendations
```

### 4. Parameter Optimization
```
Task: Tune governance parameters
Input: Current parameters, participation data
Output: Optimized configuration
```

## MCP Integration

For enhanced capabilities, configure:

```json
{
  "mcpServers": {
    "tally": {
      "command": "npx",
      "args": ["-y", "mcp-tally-api"],
      "env": { "TALLY_API_KEY": "YOUR_KEY" }
    }
  }
}
```

This enables:
- Query DAO data across networks
- Analyze voting patterns
- Compare governance configurations
- Track proposal outcomes

## Related Resources

- [Process: governance-system](../governance-system.js)
- [OpenZeppelin Governor](https://docs.openzeppelin.com/contracts/governance)
- [Tally Documentation](https://docs.tally.xyz/)
- [Snapshot Documentation](https://docs.snapshot.org/)
