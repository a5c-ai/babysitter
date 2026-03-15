# Blockchain Node Operations Skill

Expert blockchain node deployment and operations for Ethereum and EVM-compatible networks.

## Overview

This skill provides comprehensive capabilities for deploying and operating blockchain nodes including execution clients, consensus clients, and validators.

## Key Capabilities

- **Execution Clients**: Geth, Nethermind, Besu, Erigon
- **Consensus Clients**: Lighthouse, Prysm, Teku, Lodestar
- **Validator Setup**: Key generation, MEV-Boost
- **Monitoring**: Prometheus metrics, sync status

## Quick Start

```bash
# Start Geth
geth --mainnet \
  --http --http.api eth,net,web3 \
  --authrpc.jwtsecret /path/to/jwt.hex

# Start Lighthouse beacon
lighthouse bn \
  --network mainnet \
  --execution-endpoint http://localhost:8551 \
  --execution-jwt /path/to/jwt.hex
```

## Related Resources

- [SKILL.md](./SKILL.md) - Full skill specification
- [Ethereum.org Staking](https://ethereum.org/staking)
- [EthStaker Guide](https://ethstaker.cc/)

## Process Integration

- `blockchain-node-setup.js`
- `validator-node-operation.js`
- `blockchain-indexer-development.js`
