/**
 * @process specializations/domains/science/mathematics/latex-document-generation
 * @description Generate properly formatted LaTeX documents for mathematical content.
 * Includes theorem environments, equation formatting, and bibliography management.
 * @inputs { content: object, documentType?: string, style?: string, bibliography?: array }
 * @outputs { success: boolean, latexDocument: string, compilationInstructions: object, packages: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/mathematics/latex-document-generation', {
 *   content: { title: 'On the Convergence of...', sections: [...], theorems: [...] },
 *   documentType: 'article',
 *   style: 'amsart',
 *   bibliography: [{ key: 'smith2020', title: '...' }]
 * });
 *
 * @references
 * - LaTeX Project: https://www.latex-project.org/
 * - AMS-LaTeX: https://www.ams.org/publications/authors/tex/amslatex
 * - CTAN: https://ctan.org/
 * - Overleaf Documentation: https://www.overleaf.com/learn
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    content,
    documentType = 'article',
    style = 'amsart',
    bibliography = []
  } = inputs;

  // Phase 1: Structure Document Layout
  const documentStructure = await ctx.task(documentStructureTask, {
    content,
    documentType,
    style
  });

  // Quality Gate: Structure must be valid
  if (!documentStructure.structure) {
    return {
      success: false,
      error: 'Unable to structure document',
      phase: 'structure',
      latexDocument: null
    };
  }

  // Breakpoint: Review document structure
  await ctx.breakpoint({
    question: `Document structure created with ${documentStructure.sections.length} sections. Review layout?`,
    title: 'Document Structure Review',
    context: {
      runId: ctx.runId,
      documentType,
      sections: documentStructure.sections,
      files: [{
        path: `artifacts/phase1-structure.json`,
        format: 'json',
        content: documentStructure
      }]
    }
  });

  // Phase 2: Format Mathematical Expressions
  const mathFormatting = await ctx.task(mathFormattingTask, {
    content,
    documentStructure
  });

  // Phase 3: Set Up Theorem Environments
  const theoremEnvironments = await ctx.task(theoremEnvironmentsTask, {
    content,
    style,
    documentStructure
  });

  // Phase 4: Manage Bibliography
  const bibliographyManagement = await ctx.task(bibliographyManagementTask, {
    bibliography,
    content,
    style
  });

  // Phase 5: Ensure Consistent Notation
  const notationConsistency = await ctx.task(notationConsistencyTask, {
    content,
    mathFormatting,
    documentStructure
  });

  // Generate final LaTeX document
  const finalDocument = await ctx.task(finalDocumentGenerationTask, {
    documentStructure,
    mathFormatting,
    theoremEnvironments,
    bibliographyManagement,
    notationConsistency,
    documentType,
    style
  });

  // Final Breakpoint: Document Complete
  await ctx.breakpoint({
    question: `LaTeX document generated (${finalDocument.lineCount} lines). Preview and approve?`,
    title: 'Document Generation Complete',
    context: {
      runId: ctx.runId,
      lineCount: finalDocument.lineCount,
      packages: finalDocument.packages,
      files: [
        { path: `artifacts/document.tex`, format: 'latex', content: finalDocument.latex },
        { path: `artifacts/references.bib`, format: 'bibtex', content: bibliographyManagement.bibtex }
      ]
    }
  });

  return {
    success: true,
    latexDocument: finalDocument.latex,
    preamble: finalDocument.preamble,
    mainBody: finalDocument.body,
    bibliography: bibliographyManagement.bibtex,
    compilationInstructions: {
      compiler: finalDocument.recommendedCompiler,
      commands: finalDocument.compilationCommands,
      dependencies: finalDocument.packages
    },
    packages: finalDocument.packages,
    customCommands: notationConsistency.customCommands,
    metadata: {
      processId: 'specializations/domains/science/mathematics/latex-document-generation',
      documentType,
      style,
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const documentStructureTask = defineTask('document-structure', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Structure Document Layout`,
  agent: {
    name: 'mathematics-writer',
    skills: ['latex-math-formatter', 'sympy-computer-algebra', 'bibtex-reference-manager'],
    prompt: {
      role: 'LaTeX Document Structuring Expert',
      task: 'Create the structure and layout for the LaTeX document',
      context: {
        content: args.content,
        documentType: args.documentType,
        style: args.style
      },
      instructions: [
        '1. Determine appropriate document class',
        '2. Structure sections and subsections',
        '3. Plan theorem/proof organization',
        '4. Determine figure and table placement',
        '5. Structure appendices if needed',
        '6. Plan front matter (abstract, keywords)',
        '7. Plan back matter (acknowledgments, references)',
        '8. Consider page layout requirements',
        '9. Plan cross-references',
        '10. Document structure rationale'
      ],
      outputFormat: 'JSON object with document structure'
    },
    outputSchema: {
      type: 'object',
      required: ['structure', 'sections', 'documentClass'],
      properties: {
        documentClass: { type: 'string' },
        structure: {
          type: 'object',
          properties: {
            frontMatter: { type: 'array', items: { type: 'string' } },
            mainMatter: { type: 'array', items: { type: 'string' } },
            backMatter: { type: 'array', items: { type: 'string' } }
          }
        },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              level: { type: 'number' },
              content: { type: 'string' },
              subsections: { type: 'array', items: { type: 'object' } }
            }
          }
        },
        theoremCount: { type: 'number' },
        figureCount: { type: 'number' },
        tableCount: { type: 'number' },
        appendices: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'latex', 'structure']
}));

export const mathFormattingTask = defineTask('math-formatting', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Format Mathematical Expressions`,
  agent: {
    name: 'mathematics-writer',
    skills: ['latex-math-formatter', 'sympy-computer-algebra', 'special-functions-library'],
    prompt: {
      role: 'Mathematical Typesetting Expert',
      task: 'Format all mathematical expressions in proper LaTeX',
      context: {
        content: args.content,
        documentStructure: args.documentStructure
      },
      instructions: [
        '1. Convert all expressions to LaTeX math mode',
        '2. Use appropriate display vs inline math',
        '3. Format equations with proper alignment',
        '4. Use equation numbering appropriately',
        '5. Format matrices and arrays',
        '6. Format special symbols and operators',
        '7. Use proper spacing (\\, \\: \\; \\!)',
        '8. Format fractions and radicals properly',
        '9. Use appropriate font styles for variables',
        '10. Create multi-line equations'
      ],
      outputFormat: 'JSON object with formatted mathematics'
    },
    outputSchema: {
      type: 'object',
      required: ['formattedExpressions', 'equations'],
      properties: {
        formattedExpressions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              original: { type: 'string' },
              latex: { type: 'string' },
              displayMode: { type: 'boolean' },
              numbered: { type: 'boolean' }
            }
          }
        },
        equations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string' },
              latex: { type: 'string' },
              environment: { type: 'string' }
            }
          }
        },
        mathPackages: { type: 'array', items: { type: 'string' } },
        specialSymbols: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'latex', 'math-formatting']
}));

export const theoremEnvironmentsTask = defineTask('theorem-environments', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Set Up Theorem Environments`,
  agent: {
    name: 'mathematics-writer',
    skills: ['latex-math-formatter', 'sympy-computer-algebra'],
    prompt: {
      role: 'AMS-LaTeX Theorem Expert',
      task: 'Set up theorem environments and proof structures',
      context: {
        content: args.content,
        style: args.style,
        documentStructure: args.documentStructure
      },
      instructions: [
        '1. Define theorem environment (amsthm)',
        '2. Define lemma, proposition, corollary environments',
        '3. Define definition, example, remark environments',
        '4. Set up proof environment',
        '5. Configure numbering schemes',
        '6. Set up theorem styles (plain, definition, remark)',
        '7. Handle named theorems',
        '8. Set up QED symbols',
        '9. Configure cross-referencing',
        '10. Add theorem labels'
      ],
      outputFormat: 'JSON object with theorem environments'
    },
    outputSchema: {
      type: 'object',
      required: ['environments', 'definitions'],
      properties: {
        environments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              style: { type: 'string' },
              numbering: { type: 'string' }
            }
          }
        },
        definitions: { type: 'string' },
        theorems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              label: { type: 'string' },
              name: { type: 'string' },
              content: { type: 'string' }
            }
          }
        },
        proofs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              forTheorem: { type: 'string' },
              content: { type: 'string' }
            }
          }
        },
        numberingScheme: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'latex', 'theorems']
}));

export const bibliographyManagementTask = defineTask('bibliography-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Manage Bibliography`,
  agent: {
    name: 'mathematics-writer',
    skills: ['bibtex-reference-manager', 'latex-math-formatter', 'arxiv-search-interface'],
    prompt: {
      role: 'BibTeX and Citation Expert',
      task: 'Set up bibliography and citation management',
      context: {
        bibliography: args.bibliography,
        content: args.content,
        style: args.style
      },
      instructions: [
        '1. Create BibTeX entries for all references',
        '2. Choose appropriate bibliography style',
        '3. Set up citation commands',
        '4. Handle multiple citation styles',
        '5. Set up biblatex if needed',
        '6. Create reference labels',
        '7. Handle special characters in titles',
        '8. Format author names properly',
        '9. Add DOIs and URLs',
        '10. Set up backreferences if desired'
      ],
      outputFormat: 'JSON object with bibliography setup'
    },
    outputSchema: {
      type: 'object',
      required: ['bibtex', 'citations'],
      properties: {
        bibtex: { type: 'string' },
        bibliographyStyle: { type: 'string' },
        citations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              key: { type: 'string' },
              type: { type: 'string' },
              command: { type: 'string' }
            }
          }
        },
        preambleCommands: { type: 'string' },
        useBiblatex: { type: 'boolean' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'latex', 'bibliography']
}));

export const notationConsistencyTask = defineTask('notation-consistency', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Ensure Consistent Notation`,
  agent: {
    name: 'mathematics-writer',
    skills: ['latex-math-formatter', 'sympy-computer-algebra'],
    prompt: {
      role: 'Mathematical Notation Consistency Expert',
      task: 'Ensure notation is consistent throughout the document',
      context: {
        content: args.content,
        mathFormatting: args.mathFormatting,
        documentStructure: args.documentStructure
      },
      instructions: [
        '1. Create custom commands for repeated notation',
        '2. Define macros for common expressions',
        '3. Set up notation for vectors, matrices',
        '4. Define operator names',
        '5. Create notation glossary',
        '6. Check consistency across sections',
        '7. Standardize variable naming',
        '8. Define paired delimiters',
        '9. Set up semantic macros',
        '10. Document notation conventions'
      ],
      outputFormat: 'JSON object with notation setup'
    },
    outputSchema: {
      type: 'object',
      required: ['customCommands', 'notationGlossary'],
      properties: {
        customCommands: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              command: { type: 'string' },
              definition: { type: 'string' },
              purpose: { type: 'string' }
            }
          }
        },
        macros: { type: 'string' },
        operatorNames: { type: 'array', items: { type: 'string' } },
        notationGlossary: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              symbol: { type: 'string' },
              meaning: { type: 'string' },
              latex: { type: 'string' }
            }
          }
        },
        pairedDelimiters: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'latex', 'notation']
}));

export const finalDocumentGenerationTask = defineTask('final-document-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Generate Final LaTeX Document`,
  agent: {
    name: 'mathematics-writer',
    skills: ['latex-math-formatter', 'bibtex-reference-manager', 'sympy-computer-algebra'],
    prompt: {
      role: 'LaTeX Document Assembly Expert',
      task: 'Assemble the final LaTeX document',
      context: {
        documentStructure: args.documentStructure,
        mathFormatting: args.mathFormatting,
        theoremEnvironments: args.theoremEnvironments,
        bibliographyManagement: args.bibliographyManagement,
        notationConsistency: args.notationConsistency,
        documentType: args.documentType,
        style: args.style
      },
      instructions: [
        '1. Assemble complete preamble with packages',
        '2. Include all custom commands',
        '3. Assemble document body',
        '4. Add front matter',
        '5. Include all sections with content',
        '6. Add theorem environments and proofs',
        '7. Include figures and tables',
        '8. Add bibliography',
        '9. Provide compilation instructions',
        '10. Generate complete document'
      ],
      outputFormat: 'JSON object with final document'
    },
    outputSchema: {
      type: 'object',
      required: ['latex', 'preamble', 'body', 'packages'],
      properties: {
        latex: { type: 'string' },
        preamble: { type: 'string' },
        body: { type: 'string' },
        packages: { type: 'array', items: { type: 'string' } },
        lineCount: { type: 'number' },
        recommendedCompiler: { type: 'string' },
        compilationCommands: { type: 'array', items: { type: 'string' } },
        warnings: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'latex', 'generation']
}));
