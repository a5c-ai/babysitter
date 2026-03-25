---
name: subgraph-indexing
description: Subgraph development for The Graph protocol. Includes manifest configuration, GraphQL schema design, AssemblyScript handlers, entity relationships, and deployment to hosted and decentralized networks.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# Subgraph Indexing Skill

Subgraph development for The Graph protocol, enabling efficient blockchain data indexing and querying.

## Capabilities

- **Manifest Configuration**: Write subgraph.yaml files
- **Schema Design**: Define GraphQL schemas for entities
- **Event Handlers**: Implement AssemblyScript handlers
- **Entity Relationships**: Handle derived fields and relations
- **Local Testing**: Test with Graph Node locally
- **Deployment**: Deploy to hosted and decentralized networks
- **Performance**: Optimize indexing performance
- **Reorg Handling**: Handle chain reorganizations

## Installation

```bash
# Install Graph CLI
npm install -g @graphprotocol/graph-cli

# Verify
graph --version
```

## Project Setup

### Initialize Subgraph

```bash
# Initialize from existing contract
graph init --product subgraph-studio \
  --from-contract 0x... \
  --network mainnet \
  --abi ./abi.json \
  my-subgraph

cd my-subgraph
```

### Project Structure

```
my-subgraph/
├── subgraph.yaml          # Manifest
├── schema.graphql         # GraphQL schema
├── src/
│   └── mapping.ts         # Event handlers
├── abis/
│   └── Contract.json      # Contract ABIs
├── tests/
│   └── contract.test.ts   # Unit tests
└── package.json
```

## Manifest (subgraph.yaml)

```yaml
specVersion: 0.0.5
schema:
  file: ./schema.graphql
dataSources:
  - kind: ethereum
    name: Token
    network: mainnet
    source:
      address: "0x..."
      abi: Token
      startBlock: 18000000
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities:
        - Transfer
        - Account
      abis:
        - name: Token
          file: ./abis/Token.json
      eventHandlers:
        - event: Transfer(indexed address,indexed address,uint256)
          handler: handleTransfer
        - event: Approval(indexed address,indexed address,uint256)
          handler: handleApproval
      callHandlers:
        - function: transfer(address,uint256)
          handler: handleTransferCall
      blockHandlers:
        - handler: handleBlock
      file: ./src/mapping.ts
```

## GraphQL Schema

```graphql
# schema.graphql

type Token @entity {
  id: ID!
  name: String!
  symbol: String!
  decimals: Int!
  totalSupply: BigInt!
  holders: [Account!]! @derivedFrom(field: "token")
}

type Account @entity {
  id: ID!
  token: Token!
  balance: BigInt!
  transfersFrom: [Transfer!]! @derivedFrom(field: "from")
  transfersTo: [Transfer!]! @derivedFrom(field: "to")
}

type Transfer @entity {
  id: ID!
  from: Account!
  to: Account!
  value: BigInt!
  timestamp: BigInt!
  blockNumber: BigInt!
  transactionHash: Bytes!
}

# For aggregations
type DailyVolume @entity {
  id: ID!  # date string
  date: BigInt!
  volume: BigInt!
  txCount: Int!
}
```

## AssemblyScript Handlers

```typescript
// src/mapping.ts
import { Transfer as TransferEvent } from "../generated/Token/Token";
import { Token, Account, Transfer, DailyVolume } from "../generated/schema";
import { BigInt, Bytes, Address } from "@graphprotocol/graph-ts";

export function handleTransfer(event: TransferEvent): void {
  // Create Transfer entity
  let transfer = new Transfer(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  transfer.from = getOrCreateAccount(event.params.from).id;
  transfer.to = getOrCreateAccount(event.params.to).id;
  transfer.value = event.params.value;
  transfer.timestamp = event.block.timestamp;
  transfer.blockNumber = event.block.number;
  transfer.transactionHash = event.transaction.hash;
  transfer.save();

  // Update account balances
  updateAccountBalance(event.params.from, event.params.value.neg());
  updateAccountBalance(event.params.to, event.params.value);

  // Update daily volume
  updateDailyVolume(event.block.timestamp, event.params.value);
}

function getOrCreateAccount(address: Address): Account {
  let id = address.toHex();
  let account = Account.load(id);

  if (account == null) {
    account = new Account(id);
    account.token = "token-id";
    account.balance = BigInt.fromI32(0);
    account.save();
  }

  return account;
}

function updateAccountBalance(address: Address, delta: BigInt): void {
  let account = getOrCreateAccount(address);
  account.balance = account.balance.plus(delta);
  account.save();
}

function updateDailyVolume(timestamp: BigInt, value: BigInt): void {
  let dayId = timestamp.toI32() / 86400;
  let id = dayId.toString();

  let volume = DailyVolume.load(id);
  if (volume == null) {
    volume = new DailyVolume(id);
    volume.date = BigInt.fromI32(dayId * 86400);
    volume.volume = BigInt.fromI32(0);
    volume.txCount = 0;
  }

  volume.volume = volume.volume.plus(value);
  volume.txCount = volume.txCount + 1;
  volume.save();
}
```

## Data Source Templates

```yaml
# subgraph.yaml - for factory patterns
templates:
  - kind: ethereum
    name: Pool
    network: mainnet
    source:
      abi: Pool
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities:
        - Pool
        - Swap
      abis:
        - name: Pool
          file: ./abis/Pool.json
      eventHandlers:
        - event: Swap(indexed address,uint256,uint256)
          handler: handleSwap
      file: ./src/pool.ts
```

```typescript
// src/factory.ts
import { Pool as PoolTemplate } from "../generated/templates";

export function handlePoolCreated(event: PoolCreated): void {
  // Create data source for new pool
  PoolTemplate.create(event.params.pool);

  // Create Pool entity
  let pool = new Pool(event.params.pool.toHex());
  pool.save();
}
```

## Build and Deploy

```bash
# Generate code from schema
graph codegen

# Build subgraph
graph build

# Authenticate
graph auth --studio <deploy-key>

# Deploy to Subgraph Studio
graph deploy --studio my-subgraph

# Deploy to hosted service (deprecated)
graph deploy --node https://api.thegraph.com/deploy/ \
  --ipfs https://api.thegraph.com/ipfs/ \
  username/my-subgraph
```

## Querying

```graphql
# Example queries
query RecentTransfers {
  transfers(first: 10, orderBy: timestamp, orderDirection: desc) {
    id
    from {
      id
      balance
    }
    to {
      id
      balance
    }
    value
    timestamp
  }
}

query TopHolders {
  accounts(first: 10, orderBy: balance, orderDirection: desc) {
    id
    balance
  }
}

query DailyVolumes {
  dailyVolumes(first: 30, orderBy: date, orderDirection: desc) {
    date
    volume
    txCount
  }
}
```

## Testing

```typescript
// tests/token.test.ts
import { assert, test, clearStore } from "matchstick-as";
import { handleTransfer } from "../src/mapping";
import { createTransferEvent } from "./utils";

test("Creates Transfer entity", () => {
  let event = createTransferEvent(
    "0x1234...",
    "0x5678...",
    "1000000000000000000"
  );

  handleTransfer(event);

  assert.entityCount("Transfer", 1);
  clearStore();
});
```

## Process Integration

| Process | Purpose |
|---------|---------|
| `subgraph-development.js` | Subgraph development |
| `blockchain-indexer-development.js` | Indexing pipelines |
| `dapp-frontend-development.js` | Data integration |

## Best Practices

1. Use appropriate startBlock to avoid reindexing
2. Implement efficient entity updates
3. Handle reorgs with immutable entities
4. Use derived fields for relations
5. Test with Matchstick
6. Monitor indexing performance

## See Also

- `skills/wallet-integration/SKILL.md` - dApp integration
- `agents/web3-frontend/AGENT.md` - Frontend expert
- [The Graph Documentation](https://thegraph.com/docs/)
