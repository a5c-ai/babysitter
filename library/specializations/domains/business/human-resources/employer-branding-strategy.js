/**
 * @process specializations/domains/business/human-resources/employer-branding-strategy
 * @description Employer Branding Strategy Process - Development of employee value proposition (EVP), employer brand messaging,
 * careers site optimization, and social media talent attraction campaigns.
 * @inputs { companyName: string, industry: string, targetRoles: array, currentBrandPerception?: object }
 * @outputs { success: boolean, evp: object, brandGuidelines: object, contentStrategy: object, campaignPlan: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/human-resources/employer-branding-strategy', {
 *   companyName: 'TechCorp',
 *   industry: 'Technology',
 *   targetRoles: ['Software Engineer', 'Product Manager', 'Data Scientist'],
 *   currentBrandPerception: { glassdoorRating: 4.2, linkedinFollowers: 50000 }
 * });
 *
 * @references
 * - LinkedIn Employer Branding: https://business.linkedin.com/talent-solutions/resources/talent-acquisition/employer-branding
 * - Glassdoor Employer Branding: https://www.glassdoor.com/employers/blog/employer-branding/
 * - Universum Employer Branding: https://universumglobal.com/employer-branding/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    companyName,
    industry,
    targetRoles,
    currentBrandPerception = {},
    competitorBrands = [],
    cultureAttributes = [],
    hiringGoals = {},
    budget = null,
    outputDir = 'employer-branding-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Employer Branding Strategy for ${companyName}`);

  // Phase 1: Brand Audit and Assessment
  const brandAudit = await ctx.task(brandAuditTask, {
    companyName,
    industry,
    currentBrandPerception,
    competitorBrands,
    outputDir
  });

  artifacts.push(...brandAudit.artifacts);

  await ctx.breakpoint({
    question: `Brand audit completed for ${companyName}. Current brand strength: ${brandAudit.brandStrengthScore}/100. Review audit findings?`,
    title: 'Brand Audit Review',
    context: {
      runId: ctx.runId,
      brandStrengthScore: brandAudit.brandStrengthScore,
      strengths: brandAudit.strengths,
      weaknesses: brandAudit.weaknesses,
      competitorAnalysis: brandAudit.competitorAnalysis,
      files: brandAudit.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 2: Employee Research and Insights
  const employeeResearch = await ctx.task(employeeResearchTask, {
    companyName,
    cultureAttributes,
    targetRoles,
    outputDir
  });

  artifacts.push(...employeeResearch.artifacts);

  // Phase 3: EVP Development
  const evpDevelopment = await ctx.task(evpDevelopmentTask, {
    companyName,
    industry,
    brandAudit,
    employeeResearch,
    cultureAttributes,
    targetRoles,
    outputDir
  });

  artifacts.push(...evpDevelopment.artifacts);

  await ctx.breakpoint({
    question: `Employee Value Proposition developed. Core pillars: ${evpDevelopment.evpPillars.join(', ')}. Review and approve EVP framework?`,
    title: 'EVP Review',
    context: {
      runId: ctx.runId,
      evpStatement: evpDevelopment.evpStatement,
      evpPillars: evpDevelopment.evpPillars,
      targetAudienceMessages: evpDevelopment.targetAudienceMessages,
      files: evpDevelopment.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 4: Brand Messaging Framework
  const brandMessaging = await ctx.task(brandMessagingTask, {
    companyName,
    evp: evpDevelopment.evp,
    targetRoles,
    industry,
    outputDir
  });

  artifacts.push(...brandMessaging.artifacts);

  // Phase 5: Visual Identity Guidelines
  const visualIdentity = await ctx.task(visualIdentityTask, {
    companyName,
    evp: evpDevelopment.evp,
    brandMessaging: brandMessaging.messaging,
    outputDir
  });

  artifacts.push(...visualIdentity.artifacts);

  // Phase 6: Careers Site Strategy
  const careersSiteStrategy = await ctx.task(careersSiteStrategyTask, {
    companyName,
    evp: evpDevelopment.evp,
    brandMessaging: brandMessaging.messaging,
    targetRoles,
    outputDir
  });

  artifacts.push(...careersSiteStrategy.artifacts);

  // Phase 7: Social Media Strategy
  const socialMediaStrategy = await ctx.task(socialMediaStrategyTask, {
    companyName,
    evp: evpDevelopment.evp,
    brandMessaging: brandMessaging.messaging,
    targetRoles,
    hiringGoals,
    outputDir
  });

  artifacts.push(...socialMediaStrategy.artifacts);

  // Phase 8: Content Strategy and Calendar
  const contentStrategy = await ctx.task(contentStrategyTask, {
    companyName,
    evp: evpDevelopment.evp,
    brandMessaging: brandMessaging.messaging,
    socialMediaStrategy,
    targetRoles,
    outputDir
  });

  artifacts.push(...contentStrategy.artifacts);

  // Phase 9: Employee Advocacy Program
  const advocacyProgram = await ctx.task(advocacyProgramTask, {
    companyName,
    evp: evpDevelopment.evp,
    contentStrategy: contentStrategy.strategy,
    outputDir
  });

  artifacts.push(...advocacyProgram.artifacts);

  // Phase 10: Campaign Planning
  const campaignPlan = await ctx.task(campaignPlanningTask, {
    companyName,
    evp: evpDevelopment.evp,
    socialMediaStrategy,
    contentStrategy: contentStrategy.strategy,
    targetRoles,
    hiringGoals,
    budget,
    outputDir
  });

  artifacts.push(...campaignPlan.artifacts);

  await ctx.breakpoint({
    question: `Talent attraction campaign plan developed. Target reach: ${campaignPlan.targetReach}. Review campaign plan and budget allocation?`,
    title: 'Campaign Plan Review',
    context: {
      runId: ctx.runId,
      campaigns: campaignPlan.campaigns,
      budgetAllocation: campaignPlan.budgetAllocation,
      targetReach: campaignPlan.targetReach,
      expectedResults: campaignPlan.expectedResults,
      files: campaignPlan.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 11: Metrics and Measurement Framework
  const metricsFramework = await ctx.task(metricsFrameworkTask, {
    companyName,
    campaignPlan,
    hiringGoals,
    outputDir
  });

  artifacts.push(...metricsFramework.artifacts);

  // Phase 12: Implementation Roadmap
  const implementationRoadmap = await ctx.task(implementationRoadmapTask, {
    companyName,
    evp: evpDevelopment.evp,
    brandMessaging: brandMessaging.messaging,
    careersSiteStrategy,
    socialMediaStrategy,
    contentStrategy: contentStrategy.strategy,
    advocacyProgram,
    campaignPlan,
    outputDir
  });

  artifacts.push(...implementationRoadmap.artifacts);

  return {
    success: true,
    companyName,
    industry,
    targetRoles,
    evp: evpDevelopment.evp,
    brandGuidelines: {
      messaging: brandMessaging.messaging,
      visualIdentity: visualIdentity.guidelines,
      toneOfVoice: brandMessaging.toneOfVoice
    },
    contentStrategy: contentStrategy.strategy,
    campaignPlan: campaignPlan.plan,
    careersSiteRecommendations: careersSiteStrategy.recommendations,
    socialMediaStrategy: socialMediaStrategy.strategy,
    advocacyProgram: advocacyProgram.program,
    metricsFramework: metricsFramework.framework,
    implementationRoadmap: implementationRoadmap.roadmap,
    artifacts,
    metadata: {
      processId: 'specializations/domains/business/human-resources/employer-branding-strategy',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task Definitions

export const brandAuditTask = defineTask('brand-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Brand Audit - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Employer Brand Strategist',
      task: 'Conduct comprehensive employer brand audit',
      context: {
        companyName: args.companyName,
        industry: args.industry,
        currentBrandPerception: args.currentBrandPerception,
        competitorBrands: args.competitorBrands,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze Glassdoor reviews and ratings',
        '2. Review LinkedIn company page metrics',
        '3. Assess careers site effectiveness',
        '4. Analyze social media presence',
        '5. Review job posting language and appeal',
        '6. Benchmark against competitors',
        '7. Identify brand strengths and weaknesses',
        '8. Assess current EVP clarity',
        '9. Calculate brand strength score',
        '10. Document improvement opportunities'
      ],
      outputFormat: 'JSON object with brand audit results'
    },
    outputSchema: {
      type: 'object',
      required: ['brandStrengthScore', 'strengths', 'weaknesses', 'artifacts'],
      properties: {
        brandStrengthScore: { type: 'number' },
        strengths: { type: 'array', items: { type: 'string' } },
        weaknesses: { type: 'array', items: { type: 'string' } },
        competitorAnalysis: { type: 'array', items: { type: 'object' } },
        channelAssessment: { type: 'object' },
        improvementOpportunities: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'employer-branding', 'audit']
}));

export const employeeResearchTask = defineTask('employee-research', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Employee Research - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Employee Experience Researcher',
      task: 'Conduct employee research to inform employer brand',
      context: {
        companyName: args.companyName,
        cultureAttributes: args.cultureAttributes,
        targetRoles: args.targetRoles,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design employee survey',
        '2. Conduct focus groups',
        '3. Interview high performers',
        '4. Analyze engagement data',
        '5. Identify what employees value most',
        '6. Discover authentic culture stories',
        '7. Understand candidate attraction factors',
        '8. Map employee journey highlights',
        '9. Identify unique differentiators',
        '10. Document employee testimonials'
      ],
      outputFormat: 'JSON object with employee research findings'
    },
    outputSchema: {
      type: 'object',
      required: ['insights', 'valueDrivers', 'artifacts'],
      properties: {
        insights: { type: 'array', items: { type: 'object' } },
        valueDrivers: { type: 'array', items: { type: 'string' } },
        cultureThemes: { type: 'array', items: { type: 'string' } },
        employeeStories: { type: 'array', items: { type: 'object' } },
        differentiators: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'employer-branding', 'research']
}));

export const evpDevelopmentTask = defineTask('evp-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: EVP Development - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'EVP Strategist',
      task: 'Develop comprehensive Employee Value Proposition',
      context: {
        companyName: args.companyName,
        industry: args.industry,
        brandAudit: args.brandAudit,
        employeeResearch: args.employeeResearch,
        cultureAttributes: args.cultureAttributes,
        targetRoles: args.targetRoles,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Synthesize research insights',
        '2. Define EVP pillars (5-6 key themes)',
        '3. Create EVP statement',
        '4. Develop pillar descriptions',
        '5. Create proof points for each pillar',
        '6. Tailor messaging by target audience',
        '7. Ensure authenticity and differentiation',
        '8. Validate with employee focus groups',
        '9. Create EVP visual framework',
        '10. Document EVP guidelines'
      ],
      outputFormat: 'JSON object with EVP framework'
    },
    outputSchema: {
      type: 'object',
      required: ['evp', 'evpStatement', 'evpPillars', 'artifacts'],
      properties: {
        evp: { type: 'object' },
        evpStatement: { type: 'string' },
        evpPillars: { type: 'array', items: { type: 'string' } },
        pillarDescriptions: { type: 'object' },
        proofPoints: { type: 'object' },
        targetAudienceMessages: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'employer-branding', 'evp']
}));

export const brandMessagingTask = defineTask('brand-messaging', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Brand Messaging - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Brand Messaging Specialist',
      task: 'Develop employer brand messaging framework',
      context: {
        companyName: args.companyName,
        evp: args.evp,
        targetRoles: args.targetRoles,
        industry: args.industry,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create brand positioning statement',
        '2. Define tone of voice guidelines',
        '3. Develop key messages by audience',
        '4. Create taglines and headlines',
        '5. Write boilerplate copy',
        '6. Develop job posting templates',
        '7. Create social media copy guidelines',
        '8. Design email templates',
        '9. Create FAQ responses',
        '10. Document messaging do\'s and don\'ts'
      ],
      outputFormat: 'JSON object with brand messaging framework'
    },
    outputSchema: {
      type: 'object',
      required: ['messaging', 'toneOfVoice', 'artifacts'],
      properties: {
        messaging: { type: 'object' },
        positioningStatement: { type: 'string' },
        toneOfVoice: { type: 'object' },
        keyMessages: { type: 'object' },
        taglines: { type: 'array', items: { type: 'string' } },
        templates: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'employer-branding', 'messaging']
}));

export const visualIdentityTask = defineTask('visual-identity', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Visual Identity - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Brand Designer',
      task: 'Define employer brand visual identity guidelines',
      context: {
        companyName: args.companyName,
        evp: args.evp,
        brandMessaging: args.brandMessaging,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define employer brand color palette',
        '2. Select typography for recruitment',
        '3. Create imagery guidelines',
        '4. Design social media templates',
        '5. Create job posting visual templates',
        '6. Design career fair materials',
        '7. Create presentation templates',
        '8. Define photo/video style guide',
        '9. Design employee advocacy assets',
        '10. Create brand asset library structure'
      ],
      outputFormat: 'JSON object with visual identity guidelines'
    },
    outputSchema: {
      type: 'object',
      required: ['guidelines', 'artifacts'],
      properties: {
        guidelines: { type: 'object' },
        colorPalette: { type: 'object' },
        typography: { type: 'object' },
        imageryGuidelines: { type: 'object' },
        templates: { type: 'array', items: { type: 'object' } },
        assetLibrary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'employer-branding', 'visual-identity']
}));

export const careersSiteStrategyTask = defineTask('careers-site-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Careers Site Strategy - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Digital Experience Strategist',
      task: 'Develop careers site optimization strategy',
      context: {
        companyName: args.companyName,
        evp: args.evp,
        brandMessaging: args.brandMessaging,
        targetRoles: args.targetRoles,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Audit current careers site',
        '2. Define site architecture',
        '3. Plan EVP content integration',
        '4. Design candidate journey',
        '5. Plan employee story features',
        '6. Optimize job search experience',
        '7. Plan video content integration',
        '8. Design mobile experience',
        '9. Plan SEO optimization',
        '10. Define conversion metrics'
      ],
      outputFormat: 'JSON object with careers site strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'recommendations', 'artifacts'],
      properties: {
        strategy: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'object' } },
        siteArchitecture: { type: 'object' },
        contentPlan: { type: 'array', items: { type: 'object' } },
        seoStrategy: { type: 'object' },
        conversionMetrics: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'employer-branding', 'careers-site']
}));

export const socialMediaStrategyTask = defineTask('social-media-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Social Media Strategy - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Social Media Strategist',
      task: 'Develop social media talent attraction strategy',
      context: {
        companyName: args.companyName,
        evp: args.evp,
        brandMessaging: args.brandMessaging,
        targetRoles: args.targetRoles,
        hiringGoals: args.hiringGoals,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define target platforms',
        '2. Create platform-specific strategies',
        '3. Plan LinkedIn company page optimization',
        '4. Design Instagram/TikTok approach',
        '5. Plan Twitter/X engagement strategy',
        '6. Define posting frequency',
        '7. Create hashtag strategy',
        '8. Plan paid social campaigns',
        '9. Define engagement protocols',
        '10. Set social media KPIs'
      ],
      outputFormat: 'JSON object with social media strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'artifacts'],
      properties: {
        strategy: { type: 'object' },
        platforms: { type: 'array', items: { type: 'object' } },
        postingSchedule: { type: 'object' },
        hashtagStrategy: { type: 'array', items: { type: 'string' } },
        paidCampaigns: { type: 'array', items: { type: 'object' } },
        kpis: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'employer-branding', 'social-media']
}));

export const contentStrategyTask = defineTask('content-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Content Strategy - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Content Strategist',
      task: 'Develop employer brand content strategy and calendar',
      context: {
        companyName: args.companyName,
        evp: args.evp,
        brandMessaging: args.brandMessaging,
        socialMediaStrategy: args.socialMediaStrategy,
        targetRoles: args.targetRoles,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define content pillars',
        '2. Plan content types (blog, video, podcast)',
        '3. Create editorial calendar',
        '4. Plan employee spotlight series',
        '5. Design behind-the-scenes content',
        '6. Plan thought leadership content',
        '7. Create event content strategy',
        '8. Plan user-generated content approach',
        '9. Define content governance',
        '10. Create content production workflow'
      ],
      outputFormat: 'JSON object with content strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'contentCalendar', 'artifacts'],
      properties: {
        strategy: { type: 'object' },
        contentPillars: { type: 'array', items: { type: 'string' } },
        contentTypes: { type: 'array', items: { type: 'object' } },
        contentCalendar: { type: 'array', items: { type: 'object' } },
        productionWorkflow: { type: 'object' },
        governance: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'employer-branding', 'content']
}));

export const advocacyProgramTask = defineTask('advocacy-program', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Employee Advocacy - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Employee Advocacy Manager',
      task: 'Design employee advocacy program',
      context: {
        companyName: args.companyName,
        evp: args.evp,
        contentStrategy: args.contentStrategy,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define advocacy program objectives',
        '2. Identify ambassador selection criteria',
        '3. Create ambassador training program',
        '4. Design content sharing platform',
        '5. Create shareable content library',
        '6. Define incentive structure',
        '7. Plan referral program integration',
        '8. Create ambassador communication plan',
        '9. Define success metrics',
        '10. Plan program launch'
      ],
      outputFormat: 'JSON object with advocacy program design'
    },
    outputSchema: {
      type: 'object',
      required: ['program', 'artifacts'],
      properties: {
        program: { type: 'object' },
        ambassadorCriteria: { type: 'array', items: { type: 'string' } },
        trainingProgram: { type: 'object' },
        contentLibrary: { type: 'object' },
        incentives: { type: 'array', items: { type: 'object' } },
        metrics: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'employer-branding', 'advocacy']
}));

export const campaignPlanningTask = defineTask('campaign-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Campaign Planning - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Recruitment Marketing Manager',
      task: 'Plan talent attraction campaigns',
      context: {
        companyName: args.companyName,
        evp: args.evp,
        socialMediaStrategy: args.socialMediaStrategy,
        contentStrategy: args.contentStrategy,
        targetRoles: args.targetRoles,
        hiringGoals: args.hiringGoals,
        budget: args.budget,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define campaign objectives',
        '2. Identify target audiences',
        '3. Select campaign channels',
        '4. Create campaign themes',
        '5. Design campaign creative',
        '6. Plan paid media strategy',
        '7. Define campaign timeline',
        '8. Allocate budget by channel',
        '9. Set campaign KPIs',
        '10. Create measurement framework'
      ],
      outputFormat: 'JSON object with campaign plan'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'campaigns', 'budgetAllocation', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        campaigns: { type: 'array', items: { type: 'object' } },
        budgetAllocation: { type: 'object' },
        targetReach: { type: 'number' },
        expectedResults: { type: 'object' },
        timeline: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'employer-branding', 'campaigns']
}));

export const metricsFrameworkTask = defineTask('metrics-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Metrics Framework - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'HR Analytics Specialist',
      task: 'Develop employer brand measurement framework',
      context: {
        companyName: args.companyName,
        campaignPlan: args.campaignPlan,
        hiringGoals: args.hiringGoals,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define brand awareness metrics',
        '2. Set engagement metrics',
        '3. Define conversion metrics',
        '4. Create quality of hire metrics',
        '5. Set cost efficiency metrics',
        '6. Define employee advocacy metrics',
        '7. Create reporting dashboard',
        '8. Set benchmark targets',
        '9. Plan A/B testing framework',
        '10. Define ROI calculation method'
      ],
      outputFormat: 'JSON object with metrics framework'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'artifacts'],
      properties: {
        framework: { type: 'object' },
        awarenessMetrics: { type: 'array', items: { type: 'object' } },
        engagementMetrics: { type: 'array', items: { type: 'object' } },
        conversionMetrics: { type: 'array', items: { type: 'object' } },
        benchmarks: { type: 'object' },
        roiCalculation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'employer-branding', 'metrics']
}));

export const implementationRoadmapTask = defineTask('implementation-roadmap', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Implementation Roadmap - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Project Manager',
      task: 'Create employer branding implementation roadmap',
      context: {
        companyName: args.companyName,
        evp: args.evp,
        brandMessaging: args.brandMessaging,
        careersSiteStrategy: args.careersSiteStrategy,
        socialMediaStrategy: args.socialMediaStrategy,
        contentStrategy: args.contentStrategy,
        advocacyProgram: args.advocacyProgram,
        campaignPlan: args.campaignPlan,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define implementation phases',
        '2. Create detailed timeline',
        '3. Identify resource requirements',
        '4. Assign responsibilities',
        '5. Define dependencies',
        '6. Create risk mitigation plan',
        '7. Set milestone checkpoints',
        '8. Plan change management',
        '9. Define success criteria',
        '10. Create governance structure'
      ],
      outputFormat: 'JSON object with implementation roadmap'
    },
    outputSchema: {
      type: 'object',
      required: ['roadmap', 'artifacts'],
      properties: {
        roadmap: { type: 'object' },
        phases: { type: 'array', items: { type: 'object' } },
        timeline: { type: 'array', items: { type: 'object' } },
        resources: { type: 'object' },
        milestones: { type: 'array', items: { type: 'object' } },
        risks: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'employer-branding', 'implementation']
}));
