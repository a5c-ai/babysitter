/**
 * @process specializations/security-research/responsible-disclosure
 * @description Managed process for ethical vulnerability disclosure to vendors with proper timeline
 * management, communication tracking, and escalation procedures following CERT/CC and industry
 * best practices.
 * @inputs { projectName: string, vulnerability: object, vendor: object, disclosurePolicy?: object }
 * @outputs { success: boolean, disclosureStatus: string, timeline: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/security-research/responsible-disclosure', {
 *   projectName: 'Critical Vulnerability Disclosure',
 *   vulnerability: {
 *     type: 'remote-code-execution',
 *     severity: 'critical',
 *     cveId: 'CVE-2024-XXXX'
 *   },
 *   vendor: { name: 'Acme Corp', contact: 'security@acme.com' },
 *   disclosurePolicy: { deadlineDays: 90 }
 * });
 *
 * @references
 * - CERT/CC Disclosure Policy: https://vuls.cert.org/confluence/display/CVD
 * - Google Project Zero Policy: https://googleprojectzero.blogspot.com/p/vulnerability-disclosure-policy.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    vulnerability,
    vendor,
    disclosurePolicy = { deadlineDays: 90, graceperiodDays: 14 },
    coordinators = [],
    outputDir = 'disclosure-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Responsible Disclosure for ${projectName}`);
  ctx.log('info', `Vendor: ${vendor.name}, Deadline: ${disclosurePolicy.deadlineDays} days`);

  // ============================================================================
  // PHASE 1: DISCLOSURE PREPARATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Preparing disclosure package');

  const preparation = await ctx.task(disclosurePreparationTask, {
    projectName,
    vulnerability,
    vendor,
    disclosurePolicy,
    outputDir
  });

  artifacts.push(...preparation.artifacts);

  // ============================================================================
  // PHASE 2: VENDOR CONTACT
  // ============================================================================

  ctx.log('info', 'Phase 2: Establishing vendor contact');

  const vendorContact = await ctx.task(vendorContactTask, {
    projectName,
    vendor,
    preparation,
    outputDir
  });

  artifacts.push(...vendorContact.artifacts);

  // ============================================================================
  // PHASE 3: INITIAL REPORT
  // ============================================================================

  ctx.log('info', 'Phase 3: Sending initial vulnerability report');

  const initialReport = await ctx.task(initialReportTask, {
    projectName,
    vulnerability,
    vendor,
    vendorContact,
    preparation,
    disclosurePolicy,
    outputDir
  });

  artifacts.push(...initialReport.artifacts);

  await ctx.breakpoint({
    question: `Initial report sent to ${vendor.name}. Disclosure deadline: ${disclosurePolicy.deadlineDays} days. Track response?`,
    title: 'Initial Report Sent',
    context: {
      runId: ctx.runId,
      reportSent: initialReport.sent,
      deadline: initialReport.deadline,
      files: initialReport.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 4: RESPONSE TRACKING
  // ============================================================================

  ctx.log('info', 'Phase 4: Tracking vendor response');

  const responseTracking = await ctx.task(responseTrackingTask, {
    projectName,
    vendor,
    initialReport,
    disclosurePolicy,
    outputDir
  });

  artifacts.push(...responseTracking.artifacts);

  // ============================================================================
  // PHASE 5: REMEDIATION SUPPORT
  // ============================================================================

  ctx.log('info', 'Phase 5: Providing remediation support');

  const remediationSupport = await ctx.task(remediationSupportTask, {
    projectName,
    vulnerability,
    vendor,
    responseTracking,
    outputDir
  });

  artifacts.push(...remediationSupport.artifacts);

  // ============================================================================
  // PHASE 6: TIMELINE MANAGEMENT
  // ============================================================================

  ctx.log('info', 'Phase 6: Managing disclosure timeline');

  const timelineManagement = await ctx.task(timelineManagementTask, {
    projectName,
    vendor,
    initialReport,
    responseTracking,
    disclosurePolicy,
    outputDir
  });

  artifacts.push(...timelineManagement.artifacts);

  // ============================================================================
  // PHASE 7: PUBLIC DISCLOSURE
  // ============================================================================

  ctx.log('info', 'Phase 7: Preparing for public disclosure');

  const publicDisclosure = await ctx.task(publicDisclosureTask, {
    projectName,
    vulnerability,
    vendor,
    timelineManagement,
    remediationSupport,
    outputDir
  });

  artifacts.push(...publicDisclosure.artifacts);

  await ctx.breakpoint({
    question: `Disclosure process at ${timelineManagement.status}. ${timelineManagement.daysRemaining} days remaining. Ready for public disclosure: ${publicDisclosure.ready}. Proceed?`,
    title: 'Disclosure Status Review',
    context: {
      runId: ctx.runId,
      status: timelineManagement.status,
      daysRemaining: timelineManagement.daysRemaining,
      vendorResponded: responseTracking.vendorResponded,
      patchAvailable: remediationSupport.patchAvailable,
      files: publicDisclosure.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown', label: a.label }))
    }
  });

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    disclosureStatus: timelineManagement.status,
    timeline: {
      initialReportDate: initialReport.reportDate,
      deadline: initialReport.deadline,
      daysRemaining: timelineManagement.daysRemaining,
      vendorAcknowledged: responseTracking.acknowledged,
      patchAvailable: remediationSupport.patchAvailable
    },
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'specializations/security-research/responsible-disclosure',
      timestamp: startTime,
      vendor,
      disclosurePolicy,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const disclosurePreparationTask = defineTask('disclosure-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Prepare Disclosure - ${args.projectName}`,
  agent: {
    name: 'security-report-writer',
    prompt: {
      role: 'Vulnerability Disclosure Coordinator',
      task: 'Prepare disclosure package',
      context: args,
      instructions: [
        '1. Prepare vulnerability details',
        '2. Create technical report',
        '3. Prepare proof of concept',
        '4. Document impact assessment',
        '5. Create disclosure timeline',
        '6. Prepare communication templates',
        '7. Identify coordinator if needed',
        '8. Document disclosure policy'
      ],
      outputFormat: 'JSON with preparation'
    },
    outputSchema: {
      type: 'object',
      required: ['disclosurePackage', 'artifacts'],
      properties: {
        disclosurePackage: { type: 'object' },
        timeline: { type: 'object' },
        templates: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'disclosure', 'preparation']
}));

export const vendorContactTask = defineTask('vendor-contact', (args, taskCtx) => ({
  kind: 'agent',
  title: `Contact Vendor - ${args.projectName}`,
  agent: {
    name: 'security-report-writer',
    prompt: {
      role: 'Vendor Communication Specialist',
      task: 'Establish vendor contact',
      context: args,
      instructions: [
        '1. Find security contact',
        '2. Check security.txt',
        '3. Find bug bounty program',
        '4. Establish secure channel',
        '5. Verify contact authenticity',
        '6. Document contact method',
        '7. Prepare PGP if available',
        '8. Log contact attempts'
      ],
      outputFormat: 'JSON with contact info'
    },
    outputSchema: {
      type: 'object',
      required: ['contactEstablished', 'contactMethod', 'artifacts'],
      properties: {
        contactEstablished: { type: 'boolean' },
        contactMethod: { type: 'string' },
        securityContact: { type: 'string' },
        pgpAvailable: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'disclosure', 'contact']
}));

export const initialReportTask = defineTask('initial-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Send Initial Report - ${args.projectName}`,
  agent: {
    name: 'security-report-writer',
    prompt: {
      role: 'Disclosure Report Specialist',
      task: 'Send initial vulnerability report',
      context: args,
      instructions: [
        '1. Format report for vendor',
        '2. Include vulnerability details',
        '3. Include reproduction steps',
        '4. State disclosure timeline',
        '5. Request acknowledgment',
        '6. Send via secure channel',
        '7. Log delivery confirmation',
        '8. Set deadline reminder'
      ],
      outputFormat: 'JSON with report status'
    },
    outputSchema: {
      type: 'object',
      required: ['sent', 'reportDate', 'deadline', 'artifacts'],
      properties: {
        sent: { type: 'boolean' },
        reportDate: { type: 'string' },
        deadline: { type: 'string' },
        deliveryConfirmed: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'disclosure', 'report']
}));

export const responseTrackingTask = defineTask('response-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: `Track Response - ${args.projectName}`,
  agent: {
    name: 'security-report-writer',
    prompt: {
      role: 'Vendor Response Tracker',
      task: 'Track vendor response',
      context: args,
      instructions: [
        '1. Monitor for acknowledgment',
        '2. Track response timeline',
        '3. Log all communications',
        '4. Follow up if no response',
        '5. Document vendor questions',
        '6. Track remediation status',
        '7. Note fix timeline estimates',
        '8. Document response quality'
      ],
      outputFormat: 'JSON with response status'
    },
    outputSchema: {
      type: 'object',
      required: ['vendorResponded', 'acknowledged', 'artifacts'],
      properties: {
        vendorResponded: { type: 'boolean' },
        acknowledged: { type: 'boolean' },
        responseDate: { type: 'string' },
        remediationETA: { type: 'string' },
        communications: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'disclosure', 'tracking']
}));

export const remediationSupportTask = defineTask('remediation-support', (args, taskCtx) => ({
  kind: 'agent',
  title: `Support Remediation - ${args.projectName}`,
  agent: {
    name: 'vuln-researcher',
    prompt: {
      role: 'Remediation Support Specialist',
      task: 'Provide remediation support',
      context: args,
      instructions: [
        '1. Answer technical questions',
        '2. Verify proposed fix',
        '3. Test patch if provided',
        '4. Suggest improvements',
        '5. Confirm fix completeness',
        '6. Document fix validation',
        '7. Track patch release',
        '8. Note any regressions'
      ],
      outputFormat: 'JSON with remediation status'
    },
    outputSchema: {
      type: 'object',
      required: ['patchAvailable', 'artifacts'],
      properties: {
        patchAvailable: { type: 'boolean' },
        patchVersion: { type: 'string' },
        fixVerified: { type: 'boolean' },
        fixComplete: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'disclosure', 'remediation']
}));

export const timelineManagementTask = defineTask('timeline-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Manage Timeline - ${args.projectName}`,
  agent: {
    name: 'security-report-writer',
    prompt: {
      role: 'Disclosure Timeline Manager',
      task: 'Manage disclosure timeline',
      context: args,
      instructions: [
        '1. Track days remaining',
        '2. Assess extension requests',
        '3. Document timeline changes',
        '4. Manage grace periods',
        '5. Prepare escalation if needed',
        '6. Coordinate with CERT/CC if stuck',
        '7. Document all timeline decisions',
        '8. Prepare for deadline'
      ],
      outputFormat: 'JSON with timeline status'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'daysRemaining', 'artifacts'],
      properties: {
        status: { type: 'string' },
        daysRemaining: { type: 'number' },
        extensionsGranted: { type: 'number' },
        escalationNeeded: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'disclosure', 'timeline']
}));

export const publicDisclosureTask = defineTask('public-disclosure', (args, taskCtx) => ({
  kind: 'agent',
  title: `Prepare Public Disclosure - ${args.projectName}`,
  agent: {
    name: 'security-report-writer',
    prompt: {
      role: 'Public Disclosure Specialist',
      task: 'Prepare for public disclosure',
      context: args,
      instructions: [
        '1. Prepare public advisory',
        '2. Coordinate with vendor',
        '3. Include patch information',
        '4. Credit appropriately',
        '5. Prepare blog/writeup',
        '6. Coordinate CVE publication',
        '7. Plan disclosure timing',
        '8. Prepare media if appropriate'
      ],
      outputFormat: 'JSON with public disclosure prep'
    },
    outputSchema: {
      type: 'object',
      required: ['ready', 'advisoryPath', 'artifacts'],
      properties: {
        ready: { type: 'boolean' },
        advisoryPath: { type: 'string' },
        disclosureDate: { type: 'string' },
        coordinatedWithVendor: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-research', 'disclosure', 'public']
}));
