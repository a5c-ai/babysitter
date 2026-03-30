/**
 * @process humanities/research-ethics-review
 * @description Navigate IRB/ethics review processes for human subjects research including informed consent, community protocols, and sensitive materials handling
 * @inputs { researchProject: object, participantPopulation: object, dataHandling: object, institutionalRequirements: object }
 * @outputs { success: boolean, ethicsApplication: object, consentMaterials: object, protocolDocuments: array, artifacts: array }
 * @recommendedSkills SK-HUM-006 (research-ethics-irb-navigation), SK-HUM-015 (grant-narrative-writing)
 * @recommendedAgents AG-HUM-008 (research-ethics-consultant), AG-HUM-009 (grants-publications-advisor)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    researchProject,
    participantPopulation = {},
    dataHandling = {},
    institutionalRequirements = {},
    sensitiveTopics = [],
    outputDir = 'ethics-review-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Risk Assessment
  ctx.log('info', 'Conducting research risk assessment');
  const riskAssessment = await ctx.task(riskAssessmentTask, {
    researchProject,
    participantPopulation,
    sensitiveTopics,
    outputDir
  });

  if (!riskAssessment.success) {
    return {
      success: false,
      error: 'Risk assessment failed',
      details: riskAssessment,
      metadata: { processId: 'humanities/research-ethics-review', timestamp: startTime }
    };
  }

  artifacts.push(...riskAssessment.artifacts);

  // Task 2: IRB Category Determination
  ctx.log('info', 'Determining IRB review category');
  const categoryDetermination = await ctx.task(categoryDeterminationTask, {
    researchProject,
    riskAssessment,
    institutionalRequirements,
    outputDir
  });

  artifacts.push(...categoryDetermination.artifacts);

  // Task 3: Consent Protocol Development
  ctx.log('info', 'Developing consent protocols');
  const consentDevelopment = await ctx.task(consentDevelopmentTask, {
    participantPopulation,
    riskAssessment,
    researchProject,
    outputDir
  });

  artifacts.push(...consentDevelopment.artifacts);

  // Task 4: Data Protection Planning
  ctx.log('info', 'Planning data protection measures');
  const dataProtection = await ctx.task(dataProtectionTask, {
    dataHandling,
    participantPopulation,
    sensitiveTopics,
    outputDir
  });

  artifacts.push(...dataProtection.artifacts);

  // Task 5: Vulnerable Population Protocols
  ctx.log('info', 'Developing vulnerable population protocols');
  const vulnerableProtocols = await ctx.task(vulnerableProtocolsTask, {
    participantPopulation,
    riskAssessment,
    consentDevelopment,
    outputDir
  });

  artifacts.push(...vulnerableProtocols.artifacts);

  // Task 6: Community Engagement Protocols
  ctx.log('info', 'Developing community engagement protocols');
  const communityProtocols = await ctx.task(communityEngagementTask, {
    researchProject,
    participantPopulation,
    outputDir
  });

  artifacts.push(...communityProtocols.artifacts);

  // Task 7: Generate IRB Application Package
  ctx.log('info', 'Generating IRB application package');
  const irbApplication = await ctx.task(irbApplicationTask, {
    researchProject,
    riskAssessment,
    categoryDetermination,
    consentDevelopment,
    dataProtection,
    vulnerableProtocols,
    communityProtocols,
    institutionalRequirements,
    outputDir
  });

  artifacts.push(...irbApplication.artifacts);

  // Breakpoint: Review ethics application
  await ctx.breakpoint({
    question: `Ethics review preparation complete for "${researchProject.title || 'project'}". Review category: ${categoryDetermination.category}. Review application?`,
    title: 'Research Ethics Review Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        projectTitle: researchProject.title,
        reviewCategory: categoryDetermination.category,
        riskLevel: riskAssessment.riskLevel,
        consentTypes: consentDevelopment.types
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    ethicsApplication: {
      category: categoryDetermination.category,
      riskLevel: riskAssessment.riskLevel,
      applicationPath: irbApplication.applicationPath
    },
    consentMaterials: {
      forms: consentDevelopment.forms,
      scripts: consentDevelopment.scripts,
      types: consentDevelopment.types
    },
    protocolDocuments: {
      dataProtection: dataProtection.protocols,
      vulnerablePopulations: vulnerableProtocols.protocols,
      community: communityProtocols.protocols
    },
    artifacts,
    duration,
    metadata: {
      processId: 'humanities/research-ethics-review',
      timestamp: startTime,
      projectTitle: researchProject.title,
      outputDir
    }
  };
}

// Task 1: Risk Assessment
export const riskAssessmentTask = defineTask('risk-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct research risk assessment',
  agent: {
    name: 'risk-assessor',
    prompt: {
      role: 'research ethics risk specialist',
      task: 'Assess risks to research participants',
      context: args,
      instructions: [
        'Identify potential physical risks',
        'Assess psychological/emotional risks',
        'Identify social/reputational risks',
        'Assess economic/legal risks',
        'Evaluate risk probability and severity',
        'Identify vulnerable populations',
        'Assess sensitive topic risks',
        'Develop risk mitigation strategies'
      ],
      outputFormat: 'JSON with success, riskLevel, risks, mitigations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'riskLevel', 'risks', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        riskLevel: { type: 'string', enum: ['minimal', 'moderate', 'significant'] },
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              description: { type: 'string' },
              probability: { type: 'string' },
              severity: { type: 'string' }
            }
          }
        },
        mitigations: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'risk', 'assessment', 'ethics']
}));

// Task 2: IRB Category Determination
export const categoryDeterminationTask = defineTask('category-determination', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Determine IRB review category',
  agent: {
    name: 'irb-specialist',
    prompt: {
      role: 'IRB category specialist',
      task: 'Determine appropriate IRB review category',
      context: args,
      instructions: [
        'Assess exempt category eligibility',
        'Evaluate expedited review criteria',
        'Determine if full board review needed',
        'Document category justification',
        'Identify applicable regulations',
        'Note any special requirements',
        'Prepare category determination form',
        'Document decision rationale'
      ],
      outputFormat: 'JSON with category, justification, regulations, requirements, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['category', 'justification', 'artifacts'],
      properties: {
        category: {
          type: 'string',
          enum: ['exempt', 'expedited', 'full-board']
        },
        justification: { type: 'string' },
        regulations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              regulation: { type: 'string' },
              applicability: { type: 'string' }
            }
          }
        },
        requirements: { type: 'array', items: { type: 'string' } },
        exemptCategory: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'irb', 'category', 'determination']
}));

// Task 3: Consent Protocol Development
export const consentDevelopmentTask = defineTask('consent-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop consent protocols',
  agent: {
    name: 'consent-developer',
    prompt: {
      role: 'informed consent specialist',
      task: 'Develop comprehensive consent protocols',
      context: args,
      instructions: [
        'Draft informed consent document',
        'Create consent process procedures',
        'Develop assent forms for minors',
        'Create oral consent scripts',
        'Address consent for recording',
        'Develop ongoing consent procedures',
        'Create consent documentation forms',
        'Address capacity assessment'
      ],
      outputFormat: 'JSON with forms, scripts, types, procedures, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['forms', 'types', 'artifacts'],
      properties: {
        forms: {
          type: 'object',
          properties: {
            written: { type: 'string' },
            assent: { type: 'string' },
            recording: { type: 'string' }
          }
        },
        scripts: {
          type: 'object',
          properties: {
            oral: { type: 'string' },
            ongoing: { type: 'string' }
          }
        },
        types: { type: 'array', items: { type: 'string' } },
        procedures: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'consent', 'informed-consent', 'protocols']
}));

// Task 4: Data Protection Planning
export const dataProtectionTask = defineTask('data-protection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan data protection measures',
  agent: {
    name: 'data-protection-planner',
    prompt: {
      role: 'research data protection specialist',
      task: 'Plan comprehensive data protection measures',
      context: args,
      instructions: [
        'Design data anonymization procedures',
        'Plan secure storage protocols',
        'Develop access control measures',
        'Create data retention schedule',
        'Plan data destruction procedures',
        'Address data sharing protocols',
        'Develop breach response plan',
        'Ensure regulatory compliance'
      ],
      outputFormat: 'JSON with protocols, storage, retention, sharing, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['protocols', 'artifacts'],
      properties: {
        protocols: {
          type: 'object',
          properties: {
            anonymization: { type: 'object' },
            storage: { type: 'object' },
            access: { type: 'object' }
          }
        },
        storage: {
          type: 'object',
          properties: {
            location: { type: 'string' },
            security: { type: 'array', items: { type: 'string' } }
          }
        },
        retention: {
          type: 'object',
          properties: {
            period: { type: 'string' },
            destruction: { type: 'string' }
          }
        },
        sharing: { type: 'object' },
        breachResponse: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'data-protection', 'privacy', 'security']
}));

// Task 5: Vulnerable Population Protocols
export const vulnerableProtocolsTask = defineTask('vulnerable-protocols', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop vulnerable population protocols',
  agent: {
    name: 'vulnerable-populations-specialist',
    prompt: {
      role: 'vulnerable populations research specialist',
      task: 'Develop protocols for vulnerable populations',
      context: args,
      instructions: [
        'Identify vulnerable populations involved',
        'Develop additional protections',
        'Create capacity assessment procedures',
        'Develop authorized representative protocols',
        'Plan coercion prevention measures',
        'Address power imbalances',
        'Create additional consent safeguards',
        'Document justification for inclusion'
      ],
      outputFormat: 'JSON with protocols, populations, protections, justification, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['protocols', 'populations', 'artifacts'],
      properties: {
        protocols: {
          type: 'object',
          properties: {
            assessment: { type: 'object' },
            protection: { type: 'object' },
            consent: { type: 'object' }
          }
        },
        populations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              group: { type: 'string' },
              vulnerability: { type: 'string' },
              protections: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        justification: { type: 'string' },
        safeguards: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'vulnerable-populations', 'protections', 'ethics']
}));

// Task 6: Community Engagement Protocols
export const communityEngagementTask = defineTask('community-engagement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop community engagement protocols',
  agent: {
    name: 'community-engagement-specialist',
    prompt: {
      role: 'community-based research ethics specialist',
      task: 'Develop community engagement and benefit protocols',
      context: args,
      instructions: [
        'Develop community consultation process',
        'Create community consent protocols',
        'Plan benefit-sharing arrangements',
        'Develop dissemination agreements',
        'Address cultural protocols',
        'Plan community feedback mechanisms',
        'Address data sovereignty issues',
        'Document community agreements'
      ],
      outputFormat: 'JSON with protocols, consultation, benefits, agreements, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['protocols', 'artifacts'],
      properties: {
        protocols: {
          type: 'object',
          properties: {
            consultation: { type: 'object' },
            consent: { type: 'object' },
            feedback: { type: 'object' }
          }
        },
        consultation: {
          type: 'object',
          properties: {
            process: { type: 'string' },
            stakeholders: { type: 'array', items: { type: 'string' } }
          }
        },
        benefits: {
          type: 'object',
          properties: {
            arrangements: { type: 'array', items: { type: 'string' } },
            dissemination: { type: 'string' }
          }
        },
        agreements: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'community', 'engagement', 'protocols']
}));

// Task 7: IRB Application Package Generation
export const irbApplicationTask = defineTask('irb-application', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate IRB application package',
  agent: {
    name: 'irb-application-writer',
    prompt: {
      role: 'IRB application specialist',
      task: 'Generate complete IRB application package',
      context: args,
      instructions: [
        'Complete IRB application form',
        'Compile consent documents',
        'Include protocol summary',
        'Attach recruitment materials',
        'Include data collection instruments',
        'Compile supporting documents',
        'Create application checklist',
        'Prepare submission package'
      ],
      outputFormat: 'JSON with applicationPath, documents, checklist, package, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['applicationPath', 'documents', 'artifacts'],
      properties: {
        applicationPath: { type: 'string' },
        documents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              path: { type: 'string' }
            }
          }
        },
        checklist: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              item: { type: 'string' },
              status: { type: 'string' }
            }
          }
        },
        package: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'irb', 'application', 'submission']
}));
