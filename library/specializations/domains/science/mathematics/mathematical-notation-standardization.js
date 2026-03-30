/**
 * @process specializations/domains/science/mathematics/mathematical-notation-standardization
 * @description Ensure consistent mathematical notation throughout documents and codebases.
 * Includes notation glossaries and automatic notation checking.
 * @inputs { documents: array, existingNotation?: object, domain?: string, enforceStandard?: string }
 * @outputs { success: boolean, standardizedNotation: object, notationGlossary: array, inconsistencies: array, recommendations: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/mathematics/mathematical-notation-standardization', {
 *   documents: [{ name: 'chapter1.tex', content: '...' }, { name: 'chapter2.tex', content: '...' }],
 *   existingNotation: { vectors: 'bold', matrices: 'uppercase' },
 *   domain: 'linear-algebra',
 *   enforceStandard: 'ISO-80000-2'
 * });
 *
 * @references
 * - ISO 80000-2: Mathematical signs and symbols
 * - AMS Style Guide
 * - Chicago Manual of Style for Mathematics
 * - Unicode Technical Report for Mathematics
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    documents,
    existingNotation = {},
    domain = 'general',
    enforceStandard = null
  } = inputs;

  // Phase 1: Define Notation Conventions
  const conventionDefinition = await ctx.task(conventionDefinitionTask, {
    documents,
    existingNotation,
    domain,
    enforceStandard
  });

  // Quality Gate: Conventions must be definable
  if (!conventionDefinition.conventions) {
    return {
      success: false,
      error: 'Unable to define notation conventions',
      phase: 'convention-definition',
      standardizedNotation: null
    };
  }

  // Breakpoint: Review notation conventions
  await ctx.breakpoint({
    question: `Defined ${conventionDefinition.conventions.length} notation conventions for ${domain}. Review?`,
    title: 'Notation Convention Review',
    context: {
      runId: ctx.runId,
      domain,
      conventions: conventionDefinition.conventions,
      files: [{
        path: `artifacts/phase1-conventions.json`,
        format: 'json',
        content: conventionDefinition
      }]
    }
  });

  // Phase 2: Check Notation Consistency
  const consistencyCheck = await ctx.task(consistencyCheckTask, {
    documents,
    conventions: conventionDefinition.conventions
  });

  // Phase 3: Generate Notation Glossary
  const glossaryGeneration = await ctx.task(glossaryGenerationTask, {
    conventions: conventionDefinition.conventions,
    documents,
    domain
  });

  // Phase 4: Suggest Standardized Alternatives
  const standardizationSuggestions = await ctx.task(standardizationSuggestionsTask, {
    inconsistencies: consistencyCheck.inconsistencies,
    conventions: conventionDefinition.conventions,
    existingNotation
  });

  // Phase 5: Document Notation Choices
  const notationDocumentation = await ctx.task(notationDocumentationTask, {
    conventions: conventionDefinition.conventions,
    glossary: glossaryGeneration.glossary,
    standardizationSuggestions,
    domain
  });

  // Final Breakpoint: Standardization Complete
  await ctx.breakpoint({
    question: `Notation standardization complete. Found ${consistencyCheck.inconsistencies.length} inconsistencies. Review results?`,
    title: 'Notation Standardization Complete',
    context: {
      runId: ctx.runId,
      inconsistencyCount: consistencyCheck.inconsistencies.length,
      glossaryEntries: glossaryGeneration.glossary.length,
      files: [
        { path: `artifacts/notation-glossary.json`, format: 'json', content: glossaryGeneration },
        { path: `artifacts/standardization-report.json`, format: 'json', content: { consistencyCheck, standardizationSuggestions } }
      ]
    }
  });

  return {
    success: true,
    documents: documents.map(d => d.name),
    standardizedNotation: {
      conventions: conventionDefinition.conventions,
      standard: enforceStandard
    },
    notationGlossary: glossaryGeneration.glossary,
    inconsistencies: consistencyCheck.inconsistencies,
    recommendations: standardizationSuggestions.suggestions,
    documentation: notationDocumentation.document,
    metadata: {
      processId: 'specializations/domains/science/mathematics/mathematical-notation-standardization',
      domain,
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const conventionDefinitionTask = defineTask('convention-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Define Notation Conventions`,
  agent: {
    name: 'mathematics-writer',
    skills: ['latex-math-formatter', 'sympy-computer-algebra', 'special-functions-library'],
    prompt: {
      role: 'Mathematical Notation Standards Expert',
      task: 'Define notation conventions for the mathematical domain',
      context: {
        documents: args.documents,
        existingNotation: args.existingNotation,
        domain: args.domain,
        enforceStandard: args.enforceStandard
      },
      instructions: [
        '1. Identify mathematical domain and subdomain',
        '2. Define vector notation convention (bold, arrow, underline)',
        '3. Define matrix notation convention',
        '4. Define set notation convention',
        '5. Define function notation convention',
        '6. Define operator notation',
        '7. Define index conventions',
        '8. Map to ISO/standard conventions if required',
        '9. Document exceptions and special cases',
        '10. Create convention specification'
      ],
      outputFormat: 'JSON object with notation conventions'
    },
    outputSchema: {
      type: 'object',
      required: ['conventions', 'domain'],
      properties: {
        domain: { type: 'string' },
        conventions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              convention: { type: 'string' },
              latex: { type: 'string' },
              standard: { type: 'string' },
              examples: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        standardReference: { type: 'string' },
        exceptions: { type: 'array', items: { type: 'object' } },
        domainSpecific: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'notation', 'conventions']
}));

export const consistencyCheckTask = defineTask('consistency-check', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Check Notation Consistency`,
  agent: {
    name: 'mathematics-writer',
    skills: ['latex-math-formatter', 'sympy-computer-algebra'],
    prompt: {
      role: 'Notation Consistency Auditor',
      task: 'Check notation consistency across documents',
      context: {
        documents: args.documents,
        conventions: args.conventions
      },
      instructions: [
        '1. Scan all documents for mathematical notation',
        '2. Identify notation for each symbol/concept',
        '3. Check against defined conventions',
        '4. Identify inconsistencies between documents',
        '5. Identify inconsistencies within documents',
        '6. Flag non-standard notation',
        '7. Note ambiguous notation',
        '8. Check subscript/superscript conventions',
        '9. Verify delimiter usage',
        '10. Generate consistency report'
      ],
      outputFormat: 'JSON object with consistency check results'
    },
    outputSchema: {
      type: 'object',
      required: ['inconsistencies', 'consistencyScore'],
      properties: {
        inconsistencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              symbol: { type: 'string' },
              document: { type: 'string' },
              location: { type: 'string' },
              found: { type: 'string' },
              expected: { type: 'string' },
              severity: { type: 'string', enum: ['error', 'warning', 'suggestion'] }
            }
          }
        },
        consistencyScore: { type: 'number', minimum: 0, maximum: 100 },
        symbolUsage: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              symbol: { type: 'string' },
              meanings: { type: 'array', items: { type: 'string' } },
              consistent: { type: 'boolean' }
            }
          }
        },
        ambiguousNotation: { type: 'array', items: { type: 'string' } },
        nonStandardNotation: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'notation', 'consistency']
}));

export const glossaryGenerationTask = defineTask('glossary-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Generate Notation Glossary`,
  agent: {
    name: 'mathematics-writer',
    skills: ['latex-math-formatter', 'sympy-computer-algebra', 'special-functions-library'],
    prompt: {
      role: 'Mathematical Glossary Expert',
      task: 'Generate comprehensive notation glossary',
      context: {
        conventions: args.conventions,
        documents: args.documents,
        domain: args.domain
      },
      instructions: [
        '1. Extract all symbols used in documents',
        '2. Define each symbol clearly',
        '3. Provide LaTeX representation',
        '4. Include first occurrence reference',
        '5. Group by category (variables, operators, etc.)',
        '6. Add pronunciation guides',
        '7. Note alternative notations',
        '8. Include dimensional information',
        '9. Cross-reference related symbols',
        '10. Generate formatted glossary'
      ],
      outputFormat: 'JSON object with notation glossary'
    },
    outputSchema: {
      type: 'object',
      required: ['glossary'],
      properties: {
        glossary: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              symbol: { type: 'string' },
              latex: { type: 'string' },
              name: { type: 'string' },
              definition: { type: 'string' },
              category: { type: 'string' },
              firstOccurrence: { type: 'string' },
              pronunciation: { type: 'string' },
              alternatives: { type: 'array', items: { type: 'string' } },
              relatedSymbols: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        categories: { type: 'array', items: { type: 'string' } },
        formattedGlossary: { type: 'string' },
        latexGlossary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'notation', 'glossary']
}));

export const standardizationSuggestionsTask = defineTask('standardization-suggestions', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Suggest Standardized Alternatives`,
  agent: {
    name: 'mathematics-writer',
    skills: ['latex-math-formatter', 'sympy-computer-algebra'],
    prompt: {
      role: 'Notation Standardization Advisor',
      task: 'Suggest standardized alternatives for notation issues',
      context: {
        inconsistencies: args.inconsistencies,
        conventions: args.conventions,
        existingNotation: args.existingNotation
      },
      instructions: [
        '1. Analyze each inconsistency',
        '2. Suggest standardized alternative',
        '3. Explain benefit of standard notation',
        '4. Consider backward compatibility',
        '5. Prioritize suggestions by impact',
        '6. Provide LaTeX implementation',
        '7. Consider typographical concerns',
        '8. Note any trade-offs',
        '9. Provide migration path',
        '10. Document suggestions'
      ],
      outputFormat: 'JSON object with standardization suggestions'
    },
    outputSchema: {
      type: 'object',
      required: ['suggestions'],
      properties: {
        suggestions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              current: { type: 'string' },
              suggested: { type: 'string' },
              latex: { type: 'string' },
              benefit: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] },
              effort: { type: 'string' }
            }
          }
        },
        migrationSteps: { type: 'array', items: { type: 'string' } },
        customMacros: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              macro: { type: 'string' },
              definition: { type: 'string' },
              purpose: { type: 'string' }
            }
          }
        },
        backwardCompatibility: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'notation', 'standardization']
}));

export const notationDocumentationTask = defineTask('notation-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Document Notation Choices`,
  agent: {
    name: 'mathematics-writer',
    skills: ['latex-math-formatter', 'bibtex-reference-manager', 'sympy-computer-algebra'],
    prompt: {
      role: 'Mathematical Documentation Expert',
      task: 'Create comprehensive notation documentation',
      context: {
        conventions: args.conventions,
        glossary: args.glossary,
        standardizationSuggestions: args.standardizationSuggestions,
        domain: args.domain
      },
      instructions: [
        '1. Write notation guide introduction',
        '2. Document all conventions with rationale',
        '3. Include glossary',
        '4. Document any deviations from standards',
        '5. Provide LaTeX macros file',
        '6. Include usage examples',
        '7. Document common pitfalls',
        '8. Provide quick reference card',
        '9. Include change log if applicable',
        '10. Generate final documentation'
      ],
      outputFormat: 'JSON object with notation documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['document', 'macrosFile'],
      properties: {
        document: {
          type: 'object',
          properties: {
            introduction: { type: 'string' },
            conventions: { type: 'string' },
            glossary: { type: 'string' },
            deviations: { type: 'string' },
            examples: { type: 'string' },
            pitfalls: { type: 'string' }
          }
        },
        macrosFile: { type: 'string' },
        quickReference: { type: 'string' },
        changeLog: { type: 'array', items: { type: 'object' } },
        markdownVersion: { type: 'string' },
        latexVersion: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'notation', 'documentation']
}));
