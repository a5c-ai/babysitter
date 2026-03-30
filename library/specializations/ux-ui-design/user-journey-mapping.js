/**
 * @process specializations/ux-ui-design/user-journey-mapping
 * @description User Journey Mapping - Document complete user experience across all touchpoints over time;
 * identify stages, touchpoints, actions, thoughts, emotions, pain points, and opportunities for improvement.
 * @category Research & Discovery
 * @priority High
 * @complexity Medium
 * @inputs { product: string, personas: array, researchData?: object, journeyScope: string, targetPersona?: string, tools?: array }
 * @outputs { success: boolean, journeyMapsCreated: number, painPointsIdentified: number, opportunitiesCount: number, improvementPriorities: array }
 *
 * @example
 * const result = await orchestrate('specializations/ux-ui-design/user-journey-mapping', {
 *   product: 'E-commerce Mobile App',
 *   personas: [
 *     { name: 'Sarah', role: 'Busy Professional', goals: ['Quick purchases', 'Save time'] },
 *     { name: 'Mike', role: 'Deal Hunter', goals: ['Find best prices', 'Compare products'] }
 *   ],
 *   journeyScope: 'end-to-end',
 *   targetPersona: 'Sarah',
 *   researchData: {
 *     interviews: ['interview-001.json', 'interview-002.json'],
 *     analytics: 'user-behavior-data.json',
 *     surveys: 'customer-satisfaction-survey.json'
 *   },
 *   tools: ['Smaply', 'Miro', 'Figma'],
 *   qualityTargets: { minPainPoints: 8, minOpportunities: 5, minTouchpoints: 10 }
 * });
 *
 * @references
 * - Journey Map Components: references.md lines 248-269
 * - Journey Map Types: references.md lines 258-264
 * - Journey Mapping Tools: references.md lines 265-269
 * - User Research Methods: references.md lines 146-173
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    product = 'Product',
    personas = [],
    researchData = {},
    journeyScope = 'end-to-end', // end-to-end, specific-task, day-in-life
    targetPersona = null,
    tools = ['Miro', 'Figma'],
    qualityTargets = {
      minPainPoints: 8,
      minOpportunities: 5,
      minTouchpoints: 10,
      emotionalVarianceThreshold: 3, // range of emotions (1-10 scale)
      minStages: 4
    },
    outputDir = 'user-journey-mapping-output',
    includeServiceBlueprint = false,
    includeFutureState = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let journeyMapsCreated = 0;
  let painPointsIdentified = 0;
  let opportunitiesCount = 0;

  ctx.log('info', `Starting User Journey Mapping for ${product}`);
  ctx.log('info', `Scope: ${journeyScope}, Personas: ${personas.length}, Target: ${targetPersona || 'All personas'}`);

  // ============================================================================
  // PHASE 1: RESEARCH SYNTHESIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Synthesizing research data and user insights');

  const researchSynthesis = await ctx.task(researchSynthesisTask, {
    product,
    personas,
    researchData,
    journeyScope,
    targetPersona,
    outputDir
  });

  if (!researchSynthesis.success || !researchSynthesis.synthesizedInsights) {
    return {
      success: false,
      error: 'Failed to synthesize research data',
      details: researchSynthesis,
      metadata: {
        processId: 'specializations/ux-ui-design/user-journey-mapping',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...researchSynthesis.artifacts);

  // Quality Gate: Research completeness
  const insightQuality = researchSynthesis.insightQualityScore || 0;
  if (insightQuality < 70) {
    await ctx.breakpoint({
      question: `Research synthesis quality: ${insightQuality}%. Low quality may result in incomplete journey maps. Review research data and approve to continue or provide additional research?`,
      title: 'Research Quality Review',
      context: {
        runId: ctx.runId,
        insightQuality,
        synthesizedInsights: researchSynthesis.synthesizedInsights,
        dataSourcesCovered: researchSynthesis.dataSourcesCovered,
        missingData: researchSynthesis.missingData,
        recommendation: 'Consider conducting additional user interviews or analytics review',
        files: researchSynthesis.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 2: JOURNEY STAGES DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 2: Defining journey stages and structure');

  const stagesDefinition = await ctx.task(stagesDefinitionTask, {
    product,
    journeyScope,
    targetPersona: targetPersona || personas[0]?.name,
    synthesizedInsights: researchSynthesis.synthesizedInsights,
    qualityTargets,
    outputDir
  });

  artifacts.push(...stagesDefinition.artifacts);

  // Quality Gate: Minimum stages coverage
  if (stagesDefinition.stages.length < qualityTargets.minStages) {
    await ctx.breakpoint({
      question: `Only ${stagesDefinition.stages.length} stages defined. Minimum recommended: ${qualityTargets.minStages}. Journey may lack detail. Review and approve stages?`,
      title: 'Journey Stages Review',
      context: {
        runId: ctx.runId,
        stagesDefined: stagesDefinition.stages.length,
        minRequired: qualityTargets.minStages,
        stages: stagesDefinition.stages.map(s => ({ name: s.name, description: s.description })),
        recommendation: 'Consider breaking down stages into more granular phases',
        files: stagesDefinition.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown', label: a.label }))
      }
    });
  }

  await ctx.checkpoint({
    title: 'Phase 2: Journey Stages Defined',
    message: `${stagesDefinition.stages.length} stages defined for ${journeyScope} journey`,
    context: {
      runId: ctx.runId,
      stagesCount: stagesDefinition.stages.length,
      stages: stagesDefinition.stages,
      files: stagesDefinition.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 3: TOUCHPOINT IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Identifying touchpoints across all stages');

  const touchpointMapping = await ctx.task(touchpointMappingTask, {
    product,
    stages: stagesDefinition.stages,
    synthesizedInsights: researchSynthesis.synthesizedInsights,
    qualityTargets,
    outputDir
  });

  artifacts.push(...touchpointMapping.artifacts);

  // Quality Gate: Minimum touchpoints
  const totalTouchpoints = touchpointMapping.touchpointsByStage.reduce((sum, stage) => sum + stage.touchpoints.length, 0);
  if (totalTouchpoints < qualityTargets.minTouchpoints) {
    await ctx.breakpoint({
      question: `Only ${totalTouchpoints} touchpoints identified. Minimum recommended: ${qualityTargets.minTouchpoints}. This may result in incomplete journey understanding. Continue or add more touchpoints?`,
      title: 'Touchpoint Coverage Review',
      context: {
        runId: ctx.runId,
        totalTouchpoints,
        minRequired: qualityTargets.minTouchpoints,
        touchpointsByStage: touchpointMapping.touchpointsByStage,
        recommendation: 'Consider all digital and physical touchpoints, support interactions, and third-party integrations',
        files: touchpointMapping.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 4: USER ACTIONS DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Documenting user actions at each touchpoint');

  const actionsDocumentation = await ctx.task(actionsDocumentationTask, {
    product,
    stages: stagesDefinition.stages,
    touchpoints: touchpointMapping.touchpointsByStage,
    synthesizedInsights: researchSynthesis.synthesizedInsights,
    outputDir
  });

  artifacts.push(...actionsDocumentation.artifacts);

  await ctx.checkpoint({
    title: 'Phase 4: User Actions Documented',
    message: `${actionsDocumentation.totalActions} user actions documented across journey`,
    context: {
      runId: ctx.runId,
      totalActions: actionsDocumentation.totalActions,
      actionsByStage: actionsDocumentation.actionsByStage,
      files: actionsDocumentation.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 5: THOUGHTS AND EMOTIONS MAPPING
  // ============================================================================

  ctx.log('info', 'Phase 5: Mapping user thoughts and emotions throughout journey');

  const emotionalMapping = await ctx.task(emotionalMappingTask, {
    product,
    stages: stagesDefinition.stages,
    touchpoints: touchpointMapping.touchpointsByStage,
    actions: actionsDocumentation.actionsByStage,
    synthesizedInsights: researchSynthesis.synthesizedInsights,
    qualityTargets,
    outputDir
  });

  artifacts.push(...emotionalMapping.artifacts);

  // Quality Gate: Emotional variance (indicates rich journey with highs and lows)
  const emotionalVariance = emotionalMapping.emotionalVariance || 0;
  if (emotionalVariance < qualityTargets.emotionalVarianceThreshold) {
    await ctx.breakpoint({
      question: `Emotional variance is ${emotionalVariance} (scale 1-10). Low variance may indicate lack of emotional depth or missing critical pain/delight moments. Review emotional mapping?`,
      title: 'Emotional Journey Review',
      context: {
        runId: ctx.runId,
        emotionalVariance,
        thresholdRequired: qualityTargets.emotionalVarianceThreshold,
        emotionalCurve: emotionalMapping.emotionalCurve,
        highPoints: emotionalMapping.emotionalHighPoints,
        lowPoints: emotionalMapping.emotionalLowPoints,
        recommendation: 'Deep dive into user research for emotional reactions at each stage',
        files: emotionalMapping.artifacts.map(a => ({ path: a.path, format: a.format || 'html', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 6: PAIN POINTS IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Identifying and categorizing pain points');

  const painPointsAnalysis = await ctx.task(painPointsAnalysisTask, {
    product,
    stages: stagesDefinition.stages,
    touchpoints: touchpointMapping.touchpointsByStage,
    actions: actionsDocumentation.actionsByStage,
    emotions: emotionalMapping.emotionalCurve,
    synthesizedInsights: researchSynthesis.synthesizedInsights,
    qualityTargets,
    outputDir
  });

  artifacts.push(...painPointsAnalysis.artifacts);
  painPointsIdentified = painPointsAnalysis.totalPainPoints;

  // Quality Gate: Minimum pain points
  if (painPointsIdentified < qualityTargets.minPainPoints) {
    await ctx.breakpoint({
      question: `Only ${painPointsIdentified} pain points identified. Minimum recommended: ${qualityTargets.minPainPoints}. Additional research may be needed. Review pain points and approve?`,
      title: 'Pain Points Coverage Review',
      context: {
        runId: ctx.runId,
        painPointsIdentified,
        minRequired: qualityTargets.minPainPoints,
        painPointsBySeverity: painPointsAnalysis.painPointsBySeverity,
        painPointsByStage: painPointsAnalysis.painPointsByStage,
        topPainPoints: painPointsAnalysis.topPainPoints,
        recommendation: 'Conduct additional user interviews focused on frustrations and obstacles',
        files: painPointsAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 7: OPPORTUNITIES IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Identifying improvement opportunities');

  const opportunitiesIdentification = await ctx.task(opportunitiesIdentificationTask, {
    product,
    stages: stagesDefinition.stages,
    painPoints: painPointsAnalysis.allPainPoints,
    emotionalLowPoints: emotionalMapping.emotionalLowPoints,
    touchpoints: touchpointMapping.touchpointsByStage,
    synthesizedInsights: researchSynthesis.synthesizedInsights,
    qualityTargets,
    outputDir
  });

  artifacts.push(...opportunitiesIdentification.artifacts);
  opportunitiesCount = opportunitiesIdentification.totalOpportunities;

  // Quality Gate: Minimum opportunities
  if (opportunitiesCount < qualityTargets.minOpportunities) {
    await ctx.breakpoint({
      question: `Only ${opportunitiesCount} opportunities identified. Minimum recommended: ${qualityTargets.minOpportunities}. More opportunities may exist. Review and approve?`,
      title: 'Opportunities Coverage Review',
      context: {
        runId: ctx.runId,
        opportunitiesCount,
        minRequired: qualityTargets.minOpportunities,
        opportunitiesByImpact: opportunitiesIdentification.opportunitiesByImpact,
        opportunitiesByStage: opportunitiesIdentification.opportunitiesByStage,
        topOpportunities: opportunitiesIdentification.topOpportunities,
        recommendation: 'Consider ideation workshop to generate more improvement opportunities',
        files: opportunitiesIdentification.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 8: CURRENT STATE JOURNEY MAP CREATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Creating current state journey map');

  const currentStateMap = await ctx.task(currentStateMapCreationTask, {
    product,
    persona: targetPersona || personas[0],
    stages: stagesDefinition.stages,
    touchpoints: touchpointMapping.touchpointsByStage,
    actions: actionsDocumentation.actionsByStage,
    emotions: emotionalMapping.emotionalCurve,
    thoughts: emotionalMapping.thoughtsByStage,
    painPoints: painPointsAnalysis.allPainPoints,
    opportunities: opportunitiesIdentification.allOpportunities,
    tools,
    outputDir
  });

  artifacts.push(...currentStateMap.artifacts);
  journeyMapsCreated++;

  await ctx.checkpoint({
    title: 'Phase 8: Current State Journey Map Created',
    message: `Current state journey map created with ${painPointsIdentified} pain points and ${opportunitiesCount} opportunities`,
    context: {
      runId: ctx.runId,
      mapType: 'current-state',
      stagesCount: stagesDefinition.stages.length,
      touchpointsCount: totalTouchpoints,
      painPointsCount: painPointsIdentified,
      opportunitiesCount: opportunitiesCount,
      files: currentStateMap.artifacts.map(a => ({ path: a.path, format: a.format || 'html', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 9: FUTURE STATE JOURNEY MAP (OPTIONAL)
  // ============================================================================

  let futureStateMap = null;
  if (includeFutureState) {
    ctx.log('info', 'Phase 9: Creating future state journey map');

    futureStateMap = await ctx.task(futureStateMapCreationTask, {
      product,
      persona: targetPersona || personas[0],
      currentStateMap: currentStateMap.journeyMapData,
      opportunities: opportunitiesIdentification.allOpportunities,
      prioritizedImprovements: opportunitiesIdentification.topOpportunities,
      tools,
      outputDir
    });

    artifacts.push(...futureStateMap.artifacts);
    journeyMapsCreated++;

    await ctx.checkpoint({
      title: 'Phase 9: Future State Journey Map Created',
      message: `Future state journey map created showing improved experience with ${futureStateMap.improvementsApplied} improvements`,
      context: {
        runId: ctx.runId,
        mapType: 'future-state',
        improvementsApplied: futureStateMap.improvementsApplied,
        expectedEmotionalImprovement: futureStateMap.expectedEmotionalImprovement,
        reducedPainPoints: futureStateMap.reducedPainPoints,
        files: futureStateMap.artifacts.map(a => ({ path: a.path, format: a.format || 'html', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 10: SERVICE BLUEPRINT (OPTIONAL)
  // ============================================================================

  let serviceBlueprint = null;
  if (includeServiceBlueprint) {
    ctx.log('info', 'Phase 10: Creating service blueprint with backstage processes');

    serviceBlueprint = await ctx.task(serviceBlueprintCreationTask, {
      product,
      currentStateMap: currentStateMap.journeyMapData,
      touchpoints: touchpointMapping.touchpointsByStage,
      outputDir
    });

    artifacts.push(...serviceBlueprint.artifacts);

    await ctx.checkpoint({
      title: 'Phase 10: Service Blueprint Created',
      message: `Service blueprint created showing ${serviceBlueprint.backstageProcesses} backstage processes`,
      context: {
        runId: ctx.runId,
        backstageProcesses: serviceBlueprint.backstageProcesses,
        supportProcesses: serviceBlueprint.supportProcesses,
        systemInteractions: serviceBlueprint.systemInteractions,
        files: serviceBlueprint.artifacts.map(a => ({ path: a.path, format: a.format || 'html', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 11: PRIORITIZATION FRAMEWORK
  // ============================================================================

  ctx.log('info', 'Phase 11: Prioritizing improvements and opportunities');

  const prioritizationFramework = await ctx.task(prioritizationTask, {
    product,
    opportunities: opportunitiesIdentification.allOpportunities,
    painPoints: painPointsAnalysis.allPainPoints,
    emotionalImpact: emotionalMapping.emotionalCurve,
    qualityTargets,
    outputDir
  });

  artifacts.push(...prioritizationFramework.artifacts);

  await ctx.checkpoint({
    title: 'Phase 11: Prioritization Framework Complete',
    message: `${prioritizationFramework.quickWins} quick wins and ${prioritizationFramework.strategicBets} strategic bets identified`,
    context: {
      runId: ctx.runId,
      quickWins: prioritizationFramework.quickWins,
      strategicBets: prioritizationFramework.strategicBets,
      effortVsImpactMatrix: prioritizationFramework.effortVsImpactMatrix,
      priorityRoadmap: prioritizationFramework.priorityRoadmap,
      files: prioritizationFramework.artifacts.map(a => ({ path: a.path, format: a.format || 'html', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 12: FINAL ASSESSMENT AND DELIVERABLES
  // ============================================================================

  ctx.log('info', 'Phase 12: Final assessment and deliverables package');

  const finalAssessment = await ctx.task(finalAssessmentTask, {
    product,
    researchSynthesis,
    stagesDefinition,
    touchpointMapping,
    actionsDocumentation,
    emotionalMapping,
    painPointsAnalysis,
    opportunitiesIdentification,
    currentStateMap,
    futureStateMap,
    serviceBlueprint,
    prioritizationFramework,
    qualityTargets,
    outputDir
  });

  artifacts.push(...finalAssessment.artifacts);

  ctx.log('info', `User journey mapping complete: ${journeyMapsCreated} maps, ${painPointsIdentified} pain points, ${opportunitiesCount} opportunities`);

  // Final Breakpoint: Journey Map Review
  await ctx.breakpoint({
    question: `User Journey Mapping Complete. ${journeyMapsCreated} journey maps created with ${painPointsIdentified} pain points and ${opportunitiesCount} opportunities identified. Review deliverables and approve?`,
    title: 'Final User Journey Mapping Review',
    context: {
      runId: ctx.runId,
      summary: {
        journeyMapsCreated,
        painPointsIdentified,
        opportunitiesCount,
        stagesCount: stagesDefinition.stages.length,
        touchpointsCount: totalTouchpoints,
        prioritizedImprovements: prioritizationFramework.quickWins + prioritizationFramework.strategicBets
      },
      qualityTargets,
      assessment: finalAssessment.assessment,
      recommendation: finalAssessment.recommendation,
      nextSteps: finalAssessment.nextSteps,
      files: [
        { path: currentStateMap.journeyMapPath, format: 'html', label: 'Current State Journey Map' },
        ...(futureStateMap ? [{ path: futureStateMap.journeyMapPath, format: 'html', label: 'Future State Journey Map' }] : []),
        { path: painPointsAnalysis.painPointsReportPath, format: 'json', label: 'Pain Points Report' },
        { path: opportunitiesIdentification.opportunitiesReportPath, format: 'markdown', label: 'Opportunities Report' },
        { path: prioritizationFramework.prioritizationMatrixPath, format: 'html', label: 'Prioritization Matrix' },
        { path: finalAssessment.executiveSummaryPath, format: 'markdown', label: 'Executive Summary' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    journeyMapsCreated,
    painPointsIdentified,
    opportunitiesCount,
    stages: stagesDefinition.stages.map(s => ({
      name: s.name,
      description: s.description,
      touchpointsCount: s.touchpointsCount,
      painPointsCount: s.painPointsCount
    })),
    touchpoints: {
      total: totalTouchpoints,
      byChannel: touchpointMapping.touchpointsByChannel,
      byStage: touchpointMapping.touchpointsByStage.map(s => ({ stage: s.stage, count: s.touchpoints.length }))
    },
    painPoints: {
      total: painPointsIdentified,
      bySeverity: painPointsAnalysis.painPointsBySeverity,
      byStage: painPointsAnalysis.painPointsByStage,
      topPainPoints: painPointsAnalysis.topPainPoints
    },
    opportunities: {
      total: opportunitiesCount,
      byImpact: opportunitiesIdentification.opportunitiesByImpact,
      byStage: opportunitiesIdentification.opportunitiesByStage,
      topOpportunities: opportunitiesIdentification.topOpportunities
    },
    emotionalJourney: {
      variance: emotionalVariance,
      emotionalCurve: emotionalMapping.emotionalCurve,
      highPoints: emotionalMapping.emotionalHighPoints,
      lowPoints: emotionalMapping.emotionalLowPoints,
      averageEmotion: emotionalMapping.averageEmotion
    },
    prioritization: {
      quickWins: prioritizationFramework.quickWins,
      strategicBets: prioritizationFramework.strategicBets,
      improvementRoadmap: prioritizationFramework.priorityRoadmap,
      effortVsImpactMatrix: prioritizationFramework.effortVsImpactMatrix
    },
    improvementPriorities: prioritizationFramework.topPriorities,
    qualityGates: {
      researchQualityMet: insightQuality >= 70,
      stagesCoverageMet: stagesDefinition.stages.length >= qualityTargets.minStages,
      touchpointsCoverageMet: totalTouchpoints >= qualityTargets.minTouchpoints,
      painPointsCoverageMet: painPointsIdentified >= qualityTargets.minPainPoints,
      opportunitiesCoverageMet: opportunitiesCount >= qualityTargets.minOpportunities,
      emotionalDepthMet: emotionalVariance >= qualityTargets.emotionalVarianceThreshold
    },
    artifacts,
    deliverables: {
      currentStateMapPath: currentStateMap.journeyMapPath,
      futureStateMapPath: futureStateMap?.journeyMapPath,
      serviceBlueprintPath: serviceBlueprint?.blueprintPath,
      painPointsReportPath: painPointsAnalysis.painPointsReportPath,
      opportunitiesReportPath: opportunitiesIdentification.opportunitiesReportPath,
      prioritizationMatrixPath: prioritizationFramework.prioritizationMatrixPath,
      executiveSummaryPath: finalAssessment.executiveSummaryPath,
      presentationDeckPath: finalAssessment.presentationDeckPath
    },
    finalAssessment: {
      assessment: finalAssessment.assessment,
      recommendation: finalAssessment.recommendation,
      journeyQualityScore: finalAssessment.journeyQualityScore,
      nextSteps: finalAssessment.nextSteps,
      stakeholderReadiness: finalAssessment.stakeholderReadiness
    },
    duration,
    metadata: {
      processId: 'specializations/ux-ui-design/user-journey-mapping',
      timestamp: startTime,
      outputDir,
      persona: targetPersona || personas[0]?.name,
      journeyScope
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Research Synthesis
export const researchSynthesisTask = defineTask('research-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1: Research Synthesis and User Insights',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior UX Researcher and Data Synthesis Expert',
      task: 'Synthesize research data from multiple sources to extract insights for journey mapping',
      context: {
        product: args.product,
        personas: args.personas,
        researchData: args.researchData,
        journeyScope: args.journeyScope,
        targetPersona: args.targetPersona,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Review all available research data: interviews, surveys, analytics, usability tests',
        '2. Identify user behaviors, motivations, and goals relevant to the journey scope',
        '3. Extract pain points, frustrations, and obstacles mentioned by users',
        '4. Identify moments of delight, satisfaction, and positive experiences',
        '5. Document user quotes that capture key insights',
        '6. Synthesize behavioral patterns and common themes',
        '7. Assess research data completeness and identify gaps',
        '8. Create affinity maps grouping related insights',
        '9. Generate research synthesis report with key findings',
        '10. Provide insight quality score (0-100) based on data depth and coverage'
      ],
      outputFormat: 'JSON with synthesized insights, user quotes, behavioral patterns, and research gaps'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'synthesizedInsights', 'insightQualityScore', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        synthesizedInsights: {
          type: 'object',
          properties: {
            behaviors: { type: 'array', items: { type: 'string' } },
            motivations: { type: 'array', items: { type: 'string' } },
            goals: { type: 'array', items: { type: 'string' } },
            painPoints: { type: 'array', items: { type: 'string' } },
            delightMoments: { type: 'array', items: { type: 'string' } },
            userQuotes: { type: 'array', items: { type: 'object' } }
          }
        },
        insightQualityScore: { type: 'number', minimum: 0, maximum: 100 },
        dataSourcesCovered: { type: 'array', items: { type: 'string' } },
        missingData: { type: 'array', items: { type: 'string' } },
        affinityGroups: { type: 'array' },
        researchSynthesisPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'user-journey-mapping', 'research-synthesis', 'ux-research']
}));

// Phase 2: Stages Definition
export const stagesDefinitionTask = defineTask('stages-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2: Journey Stages Definition',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'UX Strategist and Journey Mapping Expert',
      task: 'Define the stages of the user journey based on research insights',
      context: {
        product: args.product,
        journeyScope: args.journeyScope,
        targetPersona: args.targetPersona,
        synthesizedInsights: args.synthesizedInsights,
        qualityTargets: args.qualityTargets,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Based on journey scope, define appropriate stages (e.g., Awareness, Consideration, Purchase, Usage, Loyalty)',
        '2. For task-based journeys: Pre-task, Task Execution, Post-task, Follow-up',
        '3. For day-in-life: Morning, Midday, Afternoon, Evening context stages',
        '4. Define clear boundaries and transitions between stages',
        '5. Name stages from user perspective, not business perspective',
        '6. Ensure stages cover complete user experience end-to-end',
        '7. Define goals and mindset for each stage',
        '8. Identify stage duration (minutes, hours, days, weeks)',
        '9. Create stage diagram showing progression',
        '10. Document stage definitions with descriptions and characteristics'
      ],
      outputFormat: 'JSON with stage definitions and stage diagram'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'stages', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        stages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              userGoals: { type: 'array', items: { type: 'string' } },
              userMindset: { type: 'string' },
              duration: { type: 'string' },
              transitionTrigger: { type: 'string' }
            }
          },
          minItems: 3
        },
        stageDiagramPath: { type: 'string' },
        stageDefinitionsPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'user-journey-mapping', 'stages-definition', 'ux-strategy']
}));

// Phase 3: Touchpoint Mapping
export const touchpointMappingTask = defineTask('touchpoint-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: Touchpoint Identification and Mapping',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Service Design Expert and Touchpoint Strategist',
      task: 'Identify and map all touchpoints where users interact with the product/service',
      context: {
        product: args.product,
        stages: args.stages,
        synthesizedInsights: args.synthesizedInsights,
        qualityTargets: args.qualityTargets,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify all digital touchpoints: website, mobile app, email, SMS, push notifications',
        '2. Identify physical touchpoints: store, packaging, printed materials',
        '3. Identify human touchpoints: customer support, sales, service representatives',
        '4. Identify third-party touchpoints: social media, review sites, partner channels',
        '5. Map touchpoints to specific journey stages',
        '6. Categorize by channel type (digital, physical, human, third-party)',
        '7. Document touchpoint characteristics (frequency, criticality, satisfaction)',
        '8. Identify owned vs unowned touchpoints',
        '9. Create touchpoint inventory with metadata',
        '10. Generate visual touchpoint map across stages'
      ],
      outputFormat: 'JSON with touchpoint mappings and touchpoint inventory'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'touchpointsByStage', 'touchpointsByChannel', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        touchpointsByStage: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stage: { type: 'string' },
              touchpoints: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    channel: { type: 'string' },
                    type: { type: 'string', enum: ['digital', 'physical', 'human', 'third-party'] },
                    criticality: { type: 'string', enum: ['critical', 'important', 'nice-to-have'] },
                    owned: { type: 'boolean' }
                  }
                }
              }
            }
          }
        },
        touchpointsByChannel: { type: 'object' },
        touchpointInventoryPath: { type: 'string' },
        touchpointMapPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'user-journey-mapping', 'touchpoints', 'service-design']
}));

// Phase 4: Actions Documentation
export const actionsDocumentationTask = defineTask('actions-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: User Actions Documentation',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Behavioral Analyst and UX Documentation Specialist',
      task: 'Document all user actions at each touchpoint throughout the journey',
      context: {
        product: args.product,
        stages: args.stages,
        touchpoints: args.touchpoints,
        synthesizedInsights: args.synthesizedInsights,
        outputDir: args.outputDir
      },
      instructions: [
        '1. For each touchpoint, document specific user actions',
        '2. Use action verbs: search, browse, compare, select, purchase, contact, etc.',
        '3. Describe observable behaviors, not internal thoughts',
        '4. Sequence actions in chronological order',
        '5. Identify decision points where users choose between paths',
        '6. Document workarounds and alternative paths users take',
        '7. Note frequency and duration of actions',
        '8. Identify repetitive or unnecessary actions',
        '9. Link actions to user goals and objectives',
        '10. Create actions inventory mapped to stages and touchpoints'
      ],
      outputFormat: 'JSON with user actions mapped to stages and touchpoints'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'actionsByStage', 'totalActions', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        actionsByStage: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stage: { type: 'string' },
              actions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    action: { type: 'string' },
                    touchpoint: { type: 'string' },
                    frequency: { type: 'string' },
                    duration: { type: 'string' },
                    isDecisionPoint: { type: 'boolean' }
                  }
                }
              }
            }
          }
        },
        totalActions: { type: 'number' },
        decisionPoints: { type: 'array' },
        workarounds: { type: 'array' },
        actionsInventoryPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'user-journey-mapping', 'user-actions', 'behavioral-analysis']
}));

// Phase 5: Emotional Mapping
export const emotionalMappingTask = defineTask('emotional-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Thoughts and Emotions Mapping',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Empathy Expert and Emotional Intelligence Specialist',
      task: 'Map user thoughts and emotions throughout the journey to create emotional curve',
      context: {
        product: args.product,
        stages: args.stages,
        touchpoints: args.touchpoints,
        actions: args.actions,
        synthesizedInsights: args.synthesizedInsights,
        qualityTargets: args.qualityTargets,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Based on research data, identify user thoughts at each stage',
        '2. Assign emotional state for each stage and key touchpoint (scale 1-10: frustrated to delighted)',
        '3. Document emotional triggers: what causes emotional highs and lows',
        '4. Identify anxiety-inducing moments and uncertainty points',
        '5. Identify moments of delight, satisfaction, and trust',
        '6. Create emotional curve visualization showing ups and downs',
        '7. Calculate emotional variance across journey',
        '8. Document user quotes that illustrate emotional states',
        '9. Identify critical moments of truth that define experience',
        '10. Generate emotional journey report with insights'
      ],
      outputFormat: 'JSON with emotional curve, thoughts, and emotional insights'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'emotionalCurve', 'emotionalVariance', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        emotionalCurve: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stage: { type: 'string' },
              emotionScore: { type: 'number', minimum: 1, maximum: 10 },
              emotion: { type: 'string' },
              trigger: { type: 'string' }
            }
          }
        },
        thoughtsByStage: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stage: { type: 'string' },
              thoughts: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        emotionalVariance: { type: 'number' },
        emotionalHighPoints: { type: 'array' },
        emotionalLowPoints: { type: 'array' },
        momentsOfTruth: { type: 'array' },
        averageEmotion: { type: 'number' },
        emotionalCurvePath: { type: 'string', description: 'Path to emotional curve visualization' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'user-journey-mapping', 'emotional-mapping', 'empathy']
}));

// Phase 6: Pain Points Analysis
export const painPointsAnalysisTask = defineTask('pain-points-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6: Pain Points Identification and Analysis',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'UX Problem Analyst and Pain Point Expert',
      task: 'Identify, categorize, and analyze user pain points throughout the journey',
      context: {
        product: args.product,
        stages: args.stages,
        touchpoints: args.touchpoints,
        actions: args.actions,
        emotions: args.emotions,
        synthesizedInsights: args.synthesizedInsights,
        qualityTargets: args.qualityTargets,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify all friction points, obstacles, and frustrations from research',
        '2. Categorize pain points: usability, performance, information, emotional, technical',
        '3. Assign severity: critical (blocks progress), high (major frustration), medium (annoyance), low (minor issue)',
        '4. Map pain points to specific stages and touchpoints',
        '5. Document user impact: time wasted, goals not achieved, abandonment risk',
        '6. Identify root causes for each pain point',
        '7. Link pain points to emotional low points',
        '8. Quantify frequency: how often does this pain point occur',
        '9. Prioritize pain points by severity, frequency, and impact',
        '10. Create pain points report with recommendations'
      ],
      outputFormat: 'JSON with categorized pain points and analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'allPainPoints', 'totalPainPoints', 'painPointsBySeverity', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        allPainPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              painPoint: { type: 'string' },
              stage: { type: 'string' },
              touchpoint: { type: 'string' },
              category: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              impact: { type: 'string' },
              frequency: { type: 'string' },
              rootCause: { type: 'string' }
            }
          }
        },
        totalPainPoints: { type: 'number' },
        painPointsBySeverity: {
          type: 'object',
          properties: {
            critical: { type: 'number' },
            high: { type: 'number' },
            medium: { type: 'number' },
            low: { type: 'number' }
          }
        },
        painPointsByStage: { type: 'array' },
        topPainPoints: { type: 'array', items: { type: 'object' }, description: 'Top 10 pain points by severity and impact' },
        painPointsReportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'user-journey-mapping', 'pain-points', 'problem-analysis']
}));

// Phase 7: Opportunities Identification
export const opportunitiesIdentificationTask = defineTask('opportunities-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: Improvement Opportunities Identification',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'UX Strategist and Innovation Facilitator',
      task: 'Identify and prioritize opportunities for improving the user experience',
      context: {
        product: args.product,
        stages: args.stages,
        painPoints: args.painPoints,
        emotionalLowPoints: args.emotionalLowPoints,
        touchpoints: args.touchpoints,
        synthesizedInsights: args.synthesizedInsights,
        qualityTargets: args.qualityTargets,
        outputDir: args.outputDir
      },
      instructions: [
        '1. For each pain point, generate 1-3 improvement opportunities',
        '2. Frame opportunities as "How might we..." (HMW) questions',
        '3. Identify opportunities to enhance emotional high points',
        '4. Look for opportunities to add value beyond fixing pain points',
        '5. Consider opportunities for personalization and customization',
        '6. Identify automation opportunities to reduce user effort',
        '7. Assess potential impact: transformative, significant, incremental',
        '8. Estimate effort required: low, medium, high',
        '9. Map opportunities to stages and touchpoints',
        '10. Create opportunities report with impact-effort matrix'
      ],
      outputFormat: 'JSON with opportunities and prioritization data'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'allOpportunities', 'totalOpportunities', 'opportunitiesByImpact', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        allOpportunities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              opportunity: { type: 'string' },
              hmwStatement: { type: 'string' },
              stage: { type: 'string' },
              relatedPainPoint: { type: 'string' },
              potentialImpact: { type: 'string', enum: ['transformative', 'significant', 'incremental'] },
              effortEstimate: { type: 'string', enum: ['low', 'medium', 'high'] },
              category: { type: 'string' }
            }
          }
        },
        totalOpportunities: { type: 'number' },
        opportunitiesByImpact: {
          type: 'object',
          properties: {
            transformative: { type: 'number' },
            significant: { type: 'number' },
            incremental: { type: 'number' }
          }
        },
        opportunitiesByStage: { type: 'array' },
        topOpportunities: { type: 'array', items: { type: 'object' }, description: 'Top opportunities by impact' },
        opportunitiesReportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'user-journey-mapping', 'opportunities', 'innovation']
}));

// Phase 8: Current State Map Creation
export const currentStateMapCreationTask = defineTask('current-state-map-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 8: Current State Journey Map Creation',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Journey Map Visualization Expert and UX Designer',
      task: 'Create comprehensive current state journey map visualization',
      context: {
        product: args.product,
        persona: args.persona,
        stages: args.stages,
        touchpoints: args.touchpoints,
        actions: args.actions,
        emotions: args.emotions,
        thoughts: args.thoughts,
        painPoints: args.painPoints,
        opportunities: args.opportunities,
        tools: args.tools,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create journey map layout with horizontal stages',
        '2. Add rows for: touchpoints, user actions, thoughts, emotions, pain points, opportunities',
        '3. Plot emotional curve showing emotional ups and downs',
        '4. Use color coding: red for pain points, green for positive moments',
        '5. Include persona context at top of map',
        '6. Add user quotes that illustrate key moments',
        '7. Visualize emotional states with emoticons or curve graph',
        '8. Highlight critical touchpoints and moments of truth',
        '9. Create legend explaining all visual elements',
        '10. Export in multiple formats: HTML interactive, PDF printable, image'
      ],
      outputFormat: 'JSON with journey map data and file paths'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'journeyMapData', 'journeyMapPath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        journeyMapData: { type: 'object', description: 'Structured journey map data' },
        journeyMapPath: { type: 'string', description: 'Path to main journey map HTML' },
        journeyMapPdfPath: { type: 'string' },
        journeyMapImagePath: { type: 'string' },
        interactiveMapUrl: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'user-journey-mapping', 'visualization', 'current-state']
}));

// Phase 9: Future State Map Creation
export const futureStateMapCreationTask = defineTask('future-state-map-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 9: Future State Journey Map Creation',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'UX Visionary and Future State Designer',
      task: 'Create future state journey map showing improved experience after implementing opportunities',
      context: {
        product: args.product,
        persona: args.persona,
        currentStateMap: args.currentStateMap,
        opportunities: args.opportunities,
        prioritizedImprovements: args.prioritizedImprovements,
        tools: args.tools,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Start with current state journey map structure',
        '2. Apply prioritized improvements to relevant stages',
        '3. Show how pain points are resolved or mitigated',
        '4. Update emotional curve to reflect improved experience',
        '5. Add new touchpoints or enhanced touchpoints',
        '6. Simplify user actions where improvements reduce effort',
        '7. Highlight what changed compared to current state',
        '8. Show expected emotional impact of improvements',
        '9. Include implementation notes for each improvement',
        '10. Create side-by-side comparison view: current vs future'
      ],
      outputFormat: 'JSON with future state journey map data'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'journeyMapData', 'journeyMapPath', 'improvementsApplied', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        journeyMapData: { type: 'object' },
        journeyMapPath: { type: 'string' },
        journeyMapPdfPath: { type: 'string' },
        comparisonViewPath: { type: 'string' },
        improvementsApplied: { type: 'number' },
        expectedEmotionalImprovement: { type: 'number', description: 'Average emotion score improvement' },
        reducedPainPoints: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'user-journey-mapping', 'future-state', 'vision']
}));

// Phase 10: Service Blueprint Creation
export const serviceBlueprintCreationTask = defineTask('service-blueprint-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 10: Service Blueprint with Backstage Processes',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Service Design Architect',
      task: 'Create service blueprint showing frontstage, backstage, and support processes',
      context: {
        product: args.product,
        currentStateMap: args.currentStateMap,
        touchpoints: args.touchpoints,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Start with journey map touchpoints as frontstage',
        '2. Add line of visibility separating frontstage from backstage',
        '3. Document backstage processes supporting each touchpoint',
        '4. Add line of internal interaction',
        '5. Document support processes: technology systems, databases, APIs',
        '6. Show information flow between layers',
        '7. Identify dependencies and handoffs between processes',
        '8. Highlight areas where backstage inefficiency impacts user experience',
        '9. Document technology stack and integrations',
        '10. Create service blueprint visualization'
      ],
      outputFormat: 'JSON with service blueprint data'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'backstageProcesses', 'blueprintPath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        backstageProcesses: { type: 'number' },
        supportProcesses: { type: 'number' },
        systemInteractions: { type: 'number' },
        blueprintData: { type: 'object' },
        blueprintPath: { type: 'string' },
        blueprintPdfPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'user-journey-mapping', 'service-blueprint', 'service-design']
}));

// Phase 11: Prioritization
export const prioritizationTask = defineTask('prioritization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 11: Improvement Prioritization Framework',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Product Strategist and Prioritization Expert',
      task: 'Prioritize improvements using impact-effort matrix and create implementation roadmap',
      context: {
        product: args.product,
        opportunities: args.opportunities,
        painPoints: args.painPoints,
        emotionalImpact: args.emotionalImpact,
        qualityTargets: args.qualityTargets,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Plot all opportunities on impact-effort matrix (2x2 grid)',
        '2. Identify quick wins: high impact, low effort',
        '3. Identify strategic bets: high impact, high effort',
        '4. Identify fill-ins: low impact, low effort',
        '5. Identify thankless tasks: low impact, high effort (avoid)',
        '6. Consider implementation dependencies',
        '7. Create phased roadmap: Phase 1 (quick wins), Phase 2 (strategic bets), Phase 3 (fill-ins)',
        '8. Estimate resources and timeline for each phase',
        '9. Generate prioritization report with recommendations',
        '10. Create visual roadmap and prioritization matrix'
      ],
      outputFormat: 'JSON with prioritization data and roadmap'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'quickWins', 'strategicBets', 'effortVsImpactMatrix', 'topPriorities', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        quickWins: { type: 'number' },
        strategicBets: { type: 'number' },
        fillIns: { type: 'number' },
        thanklessTasks: { type: 'number' },
        effortVsImpactMatrix: { type: 'object' },
        priorityRoadmap: {
          type: 'object',
          properties: {
            phase1: { type: 'array', description: 'Quick wins' },
            phase2: { type: 'array', description: 'Strategic bets' },
            phase3: { type: 'array', description: 'Fill-ins' }
          }
        },
        topPriorities: { type: 'array', description: 'Top 5-10 prioritized improvements' },
        prioritizationMatrixPath: { type: 'string' },
        roadmapPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'user-journey-mapping', 'prioritization', 'roadmap']
}));

// Phase 12: Final Assessment
export const finalAssessmentTask = defineTask('final-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 12: Final Assessment and Deliverables',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'UX Director and Executive Communicator',
      task: 'Create final assessment, executive summary, and presentation materials',
      context: {
        product: args.product,
        researchSynthesis: args.researchSynthesis,
        stagesDefinition: args.stagesDefinition,
        touchpointMapping: args.touchpointMapping,
        actionsDocumentation: args.actionsDocumentation,
        emotionalMapping: args.emotionalMapping,
        painPointsAnalysis: args.painPointsAnalysis,
        opportunitiesIdentification: args.opportunitiesIdentification,
        currentStateMap: args.currentStateMap,
        futureStateMap: args.futureStateMap,
        serviceBlueprint: args.serviceBlueprint,
        prioritizationFramework: args.prioritizationFramework,
        qualityTargets: args.qualityTargets,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Evaluate overall journey mapping quality and completeness',
        '2. Create executive summary highlighting key findings',
        '3. Summarize top pain points and their business impact',
        '4. Present prioritized opportunities with expected ROI',
        '5. Include compelling user quotes and emotional insights',
        '6. Create stakeholder presentation deck (10-15 slides)',
        '7. Include current state vs future state comparison',
        '8. Define success metrics for tracking improvements',
        '9. Provide implementation recommendations and next steps',
        '10. Assess stakeholder readiness for action'
      ],
      outputFormat: 'JSON with assessment and deliverables paths'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'assessment', 'recommendation', 'nextSteps', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        assessment: { type: 'string' },
        journeyQualityScore: { type: 'number', minimum: 0, maximum: 100 },
        recommendation: { type: 'string' },
        stakeholderReadiness: { type: 'string', enum: ['ready', 'needs-alignment', 'not-ready'] },
        keyFindings: { type: 'array', items: { type: 'string' } },
        businessImpact: { type: 'string' },
        successMetrics: { type: 'array', items: { type: 'string' } },
        nextSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'string' },
              priority: { type: 'string', enum: ['immediate', 'short-term', 'long-term'] },
              owner: { type: 'string' }
            }
          }
        },
        executiveSummaryPath: { type: 'string' },
        presentationDeckPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'user-journey-mapping', 'assessment', 'executive-summary']
}));

// Quality gates for the overall process
export const qualityGates = {
  researchQuality: {
    description: 'Research synthesis provides sufficient insights',
    threshold: 70,
    metric: 'insightQualityScore'
  },
  stagesCoverage: {
    description: 'Journey has adequate stage granularity',
    threshold: 4,
    metric: 'stagesCount'
  },
  touchpointsCoverage: {
    description: 'All key touchpoints are identified',
    threshold: 10,
    metric: 'totalTouchpoints'
  },
  painPointsDepth: {
    description: 'Sufficient pain points identified',
    threshold: 8,
    metric: 'painPointsIdentified'
  },
  opportunitiesDepth: {
    description: 'Sufficient opportunities for improvement',
    threshold: 5,
    metric: 'opportunitiesCount'
  },
  emotionalDepth: {
    description: 'Emotional journey shows rich variance',
    threshold: 3,
    metric: 'emotionalVariance'
  }
};

// Estimated duration: 2-4 weeks
export const estimatedDuration = {
  researchSynthesis: '3-5 days',
  mapping: '1-2 weeks',
  visualization: '3-5 days',
  stakeholderReview: '1 week',
  total: '2-4 weeks',
  teamSize: '2-4 people (UX Researcher, UX Designer, Product Manager, Facilitator)'
};
