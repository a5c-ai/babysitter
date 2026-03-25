/**
 * @process specializations/product-management/product-launch-gtm
 * @description Product Launch Checklist and Go-To-Market (GTM) Plan - Comprehensive process for planning and
 * executing successful product launches including pre-launch checklist, GTM strategy development, messaging framework,
 * channel strategy, launch timeline, success metrics definition, and post-launch monitoring. Covers market positioning,
 * competitive analysis, launch tiers, stakeholder coordination, and continuous optimization.
 * @inputs { productName: string, launchType: string, targetAudience?: object, launchDate?: string }
 * @outputs { success: boolean, gtmScore: number, launchReadiness: boolean, timeline: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/product-management/product-launch-gtm', {
 *   productName: 'AI-Powered Analytics Dashboard',
 *   launchType: 'major', // 'major', 'minor', 'feature', 'beta'
 *   targetAudience: {
 *     segments: ['enterprise', 'mid-market'],
 *     personas: ['data-analyst', 'business-intelligence-manager'],
 *     geographies: ['North America', 'Europe']
 *   },
 *   launchDate: '2026-06-15',
 *   launchTier: 'tier-1', // 'tier-1' (full), 'tier-2' (limited), 'tier-3' (soft)
 *   marketType: 'existing', // 'new', 'existing', 'adjacent'
 *   competitive: {
 *     competitors: ['Tableau', 'Power BI', 'Looker'],
 *     differentiation: 'AI-powered automated insights'
 *   }
 * });
 *
 * @references
 * - Crossing the Chasm: https://www.harpercollins.com/products/crossing-the-chasm-3rd-edition-geoffrey-a-moore
 * - Product Marketing Alliance GTM: https://productmarketingalliance.com/go-to-market-strategy/
 * - Pragmatic Institute Framework: https://www.pragmaticinstitute.com/resources/articles/product/product-launch-checklist/
 * - Reforge Product Strategy: https://www.reforge.com/blog/product-launch-strategy
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    productName,
    launchType = 'major', // 'major', 'minor', 'feature', 'beta'
    targetAudience = {
      segments: [],
      personas: [],
      geographies: []
    },
    launchDate = null,
    launchTier = 'tier-1', // 'tier-1' (full launch), 'tier-2' (limited), 'tier-3' (soft launch)
    marketType = 'existing', // 'new', 'existing', 'adjacent'
    competitive = {
      competitors: [],
      differentiation: ''
    },
    outputDir = 'product-launch-gtm-output',
    budgetConstraints = null,
    existingCustomers = 0,
    companyStage = 'growth', // 'startup', 'growth', 'enterprise'
    channelPreferences = ['email', 'social', 'pr', 'events', 'paid'],
    enableBetaProgram = true,
    enableEarlyAccess = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let gtmScore = 0;
  let launchReadiness = false;
  const phaseResults = [];

  ctx.log('info', `Starting Product Launch and GTM Planning for ${productName}`);
  ctx.log('info', `Launch Type: ${launchType}, Tier: ${launchTier}, Target Date: ${launchDate || 'TBD'}`);
  ctx.log('info', `Target Audience: ${targetAudience.segments.join(', ')}, Market: ${marketType}`);

  // ============================================================================
  // PHASE 1: PRE-LAUNCH ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 1: Conducting pre-launch readiness assessment');

  const assessmentResult = await ctx.task(preLaunchAssessmentTask, {
    productName,
    launchType,
    launchTier,
    targetAudience,
    marketType,
    competitive,
    launchDate,
    outputDir
  });

  artifacts.push(...assessmentResult.artifacts);
  phaseResults.push({ phase: 'Pre-Launch Assessment', result: assessmentResult });

  ctx.log('info', `Pre-launch assessment complete - Readiness: ${assessmentResult.readinessScore}/100`);

  // Quality Gate: Pre-launch assessment review
  await ctx.breakpoint({
    question: `Pre-launch assessment complete for ${productName}. Readiness score: ${assessmentResult.readinessScore}/100. ${assessmentResult.criticalGaps.length} critical gaps identified. Proceed with launch planning?`,
    title: 'Pre-Launch Assessment Review',
    context: {
      runId: ctx.runId,
      assessment: {
        readinessScore: assessmentResult.readinessScore,
        productReadiness: assessmentResult.productReadiness,
        marketReadiness: assessmentResult.marketReadiness,
        teamReadiness: assessmentResult.teamReadiness,
        criticalGaps: assessmentResult.criticalGaps
      },
      files: assessmentResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 2: MARKET POSITIONING AND MESSAGING
  // ============================================================================

  ctx.log('info', 'Phase 2: Developing market positioning and messaging framework');

  const messagingResult = await ctx.task(developMessagingFrameworkTask, {
    productName,
    launchType,
    targetAudience,
    marketType,
    competitive,
    assessmentResult,
    outputDir
  });

  artifacts.push(...messagingResult.artifacts);
  phaseResults.push({ phase: 'Messaging Framework', result: messagingResult });

  ctx.log('info', `Messaging framework complete - Value props: ${messagingResult.valuePropositions.length}, Messages: ${messagingResult.keyMessages.length}`);

  // Quality Gate: Messaging review
  await ctx.breakpoint({
    question: `Messaging framework developed. ${messagingResult.valuePropositions.length} value propositions, ${messagingResult.keyMessages.length} key messages. Review positioning statement and messaging?`,
    title: 'Messaging Framework Review',
    context: {
      runId: ctx.runId,
      messaging: {
        positioningStatement: messagingResult.positioningStatement,
        valuePropositions: messagingResult.valuePropositions,
        keyMessages: messagingResult.keyMessages.slice(0, 5),
        differentiators: messagingResult.differentiators
      },
      files: messagingResult.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 3: COMPETITIVE ANALYSIS AND POSITIONING
  // ============================================================================

  ctx.log('info', 'Phase 3: Conducting competitive analysis and market positioning');

  const competitiveResult = await ctx.task(competitiveAnalysisTask, {
    productName,
    marketType,
    competitive,
    messagingResult,
    targetAudience,
    outputDir
  });

  artifacts.push(...competitiveResult.artifacts);
  phaseResults.push({ phase: 'Competitive Analysis', result: competitiveResult });

  ctx.log('info', `Competitive analysis complete - Analyzed ${competitiveResult.competitors.length} competitors`);

  // ============================================================================
  // PHASE 4: GTM CHANNEL STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 4: Developing GTM channel strategy');

  const channelStrategyResult = await ctx.task(developChannelStrategyTask, {
    productName,
    launchType,
    launchTier,
    targetAudience,
    messagingResult,
    channelPreferences,
    budgetConstraints,
    companyStage,
    existingCustomers,
    outputDir
  });

  artifacts.push(...channelStrategyResult.artifacts);
  phaseResults.push({ phase: 'Channel Strategy', result: channelStrategyResult });

  ctx.log('info', `Channel strategy developed - ${channelStrategyResult.channels.length} channels selected`);

  // Quality Gate: Channel strategy review
  await ctx.breakpoint({
    question: `Channel strategy developed with ${channelStrategyResult.channels.length} channels. Primary: ${channelStrategyResult.primaryChannels.join(', ')}. Review channel mix and tactics?`,
    title: 'Channel Strategy Review',
    context: {
      runId: ctx.runId,
      channels: {
        totalChannels: channelStrategyResult.channels.length,
        primaryChannels: channelStrategyResult.primaryChannels,
        channelMix: channelStrategyResult.channels.map(c => ({
          channel: c.channel,
          priority: c.priority,
          budget: c.budgetAllocation
        }))
      },
      files: channelStrategyResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 5: LAUNCH TIMELINE AND MILESTONES
  // ============================================================================

  ctx.log('info', 'Phase 5: Creating launch timeline and milestone plan');

  const timelineResult = await ctx.task(createLaunchTimelineTask, {
    productName,
    launchType,
    launchTier,
    launchDate,
    channelStrategyResult,
    enableBetaProgram,
    enableEarlyAccess,
    assessmentResult,
    outputDir
  });

  artifacts.push(...timelineResult.artifacts);
  phaseResults.push({ phase: 'Launch Timeline', result: timelineResult });

  ctx.log('info', `Launch timeline created - ${timelineResult.milestones.length} milestones, ${timelineResult.phases.length} phases`);

  // ============================================================================
  // PHASE 6: STAKEHOLDER COORDINATION PLAN
  // ============================================================================

  ctx.log('info', 'Phase 6: Developing stakeholder coordination plan');

  const stakeholderResult = await ctx.task(developStakeholderPlanTask, {
    productName,
    launchType,
    launchTier,
    timelineResult,
    channelStrategyResult,
    assessmentResult,
    companyStage,
    outputDir
  });

  artifacts.push(...stakeholderResult.artifacts);
  phaseResults.push({ phase: 'Stakeholder Coordination', result: stakeholderResult });

  ctx.log('info', `Stakeholder plan created - ${stakeholderResult.stakeholders.length} stakeholder groups, ${stakeholderResult.meetings.length} coordination meetings`);

  // ============================================================================
  // PHASE 7: LAUNCH CONTENT AND COLLATERAL
  // ============================================================================

  ctx.log('info', 'Phase 7: Planning launch content and marketing collateral');

  const contentResult = await ctx.task(planLaunchContentTask, {
    productName,
    launchType,
    launchTier,
    messagingResult,
    channelStrategyResult,
    targetAudience,
    timelineResult,
    outputDir
  });

  artifacts.push(...contentResult.artifacts);
  phaseResults.push({ phase: 'Launch Content', result: contentResult });

  ctx.log('info', `Content plan created - ${contentResult.contentAssets.length} assets planned across ${contentResult.contentTypes.length} types`);

  // Quality Gate: Content plan review
  await ctx.breakpoint({
    question: `Launch content planned - ${contentResult.contentAssets.length} assets across ${contentResult.contentTypes.length} content types. Review content calendar and asset list?`,
    title: 'Launch Content Review',
    context: {
      runId: ctx.runId,
      content: {
        totalAssets: contentResult.contentAssets.length,
        contentTypes: contentResult.contentTypes,
        keyAssets: contentResult.contentAssets.filter(a => a.priority === 'critical').map(a => a.name)
      },
      files: contentResult.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 8: SUCCESS METRICS AND KPIs
  // ============================================================================

  ctx.log('info', 'Phase 8: Defining success metrics and launch KPIs');

  const metricsResult = await ctx.task(defineSuccessMetricsTask, {
    productName,
    launchType,
    launchTier,
    targetAudience,
    channelStrategyResult,
    marketType,
    existingCustomers,
    companyStage,
    outputDir
  });

  artifacts.push(...metricsResult.artifacts);
  phaseResults.push({ phase: 'Success Metrics', result: metricsResult });

  ctx.log('info', `Success metrics defined - ${metricsResult.kpis.length} KPIs, ${metricsResult.targets.length} targets set`);

  // ============================================================================
  // PHASE 9: RISK MITIGATION PLAN
  // ============================================================================

  ctx.log('info', 'Phase 9: Developing risk mitigation and contingency plan');

  const riskResult = await ctx.task(developRiskMitigationTask, {
    productName,
    launchType,
    launchTier,
    assessmentResult,
    timelineResult,
    channelStrategyResult,
    competitiveResult,
    outputDir
  });

  artifacts.push(...riskResult.artifacts);
  phaseResults.push({ phase: 'Risk Mitigation', result: riskResult });

  ctx.log('info', `Risk mitigation plan created - ${riskResult.risks.length} risks identified, ${riskResult.contingencies.length} contingency plans`);

  // ============================================================================
  // PHASE 10: POST-LAUNCH MONITORING PLAN
  // ============================================================================

  ctx.log('info', 'Phase 10: Creating post-launch monitoring and optimization plan');

  const monitoringResult = await ctx.task(createPostLaunchMonitoringTask, {
    productName,
    launchType,
    metricsResult,
    channelStrategyResult,
    timelineResult,
    outputDir
  });

  artifacts.push(...monitoringResult.artifacts);
  phaseResults.push({ phase: 'Post-Launch Monitoring', result: monitoringResult });

  ctx.log('info', `Monitoring plan created - ${monitoringResult.checkpoints.length} checkpoints, ${monitoringResult.dashboards.length} dashboards`);

  // ============================================================================
  // PHASE 11: LAUNCH CHECKLIST
  // ============================================================================

  ctx.log('info', 'Phase 11: Creating comprehensive launch checklist');

  const checklistResult = await ctx.task(createLaunchChecklistTask, {
    productName,
    launchType,
    launchTier,
    assessmentResult,
    timelineResult,
    contentResult,
    channelStrategyResult,
    stakeholderResult,
    outputDir
  });

  artifacts.push(...checklistResult.artifacts);
  phaseResults.push({ phase: 'Launch Checklist', result: checklistResult });

  ctx.log('info', `Launch checklist created - ${checklistResult.totalItems} items across ${checklistResult.categories.length} categories`);

  // ============================================================================
  // PHASE 12: GTM PLAN DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 12: Generating comprehensive GTM plan documentation');

  const documentationResult = await ctx.task(generateGTMDocumentationTask, {
    productName,
    launchType,
    launchTier,
    launchDate,
    targetAudience,
    phaseResults,
    messagingResult,
    channelStrategyResult,
    timelineResult,
    metricsResult,
    checklistResult,
    outputDir
  });

  artifacts.push(...documentationResult.artifacts);

  ctx.log('info', `GTM documentation generated - Main document: ${documentationResult.mainDocumentPath}`);

  // ============================================================================
  // PHASE 13: CALCULATE GTM READINESS SCORE
  // ============================================================================

  ctx.log('info', 'Phase 13: Calculating GTM readiness score and final assessment');

  const scoringResult = await ctx.task(calculateGTMScoreTask, {
    productName,
    launchType,
    launchTier,
    launchDate,
    assessmentResult,
    messagingResult,
    channelStrategyResult,
    timelineResult,
    contentResult,
    metricsResult,
    checklistResult,
    phaseResults,
    outputDir
  });

  gtmScore = scoringResult.gtmScore;
  launchReadiness = scoringResult.launchReady;
  artifacts.push(...scoringResult.artifacts);

  ctx.log('info', `GTM Score: ${gtmScore}/100, Launch Ready: ${launchReadiness}`);

  // Final Breakpoint: GTM Plan Complete
  await ctx.breakpoint({
    question: `Product Launch and GTM Plan Complete for ${productName}. GTM Score: ${gtmScore}/100. Launch Ready: ${launchReadiness ? 'YES' : 'NO'}. ${launchReadiness ? 'Proceed with launch execution?' : 'Address gaps before launch?'}`,
    title: 'Final GTM Plan Review',
    context: {
      runId: ctx.runId,
      summary: {
        productName,
        launchType,
        launchTier,
        launchDate: launchDate || 'TBD',
        gtmScore,
        launchReady: launchReadiness,
        readinessScore: assessmentResult.readinessScore,
        targetAudience: targetAudience.segments.join(', ')
      },
      gtmComponents: {
        positioning: messagingResult.positioningStatement,
        channels: channelStrategyResult.primaryChannels.join(', '),
        milestones: timelineResult.milestones.length,
        contentAssets: contentResult.contentAssets.length,
        kpis: metricsResult.kpis.length,
        checklistItems: checklistResult.totalItems,
        completionRate: checklistResult.completionRate
      },
      readinessAssessment: {
        productReady: assessmentResult.productReadiness,
        marketReady: assessmentResult.marketReadiness,
        teamReady: assessmentResult.teamReadiness,
        criticalGaps: assessmentResult.criticalGaps.length,
        risksIdentified: riskResult.risks.length
      },
      verdict: scoringResult.verdict,
      recommendation: scoringResult.recommendation,
      files: [
        { path: documentationResult.mainDocumentPath, format: 'markdown', label: 'GTM Plan Document' },
        { path: checklistResult.checklistPath, format: 'markdown', label: 'Launch Checklist' },
        { path: timelineResult.timelinePath, format: 'json', label: 'Launch Timeline' },
        { path: scoringResult.summaryPath, format: 'json', label: 'GTM Score Summary' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    productName,
    launchType,
    launchTier,
    launchDate: launchDate || timelineResult.recommendedLaunchDate,
    gtmScore,
    launchReady: launchReadiness,
    readinessAssessment: {
      readinessScore: assessmentResult.readinessScore,
      productReadiness: assessmentResult.productReadiness,
      marketReadiness: assessmentResult.marketReadiness,
      teamReadiness: assessmentResult.teamReadiness,
      criticalGaps: assessmentResult.criticalGaps
    },
    positioning: {
      positioningStatement: messagingResult.positioningStatement,
      valuePropositions: messagingResult.valuePropositions,
      differentiators: messagingResult.differentiators
    },
    messaging: {
      keyMessages: messagingResult.keyMessages,
      audienceMessages: messagingResult.audienceMessages,
      talkingPoints: messagingResult.talkingPoints
    },
    competitive: {
      competitorsAnalyzed: competitiveResult.competitors.length,
      competitiveAdvantages: competitiveResult.competitiveAdvantages,
      marketPosition: competitiveResult.marketPosition
    },
    channels: {
      totalChannels: channelStrategyResult.channels.length,
      primaryChannels: channelStrategyResult.primaryChannels,
      channelMix: channelStrategyResult.channels.map(c => ({
        channel: c.channel,
        priority: c.priority,
        tactics: c.tactics.length
      }))
    },
    timeline: {
      launchDate: launchDate || timelineResult.recommendedLaunchDate,
      milestones: timelineResult.milestones.length,
      phases: timelineResult.phases.length,
      daysToLaunch: timelineResult.daysToLaunch,
      criticalPath: timelineResult.criticalPath
    },
    content: {
      totalAssets: contentResult.contentAssets.length,
      contentTypes: contentResult.contentTypes,
      criticalAssets: contentResult.contentAssets.filter(a => a.priority === 'critical').length
    },
    metrics: {
      kpis: metricsResult.kpis.map(k => ({
        name: k.name,
        target: k.target,
        metric: k.metric
      })),
      successCriteria: metricsResult.successCriteria,
      measurementPlan: metricsResult.measurementPlan
    },
    risks: {
      totalRisks: riskResult.risks.length,
      highRisks: riskResult.risks.filter(r => r.severity === 'high').length,
      contingencies: riskResult.contingencies.length
    },
    checklist: {
      totalItems: checklistResult.totalItems,
      completedItems: checklistResult.completedItems,
      completionRate: checklistResult.completionRate,
      categories: checklistResult.categories
    },
    postLaunch: {
      checkpoints: monitoringResult.checkpoints,
      dashboards: monitoringResult.dashboards,
      optimizationPlan: monitoringResult.optimizationPlan
    },
    artifacts,
    documentation: {
      mainDocument: documentationResult.mainDocumentPath,
      checklist: checklistResult.checklistPath,
      timeline: timelineResult.timelinePath,
      scoreSummary: scoringResult.summaryPath,
      executiveSummary: documentationResult.executiveSummaryPath
    },
    duration,
    metadata: {
      processId: 'specializations/product-management/product-launch-gtm',
      processSlug: 'product-launch-gtm',
      category: 'product-management',
      specializationSlug: 'product-management',
      timestamp: startTime,
      launchType,
      launchTier,
      marketType,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Pre-Launch Assessment
export const preLaunchAssessmentTask = defineTask('pre-launch-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Pre-Launch Readiness Assessment - ${args.productName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Product Launch Manager and GTM Strategist',
      task: 'Conduct comprehensive pre-launch readiness assessment across product, market, and team dimensions',
      context: {
        productName: args.productName,
        launchType: args.launchType,
        launchTier: args.launchTier,
        targetAudience: args.targetAudience,
        marketType: args.marketType,
        competitive: args.competitive,
        launchDate: args.launchDate,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Assess PRODUCT READINESS (40% weight):',
        '   - Feature completeness vs. launch requirements',
        '   - Product quality and stability (bug count, test coverage)',
        '   - Performance and scalability validation',
        '   - Security and compliance review status',
        '   - User experience and usability testing',
        '   - Documentation completeness (user guides, API docs)',
        '   - Localization and internationalization (if applicable)',
        '',
        '2. Assess MARKET READINESS (30% weight):',
        '   - Target market research and validation',
        '   - Customer demand signals and validation',
        '   - Competitive landscape understanding',
        '   - Pricing and packaging defined',
        '   - Value proposition clarity',
        '   - Market timing assessment',
        '   - Beta/pilot program results (if applicable)',
        '',
        '3. Assess TEAM AND ORGANIZATIONAL READINESS (30% weight):',
        '   - Sales enablement and training',
        '   - Customer success readiness',
        '   - Support infrastructure and processes',
        '   - Marketing campaign preparation',
        '   - Executive alignment and sponsorship',
        '   - Legal and compliance approvals',
        '   - Partner ecosystem readiness',
        '',
        '4. Identify critical gaps and blockers',
        '5. Assess launch timing feasibility',
        '6. Evaluate launch tier appropriateness',
        '7. Determine overall readiness score (0-100)',
        '8. Provide go/no-go recommendation',
        '9. Create pre-launch assessment report with action items'
      ],
      outputFormat: 'JSON object with pre-launch assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'readinessScore', 'productReadiness', 'marketReadiness', 'teamReadiness', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        readinessScore: { type: 'number', minimum: 0, maximum: 100, description: 'Overall readiness score' },
        productReadiness: {
          type: 'object',
          properties: {
            score: { type: 'number', minimum: 0, maximum: 100 },
            featureCompleteness: { type: 'number' },
            qualityScore: { type: 'number' },
            documentationScore: { type: 'number' },
            gaps: { type: 'array', items: { type: 'string' } }
          }
        },
        marketReadiness: {
          type: 'object',
          properties: {
            score: { type: 'number', minimum: 0, maximum: 100 },
            demandValidation: { type: 'string' },
            competitivePosition: { type: 'string' },
            pricingDefined: { type: 'boolean' },
            gaps: { type: 'array', items: { type: 'string' } }
          }
        },
        teamReadiness: {
          type: 'object',
          properties: {
            score: { type: 'number', minimum: 0, maximum: 100 },
            salesReady: { type: 'boolean' },
            supportReady: { type: 'boolean' },
            marketingReady: { type: 'boolean' },
            gaps: { type: 'array', items: { type: 'string' } }
          }
        },
        criticalGaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              gap: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              recommendation: { type: 'string' }
            }
          }
        },
        goNoGoRecommendation: {
          type: 'object',
          properties: {
            decision: { type: 'string', enum: ['go', 'conditional-go', 'no-go', 'delay'] },
            rationale: { type: 'string' },
            conditions: { type: 'array', items: { type: 'string' } }
          }
        },
        launchTimingAssessment: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'product-launch-gtm', 'assessment']
}));

// Phase 2: Develop Messaging Framework
export const developMessagingFrameworkTask = defineTask('develop-messaging-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Develop Messaging Framework - ${args.productName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Product Marketing Manager and Messaging Strategist',
      task: 'Develop comprehensive positioning statement and messaging framework for product launch',
      context: {
        productName: args.productName,
        launchType: args.launchType,
        targetAudience: args.targetAudience,
        marketType: args.marketType,
        competitive: args.competitive,
        assessmentResult: args.assessmentResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create POSITIONING STATEMENT using Geoffrey Moore template:',
        '   "For [target customer] who [statement of need/opportunity],',
        '   [product name] is a [product category] that [key benefit].',
        '   Unlike [competitive alternative], [product name] [primary differentiation]."',
        '',
        '2. Define VALUE PROPOSITIONS for each target segment:',
        '   - Customer pain points addressed',
        '   - Benefits delivered (functional, emotional, economic)',
        '   - Quantifiable value (time saved, cost reduced, revenue increased)',
        '   - Proof points and evidence',
        '',
        '3. Develop KEY MESSAGES (3-5 core messages):',
        '   - Each message should be clear, concise, compelling',
        '   - Support with sub-messages and proof points',
        '   - Align with target persona needs',
        '   - Differentiate from competition',
        '',
        '4. Create ELEVATOR PITCH (30 seconds):',
        '   - Hook: Problem statement',
        '   - Solution: What the product does',
        '   - Benefit: Value delivered',
        '   - Differentiation: Why choose us',
        '',
        '5. Develop PERSONA-SPECIFIC MESSAGING:',
        '   - Tailor messages for each target persona',
        '   - Address persona-specific pain points',
        '   - Use persona-appropriate language and terminology',
        '',
        '6. Create MESSAGE TESTING FRAMEWORK:',
        '   - How to test message resonance',
        '   - A/B testing approach',
        '   - Feedback collection methods',
        '',
        '7. Identify COMPETITIVE DIFFERENTIATORS:',
        '   - What makes product unique',
        '   - Why customers should choose this product',
        '   - Competitive advantages',
        '',
        '8. Develop TALKING POINTS for different audiences:',
        '   - Executive/C-level',
        '   - Technical/Practitioners',
        '   - Economic buyers',
        '   - End users',
        '',
        '9. Create messaging framework document'
      ],
      outputFormat: 'JSON object with messaging framework'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'positioningStatement', 'valuePropositions', 'keyMessages', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        positioningStatement: { type: 'string', description: 'Geoffrey Moore positioning statement' },
        valuePropositions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segment: { type: 'string' },
              painPoints: { type: 'array', items: { type: 'string' } },
              benefits: { type: 'array', items: { type: 'string' } },
              quantifiableValue: { type: 'string' },
              proofPoints: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        keyMessages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              subMessages: { type: 'array', items: { type: 'string' } },
              proofPoints: { type: 'array', items: { type: 'string' } },
              targetAudience: { type: 'string' }
            }
          }
        },
        elevatorPitch: { type: 'string', description: '30-second elevator pitch' },
        audienceMessages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              persona: { type: 'string' },
              primaryMessage: { type: 'string' },
              painPoints: { type: 'array', items: { type: 'string' } },
              benefits: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        differentiators: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              differentiator: { type: 'string' },
              description: { type: 'string' },
              competitiveComparison: { type: 'string' }
            }
          }
        },
        talkingPoints: {
          type: 'object',
          properties: {
            executive: { type: 'array', items: { type: 'string' } },
            technical: { type: 'array', items: { type: 'string' } },
            economic: { type: 'array', items: { type: 'string' } },
            endUser: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'product-launch-gtm', 'messaging']
}));

// Phase 3: Competitive Analysis
export const competitiveAnalysisTask = defineTask('competitive-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Competitive Analysis and Positioning - ${args.productName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Competitive Intelligence Analyst and Market Strategist',
      task: 'Conduct comprehensive competitive analysis and establish market positioning',
      context: {
        productName: args.productName,
        marketType: args.marketType,
        competitive: args.competitive,
        messagingResult: args.messagingResult,
        targetAudience: args.targetAudience,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify and profile TOP COMPETITORS (direct and indirect):',
        '   - Company background and market position',
        '   - Product features and capabilities',
        '   - Pricing and packaging',
        '   - Target market and customers',
        '   - Strengths and weaknesses',
        '   - Market share and growth trajectory',
        '   - Go-to-market strategy',
        '',
        '2. Create COMPETITIVE COMPARISON MATRIX:',
        '   - Feature comparison',
        '   - Pricing comparison',
        '   - Target audience comparison',
        '   - Market positioning comparison',
        '',
        '3. Conduct SWOT ANALYSIS:',
        '   - Strengths (internal advantages)',
        '   - Weaknesses (internal limitations)',
        '   - Opportunities (external factors to leverage)',
        '   - Threats (external challenges)',
        '',
        '4. Identify COMPETITIVE ADVANTAGES:',
        '   - Areas where product is superior',
        '   - Unique capabilities or features',
        '   - Market positioning advantages',
        '   - Proof points and evidence',
        '',
        '5. Develop COMPETITIVE BATTLECARDS:',
        '   - One battlecard per major competitor',
        '   - How to compete and win',
        '   - Objection handling',
        '   - Win/loss drivers',
        '',
        '6. Analyze MARKET GAPS AND OPPORTUNITIES:',
        '   - Underserved segments',
        '   - Unmet needs',
        '   - Emerging trends',
        '',
        '7. Define WIN/LOSS CRITERIA:',
        '   - Factors that drive customer decisions',
        '   - Common objections',
        '   - Competitive responses',
        '',
        '8. Create competitive analysis report with battlecards'
      ],
      outputFormat: 'JSON object with competitive analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'competitors', 'competitiveAdvantages', 'marketPosition', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        competitors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              category: { type: 'string', enum: ['direct', 'indirect', 'substitute'] },
              marketShare: { type: 'string' },
              strengths: { type: 'array', items: { type: 'string' } },
              weaknesses: { type: 'array', items: { type: 'string' } },
              positioning: { type: 'string' },
              pricing: { type: 'string' }
            }
          }
        },
        competitiveMatrix: {
          type: 'object',
          properties: {
            features: { type: 'array', items: { type: 'object' } },
            pricing: { type: 'array', items: { type: 'object' } },
            targetMarket: { type: 'array', items: { type: 'object' } }
          }
        },
        swotAnalysis: {
          type: 'object',
          properties: {
            strengths: { type: 'array', items: { type: 'string' } },
            weaknesses: { type: 'array', items: { type: 'string' } },
            opportunities: { type: 'array', items: { type: 'string' } },
            threats: { type: 'array', items: { type: 'string' } }
          }
        },
        competitiveAdvantages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              advantage: { type: 'string' },
              description: { type: 'string' },
              proofPoints: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        battlecards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              competitor: { type: 'string' },
              howToCompete: { type: 'string' },
              objections: { type: 'array', items: { type: 'string' } },
              responses: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        marketPosition: {
          type: 'object',
          properties: {
            quadrant: { type: 'string', description: 'Market quadrant (leader, challenger, niche, follower)' },
            positioning: { type: 'string' },
            differentiation: { type: 'string' }
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
  labels: ['agent', 'product-launch-gtm', 'competitive-analysis']
}));

// Phase 4: Develop Channel Strategy
export const developChannelStrategyTask = defineTask('develop-channel-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Develop GTM Channel Strategy - ${args.productName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'GTM Strategy Lead and Channel Marketing Expert',
      task: 'Develop comprehensive multi-channel GTM strategy with tactics and budget allocation',
      context: {
        productName: args.productName,
        launchType: args.launchType,
        launchTier: args.launchTier,
        targetAudience: args.targetAudience,
        messagingResult: args.messagingResult,
        channelPreferences: args.channelPreferences,
        budgetConstraints: args.budgetConstraints,
        companyStage: args.companyStage,
        existingCustomers: args.existingCustomers,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Select PRIMARY CHANNELS based on:',
        '   - Target audience preferences and behavior',
        '   - Launch type and tier',
        '   - Budget constraints',
        '   - Company stage and resources',
        '   - Historical channel performance',
        '',
        '2. For each channel, define:',
        '   - Channel objectives and goals',
        '   - Target audience segment',
        '   - Key tactics and activities',
        '   - Content requirements',
        '   - Budget allocation',
        '   - Success metrics',
        '   - Timeline and milestones',
        '',
        '3. DIGITAL CHANNELS to consider:',
        '   - Email marketing (existing customers, prospects, newsletters)',
        '   - Social media (LinkedIn, Twitter/X, Facebook, Instagram)',
        '   - Content marketing (blog, SEO, videos, webinars)',
        '   - Paid advertising (Google Ads, LinkedIn Ads, display)',
        '   - Website and landing pages',
        '   - Community and forums',
        '',
        '4. TRADITIONAL CHANNELS to consider:',
        '   - PR and media relations',
        '   - Events and conferences',
        '   - Partner ecosystem',
        '   - Sales outreach',
        '   - Customer success engagement',
        '',
        '5. CHANNEL INTEGRATION STRATEGY:',
        '   - Cross-channel messaging consistency',
        '   - Customer journey mapping across channels',
        '   - Channel attribution and tracking',
        '   - Channel optimization approach',
        '',
        '6. BUDGET ALLOCATION:',
        '   - Allocate budget across channels based on priority',
        '   - 70-20-10 rule (core/test/new) if applicable',
        '   - Reserve contingency budget',
        '',
        '7. Create channel strategy playbook with detailed tactics'
      ],
      outputFormat: 'JSON object with channel strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'channels', 'primaryChannels', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        channels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              channel: { type: 'string' },
              channelType: { type: 'string', enum: ['digital', 'traditional', 'hybrid'] },
              priority: { type: 'string', enum: ['primary', 'secondary', 'tertiary'] },
              objectives: { type: 'array', items: { type: 'string' } },
              targetSegment: { type: 'string' },
              tactics: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    tactic: { type: 'string' },
                    description: { type: 'string' },
                    timeline: { type: 'string' }
                  }
                }
              },
              budgetAllocation: { type: 'string' },
              successMetrics: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        primaryChannels: { type: 'array', items: { type: 'string' }, description: 'Top priority channels' },
        channelIntegration: {
          type: 'object',
          properties: {
            customerJourney: { type: 'string' },
            attributionModel: { type: 'string' },
            crossChannelTactics: { type: 'array', items: { type: 'string' } }
          }
        },
        budgetSummary: {
          type: 'object',
          properties: {
            totalBudget: { type: 'string' },
            allocations: { type: 'array', items: { type: 'object' } },
            contingency: { type: 'string' }
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
  labels: ['agent', 'product-launch-gtm', 'channel-strategy']
}));

// Phase 5: Create Launch Timeline
export const createLaunchTimelineTask = defineTask('create-launch-timeline', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Create Launch Timeline - ${args.productName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Launch Program Manager and Timeline Coordinator',
      task: 'Create comprehensive launch timeline with phases, milestones, and critical path',
      context: {
        productName: args.productName,
        launchType: args.launchType,
        launchTier: args.launchTier,
        launchDate: args.launchDate,
        channelStrategyResult: args.channelStrategyResult,
        enableBetaProgram: args.enableBetaProgram,
        enableEarlyAccess: args.enableEarlyAccess,
        assessmentResult: args.assessmentResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define LAUNCH PHASES:',
        '   - Pre-Launch (preparation)',
        '   - Soft Launch / Beta (if applicable)',
        '   - General Availability (GA) Launch',
        '   - Post-Launch (optimization)',
        '',
        '2. Create DETAILED TIMELINE with:',
        '   - Phase durations and dates',
        '   - Key milestones and deliverables',
        '   - Dependencies between activities',
        '   - Critical path identification',
        '   - Buffer time for contingencies',
        '',
        '3. PRE-LAUNCH PHASE (typically 8-12 weeks before launch):',
        '   - Product readiness completion',
        '   - Beta program launch (if applicable)',
        '   - Content creation and asset development',
        '   - Sales and CS training',
        '   - PR and media outreach',
        '   - Partner enablement',
        '   - Website and landing page updates',
        '   - Launch rehearsal and readiness check',
        '',
        '4. LAUNCH WEEK activities:',
        '   - Day -1: Final readiness check',
        '   - Day 0: Launch execution',
        '     * Press release distribution',
        '     * Email campaigns',
        '     * Social media activation',
        '     * Website updates',
        '     * Sales enablement activation',
        '   - Days 1-7: Launch amplification',
        '',
        '5. POST-LAUNCH PHASE (first 30-90 days):',
        '   - Week 1: Monitor initial metrics',
        '   - Week 2: First optimization',
        '   - Week 4: 30-day review',
        '   - Week 8: 60-day review',
        '   - Week 12: 90-day assessment',
        '',
        '6. Identify CRITICAL PATH:',
        '   - Activities that must complete on time',
        '   - Dependencies that could delay launch',
        '   - Risk mitigation plans',
        '',
        '7. Define MILESTONE CRITERIA:',
        '   - What defines completion',
        '   - Quality gates',
        '   - Approval requirements',
        '',
        '8. Create launch timeline document with Gantt chart representation'
      ],
      outputFormat: 'JSON object with launch timeline'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'phases', 'milestones', 'criticalPath', 'timelinePath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        recommendedLaunchDate: { type: 'string', description: 'Recommended launch date if not provided' },
        daysToLaunch: { type: 'number', description: 'Days from now to launch' },
        phases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              startDate: { type: 'string' },
              endDate: { type: 'string' },
              duration: { type: 'string' },
              objectives: { type: 'array', items: { type: 'string' } },
              keyActivities: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        milestones: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              milestone: { type: 'string' },
              date: { type: 'string' },
              phase: { type: 'string' },
              owner: { type: 'string' },
              criteria: { type: 'array', items: { type: 'string' } },
              dependencies: { type: 'array', items: { type: 'string' } },
              criticalPath: { type: 'boolean' }
            }
          }
        },
        criticalPath: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              activity: { type: 'string' },
              duration: { type: 'string' },
              dependencies: { type: 'array', items: { type: 'string' } },
              riskLevel: { type: 'string', enum: ['low', 'medium', 'high'] }
            }
          }
        },
        launchWeekSchedule: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              day: { type: 'string' },
              activities: { type: 'array', items: { type: 'string' } },
              timing: { type: 'string' }
            }
          }
        },
        timelinePath: { type: 'string', description: 'Path to timeline document' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'product-launch-gtm', 'timeline']
}));

// Phase 6: Develop Stakeholder Plan
export const developStakeholderPlanTask = defineTask('develop-stakeholder-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Develop Stakeholder Coordination Plan - ${args.productName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Launch Coordination Manager',
      task: 'Develop comprehensive stakeholder coordination and communication plan',
      context: {
        productName: args.productName,
        launchType: args.launchType,
        launchTier: args.launchTier,
        timelineResult: args.timelineResult,
        channelStrategyResult: args.channelStrategyResult,
        assessmentResult: args.assessmentResult,
        companyStage: args.companyStage,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify KEY STAKEHOLDER GROUPS:',
        '   - Executive leadership',
        '   - Product management',
        '   - Engineering/Development',
        '   - Product marketing',
        '   - Sales',
        '   - Customer success',
        '   - Support',
        '   - Partners',
        '   - Customers (beta, pilot, early adopters)',
        '',
        '2. For each stakeholder group, define:',
        '   - Role in launch',
        '   - Information needs',
        '   - Communication frequency',
        '   - Deliverables expected',
        '   - Success criteria',
        '',
        '3. Create COMMUNICATION PLAN:',
        '   - Regular status updates',
        '   - Launch coordination meetings',
        '   - Decision-making forums',
        '   - Escalation paths',
        '   - Communication channels (email, slack, meetings)',
        '',
        '4. Define COORDINATION MEETINGS:',
        '   - Weekly launch sync (core team)',
        '   - Bi-weekly stakeholder updates',
        '   - Launch readiness reviews',
        '   - Post-launch retrospectives',
        '',
        '5. Create RACI MATRIX:',
        '   - Responsible: Who does the work',
        '   - Accountable: Who approves',
        '   - Consulted: Who provides input',
        '   - Informed: Who needs to know',
        '',
        '6. Develop ENABLEMENT PLAN for each group:',
        '   - Training sessions',
        '   - Documentation and resources',
        '   - Q&A forums',
        '   - Certification (if applicable)',
        '',
        '7. Create stakeholder coordination playbook'
      ],
      outputFormat: 'JSON object with stakeholder plan'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'stakeholders', 'meetings', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        stakeholders: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              group: { type: 'string' },
              role: { type: 'string' },
              informationNeeds: { type: 'array', items: { type: 'string' } },
              deliverables: { type: 'array', items: { type: 'string' } },
              communicationFrequency: { type: 'string' }
            }
          }
        },
        raciMatrix: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              activity: { type: 'string' },
              responsible: { type: 'string' },
              accountable: { type: 'string' },
              consulted: { type: 'array', items: { type: 'string' } },
              informed: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        meetings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              meeting: { type: 'string' },
              frequency: { type: 'string' },
              attendees: { type: 'array', items: { type: 'string' } },
              agenda: { type: 'array', items: { type: 'string' } },
              purpose: { type: 'string' }
            }
          }
        },
        enablementPlan: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholder: { type: 'string' },
              trainingSessions: { type: 'array', items: { type: 'string' } },
              resources: { type: 'array', items: { type: 'string' } },
              timeline: { type: 'string' }
            }
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
  labels: ['agent', 'product-launch-gtm', 'stakeholder-coordination']
}));

// Phase 7: Plan Launch Content
export const planLaunchContentTask = defineTask('plan-launch-content', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Plan Launch Content and Collateral - ${args.productName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Content Marketing Manager and Creative Director',
      task: 'Plan comprehensive launch content and marketing collateral across all channels',
      context: {
        productName: args.productName,
        launchType: args.launchType,
        launchTier: args.launchTier,
        messagingResult: args.messagingResult,
        channelStrategyResult: args.channelStrategyResult,
        targetAudience: args.targetAudience,
        timelineResult: args.timelineResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Plan FOUNDATIONAL CONTENT (required):',
        '   - Press release',
        '   - Launch blog post',
        '   - Product overview page',
        '   - Product demo video',
        '   - FAQ document',
        '   - Sales one-pager',
        '   - Email announcement templates',
        '',
        '2. Plan CHANNEL-SPECIFIC CONTENT:',
        '   - Social media posts (LinkedIn, Twitter, etc.)',
        '   - Email campaigns (customers, prospects, partners)',
        '   - Website banners and CTAs',
        '   - Landing pages',
        '   - Paid ad creatives',
        '   - Webinar presentations',
        '',
        '3. Plan ENABLEMENT CONTENT:',
        '   - Sales playbook',
        '   - Sales presentation deck',
        '   - Demo scripts',
        '   - Battle cards',
        '   - Customer success guides',
        '   - Support documentation',
        '',
        '4. Plan CUSTOMER-FACING CONTENT:',
        '   - Product documentation',
        '   - User guides and tutorials',
        '   - Video tutorials',
        '   - Case studies (if available)',
        '   - Testimonials',
        '',
        '5. For each content asset, specify:',
        '   - Asset name and type',
        '   - Purpose and audience',
        '   - Channel/distribution',
        '   - Owner/creator',
        '   - Due date',
        '   - Priority (critical, high, medium, low)',
        '   - Dependencies',
        '',
        '6. Create CONTENT CALENDAR:',
        '   - Map content to launch timeline',
        '   - Coordinate content releases',
        '   - Plan content amplification',
        '',
        '7. Define CONTENT APPROVAL WORKFLOW:',
        '   - Review and approval process',
        '   - Legal/compliance review requirements',
        '   - Stakeholder sign-off',
        '',
        '8. Create content production tracker and calendar'
      ],
      outputFormat: 'JSON object with content plan'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'contentAssets', 'contentTypes', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        contentAssets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              category: { type: 'string', enum: ['foundational', 'channel-specific', 'enablement', 'customer-facing'] },
              purpose: { type: 'string' },
              targetAudience: { type: 'string' },
              channel: { type: 'string' },
              owner: { type: 'string' },
              dueDate: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              status: { type: 'string', enum: ['not-started', 'in-progress', 'review', 'approved', 'published'] }
            }
          }
        },
        contentTypes: { type: 'array', items: { type: 'string' }, description: 'List of content types' },
        contentCalendar: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              date: { type: 'string' },
              content: { type: 'string' },
              channel: { type: 'string' },
              action: { type: 'string', enum: ['create', 'review', 'approve', 'publish'] }
            }
          }
        },
        approvalWorkflow: {
          type: 'object',
          properties: {
            reviewStages: { type: 'array', items: { type: 'string' } },
            approvers: { type: 'array', items: { type: 'string' } },
            turnaroundTime: { type: 'string' }
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
  labels: ['agent', 'product-launch-gtm', 'content-planning']
}));

// Phase 8: Define Success Metrics
export const defineSuccessMetricsTask = defineTask('define-success-metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Define Success Metrics and KPIs - ${args.productName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Product Analytics Manager and Success Metrics Specialist',
      task: 'Define comprehensive success metrics, KPIs, and targets for product launch',
      context: {
        productName: args.productName,
        launchType: args.launchType,
        launchTier: args.launchTier,
        targetAudience: args.targetAudience,
        channelStrategyResult: args.channelStrategyResult,
        marketType: args.marketType,
        existingCustomers: args.existingCustomers,
        companyStage: args.companyStage,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define PIRATE METRICS (AARRR Framework):',
        '   - Acquisition: How users discover product',
        '     * Website visits, trial signups, demo requests',
        '     * Channel-specific acquisition metrics',
        '   - Activation: First value experience',
        '     * Onboarding completion, first action, aha moment',
        '   - Retention: Users coming back',
        '     * Day 7, Day 30, Day 90 retention',
        '     * Feature usage and engagement',
        '   - Revenue: Monetization metrics',
        '     * Trial-to-paid conversion, ARR/MRR, deal size',
        '     * Upsell and cross-sell',
        '   - Referral: Viral growth',
        '     * Net Promoter Score (NPS), referrals, testimonials',
        '',
        '2. Define LAUNCH-SPECIFIC METRICS:',
        '   - Launch day metrics:',
        '     * PR coverage and reach',
        '     * Social media engagement',
        '     * Email open and click rates',
        '     * Website traffic spike',
        '   - Week 1 metrics:',
        '     * Total signups/trials',
        '     * Product usage and engagement',
        '     * Customer feedback and sentiment',
        '   - Month 1 metrics:',
        '     * Customer acquisition cost (CAC)',
        '     * Conversion rates by channel',
        '     * Feature adoption',
        '     * Customer satisfaction scores',
        '',
        '3. Define CHANNEL PERFORMANCE METRICS:',
        '   - For each channel, define specific metrics',
        '   - Email: Open rate, click rate, conversion',
        '   - Social: Reach, engagement, clicks, conversions',
        '   - Paid: Impressions, CTR, CPC, conversions, ROAS',
        '   - PR: Media placements, reach, sentiment',
        '   - Events: Attendees, leads, pipeline',
        '',
        '4. Set SMART TARGETS for each KPI:',
        '   - Specific, Measurable, Achievable, Relevant, Time-bound',
        '   - Baseline (if available)',
        '   - Target (goal)',
        '   - Stretch target (aspirational)',
        '',
        '5. Define SUCCESS CRITERIA:',
        '   - What constitutes a successful launch',
        '   - Must-have vs. nice-to-have metrics',
        '   - Red flags and warning indicators',
        '',
        '6. Create MEASUREMENT PLAN:',
        '   - Data sources and tracking setup',
        '   - Dashboard requirements',
        '   - Reporting frequency and format',
        '   - Data validation and quality checks',
        '',
        '7. Define LEADING AND LAGGING INDICATORS:',
        '   - Leading: Predictive metrics (pipeline, trials)',
        '   - Lagging: Outcome metrics (revenue, customers)',
        '',
        '8. Create metrics dashboard specification and tracking plan'
      ],
      outputFormat: 'JSON object with success metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'kpis', 'targets', 'successCriteria', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        kpis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              category: { type: 'string', enum: ['acquisition', 'activation', 'retention', 'revenue', 'referral', 'channel', 'other'] },
              metric: { type: 'string' },
              target: { type: 'string' },
              stretchTarget: { type: 'string' },
              timeframe: { type: 'string' },
              dataSource: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        targets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              timeframe: { type: 'string' },
              metric: { type: 'string' },
              baseline: { type: 'string' },
              target: { type: 'string' },
              stretchTarget: { type: 'string' }
            }
          }
        },
        pirateMetrics: {
          type: 'object',
          properties: {
            acquisition: { type: 'array', items: { type: 'object' } },
            activation: { type: 'array', items: { type: 'object' } },
            retention: { type: 'array', items: { type: 'object' } },
            revenue: { type: 'array', items: { type: 'object' } },
            referral: { type: 'array', items: { type: 'object' } }
          }
        },
        channelMetrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              channel: { type: 'string' },
              metrics: { type: 'array', items: { type: 'object' } }
            }
          }
        },
        successCriteria: {
          type: 'object',
          properties: {
            mustHave: { type: 'array', items: { type: 'string' } },
            niceToHave: { type: 'array', items: { type: 'string' } },
            redFlags: { type: 'array', items: { type: 'string' } }
          }
        },
        measurementPlan: {
          type: 'object',
          properties: {
            dataSources: { type: 'array', items: { type: 'string' } },
            dashboards: { type: 'array', items: { type: 'string' } },
            reportingFrequency: { type: 'string' },
            dataValidation: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'product-launch-gtm', 'metrics']
}));

// Phase 9: Develop Risk Mitigation
export const developRiskMitigationTask = defineTask('develop-risk-mitigation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Develop Risk Mitigation Plan - ${args.productName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Risk Management Specialist and Launch Coordinator',
      task: 'Identify launch risks and develop comprehensive mitigation and contingency plans',
      context: {
        productName: args.productName,
        launchType: args.launchType,
        launchTier: args.launchTier,
        assessmentResult: args.assessmentResult,
        timelineResult: args.timelineResult,
        channelStrategyResult: args.channelStrategyResult,
        competitiveResult: args.competitiveResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify PRODUCT RISKS:',
        '   - Feature gaps or incomplete functionality',
        '   - Quality issues or bugs',
        '   - Performance and scalability concerns',
        '   - Security vulnerabilities',
        '   - Integration issues',
        '',
        '2. Identify MARKET RISKS:',
        '   - Competitive response',
        '   - Market timing issues',
        '   - Pricing rejection',
        '   - Low customer demand',
        '   - Negative market perception',
        '',
        '3. Identify EXECUTION RISKS:',
        '   - Timeline delays',
        '   - Resource constraints',
        '   - Stakeholder misalignment',
        '   - Channel underperformance',
        '   - Content delays',
        '   - Communication breakdowns',
        '',
        '4. For each risk, assess:',
        '   - Probability (high, medium, low)',
        '   - Impact (high, medium, low)',
        '   - Risk score (probability × impact)',
        '   - Early warning indicators',
        '',
        '5. Develop MITIGATION STRATEGIES:',
        '   - Preventive actions to reduce probability',
        '   - Contingency plans if risk occurs',
        '   - Responsible owner',
        '   - Timeline for mitigation',
        '',
        '6. Create CONTINGENCY PLANS for high-risk scenarios:',
        '   - Major product issue discovered',
        '   - Competitive launch announcement',
        '   - Low initial adoption',
        '   - Negative customer feedback',
        '   - Channel failure',
        '   - Timeline slip',
        '',
        '7. Define GO/NO-GO CRITERIA:',
        '   - Critical criteria that must be met to launch',
        '   - Decision makers and approval process',
        '   - Delay triggers and process',
        '',
        '8. Create ROLLBACK PLAN:',
        '   - When to consider rolling back',
        '   - How to execute rollback',
        '   - Communication plan for rollback',
        '',
        '9. Create risk register and mitigation playbook'
      ],
      outputFormat: 'JSON object with risk mitigation plan'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'risks', 'contingencies', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              category: { type: 'string', enum: ['product', 'market', 'execution', 'other'] },
              probability: { type: 'string', enum: ['high', 'medium', 'low'] },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] },
              riskScore: { type: 'string' },
              earlyWarnings: { type: 'array', items: { type: 'string' } },
              mitigationStrategy: { type: 'string' },
              contingencyPlan: { type: 'string' },
              owner: { type: 'string' }
            }
          }
        },
        contingencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              triggerConditions: { type: 'array', items: { type: 'string' } },
              response: { type: 'string' },
              actions: { type: 'array', items: { type: 'string' } },
              communication: { type: 'string' }
            }
          }
        },
        goNoGoCriteria: {
          type: 'object',
          properties: {
            criticalCriteria: { type: 'array', items: { type: 'string' } },
            decisionMakers: { type: 'array', items: { type: 'string' } },
            delayTriggers: { type: 'array', items: { type: 'string' } }
          }
        },
        rollbackPlan: {
          type: 'object',
          properties: {
            rollbackTriggers: { type: 'array', items: { type: 'string' } },
            rollbackSteps: { type: 'array', items: { type: 'string' } },
            communicationPlan: { type: 'string' }
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
  labels: ['agent', 'product-launch-gtm', 'risk-mitigation']
}));

// Phase 10: Create Post-Launch Monitoring
export const createPostLaunchMonitoringTask = defineTask('create-post-launch-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Create Post-Launch Monitoring Plan - ${args.productName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Product Analytics Manager and Optimization Specialist',
      task: 'Create comprehensive post-launch monitoring, measurement, and optimization plan',
      context: {
        productName: args.productName,
        launchType: args.launchType,
        metricsResult: args.metricsResult,
        channelStrategyResult: args.channelStrategyResult,
        timelineResult: args.timelineResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define POST-LAUNCH CHECKPOINTS:',
        '   - Day 1: Launch day monitoring',
        '   - Day 3: 72-hour review',
        '   - Week 1: First week assessment',
        '   - Week 2: Two-week optimization',
        '   - Day 30: 30-day review',
        '   - Day 60: 60-day assessment',
        '   - Day 90: Quarterly business review',
        '',
        '2. For each checkpoint, define:',
        '   - Metrics to review',
        '   - Success thresholds',
        '   - Decision criteria',
        '   - Action items based on results',
        '   - Attendees and stakeholders',
        '',
        '3. Create MONITORING DASHBOARDS:',
        '   - Real-time launch dashboard (Day 0-7)',
        '   - Acquisition funnel dashboard',
        '   - Product usage dashboard',
        '   - Channel performance dashboard',
        '   - Revenue and conversion dashboard',
        '',
        '4. Define ALERTS AND THRESHOLDS:',
        '   - Red alerts: Critical issues requiring immediate action',
        '   - Yellow alerts: Warning signals requiring investigation',
        '   - Green status: On track to goals',
        '',
        '5. Create OPTIMIZATION FRAMEWORK:',
        '   - What to optimize (channels, messaging, content, product)',
        '   - How to test (A/B tests, multivariate tests)',
        '   - Decision criteria for changes',
        '   - Iteration cadence',
        '',
        '6. Define FEEDBACK COLLECTION MECHANISMS:',
        '   - Customer surveys (NPS, CSAT, CES)',
        '   - User interviews',
        '   - Support ticket analysis',
        '   - Sales and CS feedback',
        '   - Social listening',
        '',
        '7. Create REPORTING CADENCE:',
        '   - Daily: Launch week metrics (first 7 days)',
        '   - Weekly: Key metrics summary (weeks 2-4)',
        '   - Monthly: Comprehensive launch review',
        '   - Quarterly: Long-term impact assessment',
        '',
        '8. Plan CONTINUOUS IMPROVEMENT:',
        '   - Identify optimization opportunities',
        '   - Test and iterate',
        '   - Scale what works',
        '   - Stop what doesn\'t',
        '',
        '9. Create post-launch monitoring playbook with dashboard specs'
      ],
      outputFormat: 'JSON object with post-launch monitoring plan'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'checkpoints', 'dashboards', 'optimizationPlan', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        checkpoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              checkpoint: { type: 'string' },
              timing: { type: 'string' },
              metricsToReview: { type: 'array', items: { type: 'string' } },
              successThresholds: { type: 'array', items: { type: 'object' } },
              attendees: { type: 'array', items: { type: 'string' } },
              agenda: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        dashboards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              purpose: { type: 'string' },
              metrics: { type: 'array', items: { type: 'string' } },
              audience: { type: 'string' },
              updateFrequency: { type: 'string' }
            }
          }
        },
        alerts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              redThreshold: { type: 'string' },
              yellowThreshold: { type: 'string' },
              action: { type: 'string' }
            }
          }
        },
        optimizationPlan: {
          type: 'object',
          properties: {
            optimizationAreas: { type: 'array', items: { type: 'string' } },
            testingFramework: { type: 'string' },
            iterationCadence: { type: 'string' },
            decisionCriteria: { type: 'array', items: { type: 'string' } }
          }
        },
        feedbackMechanisms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              mechanism: { type: 'string' },
              timing: { type: 'string' },
              targetAudience: { type: 'string' },
              metrics: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        reportingCadence: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              frequency: { type: 'string' },
              format: { type: 'string' },
              recipients: { type: 'array', items: { type: 'string' } },
              content: { type: 'array', items: { type: 'string' } }
            }
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
  labels: ['agent', 'product-launch-gtm', 'post-launch-monitoring']
}));

// Phase 11: Create Launch Checklist
export const createLaunchChecklistTask = defineTask('create-launch-checklist', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Create Launch Checklist - ${args.productName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Launch Program Manager and Checklist Coordinator',
      task: 'Create comprehensive launch checklist with all activities, owners, and completion criteria',
      context: {
        productName: args.productName,
        launchType: args.launchType,
        launchTier: args.launchTier,
        assessmentResult: args.assessmentResult,
        timelineResult: args.timelineResult,
        contentResult: args.contentResult,
        channelStrategyResult: args.channelStrategyResult,
        stakeholderResult: args.stakeholderResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create checklist across key categories:',
        '',
        '   PRODUCT READINESS:',
        '   - [ ] Feature development complete',
        '   - [ ] QA and testing completed',
        '   - [ ] Performance validated',
        '   - [ ] Security review passed',
        '   - [ ] Documentation complete',
        '   - [ ] Beta feedback addressed',
        '   - [ ] Pricing finalized',
        '   - [ ] Legal/compliance approved',
        '',
        '   MARKETING AND CONTENT:',
        '   - [ ] Messaging and positioning finalized',
        '   - [ ] Press release approved',
        '   - [ ] Website updates ready',
        '   - [ ] Blog post written',
        '   - [ ] Email campaigns created',
        '   - [ ] Social media posts scheduled',
        '   - [ ] Demo video produced',
        '   - [ ] Sales collateral ready',
        '',
        '   SALES ENABLEMENT:',
        '   - [ ] Sales training completed',
        '   - [ ] Sales playbook created',
        '   - [ ] Pitch deck finalized',
        '   - [ ] Demo environment ready',
        '   - [ ] Pricing and packaging approved',
        '   - [ ] CRM updated',
        '',
        '   CUSTOMER SUCCESS:',
        '   - [ ] CS team trained',
        '   - [ ] Onboarding flow ready',
        '   - [ ] User guides published',
        '   - [ ] Support resources ready',
        '   - [ ] Help center updated',
        '',
        '   TECHNICAL OPERATIONS:',
        '   - [ ] Production environment ready',
        '   - [ ] Monitoring and alerts configured',
        '   - [ ] Backup and recovery tested',
        '   - [ ] Incident response plan ready',
        '   - [ ] Scaling plan prepared',
        '',
        '   LAUNCH EXECUTION:',
        '   - [ ] PR distribution list ready',
        '   - [ ] Email lists segmented',
        '   - [ ] Launch timeline confirmed',
        '   - [ ] War room scheduled',
        '   - [ ] Stakeholders aligned',
        '',
        '2. For each checklist item, specify:',
        '   - Item description',
        '   - Owner',
        '   - Due date',
        '   - Status',
        '   - Dependencies',
        '   - Completion criteria',
        '',
        '3. Organize by timeline (T-4 weeks, T-2 weeks, T-1 week, T-0, T+1 week)',
        '4. Mark critical path items',
        '5. Create visual checklist dashboard',
        '6. Generate checklist tracking spreadsheet'
      ],
      outputFormat: 'JSON object with launch checklist'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'totalItems', 'categories', 'checklistPath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        totalItems: { type: 'number', description: 'Total checklist items' },
        completedItems: { type: 'number', description: 'Completed items' },
        completionRate: { type: 'number', description: 'Percentage complete' },
        categories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    item: { type: 'string' },
                    owner: { type: 'string' },
                    dueDate: { type: 'string' },
                    status: { type: 'string', enum: ['not-started', 'in-progress', 'completed', 'blocked'] },
                    priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
                    dependencies: { type: 'array', items: { type: 'string' } },
                    completionCriteria: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        timelineView: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              timeframe: { type: 'string' },
              items: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        criticalPathItems: {
          type: 'array',
          items: { type: 'string' },
          description: 'Items on critical path'
        },
        blockedItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              item: { type: 'string' },
              blocker: { type: 'string' },
              resolution: { type: 'string' }
            }
          }
        },
        checklistPath: { type: 'string', description: 'Path to checklist document' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'product-launch-gtm', 'checklist']
}));

// Phase 12: Generate GTM Documentation
export const generateGTMDocumentationTask = defineTask('generate-gtm-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Generate GTM Plan Documentation - ${args.productName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Product Marketing Documentation Specialist',
      task: 'Generate comprehensive GTM plan documentation synthesizing all launch planning work',
      context: {
        productName: args.productName,
        launchType: args.launchType,
        launchTier: args.launchTier,
        launchDate: args.launchDate,
        targetAudience: args.targetAudience,
        phaseResults: args.phaseResults,
        messagingResult: args.messagingResult,
        channelStrategyResult: args.channelStrategyResult,
        timelineResult: args.timelineResult,
        metricsResult: args.metricsResult,
        checklistResult: args.checklistResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create EXECUTIVE SUMMARY:',
        '   - Product overview and value proposition',
        '   - Target market and audience',
        '   - Launch objectives and goals',
        '   - Key strategies and tactics',
        '   - Success metrics',
        '   - Timeline and milestones',
        '',
        '2. Document MARKET POSITIONING:',
        '   - Positioning statement',
        '   - Value propositions',
        '   - Key messages',
        '   - Competitive differentiation',
        '',
        '3. Document TARGET AUDIENCE:',
        '   - Market segments',
        '   - Buyer personas',
        '   - Customer journey',
        '',
        '4. Document GTM STRATEGY:',
        '   - Channel strategy and mix',
        '   - Content strategy',
        '   - Sales strategy',
        '   - Partner strategy (if applicable)',
        '',
        '5. Document LAUNCH PLAN:',
        '   - Timeline and phases',
        '   - Key milestones',
        '   - Launch checklist',
        '   - Stakeholder coordination',
        '',
        '6. Document SUCCESS METRICS:',
        '   - KPIs and targets',
        '   - Measurement plan',
        '   - Post-launch monitoring',
        '',
        '7. Document RISKS AND MITIGATION:',
        '   - Key risks',
        '   - Contingency plans',
        '   - Go/no-go criteria',
        '',
        '8. Include APPENDICES:',
        '   - Detailed channel plans',
        '   - Content calendar',
        '   - Messaging framework',
        '   - Competitive battlecards',
        '   - Budget breakdown',
        '',
        '9. Format as professional markdown document',
        '10. Create executive summary presentation (bullet points)',
        '11. Generate one-page launch overview'
      ],
      outputFormat: 'JSON object with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'mainDocumentPath', 'executiveSummaryPath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        mainDocumentPath: { type: 'string', description: 'Path to comprehensive GTM plan document' },
        executiveSummaryPath: { type: 'string', description: 'Path to executive summary' },
        onePagerPath: { type: 'string', description: 'Path to one-page launch overview' },
        executiveSummary: {
          type: 'string',
          description: 'Executive summary text'
        },
        keyHighlights: {
          type: 'array',
          items: { type: 'string' },
          description: 'Key highlights from GTM plan'
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'product-launch-gtm', 'documentation']
}));

// Phase 13: Calculate GTM Score
export const calculateGTMScoreTask = defineTask('calculate-gtm-score', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Calculate GTM Readiness Score - ${args.productName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'GTM Assessment Specialist and Launch Readiness Evaluator',
      task: 'Calculate comprehensive GTM readiness score and provide launch recommendation',
      context: {
        productName: args.productName,
        launchType: args.launchType,
        launchTier: args.launchTier,
        launchDate: args.launchDate,
        assessmentResult: args.assessmentResult,
        messagingResult: args.messagingResult,
        channelStrategyResult: args.channelStrategyResult,
        timelineResult: args.timelineResult,
        contentResult: args.contentResult,
        metricsResult: args.metricsResult,
        checklistResult: args.checklistResult,
        phaseResults: args.phaseResults,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Calculate weighted GTM readiness score (0-100):',
        '',
        '   PRE-LAUNCH READINESS (25% weight):',
        '   - Use readinessScore from assessment',
        '   - Product, market, and team readiness',
        '',
        '   MESSAGING AND POSITIONING (15% weight):',
        '   - Positioning statement clarity',
        '   - Value propositions strength',
        '   - Competitive differentiation',
        '   - Message testing readiness',
        '',
        '   CHANNEL STRATEGY (20% weight):',
        '   - Channel selection appropriateness',
        '   - Channel mix diversity',
        '   - Tactics completeness',
        '   - Budget allocation reasonableness',
        '',
        '   EXECUTION PLANNING (20% weight):',
        '   - Timeline comprehensiveness',
        '   - Milestone clarity',
        '   - Stakeholder alignment',
        '   - Checklist completeness',
        '',
        '   CONTENT AND COLLATERAL (10% weight):',
        '   - Content asset completeness',
        '   - Content quality and readiness',
        '   - Enablement materials prepared',
        '',
        '   METRICS AND MEASUREMENT (10% weight):',
        '   - KPI definition clarity',
        '   - Target setting reasonableness',
        '   - Measurement infrastructure ready',
        '   - Post-launch monitoring plan',
        '',
        '2. Assess LAUNCH READINESS:',
        '   - Score >= 85: Ready to launch',
        '   - Score 70-84: Conditionally ready (address minor gaps)',
        '   - Score 50-69: Not ready (address major gaps)',
        '   - Score < 50: Significant work needed',
        '',
        '3. Identify STRENGTHS and GAPS:',
        '   - What is working well',
        '   - What needs improvement',
        '   - Critical gaps to address',
        '',
        '4. Provide LAUNCH RECOMMENDATION:',
        '   - Go / Conditional Go / No-Go / Delay',
        '   - Rationale for recommendation',
        '   - Conditions if conditional go',
        '   - Actions needed if not ready',
        '',
        '5. Generate VERDICT:',
        '   - Overall assessment',
        '   - Key risks and concerns',
        '   - Confidence level in success',
        '',
        '6. Create GTM score summary with detailed breakdown'
      ],
      outputFormat: 'JSON object with GTM score assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['gtmScore', 'launchReady', 'verdict', 'recommendation', 'summaryPath', 'artifacts'],
      properties: {
        gtmScore: { type: 'number', minimum: 0, maximum: 100, description: 'Overall GTM readiness score' },
        componentScores: {
          type: 'object',
          properties: {
            preLaunchReadiness: { type: 'number' },
            messagingPositioning: { type: 'number' },
            channelStrategy: { type: 'number' },
            executionPlanning: { type: 'number' },
            contentCollateral: { type: 'number' },
            metricsMeasurement: { type: 'number' }
          }
        },
        launchReady: { type: 'boolean', description: 'Ready to launch (score >= 70)' },
        readinessLevel: {
          type: 'string',
          enum: ['ready', 'conditionally-ready', 'not-ready', 'significant-work-needed'],
          description: 'Readiness level classification'
        },
        strengths: {
          type: 'array',
          items: { type: 'string' },
          description: 'Areas of strength'
        },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gap: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              recommendation: { type: 'string' }
            }
          }
        },
        launchRecommendation: {
          type: 'object',
          properties: {
            decision: { type: 'string', enum: ['go', 'conditional-go', 'no-go', 'delay'] },
            rationale: { type: 'string' },
            conditions: { type: 'array', items: { type: 'string' } },
            actionsNeeded: { type: 'array', items: { type: 'string' } }
          }
        },
        verdict: {
          type: 'string',
          description: 'Overall assessment and verdict'
        },
        recommendation: {
          type: 'string',
          description: 'Recommended next steps'
        },
        confidenceLevel: {
          type: 'string',
          enum: ['high', 'medium', 'low'],
          description: 'Confidence in launch success'
        },
        summaryPath: { type: 'string', description: 'Path to GTM score summary document' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'product-launch-gtm', 'scoring']
}));
