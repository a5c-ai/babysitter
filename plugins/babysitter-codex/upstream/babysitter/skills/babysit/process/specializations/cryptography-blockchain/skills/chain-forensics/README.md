# Chain Analysis/Forensics Skill

## Overview

The Chain Forensics skill provides capabilities for on-chain investigation and transaction analysis. It helps security teams trace fund flows, identify suspicious patterns, and generate forensic reports for incident response and compliance.

## Use Cases

### Incident Response
- Trace stolen funds after an exploit
- Identify attacker addresses and patterns
- Map fund dispersion across chains

### Compliance & AML
- Screen addresses for sanctions compliance
- Identify mixer/tumbler usage
- Generate compliance reports

### Market Surveillance
- Detect wash trading patterns
- Identify market manipulation
- Monitor MEV activity

### Security Research
- Analyze exploit transactions
- Understand attack methodologies
- Track threat actors

## Quick Start

### 1. Analyze a Transaction

```bash
# Get basic transaction info
cast tx 0xTxHash --rpc-url https://eth-mainnet.g.alchemy.com/v2/KEY

# Get internal transactions
curl "https://api.etherscan.io/api\
?module=account\
&action=txlistinternal\
&txhash=0xTxHash\
&apikey=YOUR_KEY"

# Decode function call
cast 4byte-decode 0xFunctionSelector
```

### 2. Profile an Address

```bash
# Get transaction history
curl "https://api.etherscan.io/api\
?module=account\
&action=txlist\
&address=0xAddress\
&startblock=0\
&endblock=99999999\
&sort=asc\
&apikey=YOUR_KEY"

# Get token transfers
curl "https://api.etherscan.io/api\
?module=account\
&action=tokentx\
&address=0xAddress\
&apikey=YOUR_KEY"
```

### 3. Query with Dune

```sql
-- Track address activity
SELECT
  block_time,
  hash,
  "to",
  value / 1e18 as eth_value,
  gas_used * gas_price / 1e18 as gas_cost
FROM ethereum.transactions
WHERE "from" = 0x{{address}}
ORDER BY block_time DESC
LIMIT 100
```

## Integration with Processes

| Process | Usage |
|---------|-------|
| `incident-response-exploits.js` | Full incident investigation |
| `economic-simulation.js` | Market impact analysis |
| `smart-contract-security-audit.js` | Pre/post audit monitoring |

## Analysis Patterns

### Fund Flow Tracing

```
Exploit TX -> Attacker EOA -> Splitter Contract -> Multiple EOAs
                                    |
                                    +-> Tornado Cash (100 ETH)
                                    |
                                    +-> CEX Deposit (50 ETH)
                                    |
                                    +-> Bridge to Arbitrum (200 ETH)
```

### Risk Scoring Criteria

| Factor | Score Impact | Weight |
|--------|--------------|--------|
| Tornado Cash interaction | +50 | High |
| OFAC sanctioned address | +100 | Critical |
| Known exploit pattern | +40 | High |
| High velocity trading | +10 | Low |
| New address (<24h) | +20 | Medium |
| Multiple chain hops | +15 | Medium |

### MEV Detection

```javascript
// Sandwich attack pattern
const sandwichPattern = {
  frontrun: {
    type: 'swap',
    direction: 'buy',
    timing: 'same block, lower index'
  },
  victim: {
    type: 'swap',
    direction: 'buy',
    impact: 'higher price paid'
  },
  backrun: {
    type: 'swap',
    direction: 'sell',
    timing: 'same block, higher index'
  }
};
```

## Output Schema

When used in process tasks:

```json
{
  "investigationId": "INV-2024-XXX",
  "type": "exploit|compliance|surveillance",

  "subject": {
    "type": "address|transaction|protocol",
    "identifier": "0x...",
    "riskScore": 75
  },

  "findings": {
    "fundFlow": {
      "totalValue": "1000 ETH",
      "destinations": [
        { "type": "mixer", "amount": "100 ETH", "address": "0x..." },
        { "type": "exchange", "amount": "200 ETH", "address": "0x..." }
      ]
    },
    "relatedAddresses": [
      { "address": "0x...", "relationship": "funding_source", "confidence": 0.9 }
    ],
    "suspiciousPatterns": [
      { "type": "wash_trading", "evidence": "...", "confidence": 0.85 }
    ]
  },

  "timeline": [
    { "timestamp": "2024-01-15T10:00:00Z", "event": "Initial exploit", "txHash": "0x..." }
  ],

  "recommendations": [
    "Monitor destination addresses",
    "Notify affected exchanges",
    "Consider legal action"
  ]
}
```

## MCP Server Setup

For enhanced capabilities, configure these MCP servers:

```json
{
  "mcpServers": {
    "whale-tracker": {
      "command": "npx",
      "args": ["-y", "whale-tracker-mcp"]
    },
    "etherscan": {
      "command": "npx",
      "args": ["-y", "etherscan-mcp"],
      "env": { "ETHERSCAN_API_KEY": "YOUR_KEY" }
    },
    "dune": {
      "command": "npx",
      "args": ["-y", "dune-analytics-mcp"],
      "env": { "DUNE_API_KEY": "YOUR_KEY" }
    }
  }
}
```

## Resources

- [Chainalysis Guides](https://www.chainalysis.com/resources/)
- [Etherscan API Docs](https://docs.etherscan.io/)
- [Dune Analytics Docs](https://dune.com/docs/)
- [OFAC Sanctions List](https://www.treasury.gov/resource-center/sanctions)
- [Flashbots Documentation](https://docs.flashbots.net/)
