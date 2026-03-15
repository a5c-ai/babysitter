/**
 * @process specializations/programming-languages/language-grammar-design
 * @description Language Grammar Design - Systematic process for designing and documenting formal grammars for programming
 * languages. Covers context-free grammar design, disambiguation, operator precedence, and grammar validation.
 * @inputs { languageName: string, paradigm?: string, parsingStrategy?: string, referenceLanguages?: array, outputDir?: string }
 * @outputs { success: boolean, grammarSpec: object, tokenDefinitions: object, precedenceTable: object, documentation: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/programming-languages/language-grammar-design', {
 *   languageName: 'MyLang',
 *   paradigm: 'multi-paradigm',
 *   parsingStrategy: 'LL(k)',
 *   referenceLanguages: ['Rust', 'TypeScript', 'Go']
 * });
 *
 * @references
 * - Dragon Book: Compilers: Principles, Techniques, and Tools
 * - Engineering a Compiler by Cooper & Torczon
 * - ANTLR Reference: https://www.antlr.org/
 * - Parsing Techniques: A Practical Guide by Grune & Jacobs
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    languageName,
    paradigm = 'multi-paradigm',
    parsingStrategy = 'LL(k)',
    referenceLanguages = [],
    targetDomain = 'general-purpose',
    syntaxStyle = 'c-family',
    expressionOriented = false,
    outputDir = 'language-grammar-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Language Grammar Design: ${languageName}`);
  ctx.log('info', `Paradigm: ${paradigm}, Parsing Strategy: ${parsingStrategy}`);

  // ============================================================================
  // PHASE 1: LANGUAGE GOALS DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining Language Goals');

  const languageGoals = await ctx.task(languageGoalsTask, {
    languageName,
    paradigm,
    targetDomain,
    referenceLanguages,
    syntaxStyle,
    expressionOriented,
    outputDir
  });

  artifacts.push(...languageGoals.artifacts);

  await ctx.breakpoint({
    question: `Language goals defined for ${languageName}. Target domain: ${targetDomain}, paradigm: ${paradigm}. Key features: ${languageGoals.keyFeatures.join(', ')}. Proceed with syntax design?`,
    title: 'Language Goals Review',
    context: {
      runId: ctx.runId,
      languageName,
      paradigm,
      keyFeatures: languageGoals.keyFeatures,
      designPrinciples: languageGoals.designPrinciples,
      files: languageGoals.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 2: CORE SYNTAX DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing Core Syntax');

  const coreSyntax = await ctx.task(coreSyntaxDesignTask, {
    languageName,
    languageGoals,
    referenceLanguages,
    syntaxStyle,
    expressionOriented,
    outputDir
  });

  artifacts.push(...coreSyntax.artifacts);

  // ============================================================================
  // PHASE 3: LEXICAL GRAMMAR DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 3: Designing Lexical Grammar');

  const lexicalGrammar = await ctx.task(lexicalGrammarTask, {
    languageName,
    coreSyntax,
    languageGoals,
    outputDir
  });

  artifacts.push(...lexicalGrammar.artifacts);

  // ============================================================================
  // PHASE 4: SYNTACTIC GRAMMAR FORMALIZATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Formalizing Syntactic Grammar');

  const syntacticGrammar = await ctx.task(syntacticGrammarTask, {
    languageName,
    parsingStrategy,
    coreSyntax,
    lexicalGrammar,
    outputDir
  });

  artifacts.push(...syntacticGrammar.artifacts);

  // ============================================================================
  // PHASE 5: OPERATOR PRECEDENCE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 5: Designing Operator Precedence');

  const operatorPrecedence = await ctx.task(operatorPrecedenceTask, {
    languageName,
    coreSyntax,
    referenceLanguages,
    outputDir
  });

  artifacts.push(...operatorPrecedence.artifacts);

  // ============================================================================
  // PHASE 6: AMBIGUITY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Analyzing Grammar Ambiguity');

  const ambiguityAnalysis = await ctx.task(ambiguityAnalysisTask, {
    languageName,
    parsingStrategy,
    syntacticGrammar,
    operatorPrecedence,
    outputDir
  });

  artifacts.push(...ambiguityAnalysis.artifacts);

  await ctx.breakpoint({
    question: `Ambiguity analysis complete. Found ${ambiguityAnalysis.conflicts.length} potential conflicts. ${ambiguityAnalysis.resolved ? 'All resolved.' : 'Requires attention.'} Continue with validation?`,
    title: 'Ambiguity Analysis Review',
    context: {
      runId: ctx.runId,
      conflicts: ambiguityAnalysis.conflicts,
      resolutions: ambiguityAnalysis.resolutions,
      files: ambiguityAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 7: GRAMMAR VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Validating Grammar');

  const grammarValidation = await ctx.task(grammarValidationTask, {
    languageName,
    parsingStrategy,
    syntacticGrammar,
    lexicalGrammar,
    ambiguityAnalysis,
    outputDir
  });

  artifacts.push(...grammarValidation.artifacts);

  // ============================================================================
  // PHASE 8: EXAMPLE PROGRAMS
  // ============================================================================

  ctx.log('info', 'Phase 8: Creating Example Programs');

  const examplePrograms = await ctx.task(exampleProgramsTask, {
    languageName,
    languageGoals,
    coreSyntax,
    outputDir
  });

  artifacts.push(...examplePrograms.artifacts);

  // ============================================================================
  // PHASE 9: GRAMMAR DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Generating Grammar Documentation');

  const documentation = await ctx.task(grammarDocumentationTask, {
    languageName,
    languageGoals,
    coreSyntax,
    lexicalGrammar,
    syntacticGrammar,
    operatorPrecedence,
    examplePrograms,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // ============================================================================
  // PHASE 10: FINAL REVIEW
  // ============================================================================

  ctx.log('info', 'Phase 10: Final Grammar Review');

  const finalReview = await ctx.task(grammarFinalReviewTask, {
    languageName,
    languageGoals,
    syntacticGrammar,
    lexicalGrammar,
    grammarValidation,
    documentation,
    outputDir
  });

  artifacts.push(...finalReview.artifacts);

  await ctx.breakpoint({
    question: `Grammar Design Complete for ${languageName}! Validation score: ${grammarValidation.score}/100. ${syntacticGrammar.productionCount} productions, ${lexicalGrammar.tokenCount} token types. Review deliverables?`,
    title: 'Grammar Design Complete',
    context: {
      runId: ctx.runId,
      summary: {
        languageName,
        paradigm,
        parsingStrategy,
        productionCount: syntacticGrammar.productionCount,
        tokenCount: lexicalGrammar.tokenCount,
        validationScore: grammarValidation.score,
        conflictsResolved: ambiguityAnalysis.resolved
      },
      files: [
        { path: documentation.specificationPath, format: 'markdown', label: 'Grammar Specification' },
        { path: documentation.ebnfPath, format: 'ebnf', label: 'EBNF Grammar' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: grammarValidation.score >= 80 && ambiguityAnalysis.resolved,
    languageName,
    grammarSpec: {
      paradigm,
      parsingStrategy,
      productions: syntacticGrammar.productions,
      productionCount: syntacticGrammar.productionCount,
      ebnfPath: documentation.ebnfPath
    },
    tokenDefinitions: {
      tokens: lexicalGrammar.tokens,
      tokenCount: lexicalGrammar.tokenCount,
      keywords: lexicalGrammar.keywords,
      operators: lexicalGrammar.operators
    },
    precedenceTable: {
      levels: operatorPrecedence.levels,
      operators: operatorPrecedence.operators,
      associativity: operatorPrecedence.associativity
    },
    validation: {
      score: grammarValidation.score,
      ambiguitiesResolved: ambiguityAnalysis.resolved,
      conflicts: ambiguityAnalysis.conflicts,
      testsPassed: grammarValidation.testsPassed
    },
    documentation: {
      specificationPath: documentation.specificationPath,
      ebnfPath: documentation.ebnfPath,
      examplesPath: examplePrograms.examplesPath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/programming-languages/language-grammar-design',
      timestamp: startTime,
      languageName,
      paradigm,
      parsingStrategy
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const languageGoalsTask = defineTask('language-goals', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Language Goals - ${args.languageName}`,
  agent: {
    name: 'compiler-frontend-architect',
    prompt: {
      role: 'Programming Language Designer',
      task: 'Define language design goals and principles',
      context: args,
      instructions: [
        '1. Identify target domain and primary use cases',
        '2. Define programming paradigm (OOP, FP, procedural, etc.)',
        '3. List desired syntactic features',
        '4. Study reference language syntaxes',
        '5. Define design principles (readability, safety, performance)',
        '6. Identify key differentiators from existing languages',
        '7. Define target audience (beginners, experts, domain specialists)',
        '8. Specify ergonomic goals (error messages, IDE support)',
        '9. Document assumptions and constraints',
        '10. Create language design goals document'
      ],
      outputFormat: 'JSON with language goals and design principles'
    },
    outputSchema: {
      type: 'object',
      required: ['keyFeatures', 'designPrinciples', 'artifacts'],
      properties: {
        keyFeatures: { type: 'array', items: { type: 'string' } },
        designPrinciples: { type: 'array', items: { type: 'string' } },
        targetAudience: { type: 'string' },
        useCases: { type: 'array', items: { type: 'string' } },
        differentiators: { type: 'array', items: { type: 'string' } },
        constraints: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'grammar', 'design-goals']
}));

export const coreSyntaxDesignTask = defineTask('core-syntax-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Core Syntax Design - ${args.languageName}`,
  agent: {
    name: 'compiler-frontend-architect',
    prompt: {
      role: 'Programming Language Syntax Designer',
      task: 'Design core language syntax',
      context: args,
      instructions: [
        '1. Design expression syntax (arithmetic, logical, comparison)',
        '2. Design statement syntax (assignment, control flow)',
        '3. Design declaration syntax (variables, functions, types)',
        '4. Define type annotation syntax',
        '5. Design comment syntax (single-line, multi-line, doc comments)',
        '6. Define string literal syntax (escapes, interpolation, raw strings)',
        '7. Design function call and method syntax',
        '8. Define control flow syntax (if, while, for, match)',
        '9. Design module/namespace syntax',
        '10. Create informal syntax examples'
      ],
      outputFormat: 'JSON with core syntax design'
    },
    outputSchema: {
      type: 'object',
      required: ['expressions', 'statements', 'declarations', 'artifacts'],
      properties: {
        expressions: { type: 'object' },
        statements: { type: 'object' },
        declarations: { type: 'object' },
        typeAnnotations: { type: 'object' },
        controlFlow: { type: 'object' },
        comments: { type: 'object' },
        examples: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'grammar', 'syntax-design']
}));

export const lexicalGrammarTask = defineTask('lexical-grammar', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Lexical Grammar - ${args.languageName}`,
  agent: {
    name: 'compiler-frontend-architect',
    prompt: {
      role: 'Lexical Grammar Designer',
      task: 'Design lexical grammar (token definitions)',
      context: args,
      instructions: [
        '1. Define keywords and reserved words',
        '2. Define identifier pattern (Unicode support)',
        '3. Define number literal formats (int, float, hex, binary, octal)',
        '4. Define string literal formats (escapes, raw, multiline)',
        '5. Define operator tokens (single and multi-character)',
        '6. Define punctuation tokens',
        '7. Define comment patterns',
        '8. Specify whitespace handling',
        '9. Define special tokens (EOF, NEWLINE if significant)',
        '10. Document token precedence for ambiguous matches'
      ],
      outputFormat: 'JSON with lexical grammar specification'
    },
    outputSchema: {
      type: 'object',
      required: ['tokens', 'tokenCount', 'keywords', 'operators', 'artifacts'],
      properties: {
        tokens: { type: 'array', items: { type: 'object' } },
        tokenCount: { type: 'number' },
        keywords: { type: 'array', items: { type: 'string' } },
        operators: { type: 'array', items: { type: 'string' } },
        literals: { type: 'object' },
        whitespace: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'grammar', 'lexical']
}));

export const syntacticGrammarTask = defineTask('syntactic-grammar', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Syntactic Grammar - ${args.languageName}`,
  agent: {
    name: 'compiler-frontend-architect',
    prompt: {
      role: 'Formal Grammar Specialist',
      task: 'Formalize syntactic grammar in EBNF notation',
      context: args,
      instructions: [
        '1. Convert syntax examples to EBNF/BNF notation',
        '2. Define program structure (top-level)',
        '3. Define expression grammar',
        '4. Define statement grammar',
        '5. Define declaration grammar',
        '6. Define type grammar',
        '7. Handle operator precedence in grammar',
        '8. Ensure grammar matches parsing strategy (LL/LR/PEG)',
        '9. Eliminate left recursion if needed for LL parsing',
        '10. Document each production with comments'
      ],
      outputFormat: 'JSON with syntactic grammar specification'
    },
    outputSchema: {
      type: 'object',
      required: ['productions', 'productionCount', 'startSymbol', 'artifacts'],
      properties: {
        productions: { type: 'array', items: { type: 'object' } },
        productionCount: { type: 'number' },
        startSymbol: { type: 'string' },
        nonTerminals: { type: 'array', items: { type: 'string' } },
        terminals: { type: 'array', items: { type: 'string' } },
        ebnfText: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'grammar', 'syntactic']
}));

export const operatorPrecedenceTask = defineTask('operator-precedence', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Operator Precedence - ${args.languageName}`,
  agent: {
    name: 'compiler-frontend-architect',
    prompt: {
      role: 'Operator Precedence Designer',
      task: 'Design operator precedence and associativity',
      context: args,
      instructions: [
        '1. List all operators by category',
        '2. Define precedence levels (highest to lowest)',
        '3. Define associativity for each operator (left, right, none)',
        '4. Handle comparison operators (chaining behavior)',
        '5. Handle assignment operators',
        '6. Design ternary operator precedence',
        '7. Consider prefix vs postfix operators',
        '8. Align with reference languages where intuitive',
        '9. Document unusual precedence decisions',
        '10. Create precedence table'
      ],
      outputFormat: 'JSON with operator precedence table'
    },
    outputSchema: {
      type: 'object',
      required: ['levels', 'operators', 'associativity', 'artifacts'],
      properties: {
        levels: { type: 'array', items: { type: 'object' } },
        operators: { type: 'object' },
        associativity: { type: 'object' },
        specialCases: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'grammar', 'operators']
}));

export const ambiguityAnalysisTask = defineTask('ambiguity-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Ambiguity Analysis - ${args.languageName}`,
  agent: {
    name: 'compiler-frontend-architect',
    prompt: {
      role: 'Grammar Ambiguity Analyst',
      task: 'Analyze and resolve grammar ambiguities',
      context: args,
      instructions: [
        '1. Check for shift-reduce conflicts',
        '2. Check for reduce-reduce conflicts',
        '3. Identify dangling-else ambiguity',
        '4. Check expression/statement ambiguity',
        '5. Identify type annotation ambiguities',
        '6. Check generics syntax ambiguity (< vs comparison)',
        '7. Apply disambiguation rules',
        '8. Document resolution strategies',
        '9. Test ambiguous cases with parser',
        '10. Verify single parse tree for all valid programs'
      ],
      outputFormat: 'JSON with ambiguity analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['conflicts', 'resolved', 'resolutions', 'artifacts'],
      properties: {
        conflicts: { type: 'array', items: { type: 'object' } },
        resolved: { type: 'boolean' },
        resolutions: { type: 'array', items: { type: 'object' } },
        disambiguationRules: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'grammar', 'ambiguity']
}));

export const grammarValidationTask = defineTask('grammar-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Grammar Validation - ${args.languageName}`,
  agent: {
    name: 'compiler-frontend-architect',
    prompt: {
      role: 'Grammar Validation Engineer',
      task: 'Validate grammar specification',
      context: args,
      instructions: [
        '1. Verify all productions are reachable',
        '2. Check for unreachable non-terminals',
        '3. Verify grammar is compatible with parsing strategy',
        '4. Test representative programs parse correctly',
        '5. Verify error recovery behavior',
        '6. Check grammar completeness',
        '7. Validate token definitions cover all cases',
        '8. Test edge cases (empty input, max nesting)',
        '9. Verify precedence table correctness',
        '10. Calculate validation score'
      ],
      outputFormat: 'JSON with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'testsPassed', 'issues', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        testsPassed: { type: 'number' },
        testsTotal: { type: 'number' },
        issues: { type: 'array', items: { type: 'object' } },
        warnings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'grammar', 'validation']
}));

export const exampleProgramsTask = defineTask('example-programs', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Example Programs - ${args.languageName}`,
  agent: {
    name: 'compiler-frontend-architect',
    prompt: {
      role: 'Language Example Writer',
      task: 'Create example programs demonstrating syntax',
      context: args,
      instructions: [
        '1. Create hello world example',
        '2. Create variable declaration examples',
        '3. Create function definition examples',
        '4. Create control flow examples',
        '5. Create expression examples (all operators)',
        '6. Create type annotation examples',
        '7. Create class/struct examples',
        '8. Create module/import examples',
        '9. Create error handling examples',
        '10. Create comprehensive sample program'
      ],
      outputFormat: 'JSON with example programs'
    },
    outputSchema: {
      type: 'object',
      required: ['examples', 'examplesPath', 'artifacts'],
      properties: {
        examples: { type: 'array', items: { type: 'object' } },
        examplesPath: { type: 'string' },
        categories: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'grammar', 'examples']
}));

export const grammarDocumentationTask = defineTask('grammar-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Grammar Documentation - ${args.languageName}`,
  agent: {
    name: 'compiler-frontend-architect',
    prompt: {
      role: 'Technical Documentation Writer',
      task: 'Generate comprehensive grammar documentation',
      context: args,
      instructions: [
        '1. Create grammar reference document',
        '2. Document each production with examples',
        '3. Create lexical specification document',
        '4. Document operator precedence table',
        '5. Create syntax diagram/railroad diagrams',
        '6. Document design rationale',
        '7. Add comparison with reference languages',
        '8. Create quick reference card',
        '9. Add grammar change history',
        '10. Generate EBNF file'
      ],
      outputFormat: 'JSON with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['specificationPath', 'ebnfPath', 'artifacts'],
      properties: {
        specificationPath: { type: 'string' },
        ebnfPath: { type: 'string' },
        quickReferencePath: { type: 'string' },
        sections: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'grammar', 'documentation']
}));

export const grammarFinalReviewTask = defineTask('grammar-final-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Final Review - ${args.languageName}`,
  agent: {
    name: 'compiler-frontend-architect',
    prompt: {
      role: 'Language Design Lead',
      task: 'Conduct final grammar review',
      context: args,
      instructions: [
        '1. Review grammar completeness',
        '2. Verify design goals are met',
        '3. Check documentation quality',
        '4. Review example programs',
        '5. Verify validation results',
        '6. Identify areas for future enhancement',
        '7. Create implementation recommendations',
        '8. List known limitations',
        '9. Prepare handoff documentation',
        '10. Generate final review report'
      ],
      outputFormat: 'JSON with final review results'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'limitations', 'artifacts'],
      properties: {
        recommendations: { type: 'array', items: { type: 'string' } },
        limitations: { type: 'array', items: { type: 'string' } },
        futureEnhancements: { type: 'array', items: { type: 'string' } },
        implementationNotes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'grammar', 'final-review']
}));
