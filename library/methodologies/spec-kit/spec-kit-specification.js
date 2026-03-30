/**
 * @process methodologies/spec-kit/spec-kit-specification
 * @description Spec Kit specification workflow: constitution establishment + specification writing + clarification. Produces a complete, refined feature specification from business intent following GitHub's Spec-Driven Development.
 * @inputs { projectName: string, featureDescription: string, projectType?: string, existingConstitution?: object, targetAudience?: string, complianceRequirements?: array }
 * @outputs { success: boolean, constitution: object, specification: object, clarifications: object, specDocument: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

const gatherProjectContextTask = defineTask('spec-kit-spec-gather-context', async (args, _ctx) => {
  return { context: args };
}, {
  kind: 'agent',
  title: 'Gather Project Context for Constitution',
  labels: ['spec-kit', 'specification', 'context-gathering'],
  io: {
    inputs: { projectName: 'string', projectType: 'string', targetAudience: 'string', complianceRequirements: 'array', existingCodebase: 'boolean' },
    outputs: { projectProfile: 'object', existingPatterns: 'array', technologyContext: 'object', audienceNeeds: 'array', regulatoryContext: 'array' }
  }
});

const draftConstitutionTask = defineTask('spec-kit-spec-draft-constitution', async (args, _ctx) => {
  return { constitution: args };
}, {
  kind: 'agent',
  title: 'Draft Project Constitution',
  labels: ['spec-kit', 'specification', 'constitution'],
  io: {
    inputs: { projectName: 'string', projectType: 'string', projectContext: 'object', constraints: 'object' },
    outputs: { devGuidelines: 'object', codeQuality: 'object', testing: 'object', ux: 'object', performance: 'object', security: 'object', architecture: 'object', workflow: 'object' }
  }
});

const elicitRequirementsTask = defineTask('spec-kit-spec-elicit-requirements', async (args, _ctx) => {
  return { requirements: args };
}, {
  kind: 'agent',
  title: 'Elicit Requirements from Feature Description',
  labels: ['spec-kit', 'specification', 'requirements'],
  io: {
    inputs: { featureDescription: 'string', constitution: 'object', projectName: 'string', mode: 'string' },
    outputs: { functional: 'array', nonFunctional: 'array', constraints: 'array', assumptions: 'array', outOfScope: 'array' }
  }
});

const writeUserStoriesTask = defineTask('spec-kit-spec-write-stories', async (args, _ctx) => {
  return { stories: args };
}, {
  kind: 'agent',
  title: 'Write User Stories with Acceptance Criteria',
  labels: ['spec-kit', 'specification', 'user-stories'],
  io: {
    inputs: { requirements: 'object', constitution: 'object', targetAudience: 'string' },
    outputs: { userStories: 'array', personas: 'array', acceptanceCriteria: 'array', edgeCases: 'array' }
  }
});

const identifyGapsTask = defineTask('spec-kit-spec-identify-gaps', async (args, _ctx) => {
  return { gaps: args };
}, {
  kind: 'agent',
  title: 'Identify Specification Gaps and Ambiguities',
  labels: ['spec-kit', 'specification', 'clarification'],
  io: {
    inputs: { requirements: 'object', userStories: 'array', constitution: 'object' },
    outputs: { gaps: 'array', ambiguities: 'array', contradictions: 'array', underspecifiedAreas: 'array' }
  }
});

const resolveGapsTask = defineTask('spec-kit-spec-resolve-gaps', async (args, _ctx) => {
  return { resolutions: args };
}, {
  kind: 'agent',
  title: 'Resolve Specification Gaps with Clarifications',
  labels: ['spec-kit', 'specification', 'resolution'],
  io: {
    inputs: { gaps: 'array', ambiguities: 'array', contradictions: 'array', requirements: 'object', constitution: 'object' },
    outputs: { resolutions: 'array', updatedRequirements: 'object', updatedStories: 'array', remainingQuestions: 'array' }
  }
});

const assembleSpecDocumentTask = defineTask('spec-kit-spec-assemble-document', async (args, _ctx) => {
  return { document: args };
}, {
  kind: 'agent',
  title: 'Assemble Final Specification Document',
  labels: ['spec-kit', 'specification', 'document'],
  io: {
    inputs: { projectName: 'string', featureDescription: 'string', constitution: 'object', requirements: 'object', userStories: 'array', acceptanceCriteria: 'array', clarifications: 'object' },
    outputs: { documentPath: 'string', specVersion: 'string', summary: 'string', totalRequirements: 'number', totalStories: 'number', readiness: 'string' }
  }
});

// ============================================================================
// MAIN PROCESS
// ============================================================================

/**
 * Spec Kit Specification Workflow
 *
 * Implements the Constitution + Specification + Clarification phases from
 * GitHub's Spec Kit. Produces a complete, refined specification from business-level
 * feature descriptions.
 *
 * Workflow:
 * 1. Gather project context for constitution
 * 2. Draft project constitution (governing principles)
 * 3. Elicit requirements from feature description
 * 4. Write user stories with acceptance criteria (parallel with requirements analysis)
 * 5. Identify gaps and ambiguities
 * 6. Resolve gaps through clarification
 * 7. Assemble final specification document
 *
 * Attribution: Adapted from https://github.com/github/spec-kit
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.projectName - Name of the project
 * @param {string} inputs.featureDescription - Business-level feature description
 * @param {string} inputs.projectType - Project type (web, api, cli, library)
 * @param {Object} inputs.existingConstitution - Reuse existing constitution
 * @param {string} inputs.targetAudience - Primary audience/users
 * @param {Array} inputs.complianceRequirements - Regulatory/compliance needs
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Constitution, specification, and clarifications
 */
export async function process(inputs, ctx) {
  const {
    projectName,
    featureDescription,
    projectType = 'web',
    existingConstitution = null,
    targetAudience = '',
    complianceRequirements = []
  } = inputs;

  ctx.log('Spec Kit Specification: Starting constitution + specification + clarification workflow');
  ctx.log(`Project: ${projectName} | Feature: ${featureDescription}`);

  // ============================================================================
  // PHASE 1: CONSTITUTION
  // ============================================================================

  let constitution;

  if (existingConstitution) {
    ctx.log('Phase 1: Reusing existing constitution');
    constitution = existingConstitution;
  } else {
    ctx.log('Phase 1: Establishing project constitution');

    const projectContext = await ctx.task(gatherProjectContextTask, {
      projectName,
      projectType,
      targetAudience,
      complianceRequirements,
      existingCodebase: inputs.existingCodebase || false
    });

    constitution = await ctx.task(draftConstitutionTask, {
      projectName,
      projectType,
      projectContext,
      constraints: inputs.constraints || {}
    });

    await ctx.breakpoint({
      question: `Constitution drafted for "${projectName}". Covers: dev guidelines, code quality, testing, UX, performance, security, architecture, workflow. Review and approve to proceed to specification writing.`,
      title: 'Spec Kit: Constitution Review',
      context: { runId: ctx.runId }
    });
  }

  // ============================================================================
  // PHASE 2: SPECIFICATION (Requirements + User Stories in parallel)
  // ============================================================================

  ctx.log('Phase 2: Writing feature specification');

  const [requirements, stories] = await ctx.parallel.all([
    () => ctx.task(elicitRequirementsTask, {
      featureDescription,
      constitution,
      projectName,
      mode: inputs.mode || 'greenfield'
    }),
    () => ctx.task(writeUserStoriesTask, {
      requirements: { featureDescription, projectName },
      constitution,
      targetAudience
    })
  ]);

  const specification = {
    requirements: requirements.functional || [],
    nonFunctional: requirements.nonFunctional || [],
    constraints: requirements.constraints || [],
    assumptions: requirements.assumptions || [],
    outOfScope: requirements.outOfScope || [],
    userStories: stories.userStories || [],
    personas: stories.personas || [],
    acceptanceCriteria: stories.acceptanceCriteria || [],
    edgeCases: stories.edgeCases || []
  };

  // ============================================================================
  // PHASE 3: CLARIFICATION
  // ============================================================================

  ctx.log('Phase 3: Identifying and resolving specification gaps');

  const gaps = await ctx.task(identifyGapsTask, {
    requirements,
    userStories: stories.userStories,
    constitution
  });

  let clarifications = { resolutions: [], remainingQuestions: [] };

  if ((gaps.gaps || []).length > 0 || (gaps.ambiguities || []).length > 0 || (gaps.contradictions || []).length > 0) {
    ctx.log(`Found ${(gaps.gaps || []).length} gaps, ${(gaps.ambiguities || []).length} ambiguities, ${(gaps.contradictions || []).length} contradictions`);

    clarifications = await ctx.task(resolveGapsTask, {
      gaps: gaps.gaps || [],
      ambiguities: gaps.ambiguities || [],
      contradictions: gaps.contradictions || [],
      requirements,
      constitution
    });

    // Merge clarified items back into specification
    if (clarifications.updatedRequirements) {
      Object.assign(specification, {
        requirements: clarifications.updatedRequirements.functional || specification.requirements,
        nonFunctional: clarifications.updatedRequirements.nonFunctional || specification.nonFunctional
      });
    }
    if (clarifications.updatedStories) {
      specification.userStories = clarifications.updatedStories;
    }
  }

  await ctx.breakpoint({
    question: `Specification complete: ${specification.requirements.length} functional requirements, ${specification.userStories.length} user stories, ${specification.acceptanceCriteria.length} acceptance criteria. ${(clarifications.remainingQuestions || []).length} open questions. Approve to assemble final document.`,
    title: 'Spec Kit: Specification Review',
    context: { runId: ctx.runId }
  });

  // ============================================================================
  // PHASE 4: DOCUMENT ASSEMBLY
  // ============================================================================

  ctx.log('Phase 4: Assembling final specification document');

  const specDocument = await ctx.task(assembleSpecDocumentTask, {
    projectName,
    featureDescription,
    constitution,
    requirements,
    userStories: specification.userStories,
    acceptanceCriteria: specification.acceptanceCriteria,
    clarifications
  });

  ctx.log(`Specification document assembled: ${specDocument.documentPath}`);

  return {
    success: true,
    constitution,
    specification,
    clarifications: {
      gaps: gaps.gaps || [],
      ambiguities: gaps.ambiguities || [],
      resolutions: clarifications.resolutions || [],
      remainingQuestions: clarifications.remainingQuestions || []
    },
    specDocument,
    metadata: {
      processId: 'methodologies/spec-kit/spec-kit-specification',
      attribution: 'https://github.com/github/spec-kit',
      projectName,
      totalRequirements: specification.requirements.length,
      totalStories: specification.userStories.length,
      timestamp: ctx.now()
    }
  };
}
