/**
 * @process specializations/security-research/security-research-publication
 * @description Process for conducting and publishing security research including methodology
 * documentation, peer review, responsible disclosure coordination, and conference or blog publication.
 * @inputs { projectName: string, researchTopic: string, publicationType: string }
 * @outputs { success: boolean, publication: object, disclosureStatus: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/security-research/security-research-publication', {
 *   projectName: 'Novel Cache Timing Attack',
 *   researchTopic: 'side-channel-attack',
 *   publicationType: 'conference'
 * });
 *
 * @references
 * - Project Zero Blog: https://googleprojectzero.blogspot.com/
 * - Black Hat CFP: https://www.blackhat.com/call-for-papers.html
 * - DEF CON CFP: https://defcon.org/html/defcon-call-for-papers.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    researchTopic,
    publicationType,
    targetVenue = null,
    disclosureRequired = true,
    outputDir = 'research-publication-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Security Research Publication for ${projectName}`);
  ctx.log('info', `Topic: ${researchTopic}, Type: ${publicationType}`);

  // ============================================================================
  // PHASE 1: RESEARCH DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Documenting research methodology');

  const researchDoc = await ctx.task(researchDocumentationTask, {
    projectName,
    researchTopic,
    outputDir
  });

  artifacts.push(...researchDoc.artifacts);

  // ============================================================================
  // PHASE 2: TECHNICAL WRITING
  // ============================================================================

  ctx.log('info', 'Phase 2: Writing technical content');

  const technicalWriting = await ctx.task(technicalWritingTask, {
    projectName,
    researchDoc,
    publicationType,
    outputDir
  });

  artifacts.push(...technicalWriting.artifacts);

  // ============================================================================
  // PHASE 3: INTERNAL PEER REVIEW
  // ============================================================================

  ctx.log('info', 'Phase 3: Internal peer review');

  const peerReview = await ctx.task(peerReviewTask, {
    projectName,
    technicalWriting,
    outputDir
  });

  artifacts.push(...peerReview.artifacts);

  // ============================================================================
  // PHASE 4: DISCLOSURE COORDINATION
  // ============================================================================

  let disclosureStatus = { status: 'not-required' };

  if (disclosureRequired) {
    ctx.log('info', 'Phase 4: Coordinating responsible disclosure');

    const disclosure = await ctx.task(disclosureCoordinationTask, {
      projectName,
      researchDoc,
      outputDir
    });

    disclosureStatus = {
      status: disclosure.status,
      vendorNotified: disclosure.vendorNotified,
      cveAssigned: disclosure.cveAssigned
    };
    artifacts.push(...disclosure.artifacts);
  }

  // ============================================================================
  // PHASE 5: SUBMISSION PREPARATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Preparing submission');

  const submission = await ctx.task(submissionPreparationTask, {
    projectName,
    technicalWriting,
    peerReview,
    publicationType,
    targetVenue,
    outputDir
  });

  artifacts.push(...submission.artifacts);

  // ============================================================================
  // PHASE 6: PRESENTATION MATERIALS
  // ============================================================================

  ctx.log('info', 'Phase 6: Creating presentation materials');

  const presentation = await ctx.task(presentationMaterialsTask, {
    projectName,
    technicalWriting,
    publicationType,
    outputDir
  });

  artifacts.push(...presentation.artifacts);

  // ============================================================================
  // PHASE 7: PUBLICATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Publishing research');

  const publication = await ctx.task(publicationTask, {
    projectName,
    submission,
    presentation,
    disclosureStatus,
    outputDir
  });

  artifacts.push(...publication.artifacts);

  await ctx.breakpoint({
    question: `Research publication process complete. Disclosure status: ${disclosureStatus.status}. Publication ready: ${publication.ready}. Proceed with publication?`,
    title: 'Research Publication Ready',
    context: {
      runId: ctx.runId,
      summary: {
        researchTopic,
        publicationType,
        disclosureStatus: disclosureStatus.status,
        peerReviewComplete: peerReview.approved
      },
      files: publication.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown', label: a.label }))
    }
  });

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    publication: {
      type: publicationType,
      documentPath: technicalWriting.documentPath,
      presentationPath: presentation.presentationPath,
      ready: publication.ready
    },
    disclosureStatus,
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'specializations/security-research/security-research-publication',
      timestamp: startTime,
      researchTopic,
      publicationType,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const researchDocumentationTask = defineTask('research-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Document Research - ${args.projectName}`,
  agent: {
    name: 'security-report-writer',
    prompt: {
      role: 'Security Research Documenter',
      task: 'Document research methodology and findings',
      context: args,
      instructions: [
        '1. Document research goals',
        '2. Describe methodology used',
        '3. Document tools and techniques',
        '4. Record all findings',
        '5. Document reproduction steps',
        '6. Include raw data and evidence',
        '7. Document timeline',
        '8. Create comprehensive notes'
      ],
      outputFormat: 'JSON with research documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['methodology', 'findings', 'artifacts'],
      properties: {
        methodology: { type: 'object' },
        findings: { type: 'array' },
        timeline: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'publication', 'documentation']
}));

export const technicalWritingTask = defineTask('technical-writing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Technical Writing - ${args.projectName}`,
  agent: {
    name: 'security-report-writer',
    prompt: {
      role: 'Security Technical Writer',
      task: 'Write technical publication',
      context: args,
      instructions: [
        '1. Write abstract/introduction',
        '2. Describe background/related work',
        '3. Detail methodology',
        '4. Present findings',
        '5. Discuss implications',
        '6. Write conclusion',
        '7. Format appropriately',
        '8. Add references'
      ],
      outputFormat: 'JSON with technical document'
    },
    outputSchema: {
      type: 'object',
      required: ['documentPath', 'abstract', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        abstract: { type: 'string' },
        sections: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'publication', 'writing']
}));

export const peerReviewTask = defineTask('peer-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Peer Review - ${args.projectName}`,
  agent: {
    name: 'vuln-researcher',
    prompt: {
      role: 'Security Research Peer Reviewer',
      task: 'Conduct internal peer review',
      context: args,
      instructions: [
        '1. Review technical accuracy',
        '2. Verify reproducibility',
        '3. Check for gaps',
        '4. Review writing quality',
        '5. Verify references',
        '6. Check ethical considerations',
        '7. Provide feedback',
        '8. Approve or request revisions'
      ],
      outputFormat: 'JSON with peer review results'
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'feedback', 'artifacts'],
      properties: {
        approved: { type: 'boolean' },
        feedback: { type: 'array' },
        revisions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'publication', 'review']
}));

export const disclosureCoordinationTask = defineTask('disclosure-coordination', (args, taskCtx) => ({
  kind: 'agent',
  title: `Disclosure Coordination - ${args.projectName}`,
  agent: {
    name: 'security-report-writer',
    prompt: {
      role: 'Responsible Disclosure Coordinator',
      task: 'Coordinate responsible disclosure',
      context: args,
      instructions: [
        '1. Identify affected vendors',
        '2. Prepare disclosure report',
        '3. Find disclosure channels',
        '4. Submit to vendors',
        '5. Track responses',
        '6. Coordinate CVE request',
        '7. Agree on timeline',
        '8. Document process'
      ],
      outputFormat: 'JSON with disclosure status'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'vendorNotified', 'artifacts'],
      properties: {
        status: { type: 'string' },
        vendorNotified: { type: 'boolean' },
        cveAssigned: { type: 'string' },
        timeline: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'publication', 'disclosure']
}));

export const submissionPreparationTask = defineTask('submission-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Prepare Submission - ${args.projectName}`,
  agent: {
    name: 'security-report-writer',
    prompt: {
      role: 'Publication Submission Specialist',
      task: 'Prepare publication submission',
      context: args,
      instructions: [
        '1. Review venue requirements',
        '2. Format document appropriately',
        '3. Prepare supplementary materials',
        '4. Create submission abstract',
        '5. Prepare author information',
        '6. Review submission checklist',
        '7. Final proofread',
        '8. Submit to venue'
      ],
      outputFormat: 'JSON with submission details'
    },
    outputSchema: {
      type: 'object',
      required: ['submissionReady', 'materials', 'artifacts'],
      properties: {
        submissionReady: { type: 'boolean' },
        materials: { type: 'array' },
        venue: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'publication', 'submission']
}));

export const presentationMaterialsTask = defineTask('presentation-materials', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create Presentation - ${args.projectName}`,
  agent: {
    name: 'security-report-writer',
    prompt: {
      role: 'Security Presentation Specialist',
      task: 'Create presentation materials',
      context: args,
      instructions: [
        '1. Design presentation outline',
        '2. Create slides',
        '3. Add diagrams and visuals',
        '4. Include demos if applicable',
        '5. Create speaker notes',
        '6. Prepare backup materials',
        '7. Practice timing',
        '8. Finalize presentation'
      ],
      outputFormat: 'JSON with presentation materials'
    },
    outputSchema: {
      type: 'object',
      required: ['presentationPath', 'artifacts'],
      properties: {
        presentationPath: { type: 'string' },
        slideCount: { type: 'number' },
        demoIncluded: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'publication', 'presentation']
}));

export const publicationTask = defineTask('publication', (args, taskCtx) => ({
  kind: 'agent',
  title: `Publish Research - ${args.projectName}`,
  agent: {
    name: 'security-report-writer',
    prompt: {
      role: 'Research Publication Manager',
      task: 'Manage publication process',
      context: args,
      instructions: [
        '1. Verify disclosure timeline',
        '2. Final review of materials',
        '3. Publish to venue/blog',
        '4. Share on social media',
        '5. Submit to aggregators',
        '6. Monitor feedback',
        '7. Respond to questions',
        '8. Document publication'
      ],
      outputFormat: 'JSON with publication status'
    },
    outputSchema: {
      type: 'object',
      required: ['ready', 'publicationUrl', 'artifacts'],
      properties: {
        ready: { type: 'boolean' },
        publicationUrl: { type: 'string' },
        publishedAt: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'publication', 'publish']
}));
