/**
 * @process specializations/domains/business/decision-intelligence/data-visualization-standards
 * @description Data Visualization Standards Implementation - Establishment of organizational data visualization
 * standards, style guides, and best practices for consistent and effective visual communication.
 * @inputs { projectName: string, organizationContext: object, existingAssets?: array, targetAudiences: array, brandGuidelines?: object }
 * @outputs { success: boolean, visualizationStandards: object, styleGuide: object, chartLibrary: array, trainingMaterials: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/decision-intelligence/data-visualization-standards', {
 *   projectName: 'Enterprise Data Visualization Standards',
 *   organizationContext: { industry: 'Healthcare', tools: ['Tableau', 'Power BI'] },
 *   targetAudiences: ['Executives', 'Analysts', 'Operations'],
 *   brandGuidelines: { primaryColor: '#003366', fontFamily: 'Arial' }
 * });
 *
 * @references
 * - Storytelling with Data: https://www.storytellingwithdata.com/books
 * - Stephen Few Perceptual Edge: https://www.perceptualedge.com/library.php#Books
 * - Data Visualization Society: https://www.datavisualizationsociety.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    organizationContext = {},
    existingAssets = [],
    targetAudiences = [],
    brandGuidelines = {},
    outputDir = 'visualization-standards-output'
  } = inputs;

  // Phase 1: Current State Assessment
  const currentStateAssessment = await ctx.task(currentStateAssessmentTask, {
    projectName,
    organizationContext,
    existingAssets,
    targetAudiences
  });

  // Phase 2: Visualization Principles Definition
  const visualizationPrinciples = await ctx.task(principlesDefinitionTask, {
    projectName,
    currentStateAssessment,
    targetAudiences
  });

  // Phase 3: Color Palette and Typography
  const visualIdentity = await ctx.task(visualIdentityTask, {
    projectName,
    brandGuidelines,
    targetAudiences,
    visualizationPrinciples
  });

  // Phase 4: Chart Type Selection Guidelines
  const chartGuidelines = await ctx.task(chartGuidelinesTask, {
    projectName,
    targetAudiences,
    visualizationPrinciples,
    organizationContext
  });

  // Phase 5: Component Library Design
  const componentLibrary = await ctx.task(componentLibraryTask, {
    projectName,
    visualIdentity,
    chartGuidelines,
    organizationContext
  });

  // Breakpoint: Review visualization standards
  await ctx.breakpoint({
    question: `Review visualization standards for ${projectName}. Are they aligned with organizational needs?`,
    title: 'Visualization Standards Review',
    context: {
      runId: ctx.runId,
      projectName,
      principles: visualizationPrinciples.principles?.length || 0,
      chartTypes: chartGuidelines.chartTypes?.length || 0
    }
  });

  // Phase 6: Style Guide Documentation
  const styleGuide = await ctx.task(styleGuideTask, {
    projectName,
    visualizationPrinciples,
    visualIdentity,
    chartGuidelines,
    componentLibrary
  });

  // Phase 7: Training and Adoption Materials
  const trainingMaterials = await ctx.task(trainingMaterialsTask, {
    projectName,
    styleGuide,
    targetAudiences,
    organizationContext
  });

  // Phase 8: Governance and Compliance
  const governanceFramework = await ctx.task(visualizationGovernanceTask, {
    projectName,
    styleGuide,
    organizationContext
  });

  return {
    success: true,
    projectName,
    currentStateAssessment,
    visualizationStandards: {
      principles: visualizationPrinciples,
      visualIdentity,
      chartGuidelines
    },
    styleGuide,
    chartLibrary: componentLibrary.components,
    trainingMaterials,
    governanceFramework,
    metadata: {
      processId: 'specializations/domains/business/decision-intelligence/data-visualization-standards',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const currentStateAssessmentTask = defineTask('current-state-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Current State Assessment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Visualization Consultant',
      task: 'Assess current visualization practices and identify improvement areas',
      context: args,
      instructions: [
        '1. Audit existing dashboards and reports',
        '2. Evaluate current visualization quality',
        '3. Identify inconsistencies and anti-patterns',
        '4. Assess tool capabilities and limitations',
        '5. Survey stakeholder satisfaction',
        '6. Benchmark against industry best practices',
        '7. Identify quick wins and critical issues',
        '8. Prioritize improvement opportunities'
      ],
      outputFormat: 'JSON object with current state assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['auditFindings', 'issues', 'opportunities'],
      properties: {
        auditFindings: { type: 'array' },
        issues: { type: 'array' },
        opportunities: { type: 'array' },
        benchmarkComparison: { type: 'object' },
        priorities: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'visualization', 'assessment']
}));

export const principlesDefinitionTask = defineTask('principles-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Visualization Principles Definition - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Visualization Expert',
      task: 'Define core visualization principles and best practices',
      context: args,
      instructions: [
        '1. Define data-ink ratio guidelines',
        '2. Establish clarity and simplicity principles',
        '3. Define accuracy and honesty standards',
        '4. Create accessibility requirements',
        '5. Define audience-appropriate complexity levels',
        '6. Establish context and labeling standards',
        '7. Define interactivity guidelines',
        '8. Create mobile-first design principles'
      ],
      outputFormat: 'JSON object with visualization principles'
    },
    outputSchema: {
      type: 'object',
      required: ['principles', 'guidelines', 'antiPatterns'],
      properties: {
        principles: { type: 'array' },
        guidelines: { type: 'array' },
        antiPatterns: { type: 'array' },
        accessibilityStandards: { type: 'object' },
        audienceGuidelines: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'visualization', 'principles']
}));

export const visualIdentityTask = defineTask('visual-identity', (args, taskCtx) => ({
  kind: 'agent',
  title: `Color Palette and Typography - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Visual Design Specialist',
      task: 'Define color palettes and typography standards for data visualization',
      context: args,
      instructions: [
        '1. Create primary and secondary color palettes',
        '2. Define sequential and diverging color scales',
        '3. Create categorical color schemes',
        '4. Ensure colorblind-friendly alternatives',
        '5. Define typography hierarchy',
        '6. Create font pairing guidelines',
        '7. Define sizing and spacing standards',
        '8. Document color meaning and usage rules'
      ],
      outputFormat: 'JSON object with visual identity standards'
    },
    outputSchema: {
      type: 'object',
      required: ['colorPalette', 'typography', 'colorScales'],
      properties: {
        colorPalette: { type: 'object' },
        typography: { type: 'object' },
        colorScales: { type: 'array' },
        accessibility: { type: 'object' },
        usageRules: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'visualization', 'design']
}));

export const chartGuidelinesTask = defineTask('chart-guidelines', (args, taskCtx) => ({
  kind: 'agent',
  title: `Chart Type Selection Guidelines - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Chart Design Expert',
      task: 'Create comprehensive chart selection and design guidelines',
      context: args,
      instructions: [
        '1. Define chart type selection criteria',
        '2. Create decision tree for chart selection',
        '3. Document best practices for each chart type',
        '4. Define anti-patterns and common mistakes',
        '5. Create chart configuration standards',
        '6. Define axis and label guidelines',
        '7. Document interactive feature standards',
        '8. Create example gallery with annotations'
      ],
      outputFormat: 'JSON object with chart guidelines'
    },
    outputSchema: {
      type: 'object',
      required: ['chartTypes', 'selectionCriteria', 'bestPractices'],
      properties: {
        chartTypes: { type: 'array' },
        selectionCriteria: { type: 'object' },
        decisionTree: { type: 'object' },
        bestPractices: { type: 'array' },
        antiPatterns: { type: 'array' },
        examples: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'visualization', 'charts']
}));

export const componentLibraryTask = defineTask('component-library', (args, taskCtx) => ({
  kind: 'agent',
  title: `Component Library Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Visualization Component Designer',
      task: 'Design reusable visualization component library',
      context: args,
      instructions: [
        '1. Define component architecture and patterns',
        '2. Create standard chart templates',
        '3. Design KPI card and scorecard components',
        '4. Create table and grid components',
        '5. Design filter and control components',
        '6. Create layout and container templates',
        '7. Define responsive behavior specifications',
        '8. Document component usage guidelines'
      ],
      outputFormat: 'JSON object with component library'
    },
    outputSchema: {
      type: 'object',
      required: ['components', 'templates', 'patterns'],
      properties: {
        components: { type: 'array' },
        templates: { type: 'array' },
        patterns: { type: 'array' },
        responsiveSpecs: { type: 'object' },
        usageGuidelines: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'visualization', 'components']
}));

export const styleGuideTask = defineTask('style-guide', (args, taskCtx) => ({
  kind: 'agent',
  title: `Style Guide Documentation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Writer and Design Documentation Specialist',
      task: 'Create comprehensive visualization style guide documentation',
      context: args,
      instructions: [
        '1. Structure style guide for easy reference',
        '2. Document all visual identity standards',
        '3. Include chart type guidelines with examples',
        '4. Create do/don\'t comparison examples',
        '5. Document accessibility requirements',
        '6. Include tool-specific implementation guides',
        '7. Create quick reference cards',
        '8. Design searchable online format'
      ],
      outputFormat: 'JSON object with style guide structure'
    },
    outputSchema: {
      type: 'object',
      required: ['sections', 'examples', 'quickReference'],
      properties: {
        sections: { type: 'array' },
        examples: { type: 'array' },
        dosDonts: { type: 'array' },
        quickReference: { type: 'object' },
        toolGuides: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'visualization', 'documentation']
}));

export const trainingMaterialsTask = defineTask('training-materials', (args, taskCtx) => ({
  kind: 'agent',
  title: `Training and Adoption Materials - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Visualization Training Specialist',
      task: 'Develop training materials for visualization standards adoption',
      context: args,
      instructions: [
        '1. Design role-based training curriculum',
        '2. Create hands-on workshop materials',
        '3. Develop self-paced learning modules',
        '4. Create before/after makeover examples',
        '5. Design certification assessments',
        '6. Create cheat sheets and quick guides',
        '7. Develop coaching and mentoring framework',
        '8. Plan community of practice initiatives'
      ],
      outputFormat: 'JSON object with training materials'
    },
    outputSchema: {
      type: 'object',
      required: ['curriculum', 'workshops', 'resources'],
      properties: {
        curriculum: { type: 'array' },
        workshops: { type: 'array' },
        modules: { type: 'array' },
        examples: { type: 'array' },
        assessments: { type: 'array' },
        resources: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'visualization', 'training']
}));

export const visualizationGovernanceTask = defineTask('visualization-governance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Governance and Compliance - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Visualization Governance Specialist',
      task: 'Define governance framework for visualization standards',
      context: args,
      instructions: [
        '1. Define standards compliance review process',
        '2. Create quality assurance checklist',
        '3. Design feedback and exception process',
        '4. Plan standards maintenance and updates',
        '5. Define roles and responsibilities',
        '6. Create compliance monitoring metrics',
        '7. Plan annual review and refresh cycle',
        '8. Design enforcement and incentive mechanisms'
      ],
      outputFormat: 'JSON object with governance framework'
    },
    outputSchema: {
      type: 'object',
      required: ['processes', 'roles', 'metrics'],
      properties: {
        processes: { type: 'array' },
        checklists: { type: 'array' },
        roles: { type: 'object' },
        metrics: { type: 'array' },
        reviewCycle: { type: 'object' },
        enforcement: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'visualization', 'governance']
}));
