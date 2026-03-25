/**
 * @process computer-science/distributed-consensus-protocol-design
 * @description Design and verify distributed consensus protocols with safety and liveness proofs
 * @inputs { systemModelDescription: string, safetyRequirements: array, livenessRequirements: array }
 * @outputs { success: boolean, protocolSpecification: object, formalSpecification: object, proofs: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    systemModelDescription,
    safetyRequirements = [],
    livenessRequirements = [],
    faultModel = 'crash',
    outputDir = 'consensus-protocol-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Distributed Consensus Protocol Design');

  // ============================================================================
  // PHASE 1: SYSTEM MODEL DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining system model');
  const systemModel = await ctx.task(systemModelDefinitionTask, {
    systemModelDescription,
    faultModel,
    outputDir
  });

  artifacts.push(...systemModel.artifacts);

  // ============================================================================
  // PHASE 2: SAFETY AND LIVENESS SPECIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Specifying safety and liveness properties');
  const propertySpecification = await ctx.task(propertySpecificationTask, {
    systemModelDescription,
    safetyRequirements,
    livenessRequirements,
    systemModel,
    outputDir
  });

  artifacts.push(...propertySpecification.artifacts);

  // ============================================================================
  // PHASE 3: PROTOCOL MESSAGE FLOW DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 3: Designing protocol message flow');
  const messageFlowDesign = await ctx.task(messageFlowDesignTask, {
    systemModelDescription,
    systemModel,
    propertySpecification,
    outputDir
  });

  artifacts.push(...messageFlowDesign.artifacts);

  // ============================================================================
  // PHASE 4: SAFETY PROPERTY PROOFS
  // ============================================================================

  ctx.log('info', 'Phase 4: Proving safety properties');
  const safetyProofs = await ctx.task(safetyProofsTask, {
    systemModelDescription,
    systemModel,
    propertySpecification,
    messageFlowDesign,
    outputDir
  });

  artifacts.push(...safetyProofs.artifacts);

  // ============================================================================
  // PHASE 5: LIVENESS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Analyzing liveness under failure scenarios');
  const livenessAnalysis = await ctx.task(livenessAnalysisTask, {
    systemModelDescription,
    systemModel,
    propertySpecification,
    messageFlowDesign,
    outputDir
  });

  artifacts.push(...livenessAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: COMMON CASE OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Optimizing for common case performance');
  const performanceOptimization = await ctx.task(performanceOptimizationTask, {
    messageFlowDesign,
    systemModel,
    outputDir
  });

  artifacts.push(...performanceOptimization.artifacts);

  // ============================================================================
  // PHASE 7: FORMAL SPECIFICATION (TLA+)
  // ============================================================================

  ctx.log('info', 'Phase 7: Creating formal specification');
  const formalSpecification = await ctx.task(formalSpecificationTask, {
    systemModelDescription,
    systemModel,
    propertySpecification,
    messageFlowDesign,
    outputDir
  });

  artifacts.push(...formalSpecification.artifacts);

  // ============================================================================
  // PHASE 8: PROTOCOL SPECIFICATION DOCUMENT
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating protocol specification document');
  const specificationDocument = await ctx.task(protocolSpecificationTask, {
    systemModelDescription,
    systemModel,
    propertySpecification,
    messageFlowDesign,
    safetyProofs,
    livenessAnalysis,
    performanceOptimization,
    formalSpecification,
    outputDir
  });

  artifacts.push(...specificationDocument.artifacts);

  // Breakpoint: Review consensus protocol design
  await ctx.breakpoint({
    question: `Consensus protocol design complete. Safety proved: ${safetyProofs.allProved}. Liveness: ${livenessAnalysis.livenessGuaranteed}. Review specification?`,
    title: 'Distributed Consensus Protocol Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        faultModel: systemModel.faultModel,
        safetyProved: safetyProofs.allProved,
        livenessGuaranteed: livenessAnalysis.livenessGuaranteed,
        messageRounds: messageFlowDesign.messageRounds,
        optimizedLatency: performanceOptimization.commonCaseLatency
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    systemModelDescription,
    protocolSpecification: {
      systemModel: systemModel.model,
      messageFlow: messageFlowDesign.messageFlow,
      stateTransitions: messageFlowDesign.stateTransitions,
      specificationDocumentPath: specificationDocument.documentPath
    },
    formalSpecification: {
      specificationPath: formalSpecification.specificationPath,
      invariants: formalSpecification.invariants,
      temporalProperties: formalSpecification.temporalProperties
    },
    proofs: {
      safety: {
        allProved: safetyProofs.allProved,
        proofSummaries: safetyProofs.proofSummaries
      },
      liveness: {
        guaranteed: livenessAnalysis.livenessGuaranteed,
        conditions: livenessAnalysis.livenessConditions
      }
    },
    performanceAnalysis: {
      commonCaseLatency: performanceOptimization.commonCaseLatency,
      messageComplexity: performanceOptimization.messageComplexity,
      optimizations: performanceOptimization.optimizations
    },
    artifacts,
    duration,
    metadata: {
      processId: 'computer-science/distributed-consensus-protocol-design',
      timestamp: startTime,
      faultModel,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: System Model Definition
export const systemModelDefinitionTask = defineTask('system-model-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define system model',
  agent: {
    name: 'distributed-systems-architect',
    skills: ['tla-plus-model-checker', 'latex-proof-formatter', 'asymptotic-notation-calculator'],
    prompt: {
      role: 'distributed systems specialist',
      task: 'Define the system model including synchrony, failure, and communication assumptions',
      context: args,
      instructions: [
        'Define synchrony model (synchronous, asynchronous, partially synchronous)',
        'Specify failure model (crash, crash-recovery, Byzantine)',
        'Define communication model (reliable, fair-lossy, etc.)',
        'Specify number of processes (n) and fault tolerance (f)',
        'Define any timing assumptions',
        'Document network topology assumptions',
        'Consider FLP impossibility implications',
        'Generate system model specification'
      ],
      outputFormat: 'JSON with model, synchronyModel, faultModel, communicationModel, processCount, faultTolerance, timingAssumptions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['model', 'synchronyModel', 'faultModel', 'artifacts'],
      properties: {
        model: { type: 'string' },
        synchronyModel: { type: 'string', enum: ['synchronous', 'asynchronous', 'partially-synchronous'] },
        faultModel: { type: 'string', enum: ['crash', 'crash-recovery', 'byzantine', 'omission'] },
        communicationModel: { type: 'string' },
        processCount: { type: 'string' },
        faultTolerance: { type: 'string' },
        timingAssumptions: { type: 'array', items: { type: 'string' } },
        networkTopology: { type: 'string' },
        flpImplications: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'consensus', 'system-model']
}));

// Task 2: Property Specification
export const propertySpecificationTask = defineTask('property-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Specify safety and liveness properties',
  agent: {
    name: 'distributed-systems-architect',
    skills: ['tla-plus-model-checker', 'theorem-prover-interface', 'latex-proof-formatter'],
    prompt: {
      role: 'formal specification specialist',
      task: 'Specify safety and liveness properties for the consensus protocol',
      context: args,
      instructions: [
        'Define safety properties (Agreement, Validity, Integrity)',
        'Agreement: no two correct processes decide different values',
        'Validity: if a process decides v, then v was proposed',
        'Define liveness properties (Termination)',
        'Termination: every correct process eventually decides',
        'Express properties in temporal logic (LTL) if applicable',
        'Consider variant definitions for Byzantine model',
        'Generate property specification document'
      ],
      outputFormat: 'JSON with safetyProperties, livenessProperties, temporalLogicFormulas, invariants, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['safetyProperties', 'livenessProperties', 'artifacts'],
      properties: {
        safetyProperties: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              informalDescription: { type: 'string' },
              formalSpecification: { type: 'string' }
            }
          }
        },
        livenessProperties: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              informalDescription: { type: 'string' },
              formalSpecification: { type: 'string' },
              conditions: { type: 'string' }
            }
          }
        },
        temporalLogicFormulas: { type: 'object' },
        invariants: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'consensus', 'properties']
}));

// Task 3: Message Flow Design
export const messageFlowDesignTask = defineTask('message-flow-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design protocol message flow',
  agent: {
    name: 'distributed-systems-architect',
    skills: ['tla-plus-model-checker', 'asymptotic-notation-calculator', 'latex-proof-formatter'],
    prompt: {
      role: 'consensus protocol designer',
      task: 'Design the message flow and state transitions for the consensus protocol',
      context: args,
      instructions: [
        'Design message types (propose, vote, commit, etc.)',
        'Define protocol phases/rounds',
        'Specify state machine for each process',
        'Define transition rules for state changes',
        'Handle different scenarios (normal, failure, recovery)',
        'Design quorum requirements',
        'Consider leader election if needed',
        'Generate message flow specification'
      ],
      outputFormat: 'JSON with messageFlow, messageTypes, phases, stateTransitions, quorumRequirements, leaderElection, messageRounds, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['messageFlow', 'messageTypes', 'stateTransitions', 'artifacts'],
      properties: {
        messageFlow: { type: 'string' },
        messageTypes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              fields: { type: 'array', items: { type: 'string' } },
              purpose: { type: 'string' }
            }
          }
        },
        phases: { type: 'array', items: { type: 'string' } },
        stateTransitions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              fromState: { type: 'string' },
              toState: { type: 'string' },
              trigger: { type: 'string' },
              actions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        quorumRequirements: { type: 'string' },
        leaderElection: { type: 'string' },
        messageRounds: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'consensus', 'message-flow']
}));

// Task 4: Safety Proofs
export const safetyProofsTask = defineTask('safety-proofs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prove safety properties',
  agent: {
    name: 'theorem-proving-expert',
    skills: ['theorem-prover-interface', 'tla-plus-model-checker', 'latex-proof-formatter'],
    prompt: {
      role: 'distributed systems verification specialist',
      task: 'Prove that the protocol satisfies safety properties (Agreement, Validity)',
      context: args,
      instructions: [
        'Prove Agreement: no two correct processes decide differently',
        'Use quorum intersection arguments',
        'Prove Validity: decided value was proposed',
        'Handle Byzantine cases with certificate arguments',
        'Prove any additional safety properties',
        'Identify key invariants that imply safety',
        'Document complete safety proofs',
        'Generate safety proof document'
      ],
      outputFormat: 'JSON with allProved, proofSummaries, keyInvariants, quorumArguments, proofDocumentPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['allProved', 'proofSummaries', 'artifacts'],
      properties: {
        allProved: { type: 'boolean' },
        proofSummaries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              property: { type: 'string' },
              proved: { type: 'boolean' },
              proofOutline: { type: 'string' }
            }
          }
        },
        keyInvariants: { type: 'array', items: { type: 'string' } },
        quorumArguments: { type: 'string' },
        proofDocumentPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'consensus', 'safety-proofs']
}));

// Task 5: Liveness Analysis
export const livenessAnalysisTask = defineTask('liveness-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze liveness under failure scenarios',
  agent: {
    name: 'distributed-systems-architect',
    skills: ['tla-plus-model-checker', 'theorem-prover-interface', 'latex-proof-formatter'],
    prompt: {
      role: 'liveness analysis specialist',
      task: 'Analyze liveness (termination) under various failure scenarios',
      context: args,
      instructions: [
        'Analyze termination under synchrony/GST assumptions',
        'Consider FLP impossibility and circumvention',
        'Analyze behavior during asynchronous periods',
        'Prove termination after GST (for partial synchrony)',
        'Identify failure scenarios that block progress',
        'Document liveness conditions precisely',
        'Analyze expected termination time',
        'Generate liveness analysis document'
      ],
      outputFormat: 'JSON with livenessGuaranteed, livenessConditions, flpCircumvention, failureScenarios, expectedTerminationTime, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['livenessGuaranteed', 'livenessConditions', 'artifacts'],
      properties: {
        livenessGuaranteed: { type: 'boolean' },
        livenessConditions: { type: 'array', items: { type: 'string' } },
        flpCircumvention: { type: 'string' },
        synchronyRequirement: { type: 'string' },
        failureScenarios: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              terminates: { type: 'boolean' },
              analysis: { type: 'string' }
            }
          }
        },
        expectedTerminationTime: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'consensus', 'liveness']
}));

// Task 6: Performance Optimization
export const performanceOptimizationTask = defineTask('performance-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Optimize for common case performance',
  agent: {
    name: 'systems-engineer',
    skills: ['asymptotic-notation-calculator', 'cache-simulator', 'latex-proof-formatter'],
    prompt: {
      role: 'distributed systems performance specialist',
      task: 'Optimize protocol for common case (no failures) performance',
      context: args,
      instructions: [
        'Analyze common case latency (message delays)',
        'Analyze message complexity per decision',
        'Identify opportunities for batching',
        'Consider pipelining for throughput',
        'Optimize for stable leader scenarios',
        'Consider fast path optimizations',
        'Balance latency vs throughput',
        'Generate performance analysis'
      ],
      outputFormat: 'JSON with commonCaseLatency, messageComplexity, optimizations, batching, pipelining, fastPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['commonCaseLatency', 'messageComplexity', 'artifacts'],
      properties: {
        commonCaseLatency: { type: 'string' },
        messageComplexity: { type: 'string' },
        optimizations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              optimization: { type: 'string' },
              benefit: { type: 'string' },
              tradeoff: { type: 'string' }
            }
          }
        },
        batching: { type: 'string' },
        pipelining: { type: 'string' },
        fastPath: { type: 'string' },
        throughputAnalysis: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'consensus', 'performance']
}));

// Task 7: Formal Specification
export const formalSpecificationTask = defineTask('formal-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create formal specification (TLA+ or similar)',
  agent: {
    name: 'distributed-systems-architect',
    skills: ['tla-plus-model-checker', 'theorem-prover-interface', 'latex-proof-formatter'],
    prompt: {
      role: 'formal specification specialist',
      task: 'Create formal specification in TLA+ or similar language',
      context: args,
      instructions: [
        'Create TLA+ module structure',
        'Define state variables for processes',
        'Specify initial state predicate',
        'Define next-state relation for all actions',
        'Specify safety invariants in TLA+',
        'Specify liveness properties with fairness',
        'Consider type invariants',
        'Generate TLA+ specification file'
      ],
      outputFormat: 'JSON with specificationPath, moduleStructure, stateVariables, invariants, temporalProperties, fairnessConditions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['specificationPath', 'invariants', 'artifacts'],
      properties: {
        specificationPath: { type: 'string' },
        specificationLanguage: { type: 'string', enum: ['TLA+', 'Alloy', 'Promela', 'other'] },
        moduleStructure: { type: 'string' },
        stateVariables: { type: 'array', items: { type: 'string' } },
        invariants: { type: 'array', items: { type: 'string' } },
        temporalProperties: { type: 'array', items: { type: 'string' } },
        fairnessConditions: { type: 'array', items: { type: 'string' } },
        modelCheckingNotes: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'consensus', 'formal-specification']
}));

// Task 8: Protocol Specification Document
export const protocolSpecificationTask = defineTask('protocol-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate protocol specification document',
  agent: {
    name: 'distributed-systems-architect',
    skills: ['latex-proof-formatter', 'tla-plus-model-checker'],
    prompt: {
      role: 'technical documentation specialist',
      task: 'Generate comprehensive consensus protocol specification document',
      context: args,
      instructions: [
        'Create executive summary of protocol',
        'Document system model and assumptions',
        'Present safety and liveness properties',
        'Detail protocol message flow with diagrams',
        'Include safety proofs',
        'Present liveness analysis',
        'Document performance characteristics',
        'Reference formal specification',
        'Format as professional protocol specification'
      ],
      outputFormat: 'JSON with documentPath, executiveSummary, tableOfContents, keyResults, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentPath', 'executiveSummary', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        tableOfContents: { type: 'array', items: { type: 'string' } },
        keyResults: {
          type: 'object',
          properties: {
            safetyProved: { type: 'boolean' },
            livenessGuaranteed: { type: 'boolean' },
            messageComplexity: { type: 'string' },
            commonCaseLatency: { type: 'string' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'consensus', 'documentation']
}));
