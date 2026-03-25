/**
 * @process specializations/domains/business/public-relations/annual-report-production
 * @description Plan and produce corporate publications including annual reports, corporate brochures, and investor communications aligned with brand standards
 * @specialization Public Relations and Communications
 * @category Corporate Communications
 * @inputs { organization: object, fiscalYearData: object, brandGuidelines: object, regulatoryRequirements: object }
 * @outputs { success: boolean, reportPlan: object, contentOutline: object, productionTimeline: object, quality: number }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organization,
    fiscalYearData,
    brandGuidelines = {},
    regulatoryRequirements = {},
    previousReports = [],
    stakeholderFeedback = {},
    targetQuality = 90
  } = inputs;

  // Phase 1: Report Planning and Strategy
  await ctx.breakpoint({
    question: 'Starting annual report production. Define report strategy and objectives?',
    title: 'Phase 1: Report Strategy',
    context: {
      runId: ctx.runId,
      phase: 'report-strategy',
      organization: organization.name
    }
  });

  const [reportStrategy, competitorAnalysis] = await Promise.all([
    ctx.task(defineReportStrategyTask, {
      organization,
      fiscalYearData,
      previousReports,
      stakeholderFeedback
    }),
    ctx.task(analyzeCompetitorReportsTask, {
      organization,
      previousReports
    })
  ]);

  // Phase 2: Content Architecture
  await ctx.breakpoint({
    question: 'Strategy defined. Develop content architecture?',
    title: 'Phase 2: Content Architecture',
    context: {
      runId: ctx.runId,
      phase: 'content-architecture'
    }
  });

  const contentArchitecture = await ctx.task(developContentArchitectureTask, {
    reportStrategy,
    fiscalYearData,
    regulatoryRequirements
  });

  // Phase 3: Narrative Development
  await ctx.breakpoint({
    question: 'Architecture defined. Develop report narrative?',
    title: 'Phase 3: Narrative Development',
    context: {
      runId: ctx.runId,
      phase: 'narrative-development'
    }
  });

  const [corporateNarrative, executiveMessages] = await Promise.all([
    ctx.task(developCorporateNarrativeTask, {
      fiscalYearData,
      reportStrategy,
      organization
    }),
    ctx.task(draftExecutiveMessagesTask, {
      fiscalYearData,
      reportStrategy,
      organization
    })
  ]);

  // Phase 4: Financial Content Planning
  await ctx.breakpoint({
    question: 'Narrative developed. Plan financial content presentation?',
    title: 'Phase 4: Financial Content',
    context: {
      runId: ctx.runId,
      phase: 'financial-content'
    }
  });

  const financialContent = await ctx.task(planFinancialContentTask, {
    fiscalYearData,
    regulatoryRequirements,
    brandGuidelines
  });

  // Phase 5: Visual Design Planning
  await ctx.breakpoint({
    question: 'Financial content planned. Plan visual design?',
    title: 'Phase 5: Visual Design',
    context: {
      runId: ctx.runId,
      phase: 'visual-design'
    }
  });

  const [visualDesignPlan, infographicsStrategy] = await Promise.all([
    ctx.task(planVisualDesignTask, {
      brandGuidelines,
      reportStrategy,
      contentArchitecture
    }),
    ctx.task(planInfographicsTask, {
      fiscalYearData,
      contentArchitecture
    })
  ]);

  // Phase 6: Production Timeline
  await ctx.breakpoint({
    question: 'Design planned. Create production timeline?',
    title: 'Phase 6: Production Timeline',
    context: {
      runId: ctx.runId,
      phase: 'production-timeline'
    }
  });

  const productionTimeline = await ctx.task(createProductionTimelineTask, {
    contentArchitecture,
    regulatoryRequirements,
    reportStrategy
  });

  // Phase 7: Review and Approval Process
  await ctx.breakpoint({
    question: 'Timeline created. Define review and approval process?',
    title: 'Phase 7: Review Process',
    context: {
      runId: ctx.runId,
      phase: 'review-process'
    }
  });

  const reviewProcess = await ctx.task(defineReviewProcessTask, {
    organization,
    regulatoryRequirements,
    productionTimeline
  });

  // Phase 8: Distribution Planning
  await ctx.breakpoint({
    question: 'Review process defined. Plan distribution?',
    title: 'Phase 8: Distribution Planning',
    context: {
      runId: ctx.runId,
      phase: 'distribution-planning'
    }
  });

  const distributionPlan = await ctx.task(planDistributionTask, {
    reportStrategy,
    organization
  });

  // Phase 9: Quality Validation
  await ctx.breakpoint({
    question: 'Validate annual report production plan quality?',
    title: 'Phase 9: Quality Validation',
    context: {
      runId: ctx.runId,
      phase: 'quality-validation',
      targetQuality
    }
  });

  const qualityResult = await ctx.task(validateProductionPlanTask, {
    reportStrategy,
    contentArchitecture,
    corporateNarrative,
    executiveMessages,
    financialContent,
    visualDesignPlan,
    productionTimeline,
    reviewProcess,
    distributionPlan,
    targetQuality
  });

  const quality = qualityResult.score;

  if (quality >= targetQuality) {
    return {
      success: true,
      reportPlan: {
        strategy: reportStrategy,
        narrative: corporateNarrative,
        executiveMessages: executiveMessages.messages,
        financialContent: financialContent.plan,
        visualDesign: visualDesignPlan,
        infographics: infographicsStrategy
      },
      contentOutline: contentArchitecture,
      productionTimeline,
      reviewProcess,
      distributionPlan,
      quality,
      targetQuality,
      metadata: {
        processId: 'specializations/domains/business/public-relations/annual-report-production',
        timestamp: ctx.now(),
        organization: organization.name,
        fiscalYear: fiscalYearData.year
      }
    };
  } else {
    return {
      success: false,
      qualityGateFailed: true,
      quality,
      targetQuality,
      gaps: qualityResult.gaps,
      recommendations: qualityResult.recommendations,
      metadata: {
        processId: 'specializations/domains/business/public-relations/annual-report-production',
        timestamp: ctx.now()
      }
    };
  }
}

// Task Definitions

export const defineReportStrategyTask = defineTask('define-report-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define Report Strategy',
  agent: {
    name: 'report-strategist',
    prompt: {
      role: 'Corporate communications strategist planning annual reports',
      task: 'Define strategy and objectives for annual report',
      context: args,
      instructions: [
        'Define primary objectives and audience priorities',
        'Identify key themes and narrative focus',
        'Assess stakeholder information needs',
        'Review previous report feedback and learnings',
        'Define differentiation from competitors',
        'Establish tone and positioning',
        'Define format approach (print, digital, interactive)',
        'Set success metrics'
      ],
      outputFormat: 'JSON with objectives, audiences, themes, narrativeFocus, stakeholderNeeds, differentiation, tone, format, successMetrics'
    },
    outputSchema: {
      type: 'object',
      required: ['objectives', 'themes', 'format'],
      properties: {
        objectives: { type: 'array', items: { type: 'string' } },
        audiences: { type: 'array', items: { type: 'object' } },
        themes: { type: 'array', items: { type: 'string' } },
        narrativeFocus: { type: 'string' },
        stakeholderNeeds: { type: 'object' },
        differentiation: { type: 'array', items: { type: 'string' } },
        tone: { type: 'string' },
        format: { type: 'object' },
        successMetrics: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'report-strategy']
}));

export const analyzeCompetitorReportsTask = defineTask('analyze-competitor-reports', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Competitor Reports',
  agent: {
    name: 'competitor-report-analyst',
    prompt: {
      role: 'Corporate communications analyst reviewing competitor reports',
      task: 'Analyze competitor annual reports for benchmarking',
      context: args,
      instructions: [
        'Review competitor annual report formats',
        'Identify industry best practices',
        'Analyze narrative approaches and themes',
        'Review design and visual treatments',
        'Identify innovative features and formats',
        'Note digital and interactive elements',
        'Assess ESG/sustainability reporting approaches',
        'Identify differentiation opportunities'
      ],
      outputFormat: 'JSON with competitorReviews, bestPractices, innovativeFeatures, designTrends, esgApproaches, differentiationOpportunities'
    },
    outputSchema: {
      type: 'object',
      required: ['bestPractices', 'differentiationOpportunities'],
      properties: {
        competitorReviews: { type: 'array', items: { type: 'object' } },
        bestPractices: { type: 'array', items: { type: 'string' } },
        innovativeFeatures: { type: 'array', items: { type: 'object' } },
        designTrends: { type: 'array', items: { type: 'string' } },
        esgApproaches: { type: 'array', items: { type: 'object' } },
        differentiationOpportunities: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'competitor-analysis']
}));

export const developContentArchitectureTask = defineTask('develop-content-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Content Architecture',
  agent: {
    name: 'content-architect',
    prompt: {
      role: 'Information architect structuring annual report',
      task: 'Develop comprehensive content architecture for report',
      context: args,
      instructions: [
        'Define major sections and sequence',
        'Create detailed table of contents',
        'Map content to regulatory requirements',
        'Define section objectives and key messages',
        'Identify content sources and owners',
        'Plan cross-references and navigation',
        'Define page allocation by section',
        'Plan supplementary materials'
      ],
      outputFormat: 'JSON with sections array (title, objective, keyMessages, pageCount, contentOwner), tableOfContents, regulatoryMapping, supplementaryMaterials'
    },
    outputSchema: {
      type: 'object',
      required: ['sections', 'tableOfContents'],
      properties: {
        sections: { type: 'array', items: { type: 'object' } },
        tableOfContents: { type: 'array', items: { type: 'object' } },
        regulatoryMapping: { type: 'object' },
        supplementaryMaterials: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'content-architecture']
}));

export const developCorporateNarrativeTask = defineTask('develop-corporate-narrative', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Corporate Narrative',
  agent: {
    name: 'corporate-narrative-writer',
    prompt: {
      role: 'Corporate storyteller developing annual report narrative',
      task: 'Develop compelling corporate narrative for report',
      context: args,
      instructions: [
        'Create overarching year-in-review narrative',
        'Develop strategic progress storyline',
        'Craft compelling opening and introduction',
        'Create section narratives and transitions',
        'Develop milestone and achievement highlights',
        'Create future outlook narrative',
        'Ensure consistency with corporate messaging',
        'Balance pride with humility in tone'
      ],
      outputFormat: 'JSON with overarchingNarrative, strategicStoryline, introduction, sectionNarratives, highlights, futureOutlook, toneGuidelines'
    },
    outputSchema: {
      type: 'object',
      required: ['overarchingNarrative', 'strategicStoryline', 'introduction'],
      properties: {
        overarchingNarrative: { type: 'string' },
        strategicStoryline: { type: 'object' },
        introduction: { type: 'string' },
        sectionNarratives: { type: 'array', items: { type: 'object' } },
        highlights: { type: 'array', items: { type: 'object' } },
        futureOutlook: { type: 'string' },
        toneGuidelines: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'corporate-narrative']
}));

export const draftExecutiveMessagesTask = defineTask('draft-executive-messages', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Draft Executive Messages',
  agent: {
    name: 'executive-message-writer',
    prompt: {
      role: 'Executive speechwriter drafting annual report letters',
      task: 'Draft executive messages for annual report',
      context: args,
      instructions: [
        'Draft Chairman/Board Chair letter',
        'Draft CEO letter/report',
        'Include year highlights and challenges',
        'Address strategic priorities and progress',
        'Include stakeholder appreciation',
        'Address future outlook and vision',
        'Ensure authentic executive voice',
        'Balance achievements with accountability'
      ],
      outputFormat: 'JSON with messages array (role, letter, keyThemes, tone), chairmanLetter, ceoLetter, voiceGuidelines'
    },
    outputSchema: {
      type: 'object',
      required: ['messages'],
      properties: {
        messages: { type: 'array', items: { type: 'object' } },
        chairmanLetter: { type: 'object' },
        ceoLetter: { type: 'object' },
        voiceGuidelines: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'executive-messages']
}));

export const planFinancialContentTask = defineTask('plan-financial-content', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan Financial Content',
  agent: {
    name: 'financial-content-planner',
    prompt: {
      role: 'Investor communications specialist planning financial presentation',
      task: 'Plan financial content presentation for annual report',
      context: args,
      instructions: [
        'Identify required financial statements',
        'Plan financial highlights presentation',
        'Define key metrics and KPIs to feature',
        'Plan year-over-year comparisons',
        'Create financial narrative approach',
        'Plan charts and data visualizations',
        'Ensure regulatory compliance',
        'Define MD&A approach'
      ],
      outputFormat: 'JSON with plan, requiredStatements, highlights, keyMetrics, comparisons, narrativeApproach, visualizations, regulatoryCompliance, mdaApproach'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'requiredStatements', 'keyMetrics'],
      properties: {
        plan: { type: 'object' },
        requiredStatements: { type: 'array', items: { type: 'string' } },
        highlights: { type: 'array', items: { type: 'object' } },
        keyMetrics: { type: 'array', items: { type: 'object' } },
        comparisons: { type: 'array', items: { type: 'object' } },
        narrativeApproach: { type: 'object' },
        visualizations: { type: 'array', items: { type: 'object' } },
        regulatoryCompliance: { type: 'array', items: { type: 'string' } },
        mdaApproach: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'financial-content']
}));

export const planVisualDesignTask = defineTask('plan-visual-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan Visual Design',
  agent: {
    name: 'visual-design-planner',
    prompt: {
      role: 'Design director planning annual report visual identity',
      task: 'Plan visual design approach for annual report',
      context: args,
      instructions: [
        'Define visual theme aligned with narrative',
        'Plan color palette within brand guidelines',
        'Define typography and hierarchy',
        'Plan photography and imagery approach',
        'Define layout grid and templates',
        'Plan cover design concept',
        'Define icon and graphic element style',
        'Plan print and digital specifications'
      ],
      outputFormat: 'JSON with visualTheme, colorPalette, typography, photographyApproach, layoutGrid, coverConcepts, graphicStyle, specifications'
    },
    outputSchema: {
      type: 'object',
      required: ['visualTheme', 'colorPalette', 'typography'],
      properties: {
        visualTheme: { type: 'object' },
        colorPalette: { type: 'object' },
        typography: { type: 'object' },
        photographyApproach: { type: 'object' },
        layoutGrid: { type: 'object' },
        coverConcepts: { type: 'array', items: { type: 'object' } },
        graphicStyle: { type: 'object' },
        specifications: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'visual-design']
}));

export const planInfographicsTask = defineTask('plan-infographics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan Infographics',
  agent: {
    name: 'infographics-planner',
    prompt: {
      role: 'Data visualization specialist planning annual report infographics',
      task: 'Plan infographics and data visualizations',
      context: args,
      instructions: [
        'Identify key data stories to visualize',
        'Plan chart types for financial data',
        'Design timeline and milestone visuals',
        'Plan geographic and market visualizations',
        'Create comparison and growth visuals',
        'Design ESG/sustainability metrics visuals',
        'Plan interactive digital elements',
        'Define data visualization style guide'
      ],
      outputFormat: 'JSON with dataStories, chartTypes, timelineVisuals, geographicVisuals, comparisonVisuals, esgVisuals, interactiveElements, styleGuide'
    },
    outputSchema: {
      type: 'object',
      required: ['dataStories', 'chartTypes'],
      properties: {
        dataStories: { type: 'array', items: { type: 'object' } },
        chartTypes: { type: 'array', items: { type: 'object' } },
        timelineVisuals: { type: 'array', items: { type: 'object' } },
        geographicVisuals: { type: 'array', items: { type: 'object' } },
        comparisonVisuals: { type: 'array', items: { type: 'object' } },
        esgVisuals: { type: 'array', items: { type: 'object' } },
        interactiveElements: { type: 'array', items: { type: 'object' } },
        styleGuide: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'infographics']
}));

export const createProductionTimelineTask = defineTask('create-production-timeline', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Production Timeline',
  agent: {
    name: 'production-timeline-planner',
    prompt: {
      role: 'Project manager creating annual report production schedule',
      task: 'Create detailed production timeline',
      context: args,
      instructions: [
        'Define production phases and milestones',
        'Schedule content development activities',
        'Plan design and layout phases',
        'Schedule review and approval cycles',
        'Plan photography and visual shoots',
        'Schedule printing and production',
        'Plan digital version development',
        'Include buffer time for iterations'
      ],
      outputFormat: 'JSON with phases array (phase, activities, startDate, endDate, owner, dependencies), milestones, criticalPath, riskBuffer'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'milestones', 'criticalPath'],
      properties: {
        phases: { type: 'array', items: { type: 'object' } },
        milestones: { type: 'array', items: { type: 'object' } },
        criticalPath: { type: 'array', items: { type: 'string' } },
        riskBuffer: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'production-timeline']
}));

export const defineReviewProcessTask = defineTask('define-review-process', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define Review Process',
  agent: {
    name: 'review-process-designer',
    prompt: {
      role: 'Corporate governance specialist defining approval workflows',
      task: 'Define review and approval process',
      context: args,
      instructions: [
        'Define content review stages',
        'Identify reviewers by section',
        'Create legal and compliance review process',
        'Define executive approval workflow',
        'Plan board review and approval',
        'Define financial accuracy review',
        'Create proofreading and QC process',
        'Define version control and tracking'
      ],
      outputFormat: 'JSON with reviewStages, reviewerMatrix, legalProcess, executiveApproval, boardApproval, financialReview, qcProcess, versionControl'
    },
    outputSchema: {
      type: 'object',
      required: ['reviewStages', 'reviewerMatrix'],
      properties: {
        reviewStages: { type: 'array', items: { type: 'object' } },
        reviewerMatrix: { type: 'object' },
        legalProcess: { type: 'object' },
        executiveApproval: { type: 'object' },
        boardApproval: { type: 'object' },
        financialReview: { type: 'object' },
        qcProcess: { type: 'object' },
        versionControl: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'review-process']
}));

export const planDistributionTask = defineTask('plan-distribution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan Distribution',
  agent: {
    name: 'distribution-planner',
    prompt: {
      role: 'Corporate communications specialist planning report distribution',
      task: 'Plan annual report distribution strategy',
      context: args,
      instructions: [
        'Plan investor and shareholder distribution',
        'Define employee distribution approach',
        'Plan media and analyst distribution',
        'Define digital publication strategy',
        'Plan regulatory filing and submissions',
        'Define website hosting approach',
        'Plan social media and PR launch',
        'Create distribution timeline and logistics'
      ],
      outputFormat: 'JSON with investorDistribution, employeeDistribution, mediaDistribution, digitalStrategy, regulatoryFiling, websiteHosting, launchPlan, logistics'
    },
    outputSchema: {
      type: 'object',
      required: ['investorDistribution', 'digitalStrategy', 'launchPlan'],
      properties: {
        investorDistribution: { type: 'object' },
        employeeDistribution: { type: 'object' },
        mediaDistribution: { type: 'object' },
        digitalStrategy: { type: 'object' },
        regulatoryFiling: { type: 'object' },
        websiteHosting: { type: 'object' },
        launchPlan: { type: 'object' },
        logistics: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'distribution-planning']
}));

export const validateProductionPlanTask = defineTask('validate-production-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate Production Plan Quality',
  agent: {
    name: 'production-plan-validator',
    prompt: {
      role: 'Annual report quality assessor',
      task: 'Validate annual report production plan quality',
      context: args,
      instructions: [
        'Assess strategy clarity and focus',
        'Evaluate content architecture completeness',
        'Review narrative quality and consistency',
        'Assess visual design approach',
        'Evaluate timeline feasibility',
        'Review approval process robustness',
        'Assess regulatory compliance coverage',
        'Provide overall quality score (0-100)'
      ],
      outputFormat: 'JSON with score, passed, strategyScore, contentScore, narrativeScore, designScore, timelineScore, processScore, complianceScore, gaps, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'passed'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        passed: { type: 'boolean' },
        strategyScore: { type: 'number' },
        contentScore: { type: 'number' },
        narrativeScore: { type: 'number' },
        designScore: { type: 'number' },
        timelineScore: { type: 'number' },
        processScore: { type: 'number' },
        complianceScore: { type: 'number' },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'quality-validation']
}));
