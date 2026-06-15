import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * @process microagent/format-converter
 * @description Converts data between serialization formats (JSON, YAML, TOML, CSV, XML).
 * @inputs { source: string, sourceFormat: string, targetFormat: string }
 * @outputs { result: string, targetFormat: string }
 */

const convertTask = defineTask('convert', (args) => ({
  kind: 'agent',
  title: `Convert ${args.sourceFormat} to ${args.targetFormat}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Format converter',
      task: `Convert the provided ${args.sourceFormat} content to ${args.targetFormat} format`,
      context: { source: args.source, sourceFormat: args.sourceFormat, targetFormat: args.targetFormat },
      instructions: [
        `Parse the input as ${args.sourceFormat}`,
        `Convert to ${args.targetFormat} format`,
        'Return ONLY the converted output as a JSON object: { "result": "<converted content>", "targetFormat": "<format>" }',
      ],
      outputFormat: 'JSON',
    },
  },
}));

export async function process(inputs, ctx) {
  const result = await ctx.task(convertTask, inputs);
  return { result: result.result, targetFormat: inputs.targetFormat };
}
