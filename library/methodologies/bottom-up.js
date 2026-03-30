/**
 * @process methodologies/bottom-up
 * @description Bottom-Up Development - Build foundational components first, compose upward
 * @inputs { task: string, maxCompositionLevels: number, testDriven: boolean }
 * @outputs { success: boolean, componentLibrary: array, compositionTree: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Bottom-Up Development Process
 *
 * Methodology: Identify primitives → Implement base components → Test → Compose into higher-level → Repeat
 *
 * This process implements bottom-up development where:
 * 1. Identify primitive/foundational components needed
 * 2. Implement and thoroughly test these base components
 * 3. Build component library of reusable, tested units
 * 4. Compose base components into higher-level components
 * 5. Test composed components
 * 6. Continue composing upward until system is complete
 * 7. Final integration creates the complete system
 *
 * Key characteristics:
 * - Strong emphasis on reusable components
 * - Each component is fully tested before composition
 * - Build what you need when you need it
 * - Emergent architecture based on actual needs
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.task - Task/system to build
 * @param {number} inputs.maxCompositionLevels - Maximum composition levels (default: 5)
 * @param {boolean} inputs.testDriven - Use TDD for each component (default: true)
 * @param {boolean} inputs.buildLibrary - Build reusable component library (default: true)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Process result with component library and system
 */
export async function process(inputs, ctx) {
  const {
    task,
    maxCompositionLevels = 5,
    testDriven = true,
    buildLibrary = true
  } = inputs;

  const componentLibrary = [];
  const compositionTree = {
    levels: []
  };

  // Phase 1: Identify needed primitive components
  const primitiveAnalysis = await ctx.task(agentIdentifyPrimitivesTask, {
    task,
    level: 0
  });

  // Level 0: Implement primitive/base components
  const level0Components = [];

  for (const primitive of primitiveAnalysis.primitives) {
    let component;

    if (testDriven) {
      // TDD: Write tests first, then implement
      const tests = await ctx.task(agentWriteTestsTask, {
        task,
        component: primitive,
        level: 0
      });

      component = await ctx.task(agentImplementComponentBottomUpTask, {
        task,
        component: primitive,
        level: 0,
        tests,
        dependencies: []
      });
    } else {
      // Implementation first
      component = await ctx.task(agentImplementComponentBottomUpTask, {
        task,
        component: primitive,
        level: 0,
        tests: null,
        dependencies: []
      });

      // Then test
      const tests = await ctx.task(agentTestComponentTask, {
        task,
        component,
        level: 0
      });

      component.testResults = tests;
    }

    level0Components.push(component);
    if (buildLibrary) {
      componentLibrary.push({
        ...component,
        level: 0,
        reusable: true
      });
    }
  }

  compositionTree.levels.push({
    level: 0,
    description: 'Primitive/Base components',
    components: level0Components
  });

  // Phase 2: Composition - build upward level by level
  let currentLevel = 1;
  let previousLevelComponents = level0Components;
  let systemComplete = false;

  while (currentLevel <= maxCompositionLevels && !systemComplete) {
    // Identify what higher-level components we can/should build
    const compositionPlan = await ctx.task(agentPlanCompositionTask, {
      task,
      currentLevel,
      availableComponents: componentLibrary.length > 0 ? componentLibrary : previousLevelComponents,
      previousLevels: compositionTree.levels,
      maxLevels: maxCompositionLevels
    });

    if (compositionPlan.compositions.length === 0) {
      // No more compositions needed - system might be complete
      break;
    }

    const currentLevelComponents = [];

    // Build each composed component
    for (const composition of compositionPlan.compositions) {
      let composedComponent;

      if (testDriven) {
        // TDD: Write integration tests first
        const tests = await ctx.task(agentWriteTestsTask, {
          task,
          component: composition,
          level: currentLevel
        });

        composedComponent = await ctx.task(agentComposeComponentTask, {
          task,
          composition,
          level: currentLevel,
          tests,
          availableComponents: componentLibrary.length > 0 ? componentLibrary : previousLevelComponents
        });
      } else {
        // Compose first
        composedComponent = await ctx.task(agentComposeComponentTask, {
          task,
          composition,
          level: currentLevel,
          tests: null,
          availableComponents: componentLibrary.length > 0 ? componentLibrary : previousLevelComponents
        });

        // Then test
        const tests = await ctx.task(agentTestComponentTask, {
          task,
          component: composedComponent,
          level: currentLevel
        });

        composedComponent.testResults = tests;
      }

      currentLevelComponents.push(composedComponent);

      if (buildLibrary && composedComponent.reusable) {
        componentLibrary.push({
          ...composedComponent,
          level: currentLevel
        });
      }
    }

    compositionTree.levels.push({
      level: currentLevel,
      description: `Level ${currentLevel} compositions`,
      components: currentLevelComponents
    });

    // Check if we've built the complete system
    const completionCheck = await ctx.task(agentCheckSystemCompletionTask, {
      task,
      currentLevel,
      currentLevelComponents,
      compositionTree
    });

    systemComplete = completionCheck.systemComplete;

    previousLevelComponents = currentLevelComponents;
    currentLevel++;
  }

  // Phase 3: Final integration and validation
  const finalIntegration = await ctx.task(agentIntegrateSystemTask, {
    task,
    compositionTree,
    componentLibrary,
    topLevelComponents: previousLevelComponents
  });

  const validation = await ctx.task(agentValidateBottomUpSystemTask, {
    task,
    compositionTree,
    componentLibrary,
    finalIntegration
  });

  return {
    success: validation.systemComplete && validation.allTestsPassed,
    task,
    componentLibrary,
    compositionTree,
    totalLevels: compositionTree.levels.length,
    totalComponents: componentLibrary.length || previousLevelComponents.length,
    finalIntegration,
    validation,
    summary: {
      totalLevels: compositionTree.levels.length,
      totalComponents: componentLibrary.length || compositionTree.levels.reduce((sum, l) => sum + l.components.length, 0),
      primitiveComponents: level0Components.length,
      reusableComponents: componentLibrary.filter(c => c.reusable).length,
      systemComplete: validation.systemComplete,
      allTestsPassed: validation.allTestsPassed,
      componentsByLevel: compositionTree.levels.map(l => ({
        level: l.level,
        count: l.components.length
      }))
    },
    metadata: {
      processId: 'methodologies/bottom-up',
      timestamp: ctx.now()
    }
  };
}

/**
 * Identify primitive components needed
 */
export const agentIdentifyPrimitivesTask = defineTask('agent-identify-primitives', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify primitive components',
  description: 'Analyze system and identify foundational components',

  agent: {
    name: 'primitive-identifier',
    prompt: {
      role: 'systems analyst',
      task: 'Identify the primitive/foundational components needed',
      context: {
        task: args.task,
        level: args.level
      },
      instructions: [
        'Analyze the system requirements',
        'Identify the most basic, fundamental components needed',
        'These should be small, focused, single-responsibility units',
        'Think about data structures, utilities, basic operations',
        'Consider what primitives would be most reusable',
        'Identify dependencies between primitives (ideally minimal)',
        'List 5-10 key primitive components to build first'
      ],
      outputFormat: 'JSON with array of primitive components, each with name, description, interface, purpose'
    },
    outputSchema: {
      type: 'object',
      required: ['primitives'],
      properties: {
        primitives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              interface: { type: 'string' },
              purpose: { type: 'string' },
              dependencies: { type: 'array', items: { type: 'string' } }
            }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'bottom-up', 'analysis', 'level-0']
}));

/**
 * Write tests for component (TDD)
 */
export const agentWriteTestsTask = defineTask('agent-write-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Write tests: ${args.component.name}`,
  description: 'Write tests before implementation (TDD)',

  agent: {
    name: 'test-writer',
    prompt: {
      role: 'test-driven development practitioner',
      task: 'Write comprehensive tests for the component',
      context: {
        task: args.task,
        component: args.component,
        level: args.level
      },
      instructions: [
        'Write tests that define expected behavior',
        'Cover normal cases, edge cases, and error cases',
        'Test the interface thoroughly',
        'Make tests specific and granular',
        'Tests should fail until implementation is complete',
        'Focus on behavior, not implementation details'
      ],
      outputFormat: 'JSON with test suite, test cases, expected behaviors'
    },
    outputSchema: {
      type: 'object',
      required: ['testSuite', 'testCases'],
      properties: {
        testSuite: { type: 'string' },
        testCases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              expectedBehavior: { type: 'string' }
            }
          }
        },
        testFiles: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'bottom-up', 'tdd', 'tests', `level-${args.level}`]
}));

/**
 * Implement component (bottom-up)
 */
export const agentImplementComponentBottomUpTask = defineTask('agent-implement-component-bottom-up', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement: ${args.component.name}`,
  description: 'Implement primitive/base component',

  agent: {
    name: 'component-builder',
    prompt: {
      role: 'software developer',
      task: 'Implement the component',
      context: {
        task: args.task,
        component: args.component,
        level: args.level,
        tests: args.tests,
        dependencies: args.dependencies
      },
      instructions: [
        'Implement the component fully and correctly',
        args.tests ? 'Make sure all tests pass' : 'Implement according to specification',
        'Keep implementation clean and focused',
        'Handle edge cases and errors properly',
        'Make it reusable and well-documented',
        'Use dependencies if provided',
        'Follow best practices and coding standards'
      ],
      outputFormat: 'JSON with implementation, files created, tests passing status'
    },
    outputSchema: {
      type: 'object',
      required: ['id', 'name', 'implemented', 'filesCreated', 'testsPass'],
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        implemented: { type: 'boolean' },
        filesCreated: { type: 'array', items: { type: 'string' } },
        implementation: { type: 'string' },
        testsPass: { type: 'boolean' },
        interface: { type: 'string' },
        reusable: { type: 'boolean' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'bottom-up', 'implementation', `level-${args.level}`]
}));

/**
 * Test component (post-implementation)
 */
export const agentTestComponentTask = defineTask('agent-test-component', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test: ${args.component.name}`,
  description: 'Test component implementation',

  agent: {
    name: 'component-tester',
    prompt: {
      role: 'QA engineer',
      task: 'Test the component implementation',
      context: {
        task: args.task,
        component: args.component,
        level: args.level
      },
      instructions: [
        'Write and run comprehensive tests',
        'Test normal operation, edge cases, error handling',
        'Verify interface contracts',
        'Check for bugs and issues',
        'Ensure component is production-ready'
      ],
      outputFormat: 'JSON with test results, all tests passed, issues found'
    },
    outputSchema: {
      type: 'object',
      required: ['allTestsPassed', 'totalTests', 'passedTests'],
      properties: {
        allTestsPassed: { type: 'boolean' },
        totalTests: { type: 'number' },
        passedTests: { type: 'number' },
        failedTests: { type: 'number' },
        issues: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'bottom-up', 'testing', `level-${args.level}`]
}));

/**
 * Plan next level of composition
 */
export const agentPlanCompositionTask = defineTask('agent-plan-composition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Plan compositions - Level ${args.currentLevel}`,
  description: 'Determine what to compose next',

  agent: {
    name: 'composition-planner',
    prompt: {
      role: 'software architect',
      task: 'Plan the next level of component composition',
      context: {
        task: args.task,
        currentLevel: args.currentLevel,
        availableComponents: args.availableComponents,
        previousLevels: args.previousLevels,
        maxLevels: args.maxLevels
      },
      instructions: [
        'Review available components from previous levels',
        'Identify useful compositions that bring us closer to the final system',
        'Each composition should combine 2+ existing components',
        'Compositions should provide meaningful new functionality',
        'Consider what higher-level abstractions are needed',
        'Build toward the complete system',
        `If at level ${args.maxLevels}, ensure compositions lead to system completion`
      ],
      outputFormat: 'JSON with array of planned compositions'
    },
    outputSchema: {
      type: 'object',
      required: ['compositions'],
      properties: {
        compositions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              composedFrom: { type: 'array', items: { type: 'string' } },
              providedFunctionality: { type: 'string' },
              reusable: { type: 'boolean' }
            }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'bottom-up', 'composition-planning', `level-${args.currentLevel}`]
}));

/**
 * Compose component from existing components
 */
export const agentComposeComponentTask = defineTask('agent-compose-component', (args, taskCtx) => ({
  kind: 'agent',
  title: `Compose: ${args.composition.name}`,
  description: 'Build higher-level component from existing ones',

  agent: {
    name: 'component-composer',
    prompt: {
      role: 'software developer',
      task: 'Compose a higher-level component from existing components',
      context: {
        task: args.task,
        composition: args.composition,
        level: args.level,
        tests: args.tests,
        availableComponents: args.availableComponents
      },
      instructions: [
        'Use the specified existing components',
        'Compose them into the new higher-level component',
        'Add any glue code needed for integration',
        'Implement the new interface',
        args.tests ? 'Ensure all integration tests pass' : 'Ensure correct composition',
        'Document how components are composed',
        'Make the composed component reusable if possible'
      ],
      outputFormat: 'JSON with composed component details, files created, tests passing'
    },
    outputSchema: {
      type: 'object',
      required: ['id', 'name', 'composed', 'filesCreated', 'testsPass'],
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        composed: { type: 'boolean' },
        filesCreated: { type: 'array', items: { type: 'string' } },
        composedFrom: { type: 'array', items: { type: 'string' } },
        implementation: { type: 'string' },
        testsPass: { type: 'boolean' },
        reusable: { type: 'boolean' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'bottom-up', 'composition', `level-${args.level}`]
}));

/**
 * Check if system is complete
 */
export const agentCheckSystemCompletionTask = defineTask('agent-check-system-completion', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Check system completion',
  description: 'Determine if system is complete',

  agent: {
    name: 'completion-checker',
    prompt: {
      role: 'system architect',
      task: 'Determine if the system is complete',
      context: {
        task: args.task,
        currentLevel: args.currentLevel,
        currentLevelComponents: args.currentLevelComponents,
        compositionTree: args.compositionTree
      },
      instructions: [
        'Review the original task/system requirements',
        'Check if current level components provide all needed functionality',
        'Determine if further composition is needed',
        'If system requirements are met, mark as complete',
        'If not, identify what still needs to be built'
      ],
      outputFormat: 'JSON with system complete status and explanation'
    },
    outputSchema: {
      type: 'object',
      required: ['systemComplete', 'explanation'],
      properties: {
        systemComplete: { type: 'boolean' },
        explanation: { type: 'string' },
        remainingWork: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'bottom-up', 'completion-check', `level-${args.currentLevel}`]
}));

/**
 * Integrate final system
 */
export const agentIntegrateSystemTask = defineTask('agent-integrate-system', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Integrate final system',
  description: 'Final system integration',

  agent: {
    name: 'system-integrator',
    prompt: {
      role: 'integration engineer',
      task: 'Integrate all components into final system',
      context: {
        task: args.task,
        compositionTree: args.compositionTree,
        componentLibrary: args.componentLibrary,
        topLevelComponents: args.topLevelComponents
      },
      instructions: [
        'Integrate all top-level components',
        'Create system entry points',
        'Wire up all dependencies',
        'Run end-to-end integration tests',
        'Verify system functionality',
        'Document system architecture'
      ],
      outputFormat: 'JSON with integration status, entry points, tests passed'
    },
    outputSchema: {
      type: 'object',
      required: ['integrationSuccessful', 'allTestsPassed'],
      properties: {
        integrationSuccessful: { type: 'boolean' },
        allTestsPassed: { type: 'boolean' },
        entryPoints: { type: 'array', items: { type: 'string' } },
        systemDocumentation: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'bottom-up', 'integration']
}));

/**
 * Validate bottom-up system
 */
export const agentValidateBottomUpSystemTask = defineTask('agent-validate-bottom-up-system', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate system',
  description: 'Final system validation',

  agent: {
    name: 'system-validator',
    prompt: {
      role: 'QA lead and architect',
      task: 'Validate the complete bottom-up built system',
      context: {
        task: args.task,
        compositionTree: args.compositionTree,
        componentLibrary: args.componentLibrary,
        finalIntegration: args.finalIntegration
      },
      instructions: [
        'Verify system meets original requirements',
        'Check all components are tested and working',
        'Verify integration is successful',
        'Run system-level tests',
        'Assess code quality and architecture',
        'Identify any issues or gaps'
      ],
      outputFormat: 'JSON with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['systemComplete', 'allTestsPassed', 'requirementsMet'],
      properties: {
        systemComplete: { type: 'boolean' },
        allTestsPassed: { type: 'boolean' },
        requirementsMet: { type: 'boolean' },
        issues: { type: 'array', items: { type: 'string' } },
        overallAssessment: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'bottom-up', 'validation']
}));
