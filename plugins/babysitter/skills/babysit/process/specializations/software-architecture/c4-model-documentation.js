/**
 * @process software-architecture/c4-model-documentation
 * @description Complete C4 Model architecture documentation process with hierarchical diagram generation (Context, Container, Component, Code levels) and supplementary diagrams
 * @inputs { systemName: string, requirements: array, technologies: array, users: array, externalSystems: array, deploymentArchitecture: object, outputDir: string }
 * @outputs { success: boolean, contextDiagram: string, containerDiagram: string, componentDiagrams: array, supplementaryDiagrams: array, narrativeDocument: string, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    systemName = 'System',
    requirements = [],
    technologies = [],
    users = [],
    externalSystems = [],
    deploymentArchitecture = {},
    outputDir = 'c4-architecture-output',
    includeCodeDiagrams = false,
    diagramFormat = 'plantuml', // plantuml, mermaid, or structurizr
    generateDeploymentDiagram = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting C4 Model Architecture Documentation for ${systemName}`);

  // ============================================================================
  // PHASE 1: SYSTEM CONTEXT ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing system context and boundaries');
  const systemContext = await ctx.task(systemContextAnalysisTask, {
    systemName,
    requirements,
    users,
    externalSystems,
    outputDir
  });

  artifacts.push(...systemContext.artifacts);

  // ============================================================================
  // PHASE 2: CONTEXT DIAGRAM (LEVEL 1)
  // ============================================================================

  ctx.log('info', 'Phase 2: Creating C4 Context Diagram (Level 1)');
  const contextDiagram = await ctx.task(contextDiagramGenerationTask, {
    systemName,
    systemContext,
    diagramFormat,
    outputDir
  });

  artifacts.push(...contextDiagram.artifacts);

  // Breakpoint: Review Context Diagram with stakeholders
  await ctx.breakpoint({
    question: `Context diagram created. Review system boundaries, users (${contextDiagram.userCount}), and external systems (${contextDiagram.externalSystemCount}). Approve to proceed to Container diagram?`,
    title: 'C4 Context Diagram Review',
    context: {
      runId: ctx.runId,
      files: contextDiagram.artifacts.map(a => ({
        path: a.path,
        format: a.format || 'plantuml',
        language: a.language || 'plantuml',
        label: a.label || 'Context Diagram'
      })),
      summary: {
        systemName,
        userCount: contextDiagram.userCount,
        externalSystemCount: contextDiagram.externalSystemCount,
        systemPurpose: contextDiagram.systemPurpose
      }
    }
  });

  // ============================================================================
  // PHASE 3: CONTAINER IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Identifying containers and technology choices');
  const containerIdentification = await ctx.task(containerIdentificationTask, {
    systemName,
    requirements,
    technologies,
    systemContext,
    deploymentArchitecture,
    outputDir
  });

  artifacts.push(...containerIdentification.artifacts);

  // ============================================================================
  // PHASE 4: CONTAINER DIAGRAM (LEVEL 2)
  // ============================================================================

  ctx.log('info', 'Phase 4: Creating C4 Container Diagram (Level 2)');
  const containerDiagram = await ctx.task(containerDiagramGenerationTask, {
    systemName,
    systemContext,
    containerIdentification,
    diagramFormat,
    outputDir
  });

  artifacts.push(...containerDiagram.artifacts);

  // Breakpoint: Review Container Diagram for technology approval
  await ctx.breakpoint({
    question: `Container diagram created with ${containerDiagram.containerCount} containers. Review technology choices and inter-container communication. Approve to proceed to Component diagrams?`,
    title: 'C4 Container Diagram Technology Review',
    context: {
      runId: ctx.runId,
      files: containerDiagram.artifacts.map(a => ({
        path: a.path,
        format: a.format || 'plantuml',
        language: a.language || 'plantuml',
        label: a.label || 'Container Diagram'
      })),
      summary: {
        systemName,
        containerCount: containerDiagram.containerCount,
        technologies: containerDiagram.technologies,
        databases: containerDiagram.databases
      }
    }
  });

  // ============================================================================
  // PHASE 5: COMPONENT BREAKDOWN (PARALLEL)
  // ============================================================================

  ctx.log('info', 'Phase 5: Breaking down containers into components');

  // Generate component diagrams for each container in parallel
  const componentTasks = containerIdentification.containers.map(container => ({
    name: `component-breakdown-${container.name}`,
    task: componentBreakdownTask,
    args: {
      systemName,
      container,
      requirements,
      outputDir
    }
  }));

  const componentBreakdowns = await ctx.parallel.all(
    componentTasks.map(t => ctx.task(t.task, t.args))
  );

  componentBreakdowns.forEach(breakdown => {
    artifacts.push(...breakdown.artifacts);
  });

  // ============================================================================
  // PHASE 6: COMPONENT DIAGRAMS (LEVEL 3)
  // ============================================================================

  ctx.log('info', 'Phase 6: Creating C4 Component Diagrams (Level 3) for each container');

  const componentDiagramTasks = componentBreakdowns.map((breakdown, index) => ({
    name: `component-diagram-${breakdown.containerName}`,
    task: componentDiagramGenerationTask,
    args: {
      systemName,
      containerName: breakdown.containerName,
      componentBreakdown: breakdown,
      diagramFormat,
      outputDir
    }
  }));

  const componentDiagrams = await ctx.parallel.all(
    componentDiagramTasks.map(t => ctx.task(t.task, t.args))
  );

  componentDiagrams.forEach(diagram => {
    artifacts.push(...diagram.artifacts);
  });

  const totalComponents = componentDiagrams.reduce((sum, d) => sum + d.componentCount, 0);

  // Breakpoint: Review Component Diagrams with development team
  await ctx.breakpoint({
    question: `Component diagrams created for ${componentDiagrams.length} containers with ${totalComponents} total components. Review component responsibilities and dependencies. Approve?`,
    title: 'C4 Component Diagrams Development Review',
    context: {
      runId: ctx.runId,
      files: componentDiagrams.flatMap(d =>
        d.artifacts.map(a => ({
          path: a.path,
          format: a.format || 'plantuml',
          language: a.language || 'plantuml',
          label: a.label || `Component Diagram: ${d.containerName}`
        }))
      ),
      summary: {
        systemName,
        containerCount: componentDiagrams.length,
        totalComponents,
        containersDetailed: componentDiagrams.map(d => ({
          container: d.containerName,
          components: d.componentCount,
          interfaces: d.interfaceCount
        }))
      }
    }
  });

  // ============================================================================
  // PHASE 7: CODE DIAGRAMS (LEVEL 4) - OPTIONAL
  // ============================================================================

  let codeDiagrams = [];
  if (includeCodeDiagrams) {
    ctx.log('info', 'Phase 7: Creating C4 Code Diagrams (Level 4) for complex components');

    // Identify complex components requiring code-level diagrams
    const complexComponents = componentBreakdowns.flatMap(breakdown =>
      breakdown.components
        .filter(c => c.complexity === 'high' || c.requiresCodeDiagram)
        .map(c => ({ ...c, containerName: breakdown.containerName }))
    );

    if (complexComponents.length > 0) {
      const codeDiagramTasks = complexComponents.map(component => ({
        name: `code-diagram-${component.name}`,
        task: codeDiagramGenerationTask,
        args: {
          systemName,
          containerName: component.containerName,
          component,
          diagramFormat,
          outputDir
        }
      }));

      codeDiagrams = await ctx.parallel.all(
        codeDiagramTasks.map(t => ctx.task(t.task, t.args))
      );

      codeDiagrams.forEach(diagram => {
        artifacts.push(...diagram.artifacts);
      });

      ctx.log('info', `Generated ${codeDiagrams.length} code-level diagrams for complex components`);
    } else {
      ctx.log('info', 'No complex components identified requiring code-level diagrams');
    }
  }

  // ============================================================================
  // PHASE 8: SUPPLEMENTARY DIAGRAMS
  // ============================================================================

  ctx.log('info', 'Phase 8: Creating supplementary diagrams');

  const supplementaryTasks = [];

  // Deployment Diagram
  if (generateDeploymentDiagram && Object.keys(deploymentArchitecture).length > 0) {
    supplementaryTasks.push({
      name: 'deployment-diagram',
      task: deploymentDiagramGenerationTask,
      args: {
        systemName,
        deploymentArchitecture,
        containers: containerIdentification.containers,
        diagramFormat,
        outputDir
      }
    });
  }

  // Dynamic Diagram (key user journeys)
  if (requirements.some(r => r.userJourney || r.scenario)) {
    supplementaryTasks.push({
      name: 'dynamic-diagram',
      task: dynamicDiagramGenerationTask,
      args: {
        systemName,
        requirements: requirements.filter(r => r.userJourney || r.scenario),
        containers: containerIdentification.containers,
        diagramFormat,
        outputDir
      }
    });
  }

  // System Landscape (if multiple systems)
  if (externalSystems.length > 0) {
    supplementaryTasks.push({
      name: 'system-landscape',
      task: systemLandscapeDiagramTask,
      args: {
        systemName,
        systemContext,
        externalSystems,
        diagramFormat,
        outputDir
      }
    });
  }

  let supplementaryDiagrams = [];
  if (supplementaryTasks.length > 0) {
    supplementaryDiagrams = await ctx.parallel.all(
      supplementaryTasks.map(t => ctx.task(t.task, t.args))
    );

    supplementaryDiagrams.forEach(diagram => {
      artifacts.push(...diagram.artifacts);
    });

    ctx.log('info', `Generated ${supplementaryDiagrams.length} supplementary diagrams`);
  }

  // ============================================================================
  // PHASE 9: ARCHITECTURE NARRATIVE DOCUMENT
  // ============================================================================

  ctx.log('info', 'Phase 9: Generating comprehensive architecture narrative document');
  const narrativeDocument = await ctx.task(architectureNarrativeTask, {
    systemName,
    systemContext,
    containerIdentification,
    componentBreakdowns,
    contextDiagram,
    containerDiagram,
    componentDiagrams,
    codeDiagrams,
    supplementaryDiagrams,
    requirements,
    technologies,
    outputDir
  });

  artifacts.push(...narrativeDocument.artifacts);

  // ============================================================================
  // PHASE 10: QUALITY VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Validating C4 documentation quality and completeness');
  const qualityValidation = await ctx.task(c4QualityValidationTask, {
    systemName,
    contextDiagram,
    containerDiagram,
    componentDiagrams,
    codeDiagrams,
    supplementaryDiagrams,
    narrativeDocument,
    outputDir
  });

  artifacts.push(...qualityValidation.artifacts);

  const qualityScore = qualityValidation.overallScore;
  const qualityMet = qualityScore >= 85;

  // Final Breakpoint: Review complete C4 documentation
  await ctx.breakpoint({
    question: `C4 Model documentation complete. Quality score: ${qualityScore}/100. ${qualityMet ? 'Documentation meets quality standards!' : 'Documentation may need refinement.'} Review and approve?`,
    title: 'C4 Architecture Documentation Final Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        qualityScore,
        qualityMet,
        systemName,
        totalArtifacts: artifacts.length,
        diagramCounts: {
          context: 1,
          container: 1,
          component: componentDiagrams.length,
          code: codeDiagrams.length,
          supplementary: supplementaryDiagrams.length
        },
        totalContainers: containerIdentification.containers.length,
        totalComponents,
        narrativeDocumentPath: narrativeDocument.documentPath
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    systemName,
    qualityScore,
    qualityMet,
    contextDiagram: {
      path: contextDiagram.diagramPath,
      userCount: contextDiagram.userCount,
      externalSystemCount: contextDiagram.externalSystemCount
    },
    containerDiagram: {
      path: containerDiagram.diagramPath,
      containerCount: containerDiagram.containerCount,
      technologies: containerDiagram.technologies,
      databases: containerDiagram.databases
    },
    componentDiagrams: componentDiagrams.map(d => ({
      containerName: d.containerName,
      path: d.diagramPath,
      componentCount: d.componentCount,
      interfaceCount: d.interfaceCount
    })),
    codeDiagrams: codeDiagrams.map(d => ({
      componentName: d.componentName,
      path: d.diagramPath,
      classCount: d.classCount,
      designPatterns: d.designPatterns
    })),
    supplementaryDiagrams: supplementaryDiagrams.map(d => ({
      type: d.type,
      path: d.diagramPath,
      description: d.description
    })),
    narrativeDocument: narrativeDocument.documentPath,
    artifacts,
    duration,
    metadata: {
      processId: 'software-architecture/c4-model-documentation',
      timestamp: startTime,
      systemName,
      diagramFormat,
      outputDir,
      totalDiagrams: 2 + componentDiagrams.length + codeDiagrams.length + supplementaryDiagrams.length
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: System Context Analysis
export const systemContextAnalysisTask = defineTask('system-context-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze system context and boundaries',
  agent: {
    name: 'system-context-analyst',
    prompt: {
      role: 'software architect specializing in C4 modeling',
      task: 'Analyze system boundaries, identify users, external systems, and define high-level system purpose and scope',
      context: args,
      instructions: [
        'Review requirements to understand system scope and purpose',
        'Identify all user types and personas who interact with the system',
        'Identify all external systems the system integrates with',
        'Define clear system boundary (what is inside vs outside the system)',
        'Document high-level system responsibilities and capabilities',
        'Identify key interactions between users, system, and external systems',
        'Document technology choices at system level',
        'Create system context summary document',
        'Prepare data for Context diagram generation'
      ],
      outputFormat: 'JSON with systemPurpose, systemBoundary, users (array), externalSystems (array), keyInteractions (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['systemPurpose', 'users', 'externalSystems', 'artifacts'],
      properties: {
        systemPurpose: { type: 'string' },
        systemBoundary: { type: 'string' },
        users: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              responsibilities: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        externalSystems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              protocol: { type: 'string' },
              purpose: { type: 'string' }
            }
          }
        },
        keyInteractions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              from: { type: 'string' },
              to: { type: 'string' },
              description: { type: 'string' },
              protocol: { type: 'string' }
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
  labels: ['agent', 'c4-model', 'context-analysis']
}));

// Task 2: Context Diagram Generation
export const contextDiagramGenerationTask = defineTask('context-diagram-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate C4 Context Diagram (Level 1)',
  agent: {
    name: 'context-diagram-generator',
    prompt: {
      role: 'software architect and diagram specialist',
      task: 'Generate C4 Context Diagram showing system boundaries, users, and external systems using specified diagram format',
      context: args,
      instructions: [
        'Create Context diagram using PlantUML, Mermaid, or Structurizr DSL based on diagramFormat',
        'Show the system as a single box in the center',
        'Show all users (personas) as Person elements',
        'Show all external systems as System elements',
        'Draw relationships with clear labels describing interactions',
        'Use consistent C4 notation and styling',
        'Include legend explaining diagram elements',
        'Add title and description',
        'Save diagram source code to output directory',
        'Generate diagram summary and metadata'
      ],
      outputFormat: 'JSON with diagramPath, diagramSource, userCount, externalSystemCount, systemPurpose, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['diagramPath', 'userCount', 'externalSystemCount', 'systemPurpose', 'artifacts'],
      properties: {
        diagramPath: { type: 'string' },
        diagramSource: { type: 'string' },
        userCount: { type: 'number' },
        externalSystemCount: { type: 'number' },
        systemPurpose: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'c4-model', 'context-diagram', 'level-1']
}));

// Task 3: Container Identification
export const containerIdentificationTask = defineTask('container-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify containers and technology choices',
  agent: {
    name: 'container-identifier',
    prompt: {
      role: 'software architect specializing in application architecture',
      task: 'Identify all deployable units (containers) within the system including applications, databases, and data stores with their technology choices',
      context: args,
      instructions: [
        'Analyze requirements and technologies to identify containers',
        'A container is a separately deployable unit: web app, mobile app, API, database, message queue, etc.',
        'For each container, identify: name, type, technology, responsibility, and dependencies',
        'Identify web applications (React, Angular, Vue, etc.)',
        'Identify backend APIs (Node.js, Java, Python, etc.)',
        'Identify databases (PostgreSQL, MongoDB, Redis, etc.)',
        'Identify message brokers (RabbitMQ, Kafka, etc.)',
        'Identify file storage (S3, blob storage, etc.)',
        'Document inter-container communication protocols (REST, gRPC, messaging)',
        'Map containers to deployment architecture',
        'Create container inventory document'
      ],
      outputFormat: 'JSON with containers (array), technologies (array), databases (array), communicationProtocols (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['containers', 'technologies', 'artifacts'],
      properties: {
        containers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              technology: { type: 'string' },
              description: { type: 'string' },
              responsibilities: { type: 'array', items: { type: 'string' } },
              dependencies: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        technologies: { type: 'array', items: { type: 'string' } },
        databases: { type: 'array', items: { type: 'string' } },
        communicationProtocols: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'c4-model', 'container-identification']
}));

// Task 4: Container Diagram Generation
export const containerDiagramGenerationTask = defineTask('container-diagram-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate C4 Container Diagram (Level 2)',
  agent: {
    name: 'container-diagram-generator',
    prompt: {
      role: 'software architect and diagram specialist',
      task: 'Generate C4 Container Diagram showing all deployable units, technology choices, and inter-container communication',
      context: args,
      instructions: [
        'Create Container diagram using specified diagram format',
        'Show each container with name and technology stack',
        'Show all users from Context diagram',
        'Show relevant external systems',
        'Draw relationships between containers with protocols',
        'Use different colors/shapes for different container types (web app, API, database)',
        'Include technology labels on containers',
        'Add communication protocol labels on relationships',
        'Use consistent C4 notation',
        'Include legend',
        'Save diagram source and generate metadata'
      ],
      outputFormat: 'JSON with diagramPath, containerCount, technologies (array), databases (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['diagramPath', 'containerCount', 'technologies', 'artifacts'],
      properties: {
        diagramPath: { type: 'string' },
        diagramSource: { type: 'string' },
        containerCount: { type: 'number' },
        technologies: { type: 'array', items: { type: 'string' } },
        databases: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'c4-model', 'container-diagram', 'level-2']
}));

// Task 5: Component Breakdown
export const componentBreakdownTask = defineTask('component-breakdown', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Break down container into components',
  agent: {
    name: 'component-breakdown-analyst',
    prompt: {
      role: 'software architect specializing in component design',
      task: 'Decompose a container into its constituent components, define responsibilities, interfaces, and dependencies',
      context: args,
      instructions: [
        'Analyze container responsibilities and requirements',
        'Identify logical components within the container',
        'A component is a grouping of related functionality: controllers, services, repositories, etc.',
        'For each component: name, responsibility, interfaces, dependencies',
        'Identify public APIs/interfaces exposed by components',
        'Map component dependencies (which components call which)',
        'Identify design patterns used (MVC, layered, hexagonal, etc.)',
        'Assess component complexity (low/medium/high)',
        'Flag complex components that may need code-level diagrams',
        'Create component inventory for this container'
      ],
      outputFormat: 'JSON with containerName, components (array), interfaces (array), designPatterns (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['containerName', 'components', 'artifacts'],
      properties: {
        containerName: { type: 'string' },
        components: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              responsibility: { type: 'string' },
              interfaces: { type: 'array', items: { type: 'string' } },
              dependencies: { type: 'array', items: { type: 'string' } },
              complexity: { type: 'string', enum: ['low', 'medium', 'high'] },
              requiresCodeDiagram: { type: 'boolean' }
            }
          }
        },
        interfaces: { type: 'array', items: { type: 'string' } },
        designPatterns: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'c4-model', 'component-breakdown']
}));

// Task 6: Component Diagram Generation
export const componentDiagramGenerationTask = defineTask('component-diagram-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate C4 Component Diagram (Level 3)',
  agent: {
    name: 'component-diagram-generator',
    prompt: {
      role: 'software architect and diagram specialist',
      task: 'Generate C4 Component Diagram for a specific container showing internal components and their relationships',
      context: args,
      instructions: [
        'Create Component diagram for the specified container',
        'Show all components within the container boundary',
        'Show component interfaces and APIs',
        'Draw dependencies between components',
        'Show connections to external containers (from Container diagram)',
        'Label relationships with interaction types',
        'Indicate design patterns visually if applicable',
        'Use consistent C4 Component notation',
        'Include container boundary and title',
        'Save diagram source and metadata'
      ],
      outputFormat: 'JSON with containerName, diagramPath, componentCount, interfaceCount, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['containerName', 'diagramPath', 'componentCount', 'artifacts'],
      properties: {
        containerName: { type: 'string' },
        diagramPath: { type: 'string' },
        diagramSource: { type: 'string' },
        componentCount: { type: 'number' },
        interfaceCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'c4-model', 'component-diagram', 'level-3']
}));

// Task 7: Code Diagram Generation (Optional)
export const codeDiagramGenerationTask = defineTask('code-diagram-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate C4 Code Diagram (Level 4)',
  agent: {
    name: 'code-diagram-generator',
    prompt: {
      role: 'software architect and UML specialist',
      task: 'Generate code-level UML class diagram for a complex component showing classes, interfaces, and design patterns',
      context: args,
      instructions: [
        'Create UML class diagram for the specified component',
        'Show key classes and interfaces',
        'Show relationships: inheritance, composition, aggregation, association',
        'Highlight design patterns used (Strategy, Factory, Observer, etc.)',
        'Show method signatures for important operations',
        'Keep diagram focused on architectural aspects, not every detail',
        'Use standard UML notation',
        'Include pattern annotations',
        'Save diagram source',
        'Document design patterns applied'
      ],
      outputFormat: 'JSON with componentName, diagramPath, classCount, designPatterns (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['componentName', 'diagramPath', 'artifacts'],
      properties: {
        componentName: { type: 'string' },
        diagramPath: { type: 'string' },
        diagramSource: { type: 'string' },
        classCount: { type: 'number' },
        designPatterns: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'c4-model', 'code-diagram', 'level-4', 'uml']
}));

// Task 8: Deployment Diagram Generation
export const deploymentDiagramGenerationTask = defineTask('deployment-diagram-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate C4 Deployment Diagram',
  agent: {
    name: 'deployment-diagram-generator',
    prompt: {
      role: 'DevOps architect and infrastructure specialist',
      task: 'Generate C4 Deployment Diagram showing how containers are deployed to infrastructure',
      context: args,
      instructions: [
        'Create Deployment diagram showing infrastructure topology',
        'Show deployment nodes: servers, cloud instances, containers, orchestrators',
        'Map containers from Container diagram to deployment nodes',
        'Show networking: load balancers, firewalls, subnets',
        'Indicate scaling strategy (horizontal/vertical)',
        'Show deployment environments if specified (prod, staging, dev)',
        'Include infrastructure technology (Kubernetes, Docker, VMs, etc.)',
        'Use C4 Deployment diagram notation',
        'Save diagram source and metadata'
      ],
      outputFormat: 'JSON with type, diagramPath, description, deploymentNodes (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['type', 'diagramPath', 'description', 'artifacts'],
      properties: {
        type: { type: 'string', enum: ['deployment'] },
        diagramPath: { type: 'string' },
        diagramSource: { type: 'string' },
        description: { type: 'string' },
        deploymentNodes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'c4-model', 'deployment-diagram', 'supplementary']
}));

// Task 9: Dynamic Diagram Generation
export const dynamicDiagramGenerationTask = defineTask('dynamic-diagram-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate C4 Dynamic Diagram',
  agent: {
    name: 'dynamic-diagram-generator',
    prompt: {
      role: 'software architect and sequence diagram specialist',
      task: 'Generate C4 Dynamic Diagram showing runtime behavior for key user journeys or scenarios',
      context: args,
      instructions: [
        'Analyze requirements to identify key user journeys and scenarios',
        'For each critical scenario, create dynamic sequence diagram',
        'Show containers from Container diagram as participants',
        'Show step-by-step interactions with numbered sequence',
        'Include asynchronous operations if applicable',
        'Show request/response flows',
        'Use C4 Dynamic diagram notation (similar to sequence diagrams)',
        'Focus on container-level interactions, not detailed code',
        'Save diagram sources and metadata'
      ],
      outputFormat: 'JSON with type, diagramPath, description, scenarioCount, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['type', 'diagramPath', 'description', 'artifacts'],
      properties: {
        type: { type: 'string', enum: ['dynamic'] },
        diagramPath: { type: 'string' },
        diagramSource: { type: 'string' },
        description: { type: 'string' },
        scenarioCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'c4-model', 'dynamic-diagram', 'supplementary']
}));

// Task 10: System Landscape Diagram
export const systemLandscapeDiagramTask = defineTask('system-landscape-diagram', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate C4 System Landscape Diagram',
  agent: {
    name: 'landscape-diagram-generator',
    prompt: {
      role: 'enterprise architect',
      task: 'Generate C4 System Landscape Diagram showing multiple systems and their relationships in the enterprise',
      context: args,
      instructions: [
        'Create System Landscape showing multiple systems',
        'Show the target system and all external systems',
        'Show users/personas interacting with systems',
        'Show relationships between systems',
        'Use highest level of abstraction (even higher than Context)',
        'Focus on enterprise-wide view',
        'Use C4 System Landscape notation',
        'Save diagram source and metadata'
      ],
      outputFormat: 'JSON with type, diagramPath, description, systemCount, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['type', 'diagramPath', 'description', 'artifacts'],
      properties: {
        type: { type: 'string', enum: ['landscape'] },
        diagramPath: { type: 'string' },
        diagramSource: { type: 'string' },
        description: { type: 'string' },
        systemCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'c4-model', 'landscape-diagram', 'supplementary']
}));

// Task 11: Architecture Narrative Document
export const architectureNarrativeTask = defineTask('architecture-narrative-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive architecture narrative document',
  agent: {
    name: 'architecture-writer',
    prompt: {
      role: 'technical writer and software architect',
      task: 'Create comprehensive architecture documentation narrative explaining all C4 diagrams with context, rationale, and technical details',
      context: args,
      instructions: [
        'Create executive summary of the architecture',
        'Explain system purpose and business context',
        'Document each C4 level with narrative explanation:',
        '  - Context level: system boundaries, users, external systems',
        '  - Container level: technology choices, deployment units, rationale',
        '  - Component level: internal structure per container',
        '  - Code level: design patterns and implementation approaches',
        'Explain key architectural decisions and trade-offs',
        'Reference diagram files with embedded links',
        'Include technology stack summary table',
        'Document quality attributes addressed by architecture',
        'Include deployment and operational considerations',
        'Add glossary of terms',
        'Format as professional Markdown document',
        'Ensure document is actionable for development teams',
        'Save narrative document to output directory'
      ],
      outputFormat: 'JSON with documentPath, executiveSummary, technologiesSummary (array), keyDecisions (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentPath', 'executiveSummary', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        technologiesSummary: { type: 'array', items: { type: 'string' } },
        keyDecisions: { type: 'array', items: { type: 'string' } },
        qualityAttributes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'c4-model', 'documentation', 'narrative']
}));

// Task 12: C4 Quality Validation
export const c4QualityValidationTask = defineTask('c4-quality-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate C4 documentation quality and completeness',
  agent: {
    name: 'c4-quality-validator',
    prompt: {
      role: 'principal software architect and C4 modeling expert',
      task: 'Assess C4 documentation quality, completeness, and adherence to C4 modeling best practices',
      context: args,
      instructions: [
        'Evaluate Context diagram completeness (weight: 15%)',
        '  - All users identified?',
        '  - All external systems identified?',
        '  - Clear system boundary?',
        'Evaluate Container diagram quality (weight: 25%)',
        '  - All deployable units shown?',
        '  - Technology choices documented?',
        '  - Communication protocols clear?',
        'Evaluate Component diagrams thoroughness (weight: 25%)',
        '  - Components have clear responsibilities?',
        '  - Interfaces well-defined?',
        '  - Dependencies mapped?',
        'Assess diagram notation consistency (weight: 10%)',
        'Evaluate narrative documentation quality (weight: 15%)',
        'Check supplementary diagrams relevance (weight: 10%)',
        'Calculate weighted overall score (0-100)',
        'Identify gaps and missing elements',
        'Provide specific recommendations for improvement',
        'Validate adherence to C4 modeling principles'
      ],
      outputFormat: 'JSON with overallScore (number 0-100), componentScores (object), gaps (array), recommendations (array), c4BestPractices (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'recommendations', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            contextDiagram: { type: 'number' },
            containerDiagram: { type: 'number' },
            componentDiagrams: { type: 'number' },
            diagramNotation: { type: 'number' },
            narrativeDocumentation: { type: 'number' },
            supplementaryDiagrams: { type: 'number' }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        c4BestPractices: {
          type: 'object',
          properties: {
            hierarchicalAbstraction: { type: 'boolean' },
            consistentNotation: { type: 'boolean' },
            technologyExplicit: { type: 'boolean' },
            audienceAppropriate: { type: 'boolean' }
          }
        },
        strengths: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'c4-model', 'validation', 'quality-scoring']
}));
