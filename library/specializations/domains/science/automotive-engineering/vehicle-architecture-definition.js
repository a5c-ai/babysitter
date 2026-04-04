/**
 * @process specializations/domains/science/automotive-engineering/vehicle-architecture-definition
 * @description Vehicle Architecture Definition - Define overall vehicle architecture including platform selection,
 * packaging constraints, subsystem allocation, and interface specifications. Establish system boundaries and
 * integration requirements across mechanical, electrical, and software domains.
 * @inputs { vehicleProgram: string, vehicleClass: string, targetMarkets?: string[], platformOptions?: string[], performanceTargets?: object }
 * @outputs { success: boolean, architectureDocument: object, requirementsAllocation: object, interfaceSpecifications: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/automotive-engineering/vehicle-architecture-definition', {
 *   vehicleProgram: 'EV-2027-Sedan',
 *   vehicleClass: 'D-Segment',
 *   targetMarkets: ['North America', 'Europe', 'China'],
 *   platformOptions: ['Dedicated EV Platform', 'Multi-Energy Platform'],
 *   performanceTargets: { range: 400, acceleration: 5.5, topSpeed: 200 }
 * });
 *
 * @references
 * - ISO 26262 Automotive Functional Safety
 * - INCOSE Systems Engineering Handbook
 * - SAE J3061 Cybersecurity Guidebook
 * - VDA Automotive SPICE
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    vehicleProgram,
    vehicleClass,
    targetMarkets = [],
    platformOptions = [],
    performanceTargets = {}
  } = inputs;

  // Phase 1: Vehicle Performance Requirements Definition
  const performanceRequirements = await ctx.task(performanceRequirementsTask, {
    vehicleProgram,
    vehicleClass,
    targetMarkets,
    performanceTargets
  });

  // Quality Gate: Performance requirements must be complete
  if (!performanceRequirements.requirements || performanceRequirements.requirements.length === 0) {
    return {
      success: false,
      error: 'Vehicle performance requirements not defined',
      phase: 'performance-requirements',
      architectureDocument: null
    };
  }

  // Phase 2: Platform Selection and Evaluation
  const platformEvaluation = await ctx.task(platformEvaluationTask, {
    vehicleProgram,
    vehicleClass,
    platformOptions,
    performanceRequirements: performanceRequirements.requirements,
    targetMarkets
  });

  // Breakpoint: Platform selection review
  await ctx.breakpoint({
    question: `Review platform evaluation for ${vehicleProgram}. Recommended platform: ${platformEvaluation.recommendedPlatform}. Approve platform selection?`,
    title: 'Platform Selection Review',
    context: {
      runId: ctx.runId,
      vehicleProgram,
      platformEvaluation,
      files: [{
        path: `artifacts/platform-evaluation.json`,
        format: 'json',
        content: platformEvaluation
      }]
    }
  });

  // Phase 3: System Architecture Development
  const systemArchitecture = await ctx.task(systemArchitectureTask, {
    vehicleProgram,
    selectedPlatform: platformEvaluation.recommendedPlatform,
    performanceRequirements: performanceRequirements.requirements,
    vehicleClass
  });

  // Phase 4: Packaging and Spatial Allocation
  const packagingAllocation = await ctx.task(packagingAllocationTask, {
    vehicleProgram,
    systemArchitecture,
    vehicleClass,
    targetMarkets
  });

  // Phase 5: Subsystem Requirements Allocation
  const requirementsAllocation = await ctx.task(requirementsAllocationTask, {
    vehicleProgram,
    performanceRequirements: performanceRequirements.requirements,
    systemArchitecture,
    packagingAllocation
  });

  // Phase 6: Interface Specification Development
  const interfaceSpecifications = await ctx.task(interfaceSpecificationTask, {
    vehicleProgram,
    systemArchitecture,
    requirementsAllocation
  });

  // Quality Gate: Interface specifications must be complete
  if (!interfaceSpecifications.interfaces || interfaceSpecifications.interfaces.length === 0) {
    await ctx.breakpoint({
      question: `Interface specifications incomplete for ${vehicleProgram}. Review and provide guidance.`,
      title: 'Interface Specification Warning',
      context: {
        runId: ctx.runId,
        interfaceSpecifications,
        recommendation: 'Define critical interfaces before proceeding'
      }
    });
  }

  // Phase 7: Architecture Trade-off Analysis
  const tradeoffAnalysis = await ctx.task(tradeoffAnalysisTask, {
    vehicleProgram,
    systemArchitecture,
    performanceRequirements: performanceRequirements.requirements,
    packagingAllocation,
    targetMarkets
  });

  // Phase 8: Architecture Document Generation
  const architectureDocument = await ctx.task(architectureDocumentTask, {
    vehicleProgram,
    vehicleClass,
    targetMarkets,
    performanceRequirements,
    platformEvaluation,
    systemArchitecture,
    packagingAllocation,
    requirementsAllocation,
    interfaceSpecifications,
    tradeoffAnalysis
  });

  // Final Breakpoint: Architecture approval
  await ctx.breakpoint({
    question: `Vehicle Architecture Definition complete for ${vehicleProgram}. Approve architecture to proceed to detailed design?`,
    title: 'Vehicle Architecture Approval',
    context: {
      runId: ctx.runId,
      vehicleProgram,
      architectureSummary: architectureDocument.summary,
      files: [
        { path: `artifacts/vehicle-architecture-document.json`, format: 'json', content: architectureDocument },
        { path: `artifacts/vehicle-architecture-document.md`, format: 'markdown', content: architectureDocument.markdown }
      ]
    }
  });

  return {
    success: true,
    vehicleProgram,
    vehicleClass,
    architectureDocument: architectureDocument.document,
    requirementsAllocation: requirementsAllocation.allocations,
    interfaceSpecifications: interfaceSpecifications.interfaces,
    platformSelection: platformEvaluation.recommendedPlatform,
    tradeoffAnalysis: tradeoffAnalysis.decisions,
    packagingConstraints: packagingAllocation.constraints,
    nextSteps: architectureDocument.nextSteps,
    metadata: {
      processId: 'specializations/domains/science/automotive-engineering/vehicle-architecture-definition',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const performanceRequirementsTask = defineTask('performance-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Vehicle Performance Requirements - ${args.vehicleProgram}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Vehicle Systems Engineer with expertise in automotive performance requirements',
      task: 'Define comprehensive vehicle performance requirements and targets',
      context: {
        vehicleProgram: args.vehicleProgram,
        vehicleClass: args.vehicleClass,
        targetMarkets: args.targetMarkets,
        performanceTargets: args.performanceTargets
      },
      instructions: [
        '1. Define vehicle performance targets (acceleration, top speed, range, efficiency)',
        '2. Establish comfort and NVH requirements',
        '3. Define safety performance requirements (crash ratings, active safety)',
        '4. Specify regulatory compliance requirements by market',
        '5. Define quality and reliability targets',
        '6. Establish weight and mass distribution targets',
        '7. Define aerodynamic requirements (Cd, frontal area)',
        '8. Specify thermal management requirements',
        '9. Define electrical architecture requirements (voltage, power)',
        '10. Document customer-facing attribute targets'
      ],
      outputFormat: 'JSON object with comprehensive vehicle performance requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['requirements', 'regulatoryCompliance', 'performanceTargets'],
      properties: {
        requirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              requirement: { type: 'string' },
              target: { type: 'string' },
              priority: { type: 'string', enum: ['mandatory', 'target', 'stretch'] },
              verification: { type: 'string' }
            }
          }
        },
        performanceTargets: {
          type: 'object',
          properties: {
            acceleration: { type: 'object' },
            topSpeed: { type: 'object' },
            range: { type: 'object' },
            efficiency: { type: 'object' },
            weight: { type: 'object' }
          }
        },
        regulatoryCompliance: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              market: { type: 'string' },
              regulations: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        safetyRequirements: { type: 'object' },
        comfortRequirements: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'vehicle-systems', 'requirements', 'architecture']
}));

export const platformEvaluationTask = defineTask('platform-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Platform Selection and Evaluation - ${args.vehicleProgram}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Platform Engineering Lead with expertise in vehicle platform strategy',
      task: 'Evaluate platform options and recommend optimal platform selection',
      context: {
        vehicleProgram: args.vehicleProgram,
        vehicleClass: args.vehicleClass,
        platformOptions: args.platformOptions,
        performanceRequirements: args.performanceRequirements,
        targetMarkets: args.targetMarkets
      },
      instructions: [
        '1. Evaluate each platform option against performance requirements',
        '2. Assess platform scalability and variant flexibility',
        '3. Analyze cost implications (development, manufacturing, BOM)',
        '4. Evaluate timeline implications for each platform',
        '5. Assess platform technology roadmap alignment',
        '6. Evaluate manufacturing compatibility and investment',
        '7. Analyze supply chain implications',
        '8. Assess platform commonality and synergy opportunities',
        '9. Conduct weighted scoring across evaluation criteria',
        '10. Provide platform recommendation with justification'
      ],
      outputFormat: 'JSON object with platform evaluation and recommendation'
    },
    outputSchema: {
      type: 'object',
      required: ['platformEvaluations', 'recommendedPlatform', 'justification'],
      properties: {
        platformEvaluations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              platform: { type: 'string' },
              performanceScore: { type: 'number' },
              costScore: { type: 'number' },
              timelineScore: { type: 'number' },
              scalabilityScore: { type: 'number' },
              overallScore: { type: 'number' },
              pros: { type: 'array', items: { type: 'string' } },
              cons: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        recommendedPlatform: { type: 'string' },
        justification: { type: 'string' },
        riskAssessment: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'platform', 'evaluation', 'architecture']
}));

export const systemArchitectureTask = defineTask('system-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: System Architecture Development - ${args.vehicleProgram}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Systems Architect with expertise in vehicle architecture',
      task: 'Develop comprehensive vehicle system architecture',
      context: {
        vehicleProgram: args.vehicleProgram,
        selectedPlatform: args.selectedPlatform,
        performanceRequirements: args.performanceRequirements,
        vehicleClass: args.vehicleClass
      },
      instructions: [
        '1. Define functional architecture (system functions and interactions)',
        '2. Develop physical architecture (component allocation)',
        '3. Define electrical/electronic architecture (topology, networks)',
        '4. Specify software architecture (domains, ECUs, connectivity)',
        '5. Define powertrain architecture configuration',
        '6. Specify thermal architecture and cooling strategy',
        '7. Define body and chassis architecture',
        '8. Establish system boundaries and interfaces',
        '9. Create architecture block diagrams',
        '10. Document architecture rationale and decisions'
      ],
      outputFormat: 'JSON object with comprehensive system architecture'
    },
    outputSchema: {
      type: 'object',
      required: ['functionalArchitecture', 'physicalArchitecture', 'electricalArchitecture'],
      properties: {
        functionalArchitecture: {
          type: 'object',
          properties: {
            systemFunctions: { type: 'array', items: { type: 'object' } },
            functionalInteractions: { type: 'array', items: { type: 'object' } }
          }
        },
        physicalArchitecture: {
          type: 'object',
          properties: {
            subsystems: { type: 'array', items: { type: 'object' } },
            componentAllocation: { type: 'array', items: { type: 'object' } }
          }
        },
        electricalArchitecture: {
          type: 'object',
          properties: {
            topology: { type: 'string' },
            networks: { type: 'array', items: { type: 'object' } },
            voltageLevel: { type: 'string' },
            ecuList: { type: 'array', items: { type: 'object' } }
          }
        },
        softwareArchitecture: { type: 'object' },
        powertrainArchitecture: { type: 'object' },
        thermalArchitecture: { type: 'object' },
        architectureRationale: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'systems', 'architecture', 'design']
}));

export const packagingAllocationTask = defineTask('packaging-allocation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Packaging and Spatial Allocation - ${args.vehicleProgram}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Package Engineer with expertise in vehicle space allocation',
      task: 'Define packaging constraints and spatial allocation for vehicle subsystems',
      context: {
        vehicleProgram: args.vehicleProgram,
        systemArchitecture: args.systemArchitecture,
        vehicleClass: args.vehicleClass,
        targetMarkets: args.targetMarkets
      },
      instructions: [
        '1. Define overall vehicle dimensional targets (length, width, height)',
        '2. Allocate space for powertrain components',
        '3. Define occupant package and ergonomics requirements',
        '4. Allocate battery pack and HV component space',
        '5. Define crash structure space requirements',
        '6. Allocate thermal system components (radiators, HVAC)',
        '7. Define cargo and storage space',
        '8. Identify packaging conflicts and resolution strategies',
        '9. Document service access requirements',
        '10. Create packaging cross-sections and critical dimensions'
      ],
      outputFormat: 'JSON object with packaging allocation and constraints'
    },
    outputSchema: {
      type: 'object',
      required: ['dimensions', 'spaceAllocations', 'constraints'],
      properties: {
        dimensions: {
          type: 'object',
          properties: {
            length: { type: 'string' },
            width: { type: 'string' },
            height: { type: 'string' },
            wheelbase: { type: 'string' },
            trackWidth: { type: 'object' }
          }
        },
        spaceAllocations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              subsystem: { type: 'string' },
              location: { type: 'string' },
              volume: { type: 'string' },
              constraints: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        constraints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              constraint: { type: 'string' },
              affectedSystems: { type: 'array', items: { type: 'string' } },
              resolution: { type: 'string' }
            }
          }
        },
        occupantPackage: { type: 'object' },
        cargoSpace: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'packaging', 'space-allocation', 'design']
}));

export const requirementsAllocationTask = defineTask('requirements-allocation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Subsystem Requirements Allocation - ${args.vehicleProgram}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Requirements Engineer with expertise in automotive systems',
      task: 'Allocate vehicle-level requirements to subsystems',
      context: {
        vehicleProgram: args.vehicleProgram,
        performanceRequirements: args.performanceRequirements,
        systemArchitecture: args.systemArchitecture,
        packagingAllocation: args.packagingAllocation
      },
      instructions: [
        '1. Decompose vehicle-level requirements to subsystem level',
        '2. Allocate functional requirements to responsible subsystems',
        '3. Allocate performance requirements with derived targets',
        '4. Define interface requirements between subsystems',
        '5. Establish traceability links (requirements to subsystems)',
        '6. Identify conflicting allocations and resolution',
        '7. Document allocation rationale and assumptions',
        '8. Create requirements allocation matrix',
        '9. Define verification responsibility for each requirement',
        '10. Establish change impact traceability'
      ],
      outputFormat: 'JSON object with requirements allocation matrix'
    },
    outputSchema: {
      type: 'object',
      required: ['allocations', 'traceabilityMatrix', 'allocationRationale'],
      properties: {
        allocations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              vehicleRequirementId: { type: 'string' },
              vehicleRequirement: { type: 'string' },
              allocatedSubsystems: { type: 'array', items: { type: 'object' } },
              derivedRequirements: { type: 'array', items: { type: 'object' } },
              verificationOwner: { type: 'string' }
            }
          }
        },
        traceabilityMatrix: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              requirementId: { type: 'string' },
              subsystem: { type: 'string' },
              derivedRequirementId: { type: 'string' }
            }
          }
        },
        allocationRationale: { type: 'array', items: { type: 'string' } },
        conflicts: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'requirements', 'allocation', 'traceability']
}));

export const interfaceSpecificationTask = defineTask('interface-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Interface Specification Development - ${args.vehicleProgram}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Interface Engineer with expertise in automotive systems integration',
      task: 'Develop interface control documents for vehicle subsystems',
      context: {
        vehicleProgram: args.vehicleProgram,
        systemArchitecture: args.systemArchitecture,
        requirementsAllocation: args.requirementsAllocation
      },
      instructions: [
        '1. Identify all subsystem interfaces (mechanical, electrical, software)',
        '2. Define mechanical interface specifications (mounting, connections)',
        '3. Define electrical interface specifications (power, signals, grounding)',
        '4. Define communication interface specifications (CAN, LIN, Ethernet)',
        '5. Define thermal interface specifications (heat transfer, cooling)',
        '6. Define fluid interface specifications (coolant, refrigerant)',
        '7. Establish interface ownership and responsibility',
        '8. Define interface verification requirements',
        '9. Document interface tolerances and limits',
        '10. Create Interface Control Documents (ICDs)'
      ],
      outputFormat: 'JSON object with interface specifications'
    },
    outputSchema: {
      type: 'object',
      required: ['interfaces', 'icds', 'interfaceOwnership'],
      properties: {
        interfaces: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              interfaceId: { type: 'string' },
              type: { type: 'string', enum: ['mechanical', 'electrical', 'communication', 'thermal', 'fluid', 'software'] },
              subsystemA: { type: 'string' },
              subsystemB: { type: 'string' },
              specifications: { type: 'object' },
              owner: { type: 'string' }
            }
          }
        },
        icds: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              icdId: { type: 'string' },
              title: { type: 'string' },
              interfaces: { type: 'array', items: { type: 'string' } },
              status: { type: 'string' }
            }
          }
        },
        interfaceOwnership: { type: 'array', items: { type: 'object' } },
        verificationRequirements: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'interfaces', 'icd', 'integration']
}));

export const tradeoffAnalysisTask = defineTask('tradeoff-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Architecture Trade-off Analysis - ${args.vehicleProgram}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Systems Analyst with expertise in architectural trade-off analysis',
      task: 'Conduct architecture trade-off analysis and document decisions',
      context: {
        vehicleProgram: args.vehicleProgram,
        systemArchitecture: args.systemArchitecture,
        performanceRequirements: args.performanceRequirements,
        packagingAllocation: args.packagingAllocation,
        targetMarkets: args.targetMarkets
      },
      instructions: [
        '1. Identify key architecture trade-offs (performance vs cost vs weight)',
        '2. Analyze powertrain configuration trade-offs',
        '3. Evaluate electrical architecture alternatives',
        '4. Assess weight distribution trade-offs',
        '5. Analyze cost/performance Pareto frontier',
        '6. Evaluate manufacturing complexity trade-offs',
        '7. Document trade-off decisions and rationale',
        '8. Assess sensitivity of key decisions',
        '9. Identify critical path dependencies',
        '10. Provide recommendations for optimization opportunities'
      ],
      outputFormat: 'JSON object with trade-off analysis and decisions'
    },
    outputSchema: {
      type: 'object',
      required: ['tradeoffs', 'decisions', 'recommendations'],
      properties: {
        tradeoffs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tradeoffId: { type: 'string' },
              description: { type: 'string' },
              options: { type: 'array', items: { type: 'object' } },
              criteria: { type: 'array', items: { type: 'string' } },
              analysis: { type: 'string' }
            }
          }
        },
        decisions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              decisionId: { type: 'string' },
              tradeoffId: { type: 'string' },
              selectedOption: { type: 'string' },
              rationale: { type: 'string' },
              impact: { type: 'object' }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        sensitivityAnalysis: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'trade-off', 'analysis', 'architecture']
}));

export const architectureDocumentTask = defineTask('architecture-document', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Architecture Document Generation - ${args.vehicleProgram}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Writer with expertise in automotive architecture documentation',
      task: 'Generate comprehensive vehicle architecture document',
      context: {
        vehicleProgram: args.vehicleProgram,
        vehicleClass: args.vehicleClass,
        targetMarkets: args.targetMarkets,
        performanceRequirements: args.performanceRequirements,
        platformEvaluation: args.platformEvaluation,
        systemArchitecture: args.systemArchitecture,
        packagingAllocation: args.packagingAllocation,
        requirementsAllocation: args.requirementsAllocation,
        interfaceSpecifications: args.interfaceSpecifications,
        tradeoffAnalysis: args.tradeoffAnalysis
      },
      instructions: [
        '1. Create executive summary of vehicle architecture',
        '2. Document vehicle concept and positioning',
        '3. Compile performance requirements and targets',
        '4. Document platform selection rationale',
        '5. Present system architecture diagrams and descriptions',
        '6. Document packaging and spatial allocation',
        '7. Present requirements allocation matrix',
        '8. Compile interface specifications summary',
        '9. Document trade-off decisions and rationale',
        '10. Define next steps for detailed design phase'
      ],
      outputFormat: 'JSON object with complete architecture document'
    },
    outputSchema: {
      type: 'object',
      required: ['document', 'markdown', 'summary', 'nextSteps'],
      properties: {
        document: {
          type: 'object',
          properties: {
            executiveSummary: { type: 'string' },
            vehicleConcept: { type: 'object' },
            performanceRequirements: { type: 'object' },
            platformSelection: { type: 'object' },
            systemArchitecture: { type: 'object' },
            packaging: { type: 'object' },
            requirementsAllocation: { type: 'object' },
            interfaces: { type: 'object' },
            tradeoffDecisions: { type: 'object' }
          }
        },
        markdown: { type: 'string' },
        summary: { type: 'string' },
        nextSteps: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'documentation', 'architecture', 'deliverable']
}));
