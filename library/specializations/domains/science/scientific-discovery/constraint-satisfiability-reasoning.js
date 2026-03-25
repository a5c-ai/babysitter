/**
 * @process Constraint Satisfiability Reasoning
 * @description Encode requirements as constraints and solve (SAT/SMT/CSP)
 * @category Scientific Discovery - Formal and Mathematical Reasoning
 * @inputs {{ context: object, problem: string }}
 * @outputs {{ analysis: object, conclusions: array, recommendations: array }}
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const analyzeTask = defineTask('constraint-satisfiability-reasoning-analyze', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Constraint Satisfiability Reasoning Analysis',
  agent: {
    name: 'assumption-auditor',
    skills: ['formal-logic-reasoner', 'constraint-solver', 'hypothesis-generator'],
    prompt: {
      role: 'Scientific reasoning specialist in constraint satisfaction and satisfiability solving',
      task: 'Apply constraint satisfiability reasoning by encoding requirements as constraints and solving using SAT/SMT/CSP techniques',
      context: args,
      instructions: [
        'Identify variables and their domains from the problem',
        'Extract constraints from requirements and specifications',
        'Choose appropriate constraint formalism (SAT, SMT, CSP)',
        'Encode the problem in the chosen formalism',
        'Apply appropriate solving techniques (DPLL, CDCL, propagation)',
        'If satisfiable, extract and verify the solution',
        'If unsatisfiable, identify minimal unsatisfiable cores',
        'Consider optimization variants (MaxSAT, optimization modulo theories)',
        'Document the encoding and solving strategy',
        'Analyze the computational complexity of the problem',
        'Identify symmetry breaking and other optimization opportunities'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        analysis: {
          type: 'object',
          properties: {
            variables: { type: 'array', items: { type: 'object' } },
            domains: { type: 'object' },
            constraints: { type: 'array', items: { type: 'string' } },
            formalism: { type: 'string', enum: ['SAT', 'SMT', 'CSP', 'MaxSAT', 'OMT'] },
            encoding: { type: 'string' },
            solvingStrategy: { type: 'string' },
            solution: { type: 'object' },
            unsatCore: { type: 'array', items: { type: 'string' } }
          }
        },
        conclusions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              statement: { type: 'string' },
              satisfiability: { type: 'string', enum: ['SAT', 'UNSAT', 'UNKNOWN'] },
              assignment: { type: 'object' }
            }
          }
        },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        satisfiable: { type: 'boolean' },
        solutionFound: { type: 'boolean' },
        complexity: { type: 'string' }
      },
      required: ['analysis', 'conclusions']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

export async function process(inputs, ctx) {
  const result = await ctx.task(analyzeTask, {
    problem: inputs.problem,
    context: inputs.context
  });

  return {
    success: true,
    reasoningType: 'Constraint Satisfiability Reasoning',
    analysis: result.analysis,
    conclusions: result.conclusions,
    confidence: result.confidence,
    satisfiable: result.satisfiable,
    solutionFound: result.solutionFound,
    complexity: result.complexity
  };
}
