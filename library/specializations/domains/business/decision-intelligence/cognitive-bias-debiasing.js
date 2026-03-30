/**
 * @process specializations/domains/business/decision-intelligence/cognitive-bias-debiasing
 * @description Cognitive Bias Debiasing Process - Structured approach to identifying and mitigating cognitive biases
 * in organizational decision-making using behavioral economics principles.
 * @inputs { projectName: string, decisionContext: object, decisionMakers: array, highStakesIndicators?: object }
 * @outputs { success: boolean, biasAssessment: object, mitigationStrategies: array, debiasingProtocol: object, implementationPlan: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/decision-intelligence/cognitive-bias-debiasing', {
 *   projectName: 'Investment Committee Bias Assessment',
 *   decisionContext: { type: 'investment', stakes: 'high', frequency: 'recurring' },
 *   decisionMakers: ['CIO', 'Portfolio Managers', 'Risk Committee']
 * });
 *
 * @references
 * - Thinking, Fast and Slow: https://www.penguinrandomhouse.com/books/89308/thinking-fast-and-slow-by-daniel-kahneman/
 * - Behavioral Economics in Organizations
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    decisionContext = {},
    decisionMakers = [],
    highStakesIndicators = {},
    outputDir = 'debiasing-output'
  } = inputs;

  // Phase 1: Decision Environment Assessment
  const environmentAssessment = await ctx.task(environmentAssessmentTask, {
    projectName,
    decisionContext,
    decisionMakers
  });

  // Phase 2: Bias Vulnerability Analysis
  const biasVulnerability = await ctx.task(biasVulnerabilityTask, {
    projectName,
    decisionContext,
    environmentAssessment
  });

  // Phase 3: Historical Bias Pattern Analysis
  const historicalPatterns = await ctx.task(historicalPatternsTask, {
    projectName,
    decisionContext,
    biasVulnerability
  });

  // Phase 4: Specific Bias Identification
  const biasIdentification = await ctx.task(biasIdentificationTask, {
    projectName,
    biasVulnerability,
    historicalPatterns,
    decisionContext
  });

  // Breakpoint: Review bias assessment
  await ctx.breakpoint({
    question: `Review cognitive bias assessment for ${projectName}. Are the identified biases accurate?`,
    title: 'Bias Assessment Review',
    context: {
      runId: ctx.runId,
      projectName,
      biasCount: biasIdentification.identifiedBiases?.length || 0
    }
  });

  // Phase 5: Mitigation Strategy Development
  const mitigationStrategies = await ctx.task(mitigationStrategiesTask, {
    projectName,
    biasIdentification,
    decisionMakers,
    decisionContext
  });

  // Phase 6: Debiasing Protocol Design
  const debiasingProtocol = await ctx.task(debiasingProtocolTask, {
    projectName,
    mitigationStrategies,
    decisionContext,
    decisionMakers
  });

  // Phase 7: Training and Awareness Plan
  const trainingPlan = await ctx.task(biasTrainingPlanTask, {
    projectName,
    biasIdentification,
    mitigationStrategies,
    decisionMakers
  });

  // Phase 8: Monitoring and Effectiveness
  const monitoringPlan = await ctx.task(biasMonitoringTask, {
    projectName,
    debiasingProtocol,
    biasIdentification
  });

  return {
    success: true,
    projectName,
    environmentAssessment,
    biasAssessment: {
      vulnerability: biasVulnerability,
      historicalPatterns,
      identified: biasIdentification
    },
    mitigationStrategies: mitigationStrategies.strategies,
    debiasingProtocol,
    trainingPlan,
    implementationPlan: monitoringPlan,
    metadata: {
      processId: 'specializations/domains/business/decision-intelligence/cognitive-bias-debiasing',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const environmentAssessmentTask = defineTask('environment-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Decision Environment Assessment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Behavioral Decision Analyst',
      task: 'Assess decision-making environment for bias risk',
      context: args,
      instructions: [
        '1. Assess decision complexity and uncertainty',
        '2. Evaluate time pressure and stress factors',
        '3. Identify information overload risks',
        '4. Assess group dynamics and hierarchy',
        '5. Evaluate incentive structures',
        '6. Identify emotional factors',
        '7. Assess feedback loop quality',
        '8. Document environmental risk factors'
      ],
      outputFormat: 'JSON object with environment assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['riskFactors', 'complexity', 'dynamics'],
      properties: {
        riskFactors: { type: 'array' },
        complexity: { type: 'object' },
        pressure: { type: 'object' },
        dynamics: { type: 'object' },
        incentives: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'debiasing', 'environment']
}));

export const biasVulnerabilityTask = defineTask('bias-vulnerability', (args, taskCtx) => ({
  kind: 'agent',
  title: `Bias Vulnerability Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Cognitive Bias Expert',
      task: 'Analyze vulnerability to specific cognitive biases',
      context: args,
      instructions: [
        '1. Assess confirmation bias vulnerability',
        '2. Evaluate overconfidence risk',
        '3. Analyze anchoring susceptibility',
        '4. Assess availability bias exposure',
        '5. Evaluate groupthink risk',
        '6. Analyze sunk cost fallacy exposure',
        '7. Assess status quo bias',
        '8. Create vulnerability heat map'
      ],
      outputFormat: 'JSON object with bias vulnerability analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'riskLevels', 'heatMap'],
      properties: {
        vulnerabilities: { type: 'array' },
        riskLevels: { type: 'object' },
        heatMap: { type: 'object' },
        priorityBiases: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'debiasing', 'vulnerability']
}));

export const historicalPatternsTask = defineTask('historical-patterns', (args, taskCtx) => ({
  kind: 'agent',
  title: `Historical Bias Pattern Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Decision Pattern Analyst',
      task: 'Analyze historical decision patterns for bias evidence',
      context: args,
      instructions: [
        '1. Review past decision outcomes',
        '2. Identify systematic errors',
        '3. Analyze prediction accuracy',
        '4. Identify overconfidence patterns',
        '5. Detect anchoring evidence',
        '6. Analyze loss aversion patterns',
        '7. Identify groupthink indicators',
        '8. Document historical bias patterns'
      ],
      outputFormat: 'JSON object with historical patterns'
    },
    outputSchema: {
      type: 'object',
      required: ['patterns', 'errors', 'evidence'],
      properties: {
        patterns: { type: 'array' },
        systematicErrors: { type: 'array' },
        predictionAccuracy: { type: 'object' },
        evidence: { type: 'object' },
        lessons: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'debiasing', 'historical']
}));

export const biasIdentificationTask = defineTask('bias-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Specific Bias Identification - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Bias Identification Specialist',
      task: 'Identify specific biases present in decision process',
      context: args,
      instructions: [
        '1. Test for confirmation bias indicators',
        '2. Assess overconfidence calibration',
        '3. Identify anchoring influences',
        '4. Detect availability heuristic use',
        '5. Identify hindsight bias',
        '6. Assess planning fallacy risk',
        '7. Identify framing effects',
        '8. Document identified biases with evidence'
      ],
      outputFormat: 'JSON object with identified biases'
    },
    outputSchema: {
      type: 'object',
      required: ['identifiedBiases', 'evidence', 'severity'],
      properties: {
        identifiedBiases: { type: 'array' },
        evidence: { type: 'object' },
        severity: { type: 'object' },
        impactAssessment: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'debiasing', 'identification']
}));

export const mitigationStrategiesTask = defineTask('mitigation-strategies', (args, taskCtx) => ({
  kind: 'agent',
  title: `Mitigation Strategy Development - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Debiasing Strategy Expert',
      task: 'Develop mitigation strategies for identified biases',
      context: args,
      instructions: [
        '1. Select evidence-based debiasing techniques',
        '2. Design pre-mortem exercises',
        '3. Create devil\'s advocate protocols',
        '4. Design reference class forecasting',
        '5. Create red team processes',
        '6. Design structured decision protocols',
        '7. Create accountability mechanisms',
        '8. Match strategies to specific biases'
      ],
      outputFormat: 'JSON object with mitigation strategies'
    },
    outputSchema: {
      type: 'object',
      required: ['strategies', 'techniques', 'mapping'],
      properties: {
        strategies: { type: 'array' },
        techniques: { type: 'array' },
        preMortem: { type: 'object' },
        devilsAdvocate: { type: 'object' },
        mapping: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'debiasing', 'mitigation']
}));

export const debiasingProtocolTask = defineTask('debiasing-protocol', (args, taskCtx) => ({
  kind: 'agent',
  title: `Debiasing Protocol Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Debiasing Protocol Designer',
      task: 'Design comprehensive debiasing protocol',
      context: args,
      instructions: [
        '1. Design pre-decision checklist',
        '2. Create decision meeting protocols',
        '3. Design information gathering protocols',
        '4. Create deliberation guidelines',
        '5. Design dissent encouragement mechanisms',
        '6. Create post-decision review process',
        '7. Design feedback integration',
        '8. Document protocol steps and roles'
      ],
      outputFormat: 'JSON object with debiasing protocol'
    },
    outputSchema: {
      type: 'object',
      required: ['protocol', 'checklists', 'guidelines'],
      properties: {
        protocol: { type: 'object' },
        checklists: { type: 'array' },
        meetingProtocol: { type: 'object' },
        deliberationGuidelines: { type: 'object' },
        guidelines: { type: 'array' },
        roles: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'debiasing', 'protocol']
}));

export const biasTrainingPlanTask = defineTask('bias-training-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Training and Awareness Plan - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Bias Awareness Trainer',
      task: 'Develop bias awareness training plan',
      context: args,
      instructions: [
        '1. Design bias awareness curriculum',
        '2. Create experiential exercises',
        '3. Develop case study materials',
        '4. Design calibration training',
        '5. Create self-assessment tools',
        '6. Plan ongoing reinforcement',
        '7. Design coaching program',
        '8. Create measurement framework'
      ],
      outputFormat: 'JSON object with training plan'
    },
    outputSchema: {
      type: 'object',
      required: ['curriculum', 'exercises', 'materials'],
      properties: {
        curriculum: { type: 'array' },
        exercises: { type: 'array' },
        caseStudies: { type: 'array' },
        materials: { type: 'array' },
        coaching: { type: 'object' },
        measurement: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'debiasing', 'training']
}));

export const biasMonitoringTask = defineTask('bias-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Monitoring and Effectiveness - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Debiasing Effectiveness Monitor',
      task: 'Design monitoring and effectiveness measurement',
      context: args,
      instructions: [
        '1. Define effectiveness metrics',
        '2. Design outcome tracking',
        '3. Create calibration assessments',
        '4. Plan periodic bias audits',
        '5. Design protocol compliance monitoring',
        '6. Create feedback mechanisms',
        '7. Plan continuous improvement',
        '8. Document implementation plan'
      ],
      outputFormat: 'JSON object with monitoring plan'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'tracking', 'audits'],
      properties: {
        metrics: { type: 'array' },
        tracking: { type: 'object' },
        calibration: { type: 'object' },
        audits: { type: 'object' },
        feedback: { type: 'object' },
        improvement: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'debiasing', 'monitoring']
}));
