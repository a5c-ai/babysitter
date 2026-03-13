---
name: wallet-integration
description: Wallet connection and transaction management for dApps using wagmi and viem. Supports multiple connectors, chain switching, EIP-712 signing, and hardware wallet integration.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# Wallet Integration Skill

Expert wallet connection and transaction management for Web3 dApps using wagmi and viem.

## Capabilities

- **Connector Configuration**: Set up wagmi with multiple connectors
- **Connection Flows**: Implement wallet connection UX
- **Chain Management**: Handle chain switching and network errors
- **Transactions**: Execute transactions with gas estimation
- **Error Handling**: Parse and display transaction errors
- **EIP-712 Signing**: Implement typed data signing
- **Event Handling**: React to wallet events
- **Hardware Wallets**: Support Ledger, Trezor, WalletConnect

## Installation

```bash
# Install wagmi and viem
npm install wagmi viem @tanstack/react-query

# Optional UI kits
npm install @rainbow-me/rainbowkit  # or
npm install @web3modal/wagmi
```

## Configuration

### Basic wagmi Config

```typescript
// config/wagmi.ts
import { createConfig, http } from "wagmi";
import { mainnet, sepolia, polygon, arbitrum } from "wagmi/chains";
import { injected, walletConnect, coinbaseWallet } from "wagmi/connectors";

export const config = createConfig({
  chains: [mainnet, sepolia, polygon, arbitrum],
  connectors: [
    injected(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID!,
    }),
    coinbaseWallet({
      appName: "My dApp",
    }),
  ],
  transports: {
    [mainnet.id]: http(process.env.NEXT_PUBLIC_MAINNET_RPC),
    [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC),
    [polygon.id]: http(process.env.NEXT_PUBLIC_POLYGON_RPC),
    [arbitrum.id]: http(process.env.NEXT_PUBLIC_ARBITRUM_RPC),
  },
});
```

### RainbowKit Setup

```typescript
// config/rainbowkit.ts
import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mainnet, sepolia, polygon } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "My dApp",
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID!,
  chains: [mainnet, sepolia, polygon],
  ssr: true,
});
```

## Provider Setup

```tsx
// app/providers.tsx
"use client";

import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { config } from "./config/wagmi";

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

## Connection Components

### Connect Button

```tsx
// components/ConnectButton.tsx
import { useAccount, useConnect, useDisconnect } from "wagmi";

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <div>
        <p>
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </p>
        <button onClick={() => disconnect()}>Disconnect</button>
      </div>
    );
  }

  return (
    <div>
      {connectors.map((connector) => (
        <button
          key={connector.id}
          onClick={() => connect({ connector })}
          disabled={isPending}
        >
          {isPending ? "Connecting..." : `Connect ${connector.name}`}
        </button>
      ))}
      {error && <p>Error: {error.message}</p>}
    </div>
  );
}
```

### Account Display

```tsx
// components/Account.tsx
import { useAccount, useBalance, useEnsName, useEnsAvatar } from "wagmi";

export function Account() {
  const { address, chain } = useAccount();
  const { data: balance } = useBalance({ address });
  const { data: ensName } = useEnsName({ address });
  const { data: ensAvatar } = useEnsAvatar({ name: ensName ?? undefined });

  return (
    <div>
      {ensAvatar && <img src={ensAvatar} alt="ENS Avatar" />}
      <p>{ensName ?? `${address?.slice(0, 6)}...${address?.slice(-4)}`}</p>
      <p>
        {balance?.formatted} {balance?.symbol}
      </p>
      <p>Network: {chain?.name}</p>
    </div>
  );
}
```

## Chain Switching

```tsx
// components/NetworkSwitcher.tsx
import { useAccount, useSwitchChain } from "wagmi";

export function NetworkSwitcher() {
  const { chain } = useAccount();
  const { chains, switchChain, isPending, error } = useSwitchChain();

  return (
    <div>
      <p>Current: {chain?.name ?? "Not connected"}</p>

      <div>
        {chains.map((c) => (
          <button
            key={c.id}
            onClick={() => switchChain({ chainId: c.id })}
            disabled={isPending || c.id === chain?.id}
          >
            {c.name}
          </button>
        ))}
      </div>

      {error && <p>Error: {error.message}</p>}
    </div>
  );
}
```

## Transaction Execution

### Send Transaction

```tsx
// components/SendTransaction.tsx
import { useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";

export function SendTransaction() {
  const { data: hash, isPending, error, sendTransaction } = useSendTransaction();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const to = formData.get("to") as `0x${string}`;
    const value = formData.get("value") as string;

    sendTransaction({
      to,
      value: parseEther(value),
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="to" placeholder="0x..." required />
      <input name="value" placeholder="0.01" required />
      <button type="submit" disabled={isPending}>
        {isPending ? "Sending..." : "Send"}
      </button>

      {hash && <p>Tx: {hash}</p>}
      {isConfirming && <p>Confirming...</p>}
      {isSuccess && <p>Confirmed!</p>}
      {error && <p>Error: {error.message}</p>}
    </form>
  );
}
```

### Contract Interaction

```tsx
// components/ContractInteraction.tsx
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { erc20Abi } from "viem";

const TOKEN_ADDRESS = "0x...";

export function TokenBalance({ address }: { address: `0x${string}` }) {
  const { data: balance, refetch } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address],
  });

  return <p>Balance: {balance ? formatUnits(balance, 18) : "0"}</p>;
}

export function TokenTransfer() {
  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash });

  function handleTransfer(to: string, amount: string) {
    writeContract({
      address: TOKEN_ADDRESS,
      abi: erc20Abi,
      functionName: "transfer",
      args: [to as `0x${string}`, parseUnits(amount, 18)],
    });
  }

  return (
    <button
      onClick={() => handleTransfer("0x...", "100")}
      disabled={isPending}
    >
      {isPending ? "Transferring..." : "Transfer 100 Tokens"}
    </button>
  );
}
```

## EIP-712 Typed Data Signing

```tsx
// components/SignTypedData.tsx
import { useSignTypedData, useAccount } from "wagmi";

const domain = {
  name: "My dApp",
  version: "1",
  chainId: 1,
  verifyingContract: "0x..." as const,
};

const types = {
  Permit: [
    { name: "owner", type: "address" },
    { name: "spender", type: "address" },
    { name: "value", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
};

export function SignPermit() {
  const { address } = useAccount();
  const { signTypedData, data: signature, isPending } = useSignTypedData();

  function handleSign() {
    signTypedData({
      domain,
      types,
      primaryType: "Permit",
      message: {
        owner: address!,
        spender: "0x..." as const,
        value: BigInt("1000000000000000000"),
        nonce: BigInt(0),
        deadline: BigInt(Math.floor(Date.now() / 1000) + 3600),
      },
    });
  }

  return (
    <div>
      <button onClick={handleSign} disabled={isPending}>
        Sign Permit
      </button>
      {signature && <p>Signature: {signature}</p>}
    </div>
  );
}
```

## Error Handling

```tsx
// utils/errors.ts
import { BaseError, ContractFunctionRevertedError } from "viem";

export function parseContractError(error: unknown): string {
  if (error instanceof BaseError) {
    const revertError = error.walk(
      (err) => err instanceof ContractFunctionRevertedError
    );

    if (revertError instanceof ContractFunctionRevertedError) {
      const errorName = revertError.data?.errorName ?? "Unknown error";
      return `Contract reverted: ${errorName}`;
    }

    return error.shortMessage;
  }

  return "Unknown error occurred";
}
```

## Process Integration

| Process | Purpose |
|---------|---------|
| `dapp-frontend-development.js` | dApp building |
| `hd-wallet-implementation.js` | Wallet integration |
| `multi-signature-wallet.js` | Multi-sig dApps |

## Best Practices

1. Always handle connection errors
2. Show transaction status feedback
3. Support multiple wallet types
4. Implement chain switching gracefully
5. Cache frequently accessed data
6. Test with multiple wallets

## See Also

- `skills/subgraph-indexing/SKILL.md` - Data indexing
- `agents/web3-frontend/AGENT.md` - Frontend expert
- [wagmi Documentation](https://wagmi.sh/)
- [viem Documentation](https://viem.sh/)
