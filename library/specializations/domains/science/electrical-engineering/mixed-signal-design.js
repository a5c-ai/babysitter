/**
 * @process specializations/domains/science/electrical-engineering/mixed-signal-design
 * @description Mixed-Signal IC Design - Guide the design of mixed-signal integrated circuits including ADCs,
 * DACs, PLLs, and data converters. Addresses interface between analog and digital domains, noise coupling,
 * and system-level integration.
 * @inputs { designName: string, converterType: string, specifications: object, constraints?: object }
 * @outputs { success: boolean, architecture: object, analogDesign: object, digitalDesign: object, integrationResults: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/electrical-engineering/mixed-signal-design', {
 *   designName: '12-bit SAR ADC',
 *   converterType: 'ADC-SAR',
 *   specifications: { resolution: 12, sampleRate: '1MSPS', ENOB: 10.5, SNR: '65dB' },
 *   constraints: { supplyVoltage: '1.8V', powerBudget: '500uW', area: '0.1mm2' }
 * });
 *
 * @references
 * - IEEE Standards for Data Converters
 * - JEDEC Specifications
 * - Cadence Virtuoso Documentation
 * - Synopsys Custom Compiler Guidelines
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    designName,
    converterType,
    specifications,
    constraints = {}
  } = inputs;

  // Phase 1: Define Mixed-Signal Architecture and Partitioning
  const architectureDefinition = await ctx.task(architectureDefinitionTask, {
    designName,
    converterType,
    specifications,
    constraints
  });

  // Quality Gate: Architecture must be defined
  if (!architectureDefinition.partitioningComplete) {
    return {
      success: false,
      error: 'Mixed-signal architecture partitioning incomplete',
      phase: 'architecture-definition',
      issues: architectureDefinition.issues
    };
  }

  // Breakpoint: Review architecture partitioning
  await ctx.breakpoint({
    question: `Review mixed-signal architecture for ${designName}. Analog-digital partitioning defined. Proceed?`,
    title: 'Architecture Review',
    context: {
      runId: ctx.runId,
      architecture: architectureDefinition.architecture,
      partitioning: architectureDefinition.partitioning,
      files: [{
        path: `artifacts/phase1-architecture.json`,
        format: 'json',
        content: architectureDefinition
      }]
    }
  });

  // Phase 2: Specify Analog and Digital Block Requirements
  const blockSpecification = await ctx.task(blockSpecificationTask, {
    designName,
    architecture: architectureDefinition.architecture,
    partitioning: architectureDefinition.partitioning,
    specifications
  });

  // Phase 3: Design Analog Front-End and Digital Backend
  const analogDesign = await ctx.task(analogFrontendDesignTask, {
    designName,
    blockSpecs: blockSpecification.analogBlocks,
    architecture: architectureDefinition.architecture,
    constraints
  });

  const digitalDesign = await ctx.task(digitalBackendDesignTask, {
    designName,
    blockSpecs: blockSpecification.digitalBlocks,
    architecture: architectureDefinition.architecture,
    constraints
  });

  // Breakpoint: Review analog and digital designs
  await ctx.breakpoint({
    question: `Review analog front-end and digital backend designs for ${designName}. Proceed with noise analysis?`,
    title: 'Block Design Review',
    context: {
      runId: ctx.runId,
      analogDesign: analogDesign.summary,
      digitalDesign: digitalDesign.summary,
      files: [
        { path: `artifacts/phase3-analog.json`, format: 'json', content: analogDesign },
        { path: `artifacts/phase3-digital.json`, format: 'json', content: digitalDesign }
      ]
    }
  });

  // Phase 4: Analyze Noise Coupling and Isolation Strategies
  const noiseAnalysis = await ctx.task(noiseAnalysisTask, {
    designName,
    analogDesign,
    digitalDesign,
    architecture: architectureDefinition.architecture
  });

  // Quality Gate: Noise coupling must be acceptable
  if (noiseAnalysis.criticalNoiseIssues && noiseAnalysis.criticalNoiseIssues.length > 0) {
    await ctx.breakpoint({
      question: `Noise analysis found ${noiseAnalysis.criticalNoiseIssues.length} critical issues. Review and approve mitigation?`,
      title: 'Noise Coupling Issues',
      context: {
        runId: ctx.runId,
        noiseIssues: noiseAnalysis.criticalNoiseIssues,
        mitigationStrategies: noiseAnalysis.mitigationStrategies
      }
    });
  }

  // Phase 5: Simulate Mixed-Signal Interactions
  const mixedSignalSimulation = await ctx.task(mixedSignalSimulationTask, {
    designName,
    analogDesign,
    digitalDesign,
    noiseAnalysis,
    specifications
  });

  // Phase 6: Verify Timing at Analog-Digital Interfaces
  const interfaceTimingVerification = await ctx.task(interfaceTimingVerificationTask, {
    designName,
    analogDesign,
    digitalDesign,
    simulationResults: mixedSignalSimulation.results
  });

  // Quality Gate: Interface timing must be verified
  if (!interfaceTimingVerification.timingVerified) {
    await ctx.breakpoint({
      question: `Interface timing verification found issues at ${interfaceTimingVerification.failingInterfaces.length} interfaces. Address timing issues?`,
      title: 'Interface Timing Issues',
      context: {
        runId: ctx.runId,
        failingInterfaces: interfaceTimingVerification.failingInterfaces,
        recommendations: interfaceTimingVerification.recommendations
      }
    });
  }

  // Phase 7: Plan Floor Placement for Noise Isolation
  const floorplanning = await ctx.task(floorplanningTask, {
    designName,
    analogDesign,
    digitalDesign,
    noiseAnalysis,
    constraints
  });

  // Phase 8: Document Integration and Test Requirements
  const integrationDocumentation = await ctx.task(integrationDocumentationTask, {
    designName,
    converterType,
    architectureDefinition,
    blockSpecification,
    analogDesign,
    digitalDesign,
    noiseAnalysis,
    mixedSignalSimulation,
    interfaceTimingVerification,
    floorplanning
  });

  // Final Breakpoint: Design Approval
  await ctx.breakpoint({
    question: `Mixed-signal design complete for ${designName}. Simulation shows ENOB=${mixedSignalSimulation.measuredENOB}. Approve for integration?`,
    title: 'Design Approval',
    context: {
      runId: ctx.runId,
      designName,
      performanceMetrics: mixedSignalSimulation.performanceMetrics,
      noiseMargins: noiseAnalysis.margins,
      files: [
        { path: `artifacts/final-design.json`, format: 'json', content: { analogDesign, digitalDesign } },
        { path: `artifacts/integration-report.md`, format: 'markdown', content: integrationDocumentation.markdown }
      ]
    }
  });

  return {
    success: true,
    designName,
    converterType,
    architecture: architectureDefinition.architecture,
    analogDesign: {
      blocks: analogDesign.blocks,
      performance: analogDesign.performance
    },
    digitalDesign: {
      blocks: digitalDesign.blocks,
      performance: digitalDesign.performance
    },
    integrationResults: {
      noiseIsolation: noiseAnalysis.isolationResults,
      interfaceTiming: interfaceTimingVerification.results,
      floorplan: floorplanning.plan
    },
    performance: mixedSignalSimulation.performanceMetrics,
    documentation: integrationDocumentation.document,
    testRequirements: integrationDocumentation.testRequirements,
    metadata: {
      processId: 'specializations/domains/science/electrical-engineering/mixed-signal-design',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const architectureDefinitionTask = defineTask('architecture-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Architecture Definition - ${args.designName}`,
  agent: {
    name: 'mixed-signal-ic-designer',
    prompt: {
      role: 'Mixed-Signal IC Architect with expertise in ADC/DAC/PLL design',
      task: 'Define mixed-signal architecture and analog-digital partitioning',
      context: {
        designName: args.designName,
        converterType: args.converterType,
        specifications: args.specifications,
        constraints: args.constraints
      },
      instructions: [
        '1. Define top-level mixed-signal architecture for the converter type',
        '2. Determine analog-digital boundary and partitioning',
        '3. Identify interface signals between domains (clocks, data, control)',
        '4. Define signal conditioning requirements (anti-aliasing, reconstruction)',
        '5. Specify clock generation and distribution strategy',
        '6. Identify critical signal paths and timing requirements',
        '7. Define supply domains and power management',
        '8. Plan calibration and trimming architecture',
        '9. Specify test and characterization interfaces',
        '10. Document architectural trade-offs and decisions'
      ],
      outputFormat: 'JSON object with complete architecture definition'
    },
    outputSchema: {
      type: 'object',
      required: ['architecture', 'partitioning', 'partitioningComplete'],
      properties: {
        partitioningComplete: { type: 'boolean' },
        architecture: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            blockDiagram: { type: 'string' },
            signalFlow: { type: 'array', items: { type: 'string' } },
            clockDomains: { type: 'array', items: { type: 'object' } }
          }
        },
        partitioning: {
          type: 'object',
          properties: {
            analogBlocks: { type: 'array', items: { type: 'string' } },
            digitalBlocks: { type: 'array', items: { type: 'string' } },
            interfaceSignals: { type: 'array', items: { type: 'object' } }
          }
        },
        supplyDomains: { type: 'array', items: { type: 'object' } },
        issues: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'mixed-signal', 'architecture', 'partitioning']
}));

export const blockSpecificationTask = defineTask('block-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Block Specification - ${args.designName}`,
  agent: {
    name: 'mixed-signal-ic-designer',
    prompt: {
      role: 'Mixed-Signal Design Engineer with expertise in block-level specification',
      task: 'Specify requirements for analog and digital blocks',
      context: {
        designName: args.designName,
        architecture: args.architecture,
        partitioning: args.partitioning,
        specifications: args.specifications
      },
      instructions: [
        '1. Derive specifications for each analog block from system requirements',
        '2. Derive specifications for each digital block',
        '3. Define interface specifications between blocks',
        '4. Allocate error budgets across blocks (noise, linearity, timing)',
        '5. Specify power budgets for each block',
        '6. Define calibration requirements per block',
        '7. Specify testability requirements for each block',
        '8. Document critical parameters and margins',
        '9. Define simulation corner requirements',
        '10. Create block specification documents'
      ],
      outputFormat: 'JSON object with block specifications'
    },
    outputSchema: {
      type: 'object',
      required: ['analogBlocks', 'digitalBlocks'],
      properties: {
        analogBlocks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              function: { type: 'string' },
              specifications: { type: 'object' },
              interfaces: { type: 'array', items: { type: 'object' } }
            }
          }
        },
        digitalBlocks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              function: { type: 'string' },
              specifications: { type: 'object' },
              interfaces: { type: 'array', items: { type: 'object' } }
            }
          }
        },
        errorBudget: { type: 'object' },
        powerBudget: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'mixed-signal', 'specification']
}));

export const analogFrontendDesignTask = defineTask('analog-frontend-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3a: Analog Front-End Design - ${args.designName}`,
  agent: {
    name: 'mixed-signal-ic-designer',
    prompt: {
      role: 'Analog IC Design Engineer with expertise in data converters',
      task: 'Design analog front-end blocks for the mixed-signal system',
      context: {
        designName: args.designName,
        blockSpecs: args.blockSpecs,
        architecture: args.architecture,
        constraints: args.constraints
      },
      instructions: [
        '1. Design sample-and-hold or track-and-hold circuits',
        '2. Design comparators with required speed and resolution',
        '3. Design reference circuits (voltage references, current references)',
        '4. Design bias generation circuits',
        '5. Design DAC elements (for SAR ADC, or output DAC)',
        '6. Design input buffers and drivers',
        '7. Optimize for noise, linearity, and matching',
        '8. Simulate analog blocks for performance',
        '9. Verify against block specifications',
        '10. Document design and simulation results'
      ],
      outputFormat: 'JSON object with analog design details'
    },
    outputSchema: {
      type: 'object',
      required: ['blocks', 'performance', 'summary'],
      properties: {
        blocks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              topology: { type: 'string' },
              components: { type: 'object' },
              simulationResults: { type: 'object' }
            }
          }
        },
        performance: {
          type: 'object',
          properties: {
            noise: { type: 'string' },
            linearity: { type: 'string' },
            bandwidth: { type: 'string' },
            power: { type: 'string' }
          }
        },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'mixed-signal', 'analog', 'design']
}));

export const digitalBackendDesignTask = defineTask('digital-backend-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3b: Digital Backend Design - ${args.designName}`,
  agent: {
    name: 'mixed-signal-ic-designer',
    prompt: {
      role: 'Digital IC Design Engineer with expertise in mixed-signal systems',
      task: 'Design digital backend blocks for the mixed-signal system',
      context: {
        designName: args.designName,
        blockSpecs: args.blockSpecs,
        architecture: args.architecture,
        constraints: args.constraints
      },
      instructions: [
        '1. Design digital control logic (SAR logic, sigma-delta modulator, etc.)',
        '2. Design digital filters (decimation, interpolation)',
        '3. Implement calibration and correction algorithms',
        '4. Design timing generation and synchronization',
        '5. Implement data formatting and interface logic',
        '6. Design built-in self-test (BIST) logic',
        '7. Optimize for power and area',
        '8. Verify digital functionality',
        '9. Analyze timing for mixed-signal interfaces',
        '10. Document design and verification results'
      ],
      outputFormat: 'JSON object with digital design details'
    },
    outputSchema: {
      type: 'object',
      required: ['blocks', 'performance', 'summary'],
      properties: {
        blocks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              function: { type: 'string' },
              rtlDescription: { type: 'string' },
              resources: { type: 'object' }
            }
          }
        },
        performance: {
          type: 'object',
          properties: {
            latency: { type: 'string' },
            throughput: { type: 'string' },
            power: { type: 'string' },
            area: { type: 'string' }
          }
        },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'mixed-signal', 'digital', 'design']
}));

export const noiseAnalysisTask = defineTask('noise-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Noise Coupling Analysis - ${args.designName}`,
  agent: {
    name: 'mixed-signal-ic-designer',
    prompt: {
      role: 'Mixed-Signal Noise Analysis Expert',
      task: 'Analyze noise coupling between analog and digital domains',
      context: {
        designName: args.designName,
        analogDesign: args.analogDesign,
        digitalDesign: args.digitalDesign,
        architecture: args.architecture
      },
      instructions: [
        '1. Identify noise coupling paths (substrate, supply, signal)',
        '2. Analyze digital switching noise impact on analog',
        '3. Calculate supply noise coupling to sensitive nodes',
        '4. Evaluate substrate coupling mechanisms',
        '5. Analyze clock jitter impact on converter performance',
        '6. Define isolation requirements between domains',
        '7. Design noise mitigation strategies',
        '8. Specify decoupling and filtering requirements',
        '9. Define guard ring and shielding requirements',
        '10. Document noise analysis and margins'
      ],
      outputFormat: 'JSON object with noise analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['isolationResults', 'margins'],
      properties: {
        noiseCouplingPaths: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              mechanism: { type: 'string' },
              severity: { type: 'string' }
            }
          }
        },
        criticalNoiseIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              impact: { type: 'string' },
              mitigation: { type: 'string' }
            }
          }
        },
        mitigationStrategies: { type: 'array', items: { type: 'object' } },
        isolationResults: { type: 'object' },
        margins: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'mixed-signal', 'noise', 'analysis']
}));

export const mixedSignalSimulationTask = defineTask('mixed-signal-simulation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Mixed-Signal Simulation - ${args.designName}`,
  agent: {
    name: 'mixed-signal-ic-designer',
    prompt: {
      role: 'Mixed-Signal Verification Engineer',
      task: 'Simulate mixed-signal interactions and verify system performance',
      context: {
        designName: args.designName,
        analogDesign: args.analogDesign,
        digitalDesign: args.digitalDesign,
        noiseAnalysis: args.noiseAnalysis,
        specifications: args.specifications
      },
      instructions: [
        '1. Set up mixed-signal co-simulation environment',
        '2. Configure analog-digital interface models',
        '3. Simulate static performance (DNL, INL, offset, gain)',
        '4. Simulate dynamic performance (SNR, SFDR, SINAD, ENOB)',
        '5. Verify performance across PVT corners',
        '6. Include noise coupling effects in simulation',
        '7. Verify calibration effectiveness',
        '8. Run Monte Carlo for yield estimation',
        '9. Analyze settling behavior and timing',
        '10. Document simulation results vs specifications'
      ],
      outputFormat: 'JSON object with simulation results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'performanceMetrics', 'measuredENOB'],
      properties: {
        results: {
          type: 'object',
          properties: {
            staticPerformance: { type: 'object' },
            dynamicPerformance: { type: 'object' },
            cornerResults: { type: 'array', items: { type: 'object' } }
          }
        },
        performanceMetrics: {
          type: 'object',
          properties: {
            ENOB: { type: 'number' },
            SNR: { type: 'string' },
            SFDR: { type: 'string' },
            THD: { type: 'string' },
            DNL: { type: 'string' },
            INL: { type: 'string' }
          }
        },
        measuredENOB: { type: 'number' },
        yieldEstimate: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'mixed-signal', 'simulation']
}));

export const interfaceTimingVerificationTask = defineTask('interface-timing-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Interface Timing Verification - ${args.designName}`,
  agent: {
    name: 'mixed-signal-ic-designer',
    prompt: {
      role: 'Mixed-Signal Timing Verification Engineer',
      task: 'Verify timing at analog-digital interfaces',
      context: {
        designName: args.designName,
        analogDesign: args.analogDesign,
        digitalDesign: args.digitalDesign,
        simulationResults: args.simulationResults
      },
      instructions: [
        '1. Identify all analog-digital interface signals',
        '2. Define timing requirements for each interface',
        '3. Verify setup and hold times at comparator outputs',
        '4. Check timing margins for DAC updates',
        '5. Verify clock-to-output timing',
        '6. Analyze metastability risks',
        '7. Verify synchronization circuits',
        '8. Check timing across PVT corners',
        '9. Identify and address timing failures',
        '10. Document timing verification results'
      ],
      outputFormat: 'JSON object with timing verification results'
    },
    outputSchema: {
      type: 'object',
      required: ['timingVerified', 'results'],
      properties: {
        timingVerified: { type: 'boolean' },
        results: {
          type: 'object',
          properties: {
            interfaces: { type: 'array', items: { type: 'object' } },
            margins: { type: 'object' }
          }
        },
        failingInterfaces: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              interface: { type: 'string' },
              issue: { type: 'string' },
              margin: { type: 'string' }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'mixed-signal', 'timing', 'verification']
}));

export const floorplanningTask = defineTask('floorplanning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Floorplanning - ${args.designName}`,
  agent: {
    name: 'mixed-signal-ic-designer',
    prompt: {
      role: 'Mixed-Signal Layout Engineer with expertise in floorplanning',
      task: 'Plan floor placement for noise isolation and performance',
      context: {
        designName: args.designName,
        analogDesign: args.analogDesign,
        digitalDesign: args.digitalDesign,
        noiseAnalysis: args.noiseAnalysis,
        constraints: args.constraints
      },
      instructions: [
        '1. Define analog and digital placement regions',
        '2. Plan guard rings and isolation structures',
        '3. Position sensitive analog circuits away from digital',
        '4. Plan separate supply domains and routing',
        '5. Define substrate contact placement strategy',
        '6. Plan clock distribution routing',
        '7. Position I/O and ESD structures',
        '8. Consider thermal effects on placement',
        '9. Plan test access points',
        '10. Document floorplan guidelines and constraints'
      ],
      outputFormat: 'JSON object with floorplan details'
    },
    outputSchema: {
      type: 'object',
      required: ['plan'],
      properties: {
        plan: {
          type: 'object',
          properties: {
            analogRegion: { type: 'object' },
            digitalRegion: { type: 'object' },
            isolationStructures: { type: 'array', items: { type: 'object' } },
            supplyRouting: { type: 'object' }
          }
        },
        guidelines: { type: 'array', items: { type: 'string' } },
        constraints: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'mixed-signal', 'floorplanning', 'layout']
}));

export const integrationDocumentationTask = defineTask('integration-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Integration Documentation - ${args.designName}`,
  agent: {
    name: 'mixed-signal-ic-designer',
    prompt: {
      role: 'Technical Documentation Specialist for Mixed-Signal ICs',
      task: 'Document integration and test requirements for the mixed-signal design',
      context: {
        designName: args.designName,
        converterType: args.converterType,
        architectureDefinition: args.architectureDefinition,
        blockSpecification: args.blockSpecification,
        analogDesign: args.analogDesign,
        digitalDesign: args.digitalDesign,
        noiseAnalysis: args.noiseAnalysis,
        mixedSignalSimulation: args.mixedSignalSimulation,
        interfaceTimingVerification: args.interfaceTimingVerification,
        floorplanning: args.floorplanning
      },
      instructions: [
        '1. Create design specification document',
        '2. Document analog and digital block designs',
        '3. Describe interface specifications and timing',
        '4. Document noise analysis and mitigation',
        '5. Include simulation results and performance data',
        '6. Create test plan for silicon characterization',
        '7. Document calibration procedures',
        '8. Create application notes for system integration',
        '9. Define production test requirements',
        '10. Generate structured JSON and markdown reports'
      ],
      outputFormat: 'JSON object with complete documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['document', 'testRequirements', 'markdown'],
      properties: {
        document: {
          type: 'object',
          properties: {
            designSpecification: { type: 'object' },
            blockDocumentation: { type: 'array', items: { type: 'object' } },
            interfaceSpecification: { type: 'object' },
            simulationSummary: { type: 'object' }
          }
        },
        testRequirements: {
          type: 'object',
          properties: {
            characterizationTests: { type: 'array', items: { type: 'object' } },
            productionTests: { type: 'array', items: { type: 'object' } },
            calibrationProcedure: { type: 'object' }
          }
        },
        markdown: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'mixed-signal', 'documentation']
}));
