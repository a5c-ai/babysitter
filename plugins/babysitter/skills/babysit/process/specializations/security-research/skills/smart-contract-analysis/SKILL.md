---
name: Smart Contract Analysis Skill
description: Ethereum and blockchain smart contract security analysis
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Smart Contract Analysis Skill

## Overview

This skill provides Ethereum and blockchain smart contract security analysis capabilities.

## Capabilities

- Execute Slither static analysis
- Run Mythril symbolic execution
- Analyze Solidity code patterns
- Detect reentrancy vulnerabilities
- Check for integer overflow
- Generate Echidna fuzz tests
- Support multiple EVM chains
- Create formal verification specs

## Target Processes

- smart-contract-auditing.js
- security-tool-development.js

## Dependencies

- Slither
- Mythril
- Echidna
- Solidity compiler (solc)
- Python 3.x
- Node.js (for Hardhat/Foundry)

## Usage Context

This skill is essential for:
- Smart contract security audits
- DeFi vulnerability research
- Automated vulnerability detection
- Fuzz testing smart contracts
- Formal verification support

## Integration Notes

- Supports Solidity and Vyper
- Can analyze multiple EVM-compatible chains
- Integrates with Hardhat and Foundry
- Supports custom detector development
- Can generate audit reports
