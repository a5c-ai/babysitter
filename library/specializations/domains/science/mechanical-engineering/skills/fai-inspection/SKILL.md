---
name: fai-inspection
description: Skill for first article inspection planning and execution per AS9102
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
    - CMM software
    - QMS systems
    - AS9102 templates
---

# First Article Inspection Skill

## Purpose

The First Article Inspection skill provides capabilities for planning and executing first article inspections per AS9102, enabling comprehensive verification of manufacturing processes and design conformance.

## Capabilities

- FAI plan development per AS9102
- Balloon drawing preparation
- Measurement method specification
- CMM programming guidance
- Characteristic accountability matrix
- Partial FAI and delta FAI management
- FAI report generation (Forms 1, 2, 3)
- Non-conformance disposition

## Usage Guidelines

### AS9102 Requirements

#### FAI Triggers

```
Full FAI required when:
- New part number
- Design change affecting form/fit/function
- Change in manufacturing process/location
- Tooling inactive > 2 years
- Manufacturing process change
- Natural/human-made event affecting process
```

#### Partial FAI (Delta FAI)

```
Allowed when:
- Minor design change
- Controlled process change
- Tooling modification

Only affected characteristics need re-inspection
```

### FAI Planning

#### Characteristic Identification

1. **Drawing Review**
   - Identify all dimensions
   - Identify all notes
   - Identify material/process requirements
   - Identify special characteristics

2. **Characteristic Types**
   | Type | Symbol | Definition |
   |------|--------|------------|
   | Standard | None | Normal inspection |
   | Critical | Triangle/diamond | Safety/function critical |
   | Major | M in circle | Important for assembly |
   | CTQ | Key symbol | Customer specified |

#### Balloon Drawing

```
Ballooning requirements:
- Unique number for each characteristic
- Sequential numbering preferred
- Reference to original dimension
- Include notes and specifications
- Mark special characteristics
```

### AS9102 Forms

#### Form 1: Part Number Accountability

```
Required fields:
- Part number and name
- Part revision level
- Drawing number and revision
- Organization name and code
- FAI report number
- Signature and date
- Part serial number
- FAI reason (new/change)
```

#### Form 2: Product Accountability - Materials, Processes, Functional Testing

```
Material verification:
- Material specification
- Raw material supplier
- Material certifications
- Heat/lot traceability

Process verification:
- Special processes (heat treat, plating, NDT)
- Process specification
- Processor certification
- Process parameters

Functional testing:
- Test requirements
- Test results
- Pass/fail status
```

#### Form 3: Characteristic Accountability

```
For each characteristic:
- Characteristic number (balloon)
- Reference location (drawing zone)
- Characteristic designator (if special)
- Requirement (nominal and tolerance)
- Results (actual value)
- Designed tooling (Y/N)
- Non-conformance number (if applicable)
```

### Measurement Methods

#### Measurement Selection

| Tolerance | Accuracy Required | Typical Method |
|-----------|------------------|----------------|
| +/- 0.5 mm | 0.05 mm | Caliper |
| +/- 0.1 mm | 0.01 mm | Micrometer |
| +/- 0.025 mm | 0.002 mm | CMM |
| +/- 0.005 mm | 0.0005 mm | Precision CMM |

#### GD&T Measurement

| Characteristic | Measurement Method |
|----------------|-------------------|
| Flatness | CMM scan, optical flat |
| Perpendicularity | CMM, square fixture |
| Position | CMM, functional gage |
| Concentricity | CMM, roundness tester |
| Runout | V-blocks + indicator |
| Profile | CMM, optical comparator |

#### CMM Programming

```
CMM measurement strategy:
1. Establish datum reference frame
2. Measure datum features first
3. Measure located features
4. Use appropriate probe compensation
5. Verify measurement uncertainty
6. Document probe configuration
```

### Non-Conformance Handling

#### Disposition Options

| Disposition | Application | Authority |
|-------------|-------------|-----------|
| Use As-Is | Minor deviation, no impact | Engineering |
| Rework | Can be brought to spec | Quality |
| Repair | Alternate method to restore | Engineering |
| Scrap | Cannot be made conforming | Quality |
| Return to Supplier | Vendor issue | Purchasing |

#### Documentation Requirements

```
Non-conformance record:
- NC number
- Characteristic affected
- Requirement
- Actual condition
- Root cause analysis
- Corrective action
- Disposition and approval
```

### FAI Approval Process

```
Approval workflow:
1. Inspector completes inspection
2. Quality review forms
3. Engineering review (if NC exists)
4. Quality approval signature
5. Customer approval (if required)
6. Archive and distribution
```

## Process Integration

- ME-023: First Article Inspection (FAI)

## Input Schema

```json
{
  "part_info": {
    "part_number": "string",
    "revision": "string",
    "description": "string",
    "drawing_number": "string"
  },
  "fai_type": "full|partial|delta",
  "trigger": "new_part|design_change|process_change|other",
  "previous_fai": "string (if partial/delta)",
  "special_requirements": {
    "customer_approval": "boolean",
    "special_processes": "array"
  }
}
```

## Output Schema

```json
{
  "fai_plan": {
    "fai_number": "string",
    "balloon_drawing": "file reference",
    "characteristic_count": "number",
    "measurement_methods": "array"
  },
  "fai_forms": {
    "form_1": "document reference",
    "form_2": "document reference",
    "form_3": "document reference"
  },
  "results_summary": {
    "total_characteristics": "number",
    "conforming": "number",
    "non_conforming": "number",
    "nc_numbers": "array"
  },
  "approval_status": {
    "status": "approved|conditional|rejected",
    "conditions": "array (if conditional)",
    "approved_by": "string",
    "date": "date"
  }
}
```

## Best Practices

1. Review drawing completely before ballooning
2. Ensure measurement method capability
3. Document traceability to raw material
4. Obtain certifications for special processes
5. Address all non-conformances before approval
6. Maintain FAI records per retention requirements

## Integration Points

- Connects with GD&T Drawing for requirements
- Feeds into Design Review for verification evidence
- Supports Process Planning for capability verification
- Integrates with Quality systems for record keeping
