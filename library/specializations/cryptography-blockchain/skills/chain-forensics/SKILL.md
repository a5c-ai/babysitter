---
name: chain-forensics
description: On-chain analysis and transaction forensics for blockchain security investigations. Provides capabilities for tracing fund flows, identifying suspicious patterns, MEV analysis, and generating forensic reports for incident response.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch, WebSearch
---

# Chain Analysis/Forensics Skill

Expert on-chain analysis and transaction forensics for security investigations and incident response.

## Capabilities

- **Transaction Tracing**: Follow fund flows across addresses and protocols
- **Pattern Detection**: Identify suspicious patterns (wash trading, rugpulls, sandwich attacks)
- **MEV Analysis**: Analyze MEV activity and flashbots bundles
- **Address Clustering**: Group related addresses and identify ownership
- **Cross-Chain Tracking**: Track bridged assets across chains
- **Forensic Reports**: Generate detailed investigation reports

## MCP/Tool Integration

| Tool | Purpose | Reference |
|------|---------|-----------|
| **Phalcon MCP** | Transaction analysis, exploit detection | [phalcon-mcp](https://github.com/mark3labs/phalcon-mcp) |
| **whale-tracker-mcp** | Large transaction monitoring | [whale-tracker](https://github.com/kukapay/whale-tracker-mcp) |
| **bicscan-mcp** | Address risk scoring | [bicscan](https://github.com/ahnlabio/bicscan-mcp) |
| **dune-analytics-mcp** | Custom queries, analytics | [dune](https://github.com/kukapay/dune-analytics-mcp) |
| **Etherscan MCP** | Block explorer data | [etherscan](https://github.com/haomingdev/etherscan-mcp) |

## Transaction Tracing

### Basic Flow Analysis

```bash
# Get transaction details
cast tx 0xTxHash --rpc-url $RPC

# Decode transaction input
cast 4byte-decode $(cast tx 0xTxHash --rpc-url $RPC | grep input)

# Get internal transactions via Etherscan API
curl "https://api.etherscan.io/api?module=account&action=txlistinternal&txhash=0xTxHash&apikey=$KEY"
```

### Tracing with Tenderly/Phalcon

```javascript
// Phalcon trace analysis
const trace = await phalcon.analyzeTransaction(txHash);

// Identify key flows
const flows = {
  valueTransfers: trace.transfers.filter(t => t.value > 0),
  tokenTransfers: trace.erc20Transfers,
  internalCalls: trace.calls.filter(c => c.type === 'CALL'),
  delegateCalls: trace.calls.filter(c => c.type === 'DELEGATECALL')
};
```

## Address Analysis

### Profile Building

```javascript
const addressProfile = {
  address: '0x...',

  // Basic metrics
  metrics: {
    firstTransaction: '2022-01-15',
    transactionCount: 1234,
    uniqueInteractions: 56,
    totalValueTransferred: '1000 ETH'
  },

  // Activity patterns
  patterns: {
    activeHours: [14, 15, 16], // UTC hours
    frequentProtocols: ['Uniswap', 'Aave'],
    averageTxFrequency: '5/day'
  },

  // Risk indicators
  riskFlags: {
    tornadoCashInteraction: false,
    sanctionedAddressInteraction: false,
    knownExploitPattern: false,
    highFrequencyTrading: true
  },

  // Related addresses
  clusters: [
    { address: '0x...', confidence: 0.95, reason: 'Funding source' },
    { address: '0x...', confidence: 0.8, reason: 'Common recipient' }
  ]
};
```

### Clustering Heuristics

1. **Deposit Address Reuse**: Same deposit addresses across exchanges
2. **Multi-Input Transactions**: Addresses used together in single tx
3. **Timing Analysis**: Coordinated transaction timing
4. **Amount Patterns**: Matching amounts minus fees
5. **Contract Interactions**: Shared smart contract usage patterns

## MEV Analysis

### Sandwich Attack Detection

```sql
-- Dune Analytics query for sandwich detection
WITH potential_sandwiches AS (
  SELECT
    block_number,
    transaction_index,
    "from",
    "to",
    value,
    LAG("from") OVER (PARTITION BY block_number ORDER BY transaction_index) as prev_from,
    LEAD("from") OVER (PARTITION BY block_number ORDER BY transaction_index) as next_from
  FROM ethereum.transactions
  WHERE block_number > {{start_block}}
)
SELECT *
FROM potential_sandwiches
WHERE prev_from = next_from
  AND prev_from != "from"
  -- Additional filters for DEX interactions
```

### Flashbots Bundle Analysis

```javascript
// Analyze flashbots bundles
const bundleAnalysis = {
  bundleHash: '0x...',

  transactions: [
    { index: 0, type: 'frontrun', profit: '0.5 ETH' },
    { index: 1, type: 'victim', loss: '0.3 ETH' },
    { index: 2, type: 'backrun', profit: '0.4 ETH' }
  ],

  totalMEV: '0.9 ETH',
  miner: '0x...',
  minerPayment: '0.45 ETH'
};
```

## Suspicious Pattern Detection

### Rugpull Indicators

```javascript
const rugpullIndicators = {
  // Contract analysis
  contract: {
    hasHiddenMint: true,          // Owner can mint unlimited
    hasDisableTrading: true,      // Can disable selling
    hasBlacklist: true,           // Can block addresses
    highOwnershipConcentration: true, // >50% in few wallets
    unverifiedContract: true,
    recentDeployment: true        // <7 days old
  },

  // Token metrics
  tokenMetrics: {
    liquidityLocked: false,
    lockDuration: 0,
    holderCount: 50,
    top10HoldersPercent: 85
  },

  // Trading patterns
  tradingPatterns: {
    artificialVolume: true,       // Wash trading detected
    sellPressure: 'high',
    buyWallsArtificial: true
  },

  riskScore: 95 // 0-100
};
```

### Wash Trading Detection

```sql
-- Identify circular trading
WITH transfers AS (
  SELECT
    "from",
    "to",
    contract_address,
    value,
    block_time
  FROM erc20_ethereum.evt_Transfer
  WHERE contract_address = {{token_address}}
    AND block_time > NOW() - INTERVAL '7 days'
)
SELECT
  a."from" as trader,
  COUNT(DISTINCT b."to") as counterparties,
  SUM(a.value) as total_volume,
  COUNT(*) as trade_count
FROM transfers a
JOIN transfers b ON a."to" = b."from" AND a."from" = b."to"
WHERE a.block_time < b.block_time
  AND b.block_time < a.block_time + INTERVAL '1 hour'
GROUP BY a."from"
HAVING COUNT(*) > 10
ORDER BY total_volume DESC
```

## Cross-Chain Tracking

### Bridge Transaction Mapping

```javascript
const crossChainTrace = {
  originChain: 'ethereum',
  originTx: '0x...',
  originAddress: '0x...',

  bridge: 'Wormhole',
  bridgeMessage: '0x...',

  destinationChain: 'arbitrum',
  destinationTx: '0x...',
  destinationAddress: '0x...',

  amount: '100 USDC',
  timestamp: {
    origin: '2024-01-15T10:00:00Z',
    destination: '2024-01-15T10:15:00Z'
  }
};
```

### Multi-Chain Address Mapping

```javascript
// Track address across chains
const multiChainProfile = {
  primaryAddress: '0x...',

  chainPresence: {
    ethereum: { address: '0x...', balance: '10 ETH', txCount: 500 },
    arbitrum: { address: '0x...', balance: '5 ETH', txCount: 200 },
    optimism: { address: '0x...', balance: '3 ETH', txCount: 100 },
    polygon: { address: '0x...', balance: '1000 MATIC', txCount: 50 }
  },

  bridgeHistory: [
    { from: 'ethereum', to: 'arbitrum', amount: '5 ETH', date: '2024-01-10' },
    { from: 'ethereum', to: 'optimism', amount: '3 ETH', date: '2024-01-12' }
  ]
};
```

## Forensic Report Template

```markdown
# Blockchain Forensic Investigation Report

## Executive Summary
- **Investigation ID**: INV-2024-XXX
- **Date Range**: 2024-01-01 to 2024-01-15
- **Subject**: [Address/Protocol/Incident]
- **Conclusion**: [Brief finding]

## Key Findings

### 1. Fund Flow Analysis
[Diagram and description of fund movements]

### 2. Address Attribution
| Address | Attribution | Confidence | Evidence |
|---------|-------------|------------|----------|
| 0x... | Attacker | High | Funding pattern |
| 0x... | Mixer | Medium | Tornado Cash |
| 0x... | Exchange | High | Known deposit |

### 3. Timeline
| Timestamp | Event | Addresses | Amount |
|-----------|-------|-----------|--------|
| T+0 | Initial exploit | 0x... | 1000 ETH |
| T+1h | Consolidation | 0x... | 1000 ETH |
| T+2h | Mixer deposit | Tornado | 100 ETH |

### 4. Attack Vector
[Technical description of how the incident occurred]

### 5. Total Impact
- Funds Lost: $X
- Users Affected: Y
- Contracts Exploited: Z

## Appendix
- Full transaction list
- Address clustering data
- Supporting evidence
```

## Process Integration

This skill integrates with:

- `incident-response-exploits.js` - Exploit investigation
- `economic-simulation.js` - Market impact analysis
- `smart-contract-security-audit.js` - Post-audit monitoring

## Tools Reference

| Tool | Purpose | URL |
|------|---------|-----|
| **Etherscan** | Explorer, API | [etherscan.io](https://etherscan.io) |
| **Dune Analytics** | Custom queries | [dune.com](https://dune.com) |
| **Nansen** | Wallet labels, flows | [nansen.ai](https://nansen.ai) |
| **Arkham Intelligence** | Entity attribution | [arkhamintelligence.com](https://www.arkhamintelligence.com) |
| **Chainalysis Reactor** | Investigation platform | [chainalysis.com](https://www.chainalysis.com) |
| **TRM Labs** | Risk scoring | [trmlabs.com](https://www.trmlabs.com) |
| **Phalcon** | Tx analysis | [phalcon.blocksec.com](https://phalcon.blocksec.com) |

## See Also

- `agents/incident-response/AGENT.md` - Incident commander agent
- `skills/bug-bounty/SKILL.md` - Disclosure coordination
- `incident-response-exploits.js` - Full incident process
