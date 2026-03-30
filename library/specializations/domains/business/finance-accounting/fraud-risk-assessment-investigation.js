/**
 * @file fraud-risk-assessment-investigation.js
 * @description Identifying fraud risk factors, implementing anti-fraud controls, and conducting investigations when fraud indicators are detected
 * @module specializations/domains/business/finance-accounting
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Fraud Risk Assessment and Investigation Process
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.assessmentPeriod - Period for fraud risk assessment
 * @param {Object} inputs.organizationProfile - Organization structure and operations
 * @param {Object} inputs.controlEnvironment - Existing control environment
 * @param {Object} inputs.fraudIndicators - Any fraud indicators or allegations (if investigation)
 * @param {Object} ctx - Process context with task() and breakpoint() methods
 * @returns {Promise<Object>} Fraud risk assessment or investigation results
 */
export async function process(inputs, ctx) {
  const results = {
    steps: [],
    outputs: {}
  };

  // Step 1: Fraud Risk Identification
  const identificationResult = await ctx.task(identifyFraudRisksTask, {
    organizationProfile: inputs.organizationProfile,
    controlEnvironment: inputs.controlEnvironment,
    assessmentPeriod: inputs.assessmentPeriod
  });
  results.steps.push({ name: 'risk-identification', result: identificationResult });

  // Step 2: Fraud Risk Assessment
  const assessmentResult = await ctx.task(assessFraudRisksTask, {
    identifiedRisks: identificationResult,
    controlEnvironment: inputs.controlEnvironment
  });
  results.steps.push({ name: 'risk-assessment', result: assessmentResult });

  // Breakpoint for risk assessment review
  await ctx.breakpoint('assessment-review', {
    message: 'Review fraud risk assessment before developing anti-fraud controls',
    data: assessmentResult
  });

  // Step 3: Anti-Fraud Control Evaluation
  const controlEvalResult = await ctx.task(evaluateAntiFraudControlsTask, {
    fraudRisks: assessmentResult,
    controlEnvironment: inputs.controlEnvironment
  });
  results.steps.push({ name: 'control-evaluation', result: controlEvalResult });

  // Step 4: Anti-Fraud Program Development
  const programResult = await ctx.task(developAntiFraudProgramTask, {
    riskAssessment: assessmentResult,
    controlGaps: controlEvalResult
  });
  results.steps.push({ name: 'anti-fraud-program', result: programResult });

  // Check if investigation is needed
  if (inputs.fraudIndicators && Object.keys(inputs.fraudIndicators).length > 0) {
    // Step 5: Investigation Planning
    const investigationPlanResult = await ctx.task(planInvestigationTask, {
      fraudIndicators: inputs.fraudIndicators,
      organizationProfile: inputs.organizationProfile
    });
    results.steps.push({ name: 'investigation-planning', result: investigationPlanResult });

    // Breakpoint for investigation approval
    await ctx.breakpoint('investigation-approval', {
      message: 'Review investigation plan and obtain authorization before proceeding',
      data: investigationPlanResult
    });

    // Step 6: Investigation Execution
    const investigationResult = await ctx.task(executeInvestigationTask, {
      investigationPlan: investigationPlanResult,
      fraudIndicators: inputs.fraudIndicators
    });
    results.steps.push({ name: 'investigation-execution', result: investigationResult });

    // Step 7: Investigation Reporting
    const reportResult = await ctx.task(prepareInvestigationReportTask, {
      investigationResults: investigationResult,
      fraudIndicators: inputs.fraudIndicators
    });
    results.steps.push({ name: 'investigation-report', result: reportResult });

    results.outputs.investigationReport = reportResult;
  }

  // Step 8: Monitoring and Continuous Improvement
  const monitoringResult = await ctx.task(establishMonitoringTask, {
    fraudRisks: assessmentResult,
    antiFraudProgram: programResult
  });
  results.steps.push({ name: 'monitoring-setup', result: monitoringResult });

  results.outputs = {
    ...results.outputs,
    fraudRiskAssessment: assessmentResult,
    antiFraudProgram: programResult,
    monitoringPlan: monitoringResult
  };

  return results;
}

// Task definitions
export const identifyFraudRisksTask = defineTask('identify-fraud-risks', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'fraud-examination' },
  agent: {
    name: 'fraud-examiner',
    prompt: {
      system: 'You are a Certified Fraud Examiner identifying fraud risks using the ACFE fraud tree framework.',
      user: `Identify fraud risks for the organization.

Organization profile: ${JSON.stringify(args.organizationProfile)}
Control environment: ${JSON.stringify(args.controlEnvironment)}
Assessment period: ${args.assessmentPeriod}

Identify risks in fraud categories:
1. Asset Misappropriation
   - Cash theft (skimming, larceny, fraudulent disbursements)
   - Inventory and asset theft
   - Fraudulent expense reimbursements
   - Payroll fraud
   - Check tampering
   - Billing schemes

2. Corruption
   - Bribery and kickbacks
   - Conflicts of interest
   - Illegal gratuities
   - Economic extortion

3. Financial Statement Fraud
   - Revenue manipulation
   - Expense manipulation
   - Asset overstatement
   - Liability understatement
   - Improper disclosures

4. Fraud Triangle Analysis
   For each identified risk:
   - Pressure/Incentive factors
   - Opportunity factors
   - Rationalization factors

5. Risk Indicators
   - Industry-specific risks
   - Organization-specific risks
   - Economic environment risks
   - Technology risks

Document all identified fraud risks with risk factors.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const assessFraudRisksTask = defineTask('assess-fraud-risks', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'fraud-examination' },
  agent: {
    name: 'fraud-examiner',
    prompt: {
      system: 'You are a Certified Fraud Examiner assessing and prioritizing fraud risks.',
      user: `Assess and prioritize identified fraud risks.

Identified risks: ${JSON.stringify(args.identifiedRisks)}
Control environment: ${JSON.stringify(args.controlEnvironment)}

Assess each risk:
1. Likelihood Assessment
   - Historical fraud occurrence
   - Industry prevalence
   - Control strength
   - Vulnerability factors
   Rating: High/Medium/Low

2. Impact Assessment
   - Financial impact
   - Reputational impact
   - Regulatory impact
   - Operational impact
   Rating: High/Medium/Low

3. Control Effectiveness
   - Existing controls
   - Control reliability
   - Monitoring effectiveness
   Rating: Strong/Moderate/Weak

4. Residual Risk Rating
   - Combine likelihood and impact
   - Consider control effectiveness
   - Overall risk rating

5. Risk Prioritization
   - Rank risks by severity
   - Identify top fraud risks
   - Focus areas for mitigation

6. Risk Heat Map
   - Plot risks on likelihood/impact grid
   - Identify risk clusters
   - Highlight critical risks

Output prioritized fraud risk assessment.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const evaluateAntiFraudControlsTask = defineTask('evaluate-antifraud-controls', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'fraud-examination' },
  agent: {
    name: 'fraud-examiner',
    prompt: {
      system: 'You are a Certified Fraud Examiner evaluating anti-fraud controls.',
      user: `Evaluate existing anti-fraud controls.

Fraud risks: ${JSON.stringify(args.fraudRisks)}
Control environment: ${JSON.stringify(args.controlEnvironment)}

Evaluate:
1. Preventive Controls
   - Segregation of duties
   - Authorization limits
   - Physical safeguards
   - Access controls
   - Background checks
   - Vendor controls

2. Detective Controls
   - Management review
   - Reconciliations
   - Data analytics
   - Exception reporting
   - Hotline/whistleblower
   - Surprise audits

3. Control Environment
   - Tone at the top
   - Code of conduct
   - Anti-fraud policy
   - Training and awareness
   - Reporting mechanisms

4. Gap Analysis
   For each fraud risk:
   - Existing controls
   - Control adequacy
   - Identified gaps
   - Compensating controls needed

5. Control Testing
   - Key controls to test
   - Testing approach
   - Sample considerations

6. Recommendations
   - Control improvements needed
   - Priority of enhancements
   - Cost-benefit considerations

Output control evaluation and gap analysis.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const developAntiFraudProgramTask = defineTask('develop-antifraud-program', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'fraud-examination' },
  agent: {
    name: 'fraud-program-manager',
    prompt: {
      system: 'You are a fraud program manager developing comprehensive anti-fraud programs.',
      user: `Develop anti-fraud program based on assessment.

Risk assessment: ${JSON.stringify(args.riskAssessment)}
Control gaps: ${JSON.stringify(args.controlGaps)}

Develop program components:
1. Governance
   - Anti-fraud policy
   - Roles and responsibilities
   - Board/audit committee oversight
   - Fraud risk ownership

2. Risk Assessment Process
   - Annual fraud risk assessment
   - Continuous monitoring triggers
   - Update procedures

3. Control Activities
   - New controls to implement
   - Control enhancements
   - Technology solutions
   - Process improvements

4. Detection Mechanisms
   - Data analytics program
   - Continuous monitoring
   - Hotline management
   - Surprise audit program

5. Investigation Protocol
   - Investigation triggers
   - Investigation procedures
   - Evidence preservation
   - Reporting requirements

6. Training and Awareness
   - Employee training program
   - Management training
   - Awareness communications
   - Code of conduct acknowledgment

7. Response Plan
   - Incident response procedures
   - Legal and HR coordination
   - Recovery procedures
   - Lessons learned process

Output comprehensive anti-fraud program plan.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const planInvestigationTask = defineTask('plan-investigation', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'fraud-investigation' },
  agent: {
    name: 'lead-investigator',
    prompt: {
      system: 'You are a lead fraud investigator planning fraud investigations following professional standards.',
      user: `Plan fraud investigation based on indicators.

Fraud indicators: ${JSON.stringify(args.fraudIndicators)}
Organization profile: ${JSON.stringify(args.organizationProfile)}

Develop investigation plan:
1. Initial Assessment
   - Nature of allegation
   - Potential fraud scheme
   - Preliminary scope
   - Initial response actions

2. Investigation Team
   - Team composition
   - Expertise needed
   - External resources (legal, forensic)
   - Confidentiality requirements

3. Legal Considerations
   - Attorney-client privilege
   - Work product doctrine
   - Employment law issues
   - Regulatory notification requirements

4. Scope Definition
   - Time period
   - Transactions/accounts
   - Personnel involved
   - Systems and data

5. Investigation Procedures
   - Document collection
   - Data preservation
   - Interview plan
   - Forensic analysis

6. Evidence Handling
   - Chain of custody
   - Digital forensics
   - Physical evidence
   - Documentation standards

7. Timeline
   - Key milestones
   - Interim reporting
   - Target completion

8. Budget and Resources
   - Investigation budget
   - Resource allocation
   - External costs

Document investigation plan for authorization.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const executeInvestigationTask = defineTask('execute-investigation', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'fraud-investigation' },
  agent: {
    name: 'fraud-investigator',
    prompt: {
      system: 'You are a fraud investigator executing fraud investigations following professional standards.',
      user: `Execute fraud investigation per the plan.

Investigation plan: ${JSON.stringify(args.investigationPlan)}
Fraud indicators: ${JSON.stringify(args.fraudIndicators)}

Execute investigation steps:
1. Evidence Collection
   - Secure relevant documents
   - Preserve electronic data
   - Image systems if needed
   - Maintain chain of custody

2. Data Analysis
   - Transaction analysis
   - Pattern identification
   - Timeline reconstruction
   - Financial reconciliation

3. Interviews
   - Witness interviews
   - Subject interviews (if appropriate)
   - Interview documentation
   - Corroboration of statements

4. Forensic Accounting
   - Follow the money
   - Tracing analysis
   - Net worth analysis
   - Bank record analysis

5. Finding Development
   - Establish facts
   - Document evidence
   - Identify perpetrators
   - Quantify loss

6. Status Reporting
   - Regular status updates
   - Preliminary findings
   - Scope adjustments
   - Issue escalation

7. Documentation
   - Investigation workpapers
   - Evidence inventory
   - Interview notes
   - Analysis schedules

Document investigation findings and evidence.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const prepareInvestigationReportTask = defineTask('prepare-investigation-report', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'fraud-investigation' },
  agent: {
    name: 'lead-investigator',
    prompt: {
      system: 'You are a lead investigator preparing fraud investigation reports.',
      user: `Prepare investigation report.

Investigation results: ${JSON.stringify(args.investigationResults)}
Fraud indicators: ${JSON.stringify(args.fraudIndicators)}

Prepare report including:
1. Executive Summary
   - Investigation overview
   - Key findings
   - Conclusions
   - Recommendations

2. Background
   - How fraud came to attention
   - Initial response actions
   - Investigation scope

3. Investigation Methodology
   - Procedures performed
   - Data sources reviewed
   - Interviews conducted
   - Analysis performed

4. Findings
   - Factual findings
   - Evidence supporting findings
   - Timeline of events
   - Individuals involved
   - Loss quantification

5. Conclusions
   - Whether fraud occurred
   - Nature of fraud scheme
   - Root causes
   - Control failures

6. Recommendations
   - Disciplinary actions
   - Recovery actions
   - Control improvements
   - Legal/regulatory actions
   - Insurance claims

7. Appendices
   - Detailed evidence list
   - Timeline
   - Organization chart
   - Supporting schedules

Maintain appropriate privilege designations.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const establishMonitoringTask = defineTask('establish-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'fraud-examination' },
  agent: {
    name: 'fraud-program-manager',
    prompt: {
      system: 'You are a fraud program manager establishing ongoing fraud monitoring.',
      user: `Establish fraud monitoring program.

Fraud risks: ${JSON.stringify(args.fraudRisks)}
Anti-fraud program: ${JSON.stringify(args.antiFraudProgram)}

Establish monitoring:
1. Continuous Monitoring
   - Data analytics rules
   - Exception thresholds
   - Alert generation
   - Review procedures

2. Key Fraud Indicators
   - Red flags to monitor
   - Behavioral indicators
   - Transaction patterns
   - Data anomalies

3. Monitoring Tools
   - Technology solutions
   - Analytics platforms
   - Reporting dashboards
   - Alert management

4. Review and Response
   - Alert review process
   - Investigation triggers
   - Escalation procedures
   - Documentation requirements

5. Program Metrics
   - Number of alerts
   - Investigation outcomes
   - Loss prevention
   - Program effectiveness

6. Periodic Assessment
   - Annual risk reassessment
   - Control testing
   - Program evaluation
   - Continuous improvement

7. Reporting
   - Management reporting
   - Board/audit committee reporting
   - Regulatory reporting (if required)

Output monitoring program design and metrics.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));
