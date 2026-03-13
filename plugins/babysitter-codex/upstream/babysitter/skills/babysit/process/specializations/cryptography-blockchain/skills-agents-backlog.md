# Cryptography and Blockchain Development - Skills and Agents Backlog

This document identifies specialized skills and agents (subagents) that could enhance the Cryptography/Blockchain processes beyond general-purpose capabilities. These tools would provide domain-specific expertise, automation capabilities, and integration with specialized blockchain tooling.

---

## Table of Contents

1. [Overview](#overview)
2. [Skills Backlog](#skills-backlog)
3. [Agents Backlog](#agents-backlog)
4. [Process-to-Skill/Agent Mapping](#process-to-skillagent-mapping)
5. [Shared Candidates](#shared-candidates)
6. [Implementation Priority](#implementation-priority)

---

## Overview

### Current State
All 33 implemented processes in this specialization currently use the `general-purpose` agent for task execution. While functional, this approach lacks domain-specific optimizations that specialized skills and agents could provide for cryptographic operations, smart contract development, and blockchain interactions.

### Goals
- Provide deep expertise in Solidity, smart contract security, and EVM internals
- Enable automated security analysis with real tool integration (Slither, Mythril, Echidna)
- Support zero-knowledge proof development with specialized circuit knowledge
- Integrate with blockchain networks and DeFi protocols
- Provide cryptographic primitive expertise and secure implementation guidance

---

## Skills Backlog

### SK-001: Solidity Development Skill
**Slug**: `solidity-dev`
**Category**: Smart Contract Development

**Description**: Deep expertise in Solidity language features, patterns, and best practices for secure smart contract development.

**Capabilities**:
- Write and review Solidity code with security patterns (Checks-Effects-Interactions)
- Implement gas-optimized code using assembly/Yul when appropriate
- Generate NatSpec documentation
- Implement ERC standards (ERC-20, ERC-721, ERC-1155, ERC-4626)
- Use OpenZeppelin contracts and extensions properly
- Handle Solidity 0.8+ features (custom errors, unchecked blocks)
- Implement upgradeable contracts (UUPS, Transparent Proxy)

**Process Integration**:
- smart-contract-development-lifecycle.js
- erc20-token-implementation.js
- erc721-nft-collection.js
- erc1155-multi-token.js
- erc4626-tokenized-vault.js
- gas-optimization.js
- smart-contract-upgrade.js

**Dependencies**: Foundry/Hardhat, Solidity compiler

---

### SK-002: Slither Static Analysis Skill
**Slug**: `slither-analysis`
**Category**: Security Analysis

**Description**: Expert integration with Slither static analyzer for smart contract vulnerability detection.

**Capabilities**:
- Execute Slither with all detectors and custom configurations
- Interpret Slither findings and classify severity
- Filter false positives based on context
- Generate call graphs and inheritance diagrams
- Run custom Slither detectors
- Analyze function summary and variable dependencies
- Produce human-readable security reports

**Process Integration**:
- smart-contract-security-audit.js
- smart-contract-development-lifecycle.js
- formal-verification.js

**Dependencies**: Slither CLI, Python environment

---

### SK-003: Mythril Symbolic Execution Skill
**Slug**: `mythril-symbolic`
**Category**: Security Analysis

**Description**: Symbolic execution analysis using Mythril for deep vulnerability detection.

**Capabilities**:
- Configure and run Mythril symbolic execution
- Set appropriate transaction depth and timeout
- Interpret symbolic execution traces
- Identify integer overflow/underflow paths
- Detect reentrancy via state analysis
- Find assertion failures and self-destruct conditions
- Generate proof-of-concept exploit inputs

**Process Integration**:
- smart-contract-security-audit.js
- smart-contract-fuzzing.js
- invariant-testing.js

**Dependencies**: Mythril CLI, Docker (optional)

---

### SK-004: Foundry Framework Skill
**Slug**: `foundry-framework`
**Category**: Development Framework

**Description**: Expert usage of Foundry (Forge, Cast, Anvil, Chisel) for smart contract development and testing.

**Capabilities**:
- Write Forge tests with fuzzing and invariant testing
- Generate gas reports and snapshots
- Use Anvil for local development and forking
- Execute Cast commands for chain interaction
- Configure foundry.toml for projects
- Run forge script for deployments
- Use Chisel for Solidity REPL debugging

**Process Integration**:
- smart-contract-development-lifecycle.js
- smart-contract-fuzzing.js
- invariant-testing.js
- gas-optimization.js
- All DeFi protocol processes

**Dependencies**: Foundry toolkit

---

### SK-005: Echidna Fuzzing Skill
**Slug**: `echidna-fuzzer`
**Category**: Security Testing

**Description**: Property-based testing and fuzzing using Echidna for smart contracts.

**Capabilities**:
- Write Echidna property tests
- Configure fuzzing parameters (corpus, seed, workers)
- Define and test invariants
- Analyze coverage reports
- Minimize failing test cases
- Run extended fuzzing campaigns
- Integrate with CI/CD pipelines

**Process Integration**:
- smart-contract-fuzzing.js
- invariant-testing.js
- smart-contract-security-audit.js
- amm-pool-development.js
- lending-protocol.js

**Dependencies**: Echidna CLI, Crytic compile

---

### SK-006: Certora Formal Verification Skill
**Slug**: `certora-prover`
**Category**: Formal Methods

**Description**: Formal verification using Certora Prover with CVL specification language.

**Capabilities**:
- Write CVL specifications for invariants and rules
- Define ghost variables and hooks
- Configure Certora Prover runs
- Analyze counterexamples
- Write parametric rules for comprehensive coverage
- Handle loop invariants and summaries
- Interpret verification results and timeouts

**Process Integration**:
- formal-verification.js
- smart-contract-security-audit.js
- lending-protocol.js
- amm-pool-development.js
- governance-system.js

**Dependencies**: Certora Prover CLI, API key

---

### SK-007: Circom/Noir ZK Circuit Skill
**Slug**: `zk-circuits`
**Category**: Zero-Knowledge Proofs

**Description**: Zero-knowledge circuit development using Circom and Noir languages.

**Capabilities**:
- Write Circom templates and circuits
- Implement Noir programs for ZK applications
- Optimize constraint count
- Use Poseidon hash and other ZK-friendly primitives
- Generate and verify proofs (Groth16, PLONK)
- Handle signal design and field arithmetic
- Implement Merkle tree membership proofs
- Generate witness calculators

**Process Integration**:
- zk-circuit-development.js
- zk-snark-application.js
- zk-rollup-development.js
- privacy-token-implementation.js

**Dependencies**: Circom compiler, snarkjs, Noir compiler

---

### SK-008: EVM/Bytecode Analysis Skill
**Slug**: `evm-analysis`
**Category**: Low-Level Analysis

**Description**: Deep EVM bytecode analysis and decompilation capabilities.

**Capabilities**:
- Analyze EVM bytecode and opcodes
- Calculate gas costs per operation
- Identify storage slot layouts
- Decompile bytecode to pseudo-Solidity
- Analyze proxy implementation slots (EIP-1967)
- Detect bytecode patterns (CREATE2, selfdestruct)
- Verify contract bytecode against source

**Process Integration**:
- gas-optimization.js
- smart-contract-security-audit.js
- smart-contract-upgrade.js
- formal-verification.js

**Dependencies**: evm.codes reference, decompilers

---

### SK-009: Hardhat Framework Skill
**Slug**: `hardhat-framework`
**Category**: Development Framework

**Description**: Expert usage of Hardhat for smart contract development, testing, and deployment.

**Capabilities**:
- Configure hardhat.config.js for multi-network
- Write Hardhat tests with ethers.js/viem
- Use Hardhat plugins (upgrades, gas-reporter, coverage)
- Run Hardhat network for local development
- Execute deployment scripts and tasks
- Fork mainnet for testing
- Generate TypeChain typings

**Process Integration**:
- smart-contract-development-lifecycle.js
- dapp-frontend-development.js
- All token and DeFi processes

**Dependencies**: Hardhat CLI, Node.js

---

### SK-010: The Graph/Subgraph Skill
**Slug**: `subgraph-indexing`
**Category**: Blockchain Indexing

**Description**: Subgraph development for The Graph protocol.

**Capabilities**:
- Write subgraph.yaml manifest files
- Define GraphQL schemas for entities
- Implement AssemblyScript event handlers
- Handle entity relationships and derived fields
- Test subgraphs locally with Graph Node
- Deploy to hosted and decentralized network
- Optimize indexing performance
- Handle chain reorganizations

**Process Integration**:
- subgraph-development.js
- blockchain-indexer-development.js
- dapp-frontend-development.js

**Dependencies**: Graph CLI, IPFS, Graph Node

---

### SK-011: Wallet Integration Skill (wagmi/viem)
**Slug**: `wallet-integration`
**Category**: Web3 Frontend

**Description**: Wallet connection and transaction management for dApps using wagmi and viem.

**Capabilities**:
- Configure wagmi with multiple connectors
- Implement wallet connection flows
- Handle chain switching and network errors
- Execute transactions with proper gas estimation
- Parse and display transaction errors
- Implement EIP-712 typed data signing
- Handle wallet events (account change, disconnect)
- Support hardware wallets and WalletConnect

**Process Integration**:
- dapp-frontend-development.js
- hd-wallet-implementation.js
- multi-signature-wallet.js

**Dependencies**: wagmi, viem, RainbowKit/Web3Modal

---

### SK-012: DeFi Protocol Integration Skill
**Slug**: `defi-protocols`
**Category**: DeFi

**Description**: Integration expertise for major DeFi protocols.

**Capabilities**:
- Integrate with Uniswap V2/V3 (swaps, liquidity, positions)
- Interact with Aave/Compound (supply, borrow, liquidations)
- Use Chainlink oracles (price feeds, VRF, automation)
- Integrate with Curve pools and gauges
- Work with Balancer weighted pools
- Handle flash loans (Aave, dYdX)
- Implement MEV protection (Flashbots)

**Process Integration**:
- amm-pool-development.js
- lending-protocol.js
- yield-aggregator.js
- economic-simulation.js

**Dependencies**: Protocol ABIs, RPC access

---

### SK-013: Cryptographic Primitives Skill
**Slug**: `crypto-primitives`
**Category**: Cryptography

**Description**: Implementation and usage of cryptographic primitives.

**Capabilities**:
- Implement ECDSA signature verification
- Use BLS signatures and aggregation
- Implement Schnorr signatures
- Work with Pedersen commitments
- Implement Shamir secret sharing
- Use secure hash functions (Keccak, Poseidon, MiMC)
- Handle key derivation (BIP-32, PBKDF2)
- Implement constant-time operations

**Process Integration**:
- cryptographic-protocol-implementation.js
- hd-wallet-implementation.js
- multi-signature-wallet.js
- threshold-signature-scheme.js
- zk-circuit-development.js

**Dependencies**: Cryptographic libraries (noble-curves, libsodium)

---

### SK-014: Multi-Chain/Cross-Chain Skill
**Slug**: `cross-chain`
**Category**: Interoperability

**Description**: Cross-chain bridge and multi-chain development expertise.

**Capabilities**:
- Integrate with LayerZero for omnichain messaging
- Use Chainlink CCIP for cross-chain
- Implement bridge verification logic
- Handle chain finality differences
- Work with Wormhole and Axelar
- Implement canonical token bridges
- Handle cross-chain state verification

**Process Integration**:
- cross-chain-bridge.js
- blockchain-node-setup.js
- multi-signature-wallet.js

**Dependencies**: Bridge SDKs, multi-chain RPC

---

### SK-015: Token Economics Modeling Skill
**Slug**: `tokenomics`
**Category**: Economic Design

**Description**: Token economics simulation and analysis.

**Capabilities**:
- Model token supply and distribution
- Simulate staking and reward mechanisms
- Analyze liquidity mining programs
- Model governance token dynamics
- Run agent-based economic simulations
- Analyze inflation/deflation mechanisms
- Model DEX liquidity and impermanent loss
- Use cadCAD for complex simulations

**Process Integration**:
- economic-simulation.js
- staking-contract.js
- governance-system.js
- yield-aggregator.js

**Dependencies**: cadCAD, Python analytics

---

### SK-016: Blockchain Node Operations Skill
**Slug**: `node-operations`
**Category**: Infrastructure

**Description**: Blockchain node deployment and operations.

**Capabilities**:
- Deploy Ethereum execution clients (Geth, Nethermind, Besu)
- Configure consensus clients (Prysm, Lighthouse, Teku)
- Set up validator nodes with proper key management
- Monitor node sync status and performance
- Configure MEV-Boost for validators
- Set up archive nodes for indexing
- Handle node upgrades and migrations

**Process Integration**:
- blockchain-node-setup.js
- validator-node-operation.js
- blockchain-indexer-development.js

**Dependencies**: Node software, systemd, Docker

---

### SK-017: OpenZeppelin Contracts Skill
**Slug**: `openzeppelin`
**Category**: Smart Contract Libraries

**Description**: Expert usage of OpenZeppelin Contracts library.

**Capabilities**:
- Use access control patterns (Ownable, AccessControl, Governor)
- Implement upgradeable contracts with plugins
- Use token implementations (ERC20, ERC721, ERC1155)
- Implement security utilities (ReentrancyGuard, Pausable)
- Use governance contracts (Governor, TimelockController)
- Implement metatransactions (ERC-2771)
- Use cryptographic utilities

**Process Integration**:
- All token processes (erc20, erc721, erc1155, erc4626)
- governance-system.js
- smart-contract-upgrade.js
- staking-contract.js

**Dependencies**: OpenZeppelin Contracts NPM package

---

### SK-018: Gas Optimization Skill
**Slug**: `gas-optimization`
**Category**: Performance

**Description**: Advanced gas optimization techniques for EVM contracts.

**Capabilities**:
- Analyze and optimize storage packing
- Use calldata vs memory efficiently
- Implement unchecked arithmetic safely
- Optimize loops with caching
- Use assembly for critical paths
- Implement efficient batch operations
- Analyze gas reports and hotspots
- Compare implementation alternatives

**Process Integration**:
- gas-optimization.js
- smart-contract-development-lifecycle.js
- amm-pool-development.js
- All DeFi protocol processes

**Dependencies**: Foundry gas reports, Hardhat gas reporter

---

### SK-019: Bug Bounty/Security Disclosure Skill
**Slug**: `bug-bounty`
**Category**: Security Operations

**Description**: Bug bounty program management and security disclosure.

**Capabilities**:
- Set up Immunefi bug bounty programs
- Define scope and severity tiers
- Triage vulnerability reports
- Validate and reproduce findings
- Coordinate responsible disclosure
- Draft security advisories
- Manage bounty payments
- Conduct post-disclosure analysis

**Process Integration**:
- bug-bounty-program.js
- incident-response-exploits.js
- smart-contract-security-audit.js

**Dependencies**: Immunefi platform, GitHub Security Advisories

---

### SK-020: Chain Analysis/Forensics Skill
**Slug**: `chain-forensics`
**Category**: Security/Analytics

**Description**: On-chain analysis and transaction forensics.

**Capabilities**:
- Trace transaction flows and fund movements
- Identify contract interactions and patterns
- Analyze MEV activity and flashbots bundles
- Detect suspicious patterns (wash trading, rugpulls)
- Use block explorers programmatically
- Analyze token holder distributions
- Track bridged assets across chains
- Generate forensic reports

**Process Integration**:
- incident-response-exploits.js
- economic-simulation.js
- smart-contract-security-audit.js

**Dependencies**: Etherscan API, Dune Analytics, Nansen

---

---

## Agents Backlog

### AG-001: Senior Solidity Security Auditor Agent
**Slug**: `solidity-auditor`
**Category**: Security

**Description**: Expert smart contract security auditor with deep knowledge of common vulnerabilities and attack vectors.

**Expertise Areas**:
- SWC Registry vulnerabilities (reentrancy, overflow, access control)
- DeFi-specific attacks (flash loans, oracle manipulation, sandwich)
- MEV and frontrunning analysis
- Economic attack vector identification
- Formal verification guidance
- Code review methodology (line-by-line, control flow)

**Persona**:
- Role: Principal Smart Contract Security Auditor
- Experience: 8+ years blockchain security, 100+ audits completed
- Background: Trail of Bits, OpenZeppelin, Consensys Diligence methodology

**Process Integration**:
- smart-contract-security-audit.js (all phases)
- formal-verification.js (property identification)
- smart-contract-fuzzing.js (property definition)
- incident-response-exploits.js (attack analysis)

---

### AG-002: ZK Cryptographer Agent
**Slug**: `zk-cryptographer`
**Category**: Cryptography

**Description**: Zero-knowledge proof systems expert for circuit design and optimization.

**Expertise Areas**:
- Proof systems (Groth16, PLONK, STARKs, Halo2)
- Circuit optimization and constraint minimization
- ZK-friendly hash functions (Poseidon, Rescue, MiMC)
- Trusted setup ceremonies
- Privacy protocol design
- ZK rollup architecture

**Persona**:
- Role: Senior ZK Cryptographer
- Experience: 6+ years applied cryptography
- Background: Academic research, ZK protocol development (Zcash, Aztec, zkSync)

**Process Integration**:
- zk-circuit-development.js (all phases)
- zk-snark-application.js (all phases)
- zk-rollup-development.js (circuit design)
- privacy-token-implementation.js (protocol design)

---

### AG-003: DeFi Protocol Architect Agent
**Slug**: `defi-architect`
**Category**: DeFi

**Description**: Senior DeFi protocol architect with deep understanding of financial primitives.

**Expertise Areas**:
- AMM design (constant product, concentrated liquidity, custom curves)
- Lending protocol mechanics (interest rates, liquidations)
- Yield optimization strategies
- Tokenomics and incentive design
- Oracle design and manipulation resistance
- Flash loan defense strategies
- MEV mitigation

**Persona**:
- Role: Principal DeFi Architect
- Experience: 7+ years financial engineering, 5+ years DeFi
- Background: Uniswap, Aave, MakerDAO protocol design

**Process Integration**:
- amm-pool-development.js (all phases)
- lending-protocol.js (all phases)
- yield-aggregator.js (strategy design)
- staking-contract.js (reward mechanics)
- economic-simulation.js (model design)

---

### AG-004: Blockchain Infrastructure Engineer Agent
**Slug**: `blockchain-infra`
**Category**: Infrastructure

**Description**: Expert in blockchain node operations and infrastructure.

**Expertise Areas**:
- Ethereum clients (Geth, Nethermind, Besu, Erigon)
- Consensus clients (Prysm, Lighthouse, Teku, Lodestar)
- Validator operations and key management
- Node performance optimization
- Archive node management
- Multi-chain infrastructure
- RPC endpoint optimization

**Persona**:
- Role: Senior Blockchain Infrastructure Engineer
- Experience: 6+ years blockchain infrastructure
- Background: Ethereum Foundation, node operators, staking services

**Process Integration**:
- blockchain-node-setup.js (all phases)
- validator-node-operation.js (all phases)
- blockchain-indexer-development.js (node integration)
- cross-chain-bridge.js (relayer infrastructure)

---

### AG-005: Formal Methods Engineer Agent
**Slug**: `formal-methods`
**Category**: Verification

**Description**: Formal verification specialist for smart contract correctness.

**Expertise Areas**:
- CVL specification writing (Certora)
- K Framework semantics
- SMT solvers and theorem provers
- Property identification and formalization
- Counterexample analysis
- Loop invariant design
- Abstraction and summarization

**Persona**:
- Role: Formal Verification Engineer
- Experience: 6+ years formal methods
- Background: Academic formal methods, Certora/Runtime Verification

**Process Integration**:
- formal-verification.js (all phases)
- smart-contract-security-audit.js (verification phase)
- smart-contract-development-lifecycle.js (property testing)

---

### AG-006: Web3 Frontend Expert Agent
**Slug**: `web3-frontend`
**Category**: Frontend

**Description**: Expert in building Web3 dApp frontends with excellent UX.

**Expertise Areas**:
- wagmi/viem integration patterns
- Wallet connection flows and error handling
- Transaction state management
- Optimistic UI updates
- Multi-chain support
- Mobile Web3 UX
- Gas estimation and management

**Persona**:
- Role: Senior Web3 Frontend Engineer
- Experience: 5+ years frontend, 3+ years Web3
- Background: Major dApp development (Uniswap, OpenSea, Blur)

**Process Integration**:
- dapp-frontend-development.js (all phases)
- subgraph-development.js (data integration)

---

### AG-007: Cryptographic Engineer Agent
**Slug**: `crypto-engineer`
**Category**: Cryptography

**Description**: Applied cryptography engineer for secure implementations.

**Expertise Areas**:
- ECDSA, BLS, Schnorr signatures
- Key derivation (BIP-32/39/44)
- Threshold cryptography (TSS, MPC)
- Secure multi-party computation
- Side-channel attack resistance
- Constant-time implementations
- Secure random number generation

**Persona**:
- Role: Senior Cryptographic Engineer
- Experience: 7+ years applied cryptography
- Background: Wallet security, key management systems

**Process Integration**:
- cryptographic-protocol-implementation.js (all phases)
- hd-wallet-implementation.js (all phases)
- multi-signature-wallet.js (signature schemes)
- threshold-signature-scheme.js (all phases)

---

### AG-008: Smart Contract Gas Optimizer Agent
**Slug**: `gas-optimizer`
**Category**: Performance

**Description**: Specialist in EVM gas optimization techniques.

**Expertise Areas**:
- EVM opcode costs and optimization
- Storage packing and SLOAD/SSTORE optimization
- Memory vs calldata optimization
- Assembly/Yul optimization
- Batch operation design
- Gas-efficient data structures
- Benchmark-driven optimization

**Persona**:
- Role: Smart Contract Performance Engineer
- Experience: 5+ years EVM development
- Background: High-frequency DeFi, gas-sensitive applications

**Process Integration**:
- gas-optimization.js (all phases)
- smart-contract-development-lifecycle.js (optimization phase)
- amm-pool-development.js (swap optimization)

---

### AG-009: Token Standards Expert Agent
**Slug**: `token-standards`
**Category**: Standards

**Description**: Expert in ERC token standards and implementations.

**Expertise Areas**:
- ERC-20 and extensions (permit, votes, snapshots)
- ERC-721 and metadata standards
- ERC-1155 multi-token patterns
- ERC-4626 tokenized vaults
- ERC-2981 royalties
- Account abstraction (ERC-4337)
- Token compliance patterns

**Persona**:
- Role: Token Standards Specialist
- Experience: 5+ years token development
- Background: Major token launches, NFT platforms

**Process Integration**:
- erc20-token-implementation.js (all phases)
- erc721-nft-collection.js (all phases)
- erc1155-multi-token.js (all phases)
- erc4626-tokenized-vault.js (all phases)

---

### AG-010: Incident Response Specialist Agent
**Slug**: `incident-response`
**Category**: Security Operations

**Description**: Smart contract incident response and exploit mitigation specialist.

**Expertise Areas**:
- Real-time exploit detection
- Emergency response procedures
- White-hat rescue operations
- Fund recovery strategies
- Post-mortem analysis
- Communication during incidents
- Forensic transaction analysis

**Persona**:
- Role: Blockchain Incident Commander
- Experience: 5+ years security operations
- Background: Protocol security teams, hack response

**Process Integration**:
- incident-response-exploits.js (all phases)
- bug-bounty-program.js (triage, response)
- smart-contract-security-audit.js (risk assessment)

---

### AG-011: Cross-Chain Bridge Architect Agent
**Slug**: `bridge-architect`
**Category**: Interoperability

**Description**: Expert in cross-chain bridge design and security.

**Expertise Areas**:
- Bridge security models (trust assumptions)
- Message verification schemes
- Validator/relayer design
- Canonical vs liquidity bridges
- Bridge exploit analysis
- Rate limiting and circuit breakers
- Multi-chain finality handling

**Persona**:
- Role: Cross-Chain Protocol Architect
- Experience: 5+ years cross-chain development
- Background: LayerZero, Wormhole, Axelar experience

**Process Integration**:
- cross-chain-bridge.js (all phases)
- blockchain-node-setup.js (multi-chain)
- incident-response-exploits.js (bridge incidents)

---

### AG-012: Governance Systems Expert Agent
**Slug**: `governance-expert`
**Category**: Governance

**Description**: On-chain governance design and implementation expert.

**Expertise Areas**:
- Governor contract patterns
- Voting mechanisms (token-weighted, quadratic)
- Timelock and delay patterns
- Delegation systems
- Governance attack vectors
- Off-chain voting (Snapshot)
- Proposal lifecycle management

**Persona**:
- Role: Governance Systems Architect
- Experience: 4+ years DAO governance
- Background: MakerDAO, Compound, ENS governance

**Process Integration**:
- governance-system.js (all phases)
- staking-contract.js (voting power)
- economic-simulation.js (governance modeling)

---

---

## Process-to-Skill/Agent Mapping

| Process File | Primary Skills | Primary Agents |
|-------------|---------------|----------------|
| smart-contract-development-lifecycle.js | SK-001, SK-004, SK-009, SK-017 | AG-001, AG-008 |
| smart-contract-security-audit.js | SK-002, SK-003, SK-005, SK-008 | AG-001, AG-005 |
| gas-optimization.js | SK-008, SK-018, SK-004 | AG-008 |
| smart-contract-upgrade.js | SK-001, SK-017, SK-008 | AG-001 |
| formal-verification.js | SK-006, SK-008 | AG-005, AG-001 |
| erc20-token-implementation.js | SK-001, SK-017 | AG-009 |
| erc721-nft-collection.js | SK-001, SK-017 | AG-009 |
| erc1155-multi-token.js | SK-001, SK-017 | AG-009 |
| erc4626-tokenized-vault.js | SK-001, SK-012, SK-017 | AG-009, AG-003 |
| amm-pool-development.js | SK-001, SK-012, SK-018 | AG-003, AG-008 |
| lending-protocol.js | SK-001, SK-012, SK-006 | AG-003, AG-005 |
| staking-contract.js | SK-001, SK-015, SK-017 | AG-003, AG-012 |
| yield-aggregator.js | SK-001, SK-012, SK-015 | AG-003 |
| governance-system.js | SK-001, SK-017 | AG-012 |
| cryptographic-protocol-implementation.js | SK-013 | AG-007 |
| hd-wallet-implementation.js | SK-013, SK-011 | AG-007 |
| multi-signature-wallet.js | SK-001, SK-013 | AG-007, AG-001 |
| threshold-signature-scheme.js | SK-013 | AG-007 |
| zk-circuit-development.js | SK-007, SK-013 | AG-002 |
| zk-snark-application.js | SK-007 | AG-002 |
| zk-rollup-development.js | SK-007, SK-001 | AG-002, AG-004 |
| privacy-token-implementation.js | SK-007, SK-001 | AG-002 |
| blockchain-node-setup.js | SK-016 | AG-004 |
| validator-node-operation.js | SK-016 | AG-004 |
| blockchain-indexer-development.js | SK-010, SK-016 | AG-004 |
| cross-chain-bridge.js | SK-014, SK-001 | AG-011, AG-001 |
| smart-contract-fuzzing.js | SK-005, SK-004 | AG-001 |
| invariant-testing.js | SK-005, SK-004 | AG-001, AG-005 |
| economic-simulation.js | SK-015, SK-012 | AG-003, AG-012 |
| dapp-frontend-development.js | SK-011, SK-010 | AG-006 |
| subgraph-development.js | SK-010 | AG-006 |
| bug-bounty-program.js | SK-019 | AG-010, AG-001 |
| incident-response-exploits.js | SK-019, SK-020 | AG-010, AG-001 |

---

## Shared Candidates

These skills and agents are strong candidates for extraction to a shared library as they apply across multiple specializations.

### Shared Skills

| ID | Skill | Potential Shared Specializations |
|----|-------|----------------------------------|
| SK-004 | Foundry Framework | General software testing |
| SK-009 | Hardhat Framework | Full-stack development |
| SK-011 | Wallet Integration (wagmi/viem) | Web Development |
| SK-013 | Cryptographic Primitives | Security Engineering |
| SK-016 | Blockchain Node Operations | DevOps/SRE |
| SK-019 | Bug Bounty/Security Disclosure | Security Engineering, DevOps |
| SK-020 | Chain Analysis/Forensics | Security Engineering |

### Shared Agents

| ID | Agent | Potential Shared Specializations |
|----|-------|----------------------------------|
| AG-004 | Blockchain Infrastructure | DevOps/SRE |
| AG-006 | Web3 Frontend Expert | Web Development |
| AG-007 | Cryptographic Engineer | Security Engineering |
| AG-010 | Incident Response Specialist | DevOps/SRE, Security Engineering |

---

## Implementation Priority

### Phase 1: Critical Skills (High Impact)
1. **SK-001**: Solidity Development - Foundation for all smart contract work
2. **SK-002**: Slither Static Analysis - Essential security tool
3. **SK-004**: Foundry Framework - Primary development framework
4. **SK-007**: Circom/Noir ZK Circuit - Core ZK capability

### Phase 2: Critical Agents (High Impact)
1. **AG-001**: Senior Solidity Security Auditor - Highest process coverage
2. **AG-003**: DeFi Protocol Architect - Critical for DeFi processes
3. **AG-002**: ZK Cryptographer - Essential for ZK processes

### Phase 3: Security & Testing
1. **SK-003**: Mythril Symbolic Execution
2. **SK-005**: Echidna Fuzzing
3. **SK-006**: Certora Formal Verification
4. **AG-005**: Formal Methods Engineer
5. **AG-010**: Incident Response Specialist

### Phase 4: DeFi & Tokens
1. **SK-012**: DeFi Protocol Integration
2. **SK-015**: Token Economics Modeling
3. **SK-017**: OpenZeppelin Contracts
4. **SK-018**: Gas Optimization
5. **AG-008**: Gas Optimizer
6. **AG-009**: Token Standards Expert

### Phase 5: Infrastructure & Interoperability
1. **SK-010**: The Graph/Subgraph
2. **SK-011**: Wallet Integration
3. **SK-014**: Multi-Chain/Cross-Chain
4. **SK-016**: Blockchain Node Operations
5. **AG-004**: Blockchain Infrastructure
6. **AG-006**: Web3 Frontend Expert
7. **AG-011**: Cross-Chain Bridge Architect

### Phase 6: Advanced & Specialized
1. **SK-008**: EVM/Bytecode Analysis
2. **SK-013**: Cryptographic Primitives
3. **SK-019**: Bug Bounty/Security Disclosure
4. **SK-020**: Chain Analysis/Forensics
5. **AG-007**: Cryptographic Engineer
6. **AG-012**: Governance Systems Expert

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Skills Identified | 20 |
| Agents Identified | 12 |
| Shared Skill Candidates | 7 |
| Shared Agent Candidates | 4 |
| Total Processes Covered | 33 |

---

**Created**: 2026-01-24
**Version**: 1.0.0
**Status**: Phase 4 - Skills and Agents Identified
**Next Step**: Phase 5 - Implement specialized skills and agents
