# Quantum Computing - Skills and Agents References (Phase 5)

## Overview

This document provides reference materials, resources, and cross-specialization links for implementing the skills and agents identified in the Quantum Computing skills-agents-backlog.md. It covers GitHub repositories, MCP servers, community resources, API documentation, and applicable skills from other specializations.

---

## GitHub Repositories

### Quantum Frameworks and SDKs

| Repository | Description | Relevance to Skills |
|-----------|-------------|---------------------|
| [Qiskit](https://github.com/Qiskit/qiskit) | IBM Quantum SDK | qiskit-circuit-builder |
| [Qiskit Terra](https://github.com/Qiskit/qiskit-terra) | Core quantum circuits | qiskit-circuit-builder, circuit-optimizer |
| [Qiskit Aer](https://github.com/Qiskit/qiskit-aer) | High-performance simulators | statevector-simulator, noise-modeler |
| [Qiskit Nature](https://github.com/Qiskit/qiskit-nature) | Quantum chemistry/physics | qiskit-nature-solver, openfermion-hamiltonian |
| [Qiskit Machine Learning](https://github.com/Qiskit/qiskit-machine-learning) | Quantum ML | quantum-kernel-estimator, vqc-trainer |
| [Qiskit Optimization](https://github.com/Qiskit/qiskit-optimization) | Quantum optimization | qubo-formulator |
| [Qiskit Experiments](https://github.com/Qiskit/qiskit-experiments) | Characterization | rb-benchmarker, calibration-analyzer |
| [Cirq](https://github.com/quantumlib/Cirq) | Google Quantum SDK | cirq-circuit-builder |
| [TensorFlow Quantum](https://github.com/tensorflow/quantum) | Quantum ML with TF | cirq-circuit-builder, vqc-trainer |
| [PennyLane](https://github.com/PennyLaneAI/pennylane) | Differentiable QC | pennylane-hybrid-executor |
| [PennyLane Lightning](https://github.com/PennyLaneAI/pennylane-lightning) | Fast simulators | pennylane-hybrid-executor |
| [pytket](https://github.com/CQCL/tket) | Quantinuum compiler | tket-compiler |
| [Amazon Braket SDK](https://github.com/aws/amazon-braket-sdk-python) | AWS Quantum | braket-executor |
| [Azure Quantum Python](https://github.com/microsoft/qdk-python) | Microsoft Q# | qsharp-compiler |

### Circuit Optimization

| Repository | Description | Relevance to Skills |
|-----------|-------------|---------------------|
| [PyZX](https://github.com/Quantomatic/pyzx) | ZX-calculus | pyzx-simplifier |
| [Qiskit Transpiler](https://github.com/Qiskit/qiskit-terra/tree/main/qiskit/transpiler) | Transpilation passes | circuit-optimizer, qubit-mapper |
| [BQSKit](https://github.com/BQSKit/bqskit) | Berkeley Quantum Synthesis | circuit-optimizer |
| [VOQC](https://github.com/inQWIRE/VOQC) | Verified optimizer | circuit-optimizer |

### Error Correction and Mitigation

| Repository | Description | Relevance to Skills |
|-----------|-------------|---------------------|
| [Mitiq](https://github.com/unitaryfund/mitiq) | Error mitigation | mitiq-error-mitigator |
| [Stim](https://github.com/quantumlib/Stim) | Stabilizer simulation | stim-simulator, qec-code-builder |
| [PyMatching](https://github.com/oscarhiggott/PyMatching) | MWPM decoder | pymatching-decoder |
| [Chromobius](https://github.com/quantumlib/Stim/tree/main/chromobius) | Color code decoder | qec-code-builder |
| [LDPC](https://github.com/quantumgizmos/ldpc) | Quantum LDPC codes | qec-code-builder |
| [PanQEC](https://github.com/panqec/panqec) | QEC simulation | qec-code-builder |
| [True-Q](https://trueq.readthedocs.io/) | Benchmarking (commercial) | rb-benchmarker |

### Quantum Chemistry

| Repository | Description | Relevance to Skills |
|-----------|-------------|---------------------|
| [OpenFermion](https://github.com/quantumlib/OpenFermion) | Quantum chemistry | openfermion-hamiltonian |
| [OpenFermion-PySCF](https://github.com/quantumlib/OpenFermion-PySCF) | PySCF interface | pyscf-interface |
| [OpenFermion-Psi4](https://github.com/quantumlib/OpenFermion-Psi4) | Psi4 interface | openfermion-hamiltonian |
| [PySCF](https://github.com/pyscf/pyscf) | Electronic structure | pyscf-interface |
| [Tangelo](https://github.com/goodchemistryco/Tangelo) | Quantum chemistry workflows | qiskit-nature-solver |

### Tensor Networks and Simulation

| Repository | Description | Relevance to Skills |
|-----------|-------------|---------------------|
| [TensorNetwork](https://github.com/google/TensorNetwork) | Tensor network library | tensor-network-simulator |
| [quimb](https://github.com/jcmgray/quimb) | Quantum tensor networks | tensor-network-simulator |
| [ITensor](https://github.com/ITensor/ITensors.jl) | Tensor networks (Julia) | tensor-network-simulator |
| [cuTensorNet](https://github.com/NVIDIA/cuQuantum) | GPU tensor networks | tensor-network-simulator |
| [cuStateVec](https://github.com/NVIDIA/cuQuantum) | GPU state vectors | statevector-simulator |

### Post-Quantum Cryptography

| Repository | Description | Relevance to Skills |
|-----------|-------------|---------------------|
| [liboqs](https://github.com/open-quantum-safe/liboqs) | Open Quantum Safe | pqc-evaluator |
| [PQClean](https://github.com/PQClean/PQClean) | Clean PQC implementations | pqc-evaluator |
| [oqs-provider](https://github.com/open-quantum-safe/oqs-provider) | OpenSSL PQC | pqc-evaluator |
| [pqcrypto](https://github.com/rustpq/pqcrypto) | Rust PQC | pqc-evaluator |

### QUBO and Optimization

| Repository | Description | Relevance to Skills |
|-----------|-------------|---------------------|
| [D-Wave Ocean](https://github.com/dwavesystems/dwave-ocean-sdk) | D-Wave SDK | qubo-formulator |
| [PyQUBO](https://github.com/recruit-communications/pyqubo) | QUBO formulation | qubo-formulator |
| [dimod](https://github.com/dwavesystems/dimod) | Binary quadratic models | qubo-formulator |
| [neal](https://github.com/dwavesystems/dwave-neal) | Simulated annealing | qubo-formulator |

---

## MCP Server References

### Relevant MCP Servers for Quantum Computing

| MCP Server | Description | Applicable Skills |
|------------|-------------|-------------------|
| **filesystem** | File system operations | Circuit storage, results management |
| **github** | Version control | Quantum code versioning |
| **fetch** | Web access for APIs | IBM Quantum, AWS Braket access |
| **postgres/sqlite** | Database operations | Experiment results storage |
| **memory** | Persistent context | Long quantum job tracking |

### Potential Custom MCP Servers

| Server Concept | Purpose | Skills Enabled |
|---------------|---------|----------------|
| **mcp-ibm-quantum** | IBM Quantum job management | qiskit-circuit-builder, backend-selector |
| **mcp-aws-braket** | Braket job orchestration | braket-executor |
| **mcp-azure-quantum** | Azure Quantum interface | qsharp-compiler |
| **mcp-qiskit** | Qiskit primitives access | Multiple Qiskit skills |
| **mcp-circuit-cache** | Transpiled circuit caching | circuit-optimizer |
| **mcp-calibration** | Hardware calibration data | calibration-analyzer |

---

## Community Resources

### Forums and Discussion

| Resource | URL | Topics |
|----------|-----|--------|
| Qiskit Slack | https://ibm.co/joinqiskitslack | Qiskit usage, IBM Quantum |
| Quantum Computing Stack Exchange | https://quantumcomputing.stackexchange.com/ | General QC questions |
| PennyLane Forum | https://discuss.pennylane.ai/ | PennyLane, QML |
| Cirq Community | https://github.com/quantumlib/Cirq/discussions | Cirq usage |
| Unitary Fund Discord | https://discord.unitary.fund/ | Mitiq, open source QC |
| r/QuantumComputing | https://reddit.com/r/QuantumComputing | General discussion |

### Documentation and Tutorials

| Resource | URL | Relevance |
|----------|-----|-----------|
| Qiskit Textbook | https://qiskit.org/learn | Comprehensive QC education |
| IBM Quantum Learning | https://learning.quantum.ibm.com/ | Courses and tutorials |
| PennyLane Demos | https://pennylane.ai/qml/ | QML tutorials |
| Cirq Tutorials | https://quantumai.google/cirq/tutorials | Google Cirq |
| Azure Quantum Docs | https://learn.microsoft.com/azure/quantum/ | Microsoft Q# |
| AWS Braket Examples | https://github.com/aws/amazon-braket-examples | Braket usage |
| Quirk Circuit Simulator | https://algassert.com/quirk | Visual circuit design |

### Best Practices

| Resource | Description | Applicable Areas |
|----------|-------------|------------------|
| [Qiskit Best Practices](https://qiskit.org/documentation/apidoc/transpiler.html) | Transpilation guidelines | Circuit optimization |
| [Error Mitigation Guide](https://mitiq.readthedocs.io/en/stable/guide/guide-overview.html) | Mitiq documentation | Error mitigation |
| [QEC Tutorials](https://errorcorrectionzoo.org/) | Error Correction Zoo | QEC implementation |
| [OpenQASM Spec](https://github.com/openqasm/openqasm) | Circuit language standard | Cross-platform circuits |

---

## API Documentation

### Quantum Cloud Services

| API | Documentation URL | Purpose |
|-----|-------------------|---------|
| IBM Quantum API | https://quantum-computing.ibm.com/services/resources/docs/resources/manage/account/ | IBM hardware access |
| IBM Qiskit Runtime | https://quantum-computing.ibm.com/lab/docs/iql/runtime/ | Primitives execution |
| AWS Braket API | https://docs.aws.amazon.com/braket/latest/APIReference/ | Multi-vendor access |
| Azure Quantum REST | https://learn.microsoft.com/rest/api/azurequantum/ | Azure Quantum jobs |
| Google Quantum Engine | https://quantumai.google/cirq/google/engine | Google hardware |
| IonQ API | https://docs.ionq.com/ | IonQ trapped ions |
| Rigetti QCS | https://docs.rigetti.com/qcs/ | Rigetti superconducting |

### Standards and Formats

| Standard | Documentation | Tools |
|----------|--------------|-------|
| OpenQASM 3 | https://openqasm.com/ | Qiskit, multiple frameworks |
| QIR | https://github.com/qir-alliance/qir-spec | Q#, LLVM-based compilers |
| Quil | https://pyquil-docs.rigetti.com/en/stable/compiler.html | Rigetti |
| QASM 2.0 | https://github.com/Qiskit/openqasm/tree/OpenQASM2.x | Legacy format |

---

## Applicable Skills from Other Specializations

### From Physics Specialization

| Skill | Application to Quantum Computing |
|-------|--------------------------------|
| **pyscf-quantum-chemistry** | Classical chemistry benchmarks for VQE |
| **scipy-optimization-toolkit** | Classical optimizer backends |
| **tensorflow-physics-ml** | Hybrid quantum-classical ML |
| **emcee-mcmc-sampler** | Parameter estimation |
| **pymc-bayesian-modeler** | Bayesian inference for QC results |

### From Mathematics Specialization

| Skill | Application to Quantum Computing |
|-------|--------------------------------|
| **numerical-linear-algebra-toolkit** | Matrix operations, unitary decomposition |
| **convex-optimization-solver** | VQE optimizer backends |
| **sympy-computer-algebra** | Symbolic quantum calculations |
| **sensitivity-analysis-uq** | Quantum uncertainty quantification |
| **latex-math-formatter** | Quantum algorithm documentation |
| **lean-proof-assistant** | Formal verification of quantum algorithms |

### From Computer Science Specialization

| Skill | Application to Quantum Computing |
|-------|--------------------------------|
| **algorithm-complexity-analyzer** | Quantum advantage analysis |
| **formal-verification-toolkit** | Circuit correctness verification |
| **benchmark-suite-manager** | Quantum algorithm benchmarking |
| **theorem-prover-interface** | Formal quantum proofs |
| **reduction-builder** | Complexity reductions |

### From Data Science Specialization

| Skill | Application to Quantum Computing |
|-------|--------------------------------|
| **sklearn-ml-toolkit** | Classical ML baselines for QML |
| **pytorch-deep-learning** | Hybrid quantum-classical networks |
| **hyperparameter-optimizer** | VQE/QAOA parameter tuning |
| **data-preprocessing-pipeline** | Data encoding preparation |
| **cross-validation-framework** | QML model evaluation |

### From Scientific Discovery Specialization

| Skill | Application to Quantum Computing |
|-------|--------------------------------|
| **hypothesis-generator** | Quantum algorithm hypothesis |
| **statistical-test-selector** | Quantum experiment statistics |
| **reproducibility-guardian** | Quantum research reproducibility |
| **benchmark-validator** | Quantum algorithm validation |

---

## Cross-Specialization Agent Collaboration

### Agents from Other Specializations Useful for Quantum Computing

| Agent | Source Specialization | Quantum Computing Application |
|-------|----------------------|-------------------------------|
| **numerical-analyst** | Mathematics | Numerical stability of quantum simulations |
| **optimization-expert** | Mathematics | VQE/QAOA optimization strategies |
| **statistical-consultant** | Scientific Discovery | Quantum measurement statistics |
| **ml-model-validator** | Data Science | QML model validation |
| **systems-architect** | Software Architecture | Quantum software design |
| **theorem-prover-expert** | Mathematics | Formal quantum verification |
| **computational-chemist** | Chemistry | Quantum chemistry problem setup |

### Quantum Computing Agents Useful for Other Specializations

| Agent | Target Specialization | Application |
|-------|----------------------|-------------|
| **quantum-optimization-engineer** | Operations Research | Combinatorial optimization |
| **quantum-chemist** | Chemistry | Molecular simulation |
| **quantum-finance-analyst** | Finance | Option pricing, risk analysis |
| **pqc-analyst** | Security | Post-quantum cryptography |
| **qml-engineer** | Data Science | Quantum ML applications |

---

## Implementation Recommendations

### Tool Selection Priority

1. **Multi-Platform Support**: Prioritize tools working across Qiskit, Cirq, PennyLane
2. **Simulator First**: Develop and test on simulators before hardware
3. **Error-Aware**: Include error mitigation from the start
4. **Cost-Conscious**: Track and minimize quantum resource usage

### Integration Patterns

1. **Framework Abstraction**: Create abstraction layer over multiple quantum frameworks
2. **Backend Plugins**: Implement backend-agnostic circuit execution
3. **Result Caching**: Cache transpilation and simulation results
4. **Job Queue Management**: Handle asynchronous hardware job execution

### Testing Strategies

1. **Unitary Verification**: Verify circuit unitaries against expected operations
2. **Fidelity Tracking**: Monitor state fidelity throughout computations
3. **Noise Simulation**: Test with realistic noise models before hardware
4. **Regression Testing**: Track performance across SDK versions

### Hardware Considerations

| Platform | Qubits | Native Gates | Best Use Cases |
|----------|--------|--------------|----------------|
| IBM Quantum | 100+ | CX, √X, Rz | General purpose, QML |
| IonQ | 30+ | XX, Rz | High fidelity, small circuits |
| Rigetti | 80+ | CZ, Rx, Rz | Fast compilation |
| Google | 70+ | Sycamore native | Random circuit sampling |
| D-Wave | 5000+ | Quantum annealing | Optimization, QUBO |

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-25 | Babysitter AI | Initial references document creation |
