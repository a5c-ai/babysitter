/**
 * @process specializations/domains/business/legal/compliance-program-development
 * @description Compliance Program Development - Design and implement comprehensive compliance program aligned with
 * ISO 37301, COSO framework, and DOJ evaluation criteria.
 * @inputs { organizationProfile: object, regulatoryScope?: array, framework?: string, outputDir?: string }
 * @outputs { success: boolean, program: object, policies: array, controls: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/legal/compliance-program-development', {
 *   organizationProfile: {
 *     name: 'Acme Corporation',
 *     industry: 'financial-services',
 *     size: 'large',
 *     geographies: ['US', 'EU', 'APAC']
 *   },
 *   regulatoryScope: ['anti-bribery', 'data-privacy', 'aml'],
 *   framework: 'ISO-37301',
 *   outputDir: 'compliance-program'
 * });
 *
 * @references
 * - ISO 37301 Compliance Management Systems: https://www.iso.org/standard/75080.html
 * - COSO Internal Control Framework: https://www.coso.org/guidance-erm
 * - DOJ Evaluation of Corporate Compliance Programs: https://www.justice.gov/criminal-fraud/page/file/937501/download
 * - SCCE Compliance Program Elements: https://www.corporatecompliance.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationProfile,
    regulatoryScope = ['general'],
    framework = 'ISO-37301',
    existingProgram = null,
    outputDir = 'compliance-program-output',
    includeTrainingPlan = true,
    includeMonitoringPlan = true,
    includeReportingStructure = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Compliance Program Development for ${organizationProfile.name}`);
  ctx.log('info', `Framework: ${framework}, Regulatory Scope: ${regulatoryScope.join(', ')}`);

  // ============================================================================
  // PHASE 1: ORGANIZATIONAL ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 1: Conducting organizational assessment');

  const orgAssessment = await ctx.task(organizationalAssessmentTask, {
    organizationProfile,
    existingProgram,
    regulatoryScope,
    outputDir
  });

  artifacts.push(...orgAssessment.artifacts);

  ctx.log('info', `Assessment complete. Maturity level: ${orgAssessment.maturityLevel}`);

  // ============================================================================
  // PHASE 2: REGULATORY MAPPING
  // ============================================================================

  ctx.log('info', 'Phase 2: Mapping regulatory requirements');

  const regulatoryMapping = await ctx.task(regulatoryMappingTask, {
    organizationProfile,
    regulatoryScope,
    geographies: organizationProfile.geographies,
    outputDir
  });

  artifacts.push(...regulatoryMapping.artifacts);

  ctx.log('info', `Mapped ${regulatoryMapping.requirementCount} regulatory requirements`);

  // ============================================================================
  // PHASE 3: RISK ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Conducting compliance risk assessment');

  const riskAssessment = await ctx.task(complianceRiskAssessmentTask, {
    organizationProfile,
    regulatoryMapping,
    orgAssessment,
    outputDir
  });

  artifacts.push(...riskAssessment.artifacts);

  ctx.log('info', `Identified ${riskAssessment.riskCount} compliance risks`);

  // Quality Gate: High risk areas
  if (riskAssessment.highRiskCount > 5) {
    await ctx.breakpoint({
      question: `${riskAssessment.highRiskCount} high-risk compliance areas identified. Review risk assessment before proceeding with program design?`,
      title: 'Compliance Risk Assessment Review',
      context: {
        runId: ctx.runId,
        highRiskAreas: riskAssessment.highRiskAreas,
        riskScore: riskAssessment.overallRiskScore,
        files: riskAssessment.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 4: PROGRAM FRAMEWORK DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 4: Designing program framework');

  const frameworkDesign = await ctx.task(frameworkDesignTask, {
    organizationProfile,
    framework,
    riskAssessment,
    regulatoryMapping,
    outputDir
  });

  artifacts.push(...frameworkDesign.artifacts);

  // ============================================================================
  // PHASE 5: GOVERNANCE STRUCTURE
  // ============================================================================

  ctx.log('info', 'Phase 5: Defining governance structure');

  const governanceStructure = await ctx.task(governanceStructureTask, {
    organizationProfile,
    frameworkDesign,
    includeReportingStructure,
    outputDir
  });

  artifacts.push(...governanceStructure.artifacts);

  // ============================================================================
  // PHASE 6: POLICY DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 6: Developing compliance policies');

  const policyDevelopment = await ctx.task(policyDevelopmentTask, {
    organizationProfile,
    regulatoryScope,
    riskAssessment,
    frameworkDesign,
    outputDir
  });

  artifacts.push(...policyDevelopment.artifacts);

  ctx.log('info', `Developed ${policyDevelopment.policies.length} compliance policies`);

  // ============================================================================
  // PHASE 7: CONTROL DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 7: Designing compliance controls');

  const controlDesign = await ctx.task(controlDesignTask, {
    policies: policyDevelopment.policies,
    riskAssessment,
    regulatoryMapping,
    outputDir
  });

  artifacts.push(...controlDesign.artifacts);

  ctx.log('info', `Designed ${controlDesign.controls.length} compliance controls`);

  // ============================================================================
  // PHASE 8: TRAINING PLAN (Optional)
  // ============================================================================

  let trainingPlan = null;

  if (includeTrainingPlan) {
    ctx.log('info', 'Phase 8: Developing training plan');

    trainingPlan = await ctx.task(trainingPlanTask, {
      organizationProfile,
      policies: policyDevelopment.policies,
      riskAssessment,
      outputDir
    });

    artifacts.push(...trainingPlan.artifacts);
  }

  // ============================================================================
  // PHASE 9: MONITORING AND TESTING PLAN (Optional)
  // ============================================================================

  let monitoringPlan = null;

  if (includeMonitoringPlan) {
    ctx.log('info', 'Phase 9: Developing monitoring and testing plan');

    monitoringPlan = await ctx.task(monitoringPlanTask, {
      controls: controlDesign.controls,
      riskAssessment,
      outputDir
    });

    artifacts.push(...monitoringPlan.artifacts);
  }

  // ============================================================================
  // PHASE 10: PROGRAM DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Assembling program documentation');

  const programDocumentation = await ctx.task(programDocumentationTask, {
    organizationProfile,
    framework,
    orgAssessment,
    regulatoryMapping,
    riskAssessment,
    frameworkDesign,
    governanceStructure,
    policies: policyDevelopment.policies,
    controls: controlDesign.controls,
    trainingPlan,
    monitoringPlan,
    outputDir
  });

  artifacts.push(...programDocumentation.artifacts);

  // ============================================================================
  // PHASE 11: IMPLEMENTATION ROADMAP
  // ============================================================================

  ctx.log('info', 'Phase 11: Creating implementation roadmap');

  const implementationRoadmap = await ctx.task(implementationRoadmapTask, {
    organizationProfile,
    orgAssessment,
    policies: policyDevelopment.policies,
    controls: controlDesign.controls,
    trainingPlan,
    monitoringPlan,
    outputDir
  });

  artifacts.push(...implementationRoadmap.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Compliance program for ${organizationProfile.name} complete. ${policyDevelopment.policies.length} policies, ${controlDesign.controls.length} controls. Approve program?`,
    title: 'Compliance Program Review',
    context: {
      runId: ctx.runId,
      summary: {
        organization: organizationProfile.name,
        framework,
        policiesCount: policyDevelopment.policies.length,
        controlsCount: controlDesign.controls.length,
        riskCount: riskAssessment.riskCount,
        maturityLevel: orgAssessment.maturityLevel
      },
      files: [
        { path: programDocumentation.programPath, format: 'markdown', label: 'Compliance Program' },
        { path: implementationRoadmap.roadmapPath, format: 'markdown', label: 'Implementation Roadmap' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    organization: organizationProfile.name,
    framework,
    program: {
      path: programDocumentation.programPath,
      maturityLevel: orgAssessment.maturityLevel,
      governanceStructure: governanceStructure.structure
    },
    policies: policyDevelopment.policies.map(p => ({
      name: p.name,
      scope: p.scope,
      path: p.path
    })),
    controls: controlDesign.controls.map(c => ({
      id: c.id,
      name: c.name,
      type: c.type,
      risksMitigated: c.risksMitigated
    })),
    riskAssessment: {
      overallScore: riskAssessment.overallRiskScore,
      highRiskCount: riskAssessment.highRiskCount
    },
    implementationRoadmap: {
      path: implementationRoadmap.roadmapPath,
      phases: implementationRoadmap.phases,
      timeline: implementationRoadmap.timeline
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/business/legal/compliance-program-development',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const organizationalAssessmentTask = defineTask('organizational-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct organizational assessment',
  agent: {
    name: 'compliance-specialist',
    prompt: {
      role: 'Compliance Assessment Specialist',
      task: 'Assess organization compliance maturity and current state',
      context: args,
      instructions: [
        'Evaluate current compliance program maturity',
        'Assess organizational culture and tone at the top',
        'Review existing policies and procedures',
        'Evaluate compliance resources and budget',
        'Assess governance structure',
        'Identify gaps in current program',
        'Benchmark against industry peers',
        'Document assessment findings'
      ],
      outputFormat: 'JSON with maturityLevel, gaps, strengths, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['maturityLevel', 'artifacts'],
      properties: {
        maturityLevel: { type: 'string', enum: ['initial', 'developing', 'defined', 'managed', 'optimizing'] },
        gaps: { type: 'array', items: { type: 'string' } },
        strengths: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'compliance-program', 'assessment']
}));

export const regulatoryMappingTask = defineTask('regulatory-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map regulatory requirements',
  agent: {
    name: 'regulatory-specialist',
    prompt: {
      role: 'Regulatory Mapping Specialist',
      task: 'Map applicable regulatory requirements to organization',
      context: args,
      instructions: [
        'Identify all applicable regulations by scope',
        'Map requirements by geography',
        'Document specific requirements per regulation',
        'Identify cross-regulatory requirements',
        'Prioritize requirements by risk',
        'Create regulatory obligation register',
        'Document regulatory update frequency'
      ],
      outputFormat: 'JSON with requirements array, requirementCount, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['requirements', 'requirementCount', 'artifacts'],
      properties: {
        requirements: { type: 'array', items: { type: 'object' } },
        requirementCount: { type: 'number' },
        regulationCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'compliance-program', 'regulatory']
}));

export const complianceRiskAssessmentTask = defineTask('compliance-risk-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct compliance risk assessment',
  agent: {
    name: 'compliance-risk-analyst',
    prompt: {
      role: 'Compliance Risk Assessment Specialist',
      task: 'Identify and assess compliance risks',
      context: args,
      instructions: [
        'Identify compliance risks by regulatory domain',
        'Assess likelihood and impact of each risk',
        'Calculate risk scores',
        'Identify high-risk areas',
        'Map risks to business processes',
        'Consider inherent vs residual risk',
        'Prioritize risks for mitigation',
        'Document risk assessment methodology'
      ],
      outputFormat: 'JSON with risks array, riskCount, highRiskCount, highRiskAreas, overallRiskScore, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['riskCount', 'highRiskCount', 'overallRiskScore', 'artifacts'],
      properties: {
        risks: { type: 'array', items: { type: 'object' } },
        riskCount: { type: 'number' },
        highRiskCount: { type: 'number' },
        highRiskAreas: { type: 'array', items: { type: 'string' } },
        overallRiskScore: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'compliance-program', 'risk']
}));

export const frameworkDesignTask = defineTask('framework-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design program framework',
  agent: {
    name: 'compliance-specialist',
    prompt: {
      role: 'Compliance Framework Designer',
      task: 'Design compliance program framework based on selected standard',
      context: args,
      instructions: [
        'Map selected framework requirements (ISO 37301/COSO/DOJ)',
        'Design program structure and components',
        'Define program objectives and scope',
        'Establish program principles',
        'Design integration with business processes',
        'Define success metrics and KPIs',
        'Create framework documentation'
      ],
      outputFormat: 'JSON with framework object, components, metrics, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'components', 'artifacts'],
      properties: {
        framework: { type: 'object' },
        components: { type: 'array', items: { type: 'object' } },
        metrics: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'compliance-program', 'framework']
}));

export const governanceStructureTask = defineTask('governance-structure', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define governance structure',
  agent: {
    name: 'compliance-specialist',
    prompt: {
      role: 'Compliance Governance Specialist',
      task: 'Define compliance governance structure and reporting lines',
      context: args,
      instructions: [
        'Define compliance function structure',
        'Establish roles and responsibilities',
        'Define reporting lines to board/senior management',
        'Establish compliance committee structure',
        'Define escalation procedures',
        'Establish accountability matrix',
        'Create governance documentation'
      ],
      outputFormat: 'JSON with structure object, roles, committees, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['structure', 'artifacts'],
      properties: {
        structure: { type: 'object' },
        roles: { type: 'array', items: { type: 'object' } },
        committees: { type: 'array', items: { type: 'object' } },
        reportingLines: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'compliance-program', 'governance']
}));

export const policyDevelopmentTask = defineTask('policy-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop compliance policies',
  agent: {
    name: 'compliance-specialist',
    prompt: {
      role: 'Compliance Policy Developer',
      task: 'Develop comprehensive compliance policies',
      context: args,
      instructions: [
        'Identify required policies by regulatory scope',
        'Draft Code of Conduct',
        'Draft anti-corruption/anti-bribery policy',
        'Draft conflicts of interest policy',
        'Draft data protection policy (if applicable)',
        'Draft whistleblower/reporting policy',
        'Draft third-party due diligence policy',
        'Ensure policy consistency and cross-references'
      ],
      outputFormat: 'JSON with policies array, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['policies', 'artifacts'],
      properties: {
        policies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              scope: { type: 'string' },
              path: { type: 'string' },
              version: { type: 'string' }
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
  labels: ['agent', 'compliance-program', 'policy']
}));

export const controlDesignTask = defineTask('control-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design compliance controls',
  agent: {
    name: 'compliance-specialist',
    prompt: {
      role: 'Compliance Control Designer',
      task: 'Design compliance controls to mitigate identified risks',
      context: args,
      instructions: [
        'Design preventive controls',
        'Design detective controls',
        'Design corrective controls',
        'Map controls to risks',
        'Map controls to policies',
        'Define control ownership',
        'Define control testing procedures',
        'Document control descriptions'
      ],
      outputFormat: 'JSON with controls array, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['controls', 'artifacts'],
      properties: {
        controls: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string' },
              description: { type: 'string' },
              risksMitigated: { type: 'array', items: { type: 'string' } },
              owner: { type: 'string' }
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
  labels: ['agent', 'compliance-program', 'controls']
}));

export const trainingPlanTask = defineTask('training-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop training plan',
  agent: {
    name: 'compliance-specialist',
    prompt: {
      role: 'Compliance Training Specialist',
      task: 'Develop comprehensive compliance training plan',
      context: args,
      instructions: [
        'Define training curriculum by role',
        'Design onboarding training',
        'Design annual refresher training',
        'Design specialized training for high-risk roles',
        'Define training delivery methods',
        'Establish training completion tracking',
        'Define training effectiveness metrics',
        'Create training calendar'
      ],
      outputFormat: 'JSON with trainingPlan object, courses, metrics, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['trainingPlan', 'artifacts'],
      properties: {
        trainingPlan: { type: 'object' },
        courses: { type: 'array', items: { type: 'object' } },
        metrics: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'compliance-program', 'training']
}));

export const monitoringPlanTask = defineTask('monitoring-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop monitoring plan',
  agent: {
    name: 'compliance-specialist',
    prompt: {
      role: 'Compliance Monitoring Specialist',
      task: 'Develop compliance monitoring and testing plan',
      context: args,
      instructions: [
        'Design continuous monitoring procedures',
        'Design periodic testing procedures',
        'Define testing frequency by control',
        'Establish testing methodology',
        'Define issue management process',
        'Create monitoring dashboard metrics',
        'Define reporting cadence',
        'Establish remediation tracking'
      ],
      outputFormat: 'JSON with monitoringPlan object, testingSchedule, metrics, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['monitoringPlan', 'artifacts'],
      properties: {
        monitoringPlan: { type: 'object' },
        testingSchedule: { type: 'array', items: { type: 'object' } },
        metrics: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'compliance-program', 'monitoring']
}));

export const programDocumentationTask = defineTask('program-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assemble program documentation',
  agent: {
    name: 'compliance-specialist',
    prompt: {
      role: 'Compliance Documentation Specialist',
      task: 'Assemble comprehensive compliance program documentation',
      context: args,
      instructions: [
        'Create program charter document',
        'Compile all policies',
        'Document governance structure',
        'Include risk assessment',
        'Include control matrix',
        'Include training plan',
        'Include monitoring plan',
        'Create program manual'
      ],
      outputFormat: 'JSON with programPath, documents, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['programPath', 'artifacts'],
      properties: {
        programPath: { type: 'string' },
        documents: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'compliance-program', 'documentation']
}));

export const implementationRoadmapTask = defineTask('implementation-roadmap', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create implementation roadmap',
  agent: {
    name: 'compliance-specialist',
    prompt: {
      role: 'Compliance Implementation Specialist',
      task: 'Create phased implementation roadmap',
      context: args,
      instructions: [
        'Define implementation phases',
        'Prioritize activities by risk',
        'Create detailed timeline',
        'Identify resource requirements',
        'Define milestones and deliverables',
        'Identify dependencies',
        'Create communication plan',
        'Define success criteria per phase'
      ],
      outputFormat: 'JSON with roadmapPath, phases, timeline, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['roadmapPath', 'phases', 'timeline', 'artifacts'],
      properties: {
        roadmapPath: { type: 'string' },
        phases: { type: 'array', items: { type: 'object' } },
        timeline: { type: 'string' },
        milestones: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'compliance-program', 'implementation']
}));
