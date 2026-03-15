/**
 * @process manufacturing-process-planning
 * @description Manufacturing process planning - operation sequencing, tooling selection, cycle time estimation, and process sheet development
 * @inputs {object} inputs
 * @inputs {string} inputs.partNumber - Part identification number
 * @inputs {string} inputs.partDrawing - Engineering drawing with GD&T
 * @inputs {object} inputs.productionVolume - Annual volume and batch sizes
 * @inputs {object} inputs.materialSpec - Material specification and stock form
 * @inputs {object} inputs.qualityRequirements - Critical characteristics and inspection requirements
 * @outputs {object} processplan - Complete manufacturing process plan with routing and work instructions
 * @example
 * const result = await process({
 *   partNumber: 'MFG-2024-001',
 *   partDrawing: 'DWG-2024-001-R3',
 *   productionVolume: { annual: 10000, batchSize: 500 },
 *   materialSpec: { material: 'Al 6061-T6', form: 'bar stock', size: '2.5" dia' },
 *   qualityRequirements: { criticalDimensions: ['bore ID', 'face flatness'], inspection: 'CMM' }
 * });
 * @references DFM Guidelines, APQP, PFMEA, Control Plan Methodology
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const artifacts = [];

  // Phase 1: Part Analysis and Feature Recognition
  const partAnalysis = await ctx.task(partAnalysisTask, {
    partNumber: inputs.partNumber,
    partDrawing: inputs.partDrawing,
    materialSpec: inputs.materialSpec
  });
  artifacts.push({ phase: 'part-analysis', data: partAnalysis });

  // Phase 2: Process Selection and Sequencing
  const processSelection = await ctx.task(processSelectionTask, {
    features: partAnalysis.features,
    tolerances: partAnalysis.tolerances,
    materialSpec: inputs.materialSpec,
    productionVolume: inputs.productionVolume
  });
  artifacts.push({ phase: 'process-selection', data: processSelection });

  // Phase 3: Tooling and Fixture Requirements
  const toolingRequirements = await ctx.task(toolingRequirementsTask, {
    operations: processSelection.operations,
    partGeometry: partAnalysis.geometry,
    materialSpec: inputs.materialSpec
  });
  artifacts.push({ phase: 'tooling-requirements', data: toolingRequirements });

  // Phase 4: PFMEA Development
  const pfmea = await ctx.task(pfmeaTask, {
    operations: processSelection.operations,
    qualityRequirements: inputs.qualityRequirements,
    tooling: toolingRequirements
  });
  artifacts.push({ phase: 'pfmea', data: pfmea });

  // Breakpoint: PFMEA Review
  await ctx.breakpoint('pfmea-review', {
    question: 'Review PFMEA for high-risk operations. Are additional controls needed?',
    context: {
      highRpnItems: pfmea.highRiskItems,
      proposedControls: pfmea.recommendedControls
    }
  });

  // Phase 5: Cycle Time Estimation
  const cycleTimeEstimation = await ctx.task(cycleTimeTask, {
    operations: processSelection.operations,
    tooling: toolingRequirements,
    materialSpec: inputs.materialSpec
  });
  artifacts.push({ phase: 'cycle-time', data: cycleTimeEstimation });

  // Phase 6: Work Instruction Development
  const workInstructions = await ctx.task(workInstructionsTask, {
    operations: processSelection.operations,
    tooling: toolingRequirements,
    pfmea: pfmea,
    cycleTimes: cycleTimeEstimation
  });
  artifacts.push({ phase: 'work-instructions', data: workInstructions });

  // Phase 7: Control Plan Development
  const controlPlan = await ctx.task(controlPlanTask, {
    operations: processSelection.operations,
    pfmea: pfmea,
    qualityRequirements: inputs.qualityRequirements
  });
  artifacts.push({ phase: 'control-plan', data: controlPlan });

  // Phase 8: Process Routing Finalization
  const processRouting = await ctx.task(processRoutingTask, {
    operations: processSelection.operations,
    cycleTimes: cycleTimeEstimation,
    workInstructions: workInstructions,
    controlPlan: controlPlan
  });
  artifacts.push({ phase: 'process-routing', data: processRouting });

  // Final Breakpoint: Process Plan Approval
  await ctx.breakpoint('process-plan-approval', {
    question: 'Approve complete manufacturing process plan for release?',
    context: {
      partNumber: inputs.partNumber,
      totalCycleTime: cycleTimeEstimation.totalCycleTime,
      operationCount: processRouting.operations.length,
      toolingCost: toolingRequirements.totalCost
    }
  });

  return {
    success: true,
    results: {
      partNumber: inputs.partNumber,
      processRouting: processRouting,
      workInstructions: workInstructions,
      controlPlan: controlPlan,
      pfmea: pfmea,
      cycleTimeAnalysis: cycleTimeEstimation,
      toolingRequirements: toolingRequirements
    },
    artifacts,
    metadata: {
      totalOperations: processRouting.operations.length,
      totalCycleTime: cycleTimeEstimation.totalCycleTime,
      estimatedToolingCost: toolingRequirements.totalCost
    }
  };
}

const partAnalysisTask = defineTask('part-analysis', (args) => ({
  kind: 'agent',
  title: 'Part Analysis and Feature Recognition',
  agent: {
    name: 'manufacturing-analyst',
    prompt: {
      role: 'Manufacturing Engineer specializing in process planning',
      task: 'Analyze part drawing for manufacturing features, tolerances, and special requirements',
      context: args,
      instructions: [
        'Identify all machined features (holes, bores, faces, threads, grooves)',
        'Extract dimensional tolerances and geometric tolerances',
        'Identify critical-to-quality (CTQ) characteristics',
        'Determine material removal volumes and surface finish requirements',
        'Note any special processing requirements (heat treat, coating, plating)',
        'Identify datum structure and inspection requirements'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['features', 'tolerances', 'geometry', 'specialRequirements'],
      properties: {
        features: { type: 'array', items: { type: 'object' } },
        tolerances: { type: 'object' },
        geometry: { type: 'object' },
        specialRequirements: { type: 'array', items: { type: 'string' } },
        ctqCharacteristics: { type: 'array', items: { type: 'object' } }
      }
    }
  }
}));

const processSelectionTask = defineTask('process-selection', (args) => ({
  kind: 'agent',
  title: 'Manufacturing Process Selection and Sequencing',
  agent: {
    name: 'process-planner',
    prompt: {
      role: 'Senior Process Planner',
      task: 'Select optimal manufacturing processes and develop operation sequence',
      context: args,
      instructions: [
        'Select primary manufacturing processes based on features and tolerances',
        'Consider material machinability and process capabilities',
        'Sequence operations for efficient material flow',
        'Group operations by machine type where possible',
        'Plan roughing and finishing operations appropriately',
        'Consider in-process inspection requirements',
        'Optimize for production volume and batch size'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['operations', 'processFlow', 'machineTypes'],
      properties: {
        operations: { type: 'array', items: { type: 'object' } },
        processFlow: { type: 'object' },
        machineTypes: { type: 'array', items: { type: 'string' } },
        alternativeProcesses: { type: 'array', items: { type: 'object' } }
      }
    }
  }
}));

const toolingRequirementsTask = defineTask('tooling-requirements', (args) => ({
  kind: 'agent',
  title: 'Tooling and Fixture Requirements Definition',
  agent: {
    name: 'tooling-engineer',
    prompt: {
      role: 'Tooling Engineer',
      task: 'Define cutting tools, fixtures, and workholding requirements',
      context: args,
      instructions: [
        'Select cutting tools for each operation',
        'Define tool specifications (material, geometry, coating)',
        'Design workholding strategy for each operation',
        'Specify fixture requirements and locating scheme',
        'Identify standard vs special tooling needs',
        'Estimate tooling costs and lead times',
        'Define tool life expectations and replacement strategy'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['cuttingTools', 'fixtures', 'workholding', 'totalCost'],
      properties: {
        cuttingTools: { type: 'array', items: { type: 'object' } },
        fixtures: { type: 'array', items: { type: 'object' } },
        workholding: { type: 'array', items: { type: 'object' } },
        totalCost: { type: 'number' },
        leadTime: { type: 'string' }
      }
    }
  }
}));

const pfmeaTask = defineTask('pfmea-development', (args) => ({
  kind: 'agent',
  title: 'Process FMEA Development',
  agent: {
    name: 'quality-engineer',
    prompt: {
      role: 'Quality Engineer specializing in PFMEA',
      task: 'Develop Process Failure Mode and Effects Analysis',
      context: args,
      instructions: [
        'Identify potential failure modes for each operation',
        'Assess severity, occurrence, and detection ratings',
        'Calculate Risk Priority Numbers (RPN)',
        'Identify high-risk items requiring mitigation',
        'Recommend process controls and detection methods',
        'Define recommended actions for high RPN items',
        'Link failure modes to control plan requirements'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['failureModes', 'highRiskItems', 'recommendedControls'],
      properties: {
        failureModes: { type: 'array', items: { type: 'object' } },
        highRiskItems: { type: 'array', items: { type: 'object' } },
        recommendedControls: { type: 'array', items: { type: 'object' } },
        maxRpn: { type: 'number' }
      }
    }
  }
}));

const cycleTimeTask = defineTask('cycle-time-estimation', (args) => ({
  kind: 'agent',
  title: 'Cycle Time Estimation',
  agent: {
    name: 'industrial-engineer',
    prompt: {
      role: 'Industrial Engineer',
      task: 'Estimate cycle times for all manufacturing operations',
      context: args,
      instructions: [
        'Calculate machining times using appropriate feeds and speeds',
        'Estimate setup times for each operation',
        'Include load/unload and part handling times',
        'Account for in-process inspection time',
        'Consider tool change and indexing times',
        'Calculate total cycle time and takt time requirements',
        'Identify bottleneck operations'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['operationTimes', 'totalCycleTime', 'bottleneck'],
      properties: {
        operationTimes: { type: 'array', items: { type: 'object' } },
        totalCycleTime: { type: 'number' },
        setupTimes: { type: 'array', items: { type: 'object' } },
        bottleneck: { type: 'object' },
        capacityAnalysis: { type: 'object' }
      }
    }
  }
}));

const workInstructionsTask = defineTask('work-instructions', (args) => ({
  kind: 'agent',
  title: 'Work Instruction Development',
  agent: {
    name: 'manufacturing-engineer',
    prompt: {
      role: 'Manufacturing Engineer',
      task: 'Develop detailed work instructions for each operation',
      context: args,
      instructions: [
        'Create step-by-step instructions for each operation',
        'Include setup procedures and part orientation',
        'Specify cutting parameters (speed, feed, depth of cut)',
        'Define quality checkpoints and inspection criteria',
        'Include safety precautions and PPE requirements',
        'Add visual aids and reference images where needed',
        'Document handling and storage requirements'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['instructions', 'operationSheets'],
      properties: {
        instructions: { type: 'array', items: { type: 'object' } },
        operationSheets: { type: 'array', items: { type: 'object' } },
        safetyRequirements: { type: 'array', items: { type: 'string' } }
      }
    }
  }
}));

const controlPlanTask = defineTask('control-plan', (args) => ({
  kind: 'agent',
  title: 'Control Plan Development',
  agent: {
    name: 'quality-engineer',
    prompt: {
      role: 'Quality Engineer',
      task: 'Develop manufacturing control plan per APQP requirements',
      context: args,
      instructions: [
        'Define product and process characteristics to control',
        'Specify measurement methods and gages for each characteristic',
        'Define sample sizes and frequencies',
        'Establish control methods (SPC, 100% inspection, etc.)',
        'Document reaction plans for out-of-control conditions',
        'Link to PFMEA failure modes and recommended actions',
        'Include special characteristics requiring enhanced control'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['characteristics', 'controlMethods', 'reactionPlans'],
      properties: {
        characteristics: { type: 'array', items: { type: 'object' } },
        controlMethods: { type: 'array', items: { type: 'object' } },
        reactionPlans: { type: 'array', items: { type: 'object' } },
        gageRequirements: { type: 'array', items: { type: 'object' } }
      }
    }
  }
}));

const processRoutingTask = defineTask('process-routing', (args) => ({
  kind: 'agent',
  title: 'Process Routing Finalization',
  agent: {
    name: 'process-planner',
    prompt: {
      role: 'Senior Process Planner',
      task: 'Finalize manufacturing routing with all details',
      context: args,
      instructions: [
        'Compile final operation sequence with all details',
        'Assign operation numbers per company standards',
        'Include work center assignments',
        'Document standard times for each operation',
        'Link work instructions and control plan references',
        'Generate routing summary for ERP system',
        'Include material and tooling requirements per operation'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['operations', 'routingSummary'],
      properties: {
        operations: { type: 'array', items: { type: 'object' } },
        routingSummary: { type: 'object' },
        erpData: { type: 'object' },
        documentReferences: { type: 'array', items: { type: 'string' } }
      }
    }
  }
}));

export default { process };
