import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * @process microagent/system-integrator
 * @description Integrates with external systems by dispatching parameterized operations.
 * @inputs { system: string, operation: string, params: object }
 * @outputs { response: object, statusCode: number }
 */

const dispatchTask = defineTask('dispatch-operation', (args) => ({
  kind: 'agent',
  title: `${args.system}: ${args.operation}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'System integration dispatcher',
      task: `Execute the "${args.operation}" operation on the "${args.system}" system`,
      context: {
        system: args.system,
        operation: args.operation,
        params: args.params,
      },
      instructions: [
        `You are integrating with the "${args.system}" system.`,
        `Perform the "${args.operation}" operation using the provided parameters.`,
        'Use the appropriate CLI tool, API call, or SDK invocation for this system.',
        `For "github": use gh CLI commands.`,
        `For "slack": use Slack MCP tools if available.`,
        `For "jira": use the JIRA REST API via curl.`,
        'For other systems: use the most appropriate available tool.',
        'Return a JSON object: { "response": <result payload>, "statusCode": 0 } on success.',
        'On failure return: { "response": { "error": "<message>" }, "statusCode": 1 }.',
      ],
      outputFormat: 'JSON',
    },
  },
}));

export async function process(inputs, ctx) {
  const result = await ctx.task(dispatchTask, inputs);
  return { response: result.response, statusCode: result.statusCode };
}
