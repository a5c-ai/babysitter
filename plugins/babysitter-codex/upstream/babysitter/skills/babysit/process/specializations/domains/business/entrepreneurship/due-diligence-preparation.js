/**
 * @process specializations/domains/business/entrepreneurship/due-diligence-preparation
 * @description Due Diligence Preparation Process - Systematic process to prepare all materials and documentation required for investor due diligence.
 * @inputs { companyName: string, fundingStage: string, corporateStructure: object, financials: object, team: array, customers?: array }
 * @outputs { success: boolean, dataRoom: object, checklist: array, managementPresentation: object, riskMitigation: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/entrepreneurship/due-diligence-preparation', {
 *   companyName: 'TechVenture',
 *   fundingStage: 'Series A',
 *   corporateStructure: { entity: 'Delaware C-Corp' },
 *   financials: { revenue: 1000000, burn: 100000 }
 * });
 *
 * @references
 * - Cooley GO Due Diligence Guide: https://www.cooleygo.com/
 * - VC Due Diligence Frameworks
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    companyName,
    fundingStage,
    corporateStructure = {},
    financials = {},
    team = [],
    customers = []
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Due Diligence Preparation for ${companyName}`);

  // Phase 1: Corporate Documents Organization
  const corporateDocs = await ctx.task(corporateDocsTask, {
    companyName,
    corporateStructure
  });

  artifacts.push(...(corporateDocs.artifacts || []));

  // Phase 2: Financial Documentation
  const financialDocs = await ctx.task(financialDocsTask, {
    companyName,
    financials,
    fundingStage
  });

  artifacts.push(...(financialDocs.artifacts || []));

  // Phase 3: Cap Table Organization
  const capTableDocs = await ctx.task(capTableDocsTask, {
    companyName,
    corporateStructure
  });

  artifacts.push(...(capTableDocs.artifacts || []));

  // Phase 4: Customer Documentation
  const customerDocs = await ctx.task(customerDocsTask, {
    companyName,
    customers
  });

  artifacts.push(...(customerDocs.artifacts || []));

  // Phase 5: IP Documentation
  const ipDocs = await ctx.task(ipDocsTask, {
    companyName
  });

  artifacts.push(...(ipDocs.artifacts || []));

  // Breakpoint: Review document status
  await ctx.breakpoint({
    question: `Review due diligence document status for ${companyName}. Key documents identified. Continue with team and data room setup?`,
    title: 'Due Diligence Documents Review',
    context: {
      runId: ctx.runId,
      companyName,
      files: artifacts
    }
  });

  // Phase 6: Team Documentation
  const teamDocs = await ctx.task(teamDocsTask, {
    companyName,
    team
  });

  artifacts.push(...(teamDocs.artifacts || []));

  // Phase 7: Data Room Organization
  const dataRoomOrg = await ctx.task(dataRoomOrganizationTask, {
    companyName,
    corporateDocs,
    financialDocs,
    capTableDocs,
    customerDocs,
    ipDocs,
    teamDocs
  });

  artifacts.push(...(dataRoomOrg.artifacts || []));

  // Phase 8: Management Presentation
  const mgmtPresentation = await ctx.task(managementPresentationTask, {
    companyName,
    fundingStage,
    financials
  });

  artifacts.push(...(mgmtPresentation.artifacts || []));

  // Phase 9: Risk Identification and Mitigation
  const riskMitigation = await ctx.task(riskMitigationTask, {
    companyName,
    corporateDocs,
    financialDocs
  });

  artifacts.push(...(riskMitigation.artifacts || []));

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Due diligence preparation complete for ${companyName}. Data room organized, risks identified. Ready for investor diligence?`,
    title: 'Due Diligence Preparation Complete',
    context: {
      runId: ctx.runId,
      companyName,
      risks: riskMitigation.riskCount,
      files: artifacts
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    companyName,
    fundingStage,
    dataRoom: dataRoomOrg,
    checklist: dataRoomOrg.checklist,
    managementPresentation: mgmtPresentation,
    riskMitigation: riskMitigation.mitigations,
    documentStatus: {
      corporate: corporateDocs,
      financial: financialDocs,
      capTable: capTableDocs,
      customers: customerDocs,
      ip: ipDocs,
      team: teamDocs
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/business/entrepreneurship/due-diligence-preparation',
      timestamp: startTime,
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const corporateDocsTask = defineTask('corporate-docs', (args, taskCtx) => ({
  kind: 'agent',
  title: `Corporate Documents - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Corporate Legal Documentation Expert',
      task: 'Organize corporate documents for due diligence',
      context: {
        companyName: args.companyName,
        corporateStructure: args.corporateStructure
      },
      instructions: [
        '1. List certificate of incorporation and amendments',
        '2. Gather bylaws and operating agreements',
        '3. Compile board meeting minutes and consents',
        '4. Gather stockholder meeting minutes',
        '5. List all equity financing documents',
        '6. Compile option plan documents',
        '7. Gather convertible instruments (SAFEs, notes)',
        '8. List all material contracts',
        '9. Compile regulatory filings and licenses',
        '10. Create document status checklist'
      ],
      outputFormat: 'JSON object with corporate documents'
    },
    outputSchema: {
      type: 'object',
      required: ['documents', 'checklist', 'status'],
      properties: {
        documents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              status: { type: 'string' },
              priority: { type: 'string' }
            }
          }
        },
        checklist: { type: 'array', items: { type: 'string' } },
        status: { type: 'object' },
        missingDocuments: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'due-diligence', 'corporate']
}));

export const financialDocsTask = defineTask('financial-docs', (args, taskCtx) => ({
  kind: 'agent',
  title: `Financial Documentation - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Financial Due Diligence Expert',
      task: 'Prepare financial documentation for due diligence',
      context: {
        companyName: args.companyName,
        financials: args.financials,
        fundingStage: args.fundingStage
      },
      instructions: [
        '1. Prepare audited or reviewed financial statements',
        '2. Compile monthly financial reports (P&L, BS, CF)',
        '3. Prepare revenue breakdown and analysis',
        '4. Create expense breakdown by category',
        '5. Prepare bank statements (12+ months)',
        '6. Compile tax returns and filings',
        '7. Prepare budget and projections',
        '8. Create unit economics analysis',
        '9. Prepare accounts receivable and payable aging',
        '10. Document accounting policies'
      ],
      outputFormat: 'JSON object with financial documents'
    },
    outputSchema: {
      type: 'object',
      required: ['documents', 'financialSummary'],
      properties: {
        documents: { type: 'array', items: { type: 'object' } },
        financialSummary: { type: 'object' },
        revenueAnalysis: { type: 'object' },
        unitEconomics: { type: 'object' },
        missingDocuments: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'due-diligence', 'financial']
}));

export const capTableDocsTask = defineTask('cap-table-docs', (args, taskCtx) => ({
  kind: 'agent',
  title: `Cap Table Documentation - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Equity Management Expert',
      task: 'Organize cap table and equity documentation',
      context: {
        companyName: args.companyName,
        corporateStructure: args.corporateStructure
      },
      instructions: [
        '1. Prepare fully diluted cap table',
        '2. Document all stock issuances',
        '3. Compile option grants and exercises',
        '4. Document vesting schedules',
        '5. List all convertible instruments with terms',
        '6. Prepare pro forma cap table post-funding',
        '7. Document 409A valuations',
        '8. Identify any cap table issues',
        '9. Prepare waterfall analysis',
        '10. Document option pool allocation'
      ],
      outputFormat: 'JSON object with cap table documents'
    },
    outputSchema: {
      type: 'object',
      required: ['capTable', 'equityDocuments'],
      properties: {
        capTable: { type: 'object' },
        equityDocuments: { type: 'array', items: { type: 'object' } },
        convertibles: { type: 'array', items: { type: 'object' } },
        optionPool: { type: 'object' },
        valuations: { type: 'array', items: { type: 'object' } },
        issues: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'due-diligence', 'cap-table']
}));

export const customerDocsTask = defineTask('customer-docs', (args, taskCtx) => ({
  kind: 'agent',
  title: `Customer Documentation - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Customer Success and Sales Documentation Expert',
      task: 'Prepare customer documentation for due diligence',
      context: {
        companyName: args.companyName,
        customers: args.customers
      },
      instructions: [
        '1. Compile customer contracts and agreements',
        '2. Prepare customer list with revenue breakdown',
        '3. Create customer concentration analysis',
        '4. Compile customer references for calls',
        '5. Prepare churn and retention analysis',
        '6. Document customer acquisition metrics',
        '7. Prepare case studies and testimonials',
        '8. Document pricing and contract terms',
        '9. Identify key customer relationships',
        '10. Prepare customer segmentation analysis'
      ],
      outputFormat: 'JSON object with customer documents'
    },
    outputSchema: {
      type: 'object',
      required: ['customerList', 'contracts', 'references'],
      properties: {
        customerList: { type: 'array', items: { type: 'object' } },
        contracts: { type: 'array', items: { type: 'object' } },
        references: { type: 'array', items: { type: 'object' } },
        concentrationAnalysis: { type: 'object' },
        retentionAnalysis: { type: 'object' },
        caseStudies: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'due-diligence', 'customers']
}));

export const ipDocsTask = defineTask('ip-docs', (args, taskCtx) => ({
  kind: 'agent',
  title: `IP Documentation - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Intellectual Property Documentation Expert',
      task: 'Organize intellectual property documentation',
      context: {
        companyName: args.companyName
      },
      instructions: [
        '1. List all patents (filed, pending, granted)',
        '2. Compile trademark registrations',
        '3. Document copyright registrations',
        '4. List all IP assignments from founders/employees',
        '5. Compile PIIA agreements',
        '6. Document third-party IP licenses',
        '7. List open source usage and compliance',
        '8. Document trade secrets protection',
        '9. Identify any IP disputes or claims',
        '10. Prepare IP strategy summary'
      ],
      outputFormat: 'JSON object with IP documents'
    },
    outputSchema: {
      type: 'object',
      required: ['patents', 'trademarks', 'assignments'],
      properties: {
        patents: { type: 'array', items: { type: 'object' } },
        trademarks: { type: 'array', items: { type: 'object' } },
        copyrights: { type: 'array', items: { type: 'object' } },
        assignments: { type: 'array', items: { type: 'object' } },
        licenses: { type: 'array', items: { type: 'object' } },
        openSourceUsage: { type: 'array', items: { type: 'object' } },
        disputes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'due-diligence', 'ip']
}));

export const teamDocsTask = defineTask('team-docs', (args, taskCtx) => ({
  kind: 'agent',
  title: `Team Documentation - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'HR and Team Documentation Expert',
      task: 'Prepare team documentation for due diligence',
      context: {
        companyName: args.companyName,
        team: args.team
      },
      instructions: [
        '1. Prepare org chart and reporting structure',
        '2. Compile founder and executive bios',
        '3. Document employment agreements',
        '4. Compile offer letters for key employees',
        '5. Document contractor agreements',
        '6. Prepare compensation summary',
        '7. Document employee benefits',
        '8. List any employment disputes',
        '9. Prepare reference contacts for founders',
        '10. Document key person dependencies'
      ],
      outputFormat: 'JSON object with team documents'
    },
    outputSchema: {
      type: 'object',
      required: ['orgChart', 'founderBios', 'employmentDocs'],
      properties: {
        orgChart: { type: 'object' },
        founderBios: { type: 'array', items: { type: 'object' } },
        employmentDocs: { type: 'array', items: { type: 'object' } },
        compensationSummary: { type: 'object' },
        contractors: { type: 'array', items: { type: 'object' } },
        references: { type: 'array', items: { type: 'object' } },
        keyPersonRisks: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'due-diligence', 'team']
}));

export const dataRoomOrganizationTask = defineTask('data-room-organization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Data Room Organization - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Room Organization Expert',
      task: 'Create organized data room with proper access controls',
      context: {
        companyName: args.companyName,
        corporateDocs: args.corporateDocs,
        financialDocs: args.financialDocs,
        capTableDocs: args.capTableDocs,
        customerDocs: args.customerDocs,
        ipDocs: args.ipDocs,
        teamDocs: args.teamDocs
      },
      instructions: [
        '1. Create logical folder structure',
        '2. Organize documents by category',
        '3. Create index and table of contents',
        '4. Set up access permissions by tier',
        '5. Enable document tracking and analytics',
        '6. Create naming conventions',
        '7. Set up Q&A functionality',
        '8. Plan for document updates',
        '9. Create user guides for investors',
        '10. Test data room access and functionality'
      ],
      outputFormat: 'JSON object with data room organization'
    },
    outputSchema: {
      type: 'object',
      required: ['structure', 'checklist', 'accessLevels'],
      properties: {
        structure: { type: 'object' },
        checklist: { type: 'array', items: { type: 'object' } },
        accessLevels: { type: 'object' },
        index: { type: 'array', items: { type: 'string' } },
        namingConventions: { type: 'object' },
        platformRecommendation: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'due-diligence', 'data-room']
}));

export const managementPresentationTask = defineTask('management-presentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Management Presentation - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Due Diligence Presentation Expert',
      task: 'Create management presentation for investor diligence',
      context: {
        companyName: args.companyName,
        fundingStage: args.fundingStage,
        financials: args.financials
      },
      instructions: [
        '1. Create company overview and history',
        '2. Present market opportunity deep dive',
        '3. Detail product and technology',
        '4. Present go-to-market strategy',
        '5. Show financial performance and projections',
        '6. Present team capabilities',
        '7. Detail competitive positioning',
        '8. Present growth plans and use of funds',
        '9. Address known risks and mitigations',
        '10. Create Q&A preparation document'
      ],
      outputFormat: 'JSON object with management presentation'
    },
    outputSchema: {
      type: 'object',
      required: ['presentation', 'qaPrep'],
      properties: {
        presentation: { type: 'object' },
        sections: { type: 'array', items: { type: 'object' } },
        qaPrep: { type: 'array', items: { type: 'object' } },
        supportingData: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'due-diligence', 'presentation']
}));

export const riskMitigationTask = defineTask('risk-mitigation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Risk Identification and Mitigation - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Due Diligence Risk Expert',
      task: 'Identify and prepare mitigations for due diligence risks',
      context: {
        companyName: args.companyName,
        corporateDocs: args.corporateDocs,
        financialDocs: args.financialDocs
      },
      instructions: [
        '1. Identify potential red flags in documentation',
        '2. Assess legal and compliance risks',
        '3. Evaluate financial statement risks',
        '4. Identify customer concentration risks',
        '5. Assess technology and IP risks',
        '6. Evaluate team and key person risks',
        '7. Prepare mitigation strategies for each risk',
        '8. Create response templates for tough questions',
        '9. Identify disclosure requirements',
        '10. Prioritize risks by severity'
      ],
      outputFormat: 'JSON object with risk mitigation'
    },
    outputSchema: {
      type: 'object',
      required: ['risks', 'mitigations', 'riskCount'],
      properties: {
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              category: { type: 'string' },
              severity: { type: 'string' },
              mitigation: { type: 'string' }
            }
          }
        },
        mitigations: { type: 'array', items: { type: 'object' } },
        riskCount: { type: 'number' },
        responseTemplates: { type: 'array', items: { type: 'object' } },
        disclosureRequirements: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'due-diligence', 'risk']
}));
