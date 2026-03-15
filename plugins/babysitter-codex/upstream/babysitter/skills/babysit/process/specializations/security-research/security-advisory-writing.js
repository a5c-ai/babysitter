/**
 * @process specializations/security-research/security-advisory-writing
 * @description Creation of professional security advisories and vulnerability disclosures following
 * industry standards. Includes CVE formatting, CVSS scoring, remediation guidance, and coordinated
 * disclosure timelines.
 * @inputs { projectName: string, vulnerability: object, vendor?: string, disclosureTimeline?: object }
 * @outputs { success: boolean, advisory: object, cveRequest?: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/security-research/security-advisory-writing', {
 *   projectName: 'SQL Injection Advisory',
 *   vulnerability: {
 *     type: 'sql-injection',
 *     product: 'WebApp v2.1.0',
 *     severity: 'high'
 *   },
 *   vendor: 'Acme Corp',
 *   disclosureTimeline: { daysTilPublic: 90 }
 * });
 *
 * @references
 * - CVE: https://cve.mitre.org/
 * - CERT/CC: https://www.kb.cert.org/vuls/
 * - FIRST: https://www.first.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    vulnerability,
    vendor = null,
    disclosureTimeline = { daysTilPublic: 90 },
    includePoC = true,
    outputDir = 'advisory-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Security Advisory Writing for ${projectName}`);
  ctx.log('info', `Vulnerability: ${vulnerability.type} in ${vulnerability.product}`);

  // ============================================================================
  // PHASE 1: VULNERABILITY SUMMARY
  // ============================================================================

  ctx.log('info', 'Phase 1: Creating vulnerability summary');

  const vulnSummary = await ctx.task(vulnSummaryTask, {
    projectName,
    vulnerability,
    outputDir
  });

  artifacts.push(...vulnSummary.artifacts);

  // ============================================================================
  // PHASE 2: CVSS CALCULATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Calculating CVSS score');

  const cvssCalc = await ctx.task(advisoryCvssTask, {
    projectName,
    vulnerability,
    vulnSummary,
    outputDir
  });

  artifacts.push(...cvssCalc.artifacts);

  // ============================================================================
  // PHASE 3: TECHNICAL WRITEUP
  // ============================================================================

  ctx.log('info', 'Phase 3: Writing technical details');

  const technicalWriteup = await ctx.task(technicalWriteupTask, {
    projectName,
    vulnerability,
    vulnSummary,
    includePoC,
    outputDir
  });

  artifacts.push(...technicalWriteup.artifacts);

  // ============================================================================
  // PHASE 4: IMPACT ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Documenting impact assessment');

  const impactAssessment = await ctx.task(impactAssessmentTask, {
    projectName,
    vulnerability,
    cvssCalc,
    outputDir
  });

  artifacts.push(...impactAssessment.artifacts);

  // ============================================================================
  // PHASE 5: REMEDIATION GUIDANCE
  // ============================================================================

  ctx.log('info', 'Phase 5: Writing remediation guidance');

  const remediation = await ctx.task(remediationGuidanceTask, {
    projectName,
    vulnerability,
    outputDir
  });

  artifacts.push(...remediation.artifacts);

  // ============================================================================
  // PHASE 6: CVE REQUEST PREPARATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Preparing CVE request');

  const cveRequest = await ctx.task(cveRequestTask, {
    projectName,
    vulnerability,
    vulnSummary,
    cvssCalc,
    vendor,
    outputDir
  });

  artifacts.push(...cveRequest.artifacts);

  // ============================================================================
  // PHASE 7: ADVISORY FORMATTING
  // ============================================================================

  ctx.log('info', 'Phase 7: Formatting final advisory');

  const advisory = await ctx.task(advisoryFormattingTask, {
    projectName,
    vulnSummary,
    cvssCalc,
    technicalWriteup,
    impactAssessment,
    remediation,
    cveRequest,
    disclosureTimeline,
    outputDir
  });

  artifacts.push(...advisory.artifacts);

  await ctx.breakpoint({
    question: `Advisory complete for ${projectName}. CVSS: ${cvssCalc.cvssScore}. Ready for ${vendor ? 'vendor disclosure' : 'public disclosure'}?`,
    title: 'Advisory Ready for Review',
    context: {
      runId: ctx.runId,
      summary: {
        vulnerability: vulnerability.type,
        product: vulnerability.product,
        cvss: cvssCalc.cvssScore,
        severity: cvssCalc.severity
      },
      files: advisory.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown', label: a.label }))
    }
  });

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    advisory: {
      advisoryPath: advisory.advisoryPath,
      cvss: cvssCalc.cvssScore,
      severity: cvssCalc.severity
    },
    cveRequest: cveRequest.requestData,
    disclosureTimeline,
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'specializations/security-research/security-advisory-writing',
      timestamp: startTime,
      vendor,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const vulnSummaryTask = defineTask('vuln-summary', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create Summary - ${args.projectName}`,
  agent: {
    name: 'security-report-writer',
    prompt: {
      role: 'Security Advisory Writer',
      task: 'Create vulnerability summary',
      context: args,
      instructions: [
        '1. Write executive summary',
        '2. Describe vulnerability type',
        '3. Identify affected products',
        '4. List affected versions',
        '5. Summarize impact',
        '6. Create one-line description',
        '7. Identify CWE classification',
        '8. Document discovery timeline'
      ],
      outputFormat: 'JSON with summary'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'cweId', 'affectedVersions', 'artifacts'],
      properties: {
        summary: { type: 'string' },
        cweId: { type: 'string' },
        affectedVersions: { type: 'array' },
        oneLiner: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'advisory', 'summary']
}));

export const advisoryCvssTask = defineTask('advisory-cvss', (args, taskCtx) => ({
  kind: 'agent',
  title: `Calculate CVSS - ${args.projectName}`,
  agent: {
    name: 'vuln-researcher',
    prompt: {
      role: 'CVSS Scoring Specialist',
      task: 'Calculate CVSS score for advisory',
      context: args,
      instructions: [
        '1. Assess attack vector',
        '2. Assess attack complexity',
        '3. Assess privileges required',
        '4. Assess user interaction',
        '5. Assess scope change',
        '6. Assess CIA impact',
        '7. Calculate base score',
        '8. Generate CVSS vector'
      ],
      outputFormat: 'JSON with CVSS'
    },
    outputSchema: {
      type: 'object',
      required: ['cvssScore', 'cvssVector', 'severity', 'artifacts'],
      properties: {
        cvssScore: { type: 'number' },
        cvssVector: { type: 'string' },
        severity: { type: 'string' },
        metrics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'advisory', 'cvss']
}));

export const technicalWriteupTask = defineTask('technical-writeup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Write Technical Details - ${args.projectName}`,
  agent: {
    name: 'security-report-writer',
    prompt: {
      role: 'Security Technical Writer',
      task: 'Write technical details for advisory',
      context: args,
      instructions: [
        '1. Describe root cause',
        '2. Document vulnerable code',
        '3. Explain attack scenario',
        '4. Include reproduction steps',
        '5. Add proof-of-concept if appropriate',
        '6. Document prerequisites',
        '7. Explain technical impact',
        '8. Format for clarity'
      ],
      outputFormat: 'JSON with technical details'
    },
    outputSchema: {
      type: 'object',
      required: ['technicalDetails', 'reproductionSteps', 'artifacts'],
      properties: {
        technicalDetails: { type: 'string' },
        reproductionSteps: { type: 'array' },
        proofOfConcept: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'advisory', 'technical']
}));

export const impactAssessmentTask = defineTask('impact-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Assess Impact - ${args.projectName}`,
  agent: {
    name: 'vuln-researcher',
    prompt: {
      role: 'Security Impact Analyst',
      task: 'Document vulnerability impact',
      context: args,
      instructions: [
        '1. Describe confidentiality impact',
        '2. Describe integrity impact',
        '3. Describe availability impact',
        '4. Assess business impact',
        '5. Identify affected users',
        '6. Document data at risk',
        '7. Assess exploitability',
        '8. Rate overall severity'
      ],
      outputFormat: 'JSON with impact assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['impactSummary', 'businessImpact', 'artifacts'],
      properties: {
        impactSummary: { type: 'string' },
        businessImpact: { type: 'string' },
        dataAtRisk: { type: 'array' },
        affectedUsers: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'advisory', 'impact']
}));

export const remediationGuidanceTask = defineTask('remediation-guidance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Write Remediation - ${args.projectName}`,
  agent: {
    name: 'security-report-writer',
    prompt: {
      role: 'Security Remediation Advisor',
      task: 'Write remediation guidance',
      context: args,
      instructions: [
        '1. Recommend primary fix',
        '2. Suggest patch/update',
        '3. Provide workarounds',
        '4. Document mitigation steps',
        '5. Suggest detection methods',
        '6. Recommend monitoring',
        '7. Provide timeline guidance',
        '8. Include verification steps'
      ],
      outputFormat: 'JSON with remediation'
    },
    outputSchema: {
      type: 'object',
      required: ['primaryFix', 'workarounds', 'artifacts'],
      properties: {
        primaryFix: { type: 'string' },
        workarounds: { type: 'array' },
        mitigations: { type: 'array' },
        verificationSteps: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'advisory', 'remediation']
}));

export const cveRequestTask = defineTask('cve-request', (args, taskCtx) => ({
  kind: 'agent',
  title: `Prepare CVE Request - ${args.projectName}`,
  agent: {
    name: 'security-report-writer',
    prompt: {
      role: 'CVE Request Specialist',
      task: 'Prepare CVE request',
      context: args,
      instructions: [
        '1. Prepare CVE request form',
        '2. Include vulnerability details',
        '3. List affected products',
        '4. Include CVSS score',
        '5. Add CWE classification',
        '6. Include vendor contact',
        '7. Document discovery date',
        '8. Format per MITRE requirements'
      ],
      outputFormat: 'JSON with CVE request'
    },
    outputSchema: {
      type: 'object',
      required: ['requestData', 'artifacts'],
      properties: {
        requestData: { type: 'object' },
        cnaContact: { type: 'string' },
        submissionReady: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'advisory', 'cve']
}));

export const advisoryFormattingTask = defineTask('advisory-formatting', (args, taskCtx) => ({
  kind: 'agent',
  title: `Format Advisory - ${args.projectName}`,
  agent: {
    name: 'security-report-writer',
    prompt: {
      role: 'Advisory Formatting Specialist',
      task: 'Format final security advisory',
      context: args,
      instructions: [
        '1. Use standard advisory format',
        '2. Include all sections',
        '3. Add proper headers',
        '4. Include CVE placeholder',
        '5. Add disclosure timeline',
        '6. Include vendor response',
        '7. Add credits section',
        '8. Format professionally'
      ],
      outputFormat: 'JSON with advisory'
    },
    outputSchema: {
      type: 'object',
      required: ['advisoryPath', 'artifacts'],
      properties: {
        advisoryPath: { type: 'string' },
        advisoryText: { type: 'string' },
        publicationReady: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'advisory', 'formatting']
}));
