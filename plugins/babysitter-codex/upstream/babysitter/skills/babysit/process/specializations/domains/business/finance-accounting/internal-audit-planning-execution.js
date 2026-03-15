/**
 * @file internal-audit-planning-execution.js
 * @description Risk-based audit planning, fieldwork execution, findings documentation, and recommendation tracking for continuous improvement
 * @module specializations/domains/business/finance-accounting
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Internal Audit Planning and Execution Process
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.auditArea - Area/process being audited
 * @param {string} inputs.auditPeriod - Period covered by the audit
 * @param {Object} inputs.riskAssessment - Enterprise risk assessment data
 * @param {Object} inputs.priorAuditFindings - Previous audit findings for the area
 * @param {Object} inputs.processDocumentation - Existing process documentation
 * @param {Object} ctx - Process context with task() and breakpoint() methods
 * @returns {Promise<Object>} Completed audit report with findings and recommendations
 */
export async function process(inputs, ctx) {
  const results = {
    steps: [],
    outputs: {}
  };

  // Step 1: Audit Planning and Risk Assessment
  const planningResult = await ctx.task(developAuditPlanTask, {
    auditArea: inputs.auditArea,
    auditPeriod: inputs.auditPeriod,
    riskAssessment: inputs.riskAssessment,
    priorAuditFindings: inputs.priorAuditFindings
  });
  results.steps.push({ name: 'audit-planning', result: planningResult });

  // Step 2: Preliminary Survey and Process Understanding
  const surveyResult = await ctx.task(conductPreliminarySurveyTask, {
    auditArea: inputs.auditArea,
    processDocumentation: inputs.processDocumentation,
    auditPlan: planningResult
  });
  results.steps.push({ name: 'preliminary-survey', result: surveyResult });

  // Breakpoint for audit scope approval
  await ctx.breakpoint('scope-approval', {
    message: 'Review audit scope and approach before beginning fieldwork',
    data: { plan: planningResult, survey: surveyResult }
  });

  // Step 3: Control Identification and Evaluation
  const controlsResult = await ctx.task(evaluateControlsTask, {
    processUnderstanding: surveyResult,
    riskAssessment: inputs.riskAssessment
  });
  results.steps.push({ name: 'control-evaluation', result: controlsResult });

  // Step 4: Test Design and Execution
  const testingResult = await ctx.task(executeAuditTestsTask, {
    controls: controlsResult,
    auditPlan: planningResult,
    auditPeriod: inputs.auditPeriod
  });
  results.steps.push({ name: 'audit-testing', result: testingResult });

  // Breakpoint for testing review
  await ctx.breakpoint('testing-review', {
    message: 'Review testing results and preliminary findings',
    data: testingResult
  });

  // Step 5: Findings Development
  const findingsResult = await ctx.task(developFindingsTask, {
    testingResults: testingResult,
    controlEvaluation: controlsResult
  });
  results.steps.push({ name: 'findings-development', result: findingsResult });

  // Step 6: Management Response and Action Plans
  const responseResult = await ctx.task(obtainManagementResponseTask, {
    findings: findingsResult,
    auditArea: inputs.auditArea
  });
  results.steps.push({ name: 'management-response', result: responseResult });

  // Step 7: Audit Report Preparation
  const reportResult = await ctx.task(prepareAuditReportTask, {
    auditArea: inputs.auditArea,
    auditPeriod: inputs.auditPeriod,
    findings: findingsResult,
    managementResponse: responseResult,
    auditPlan: planningResult
  });
  results.steps.push({ name: 'audit-report', result: reportResult });

  // Breakpoint for report approval
  await ctx.breakpoint('report-approval', {
    message: 'Final review of audit report before issuance',
    data: reportResult
  });

  // Step 8: Follow-up Tracking Setup
  const followUpResult = await ctx.task(setupFollowUpTrackingTask, {
    findings: findingsResult,
    managementResponse: responseResult
  });
  results.steps.push({ name: 'follow-up-setup', result: followUpResult });

  results.outputs = {
    auditReport: reportResult,
    findings: findingsResult,
    actionPlans: responseResult,
    followUpSchedule: followUpResult
  };

  return results;
}

// Task definitions
export const developAuditPlanTask = defineTask('develop-audit-plan', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'internal-audit' },
  agent: {
    name: 'audit-manager',
    prompt: {
      system: 'You are an internal audit manager developing risk-based audit plans following IIA standards.',
      user: `Develop audit plan for ${args.auditArea} covering period ${args.auditPeriod}.

Risk assessment: ${JSON.stringify(args.riskAssessment)}
Prior audit findings: ${JSON.stringify(args.priorAuditFindings)}

Develop:
1. Audit Objectives
   - Primary objectives
   - Secondary objectives
   - Alignment with enterprise risks

2. Scope Definition
   - In-scope processes/controls
   - Out-of-scope items
   - Time period coverage
   - Locations/systems included

3. Risk Assessment
   - Key risks in the area
   - Inherent risk ratings
   - Control risk considerations
   - Overall risk ranking

4. Audit Approach
   - Testing strategy
   - Sampling methodology
   - Data analytics to employ
   - Interviews planned

5. Resource Requirements
   - Team composition
   - Hours by phase
   - Specialized skills needed
   - Technology tools

6. Timeline
   - Planning phase dates
   - Fieldwork dates
   - Reporting dates
   - Key milestones

7. Prior Findings Follow-up
   - Open findings to validate
   - Implementation status check

Document audit plan for approval.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const conductPreliminarySurveyTask = defineTask('preliminary-survey', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'internal-audit' },
  agent: {
    name: 'senior-auditor',
    prompt: {
      system: 'You are a senior internal auditor conducting preliminary survey and process understanding.',
      user: `Conduct preliminary survey for ${args.auditArea} audit.

Process documentation: ${JSON.stringify(args.processDocumentation)}
Audit plan: ${JSON.stringify(args.auditPlan)}

Conduct:
1. Process Understanding
   - Document end-to-end process flow
   - Identify key sub-processes
   - Map systems and data flows
   - Identify process owners

2. Organizational Structure
   - Key personnel and roles
   - Segregation of duties
   - Reporting relationships
   - Decision-making authority

3. Regulatory Environment
   - Applicable regulations
   - Compliance requirements
   - Recent regulatory changes

4. Technology Environment
   - Key systems and applications
   - Interfaces and integrations
   - Access control mechanisms
   - Data sources

5. Key Metrics and KPIs
   - Performance metrics tracked
   - Current performance levels
   - Trends and issues

6. Preliminary Interviews
   - Process owner interviews
   - Key stakeholder discussions
   - Issues and concerns raised

7. Documentation Review
   - Policies and procedures
   - Prior audit reports
   - Regulatory exam results
   - Management reports

Output process understanding memorandum.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const evaluateControlsTask = defineTask('evaluate-controls', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'internal-audit' },
  agent: {
    name: 'senior-auditor',
    prompt: {
      system: 'You are a senior internal auditor evaluating internal controls using COSO framework.',
      user: `Evaluate controls for the audit area.

Process understanding: ${JSON.stringify(args.processUnderstanding)}
Risk assessment: ${JSON.stringify(args.riskAssessment)}

Evaluate:
1. Control Environment
   - Tone at the top
   - Organizational structure
   - Competence and development
   - Accountability

2. Risk Assessment
   - Risk identification processes
   - Risk analysis and prioritization
   - Change management

3. Control Activities
   Identify controls by type:
   - Preventive vs. detective
   - Manual vs. automated
   - Key vs. compensating

   For each key control:
   - Control description
   - Control owner
   - Frequency
   - Evidence of performance
   - Design effectiveness assessment

4. Information and Communication
   - Information quality
   - Internal communication
   - External communication

5. Monitoring Activities
   - Ongoing monitoring
   - Separate evaluations
   - Deficiency reporting

6. Control Matrix
   - Risk to control mapping
   - Control coverage assessment
   - Gap identification

7. Design Effectiveness Conclusion
   - Controls adequately designed
   - Gaps requiring remediation

Output control evaluation and test plan.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const executeAuditTestsTask = defineTask('execute-audit-tests', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'internal-audit' },
  agent: {
    name: 'staff-auditor',
    prompt: {
      system: 'You are a staff auditor executing audit tests and documenting results.',
      user: `Execute audit tests per the audit plan.

Controls to test: ${JSON.stringify(args.controls)}
Audit plan: ${JSON.stringify(args.auditPlan)}
Audit period: ${args.auditPeriod}

Execute:
1. Sample Selection
   - Define population
   - Determine sample size
   - Select samples (random, stratified, judgmental)
   - Document selection methodology

2. Test of Controls
   For each key control:
   - Obtain evidence of control performance
   - Evaluate timeliness
   - Evaluate completeness
   - Evaluate accuracy
   - Document exceptions

3. Substantive Testing
   - Analytical procedures
   - Detail testing
   - Recalculation
   - Confirmation (if applicable)

4. Data Analytics
   - Full population analysis
   - Exception identification
   - Trend analysis
   - Anomaly detection

5. Interview Documentation
   - Walkthrough results
   - Process observation notes
   - Key discussion points

6. Exception Tracking
   - Document each exception
   - Determine root cause
   - Assess severity
   - Determine if control failure or isolated issue

7. Working Paper Documentation
   - Test objective
   - Population and sample
   - Testing procedures
   - Results and conclusion
   - Evidence references

Output test results with exceptions identified.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const developFindingsTask = defineTask('develop-findings', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'internal-audit' },
  agent: {
    name: 'audit-manager',
    prompt: {
      system: 'You are an audit manager developing audit findings following IIA standards.',
      user: `Develop audit findings from test results.

Testing results: ${JSON.stringify(args.testingResults)}
Control evaluation: ${JSON.stringify(args.controlEvaluation)}

For each finding, document:
1. Condition
   - What was found
   - Specific instances/examples
   - Quantification of issue

2. Criteria
   - What should be (policy, regulation, best practice)
   - Source of criteria

3. Cause
   - Root cause analysis
   - Why the condition exists
   - Contributing factors

4. Effect
   - Impact or potential impact
   - Financial exposure
   - Operational impact
   - Compliance/regulatory impact
   - Reputational impact

5. Risk Rating
   - High/Medium/Low
   - Rating criteria applied
   - Justification

6. Recommendation
   - Specific, actionable recommendations
   - Addresses root cause
   - Practical and cost-effective

7. Finding Classification
   - Control design deficiency
   - Control operating deficiency
   - Process improvement opportunity
   - Compliance issue

Prioritize findings by risk and impact.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const obtainManagementResponseTask = defineTask('obtain-management-response', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'internal-audit' },
  agent: {
    name: 'audit-manager',
    prompt: {
      system: 'You are an audit manager facilitating management response and action plan development.',
      user: `Obtain management response for audit findings.

Findings: ${JSON.stringify(args.findings)}
Audit area: ${args.auditArea}

Facilitate:
1. Finding Discussion
   - Present findings to management
   - Discuss and validate facts
   - Consider management perspective
   - Resolve any disagreements

2. Management Response
   For each finding:
   - Agreement/disagreement with finding
   - If disagree, rationale
   - Compensating controls (if applicable)

3. Action Plans
   For each agreed finding:
   - Planned remediation actions
   - Responsible party
   - Target completion date
   - Resources required

4. Risk Acceptance
   - If no action planned
   - Documentation of risk acceptance
   - Appropriate level of approval

5. Response Evaluation
   - Adequacy of planned actions
   - Reasonableness of timeline
   - Appropriateness of ownership

6. Escalation
   - Unresolved disagreements
   - Inadequate responses
   - Excessive risk acceptance

Document all responses and action plans.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const prepareAuditReportTask = defineTask('prepare-audit-report', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'internal-audit' },
  agent: {
    name: 'audit-manager',
    prompt: {
      system: 'You are an audit manager preparing internal audit reports following professional standards.',
      user: `Prepare internal audit report.

Audit area: ${args.auditArea}
Audit period: ${args.auditPeriod}
Findings: ${JSON.stringify(args.findings)}
Management response: ${JSON.stringify(args.managementResponse)}
Audit plan: ${JSON.stringify(args.auditPlan)}

Prepare report including:
1. Executive Summary
   - Audit objectives
   - Overall assessment/rating
   - Key findings summary
   - Critical issues requiring attention

2. Background
   - Process description
   - Organizational context
   - Scope and methodology

3. Detailed Findings
   For each finding:
   - Finding title
   - Risk rating
   - Condition, criteria, cause, effect
   - Recommendation
   - Management response
   - Target date and owner

4. Positive Observations
   - Well-functioning controls
   - Best practices noted
   - Improvements since last audit

5. Prior Audit Follow-up
   - Status of prior findings
   - Validated closures
   - Remaining open items

6. Conclusion
   - Overall opinion
   - Aggregate risk assessment
   - Key themes

7. Appendices
   - Testing summary
   - Detailed population/sample data
   - Supporting schedules

Format per department standards.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const setupFollowUpTrackingTask = defineTask('setup-follow-up-tracking', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'internal-audit' },
  agent: {
    name: 'audit-coordinator',
    prompt: {
      system: 'You are an audit coordinator setting up finding follow-up and tracking processes.',
      user: `Set up follow-up tracking for audit findings.

Findings: ${JSON.stringify(args.findings)}
Management response: ${JSON.stringify(args.managementResponse)}

Establish:
1. Tracking Database Entry
   For each finding:
   - Finding ID
   - Finding title
   - Risk rating
   - Owner
   - Target date
   - Status

2. Follow-up Schedule
   - Initial follow-up dates
   - Periodic status check dates
   - Final validation dates
   - Based on risk rating and timeline

3. Monitoring Protocol
   - Status update requirements
   - Evidence requirements
   - Escalation triggers
   - Overdue notification process

4. Validation Requirements
   - Evidence needed for closure
   - Testing to validate remediation
   - Sign-off requirements

5. Reporting
   - Dashboard metrics
   - Aging analysis
   - Status reports to audit committee
   - Overdue findings report

6. Reminder Notifications
   - Owner reminders
   - Manager escalations
   - Executive notifications

Output tracking setup and follow-up calendar.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));
