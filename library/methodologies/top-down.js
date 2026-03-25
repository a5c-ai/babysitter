/**
 * @process methodologies/top-down
 * @description Top-Down Development - Start with high-level design, decompose, implement details
 * @inputs { task: string, maxDecompositionDepth: number, implementationStrategy: string }
 * @outputs { success: boolean, architecture: object, implementationTree: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Top-Down Development Process
 *
 * Methodology: High-level design → Decompose into modules → Decompose into functions → Implement details
 *
 * This process implements top-down development where:
 * 1. Start with overall system architecture and requirements
 * 2. Design high-level components and interfaces
 * 3. Decompose each component into subcomponents
 * 4. Continue decomposition until reaching implementable units
 * 5. Implement from top to bottom using stubs/mocks for lower levels
 * 6. Progressively refine and replace stubs with real implementations
 * 7. Integrate from top to bottom
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.task - Task/system to design and implement
 * @param {number} inputs.maxDecompositionDepth - Maximum decomposition levels (default: 4)
 * @param {string} inputs.implementationStrategy - 'breadth-first' or 'depth-first' (default: 'breadth-first')
 * @param {boolean} inputs.useStubs - Use stubs for unimplemented components (default: true)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Process result with architecture and implementation
 */
export async function process(inputs, ctx) {
  const {
    task,
    maxDecompositionDepth = 4,
    implementationStrategy = 'breadth-first',
    useStubs = true
  } = inputs;

  // Phase 1: High-level architecture design
  const architecture = await ctx.task(agentDesignArchitectureTask, {
    task,
    level: 0
  });

  const decompositionTree = {
    root: {
      id: 'root',
      name: task,
      level: 0,
      architecture,
      children: [],
      implementation: null
    }
  };

  const allComponents = [decompositionTree.root];

  // Phase 2: Decomposition - break down into components
  let currentLevel = 0;
  let componentsAtCurrentLevel = [decompositionTree.root];

  while (currentLevel < maxDecompositionDepth && componentsAtCurrentLevel.length > 0) {
    const nextLevelComponents = [];

    for (const component of componentsAtCurrentLevel) {
      // Decompose component into subcomponents
      const decomposition = await ctx.task(agentDecomposeComponentTask, {
        task,
        component,
        level: currentLevel + 1,
        maxDepth: maxDecompositionDepth
      });

      // Add subcomponents to tree
      for (const subcomp of decomposition.subcomponents) {
        const subcompNode = {
          id: subcomp.id,
          name: subcomp.name,
          level: currentLevel + 1,
          parent: component.id,
          description: subcomp.description,
          interface: subcomp.interface,
          dependencies: subcomp.dependencies,
          children: [],
          implementation: null,
          isLeaf: decomposition.isLeaf || currentLevel + 1 >= maxDecompositionDepth
        };

        component.children.push(subcompNode);
        allComponents.push(subcompNode);

        if (!subcompNode.isLeaf) {
          nextLevelComponents.push(subcompNode);
        }
      }
    }

    currentLevel++;
    componentsAtCurrentLevel = nextLevelComponents;
  }

  // Phase 3: Implementation (top-down with stubs)
  const implementationOrder = implementationStrategy === 'breadth-first'
    ? allComponents.slice().sort((a, b) => a.level - b.level)
    : getDepthFirstOrder(decompositionTree.root);

  const implementationResults = [];

  for (const component of implementationOrder) {
    // Check if dependencies are implemented (or stubbed)
    const dependencies = component.dependencies || [];
    const dependencyComponents = dependencies.map(depId =>
      allComponents.find(c => c.id === depId)
    );

    // Implement component
    const implementation = await ctx.task(agentImplementComponentTask, {
      task,
      component,
      parentComponent: allComponents.find(c => c.id === component.parent),
      childComponents: component.children,
      dependencyComponents,
      useStubs,
      isLeaf: component.isLeaf
    });

    component.implementation = implementation;
    implementationResults.push({
      componentId: component.id,
      componentName: component.name,
      level: component.level,
      implementation
    });
  }

  // Phase 4: Integration testing (top-down)
  const integrationResults = [];
  for (let level = 0; level <= currentLevel; level++) {
    const componentsAtLevel = allComponents.filter(c => c.level === level);

    for (const component of componentsAtLevel) {
      if (component.children.length > 0) {
        const integrationTest = await ctx.task(agentIntegrationTestTask, {
          task,
          component,
          children: component.children,
          level
        });

        integrationResults.push({
          componentId: component.id,
          level,
          integrationTest
        });
      }
    }
  }

  // Phase 5: Stub replacement (replace stubs with real implementations)
  let stubReplacements = [];
  if (useStubs) {
    const stubbedComponents = allComponents.filter(
      c => c.implementation?.isStub === true
    );

    for (const component of stubbedComponents) {
      const replacement = await ctx.task(agentReplaceStubTask, {
        task,
        component,
        stubImplementation: component.implementation
      });

      component.implementation = replacement;
      stubReplacements.push({
        componentId: component.id,
        replacement
      });
    }
  }

  // Final validation
  const validation = await ctx.task(agentValidateSystemTask, {
    task,
    architecture,
    decompositionTree,
    implementationResults,
    integrationResults
  });

  return {
    success: validation.systemComplete && validation.allTestsPassed,
    task,
    architecture,
    decompositionTree,
    totalComponents: allComponents.length,
    maxDepthReached: currentLevel,
    implementationResults,
    integrationResults,
    stubReplacements,
    validation,
    summary: {
      componentsByLevel: getComponentCountByLevel(allComponents, currentLevel),
      implementationStrategy,
      totalComponents: allComponents.length,
      leafComponents: allComponents.filter(c => c.isLeaf).length,
      stubsUsed: useStubs ? stubbedComponents.length : 0,
      systemComplete: validation.systemComplete,
      allTestsPassed: validation.allTestsPassed
    },
    metadata: {
      processId: 'methodologies/top-down',
      timestamp: ctx.now()
    }
  };
}

/**
 * Helper: Get depth-first traversal order
 */
function getDepthFirstOrder(root) {
  const order = [];

  function traverse(node) {
    order.push(node);
    for (const child of node.children) {
      traverse(child);
    }
  }

  traverse(root);
  return order;
}

/**
 * Helper: Count components by level
 */
function getComponentCountByLevel(components, maxLevel) {
  const counts = {};
  for (let i = 0; i <= maxLevel; i++) {
    counts[`level-${i}`] = components.filter(c => c.level === i).length;
  }
  return counts;
}

/**
 * Design high-level architecture
 */
export const agentDesignArchitectureTask = defineTask('agent-design-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design system architecture',
  description: 'Create high-level architecture and design',

  agent: {
    name: 'system-architect',
    prompt: {
      role: 'system architect',
      task: 'Design the high-level architecture for the system',
      context: {
        task: args.task,
        level: args.level
      },
      instructions: [
        'Analyze requirements and objectives',
        'Design overall system architecture',
        'Identify major components/modules',
        'Define component responsibilities',
        'Specify interfaces between components',
        'Consider scalability, maintainability, and extensibility',
        'Document key architectural decisions',
        'Create high-level data flow'
      ],
      outputFormat: 'JSON with system overview, major components, interfaces, and design decisions'
    },
    outputSchema: {
      type: 'object',
      required: ['systemOverview', 'majorComponents', 'interfaces', 'designDecisions'],
      properties: {
        systemOverview: { type: 'string' },
        majorComponents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              responsibility: { type: 'string' }
            }
          }
        },
        interfaces: { type: 'array', items: { type: 'string' } },
        designDecisions: { type: 'array', items: { type: 'string' } },
        dataFlow: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'top-down', 'architecture', 'level-0']
}));

/**
 * Decompose component into subcomponents
 */
export const agentDecomposeComponentTask = defineTask('agent-decompose-component', (args, taskCtx) => ({
  kind: 'agent',
  title: `Decompose: ${args.component.name}`,
  description: 'Break down component into subcomponents',

  agent: {
    name: 'component-designer',
    prompt: {
      role: 'component designer',
      task: 'Decompose the component into subcomponents',
      context: {
        task: args.task,
        component: args.component,
        level: args.level,
        maxDepth: args.maxDepth
      },
      instructions: [
        'Analyze the component responsibility',
        'Break down into logical subcomponents',
        'Each subcomponent should have a single, clear responsibility',
        'Define interfaces for each subcomponent',
        'Specify dependencies between subcomponents',
        'Determine if further decomposition is needed',
        `If at level ${args.maxDepth}, make these leaf components (directly implementable)`,
        'Keep decomposition balanced and maintainable'
      ],
      outputFormat: 'JSON with subcomponents, each with id, name, description, interface, dependencies'
    },
    outputSchema: {
      type: 'object',
      required: ['subcomponents', 'isLeaf'],
      properties: {
        subcomponents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              interface: { type: 'string' },
              dependencies: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        isLeaf: { type: 'boolean', description: 'True if these are leaf components' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'top-down', 'decomposition', `level-${args.level}`]
}));

/**
 * Implement component
 */
export const agentImplementComponentTask = defineTask('agent-implement-component', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement: ${args.component.name}`,
  description: 'Implement component with stubs or full implementation',

  agent: {
    name: 'component-implementer',
    prompt: {
      role: 'software developer',
      task: 'Implement the component',
      context: {
        task: args.task,
        component: args.component,
        parentComponent: args.parentComponent,
        childComponents: args.childComponents,
        dependencyComponents: args.dependencyComponents,
        useStubs: args.useStubs,
        isLeaf: args.isLeaf
      },
      instructions: [
        'Implement the component according to its interface',
        args.isLeaf
          ? 'This is a leaf component - implement fully with all details'
          : 'This is a parent component - implement using child components',
        args.useStubs && args.childComponents.length > 0
          ? 'Use stubs/mocks for child components that are not yet implemented'
          : 'Use actual implementations of child components',
        'Implement all interface methods',
        'Handle dependencies properly',
        'Add unit tests',
        'Document the implementation',
        'Ensure interface contracts are satisfied'
      ],
      outputFormat: 'JSON with implementation code, tests, files created, isStub flag'
    },
    outputSchema: {
      type: 'object',
      required: ['implemented', 'filesCreated', 'tests', 'isStub'],
      properties: {
        implemented: { type: 'boolean' },
        filesCreated: { type: 'array', items: { type: 'string' } },
        implementation: { type: 'string' },
        tests: { type: 'array', items: { type: 'string' } },
        isStub: { type: 'boolean' },
        stubsUsed: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'top-down', 'implementation', `level-${args.component.level}`, `component-${args.component.id}`]
}));

/**
 * Integration test
 */
export const agentIntegrationTestTask = defineTask('agent-integration-test', (args, taskCtx) => ({
  kind: 'agent',
  title: `Integration test: ${args.component.name}`,
  description: 'Test component integration with children',

  agent: {
    name: 'integration-tester',
    prompt: {
      role: 'QA engineer',
      task: 'Test integration between component and its children',
      context: {
        task: args.task,
        component: args.component,
        children: args.children,
        level: args.level
      },
      instructions: [
        'Test that parent component correctly integrates with child components',
        'Verify interface contracts are satisfied',
        'Test data flow between components',
        'Check error handling across component boundaries',
        'Run integration tests',
        'Verify system behavior at this level'
      ],
      outputFormat: 'JSON with test results, passed, failed, issues found'
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

  labels: ['agent', 'top-down', 'integration-test', `level-${args.level}`]
}));

/**
 * Replace stub with real implementation
 */
export const agentReplaceStubTask = defineTask('agent-replace-stub', (args, taskCtx) => ({
  kind: 'agent',
  title: `Replace stub: ${args.component.name}`,
  description: 'Replace stub with actual implementation',

  agent: {
    name: 'stub-replacer',
    prompt: {
      role: 'software developer',
      task: 'Replace stub implementation with real implementation',
      context: {
        task: args.task,
        component: args.component,
        stubImplementation: args.stubImplementation
      },
      instructions: [
        'Review the stub implementation',
        'Implement the actual functionality',
        'Maintain the same interface',
        'Ensure all tests still pass',
        'Add additional tests for new implementation',
        'Update documentation'
      ],
      outputFormat: 'JSON with new implementation, tests updated, files modified'
    },
    outputSchema: {
      type: 'object',
      required: ['implemented', 'filesModified', 'isStub'],
      properties: {
        implemented: { type: 'boolean' },
        filesModified: { type: 'array', items: { type: 'string' } },
        implementation: { type: 'string' },
        testsUpdated: { type: 'array', items: { type: 'string' } },
        isStub: { type: 'boolean' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'top-down', 'stub-replacement', `component-${args.component.id}`]
}));

/**
 * Validate complete system
 */
export const agentValidateSystemTask = defineTask('agent-validate-system', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate complete system',
  description: 'Validate entire system implementation',

  agent: {
    name: 'system-validator',
    prompt: {
      role: 'system architect and QA lead',
      task: 'Validate the complete system implementation',
      context: {
        task: args.task,
        architecture: args.architecture,
        decompositionTree: args.decompositionTree,
        implementationResults: args.implementationResults,
        integrationResults: args.integrationResults
      },
      instructions: [
        'Verify all components are implemented',
        'Check that architecture is followed',
        'Verify all interfaces are satisfied',
        'Check all integration tests passed',
        'Run end-to-end system tests',
        'Validate system meets original requirements',
        'Identify any gaps or issues'
      ],
      outputFormat: 'JSON with validation results, system completeness, issues'
    },
    outputSchema: {
      type: 'object',
      required: ['systemComplete', 'allTestsPassed', 'requirementsMet'],
      properties: {
        systemComplete: { type: 'boolean' },
        allTestsPassed: { type: 'boolean' },
        requirementsMet: { type: 'boolean' },
        gaps: { type: 'array', items: { type: 'string' } },
        issues: { type: 'array', items: { type: 'string' } },
        overallAssessment: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'top-down', 'validation']
}));
