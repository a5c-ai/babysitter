/**
 * @process specializations/domains/science/automotive-engineering/crashworthiness-development
 * @description Crashworthiness Development - Design and validate vehicle structures for occupant protection
 * in crash events including frontal, side, rear impacts, and pedestrian protection.
 * @inputs { vehicleProgram: string, vehicleClass: string, targetRatings?: string[], crashScenarios?: string[] }
 * @outputs { success: boolean, bodyStructureDesign: object, crashSimulationResults: object, physicalTestReports: object, ncapCompliance: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/automotive-engineering/crashworthiness-development', {
 *   vehicleProgram: 'EV-Sedan-2027',
 *   vehicleClass: 'D-Segment',
 *   targetRatings: ['Euro-NCAP-5star', 'IIHS-TSP+', 'C-NCAP-5star'],
 *   crashScenarios: ['frontal-full', 'frontal-offset', 'side-barrier', 'side-pole', 'pedestrian']
 * });
 *
 * @references
 * - Euro NCAP Assessment Protocol
 * - FMVSS 200 Series Crashworthiness Standards
 * - UN ECE R94/95 Frontal/Side Impact
 * - IIHS Crashworthiness Evaluation
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    vehicleProgram,
    vehicleClass,
    targetRatings = ['Euro-NCAP-5star'],
    crashScenarios = ['frontal', 'side', 'rear', 'pedestrian']
  } = inputs;

  // Phase 1: Crash Load Path Definition
  const loadPathDefinition = await ctx.task(loadPathDefinitionTask, {
    vehicleProgram,
    vehicleClass,
    crashScenarios
  });

  // Quality Gate: Load paths must be defined
  if (!loadPathDefinition.loadPaths || loadPathDefinition.loadPaths.length === 0) {
    return {
      success: false,
      error: 'Crash load paths not defined',
      phase: 'load-path-definition',
      bodyStructureDesign: null
    };
  }

  // Phase 2: Body Structure Design for Crash
  const structureDesign = await ctx.task(structureDesignTask, {
    vehicleProgram,
    loadPathDefinition,
    targetRatings
  });

  // Breakpoint: Structure design review
  await ctx.breakpoint({
    question: `Review body structure design for ${vehicleProgram}. Approve structural concept for CAE analysis?`,
    title: 'Body Structure Design Review',
    context: {
      runId: ctx.runId,
      vehicleProgram,
      structureDesign,
      files: [{
        path: `artifacts/structure-design.json`,
        format: 'json',
        content: structureDesign
      }]
    }
  });

  // Phase 3: CAE Crash Simulation
  const crashSimulation = await ctx.task(crashSimulationTask, {
    vehicleProgram,
    structureDesign,
    crashScenarios,
    targetRatings
  });

  // Phase 4: Restraint System Integration
  const restraintIntegration = await ctx.task(restraintIntegrationTask, {
    vehicleProgram,
    crashSimulation,
    structureDesign
  });

  // Phase 5: Pedestrian Protection Design
  const pedestrianProtection = await ctx.task(pedestrianProtectionTask, {
    vehicleProgram,
    structureDesign,
    targetRatings
  });

  // Quality Gate: Simulation results check
  if (crashSimulation.failedScenarios && crashSimulation.failedScenarios.length > 0) {
    await ctx.breakpoint({
      question: `CAE simulation identified ${crashSimulation.failedScenarios.length} failing scenarios. Review design modifications?`,
      title: 'Crash Simulation Failures',
      context: {
        runId: ctx.runId,
        crashSimulation,
        recommendation: 'Optimize structure before physical testing'
      }
    });
  }

  // Phase 6: Physical Crash Testing
  const physicalTesting = await ctx.task(physicalTestingTask, {
    vehicleProgram,
    crashSimulation,
    restraintIntegration,
    targetRatings
  });

  // Phase 7: Weight and Manufacturing Optimization
  const optimization = await ctx.task(optimizationTask, {
    vehicleProgram,
    structureDesign,
    crashSimulation,
    physicalTesting
  });

  // Phase 8: NCAP Compliance Documentation
  const ncapCompliance = await ctx.task(ncapComplianceTask, {
    vehicleProgram,
    crashSimulation,
    physicalTesting,
    restraintIntegration,
    pedestrianProtection,
    targetRatings
  });

  // Final Breakpoint: Crashworthiness approval
  await ctx.breakpoint({
    question: `Crashworthiness Development complete for ${vehicleProgram}. NCAP projected score: ${ncapCompliance.projectedScore}. Approve for production?`,
    title: 'Crashworthiness Approval',
    context: {
      runId: ctx.runId,
      vehicleProgram,
      ncapCompliance,
      files: [
        { path: `artifacts/crash-simulation-results.json`, format: 'json', content: crashSimulation },
        { path: `artifacts/ncap-compliance.json`, format: 'json', content: ncapCompliance }
      ]
    }
  });

  return {
    success: true,
    vehicleProgram,
    bodyStructureDesign: structureDesign.design,
    crashSimulationResults: crashSimulation.results,
    physicalTestReports: physicalTesting.reports,
    ncapCompliance: ncapCompliance.compliance,
    pedestrianProtection: pedestrianProtection.design,
    optimization: optimization.results,
    nextSteps: ncapCompliance.nextSteps,
    metadata: {
      processId: 'specializations/domains/science/automotive-engineering/crashworthiness-development',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const loadPathDefinitionTask = defineTask('load-path-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Crash Load Path Definition - ${args.vehicleProgram}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Crash Structure Engineer',
      task: 'Define crash load paths for vehicle structure',
      context: {
        vehicleProgram: args.vehicleProgram,
        vehicleClass: args.vehicleClass,
        crashScenarios: args.crashScenarios
      },
      instructions: [
        '1. Define frontal crash load paths',
        '2. Define side impact load paths',
        '3. Define rear impact load paths',
        '4. Define rollover protection load paths',
        '5. Specify energy absorption zones',
        '6. Define passenger compartment protection',
        '7. Specify load distribution structures',
        '8. Define battery protection load paths (EV)',
        '9. Document load path rationale',
        '10. Create load path diagrams'
      ],
      outputFormat: 'JSON object with load path definition'
    },
    outputSchema: {
      type: 'object',
      required: ['loadPaths', 'energyAbsorption', 'compartmentProtection'],
      properties: {
        loadPaths: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              primaryPath: { type: 'array', items: { type: 'string' } },
              secondaryPath: { type: 'array', items: { type: 'string' } },
              loadDistribution: { type: 'object' }
            }
          }
        },
        energyAbsorption: { type: 'array', items: { type: 'object' } },
        compartmentProtection: { type: 'object' },
        batteryProtection: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'crashworthiness', 'load-paths', 'structure']
}));

export const structureDesignTask = defineTask('structure-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Body Structure Design for Crash - ${args.vehicleProgram}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Body Structure Design Engineer',
      task: 'Design body structure for crashworthiness requirements',
      context: {
        vehicleProgram: args.vehicleProgram,
        loadPathDefinition: args.loadPathDefinition,
        targetRatings: args.targetRatings
      },
      instructions: [
        '1. Design front rails and crash boxes',
        '2. Design side structure (B-pillar, rocker, roof rail)',
        '3. Design floor structure and cross members',
        '4. Design rear structure and crash elements',
        '5. Select materials (steel grades, aluminum, composites)',
        '6. Design joint strategies',
        '7. Integrate battery protection structure (EV)',
        '8. Design for manufacturing and assembly',
        '9. Target weight optimization',
        '10. Document design specifications'
      ],
      outputFormat: 'JSON object with structure design'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'materials', 'specifications'],
      properties: {
        design: {
          type: 'object',
          properties: {
            frontStructure: { type: 'object' },
            sideStructure: { type: 'object' },
            floorStructure: { type: 'object' },
            rearStructure: { type: 'object' },
            batteryIntegration: { type: 'object' }
          }
        },
        materials: { type: 'array', items: { type: 'object' } },
        specifications: { type: 'object' },
        weight: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'crashworthiness', 'body-structure', 'design']
}));

export const crashSimulationTask = defineTask('crash-simulation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: CAE Crash Simulation - ${args.vehicleProgram}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CAE Crash Simulation Engineer',
      task: 'Execute CAE crash simulations',
      context: {
        vehicleProgram: args.vehicleProgram,
        structureDesign: args.structureDesign,
        crashScenarios: args.crashScenarios,
        targetRatings: args.targetRatings
      },
      instructions: [
        '1. Build full vehicle crash FE model',
        '2. Execute frontal impact simulations (full/offset/ODB/MPDB)',
        '3. Execute side impact simulations (barrier/pole)',
        '4. Execute rear impact simulation',
        '5. Analyze structural deformation',
        '6. Evaluate occupant compartment intrusion',
        '7. Assess dummy injury metrics',
        '8. Evaluate battery safety (EV)',
        '9. Identify design improvement opportunities',
        '10. Document simulation results'
      ],
      outputFormat: 'JSON object with crash simulation results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'failedScenarios', 'metrics'],
      properties: {
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              status: { type: 'string', enum: ['pass', 'marginal', 'fail'] },
              intrusion: { type: 'object' },
              injuryMetrics: { type: 'object' },
              batteryStatus: { type: 'string' }
            }
          }
        },
        failedScenarios: { type: 'array', items: { type: 'object' } },
        metrics: { type: 'object' },
        improvements: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'crashworthiness', 'CAE', 'simulation']
}));

export const restraintIntegrationTask = defineTask('restraint-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Restraint System Integration - ${args.vehicleProgram}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Restraint Systems Engineer',
      task: 'Integrate restraint systems for occupant protection',
      context: {
        vehicleProgram: args.vehicleProgram,
        crashSimulation: args.crashSimulation,
        structureDesign: args.structureDesign
      },
      instructions: [
        '1. Design seatbelt system (pretensioners, load limiters)',
        '2. Design frontal airbag system',
        '3. Design side airbag system (thorax, curtain)',
        '4. Design knee airbag system',
        '5. Tune restraint timing and thresholds',
        '6. Optimize seat design for crash',
        '7. Design child restraint accommodation',
        '8. Integrate crash sensing system',
        '9. Validate restraint performance in simulation',
        '10. Document restraint specifications'
      ],
      outputFormat: 'JSON object with restraint integration'
    },
    outputSchema: {
      type: 'object',
      required: ['restraints', 'tuning', 'validation'],
      properties: {
        restraints: {
          type: 'object',
          properties: {
            seatbelts: { type: 'object' },
            frontalAirbags: { type: 'object' },
            sideAirbags: { type: 'object' },
            kneeAirbags: { type: 'object' },
            crashSensing: { type: 'object' }
          }
        },
        tuning: { type: 'object' },
        validation: { type: 'object' },
        specifications: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'crashworthiness', 'restraints', 'airbags']
}));

export const pedestrianProtectionTask = defineTask('pedestrian-protection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Pedestrian Protection Design - ${args.vehicleProgram}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Pedestrian Protection Engineer',
      task: 'Design pedestrian protection systems',
      context: {
        vehicleProgram: args.vehicleProgram,
        structureDesign: args.structureDesign,
        targetRatings: args.targetRatings
      },
      instructions: [
        '1. Design hood deformation zones',
        '2. Design bumper energy absorption',
        '3. Design front-end styling for pedestrian safety',
        '4. Evaluate head impact zones (adult/child)',
        '5. Evaluate leg impact performance',
        '6. Design active hood system (if applicable)',
        '7. Evaluate A-pillar and cowl impact',
        '8. Execute pedestrian impact simulations',
        '9. Optimize design for Euro NCAP pedestrian score',
        '10. Document pedestrian protection design'
      ],
      outputFormat: 'JSON object with pedestrian protection'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'simulation', 'scores'],
      properties: {
        design: {
          type: 'object',
          properties: {
            hood: { type: 'object' },
            bumper: { type: 'object' },
            frontEnd: { type: 'object' },
            activeHood: { type: 'object' }
          }
        },
        simulation: {
          type: 'object',
          properties: {
            headImpact: { type: 'object' },
            legImpact: { type: 'object' }
          }
        },
        scores: {
          type: 'object',
          properties: {
            adult: { type: 'number' },
            child: { type: 'number' },
            overall: { type: 'number' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'crashworthiness', 'pedestrian', 'protection']
}));

export const physicalTestingTask = defineTask('physical-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Physical Crash Testing - ${args.vehicleProgram}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Physical Test Engineer',
      task: 'Plan and execute physical crash testing',
      context: {
        vehicleProgram: args.vehicleProgram,
        crashSimulation: args.crashSimulation,
        restraintIntegration: args.restraintIntegration,
        targetRatings: args.targetRatings
      },
      instructions: [
        '1. Plan crash test program',
        '2. Execute development crash tests',
        '3. Execute regulatory compliance tests',
        '4. Execute NCAP/IIHS rating tests',
        '5. Analyze test results vs CAE correlation',
        '6. Evaluate dummy injury measurements',
        '7. Assess structural performance',
        '8. Document test anomalies',
        '9. Identify CAE model improvements',
        '10. Generate test reports'
      ],
      outputFormat: 'JSON object with physical test results'
    },
    outputSchema: {
      type: 'object',
      required: ['reports', 'testResults', 'correlation'],
      properties: {
        reports: {
          type: 'object',
          properties: {
            developmentTests: { type: 'array', items: { type: 'object' } },
            complianceTests: { type: 'array', items: { type: 'object' } },
            ratingTests: { type: 'array', items: { type: 'object' } }
          }
        },
        testResults: { type: 'array', items: { type: 'object' } },
        correlation: {
          type: 'object',
          properties: {
            caeVsTest: { type: 'object' },
            improvements: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'crashworthiness', 'physical-testing', 'validation']
}));

export const optimizationTask = defineTask('optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Weight and Manufacturing Optimization - ${args.vehicleProgram}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Structure Optimization Engineer',
      task: 'Optimize structure for weight and manufacturability',
      context: {
        vehicleProgram: args.vehicleProgram,
        structureDesign: args.structureDesign,
        crashSimulation: args.crashSimulation,
        physicalTesting: args.physicalTesting
      },
      instructions: [
        '1. Identify weight reduction opportunities',
        '2. Optimize material gauge distribution',
        '3. Evaluate advanced materials (AHSS, aluminum)',
        '4. Optimize joint design',
        '5. Simplify manufacturing processes',
        '6. Evaluate cost implications',
        '7. Validate optimization via simulation',
        '8. Balance weight vs crashworthiness',
        '9. Document optimization trade-offs',
        '10. Create final design specifications'
      ],
      outputFormat: 'JSON object with optimization results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'weightReduction', 'tradeoffs'],
      properties: {
        results: {
          type: 'object',
          properties: {
            weightOptimization: { type: 'object' },
            materialOptimization: { type: 'object' },
            manufacturingOptimization: { type: 'object' }
          }
        },
        weightReduction: { type: 'number' },
        tradeoffs: { type: 'array', items: { type: 'object' } },
        finalSpecifications: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'crashworthiness', 'optimization', 'weight']
}));

export const ncapComplianceTask = defineTask('ncap-compliance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: NCAP Compliance Documentation - ${args.vehicleProgram}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'NCAP Compliance Engineer',
      task: 'Document NCAP and regulatory compliance',
      context: {
        vehicleProgram: args.vehicleProgram,
        crashSimulation: args.crashSimulation,
        physicalTesting: args.physicalTesting,
        restraintIntegration: args.restraintIntegration,
        pedestrianProtection: args.pedestrianProtection,
        targetRatings: args.targetRatings
      },
      instructions: [
        '1. Calculate Euro NCAP adult protection score',
        '2. Calculate Euro NCAP child protection score',
        '3. Calculate Euro NCAP pedestrian score',
        '4. Calculate Euro NCAP safety assist score',
        '5. Project overall star rating',
        '6. Document IIHS compliance status',
        '7. Document regulatory compliance (FMVSS, ECE)',
        '8. Identify gaps to target rating',
        '9. Create compliance matrix',
        '10. Document next steps'
      ],
      outputFormat: 'JSON object with NCAP compliance'
    },
    outputSchema: {
      type: 'object',
      required: ['compliance', 'projectedScore', 'nextSteps'],
      properties: {
        compliance: {
          type: 'object',
          properties: {
            euroNcap: { type: 'object' },
            iihs: { type: 'object' },
            regulatory: { type: 'object' }
          }
        },
        projectedScore: { type: 'number' },
        gaps: { type: 'array', items: { type: 'object' } },
        nextSteps: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['automotive', 'crashworthiness', 'NCAP', 'compliance']
}));
