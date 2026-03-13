/**
 * @process Engineering Design Reasoning
 * @description Apply systematic design thinking combining functional requirements, constraints, and iterative refinement to create solutions
 * @category Scientific Discovery - Domain-Specific Reasoning
 * @inputs {{ designProblem: string, requirements: object, constraints: object, context: object }}
 * @outputs {{ designSolution: object, specifications: object, tradeoffAnalysis: object, validationPlan: object, recommendations: array }}
 * @example
 * // Input: { designProblem: "Design efficient heat exchanger", requirements: {...}, constraints: {...} }
 * // Output: { designSolution: { concept: "...", architecture: {...} }, specifications: {...}, tradeoffAnalysis: {...} }
 * @references Pahl & Beitz systematic design, TRIZ methodology, Axiomatic Design principles
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  // Phase 1: Problem Clarification and Requirements Analysis
  const requirementsAnalysis = await ctx.task(analyzeRequirementsTask, {
    designProblem: inputs.designProblem,
    functionalRequirements: inputs.requirements?.functional || [],
    nonFunctionalRequirements: inputs.requirements?.nonFunctional || [],
    stakeholders: inputs.context?.stakeholders
  });

  // Phase 2: Constraint Analysis
  const constraintAnalysis = await ctx.task(analyzeConstraintsTask, {
    technicalConstraints: inputs.constraints?.technical || [],
    resourceConstraints: inputs.constraints?.resources || [],
    regulatoryConstraints: inputs.constraints?.regulatory || [],
    environmentalConstraints: inputs.constraints?.environmental || [],
    requirements: requirementsAnalysis.prioritizedRequirements
  });

  // Phase 3: Function Structure Development
  const functionStructure = await ctx.task(developFunctionStructureTask, {
    requirements: requirementsAnalysis.prioritizedRequirements,
    constraints: constraintAnalysis.activeConstraints,
    systemBoundary: inputs.context?.systemBoundary
  });

  // Phase 4: Concept Generation
  const conceptGeneration = await ctx.task(generateConceptsTask, {
    functionStructure: functionStructure.functionalDecomposition,
    requirements: requirementsAnalysis.prioritizedRequirements,
    constraints: constraintAnalysis.activeConstraints,
    existingSolutions: inputs.context?.existingSolutions,
    trizPrinciples: inputs.context?.trizApplication
  });

  // Phase 5: Concept Evaluation and Selection
  const conceptEvaluation = await ctx.task(evaluateConceptsTask, {
    concepts: conceptGeneration.generatedConcepts,
    evaluationCriteria: requirementsAnalysis.evaluationCriteria,
    constraints: constraintAnalysis.activeConstraints,
    weightings: inputs.requirements?.priorityWeights
  });

  // Quality Gate: Concept Viability
  if (conceptEvaluation.bestConcept.feasibilityScore < 0.5) {
    await ctx.breakpoint('concept-revision-required', {
      message: 'No sufficiently feasible concept found',
      evaluationResults: conceptEvaluation.rankings,
      suggestedIterations: conceptEvaluation.improvementDirections
    });
  }

  // Phase 6: Embodiment Design
  const embodimentDesign = await ctx.task(developEmbodimentTask, {
    selectedConcept: conceptEvaluation.bestConcept,
    requirements: requirementsAnalysis.prioritizedRequirements,
    constraints: constraintAnalysis.activeConstraints,
    materialOptions: inputs.context?.materials,
    manufacturingOptions: inputs.context?.manufacturing
  });

  // Phase 7: Detail Design and Specification
  const detailDesign = await ctx.task(developDetailDesignTask, {
    embodiment: embodimentDesign.preliminaryLayout,
    tolerances: inputs.requirements?.tolerances,
    interfaces: embodimentDesign.interfaceSpecifications,
    standards: inputs.constraints?.standards
  });

  // Phase 8: Tradeoff Analysis
  const tradeoffAnalysis = await ctx.task(analyzeTradeoffsTask, {
    designSolution: detailDesign,
    requirements: requirementsAnalysis.prioritizedRequirements,
    constraints: constraintAnalysis.activeConstraints,
    alternatives: conceptEvaluation.topConcepts
  });

  // Phase 9: Risk and Failure Mode Analysis
  const riskAnalysis = await ctx.task(analyzeDesignRisksTask, {
    designSolution: detailDesign,
    operatingConditions: inputs.context?.operatingConditions,
    safetyRequirements: inputs.requirements?.safety,
    reliabilityTargets: inputs.requirements?.reliability
  });

  // Quality Gate: Risk Acceptability
  if (riskAnalysis.unacceptableRisks.length > 0) {
    await ctx.breakpoint('risk-mitigation-required', {
      message: 'Design has unacceptable risk levels',
      criticalRisks: riskAnalysis.unacceptableRisks,
      mitigationOptions: riskAnalysis.mitigationStrategies
    });
  }

  // Phase 10: Validation Planning
  const validationPlan = await ctx.task(planValidationTask, {
    designSolution: detailDesign,
    requirements: requirementsAnalysis.prioritizedRequirements,
    riskAreas: riskAnalysis.highRiskAreas,
    testingResources: inputs.constraints?.testingResources
  });

  return {
    success: true,
    reasoningType: 'Engineering Design',
    designSolution: {
      concept: conceptEvaluation.bestConcept,
      embodiment: embodimentDesign.preliminaryLayout,
      detailedDesign: detailDesign.finalSpecifications,
      functionStructure: functionStructure.functionalDecomposition
    },
    specifications: {
      functional: detailDesign.functionalSpecifications,
      geometric: detailDesign.geometricSpecifications,
      material: detailDesign.materialSpecifications,
      interface: detailDesign.interfaceSpecifications,
      tolerance: detailDesign.toleranceSpecifications
    },
    tradeoffAnalysis: {
      parameterTradeoffs: tradeoffAnalysis.parameterTradeoffs,
      paretoFrontier: tradeoffAnalysis.paretoAnalysis,
      sensitivityAnalysis: tradeoffAnalysis.sensitivityResults,
      decisionRationale: tradeoffAnalysis.decisionJustification
    },
    riskAssessment: {
      identifiedRisks: riskAnalysis.identifiedRisks,
      fmeaResults: riskAnalysis.fmeaAnalysis,
      mitigations: riskAnalysis.implementedMitigations
    },
    validationPlan: {
      testMatrix: validationPlan.testMatrix,
      acceptanceCriteria: validationPlan.acceptanceCriteria,
      prototypingPlan: validationPlan.prototypingStrategy
    },
    recommendations: [
      ...conceptEvaluation.recommendations,
      ...riskAnalysis.recommendations,
      ...validationPlan.recommendations
    ],
    confidence: conceptEvaluation.bestConcept.overallScore
  };
}

export const analyzeRequirementsTask = defineTask('engineering-requirements-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1: Requirements Analysis',
  skill: { name: 'triz-inventive-solver' },
  agent: {
    name: 'design-engineer',
    skills: ['triz-inventive-solver', 'hypothesis-generator', 'systems-dynamics-modeler'],
    prompt: {
      role: 'Systems engineer and requirements analyst',
      task: 'Analyze and prioritize design requirements',
      context: args,
      instructions: [
        'Clarify and decompose the design problem',
        'Identify functional and non-functional requirements',
        'Establish requirement priorities and weightings',
        'Define acceptance criteria for each requirement',
        'Identify conflicts between requirements',
        'Create evaluation criteria matrix'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['prioritizedRequirements', 'evaluationCriteria'],
      properties: {
        prioritizedRequirements: { type: 'array' },
        evaluationCriteria: { type: 'array' },
        requirementConflicts: { type: 'array' },
        acceptanceCriteria: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['engineering-design', 'requirements']
}));

export const analyzeConstraintsTask = defineTask('engineering-constraint-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2: Constraint Analysis',
  skill: { name: 'triz-inventive-solver' },
  agent: {
    name: 'design-engineer',
    skills: ['triz-inventive-solver', 'hypothesis-generator', 'systems-dynamics-modeler'],
    prompt: {
      role: 'Engineering constraints and feasibility specialist',
      task: 'Analyze design constraints and their implications',
      context: args,
      instructions: [
        'Categorize all constraints (hard vs soft)',
        'Assess constraint interactions',
        'Identify constraint-driven design decisions',
        'Evaluate regulatory compliance requirements',
        'Document resource limitations',
        'Determine design space boundaries'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['activeConstraints', 'designSpaceBoundaries'],
      properties: {
        activeConstraints: { type: 'array' },
        hardConstraints: { type: 'array' },
        softConstraints: { type: 'array' },
        designSpaceBoundaries: { type: 'object' },
        constraintInteractions: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['engineering-design', 'constraints']
}));

export const developFunctionStructureTask = defineTask('engineering-function-structure', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: Function Structure Development',
  skill: { name: 'triz-inventive-solver' },
  agent: {
    name: 'design-engineer',
    skills: ['triz-inventive-solver', 'hypothesis-generator', 'systems-dynamics-modeler'],
    prompt: {
      role: 'Functional analysis and system decomposition specialist',
      task: 'Develop function structure through systematic decomposition',
      context: args,
      instructions: [
        'Define overall system function',
        'Decompose into sub-functions',
        'Identify function flows (energy, material, signal)',
        'Establish function interfaces',
        'Create function structure diagram',
        'Identify critical function paths'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['functionalDecomposition', 'functionFlows'],
      properties: {
        overallFunction: { type: 'string' },
        functionalDecomposition: { type: 'object' },
        functionFlows: { type: 'array' },
        interfaces: { type: 'array' },
        criticalPaths: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['engineering-design', 'function-structure']
}));

export const generateConceptsTask = defineTask('engineering-concept-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: Concept Generation',
  skill: { name: 'triz-inventive-solver' },
  agent: {
    name: 'design-engineer',
    skills: ['triz-inventive-solver', 'hypothesis-generator', 'systems-dynamics-modeler'],
    prompt: {
      role: 'Creative engineering and TRIZ specialist',
      task: 'Generate diverse design concepts using systematic methods',
      context: args,
      instructions: [
        'Apply morphological analysis to function structure',
        'Use TRIZ principles for inventive solutions',
        'Consider biomimetic approaches',
        'Explore existing solutions and adaptations',
        'Generate concept variants through combination',
        'Document concept rationale and novelty'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['generatedConcepts', 'morphologicalMatrix'],
      properties: {
        generatedConcepts: { type: 'array' },
        morphologicalMatrix: { type: 'object' },
        trizApplications: { type: 'array' },
        conceptRationales: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['engineering-design', 'concept-generation']
}));

export const evaluateConceptsTask = defineTask('engineering-concept-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Concept Evaluation',
  skill: { name: 'triz-inventive-solver' },
  agent: {
    name: 'design-engineer',
    skills: ['triz-inventive-solver', 'hypothesis-generator', 'systems-dynamics-modeler'],
    prompt: {
      role: 'Design evaluation and decision-making specialist',
      task: 'Evaluate and select best design concept',
      context: args,
      instructions: [
        'Apply Pugh matrix evaluation',
        'Assess technical feasibility of each concept',
        'Evaluate against weighted criteria',
        'Identify hybrid concept opportunities',
        'Rank concepts with justification',
        'Recommend improvements for top concepts'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['bestConcept', 'rankings', 'topConcepts'],
      properties: {
        bestConcept: { type: 'object' },
        topConcepts: { type: 'array' },
        rankings: { type: 'array' },
        pughMatrix: { type: 'object' },
        improvementDirections: { type: 'array' },
        recommendations: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['engineering-design', 'concept-evaluation']
}));

export const developEmbodimentTask = defineTask('engineering-embodiment-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6: Embodiment Design',
  skill: { name: 'triz-inventive-solver' },
  agent: {
    name: 'design-engineer',
    skills: ['triz-inventive-solver', 'hypothesis-generator', 'systems-dynamics-modeler'],
    prompt: {
      role: 'Mechanical design and embodiment specialist',
      task: 'Develop preliminary layout and form design',
      context: args,
      instructions: [
        'Develop preliminary layout and arrangement',
        'Select materials and processes',
        'Define component interfaces',
        'Establish spatial relationships',
        'Consider assembly and maintenance',
        'Optimize for manufacturing'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['preliminaryLayout', 'materialSelections', 'interfaceSpecifications'],
      properties: {
        preliminaryLayout: { type: 'object' },
        materialSelections: { type: 'array' },
        processSelections: { type: 'array' },
        interfaceSpecifications: { type: 'array' },
        assemblyConsiderations: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['engineering-design', 'embodiment']
}));

export const developDetailDesignTask = defineTask('engineering-detail-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: Detail Design',
  skill: { name: 'triz-inventive-solver' },
  agent: {
    name: 'design-engineer',
    skills: ['triz-inventive-solver', 'hypothesis-generator', 'systems-dynamics-modeler'],
    prompt: {
      role: 'Detail design and specification specialist',
      task: 'Develop detailed specifications and documentation',
      context: args,
      instructions: [
        'Define detailed dimensions and tolerances',
        'Specify surface finishes and treatments',
        'Document material specifications',
        'Create interface control documents',
        'Specify fasteners and connections',
        'Develop manufacturing documentation'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['finalSpecifications', 'geometricSpecifications'],
      properties: {
        finalSpecifications: { type: 'object' },
        functionalSpecifications: { type: 'object' },
        geometricSpecifications: { type: 'object' },
        materialSpecifications: { type: 'object' },
        interfaceSpecifications: { type: 'object' },
        toleranceSpecifications: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['engineering-design', 'detail-design']
}));

export const analyzeTradeoffsTask = defineTask('engineering-tradeoff-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 8: Tradeoff Analysis',
  skill: { name: 'triz-inventive-solver' },
  agent: {
    name: 'design-engineer',
    skills: ['triz-inventive-solver', 'hypothesis-generator', 'systems-dynamics-modeler'],
    prompt: {
      role: 'Systems optimization and tradeoff analysis specialist',
      task: 'Analyze design tradeoffs and optimization opportunities',
      context: args,
      instructions: [
        'Identify key parameter tradeoffs',
        'Perform Pareto analysis',
        'Conduct sensitivity analysis',
        'Document design decisions and rationale',
        'Identify optimization opportunities',
        'Quantify tradeoff impacts'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['parameterTradeoffs', 'paretoAnalysis', 'decisionJustification'],
      properties: {
        parameterTradeoffs: { type: 'array' },
        paretoAnalysis: { type: 'object' },
        sensitivityResults: { type: 'object' },
        decisionJustification: { type: 'string' },
        optimizationOpportunities: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['engineering-design', 'tradeoffs']
}));

export const analyzeDesignRisksTask = defineTask('engineering-risk-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 9: Risk and FMEA Analysis',
  skill: { name: 'triz-inventive-solver' },
  agent: {
    name: 'design-engineer',
    skills: ['triz-inventive-solver', 'hypothesis-generator', 'systems-dynamics-modeler'],
    prompt: {
      role: 'Reliability engineer and FMEA specialist',
      task: 'Analyze design risks and failure modes',
      context: args,
      instructions: [
        'Conduct FMEA analysis',
        'Identify critical failure modes',
        'Assess risk severity and probability',
        'Develop mitigation strategies',
        'Evaluate safety margins',
        'Document risk acceptance rationale'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['identifiedRisks', 'fmeaAnalysis', 'unacceptableRisks'],
      properties: {
        identifiedRisks: { type: 'array' },
        fmeaAnalysis: { type: 'object' },
        unacceptableRisks: { type: 'array' },
        highRiskAreas: { type: 'array' },
        mitigationStrategies: { type: 'array' },
        implementedMitigations: { type: 'array' },
        recommendations: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['engineering-design', 'risk-analysis', 'fmea']
}));

export const planValidationTask = defineTask('engineering-validation-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 10: Validation Planning',
  skill: { name: 'triz-inventive-solver' },
  agent: {
    name: 'design-engineer',
    skills: ['triz-inventive-solver', 'hypothesis-generator', 'systems-dynamics-modeler'],
    prompt: {
      role: 'Test engineering and validation specialist',
      task: 'Develop comprehensive validation and test plan',
      context: args,
      instructions: [
        'Create requirements-to-test traceability matrix',
        'Define test procedures and protocols',
        'Specify acceptance criteria',
        'Plan prototyping strategy',
        'Identify test resources and equipment',
        'Develop test schedule and milestones'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['testMatrix', 'acceptanceCriteria', 'prototypingStrategy'],
      properties: {
        testMatrix: { type: 'object' },
        acceptanceCriteria: { type: 'object' },
        prototypingStrategy: { type: 'object' },
        testProcedures: { type: 'array' },
        resourceRequirements: { type: 'object' },
        recommendations: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['engineering-design', 'validation']
}));
