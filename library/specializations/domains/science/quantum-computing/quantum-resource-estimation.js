/**
 * @process Quantum Resource Estimation
 * @id QC-DOC-002
 * @description Estimate quantum resource requirements including qubit count, circuit depth, gate count,
 * and error correction overhead for target applications.
 * @category Quantum Computing - Research and Documentation
 * @priority P1 - High
 * @inputs {{ algorithm: object, targetApplication: object }}
 * @outputs {{ success: boolean, resourceEstimates: object, feasibilityAnalysis: object, artifacts: array }}
 *
 * @example
 * const result = await orchestrate('quantum-resource-estimation', {
 *   algorithm: { name: 'shor', parameters: { n: 2048 } },
 *   targetApplication: { type: 'cryptography', targetErrorRate: 1e-15 }
 * });
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    algorithm,
    targetApplication,
    errorCorrectionCode = 'surface_code',
    physicalErrorRate = 0.001,
    outputDir = 'resource-estimation-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Quantum Resource Estimation: ${algorithm.name}`);
  ctx.log('info', `Target: ${targetApplication.type}, QEC: ${errorCorrectionCode}`);

  // ============================================================================
  // PHASE 1: ALGORITHM RESOURCE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Algorithm Resource Analysis');

  const algorithmResult = await ctx.task(algorithmResourceAnalysisTask, {
    algorithm
  });

  artifacts.push(...(algorithmResult.artifacts || []));

  await ctx.breakpoint({
    question: `Algorithm analysis complete. Logical qubits: ${algorithmResult.logicalQubits}, Logical gates: ${algorithmResult.logicalGates}, T-gates: ${algorithmResult.tGateCount}. Proceed with depth analysis?`,
    title: 'Algorithm Resource Analysis Review',
    context: {
      runId: ctx.runId,
      algorithm: algorithmResult,
      files: (algorithmResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 2: CIRCUIT DEPTH ESTIMATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Circuit Depth Estimation');

  const depthResult = await ctx.task(circuitDepthEstimationTask, {
    algorithmResources: algorithmResult
  });

  artifacts.push(...(depthResult.artifacts || []));

  // ============================================================================
  // PHASE 3: ERROR CORRECTION OVERHEAD
  // ============================================================================

  ctx.log('info', 'Phase 3: Error Correction Overhead Calculation');

  const qecOverheadResult = await ctx.task(errorCorrectionOverheadTask, {
    algorithmResources: algorithmResult,
    depthEstimates: depthResult,
    errorCorrectionCode,
    targetErrorRate: targetApplication.targetErrorRate,
    physicalErrorRate
  });

  artifacts.push(...(qecOverheadResult.artifacts || []));

  await ctx.breakpoint({
    question: `QEC overhead calculated. Physical qubits: ${qecOverheadResult.physicalQubits}, Code distance: ${qecOverheadResult.codeDistance}. Review overhead?`,
    title: 'QEC Overhead Review',
    context: {
      runId: ctx.runId,
      qecOverhead: qecOverheadResult,
      files: (qecOverheadResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 4: HARDWARE REQUIREMENT PROJECTION
  // ============================================================================

  ctx.log('info', 'Phase 4: Hardware Requirement Projection');

  const hardwareResult = await ctx.task(hardwareRequirementProjectionTask, {
    algorithmResources: algorithmResult,
    qecOverhead: qecOverheadResult,
    targetApplication
  });

  artifacts.push(...(hardwareResult.artifacts || []));

  // ============================================================================
  // PHASE 5: FEASIBILITY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Feasibility Analysis');

  const feasibilityResult = await ctx.task(feasibilityAnalysisTask, {
    algorithmResources: algorithmResult,
    qecOverhead: qecOverheadResult,
    hardwareRequirements: hardwareResult
  });

  artifacts.push(...(feasibilityResult.artifacts || []));

  // ============================================================================
  // PHASE 6: TIMELINE RECOMMENDATIONS
  // ============================================================================

  ctx.log('info', 'Phase 6: Timeline Recommendations');

  const timelineResult = await ctx.task(timelineRecommendationsTask, {
    feasibilityAnalysis: feasibilityResult,
    hardwareRequirements: hardwareResult
  });

  artifacts.push(...(timelineResult.artifacts || []));

  // ============================================================================
  // PHASE 7: REPORT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Report Generation');

  const reportResult = await ctx.task(resourceEstimationReportTask, {
    algorithm,
    targetApplication,
    algorithmResult,
    depthResult,
    qecOverheadResult,
    hardwareResult,
    feasibilityResult,
    timelineResult,
    outputDir
  });

  artifacts.push(...(reportResult.artifacts || []));

  await ctx.breakpoint({
    question: `Resource estimation complete. Total physical qubits: ${qecOverheadResult.physicalQubits}, Feasibility: ${feasibilityResult.feasibilityScore}/10. Approve estimation?`,
    title: 'Resource Estimation Complete',
    context: {
      runId: ctx.runId,
      summary: {
        algorithm: algorithm.name,
        logicalQubits: algorithmResult.logicalQubits,
        physicalQubits: qecOverheadResult.physicalQubits,
        feasibilityScore: feasibilityResult.feasibilityScore
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  const endTime = ctx.now();

  return {
    success: true,
    algorithm: algorithm.name,
    resourceEstimates: {
      logical: {
        qubits: algorithmResult.logicalQubits,
        gates: algorithmResult.logicalGates,
        tGates: algorithmResult.tGateCount,
        depth: depthResult.logicalDepth
      },
      physical: {
        qubits: qecOverheadResult.physicalQubits,
        codeDistance: qecOverheadResult.codeDistance,
        qubitOverhead: qecOverheadResult.qubitOverhead
      },
      time: {
        estimatedRuntime: hardwareResult.estimatedRuntime,
        clockCycles: hardwareResult.clockCycles
      }
    },
    feasibilityAnalysis: {
      score: feasibilityResult.feasibilityScore,
      currentlyFeasible: feasibilityResult.currentlyFeasible,
      estimatedYear: timelineResult.estimatedYear,
      keyMilestones: timelineResult.milestones
    },
    recommendations: timelineResult.recommendations,
    reportPath: reportResult.reportPath,
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'QC-DOC-002',
      processName: 'Quantum Resource Estimation',
      category: 'quantum-computing',
      timestamp: startTime
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const algorithmResourceAnalysisTask = defineTask('qre-algorithm-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Algorithm Resource Analysis',
  agent: {
    name: 'quantum-documentation-specialist',
    skills: ['resource-estimator', 'qsharp-compiler'],
    prompt: {
      role: 'Quantum Algorithm Analysis Specialist',
      task: 'Analyze algorithm resource requirements',
      context: args,
      instructions: [
        '1. Count logical qubits required',
        '2. Count total logical gates',
        '3. Count T-gates specifically',
        '4. Identify Clifford gates',
        '5. Analyze ancilla requirements',
        '6. Calculate measurement count',
        '7. Identify parallelism opportunities',
        '8. Document resource scaling',
        '9. Compare with literature',
        '10. Generate resource summary'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['logicalQubits', 'logicalGates', 'tGateCount'],
      properties: {
        logicalQubits: { type: 'number' },
        logicalGates: { type: 'number' },
        tGateCount: { type: 'number' },
        cliffordGates: { type: 'number' },
        ancillaQubits: { type: 'number' },
        measurements: { type: 'number' },
        scaling: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'resource-estimation', 'algorithm']
}));

export const circuitDepthEstimationTask = defineTask('qre-depth-estimation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Circuit Depth Estimation',
  agent: {
    name: 'quantum-documentation-specialist',
    skills: ['resource-estimator', 'qsharp-compiler'],
    prompt: {
      role: 'Circuit Depth Analysis Specialist',
      task: 'Estimate circuit depth requirements',
      context: args,
      instructions: [
        '1. Calculate logical circuit depth',
        '2. Analyze critical path',
        '3. Consider parallelism',
        '4. Account for serialization',
        '5. Calculate T-depth',
        '6. Estimate physical depth',
        '7. Consider connectivity constraints',
        '8. Analyze depth-width tradeoffs',
        '9. Compare optimization strategies',
        '10. Document depth analysis'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['logicalDepth', 'tDepth'],
      properties: {
        logicalDepth: { type: 'number' },
        tDepth: { type: 'number' },
        criticalPath: { type: 'array' },
        parallelizationFactor: { type: 'number' },
        optimizedDepth: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'resource-estimation', 'depth']
}));

export const errorCorrectionOverheadTask = defineTask('qre-qec-overhead', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Error Correction Overhead',
  agent: {
    name: 'quantum-documentation-specialist',
    skills: ['resource-estimator', 'qsharp-compiler'],
    prompt: {
      role: 'QEC Resource Estimation Specialist',
      task: 'Calculate error correction overhead',
      context: args,
      instructions: [
        '1. Determine required code distance',
        '2. Calculate physical qubits per logical',
        '3. Calculate total physical qubits',
        '4. Estimate magic state factory size',
        '5. Calculate distillation overhead',
        '6. Estimate syndrome measurement cycles',
        '7. Calculate time overhead',
        '8. Consider routing overhead',
        '9. Account for ancilla qubits',
        '10. Document QEC overhead'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['physicalQubits', 'codeDistance', 'qubitOverhead'],
      properties: {
        physicalQubits: { type: 'number' },
        codeDistance: { type: 'number' },
        qubitOverhead: { type: 'number' },
        magicStateFactory: { type: 'object' },
        timeOverhead: { type: 'number' },
        routingOverhead: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'resource-estimation', 'qec']
}));

export const hardwareRequirementProjectionTask = defineTask('qre-hardware-projection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Hardware Requirement Projection',
  agent: {
    name: 'quantum-documentation-specialist',
    skills: ['resource-estimator', 'qsharp-compiler'],
    prompt: {
      role: 'Quantum Hardware Requirements Specialist',
      task: 'Project hardware requirements',
      context: args,
      instructions: [
        '1. Map to hardware architecture',
        '2. Calculate clock cycles needed',
        '3. Estimate total runtime',
        '4. Consider cooling requirements',
        '5. Estimate power consumption',
        '6. Calculate data bandwidth needs',
        '7. Consider classical compute needs',
        '8. Project to near-term hardware',
        '9. Project to future hardware',
        '10. Document hardware requirements'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['estimatedRuntime', 'clockCycles'],
      properties: {
        estimatedRuntime: { type: 'number' },
        clockCycles: { type: 'number' },
        powerConsumption: { type: 'number' },
        coolingRequirements: { type: 'object' },
        classicalComputeNeeds: { type: 'object' },
        hardwareMapping: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'resource-estimation', 'hardware']
}));

export const feasibilityAnalysisTask = defineTask('qre-feasibility-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Feasibility Analysis',
  agent: {
    name: 'quantum-documentation-specialist',
    skills: ['resource-estimator', 'qsharp-compiler'],
    prompt: {
      role: 'Quantum Feasibility Analyst',
      task: 'Analyze feasibility of quantum computation',
      context: args,
      instructions: [
        '1. Compare with current hardware',
        '2. Compare with planned hardware',
        '3. Identify bottlenecks',
        '4. Calculate feasibility score',
        '5. Identify critical requirements',
        '6. Analyze alternatives',
        '7. Compare with classical',
        '8. Identify risk factors',
        '9. Provide go/no-go assessment',
        '10. Document feasibility analysis'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['feasibilityScore', 'currentlyFeasible'],
      properties: {
        feasibilityScore: { type: 'number' },
        currentlyFeasible: { type: 'boolean' },
        bottlenecks: { type: 'array' },
        criticalRequirements: { type: 'array' },
        riskFactors: { type: 'array' },
        alternatives: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'resource-estimation', 'feasibility']
}));

export const timelineRecommendationsTask = defineTask('qre-timeline-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Timeline Recommendations',
  agent: {
    name: 'quantum-documentation-specialist',
    skills: ['resource-estimator', 'qsharp-compiler'],
    prompt: {
      role: 'Quantum Technology Forecaster',
      task: 'Provide timeline recommendations',
      context: args,
      instructions: [
        '1. Review hardware roadmaps',
        '2. Estimate year of feasibility',
        '3. Identify key milestones',
        '4. Plan staged approach',
        '5. Recommend near-term steps',
        '6. Identify early demonstrations',
        '7. Plan scaling strategy',
        '8. Identify preparation activities',
        '9. Provide recommendations',
        '10. Document timeline'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['estimatedYear', 'milestones', 'recommendations'],
      properties: {
        estimatedYear: { type: 'number' },
        milestones: { type: 'array' },
        recommendations: { type: 'array' },
        nearTermSteps: { type: 'array' },
        scalingStrategy: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'resource-estimation', 'timeline']
}));

export const resourceEstimationReportTask = defineTask('qre-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Resource Estimation Report',
  agent: {
    name: 'quantum-documentation-specialist',
    skills: ['resource-estimator', 'qsharp-compiler'],
    prompt: {
      role: 'Technical Report Specialist',
      task: 'Generate comprehensive resource estimation report',
      context: args,
      instructions: [
        '1. Create executive summary',
        '2. Document methodology',
        '3. Present resource estimates',
        '4. Include QEC analysis',
        '5. Present feasibility analysis',
        '6. Include timeline',
        '7. Add visualizations',
        '8. Include recommendations',
        '9. Add appendices',
        '10. Generate final report'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        visualizations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'resource-estimation', 'reporting']
}));
