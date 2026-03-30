/**
 * @process ux-ui-design/design-critique
 * @description Design Critique and Review Process for structured design feedback, evaluation, and iteration planning with collaborative critique sessions, design principles assessment, and actionable recommendations
 * @inputs { projectName: string, designFiles: array, designPhase: string, critiqueType: string, participants: array, designPrinciples: array, evaluationCriteria: object }
 * @outputs { success: boolean, critiqueReport: string, feedbackSummary: object, actionItems: array, iterationPlan: object, qualityScore: number, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName = 'Project',
    designFiles = [],
    designPhase = 'concept', // concept, wireframe, prototype, high-fidelity, final
    critiqueType = 'comprehensive', // quick, comprehensive, stakeholder, team, expert
    participants = [],
    designPrinciples = [],
    evaluationCriteria = {},
    previousCritiques = [],
    targetQualityScore = 85,
    iterationBudget = { time: '2 weeks', resources: 'standard' },
    outputDir = 'design-critique-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Design Critique and Review Process for ${projectName}`);
  ctx.log('info', `Design Phase: ${designPhase}, Critique Type: ${critiqueType}`);

  // ============================================================================
  // PHASE 1: CRITIQUE PREPARATION AND CONTEXT GATHERING
  // ============================================================================

  ctx.log('info', 'Phase 1: Preparing critique session and gathering context');
  const critiquePreparation = await ctx.task(critiquePreparationTask, {
    projectName,
    designFiles,
    designPhase,
    critiqueType,
    previousCritiques,
    designPrinciples,
    evaluationCriteria,
    outputDir
  });

  artifacts.push(...critiquePreparation.artifacts);

  if (!critiquePreparation.readyForCritique) {
    ctx.log('warn', 'Critique preparation incomplete - missing required materials');
    return {
      success: false,
      reason: 'Critique preparation insufficient',
      missingMaterials: critiquePreparation.missingMaterials,
      recommendations: critiquePreparation.recommendations,
      metadata: {
        processId: 'ux-ui-design/design-critique',
        timestamp: startTime
      }
    };
  }

  // ============================================================================
  // PHASE 2: PARTICIPANT SELECTION AND ROLE ASSIGNMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Selecting participants and assigning critique roles');
  const participantSelection = await ctx.task(participantSelectionTask, {
    projectName,
    critiqueType,
    designPhase,
    participants,
    critiquePreparation,
    outputDir
  });

  artifacts.push(...participantSelection.artifacts);

  ctx.log('info', `Participants selected: ${participantSelection.selectedParticipants.length} reviewers`);

  // ============================================================================
  // PHASE 3: DESIGN CONTEXT PRESENTATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Presenting design context and objectives');
  const contextPresentation = await ctx.task(contextPresentationTask, {
    projectName,
    designFiles,
    designPhase,
    critiquePreparation,
    participantSelection,
    outputDir
  });

  artifacts.push(...contextPresentation.artifacts);

  // ============================================================================
  // PHASE 4: INITIAL DESIGN REVIEW AND OBSERVATIONS
  // ============================================================================

  ctx.log('info', 'Phase 4: Conducting initial design review and collecting observations');
  const initialReview = await ctx.task(initialDesignReviewTask, {
    projectName,
    designFiles,
    designPhase,
    contextPresentation,
    participantSelection,
    evaluationCriteria,
    outputDir
  });

  artifacts.push(...initialReview.artifacts);

  ctx.log('info', `Initial observations collected: ${initialReview.observationCount} items`);

  // ============================================================================
  // PHASE 5: DESIGN PRINCIPLES EVALUATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Evaluating design against established principles');
  const principlesEvaluation = await ctx.task(designPrinciplesEvaluationTask, {
    projectName,
    designFiles,
    designPrinciples: critiquePreparation.applicablePrinciples,
    initialReview,
    contextPresentation,
    outputDir
  });

  artifacts.push(...principlesEvaluation.artifacts);

  const principlesScore = principlesEvaluation.adherenceScore;
  ctx.log('info', `Design principles adherence: ${principlesScore}/100`);

  // ============================================================================
  // PHASE 6: USABILITY AND USER EXPERIENCE ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 6: Assessing usability and user experience quality');
  const usabilityAssessment = await ctx.task(usabilityAssessmentTask, {
    projectName,
    designFiles,
    designPhase,
    initialReview,
    contextPresentation,
    evaluationCriteria,
    outputDir
  });

  artifacts.push(...usabilityAssessment.artifacts);

  ctx.log('info', `Usability score: ${usabilityAssessment.usabilityScore}/100, ${usabilityAssessment.criticalIssues.length} critical issues`);

  // ============================================================================
  // PHASE 7: VISUAL DESIGN AND AESTHETICS CRITIQUE
  // ============================================================================

  ctx.log('info', 'Phase 7: Critiquing visual design and aesthetic choices');
  const visualCritique = await ctx.task(visualDesignCritiqueTask, {
    projectName,
    designFiles,
    designPhase,
    designPrinciples: critiquePreparation.applicablePrinciples,
    contextPresentation,
    outputDir
  });

  artifacts.push(...visualCritique.artifacts);

  // ============================================================================
  // PHASE 8: ACCESSIBILITY AND INCLUSIVE DESIGN REVIEW
  // ============================================================================

  ctx.log('info', 'Phase 8: Reviewing accessibility and inclusive design considerations');
  const accessibilityReview = await ctx.task(accessibilityReviewTask, {
    projectName,
    designFiles,
    designPhase,
    usabilityAssessment,
    evaluationCriteria,
    outputDir
  });

  artifacts.push(...accessibilityReview.artifacts);

  const accessibilityScore = accessibilityReview.accessibilityScore;
  ctx.log('info', `Accessibility score: ${accessibilityScore}/100`);

  // Breakpoint: Review initial findings
  await ctx.breakpoint({
    question: `Initial critique complete. Principles: ${principlesScore}/100, Usability: ${usabilityAssessment.usabilityScore}/100, Accessibility: ${accessibilityScore}/100. Review findings before proceeding to structured feedback?`,
    title: 'Initial Critique Review',
    context: {
      runId: ctx.runId,
      files: artifacts
        .filter(a => a.type === 'review' || a.phase === 'initial-review')
        .map(a => ({
          path: a.path,
          format: a.format || 'markdown',
          language: a.language || undefined,
          label: a.label || undefined
        })),
      summary: {
        projectName,
        designPhase,
        principlesScore,
        usabilityScore: usabilityAssessment.usabilityScore,
        accessibilityScore,
        observationCount: initialReview.observationCount,
        criticalIssues: usabilityAssessment.criticalIssues.length,
        strengths: initialReview.strengths.slice(0, 3),
        concerns: initialReview.concerns.slice(0, 3)
      }
    }
  });

  // ============================================================================
  // PHASE 9: STRUCTURED FEEDBACK COLLECTION
  // ============================================================================

  ctx.log('info', 'Phase 9: Collecting structured feedback from all participants');
  const feedbackCollection = await ctx.task(structuredFeedbackCollectionTask, {
    projectName,
    designFiles,
    participantSelection,
    initialReview,
    principlesEvaluation,
    usabilityAssessment,
    visualCritique,
    accessibilityReview,
    outputDir
  });

  artifacts.push(...feedbackCollection.artifacts);

  ctx.log('info', `Structured feedback collected: ${feedbackCollection.feedbackCount} items from ${feedbackCollection.participantCount} participants`);

  // ============================================================================
  // PHASE 10: FEEDBACK SYNTHESIS AND CATEGORIZATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Synthesizing and categorizing feedback');
  const feedbackSynthesis = await ctx.task(feedbackSynthesisTask, {
    projectName,
    feedbackCollection,
    initialReview,
    principlesEvaluation,
    usabilityAssessment,
    visualCritique,
    accessibilityReview,
    evaluationCriteria,
    outputDir
  });

  artifacts.push(...feedbackSynthesis.artifacts);

  ctx.log('info', `Feedback synthesized into ${feedbackSynthesis.themeCount} themes`);

  // ============================================================================
  // PHASE 11: STRENGTHS AND OPPORTUNITIES IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 11: Identifying design strengths and opportunities');
  const strengthsOpportunities = await ctx.task(strengthsOpportunitiesTask, {
    projectName,
    feedbackSynthesis,
    principlesEvaluation,
    usabilityAssessment,
    visualCritique,
    accessibilityReview,
    outputDir
  });

  artifacts.push(...strengthsOpportunities.artifacts);

  // ============================================================================
  // PHASE 12: CRITICAL ISSUES AND BLOCKERS ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 12: Assessing critical issues and design blockers');
  const criticalIssuesAssessment = await ctx.task(criticalIssuesAssessmentTask, {
    projectName,
    feedbackSynthesis,
    usabilityAssessment,
    accessibilityReview,
    designPhase,
    outputDir
  });

  artifacts.push(...criticalIssuesAssessment.artifacts);

  const criticalIssueCount = criticalIssuesAssessment.criticalIssues.length;
  const blockerCount = criticalIssuesAssessment.blockers.length;

  ctx.log('info', `Critical issues: ${criticalIssueCount}, Blockers: ${blockerCount}`);

  // Quality Gate: Critical issues check
  if (blockerCount > 0) {
    await ctx.breakpoint({
      question: `${blockerCount} design blocker(s) identified that prevent progression to next phase. Review blockers and determine resolution approach?`,
      title: 'Critical Blockers Identified',
      context: {
        runId: ctx.runId,
        blockers: criticalIssuesAssessment.blockers,
        criticalIssues: criticalIssuesAssessment.criticalIssues,
        designPhase,
        impactAssessment: criticalIssuesAssessment.impactAssessment,
        files: [
          { path: criticalIssuesAssessment.blockersReportPath, format: 'markdown', label: 'Blockers Report' },
          { path: criticalIssuesAssessment.resolutionPlanPath, format: 'markdown', label: 'Resolution Plan' }
        ]
      }
    });
  }

  // ============================================================================
  // PHASE 13: ACTIONABLE RECOMMENDATIONS GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 13: Generating actionable design recommendations');
  const recommendations = await ctx.task(recommendationsGenerationTask, {
    projectName,
    feedbackSynthesis,
    strengthsOpportunities,
    criticalIssuesAssessment,
    principlesEvaluation,
    usabilityAssessment,
    accessibilityReview,
    designPhase,
    outputDir
  });

  artifacts.push(...recommendations.artifacts);

  ctx.log('info', `Generated ${recommendations.recommendations.length} actionable recommendations`);

  // ============================================================================
  // PHASE 14: PRIORITIZATION AND IMPACT ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 14: Prioritizing recommendations by impact and effort');
  const prioritization = await ctx.task(prioritizationTask, {
    projectName,
    recommendations,
    criticalIssuesAssessment,
    iterationBudget,
    designPhase,
    outputDir
  });

  artifacts.push(...prioritization.artifacts);

  // ============================================================================
  // PHASE 15: ITERATION PLANNING AND ROADMAP
  // ============================================================================

  ctx.log('info', 'Phase 15: Planning design iterations and creating roadmap');
  const iterationPlanning = await ctx.task(iterationPlanningTask, {
    projectName,
    prioritization,
    recommendations,
    criticalIssuesAssessment,
    iterationBudget,
    designPhase,
    outputDir
  });

  artifacts.push(...iterationPlanning.artifacts);

  ctx.log('info', `Iteration plan created: ${iterationPlanning.iterationCount} iteration(s), ${iterationPlanning.estimatedDuration}`);

  // ============================================================================
  // PHASE 16: DESIGN SYSTEM AND PATTERN CONSISTENCY CHECK
  // ============================================================================

  ctx.log('info', 'Phase 16: Checking design system and pattern consistency');
  const consistencyCheck = await ctx.task(designSystemConsistencyTask, {
    projectName,
    designFiles,
    designPhase,
    feedbackSynthesis,
    visualCritique,
    outputDir
  });

  artifacts.push(...consistencyCheck.artifacts);

  // ============================================================================
  // PHASE 17: CROSS-FUNCTIONAL IMPACT ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 17: Assessing cross-functional impact (engineering, product, marketing)');
  const crossFunctionalImpact = await ctx.task(crossFunctionalImpactTask, {
    projectName,
    recommendations,
    iterationPlanning,
    designPhase,
    criticalIssuesAssessment,
    outputDir
  });

  artifacts.push(...crossFunctionalImpact.artifacts);

  // ============================================================================
  // PHASE 18: DOCUMENTATION AND DECISION RECORDING
  // ============================================================================

  ctx.log('info', 'Phase 18: Documenting critique outcomes and design decisions');
  const documentation = await ctx.task(critiqueDocumentationTask, {
    projectName,
    designPhase,
    critiquePreparation,
    participantSelection,
    feedbackSynthesis,
    strengthsOpportunities,
    criticalIssuesAssessment,
    recommendations,
    prioritization,
    iterationPlanning,
    consistencyCheck,
    crossFunctionalImpact,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // ============================================================================
  // PHASE 19: OVERALL QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Phase 19: Calculating overall design quality score');
  const qualityScoring = await ctx.task(designQualityScoringTask, {
    projectName,
    designPhase,
    principlesEvaluation,
    usabilityAssessment,
    visualCritique,
    accessibilityReview,
    consistencyCheck,
    criticalIssuesAssessment,
    targetQualityScore,
    outputDir
  });

  artifacts.push(...qualityScoring.artifacts);

  const overallQualityScore = qualityScoring.overallScore;
  const qualityMet = overallQualityScore >= targetQualityScore;

  ctx.log('info', `Overall design quality: ${overallQualityScore}/100 (target: ${targetQualityScore})`);

  // ============================================================================
  // PHASE 20: FINAL CRITIQUE REPORT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 20: Generating comprehensive critique report');
  const critiqueReport = await ctx.task(critiqueReportGenerationTask, {
    projectName,
    designPhase,
    critiqueType,
    critiquePreparation,
    participantSelection,
    contextPresentation,
    feedbackSynthesis,
    strengthsOpportunities,
    criticalIssuesAssessment,
    recommendations,
    prioritization,
    iterationPlanning,
    consistencyCheck,
    crossFunctionalImpact,
    qualityScoring,
    documentation,
    outputDir
  });

  artifacts.push(...critiqueReport.artifacts);

  // Final Breakpoint: Review complete critique
  await ctx.breakpoint({
    question: `Design critique complete for ${projectName}. Quality score: ${overallQualityScore}/100 (${qualityMet ? 'Meets' : 'Below'} target). ${criticalIssueCount} critical issues, ${recommendations.recommendations.length} recommendations. ${iterationPlanning.iterationCount} iteration(s) planned. Review complete critique report?`,
    title: 'Design Critique Complete',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        projectName,
        designPhase,
        critiqueType,
        qualityScore: overallQualityScore,
        qualityMet,
        targetScore: targetQualityScore,
        participantCount: participantSelection.selectedParticipants.length,
        feedbackItems: feedbackCollection.feedbackCount,
        strengths: strengthsOpportunities.strengths.length,
        opportunities: strengthsOpportunities.opportunities.length,
        criticalIssues: criticalIssueCount,
        blockers: blockerCount,
        recommendations: recommendations.recommendations.length,
        quickWins: prioritization.quickWins.length,
        iterations: iterationPlanning.iterationCount,
        estimatedDuration: iterationPlanning.estimatedDuration,
        verdict: qualityScoring.verdict
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    designPhase,
    critiqueType,
    qualityScore: overallQualityScore,
    qualityMet,
    critiqueReport: critiqueReport.reportPath,
    feedbackSummary: {
      totalFeedbackItems: feedbackCollection.feedbackCount,
      participants: participantSelection.selectedParticipants.length,
      themes: feedbackSynthesis.themes,
      feedbackBreakdown: feedbackSynthesis.feedbackBreakdown
    },
    evaluation: {
      principlesAdherence: principlesScore,
      usability: usabilityAssessment.usabilityScore,
      accessibility: accessibilityScore,
      visualDesign: visualCritique.visualScore,
      consistency: consistencyCheck.consistencyScore,
      componentScores: qualityScoring.componentScores
    },
    strengths: strengthsOpportunities.strengths,
    opportunities: strengthsOpportunities.opportunities,
    issues: {
      critical: criticalIssueCount,
      blockers: blockerCount,
      allIssues: criticalIssuesAssessment.allIssues
    },
    actionItems: recommendations.recommendations,
    prioritization: {
      quickWins: prioritization.quickWins,
      shortTerm: prioritization.shortTermActions,
      longTerm: prioritization.longTermActions,
      matrix: prioritization.impactEffortMatrix
    },
    iterationPlan: {
      iterations: iterationPlanning.iterations,
      iterationCount: iterationPlanning.iterationCount,
      estimatedDuration: iterationPlanning.estimatedDuration,
      roadmap: iterationPlanning.roadmapPath
    },
    designSystemConsistency: {
      consistencyScore: consistencyCheck.consistencyScore,
      inconsistencies: consistencyCheck.inconsistencies,
      patternAlignmentScore: consistencyCheck.patternAlignmentScore
    },
    crossFunctionalImpact: {
      engineering: crossFunctionalImpact.engineeringImpact,
      product: crossFunctionalImpact.productImpact,
      marketing: crossFunctionalImpact.marketingImpact,
      timeline: crossFunctionalImpact.estimatedTimeline
    },
    documentation: {
      critiqueReportPath: critiqueReport.reportPath,
      executiveSummaryPath: critiqueReport.executiveSummaryPath,
      decisionLogPath: documentation.decisionLogPath,
      iterationRoadmapPath: iterationPlanning.roadmapPath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'ux-ui-design/design-critique',
      timestamp: startTime,
      designPhase,
      critiqueType,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Critique Preparation
export const critiquePreparationTask = defineTask('critique-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare critique session and gather context',
  agent: {
    name: 'design-critique-facilitator',
    prompt: {
      role: 'senior UX designer and design critique facilitator',
      task: 'Prepare comprehensive design critique session by gathering context, materials, and establishing evaluation framework',
      context: args,
      instructions: [
        'Review all design files and materials provided',
        'Assess completeness of materials for critique (designs, specs, user flows, prototypes)',
        'Identify missing materials that would enhance critique quality',
        'Understand design phase and appropriate critique depth (concept vs final)',
        'Review previous critique outcomes and unresolved issues',
        'Establish relevant design principles for this project/phase',
        'Define evaluation criteria appropriate to design phase:',
        '  - Concept: strategic alignment, user needs, feasibility',
        '  - Wireframe: information architecture, flow, functionality',
        '  - Prototype: interaction design, usability, edge cases',
        '  - High-fidelity: visual design, polish, accessibility, consistency',
        '  - Final: production readiness, completeness, quality',
        'Create critique agenda with time allocations',
        'Prepare guiding questions for each evaluation area',
        'Set expectations for feedback style (constructive, actionable, specific)',
        'Define success criteria for critique session',
        'Generate critique preparation document and agenda'
      ],
      outputFormat: 'JSON with readyForCritique (boolean), applicablePrinciples (array), evaluationFramework (object), agenda (object), missingMaterials (array), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['readyForCritique', 'applicablePrinciples', 'evaluationFramework', 'artifacts'],
      properties: {
        readyForCritique: { type: 'boolean' },
        completenessScore: { type: 'number', minimum: 0, maximum: 100 },
        applicablePrinciples: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              principle: { type: 'string' },
              description: { type: 'string' },
              relevanceToPhase: { type: 'string' }
            }
          }
        },
        evaluationFramework: {
          type: 'object',
          properties: {
            primaryCriteria: { type: 'array', items: { type: 'string' } },
            secondaryCriteria: { type: 'array', items: { type: 'string' } },
            weights: { type: 'object' }
          }
        },
        agenda: {
          type: 'object',
          properties: {
            totalDuration: { type: 'string' },
            sections: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  section: { type: 'string' },
                  duration: { type: 'string' },
                  activities: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        guidingQuestions: { type: 'array', items: { type: 'string' } },
        missingMaterials: { type: 'array', items: { type: 'string' } },
        previousCritiqueInsights: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-critique', 'preparation']
}));

// Task 2: Participant Selection
export const participantSelectionTask = defineTask('participant-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select participants and assign critique roles',
  agent: {
    name: 'critique-coordinator',
    prompt: {
      role: 'design critique coordinator',
      task: 'Select optimal participants for critique session and assign appropriate roles',
      context: args,
      instructions: [
        'Identify ideal participant mix based on critique type and design phase',
        'For comprehensive critique, include: designers, researchers, product managers, engineers, stakeholders',
        'For quick critique, focus on: design team, immediate stakeholders',
        'For stakeholder critique, include: leadership, business stakeholders, product owners',
        'For team critique, include: design team members, cross-functional partners',
        'For expert critique, include: senior designers, design leadership, UX specialists',
        'Assign participant roles:',
        '  - Facilitator: guides discussion, keeps time, manages dynamics',
        '  - Presenter: presents design and context',
        '  - Design reviewers: provide design expertise feedback',
        '  - UX reviewers: focus on usability and user experience',
        '  - Accessibility reviewer: focus on inclusive design',
        '  - Technical reviewer: assess feasibility and implementation',
        '  - Business reviewer: evaluate business goals alignment',
        '  - Scribe: capture feedback and decisions',
        'Balance expertise levels and perspectives',
        'Keep participant count appropriate (6-10 for comprehensive, 3-5 for quick)',
        'Identify any missing critical perspectives',
        'Prepare participant briefing materials',
        'Generate participant roster with roles and responsibilities'
      ],
      outputFormat: 'JSON with selectedParticipants (array), roles (object), participantBriefing (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedParticipants', 'roles', 'artifacts'],
      properties: {
        selectedParticipants: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              participantId: { type: 'string' },
              name: { type: 'string' },
              role: { type: 'string' },
              expertise: { type: 'array', items: { type: 'string' } },
              responsibilities: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        roles: {
          type: 'object',
          properties: {
            facilitator: { type: 'string' },
            presenter: { type: 'string' },
            scribe: { type: 'string' },
            reviewers: { type: 'array', items: { type: 'string' } }
          }
        },
        participantMix: {
          type: 'object',
          properties: {
            designers: { type: 'number' },
            researchers: { type: 'number' },
            engineers: { type: 'number' },
            productManagers: { type: 'number' },
            stakeholders: { type: 'number' }
          }
        },
        missingPerspectives: { type: 'array', items: { type: 'string' } },
        participantBriefing: {
          type: 'object',
          properties: {
            briefingDocPath: { type: 'string' },
            preworkMaterials: { type: 'array', items: { type: 'string' } }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-critique', 'participant-selection']
}));

// Task 3: Context Presentation
export const contextPresentationTask = defineTask('context-presentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Present design context and objectives',
  agent: {
    name: 'design-presenter',
    prompt: {
      role: 'design presenter and storyteller',
      task: 'Create compelling presentation of design context, objectives, decisions, and areas for feedback',
      context: args,
      instructions: [
        'Structure context presentation in clear narrative:',
        '  1. Project background and business objectives',
        '  2. User needs and research insights that informed design',
        '  3. Design goals and success criteria',
        '  4. Constraints and considerations (technical, timeline, business)',
        '  5. Key design decisions and rationale',
        '  6. Alternative approaches considered and why rejected',
        '  7. Specific areas where feedback is most valuable',
        '  8. Known issues or questions',
        'Present user flows and interaction patterns',
        'Walk through design solutions with screenshots/prototypes',
        'Highlight design principles applied',
        'Explain trade-offs made',
        'Set context for design phase (concept, wireframe, prototype, etc.)',
        'Frame specific questions for critique participants',
        'Define out-of-scope items (not for critique today)',
        'Establish psychological safety for honest feedback',
        'Generate context presentation deck and speaker notes'
      ],
      outputFormat: 'JSON with presentationDeckPath (string), keyPoints (array), designDecisions (array), feedbackAreas (array), specificQuestions (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['presentationDeckPath', 'keyPoints', 'designDecisions', 'artifacts'],
      properties: {
        presentationDeckPath: { type: 'string' },
        keyPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              topic: { type: 'string' },
              message: { type: 'string' },
              importance: { type: 'string', enum: ['critical', 'high', 'medium'] }
            }
          }
        },
        designDecisions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              decision: { type: 'string' },
              rationale: { type: 'string' },
              alternativesConsidered: { type: 'array', items: { type: 'string' } },
              tradeOffs: { type: 'string' }
            }
          }
        },
        feedbackAreas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              specificQuestion: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        specificQuestions: { type: 'array', items: { type: 'string' } },
        knownIssues: { type: 'array', items: { type: 'string' } },
        outOfScope: { type: 'array', items: { type: 'string' } },
        presentationDuration: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-critique', 'context-presentation']
}));

// Task 4: Initial Design Review
export const initialDesignReviewTask = defineTask('initial-design-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct initial design review and collect observations',
  agent: {
    name: 'design-reviewer',
    prompt: {
      role: 'experienced design reviewer',
      task: 'Conduct thorough initial review of designs, collecting observations across all evaluation dimensions',
      context: args,
      instructions: [
        'Systematically review all design materials with fresh eyes',
        'Use silent review technique: participants review independently first',
        'Collect observations across evaluation dimensions:',
        '  - User experience and usability',
        '  - Visual design and aesthetics',
        '  - Interaction patterns and flows',
        '  - Information architecture and content',
        '  - Accessibility and inclusive design',
        '  - Technical feasibility',
        '  - Brand consistency and design system adherence',
        '  - Edge cases and error states',
        'Note initial impressions and gut reactions',
        'Identify design strengths and successful elements',
        'Flag concerns, questions, and potential issues',
        'Note confusing or unclear areas',
        'Capture specific examples for each observation',
        'Avoid solutions at this stage - focus on observations',
        'Categorize observations by severity: critical, major, minor, suggestion',
        'Compile comprehensive observation log'
      ],
      outputFormat: 'JSON with observationCount (number), observations (array), strengths (array), concerns (array), questions (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['observationCount', 'observations', 'strengths', 'concerns', 'artifacts'],
      properties: {
        observationCount: { type: 'number' },
        observations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              observation: { type: 'string' },
              category: { type: 'string', enum: ['usability', 'visual-design', 'interaction', 'content', 'accessibility', 'technical', 'consistency', 'edge-cases'] },
              severity: { type: 'string', enum: ['critical', 'major', 'minor', 'suggestion'] },
              location: { type: 'string' },
              evidence: { type: 'string' }
            }
          }
        },
        strengths: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              strength: { type: 'string' },
              impact: { type: 'string' },
              example: { type: 'string' }
            }
          }
        },
        concerns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              concern: { type: 'string' },
              severity: { type: 'string' },
              potentialImpact: { type: 'string' }
            }
          }
        },
        questions: { type: 'array', items: { type: 'string' } },
        initialImpressions: {
          type: 'object',
          properties: {
            clarity: { type: 'string', enum: ['excellent', 'good', 'fair', 'poor'] },
            completeness: { type: 'string', enum: ['complete', 'mostly-complete', 'incomplete'] },
            consistency: { type: 'string', enum: ['consistent', 'mostly-consistent', 'inconsistent'] }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-critique', 'initial-review']
}));

// Task 5: Design Principles Evaluation
export const designPrinciplesEvaluationTask = defineTask('design-principles-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate design against established principles',
  agent: {
    name: 'design-principles-evaluator',
    prompt: {
      role: 'senior design strategist',
      task: 'Evaluate how well the design adheres to established design principles and brand guidelines',
      context: args,
      instructions: [
        'Review each applicable design principle',
        'For each principle, assess:',
        '  - How well the design embodies this principle (score 0-100)',
        '  - Specific examples where principle is applied well',
        '  - Areas where principle is violated or weakly applied',
        '  - Impact of adherence/violation on overall experience',
        'Common design principles to evaluate:',
        '  - Clarity and simplicity',
        '  - Consistency and predictability',
        '  - Hierarchy and emphasis',
        '  - Feedback and communication',
        '  - User control and freedom',
        '  - Error prevention and recovery',
        '  - Accessibility and inclusion',
        '  - Efficiency and performance',
        '  - Beauty and emotional design',
        'Assess brand guideline adherence if applicable',
        'Identify principle conflicts or trade-offs',
        'Calculate overall adherence score (weighted average)',
        'Generate principles evaluation report with examples'
      ],
      outputFormat: 'JSON with adherenceScore (number 0-100), principleScores (array), violations (array), tradeOffs (array), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['adherenceScore', 'principleScores', 'artifacts'],
      properties: {
        adherenceScore: { type: 'number', minimum: 0, maximum: 100 },
        principleScores: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              principle: { type: 'string' },
              score: { type: 'number', minimum: 0, maximum: 100 },
              assessment: { type: 'string' },
              positiveExamples: { type: 'array', items: { type: 'string' } },
              violations: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        violations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              principle: { type: 'string' },
              violation: { type: 'string' },
              location: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'major', 'minor'] },
              suggestedFix: { type: 'string' }
            }
          }
        },
        tradeOffs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tradeOff: { type: 'string' },
              principlesInConflict: { type: 'array', items: { type: 'string' } },
              currentApproach: { type: 'string' },
              isAppropriateTradeOff: { type: 'boolean' }
            }
          }
        },
        brandAdherence: {
          type: 'object',
          properties: {
            score: { type: 'number', minimum: 0, maximum: 100 },
            assessment: { type: 'string' }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-critique', 'principles-evaluation']
}));

// Task 6: Usability Assessment
export const usabilityAssessmentTask = defineTask('usability-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess usability and user experience quality',
  agent: {
    name: 'usability-expert',
    prompt: {
      role: 'senior usability expert',
      task: 'Conduct comprehensive usability assessment identifying UX issues and opportunities',
      context: args,
      instructions: [
        'Evaluate against Jakob Nielsen\'s 10 usability heuristics:',
        '  1. Visibility of system status',
        '  2. Match between system and real world',
        '  3. User control and freedom',
        '  4. Consistency and standards',
        '  5. Error prevention',
        '  6. Recognition rather than recall',
        '  7. Flexibility and efficiency of use',
        '  8. Aesthetic and minimalist design',
        '  9. Help users recognize, diagnose, and recover from errors',
        '  10. Help and documentation',
        'Assess information architecture and navigation',
        'Evaluate cognitive load and complexity',
        'Review task flow efficiency and friction points',
        'Identify usability issues by severity:',
        '  - Critical: prevents task completion, affects all users',
        '  - Major: significant impact, workarounds difficult',
        '  - Minor: minor annoyance, easy workarounds',
        'Evaluate learnability and discoverability',
        'Assess feedback mechanisms and error handling',
        'Review content clarity and comprehension',
        'Identify micro-interactions and delighters',
        'Calculate usability score (weighted average across heuristics)',
        'Generate detailed usability assessment report'
      ],
      outputFormat: 'JSON with usabilityScore (number 0-100), heuristicScores (array), criticalIssues (array), majorIssues (array), minorIssues (array), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['usabilityScore', 'heuristicScores', 'criticalIssues', 'artifacts'],
      properties: {
        usabilityScore: { type: 'number', minimum: 0, maximum: 100 },
        heuristicScores: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              heuristic: { type: 'string' },
              score: { type: 'number', minimum: 0, maximum: 100 },
              assessment: { type: 'string' },
              issues: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        criticalIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              heuristic: { type: 'string' },
              location: { type: 'string' },
              impact: { type: 'string' },
              userImpact: { type: 'string' },
              suggestedFix: { type: 'string' }
            }
          }
        },
        majorIssues: { type: 'array' },
        minorIssues: { type: 'array' },
        cognitiveLoadAssessment: {
          type: 'object',
          properties: {
            overall: { type: 'string', enum: ['low', 'moderate', 'high', 'very-high'] },
            issueAreas: { type: 'array', items: { type: 'string' } }
          }
        },
        taskFlowEfficiency: {
          type: 'object',
          properties: {
            primaryFlows: { type: 'array' },
            frictionPoints: { type: 'array', items: { type: 'string' } }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-critique', 'usability-assessment']
}));

// Task 7: Visual Design Critique
export const visualDesignCritiqueTask = defineTask('visual-design-critique', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Critique visual design and aesthetic choices',
  agent: {
    name: 'visual-design-critic',
    prompt: {
      role: 'senior visual designer and design critic',
      task: 'Critique visual design quality, aesthetic choices, and design execution',
      context: args,
      instructions: [
        'Evaluate visual hierarchy and emphasis',
        'Assess typography choices (font selection, sizing, spacing, readability)',
        'Review color palette usage and application',
        'Evaluate spacing, padding, and white space usage',
        'Assess visual consistency across screens/components',
        'Review iconography and imagery quality',
        'Evaluate visual balance and composition',
        'Assess visual complexity vs simplicity',
        'Review interaction affordances and signifiers',
        'Evaluate brand expression and personality',
        'Assess polish and attention to detail',
        'Review responsive design execution',
        'Identify visual inconsistencies or irregularities',
        'Evaluate emotional design and delight factors',
        'Calculate visual design score across dimensions',
        'Generate visual design critique report with annotated examples'
      ],
      outputFormat: 'JSON with visualScore (number 0-100), dimensionScores (object), strengths (array), improvements (array), inconsistencies (array), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['visualScore', 'dimensionScores', 'strengths', 'improvements', 'artifacts'],
      properties: {
        visualScore: { type: 'number', minimum: 0, maximum: 100 },
        dimensionScores: {
          type: 'object',
          properties: {
            visualHierarchy: { type: 'number' },
            typography: { type: 'number' },
            color: { type: 'number' },
            spacing: { type: 'number' },
            consistency: { type: 'number' },
            composition: { type: 'number' },
            polish: { type: 'number' }
          }
        },
        strengths: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              strength: { type: 'string' },
              dimension: { type: 'string' },
              example: { type: 'string' }
            }
          }
        },
        improvements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              improvement: { type: 'string' },
              dimension: { type: 'string' },
              currentState: { type: 'string' },
              suggestedChange: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        inconsistencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              inconsistency: { type: 'string' },
              locations: { type: 'array', items: { type: 'string' } },
              severity: { type: 'string' }
            }
          }
        },
        brandAlignment: {
          type: 'object',
          properties: {
            score: { type: 'number' },
            assessment: { type: 'string' }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-critique', 'visual-design']
}));

// Task 8: Accessibility Review
export const accessibilityReviewTask = defineTask('accessibility-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review accessibility and inclusive design',
  agent: {
    name: 'accessibility-specialist',
    prompt: {
      role: 'accessibility specialist and inclusive design expert',
      task: 'Conduct comprehensive accessibility review against WCAG standards and inclusive design principles',
      context: args,
      instructions: [
        'Review against WCAG 2.1 Level AA guidelines (or AAA if required)',
        'Assess perceivability:',
        '  - Text alternatives for non-text content',
        '  - Color contrast ratios (4.5:1 for normal text, 3:1 for large text)',
        '  - Use of color alone to convey information',
        '  - Text sizing and scalability',
        'Assess operability:',
        '  - Keyboard navigation and focus management',
        '  - Touch target sizes (minimum 44x44px)',
        '  - Focus indicators visibility',
        '  - No keyboard traps',
        'Assess understandability:',
        '  - Clear labels and instructions',
        '  - Error identification and suggestions',
        '  - Consistent navigation and identification',
        '  - Predictable functionality',
        'Assess robustness:',
        '  - Semantic HTML and ARIA usage',
        '  - Compatibility with assistive technologies',
        '  - Progressive enhancement',
        'Identify accessibility barriers for users with:',
        '  - Visual impairments (blindness, low vision, color blindness)',
        '  - Motor impairments (limited dexterity, tremors)',
        '  - Cognitive impairments (memory, attention, comprehension)',
        '  - Auditory impairments',
        'Calculate accessibility score across WCAG principles',
        'Prioritize accessibility issues by impact and WCAG level',
        'Generate accessibility audit report with remediation guidance'
      ],
      outputFormat: 'JSON with accessibilityScore (number 0-100), wcagCompliance (object), issues (array), barriers (object), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['accessibilityScore', 'wcagCompliance', 'issues', 'artifacts'],
      properties: {
        accessibilityScore: { type: 'number', minimum: 0, maximum: 100 },
        wcagCompliance: {
          type: 'object',
          properties: {
            levelA: { type: 'boolean' },
            levelAA: { type: 'boolean' },
            levelAAA: { type: 'boolean' },
            compliancePercentage: { type: 'number' }
          }
        },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              wcagCriterion: { type: 'string' },
              level: { type: 'string', enum: ['A', 'AA', 'AAA'] },
              severity: { type: 'string', enum: ['critical', 'major', 'minor'] },
              location: { type: 'string' },
              userImpact: { type: 'string' },
              remediation: { type: 'string' }
            }
          }
        },
        barriers: {
          type: 'object',
          properties: {
            visual: { type: 'array', items: { type: 'string' } },
            motor: { type: 'array', items: { type: 'string' } },
            cognitive: { type: 'array', items: { type: 'string' } },
            auditory: { type: 'array', items: { type: 'string' } }
          }
        },
        contrastIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              location: { type: 'string' },
              ratio: { type: 'number' },
              required: { type: 'number' },
              passes: { type: 'boolean' }
            }
          }
        },
        keyboardNavigationScore: { type: 'number', minimum: 0, maximum: 100 },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-critique', 'accessibility-review']
}));

// Task 9: Structured Feedback Collection
export const structuredFeedbackCollectionTask = defineTask('structured-feedback-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Collect structured feedback from all participants',
  agent: {
    name: 'feedback-collector',
    prompt: {
      role: 'design critique facilitator',
      task: 'Facilitate structured feedback collection from all critique participants ensuring actionable, specific, constructive input',
      context: args,
      instructions: [
        'Collect feedback using structured framework:',
        '  - What works well? (strengths)',
        '  - What could be improved? (opportunities)',
        '  - What are you uncertain about? (questions)',
        '  - What are critical issues? (blockers)',
        'Guide participants to provide:',
        '  - Specific, not vague ("The button is unclear" vs "I don\'t like it")',
        '  - Actionable, not just critical',
        '  - Constructive, focused on improving design',
        '  - Evidence-based, grounded in principles/research',
        'Use facilitation techniques:',
        '  - Round-robin to hear all voices',
        '  - Affinity grouping of similar feedback',
        '  - Dot voting to prioritize issues',
        '  - Parking lot for off-topic discussions',
        'Capture feedback with:',
        '  - Full description of issue/observation',
        '  - Specific location in design',
        '  - Severity/priority level',
        '  - User impact',
        '  - Suggested solutions (if any)',
        '  - Supporting rationale',
        'Ensure diverse perspectives are heard',
        'Prevent design-by-committee or group-think',
        'Keep feedback focused on current design phase',
        'Compile comprehensive feedback log with participant attribution'
      ],
      outputFormat: 'JSON with feedbackCount (number), participantCount (number), feedbackItems (array), participantContributions (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['feedbackCount', 'participantCount', 'feedbackItems', 'artifacts'],
      properties: {
        feedbackCount: { type: 'number' },
        participantCount: { type: 'number' },
        feedbackItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              feedbackId: { type: 'string' },
              participant: { type: 'string' },
              type: { type: 'string', enum: ['strength', 'opportunity', 'question', 'critical-issue'] },
              category: { type: 'string' },
              feedback: { type: 'string' },
              location: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'major', 'minor', 'suggestion'] },
              userImpact: { type: 'string' },
              suggestedSolution: { type: 'string' },
              rationale: { type: 'string' },
              votes: { type: 'number' }
            }
          }
        },
        participantContributions: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              feedbackCount: { type: 'number' },
              perspective: { type: 'string' }
            }
          }
        },
        feedbackDistribution: {
          type: 'object',
          properties: {
            strengths: { type: 'number' },
            opportunities: { type: 'number' },
            questions: { type: 'number' },
            criticalIssues: { type: 'number' }
          }
        },
        participationBalance: { type: 'string', enum: ['balanced', 'unbalanced', 'dominated'] },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-critique', 'feedback-collection']
}));

// Task 10: Feedback Synthesis
export const feedbackSynthesisTask = defineTask('feedback-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize and categorize feedback',
  agent: {
    name: 'feedback-synthesizer',
    prompt: {
      role: 'design strategist and synthesis expert',
      task: 'Synthesize all feedback into coherent themes, patterns, and actionable insights',
      context: args,
      instructions: [
        'Organize all feedback using affinity mapping',
        'Identify common themes and patterns across feedback',
        'Group related feedback items together',
        'Categorize feedback by:',
        '  - Design dimension (usability, visual, interaction, content, accessibility)',
        '  - Design phase impact (concept, wireframe, prototype, visual, implementation)',
        '  - Severity (critical, major, minor, enhancement)',
        '  - Type (issue, question, suggestion, praise)',
        'Resolve conflicting feedback:',
        '  - Identify contradictions',
        '  - Assess which perspective aligns with goals',
        '  - Note where user research is needed',
        'Quantify feedback frequency:',
        '  - How many participants raised each theme?',
        '  - Which issues had consensus?',
        'Distinguish between:',
        '  - Must-fix issues (blockers, critical problems)',
        '  - Should-fix issues (significant improvements)',
        '  - Nice-to-have enhancements',
        '  - Personal preferences (note but deprioritize)',
        'Calculate feedback statistics and trends',
        'Generate synthesis report with categorized, prioritized feedback'
      ],
      outputFormat: 'JSON with themeCount (number), themes (array), feedbackBreakdown (object), conflictingFeedback (array), consensusItems (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['themeCount', 'themes', 'feedbackBreakdown', 'artifacts'],
      properties: {
        themeCount: { type: 'number' },
        themes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              theme: { type: 'string' },
              description: { type: 'string' },
              feedbackCount: { type: 'number' },
              participantCount: { type: 'number' },
              relatedFeedback: { type: 'array', items: { type: 'string' } },
              severity: { type: 'string' },
              category: { type: 'string' }
            }
          }
        },
        feedbackBreakdown: {
          type: 'object',
          properties: {
            byCategory: { type: 'object' },
            bySeverity: { type: 'object' },
            byType: { type: 'object' }
          }
        },
        conflictingFeedback: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              topic: { type: 'string' },
              perspective1: { type: 'string' },
              perspective2: { type: 'string' },
              resolution: { type: 'string' }
            }
          }
        },
        consensusItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              item: { type: 'string' },
              participantAgreement: { type: 'number' },
              type: { type: 'string', enum: ['issue', 'strength', 'opportunity'] }
            }
          }
        },
        mustFixItems: { type: 'array', items: { type: 'string' } },
        shouldFixItems: { type: 'array', items: { type: 'string' } },
        niceToHaveItems: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-critique', 'feedback-synthesis']
}));

// Task 11: Strengths and Opportunities
export const strengthsOpportunitiesTask = defineTask('strengths-opportunities', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify design strengths and opportunities',
  agent: {
    name: 'design-strategist',
    prompt: {
      role: 'design strategist',
      task: 'Identify and articulate design strengths to preserve and opportunities to enhance',
      context: args,
      instructions: [
        'Identify design strengths (what\'s working well):',
        '  - Positive feedback from critique',
        '  - Successful implementation of principles',
        '  - Strong usability patterns',
        '  - Effective visual design elements',
        '  - Innovative or delightful interactions',
        'For each strength:',
        '  - Articulate what makes it successful',
        '  - Explain user benefit',
        '  - Note how it could be amplified or replicated',
        '  - Flag for preservation in iterations',
        'Identify opportunities (areas for enhancement):',
        '  - Patterns that could be improved',
        '  - Underutilized design elements',
        '  - Potential for innovation',
        '  - Competitive differentiators',
        '  - Quick wins for significant impact',
        'For each opportunity:',
        '  - Describe current state',
        '  - Articulate potential future state',
        '  - Estimate impact if realized',
        '  - Assess feasibility and effort',
        'Prioritize opportunities by impact and alignment with goals',
        'Generate strengths and opportunities report'
      ],
      outputFormat: 'JSON with strengths (array), opportunities (array), preservationGuidance (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strengths', 'opportunities', 'artifacts'],
      properties: {
        strengths: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              strength: { type: 'string' },
              dimension: { type: 'string' },
              whySuccessful: { type: 'string' },
              userBenefit: { type: 'string' },
              howToAmplify: { type: 'string' },
              examples: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        opportunities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              opportunity: { type: 'string' },
              currentState: { type: 'string' },
              potentialState: { type: 'string' },
              impact: { type: 'string', enum: ['low', 'medium', 'high', 'transformative'] },
              effort: { type: 'string', enum: ['low', 'medium', 'high'] },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              rationale: { type: 'string' }
            }
          }
        },
        preservationGuidance: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              element: { type: 'string' },
              whyPreserve: { type: 'string' },
              cautionNote: { type: 'string' }
            }
          }
        },
        quickWinOpportunities: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-critique', 'strengths-opportunities']
}));

// Task 12: Critical Issues Assessment
export const criticalIssuesAssessmentTask = defineTask('critical-issues-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess critical issues and design blockers',
  agent: {
    name: 'critical-issues-analyst',
    prompt: {
      role: 'senior design problem solver',
      task: 'Identify, assess, and prioritize critical design issues and blockers that must be resolved',
      context: args,
      instructions: [
        'Identify critical issues (prevent success, block users, high risk):',
        '  - Usability blockers preventing task completion',
        '  - Accessibility barriers excluding user groups',
        '  - Technical feasibility issues',
        '  - Business goal misalignment',
        '  - Legal/compliance violations',
        '  - Brand violations',
        'For each critical issue:',
        '  - Describe issue clearly and specifically',
        '  - Explain user impact and business risk',
        '  - Identify root cause',
        '  - Assess severity and urgency',
        '  - Determine if it\'s a blocker (prevents phase progression)',
        'Categorize issues:',
        '  - Blockers: must fix before proceeding',
        '  - Critical: must fix before launch',
        '  - Major: significant impact, should fix soon',
        'Assess cross-dependencies between issues',
        'Estimate resolution complexity and effort',
        'Identify quick fixes vs redesigns needed',
        'Create impact assessment matrix',
        'Generate resolution plan for blockers',
        'Generate critical issues report with prioritization'
      ],
      outputFormat: 'JSON with criticalIssues (array), blockers (array), allIssues (array), impactAssessment (object), resolutionEstimates (array), blockersReportPath (string), resolutionPlanPath (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['criticalIssues', 'blockers', 'allIssues', 'impactAssessment', 'artifacts'],
      properties: {
        criticalIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issueId: { type: 'string' },
              issue: { type: 'string' },
              category: { type: 'string' },
              severity: { type: 'string', enum: ['blocker', 'critical', 'major'] },
              userImpact: { type: 'string' },
              businessRisk: { type: 'string' },
              rootCause: { type: 'string' },
              location: { type: 'string' },
              affectedUsers: { type: 'string' }
            }
          }
        },
        blockers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              blocker: { type: 'string' },
              whyBlocker: { type: 'string' },
              mustResolveBy: { type: 'string' },
              resolutionApproach: { type: 'string' },
              estimatedEffort: { type: 'string' }
            }
          }
        },
        allIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              severity: { type: 'string' },
              priority: { type: 'number' }
            }
          }
        },
        impactAssessment: {
          type: 'object',
          properties: {
            userExperienceRisk: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
            businessRisk: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
            technicalRisk: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
            timelineRisk: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] }
          }
        },
        resolutionEstimates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              complexity: { type: 'string', enum: ['quick-fix', 'moderate', 'complex', 'redesign'] },
              estimatedEffort: { type: 'string' },
              dependencies: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        blockersReportPath: { type: 'string' },
        resolutionPlanPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-critique', 'critical-issues']
}));

// Task 13: Recommendations Generation
export const recommendationsGenerationTask = defineTask('recommendations-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate actionable design recommendations',
  agent: {
    name: 'design-advisor',
    prompt: {
      role: 'senior design advisor',
      task: 'Transform critique insights into specific, actionable design recommendations',
      context: args,
      instructions: [
        'For each theme, issue, and opportunity, generate specific recommendations',
        'Ensure recommendations are:',
        '  - Specific and concrete (not vague)',
        '  - Actionable (clear what to do)',
        '  - Evidence-based (grounded in critique findings)',
        '  - User-centered (focused on user benefit)',
        '  - Feasible (realistic to implement)',
        'Structure recommendations:',
        '  - Current state: what exists now',
        '  - Recommended change: what to do',
        '  - Rationale: why this improves design',
        '  - Expected outcome: user/business benefit',
        '  - Implementation notes: how to approach',
        'Categorize recommendations by:',
        '  - Design dimension (usability, visual, interaction, content, accessibility, technical)',
        '  - Type (fix issue, enhance existing, add new, remove/simplify)',
        '  - Phase (when to address: this iteration, next phase, future)',
        'Link recommendations to:',
        '  - Design principles',
        '  - Critical issues they resolve',
        '  - Opportunities they realize',
        'Avoid:',
        '  - Prescribing specific solutions (suggest directions, not pixel-perfect specs)',
        '  - Contradicting preservable strengths',
        '  - Recommending out-of-scope changes',
        'Generate comprehensive recommendations document'
      ],
      outputFormat: 'JSON with recommendations (array), recommendationsByCategory (object), totalRecommendations (number), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'recommendationsByCategory', 'artifacts'],
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendationId: { type: 'string' },
              recommendation: { type: 'string' },
              currentState: { type: 'string' },
              proposedChange: { type: 'string' },
              rationale: { type: 'string' },
              expectedOutcome: { type: 'string' },
              userBenefit: { type: 'string' },
              category: { type: 'string' },
              type: { type: 'string', enum: ['fix-issue', 'enhance-existing', 'add-new', 'remove-simplify'] },
              relatedIssues: { type: 'array', items: { type: 'string' } },
              relatedPrinciples: { type: 'array', items: { type: 'string' } },
              implementationNotes: { type: 'string' }
            }
          }
        },
        recommendationsByCategory: {
          type: 'object',
          properties: {
            usability: { type: 'array' },
            visualDesign: { type: 'array' },
            interaction: { type: 'array' },
            content: { type: 'array' },
            accessibility: { type: 'array' },
            technical: { type: 'array' }
          }
        },
        totalRecommendations: { type: 'number' },
        criticalRecommendations: {
          type: 'array',
          items: { type: 'string' },
          description: 'Must-do recommendations'
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-critique', 'recommendations']
}));

// Task 14: Prioritization
export const prioritizationTask = defineTask('prioritization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prioritize recommendations by impact and effort',
  agent: {
    name: 'prioritization-strategist',
    prompt: {
      role: 'design strategist and prioritization expert',
      task: 'Prioritize recommendations using impact vs effort framework',
      context: args,
      instructions: [
        'Assess each recommendation on two dimensions:',
        '  1. Impact (user benefit, business value, problem severity)',
        '  2. Effort (time, complexity, resources, dependencies)',
        'Use 2x2 impact-effort matrix:',
        '  - High Impact, Low Effort = Quick Wins (do immediately)',
        '  - High Impact, High Effort = Major Projects (plan carefully)',
        '  - Low Impact, Low Effort = Fill-ins (do when time permits)',
        '  - Low Impact, High Effort = Avoid (deprioritize)',
        'Consider additional factors:',
        '  - Severity of issue being fixed',
        '  - User impact scope (affects all vs some users)',
        '  - Strategic alignment with goals',
        '  - Dependencies on other work',
        '  - Risk if not addressed',
        '  - Available timeline and resources',
        'Group recommendations:',
        '  - Must-do (blockers, critical issues)',
        '  - Should-do (high impact improvements)',
        '  - Nice-to-have (enhancements)',
        'Create prioritized action list',
        'Identify quick wins to tackle first',
        'Identify major projects needing planning',
        'Generate prioritization matrix visualization',
        'Generate prioritized recommendations report'
      ],
      outputFormat: 'JSON with impactEffortMatrix (object), quickWins (array), majorProjects (array), fillIns (array), mustDo (array), shouldDo (array), niceToHave (array), prioritizedList (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['impactEffortMatrix', 'quickWins', 'shortTermActions', 'longTermActions', 'artifacts'],
      properties: {
        impactEffortMatrix: {
          type: 'object',
          properties: {
            quickWins: { type: 'array', items: { type: 'string' } },
            majorProjects: { type: 'array', items: { type: 'string' } },
            fillIns: { type: 'array', items: { type: 'string' } },
            avoid: { type: 'array', items: { type: 'string' } }
          }
        },
        quickWins: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              impact: { type: 'string' },
              effort: { type: 'string' },
              estimatedTime: { type: 'string' }
            }
          }
        },
        shortTermActions: {
          type: 'array',
          description: 'Actions for current/next iteration'
        },
        longTermActions: {
          type: 'array',
          description: 'Actions for future iterations'
        },
        mustDo: { type: 'array', items: { type: 'string' } },
        shouldDo: { type: 'array', items: { type: 'string' } },
        niceToHave: { type: 'array', items: { type: 'string' } },
        prioritizedList: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rank: { type: 'number' },
              recommendation: { type: 'string' },
              priority: { type: 'string' },
              reasoning: { type: 'string' }
            }
          }
        },
        matrixVisualizationPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-critique', 'prioritization']
}));

// Task 15: Iteration Planning
export const iterationPlanningTask = defineTask('iteration-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan design iterations and create roadmap',
  agent: {
    name: 'iteration-planner',
    prompt: {
      role: 'design project manager and strategist',
      task: 'Create detailed iteration plan and roadmap for implementing critique recommendations',
      context: args,
      instructions: [
        'Group recommendations into logical iterations',
        'Define iteration goals and success criteria',
        'Consider iteration constraints:',
        '  - Timeline and deadlines',
        '  - Resource availability',
        '  - Dependencies between changes',
        '  - Risk and complexity',
        'Plan iteration 1 (immediate):',
        '  - Quick wins',
        '  - Critical blocker fixes',
        '  - High impact, low effort improvements',
        'Plan iteration 2 (short-term):',
        '  - Must-do improvements',
        '  - Major usability fixes',
        '  - Moderate effort enhancements',
        'Plan iteration 3+ (long-term):',
        '  - Nice-to-have enhancements',
        '  - Major redesigns',
        '  - Future opportunities',
        'For each iteration:',
        '  - List specific changes to make',
        '  - Estimate duration',
        '  - Identify resources needed',
        '  - Define deliverables',
        '  - Set review checkpoints',
        'Create visual roadmap showing iteration timeline',
        'Define success metrics to measure improvement',
        'Generate iteration plan document'
      ],
      outputFormat: 'JSON with iterations (array), iterationCount (number), estimatedDuration (string), roadmapPath (string), successMetrics (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['iterations', 'iterationCount', 'estimatedDuration', 'roadmapPath', 'artifacts'],
      properties: {
        iterations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              iterationNumber: { type: 'number' },
              name: { type: 'string' },
              goal: { type: 'string' },
              changes: { type: 'array', items: { type: 'string' } },
              duration: { type: 'string' },
              resources: { type: 'array', items: { type: 'string' } },
              deliverables: { type: 'array', items: { type: 'string' } },
              successCriteria: { type: 'array', items: { type: 'string' } },
              dependencies: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        iterationCount: { type: 'number' },
        estimatedDuration: { type: 'string' },
        timeline: {
          type: 'object',
          properties: {
            startDate: { type: 'string' },
            estimatedEndDate: { type: 'string' },
            milestones: { type: 'array' }
          }
        },
        successMetrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              currentBaseline: { type: 'string' },
              target: { type: 'string' },
              measurementMethod: { type: 'string' }
            }
          }
        },
        reviewCheckpoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              checkpoint: { type: 'string' },
              timing: { type: 'string' },
              reviewers: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        roadmapPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-critique', 'iteration-planning']
}));

// Task 16: Design System Consistency Check
export const designSystemConsistencyTask = defineTask('design-system-consistency', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Check design system and pattern consistency',
  agent: {
    name: 'design-system-auditor',
    prompt: {
      role: 'design system specialist',
      task: 'Audit design for consistency with design system, component library, and established patterns',
      context: args,
      instructions: [
        'Review design against design system (if exists)',
        'Check component usage:',
        '  - Are standard components used correctly?',
        '  - Are there custom variants that should be standardized?',
        '  - Are components used consistently across screens?',
        'Audit design tokens adherence:',
        '  - Colors from palette',
        '  - Typography from type scale',
        '  - Spacing from spacing scale',
        '  - Correct usage of shadows, radii, etc.',
        'Check pattern consistency:',
        '  - Navigation patterns',
        '  - Form patterns',
        '  - Feedback patterns',
        '  - Layout patterns',
        'Identify inconsistencies and deviations',
        'Assess if deviations are intentional/justified',
        'Identify opportunities to leverage design system better',
        'Flag new patterns that could be added to system',
        'Calculate consistency score',
        'Generate consistency audit report'
      ],
      outputFormat: 'JSON with consistencyScore (number 0-100), inconsistencies (array), newPatterns (array), patternAlignmentScore (number), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['consistencyScore', 'inconsistencies', 'patternAlignmentScore', 'artifacts'],
      properties: {
        consistencyScore: { type: 'number', minimum: 0, maximum: 100 },
        patternAlignmentScore: { type: 'number', minimum: 0, maximum: 100 },
        inconsistencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              inconsistency: { type: 'string' },
              location: { type: 'string' },
              category: { type: 'string', enum: ['component', 'token', 'pattern', 'style'] },
              severity: { type: 'string', enum: ['major', 'minor'] },
              expectedUsage: { type: 'string' },
              actualUsage: { type: 'string' },
              isJustified: { type: 'boolean' }
            }
          }
        },
        componentUsage: {
          type: 'object',
          properties: {
            standardComponents: { type: 'number' },
            customVariants: { type: 'number' },
            misusedComponents: { type: 'array', items: { type: 'string' } }
          }
        },
        tokenAdherence: {
          type: 'object',
          properties: {
            colors: { type: 'number' },
            typography: { type: 'number' },
            spacing: { type: 'number' },
            overall: { type: 'number' }
          }
        },
        newPatterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              description: { type: 'string' },
              shouldBeSystemized: { type: 'boolean' }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-critique', 'design-system-consistency']
}));

// Task 17: Cross-Functional Impact Assessment
export const crossFunctionalImpactTask = defineTask('cross-functional-impact', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess cross-functional impact',
  agent: {
    name: 'cross-functional-analyst',
    prompt: {
      role: 'product strategist and cross-functional coordinator',
      task: 'Assess impact of design changes on engineering, product, marketing, and other teams',
      context: args,
      instructions: [
        'Assess engineering impact:',
        '  - Implementation complexity',
        '  - Technical feasibility',
        '  - Architecture changes needed',
        '  - API or backend changes required',
        '  - Estimated development effort',
        '  - Technical risks',
        'Assess product impact:',
        '  - Feature scope changes',
        '  - Roadmap implications',
        '  - User story updates needed',
        '  - Release timeline impact',
        'Assess marketing/brand impact:',
        '  - Brand consistency',
        '  - Marketing collateral updates',
        '  - Messaging changes',
        '  - Customer communication needs',
        'Assess other impacts:',
        '  - Support/documentation updates',
        '  - Analytics/tracking changes',
        '  - Legal/compliance considerations',
        '  - Localization needs',
        'Identify cross-team dependencies',
        'Estimate timeline impact across teams',
        'Flag items needing cross-team alignment',
        'Generate cross-functional impact assessment'
      ],
      outputFormat: 'JSON with engineeringImpact (object), productImpact (object), marketingImpact (object), otherImpacts (object), crossTeamDependencies (array), estimatedTimeline (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['engineeringImpact', 'productImpact', 'marketingImpact', 'estimatedTimeline', 'artifacts'],
      properties: {
        engineeringImpact: {
          type: 'object',
          properties: {
            complexity: { type: 'string', enum: ['low', 'medium', 'high', 'very-high'] },
            estimatedEffort: { type: 'string' },
            technicalRisks: { type: 'array', items: { type: 'string' } },
            architectureChanges: { type: 'array', items: { type: 'string' } },
            apiChanges: { type: 'boolean' }
          }
        },
        productImpact: {
          type: 'object',
          properties: {
            scopeChange: { type: 'string', enum: ['none', 'minor', 'moderate', 'major'] },
            roadmapImpact: { type: 'string' },
            releaseTimelineImpact: { type: 'string' },
            userStoryUpdates: { type: 'number' }
          }
        },
        marketingImpact: {
          type: 'object',
          properties: {
            brandConsistency: { type: 'string', enum: ['aligned', 'minor-updates', 'major-updates'] },
            collateralUpdates: { type: 'array', items: { type: 'string' } },
            messagingChanges: { type: 'array', items: { type: 'string' } }
          }
        },
        otherImpacts: {
          type: 'object',
          properties: {
            documentation: { type: 'array', items: { type: 'string' } },
            analytics: { type: 'array', items: { type: 'string' } },
            compliance: { type: 'array', items: { type: 'string' } },
            localization: { type: 'boolean' }
          }
        },
        crossTeamDependencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dependency: { type: 'string' },
              teams: { type: 'array', items: { type: 'string' } },
              timing: { type: 'string' }
            }
          }
        },
        estimatedTimeline: { type: 'string' },
        alignmentNeeded: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-critique', 'cross-functional-impact']
}));

// Task 18: Critique Documentation
export const critiqueDocumentationTask = defineTask('critique-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document critique outcomes and design decisions',
  agent: {
    name: 'documentation-specialist',
    prompt: {
      role: 'design documentation specialist',
      task: 'Create comprehensive documentation of critique process, decisions, and next steps',
      context: args,
      instructions: [
        'Document critique session:',
        '  - Date, participants, roles',
        '  - Design phase and materials reviewed',
        '  - Critique objectives and focus areas',
        '  - Session format and activities',
        'Document feedback summary:',
        '  - Key themes identified',
        '  - Strengths and opportunities',
        '  - Critical issues and blockers',
        '  - Consensus items',
        'Document design decisions:',
        '  - Decisions made during or after critique',
        '  - Rationale for each decision',
        '  - Alternatives considered',
        '  - Who made decision and when',
        'Document action items:',
        '  - All recommendations',
        '  - Prioritization',
        '  - Assignments and owners',
        '  - Deadlines',
        'Document iteration plan',
        'Create decision log (ADR format if appropriate)',
        'Link to all relevant artifacts',
        'Ensure documentation is searchable and referenceable',
        'Generate comprehensive critique documentation package'
      ],
      outputFormat: 'JSON with sessionDocPath (string), decisionLogPath (string), actionItemsPath (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['sessionDocPath', 'decisionLogPath', 'actionItemsPath', 'artifacts'],
      properties: {
        sessionDocPath: { type: 'string' },
        decisionLogPath: { type: 'string' },
        actionItemsPath: { type: 'string' },
        sessionSummary: {
          type: 'object',
          properties: {
            date: { type: 'string' },
            participants: { type: 'array', items: { type: 'string' } },
            duration: { type: 'string' },
            materialsReviewed: { type: 'array', items: { type: 'string' } }
          }
        },
        decisionsDocumented: { type: 'number' },
        actionItemsDocumented: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-critique', 'documentation']
}));

// Task 19: Design Quality Scoring
export const designQualityScoringTask = defineTask('design-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate overall design quality score',
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'senior design quality auditor',
      task: 'Calculate comprehensive design quality score across all evaluation dimensions',
      context: args,
      instructions: [
        'Aggregate scores from all critique dimensions:',
        '  - Design principles adherence (weight: 15%)',
        '  - Usability and UX quality (weight: 30%)',
        '  - Visual design quality (weight: 20%)',
        '  - Accessibility compliance (weight: 20%)',
        '  - Design system consistency (weight: 15%)',
        'Calculate weighted overall score (0-100)',
        'Adjust score based on:',
        '  - Critical issues present (penalty)',
        '  - Blocker issues present (significant penalty)',
        '  - Design phase appropriateness',
        'Provide score interpretation:',
        '  - 90-100: Excellent, ready to proceed',
        '  - 80-89: Good, minor improvements needed',
        '  - 70-79: Fair, moderate improvements needed',
        '  - 60-69: Needs work, significant improvements required',
        '  - Below 60: Poor, major redesign recommended',
        'Generate verdict and recommendation:',
        '  - Approve (proceed to next phase)',
        '  - Conditional approve (fix specific issues first)',
        '  - Revise (iteration required)',
        'Generate quality scorecard with breakdown',
        'Generate quality assessment report'
      ],
      outputFormat: 'JSON with overallScore (number 0-100), componentScores (object), interpretation (string), verdict (string), recommendation (string), qualityScorecardPath (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'interpretation', 'verdict', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            principlesAdherence: { type: 'number', minimum: 0, maximum: 100 },
            usability: { type: 'number', minimum: 0, maximum: 100 },
            visualDesign: { type: 'number', minimum: 0, maximum: 100 },
            accessibility: { type: 'number', minimum: 0, maximum: 100 },
            consistency: { type: 'number', minimum: 0, maximum: 100 }
          }
        },
        adjustments: {
          type: 'object',
          properties: {
            criticalIssuesPenalty: { type: 'number' },
            blockersPenalty: { type: 'number' },
            phaseBonus: { type: 'number' }
          }
        },
        interpretation: {
          type: 'string',
          enum: ['excellent', 'good', 'fair', 'needs-work', 'poor']
        },
        verdict: {
          type: 'string',
          enum: ['approve', 'conditional-approve', 'revise', 'redesign']
        },
        verdictRationale: { type: 'string' },
        recommendation: { type: 'string' },
        readinessForNextPhase: { type: 'boolean' },
        qualityScorecardPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-critique', 'quality-scoring', 'validation']
}));

// Task 20: Critique Report Generation
export const critiqueReportGenerationTask = defineTask('critique-report-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive critique report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'design communications specialist and report writer',
      task: 'Generate comprehensive, stakeholder-ready design critique report',
      context: args,
      instructions: [
        'Create executive summary (1-2 pages):',
        '  - Overall quality score and verdict',
        '  - Key findings (strengths, issues, opportunities)',
        '  - Critical recommendations',
        '  - Next steps and timeline',
        'Include critique overview:',
        '  - Design phase and objectives',
        '  - Critique type and participants',
        '  - Materials reviewed',
        '  - Evaluation framework used',
        'Present evaluation results:',
        '  - Scores across all dimensions',
        '  - Design principles adherence',
        '  - Usability assessment findings',
        '  - Visual design critique',
        '  - Accessibility review results',
        '  - Consistency audit findings',
        'Document feedback synthesis:',
        '  - Key themes and patterns',
        '  - Strengths to preserve',
        '  - Opportunities to pursue',
        '  - Issues to resolve',
        'Present recommendations:',
        '  - Prioritized list with rationale',
        '  - Impact-effort matrix',
        '  - Quick wins highlighted',
        'Include iteration plan:',
        '  - Planned iterations',
        '  - Timeline and milestones',
        '  - Success metrics',
        'Add cross-functional impact summary',
        'Include appendices:',
        '  - Full feedback log',
        '  - Detailed scoring breakdown',
        '  - All participant contributions',
        '  - Design decision log',
        'Format as professional, well-designed report',
        'Include visual aids: charts, annotated screenshots, matrices',
        'Write for mixed audience: designers, stakeholders, engineers'
      ],
      outputFormat: 'JSON with reportPath (string), executiveSummaryPath (string), keyFindings (array), topRecommendations (array), nextSteps (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummaryPath', 'keyFindings', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummaryPath: { type: 'string' },
        keyFindings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              finding: { type: 'string' },
              category: { type: 'string', enum: ['strength', 'issue', 'opportunity'] },
              importance: { type: 'string', enum: ['critical', 'high', 'medium'] }
            }
          }
        },
        topRecommendations: { type: 'array', items: { type: 'string' } },
        nextSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'string' },
              owner: { type: 'string' },
              deadline: { type: 'string' }
            }
          }
        },
        reportSections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              section: { type: 'string' },
              summary: { type: 'string' }
            }
          }
        },
        visualAids: { type: 'array', items: { type: 'string' } },
        targetAudience: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'design-critique', 'reporting', 'documentation']
}));
