---
name: cross-chain
description: Cross-chain bridge and multi-chain development expertise. Supports LayerZero, Chainlink CCIP, Wormhole, and Axelar for omnichain messaging, token bridging, and cross-chain state verification.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# Cross-Chain Development Skill

Expert cross-chain bridge development and multi-chain integration.

## Capabilities

- **LayerZero**: Omnichain messaging and OFT tokens
- **Chainlink CCIP**: Cross-chain interoperability protocol
- **Bridge Verification**: Implement verification logic
- **Finality Handling**: Handle chain finality differences
- **Wormhole/Axelar**: Alternative bridge protocols
- **Canonical Bridges**: Token bridge implementations
- **State Verification**: Cross-chain state proofs

## LayerZero Integration

### OFT Token (Omnichain Fungible Token)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { OFT } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/OFT.sol";

contract MyOFT is OFT {
    constructor(
        string memory _name,
        string memory _symbol,
        address _lzEndpoint,
        address _delegate
    ) OFT(_name, _symbol, _lzEndpoint, _delegate) {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }
}
```

### OApp (Omnichain Application)

```solidity
import { OApp } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/OApp.sol";
import { Origin } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/interfaces/IOAppReceiver.sol";

contract CrossChainCounter is OApp {
    uint256 public count;

    constructor(address _endpoint, address _owner) OApp(_endpoint, _owner) {}

    function increment(
        uint32 _dstEid,
        bytes calldata _options
    ) external payable {
        bytes memory payload = abi.encode(count + 1);
        _lzSend(
            _dstEid,
            payload,
            _options,
            MessagingFee(msg.value, 0),
            payable(msg.sender)
        );
        count++;
    }

    function _lzReceive(
        Origin calldata _origin,
        bytes32 _guid,
        bytes calldata _message,
        address _executor,
        bytes calldata _extraData
    ) internal override {
        uint256 newCount = abi.decode(_message, (uint256));
        count = newCount;
    }
}
```

### LayerZero Configuration

```typescript
// hardhat.config.ts LayerZero setup
import { EndpointId } from "@layerzerolabs/lz-definitions";

const config = {
  networks: {
    ethereum: {
      url: process.env.ETHEREUM_RPC,
      accounts: [process.env.PRIVATE_KEY],
    },
    arbitrum: {
      url: process.env.ARBITRUM_RPC,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
  layerZero: {
    ethereum: {
      eid: EndpointId.ETHEREUM_V2_MAINNET,
      endpoint: "0x1a44076050125825900e736c501f859c50fE728c",
    },
    arbitrum: {
      eid: EndpointId.ARBITRUM_V2_MAINNET,
      endpoint: "0x1a44076050125825900e736c501f859c50fE728c",
    },
  },
};
```

## Chainlink CCIP

### Token Transfer

```solidity
import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CCIPTokenTransfer {
    IRouterClient public router;
    address public linkToken;

    constructor(address _router, address _link) {
        router = IRouterClient(_router);
        linkToken = _link;
    }

    function transferTokens(
        uint64 destinationChainSelector,
        address receiver,
        address token,
        uint256 amount
    ) external returns (bytes32 messageId) {
        Client.EVMTokenAmount[] memory tokenAmounts = new Client.EVMTokenAmount[](1);
        tokenAmounts[0] = Client.EVMTokenAmount({
            token: token,
            amount: amount
        });

        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(receiver),
            data: "",
            tokenAmounts: tokenAmounts,
            extraArgs: "",
            feeToken: linkToken
        });

        uint256 fee = router.getFee(destinationChainSelector, message);
        IERC20(linkToken).approve(address(router), fee);
        IERC20(token).approve(address(router), amount);

        messageId = router.ccipSend(destinationChainSelector, message);
    }
}
```

### Cross-Chain Message

```solidity
import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";

contract CCIPReceiver is CCIPReceiver {
    event MessageReceived(bytes32 messageId, bytes data);

    constructor(address router) CCIPReceiver(router) {}

    function _ccipReceive(
        Client.Any2EVMMessage memory message
    ) internal override {
        emit MessageReceived(message.messageId, message.data);

        // Process message
        (string memory text) = abi.decode(message.data, (string));
        // Handle the message...
    }
}
```

## Wormhole Integration

### Token Bridge

```solidity
interface IWormholeTokenBridge {
    function transferTokens(
        address token,
        uint256 amount,
        uint16 recipientChain,
        bytes32 recipient,
        uint256 arbiterFee,
        uint32 nonce
    ) external payable returns (uint64 sequence);

    function completeTransfer(bytes memory encodedVm) external;
}

contract WormholeBridge {
    IWormholeTokenBridge public bridge;

    function bridgeTokens(
        address token,
        uint256 amount,
        uint16 targetChain,
        address recipient
    ) external payable {
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        IERC20(token).approve(address(bridge), amount);

        bytes32 recipientBytes = bytes32(uint256(uint160(recipient)));

        bridge.transferTokens{value: msg.value}(
            token,
            amount,
            targetChain,
            recipientBytes,
            0,
            uint32(block.timestamp)
        );
    }
}
```

## Bridge Security Patterns

### Rate Limiting

```solidity
contract RateLimitedBridge {
    uint256 public constant RATE_LIMIT = 1000000 * 1e18;
    uint256 public constant RATE_PERIOD = 1 hours;

    uint256 public currentPeriodStart;
    uint256 public currentPeriodTransferred;

    modifier rateLimited(uint256 amount) {
        if (block.timestamp >= currentPeriodStart + RATE_PERIOD) {
            currentPeriodStart = block.timestamp;
            currentPeriodTransferred = 0;
        }

        require(
            currentPeriodTransferred + amount <= RATE_LIMIT,
            "Rate limit exceeded"
        );

        currentPeriodTransferred += amount;
        _;
    }
}
```

### Circuit Breaker

```solidity
contract CircuitBreakerBridge {
    bool public paused;
    address public guardian;
    uint256 public pauseThreshold;

    modifier notPaused() {
        require(!paused, "Bridge paused");
        _;
    }

    function pause() external {
        require(msg.sender == guardian, "Only guardian");
        paused = true;
    }

    function unpause() external {
        require(msg.sender == guardian, "Only guardian");
        paused = false;
    }

    function emergencyWithdraw(
        address token,
        address to,
        uint256 amount
    ) external {
        require(msg.sender == guardian, "Only guardian");
        require(paused, "Must be paused");
        IERC20(token).transfer(to, amount);
    }
}
```

### Message Verification

```solidity
contract VerifiedBridge {
    mapping(bytes32 => bool) public processedMessages;
    mapping(uint256 => uint256) public chainConfirmations;

    function processMessage(
        bytes32 messageHash,
        bytes[] calldata signatures,
        uint256 sourceChain
    ) external {
        require(!processedMessages[messageHash], "Already processed");
        require(
            verifySignatures(messageHash, signatures),
            "Invalid signatures"
        );

        processedMessages[messageHash] = true;
        // Process the message...
    }

    function verifySignatures(
        bytes32 messageHash,
        bytes[] calldata signatures
    ) internal view returns (bool) {
        // Verify threshold signatures from validators
        uint256 validSigs = 0;
        for (uint i = 0; i < signatures.length; i++) {
            address signer = recoverSigner(messageHash, signatures[i]);
            if (isValidator(signer)) {
                validSigs++;
            }
        }
        return validSigs >= threshold;
    }
}
```

## Finality Handling

```typescript
// TypeScript finality handling
const CHAIN_FINALITY = {
  ethereum: { blocks: 32, time: 384 }, // 384 seconds for finality
  arbitrum: { blocks: 1, time: 0 }, // Inherits ETH security
  optimism: { blocks: 1, time: 0 }, // Inherits ETH security
  polygon: { blocks: 256, time: 512 }, // ~8.5 minutes
  bsc: { blocks: 15, time: 45 }, // ~45 seconds
  avalanche: { blocks: 1, time: 2 }, // 2 seconds
};

async function waitForFinality(chainId: number, txHash: string) {
  const finality = CHAIN_FINALITY[chainId];
  const receipt = await provider.getTransactionReceipt(txHash);

  while (true) {
    const currentBlock = await provider.getBlockNumber();
    if (currentBlock - receipt.blockNumber >= finality.blocks) {
      return receipt;
    }
    await sleep(1000);
  }
}
```

## Process Integration

| Process | Purpose |
|---------|---------|
| `cross-chain-bridge.js` | Bridge development |
| `blockchain-node-setup.js` | Multi-chain infra |
| `multi-signature-wallet.js` | Cross-chain multisig |

## Best Practices

1. Implement rate limiting on bridges
2. Use circuit breakers for emergencies
3. Handle finality differences per chain
4. Verify message authenticity thoroughly
5. Monitor bridge TVL and anomalies
6. Plan for chain reorganizations

## See Also

- `skills/solidity-dev/SKILL.md` - Contract development
- `agents/bridge-architect/AGENT.md` - Bridge expert
- [LayerZero Docs](https://docs.layerzero.network/)
- [CCIP Docs](https://docs.chain.link/ccip)
