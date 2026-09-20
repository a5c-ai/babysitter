/**
 * @process methodologies/superpowers/receiving-code-review
 * @description Receiving Code Review - Technically evaluate feedback before implementing: read, understand, verify, evaluate, respond, implement
 * @inputs { feedback: array, branchName?: string, baseSha?: string, headSha?: string }
 * @outputs { success: boolean, evaluations: array, actionsApplied: array, pushbackItems: array }
   * @graph
 *   domains: [domain:software-engineering]
 *   specializations: [specialization:collaboration]
 *   skillAreas: [skill-area:code-review-practice, skill-area:code-analysis-linting]
 *   workflows: [workflow:code-review, workflow:pull-request-lifecycle]
 *   topics: [topic:code-review-best-practices]
 *   roles: [role:tech-lead, role:engineering-manager]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// AGENT TASK DEFINITIONS
// ============================================================================

const agentReadFeedbackTask = defineTask('review-receive-read', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read and Parse Review Feedback',
  labels: ['superpowers', 'code-review', 'receiving'],
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Code Review Recipient - Feedback Parser',
      task: 'Read the review feedback in full and parse it into discrete, individually addressable items.',
      context: args,
      instructions: [
        'Read every piece of feedback completely before splitting it up',
        'Give each item an id, its content, and the file and line it refers to when stated',
        'Carry the severity the reviewer gave, or "unknown" when none was given',
        'Group the items into categories (correctness, design, style, tests, docs)',
        'Do not judge or answer the feedback at this step - only parse it'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['items', 'totalItems', 'categories']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

const agentVerifyFeedbackTask = defineTask('review-receive-verify', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify Feedback Against Codebase Reality',
  labels: ['superpowers', 'code-review', 'verification'],
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Code Review Recipient - Verifier',
      task: 'Check one feedback item against what the codebase actually does before any judgement is formed about it.',
      context: args,
      instructions: [
        'Read the code the item refers to; do not rely on the reviewer description of it',
        'State the codebase reality in plain terms: what the code does today',
        'Set verified to true only when the situation the reviewer describes actually exists',
        'Set technicallySound to true only when the suggested change would be correct here',
        'Give a recommendation grounded in the code you read, citing file and line',
        'Do not perform agreement: an unverified item is reported as unverified'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['verified', 'codebaseReality', 'technicallySound', 'recommendation']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

const agentEvaluateFeedbackTask = defineTask('review-receive-evaluate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate Feedback for This Codebase',
  labels: ['superpowers', 'code-review', 'evaluation'],
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Code Review Recipient - Evaluator',
      task: 'Decide what to do with one verified feedback item for this codebase: implement, defer or push back.',
      context: args,
      instructions: [
        'Return action as exactly one of implement, defer or pushback',
        'Push back when the suggestion breaks existing functionality, violates YAGNI, conflicts with an architectural decision, or the reviewer lacked context',
        'Set pushback to true and give a specific technical pushbackReason whenever you push back',
        'Give priority as critical, important or minor',
        'Reason from the verification result and the code, not from the tone of the feedback',
        'Neither blind agreement nor reflexive disagreement - the reasoning must stand on the code'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['action', 'reasoning', 'pushback', 'pushbackReason', 'priority']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

const agentImplementFeedbackItemTask = defineTask('review-receive-implement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Single Review Feedback Item',
  labels: ['superpowers', 'code-review', 'implementation'],
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Code Review Recipient - Implementer',
      task: 'Implement exactly one accepted review feedback item on the branch under review and run the tests.',
      context: args,
      instructions: [
        'Change only what this one item requires - do not fold in other items',
        'Run the test suite after the change and capture its real output',
        'Report testsPass strictly from the observed exit status, never from expectation',
        'List every file you changed with its full path',
        'Set applied to false when the change could not be made, and say why in testOutput'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['applied', 'filesChanged', 'testsPass', 'testOutput']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

// ============================================================================
// MAIN PROCESS
// ============================================================================

/**
 * Receiving Code Review Process
 *
 * Response Pattern (applied to each feedback item):
 * 1. READ - Complete feedback without reacting
 * 2. UNDERSTAND - Restate requirement in own words
 * 3. VERIFY - Check against codebase reality
 * 4. EVALUATE - Technically sound for THIS codebase?
 * 5. RESPOND - Technical acknowledgment or reasoned pushback
 * 6. IMPLEMENT - One item at a time, test each
 *
 * When to Push Back:
 * - Suggestion breaks existing functionality
 * - Reviewer lacks full context
 * - Violates YAGNI
 * - Conflicts with architectural decisions
 *
 * Attribution: Adapted from https://github.com/pcvelz/superpowers
 *
 * @param {Object} inputs - Process inputs
 * @param {Array} inputs.feedback - Review feedback items
 * @param {string} inputs.branchName - Branch under review
 * @param {string} inputs.baseSha - Base commit SHA
 * @param {string} inputs.headSha - Head commit SHA
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Evaluation and implementation results
 */
export async function process(inputs, ctx) {
  const {
    feedback,
    branchName = 'HEAD',
    baseSha = 'HEAD~1',
    headSha = 'HEAD'
  } = inputs;

  ctx.log('Starting Receiving Code Review', { feedbackCount: feedback.length });

  // ============================================================================
  // STEP 1: READ AND PARSE ALL FEEDBACK
  // ============================================================================

  ctx.log('Step 1: Reading and parsing all feedback');

  const parsedFeedback = await ctx.task(agentReadFeedbackTask, {
    feedback,
    baseSha,
    headSha
  });

  const items = parsedFeedback.items || feedback.map((f, i) => ({
    id: i,
    content: typeof f === 'string' ? f : f.content || f.comment,
    file: typeof f === 'string' ? null : f.file,
    line: typeof f === 'string' ? null : f.line,
    severity: typeof f === 'string' ? 'unknown' : f.severity
  }));

  // ============================================================================
  // STEP 2: VERIFY AND EVALUATE EACH ITEM
  // ============================================================================

  ctx.log('Step 2: Verifying and evaluating each feedback item', { itemCount: items.length });

  const evaluations = [];
  const pushbackItems = [];
  const actionsApplied = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    ctx.log(`Evaluating item ${i + 1}/${items.length}`, { severity: item.severity });

    // VERIFY: Check against codebase reality
    const verification = await ctx.task(agentVerifyFeedbackTask, {
      item,
      branchName
    });

    // EVALUATE: Technically sound for this codebase?
    const evaluation = await ctx.task(agentEvaluateFeedbackTask, {
      item,
      verification
    });

    evaluations.push({
      itemId: item.id,
      content: item.content,
      verified: verification.verified,
      technicallySound: verification.technicallySound,
      action: evaluation.action,
      priority: evaluation.priority,
      pushback: evaluation.pushback,
      pushbackReason: evaluation.pushbackReason
    });

    if (evaluation.pushback) {
      pushbackItems.push({
        itemId: item.id,
        content: item.content,
        reason: evaluation.pushbackReason,
        reasoning: evaluation.reasoning
      });
    }
  }

  // ============================================================================
  // STEP 3: PRESENT EVALUATION SUMMARY
  // ============================================================================

  const toImplement = evaluations.filter(e => !e.pushback && e.action === 'implement');
  const toDefer = evaluations.filter(e => !e.pushback && e.action === 'defer');

  await ctx.breakpoint({
    question: `Review evaluation complete:\n- ${toImplement.length} items to implement now\n- ${toDefer.length} items to defer\n- ${pushbackItems.length} items with pushback\n\n${pushbackItems.length > 0 ? 'Pushback items:\n' + pushbackItems.map(p => `- "${p.content}": ${p.reason}`).join('\n') : ''}\n\nProceed with implementation?`,
    title: 'Review Feedback Evaluation',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/review/evaluation-summary.md', format: 'markdown', label: 'Evaluation Summary' }
      ]
    }
  }, {
    label: 'Review Feedback Evaluation',
    breakpointId: 'superpowers.receiving-code-review.evaluation'
  });

  // ============================================================================
  // STEP 4: IMPLEMENT ACCEPTED ITEMS ONE AT A TIME
  // ============================================================================

  ctx.log('Step 4: Implementing accepted feedback items', { count: toImplement.length });

  for (let i = 0; i < toImplement.length; i++) {
    const evalItem = toImplement[i];
    const item = items.find(it => it.id === evalItem.itemId);

    ctx.log(`Implementing item ${i + 1}/${toImplement.length}`, { priority: evalItem.priority });

    const implResult = await ctx.task(agentImplementFeedbackItemTask, {
      item,
      evaluation: evalItem,
      branchName
    });

    actionsApplied.push({
      itemId: evalItem.itemId,
      applied: implResult.applied,
      filesChanged: implResult.filesChanged || [],
      testsPass: implResult.testsPass
    });

    if (!implResult.testsPass) {
      await ctx.breakpoint({
        question: `Tests failing after implementing review item ${i + 1}: "${item.content}". Fix before continuing.`,
        title: 'Review Implementation Test Failure',
        context: { runId: ctx.runId }
      }, {
        label: 'Review Implementation Test Failure',
        breakpointId: 'superpowers.receiving-code-review.test-failure'
      });
    }
  }

  return {
    success: true,
    totalFeedbackItems: items.length,
    evaluations,
    actionsApplied,
    pushbackItems,
    deferredItems: toDefer,
    metadata: {
      processId: 'methodologies/superpowers/receiving-code-review',
      attribution: 'https://github.com/pcvelz/superpowers',
      timestamp: ctx.now()
    }
  };
}
