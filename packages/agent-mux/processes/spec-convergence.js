/**
 * @process spec-convergence
 * @description Iterative spec creation from scope doc with research, drafting, adversarial review, and convergence to target quality
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

const analyzeScopeTask = defineTask('analyze-scope', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze scope document and plan spec structure',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical architect and specification planner',
      task: `Analyze the scope document at "${args.scopeFile}" and produce a detailed spec plan.`,
      context: {
        scopeFile: args.scopeFile,
        outputDir: args.outputDir,
      },
      instructions: [
        `Read the scope document at "${args.scopeFile}" thoroughly.`,
        'Identify all major subsystems, interfaces, types, and contracts defined in the scope.',
        'Plan a set of specification documents that comprehensively cover the entire scope.',
        'Each spec should be a self-contained document covering one logical area.',
        'For each spec, define: filename, title, sections, key types/interfaces to detail, behavioral contracts, error handling, edge cases.',
        'Consider cross-cutting concerns: error types, retry policies, streaming model, platform differences, security.',
        'Return a JSON object with: { specs: [{ filename, title, sections: string[], keyTypes: string[], scope: string }], crossCuttingConcerns: string[], totalSections: number }',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['specs'],
      properties: {
        specs: {
          type: 'array',
          items: {
            type: 'object',
            required: ['filename', 'title', 'sections', 'scope'],
            properties: {
              filename: { type: 'string' },
              title: { type: 'string' },
              sections: { type: 'array', items: { type: 'string' } },
              keyTypes: { type: 'array', items: { type: 'string' } },
              scope: { type: 'string' },
            },
          },
        },
        crossCuttingConcerns: { type: 'array', items: { type: 'string' } },
        totalSections: { type: 'number' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const researchTask = defineTask('research-spec-area', (args, taskCtx) => ({
  kind: 'agent',
  title: `Research: ${args.specTitle}`,
  execution: { model: 'claude-opus-4-6' },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical researcher and domain expert',
      task: `Research best practices, patterns, and prior art for the specification area: "${args.specTitle}"`,
      context: {
        scopeFile: args.scopeFile,
        specPlan: args.specPlan,
        specTitle: args.specTitle,
        specScope: args.specScope,
        sections: args.sections,
        keyTypes: args.keyTypes,
      },
      instructions: [
        `Read the scope document at "${args.scopeFile}" for the sections relevant to "${args.specTitle}".`,
        'Research online for best practices, patterns, and conventions used by similar tools (e.g., Docker SDK, Kubernetes client-go, Terraform SDK).',
        'Identify edge cases, error scenarios, platform-specific behaviors, and security considerations.',
        'Document behavioral contracts: what happens on invalid input, timeout, network failure, concurrent access.',
        'For each interface/type, note: required vs optional fields, valid ranges, default values, invariants.',
        'Return comprehensive research notes as JSON with: { findings: string, edgeCases: string[], bestPractices: string[], securityConsiderations: string[], platformNotes: string[] }',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['findings'],
      properties: {
        findings: { type: 'string' },
        edgeCases: { type: 'array', items: { type: 'string' } },
        bestPractices: { type: 'array', items: { type: 'string' } },
        securityConsiderations: { type: 'array', items: { type: 'string' } },
        platformNotes: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const draftSpecTask = defineTask('draft-spec', (args, taskCtx) => ({
  kind: 'agent',
  title: `Draft spec: ${args.specTitle}`,
  execution: { model: 'claude-opus-4-6' },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior technical writer and API specification author',
      task: `Write a comprehensive specification document for "${args.specTitle}" and save it to "${args.outputPath}".`,
      context: {
        scopeFile: args.scopeFile,
        specPlan: args.specPlan,
        research: args.research,
        outputPath: args.outputPath,
        specScope: args.specScope,
        sections: args.sections,
        keyTypes: args.keyTypes,
        previousDraft: args.previousDraft || null,
        feedback: args.feedback || null,
        attempt: args.attempt || 1,
      },
      instructions: [
        `Read the scope document at "${args.scopeFile}" for all details relevant to "${args.specTitle}".`,
        'Use the research findings to inform edge cases, best practices, and behavioral contracts.',
        args.feedback ? `IMPORTANT: Address this feedback from the adversarial review: ${args.feedback}` : 'This is the initial draft.',
        args.previousDraft ? `The previous draft is at "${args.previousDraft}". Read it and improve it based on the feedback.` : '',
        'Write a production-grade specification document in Markdown format.',
        'Include: Overview, Detailed API/interface descriptions with full TypeScript types, Behavioral contracts, Error handling, Edge cases, Platform considerations, Examples, Cross-references to other specs.',
        'Every type must have every field documented with: type, required/optional, default value, valid range, description.',
        'Every method must have: parameters, return type, throws, behavioral description, concurrency safety, examples.',
        'Be exhaustive - cover ALL types, interfaces, methods, events, and behaviors defined in the scope for this area.',
        'Do NOT leave TODO placeholders or "TBD" markers. Everything must be fully specified.',
        `Write the complete spec to the file "${args.outputPath}". Make sure to actually create the file.`,
        'Return JSON with: { specFile: string, sectionCount: number, typeCount: number, methodCount: number, summary: string }',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['specFile', 'summary'],
      properties: {
        specFile: { type: 'string' },
        sectionCount: { type: 'number' },
        typeCount: { type: 'number' },
        methodCount: { type: 'number' },
        summary: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const adversarialReviewTask = defineTask('adversarial-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Adversarial review: ${args.specTitle}`,
  execution: { model: 'claude-opus-4-6' },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Adversarial specification reviewer and quality auditor',
      task: `Perform a rigorous adversarial review of the specification at "${args.specFile}" against the scope document.`,
      context: {
        scopeFile: args.scopeFile,
        specFile: args.specFile,
        specTitle: args.specTitle,
        specScope: args.specScope,
        attempt: args.attempt || 1,
        targetScore: args.targetScore || 99,
      },
      instructions: [
        `Read BOTH the scope document at "${args.scopeFile}" AND the spec at "${args.specFile}" in their entirety.`,
        'Score the spec on these dimensions (0-100 each):',
        '  - Completeness: Does it cover ALL types, interfaces, methods, events from the scope for this area?',
        '  - Accuracy: Are all descriptions, types, and behaviors exactly consistent with the scope?',
        '  - Depth: Are behavioral contracts, edge cases, error handling, and platform notes thorough?',
        '  - Clarity: Is every statement unambiguous and precise enough to implement from?',
        '  - Consistency: Are cross-references accurate? Are naming conventions consistent?',
        'Look for: missing fields, missing methods, missing events, incorrect types, missing error cases, missing platform considerations, ambiguous language, TBD/TODO markers, missing examples.',
        'Be HARSH. This is adversarial review. Find every possible issue.',
        'Compute a weighted overall score: completeness(30%) + accuracy(25%) + depth(20%) + clarity(15%) + consistency(10%).',
        'Return JSON: { overallScore: number, dimensions: { completeness: number, accuracy: number, depth: number, clarity: number, consistency: number }, issues: [{ severity: "critical"|"major"|"minor", description: string, location: string }], feedback: string, passesTarget: boolean }',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'dimensions', 'issues', 'feedback', 'passesTarget'],
      properties: {
        overallScore: { type: 'number' },
        dimensions: {
          type: 'object',
          properties: {
            completeness: { type: 'number' },
            accuracy: { type: 'number' },
            depth: { type: 'number' },
            clarity: { type: 'number' },
            consistency: { type: 'number' },
          },
        },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              severity: { type: 'string' },
              description: { type: 'string' },
              location: { type: 'string' },
            },
          },
        },
        feedback: { type: 'string' },
        passesTarget: { type: 'boolean' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const crossSpecReviewTask = defineTask('cross-spec-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Cross-spec consistency review',
  execution: { model: 'claude-opus-4-6' },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Integration architect and cross-spec consistency reviewer',
      task: 'Review all spec documents for cross-spec consistency, completeness against the full scope, and integration correctness.',
      context: {
        scopeFile: args.scopeFile,
        specFiles: args.specFiles,
        outputDir: args.outputDir,
      },
      instructions: [
        `Read the scope document at "${args.scopeFile}" in its entirety.`,
        `Read ALL spec files in "${args.outputDir}".`,
        'Check: Are all types, interfaces, methods, events from the scope covered across all specs?',
        'Check: Are cross-references between specs accurate? Do type names match?',
        'Check: Are there contradictions between specs (e.g., different default values, conflicting behaviors)?',
        'Check: Is the overall spec set complete enough to implement the entire scope from?',
        'Check: Are there gaps - things in the scope that no spec covers?',
        'Score overall cross-spec quality 0-100.',
        'Return JSON: { overallScore: number, gaps: string[], contradictions: string[], crossRefIssues: string[], feedback: string, passesTarget: boolean }',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'feedback', 'passesTarget'],
      properties: {
        overallScore: { type: 'number' },
        gaps: { type: 'array', items: { type: 'string' } },
        contradictions: { type: 'array', items: { type: 'string' } },
        crossRefIssues: { type: 'array', items: { type: 'string' } },
        feedback: { type: 'string' },
        passesTarget: { type: 'boolean' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const fixCrossSpecIssuesTask = defineTask('fix-cross-spec-issues', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Fix cross-spec issues',
  execution: { model: 'claude-opus-4-6' },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical writer fixing cross-spec consistency issues',
      task: `Fix all cross-spec issues identified in the review. Update spec files in "${args.outputDir}".`,
      context: {
        scopeFile: args.scopeFile,
        outputDir: args.outputDir,
        specFiles: args.specFiles,
        crossSpecFeedback: args.crossSpecFeedback,
        gaps: args.gaps,
        contradictions: args.contradictions,
        crossRefIssues: args.crossRefIssues,
      },
      instructions: [
        `Read the scope document at "${args.scopeFile}".`,
        `Read ALL spec files in "${args.outputDir}".`,
        'Fix all identified issues: gaps, contradictions, cross-reference errors.',
        'If there are gaps (scope areas not covered by any spec), add the missing content to the most appropriate spec file or create a new spec if needed.',
        'If there are contradictions, resolve them by checking the scope document for the authoritative definition.',
        'If there are cross-reference issues, fix the references to point to the correct locations.',
        'Actually edit and save the files. Do not just describe what should change.',
        'Return JSON: { filesModified: string[], issuesFixed: number, summary: string }',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['filesModified', 'issuesFixed', 'summary'],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

// ============================================================================
// MAIN PROCESS
// ============================================================================

export async function process(inputs, ctx) {
  const {
    scopeFile = 'C:/work/agent-mux/agent-mux-scope.md',
    outputDir = 'C:/work/agent-mux/docs',
    targetScore = 99,
    maxIterations = 5,
  } = inputs;

  const startTime = ctx.now();

  ctx.log('info', `Starting spec convergence process. Target: ${targetScore}%. Max iterations: ${maxIterations}`);

  // ============================================================================
  // PHASE 1: Analyze scope and plan specs
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing scope document and planning spec structure');

  const specPlan = await ctx.task(analyzeScopeTask, {
    scopeFile,
    outputDir,
  });

  ctx.log('info', `Spec plan: ${specPlan.specs?.length || 0} specs planned, ${specPlan.totalSections || 0} total sections`);

  // Breakpoint: Review spec plan
  await ctx.breakpoint({
    question: `Spec plan ready: ${specPlan.specs?.length || 0} specs planned covering ${specPlan.totalSections || 0} sections. Review the plan and approve to proceed with research and drafting.`,
    title: 'Spec Plan Review',
    options: ['Approve', 'Request changes'],
    expert: 'owner',
    tags: ['spec-plan'],
    breakpointId: 'spec-plan-review',
    autoApproveAfterN: -1,
  });

  // ============================================================================
  // PHASE 2: Research + Draft + Review cycle for each spec
  // ============================================================================

  const specResults = [];
  const specs = specPlan.specs || [];

  for (let specIdx = 0; specIdx < specs.length; specIdx++) {
    const spec = specs[specIdx];
    const specFile = `${outputDir}/${spec.filename}`;

    ctx.log('info', `Phase 2.${specIdx + 1}: Processing spec "${spec.title}" (${specIdx + 1}/${specs.length})`);

    // 2a: Research
    const research = await ctx.task(researchTask, {
      scopeFile,
      specPlan,
      specTitle: spec.title,
      specScope: spec.scope,
      sections: spec.sections,
      keyTypes: spec.keyTypes,
    });

    // 2b: Draft + Review convergence loop
    let currentScore = 0;
    let lastFeedback = null;
    let iteration = 0;

    while (currentScore < targetScore && iteration < maxIterations) {
      iteration++;
      ctx.log('info', `  Iteration ${iteration}: ${iteration === 1 ? 'Initial draft' : 'Refinement'} of "${spec.title}"`);

      // Draft (or refine)
      const draft = await ctx.task(draftSpecTask, {
        scopeFile,
        specPlan,
        research,
        outputPath: specFile,
        specTitle: spec.title,
        specScope: spec.scope,
        sections: spec.sections,
        keyTypes: spec.keyTypes,
        previousDraft: iteration > 1 ? specFile : null,
        feedback: lastFeedback,
        attempt: iteration,
      });

      // Adversarial review
      const review = await ctx.task(adversarialReviewTask, {
        scopeFile,
        specFile,
        specTitle: spec.title,
        specScope: spec.specScope || spec.scope,
        attempt: iteration,
        targetScore,
      });

      currentScore = review.overallScore || 0;
      lastFeedback = review.feedback;

      ctx.log('info', `  Review score: ${currentScore}/100 (target: ${targetScore}). Issues: ${review.issues?.length || 0}`);

      if (currentScore >= targetScore) {
        ctx.log('info', `  "${spec.title}" converged at score ${currentScore} after ${iteration} iteration(s)`);
        break;
      }

      if (iteration >= maxIterations) {
        ctx.log('warn', `  "${spec.title}" reached max iterations (${maxIterations}) at score ${currentScore}`);
      }
    }

    specResults.push({
      specTitle: spec.title,
      filename: spec.filename,
      finalScore: currentScore,
      iterations: iteration,
    });
  }

  // ============================================================================
  // PHASE 3: Cross-spec consistency review and fix
  // ============================================================================

  ctx.log('info', 'Phase 3: Cross-spec consistency review');

  const specFiles = specResults.map(s => `${outputDir}/${s.filename}`);
  let crossSpecScore = 0;
  let crossSpecIteration = 0;

  while (crossSpecScore < targetScore && crossSpecIteration < 3) {
    crossSpecIteration++;

    const crossReview = await ctx.task(crossSpecReviewTask, {
      scopeFile,
      specFiles,
      outputDir,
    });

    crossSpecScore = crossReview.overallScore || 0;
    ctx.log('info', `Cross-spec review score: ${crossSpecScore}/100 (iteration ${crossSpecIteration})`);

    if (crossSpecScore >= targetScore) {
      ctx.log('info', 'Cross-spec consistency achieved.');
      break;
    }

    // Fix issues
    await ctx.task(fixCrossSpecIssuesTask, {
      scopeFile,
      outputDir,
      specFiles,
      crossSpecFeedback: crossReview.feedback,
      gaps: crossReview.gaps,
      contradictions: crossReview.contradictions,
      crossRefIssues: crossReview.crossRefIssues,
    });
  }

  // ============================================================================
  // PHASE 4: Final review breakpoint
  // ============================================================================

  await ctx.breakpoint({
    question: `All specs complete. Individual scores: ${specResults.map(s => `${s.specTitle}: ${s.finalScore}`).join(', ')}. Cross-spec score: ${crossSpecScore}. Approve to finalize.`,
    title: 'Final Spec Review',
    options: ['Approve', 'Request changes'],
    expert: 'owner',
    tags: ['final-review'],
    breakpointId: 'final-spec-review',
    autoApproveAfterN: -1,
  });

  const elapsed = ctx.now() - startTime;

  return {
    success: true,
    specsCreated: specResults.length,
    specResults,
    crossSpecScore,
    outputDir,
    elapsedMs: elapsed,
  };
}
