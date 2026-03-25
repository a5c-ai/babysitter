/**
 * @process humanities/sociolinguistic-survey
 * @description Design and conduct sociolinguistic research examining language variation, attitudes, and use in social context with appropriate sampling strategies
 * @inputs { researchQuestion: string, population: object, variablesOfInterest: array, methodology: string }
 * @outputs { success: boolean, surveyDesign: object, samplingPlan: object, dataAnalysis: object, artifacts: array }
 * @recommendedSkills SK-HUM-002 (ethnographic-coding-thematics), SK-HUM-006 (research-ethics-irb-navigation), SK-HUM-009 (topic-modeling-text-mining)
 * @recommendedAgents AG-HUM-003 (documentary-linguist), AG-HUM-002 (ethnographic-methods-advisor)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    researchQuestion,
    population = {},
    variablesOfInterest = [],
    methodology = 'mixed-methods',
    ethicsRequirements = {},
    outputDir = 'sociolinguistic-survey-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Research Design Framework
  ctx.log('info', 'Establishing research design framework');
  const researchDesign = await ctx.task(researchDesignTask, {
    researchQuestion,
    population,
    variablesOfInterest,
    methodology,
    outputDir
  });

  if (!researchDesign.success) {
    return {
      success: false,
      error: 'Research design failed',
      details: researchDesign,
      metadata: { processId: 'humanities/sociolinguistic-survey', timestamp: startTime }
    };
  }

  artifacts.push(...researchDesign.artifacts);

  // Task 2: Sampling Strategy Development
  ctx.log('info', 'Developing sampling strategy');
  const samplingStrategy = await ctx.task(samplingStrategyTask, {
    population,
    researchDesign,
    variablesOfInterest,
    outputDir
  });

  artifacts.push(...samplingStrategy.artifacts);

  // Task 3: Instrument Development
  ctx.log('info', 'Developing research instruments');
  const instrumentDevelopment = await ctx.task(instrumentDevelopmentTask, {
    researchQuestion,
    variablesOfInterest,
    methodology,
    outputDir
  });

  artifacts.push(...instrumentDevelopment.artifacts);

  // Task 4: Ethics and Consent Protocols
  ctx.log('info', 'Establishing ethics and consent protocols');
  const ethicsProtocols = await ctx.task(ethicsProtocolsTask, {
    population,
    instrumentDevelopment,
    ethicsRequirements,
    outputDir
  });

  artifacts.push(...ethicsProtocols.artifacts);

  // Task 5: Data Collection Protocol
  ctx.log('info', 'Establishing data collection protocols');
  const dataCollectionProtocol = await ctx.task(dataCollectionTask, {
    instrumentDevelopment,
    samplingStrategy,
    methodology,
    outputDir
  });

  artifacts.push(...dataCollectionProtocol.artifacts);

  // Task 6: Analysis Framework
  ctx.log('info', 'Developing analysis framework');
  const analysisFramework = await ctx.task(analysisFrameworkTask, {
    variablesOfInterest,
    methodology,
    researchDesign,
    outputDir
  });

  artifacts.push(...analysisFramework.artifacts);

  // Task 7: Generate Survey Protocol Document
  ctx.log('info', 'Generating survey protocol document');
  const protocolDocument = await ctx.task(protocolDocumentTask, {
    researchQuestion,
    researchDesign,
    samplingStrategy,
    instrumentDevelopment,
    ethicsProtocols,
    dataCollectionProtocol,
    analysisFramework,
    outputDir
  });

  artifacts.push(...protocolDocument.artifacts);

  // Breakpoint: Review survey design
  await ctx.breakpoint({
    question: `Sociolinguistic survey design complete for: ${researchQuestion}. Sample size: ${samplingStrategy.sampleSize}. Review design?`,
    title: 'Sociolinguistic Survey Design Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        researchQuestion,
        methodology,
        sampleSize: samplingStrategy.sampleSize,
        instruments: instrumentDevelopment.instruments?.length || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    surveyDesign: {
      researchQuestion,
      design: researchDesign.design,
      methodology
    },
    samplingPlan: {
      strategy: samplingStrategy.strategy,
      sampleSize: samplingStrategy.sampleSize,
      stratification: samplingStrategy.stratification
    },
    instruments: instrumentDevelopment.instruments,
    dataAnalysis: analysisFramework.framework,
    artifacts,
    duration,
    metadata: {
      processId: 'humanities/sociolinguistic-survey',
      timestamp: startTime,
      researchQuestion,
      outputDir
    }
  };
}

// Task 1: Research Design Framework
export const researchDesignTask = defineTask('research-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish research design framework',
  agent: {
    name: 'research-designer',
    prompt: {
      role: 'sociolinguistic research design specialist',
      task: 'Establish comprehensive research design framework',
      context: args,
      instructions: [
        'Define research questions and hypotheses',
        'Identify dependent and independent variables',
        'Select appropriate research design',
        'Define social variables for stratification',
        'Identify linguistic variables to examine',
        'Establish theoretical framework',
        'Define scope and limitations',
        'Create research timeline'
      ],
      outputFormat: 'JSON with success, design, variables, hypotheses, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'design', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        design: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            approach: { type: 'string' },
            framework: { type: 'string' }
          }
        },
        variables: {
          type: 'object',
          properties: {
            linguistic: { type: 'array', items: { type: 'object' } },
            social: { type: 'array', items: { type: 'object' } }
          }
        },
        hypotheses: { type: 'array', items: { type: 'string' } },
        timeline: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'research-design', 'sociolinguistics', 'methodology']
}));

// Task 2: Sampling Strategy Development
export const samplingStrategyTask = defineTask('sampling-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop sampling strategy',
  agent: {
    name: 'sampling-specialist',
    prompt: {
      role: 'sociolinguistic sampling specialist',
      task: 'Develop appropriate sampling strategy for population',
      context: args,
      instructions: [
        'Define target population',
        'Select sampling method (random, stratified, etc.)',
        'Determine sample size requirements',
        'Define stratification variables',
        'Create sampling frame',
        'Address sampling biases',
        'Plan for non-response',
        'Document recruitment procedures'
      ],
      outputFormat: 'JSON with strategy, sampleSize, stratification, recruitment, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'sampleSize', 'artifacts'],
      properties: {
        strategy: {
          type: 'object',
          properties: {
            method: { type: 'string' },
            frame: { type: 'string' },
            approach: { type: 'string' }
          }
        },
        sampleSize: { type: 'number' },
        stratification: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              variable: { type: 'string' },
              categories: { type: 'array', items: { type: 'string' } },
              targetN: { type: 'object' }
            }
          }
        },
        recruitment: { type: 'object' },
        biasConsiderations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sampling', 'methodology', 'population']
}));

// Task 3: Instrument Development
export const instrumentDevelopmentTask = defineTask('instrument-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop research instruments',
  agent: {
    name: 'instrument-developer',
    prompt: {
      role: 'sociolinguistic instrument specialist',
      task: 'Develop research instruments for data collection',
      context: args,
      instructions: [
        'Design language attitude questionnaire',
        'Develop sociolinguistic interview protocol',
        'Create elicitation tasks',
        'Design matched guise or verbal guise tasks',
        'Develop demographic questionnaire',
        'Create recording protocols',
        'Design language use diary if needed',
        'Pilot test instruments'
      ],
      outputFormat: 'JSON with instruments, questionnaires, protocols, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['instruments', 'artifacts'],
      properties: {
        instruments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              purpose: { type: 'string' },
              administration: { type: 'string' }
            }
          }
        },
        questionnaires: { type: 'array', items: { type: 'object' } },
        protocols: { type: 'array', items: { type: 'object' } },
        elicitationTasks: { type: 'array', items: { type: 'object' } },
        piloting: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'instruments', 'questionnaire', 'elicitation']
}));

// Task 4: Ethics and Consent Protocols
export const ethicsProtocolsTask = defineTask('ethics-protocols', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish ethics and consent protocols',
  agent: {
    name: 'ethics-coordinator',
    prompt: {
      role: 'research ethics specialist',
      task: 'Develop ethics and consent protocols for human subjects research',
      context: args,
      instructions: [
        'Develop informed consent documentation',
        'Address anonymity and confidentiality',
        'Create data protection protocols',
        'Address community sensitivities',
        'Develop protocols for minors if applicable',
        'Create debriefing procedures',
        'Prepare IRB application materials',
        'Document risk assessment'
      ],
      outputFormat: 'JSON with consent, confidentiality, irb, risks, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['consent', 'confidentiality', 'artifacts'],
      properties: {
        consent: {
          type: 'object',
          properties: {
            form: { type: 'string' },
            process: { type: 'string' },
            special: { type: 'object' }
          }
        },
        confidentiality: {
          type: 'object',
          properties: {
            anonymization: { type: 'string' },
            dataStorage: { type: 'string' },
            retention: { type: 'string' }
          }
        },
        irb: {
          type: 'object',
          properties: {
            category: { type: 'string' },
            materials: { type: 'array', items: { type: 'string' } }
          }
        },
        risks: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ethics', 'consent', 'irb']
}));

// Task 5: Data Collection Protocol
export const dataCollectionTask = defineTask('data-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish data collection protocols',
  agent: {
    name: 'data-collection-specialist',
    prompt: {
      role: 'sociolinguistic data collection specialist',
      task: 'Establish comprehensive data collection protocols',
      context: args,
      instructions: [
        'Create fieldwork schedule',
        'Develop interviewer training materials',
        'Establish recording protocols',
        'Create data entry procedures',
        'Develop quality control procedures',
        'Create participant tracking system',
        'Establish backup procedures',
        'Document metadata standards'
      ],
      outputFormat: 'JSON with protocols, training, quality, metadata, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['protocols', 'artifacts'],
      properties: {
        protocols: {
          type: 'object',
          properties: {
            fieldwork: { type: 'object' },
            recording: { type: 'object' },
            dataEntry: { type: 'object' }
          }
        },
        training: {
          type: 'object',
          properties: {
            materials: { type: 'array', items: { type: 'string' } },
            procedures: { type: 'array', items: { type: 'string' } }
          }
        },
        quality: {
          type: 'object',
          properties: {
            checks: { type: 'array', items: { type: 'string' } },
            verification: { type: 'string' }
          }
        },
        metadata: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'data-collection', 'fieldwork', 'protocols']
}));

// Task 6: Analysis Framework
export const analysisFrameworkTask = defineTask('analysis-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop analysis framework',
  agent: {
    name: 'analysis-specialist',
    prompt: {
      role: 'sociolinguistic analysis specialist',
      task: 'Develop comprehensive analysis framework',
      context: args,
      instructions: [
        'Define coding schemes for variables',
        'Select statistical methods',
        'Plan variationist analysis approach',
        'Develop qualitative analysis framework',
        'Create data visualization plan',
        'Plan software and tools needed',
        'Establish validity and reliability measures',
        'Create analysis timeline'
      ],
      outputFormat: 'JSON with framework, statistical, qualitative, tools, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'artifacts'],
      properties: {
        framework: {
          type: 'object',
          properties: {
            approach: { type: 'string' },
            coding: { type: 'object' },
            integration: { type: 'string' }
          }
        },
        statistical: {
          type: 'object',
          properties: {
            methods: { type: 'array', items: { type: 'string' } },
            software: { type: 'array', items: { type: 'string' } }
          }
        },
        qualitative: {
          type: 'object',
          properties: {
            approach: { type: 'string' },
            coding: { type: 'object' }
          }
        },
        tools: { type: 'array', items: { type: 'string' } },
        validity: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'analysis', 'statistics', 'variationist']
}));

// Task 7: Protocol Document Generation
export const protocolDocumentTask = defineTask('protocol-document', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate survey protocol document',
  agent: {
    name: 'protocol-writer',
    prompt: {
      role: 'sociolinguistic research documentation specialist',
      task: 'Generate comprehensive survey protocol document',
      context: args,
      instructions: [
        'Present research design overview',
        'Document sampling strategy',
        'Present research instruments',
        'Document ethics protocols',
        'Present data collection procedures',
        'Document analysis framework',
        'Include appendices with forms',
        'Format as research protocol'
      ],
      outputFormat: 'JSON with protocolPath, sections, appendices, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['protocolPath', 'artifacts'],
      properties: {
        protocolPath: { type: 'string' },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              content: { type: 'string' }
            }
          }
        },
        appendices: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              content: { type: 'string' }
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
  labels: ['agent', 'documentation', 'protocol', 'sociolinguistics']
}));
