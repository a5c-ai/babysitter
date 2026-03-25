/**
 * @process marketing/campaign-creative-development
 * @description Brief creative teams, develop concepts, produce assets across formats, ensure brand consistency, and manage approval workflows.
 * @inputs { campaignName: string, creativeBrief: object, brandGuidelines: object, deliverables: array, stakeholders: array, timeline: object }
 * @outputs { success: boolean, creativeAssets: array, conceptDocuments: array, approvalStatus: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    campaignName = 'Campaign',
    creativeBrief = {},
    brandGuidelines = {},
    deliverables = [],
    stakeholders = [],
    timeline = {},
    outputDir = 'creative-development-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Campaign Creative Development for ${campaignName}`);

  // ============================================================================
  // PHASE 1: CREATIVE BRIEF ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing creative brief and requirements');
  const briefAnalysis = await ctx.task(creativeBriefAnalysisTask, {
    campaignName,
    creativeBrief,
    brandGuidelines,
    deliverables,
    outputDir
  });

  artifacts.push(...briefAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: CONCEPT DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Developing creative concepts');
  const conceptDevelopment = await ctx.task(conceptDevelopmentTask, {
    campaignName,
    briefAnalysis,
    creativeBrief,
    brandGuidelines,
    outputDir
  });

  artifacts.push(...conceptDevelopment.artifacts);

  // ============================================================================
  // PHASE 3: CONCEPT PRESENTATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Preparing concept presentation');
  const conceptPresentation = await ctx.task(conceptPresentationTask, {
    campaignName,
    conceptDevelopment,
    creativeBrief,
    stakeholders,
    outputDir
  });

  artifacts.push(...conceptPresentation.artifacts);

  // ============================================================================
  // PHASE 4: ASSET SPECIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Creating asset specifications');
  const assetSpecification = await ctx.task(assetSpecificationTask, {
    campaignName,
    conceptDevelopment,
    deliverables,
    brandGuidelines,
    outputDir
  });

  artifacts.push(...assetSpecification.artifacts);

  // ============================================================================
  // PHASE 5: COPYWRITING
  // ============================================================================

  ctx.log('info', 'Phase 5: Developing campaign copy');
  const copywriting = await ctx.task(copywritingTask, {
    campaignName,
    conceptDevelopment,
    creativeBrief,
    assetSpecification,
    brandGuidelines,
    outputDir
  });

  artifacts.push(...copywriting.artifacts);

  // ============================================================================
  // PHASE 6: VISUAL DESIGN DIRECTION
  // ============================================================================

  ctx.log('info', 'Phase 6: Establishing visual design direction');
  const visualDesign = await ctx.task(visualDesignDirectionTask, {
    campaignName,
    conceptDevelopment,
    assetSpecification,
    brandGuidelines,
    outputDir
  });

  artifacts.push(...visualDesign.artifacts);

  // ============================================================================
  // PHASE 7: PRODUCTION PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 7: Planning production workflow');
  const productionPlan = await ctx.task(productionPlanningTask, {
    campaignName,
    assetSpecification,
    copywriting,
    visualDesign,
    timeline,
    outputDir
  });

  artifacts.push(...productionPlan.artifacts);

  // ============================================================================
  // PHASE 8: BRAND COMPLIANCE CHECK
  // ============================================================================

  ctx.log('info', 'Phase 8: Verifying brand compliance');
  const brandCompliance = await ctx.task(brandComplianceCheckTask, {
    campaignName,
    conceptDevelopment,
    copywriting,
    visualDesign,
    brandGuidelines,
    outputDir
  });

  artifacts.push(...brandCompliance.artifacts);

  // ============================================================================
  // PHASE 9: APPROVAL WORKFLOW SETUP
  // ============================================================================

  ctx.log('info', 'Phase 9: Setting up approval workflow');
  const approvalWorkflow = await ctx.task(approvalWorkflowTask, {
    campaignName,
    assetSpecification,
    stakeholders,
    timeline,
    outputDir
  });

  artifacts.push(...approvalWorkflow.artifacts);

  // ============================================================================
  // PHASE 10: CREATIVE QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 10: Assessing creative development quality');
  const qualityAssessment = await ctx.task(creativeQualityAssessmentTask, {
    campaignName,
    briefAnalysis,
    conceptDevelopment,
    copywriting,
    visualDesign,
    brandCompliance,
    productionPlan,
    outputDir
  });

  artifacts.push(...qualityAssessment.artifacts);

  const creativeScore = qualityAssessment.overallScore;
  const qualityMet = creativeScore >= 80;

  // Breakpoint: Review creative development
  await ctx.breakpoint({
    question: `Creative development complete. Quality score: ${creativeScore}/100. ${qualityMet ? 'Creative meets quality standards!' : 'Creative may need refinement.'} Review and approve?`,
    title: 'Creative Development Review & Approval',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        creativeScore,
        qualityMet,
        campaignName,
        totalArtifacts: artifacts.length,
        conceptCount: conceptDevelopment.concepts?.length || 0,
        assetCount: assetSpecification.assets?.length || 0,
        brandComplianceScore: brandCompliance.score || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    campaignName,
    creativeScore,
    qualityMet,
    concepts: conceptDevelopment.concepts,
    selectedConcept: conceptDevelopment.recommendedConcept,
    creativeAssets: assetSpecification.assets,
    copyDocuments: copywriting.documents,
    visualDirection: visualDesign.direction,
    productionPlan: productionPlan.plan,
    brandCompliance: {
      score: brandCompliance.score,
      issues: brandCompliance.issues,
      approved: brandCompliance.approved
    },
    approvalStatus: {
      workflow: approvalWorkflow.workflow,
      stages: approvalWorkflow.stages,
      currentStage: approvalWorkflow.currentStage
    },
    conceptDocuments: conceptPresentation.documents,
    artifacts,
    duration,
    metadata: {
      processId: 'marketing/campaign-creative-development',
      timestamp: startTime,
      campaignName,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Creative Brief Analysis
export const creativeBriefAnalysisTask = defineTask('creative-brief-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze creative brief and requirements',
  agent: {
    name: 'creative-analyst',
    prompt: {
      role: 'senior creative strategist',
      task: 'Analyze creative brief to extract insights and establish creative direction',
      context: args,
      instructions: [
        'Review and interpret creative brief objectives',
        'Identify key audience insights and motivations',
        'Extract mandatory brand elements and constraints',
        'Analyze competitive creative landscape',
        'Identify creative opportunities and white space',
        'Define success criteria for creative',
        'Map deliverables to creative requirements',
        'Highlight potential creative challenges',
        'Generate brief analysis document'
      ],
      outputFormat: 'JSON with insights (array), opportunities (array), constraints (array), successCriteria (array), challenges (array), creativeDirection (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['insights', 'opportunities', 'constraints', 'artifacts'],
      properties: {
        insights: { type: 'array', items: { type: 'string' } },
        opportunities: { type: 'array', items: { type: 'string' } },
        constraints: { type: 'array', items: { type: 'string' } },
        successCriteria: { type: 'array', items: { type: 'string' } },
        challenges: { type: 'array', items: { type: 'string' } },
        creativeDirection: {
          type: 'object',
          properties: {
            tone: { type: 'string' },
            style: { type: 'string' },
            approach: { type: 'string' }
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
  labels: ['agent', 'creative-development', 'brief-analysis']
}));

// Task 2: Concept Development
export const conceptDevelopmentTask = defineTask('concept-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop creative concepts',
  agent: {
    name: 'creative-director',
    prompt: {
      role: 'creative director and ideation specialist',
      task: 'Develop multiple creative concepts that address brief objectives',
      context: args,
      instructions: [
        'Generate 3-5 distinct creative concepts',
        'Develop concept names and taglines',
        'Create concept descriptions and rationale',
        'Define visual and verbal approach for each concept',
        'Map concepts to brief objectives',
        'Identify concept strengths and risks',
        'Recommend lead concept with justification',
        'Plan concept extensions across channels',
        'Generate concept development document'
      ],
      outputFormat: 'JSON with concepts (array), recommendedConcept (object), conceptComparison (object), extensions (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['concepts', 'recommendedConcept', 'artifacts'],
      properties: {
        concepts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              tagline: { type: 'string' },
              description: { type: 'string' },
              rationale: { type: 'string' },
              visualApproach: { type: 'string' },
              verbalApproach: { type: 'string' },
              strengths: { type: 'array', items: { type: 'string' } },
              risks: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        recommendedConcept: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            justification: { type: 'string' }
          }
        },
        conceptComparison: { type: 'object' },
        extensions: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'creative-development', 'concept']
}));

// Task 3: Concept Presentation
export const conceptPresentationTask = defineTask('concept-presentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare concept presentation',
  agent: {
    name: 'presentation-designer',
    prompt: {
      role: 'creative presenter and storyteller',
      task: 'Prepare compelling concept presentation for stakeholder review',
      context: args,
      instructions: [
        'Create presentation narrative flow',
        'Design concept boards and visualizations',
        'Prepare concept comparison summary',
        'Develop talking points and rationale',
        'Create mood boards for each concept',
        'Prepare Q&A anticipation guide',
        'Design feedback capture mechanism',
        'Generate presentation materials',
        'Create concept documentation package'
      ],
      outputFormat: 'JSON with presentation (object), documents (array), moodBoards (array), talkingPoints (array), feedbackMechanism (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['presentation', 'documents', 'artifacts'],
      properties: {
        presentation: {
          type: 'object',
          properties: {
            structure: { type: 'array', items: { type: 'string' } },
            duration: { type: 'string' },
            format: { type: 'string' }
          }
        },
        documents: { type: 'array', items: { type: 'string' } },
        moodBoards: { type: 'array' },
        talkingPoints: { type: 'array', items: { type: 'string' } },
        feedbackMechanism: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'creative-development', 'presentation']
}));

// Task 4: Asset Specification
export const assetSpecificationTask = defineTask('asset-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create asset specifications',
  agent: {
    name: 'asset-manager',
    prompt: {
      role: 'creative production manager and asset specialist',
      task: 'Create detailed specifications for all campaign assets',
      context: args,
      instructions: [
        'Define all required assets by channel and format',
        'Specify dimensions, resolutions, and file formats',
        'Document aspect ratios and safe zones',
        'Define animation and video specifications',
        'Specify color modes and file requirements',
        'Create asset naming conventions',
        'Define version control approach',
        'Document localization requirements',
        'Generate asset specification matrix'
      ],
      outputFormat: 'JSON with assets (array), specifications (object), namingConvention (object), versionControl (object), localization (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['assets', 'specifications', 'artifacts'],
      properties: {
        assets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              channel: { type: 'string' },
              format: { type: 'string' },
              dimensions: { type: 'string' },
              fileType: { type: 'string' }
            }
          }
        },
        specifications: {
          type: 'object',
          properties: {
            digital: { type: 'object' },
            print: { type: 'object' },
            video: { type: 'object' },
            social: { type: 'object' }
          }
        },
        namingConvention: { type: 'object' },
        versionControl: { type: 'object' },
        localization: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'creative-development', 'asset-specs']
}));

// Task 5: Copywriting
export const copywritingTask = defineTask('copywriting', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop campaign copy',
  agent: {
    name: 'copywriter',
    prompt: {
      role: 'senior copywriter and brand voice specialist',
      task: 'Develop compelling copy for all campaign assets',
      context: args,
      instructions: [
        'Create headlines and taglines',
        'Develop body copy for different formats',
        'Write calls-to-action',
        'Create social media copy variations',
        'Develop email subject lines and copy',
        'Write video scripts and voiceover',
        'Create ad copy variations for testing',
        'Ensure brand voice consistency',
        'Generate copy document organized by asset'
      ],
      outputFormat: 'JSON with headlines (array), taglines (array), bodyCopy (object), ctas (array), socialCopy (object), emailCopy (object), scripts (array), documents (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['headlines', 'taglines', 'bodyCopy', 'ctas', 'artifacts'],
      properties: {
        headlines: { type: 'array', items: { type: 'string' } },
        taglines: { type: 'array', items: { type: 'string' } },
        bodyCopy: {
          type: 'object',
          properties: {
            short: { type: 'array', items: { type: 'string' } },
            medium: { type: 'array', items: { type: 'string' } },
            long: { type: 'array', items: { type: 'string' } }
          }
        },
        ctas: { type: 'array', items: { type: 'string' } },
        socialCopy: { type: 'object' },
        emailCopy: { type: 'object' },
        scripts: { type: 'array' },
        documents: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'creative-development', 'copywriting']
}));

// Task 6: Visual Design Direction
export const visualDesignDirectionTask = defineTask('visual-design-direction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish visual design direction',
  agent: {
    name: 'art-director',
    prompt: {
      role: 'art director and visual designer',
      task: 'Establish comprehensive visual design direction for campaign',
      context: args,
      instructions: [
        'Define visual style and aesthetic',
        'Create color palette usage guidelines',
        'Specify typography treatments',
        'Define photography and imagery style',
        'Create illustration guidelines if applicable',
        'Design layout principles and grid systems',
        'Define motion and animation style',
        'Create design templates for key assets',
        'Generate visual design direction document'
      ],
      outputFormat: 'JSON with direction (object), colorUsage (object), typography (object), imageryStyle (object), layoutPrinciples (object), motionStyle (object), templates (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['direction', 'colorUsage', 'typography', 'artifacts'],
      properties: {
        direction: {
          type: 'object',
          properties: {
            style: { type: 'string' },
            aesthetic: { type: 'string' },
            mood: { type: 'string' }
          }
        },
        colorUsage: {
          type: 'object',
          properties: {
            primary: { type: 'array' },
            accent: { type: 'array' },
            background: { type: 'array' }
          }
        },
        typography: {
          type: 'object',
          properties: {
            headlines: { type: 'object' },
            body: { type: 'object' },
            accent: { type: 'object' }
          }
        },
        imageryStyle: { type: 'object' },
        layoutPrinciples: { type: 'object' },
        motionStyle: { type: 'object' },
        templates: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'creative-development', 'visual-design']
}));

// Task 7: Production Planning
export const productionPlanningTask = defineTask('production-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan production workflow',
  agent: {
    name: 'production-manager',
    prompt: {
      role: 'creative production manager',
      task: 'Plan comprehensive production workflow for campaign assets',
      context: args,
      instructions: [
        'Define production phases and milestones',
        'Create asset production schedule',
        'Identify resource requirements',
        'Plan review and revision cycles',
        'Define quality checkpoints',
        'Plan vendor and partner coordination',
        'Create production risk mitigation plan',
        'Define asset delivery specifications',
        'Generate production plan document'
      ],
      outputFormat: 'JSON with plan (object), schedule (object), resources (array), reviewCycles (object), qualityCheckpoints (array), vendors (array), risks (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'schedule', 'resources', 'artifacts'],
      properties: {
        plan: {
          type: 'object',
          properties: {
            phases: { type: 'array' },
            milestones: { type: 'array' },
            duration: { type: 'string' }
          }
        },
        schedule: { type: 'object' },
        resources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              role: { type: 'string' },
              quantity: { type: 'number' },
              duration: { type: 'string' }
            }
          }
        },
        reviewCycles: { type: 'object' },
        qualityCheckpoints: { type: 'array', items: { type: 'string' } },
        vendors: { type: 'array' },
        risks: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'creative-development', 'production-planning']
}));

// Task 8: Brand Compliance Check
export const brandComplianceCheckTask = defineTask('brand-compliance-check', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify brand compliance',
  agent: {
    name: 'brand-compliance-officer',
    prompt: {
      role: 'brand guardian and compliance specialist',
      task: 'Verify all creative elements comply with brand guidelines',
      context: args,
      instructions: [
        'Review logo usage compliance',
        'Verify color palette adherence',
        'Check typography consistency',
        'Validate imagery style alignment',
        'Review tone of voice compliance',
        'Check messaging alignment',
        'Identify compliance issues',
        'Provide remediation recommendations',
        'Generate compliance report'
      ],
      outputFormat: 'JSON with score (number 0-100), approved (boolean), issues (array), recommendations (array), checklist (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'approved', 'issues', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        approved: { type: 'boolean' },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              element: { type: 'string' },
              issue: { type: 'string' },
              severity: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        checklist: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              item: { type: 'string' },
              status: { type: 'string' }
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
  labels: ['agent', 'creative-development', 'brand-compliance']
}));

// Task 9: Approval Workflow Setup
export const approvalWorkflowTask = defineTask('approval-workflow', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up approval workflow',
  agent: {
    name: 'workflow-manager',
    prompt: {
      role: 'creative operations manager',
      task: 'Set up comprehensive approval workflow for creative assets',
      context: args,
      instructions: [
        'Define approval stages and stakeholders',
        'Create approval routing rules',
        'Set approval deadlines and SLAs',
        'Define feedback consolidation process',
        'Create version management approach',
        'Set up change request process',
        'Define final sign-off requirements',
        'Create approval documentation',
        'Generate workflow configuration document'
      ],
      outputFormat: 'JSON with workflow (object), stages (array), stakeholders (array), slas (object), currentStage (string), feedbackProcess (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['workflow', 'stages', 'stakeholders', 'artifacts'],
      properties: {
        workflow: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            type: { type: 'string' },
            totalStages: { type: 'number' }
          }
        },
        stages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stage: { type: 'string' },
              approvers: { type: 'array', items: { type: 'string' } },
              sla: { type: 'string' }
            }
          }
        },
        stakeholders: { type: 'array' },
        slas: { type: 'object' },
        currentStage: { type: 'string' },
        feedbackProcess: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'creative-development', 'approval-workflow']
}));

// Task 10: Creative Quality Assessment
export const creativeQualityAssessmentTask = defineTask('creative-quality-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess creative development quality',
  agent: {
    name: 'creative-validator',
    prompt: {
      role: 'executive creative director',
      task: 'Assess overall creative development quality and readiness',
      context: args,
      instructions: [
        'Evaluate brief interpretation accuracy (weight: 15%)',
        'Assess concept strength and differentiation (weight: 20%)',
        'Review copy quality and effectiveness (weight: 15%)',
        'Evaluate visual design quality (weight: 15%)',
        'Assess brand compliance (weight: 15%)',
        'Review production plan feasibility (weight: 10%)',
        'Evaluate asset coverage completeness (weight: 10%)',
        'Calculate weighted overall score (0-100)',
        'Identify gaps and recommendations'
      ],
      outputFormat: 'JSON with overallScore (number 0-100), componentScores (object), gaps (array), recommendations (array), strengths (array), readinessLevel (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'recommendations', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            briefInterpretation: { type: 'number' },
            conceptStrength: { type: 'number' },
            copyQuality: { type: 'number' },
            visualDesign: { type: 'number' },
            brandCompliance: { type: 'number' },
            productionPlan: { type: 'number' },
            assetCoverage: { type: 'number' }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        strengths: { type: 'array', items: { type: 'string' } },
        readinessLevel: { type: 'string', enum: ['ready', 'minor-revisions', 'major-revisions'] },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'creative-development', 'quality-assessment']
}));
