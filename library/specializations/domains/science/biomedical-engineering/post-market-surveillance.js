/**
 * @process specializations/domains/science/biomedical-engineering/post-market-surveillance
 * @description Post-Market Surveillance System Implementation - Implement post-market surveillance systems
 * to monitor device safety and performance in the field per FDA and EU MDR requirements.
 * @inputs { deviceName: string, deviceClass: string, markets: string[], riskProfile: object }
 * @outputs { success: boolean, pmsSystem: object, psurTemplate: object, pmcfPlan: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/biomedical-engineering/post-market-surveillance', {
 *   deviceName: 'Implantable Cardioverter Defibrillator',
 *   deviceClass: 'Class III',
 *   markets: ['US', 'EU', 'Japan'],
 *   riskProfile: { riskClass: 'high', implantable: true }
 * });
 *
 * @references
 * - EU MDR Article 83-86 Post-Market Surveillance
 * - FDA 21 CFR 803 Medical Device Reporting
 * - MDCG 2020-7 PMCF Plan Template
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    deviceName,
    deviceClass,
    markets,
    riskProfile
  } = inputs;

  // Phase 1: Complaint Handling System
  const complaintHandling = await ctx.task(complaintHandlingTask, {
    deviceName,
    deviceClass,
    markets
  });

  // Phase 2: Adverse Event Monitoring
  const adverseEventMonitoring = await ctx.task(adverseEventTask, {
    deviceName,
    deviceClass,
    markets,
    riskProfile
  });

  // Phase 3: PSUR Development
  const psurDevelopment = await ctx.task(psurDevelopmentTask, {
    deviceName,
    deviceClass,
    riskProfile
  });

  // Phase 4: PMCF Planning
  const pmcfPlanning = await ctx.task(pmcfPlanningTask, {
    deviceName,
    deviceClass,
    riskProfile
  });

  // Breakpoint: Review PMS system design
  await ctx.breakpoint({
    question: `Review PMS system design for ${deviceName}. Are all regulatory requirements addressed?`,
    title: 'PMS System Review',
    context: {
      runId: ctx.runId,
      deviceName,
      markets,
      files: [{
        path: `artifacts/pms-system-design.json`,
        format: 'json',
        content: { complaintHandling, adverseEventMonitoring }
      }]
    }
  });

  // Phase 5: Trend Analysis and Signal Detection
  const trendAnalysis = await ctx.task(trendAnalysisTask, {
    deviceName,
    complaintHandling,
    adverseEventMonitoring
  });

  // Phase 6: CAPA Integration
  const capaIntegration = await ctx.task(capaIntegrationTask, {
    deviceName,
    complaintHandling,
    trendAnalysis
  });

  // Phase 7: Vigilance Reporting
  const vigilanceReporting = await ctx.task(vigilanceReportingTask, {
    deviceName,
    markets,
    adverseEventMonitoring
  });

  // Phase 8: PMS System Documentation
  const pmsDocumentation = await ctx.task(pmsDocumentationTask, {
    deviceName,
    deviceClass,
    markets,
    complaintHandling,
    adverseEventMonitoring,
    psurDevelopment,
    pmcfPlanning,
    trendAnalysis,
    capaIntegration,
    vigilanceReporting
  });

  // Final Breakpoint: PMS System Approval
  await ctx.breakpoint({
    question: `PMS System implementation complete for ${deviceName}. Approve system for deployment?`,
    title: 'PMS System Approval',
    context: {
      runId: ctx.runId,
      deviceName,
      files: [
        { path: `artifacts/pms-documentation.json`, format: 'json', content: pmsDocumentation }
      ]
    }
  });

  return {
    success: true,
    deviceName,
    pmsSystem: pmsDocumentation.system,
    psurTemplate: psurDevelopment.template,
    pmcfPlan: pmcfPlanning.plan,
    metadata: {
      processId: 'specializations/domains/science/biomedical-engineering/post-market-surveillance',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const complaintHandlingTask = defineTask('complaint-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Complaint Handling - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Quality Systems Specialist',
      task: 'Establish complaint handling system',
      context: {
        deviceName: args.deviceName,
        deviceClass: args.deviceClass,
        markets: args.markets
      },
      instructions: [
        '1. Define complaint intake procedures',
        '2. Establish complaint categorization',
        '3. Define investigation procedures',
        '4. Set response time requirements',
        '5. Define escalation procedures',
        '6. Establish trending requirements',
        '7. Define record retention',
        '8. Create complaint forms',
        '9. Define reporting triggers',
        '10. Create complaint handling SOP'
      ],
      outputFormat: 'JSON object with complaint handling system'
    },
    outputSchema: {
      type: 'object',
      required: ['procedures', 'forms', 'escalationMatrix'],
      properties: {
        procedures: { type: 'object' },
        forms: { type: 'array', items: { type: 'string' } },
        escalationMatrix: { type: 'object' },
        responseTimes: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['pms', 'complaints', 'quality']
}));

export const adverseEventTask = defineTask('adverse-event-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Adverse Event Monitoring - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Vigilance Specialist',
      task: 'Establish adverse event monitoring system',
      context: {
        deviceName: args.deviceName,
        deviceClass: args.deviceClass,
        markets: args.markets,
        riskProfile: args.riskProfile
      },
      instructions: [
        '1. Define reportable event criteria',
        '2. Establish MDR reporting (FDA)',
        '3. Establish vigilance reporting (EU)',
        '4. Define reporting timelines',
        '5. Establish event investigation',
        '6. Define causality assessment',
        '7. Establish follow-up procedures',
        '8. Create reporting forms',
        '9. Define database requirements',
        '10. Create adverse event monitoring SOP'
      ],
      outputFormat: 'JSON object with adverse event monitoring'
    },
    outputSchema: {
      type: 'object',
      required: ['reportingCriteria', 'timelines', 'procedures'],
      properties: {
        reportingCriteria: { type: 'object' },
        timelines: { type: 'object' },
        procedures: { type: 'object' },
        forms: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['pms', 'adverse-events', 'vigilance']
}));

export const psurDevelopmentTask = defineTask('psur-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: PSUR Development - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'PSUR Author',
      task: 'Develop PSUR template and process',
      context: {
        deviceName: args.deviceName,
        deviceClass: args.deviceClass,
        riskProfile: args.riskProfile
      },
      instructions: [
        '1. Determine PSUR frequency',
        '2. Define PSUR content per MDCG guidance',
        '3. Establish data collection for PSUR',
        '4. Define analysis methods',
        '5. Establish benefit-risk update process',
        '6. Define conclusion methodology',
        '7. Create PSUR template',
        '8. Define review and approval process',
        '9. Establish NB submission process',
        '10. Create PSUR development SOP'
      ],
      outputFormat: 'JSON object with PSUR development'
    },
    outputSchema: {
      type: 'object',
      required: ['template', 'frequency', 'process'],
      properties: {
        template: { type: 'object' },
        frequency: { type: 'string' },
        process: { type: 'object' },
        dataRequirements: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['pms', 'psur', 'eu-mdr']
}));

export const pmcfPlanningTask = defineTask('pmcf-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: PMCF Planning - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Clinical Affairs Specialist',
      task: 'Develop Post-Market Clinical Follow-up plan',
      context: {
        deviceName: args.deviceName,
        deviceClass: args.deviceClass,
        riskProfile: args.riskProfile
      },
      instructions: [
        '1. Identify PMCF objectives',
        '2. Determine PMCF methods',
        '3. Plan clinical studies if needed',
        '4. Plan registry participation',
        '5. Define literature review process',
        '6. Establish complaint data analysis',
        '7. Define endpoints and sample sizes',
        '8. Create PMCF protocol',
        '9. Define CER update triggers',
        '10. Create PMCF plan document'
      ],
      outputFormat: 'JSON object with PMCF plan'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'objectives', 'methods'],
      properties: {
        plan: { type: 'object' },
        objectives: { type: 'array', items: { type: 'string' } },
        methods: { type: 'array', items: { type: 'object' } },
        timeline: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['pms', 'pmcf', 'clinical']
}));

export const trendAnalysisTask = defineTask('trend-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Trend Analysis - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Analytics Specialist',
      task: 'Establish trend analysis and signal detection',
      context: {
        deviceName: args.deviceName,
        complaintHandling: args.complaintHandling,
        adverseEventMonitoring: args.adverseEventMonitoring
      },
      instructions: [
        '1. Define trending metrics',
        '2. Establish baseline rates',
        '3. Define alert thresholds',
        '4. Implement statistical methods',
        '5. Define signal detection criteria',
        '6. Establish review frequency',
        '7. Create trending reports',
        '8. Define escalation triggers',
        '9. Link to CAPA system',
        '10. Create trending SOP'
      ],
      outputFormat: 'JSON object with trend analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'thresholds', 'methods'],
      properties: {
        metrics: { type: 'array', items: { type: 'object' } },
        thresholds: { type: 'object' },
        methods: { type: 'array', items: { type: 'string' } },
        reportTemplates: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['pms', 'trending', 'analytics']
}));

export const capaIntegrationTask = defineTask('capa-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: CAPA Integration - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Quality Systems Engineer',
      task: 'Integrate PMS with CAPA system',
      context: {
        deviceName: args.deviceName,
        complaintHandling: args.complaintHandling,
        trendAnalysis: args.trendAnalysis
      },
      instructions: [
        '1. Define CAPA triggers from PMS',
        '2. Establish investigation requirements',
        '3. Define root cause analysis methods',
        '4. Establish corrective action process',
        '5. Define preventive action process',
        '6. Establish effectiveness verification',
        '7. Link to design changes',
        '8. Define regulatory reporting',
        '9. Document CAPA records',
        '10. Create CAPA integration SOP'
      ],
      outputFormat: 'JSON object with CAPA integration'
    },
    outputSchema: {
      type: 'object',
      required: ['triggers', 'process', 'integration'],
      properties: {
        triggers: { type: 'array', items: { type: 'object' } },
        process: { type: 'object' },
        integration: { type: 'object' },
        recordRequirements: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['pms', 'capa', 'quality']
}));

export const vigilanceReportingTask = defineTask('vigilance-reporting', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Vigilance Reporting - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Regulatory Reporting Specialist',
      task: 'Establish vigilance reporting procedures',
      context: {
        deviceName: args.deviceName,
        markets: args.markets,
        adverseEventMonitoring: args.adverseEventMonitoring
      },
      instructions: [
        '1. Define MDR reporting (FDA)',
        '2. Define EU vigilance reporting',
        '3. Define Japan PMDA reporting',
        '4. Establish reporting timelines',
        '5. Create reporting forms/templates',
        '6. Define follow-up reporting',
        '7. Establish field safety corrective actions',
        '8. Define recall procedures',
        '9. Document competent authority contacts',
        '10. Create vigilance reporting SOP'
      ],
      outputFormat: 'JSON object with vigilance reporting'
    },
    outputSchema: {
      type: 'object',
      required: ['reportingProcedures', 'timelines', 'contacts'],
      properties: {
        reportingProcedures: { type: 'object' },
        timelines: { type: 'object' },
        contacts: { type: 'array', items: { type: 'object' } },
        forms: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['pms', 'vigilance', 'regulatory']
}));

export const pmsDocumentationTask = defineTask('pms-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: PMS Documentation - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Documentation Manager',
      task: 'Compile complete PMS system documentation',
      context: {
        deviceName: args.deviceName,
        deviceClass: args.deviceClass,
        markets: args.markets,
        complaintHandling: args.complaintHandling,
        adverseEventMonitoring: args.adverseEventMonitoring,
        psurDevelopment: args.psurDevelopment,
        pmcfPlanning: args.pmcfPlanning,
        trendAnalysis: args.trendAnalysis,
        capaIntegration: args.capaIntegration,
        vigilanceReporting: args.vigilanceReporting
      },
      instructions: [
        '1. Compile PMS plan per MDR Article 84',
        '2. Include complaint handling procedures',
        '3. Include vigilance procedures',
        '4. Include trend analysis procedures',
        '5. Include PSUR process',
        '6. Include PMCF plan',
        '7. Include CAPA integration',
        '8. Document responsibilities',
        '9. Create system overview diagram',
        '10. Create PMS system manual'
      ],
      outputFormat: 'JSON object with PMS documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['system', 'procedures', 'responsibilities'],
      properties: {
        system: { type: 'object' },
        procedures: { type: 'array', items: { type: 'object' } },
        responsibilities: { type: 'object' },
        systemDiagram: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['pms', 'documentation', 'quality']
}));
