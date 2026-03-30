/**
 * @process philosophy/systematic-theological-formulation
 * @description Develop coherent articulations of religious doctrine, integrating scriptural, traditional, and rational sources within a theological framework
 * @inputs { theologicalTopic: string, tradition: string, sources: array, outputDir: string }
 * @outputs { success: boolean, theologicalFormulation: object, sourceIntegration: object, systematicPosition: object, artifacts: array }
 * @recommendedSkills SK-PHIL-008 (theological-synthesis), SK-PHIL-004 (hermeneutical-interpretation), SK-PHIL-010 (philosophical-writing-argumentation)
 * @recommendedAgents AG-PHIL-005 (philosophical-theologian-agent), AG-PHIL-003 (hermeneutics-specialist-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    theologicalTopic,
    tradition = 'ecumenical',
    sources = ['scripture', 'tradition', 'reason', 'experience'],
    outputDir = 'theological-formulation-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Topic Definition and Scope
  ctx.log('info', 'Starting systematic theological formulation: Defining topic');
  const topicDefinition = await ctx.task(topicDefinitionTask, {
    theologicalTopic,
    tradition,
    outputDir
  });

  if (!topicDefinition.success) {
    return {
      success: false,
      error: 'Topic definition failed',
      details: topicDefinition,
      metadata: { processId: 'philosophy/systematic-theological-formulation', timestamp: startTime }
    };
  }

  artifacts.push(...topicDefinition.artifacts);

  // Task 2: Scriptural Analysis
  ctx.log('info', 'Analyzing scriptural sources');
  const scripturalAnalysis = await ctx.task(scripturalAnalysisTask, {
    topic: topicDefinition.defined,
    tradition,
    outputDir
  });

  artifacts.push(...scripturalAnalysis.artifacts);

  // Task 3: Traditional Sources Analysis
  ctx.log('info', 'Analyzing traditional sources');
  const traditionalAnalysis = await ctx.task(traditionalAnalysisTask, {
    topic: topicDefinition.defined,
    tradition,
    scripturalFindings: scripturalAnalysis.findings,
    outputDir
  });

  artifacts.push(...traditionalAnalysis.artifacts);

  // Task 4: Rational-Philosophical Analysis
  ctx.log('info', 'Conducting rational-philosophical analysis');
  const rationalAnalysis = await ctx.task(rationalAnalysisTask, {
    topic: topicDefinition.defined,
    scripturalFindings: scripturalAnalysis.findings,
    traditionalFindings: traditionalAnalysis.findings,
    outputDir
  });

  artifacts.push(...rationalAnalysis.artifacts);

  // Task 5: Source Integration
  ctx.log('info', 'Integrating sources');
  const sourceIntegration = await ctx.task(sourceIntegrationTask, {
    topic: topicDefinition.defined,
    scripturalAnalysis,
    traditionalAnalysis,
    rationalAnalysis,
    sources,
    outputDir
  });

  artifacts.push(...sourceIntegration.artifacts);

  // Task 6: Systematic Formulation
  ctx.log('info', 'Developing systematic formulation');
  const systematicFormulation = await ctx.task(systematicFormulationTask, {
    topic: topicDefinition.defined,
    integration: sourceIntegration.integrated,
    tradition,
    outputDir
  });

  artifacts.push(...systematicFormulation.artifacts);

  // Breakpoint: Review theological formulation
  await ctx.breakpoint({
    question: `Systematic theological formulation on "${theologicalTopic}" complete. Review the formulation?`,
    title: 'Systematic Theological Formulation Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        topic: theologicalTopic,
        tradition,
        sourcesUsed: sources,
        doctrinalClaims: systematicFormulation.formulation.claims?.length || 0
      }
    }
  });

  // Task 7: Generate Theological Report
  ctx.log('info', 'Generating systematic theological report');
  const theologicalReport = await ctx.task(theologicalReportTask, {
    theologicalTopic,
    topicDefinition,
    scripturalAnalysis,
    traditionalAnalysis,
    rationalAnalysis,
    sourceIntegration,
    systematicFormulation,
    tradition,
    outputDir
  });

  artifacts.push(...theologicalReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    theologicalFormulation: {
      topic: theologicalTopic,
      tradition,
      formulation: systematicFormulation.formulation,
      doctrinalClaims: systematicFormulation.formulation.claims
    },
    sourceIntegration: {
      scriptural: scripturalAnalysis.findings,
      traditional: traditionalAnalysis.findings,
      rational: rationalAnalysis.findings,
      synthesis: sourceIntegration.integrated
    },
    systematicPosition: {
      position: systematicFormulation.position,
      justification: systematicFormulation.justification,
      ecumenicalStatus: systematicFormulation.ecumenicalStatus
    },
    artifacts,
    duration,
    metadata: {
      processId: 'philosophy/systematic-theological-formulation',
      timestamp: startTime,
      tradition,
      outputDir
    }
  };
}

// Task definitions
export const topicDefinitionTask = defineTask('topic-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define theological topic and scope',
  agent: {
    name: 'theologian',
    prompt: {
      role: 'systematic theologian',
      task: 'Define and scope the theological topic for systematic formulation',
      context: args,
      instructions: [
        'Clarify the theological topic precisely',
        'Identify the doctrinal locus (God, creation, salvation, etc.)',
        'Note the tradition context and constraints',
        'Identify related doctrines and connections',
        'Scope the inquiry appropriately',
        'Identify key questions to address',
        'Note any confessional commitments',
        'Save topic definition to output directory'
      ],
      outputFormat: 'JSON with success, defined (topic, locus, scope, questions), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'defined', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        defined: {
          type: 'object',
          properties: {
            topic: { type: 'string' },
            locus: { type: 'string' },
            scope: { type: 'string' },
            relatedDoctrines: { type: 'array', items: { type: 'string' } },
            keyQuestions: { type: 'array', items: { type: 'string' } },
            confessionalCommitments: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'philosophy', 'theology', 'topic-definition']
}));

export const scripturalAnalysisTask = defineTask('scriptural-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze scriptural sources',
  agent: {
    name: 'biblical-theologian',
    prompt: {
      role: 'biblical theologian',
      task: 'Analyze relevant scriptural sources for the theological topic',
      context: args,
      instructions: [
        'Identify key scriptural texts relevant to the topic',
        'Conduct exegesis of primary texts',
        'Note biblical-theological themes',
        'Consider canonical context',
        'Identify biblical warrants for doctrine',
        'Note any tensions or diversity in scripture',
        'Summarize scriptural testimony',
        'Save scriptural analysis to output directory'
      ],
      outputFormat: 'JSON with findings (texts, exegesis, themes, warrants), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['findings', 'artifacts'],
      properties: {
        findings: {
          type: 'object',
          properties: {
            primaryTexts: { type: 'array', items: { type: 'string' } },
            exegesis: { type: 'array', items: { type: 'object' } },
            themes: { type: 'array', items: { type: 'string' } },
            warrants: { type: 'array', items: { type: 'string' } },
            tensions: { type: 'array', items: { type: 'string' } },
            summary: { type: 'string' }
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
  labels: ['agent', 'philosophy', 'theology', 'scriptural']
}));

export const traditionalAnalysisTask = defineTask('traditional-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze traditional sources',
  agent: {
    name: 'historical-theologian',
    prompt: {
      role: 'historical theologian',
      task: 'Analyze traditional sources including patristic, medieval, and confessional',
      context: args,
      instructions: [
        'Survey patristic teaching on the topic',
        'Note creedal and conciliar statements',
        'Survey medieval theological development',
        'Present Reformation era positions',
        'Note modern theological developments',
        'Identify consensus fidelium',
        'Note controversial or disputed points',
        'Save traditional analysis to output directory'
      ],
      outputFormat: 'JSON with findings (patristic, creedal, medieval, reformation, modern), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['findings', 'artifacts'],
      properties: {
        findings: {
          type: 'object',
          properties: {
            patristic: { type: 'array', items: { type: 'object' } },
            creedal: { type: 'array', items: { type: 'string' } },
            medieval: { type: 'array', items: { type: 'object' } },
            reformation: { type: 'array', items: { type: 'object' } },
            modern: { type: 'array', items: { type: 'object' } },
            consensus: { type: 'string' },
            controversies: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'philosophy', 'theology', 'traditional']
}));

export const rationalAnalysisTask = defineTask('rational-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct rational-philosophical analysis',
  agent: {
    name: 'philosophical-theologian',
    prompt: {
      role: 'philosophical theologian',
      task: 'Apply philosophical reasoning to the theological topic',
      context: args,
      instructions: [
        'Clarify key concepts philosophically',
        'Assess logical coherence of doctrinal claims',
        'Engage with philosophical objections',
        'Apply relevant philosophical frameworks',
        'Consider natural theology contributions',
        'Assess rational defensibility',
        'Note areas requiring faith beyond reason',
        'Save rational analysis to output directory'
      ],
      outputFormat: 'JSON with findings (conceptual, coherence, objections, frameworks), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['findings', 'artifacts'],
      properties: {
        findings: {
          type: 'object',
          properties: {
            conceptualAnalysis: { type: 'array', items: { type: 'object' } },
            coherenceAssessment: { type: 'string' },
            objections: { type: 'array', items: { type: 'string' } },
            responses: { type: 'array', items: { type: 'string' } },
            frameworks: { type: 'array', items: { type: 'string' } },
            rationalDefensibility: { type: 'string' },
            faithBeyondReason: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'philosophy', 'theology', 'rational']
}));

export const sourceIntegrationTask = defineTask('source-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Integrate theological sources',
  agent: {
    name: 'systematic-theologian',
    prompt: {
      role: 'systematic theologian',
      task: 'Integrate scriptural, traditional, and rational sources into coherent synthesis',
      context: args,
      instructions: [
        'Synthesize scriptural findings',
        'Integrate traditional testimony',
        'Incorporate rational analysis',
        'Resolve any tensions between sources',
        'Weight sources appropriately for tradition',
        'Develop integrated understanding',
        'Note any remaining unresolved tensions',
        'Save source integration to output directory'
      ],
      outputFormat: 'JSON with integrated (synthesis, weightings, tensions, resolution), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['integrated', 'artifacts'],
      properties: {
        integrated: {
          type: 'object',
          properties: {
            synthesis: { type: 'string' },
            sourceWeightings: { type: 'object' },
            tensionsResolved: { type: 'array', items: { type: 'string' } },
            tensionsUnresolved: { type: 'array', items: { type: 'string' } },
            integratedPosition: { type: 'string' }
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
  labels: ['agent', 'philosophy', 'theology', 'integration']
}));

export const systematicFormulationTask = defineTask('systematic-formulation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop systematic theological formulation',
  agent: {
    name: 'dogmatic-theologian',
    prompt: {
      role: 'systematic theologian',
      task: 'Develop a coherent systematic formulation of the doctrine',
      context: args,
      instructions: [
        'Formulate doctrinal claims precisely',
        'Organize claims systematically',
        'Connect to related doctrines',
        'Provide theological justification',
        'Address potential objections',
        'Note ecumenical status (shared vs. distinctive)',
        'Consider pastoral implications',
        'Save systematic formulation to output directory'
      ],
      outputFormat: 'JSON with formulation (claims, organization, connections), position, justification, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['formulation', 'position', 'artifacts'],
      properties: {
        formulation: {
          type: 'object',
          properties: {
            claims: { type: 'array', items: { type: 'string' } },
            organization: { type: 'string' },
            connections: { type: 'array', items: { type: 'string' } }
          }
        },
        position: { type: 'string' },
        justification: { type: 'string' },
        objections: { type: 'array', items: { type: 'string' } },
        responses: { type: 'array', items: { type: 'string' } },
        ecumenicalStatus: { type: 'string' },
        pastoralImplications: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'theology', 'formulation']
}));

export const theologicalReportTask = defineTask('theological-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate systematic theological report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'systematic theologian and technical writer',
      task: 'Generate comprehensive systematic theological report',
      context: args,
      instructions: [
        'Create executive summary of theological formulation',
        'Present topic definition and scope',
        'Document scriptural analysis',
        'Present traditional sources analysis',
        'Include rational-philosophical analysis',
        'Present source integration',
        'Detail systematic formulation',
        'Note ecumenical considerations',
        'Format as professional theological report',
        'Save report to output directory'
      ],
      outputFormat: 'JSON with reportPath, summary, keyFindings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'summary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        summary: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'theology', 'reporting']
}));
