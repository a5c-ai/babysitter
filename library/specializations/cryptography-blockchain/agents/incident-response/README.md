# Incident Response Specialist Agent

## Overview

The Incident Response agent provides expert guidance for handling smart contract security incidents, from initial detection through post-mortem analysis. This agent acts as an incident commander, coordinating technical response, stakeholder communication, and recovery efforts.

## When to Use This Agent

Use this agent for tasks requiring:

- **Active Incident Response**: Live exploit handling, containment
- **Incident Analysis**: Post-incident investigation, root cause
- **Playbook Development**: Incident response procedure creation
- **Communication**: Crisis communication, stakeholder updates
- **Recovery Planning**: Fund recovery, system restoration

## Capabilities

### Response
- Real-time incident triage
- Containment strategy execution
- White-hat rescue coordination
- War room management

### Analysis
- Transaction trace analysis
- Attack vector identification
- Timeline reconstruction
- Impact assessment

### Communication
- Internal alert templates
- Public disclosure drafting
- Exchange coordination
- Media response

### Recovery
- Fund recovery strategies
- System restoration planning
- Process improvement recommendations

## Agent Interaction

### Assigning Tasks

When using this agent in orchestration:

```javascript
const task = defineTask({
  name: 'incident-response',
  kind: 'agent',
  agent: {
    name: 'incident-response',
    prompt: {
      role: 'Blockchain Incident Commander',
      task: 'Analyze and respond to potential exploit',
      context: {
        protocol: 'DeFi Protocol',
        suspiciousTx: '0x...',
        contracts: ['0x...'],
        tvl: '$50M',
        currentStatus: 'investigating'
      },
      instructions: [
        'Analyze suspicious transaction',
        'Determine if exploit is active',
        'Recommend immediate actions',
        'Draft communication templates',
        'Document timeline'
      ],
      outputFormat: 'Incident response plan with actions'
    }
  }
});
```

### Expected Output

```json
{
  "status": "active",
  "severity": "critical",
  "analysis": {
    "isExploit": true,
    "attackVector": "Price oracle manipulation via flash loan",
    "fundsAtRisk": "$2.5M",
    "fundsLost": "$500K",
    "attackerAddress": "0x..."
  },
  "actions": {
    "immediate": [
      "Pause lending contract",
      "Alert exchange partners",
      "Begin fund tracing"
    ],
    "shortTerm": [
      "Deploy oracle fix",
      "Coordinate with Chainalysis",
      "Prepare public statement"
    ]
  },
  "communication": {
    "internalAlert": "draft ready",
    "publicStatement": "pending containment",
    "exchangeNotification": "sent to Binance, Coinbase"
  }
}
```

## Process Integration

This agent is the primary assignee for:

| Process | Agent Role |
|---------|------------|
| `incident-response-exploits.js` | Primary commander |
| `bug-bounty-program.js` | Critical finding triage |
| `smart-contract-security-audit.js` | Risk assessment |

## Response Principles

The agent follows these principles:

1. **Protect Users First**: Fund safety is paramount
2. **Contain Quickly**: Stop ongoing damage
3. **Document Everything**: Evidence preservation
4. **Communicate Transparently**: Build trust
5. **Learn Always**: Improve from every incident

## Incident Severity Levels

| Level | Impact | Response Time | Example |
|-------|--------|---------------|---------|
| Critical | >$1M, ongoing | Immediate | Active drain |
| High | >$100K or vulnerability | <1 hour | Disclosed critical bug |
| Medium | <$100K, contained | <4 hours | Minor fund loss |
| Low | No loss | <24 hours | Potential issue |

## Common Use Cases

### 1. Active Exploit Response
```
Task: Handle ongoing fund drain
Input: Suspicious transactions, contract addresses
Output: Containment plan, actions taken
```

### 2. Vulnerability Disclosure
```
Task: Handle critical bug bounty report
Input: Vulnerability details, affected contracts
Output: Remediation plan, disclosure timeline
```

### 3. Post-Mortem
```
Task: Analyze completed incident
Input: Transaction logs, timeline
Output: Root cause analysis, improvements
```

### 4. Playbook Development
```
Task: Create incident response procedures
Input: Protocol architecture, risk assessment
Output: Response playbook, runbooks
```

## War Room Setup

When activated for a critical incident:

```markdown
## War Room Checklist

### Roles Assigned
- [ ] Incident Commander (decision maker)
- [ ] Technical Lead (analysis)
- [ ] Communications (stakeholders)
- [ ] Legal (compliance)

### Tools Ready
- [ ] Block explorer access
- [ ] Transaction tracing tools
- [ ] Admin key access verified
- [ ] Communication channels open

### Actions Logged
- [ ] Timeline started
- [ ] Decision log initialized
- [ ] Evidence preservation begun
```

## MCP Integration

For enhanced capabilities, configure:

```json
{
  "mcpServers": {
    "phalcon": {
      "command": "npx",
      "args": ["-y", "phalcon-mcp"]
    },
    "whale-tracker": {
      "command": "npx",
      "args": ["-y", "whale-tracker-mcp"]
    }
  }
}
```

This enables:
- Transaction trace analysis
- Large transfer monitoring
- Attack pattern detection
- Fund flow tracking

## Related Resources

- [Process: incident-response-exploits](../incident-response-exploits.js)
- [SKILL: chain-forensics](../skills/chain-forensics/SKILL.md)
- [SKILL: bug-bounty](../skills/bug-bounty/SKILL.md)
- [Rekt News](https://rekt.news/) - Incident case studies
- [Immunefi Post-Mortems](https://immunefi.medium.com/)
