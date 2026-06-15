import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * @process microagent/diff-applier
 * @description Applies structured diffs (patches) to files using git apply or manual editing.
 * @inputs { patches: Array<{ file: string, hunks: string[] }> }
 * @outputs { applied: number, failed: number, results: Array<{ file: string, success: boolean }> }
 */

const applyPatchTask = defineTask('apply-patch', (args) => {
  const unifiedPatch = args.hunks.join('\n');
  return {
    kind: 'shell',
    title: `Apply patch to ${args.file}`,
    shell: {
      command: `printf '%s' ${shellEscape(unifiedPatch)} | git apply --check - 2>/dev/null && printf '%s' ${shellEscape(unifiedPatch)} | git apply - && echo '{"success":true}' || echo '{"success":false}'`,
    },
  };
});

const manualApplyTask = defineTask('manual-apply', (args) => ({
  kind: 'agent',
  title: `Manually apply patch to ${args.file}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Diff applier',
      task: `Apply the following patch hunks to the file "${args.file}"`,
      context: {
        file: args.file,
        hunks: args.hunks,
      },
      instructions: [
        `Read the file "${args.file}".`,
        'Apply each hunk in order, matching context lines to find the correct location.',
        'If a hunk cannot be applied cleanly, make a best-effort fuzzy match.',
        'Write the modified file back.',
        'Return a JSON object: { "success": true } if all hunks applied, { "success": false } otherwise.',
      ],
      outputFormat: 'JSON',
    },
  },
}));

export async function process(inputs, ctx) {
  const results = [];
  let applied = 0;
  let failed = 0;

  for (const patch of inputs.patches) {
    let result = await ctx.task(applyPatchTask, patch);

    if (!result.success) {
      // git apply failed — try agent-based manual application
      result = await ctx.task(manualApplyTask, patch);
    }

    if (result.success) {
      applied++;
    } else {
      failed++;
    }

    results.push({ file: patch.file, success: result.success });
  }

  return { applied, failed, results };
}

function shellEscape(str) {
  return "'" + str.replace(/'/g, "'\\''") + "'";
}
