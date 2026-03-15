# Cryptography and Blockchain Development - Skills and Agents References

This document provides links to community-created Claude skills, agents, plugins, and MCP (Model Context Protocol) servers that can be used to implement or enhance the skills and agents identified in the backlog for this specialization.

---

## Table of Contents

1. [Overview](#overview)
2. [Solidity Development & Smart Contracts](#solidity-development--smart-contracts)
3. [Smart Contract Security & Auditing](#smart-contract-security--auditing)
4. [Development Frameworks (Foundry/Hardhat)](#development-frameworks-foundryhardhat)
5. [Formal Verification](#formal-verification)
6. [Zero-Knowledge Proofs](#zero-knowledge-proofs)
7. [DeFi Protocol Integration](#defi-protocol-integration)
8. [Web3 Frontend (wagmi/viem/ethers)](#web3-frontend-wagmiviemethers)
9. [Blockchain Indexing (The Graph)](#blockchain-indexing-the-graph)
10. [Multi-Chain & EVM Networks](#multi-chain--evm-networks)
11. [Wallet Integration](#wallet-integration)
12. [Token Standards & NFTs](#token-standards--nfts)
13. [Blockchain Node Operations](#blockchain-node-operations)
14. [Cross-Chain Bridges](#cross-chain-bridges)
15. [Governance & DAOs](#governance--daos)
16. [Market Data & Analytics](#market-data--analytics)
17. [Trading & DeFi Operations](#trading--defi-operations)
18. [Solana Ecosystem](#solana-ecosystem)
19. [Bitcoin & Lightning Network](#bitcoin--lightning-network)
20. [General Blockchain Collections](#general-blockchain-collections)
21. [Summary](#summary)

---

## Overview

This reference document maps community resources to the skills and agents identified in the [skills-agents-backlog.md](./skills-agents-backlog.md). The resources include:

- **MCP Servers**: Model Context Protocol servers that enable Claude to interact with blockchain tools and networks
- **Claude Skills**: Packaged capabilities for Claude Code focused on blockchain development
- **Plugins**: Extensions for Claude Code blockchain functionality
- **Agents**: Specialized AI agents for DeFi, security auditing, and cryptographic domains

### Resource Status Legend
- Active - Actively maintained and recommended
- Official - Official vendor/maintainer supported
- Community - Community maintained
- Preview - In preview/beta status

---

## Solidity Development & Smart Contracts

**Backlog Reference**: SK-001 (solidity-dev), SK-017 (openzeppelin), AG-009 (token-standards)

### MCP Servers

| Resource | Description | URL | Status |
|----------|-------------|-----|--------|
| **OpenZeppelin Contracts MCP** | Official OpenZeppelin MCP server. AI-powered smart contract generation with Contracts Wizard templates (ERC-20, ERC-721, ERC-1155, Governor, Stablecoin, RWA). Supports Solidity, Cairo, and Stellar. | [OpenZeppelin](https://www.openzeppelin.com/news/introducing-contracts-mcp) | Official |
| **OpenZeppelin Contracts Wizard** | MCP server generator for secure smart contracts. Multi-language support (Solidity, Stylus, Cairo, Stellar). | [GitHub](https://github.com/OpenZeppelin/contracts-wizard) | Official |
| **OpenZeppelin Docs MCP** | NatSpec extraction and documentation parsing from Solidity source files. Install: `claude mcp add openzeppelin-docs -- npx -y github:pbuda/openzeppelin-docs-mcp` | [GitHub](https://github.com/pbuda/openzeppelin-docs-mcp) | Community |
| **openzeppelin-mcp** (codewithdpk) | Production-ready Solidity templates for tokens, NFTs, DeFi, and DAO applications. | [Glama](https://glama.ai/mcp/servers/@codewithdpk/openzippelin-mcp) | Community |
| **Solidity Contract Analyzer MCP** | Bridge AI and blockchain for smart contract code analysis. Understanding existing contracts with metadata extraction. | [Skywork](https://skywork.ai/skypage/en/smart-contract-analysis-solidity/1979007721183420416) | Community |
| **UCAI (Universal Contract AI Interface)** | Open standard for connecting AI agents to blockchain. MCP server generator for smart contracts. Claude + Uniswap, Aave, ERC20, NFTs, DeFi. Python CLI with Web3 integration. | [GitHub](https://github.com/nirholas/UCAI) | Active |

### Claude Skills & Plugins

| Resource | Description | URL | Status |
|----------|-------------|-----|--------|
| **blockchain-developer** (zenobi-us) | Expert blockchain developer skill specializing in smart contract development, DApp architecture, and DeFi protocols. Works with Web3.js, Ethers.js, Solidity compiler, and Foundry. | [Claude Plugins](https://claude-plugins.dev/skills/@zenobi-us/dotfiles/blockchain-developer) | Community |
| **blockchain-web3** (PayRequest) | Solidity, smart contracts, DeFi protocols, NFT platforms, Web3 apps. Install: `/plugin install blockchain-web3` | [GitHub](https://github.com/PayRequest/claude-plugins) | Community |
| **Web3 Blockchain Manager** | Interact directly with decentralized networks, query wallet balances, track transaction history, execute contract calls. | [MCP Market](https://mcpmarket.com/tools/skills/web3-blockchain-manager) | Community |

---

## Smart Contract Security & Auditing

**Backlog Reference**: SK-002 (slither-analysis), SK-003 (mythril-symbolic), SK-005 (echidna-fuzzer), SK-019 (bug-bounty), AG-001 (solidity-auditor), AG-010 (incident-response)

### MCP Servers

| Resource | Description | URL | Status |
|----------|-------------|-----|--------|
| **Slither MCP** (Trail of Bits) | Official MCP server for Slither static analysis. Security analysis with all detectors, filtering by impact/confidence, call graphs, inheritance diagrams. Install: `claude mcp add slither -- uvx --from git+https://github.com/trailofbits/slither-mcp slither-mcp` | [GitHub](https://github.com/trailofbits/slither-mcp) | Official |
| **EVM MCP Tools** (0xGval) | Comprehensive blockchain analysis toolkit for Claude AI. Smart contract auditing, security issue analysis, source code verification, token standard detection. | [GitHub](https://github.com/0xGval/evm-mcp-tools) | Active |
| **Heurist Mesh MCP** | On-chain analytics, token metrics, and smart contract security insights. | [GitHub](https://github.com/heurist-network/heurist-mesh-mcp-server) | Community |
| **mcp-contract-analyst** | Smart contract analysis and security evaluation on Monad network. | [GitHub](https://github.com/RockYuan/mcp-contract-analyst) | Community |
| **Phalcon MCP** (mark3labs) | BlockSec integration for blockchain transaction analysis and exploit detection. | [GitHub](https://github.com/mark3labs/phalcon-mcp) | Community |

### Trail of Bits Claude Skills

| Resource | Description | URL | Status |
|----------|-------------|-----|--------|
| **building-secure-contracts** | Smart contract security toolkit based on Trail of Bits' Building Secure Contracts framework. 11 specialized skills: 6 vulnerability scanners for platform-specific attack patterns, 5 development guidelines assistants. CC-BY-SA-4.0 licensed. | [GitHub](https://github.com/trailofbits/skills/tree/main/plugins/building-secure-contracts) | Official |
| **entry-point-analyzer** | Identify state-changing entry points in smart contracts for security auditing. | [GitHub](https://github.com/trailofbits/skills) | Official |
| **spec-to-code-compliance** | Specification-to-code compliance checker for blockchain audits. Audit smart contracts against whitepapers or design documents. | [GitHub](https://github.com/trailofbits/skills) | Official |
| **property-based-testing** | Property-based testing guidance for multiple languages and smart contracts. | [GitHub](https://github.com/trailofbits/skills) | Official |
| **variant-analysis** | Find similar vulnerabilities via pattern-based analysis across codebases. | [GitHub](https://github.com/trailofbits/skills) | Official |
| **fix-review** | Verify fix commits address audit findings without introducing new bugs. | [GitHub](https://github.com/trailofbits/skills) | Official |

### Security Tool References

| Tool | Description | URL |
|------|-------------|-----|
| **Slither** | Static analysis framework for Solidity. Detects common vulnerabilities. | [GitHub](https://github.com/crytic/slither) |
| **Mythril** | EVM bytecode security analyzer. Symbolic execution and taint analysis. | [GitHub](https://github.com/Consensys/mythril) |
| **Echidna** | Ethereum smart contract fuzzer. Property-based testing with grammar-based fuzzing. | [GitHub](https://github.com/crytic/echidna) |
| **Manticore** | Symbolic execution tool for multi-platform analysis. | [GitHub](https://github.com/trailofbits/manticore) |
| **Not So Smart Contracts** | Examples of common vulnerabilities. Educational resource from Trail of Bits. | [GitHub](https://github.com/crytic/not-so-smart-contracts) |

---

## Development Frameworks (Foundry/Hardhat)

**Backlog Reference**: SK-004 (foundry-framework), SK-009 (hardhat-framework)

### MCP Servers

| Resource | Description | URL | Status |
|----------|-------------|-----|--------|
| **Foundry MCP Server** (PraneshASP) | MCP server providing Solidity development capabilities using Foundry toolchain (Forge, Cast, Anvil). Enables LLM assistants to perform Solidity and on-chain operations directly. Persistent workspace at ~/.mcp-foundry-workspace. | [GitHub](https://github.com/PraneshASP/foundry-mcp-server) | Active |
| **MCP-Forge** (peggyjv) | Bridges AI agents and Foundry's smart contract development environment. | [Playbooks](https://playbooks.com/mcp/peggyjv-forge) | Active |
| **Base MCP** | Official Base MCP server enabling smart contract deployments, NFT operations (ERC721/ERC1155), and blockchain interactions. | [GitHub](https://github.com/base/base-mcp) | Official |
| **MCP Server for Smart Contract Tools** | Compile and audit smart contract code via MCP. | [LobeHub](https://lobehub.com/mcp/mcp-dockmaster-mcp-server-devtools) | Community |

### Key Capabilities
- Forge tests with fuzzing and invariant testing
- Gas reports and snapshots
- Anvil for local development and mainnet forking
- Cast commands for chain interaction
- forge script for deployments
- Chisel for Solidity REPL debugging

---

## Formal Verification

**Backlog Reference**: SK-006 (certora-prover), AG-005 (formal-methods)

### MCP Servers & Tools

| Resource | Description | URL | Status |
|----------|-------------|-----|--------|
| **Certora AI Composer** | AI tool for generating verified implementations from documentation and CVL specifications. Embeds Certora's Prover to verify every AI-generated code snippet. Requires Claude API key. | [GitHub](https://github.com/Certora/AIComposer) | Official |
| **Certora Prover** | Formal verification for smart contracts on EVM, Solana, and Stellar. Solidity, Vyper, and Rust support. | [GitHub](https://github.com/Certora/CertoraProver) | Official |
| **Certora Security Reports** | Portfolio of smart contract security verification reports and audits. | [GitHub](https://github.com/Certora/SecurityReports) | Official |

### Verification Resources

| Resource | Description | URL |
|----------|-------------|-----|
| **Certora Tutorials** | Practical tutorials for Certora Prover. | [GitHub](https://github.com/Certora/Tutorials) |
| **Certora Documentation** | Official CVL specification language and prover documentation. | [Certora Docs](https://docs.certora.com/) |

---

## Zero-Knowledge Proofs

**Backlog Reference**: SK-007 (zk-circuits), AG-002 (zk-cryptographer)

### ZK Development Resources

| Resource | Description | URL | Status |
|----------|-------------|-----|--------|
| **Circom** | zkSNARK circuit compiler. Novel domain-specific language for defining arithmetic circuits. R1CS generation with C++ or WebAssembly output. | [GitHub](https://github.com/iden3/circom) | Active |
| **Noir Language** | Rust-like language for ZK applications from Aztec. Compiles to ACIR (Abstract Circuit Intermediate Representation). | [Noir Lang](https://noir-lang.org/docs) | Active |
| **snarkjs** | zkSNARK implementation in JavaScript & WASM. Groth16 and PLONK support. | [GitHub](https://github.com/iden3/snarkjs) |
| **Arkworks** | Rust ecosystem for zkSNARKs. Flexible cryptographic primitives. | [Arkworks](https://arkworks.rs/) | Active |
| **ZoKrates** | Toolbox for zkSNARKs on Ethereum. High-level language and compiler. | [ZoKrates](https://zokrates.github.io/) | Active |

### Curated ZK Lists

| Resource | Description | URL |
|----------|-------------|-----|
| **awesome-zero-knowledge** (odradev) | Curated list of Zero Knowledge links focusing on blockchain. | [GitHub](https://github.com/odradev/awesome-zero-knowledge) |
| **awesome-zk** (ventali) | Curated list of ZK resources, libraries, tools and more. | [GitHub](https://github.com/ventali/awesome-zk) |
| **awesome-zero-knowledge-proofs** (matter-labs) | Learning resources for ZKP from Matter Labs. | [GitHub](https://github.com/matter-labs/awesome-zero-knowledge-proofs) |
| **zk-atlas** | Almost complete atlas of contemporary Zero-Knowledge Proof technologies. | [GitHub](https://github.com/alxkzmn/zk-atlas) |

---

## DeFi Protocol Integration

**Backlog Reference**: SK-012 (defi-protocols), SK-015 (tokenomics), AG-003 (defi-architect)

### MCP Servers

| Resource | Description | URL | Status |
|----------|-------------|-----|--------|
| **defi-rates-mcp** | Real-time DeFi lending rates across 13+ protocols (Aave, Morpho, Compound, Venus, Lista, HyperLend, Fluid, HypurrFi, Euler, Drift, Jupiter). Filter by platform and blockchain. | [GitHub](https://github.com/qingfeng/defi-rates-mcp) | Active |
| **aave-mcp** | Production-ready MCP server for Aave V3 DeFi operations on Base. Smart contract interactions with automatic gas optimization. | [GitHub](https://github.com/Tairon-ai/aave-mcp) | Active |
| **uniswap-mcp** (yurenju) | Model Context Protocol for Uniswap. Token swaps and wallet management on Optimism with Claude Desktop. | [GitHub](https://github.com/yurenju/uniswap-mcp) | Active |
| **uniswap-trader-mcp** | Automated token swaps on Uniswap DEX across multiple blockchains. | [GitHub](https://github.com/kukapay/uniswap-trader-mcp) | Active |
| **defillama-mcp** | DeFi Llama ecosystem API wrapper for comprehensive DeFi data. | [GitHub](https://github.com/demcp/defillama-mcp) | Active |
| **defi-yields-mcp** | DeFi yield opportunity exploration for AI agents. | [GitHub](https://github.com/kukapay/defi-yields-mcp) | Active |
| **chainlink-feeds-mcp** | Real-time access to Chainlink's decentralized on-chain price feeds. | [GitHub](https://github.com/kukapay/chainlink-feeds-mcp) | Active |
| **mcp-server-defillama** (dcSpark) | DeFi data via DefiLlama API for Claude AI. | [GitHub](https://github.com/dcSpark/mcp-server-defillama) | Active |
| **bridge-rates-mcp** | Real-time cross-chain bridge rates and routes. | [GitHub](https://github.com/kukapay/bridge-rates-mcp) | Active |
| **uniswap-poolspy-mcp** | Liquidity pool tracking across nine blockchains. | [GitHub](https://github.com/kukapay/uniswap-poolspy-mcp) | Active |
| **pancakeswap-poolspy-mcp** | Real-time liquidity pool tracking on PancakeSwap. | [GitHub](https://github.com/kukapay/pancakeswap-poolspy-mcp) | Active |

---

## Web3 Frontend (wagmi/viem/ethers)

**Backlog Reference**: SK-011 (wallet-integration), AG-006 (web3-frontend)

### MCP Servers

| Resource | Description | URL | Status |
|----------|-------------|-----|--------|
| **viemcp** | Fast setup MCP server for Viem & Wagmi integration. Embedded patterns for instant access (offline, zero-latency). React hooks patterns and code generation for Web3 UIs. Type-safe with viem's type inference. Read-only, prepares unsigned transactions only. | [GitHub](https://github.com/ccbbccbb/viemcp) | Active |
| **web3-mcp** (Strangelove Ventures) | Multi-chain MCP server supporting Ethereum, Solana, Cardano, THORChain, XRP, Bitcoin with balance and transaction capabilities. | [GitHub](https://github.com/strangelove-ventures/web3-mcp) | Active |
| **web3-assistant-mcp** | Blockchain smart contract interactions with ABI analysis. | [GitHub](https://github.com/LaplaceMan/web3-assistant-mcp) | Community |
| **web3-mcp** (tumf) | Blockchain data interaction via Ankr's Advanced API. | [GitHub](https://github.com/tumf/web3-mcp) | Community |

### Key Features
- Embedded viem/wagmi code patterns
- Wagmi React hooks support
- TypeScript type safety
- Multi-chain configuration
- Transaction preparation (unsigned)

---

## Blockchain Indexing (The Graph)

**Backlog Reference**: SK-010 (subgraph-indexing), AG-006 (web3-frontend)

### MCP Servers

| Resource | Description | URL | Status |
|----------|-------------|-----|--------|
| **subgraph-mcp** (graphops) | Official Subgraph MCP server. Execute GraphQL queries against subgraph deployments via IPFS hashes. Get top subgraph deployments for contract addresses. 120-second configurable timeout. | [GitHub](https://github.com/graphops/subgraph-mcp) | Official |
| **thegraph-mcp** (kukapay) | Powers AI agents with indexed blockchain data from The Graph. Fetches schemas, enables AI to generate GraphQL queries. | [GitHub](https://github.com/kukapay/thegraph-mcp) | Active |

### Documentation
- [The Graph Subgraph MCP Introduction](https://thegraph.com/docs/en/ai-suite/subgraph-mcp/introduction/)
- [Claude Desktop Integration Guide](https://thegraph.com/docs/en/ai-suite/subgraph-mcp/claude/)

### Key Capabilities
- Natural language queries to 15,000+ subgraphs
- Schema retrieval by deployment ID, Subgraph ID, or IPFS hash
- Query execution and result parsing
- Subgraph search by keyword
- 30-day query count analytics

---

## Multi-Chain & EVM Networks

**Backlog Reference**: SK-014 (cross-chain), AG-004 (blockchain-infra)

### MCP Servers

| Resource | Description | URL | Status |
|----------|-------------|-----|--------|
| **evm-mcp-server** (mcpdotdirect) | Comprehensive MCP server for 30+ EVM-compatible networks. Native tokens, ERC20, NFTs, smart contracts, transactions, ENS resolution. | [GitHub](https://github.com/mcpdotdirect/evm-mcp-server) | Active |
| **Blockchain MCP** (Tatum) | Access to Tatum Blockchain Data API and RPC Gateway across 130+ networks. | [GitHub](https://github.com/tatumio/blockchain-mcp) | Active |
| **GOAT On-Chain Agent MCP** | 200+ on-chain actions across Ethereum, Solana, and Base networks. | [GitHub](https://github.com/goat-sdk/goat) | Active |
| **starknet-mcp-server** | Starknet blockchain with wallet and smart contract capabilities. | [GitHub](https://github.com/mcpdotdirect/starknet-mcp-server) | Active |
| **polygon-mcp** | Polygon PoS blockchain interaction tools. | [GitHub](https://github.com/Dablclub/polygon-mcp) | Active |
| **linea-mcp** | Linea blockchain on-chain tools. | [GitHub](https://github.com/qvkare/linea-mcp) | Active |
| **bsc-mcp** | Binance Smart Chain interaction tool for token transfers and smart contracts. | [GitHub](https://github.com/TermiX-official/bsc-mcp) | Active |
| **flow-mcp-server** | Flow blockchain interaction. | [GitHub](https://github.com/lmcmz/flow-mcp-server) | Community |
| **near-mcp** | NEAR blockchain server for AI interaction. | [GitHub](https://github.com/nearai/near-mcp) | Official |
| **algorand-mcp** | Algorand blockchain server and client. | [GitHub](https://github.com/GoPlausible/algorand-mcp) | Community |
| **mcp-xrpl** | XRP Ledger blockchain services. | [GitHub](https://github.com/RomThpt/mcp-xrpl) | Community |
| **go-sui-mcp** | Sui blockchain management. | [GitHub](https://github.com/hawkli-1994/go-sui-mcp) | Community |

---

## Wallet Integration

**Backlog Reference**: SK-011 (wallet-integration), SK-013 (crypto-primitives), AG-007 (crypto-engineer)

### MCP Servers

| Resource | Description | URL | Status |
|----------|-------------|-----|--------|
| **metamask-mcp** | MetaMask blockchain interactions with private key security. | [GitHub](https://github.com/Xiawpohr/metamask-mcp) | Active |
| **mcp-cryptowallet-evm** (dcSpark) | Ethereum and EVM wallet interactions with Claude. | [GitHub](https://github.com/dcSpark/mcp-cryptowallet-evm) | Active |
| **mcp-cryptowallet-solana** (dcSpark) | Solana crypto wallet integration with Claude AI. | [GitHub](https://github.com/dcSpark/mcp-cryptowallet-solana) | Active |
| **ai-custodial-wallet** | Secure custodial wallet for MCP servers with encrypted transactions. | [GitHub](https://github.com/uratmangun/ai-custodial-wallet) | Community |
| **mcp-wallet** | Secure Web3 wallet SDK for Monad and EVM blockchains. | [GitHub](https://github.com/dushaobindoudou/mcp-wallet) | Community |
| **armor-crypto-mcp** | AI crypto ecosystem integration with wallet and swap management. | [GitHub](https://github.com/armorwallet/armor-crypto-mcp) | Active |
| **Wallet MCP** (TP Lab) | AI client and crypto wallet integration. | [NPM](https://www.npmjs.com/package/wallet-mcp) | Active |

---

## Token Standards & NFTs

**Backlog Reference**: SK-017 (openzeppelin), AG-009 (token-standards)

### MCP Servers

| Resource | Description | URL | Status |
|----------|-------------|-----|--------|
| **Base MCP** | NFT operations supporting ERC721 and ERC1155. List and transfer NFTs. | [GitHub](https://github.com/base/base-mcp) | Official |
| **token-minter-mcp** | ERC-20 token minting across 21 blockchains. | [GitHub](https://github.com/kukapay/token-minter-mcp) | Active |
| **token-revoke-mcp** | ERC-20 token allowance management across blockchains. | [GitHub](https://github.com/kukapay/token-revoke-mcp) | Active |
| **metaplex-pnft-mcp** | Structured and agent-friendly interface for creation of programmable NFTs on Solana. | [GitHub](https://github.com/collinsezedike/metaplex-pnft-mcp) | Community |
| **verbwire-mcp-server** | Deploying smart contracts, minting NFTs, and managing IPFS storage. | [GitHub](https://github.com/verbwire/verbwire-mcp-server) | Active |
| **mcp-nftgo-api** | NFTGo Developer API HTTP requests via MCP. | [GitHub](https://github.com/everimbaq/mcp-nftgo-api) | Community |
| **alchemy-sdk-mcp** | Alchemy SDK integration for blockchain and NFT operations. | [GitHub](https://github.com/itsanishjain/alchemy-sdk-mcp) | Community |

---

## Blockchain Node Operations

**Backlog Reference**: SK-016 (node-operations), AG-004 (blockchain-infra)

### MCP Servers

| Resource | Description | URL | Status |
|----------|-------------|-----|--------|
| **eth-mcp** | Ethereum blockchain interaction server. | [GitHub](https://github.com/0xKoda/eth-mcp) | Active |
| **eth-mcp-server** | Ethereum blockchain capabilities for AI assistants through MCP. | [GitHub](https://github.com/qingfengzxr/eth-mcp-server) | Active |
| **onchain-mcp** (Bankless) | Query Onchain data like ERC20 tokens, transaction history, smart contract state. | [GitHub](https://github.com/Bankless/onchain-mcp) | Active |
| **nodit-mcp-server** | Structured blockchain data across multiple networks. | [GitHub](https://github.com/noditlabs/nodit-mcp-server) | Active |
| **Codex-mcp** | Enriched blockchain data from Codex. | [GitHub](https://github.com/Codex-Data/codex-mcp) | Active |

### Block Explorers

| Resource | Description | URL | Status |
|----------|-------------|-----|--------|
| **mcp-etherscan-server** | Ethereum blockchain data via Etherscan API. Token balances, ENS lookups, contract interactions. | [GitHub](https://github.com/crazyrabbitLTC/mcp-etherscan-server) | Active |
| **etherscan-mcp** | Etherscan API for querying blockchain data across EVM-compatible chains. | [GitHub](https://github.com/haomingdev/etherscan-mcp) | Active |
| **etherscan-mcp-server** (huahuayu) | Multi-chain Etherscan data via Go-based server. | [GitHub](https://github.com/huahuayu/etherscan-mcp-server) | Active |
| **blockscout-mcp-server** | Blockscout API interaction for blockchain data retrieval. | [GitHub](https://github.com/karacurt/blockscout-mcp-server) | Community |
| **moralis-mcp** | Blockchain data querying via Moralis Web3 API. | [GitHub](https://github.com/a6b8/moralis-mcp) | Active |

---

## Cross-Chain Bridges

**Backlog Reference**: SK-014 (cross-chain), AG-011 (bridge-architect)

### MCP Servers

| Resource | Description | URL | Status |
|----------|-------------|-----|--------|
| **wormhole-mcp** | Multi-blockchain token transfers via Wormhole SDK. | [GitHub](https://github.com/collinsezedike/wormhole-mcp) | Active |
| **demcp-meson-mcp** | Cross-chain asset transfers via Meson protocol. | [GitHub](https://github.com/demcp/demcp-meson-mcp) | Active |
| **lifi-mcp** | LI.FI API integration for cross-chain swaps. | [GitHub](https://github.com/lifinance/lifi-mcp) | Active |
| **bridge-rates-mcp** | Real-time cross-chain bridge rates and routes. | [GitHub](https://github.com/kukapay/bridge-rates-mcp) | Active |
| **monad-bridge-mcp-server** | Ethereum Sepolia to Monad Testnet bridging via Wormhole. | [GitHub](https://github.com/rawakinode/monad-bridge-mcp-server) | Community |

---

## Governance & DAOs

**Backlog Reference**: AG-012 (governance-expert)

### MCP Servers

| Resource | Description | URL | Status |
|----------|-------------|-----|--------|
| **mcp-tally-api** | MCP server for Tally's blockchain governance API. Query DAOs, proposals, voting data across 15+ networks (Ethereum, Polygon, Arbitrum). Comprehensive governance metrics, voting patterns, delegate information. | [GitHub](https://github.com/withtally/mcp-tally-api) | Active |

### DAO Resources

| Resource | Description | URL |
|----------|-------------|-----|
| **DAO Standard Framework** | Standard DAO Framework for Ethereum. Decentralized Autonomous Organizations governed by code. | [GitHub](https://github.com/blockchainsllc/DAO) |

---

## Market Data & Analytics

**Backlog Reference**: SK-015 (tokenomics), SK-020 (chain-forensics)

### MCP Servers

| Resource | Description | URL | Status |
|----------|-------------|-----|--------|
| **CoinGecko MCP** | Token and market data via CoinGecko API. | [GitHub](https://github.com/Blockchain-MCPs/coingecko-mcp) | Active |
| **mcp-coingecko-server** | CoinGecko Pro API integration. | [GitHub](https://github.com/crazyrabbitLTC/mcp-coingecko-server) | Active |
| **CoinMarketCap MCP** | Real-time cryptocurrency pricing, market cap, and volume data. | [GitHub](https://github.com/anjor/coinmarket-mcp-server) | Active |
| **CoinCap MCP** | Crypto market data without API key requirement. | [GitHub](https://github.com/QuantGeekDev/coincap-mcp) | Active |
| **CoinStats MCP** | Cryptocurrency market data, portfolio tracking, and news. | [GitHub](https://github.com/CoinStatsHQ/coinstats-mcp) | Active |
| **DexPaprika MCP** | Real-time data for 5+ million tokens across 20+ blockchain networks. Token prices, liquidity, DEX analytics. | [GitHub](https://github.com/coinpaprika/dexpaprika-mcp) | Active |
| **dexscreener-mcp-server** | DexScreener API with DEX pair and token data. | [GitHub](https://github.com/openSVM/dexscreener-mcp-server) | Active |
| **whale-tracker-mcp** | Cryptocurrency whale transaction tracking. | [GitHub](https://github.com/kukapay/whale-tracker-mcp) | Active |
| **crypto-feargreed-mcp** | Real-time Crypto Fear & Greed Index data. | [GitHub](https://github.com/kukapay/crypto-feargreed-mcp) | Active |
| **crypto-sentiment-mcp** | Real-time cryptocurrency sentiment analysis via social media. | [GitHub](https://github.com/kukapay/crypto-sentiment-mcp) | Active |
| **crypto-indicators-mcp** | Technical analysis indicators and strategies for trading agents. | [GitHub](https://github.com/kukapay/crypto-indicators-mcp) | Active |
| **dune-analytics-mcp** | Dune Analytics data bridge for AI agents. | [GitHub](https://github.com/kukapay/dune-analytics-mcp) | Active |
| **Hive Intelligence** | Unified crypto, DeFi, and Web3 analytics access. | [GitHub](https://github.com/hive-intel/hive-crypto-mcp) | Active |
| **bicscan-mcp** | Blockchain address risk scoring via BICScan API. | [GitHub](https://github.com/ahnlabio/bicscan-mcp) | Active |
| **rug-check-mcp** | Solana meme token risk detection. | [GitHub](https://github.com/kukapay/rug-check-mcp) | Active |
| **web3-research-mcp** | Free local cryptocurrency deep research. | [GitHub](https://github.com/aaronjmars/web3-research-mcp) | Active |

### News & Information

| Resource | Description | URL | Status |
|----------|-------------|-----|--------|
| **cryptopanic-mcp-server** | Latest cryptocurrency news from CryptoPanic. | [GitHub](https://github.com/kukapay/cryptopanic-mcp-server) | Active |
| **crypto-news-mcp** | Real-time cryptocurrency news from NewsData. | [GitHub](https://github.com/kukapay/crypto-news-mcp) | Active |
| **blockbeats-mcp** | Blockchain news and articles from BlockBeats. | [GitHub](https://github.com/kukapay/blockbeats-mcp) | Active |
| **cointelegraph-mcp** | Real-time news access from Cointelegraph. | [GitHub](https://github.com/kukapay/cointelegraph-mcp) | Active |
| **crypto-whitepapers-mcp** | Structured knowledge base of crypto whitepapers. | [GitHub](https://github.com/kukapay/crypto-whitepapers-mcp) | Active |

---

## Trading & DeFi Operations

**Backlog Reference**: SK-012 (defi-protocols), AG-003 (defi-architect)

### MCP Servers

| Resource | Description | URL | Status |
|----------|-------------|-----|--------|
| **jupiter-mcp** | Token swaps on Solana using Jupiter's Ultra API. | [GitHub](https://github.com/kukapay/jupiter-mcp) | Active |
| **mcp-server-jupiter** (dcSpark) | Access to Jupiter's swap API for Claude. | [GitHub](https://github.com/dcSpark/mcp-server-jupiter) | Active |
| **freqtrade-mcp** | Freqtrade cryptocurrency trading bot integration for AI agents. | [GitHub](https://github.com/kukapay/freqtrade-mcp) | Active |
| **binance-mcp** (TermiX) | Secure and efficient Binance trading via MCP. | [GitHub](https://github.com/TermiX-official/binance-mcp) | Active |
| **mcp-server-ccxt** | Real-time and historical cryptocurrency data via CCXT across multiple exchanges. | [GitHub](https://github.com/Nayshins/mcp-server-ccxt) | Active |
| **hyperliquid-mcp** | Hyperliquid onchain tools via Model Context Protocol. | [GitHub](https://github.com/Impa-Ventures/hyperliquid-mcp) | Active |
| **crypto-liquidations-mcp** | Real-time liquidation events from Binance. | [GitHub](https://github.com/kukapay/crypto-liquidations-mcp) | Active |
| **crypto-orderbook-mcp** | Order book depth analysis across exchanges. | [GitHub](https://github.com/kukapay/crypto-orderbook-mcp) | Active |
| **funding-rates-mcp** | Real-time funding rates across exchanges. | [GitHub](https://github.com/kukapay/funding-rates-mcp) | Active |
| **crypto-portfolio-mcp** | Real-time cryptocurrency portfolio management via AI. | [GitHub](https://github.com/kukapay/crypto-portfolio-mcp) | Active |
| **mcp-free-usdc-transfer** | Gas-free USDC transfers on Base using Coinbase MPC wallets. | [GitHub](https://github.com/magnetai/mcp-free-usdc-transfer) | Active |

---

## Solana Ecosystem

**Backlog Reference**: SK-016 (node-operations)

### MCP Servers

| Resource | Description | URL | Status |
|----------|-------------|-----|--------|
| **Solana Agent Kit MCP Server** (SendAI) | Solana-focused MCP server with 40+ actions including SPL token management. | [GitHub](https://github.com/sendaifun/solana-agent-kit) | Active |
| **solana-dev-mcp** (Solana Foundation) | Official demo MCP server for Solana development with RPC methods. | [GitHub](https://github.com/solana-foundation/solana-dev-mcp) | Official |
| **mcp-server-helius** (dcSpark) | Solana blockchain data via Helius API. | [GitHub](https://github.com/dcSpark/mcp-server-helius) | Active |
| **solana-web3js-mcp-server** | Solana smart contract development and deployment. | [GitHub](https://github.com/FrankGenGo/solana-web3js-mcp-server) | Community |
| **solscan-mcp** | Solana blockchain data queries via Solscan API. | [GitHub](https://github.com/wowinter13/solscan-mcp) | Active |
| **solana-mcp** | Memecoin analysis and on-chain insights for Solana. | [GitHub](https://github.com/tony-42069/solana-mcp) | Active |
| **hubble-ai-mcp** | AI-powered Solana transaction analytics. | [GitHub](https://github.com/HubbleVision/hubble-ai-mcp) | Active |
| **Solana DeFi Analytics MCP Server** | Solana wallet and DeFi activity analytics. | [GitHub](https://github.com/kirtiraj22/Solana-DeFi-Analytics-MCP-Server) | Community |
| **solTracker-mcp** | Solana token, wallet, and trading data for LLM agents. | [GitHub](https://github.com/a6b8/solTracker-mcp) | Active |

---

## Bitcoin & Lightning Network

**Backlog Reference**: SK-013 (crypto-primitives), SK-016 (node-operations)

### MCP Servers

| Resource | Description | URL | Status |
|----------|-------------|-----|--------|
| **bitcoin-mcp** | Bitcoin and Lightning Network interaction capabilities. | [GitHub](https://github.com/AbdelStark/bitcoin-mcp) | Active |
| **lightning-mcp** | Lightning Network payment processing. AI-driven Bitcoin payments, invoice support, balance queries. | [GitHub](https://github.com/AbdelStark/lightning-mcp) | Active |
| **zbd-mcp-server** (Zebedee) | Bitcoin Lightning integration for micropayments and rewards. | [GitHub](https://github.com/zebedeeio/zbd-mcp-server) | Active |
| **nwc-mcp-server** | Bitcoin Lightning wallet via Nostr Wallet Connect. | [GitHub](https://github.com/getalby/nwc-mcp-server) | Active |
| **lightning-tools-mcp-server** | Lightning address and tools interaction for LLMs. | [GitHub](https://github.com/getAlby/lightning-tools-mcp-server) | Active |
| **bsv-mcp** | Bitcoin SV wallet, ordinals, and utility functions. | [GitHub](https://github.com/b-open-io/bsv-mcp) | Active |
| **ordiscan-mcp** | Ordinals and Runes data on Bitcoin via MCP. | [GitHub](https://github.com/ordiscan/ordiscan-mcp) | Active |

---

## General Blockchain Collections

### Curated Awesome Lists

| Resource | Description | URL |
|----------|-------------|-----|
| **awesome-blockchain-mcps** | Curated list of Blockchain & Crypto MCP servers. AI Agents for Blockchain, Web3, DeFi, on-chain data. | [GitHub](https://github.com/royyannick/awesome-blockchain-mcps) |
| **awesome-crypto-mcp-servers** | Collection of crypto MCP servers. | [GitHub](https://github.com/badkk/awesome-crypto-mcp-servers) |
| **awesome-web3-mcp-servers** (DeMCP) | Decentralized MCP network infrastructure between AI and Web3. | [GitHub](https://github.com/demcp/awesome-web3-mcp-servers) |
| **awesome-solana-mcp-servers** | Curated list of Solana MCP servers. | [GitHub](https://github.com/sendaifun/awesome-solana-mcp-servers) |
| **awesome-mcp-servers** (TensorBlock) | Comprehensive MCP servers collection with finance/crypto section. | [GitHub](https://github.com/TensorBlock/awesome-mcp-servers) |
| **awesome-mcp-servers** (punkpeye) | Collection of MCP servers for AI model integration. | [GitHub](https://github.com/punkpeye/awesome-mcp-servers) |

### Claude Skills Collections

| Resource | Description | URL |
|----------|-------------|-----|
| **Bankr Claude Plugins** | Web3 development plugins with multi-chain DeFi infrastructure. Base, Ethereum, Solana support. | [GitHub](https://github.com/BankrBot/claude-plugins) |
| **Trail of Bits Skills** | Security research, vulnerability detection, and audit workflows including building-secure-contracts. | [GitHub](https://github.com/trailofbits/skills) |
| **Claude Plugins (PayRequest)** | Blockchain-web3 plugin for Solidity, smart contracts, DeFi protocols. | [GitHub](https://github.com/PayRequest/claude-plugins) |

---

## Summary

### Statistics

| Category | Resources Found |
|----------|-----------------|
| Solidity Development & Smart Contracts | 9 |
| Smart Contract Security & Auditing | 12 |
| Development Frameworks (Foundry/Hardhat) | 4 |
| Formal Verification | 4 |
| Zero-Knowledge Proofs | 9 |
| DeFi Protocol Integration | 11 |
| Web3 Frontend (wagmi/viem/ethers) | 4 |
| Blockchain Indexing (The Graph) | 2 |
| Multi-Chain & EVM Networks | 12 |
| Wallet Integration | 7 |
| Token Standards & NFTs | 7 |
| Blockchain Node Operations | 10 |
| Cross-Chain Bridges | 5 |
| Governance & DAOs | 2 |
| Market Data & Analytics | 20 |
| Trading & DeFi Operations | 11 |
| Solana Ecosystem | 9 |
| Bitcoin & Lightning Network | 7 |
| General Collections | 9 |
| **Total** | **154** |

### Backlog Coverage

| Skill/Agent ID | Coverage | Primary Resources |
|----------------|----------|-------------------|
| SK-001 solidity-dev | Excellent | OpenZeppelin MCP, blockchain-developer skill, UCAI |
| SK-002 slither-analysis | Excellent | Slither MCP (Trail of Bits), EVM MCP Tools |
| SK-003 mythril-symbolic | Good | EVM MCP Tools, building-secure-contracts skill |
| SK-004 foundry-framework | Excellent | Foundry MCP Server, MCP-Forge |
| SK-005 echidna-fuzzer | Good | building-secure-contracts skill, property-based-testing |
| SK-006 certora-prover | Good | Certora AI Composer, Certora Prover |
| SK-007 zk-circuits | Limited | Circom, Noir, ZoKrates (no dedicated MCP) |
| SK-008 evm-analysis | Good | EVM MCP Tools, Solidity Contract Analyzer |
| SK-009 hardhat-framework | Good | (via Foundry MCP, Base MCP) |
| SK-010 subgraph-indexing | Excellent | subgraph-mcp (graphops), thegraph-mcp |
| SK-011 wallet-integration | Excellent | viemcp, metamask-mcp, dcSpark wallets |
| SK-012 defi-protocols | Excellent | defi-rates-mcp, aave-mcp, uniswap-mcp, defillama-mcp |
| SK-013 crypto-primitives | Limited | (via wallet integrations, no dedicated MCP) |
| SK-014 cross-chain | Good | wormhole-mcp, bridge-rates-mcp, lifi-mcp |
| SK-015 tokenomics | Good | defillama-mcp, market data MCPs, cadCAD (no MCP) |
| SK-016 node-operations | Excellent | Multiple Etherscan MCPs, eth-mcp, onchain-mcp |
| SK-017 openzeppelin | Excellent | OpenZeppelin Contracts MCP (Official) |
| SK-018 gas-optimization | Good | Foundry MCP, EVM MCP Tools |
| SK-019 bug-bounty | Good | Trail of Bits skills, building-secure-contracts |
| SK-020 chain-forensics | Good | whale-tracker-mcp, Phalcon MCP, bicscan-mcp |
| AG-001 solidity-auditor | Excellent | Slither MCP, Trail of Bits skills, EVM MCP Tools |
| AG-002 zk-cryptographer | Limited | (Circom/Noir tools, no dedicated agent) |
| AG-003 defi-architect | Excellent | Multiple DeFi MCPs, defillama-mcp |
| AG-004 blockchain-infra | Good | Multi-chain MCPs, node operation tools |
| AG-005 formal-methods | Good | Certora AI Composer |
| AG-006 web3-frontend | Excellent | viemcp, The Graph MCPs |
| AG-007 crypto-engineer | Limited | (via wallet MCPs, no dedicated agent) |
| AG-008 gas-optimizer | Good | Foundry MCP, EVM analysis tools |
| AG-009 token-standards | Excellent | OpenZeppelin MCP, token-minter-mcp |
| AG-010 incident-response | Good | Phalcon MCP, whale-tracker, building-secure-contracts |
| AG-011 bridge-architect | Good | wormhole-mcp, cross-chain MCPs |
| AG-012 governance-expert | Good | mcp-tally-api |

### Recommendations

1. **High Priority Implementations**: Focus on SK-007 (ZK circuits), SK-013 (cryptographic primitives), and AG-002 (ZK cryptographer) as these have limited existing community MCP resources.

2. **Leverage Official MCP Servers**: OpenZeppelin, The Graph, Trail of Bits, Solana Foundation, and Certora provide official MCP servers that should be preferred.

3. **Security First**: Trail of Bits' building-secure-contracts skill and Slither MCP provide comprehensive security coverage. Always recommend manual reviews alongside AI-assisted auditing.

4. **Composite Agents**: AG-003 (DeFi Architect), AG-004 (Blockchain Infra), and AG-006 (Web3 Frontend) can be built by composing multiple existing MCP servers.

5. **ZK Development Gap**: No dedicated MCP servers for Circom/Noir development. Consider creating custom skills for ZK circuit development workflows.

6. **Multi-Chain Support**: The evm-mcp-server (30+ networks) and Tatum Blockchain MCP (130+ networks) provide broad coverage for multi-chain applications.

---

**Created**: 2026-01-24
**Version**: 1.0.0
**Status**: Phase 5 - Skills and Agents References
**Next Step**: Phase 6 - Implement specialized skills and agents using identified references
