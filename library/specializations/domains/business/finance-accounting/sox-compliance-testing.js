/**
 * @file sox-compliance-testing.js
 * @description Sarbanes-Oxley Section 404 compliance including control documentation, testing, deficiency remediation, and management certification
 * @module specializations/domains/business/finance-accounting
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * SOX Compliance and Testing Process
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.fiscalYear - Fiscal year for SOX compliance
 * @param {Object} inputs.controlFramework - Control framework and documentation
 * @param {Object} inputs.priorYearResults - Prior year testing results
 * @param {Array} inputs.significantAccounts - Significant accounts and disclosures
 * @param {Object} inputs.itEnvironment - IT general controls environment
 * @param {Object} ctx - Process context with task() and breakpoint() methods
 * @returns {Promise<Object>} SOX compliance package with management certification
 */
export async function process(inputs, ctx) {
  const results = {
    steps: [],
    outputs: {}
  };

  // Step 1: Scoping and Risk Assessment
  const scopingResult = await ctx.task(performScopingTask, {
    fiscalYear: inputs.fiscalYear,
    significantAccounts: inputs.significantAccounts,
    priorYearResults: inputs.priorYearResults
  });
  results.steps.push({ name: 'scoping', result: scopingResult });

  // Step 2: Control Documentation and Walkthroughs
  const documentationResult = await ctx.task(documentControlsTask, {
    controlFramework: inputs.controlFramework,
    scopingResults: scopingResult
  });
  results.steps.push({ name: 'control-documentation', result: documentationResult });

  // Breakpoint for documentation review
  await ctx.breakpoint('documentation-review', {
    message: 'Review control documentation and risk assessment before testing',
    data: { scoping: scopingResult, documentation: documentationResult }
  });

  // Step 3: IT General Controls Testing
  const itgcResult = await ctx.task(testITGCTask, {
    itEnvironment: inputs.itEnvironment,
    scopingResults: scopingResult
  });
  results.steps.push({ name: 'itgc-testing', result: itgcResult });

  // Step 4: Business Process Controls Testing
  const processControlsResult = await ctx.task(testProcessControlsTask, {
    controlDocumentation: documentationResult,
    scopingResults: scopingResult,
    fiscalYear: inputs.fiscalYear
  });
  results.steps.push({ name: 'process-controls-testing', result: processControlsResult });

  // Breakpoint for testing review
  await ctx.breakpoint('testing-review', {
    message: 'Review testing results and identify potential deficiencies',
    data: { itgc: itgcResult, processControls: processControlsResult }
  });

  // Step 5: Deficiency Evaluation
  const deficiencyResult = await ctx.task(evaluateDeficienciesTask, {
    itgcResults: itgcResult,
    processControlsResults: processControlsResult,
    significantAccounts: inputs.significantAccounts
  });
  results.steps.push({ name: 'deficiency-evaluation', result: deficiencyResult });

  // Step 6: Remediation Tracking
  const remediationResult = await ctx.task(trackRemediationTask, {
    deficiencies: deficiencyResult,
    fiscalYear: inputs.fiscalYear
  });
  results.steps.push({ name: 'remediation-tracking', result: remediationResult });

  // Step 7: Roll-Forward Testing
  const rollForwardResult = await ctx.task(performRollForwardTestingTask, {
    processControlsResults: processControlsResult,
    remediationResults: remediationResult,
    fiscalYear: inputs.fiscalYear
  });
  results.steps.push({ name: 'roll-forward-testing', result: rollForwardResult });

  // Step 8: Management Assessment and Certification
  const certificationResult = await ctx.task(prepareManagementCertificationTask, {
    allTestingResults: {
      itgc: itgcResult,
      processControls: processControlsResult,
      rollForward: rollForwardResult
    },
    deficiencies: deficiencyResult,
    remediation: remediationResult,
    fiscalYear: inputs.fiscalYear
  });
  results.steps.push({ name: 'management-certification', result: certificationResult });

  results.outputs = {
    soxAssessment: certificationResult,
    testingResults: { itgc: itgcResult, processControls: processControlsResult },
    deficiencies: deficiencyResult,
    fiscalYear: inputs.fiscalYear
  };

  return results;
}

// Task definitions
export const performScopingTask = defineTask('perform-sox-scoping', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'sox-compliance' },
  agent: {
    name: 'sox-manager',
    prompt: {
      system: 'You are a SOX compliance manager performing risk-based scoping for Section 404 compliance.',
      user: `Perform SOX scoping for fiscal year ${args.fiscalYear}.

Significant accounts: ${JSON.stringify(args.significantAccounts)}
Prior year results: ${JSON.stringify(args.priorYearResults)}

Scoping activities:
1. Entity-Level Assessment
   - Identify entities in scope
   - Materiality thresholds
   - Consolidation considerations

2. Significant Accounts and Disclosures
   - Identify significant accounts using materiality
   - Consider qualitative factors
   - Financial statement assertions at risk

3. Business Process Mapping
   - Map processes to significant accounts
   - Identify relevant assertions
   - Document process boundaries

4. Location Scoping
   - Identify significant locations
   - Apply coverage requirements
   - Document scoping rationale

5. Risk Assessment
   - Inherent risk by account/assertion
   - Fraud risk considerations
   - Management override risks

6. IT Scoping
   - Financially significant applications
   - Supporting infrastructure
   - IT dependencies

7. Prior Year Considerations
   - Changes from prior year
   - Prior deficiencies impact
   - Remediation status

Document scoping conclusions and in-scope items.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const documentControlsTask = defineTask('document-controls', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'sox-compliance' },
  agent: {
    name: 'sox-analyst',
    prompt: {
      system: 'You are a SOX analyst documenting controls and performing walkthroughs.',
      user: `Document controls and perform walkthroughs.

Control framework: ${JSON.stringify(args.controlFramework)}
Scoping results: ${JSON.stringify(args.scopingResults)}

Document:
1. Process Narratives
   - End-to-end process flow
   - Key activities and handoffs
   - Systems involved
   - Documents/reports used

2. Risk and Control Matrix (RCM)
   For each process:
   - What can go wrong (WCGW)
   - Relevant assertion
   - Key control(s) addressing risk
   - Control attributes

3. Control Documentation
   For each key control:
   - Control ID
   - Control description
   - Control owner
   - Frequency
   - Nature (preventive/detective)
   - Type (manual/automated/IT-dependent)
   - Evidence of performance
   - Precision level

4. Walkthroughs
   - Select transactions for walkthrough
   - Trace through entire process
   - Verify control performance
   - Identify any gaps

5. Design Effectiveness Assessment
   - Control addresses the risk
   - Control operating as designed
   - No gaps in control coverage

6. IPE (Information Produced by Entity)
   - Identify reports used in controls
   - Document IPE attributes
   - Plan IPE testing

Output complete control documentation package.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const testITGCTask = defineTask('test-itgc', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'it-audit' },
  agent: {
    name: 'it-auditor',
    prompt: {
      system: 'You are an IT auditor testing IT general controls for SOX compliance.',
      user: `Test IT general controls.

IT environment: ${JSON.stringify(args.itEnvironment)}
Scoping results: ${JSON.stringify(args.scopingResults)}

Test ITGC domains:
1. Access to Programs and Data
   - User access provisioning
   - User access termination
   - Privileged access management
   - Periodic access reviews
   - Password controls

2. Program Changes
   - Change request and approval
   - Development and testing
   - Migration to production
   - Emergency changes
   - Segregation of duties

3. Program Development
   - SDLC methodology
   - Requirements and design approval
   - Testing and acceptance
   - Implementation controls

4. Computer Operations
   - Job scheduling
   - Batch processing monitoring
   - Data backup and recovery
   - Incident management

For each control:
- Select sample period/transactions
- Obtain evidence
- Evaluate operating effectiveness
- Document exceptions
- Assess impact on application controls

Output ITGC testing results.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const testProcessControlsTask = defineTask('test-process-controls', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'sox-compliance' },
  agent: {
    name: 'sox-analyst',
    prompt: {
      system: 'You are a SOX analyst testing business process controls.',
      user: `Test business process controls for fiscal year ${args.fiscalYear}.

Control documentation: ${JSON.stringify(args.controlDocumentation)}
Scoping results: ${JSON.stringify(args.scopingResults)}

Testing approach:
1. Sample Size Determination
   Based on control frequency:
   - Annual: 1 sample
   - Quarterly: 2 samples
   - Monthly: 2-5 samples
   - Weekly: 5-15 samples
   - Daily: 20-40 samples
   - Multiple times daily: 25-60 samples

2. Sample Selection
   - Random selection from population
   - Spread across testing period
   - Document selection method

3. Test of Design
   - Control addresses identified risk
   - Control attributes are appropriate
   - Control precision is adequate

4. Test of Operating Effectiveness
   For each sample:
   - Obtain evidence of control operation
   - Verify timeliness
   - Verify completeness
   - Verify accuracy
   - Verify authorization
   - Document results

5. IPE Testing
   - Verify completeness of reports
   - Verify accuracy of reports
   - Test source system reliability

6. Management Review Controls
   - Evidence of review
   - Evidence of investigation/follow-up
   - Documentation of conclusions

7. Automated Controls
   - One-time test if ITGCs effective
   - Test application configuration
   - Verify no changes during period

Document all testing with conclusions.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const evaluateDeficienciesTask = defineTask('evaluate-deficiencies', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'sox-compliance' },
  agent: {
    name: 'sox-manager',
    prompt: {
      system: 'You are a SOX manager evaluating control deficiencies for severity classification.',
      user: `Evaluate control deficiencies.

ITGC results: ${JSON.stringify(args.itgcResults)}
Process controls results: ${JSON.stringify(args.processControlsResults)}
Significant accounts: ${JSON.stringify(args.significantAccounts)}

Evaluate:
1. Identify Deficiencies
   - Control design deficiencies
   - Control operating deficiencies
   - Combine related deficiencies

2. Severity Assessment
   For each deficiency:

   Likelihood Assessment:
   - Reasonably possible vs. remote
   - Consider compensating controls

   Magnitude Assessment:
   - Accounts and assertions affected
   - Potential misstatement amount
   - Compare to materiality thresholds

3. Classification
   - Control Deficiency: Not material weakness or significant deficiency
   - Significant Deficiency: Less than material weakness but important
   - Material Weakness: Reasonable possibility of material misstatement

4. Aggregation
   - Combine related deficiencies
   - Consider pervasive effects
   - ITGC impact on application controls

5. Documentation
   For each deficiency:
   - Deficiency description
   - Root cause
   - Affected controls/accounts/assertions
   - Compensating controls (if any)
   - Severity classification
   - Supporting rationale

Output deficiency evaluation with classifications.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const trackRemediationTask = defineTask('track-remediation', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'sox-compliance' },
  agent: {
    name: 'sox-coordinator',
    prompt: {
      system: 'You are a SOX coordinator tracking remediation of control deficiencies.',
      user: `Track remediation of deficiencies for fiscal year ${args.fiscalYear}.

Deficiencies: ${JSON.stringify(args.deficiencies)}

Track:
1. Remediation Plans
   For each deficiency:
   - Remediation action steps
   - Responsible party
   - Target completion date
   - Resources required

2. Status Monitoring
   - Track progress against plan
   - Identify delays or obstacles
   - Escalate as needed

3. Evidence Collection
   - Documentation of changes made
   - Updated control documentation
   - Test results of remediated controls

4. Validation Testing
   - Test remediated control design
   - Test remediated control operation
   - Sufficient sample for effectiveness

5. Timing Considerations
   - Year-end testing requirements
   - Time for sustained operation
   - Impact on management assessment

6. Compensating Controls
   - If remediation not complete by year-end
   - Identify compensating controls
   - Test compensating controls

7. Disclosure Requirements
   - Material weakness disclosure
   - Remediation status disclosure
   - Management assessment impact

Output remediation tracking status and validation results.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const performRollForwardTestingTask = defineTask('roll-forward-testing', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'sox-compliance' },
  agent: {
    name: 'sox-analyst',
    prompt: {
      system: 'You are a SOX analyst performing roll-forward testing to year-end.',
      user: `Perform roll-forward testing for fiscal year ${args.fiscalYear}.

Interim testing results: ${JSON.stringify(args.processControlsResults)}
Remediation results: ${JSON.stringify(args.remediationResults)}

Roll-forward activities:
1. Inquiry and Observation
   - Inquire about changes since interim testing
   - Observe control environment
   - Review management representations

2. Additional Testing
   - Test controls from interim to year-end
   - Apply reduced sample sizes
   - Focus on higher risk areas

3. Change Assessment
   - Identify any control changes
   - Assess impact of changes
   - Test changed controls

4. Remediation Validation
   - Test remediated controls post-implementation
   - Verify sustained operation
   - Document effectiveness

5. Year-End Procedures
   - Test as-of-date controls
   - Period-end closing controls
   - Financial statement preparation controls

6. Update Conclusions
   - Combine interim and roll-forward results
   - Update deficiency assessments
   - Finalize control conclusions

Document roll-forward testing results.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const prepareManagementCertificationTask = defineTask('management-certification', (args, taskCtx) => ({
  kind: 'agent',
  skill: { name: 'sox-compliance' },
  agent: {
    name: 'sox-director',
    prompt: {
      system: 'You are a SOX director preparing management assessment and certification under Section 404.',
      user: `Prepare management assessment and certification for fiscal year ${args.fiscalYear}.

Testing results: ${JSON.stringify(args.allTestingResults)}
Deficiencies: ${JSON.stringify(args.deficiencies)}
Remediation: ${JSON.stringify(args.remediation)}

Prepare:
1. Management Assessment Report
   - Statement of management responsibility
   - Framework used (COSO)
   - Scope of assessment
   - Assessment date

2. Effectiveness Conclusion
   - ICFR effectiveness opinion
   - Material weakness identification
   - Impact of material weaknesses

3. Supporting Documentation
   - Summary of testing performed
   - Coverage of significant accounts
   - Sample sizes and methodology
   - Results summary

4. Deficiency Summary
   - List of deficiencies by classification
   - Remediation status
   - Year-over-year comparison

5. CEO/CFO Certifications
   - Section 302 certification content
   - Section 906 certification content
   - Disclosure controls certification

6. Audit Committee Communication
   - Summary of findings
   - Material weaknesses (if any)
   - Significant deficiencies
   - Remediation plans

7. External Auditor Coordination
   - Testing reliance discussions
   - Deficiency classification alignment
   - Audit report implications

Output management assessment and certification package.`
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));
