---
name: test-planning
description: Skill for comprehensive mechanical test plan development and execution support
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: mechanical-engineering
  domain: science
  category: testing-validation
  priority: high
  phase: 4
  tools-libraries:
    - LabVIEW
    - NI DAQ systems
    - Test management tools
---

# Test Plan Development Skill

## Purpose

The Test Plan Development skill provides comprehensive capabilities for developing mechanical test plans including objective definition, test configuration, instrumentation planning, and data analysis procedures.

## Capabilities

- Test objective and success criteria definition
- Test configuration specification
- Instrumentation and data acquisition planning
- Load and environmental condition specification
- Safety analysis and risk assessment
- Test procedure development
- Data analysis plan creation
- Test report template generation

## Usage Guidelines

### Test Planning Framework

#### Test Objective Definition

1. **Verification vs Validation**
   | Type | Question | Purpose |
   |------|----------|---------|
   | Verification | Built correctly? | Meets specifications |
   | Validation | Built the right thing? | Meets user needs |

2. **Test Categories**
   - Development testing (design iteration)
   - Qualification testing (design approval)
   - Acceptance testing (production verification)
   - Certification testing (regulatory compliance)

3. **Success Criteria**
   ```
   Pass/Fail criteria must be:
   - Measurable and quantitative
   - Traceable to requirements
   - Unambiguous
   - Defined before testing
   ```

### Test Configuration

#### Test Article Definition

1. **Configuration Control**
   - Part number and revision
   - Serial number
   - Manufacturing records
   - Deviations from design

2. **Pre-Test Condition**
   - Dimensional verification
   - Surface condition
   - Prior test history
   - Environmental exposure

#### Test Setup

1. **Boundary Conditions**
   ```
   Fixture requirements:
   - Simulate actual mounting
   - Minimize artificial constraints
   - Allow access for instrumentation
   - Safe for failure modes
   ```

2. **Load Introduction**
   - Point loads vs distributed
   - Static vs dynamic
   - Load path verification
   - Fixture compliance effects

### Instrumentation Planning

#### Strain Measurement

| Type | Application | Accuracy |
|------|-------------|----------|
| Foil gage | General purpose | +/- 1% |
| Rosette | Unknown principal direction | +/- 1% |
| Clip gage | Large strains | +/- 0.5% |
| DIC | Full-field | +/- 2% |

#### Displacement Measurement

| Type | Range | Accuracy |
|------|-------|----------|
| LVDT | +/- 50 mm | +/- 0.1% |
| String pot | 0-2000 mm | +/- 0.5% |
| Laser | 0-500 mm | +/- 0.01% |
| Dial indicator | 0-50 mm | +/- 0.02 mm |

#### Force/Load Measurement

```
Load cell selection:
- Capacity: 1.5-2x expected maximum
- Accuracy: Class 0.1 or better for critical
- Type: Tension, compression, universal
- Environmental: Temperature, humidity range
```

#### Acceleration Measurement

| Type | Range | Bandwidth |
|------|-------|-----------|
| Piezoelectric | +/- 500 g | 1 Hz - 10 kHz |
| MEMS | +/- 50 g | DC - 1 kHz |
| Capacitive | +/- 10 g | DC - 100 Hz |

### Data Acquisition

#### Sampling Requirements

```
Nyquist criterion: f_sample >= 2 * f_max

Practical guideline: f_sample >= 5-10 * f_max

For transient events:
- Sample at 10x highest frequency content
- Include anti-aliasing filter
```

#### Channel Planning

1. **Channel List**
   - Channel ID
   - Measurement type
   - Sensor type
   - Location
   - Expected range
   - Calibration requirements

2. **Data Management**
   - File naming convention
   - Storage requirements
   - Backup procedures
   - Archive policy

### Test Procedures

#### Procedure Structure

```
1. Scope and applicability
2. Reference documents
3. Safety requirements
4. Equipment and materials
5. Pre-test setup
6. Test execution steps
7. Data recording requirements
8. Post-test procedures
9. Acceptance criteria
10. Reporting requirements
```

#### Safety Considerations

1. **Hazard Analysis**
   - Energy sources
   - Failure modes
   - Personnel exposure
   - Environmental impact

2. **Risk Mitigation**
   - Barriers and shields
   - Emergency stops
   - Warning systems
   - PPE requirements

### Data Analysis Plan

#### Analysis Methods

| Data Type | Analysis Method | Output |
|-----------|-----------------|--------|
| Static load-displacement | Linear regression | Stiffness |
| Stress-strain | Offset method | Yield strength |
| Fatigue | S-N curve fit | Life equation |
| Vibration | FFT, modal fit | Frequencies, damping |

#### Uncertainty Analysis

```
Combined uncertainty:
u_c = sqrt(sum(u_i^2))

Expanded uncertainty (95%):
U = k * u_c (k = 2 for 95%)

Sources:
- Calibration uncertainty
- Resolution
- Environmental effects
- Repeatability
```

## Process Integration

- ME-021: Test Plan Development

## Input Schema

```json
{
  "test_article": {
    "part_number": "string",
    "description": "string",
    "quantity": "number"
  },
  "requirements": {
    "specifications": "array of requirement IDs",
    "success_criteria": "array"
  },
  "test_type": "development|qualification|acceptance|certification",
  "test_conditions": {
    "loads": "array of load cases",
    "environments": "array of conditions",
    "duration": "string"
  },
  "resources": {
    "facility": "string",
    "equipment": "array",
    "personnel": "array"
  }
}
```

## Output Schema

```json
{
  "test_plan": {
    "document_number": "string",
    "revision": "string",
    "test_matrix": "array of test cases",
    "instrumentation_list": "array",
    "schedule": "object"
  },
  "test_procedures": "array of procedure references",
  "safety_analysis": {
    "hazards": "array",
    "controls": "array",
    "approval_required": "boolean"
  },
  "data_analysis_plan": {
    "methods": "array",
    "acceptance_criteria": "array"
  },
  "resource_requirements": {
    "cost_estimate": "number",
    "duration": "number (days)",
    "personnel": "array"
  }
}
```

## Best Practices

1. Define success criteria before testing
2. Verify instrumentation calibration
3. Document all deviations from plan
4. Include margin in load capacity
5. Plan for potential failure modes
6. Review procedures with test team

## Integration Points

- Connects with Requirements Flowdown for test requirements
- Feeds into Test Correlation for model validation
- Supports Design Review for verification evidence
- Integrates with FAI Inspection for first article
