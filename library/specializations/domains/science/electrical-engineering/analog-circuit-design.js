/**
 * @process specializations/domains/science/electrical-engineering/analog-circuit-design
 * @description Analog Circuit Design and Simulation - Guide the design of analog circuits including amplifiers,
 * filters, oscillators, and voltage references. Covers topology selection, component sizing, SPICE simulation,
 * and performance optimization for noise, linearity, and power efficiency.
 * @inputs { circuitName: string, circuitType: string, specifications: object, constraints?: object }
 * @outputs { success: boolean, schematic: object, simulationResults: object, performanceMetrics: object, documentation: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/electrical-engineering/analog-circuit-design', {
 *   circuitName: 'Low-Noise Instrumentation Amplifier',
 *   circuitType: 'amplifier',
 *   specifications: { gain: 100, bandwidth: '100kHz', inputNoise: '<10nV/rtHz', CMRR: '>100dB' },
 *   constraints: { supplyVoltage: '5V', powerBudget: '50mW', temperature: '-40C to 85C' }
 * });
 *
 * @references
 * - IEEE Signal Integrity Guidelines
 * - Analog Devices Application Notes
 * - Texas Instruments Analog Design Resources
 * - LTspice Documentation
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    circuitName,
    circuitType,
    specifications,
    constraints = {}
  } = inputs;

  // Phase 1: Define Circuit Specifications and Performance Requirements
  const specificationAnalysis = await ctx.task(specificationAnalysisTask, {
    circuitName,
    circuitType,
    specifications,
    constraints
  });

  // Quality Gate: Specifications must be complete and feasible
  if (!specificationAnalysis.feasible) {
    return {
      success: false,
      error: 'Specifications are not feasible with given constraints',
      phase: 'specification-analysis',
      recommendations: specificationAnalysis.recommendations
    };
  }

  // Breakpoint: Review specifications before proceeding
  await ctx.breakpoint({
    question: `Review circuit specifications for ${circuitName}. Are the requirements correctly captured and feasible?`,
    title: 'Specification Review',
    context: {
      runId: ctx.runId,
      circuitName,
      circuitType,
      specifications: specificationAnalysis.finalSpecifications,
      files: [{
        path: `artifacts/phase1-specifications.json`,
        format: 'json',
        content: specificationAnalysis
      }]
    }
  });

  // Phase 2: Select Appropriate Circuit Topology and Architecture
  const topologySelection = await ctx.task(topologySelectionTask, {
    circuitName,
    circuitType,
    specifications: specificationAnalysis.finalSpecifications,
    constraints
  });

  // Phase 3: Calculate Component Values and Operating Points
  const componentCalculation = await ctx.task(componentCalculationTask, {
    circuitName,
    topology: topologySelection.selectedTopology,
    specifications: specificationAnalysis.finalSpecifications,
    constraints
  });

  // Breakpoint: Review component values before simulation
  await ctx.breakpoint({
    question: `Review calculated component values for ${circuitName}. Proceed with SPICE simulation?`,
    title: 'Component Values Review',
    context: {
      runId: ctx.runId,
      topology: topologySelection.selectedTopology,
      components: componentCalculation.components,
      operatingPoints: componentCalculation.operatingPoints,
      files: [{
        path: `artifacts/phase3-components.json`,
        format: 'json',
        content: componentCalculation
      }]
    }
  });

  // Phase 4: Create Schematic and SPICE Simulation Model
  const schematicCreation = await ctx.task(schematicCreationTask, {
    circuitName,
    topology: topologySelection.selectedTopology,
    components: componentCalculation.components,
    operatingPoints: componentCalculation.operatingPoints
  });

  // Phase 5: Simulate Across Temperature, Voltage, and Process Variations
  const cornerSimulation = await ctx.task(cornerSimulationTask, {
    circuitName,
    schematic: schematicCreation.schematic,
    spiceModel: schematicCreation.spiceModel,
    specifications: specificationAnalysis.finalSpecifications,
    constraints
  });

  // Quality Gate: Check if corner simulations pass
  if (cornerSimulation.failedCorners && cornerSimulation.failedCorners.length > 0) {
    await ctx.breakpoint({
      question: `Corner simulations failed for ${cornerSimulation.failedCorners.length} conditions. Review failures and approve optimization approach?`,
      title: 'Corner Simulation Failures',
      context: {
        runId: ctx.runId,
        failedCorners: cornerSimulation.failedCorners,
        recommendations: cornerSimulation.optimizationRecommendations
      }
    });
  }

  // Phase 6: Optimize for Performance Metrics
  const performanceOptimization = await ctx.task(performanceOptimizationTask, {
    circuitName,
    schematic: schematicCreation.schematic,
    simulationResults: cornerSimulation.results,
    specifications: specificationAnalysis.finalSpecifications,
    targetMetrics: specificationAnalysis.targetMetrics
  });

  // Phase 7: Validate Design Against Specifications
  const designValidation = await ctx.task(designValidationTask, {
    circuitName,
    optimizedDesign: performanceOptimization.optimizedDesign,
    specifications: specificationAnalysis.finalSpecifications,
    simulationResults: performanceOptimization.finalSimulationResults
  });

  // Quality Gate: Design must meet all critical specifications
  if (!designValidation.allSpecsMet) {
    await ctx.breakpoint({
      question: `Design validation shows ${designValidation.failedSpecs.length} specifications not met. Accept with waivers or iterate design?`,
      title: 'Design Validation Warning',
      context: {
        runId: ctx.runId,
        metSpecs: designValidation.metSpecs,
        failedSpecs: designValidation.failedSpecs,
        recommendations: designValidation.recommendations
      }
    });
  }

  // Phase 8: Document Design Decisions and Analysis Results
  const designDocumentation = await ctx.task(designDocumentationTask, {
    circuitName,
    circuitType,
    specificationAnalysis,
    topologySelection,
    componentCalculation,
    performanceOptimization,
    designValidation,
    constraints
  });

  // Final Breakpoint: Design Approval
  await ctx.breakpoint({
    question: `Analog circuit design complete for ${circuitName}. All specifications ${designValidation.allSpecsMet ? 'MET' : 'PARTIALLY MET'}. Approve design for release?`,
    title: 'Design Approval',
    context: {
      runId: ctx.runId,
      circuitName,
      performanceMetrics: performanceOptimization.finalMetrics,
      validationSummary: designValidation.summary,
      files: [
        { path: `artifacts/final-schematic.json`, format: 'json', content: performanceOptimization.optimizedDesign },
        { path: `artifacts/design-report.md`, format: 'markdown', content: designDocumentation.markdown }
      ]
    }
  });

  return {
    success: true,
    circuitName,
    circuitType,
    schematic: performanceOptimization.optimizedDesign,
    simulationResults: {
      nominal: performanceOptimization.nominalResults,
      corners: cornerSimulation.results,
      optimized: performanceOptimization.finalSimulationResults
    },
    performanceMetrics: performanceOptimization.finalMetrics,
    validation: {
      allSpecsMet: designValidation.allSpecsMet,
      metSpecs: designValidation.metSpecs,
      failedSpecs: designValidation.failedSpecs
    },
    documentation: designDocumentation.document,
    components: componentCalculation.components,
    topology: topologySelection.selectedTopology,
    metadata: {
      processId: 'specializations/domains/science/electrical-engineering/analog-circuit-design',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const specificationAnalysisTask = defineTask('specification-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Specification Analysis - ${args.circuitName}`,
  agent: {
    name: 'analog-circuit-expert',
    prompt: {
      role: 'Senior Analog Circuit Design Engineer with expertise in specification development',
      task: 'Analyze and refine circuit specifications for analog circuit design',
      context: {
        circuitName: args.circuitName,
        circuitType: args.circuitType,
        specifications: args.specifications,
        constraints: args.constraints
      },
      instructions: [
        '1. Analyze input specifications for completeness (gain, bandwidth, noise, distortion, etc.)',
        '2. Identify missing or implicit specifications that need to be defined',
        '3. Evaluate feasibility of specifications given constraints (power, voltage, temperature)',
        '4. Define primary and secondary performance metrics',
        '5. Establish acceptable tolerance ranges for each specification',
        '6. Identify trade-offs between competing specifications',
        '7. Define test conditions and measurement methods for each specification',
        '8. Document any assumptions made about operating conditions',
        '9. Provide recommendations for specification adjustments if needed',
        '10. Create prioritized list of critical vs. desirable specifications'
      ],
      outputFormat: 'JSON object with complete specification analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['feasible', 'finalSpecifications', 'targetMetrics'],
      properties: {
        feasible: { type: 'boolean' },
        finalSpecifications: {
          type: 'object',
          properties: {
            electrical: { type: 'object' },
            environmental: { type: 'object' },
            mechanical: { type: 'object' }
          }
        },
        targetMetrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              target: { type: 'string' },
              tolerance: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'important', 'desirable'] }
            }
          }
        },
        tradeoffs: { type: 'array', items: { type: 'string' } },
        assumptions: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'analog', 'circuit-design', 'specifications']
}));

export const topologySelectionTask = defineTask('topology-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Topology Selection - ${args.circuitName}`,
  agent: {
    name: 'analog-circuit-expert',
    prompt: {
      role: 'Analog IC Design Expert with expertise in circuit topologies',
      task: 'Select optimal circuit topology and architecture for the design',
      context: {
        circuitName: args.circuitName,
        circuitType: args.circuitType,
        specifications: args.specifications,
        constraints: args.constraints
      },
      instructions: [
        '1. Identify candidate topologies for the specified circuit type',
        '2. Evaluate each topology against specifications (gain, bandwidth, noise, linearity)',
        '3. Analyze power consumption and efficiency for each topology',
        '4. Consider supply voltage and headroom requirements',
        '5. Evaluate complexity and component count',
        '6. Assess sensitivity to component variations',
        '7. Consider thermal and layout implications',
        '8. Select optimal topology with justification',
        '9. Define high-level architecture and block diagram',
        '10. Identify critical design nodes and feedback paths'
      ],
      outputFormat: 'JSON object with topology selection and analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedTopology', 'candidateTopologies', 'architecture'],
      properties: {
        candidateTopologies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              pros: { type: 'array', items: { type: 'string' } },
              cons: { type: 'array', items: { type: 'string' } },
              suitabilityScore: { type: 'number' }
            }
          }
        },
        selectedTopology: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            justification: { type: 'string' },
            blockDiagram: { type: 'string' }
          }
        },
        architecture: {
          type: 'object',
          properties: {
            stages: { type: 'array', items: { type: 'string' } },
            feedbackType: { type: 'string' },
            criticalNodes: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'analog', 'circuit-design', 'topology']
}));

export const componentCalculationTask = defineTask('component-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Component Calculation - ${args.circuitName}`,
  agent: {
    name: 'analog-circuit-expert',
    prompt: {
      role: 'Analog Circuit Design Engineer with expertise in component sizing',
      task: 'Calculate component values and operating points for the circuit',
      context: {
        circuitName: args.circuitName,
        topology: args.topology,
        specifications: args.specifications,
        constraints: args.constraints
      },
      instructions: [
        '1. Calculate DC operating points for all active devices',
        '2. Size resistors for biasing and feedback networks',
        '3. Calculate capacitor values for frequency response and filtering',
        '4. Select transistor/opamp types based on specifications',
        '5. Verify component values are within standard ranges',
        '6. Calculate power dissipation for each component',
        '7. Determine component tolerances needed for specification compliance',
        '8. Identify critical component matching requirements',
        '9. Calculate worst-case operating conditions',
        '10. Generate bill of materials with component specifications'
      ],
      outputFormat: 'JSON object with complete component calculations'
    },
    outputSchema: {
      type: 'object',
      required: ['components', 'operatingPoints', 'bom'],
      properties: {
        components: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              reference: { type: 'string' },
              type: { type: 'string' },
              value: { type: 'string' },
              tolerance: { type: 'string' },
              powerRating: { type: 'string' },
              notes: { type: 'string' }
            }
          }
        },
        operatingPoints: {
          type: 'object',
          properties: {
            dcBiasPoints: { type: 'array', items: { type: 'object' } },
            quiescentCurrent: { type: 'string' },
            powerDissipation: { type: 'string' }
          }
        },
        calculations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              parameter: { type: 'string' },
              formula: { type: 'string' },
              result: { type: 'string' }
            }
          }
        },
        bom: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              reference: { type: 'string' },
              partNumber: { type: 'string' },
              manufacturer: { type: 'string' },
              quantity: { type: 'number' }
            }
          }
        },
        matchingRequirements: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'analog', 'circuit-design', 'components']
}));

export const schematicCreationTask = defineTask('schematic-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Schematic and SPICE Model - ${args.circuitName}`,
  agent: {
    name: 'analog-circuit-expert',
    prompt: {
      role: 'Circuit Design Engineer with expertise in SPICE simulation',
      task: 'Create schematic representation and SPICE simulation model',
      context: {
        circuitName: args.circuitName,
        topology: args.topology,
        components: args.components,
        operatingPoints: args.operatingPoints
      },
      instructions: [
        '1. Create detailed schematic with all components and connections',
        '2. Define node names and signal paths',
        '3. Add power supply connections and decoupling',
        '4. Create SPICE netlist with component models',
        '5. Define simulation directives (DC, AC, transient, noise)',
        '6. Add test points and measurement nodes',
        '7. Configure stimulus sources for simulation',
        '8. Define parameter sweeps for sensitivity analysis',
        '9. Set up Monte Carlo simulation parameters',
        '10. Document schematic conventions and annotations'
      ],
      outputFormat: 'JSON object with schematic and SPICE model'
    },
    outputSchema: {
      type: 'object',
      required: ['schematic', 'spiceModel'],
      properties: {
        schematic: {
          type: 'object',
          properties: {
            nodes: { type: 'array', items: { type: 'string' } },
            connections: { type: 'array', items: { type: 'object' } },
            annotations: { type: 'array', items: { type: 'string' } }
          }
        },
        spiceModel: {
          type: 'object',
          properties: {
            netlist: { type: 'string' },
            componentModels: { type: 'array', items: { type: 'string' } },
            simulationDirectives: { type: 'array', items: { type: 'string' } }
          }
        },
        testPoints: { type: 'array', items: { type: 'string' } },
        stimulusSources: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'analog', 'circuit-design', 'spice']
}));

export const cornerSimulationTask = defineTask('corner-simulation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Corner Simulation - ${args.circuitName}`,
  agent: {
    name: 'analog-circuit-expert',
    prompt: {
      role: 'Analog Verification Engineer with expertise in PVT simulation',
      task: 'Simulate circuit across process, voltage, and temperature corners',
      context: {
        circuitName: args.circuitName,
        schematic: args.schematic,
        spiceModel: args.spiceModel,
        specifications: args.specifications,
        constraints: args.constraints
      },
      instructions: [
        '1. Define PVT corners (process: slow/typical/fast, voltage, temperature)',
        '2. Run DC operating point analysis at all corners',
        '3. Perform AC frequency response analysis',
        '4. Run transient simulations for dynamic performance',
        '5. Execute noise analysis at relevant frequencies',
        '6. Perform distortion analysis (THD, IMD)',
        '7. Analyze stability margins (gain/phase margin)',
        '8. Run Monte Carlo analysis for statistical variation',
        '9. Identify failing corners and root causes',
        '10. Provide optimization recommendations for failures'
      ],
      outputFormat: 'JSON object with comprehensive corner simulation results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'failedCorners'],
      properties: {
        corners: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              process: { type: 'string' },
              voltage: { type: 'string' },
              temperature: { type: 'string' }
            }
          }
        },
        results: {
          type: 'object',
          properties: {
            dc: { type: 'object' },
            ac: { type: 'object' },
            transient: { type: 'object' },
            noise: { type: 'object' },
            stability: { type: 'object' }
          }
        },
        failedCorners: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              corner: { type: 'string' },
              failedSpec: { type: 'string' },
              measured: { type: 'string' },
              required: { type: 'string' }
            }
          }
        },
        optimizationRecommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'analog', 'circuit-design', 'simulation', 'pvt']
}));

export const performanceOptimizationTask = defineTask('performance-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Performance Optimization - ${args.circuitName}`,
  agent: {
    name: 'analog-circuit-expert',
    prompt: {
      role: 'Analog Circuit Optimization Specialist',
      task: 'Optimize circuit design for target performance metrics',
      context: {
        circuitName: args.circuitName,
        schematic: args.schematic,
        simulationResults: args.simulationResults,
        specifications: args.specifications,
        targetMetrics: args.targetMetrics
      },
      instructions: [
        '1. Analyze simulation results against target specifications',
        '2. Identify parameters with highest sensitivity to performance',
        '3. Optimize gain and bandwidth trade-offs',
        '4. Minimize noise through component selection and sizing',
        '5. Improve linearity and reduce distortion',
        '6. Optimize power consumption while meeting specs',
        '7. Improve stability margins (gain/phase)',
        '8. Balance performance across all corners',
        '9. Verify optimized design with final simulations',
        '10. Document optimization trade-offs and decisions'
      ],
      outputFormat: 'JSON object with optimized design and results'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizedDesign', 'finalMetrics', 'finalSimulationResults'],
      properties: {
        optimizedDesign: {
          type: 'object',
          properties: {
            components: { type: 'array', items: { type: 'object' } },
            modifications: { type: 'array', items: { type: 'string' } }
          }
        },
        optimizationSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'string' },
              change: { type: 'string' },
              improvement: { type: 'string' }
            }
          }
        },
        finalMetrics: {
          type: 'object',
          properties: {
            gain: { type: 'string' },
            bandwidth: { type: 'string' },
            noise: { type: 'string' },
            distortion: { type: 'string' },
            power: { type: 'string' },
            stabilityMargin: { type: 'string' }
          }
        },
        finalSimulationResults: { type: 'object' },
        nominalResults: { type: 'object' },
        tradeoffs: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'analog', 'circuit-design', 'optimization']
}));

export const designValidationTask = defineTask('design-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Design Validation - ${args.circuitName}`,
  agent: {
    name: 'analog-circuit-expert',
    prompt: {
      role: 'Analog Design Verification Engineer',
      task: 'Validate final design against all specifications',
      context: {
        circuitName: args.circuitName,
        optimizedDesign: args.optimizedDesign,
        specifications: args.specifications,
        simulationResults: args.simulationResults
      },
      instructions: [
        '1. Compare final simulation results to each specification',
        '2. Verify all critical specifications are met with margin',
        '3. Check important and desirable specifications',
        '4. Validate performance across all operating conditions',
        '5. Verify stability under all load conditions',
        '6. Check EMI/EMC considerations',
        '7. Validate manufacturability with component tolerances',
        '8. Document any specification waivers needed',
        '9. Create compliance matrix with pass/fail status',
        '10. Provide recommendations for remaining issues'
      ],
      outputFormat: 'JSON object with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['allSpecsMet', 'metSpecs', 'failedSpecs'],
      properties: {
        allSpecsMet: { type: 'boolean' },
        metSpecs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              specification: { type: 'string' },
              required: { type: 'string' },
              achieved: { type: 'string' },
              margin: { type: 'string' }
            }
          }
        },
        failedSpecs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              specification: { type: 'string' },
              required: { type: 'string' },
              achieved: { type: 'string' },
              gap: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        complianceMatrix: { type: 'object' },
        summary: { type: 'string' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'analog', 'circuit-design', 'validation']
}));

export const designDocumentationTask = defineTask('design-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Design Documentation - ${args.circuitName}`,
  agent: {
    name: 'analog-circuit-expert',
    prompt: {
      role: 'Technical Documentation Specialist for Analog Circuits',
      task: 'Create comprehensive design documentation',
      context: {
        circuitName: args.circuitName,
        circuitType: args.circuitType,
        specificationAnalysis: args.specificationAnalysis,
        topologySelection: args.topologySelection,
        componentCalculation: args.componentCalculation,
        performanceOptimization: args.performanceOptimization,
        designValidation: args.designValidation,
        constraints: args.constraints
      },
      instructions: [
        '1. Create executive summary of the design',
        '2. Document design requirements and specifications',
        '3. Explain topology selection rationale',
        '4. Detail component calculations and selection',
        '5. Present simulation results and analysis',
        '6. Document optimization decisions and trade-offs',
        '7. Include validation results and compliance status',
        '8. Add application notes and usage guidelines',
        '9. Document known limitations and workarounds',
        '10. Generate both structured document and markdown report'
      ],
      outputFormat: 'JSON object with complete design documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['document', 'markdown'],
      properties: {
        document: {
          type: 'object',
          properties: {
            executiveSummary: { type: 'string' },
            specifications: { type: 'object' },
            topologyDescription: { type: 'string' },
            componentList: { type: 'array', items: { type: 'object' } },
            simulationSummary: { type: 'object' },
            validationResults: { type: 'object' },
            applicationNotes: { type: 'array', items: { type: 'string' } },
            limitations: { type: 'array', items: { type: 'string' } }
          }
        },
        markdown: { type: 'string' },
        designFiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              description: { type: 'string' }
            }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ee', 'analog', 'circuit-design', 'documentation']
}));
