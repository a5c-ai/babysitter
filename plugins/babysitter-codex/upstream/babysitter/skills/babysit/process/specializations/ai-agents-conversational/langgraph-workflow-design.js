/**
 * @process specializations/ai-agents-conversational/langgraph-workflow-design
 * @description LangGraph Workflow Design - Process for building stateful multi-agent workflows using LangGraph with
 * cyclic graphs, state management, checkpoints, and human-in-the-loop integration points.
 * @inputs { workflowName?: string, nodes?: array, stateSchema?: object, humanInLoop?: boolean, outputDir?: string }
 * @outputs { success: boolean, graphDefinition: object, stateSchema: object, checkpointLogic: object, integrationPoints: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/ai-agents-conversational/langgraph-workflow-design', {
 *   workflowName: 'customer-support-workflow',
 *   nodes: ['classifier', 'retriever', 'responder', 'escalator'],
 *   humanInLoop: true
 * });
 *
 * @references
 * - LangGraph Documentation: https://langchain-ai.github.io/langgraph/
 * - LangGraph Tutorials: https://langchain-ai.github.io/langgraph/tutorials/
 * - Stateful Agents: https://blog.langchain.dev/langgraph/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    workflowName = 'langgraph-workflow',
    nodes = ['start', 'process', 'end'],
    stateSchema = {},
    humanInLoop = true,
    outputDir = 'langgraph-output',
    checkpointEnabled = true,
    persistenceBackend = 'memory'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting LangGraph Workflow Design for ${workflowName}`);

  // ============================================================================
  // PHASE 1: WORKFLOW REQUIREMENTS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing workflow requirements');

  const requirements = await ctx.task(workflowRequirementsTask, {
    workflowName,
    nodes,
    stateSchema,
    humanInLoop,
    outputDir
  });

  artifacts.push(...requirements.artifacts);

  // ============================================================================
  // PHASE 2: STATE SCHEMA DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing state schema');

  const stateDesign = await ctx.task(stateSchemaDesignTask, {
    workflowName,
    requirements: requirements.analysis,
    nodes,
    outputDir
  });

  artifacts.push(...stateDesign.artifacts);

  // ============================================================================
  // PHASE 3: GRAPH DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 3: Defining workflow graph');

  const graphDefinition = await ctx.task(graphDefinitionTask, {
    workflowName,
    nodes,
    stateSchema: stateDesign.schema,
    requirements: requirements.analysis,
    outputDir
  });

  artifacts.push(...graphDefinition.artifacts);

  // ============================================================================
  // PHASE 4: NODE IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing graph nodes');

  const nodeImplementation = await ctx.task(nodeImplementationTask, {
    workflowName,
    nodes,
    graphDefinition: graphDefinition.graph,
    stateSchema: stateDesign.schema,
    outputDir
  });

  artifacts.push(...nodeImplementation.artifacts);

  // ============================================================================
  // PHASE 5: CHECKPOINT LOGIC
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing checkpointing');

  const checkpointLogic = await ctx.task(checkpointLogicTask, {
    workflowName,
    checkpointEnabled,
    persistenceBackend,
    stateSchema: stateDesign.schema,
    outputDir
  });

  artifacts.push(...checkpointLogic.artifacts);

  // ============================================================================
  // PHASE 6: HUMAN-IN-THE-LOOP INTEGRATION
  // ============================================================================

  let humanIntegration = null;
  if (humanInLoop) {
    ctx.log('info', 'Phase 6: Implementing human-in-the-loop');

    humanIntegration = await ctx.task(humanInLoopIntegrationTask, {
      workflowName,
      graphDefinition: graphDefinition.graph,
      checkpointLogic: checkpointLogic.logic,
      outputDir
    });

    artifacts.push(...humanIntegration.artifacts);
  }

  // ============================================================================
  // PHASE 7: WORKFLOW COMPILATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Compiling workflow');

  const compilation = await ctx.task(workflowCompilationTask, {
    workflowName,
    graphDefinition: graphDefinition.graph,
    nodeImplementation: nodeImplementation.nodes,
    checkpointLogic: checkpointLogic.logic,
    humanIntegration,
    outputDir
  });

  artifacts.push(...compilation.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `LangGraph Workflow ${workflowName} compiled. ${nodes.length} nodes, checkpointing: ${checkpointEnabled}. Review workflow?`,
    title: 'LangGraph Workflow Review',
    context: {
      runId: ctx.runId,
      summary: {
        workflowName,
        nodeCount: nodes.length,
        checkpointEnabled,
        humanInLoop,
        persistenceBackend
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'python' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    workflowName,
    graphDefinition: graphDefinition.graph,
    stateSchema: stateDesign.schema,
    checkpointLogic: checkpointLogic.logic,
    integrationPoints: humanIntegration ? humanIntegration.integrationPoints : [],
    compiledWorkflow: compilation.workflow,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/ai-agents-conversational/langgraph-workflow-design',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const workflowRequirementsTask = defineTask('workflow-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze Workflow Requirements - ${args.workflowName}`,
  agent: {
    name: 'langgraph-architect',  // AG-LG-001: Designs LangGraph workflows with cyclic and acyclic patterns
    prompt: {
      role: 'LangGraph Workflow Analyst',
      task: 'Analyze requirements for LangGraph workflow',
      context: args,
      instructions: [
        '1. Analyze workflow purpose and goals',
        '2. Identify required nodes and their functions',
        '3. Define edge conditions and transitions',
        '4. Identify cyclic patterns needed',
        '5. Define human-in-the-loop points',
        '6. Identify state requirements',
        '7. Document workflow constraints',
        '8. Save requirements analysis'
      ],
      outputFormat: 'JSON with requirements analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'artifacts'],
      properties: {
        analysis: { type: 'object' },
        nodeRequirements: { type: 'array' },
        edgeConditions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'langgraph', 'requirements']
}));

export const stateSchemaDesignTask = defineTask('state-schema-design', (args, taskCtx) => ({
  kind: 'skill',
  title: `Design State Schema - ${args.workflowName}`,
  skill: {
    name: 'langgraph-state-schema',  // SK-LG-001: LangGraph state schema definition with TypedDict and reducers
    prompt: {
      role: 'State Schema Designer',
      task: 'Design state schema for LangGraph workflow',
      context: args,
      instructions: [
        '1. Define state TypedDict or Pydantic model',
        '2. Identify all state fields needed',
        '3. Define state reducers for updates',
        '4. Handle message lists and annotations',
        '5. Define optional vs required fields',
        '6. Create state validation rules',
        '7. Document state transitions',
        '8. Save state schema'
      ],
      outputFormat: 'JSON with state schema'
    },
    outputSchema: {
      type: 'object',
      required: ['schema', 'artifacts'],
      properties: {
        schema: { type: 'object' },
        reducers: { type: 'object' },
        schemaCodePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'langgraph', 'state']
}));

export const graphDefinitionTask = defineTask('graph-definition', (args, taskCtx) => ({
  kind: 'skill',
  title: `Define Workflow Graph - ${args.workflowName}`,
  skill: {
    name: 'langgraph-checkpointer',  // SK-LG-002: LangGraph checkpoint configuration and persistence
    prompt: {
      role: 'LangGraph Designer',
      task: 'Define the workflow graph structure',
      context: args,
      instructions: [
        '1. Create StateGraph with state schema',
        '2. Add all nodes to the graph',
        '3. Define edges (unconditional)',
        '4. Define conditional edges with routing functions',
        '5. Set entry point (START)',
        '6. Set end conditions (END)',
        '7. Implement cycle detection',
        '8. Create graph visualization',
        '9. Save graph definition'
      ],
      outputFormat: 'JSON with graph definition'
    },
    outputSchema: {
      type: 'object',
      required: ['graph', 'artifacts'],
      properties: {
        graph: { type: 'object' },
        graphCodePath: { type: 'string' },
        visualization: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'langgraph', 'graph']
}));

export const nodeImplementationTask = defineTask('node-implementation', (args, taskCtx) => ({
  kind: 'skill',
  title: `Implement Graph Nodes - ${args.workflowName}`,
  skill: {
    name: 'langgraph-routing',  // SK-LG-004: Conditional edge routing and state-based transitions
    prompt: {
      role: 'LangGraph Node Developer',
      task: 'Implement all nodes in the workflow',
      context: args,
      instructions: [
        '1. Implement each node function',
        '2. Nodes receive state and return updates',
        '3. Integrate LLMs where needed',
        '4. Add tool bindings to nodes',
        '5. Implement routing functions for conditional edges',
        '6. Handle errors within nodes',
        '7. Add logging for debugging',
        '8. Save node implementations'
      ],
      outputFormat: 'JSON with node implementations'
    },
    outputSchema: {
      type: 'object',
      required: ['nodes', 'artifacts'],
      properties: {
        nodes: { type: 'array' },
        nodesCodePath: { type: 'string' },
        routingFunctions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'langgraph', 'nodes']
}));

export const checkpointLogicTask = defineTask('checkpoint-logic', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Checkpointing - ${args.workflowName}`,
  agent: {
    name: 'checkpoint-developer',
    prompt: {
      role: 'Checkpoint Developer',
      task: 'Implement checkpointing for workflow persistence',
      context: args,
      instructions: [
        '1. Configure checkpoint saver (memory, sqlite, postgres)',
        '2. Set up thread IDs for conversation tracking',
        '3. Implement checkpoint at each node',
        '4. Create state recovery logic',
        '5. Implement time-travel debugging',
        '6. Add checkpoint pruning for storage',
        '7. Test checkpoint/restore cycle',
        '8. Save checkpoint configuration'
      ],
      outputFormat: 'JSON with checkpoint logic'
    },
    outputSchema: {
      type: 'object',
      required: ['logic', 'artifacts'],
      properties: {
        logic: { type: 'object' },
        checkpointCodePath: { type: 'string' },
        saverConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'langgraph', 'checkpoint']
}));

export const humanInLoopIntegrationTask = defineTask('human-in-loop', (args, taskCtx) => ({
  kind: 'skill',
  title: `Integrate Human-in-the-Loop - ${args.workflowName}`,
  skill: {
    name: 'langgraph-human-in-loop',  // SK-LG-005: Human-in-the-loop integration with interrupt handlers
    prompt: {
      role: 'Human-in-the-Loop Developer',
      task: 'Implement human-in-the-loop integration points',
      context: args,
      instructions: [
        '1. Identify nodes requiring human approval',
        '2. Implement interrupt_before/interrupt_after',
        '3. Create approval request format',
        '4. Handle human input injection',
        '5. Implement timeout handling',
        '6. Create escalation paths',
        '7. Test human intervention flow',
        '8. Save HITL configuration'
      ],
      outputFormat: 'JSON with HITL integration'
    },
    outputSchema: {
      type: 'object',
      required: ['integrationPoints', 'artifacts'],
      properties: {
        integrationPoints: { type: 'array' },
        hitlCodePath: { type: 'string' },
        approvalFormat: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'langgraph', 'human-in-loop']
}));

export const workflowCompilationTask = defineTask('workflow-compilation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Compile Workflow - ${args.workflowName}`,
  agent: {
    name: 'workflow-compiler',
    prompt: {
      role: 'LangGraph Workflow Compiler',
      task: 'Compile and validate the complete workflow',
      context: args,
      instructions: [
        '1. Assemble all components',
        '2. Compile graph with checkpointer',
        '3. Validate graph structure',
        '4. Test workflow execution',
        '5. Generate workflow documentation',
        '6. Create usage examples',
        '7. Save compiled workflow'
      ],
      outputFormat: 'JSON with compiled workflow'
    },
    outputSchema: {
      type: 'object',
      required: ['workflow', 'artifacts'],
      properties: {
        workflow: { type: 'object' },
        workflowCodePath: { type: 'string' },
        documentation: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'langgraph', 'compilation']
}));
