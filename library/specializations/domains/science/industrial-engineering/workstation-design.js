/**
 * @process domains/science/industrial-engineering/workstation-design
 * @description Workstation Design Optimization - Design or redesign workstations applying ergonomic principles
 * to optimize human performance, comfort, and safety while meeting production requirements.
 * @inputs { workstationType: string, tasks?: array, targetPopulation?: object }
 * @outputs { success: boolean, designSpecifications: object, layoutDrawings: array, userTestingResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('domains/science/industrial-engineering/workstation-design', {
 *   workstationType: 'Assembly workstation',
 *   tasks: ['component-insertion', 'soldering', 'inspection'],
 *   targetPopulation: { percentile: '5th-95th', gender: 'mixed' }
 * });
 *
 * @references
 * - Kroemer et al., Fitting the Human
 * - Sanders & McCormick, Human Factors in Engineering and Design
 * - Pheasant, Bodyspace: Anthropometry, Ergonomics and Design
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    workstationType,
    tasks = [],
    targetPopulation = { percentile: '5th-95th', gender: 'mixed' },
    existingLayout = null,
    outputDir = 'workstation-design-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Workstation Design Optimization process');

  // Task 1: Task Analysis
  ctx.log('info', 'Phase 1: Analyzing work tasks and requirements');
  const taskAnalysis = await ctx.task(taskAnalysisTask, {
    workstationType,
    tasks,
    existingLayout,
    outputDir
  });

  artifacts.push(...taskAnalysis.artifacts);

  // Task 2: Anthropometric Analysis
  ctx.log('info', 'Phase 2: Analyzing anthropometric requirements');
  const anthropometricAnalysis = await ctx.task(anthropometricTask, {
    targetPopulation,
    taskAnalysis,
    outputDir
  });

  artifacts.push(...anthropometricAnalysis.artifacts);

  // Task 3: Reach Zone Design
  ctx.log('info', 'Phase 3: Defining reach zones and work surface heights');
  const reachZoneDesign = await ctx.task(reachZoneTask, {
    anthropometricAnalysis,
    taskAnalysis,
    outputDir
  });

  artifacts.push(...reachZoneDesign.artifacts);

  // Breakpoint: Review dimensions
  await ctx.breakpoint({
    question: `Workstation dimensions defined. Work surface height: ${reachZoneDesign.workSurfaceHeight}. Primary reach zone: ${reachZoneDesign.primaryReachRadius}cm. Accommodation: ${anthropometricAnalysis.accommodationPercentage}%. Review before detailed design?`,
    title: 'Workstation Dimensions Review',
    context: {
      runId: ctx.runId,
      dimensions: reachZoneDesign.keyDimensions,
      accommodation: anthropometricAnalysis.accommodationPercentage,
      files: reachZoneDesign.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // Task 4: Tool and Material Presentation
  ctx.log('info', 'Phase 4: Designing tool and material presentation');
  const materialPresentation = await ctx.task(materialPresentationTask, {
    taskAnalysis,
    reachZoneDesign,
    outputDir
  });

  artifacts.push(...materialPresentation.artifacts);

  // Task 5: Adjustability Design
  ctx.log('info', 'Phase 5: Specifying adjustable features');
  const adjustabilityDesign = await ctx.task(adjustabilityTask, {
    anthropometricAnalysis,
    reachZoneDesign,
    outputDir
  });

  artifacts.push(...adjustabilityDesign.artifacts);

  // Task 6: Layout Design
  ctx.log('info', 'Phase 6: Creating workstation layout drawings');
  const layoutDesign = await ctx.task(layoutDesignTask, {
    reachZoneDesign,
    materialPresentation,
    adjustabilityDesign,
    outputDir
  });

  artifacts.push(...layoutDesign.artifacts);

  // Task 7: Prototype Development
  ctx.log('info', 'Phase 7: Developing prototype or mockup');
  const prototypeDevelopment = await ctx.task(prototypeTask, {
    layoutDesign,
    outputDir
  });

  artifacts.push(...prototypeDevelopment.artifacts);

  // Task 8: User Testing
  ctx.log('info', 'Phase 8: Conducting user testing');
  const userTesting = await ctx.task(userTestingTask, {
    prototypeDevelopment,
    targetPopulation,
    taskAnalysis,
    outputDir
  });

  artifacts.push(...userTesting.artifacts);

  // Task 9: Final Design Specification
  ctx.log('info', 'Phase 9: Creating final design specifications');
  const finalDesign = await ctx.task(finalDesignTask, {
    layoutDesign,
    userTesting,
    adjustabilityDesign,
    outputDir
  });

  artifacts.push(...finalDesign.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Workstation design complete. User testing satisfaction: ${userTesting.satisfactionScore}/10. ${userTesting.iterationsMade} design iterations made. Review final specifications?`,
    title: 'Workstation Design Results',
    context: {
      runId: ctx.runId,
      summary: {
        workSurfaceHeight: reachZoneDesign.workSurfaceHeight,
        adjustmentRanges: adjustabilityDesign.adjustmentRanges,
        userSatisfaction: userTesting.satisfactionScore,
        ergonomicScore: userTesting.ergonomicScore,
        iterations: userTesting.iterationsMade
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    designSpecifications: finalDesign.specifications,
    layoutDrawings: layoutDesign.drawings,
    userTestingResults: {
      satisfactionScore: userTesting.satisfactionScore,
      ergonomicScore: userTesting.ergonomicScore,
      feedback: userTesting.feedback
    },
    artifacts,
    duration,
    metadata: {
      processId: 'domains/science/industrial-engineering/workstation-design',
      timestamp: startTime,
      workstationType,
      targetPopulation,
      outputDir
    }
  };
}

// Task 1: Task Analysis
export const taskAnalysisTask = defineTask('task-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze work tasks and requirements',
  agent: {
    name: 'task-analyst',
    prompt: {
      role: 'Work Analysis Specialist',
      task: 'Analyze tasks performed at workstation',
      context: args,
      instructions: [
        '1. Identify all tasks performed at workstation',
        '2. Document task sequence and frequency',
        '3. Analyze visual requirements',
        '4. Analyze manual handling requirements',
        '5. Identify precision requirements',
        '6. Document tool usage',
        '7. Analyze information needs',
        '8. Create task analysis document'
      ],
      outputFormat: 'JSON with task analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['tasks', 'requirements', 'artifacts'],
      properties: {
        tasks: { type: 'array' },
        taskSequence: { type: 'array' },
        visualRequirements: { type: 'object' },
        handlingRequirements: { type: 'object' },
        precisionRequirements: { type: 'object' },
        toolUsage: { type: 'array' },
        requirements: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'workstation-design', 'task-analysis']
}));

// Task 2: Anthropometric Analysis
export const anthropometricTask = defineTask('anthropometric-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze anthropometric requirements',
  agent: {
    name: 'anthropometric-analyst',
    prompt: {
      role: 'Anthropometric Analyst',
      task: 'Determine anthropometric design targets',
      context: args,
      instructions: [
        '1. Define target user population',
        '2. Select relevant anthropometric dimensions',
        '3. Look up percentile values',
        '4. Determine design accommodation percentage',
        '5. Apply clothing and equipment allowances',
        '6. Document critical dimensions',
        '7. Consider special populations if needed',
        '8. Create anthropometric summary'
      ],
      outputFormat: 'JSON with anthropometric analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['dimensions', 'accommodationPercentage', 'designTargets', 'artifacts'],
      properties: {
        dimensions: { type: 'object' },
        accommodationPercentage: { type: 'number' },
        designTargets: { type: 'object' },
        allowances: { type: 'object' },
        specialConsiderations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'workstation-design', 'anthropometry']
}));

// Task 3: Reach Zone Design
export const reachZoneTask = defineTask('reach-zone-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define reach zones and work surface heights',
  agent: {
    name: 'reach-zone-designer',
    prompt: {
      role: 'Workspace Layout Designer',
      task: 'Define reach zones and optimal work surface heights',
      context: args,
      instructions: [
        '1. Calculate optimal work surface height',
        '2. Define primary reach zone (frequent items)',
        '3. Define secondary reach zone (occasional items)',
        '4. Define maximum reach envelope',
        '5. Determine viewing distances',
        '6. Set display heights and angles',
        '7. Document all dimensions',
        '8. Create reach zone diagram'
      ],
      outputFormat: 'JSON with reach zone specifications'
    },
    outputSchema: {
      type: 'object',
      required: ['workSurfaceHeight', 'primaryReachRadius', 'keyDimensions', 'artifacts'],
      properties: {
        workSurfaceHeight: { type: 'string' },
        primaryReachRadius: { type: 'number' },
        secondaryReachRadius: { type: 'number' },
        maxReachEnvelope: { type: 'object' },
        viewingDistances: { type: 'object' },
        keyDimensions: { type: 'object' },
        reachZoneDiagram: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'workstation-design', 'reach-zones']
}));

// Task 4: Material Presentation
export const materialPresentationTask = defineTask('material-presentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design tool and material presentation',
  agent: {
    name: 'presentation-designer',
    prompt: {
      role: 'Lean Manufacturing Engineer',
      task: 'Design optimal tool and material presentation',
      context: args,
      instructions: [
        '1. Analyze material flow requirements',
        '2. Design part presentation (bins, fixtures)',
        '3. Design tool storage and access',
        '4. Apply point-of-use principles',
        '5. Minimize reaching and searching',
        '6. Design for one-motion retrieval',
        '7. Plan for visual management',
        '8. Document presentation design'
      ],
      outputFormat: 'JSON with material presentation design'
    },
    outputSchema: {
      type: 'object',
      required: ['partPresentation', 'toolStorage', 'materialFlow', 'artifacts'],
      properties: {
        partPresentation: { type: 'array' },
        toolStorage: { type: 'array' },
        materialFlow: { type: 'object' },
        visualManagement: { type: 'array' },
        fixtureDesigns: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'workstation-design', 'material-presentation']
}));

// Task 5: Adjustability Design
export const adjustabilityTask = defineTask('adjustability-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Specify adjustable features',
  agent: {
    name: 'adjustability-designer',
    prompt: {
      role: 'Ergonomic Equipment Designer',
      task: 'Specify adjustable features for user accommodation',
      context: args,
      instructions: [
        '1. Determine which dimensions need adjustment',
        '2. Calculate adjustment ranges needed',
        '3. Select adjustment mechanisms',
        '4. Design for easy adjustment',
        '5. Consider sit-stand options',
        '6. Design adjustable fixtures',
        '7. Specify adjustment lockouts',
        '8. Document adjustability specifications'
      ],
      outputFormat: 'JSON with adjustability specifications'
    },
    outputSchema: {
      type: 'object',
      required: ['adjustableFeatures', 'adjustmentRanges', 'mechanisms', 'artifacts'],
      properties: {
        adjustableFeatures: { type: 'array' },
        adjustmentRanges: { type: 'object' },
        mechanisms: { type: 'array' },
        sitStandOptions: { type: 'object' },
        specifications: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'workstation-design', 'adjustability']
}));

// Task 6: Layout Design
export const layoutDesignTask = defineTask('layout-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create workstation layout drawings',
  agent: {
    name: 'layout-designer',
    prompt: {
      role: 'Workstation Layout Designer',
      task: 'Create detailed workstation layout drawings',
      context: args,
      instructions: [
        '1. Create 2D plan view drawing',
        '2. Create elevation drawings',
        '3. Create 3D model/rendering',
        '4. Dimension all critical features',
        '5. Show reach zone overlays',
        '6. Include material flow paths',
        '7. Show adjustment ranges',
        '8. Create drawing package'
      ],
      outputFormat: 'JSON with layout drawings'
    },
    outputSchema: {
      type: 'object',
      required: ['drawings', 'dimensions', 'artifacts'],
      properties: {
        drawings: { type: 'array' },
        planView: { type: 'string' },
        elevations: { type: 'array' },
        model3D: { type: 'string' },
        dimensions: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'workstation-design', 'layout']
}));

// Task 7: Prototype Development
export const prototypeTask = defineTask('prototype-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop prototype or mockup',
  agent: {
    name: 'prototype-developer',
    prompt: {
      role: 'Prototype Development Engineer',
      task: 'Create prototype or mockup for testing',
      context: args,
      instructions: [
        '1. Determine prototype fidelity needed',
        '2. Build physical mockup or prototype',
        '3. Include adjustable features',
        '4. Create functional work surface',
        '5. Include sample materials/tools',
        '6. Plan for user testing',
        '7. Document prototype specifications',
        '8. Prepare testing protocol'
      ],
      outputFormat: 'JSON with prototype information'
    },
    outputSchema: {
      type: 'object',
      required: ['prototypeSpec', 'testingProtocol', 'artifacts'],
      properties: {
        prototypeSpec: { type: 'object' },
        fidelityLevel: { type: 'string' },
        materials: { type: 'array' },
        testingProtocol: { type: 'object' },
        setupInstructions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'workstation-design', 'prototype']
}));

// Task 8: User Testing
export const userTestingTask = defineTask('user-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct user testing',
  agent: {
    name: 'user-tester',
    prompt: {
      role: 'Human Factors Engineer',
      task: 'Conduct user testing with representative users',
      context: args,
      instructions: [
        '1. Recruit representative users',
        '2. Conduct testing sessions',
        '3. Collect usability data',
        '4. Collect comfort ratings',
        '5. Observe postures and movements',
        '6. Collect user feedback',
        '7. Identify design iterations needed',
        '8. Document testing results'
      ],
      outputFormat: 'JSON with user testing results'
    },
    outputSchema: {
      type: 'object',
      required: ['satisfactionScore', 'ergonomicScore', 'feedback', 'iterationsMade', 'artifacts'],
      properties: {
        satisfactionScore: { type: 'number' },
        ergonomicScore: { type: 'number' },
        feedback: { type: 'array' },
        usabilityData: { type: 'object' },
        comfortRatings: { type: 'object' },
        postureObservations: { type: 'array' },
        iterationsMade: { type: 'number' },
        designChanges: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'workstation-design', 'user-testing']
}));

// Task 9: Final Design Specification
export const finalDesignTask = defineTask('final-design-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create final design specifications',
  agent: {
    name: 'design-specifier',
    prompt: {
      role: 'Design Documentation Specialist',
      task: 'Create final design specification package',
      context: args,
      instructions: [
        '1. Incorporate user testing feedback',
        '2. Finalize all dimensions',
        '3. Specify all components',
        '4. Create bill of materials',
        '5. Document assembly instructions',
        '6. Create maintenance requirements',
        '7. Document safety considerations',
        '8. Create complete design package'
      ],
      outputFormat: 'JSON with final design specifications'
    },
    outputSchema: {
      type: 'object',
      required: ['specifications', 'billOfMaterials', 'documentation', 'artifacts'],
      properties: {
        specifications: { type: 'object' },
        finalDimensions: { type: 'object' },
        components: { type: 'array' },
        billOfMaterials: { type: 'array' },
        assemblyInstructions: { type: 'array' },
        maintenance: { type: 'object' },
        safetyConsiderations: { type: 'array' },
        documentation: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'workstation-design', 'specification']
}));
