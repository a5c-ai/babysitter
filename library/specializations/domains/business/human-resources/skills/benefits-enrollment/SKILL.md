---
name: benefits-enrollment
description: Manage benefits enrollment and administration workflows including elections, life events, open enrollment, and compliance tracking
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Edit
  - Bash
metadata:
  specialization: human-resources
  domain: business
  category: Compensation & Benefits
  skill-id: SK-015
---

# Benefits Enrollment Skill

## Overview

The Benefits Enrollment skill provides comprehensive capabilities for managing employee benefits enrollment and administration workflows. This skill supports the full benefits lifecycle from new hire enrollment through termination, including open enrollment periods, qualifying life events, and ongoing benefits administration with full regulatory compliance.

## Capabilities

### Core Functions

1. **Generate Benefits Election Forms and Guides**
   - Create comprehensive benefits election forms
   - Generate plan comparison guides and summaries
   - Build decision support tools and calculators
   - Produce benefits orientation materials
   - Create employee benefits handbooks

2. **Calculate Benefit Costs and Employee Contributions**
   - Model total compensation with benefits value
   - Calculate employee premium contributions
   - Determine employer subsidy amounts
   - Project annual benefits costs
   - Generate cost comparison analyses

3. **Process Life Event Changes**
   - Validate qualifying life events (QLE)
   - Process mid-year election changes
   - Calculate effective dates and deadlines
   - Generate required documentation
   - Track life event processing status

4. **Create Open Enrollment Communications**
   - Develop open enrollment announcements
   - Create benefits fair materials
   - Generate reminder sequences
   - Build FAQ documents
   - Produce manager toolkits

5. **Track Enrollment Completion and Deadlines**
   - Monitor enrollment progress by population
   - Send reminder notifications
   - Escalate non-completions
   - Generate enrollment status reports
   - Track default elections

6. **Generate Benefits Utilization Reports**
   - Analyze plan participation rates
   - Track healthcare utilization trends
   - Monitor voluntary benefit adoption
   - Calculate per-employee costs
   - Benchmark against industry data

7. **Validate Benefits Compliance (ACA, ERISA)**
   - Track ACA affordability requirements
   - Monitor ERISA disclosure deadlines
   - Validate COBRA administration
   - Ensure HIPAA compliance
   - Document Medicare coordination

## Usage

### New Hire Benefits Enrollment

```
Input:
- Employee demographic information
- Hire date and benefits eligibility date
- Dependent information
- Available benefit plans
- Enrollment deadline

Output:
- Personalized enrollment guide
- Benefits election form
- Cost calculator by plan option
- Enrollment confirmation document
- Welcome to benefits materials
```

### Qualifying Life Event Processing

```
Input:
- Life event type and date
- Supporting documentation
- Current benefits elections
- Affected dependents
- Change request details

Output:
- QLE validation determination
- Deadline calculation
- Change authorization form
- Updated benefits summary
- Carrier notification documents
```

### Open Enrollment Administration

```
Input:
- Plan changes for new year
- Enrollment period dates
- Employee population data
- Communication timeline
- Decision support requirements

Output:
- Open enrollment communication plan
- Plan comparison materials
- Enrollment tracking dashboard
- Reminder schedule
- Completion reports
```

## Integration Points

### Process Integration
- Benefits Administration and Enrollment
- Employee Onboarding Program
- Employee Exit and Offboarding
- Compensation Planning

### Related Skills
- SK-004: Onboarding Workflow
- SK-017: Exit Interview Analysis
- SK-022: Employment Law Compliance

### Related Agents
- AG-006: Total Rewards Strategist
- AG-012: Employment Law Advisor

### System Integrations
- Benefits Administration Systems (Benefitfocus, bswift)
- HRIS Platforms (Workday, SAP SuccessFactors)
- Payroll Systems
- Insurance Carriers
- HSA/FSA Administrators
- 401(k) Recordkeepers

## Templates

### Benefits Election Form Structure

```
Employee Information:
- Name and Employee ID
- Date of Hire / Benefits Effective Date
- Current Address
- Dependent Information

Medical Insurance:
- [ ] Waive Coverage
- [ ] Employee Only
- [ ] Employee + Spouse
- [ ] Employee + Child(ren)
- [ ] Employee + Family

Plan Selection:
- [ ] PPO Plan - $XXX/month
- [ ] HDHP Plan - $XXX/month
- [ ] HMO Plan - $XXX/month

Dental Insurance:
- [ ] Waive Coverage
- [ ] Employee Only: $XX/month
- [ ] Employee + Family: $XX/month

Vision Insurance:
- [ ] Waive Coverage
- [ ] Employee Only: $XX/month
- [ ] Employee + Family: $XX/month

Life Insurance:
- Basic Life: [Company Provided]
- Supplemental Life: ___x salary

Flexible Spending Accounts:
- Healthcare FSA: $______/year
- Dependent Care FSA: $______/year

Health Savings Account:
- HSA Contribution: $______/year

401(k) Retirement:
- Contribution Rate: ____%
- [ ] Pre-tax  [ ] Roth

Acknowledgment and Signature:
- Employee Signature
- Date
```

### Qualifying Life Events Reference

```
| Life Event | Documentation Required | Change Window |
|------------|----------------------|---------------|
| Marriage | Marriage certificate | 30 days |
| Birth/Adoption | Birth certificate/Adoption papers | 30 days |
| Divorce | Divorce decree | 30 days |
| Death of dependent | Death certificate | 30 days |
| Loss of other coverage | Loss of coverage letter | 30 days |
| Gain of other coverage | Coverage documentation | 30 days |
| Change in dependent status | Supporting documentation | 30 days |
| Change in residence | Address change verification | 30 days |
| Medicare eligibility | Medicare card | 30 days |
```

### Open Enrollment Timeline

```
Week -6: Finalize plan designs and rates
Week -5: Prepare communication materials
Week -4: Manager preview and training
Week -3: Employee announcement and kickoff
Week -2: Benefits fair / information sessions
Week -1: Final reminder communications
Week 0: Enrollment deadline
Week +1: Confirmation statements
Week +2: Carrier feeds and reconciliation
Week +3: Payroll deduction implementation
```

## Best Practices

1. **Communication Strategy**
   - Start communications early (6+ weeks before enrollment)
   - Use multiple channels (email, intranet, meetings)
   - Personalize communications where possible
   - Provide decision support tools
   - Offer multiple learning formats

2. **Enrollment Administration**
   - Set clear enrollment deadlines
   - Send multiple reminder communications
   - Provide manager visibility into team completion
   - Have contingency plans for system issues
   - Document all default election rules

3. **Life Event Processing**
   - Verify documentation before processing
   - Communicate deadlines clearly
   - Process changes promptly
   - Confirm changes in writing
   - Maintain audit trail

4. **Compliance Management**
   - Track all regulatory deadlines
   - Document decision-making processes
   - Maintain required notices and disclosures
   - Conduct regular compliance audits
   - Stay current on regulatory changes

5. **Data Quality**
   - Validate dependent information regularly
   - Reconcile with carrier records monthly
   - Address discrepancies promptly
   - Maintain accurate beneficiary records
   - Audit coverage tiers periodically

## Compliance Checklist

### ACA Compliance
- [ ] Affordability threshold calculated
- [ ] Minimum value requirement met
- [ ] Measurement periods defined
- [ ] 1095-C forms distributed timely
- [ ] Large employer determination documented

### ERISA Compliance
- [ ] Summary Plan Descriptions current
- [ ] Summary of Material Modifications distributed
- [ ] Summary Annual Reports provided
- [ ] Claims procedures documented
- [ ] Fiduciary responsibilities followed

### COBRA Administration
- [ ] Initial notices provided timely
- [ ] Qualifying events tracked
- [ ] Election notices sent within deadlines
- [ ] Premium payments tracked
- [ ] Termination notices issued properly

### HIPAA Compliance
- [ ] Privacy practices documented
- [ ] Business associate agreements current
- [ ] Special enrollment rights communicated
- [ ] Certificate of creditable coverage provided
- [ ] Security safeguards implemented

### Other Requirements
- [ ] FMLA coordination documented
- [ ] Medicare secondary payer rules followed
- [ ] State continuation requirements met
- [ ] Mental health parity compliance verified
- [ ] Women's Health Act notices provided
