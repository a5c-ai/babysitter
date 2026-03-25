/**
 * @process specializations/ai-agents-conversational/multi-agent-system
 * @description Multi-Agent System Design and Implementation - Process for designing and implementing multi-agent systems
 * with coordination patterns (hierarchical, cooperative, competitive, sequential, parallel) and agent communication protocols.
 * @inputs { systemName?: string, agents?: array, coordinationPattern?: string, communicationProtocol?: string, outputDir?: string }
 * @outputs { success: boolean, agentRoles: array, coordinationLogic: object, communicationProtocol: object, systemArchitecture: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/ai-agents-conversational/multi-agent-system', {
 *   systemName: 'software-dev-team',
 *   agents: ['architect', 'developer', 'tester', 'reviewer'],
 *   coordinationPattern: 'hierarchical',
 *   communicationProtocol: 'message-passing'
 * });
 *
 * @references
 * - CrewAI: https://docs.crewai.com/
 * - AutoGen: https://microsoft.github.io/autogen/
 * - LangGraph Multi-Agent: https://langchain-ai.github.io/langgraph/tutorials/multi_agent/
 * - Multi-Agent Patterns: https://blog.langchain.dev/langgraph-multi-agent-workflows/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    systemName = 'multi-agent-system',
    agents = ['coordinator', 'worker'],
    coordinationPattern = 'hierarchical',
    communicationProtocol = 'message-passing',
    outputDir = 'multi-agent-output',
    framework = 'crewai',
    sharedState = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Multi-Agent System Design for ${systemName}`);

  // ============================================================================
  // PHASE 1: SYSTEM ARCHITECTURE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 1: Designing system architecture');

  const systemArchitecture = await ctx.task(systemArchitectureTask, {
    systemName,
    agents,
    coordinationPattern,
    communicationProtocol,
    framework,
    sharedState,
    outputDir
  });

  artifacts.push(...systemArchitecture.artifacts);

  // ============================================================================
  // PHASE 2: AGENT ROLE DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 2: Defining agent roles');

  const agentRoles = await ctx.task(agentRoleDefinitionTask, {
    systemName,
    agents,
    architecture: systemArchitecture.architecture,
    coordinationPattern,
    outputDir
  });

  artifacts.push(...agentRoles.artifacts);

  // ============================================================================
  // PHASE 3: COORDINATION LOGIC
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing coordination logic');

  const coordinationLogic = await ctx.task(coordinationLogicTask, {
    systemName,
    agentRoles: agentRoles.roles,
    coordinationPattern,
    framework,
    outputDir
  });

  artifacts.push(...coordinationLogic.artifacts);

  // ============================================================================
  // PHASE 4: COMMUNICATION PROTOCOL
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing communication protocol');

  const communicationImpl = await ctx.task(communicationProtocolTask, {
    systemName,
    agentRoles: agentRoles.roles,
    communicationProtocol,
    sharedState,
    outputDir
  });

  artifacts.push(...communicationImpl.artifacts);

  // ============================================================================
  // PHASE 5: AGENT IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing agents');

  const agentImplementation = await ctx.task(agentImplementationTask, {
    systemName,
    agentRoles: agentRoles.roles,
    coordinationLogic: coordinationLogic.logic,
    communicationProtocol: communicationImpl.protocol,
    framework,
    outputDir
  });

  artifacts.push(...agentImplementation.artifacts);

  // ============================================================================
  // PHASE 6: SYSTEM INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Integrating multi-agent system');

  const systemIntegration = await ctx.task(systemIntegrationTask, {
    systemName,
    agents: agentImplementation.agents,
    coordinationLogic: coordinationLogic.logic,
    communicationProtocol: communicationImpl.protocol,
    framework,
    outputDir
  });

  artifacts.push(...systemIntegration.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Multi-Agent System ${systemName} complete. ${agents.length} agents with ${coordinationPattern} coordination. Review system?`,
    title: 'Multi-Agent System Review',
    context: {
      runId: ctx.runId,
      summary: {
        systemName,
        agentCount: agents.length,
        coordinationPattern,
        communicationProtocol,
        framework
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'javascript' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    systemName,
    agentRoles: agentRoles.roles,
    coordinationLogic: coordinationLogic.logic,
    communicationProtocol: communicationImpl.protocol,
    systemArchitecture: systemArchitecture.architecture,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/ai-agents-conversational/multi-agent-system',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const systemArchitectureTask = defineTask('system-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design Multi-Agent Architecture - ${args.systemName}`,
  agent: {
    name: 'multi-agent-coordinator',  // AG-AA-003: Designs multi-agent systems with supervisor/worker patterns
    prompt: {
      role: 'Multi-Agent Systems Architect',
      task: 'Design multi-agent system architecture',
      context: args,
      instructions: [
        '1. Design overall system topology',
        '2. Define agent hierarchy based on coordination pattern',
        '3. Design state management (shared vs distributed)',
        '4. Define message flow and routing',
        '5. Design fault tolerance and recovery',
        '6. Create system component diagram',
        '7. Define scalability considerations',
        '8. Document architecture decisions',
        '9. Save architecture documentation'
      ],
      outputFormat: 'JSON with architecture design'
    },
    outputSchema: {
      type: 'object',
      required: ['architecture', 'artifacts'],
      properties: {
        architecture: { type: 'object' },
        topology: { type: 'string' },
        componentDiagram: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'multi-agent', 'architecture']
}));

export const agentRoleDefinitionTask = defineTask('agent-role-definition', (args, taskCtx) => ({
  kind: 'skill',
  title: `Define Agent Roles - ${args.systemName}`,
  skill: {
    name: 'system-prompt-templates',  // SK-PE-001: Reusable system prompt templates for agent personas
    prompt: {
      role: 'Agent Role Designer',
      task: 'Define roles and responsibilities for each agent',
      context: args,
      instructions: [
        '1. Define each agent\'s role and purpose',
        '2. Specify agent capabilities and tools',
        '3. Define agent personality and behavior',
        '4. Specify decision-making authority',
        '5. Define interaction patterns with other agents',
        '6. Create agent persona prompts',
        '7. Document role boundaries',
        '8. Save role definitions'
      ],
      outputFormat: 'JSON with agent roles'
    },
    outputSchema: {
      type: 'object',
      required: ['roles', 'artifacts'],
      properties: {
        roles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              role: { type: 'string' },
              capabilities: { type: 'array' },
              tools: { type: 'array' }
            }
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
  labels: ['agent', 'multi-agent', 'roles']
}));

export const coordinationLogicTask = defineTask('coordination-logic', (args, taskCtx) => ({
  kind: 'skill',
  title: `Implement Coordination Logic - ${args.systemName}`,
  skill: {
    name: 'crewai-agents',  // SK-CR-001: CrewAI agent and crew configuration utilities
    prompt: {
      role: 'Coordination Logic Developer',
      task: 'Implement agent coordination logic',
      context: args,
      instructions: [
        '1. Implement coordination pattern (hierarchical/cooperative/competitive)',
        '2. Create task assignment logic',
        '3. Implement result aggregation',
        '4. Handle conflicts and voting',
        '5. Implement turn-taking for sequential patterns',
        '6. Add parallelization for parallel patterns',
        '7. Create coordination state machine',
        '8. Save coordination module'
      ],
      outputFormat: 'JSON with coordination logic'
    },
    outputSchema: {
      type: 'object',
      required: ['logic', 'artifacts'],
      properties: {
        logic: { type: 'object' },
        coordinationCodePath: { type: 'string' },
        stateMachine: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'multi-agent', 'coordination']
}));

export const communicationProtocolTask = defineTask('communication-protocol', (args, taskCtx) => ({
  kind: 'skill',
  title: `Implement Communication Protocol - ${args.systemName}`,
  skill: {
    name: 'autogen-conversation',  // SK-AG-002: AutoGen conversation pattern and message handling
    prompt: {
      role: 'Communication Protocol Developer',
      task: 'Implement agent communication protocol',
      context: args,
      instructions: [
        '1. Define message schema and format',
        '2. Implement message routing',
        '3. Create shared state management if enabled',
        '4. Implement message queuing',
        '5. Add message validation',
        '6. Handle communication failures',
        '7. Implement broadcast and unicast',
        '8. Save protocol implementation'
      ],
      outputFormat: 'JSON with communication protocol'
    },
    outputSchema: {
      type: 'object',
      required: ['protocol', 'artifacts'],
      properties: {
        protocol: { type: 'object' },
        messageSchema: { type: 'object' },
        protocolCodePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'multi-agent', 'communication']
}));

export const agentImplementationTask = defineTask('agent-implementation-multi', (args, taskCtx) => ({
  kind: 'skill',
  title: `Implement Agents - ${args.systemName}`,
  skill: {
    name: 'autogen-agent',  // SK-AG-001: AutoGen conversable agent setup and configuration
    prompt: {
      role: 'Agent Implementer',
      task: 'Implement all agents in the multi-agent system',
      context: args,
      instructions: [
        '1. Implement each agent based on role definition',
        '2. Configure agent LLM and prompts',
        '3. Integrate assigned tools',
        '4. Connect to communication protocol',
        '5. Implement agent lifecycle methods',
        '6. Add logging and tracing',
        '7. Test individual agents',
        '8. Save agent implementations'
      ],
      outputFormat: 'JSON with agent implementations'
    },
    outputSchema: {
      type: 'object',
      required: ['agents', 'artifacts'],
      properties: {
        agents: { type: 'array' },
        agentCodePaths: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'multi-agent', 'implementation']
}));

export const systemIntegrationTask = defineTask('system-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Integrate Multi-Agent System - ${args.systemName}`,
  agent: {
    name: 'system-integrator',
    prompt: {
      role: 'System Integrator',
      task: 'Integrate and test complete multi-agent system',
      context: args,
      instructions: [
        '1. Wire all agents together',
        '2. Configure coordination orchestrator',
        '3. Set up communication channels',
        '4. Create system entry point',
        '5. Test end-to-end workflows',
        '6. Verify agent interactions',
        '7. Document integration points',
        '8. Save integrated system'
      ],
      outputFormat: 'JSON with integrated system'
    },
    outputSchema: {
      type: 'object',
      required: ['system', 'artifacts'],
      properties: {
        system: { type: 'object' },
        systemCodePath: { type: 'string' },
        testResults: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'multi-agent', 'integration']
}));
