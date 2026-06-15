import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * @process microagent/schema-generator
 * @description Generates schemas (JSON Schema, TypeBox, Zod, Yup) from example data.
 * @inputs { examples: unknown[], description: string, format: string }
 * @outputs { schema: object, format: string }
 */

const generateTask = defineTask('generate-schema', (args) => ({
  kind: 'agent',
  title: `Generate ${args.format} schema from ${args.examples.length} example(s)`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Schema engineer',
      task: `Infer a ${args.format} schema from the provided example data`,
      context: {
        examples: args.examples,
        description: args.description,
        format: args.format,
      },
      instructions: [
        `Analyze the ${args.examples.length} example value(s) to infer the common shape.`,
        `The user describes the desired schema as: "${args.description}"`,
        'Infer types from the examples: detect strings, numbers, booleans, arrays, objects, nulls.',
        'Mark fields that appear in every example as required.',
        'For arrays, infer the item schema from all observed elements.',
        'For enums, if a field has a small finite set of values across examples, use enum.',
        formatInstructions(args.format),
        'Return a JSON object: { "schema": <the schema object>, "format": "<format>" }',
      ],
      outputFormat: 'JSON',
    },
  },
}));

export async function process(inputs, ctx) {
  const result = await ctx.task(generateTask, inputs);
  return { schema: result.schema, format: inputs.format };
}

function formatInstructions(format) {
  switch (format) {
    case 'json-schema':
      return 'Output a standard JSON Schema (draft-07 or later) with $schema, type, properties, required.';
    case 'typebox':
      return 'Output TypeBox schema code as a string (e.g. Type.Object({ name: Type.String(), ... })).';
    case 'zod':
      return 'Output Zod schema code as a string (e.g. z.object({ name: z.string(), ... })).';
    case 'yup':
      return 'Output Yup schema code as a string (e.g. yup.object({ name: yup.string().required(), ... })).';
    default:
      return 'Output a standard JSON Schema.';
  }
}
