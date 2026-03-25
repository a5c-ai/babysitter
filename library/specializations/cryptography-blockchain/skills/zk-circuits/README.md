# ZK Circuit Development Skill

Zero-knowledge circuit development using Circom and Noir for privacy-preserving blockchain applications.

## Overview

This skill provides comprehensive capabilities for developing ZK circuits using Circom and Noir, enabling privacy-preserving applications and zkRollups.

## Key Capabilities

- **Circuit Design**: Write efficient ZK circuits
- **Proof Systems**: Generate Groth16 and PLONK proofs
- **ZK Primitives**: Use Poseidon, MiMC, Pedersen hashes
- **Merkle Trees**: Implement membership proofs

## Quick Start

### Circom

```bash
# Install
npm install -g snarkjs
# Compile circuit
circom circuit.circom --r1cs --wasm
```

### Noir

```bash
# Install
curl -L https://raw.githubusercontent.com/noir-lang/noirup/main/install | bash
noirup
# Create and build
nargo new my_circuit && cd my_circuit && nargo compile
```

## Example Circuit

```circom
pragma circom 2.1.6;
include "circomlib/circuits/poseidon.circom";

template HashPreimage() {
    signal input preimage;
    signal input hash;

    component hasher = Poseidon(1);
    hasher.inputs[0] <== preimage;
    hash === hasher.out;
}

component main {public [hash]} = HashPreimage();
```

## Related Resources

- [SKILL.md](./SKILL.md) - Full skill specification
- [Circom Docs](https://docs.circom.io/)
- [Noir Docs](https://noir-lang.org/docs/)

## Process Integration

- `zk-circuit-development.js`
- `zk-snark-application.js`
- `zk-rollup-development.js`
