/**
 * @process methodologies/superpowers/receiving-code-review
 * @description Receiving Code Review - Technically evaluate feedback before implementing: read, understand, verify, evaluate, respond, implement
 * @inputs { feedback: array, branchName?: string, baseSha?: string, headSha?: string }
 * @outputs { success: boolean, evaluations: array, actionsApplied: array, pushbackItems: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// AGENT TASK DEFINITIONS
// ============================================================================

const agentReadFeedbackTask = defineTask('review-receive-read', async (args, ctx) => {
  return { parsed: args };
}, {
  kind: 'agent',
  title: 'Read and Parse Review Feedback',
  labels: ['superpowers', 'code-review', 'receiving'],
  io: {
    inputs: { feedback: 'array', baseSha: 'string', headSha: 'string' },
    outputs: { items: 'array', totalItems: 'number', categories: 'object' }
  }
});

const agentVerifyFeedbackTask = defineTask('review-receive-verify', async (args, ctx) => {
  return { verification: args };
}, {
  kind: 'agent',
  title: 'Verify Feedback Against Codebase Reality',
  labels: ['superpowers', 'code-review', 'verification'],
  io: {
    inputs: { item: 'object', branchName: 'string' },
    outputs: { verified: 'boolean', codebaseReality: 'string', technicallySound: 'boolean', recommendation: 'string' }
  }
});

const agentEvaluateFeedbackTask = defineTask('review-receive-evaluate', async (args, ctx) => {
  return { evaluation: args };
}, {
  kind: 'agent',
  title: 'Evaluate Feedback for This Codebase',
  labels: ['superpowers', 'code-review', 'evaluation'],
  io: {
    inputs: { item: 'object', verification: 'object' },
    outputs: { action: 'string', reasoning: 'string', pushback: 'boolean', pushbackReason: 'string', priority: 'string' }
  }
});

const agentImplementFeedbackItemTask = defineTask('review-receive-implement', async (args, ctx) => {
  return { implementation: args };
}, {
  kind: 'agent',
  title: 'Implement Single Review Feedback Item',
  labels: ['superpowers', 'code-review', 'implementation'],
  io: {
    inputs: { item: 'object', evaluation: 'object', branchName: 'string' },
    outputs: { applied: 'boolean', filesChanged: 'array', testsPass: 'boolean', testOutput: 'string' }
  }
});

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
