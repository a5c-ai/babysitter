/**
 * @process Quantum Algorithm Documentation
 * @id QC-DOC-001
 * @description Create comprehensive documentation for quantum algorithms including mathematical
 * foundations, circuit diagrams, complexity analysis, and implementation guides.
 * @category Quantum Computing - Research and Documentation
 * @priority P1 - High
 * @inputs {{ algorithm: object, codebase?: string }}
 * @outputs {{ success: boolean, documentation: object, tutorials: array, artifacts: array }}
 *
 * @example
 * const result = await orchestrate('quantum-algorithm-documentation', {
 *   algorithm: { name: 'VQE', implementation: vqeCode },
 *   codebase: '/path/to/quantum-library'
 * });
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    algorithm,
    codebase,
    includeVisualizations = true,
    includeExamples = true,
    outputDir = 'algorithm-docs-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Quantum Algorithm Documentation: ${algorithm.name}`);

  // ============================================================================
  // PHASE 1: MATHEMATICAL FOUNDATIONS
  // ============================================================================

  ctx.log('info', 'Phase 1: Mathematical Foundations Documentation');

  const mathResult = await ctx.task(mathematicalFoundationsTask, {
    algorithm
  });

  artifacts.push(...(mathResult.artifacts || []));

  await ctx.breakpoint({
    question: `Mathematical foundations documented. Sections: ${mathResult.sections.length}. Proceed with circuit documentation?`,
    title: 'Mathematical Foundations Review',
    context: {
      runId: ctx.runId,
      math: mathResult,
      files: (mathResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 2: CIRCUIT DIAGRAMS
  // ============================================================================

  ctx.log('info', 'Phase 2: Circuit Diagrams and Visualizations');

  const circuitDocsResult = await ctx.task(circuitDiagramsTask, {
    algorithm,
    includeVisualizations
  });

  artifacts.push(...(circuitDocsResult.artifacts || []));

  // ============================================================================
  // PHASE 3: COMPLEXITY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Complexity Analysis');

  const complexityResult = await ctx.task(complexityAnalysisTask, {
    algorithm
  });

  artifacts.push(...(complexityResult.artifacts || []));

  // ============================================================================
  // PHASE 4: IMPLEMENTATION GUIDE
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementation Guide');

  const implGuideResult = await ctx.task(implementationGuideTask, {
    algorithm,
    codebase
  });

  artifacts.push(...(implGuideResult.artifacts || []));

  await ctx.breakpoint({
    question: `Implementation guide created. Code examples: ${implGuideResult.codeExamples.length}. Proceed with API documentation?`,
    title: 'Implementation Guide Review',
    context: {
      runId: ctx.runId,
      implGuide: implGuideResult,
      files: (implGuideResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 5: API DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 5: API Documentation');

  const apiDocsResult = await ctx.task(apiDocumentationTask, {
    algorithm,
    codebase
  });

  artifacts.push(...(apiDocsResult.artifacts || []));

  // ============================================================================
  // PHASE 6: TUTORIAL NOTEBOOKS
  // ============================================================================

  let tutorialResult = null;
  if (includeExamples) {
    ctx.log('info', 'Phase 6: Tutorial Notebooks');

    tutorialResult = await ctx.task(tutorialNotebooksTask, {
      algorithm,
      mathDocs: mathResult,
      implGuide: implGuideResult
    });

    artifacts.push(...(tutorialResult.artifacts || []));
  }

  // ============================================================================
  // PHASE 7: VISUAL CIRCUIT GUIDES
  // ============================================================================

  let visualGuideResult = null;
  if (includeVisualizations) {
    ctx.log('info', 'Phase 7: Visual Circuit Guides');

    visualGuideResult = await ctx.task(visualCircuitGuidesTask, {
      algorithm,
      circuitDocs: circuitDocsResult
    });

    artifacts.push(...(visualGuideResult.artifacts || []));
  }

  // ============================================================================
  // PHASE 8: DOCUMENTATION COMPILATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Documentation Compilation');

  const compilationResult = await ctx.task(documentationCompilationTask, {
    algorithm,
    mathResult,
    circuitDocsResult,
    complexityResult,
    implGuideResult,
    apiDocsResult,
    tutorialResult,
    visualGuideResult,
    outputDir
  });

  artifacts.push(...(compilationResult.artifacts || []));

  await ctx.breakpoint({
    question: `Documentation complete for ${algorithm.name}. Pages: ${compilationResult.pageCount}, Tutorials: ${tutorialResult?.notebookCount || 0}. Approve documentation?`,
    title: 'Algorithm Documentation Complete',
    context: {
      runId: ctx.runId,
      summary: {
        algorithm: algorithm.name,
        pageCount: compilationResult.pageCount,
        tutorials: tutorialResult?.notebookCount || 0,
        visualizations: visualGuideResult?.visualCount || 0
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  const endTime = ctx.now();

  return {
    success: true,
    algorithm: algorithm.name,
    documentation: {
      mathematicalFoundations: mathResult.documentation,
      circuitDiagrams: circuitDocsResult.diagrams,
      complexityAnalysis: complexityResult.analysis,
      implementationGuide: implGuideResult.guide,
      apiReference: apiDocsResult.apiDocs
    },
    tutorials: tutorialResult?.notebooks || [],
    visualGuides: visualGuideResult?.guides || [],
    outputPaths: compilationResult.outputPaths,
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'QC-DOC-001',
      processName: 'Quantum Algorithm Documentation',
      category: 'quantum-computing',
      timestamp: startTime
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const mathematicalFoundationsTask = defineTask('qdoc-math-foundations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Mathematical Foundations',
  agent: {
    name: 'quantum-documentation-specialist',
    skills: ['resource-estimator', 'statevector-simulator', 'qiskit-circuit-builder'],
    prompt: {
      role: 'Quantum Algorithm Mathematician',
      task: 'Document mathematical foundations of quantum algorithm',
      context: args,
      instructions: [
        '1. Document quantum mechanics basics',
        '2. Explain mathematical formalism',
        '3. Derive algorithm correctness',
        '4. Explain key theorems',
        '5. Document assumptions',
        '6. Provide proofs',
        '7. Add worked examples',
        '8. Include notation guide',
        '9. Add references',
        '10. Format in LaTeX'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['documentation', 'sections'],
      properties: {
        documentation: { type: 'string' },
        sections: { type: 'array' },
        theorems: { type: 'array' },
        proofs: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'documentation', 'mathematics']
}));

export const circuitDiagramsTask = defineTask('qdoc-circuit-diagrams', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Circuit Diagrams',
  agent: {
    name: 'quantum-documentation-specialist',
    skills: ['resource-estimator', 'statevector-simulator', 'qiskit-circuit-builder'],
    prompt: {
      role: 'Quantum Circuit Documentation Specialist',
      task: 'Create circuit diagrams and visualizations',
      context: args,
      instructions: [
        '1. Create high-level circuit overview',
        '2. Create detailed gate-level diagrams',
        '3. Add qubit labeling',
        '4. Show measurement points',
        '5. Create animation sequences',
        '6. Add state evolution diagrams',
        '7. Create Bloch sphere visualizations',
        '8. Document circuit components',
        '9. Export in multiple formats',
        '10. Add captions'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['diagrams'],
      properties: {
        diagrams: { type: 'array' },
        animations: { type: 'array' },
        blochSpheres: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'documentation', 'circuits']
}));

export const complexityAnalysisTask = defineTask('qdoc-complexity-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Complexity Analysis',
  agent: {
    name: 'quantum-documentation-specialist',
    skills: ['resource-estimator', 'statevector-simulator', 'qiskit-circuit-builder'],
    prompt: {
      role: 'Computational Complexity Specialist',
      task: 'Document algorithm complexity analysis',
      context: args,
      instructions: [
        '1. Analyze query complexity',
        '2. Analyze gate complexity',
        '3. Calculate circuit depth',
        '4. Analyze space complexity',
        '5. Compare with classical',
        '6. Identify speedup conditions',
        '7. Document lower bounds',
        '8. Analyze scaling behavior',
        '9. Create complexity tables',
        '10. Provide asymptotic analysis'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis'],
      properties: {
        analysis: { type: 'object' },
        queryComplexity: { type: 'string' },
        gateComplexity: { type: 'string' },
        spaceComplexity: { type: 'string' },
        speedup: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'documentation', 'complexity']
}));

export const implementationGuideTask = defineTask('qdoc-implementation-guide', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implementation Guide',
  agent: {
    name: 'quantum-documentation-specialist',
    skills: ['resource-estimator', 'statevector-simulator', 'qiskit-circuit-builder'],
    prompt: {
      role: 'Quantum Implementation Guide Writer',
      task: 'Create implementation guide for quantum algorithm',
      context: args,
      instructions: [
        '1. Document prerequisites',
        '2. Explain setup steps',
        '3. Walk through implementation',
        '4. Provide code snippets',
        '5. Explain design choices',
        '6. Document best practices',
        '7. Add debugging tips',
        '8. Include common pitfalls',
        '9. Add optimization tips',
        '10. Provide complete examples'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['guide', 'codeExamples'],
      properties: {
        guide: { type: 'string' },
        codeExamples: { type: 'array' },
        bestPractices: { type: 'array' },
        pitfalls: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'documentation', 'implementation']
}));

export const apiDocumentationTask = defineTask('qdoc-api-docs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'API Documentation',
  agent: {
    name: 'quantum-documentation-specialist',
    skills: ['resource-estimator', 'statevector-simulator', 'qiskit-circuit-builder'],
    prompt: {
      role: 'API Documentation Specialist',
      task: 'Create API documentation for quantum algorithm',
      context: args,
      instructions: [
        '1. Document all public functions',
        '2. Document parameters',
        '3. Document return values',
        '4. Add type annotations',
        '5. Provide usage examples',
        '6. Document exceptions',
        '7. Add cross-references',
        '8. Create quick reference',
        '9. Generate from docstrings',
        '10. Format for readthedocs'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['apiDocs'],
      properties: {
        apiDocs: { type: 'object' },
        functions: { type: 'array' },
        classes: { type: 'array' },
        quickReference: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'documentation', 'api']
}));

export const tutorialNotebooksTask = defineTask('qdoc-tutorials', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Tutorial Notebooks',
  agent: {
    name: 'quantum-documentation-specialist',
    skills: ['resource-estimator', 'statevector-simulator', 'qiskit-circuit-builder'],
    prompt: {
      role: 'Quantum Education Content Creator',
      task: 'Create tutorial Jupyter notebooks',
      context: args,
      instructions: [
        '1. Create getting started notebook',
        '2. Create theory notebook',
        '3. Create hands-on examples',
        '4. Add interactive exercises',
        '5. Include visualizations',
        '6. Add quizzes',
        '7. Create advanced tutorials',
        '8. Add solutions',
        '9. Test all notebooks',
        '10. Format consistently'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['notebooks', 'notebookCount'],
      properties: {
        notebooks: { type: 'array' },
        notebookCount: { type: 'number' },
        exercises: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'documentation', 'tutorials']
}));

export const visualCircuitGuidesTask = defineTask('qdoc-visual-guides', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Visual Circuit Guides',
  agent: {
    name: 'quantum-documentation-specialist',
    skills: ['resource-estimator', 'statevector-simulator', 'qiskit-circuit-builder'],
    prompt: {
      role: 'Visual Documentation Specialist',
      task: 'Create visual circuit guides',
      context: args,
      instructions: [
        '1. Create step-by-step visuals',
        '2. Add state annotations',
        '3. Create infographics',
        '4. Add flow diagrams',
        '5. Create comparison charts',
        '6. Add timeline visualizations',
        '7. Create summary cards',
        '8. Add color coding',
        '9. Export high-res images',
        '10. Create presentation slides'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['guides', 'visualCount'],
      properties: {
        guides: { type: 'array' },
        visualCount: { type: 'number' },
        infographics: { type: 'array' },
        presentations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'documentation', 'visualization']
}));

export const documentationCompilationTask = defineTask('qdoc-compilation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Documentation Compilation',
  agent: {
    name: 'quantum-documentation-specialist',
    skills: ['resource-estimator', 'statevector-simulator', 'qiskit-circuit-builder'],
    prompt: {
      role: 'Documentation Build Specialist',
      task: 'Compile all documentation into final form',
      context: args,
      instructions: [
        '1. Organize all sections',
        '2. Create table of contents',
        '3. Add cross-references',
        '4. Build HTML documentation',
        '5. Build PDF documentation',
        '6. Create search index',
        '7. Add navigation',
        '8. Validate all links',
        '9. Generate site',
        '10. Package for distribution'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['outputPaths', 'pageCount'],
      properties: {
        outputPaths: { type: 'object' },
        pageCount: { type: 'number' },
        tableOfContents: { type: 'array' },
        searchIndex: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'documentation', 'compilation']
}));
