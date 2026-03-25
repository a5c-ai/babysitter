/**
 * @process marketing/brand-architecture-design
 * @description Structure the relationship between corporate brand, sub-brands, and product brands. Define naming conventions, visual hierarchy, and brand portfolio strategy.
 * @inputs { corporateBrand: string, existingBrands: array, businessStrategy: object, targetMarkets: array, growthPlans: object }
 * @outputs { success: boolean, brandArchitecture: object, namingConventions: object, visualHierarchy: object, portfolioStrategy: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    corporateBrand = 'Corporate',
    existingBrands = [],
    businessStrategy = {},
    targetMarkets = [],
    growthPlans = {},
    outputDir = 'brand-architecture-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Brand Architecture Design for ${corporateBrand}`);

  // ============================================================================
  // PHASE 1: BRAND PORTFOLIO AUDIT
  // ============================================================================

  ctx.log('info', 'Phase 1: Auditing existing brand portfolio');
  const portfolioAudit = await ctx.task(brandPortfolioAuditTask, {
    corporateBrand,
    existingBrands,
    businessStrategy,
    outputDir
  });

  artifacts.push(...portfolioAudit.artifacts);

  // ============================================================================
  // PHASE 2: ARCHITECTURE MODEL SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 2: Selecting brand architecture model');
  const architectureModel = await ctx.task(architectureModelSelectionTask, {
    corporateBrand,
    existingBrands,
    portfolioAudit,
    businessStrategy,
    targetMarkets,
    outputDir
  });

  artifacts.push(...architectureModel.artifacts);

  // ============================================================================
  // PHASE 3: BRAND HIERARCHY DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 3: Designing brand hierarchy structure');
  const brandHierarchy = await ctx.task(brandHierarchyDesignTask, {
    corporateBrand,
    existingBrands,
    architectureModel,
    portfolioAudit,
    outputDir
  });

  artifacts.push(...brandHierarchy.artifacts);

  // ============================================================================
  // PHASE 4: NAMING CONVENTIONS DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Developing naming conventions');
  const namingConventions = await ctx.task(namingConventionsTask, {
    corporateBrand,
    brandHierarchy,
    architectureModel,
    growthPlans,
    outputDir
  });

  artifacts.push(...namingConventions.artifacts);

  // ============================================================================
  // PHASE 5: VISUAL HIERARCHY SYSTEM
  // ============================================================================

  ctx.log('info', 'Phase 5: Designing visual hierarchy system');
  const visualHierarchy = await ctx.task(visualHierarchySystemTask, {
    corporateBrand,
    brandHierarchy,
    architectureModel,
    namingConventions,
    outputDir
  });

  artifacts.push(...visualHierarchy.artifacts);

  // ============================================================================
  // PHASE 6: PORTFOLIO STRATEGY DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 6: Developing portfolio strategy');
  const portfolioStrategy = await ctx.task(portfolioStrategyTask, {
    corporateBrand,
    brandHierarchy,
    architectureModel,
    businessStrategy,
    growthPlans,
    targetMarkets,
    outputDir
  });

  artifacts.push(...portfolioStrategy.artifacts);

  // ============================================================================
  // PHASE 7: GOVERNANCE FRAMEWORK
  // ============================================================================

  ctx.log('info', 'Phase 7: Creating brand governance framework');
  const governanceFramework = await ctx.task(brandGovernanceFrameworkTask, {
    corporateBrand,
    brandHierarchy,
    namingConventions,
    visualHierarchy,
    portfolioStrategy,
    outputDir
  });

  artifacts.push(...governanceFramework.artifacts);

  // ============================================================================
  // PHASE 8: ARCHITECTURE QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 8: Assessing architecture quality');
  const qualityAssessment = await ctx.task(architectureQualityAssessmentTask, {
    corporateBrand,
    portfolioAudit,
    architectureModel,
    brandHierarchy,
    namingConventions,
    visualHierarchy,
    portfolioStrategy,
    governanceFramework,
    outputDir
  });

  artifacts.push(...qualityAssessment.artifacts);

  const architectureScore = qualityAssessment.overallScore;
  const qualityMet = architectureScore >= 80;

  // Breakpoint: Review brand architecture
  await ctx.breakpoint({
    question: `Brand architecture complete. Quality score: ${architectureScore}/100. ${qualityMet ? 'Architecture meets quality standards!' : 'Architecture may need refinement.'} Review and approve?`,
    title: 'Brand Architecture Review & Approval',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        architectureScore,
        qualityMet,
        corporateBrand,
        totalArtifacts: artifacts.length,
        architectureModel: architectureModel.selectedModel || 'N/A',
        brandCount: brandHierarchy.totalBrands || 0,
        hierarchyLevels: brandHierarchy.levels?.length || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    corporateBrand,
    architectureScore,
    qualityMet,
    brandArchitecture: {
      model: architectureModel.selectedModel,
      rationale: architectureModel.rationale,
      hierarchy: brandHierarchy.structure
    },
    namingConventions: {
      principles: namingConventions.principles,
      patterns: namingConventions.patterns,
      guidelines: namingConventions.guidelines
    },
    visualHierarchy: {
      system: visualHierarchy.system,
      lockups: visualHierarchy.lockups,
      rules: visualHierarchy.rules
    },
    portfolioStrategy: {
      strategy: portfolioStrategy.strategy,
      roles: portfolioStrategy.brandRoles,
      recommendations: portfolioStrategy.recommendations
    },
    governanceFramework: {
      decisionMatrix: governanceFramework.decisionMatrix,
      approvalProcess: governanceFramework.approvalProcess,
      policies: governanceFramework.policies
    },
    artifacts,
    duration,
    metadata: {
      processId: 'marketing/brand-architecture-design',
      timestamp: startTime,
      corporateBrand,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Brand Portfolio Audit
export const brandPortfolioAuditTask = defineTask('brand-portfolio-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Audit existing brand portfolio',
  agent: {
    name: 'portfolio-auditor',
    prompt: {
      role: 'brand portfolio strategist and auditor',
      task: 'Conduct comprehensive audit of existing brand portfolio to understand current state and identify optimization opportunities',
      context: args,
      instructions: [
        'Inventory all existing brands, sub-brands, and product brands',
        'Document current brand relationships and hierarchy',
        'Assess brand equity and performance for each brand',
        'Identify brand overlaps and cannibalization risks',
        'Analyze brand consistency and coherence across portfolio',
        'Identify gaps in portfolio coverage',
        'Document brand assets and investments',
        'Assess customer perception and awareness levels',
        'Generate portfolio audit report with recommendations'
      ],
      outputFormat: 'JSON with brandInventory (array), currentHierarchy (object), equityAssessment (array), overlaps (array), gaps (array), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['brandInventory', 'currentHierarchy', 'artifacts'],
      properties: {
        brandInventory: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              equity: { type: 'string' },
              performance: { type: 'string' }
            }
          }
        },
        currentHierarchy: { type: 'object' },
        equityAssessment: { type: 'array' },
        overlaps: { type: 'array', items: { type: 'string' } },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'brand-architecture', 'portfolio-audit']
}));

// Task 2: Architecture Model Selection
export const architectureModelSelectionTask = defineTask('architecture-model-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select brand architecture model',
  agent: {
    name: 'architecture-strategist',
    prompt: {
      role: 'brand architecture expert',
      task: 'Evaluate and select the optimal brand architecture model for the organization',
      context: args,
      instructions: [
        'Evaluate Branded House model (e.g., Google, FedEx, Virgin)',
        'Evaluate House of Brands model (e.g., P&G, Unilever)',
        'Evaluate Endorsed Brands model (e.g., Marriott, Nestle)',
        'Evaluate Hybrid/Sub-brands model (e.g., Apple, Microsoft)',
        'Assess fit with business strategy and growth plans',
        'Consider target market preferences and expectations',
        'Analyze resource implications of each model',
        'Evaluate flexibility for future brand extensions',
        'Select optimal model with detailed rationale',
        'Generate architecture model recommendation document'
      ],
      outputFormat: 'JSON with selectedModel (string), modelEvaluation (array), rationale (string), strategicFit (object), resourceImplications (object), flexibilityAssessment (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedModel', 'modelEvaluation', 'rationale', 'artifacts'],
      properties: {
        selectedModel: { type: 'string', enum: ['branded-house', 'house-of-brands', 'endorsed-brands', 'hybrid'] },
        modelEvaluation: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              model: { type: 'string' },
              pros: { type: 'array', items: { type: 'string' } },
              cons: { type: 'array', items: { type: 'string' } },
              score: { type: 'number' }
            }
          }
        },
        rationale: { type: 'string' },
        strategicFit: {
          type: 'object',
          properties: {
            alignment: { type: 'string' },
            enablesGrowth: { type: 'boolean' },
            marketFit: { type: 'string' }
          }
        },
        resourceImplications: {
          type: 'object',
          properties: {
            investment: { type: 'string' },
            complexity: { type: 'string' },
            maintenance: { type: 'string' }
          }
        },
        flexibilityAssessment: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'brand-architecture', 'model-selection']
}));

// Task 3: Brand Hierarchy Design
export const brandHierarchyDesignTask = defineTask('brand-hierarchy-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design brand hierarchy structure',
  agent: {
    name: 'hierarchy-designer',
    prompt: {
      role: 'brand strategist and information architect',
      task: 'Design the detailed brand hierarchy structure based on selected architecture model',
      context: args,
      instructions: [
        'Define hierarchy levels (corporate, division, product, variant)',
        'Map existing brands to appropriate levels',
        'Design brand relationships and connections',
        'Define master brand role and scope',
        'Identify sub-brand and product brand roles',
        'Design endorsement relationships where applicable',
        'Create visual hierarchy map/diagram',
        'Document brand migration paths for existing brands',
        'Generate brand hierarchy documentation'
      ],
      outputFormat: 'JSON with structure (object), levels (array), totalBrands (number), masterBrand (object), subBrands (array), relationshipMap (object), migrationPaths (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['structure', 'levels', 'totalBrands', 'artifacts'],
      properties: {
        structure: { type: 'object' },
        levels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              level: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              brands: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        totalBrands: { type: 'number' },
        masterBrand: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            role: { type: 'string' },
            scope: { type: 'string' }
          }
        },
        subBrands: { type: 'array' },
        relationshipMap: { type: 'object' },
        migrationPaths: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'brand-architecture', 'hierarchy-design']
}));

// Task 4: Naming Conventions Development
export const namingConventionsTask = defineTask('naming-conventions', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop naming conventions',
  agent: {
    name: 'naming-strategist',
    prompt: {
      role: 'brand naming expert and linguist',
      task: 'Develop comprehensive naming conventions and guidelines for the brand portfolio',
      context: args,
      instructions: [
        'Define naming principles aligned with brand architecture',
        'Create naming patterns for each hierarchy level',
        'Establish naming rules for new brands and extensions',
        'Define descriptor and modifier conventions',
        'Create guidelines for alphanumeric naming',
        'Establish trademark and legal considerations',
        'Define naming approval process',
        'Create naming evaluation criteria',
        'Document naming do\'s and don\'ts',
        'Generate naming conventions guide'
      ],
      outputFormat: 'JSON with principles (array), patterns (array), guidelines (object), evaluationCriteria (array), approvalProcess (object), legalConsiderations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['principles', 'patterns', 'guidelines', 'artifacts'],
      properties: {
        principles: { type: 'array', items: { type: 'string' } },
        patterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              level: { type: 'string' },
              pattern: { type: 'string' },
              examples: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        guidelines: {
          type: 'object',
          properties: {
            do: { type: 'array', items: { type: 'string' } },
            dont: { type: 'array', items: { type: 'string' } },
            considerations: { type: 'array', items: { type: 'string' } }
          }
        },
        evaluationCriteria: { type: 'array', items: { type: 'string' } },
        approvalProcess: { type: 'object' },
        legalConsiderations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'brand-architecture', 'naming-conventions']
}));

// Task 5: Visual Hierarchy System
export const visualHierarchySystemTask = defineTask('visual-hierarchy-system', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design visual hierarchy system',
  agent: {
    name: 'visual-strategist',
    prompt: {
      role: 'brand identity designer and visual strategist',
      task: 'Design the visual hierarchy system that expresses brand architecture relationships',
      context: args,
      instructions: [
        'Define visual relationship between master brand and sub-brands',
        'Create logo lockup system for different scenarios',
        'Establish size and placement hierarchy rules',
        'Define color relationships across portfolio',
        'Create typography hierarchy system',
        'Design endorsement lockup variations',
        'Establish co-branding guidelines',
        'Define minimum size and clear space rules',
        'Create visual hierarchy decision tree',
        'Generate visual hierarchy guidelines document'
      ],
      outputFormat: 'JSON with system (object), lockups (array), rules (object), colorRelationships (object), typographyHierarchy (object), coBrandingGuidelines (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['system', 'lockups', 'rules', 'artifacts'],
      properties: {
        system: {
          type: 'object',
          properties: {
            description: { type: 'string' },
            levels: { type: 'array' },
            relationships: { type: 'array' }
          }
        },
        lockups: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              useCase: { type: 'string' },
              components: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        rules: {
          type: 'object',
          properties: {
            sizing: { type: 'object' },
            placement: { type: 'object' },
            clearSpace: { type: 'object' }
          }
        },
        colorRelationships: { type: 'object' },
        typographyHierarchy: { type: 'object' },
        coBrandingGuidelines: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'brand-architecture', 'visual-hierarchy']
}));

// Task 6: Portfolio Strategy Development
export const portfolioStrategyTask = defineTask('portfolio-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop portfolio strategy',
  agent: {
    name: 'portfolio-strategist',
    prompt: {
      role: 'brand portfolio manager and strategist',
      task: 'Develop strategic brand portfolio management approach aligned with business objectives',
      context: args,
      instructions: [
        'Define strategic role for each brand in portfolio',
        'Identify flagship, cash cow, and growth brands',
        'Develop brand extension strategy',
        'Create brand rationalization recommendations',
        'Define resource allocation across portfolio',
        'Plan new brand introduction strategy',
        'Develop brand retirement/sunset guidelines',
        'Create portfolio performance metrics',
        'Define portfolio optimization roadmap',
        'Generate portfolio strategy document'
      ],
      outputFormat: 'JSON with strategy (object), brandRoles (array), extensionStrategy (object), rationalization (array), resourceAllocation (object), recommendations (array), roadmap (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'brandRoles', 'recommendations', 'artifacts'],
      properties: {
        strategy: {
          type: 'object',
          properties: {
            vision: { type: 'string' },
            objectives: { type: 'array', items: { type: 'string' } },
            principles: { type: 'array', items: { type: 'string' } }
          }
        },
        brandRoles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              brand: { type: 'string' },
              role: { type: 'string' },
              priority: { type: 'string' }
            }
          }
        },
        extensionStrategy: {
          type: 'object',
          properties: {
            criteria: { type: 'array', items: { type: 'string' } },
            opportunities: { type: 'array' }
          }
        },
        rationalization: { type: 'array' },
        resourceAllocation: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } },
        roadmap: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'brand-architecture', 'portfolio-strategy']
}));

// Task 7: Brand Governance Framework
export const brandGovernanceFrameworkTask = defineTask('brand-governance-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create brand governance framework',
  agent: {
    name: 'governance-specialist',
    prompt: {
      role: 'brand governance and compliance expert',
      task: 'Create comprehensive brand governance framework to ensure consistent architecture implementation',
      context: args,
      instructions: [
        'Define brand decision-making matrix (RACI)',
        'Create approval workflows for brand changes',
        'Establish brand compliance policies',
        'Define brand audit procedures',
        'Create exception handling process',
        'Establish brand training requirements',
        'Define brand asset management protocols',
        'Create brand crisis management guidelines',
        'Establish measurement and reporting framework',
        'Generate brand governance documentation'
      ],
      outputFormat: 'JSON with decisionMatrix (object), approvalProcess (object), policies (array), auditProcedures (object), exceptionProcess (object), trainingRequirements (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['decisionMatrix', 'approvalProcess', 'policies', 'artifacts'],
      properties: {
        decisionMatrix: {
          type: 'object',
          properties: {
            roles: { type: 'array' },
            decisions: { type: 'array' },
            matrix: { type: 'object' }
          }
        },
        approvalProcess: {
          type: 'object',
          properties: {
            levels: { type: 'array' },
            workflows: { type: 'array' },
            timelines: { type: 'object' }
          }
        },
        policies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              policy: { type: 'string' },
              description: { type: 'string' },
              enforcement: { type: 'string' }
            }
          }
        },
        auditProcedures: { type: 'object' },
        exceptionProcess: { type: 'object' },
        trainingRequirements: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'brand-architecture', 'governance']
}));

// Task 8: Architecture Quality Assessment
export const architectureQualityAssessmentTask = defineTask('architecture-quality-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess architecture quality',
  agent: {
    name: 'architecture-validator',
    prompt: {
      role: 'chief brand officer and architecture expert',
      task: 'Assess overall brand architecture quality, completeness, and readiness for implementation',
      context: args,
      instructions: [
        'Evaluate portfolio audit completeness (weight: 10%)',
        'Assess architecture model fit (weight: 20%)',
        'Review hierarchy design clarity (weight: 20%)',
        'Evaluate naming conventions comprehensiveness (weight: 15%)',
        'Assess visual hierarchy effectiveness (weight: 15%)',
        'Review portfolio strategy alignment (weight: 15%)',
        'Evaluate governance framework robustness (weight: 5%)',
        'Calculate weighted overall score (0-100)',
        'Identify gaps and areas for improvement',
        'Provide specific recommendations',
        'Assess implementation readiness'
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
            portfolioAudit: { type: 'number' },
            architectureModel: { type: 'number' },
            hierarchyDesign: { type: 'number' },
            namingConventions: { type: 'number' },
            visualHierarchy: { type: 'number' },
            portfolioStrategy: { type: 'number' },
            governance: { type: 'number' }
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
  labels: ['agent', 'brand-architecture', 'quality-assessment']
}));
