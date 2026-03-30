---
name: zk-circuits
description: Zero-knowledge circuit development using Circom and Noir languages. Supports constraint optimization, ZK-friendly cryptographic primitives, proof generation (Groth16, PLONK), and Merkle tree implementations.
allowed-tools: Read, Grep, Write, Bash, Edit, Glob, WebFetch
---

# ZK Circuit Development Skill

Zero-knowledge circuit development using Circom and Noir for privacy-preserving applications and zkRollups.

## Capabilities

- **Circom Circuits**: Write Circom templates and components
- **Noir Programs**: Develop Noir ZK applications
- **Constraint Optimization**: Minimize circuit constraints
- **ZK Primitives**: Use Poseidon, MiMC, and Pedersen hashes
- **Proof Systems**: Generate Groth16 and PLONK proofs
- **Signal Design**: Design efficient circuit inputs/outputs
- **Merkle Trees**: Implement membership and non-membership proofs
- **Witness Generation**: Create efficient witness calculators

## Circom Development

### Installation

```bash
# Install Circom
curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh
git clone https://github.com/iden3/circom.git
cd circom
cargo build --release
cargo install --path circom

# Install snarkjs
npm install -g snarkjs

# Verify
circom --version
snarkjs --version
```

### Basic Circuit

```circom
pragma circom 2.1.6;

// Simple addition circuit
template Addition() {
    // Public inputs
    signal input a;
    signal input b;

    // Output (public by default)
    signal output c;

    // Constraint
    c <== a + b;
}

component main = Addition();
```

### Multiplier Circuit

```circom
pragma circom 2.1.6;

template Multiplier(n) {
    signal input in[n];
    signal output out;

    signal intermediate[n];

    intermediate[0] <== in[0];
    for (var i = 1; i < n; i++) {
        intermediate[i] <== intermediate[i-1] * in[i];
    }

    out <== intermediate[n-1];
}

component main {public [in]} = Multiplier(3);
```

### Hash Circuit (Poseidon)

```circom
pragma circom 2.1.6;

include "circomlib/circuits/poseidon.circom";

template HashPreimage() {
    signal input preimage;
    signal input hash;

    component hasher = Poseidon(1);
    hasher.inputs[0] <== preimage;

    // Verify hash
    hash === hasher.out;
}

component main {public [hash]} = HashPreimage();
```

### Merkle Tree Membership

```circom
pragma circom 2.1.6;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/mux1.circom";

template MerkleProof(levels) {
    signal input leaf;
    signal input root;
    signal input pathElements[levels];
    signal input pathIndices[levels];

    component hashers[levels];
    component mux[levels];

    signal levelHashes[levels + 1];
    levelHashes[0] <== leaf;

    for (var i = 0; i < levels; i++) {
        hashers[i] = Poseidon(2);
        mux[i] = Mux1();

        mux[i].c[0] <== levelHashes[i];
        mux[i].c[1] <== pathElements[i];
        mux[i].s <== pathIndices[i];

        hashers[i].inputs[0] <== mux[i].out;
        hashers[i].inputs[1] <== levelHashes[i] + pathElements[i] - mux[i].out;

        levelHashes[i + 1] <== hashers[i].out;
    }

    root === levelHashes[levels];
}

component main {public [root]} = MerkleProof(20);
```

## Circom Build Process

```bash
# Compile circuit
circom circuit.circom --r1cs --wasm --sym -o build

# Generate witness
node build/circuit_js/generate_witness.js build/circuit_js/circuit.wasm input.json witness.wtns

# Powers of Tau ceremony (one-time)
snarkjs powersoftau new bn128 14 pot14_0000.ptau
snarkjs powersoftau contribute pot14_0000.ptau pot14_0001.ptau
snarkjs powersoftau prepare phase2 pot14_0001.ptau pot14_final.ptau

# Generate proving key (Groth16)
snarkjs groth16 setup build/circuit.r1cs pot14_final.ptau circuit_0000.zkey
snarkjs zkey contribute circuit_0000.zkey circuit_final.zkey

# Export verification key
snarkjs zkey export verificationkey circuit_final.zkey verification_key.json

# Generate proof
snarkjs groth16 prove circuit_final.zkey witness.wtns proof.json public.json

# Verify proof
snarkjs groth16 verify verification_key.json public.json proof.json

# Generate Solidity verifier
snarkjs zkey export solidityverifier circuit_final.zkey Verifier.sol
```

## Noir Development

### Installation

```bash
# Install Noir (Nargo)
curl -L https://raw.githubusercontent.com/noir-lang/noirup/main/install | bash
noirup

# Verify
nargo --version
```

### Basic Noir Program

```rust
// src/main.nr
fn main(x: Field, y: pub Field) {
    assert(x != y);
}
```

### Hash Verification

```rust
use dep::std::hash::pedersen_hash;

fn main(preimage: Field, hash: pub Field) {
    let computed_hash = pedersen_hash([preimage]);
    assert(computed_hash == hash);
}
```

### Merkle Proof in Noir

```rust
use dep::std::hash::poseidon;
use dep::std::merkle::compute_merkle_root;

fn main(
    leaf: Field,
    index: Field,
    hash_path: [Field; 20],
    root: pub Field
) {
    let computed_root = compute_merkle_root(leaf, index, hash_path);
    assert(computed_root == root);
}
```

### Noir Build Process

```bash
# Create project
nargo new my_circuit
cd my_circuit

# Edit src/main.nr
# Edit Prover.toml with inputs

# Compile
nargo compile

# Generate witness
nargo execute

# Generate proof
nargo prove

# Verify proof
nargo verify
```

## Optimization Techniques

### Constraint Reduction

```circom
// BAD: Creates extra constraints
template Bad() {
    signal input a;
    signal output b;
    b <== a * a * a * a; // Multiple intermediate constraints
}

// GOOD: Single constraint
template Good() {
    signal input a;
    signal output b;
    signal a2;
    a2 <== a * a;
    b <== a2 * a2; // Fewer constraints
}
```

### Field Arithmetic

```circom
// Use field arithmetic efficiently
template FieldOps() {
    signal input a;
    signal input b;
    signal output c;

    // Addition is free (no constraint)
    signal sum;
    sum <== a + b;

    // Multiplication adds constraint
    c <== a * b;
}
```

### Lookup Tables

```circom
// Use lookup tables for range checks
template RangeCheck(n) {
    signal input in;

    component bits = Num2Bits(n);
    bits.in <== in;
    // Implicitly constrains in < 2^n
}
```

## ZK-Friendly Primitives

| Primitive | Constraints | Use Case |
|-----------|-------------|----------|
| **Poseidon** | ~300/hash | General hashing |
| **MiMC** | ~700/hash | Merkle trees |
| **Pedersen** | ~1000/hash | Commitments |
| **ECDSA** | ~10000/sig | Signatures |
| **EdDSA** | ~3000/sig | Signatures |

## Process Integration

| Process | Purpose |
|---------|---------|
| `zk-circuit-development.js` | Circuit development |
| `zk-snark-application.js` | ZK application building |
| `zk-rollup-development.js` | Rollup circuits |
| `privacy-token-implementation.js` | Privacy protocols |

## Best Practices

1. Minimize constraints for efficient proofs
2. Use ZK-friendly hash functions
3. Audit circuits for completeness
4. Test with edge cases
5. Use formal verification when possible
6. Document signal flows clearly

## See Also

- `skills/crypto-primitives/SKILL.md` - Cryptographic primitives
- `agents/zk-cryptographer/AGENT.md` - ZK expert agent
- [Circom Documentation](https://docs.circom.io/)
- [Noir Documentation](https://noir-lang.org/docs/)
