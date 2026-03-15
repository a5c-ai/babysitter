# Subgraph Indexing Skill

Subgraph development for The Graph protocol, enabling efficient blockchain data indexing and querying.

## Overview

This skill provides comprehensive capabilities for building subgraphs that index blockchain data for efficient querying via GraphQL.

## Key Capabilities

- **Schema Design**: Define GraphQL entities and relationships
- **Event Handlers**: Write AssemblyScript mapping handlers
- **Templates**: Handle factory patterns dynamically
- **Deployment**: Deploy to hosted and decentralized networks

## Quick Start

```bash
# Install Graph CLI
npm install -g @graphprotocol/graph-cli

# Initialize subgraph
graph init --from-contract 0x... --network mainnet my-subgraph

# Build and deploy
graph codegen && graph build
graph deploy --studio my-subgraph
```

## Example Handler

```typescript
export function handleTransfer(event: TransferEvent): void {
  let transfer = new Transfer(event.transaction.hash.toHex());
  transfer.from = event.params.from.toHex();
  transfer.to = event.params.to.toHex();
  transfer.value = event.params.value;
  transfer.save();
}
```

## Related Resources

- [SKILL.md](./SKILL.md) - Full skill specification
- [The Graph Docs](https://thegraph.com/docs/)
- [Subgraph Academy](https://thegraph.academy/)

## Process Integration

- `subgraph-development.js`
- `blockchain-indexer-development.js`
- `dapp-frontend-development.js`
