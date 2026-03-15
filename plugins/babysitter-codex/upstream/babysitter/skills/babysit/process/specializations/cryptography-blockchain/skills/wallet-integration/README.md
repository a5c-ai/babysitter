# Wallet Integration Skill

Wallet connection and transaction management for Web3 dApps using wagmi and viem.

## Overview

This skill provides comprehensive capabilities for integrating wallet connections, transaction signing, and chain management into Web3 dApps.

## Key Capabilities

- **Multi-Wallet Support**: MetaMask, WalletConnect, Coinbase
- **Chain Switching**: Seamless network management
- **Transaction Handling**: Send, sign, and track transactions
- **EIP-712 Signing**: Typed data signatures for permits

## Quick Start

```bash
npm install wagmi viem @tanstack/react-query
```

```tsx
import { useAccount, useConnect } from 'wagmi';

function App() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();

  if (isConnected) return <p>{address}</p>;

  return connectors.map(c => (
    <button key={c.id} onClick={() => connect({ connector: c })}>
      Connect {c.name}
    </button>
  ));
}
```

## Related Resources

- [SKILL.md](./SKILL.md) - Full skill specification
- [wagmi Docs](https://wagmi.sh/)
- [viem Docs](https://viem.sh/)

## Process Integration

- `dapp-frontend-development.js`
- `hd-wallet-implementation.js`
- `multi-signature-wallet.js`
