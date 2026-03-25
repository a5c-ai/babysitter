/**
 * @process domains/business/knowledge-management/expertise-profiling
 * @description Develop comprehensive expertise profiles for employees including skills, experience, interests, and knowledge domains
 * @specialization Knowledge Management
 * @category Expertise Location and Mapping
 * @inputs { employeeScope: object, profileFramework: object, dataSources: array, outputDir: string }
 * @outputs { success: boolean, expertiseProfiles: array, skillsInventory: object, expertiseMap: object, qualityScore: number, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    employeeScope = {},
    profileFramework = {},
    dataSources = [],
    competencyModel = {},
    assessmentMethods = ['self-assessment', 'peer-validation', 'credential-review'],
    outputDir = 'expertise-profiling-output',
    requireApproval = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Expertise Profiling and Skills Assessment Process');

  // Phase 1: Framework Design
  ctx.log('info', 'Phase 1: Designing expertise profiling framework');
  const frameworkDesign = await ctx.task(frameworkDesignTask, { profileFramework, competencyModel, outputDir });
  artifacts.push(...frameworkDesign.artifacts);

  await ctx.breakpoint({
    question: `Expertise framework designed with ${frameworkDesign.dimensions.length} dimensions. Review?`,
    title: 'Framework Design Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })), summary: { dimensions: frameworkDesign.dimensions.length } }
  });

  // Phase 2: Assessment Instrument Development
  ctx.log('info', 'Phase 2: Developing assessment instruments');
  const assessmentInstruments = await ctx.task(assessmentInstrumentsTask, { frameworkDesign: frameworkDesign.framework, assessmentMethods, outputDir });
  artifacts.push(...assessmentInstruments.artifacts);

  // Phase 3: Data Collection Design
  ctx.log('info', 'Phase 3: Designing data collection approach');
  const dataCollectionDesign = await ctx.task(dataCollectionDesignTask, { assessmentInstruments, dataSources, employeeScope, outputDir });
  artifacts.push(...dataCollectionDesign.artifacts);

  // Phase 4: Self-Assessment Process
  ctx.log('info', 'Phase 4: Designing self-assessment process');
  const selfAssessmentDesign = await ctx.task(selfAssessmentDesignTask, { frameworkDesign: frameworkDesign.framework, outputDir });
  artifacts.push(...selfAssessmentDesign.artifacts);

  // Phase 5: Validation Process Design
  ctx.log('info', 'Phase 5: Designing validation process');
  const validationDesign = await ctx.task(validationDesignTask, { frameworkDesign: frameworkDesign.framework, assessmentMethods, outputDir });
  artifacts.push(...validationDesign.artifacts);

  // Phase 6: Profile Template Development
  ctx.log('info', 'Phase 6: Developing profile templates');
  const profileTemplates = await ctx.task(profileTemplatesTask, { frameworkDesign: frameworkDesign.framework, outputDir });
  artifacts.push(...profileTemplates.artifacts);

  // Phase 7: Skills Taxonomy Development
  ctx.log('info', 'Phase 7: Developing skills taxonomy');
  const skillsTaxonomy = await ctx.task(skillsTaxonomyTask, { frameworkDesign: frameworkDesign.framework, competencyModel, outputDir });
  artifacts.push(...skillsTaxonomy.artifacts);

  // Phase 8: Expertise Map Design
  ctx.log('info', 'Phase 8: Designing expertise visualization');
  const expertiseMapDesign = await ctx.task(expertiseMapDesignTask, { frameworkDesign: frameworkDesign.framework, skillsTaxonomy, outputDir });
  artifacts.push(...expertiseMapDesign.artifacts);

  // Phase 9: Quality Assessment
  ctx.log('info', 'Phase 9: Assessing profiling system quality');
  const qualityAssessment = await ctx.task(qualityAssessmentTask, { frameworkDesign, assessmentInstruments, profileTemplates, outputDir });
  artifacts.push(...qualityAssessment.artifacts);

  // Phase 10: Stakeholder Review
  let reviewResult = null;
  if (requireApproval) {
    ctx.log('info', 'Phase 10: Conducting stakeholder review');
    reviewResult = await ctx.task(stakeholderReviewTask, { profilingSystem: frameworkDesign.framework, assessmentInstruments: assessmentInstruments.instruments, qualityScore: qualityAssessment.overallScore, outputDir });
    artifacts.push(...reviewResult.artifacts);
  }

  const endTime = ctx.now();
  return {
    success: true,
    profilingFramework: frameworkDesign.framework,
    assessmentInstruments: assessmentInstruments.instruments,
    profileTemplates: profileTemplates.templates,
    skillsTaxonomy: skillsTaxonomy.taxonomy,
    expertiseMapDesign: expertiseMapDesign.design,
    validationProcess: validationDesign.process,
    statistics: { dimensionsDefined: frameworkDesign.dimensions.length, instrumentsCreated: assessmentInstruments.instruments.length },
    qualityScore: qualityAssessment.overallScore,
    approved: reviewResult ? reviewResult.approved : true,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'domains/business/knowledge-management/expertise-profiling', timestamp: startTime, outputDir }
  };
}

// Task Definitions
export const frameworkDesignTask = defineTask('framework-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design expertise framework',
  agent: {
    name: 'framework-designer',
    prompt: { role: 'expertise framework designer', task: 'Design expertise profiling framework', context: args, instructions: ['Define expertise dimensions', 'Create proficiency levels', 'Save to output directory'], outputFormat: 'JSON with framework (object), dimensions (array), artifacts' },
    outputSchema: { type: 'object', required: ['framework', 'dimensions', 'artifacts'], properties: { framework: { type: 'object' }, dimensions: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'expertise', 'framework']
}));

export const assessmentInstrumentsTask = defineTask('assessment-instruments', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop assessment instruments',
  agent: {
    name: 'assessment-developer',
    prompt: { role: 'assessment instrument developer', task: 'Develop expertise assessment instruments', context: args, instructions: ['Create assessment questionnaires', 'Design skill verification methods', 'Save to output directory'], outputFormat: 'JSON with instruments (array), artifacts' },
    outputSchema: { type: 'object', required: ['instruments', 'artifacts'], properties: { instruments: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'assessment', 'instruments']
}));

export const dataCollectionDesignTask = defineTask('data-collection-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design data collection',
  agent: {
    name: 'data-collection-designer',
    prompt: { role: 'data collection designer', task: 'Design data collection approach', context: args, instructions: ['Define data sources', 'Plan collection workflow', 'Save to output directory'], outputFormat: 'JSON with design (object), artifacts' },
    outputSchema: { type: 'object', required: ['design', 'artifacts'], properties: { design: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'data-collection', 'design']
}));

export const selfAssessmentDesignTask = defineTask('self-assessment-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design self-assessment process',
  agent: {
    name: 'self-assessment-designer',
    prompt: { role: 'self-assessment designer', task: 'Design self-assessment process', context: args, instructions: ['Create self-rating scales', 'Design guidance for accuracy', 'Save to output directory'], outputFormat: 'JSON with design (object), artifacts' },
    outputSchema: { type: 'object', required: ['design', 'artifacts'], properties: { design: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'self-assessment', 'design']
}));

export const validationDesignTask = defineTask('validation-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design validation process',
  agent: {
    name: 'validation-designer',
    prompt: { role: 'validation process designer', task: 'Design expertise validation process', context: args, instructions: ['Define peer validation approach', 'Create verification methods', 'Save to output directory'], outputFormat: 'JSON with process (object), artifacts' },
    outputSchema: { type: 'object', required: ['process', 'artifacts'], properties: { process: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'validation', 'design']
}));

export const profileTemplatesTask = defineTask('profile-templates', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop profile templates',
  agent: {
    name: 'template-developer',
    prompt: { role: 'profile template developer', task: 'Develop expertise profile templates', context: args, instructions: ['Create standard profile format', 'Include all dimensions', 'Save to output directory'], outputFormat: 'JSON with templates (array), artifacts' },
    outputSchema: { type: 'object', required: ['templates', 'artifacts'], properties: { templates: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'profile', 'templates']
}));

export const skillsTaxonomyTask = defineTask('skills-taxonomy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop skills taxonomy',
  agent: {
    name: 'taxonomy-developer',
    prompt: { role: 'skills taxonomy developer', task: 'Develop skills taxonomy', context: args, instructions: ['Create skill hierarchy', 'Define skill relationships', 'Save to output directory'], outputFormat: 'JSON with taxonomy (object), artifacts' },
    outputSchema: { type: 'object', required: ['taxonomy', 'artifacts'], properties: { taxonomy: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'skills', 'taxonomy']
}));

export const expertiseMapDesignTask = defineTask('expertise-map-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design expertise visualization',
  agent: {
    name: 'map-designer',
    prompt: { role: 'expertise map designer', task: 'Design expertise visualization', context: args, instructions: ['Create visual representation approach', 'Design navigation and filtering', 'Save to output directory'], outputFormat: 'JSON with design (object), artifacts' },
    outputSchema: { type: 'object', required: ['design', 'artifacts'], properties: { design: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'expertise', 'visualization']
}));

export const qualityAssessmentTask = defineTask('quality-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess profiling system quality',
  agent: {
    name: 'quality-assessor',
    prompt: { role: 'quality assessor', task: 'Assess profiling system quality', context: args, instructions: ['Evaluate completeness', 'Save to output directory'], outputFormat: 'JSON with overallScore (number 0-100), artifacts' },
    outputSchema: { type: 'object', required: ['overallScore', 'artifacts'], properties: { overallScore: { type: 'number', minimum: 0, maximum: 100 }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'quality', 'assessment']
}));

export const stakeholderReviewTask = defineTask('stakeholder-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct stakeholder review',
  agent: {
    name: 'project-manager',
    prompt: { role: 'project manager', task: 'Coordinate stakeholder review', context: args, instructions: ['Present for approval', 'Save to output directory'], outputFormat: 'JSON with approved (boolean), stakeholders (array), artifacts' },
    outputSchema: { type: 'object', required: ['approved', 'stakeholders', 'artifacts'], properties: { approved: { type: 'boolean' }, stakeholders: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'stakeholder-review', 'approval']
}));
