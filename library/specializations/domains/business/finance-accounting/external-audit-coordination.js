/**
 * @file external-audit-coordination.js
 * @description Managing the external audit process including PBC list preparation, interim procedures, year-end testing support, and audit committee presentations
 * @module specializations/domains/business/finance-accounting
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * External Audit Coordination Process
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.auditYear - Year being audited
 * @param {Object} inputs.auditTimeline - Audit timeline and key dates
 * @param {Object} inputs.priorYearAuditIssues - Issues from prior year audit
 * @param {Object} inputs.financialStatements - Financial statements being audited
 * @param {Object} ctx - Process context with task() and breakpoint() methods
 * @returns {Promise<Object>} Completed audit coordination package
 */
export async function process(inputs, ctx) {
  const results = {
    steps: [],
    outputs: {}
  };

  // Step 1: Audit Planning Coordination
  const planningResult = await ctx.task(coordinateAuditPlanningTask, {
    auditYear: inputs.auditYear,
    auditTimeline: inputs.auditTimeline,
    priorYearIssues: inputs.priorYearAuditIssues
  });
  results.steps.push({ name: 'audit-planning', result: planningResult });

  // Step 2: PBC List Development
  const pbcResult = await ctx.task(developPBCListTask, {
    auditYear: inputs.auditYear,
    auditPlan: planningResult
  });
  results.steps.push({ name: 'pbc-list', result: pbcResult });

  // Breakpoint for PBC review
  await ctx.breakpoint('pbc-review', {
    message: 'Review PBC list and prepare for interim audit',
    data: pbcResult
  });

  // Step 3: Interim Audit Support
  const interimResult = await ctx.task(supportInterimAuditTask, {
    pbcList: pbcResult,
    auditTimeline: inputs.auditTimeline
  });
  results.steps.push({ name: 'interim-audit', result: interimResult });

  // Step 4: Year-End Audit Support
  const yearEndResult = await ctx.task(supportYearEndAuditTask, {
    financialStatements: inputs.financialStatements,
    pbcList: pbcResult,
    interimResults: interimResult
  });
  results.steps.push({ name: 'year-end-audit', result: yearEndResult });

  // Breakpoint for audit issues review
  await ctx.breakpoint('audit-issues-review', {
    message: 'Review audit findings and proposed adjustments',
    data: yearEndResult
  });

  // Step 5: Audit Adjustment Processing
  const adjustmentsResult = await ctx.task(processAuditAdjustmentsTask, {
    auditFindings: yearEndResult,
    financialStatements: inputs.financialStatements
  });
  results.steps.push({ name: 'audit-adjustments', result: adjustmentsResult });

  // Step 6: Management Representation Letter
  const repLetterResult = await ctx.task(prepareRepresentationLetterTask, {
    auditYear: inputs.auditYear,
    financialStatements: inputs.financialStatements,
    auditIssues: yearEndResult
  });
  results.steps.push({ name: 'representation-letter', result: repLetterResult });

  // Step 7: Audit Committee Preparation
  const auditCommitteeResult = await ctx.task(prepareAuditCommitteeMaterialsTask, {
    auditYear: inputs.auditYear,
    auditResults: yearEndResult,
    adjustments: adjustmentsResult
  });
  results.steps.push({ name: 'audit-committee-prep', result: auditCommitteeResult });

  // Breakpoint for final sign-off
  await ctx.breakpoint('final-signoff', {
    message: 'Review final audit materials before audit committee presentation',
    data: { repLetter: repLetterResult, auditCommittee: auditCommitteeResult }
  });

  results.outputs = {
    auditCoordination: yearEndResult,
    adjustments: adjustmentsResult,
    auditCommitteeMaterials: auditCommitteeResult,
    auditYear: inputs.auditYear
  };

  return results;
}

// Task definitions
export const coordinateAuditPlanningTask = defineTask('coordinate-audit-planning', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'external-audit-coordination' },
  agent: {
    name: 'audit-coordinator',
    prompt: {
      system: 'You are a corporate audit coordinator managing the relationship with external auditors.',
      user: `Coordinate external audit planning for audit year ${args.auditYear}.

Audit timeline: ${JSON.stringify(args.auditTimeline)}
Prior year issues: ${JSON.stringify(args.priorYearIssues)}

Planning activities:
1. Pre-Audit Meeting
   - Schedule planning meeting with auditors
   - Discuss scope and timing
   - Review prior year carryover items
   - Identify areas of audit focus

2. Risk Assessment Discussion
   - Share management's risk assessment
   - Discuss significant transactions
   - Identify new accounting standards
   - Review significant estimates

3. Timeline Development
   - Interim audit dates
   - Year-end audit dates
   - Key deliverable dates
   - Reporting deadlines

4. Resource Planning
   - Internal team assignments
   - Auditor team introductions
   - Access and logistics
   - Data room setup

5. Materiality Discussion
   - Understand auditor materiality thresholds
   - Discuss SAM (summary of audit misstatements) threshold
   - Agree on communication protocols

6. Prior Year Follow-up
   - Status of prior year findings
   - Management letter items
   - Process improvements made

Document planning outcomes and commitments.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const developPBCListTask = defineTask('develop-pbc-list', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'external-audit-coordination' },
  agent: {
    name: 'audit-coordinator',
    prompt: {
      system: 'You are an audit coordinator developing comprehensive PBC (Prepared by Client) lists.',
      user: `Develop PBC list for audit year ${args.auditYear}.

Audit plan: ${JSON.stringify(args.auditPlan)}

Develop PBC list including:
1. General Items
   - Organizational charts
   - Board and committee minutes
   - Significant contracts
   - Legal documents

2. Financial Statements
   - Trial balance
   - Financial statements
   - Flux analysis
   - Account reconciliations

3. Revenue
   - Revenue breakdown/disaggregation
   - Significant contracts
   - Cutoff testing support
   - Deferred revenue schedules

4. Expenses
   - Expense analysis
   - Significant vendor contracts
   - Prepaid expense schedules
   - Accrued expense support

5. Balance Sheet
   - Bank reconciliations
   - AR aging and reserves
   - Inventory listings and reserves
   - Fixed asset rollforwards
   - Debt schedules
   - Lease schedules

6. Tax
   - Tax provision workpapers
   - Tax returns filed
   - Uncertain tax positions

7. Estimates
   - Support for significant estimates
   - Methodology documentation
   - Key assumptions

8. Confirmations
   - Bank confirmations
   - AR confirmations
   - Legal confirmations
   - Debt confirmations

For each item:
- Description
- Preparer
- Reviewer
- Due date
- Status tracking

Output comprehensive PBC list with assignments.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const supportInterimAuditTask = defineTask('support-interim-audit', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'external-audit-coordination' },
  agent: {
    name: 'audit-coordinator',
    prompt: {
      system: 'You are an audit coordinator supporting interim audit procedures.',
      user: `Support interim audit procedures.

PBC list: ${JSON.stringify(args.pbcList)}
Audit timeline: ${JSON.stringify(args.auditTimeline)}

Support activities:
1. PBC Delivery
   - Deliver interim PBC items
   - Track delivery status
   - Follow up on outstanding items

2. Walkthrough Support
   - Prepare for process walkthroughs
   - Coordinate with process owners
   - Provide documentation

3. Control Testing Support
   - Provide control evidence
   - Facilitate sample selection
   - Answer auditor questions

4. IT Audit Support
   - Coordinate with IT team
   - Provide system access
   - Support ITGC testing

5. Issue Resolution
   - Track auditor questions
   - Coordinate responses
   - Resolve issues timely

6. Interim Findings
   - Document preliminary findings
   - Discuss potential adjustments
   - Plan remediation if needed

7. Status Reporting
   - Track audit progress
   - Report to management
   - Escalate issues

Document interim audit support activities and status.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const supportYearEndAuditTask = defineTask('support-year-end-audit', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'external-audit-coordination' },
  agent: {
    name: 'audit-coordinator',
    prompt: {
      system: 'You are an audit coordinator supporting year-end audit procedures.',
      user: `Support year-end audit procedures.

Financial statements: ${JSON.stringify(args.financialStatements)}
PBC list: ${JSON.stringify(args.pbcList)}
Interim results: ${JSON.stringify(args.interimResults)}

Support activities:
1. Year-End PBC Delivery
   - Deliver final PBC items
   - Update interim items for year-end
   - Provide final financials

2. Substantive Testing Support
   - Revenue cutoff testing
   - Expense completeness testing
   - Balance verification support

3. Confirmation Process
   - Coordinate confirmation mailings
   - Track confirmation responses
   - Investigate exceptions

4. Inventory Observation
   - Coordinate physical counts
   - Support auditor observations
   - Provide count documentation

5. Subsequent Events
   - Identify subsequent events
   - Provide supporting documentation
   - Discuss disclosure requirements

6. Estimate Support
   - Provide estimate documentation
   - Explain methodology changes
   - Support reasonableness testing

7. Disclosure Review
   - Support disclosure checklist
   - Provide footnote support
   - Answer disclosure questions

8. Audit Differences
   - Track identified differences
   - Evaluate adjustment proposals
   - Discuss uncorrected items

Document year-end audit support and findings.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const processAuditAdjustmentsTask = defineTask('process-audit-adjustments', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'accounting-operations' },
  agent: {
    name: 'controller',
    prompt: {
      system: 'You are a controller evaluating and processing audit adjustments.',
      user: `Process audit adjustments.

Audit findings: ${JSON.stringify(args.auditFindings)}
Financial statements: ${JSON.stringify(args.financialStatements)}

Process:
1. Adjustment Evaluation
   For each proposed adjustment:
   - Understand the issue
   - Evaluate validity
   - Assess materiality
   - Decide record vs. waive

2. Recorded Adjustments
   - Prepare journal entries
   - Obtain approvals
   - Post adjustments
   - Update financials

3. Unrecorded Adjustments (SAM)
   - Document on SAM schedule
   - Assess cumulative effect
   - Management acknowledgment

4. Reclassifications
   - Evaluate proposed reclasses
   - Assess financial statement impact
   - Record as appropriate

5. Disclosure Adjustments
   - Evaluate disclosure changes
   - Update footnotes
   - Ensure completeness

6. Impact Assessment
   - Updated financial statements
   - Impact on key metrics
   - Covenant compliance check
   - Earnings per share impact

7. Documentation
   - Document rationale for each decision
   - Maintain audit trail
   - Support for SAM items

Output adjustment summary and updated financials.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const prepareRepresentationLetterTask = defineTask('prepare-representation-letter', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'external-audit-coordination' },
  agent: {
    name: 'controller',
    prompt: {
      system: 'You are a controller preparing management representation letters for external auditors.',
      user: `Prepare management representation letter for audit year ${args.auditYear}.

Financial statements: ${JSON.stringify(args.financialStatements)}
Audit issues: ${JSON.stringify(args.auditIssues)}

Prepare letter including:
1. Financial Statement Representations
   - Fair presentation
   - Accounting policies
   - Completeness of information

2. Information Provided
   - Access to all records
   - Completeness of minutes
   - All transactions recorded

3. Fraud Representations
   - No known fraud
   - No fraud allegations
   - Risk assessment process

4. Compliance Representations
   - Laws and regulations
   - Contract compliance
   - Government regulations

5. Specific Representations
   - Related party transactions
   - Subsequent events
   - Contingent liabilities
   - Litigation matters
   - Environmental matters

6. Estimates Representations
   - Reasonableness of estimates
   - Methodology appropriateness
   - Key assumptions

7. Uncorrected Misstatements
   - Acknowledgment of SAM items
   - Immaterial assessment

8. Other Required Items
   - Going concern
   - Internal control
   - Illegal acts

Draft letter for CEO/CFO signature.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const prepareAuditCommitteeMaterialsTask = defineTask('prepare-audit-committee-materials', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'executive-reporting' },
  agent: {
    name: 'controller',
    prompt: {
      system: 'You are a controller preparing materials for audit committee meetings.',
      user: `Prepare audit committee materials for audit year ${args.auditYear}.

Audit results: ${JSON.stringify(args.auditResults)}
Adjustments: ${JSON.stringify(args.adjustments)}

Prepare:
1. Executive Summary
   - Audit status overview
   - Key findings summary
   - Significant issues

2. Financial Results Summary
   - Final financial statements
   - Year-over-year comparison
   - Key metric analysis

3. Audit Adjustments
   - Recorded adjustments
   - Unrecorded adjustments (SAM)
   - Impact assessment

4. Auditor Communications
   - Required communications
   - Independence matters
   - Significant accounting policies

5. Internal Control Matters
   - Control deficiencies
   - Significant deficiencies
   - Material weaknesses
   - Remediation status

6. Critical Accounting Estimates
   - Significant estimates
   - Methodology overview
   - Sensitivity analysis

7. New Accounting Standards
   - Standards adopted
   - Impact assessment
   - Future standards

8. Management Letter
   - Auditor observations
   - Management responses
   - Improvement plans

9. Questions for Auditors
   - Private session topics
   - Matters requiring discussion

Format for audit committee presentation.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));
