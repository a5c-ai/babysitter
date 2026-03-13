---
name: failure-analysis
description: Systematic failure analysis methodology for mechanical component failures
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
metadata:
  specialization: mechanical-engineering
  domain: science
  category: materials-testing
  priority: medium
  phase: 8
  tools-libraries:
    - SEM/EDS analysis tools
    - Metallographic equipment
    - NDT methods
---

# Failure Analysis Skill

## Purpose

The Failure Analysis skill provides systematic methodology for investigating mechanical component failures, enabling root cause identification through fractography, metallography, stress analysis, and structured problem-solving approaches.

## Capabilities

- Fractography interpretation (SEM, optical)
- Metallographic examination guidance
- Root cause analysis frameworks (5-Why, Fishbone)
- Failure mode identification (fatigue, corrosion, overload)
- Stress analysis correlation to failure location
- Chemical analysis interpretation
- Corrective action development
- Failure analysis report generation

## Usage Guidelines

### Investigation Process

#### Phase 1: Evidence Preservation

1. **Documentation**
   - Photograph failed components as-received
   - Document orientation and assembly position
   - Record operating conditions at failure
   - Preserve all fragments

2. **Chain of Custody**
   - Log all handling
   - Secure storage
   - Controlled access
   - Document any cleaning or cutting

#### Phase 2: Visual Examination

1. **Macroscopic Features**
   | Feature | Indication |
   |---------|------------|
   | Beach marks | Fatigue |
   | Chevron marks | Brittle fracture |
   | Shear lips | Ductile overload |
   | Corrosion products | Environmental attack |
   | Wear patterns | Tribological failure |

2. **Fracture Origin**
   - Identify initiation site
   - Look for stress concentrations
   - Check for material defects
   - Document surface conditions

#### Phase 3: Fractography

1. **Optical Microscopy**
   - Low magnification overview
   - Document fracture features
   - Identify regions of interest

2. **Scanning Electron Microscopy (SEM)**
   | Fracture Feature | Failure Mode |
   |------------------|--------------|
   | Striations | Fatigue crack growth |
   | Dimples | Ductile overload |
   | Cleavage facets | Brittle fracture |
   | Intergranular | Creep, SCC, hydrogen |
   | Quasi-cleavage | Mixed mode |

3. **EDS Analysis**
   - Identify corrosion products
   - Detect contamination
   - Verify material composition

#### Phase 4: Metallography

1. **Sample Preparation**
   - Section perpendicular to fracture
   - Mount in appropriate media
   - Grind and polish
   - Select appropriate etchant

2. **Examination**
   - Grain structure
   - Heat treatment condition
   - Inclusions and defects
   - Microcracking
   - Decarburization

### Failure Mode Identification

#### Fatigue Failure

```
Characteristics:
- Beach marks (macroscopic)
- Striations (microscopic)
- Origin at stress concentration
- Minimal plastic deformation
- Flat fracture surface

Contributing Factors:
- Cyclic loading
- Stress concentration
- Residual stress
- Material defects
- Environmental effects
```

#### Overload Failure

```
Ductile:
- Significant plastic deformation
- Cup-and-cone fracture (tensile)
- Shear lips
- Dimpled fracture surface

Brittle:
- Little plastic deformation
- Flat fracture surface
- Chevron marks pointing to origin
- Cleavage or intergranular fracture
```

#### Corrosion Failures

| Type | Characteristics | Environment |
|------|-----------------|-------------|
| Uniform | General metal loss | Acids, bases |
| Pitting | Localized attack | Chlorides |
| SCC | Branching cracks | Specific ion + stress |
| Corrosion fatigue | Accelerated fatigue | Cyclic + corrosive |
| Hydrogen embrittlement | Intergranular fracture | Hydrogen source |

#### Wear Failures

| Type | Mechanism | Evidence |
|------|-----------|----------|
| Adhesive | Material transfer | Galling, scoring |
| Abrasive | Hard particle cutting | Grooves, scratches |
| Erosive | Fluid/particle impact | Surface damage pattern |
| Fretting | Small amplitude motion | Oxide debris, pitting |

### Root Cause Analysis

#### 5-Why Method

```
Problem: Shaft failure
Why 1: Fatigue fracture
Why 2: High stress concentration at keyway
Why 3: Sharp corner radius
Why 4: Drawing did not specify radius
Why 5: Design review did not catch omission

Root Cause: Inadequate design review process
```

#### Fishbone Diagram Categories

- Material: Composition, defects, properties
- Machine: Equipment condition, maintenance
- Method: Process, procedure, design
- Man: Training, error, supervision
- Environment: Temperature, humidity, contamination
- Measurement: Calibration, accuracy

## Process Integration

- ME-016: Failure Analysis Investigation

## Input Schema

```json
{
  "failed_component": {
    "part_number": "string",
    "material": "string",
    "service_history": "string",
    "failure_date": "date"
  },
  "operating_conditions": {
    "loads": "string",
    "environment": "string",
    "temperature": "number (C)",
    "cycles_or_hours": "number"
  },
  "available_evidence": {
    "fracture_surfaces": "boolean",
    "mating_parts": "boolean",
    "lubricant_samples": "boolean",
    "maintenance_records": "boolean"
  },
  "analysis_scope": "preliminary|comprehensive"
}
```

## Output Schema

```json
{
  "failure_mode": "fatigue|overload|corrosion|wear|other",
  "root_cause": "string",
  "contributing_factors": "array",
  "evidence_summary": {
    "visual": "string",
    "fractography": "string",
    "metallography": "string",
    "chemical": "string"
  },
  "corrective_actions": [
    {
      "action": "string",
      "category": "design|material|process|maintenance",
      "priority": "high|medium|low"
    }
  ],
  "preventive_recommendations": "array",
  "report_reference": "string"
}
```

## Best Practices

1. Preserve evidence before any destructive examination
2. Document all observations photographically
3. Follow systematic investigation process
4. Consider multiple failure mechanisms
5. Correlate fracture features with stress analysis
6. Validate root cause with evidence

## Integration Points

- Connects with FEA Structural for stress analysis
- Feeds into Material Selection for improved materials
- Supports Design Review for lessons learned
- Integrates with Quality for corrective actions
