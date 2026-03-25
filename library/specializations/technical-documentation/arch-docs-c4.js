/**
 * @process technical-documentation/arch-docs-c4
 * @description Complete C4 Model architecture documentation process for technical documentation with focus on clarity, accessibility, and multiple audience levels (executive, developer, operations)
 * @inputs { systemName: string, projectContext: string, targetAudiences: array, requirements: array, technologies: array, users: array, externalSystems: array, deploymentArchitecture: object, outputDir: string, documentationStyle: object }
 * @outputs { success: boolean, documentationPackage: object, contextDiagram: string, containerDiagram: string, componentDiagrams: array, supplementaryDiagrams: array, narrativeDocument: string, audienceGuides: array, artifacts: array, qualityScore: number }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    systemName = 'System',
    projectContext = '',
    targetAudiences = ['developers', 'architects', 'operations'],
    requirements = [],
    technologies = [],
    users = [],
    externalSystems = [],
    deploymentArchitecture = {},
    outputDir = 'arch-docs-c4-output',
    includeCodeDiagrams = false,
    diagramFormat = 'plantuml', // plantuml, mermaid, or structurizr
    generateDeploymentDiagram = true,
    documentationStyle = {
      voiceTone: 'professional-friendly',
      technicalDepth: 'medium',
      includeGlossary: true,
      includeIndexes: true,
      accessibilityLevel: 'WCAG 2.1 AA'
    }
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting C4 Model Architecture Documentation for Technical Documentation: ${systemName}`);

  // ============================================================================
  // PHASE 1: DOCUMENTATION PLANNING & AUDIENCE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Planning documentation structure and analyzing target audiences');
  const documentationPlan = await ctx.task(documentationPlanningTask, {
    systemName,
    projectContext,
    targetAudiences,
    requirements,
    documentationStyle,
    outputDir
  });

  artifacts.push(...documentationPlan.artifacts);

  // ============================================================================
  // PHASE 2: SYSTEM CONTEXT ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing system context and boundaries for documentation');
  const systemContext = await ctx.task(systemContextAnalysisTask, {
    systemName,
    projectContext,
    requirements,
    users,
    externalSystems,
    documentationPlan,
    outputDir
  });

  artifacts.push(...systemContext.artifacts);

  // ============================================================================
  // PHASE 3: CONTEXT DIAGRAM (LEVEL 1) - EXECUTIVE VIEW
  // ============================================================================

  ctx.log('info', 'Phase 3: Creating C4 Context Diagram (Level 1) - System Landscape');
  const contextDiagram = await ctx.task(contextDiagramGenerationTask, {
    systemName,
    systemContext,
    diagramFormat,
    documentationStyle,
    targetAudience: 'executive-and-architects',
    outputDir
  });

  artifacts.push(...contextDiagram.artifacts);

  // Breakpoint: Review Context Diagram and executive summary
  await ctx.breakpoint({
    question: `Context diagram and executive summary created. Review system boundaries, ${contextDiagram.userCount} users, and ${contextDiagram.externalSystemCount} external systems. Documentation clarity acceptable for executive audience?`,
    title: 'C4 Context Diagram & Executive Documentation Review',
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
        systemPurpose: contextDiagram.systemPurpose,
        targetAudience: 'Executive & Architects'
      }
    }
  });

  // ============================================================================
  // PHASE 4: CONTAINER IDENTIFICATION & TECHNOLOGY DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Identifying containers and documenting technology choices');
  const containerIdentification = await ctx.task(containerIdentificationTask, {
    systemName,
    requirements,
    technologies,
    systemContext,
    deploymentArchitecture,
    documentationStyle,
    outputDir
  });

  artifacts.push(...containerIdentification.artifacts);

  // ============================================================================
  // PHASE 5: CONTAINER DIAGRAM (LEVEL 2) - ARCHITECT VIEW
  // ============================================================================

  ctx.log('info', 'Phase 5: Creating C4 Container Diagram (Level 2) - Technology Architecture');
  const containerDiagram = await ctx.task(containerDiagramGenerationTask, {
    systemName,
    systemContext,
    containerIdentification,
    diagramFormat,
    documentationStyle,
    targetAudience: 'architects-and-developers',
    outputDir
  });

  artifacts.push(...containerDiagram.artifacts);

  // Breakpoint: Review Container Diagram and technology documentation
  await ctx.breakpoint({
    question: `Container diagram created with ${containerDiagram.containerCount} containers and technology documentation. Review technology stack, inter-container communication patterns, and documentation clarity. Ready for component-level documentation?`,
    title: 'C4 Container Diagram & Technology Stack Documentation Review',
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
        databases: containerDiagram.databases,
        targetAudience: 'Architects & Developers'
      }
    }
  });

  // ============================================================================
  // PHASE 6: COMPONENT BREAKDOWN (PARALLEL) - DEVELOPER VIEW
  // ============================================================================

  ctx.log('info', 'Phase 6: Breaking down containers into components with developer documentation');

  // Generate component breakdowns and documentation for each container in parallel
  const componentTasks = containerIdentification.containers.map(container => ({
    name: `component-breakdown-${container.name}`,
    task: componentBreakdownTask,
    args: {
      systemName,
      container,
      requirements,
      documentationStyle,
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
  // PHASE 7: COMPONENT DIAGRAMS (LEVEL 3)
  // ============================================================================

  ctx.log('info', 'Phase 7: Creating C4 Component Diagrams (Level 3) with developer guides');

  const componentDiagramTasks = componentBreakdowns.map((breakdown, index) => ({
    name: `component-diagram-${breakdown.containerName}`,
    task: componentDiagramGenerationTask,
    args: {
      systemName,
      containerName: breakdown.containerName,
      componentBreakdown: breakdown,
      diagramFormat,
      documentationStyle,
      targetAudience: 'developers',
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

  // Breakpoint: Review Component Diagrams and developer documentation
  await ctx.breakpoint({
    question: `Component diagrams and developer documentation created for ${componentDiagrams.length} containers with ${totalComponents} components. Review component responsibilities, interfaces, and documentation completeness. Approve for supplementary diagrams?`,
    title: 'C4 Component Diagrams & Developer Documentation Review',
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
        })),
        targetAudience: 'Developers'
      }
    }
  });

  // ============================================================================
  // PHASE 8: CODE DIAGRAMS (LEVEL 4) - OPTIONAL
  // ============================================================================

  let codeDiagrams = [];
  if (includeCodeDiagrams) {
    ctx.log('info', 'Phase 8: Creating C4 Code Diagrams (Level 4) for complex components');

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
          documentationStyle,
          outputDir
        }
      }));

      codeDiagrams = await ctx.parallel.all(
        codeDiagramTasks.map(t => ctx.task(t.task, t.args))
      );

      codeDiagrams.forEach(diagram => {
        artifacts.push(...diagram.artifacts);
      });

      ctx.log('info', `Generated ${codeDiagrams.length} code-level diagrams with implementation documentation`);
    } else {
      ctx.log('info', 'No complex components identified requiring code-level diagrams');
    }
  }

  // ============================================================================
  // PHASE 9: SUPPLEMENTARY DIAGRAMS - OPERATIONAL VIEW
  // ============================================================================

  ctx.log('info', 'Phase 9: Creating supplementary diagrams for operational documentation');

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
        documentationStyle,
        targetAudience: 'operations',
        outputDir
      }
    });
  }

  // Dynamic Diagram (user journeys and scenarios)
  if (requirements.some(r => r.userJourney || r.scenario)) {
    supplementaryTasks.push({
      name: 'dynamic-diagram',
      task: dynamicDiagramGenerationTask,
      args: {
        systemName,
        requirements: requirements.filter(r => r.userJourney || r.scenario),
        containers: containerIdentification.containers,
        diagramFormat,
        documentationStyle,
        outputDir
      }
    });
  }

  // System Landscape (enterprise context)
  if (externalSystems.length > 0) {
    supplementaryTasks.push({
      name: 'system-landscape',
      task: systemLandscapeDiagramTask,
      args: {
        systemName,
        systemContext,
        externalSystems,
        diagramFormat,
        documentationStyle,
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

    ctx.log('info', `Generated ${supplementaryDiagrams.length} supplementary diagrams with operational documentation`);
  }

  // ============================================================================
  // PHASE 10: COMPREHENSIVE ARCHITECTURE NARRATIVE
  // ============================================================================

  ctx.log('info', 'Phase 10: Generating comprehensive architecture narrative for all audiences');
  const narrativeDocument = await ctx.task(architectureNarrativeTask, {
    systemName,
    projectContext,
    targetAudiences,
    documentationPlan,
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
    documentationStyle,
    outputDir
  });

  artifacts.push(...narrativeDocument.artifacts);

  // ============================================================================
  // PHASE 11: AUDIENCE-SPECIFIC GUIDES
  // ============================================================================

  ctx.log('info', 'Phase 11: Creating audience-specific documentation guides');

  const audienceGuideTasks = targetAudiences.map(audience => ({
    name: `audience-guide-${audience}`,
    task: audienceGuideGenerationTask,
    args: {
      systemName,
      audience,
      systemContext,
      containerIdentification,
      componentBreakdowns,
      narrativeDocument,
      documentationStyle,
      outputDir
    }
  }));

  const audienceGuides = await ctx.parallel.all(
    audienceGuideTasks.map(t => ctx.task(t.task, t.args))
  );

  audienceGuides.forEach(guide => {
    artifacts.push(...guide.artifacts);
  });

  ctx.log('info', `Generated ${audienceGuides.length} audience-specific guides`);

  // ============================================================================
  // PHASE 12: DOCUMENTATION QUALITY VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 12: Validating documentation quality, clarity, accessibility, and completeness');
  const qualityValidation = await ctx.task(documentationQualityValidationTask, {
    systemName,
    targetAudiences,
    documentationPlan,
    contextDiagram,
    containerDiagram,
    componentDiagrams,
    codeDiagrams,
    supplementaryDiagrams,
    narrativeDocument,
    audienceGuides,
    documentationStyle,
    outputDir
  });

  artifacts.push(...qualityValidation.artifacts);

  const qualityScore = qualityValidation.overallScore;
  const qualityMet = qualityScore >= 85;

  // ============================================================================
  // PHASE 13: DOCUMENTATION PACKAGE GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 13: Generating complete documentation package with navigation and indexes');
  const documentationPackage = await ctx.task(documentationPackageGenerationTask, {
    systemName,
    artifacts,
    narrativeDocument,
    audienceGuides,
    documentationStyle,
    outputDir
  });

  artifacts.push(...documentationPackage.artifacts);

  // Final Breakpoint: Review complete documentation package
  await ctx.breakpoint({
    question: `C4 Model architecture documentation package complete. Quality score: ${qualityScore}/100. ${qualityMet ? 'Documentation meets quality standards!' : 'Documentation may need refinement.'} Package includes ${artifacts.length} artifacts, ${audienceGuides.length} audience guides, and comprehensive navigation. Final approval?`,
    title: 'C4 Architecture Documentation Package Final Review',
    context: {
      runId: ctx.runId,
      files: [
        {
          path: documentationPackage.indexPath,
          format: 'markdown',
          label: 'Documentation Index'
        },
        {
          path: narrativeDocument.documentPath,
          format: 'markdown',
          label: 'Architecture Narrative'
        },
        ...audienceGuides.map(g => ({
          path: g.guidePath,
          format: 'markdown',
          label: `${g.audienceName} Guide`
        }))
      ],
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
        audienceGuides: audienceGuides.length,
        targetAudiences,
        totalContainers: containerIdentification.containers.length,
        totalComponents,
        packagePath: documentationPackage.packagePath,
        accessibilityLevel: documentationStyle.accessibilityLevel
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
    documentationPackage: {
      packagePath: documentationPackage.packagePath,
      indexPath: documentationPackage.indexPath,
      navigationStructure: documentationPackage.navigationStructure
    },
    contextDiagram: {
      path: contextDiagram.diagramPath,
      userCount: contextDiagram.userCount,
      externalSystemCount: contextDiagram.externalSystemCount,
      targetAudience: 'Executive & Architects'
    },
    containerDiagram: {
      path: containerDiagram.diagramPath,
      containerCount: containerDiagram.containerCount,
      technologies: containerDiagram.technologies,
      databases: containerDiagram.databases,
      targetAudience: 'Architects & Developers'
    },
    componentDiagrams: componentDiagrams.map(d => ({
      containerName: d.containerName,
      path: d.diagramPath,
      componentCount: d.componentCount,
      interfaceCount: d.interfaceCount,
      targetAudience: 'Developers'
    })),
    codeDiagrams: codeDiagrams.map(d => ({
      componentName: d.componentName,
      path: d.diagramPath,
      classCount: d.classCount,
      designPatterns: d.designPatterns,
      targetAudience: 'Developers'
    })),
    supplementaryDiagrams: supplementaryDiagrams.map(d => ({
      type: d.type,
      path: d.diagramPath,
      description: d.description,
      targetAudience: d.targetAudience
    })),
    narrativeDocument: narrativeDocument.documentPath,
    audienceGuides: audienceGuides.map(g => ({
      audience: g.audienceName,
      path: g.guidePath,
      sections: g.sectionCount
    })),
    artifacts,
    duration,
    metadata: {
      processId: 'technical-documentation/arch-docs-c4',
      category: 'Architecture Docs',
      specialization: 'Technical Documentation',
      timestamp: startTime,
      systemName,
      diagramFormat,
      outputDir,
      targetAudiences,
      totalDiagrams: 2 + componentDiagrams.length + codeDiagrams.length + supplementaryDiagrams.length,
      totalDocuments: 1 + audienceGuides.length,
      accessibilityLevel: documentationStyle.accessibilityLevel
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Documentation Planning
export const documentationPlanningTask = defineTask('documentation-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan documentation structure and analyze target audiences',
  agent: {
    name: 'documentation-planner',
    prompt: {
      role: 'technical documentation strategist and information architect',
      task: 'Create comprehensive documentation plan for C4 architecture documentation targeting multiple audiences with clear information architecture',
      context: args,
      instructions: [
        'Analyze target audiences (executive, architects, developers, operations) and their information needs',
        'Define documentation objectives for each audience level',
        'Design information architecture using progressive disclosure principles',
        'Plan navigation structure and content organization',
        'Define documentation style guide elements (voice, tone, terminology)',
        'Identify key user journeys through documentation',
        'Plan glossary terms and technical concepts to explain',
        'Design documentation templates for consistency',
        'Create documentation roadmap with phases and deliverables',
        'Document accessibility requirements and compliance standards',
        'Prepare documentation style guide and writing guidelines',
        'Output comprehensive documentation plan with IA structure'
      ],
      outputFormat: 'JSON with audiences (array), documentationObjectives (object), informationArchitecture (object), styleGuide (object), glossaryTerms (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['audiences', 'documentationObjectives', 'informationArchitecture', 'artifacts'],
      properties: {
        audiences: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              informationNeeds: { type: 'array', items: { type: 'string' } },
              technicalDepth: { type: 'string' },
              primaryGoals: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        documentationObjectives: { type: 'object' },
        informationArchitecture: { type: 'object' },
        styleGuide: { type: 'object' },
        glossaryTerms: { type: 'array', items: { type: 'string' } },
        navigationStructure: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'technical-documentation', 'documentation-planning', 'information-architecture']
}));

// Task 2: System Context Analysis (Documentation-focused)
export const systemContextAnalysisTask = defineTask('system-context-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze system context for documentation with clear explanations',
  agent: {
    name: 'system-context-documentor',
    prompt: {
      role: 'technical writer and software architect specializing in clear technical communication',
      task: 'Analyze system boundaries and context, documenting in clear, accessible language for multiple audiences',
      context: args,
      instructions: [
        'Review requirements and project context to understand system scope',
        'Identify all user types with clear, non-technical descriptions',
        'Identify all external systems with purpose and integration patterns',
        'Define clear system boundary with rationale',
        'Document high-level system purpose in executive-friendly language',
        'Document system responsibilities and capabilities at multiple detail levels',
        'Identify key interactions with clear descriptions',
        'Create glossary entries for technical terms',
        'Write system context summary for each target audience',
        'Prepare clear, concise descriptions for Context diagram labels',
        'Document business context and value proposition',
        'Create system overview document with progressive disclosure'
      ],
      outputFormat: 'JSON with systemPurpose (string), systemPurposeByAudience (object), systemBoundary (string), users (array), externalSystems (array), keyInteractions (array), glossaryEntries (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['systemPurpose', 'systemPurposeByAudience', 'users', 'externalSystems', 'artifacts'],
      properties: {
        systemPurpose: { type: 'string' },
        systemPurposeByAudience: {
          type: 'object',
          properties: {
            executive: { type: 'string' },
            architect: { type: 'string' },
            developer: { type: 'string' },
            operations: { type: 'string' }
          }
        },
        systemBoundary: { type: 'string' },
        businessContext: { type: 'string' },
        users: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              nonTechnicalDescription: { type: 'string' },
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
              purpose: { type: 'string' },
              businessValue: { type: 'string' }
            }
          }
        },
        keyInteractions: { type: 'array' },
        glossaryEntries: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'technical-documentation', 'c4-model', 'context-analysis']
}));

// Task 3: Context Diagram Generation (Documentation-focused)
export const contextDiagramGenerationTask = defineTask('context-diagram-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate C4 Context Diagram with clear labels and supporting documentation',
  agent: {
    name: 'context-diagram-documentor',
    prompt: {
      role: 'technical writer and diagram specialist with focus on clarity and accessibility',
      task: 'Generate C4 Context Diagram with clear, accessible labels and accompanying documentation for executive and architect audiences',
      context: args,
      instructions: [
        'Create Context diagram using specified format with clear, concise labels',
        'Show system as central element with business purpose',
        'Show all users with role descriptions (avoid jargon)',
        'Show all external systems with integration purpose',
        'Label relationships with clear action verbs',
        'Use accessible color schemes (WCAG 2.1 AA compliant)',
        'Include diagram legend with clear explanations',
        'Add descriptive title and purpose statement',
        'Write diagram alt text for accessibility',
        'Create separate executive summary of diagram',
        'Write detailed diagram walkthrough for documentation',
        'Save diagram source with inline comments',
        'Generate diagram navigation guide'
      ],
      outputFormat: 'JSON with diagramPath, diagramSource, diagramAltText, executiveSummary, diagramWalkthrough, userCount, externalSystemCount, systemPurpose, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['diagramPath', 'diagramAltText', 'executiveSummary', 'userCount', 'externalSystemCount', 'systemPurpose', 'artifacts'],
      properties: {
        diagramPath: { type: 'string' },
        diagramSource: { type: 'string' },
        diagramAltText: { type: 'string' },
        executiveSummary: { type: 'string' },
        diagramWalkthrough: { type: 'string' },
        userCount: { type: 'number' },
        externalSystemCount: { type: 'number' },
        systemPurpose: { type: 'string' },
        accessibilityNotes: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'technical-documentation', 'c4-model', 'context-diagram', 'level-1']
}));

// Task 4: Container Identification (Documentation-focused)
export const containerIdentificationTask = defineTask('container-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify containers and document technology choices with rationale',
  agent: {
    name: 'container-documentor',
    prompt: {
      role: 'technical writer and application architect specializing in technology documentation',
      task: 'Identify containers and create comprehensive technology documentation with rationale, trade-offs, and accessibility',
      context: args,
      instructions: [
        'Identify all deployable units (containers) with clear descriptions',
        'Document technology choices with rationale and trade-offs',
        'Explain why each technology was selected (not just what)',
        'Document container responsibilities in clear language',
        'Map inter-container communication with protocol explanations',
        'Document data flow patterns between containers',
        'Create technology stack overview for each container',
        'Document deployment characteristics (scalability, availability)',
        'Write technology glossary entries',
        'Create container inventory with metadata',
        'Document technology alternatives considered',
        'Prepare technology stack summary for documentation'
      ],
      outputFormat: 'JSON with containers (array with descriptions and rationale), technologies (array), technologyRationale (object), databases (array), communicationProtocols (array), glossaryEntries (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['containers', 'technologies', 'technologyRationale', 'artifacts'],
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
              technologyRationale: { type: 'string' },
              responsibilities: { type: 'array', items: { type: 'string' } },
              dependencies: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        technologies: { type: 'array', items: { type: 'string' } },
        technologyRationale: { type: 'object' },
        databases: { type: 'array', items: { type: 'string' } },
        communicationProtocols: { type: 'array', items: { type: 'string' } },
        glossaryEntries: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'technical-documentation', 'c4-model', 'container-identification']
}));

// Task 5: Container Diagram Generation (Documentation-focused)
export const containerDiagramGenerationTask = defineTask('container-diagram-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate C4 Container Diagram with technology documentation',
  agent: {
    name: 'container-diagram-documentor',
    prompt: {
      role: 'technical writer and diagram specialist with architecture expertise',
      task: 'Generate C4 Container Diagram with clear technology labels, accessible design, and comprehensive supporting documentation',
      context: args,
      instructions: [
        'Create Container diagram with clear container labels and technology stack',
        'Show containers with technology choices prominently displayed',
        'Use visual differentiation for container types (web, api, database, queue)',
        'Label relationships with protocols and data flow direction',
        'Ensure accessible color schemes and sufficient contrast',
        'Include comprehensive diagram legend',
        'Add technology stack callouts with version information',
        'Write diagram alt text describing architecture',
        'Create technology stack summary document',
        'Write diagram walkthrough for architects and developers',
        'Document communication patterns between containers',
        'Save diagram with inline documentation comments',
        'Generate technology decision rationale document'
      ],
      outputFormat: 'JSON with diagramPath, diagramAltText, technologySummary, diagramWalkthrough, containerCount, technologies (array), databases (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['diagramPath', 'diagramAltText', 'technologySummary', 'containerCount', 'technologies', 'artifacts'],
      properties: {
        diagramPath: { type: 'string' },
        diagramSource: { type: 'string' },
        diagramAltText: { type: 'string' },
        technologySummary: { type: 'string' },
        diagramWalkthrough: { type: 'string' },
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
  labels: ['agent', 'technical-documentation', 'c4-model', 'container-diagram', 'level-2']
}));

// Task 6: Component Breakdown (Documentation-focused)
export const componentBreakdownTask = defineTask('component-breakdown', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Break down container into components with developer documentation',
  agent: {
    name: 'component-documentor',
    prompt: {
      role: 'technical writer specializing in software component documentation for developers',
      task: 'Decompose container into components and create clear, actionable documentation for development teams',
      context: args,
      instructions: [
        'Identify logical components within container',
        'Document each component with clear responsibility statement',
        'Define public interfaces and APIs with usage examples',
        'Map component dependencies and interaction patterns',
        'Identify design patterns with explanations',
        'Document component lifecycle and state management',
        'Assess complexity and document accordingly',
        'Flag components requiring detailed implementation docs',
        'Write component overview for developers',
        'Create component interaction diagrams',
        'Document component configuration and customization',
        'Prepare developer getting-started guide for container'
      ],
      outputFormat: 'JSON with containerName, components (array with documentation), interfaces (array), designPatterns (array with explanations), developerGuide (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['containerName', 'components', 'developerGuide', 'artifacts'],
      properties: {
        containerName: { type: 'string' },
        components: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              responsibility: { type: 'string' },
              documentationSummary: { type: 'string' },
              interfaces: { type: 'array', items: { type: 'string' } },
              dependencies: { type: 'array', items: { type: 'string' } },
              complexity: { type: 'string', enum: ['low', 'medium', 'high'] },
              requiresCodeDiagram: { type: 'boolean' }
            }
          }
        },
        interfaces: { type: 'array', items: { type: 'string' } },
        designPatterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              explanation: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        developerGuide: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'technical-documentation', 'c4-model', 'component-breakdown']
}));

// Task 7: Component Diagram Generation (Documentation-focused)
export const componentDiagramGenerationTask = defineTask('component-diagram-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate C4 Component Diagram with developer documentation',
  agent: {
    name: 'component-diagram-documentor',
    prompt: {
      role: 'technical writer and software architecture diagram specialist',
      task: 'Generate C4 Component Diagram with clear labeling, interface documentation, and developer-friendly explanations',
      context: args,
      instructions: [
        'Create Component diagram for specified container',
        'Show all components with clear responsibility labels',
        'Highlight public interfaces and APIs',
        'Show component dependencies with interaction types',
        'Indicate design patterns visually with annotations',
        'Ensure accessible diagram design and colors',
        'Write comprehensive diagram alt text',
        'Create component interaction guide',
        'Document component responsibilities in detail',
        'Write developer walkthrough of component architecture',
        'Include code examples or pseudocode where helpful',
        'Save diagram with documentation annotations',
        'Generate component reference documentation'
      ],
      outputFormat: 'JSON with containerName, diagramPath, diagramAltText, componentGuide, developerWalkthrough, componentCount, interfaceCount, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['containerName', 'diagramPath', 'diagramAltText', 'componentCount', 'artifacts'],
      properties: {
        containerName: { type: 'string' },
        diagramPath: { type: 'string' },
        diagramSource: { type: 'string' },
        diagramAltText: { type: 'string' },
        componentGuide: { type: 'string' },
        developerWalkthrough: { type: 'string' },
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
  labels: ['agent', 'technical-documentation', 'c4-model', 'component-diagram', 'level-3']
}));

// Task 8: Code Diagram Generation (Documentation-focused)
export const codeDiagramGenerationTask = defineTask('code-diagram-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate C4 Code Diagram with implementation documentation',
  agent: {
    name: 'code-diagram-documentor',
    prompt: {
      role: 'technical writer specializing in code-level documentation and UML',
      task: 'Generate code-level UML class diagram with clear documentation, pattern explanations, and implementation guidance',
      context: args,
      instructions: [
        'Create UML class diagram for complex component',
        'Show key classes, interfaces, and relationships',
        'Annotate design patterns with explanatory notes',
        'Document important method signatures and purposes',
        'Use standard UML notation with accessibility',
        'Write comprehensive diagram alt text',
        'Create implementation guide for developers',
        'Document design pattern applications and rationale',
        'Provide code snippets or examples where relevant',
        'Write class responsibility documentation',
        'Include best practices and common pitfalls',
        'Save diagram with inline documentation',
        'Generate implementation reference document'
      ],
      outputFormat: 'JSON with componentName, diagramPath, diagramAltText, implementationGuide, classCount, designPatterns (array with explanations), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['componentName', 'diagramPath', 'diagramAltText', 'implementationGuide', 'artifacts'],
      properties: {
        componentName: { type: 'string' },
        diagramPath: { type: 'string' },
        diagramSource: { type: 'string' },
        diagramAltText: { type: 'string' },
        implementationGuide: { type: 'string' },
        classCount: { type: 'number' },
        designPatterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              explanation: { type: 'string' },
              implementation: { type: 'string' }
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
  labels: ['agent', 'technical-documentation', 'c4-model', 'code-diagram', 'level-4', 'uml']
}));

// Task 9: Deployment Diagram Generation (Documentation-focused)
export const deploymentDiagramGenerationTask = defineTask('deployment-diagram-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate C4 Deployment Diagram with operational documentation',
  agent: {
    name: 'deployment-diagram-documentor',
    prompt: {
      role: 'technical writer and DevOps documentation specialist',
      task: 'Generate C4 Deployment Diagram with clear infrastructure documentation and operational guidance',
      context: args,
      instructions: [
        'Create Deployment diagram showing infrastructure topology',
        'Show deployment nodes with clear descriptions',
        'Map containers to deployment infrastructure',
        'Document networking, load balancing, and security zones',
        'Indicate scaling strategies and redundancy',
        'Show deployment environments clearly',
        'Document infrastructure technology stack',
        'Ensure accessible diagram design',
        'Write comprehensive diagram alt text',
        'Create operational deployment guide',
        'Document infrastructure requirements and dependencies',
        'Write deployment walkthrough for operations teams',
        'Include configuration and monitoring considerations',
        'Generate infrastructure reference documentation'
      ],
      outputFormat: 'JSON with type, diagramPath, diagramAltText, operationalGuide, deploymentWalkthrough, description, deploymentNodes (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['type', 'diagramPath', 'diagramAltText', 'operationalGuide', 'description', 'artifacts'],
      properties: {
        type: { type: 'string', enum: ['deployment'] },
        diagramPath: { type: 'string' },
        diagramSource: { type: 'string' },
        diagramAltText: { type: 'string' },
        operationalGuide: { type: 'string' },
        deploymentWalkthrough: { type: 'string' },
        description: { type: 'string' },
        deploymentNodes: { type: 'array', items: { type: 'string' } },
        targetAudience: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'technical-documentation', 'c4-model', 'deployment-diagram', 'supplementary', 'operations']
}));

// Task 10: Dynamic Diagram Generation (Documentation-focused)
export const dynamicDiagramGenerationTask = defineTask('dynamic-diagram-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate C4 Dynamic Diagram with user journey documentation',
  agent: {
    name: 'dynamic-diagram-documentor',
    prompt: {
      role: 'technical writer specializing in user journey and interaction documentation',
      task: 'Generate C4 Dynamic Diagram showing runtime behavior with clear step-by-step documentation',
      context: args,
      instructions: [
        'Identify key user journeys and scenarios',
        'Create dynamic sequence diagram for each scenario',
        'Show step-by-step interactions with clear numbering',
        'Label each interaction with action description',
        'Document asynchronous operations clearly',
        'Show request/response flows',
        'Ensure accessible diagram design',
        'Write comprehensive diagram alt text',
        'Create user journey walkthrough documentation',
        'Document interaction patterns and protocols',
        'Write scenario-based documentation for each journey',
        'Include error handling and edge cases',
        'Generate runtime behavior reference guide'
      ],
      outputFormat: 'JSON with type, diagramPath, diagramAltText, userJourneyGuide, description, scenarioCount, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['type', 'diagramPath', 'diagramAltText', 'userJourneyGuide', 'description', 'artifacts'],
      properties: {
        type: { type: 'string', enum: ['dynamic'] },
        diagramPath: { type: 'string' },
        diagramSource: { type: 'string' },
        diagramAltText: { type: 'string' },
        userJourneyGuide: { type: 'string' },
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
  labels: ['agent', 'technical-documentation', 'c4-model', 'dynamic-diagram', 'supplementary', 'user-journey']
}));

// Task 11: System Landscape Diagram (Documentation-focused)
export const systemLandscapeDiagramTask = defineTask('system-landscape-diagram', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate C4 System Landscape Diagram with enterprise context documentation',
  agent: {
    name: 'landscape-diagram-documentor',
    prompt: {
      role: 'enterprise technical writer and solution architect',
      task: 'Generate C4 System Landscape Diagram with enterprise context and clear relationship documentation',
      context: args,
      instructions: [
        'Create System Landscape showing enterprise context',
        'Show target system and external systems clearly',
        'Show users/personas with role descriptions',
        'Document system relationships and integration points',
        'Use highest level of abstraction for clarity',
        'Ensure accessible diagram design',
        'Write comprehensive diagram alt text',
        'Create enterprise context documentation',
        'Document integration patterns between systems',
        'Write system landscape overview for executives',
        'Include business value and strategic importance',
        'Save diagram with contextual annotations',
        'Generate enterprise architecture reference guide'
      ],
      outputFormat: 'JSON with type, diagramPath, diagramAltText, enterpriseGuide, description, systemCount, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['type', 'diagramPath', 'diagramAltText', 'enterpriseGuide', 'description', 'artifacts'],
      properties: {
        type: { type: 'string', enum: ['landscape'] },
        diagramPath: { type: 'string' },
        diagramSource: { type: 'string' },
        diagramAltText: { type: 'string' },
        enterpriseGuide: { type: 'string' },
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
  labels: ['agent', 'technical-documentation', 'c4-model', 'landscape-diagram', 'supplementary', 'enterprise']
}));

// Task 12: Architecture Narrative Document (Documentation-focused)
export const architectureNarrativeTask = defineTask('architecture-narrative-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive architecture narrative with multi-audience support',
  agent: {
    name: 'architecture-narrative-writer',
    prompt: {
      role: 'senior technical writer and software architecture documentation specialist',
      task: 'Create comprehensive, well-structured architecture narrative document that serves multiple audiences with clear explanations and progressive disclosure',
      context: args,
      instructions: [
        'Write executive summary with business context and strategic value',
        'Create architecture overview for each audience level (executive, architect, developer)',
        'Document Context level with clear system boundaries and purpose',
        'Document Container level with technology rationale and trade-offs',
        'Document Component level with development guidance',
        'Document Code level patterns and implementation approaches',
        'Explain architectural decisions with context, options considered, and rationale',
        'Create technology stack reference with version information',
        'Document quality attributes (scalability, security, performance)',
        'Include deployment and operational considerations',
        'Create comprehensive glossary of terms',
        'Add navigation aids (table of contents, cross-references)',
        'Embed diagram references with context',
        'Write in clear, accessible language with progressive disclosure',
        'Include code examples and usage patterns where relevant',
        'Format as professional Markdown with consistent styling',
        'Ensure WCAG 2.1 AA accessibility compliance',
        'Add metadata for searchability and discoverability'
      ],
      outputFormat: 'JSON with documentPath, executiveSummary, audienceSummaries (object), technologiesSummary (array), keyDecisions (array with rationale), qualityAttributes (array), glossary (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentPath', 'executiveSummary', 'audienceSummaries', 'glossary', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        audienceSummaries: {
          type: 'object',
          properties: {
            executive: { type: 'string' },
            architect: { type: 'string' },
            developer: { type: 'string' },
            operations: { type: 'string' }
          }
        },
        technologiesSummary: { type: 'array', items: { type: 'string' } },
        keyDecisions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              decision: { type: 'string' },
              context: { type: 'string' },
              rationale: { type: 'string' },
              alternatives: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        qualityAttributes: { type: 'array', items: { type: 'string' } },
        glossary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'technical-documentation', 'c4-model', 'narrative', 'comprehensive']
}));

// Task 13: Audience-Specific Guide Generation
export const audienceGuideGenerationTask = defineTask('audience-guide-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate audience-specific documentation guide',
  agent: {
    name: 'audience-guide-writer',
    prompt: {
      role: 'technical writer specializing in audience-specific communication',
      task: 'Create tailored documentation guide for specific audience with appropriate technical depth, terminology, and focus areas',
      context: args,
      instructions: [
        'Analyze audience information needs and goals',
        'Extract relevant architecture information for this audience',
        'Adjust technical depth to audience level',
        'Use appropriate terminology and explanations',
        'Focus on audience-relevant concerns (exec: ROI, dev: implementation, ops: deployment)',
        'Structure content with progressive disclosure',
        'Include audience-specific diagrams and views',
        'Write clear introduction explaining guide purpose',
        'Create audience-specific getting started section',
        'Document key takeaways and action items',
        'Add navigation and cross-references',
        'Include relevant glossary terms',
        'Ensure accessibility and readability',
        'Format consistently with documentation style guide'
      ],
      outputFormat: 'JSON with audienceName, guidePath, guideContent, sectionCount, keyTakeaways (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['audienceName', 'guidePath', 'sectionCount', 'artifacts'],
      properties: {
        audienceName: { type: 'string' },
        guidePath: { type: 'string' },
        guideContent: { type: 'string' },
        sectionCount: { type: 'number' },
        keyTakeaways: { type: 'array', items: { type: 'string' } },
        technicalDepth: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'technical-documentation', 'audience-specific', 'guide']
}));

// Task 14: Documentation Quality Validation
export const documentationQualityValidationTask = defineTask('documentation-quality-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate documentation quality, clarity, accessibility, and completeness',
  agent: {
    name: 'documentation-quality-validator',
    prompt: {
      role: 'senior technical documentation quality assurance specialist and accessibility expert',
      task: 'Comprehensively assess documentation quality across clarity, accuracy, completeness, accessibility, and usability for all target audiences',
      context: args,
      instructions: [
        'Evaluate clarity and readability (weight: 20%)',
        '  - Clear, concise language?',
        '  - Active voice and present tense?',
        '  - Technical terms explained?',
        '  - Appropriate detail level for each audience?',
        'Evaluate accuracy and completeness (weight: 20%)',
        '  - All diagrams complete and consistent?',
        '  - All components documented?',
        '  - Technology stack fully documented?',
        '  - No missing information or gaps?',
        'Evaluate C4 model adherence (weight: 15%)',
        '  - Proper abstraction levels?',
        '  - Consistent notation?',
        '  - Clear system boundaries?',
        'Evaluate accessibility (weight: 15%)',
        '  - WCAG 2.1 AA compliance?',
        '  - Alt text for all diagrams?',
        '  - Proper heading hierarchy?',
        '  - Sufficient color contrast?',
        'Evaluate audience appropriateness (weight: 15%)',
        '  - Each audience guide appropriate?',
        '  - Technical depth matches audience?',
        '  - Terminology appropriate?',
        'Evaluate structure and navigation (weight: 10%)',
        '  - Clear information architecture?',
        '  - Logical organization?',
        '  - Effective navigation aids?',
        'Evaluate style consistency (weight: 5%)',
        '  - Consistent terminology?',
        '  - Consistent formatting?',
        '  - Style guide compliance?',
        'Calculate weighted overall score (0-100)',
        'Identify specific gaps and issues',
        'Provide actionable recommendations',
        'Assess searchability and discoverability',
        'Validate cross-references and links'
      ],
      outputFormat: 'JSON with overallScore (0-100), componentScores (object), gaps (array), recommendations (array), accessibilityScore (number), audienceScores (object), strengths (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'recommendations', 'accessibilityScore', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            clarityReadability: { type: 'number' },
            accuracyCompleteness: { type: 'number' },
            c4ModelAdherence: { type: 'number' },
            accessibility: { type: 'number' },
            audienceAppropriateness: { type: 'number' },
            structureNavigation: { type: 'number' },
            styleConsistency: { type: 'number' }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              recommendation: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        accessibilityScore: { type: 'number' },
        audienceScores: {
          type: 'object',
          additionalProperties: { type: 'number' }
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
  labels: ['agent', 'technical-documentation', 'quality-validation', 'accessibility', 'scoring']
}));

// Task 15: Documentation Package Generation
export const documentationPackageGenerationTask = defineTask('documentation-package-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate complete documentation package with navigation and indexes',
  agent: {
    name: 'documentation-packager',
    prompt: {
      role: 'documentation engineer and information architect',
      task: 'Create comprehensive documentation package with master index, navigation structure, search optimization, and deployment-ready structure',
      context: args,
      instructions: [
        'Create master documentation index with all artifacts',
        'Build hierarchical navigation structure',
        'Generate table of contents for all documents',
        'Create cross-reference index between documents and diagrams',
        'Build searchable glossary index',
        'Create audience-specific entry points',
        'Generate sitemap for documentation',
        'Create README with documentation overview',
        'Build navigation sidebar structure',
        'Generate quick reference cards or cheat sheets',
        'Create diagram catalog with thumbnails',
        'Add metadata for search optimization',
        'Ensure all links are valid and relative paths correct',
        'Create deployment manifest',
        'Generate documentation statistics and metrics',
        'Package all artifacts with proper directory structure'
      ],
      outputFormat: 'JSON with packagePath, indexPath, navigationStructure (object), tableOfContents (object), glossaryIndex (object), diagramCatalog (array), readmePath, deploymentManifest (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['packagePath', 'indexPath', 'navigationStructure', 'artifacts'],
      properties: {
        packagePath: { type: 'string' },
        indexPath: { type: 'string' },
        navigationStructure: { type: 'object' },
        tableOfContents: { type: 'object' },
        glossaryIndex: { type: 'object' },
        diagramCatalog: { type: 'array' },
        readmePath: { type: 'string' },
        deploymentManifest: { type: 'object' },
        statistics: {
          type: 'object',
          properties: {
            totalDocuments: { type: 'number' },
            totalDiagrams: { type: 'number' },
            totalArtifacts: { type: 'number' },
            glossaryTerms: { type: 'number' }
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
  labels: ['agent', 'technical-documentation', 'packaging', 'navigation', 'deployment']
}));
