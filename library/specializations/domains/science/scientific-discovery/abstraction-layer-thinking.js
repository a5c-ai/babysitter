/**
 * @process scientific-discovery/abstraction-layer-thinking
 * @description Separate concerns across abstraction layers (hardware, OS, middleware, application) for systematic analysis of complex systems
 * @inputs { system: object, problem: string, currentLayer: string, outputDir: string }
 * @outputs { success: boolean, layerAnalysis: object, layerInteractions: array, designRecommendations: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    system = {},
    problem = '',
    currentLayer = '',
    outputDir = 'abstraction-layer-output',
    targetClarity = 80
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Abstraction Layer Thinking Process');

  // ============================================================================
  // PHASE 1: SYSTEM LAYER IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Identifying system layers');
  const layerIdentification = await ctx.task(layerIdentificationTask, {
    system,
    problem,
    outputDir
  });

  artifacts.push(...layerIdentification.artifacts);

  // ============================================================================
  // PHASE 2: LAYER INTERFACE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing layer interfaces');
  const interfaceAnalysis = await ctx.task(layerInterfaceAnalysisTask, {
    layers: layerIdentification.layers,
    system,
    outputDir
  });

  artifacts.push(...interfaceAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: ABSTRACTION BOUNDARY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Assessing abstraction boundaries');
  const boundaryAssessment = await ctx.task(abstractionBoundaryTask, {
    layers: layerIdentification.layers,
    interfaces: interfaceAnalysis.interfaces,
    outputDir
  });

  artifacts.push(...boundaryAssessment.artifacts);

  // ============================================================================
  // PHASE 4: CONCERN SEPARATION ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing separation of concerns');
  const concernSeparation = await ctx.task(concernSeparationTask, {
    layers: layerIdentification.layers,
    problem,
    boundaryAssessment,
    outputDir
  });

  artifacts.push(...concernSeparation.artifacts);

  // ============================================================================
  // PHASE 5: LAYER VIOLATION DETECTION
  // ============================================================================

  ctx.log('info', 'Phase 5: Detecting layer violations');
  const violationDetection = await ctx.task(layerViolationDetectionTask, {
    layers: layerIdentification.layers,
    interfaces: interfaceAnalysis.interfaces,
    system,
    outputDir
  });

  artifacts.push(...violationDetection.artifacts);

  // ============================================================================
  // PHASE 6: CROSS-LAYER OPTIMIZATION ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Analyzing cross-layer optimization opportunities');
  const crossLayerOptimization = await ctx.task(crossLayerOptimizationTask, {
    layers: layerIdentification.layers,
    problem,
    violationDetection,
    outputDir
  });

  artifacts.push(...crossLayerOptimization.artifacts);

  // ============================================================================
  // PHASE 7: LAYER-APPROPRIATE SOLUTION DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 7: Designing layer-appropriate solutions');
  const solutionDesign = await ctx.task(layerAppropriateSolutionTask, {
    problem,
    layers: layerIdentification.layers,
    concernSeparation,
    crossLayerOptimization,
    currentLayer,
    outputDir
  });

  artifacts.push(...solutionDesign.artifacts);

  // ============================================================================
  // PHASE 8: SYNTHESIS AND RECOMMENDATIONS
  // ============================================================================

  ctx.log('info', 'Phase 8: Synthesizing analysis');
  const synthesis = await ctx.task(abstractionLayerSynthesisTask, {
    layerIdentification,
    interfaceAnalysis,
    boundaryAssessment,
    concernSeparation,
    violationDetection,
    crossLayerOptimization,
    solutionDesign,
    targetClarity,
    outputDir
  });

  artifacts.push(...synthesis.artifacts);

  const clarityMet = synthesis.clarityScore >= targetClarity;

  // Breakpoint: Review abstraction analysis
  await ctx.breakpoint({
    question: `Abstraction layer analysis complete. Clarity: ${synthesis.clarityScore}/${targetClarity}. ${clarityMet ? 'Clarity target met!' : 'Additional refinement may be needed.'} Review analysis?`,
    title: 'Abstraction Layer Thinking Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        problem,
        layersIdentified: layerIdentification.layers.length,
        interfacesAnalyzed: interfaceAnalysis.interfaces.length,
        violationsDetected: violationDetection.violations.length,
        solutionLayer: solutionDesign.recommendedLayer,
        clarityScore: synthesis.clarityScore,
        clarityMet
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    problem,
    layerAnalysis: {
      layers: layerIdentification.layers,
      interfaces: interfaceAnalysis.interfaces,
      boundaries: boundaryAssessment.boundaries
    },
    layerInteractions: interfaceAnalysis.interactions,
    concernSeparation: concernSeparation.analysis,
    violations: violationDetection.violations,
    designRecommendations: solutionDesign.recommendations,
    synthesis: synthesis.summary,
    clarityScore: synthesis.clarityScore,
    clarityMet,
    artifacts,
    duration,
    metadata: {
      processId: 'scientific-discovery/abstraction-layer-thinking',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Layer Identification
export const layerIdentificationTask = defineTask('layer-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify system layers',
  agent: {
    name: 'systems-architect',
    prompt: {
      role: 'systems architect specializing in layered architectures',
      task: 'Identify and characterize the abstraction layers in the system',
      context: args,
      instructions: [
        'Identify the abstraction layers present:',
        '  - Hardware layer (physical components, circuits)',
        '  - Firmware/Driver layer (device control)',
        '  - Operating System layer (kernel, system calls)',
        '  - Middleware layer (libraries, frameworks, services)',
        '  - Application layer (user-facing functionality)',
        '  - Presentation layer (UI, API)',
        'For each layer document:',
        '  - Layer name and position in stack',
        '  - Primary responsibilities',
        '  - Key components/modules',
        '  - Abstractions provided',
        '  - Abstractions consumed',
        'Identify the architectural style (strict layers, relaxed layers)',
        'Document layer dependencies',
        'Save layer identification to output directory'
      ],
      outputFormat: 'JSON with layers (array with name, position, responsibilities, components, providedAbstractions, consumedAbstractions), style, dependencies, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['layers', 'style', 'artifacts'],
      properties: {
        layers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              position: { type: 'number' },
              responsibilities: { type: 'array', items: { type: 'string' } },
              components: { type: 'array', items: { type: 'string' } },
              providedAbstractions: { type: 'array', items: { type: 'string' } },
              consumedAbstractions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        style: { type: 'string', enum: ['strict', 'relaxed', 'hybrid'] },
        dependencies: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'abstraction-layer', 'identification']
}));

// Task 2: Layer Interface Analysis
export const layerInterfaceAnalysisTask = defineTask('layer-interface-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze layer interfaces',
  agent: {
    name: 'interface-analyst',
    prompt: {
      role: 'software architect specializing in interface design',
      task: 'Analyze the interfaces between abstraction layers',
      context: args,
      instructions: [
        'For each layer boundary, document the interface:',
        '  - API/calls available',
        '  - Data formats exchanged',
        '  - Protocols used',
        '  - Contracts and guarantees',
        'Analyze interface characteristics:',
        '  - Stability (how often does it change?)',
        '  - Completeness (does it expose necessary functionality?)',
        '  - Information hiding (what is hidden?)',
        '  - Performance implications',
        'Identify interface patterns:',
        '  - Facade pattern',
        '  - Adapter pattern',
        '  - Bridge pattern',
        'Document inter-layer communication mechanisms',
        'Save interface analysis to output directory'
      ],
      outputFormat: 'JSON with interfaces (array), interactions, patterns, communicationMechanisms, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['interfaces', 'interactions', 'artifacts'],
      properties: {
        interfaces: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              upperLayer: { type: 'string' },
              lowerLayer: { type: 'string' },
              api: { type: 'array', items: { type: 'string' } },
              dataFormats: { type: 'array', items: { type: 'string' } },
              stability: { type: 'string', enum: ['stable', 'evolving', 'volatile'] },
              completeness: { type: 'string' }
            }
          }
        },
        interactions: { type: 'array', items: { type: 'object' } },
        patterns: { type: 'array', items: { type: 'string' } },
        communicationMechanisms: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'abstraction-layer', 'interfaces']
}));

// Task 3: Abstraction Boundary Assessment
export const abstractionBoundaryTask = defineTask('abstraction-boundary', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess abstraction boundaries',
  agent: {
    name: 'boundary-analyst',
    prompt: {
      role: 'software architect specializing in abstraction design',
      task: 'Assess the quality and appropriateness of abstraction boundaries',
      context: args,
      instructions: [
        'Evaluate each abstraction boundary:',
        '  - Is the boundary well-defined?',
        '  - Is it at the right level of abstraction?',
        '  - Does it provide useful information hiding?',
        '  - Does it minimize coupling between layers?',
        'Assess abstraction quality:',
        '  - Coherence (related functionality grouped)',
        '  - Completeness (all necessary operations exposed)',
        '  - Simplicity (minimal but sufficient interface)',
        '  - Stability (resistant to change propagation)',
        'Identify abstraction problems:',
        '  - Leaky abstractions',
        '  - Incomplete abstractions',
        '  - Overly complex abstractions',
        '  - Missing abstractions',
        'Save boundary assessment to output directory'
      ],
      outputFormat: 'JSON with boundaries (array with assessment), qualityMetrics, problems, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['boundaries', 'qualityMetrics', 'artifacts'],
      properties: {
        boundaries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              boundary: { type: 'string' },
              wellDefined: { type: 'boolean' },
              appropriateLevel: { type: 'boolean' },
              informationHiding: { type: 'string' },
              coupling: { type: 'string', enum: ['low', 'medium', 'high'] }
            }
          }
        },
        qualityMetrics: {
          type: 'object',
          properties: {
            coherence: { type: 'number' },
            completeness: { type: 'number' },
            simplicity: { type: 'number' },
            stability: { type: 'number' }
          }
        },
        problems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              boundary: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'abstraction-layer', 'boundaries']
}));

// Task 4: Concern Separation Analysis
export const concernSeparationTask = defineTask('concern-separation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze separation of concerns',
  agent: {
    name: 'concern-analyst',
    prompt: {
      role: 'software architect specializing in separation of concerns',
      task: 'Analyze how concerns are separated across layers',
      context: args,
      instructions: [
        'Identify concerns relevant to the problem:',
        '  - Functional concerns (business logic)',
        '  - Technical concerns (persistence, communication)',
        '  - Cross-cutting concerns (logging, security, caching)',
        'Map concerns to layers:',
        '  - Which layer handles which concern?',
        '  - Is each concern isolated to one layer?',
        '  - Are there concerns spread across layers?',
        'Assess separation quality:',
        '  - Single Responsibility principle adherence',
        '  - Concern isolation',
        '  - Concern cohesion within layers',
        'Identify separation problems:',
        '  - Mixed concerns within layers',
        '  - Tangled cross-cutting concerns',
        '  - Duplicated concern handling',
        'Save concern analysis to output directory'
      ],
      outputFormat: 'JSON with analysis (concerns, concernMapping, separationQuality), problems, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'problems', 'artifacts'],
      properties: {
        analysis: {
          type: 'object',
          properties: {
            concerns: { type: 'array', items: { type: 'string' } },
            concernMapping: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  concern: { type: 'string' },
                  layer: { type: 'string' },
                  isolated: { type: 'boolean' }
                }
              }
            },
            separationQuality: { type: 'number' }
          }
        },
        crossCuttingConcerns: { type: 'array', items: { type: 'object' } },
        problems: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'abstraction-layer', 'concerns']
}));

// Task 5: Layer Violation Detection
export const layerViolationDetectionTask = defineTask('layer-violation-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Detect layer violations',
  agent: {
    name: 'violation-detector',
    prompt: {
      role: 'software architect specializing in architecture compliance',
      task: 'Detect violations of layered architecture principles',
      context: args,
      instructions: [
        'Detect layer bypassing:',
        '  - Components accessing layers beyond adjacent',
        '  - Skipping abstraction levels',
        'Detect upward dependencies:',
        '  - Lower layers depending on upper layers',
        '  - Circular dependencies between layers',
        'Detect abstraction leakage:',
        '  - Implementation details crossing boundaries',
        '  - Layer-specific types in interfaces',
        'Detect layer blurring:',
        '  - Mixed responsibilities',
        '  - Unclear layer assignment',
        'For each violation assess:',
        '  - Severity (critical, major, minor)',
        '  - Impact on maintainability',
        '  - Recommended fix',
        'Save violation detection to output directory'
      ],
      outputFormat: 'JSON with violations (array with type, location, severity, impact, fix), summary, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['violations', 'summary', 'artifacts'],
      properties: {
        violations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['bypassing', 'upward-dependency', 'leakage', 'blurring'] },
              location: { type: 'string' },
              description: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'major', 'minor'] },
              impact: { type: 'string' },
              recommendedFix: { type: 'string' }
            }
          }
        },
        summary: {
          type: 'object',
          properties: {
            totalViolations: { type: 'number' },
            criticalCount: { type: 'number' },
            majorCount: { type: 'number' },
            minorCount: { type: 'number' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'abstraction-layer', 'violations']
}));

// Task 6: Cross-Layer Optimization Analysis
export const crossLayerOptimizationTask = defineTask('cross-layer-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze cross-layer optimization opportunities',
  agent: {
    name: 'optimization-analyst',
    prompt: {
      role: 'performance architect specializing in cross-layer optimization',
      task: 'Identify legitimate cross-layer optimization opportunities',
      context: args,
      instructions: [
        'Identify performance bottlenecks at layer boundaries',
        'Analyze where strict layering causes inefficiency:',
        '  - Excessive data transformation',
        '  - Redundant validation',
        '  - Multiple network round-trips',
        '  - Unnecessary abstraction overhead',
        'Evaluate potential optimizations:',
        '  - Layer collapsing (combining layers)',
        '  - Layer bypassing (controlled short-circuits)',
        '  - Caching at boundaries',
        '  - Lazy loading across layers',
        'Assess trade-offs:',
        '  - Performance gain vs. maintainability cost',
        '  - When is violation justified?',
        'Document controlled violation patterns',
        'Save optimization analysis to output directory'
      ],
      outputFormat: 'JSON with bottlenecks, optimizations (array with opportunity, tradeoff, recommendation), controlledViolations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['bottlenecks', 'optimizations', 'artifacts'],
      properties: {
        bottlenecks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              location: { type: 'string' },
              cause: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        optimizations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              opportunity: { type: 'string' },
              type: { type: 'string' },
              performanceGain: { type: 'string' },
              maintainabilityCost: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        controlledViolations: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'abstraction-layer', 'optimization']
}));

// Task 7: Layer-Appropriate Solution Design
export const layerAppropriateSolutionTask = defineTask('layer-appropriate-solution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design layer-appropriate solutions',
  agent: {
    name: 'solution-designer',
    prompt: {
      role: 'software architect specializing in layered design',
      task: 'Design solutions that respect and leverage the layer structure',
      context: args,
      instructions: [
        'Determine the appropriate layer for the solution:',
        '  - Where does the problem originate?',
        '  - Where is the most natural place to solve it?',
        '  - What layers need to be involved?',
        'Design layer-respecting solution:',
        '  - Changes within each layer',
        '  - Interface modifications needed',
        '  - Cross-cutting implementations',
        'Consider layer-specific patterns:',
        '  - Repository pattern (data layer)',
        '  - Service layer pattern',
        '  - Presentation patterns (MVC, MVVM)',
        'Ensure solution maintains layer integrity:',
        '  - No new violations introduced',
        '  - Abstraction quality preserved',
        '  - Separation of concerns maintained',
        'Save solution design to output directory'
      ],
      outputFormat: 'JSON with recommendedLayer, solution (layerChanges, interfaceChanges, patterns), integrityAssessment, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendedLayer', 'solution', 'recommendations', 'artifacts'],
      properties: {
        recommendedLayer: { type: 'string' },
        solution: {
          type: 'object',
          properties: {
            layerChanges: { type: 'array', items: { type: 'object' } },
            interfaceChanges: { type: 'array', items: { type: 'object' } },
            patterns: { type: 'array', items: { type: 'string' } }
          }
        },
        integrityAssessment: {
          type: 'object',
          properties: {
            violationsIntroduced: { type: 'number' },
            abstractionQuality: { type: 'string' },
            concernSeparation: { type: 'string' }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'abstraction-layer', 'solution-design']
}));

// Task 8: Abstraction Layer Synthesis
export const abstractionLayerSynthesisTask = defineTask('abstraction-layer-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize analysis',
  agent: {
    name: 'synthesis-specialist',
    prompt: {
      role: 'senior systems architect',
      task: 'Synthesize abstraction layer analysis',
      context: args,
      instructions: [
        'Summarize layer structure and quality',
        'Integrate findings:',
        '  - Layer identification',
        '  - Interface quality',
        '  - Boundary assessment',
        '  - Concern separation',
        '  - Violations detected',
        '  - Optimization opportunities',
        'Assess overall clarity (0-100):',
        '  - Layers well-defined?',
        '  - Interfaces clean?',
        '  - Concerns separated?',
        '  - Violations minimal?',
        'Provide architecture improvement roadmap',
        'Identify key risks and mitigations',
        'Save synthesis to output directory'
      ],
      outputFormat: 'JSON with summary, clarityScore, improvementRoadmap, risks, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'clarityScore', 'artifacts'],
      properties: {
        summary: {
          type: 'object',
          properties: {
            layerStructure: { type: 'string' },
            interfaceQuality: { type: 'string' },
            concernSeparation: { type: 'string' },
            violationStatus: { type: 'string' }
          }
        },
        clarityScore: { type: 'number', minimum: 0, maximum: 100 },
        improvementRoadmap: { type: 'array', items: { type: 'object' } },
        risks: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'abstraction-layer', 'synthesis']
}));
