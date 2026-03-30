# Cross-Chain Development Skill

Expert cross-chain bridge development and multi-chain integration.

## Overview

This skill provides comprehensive capabilities for building cross-chain applications using LayerZero, Chainlink CCIP, Wormhole, and other bridge protocols.

## Key Capabilities

- **LayerZero**: Omnichain messaging and OFT tokens
- **Chainlink CCIP**: Secure cross-chain transfers
- **Bridge Security**: Rate limiting, circuit breakers
- **Finality Handling**: Chain-specific finality patterns

## Quick Example

```solidity
// LayerZero OFT Token
import { OFT } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/OFT.sol";

contract MyOFT is OFT {
    constructor(
        string memory _name,
        string memory _symbol,
        address _lzEndpoint,
        address _delegate
    ) OFT(_name, _symbol, _lzEndpoint, _delegate) {}
}
```

## Related Resources

- [SKILL.md](./SKILL.md) - Full skill specification
- [LayerZero Docs](https://docs.layerzero.network/)
- [CCIP Docs](https://docs.chain.link/ccip)

## Process Integration

- `cross-chain-bridge.js`
- `blockchain-node-setup.js`
- `multi-signature-wallet.js`
