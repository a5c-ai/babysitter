# Civil Engineering Skills & Agents Backlog

This document identifies specialized skills (tools, integrations) and agents (subagents with domain expertise) that would enhance the Civil Engineering processes beyond general-purpose capabilities.

## Overview

Based on analysis of all 25 defined process definitions in the processes-backlog.md, this backlog catalogs:
- **Skills**: Executable tools, integrations, and utilities for civil engineering workflows
- **Agents**: Specialized AI subagents with civil engineering domain expertise
- **Shared Candidates**: Reusable components across multiple processes

---

## Skills Backlog

### Structural Analysis Skills

#### 1. Finite Element Analysis Engine
**Skill ID**: `fea-structural-engine`
**Category**: Structural Analysis
**Used By**: structural-load-analysis, reinforced-concrete-design, structural-steel-design, seismic-design-analysis, bridge-design-lrfd

**Capabilities**:
- Linear and nonlinear structural analysis
- Static and dynamic load analysis
- Modal analysis for seismic design
- Stress, strain, and deflection calculations
- Load combination processing per ASCE 7
- Support for beam, column, plate, and shell elements

**Implementation Notes**:
```javascript
{
  kind: 'skill',
  skill: {
    name: 'fea-structural-engine',
    context: {
      analysisType: 'linear|nonlinear|modal|dynamic',
      loadCases: [...],
      loadCombinations: [...],
      elementTypes: ['beam', 'column', 'plate', 'shell'],
      designCode: 'ASCE7|IBC|AASHTO',
      outputFormat: 'json|csv|report'
    }
  }
}
```

---

#### 2. Section Property Calculator
**Skill ID**: `section-property-calculator`
**Category**: Structural Analysis
**Used By**: reinforced-concrete-design, structural-steel-design, bridge-design-lrfd

**Capabilities**:
- Calculate cross-sectional properties (A, I, S, Z, r)
- Support for standard shapes (W, HSS, C, L, pipe)
- Custom section analysis
- Composite section properties
- Cracked section analysis for concrete
- Plastic section modulus calculation

---

#### 3. Load Combination Generator
**Skill ID**: `load-combination-generator`
**Category**: Structural Analysis
**Used By**: structural-load-analysis, reinforced-concrete-design, structural-steel-design, bridge-design-lrfd

**Capabilities**:
- Generate ASCE 7 load combinations (ASD and LRFD)
- Generate AASHTO LRFD load combinations
- Support for special load combinations (seismic, wind)
- Custom load factor specification
- Load case matrix generation

---

#### 4. Seismic Hazard Analyzer
**Skill ID**: `seismic-hazard-analyzer`
**Category**: Structural Analysis
**Used By**: seismic-design-analysis, bridge-design-lrfd, foundation-design

**Capabilities**:
- Site classification determination (A-F)
- Spectral acceleration calculation (Ss, S1)
- Design response spectrum generation
- Seismic design category determination
- Site-specific hazard analysis
- USGS API integration for site data

**Implementation Notes**:
```javascript
{
  kind: 'skill',
  skill: {
    name: 'seismic-hazard-analyzer',
    context: {
      latitude: 34.0522,
      longitude: -118.2437,
      siteClass: 'D',
      riskCategory: 'II',
      designCode: 'ASCE7-22|AASHTO-LRFD',
      outputFormat: 'spectra|parameters|report'
    }
  }
}
```

---

#### 5. Steel Connection Designer
**Skill ID**: `steel-connection-designer`
**Category**: Structural Design
**Used By**: structural-steel-design, bridge-design-lrfd

**Capabilities**:
- Bolted connection design per AISC 360
- Welded connection design
- Moment connection design per AISC 358
- Shear tab, end plate, angle connections
- Base plate and anchor rod design per AISC Design Guide 1
- Seismic connection detailing per AISC 341

---

#### 6. Concrete Design Calculator
**Skill ID**: `concrete-design-calculator`
**Category**: Structural Design
**Used By**: reinforced-concrete-design, foundation-design, bridge-design-lrfd

**Capabilities**:
- Flexural design (beams, slabs, columns)
- Shear and torsion design
- Development length calculations
- Crack width calculations
- Deflection calculations (immediate and long-term)
- ACI 318 code compliance checking

---

#### 7. Wind Load Calculator
**Skill ID**: `wind-load-calculator`
**Category**: Structural Analysis
**Used By**: structural-load-analysis, bridge-design-lrfd

**Capabilities**:
- Basic wind speed determination
- Exposure category classification
- Wind pressure calculation (MWFRS and C&C)
- Building envelope pressures
- Open building wind loads
- Tornado shelter design wind loads

---

### Geotechnical Analysis Skills

#### 8. Bearing Capacity Calculator
**Skill ID**: `bearing-capacity-calculator`
**Category**: Geotechnical Analysis
**Used By**: foundation-design, geotechnical-site-investigation

**Capabilities**:
- Ultimate bearing capacity (Terzaghi, Meyerhof, Hansen, Vesic)
- Allowable bearing capacity with factor of safety
- Effect of groundwater
- Eccentric and inclined loads
- Layered soil bearing capacity
- Settlement-based bearing capacity

**Implementation Notes**:
```javascript
{
  kind: 'skill',
  skill: {
    name: 'bearing-capacity-calculator',
    context: {
      foundationType: 'spread|strip|mat|pile',
      soilLayers: [...],
      groundwaterDepth: 5.0,
      loadConditions: {
        vertical: 1000,
        horizontal: 50,
        moment: 200
      },
      method: 'terzaghi|meyerhof|hansen|vesic',
      factorOfSafety: 3.0
    }
  }
}
```

---

#### 9. Slope Stability Analyzer
**Skill ID**: `slope-stability-analyzer`
**Category**: Geotechnical Analysis
**Used By**: slope-stability-analysis, retaining-wall-design

**Capabilities**:
- Limit equilibrium analysis (Bishop, Spencer, Morgenstern-Price)
- Circular and non-circular failure surfaces
- Factor of safety calculation
- Seismic slope stability (pseudo-static)
- Probabilistic slope stability
- Sensitivity analysis

---

#### 10. Settlement Calculator
**Skill ID**: `settlement-calculator`
**Category**: Geotechnical Analysis
**Used By**: foundation-design, geotechnical-site-investigation

**Capabilities**:
- Immediate (elastic) settlement
- Consolidation settlement (1D theory)
- Secondary compression
- Time-rate of consolidation
- Differential settlement analysis
- Tolerable settlement checks

---

#### 11. Pile Capacity Analyzer
**Skill ID**: `pile-capacity-analyzer`
**Category**: Geotechnical Analysis
**Used By**: foundation-design, bridge-design-lrfd

**Capabilities**:
- Driven pile capacity (alpha, beta methods)
- Drilled shaft capacity (FHWA methods)
- Pile group efficiency
- Lateral pile analysis (p-y curves)
- Pile driving analysis (wave equation)
- LRFD resistance factors

---

#### 12. Earth Pressure Calculator
**Skill ID**: `earth-pressure-calculator`
**Category**: Geotechnical Analysis
**Used By**: retaining-wall-design, foundation-design

**Capabilities**:
- Active earth pressure (Rankine, Coulomb)
- Passive earth pressure
- At-rest earth pressure
- Surcharge effects
- Layered soil conditions
- Seismic earth pressure (Mononobe-Okabe)

---

#### 13. Soil Classification Tool
**Skill ID**: `soil-classification-tool`
**Category**: Geotechnical Analysis
**Used By**: geotechnical-site-investigation

**Capabilities**:
- USCS classification
- AASHTO soil classification
- Atterberg limits interpretation
- Grain size distribution analysis
- Soil description generator
- SPT correlation calculations

---

### BIM and CAD Skills

#### 14. BIM Clash Detection Engine
**Skill ID**: `bim-clash-detection`
**Category**: BIM Coordination
**Used By**: bim-coordination, shop-drawing-review

**Capabilities**:
- Hard clash detection (physical interference)
- Soft clash detection (clearance violations)
- Workflow clash detection (sequencing)
- Clash grouping and prioritization
- Resolution tracking
- Report generation with visualization

**Implementation Notes**:
```javascript
{
  kind: 'skill',
  skill: {
    name: 'bim-clash-detection',
    context: {
      models: ['structural.ifc', 'mep.ifc', 'architectural.ifc'],
      tolerances: {
        hard: 0,
        soft: 50,  // mm
        clearance: 100  // mm
      },
      categories: ['pipes', 'ducts', 'conduit', 'structure'],
      outputFormat: 'html|bcf|json'
    }
  }
}
```

---

#### 15. IFC Model Analyzer
**Skill ID**: `ifc-model-analyzer`
**Category**: BIM Coordination
**Used By**: bim-coordination, structural-peer-review

**Capabilities**:
- IFC schema validation
- Property set extraction
- Quantity takeoff
- Model comparison (diff)
- Element classification
- Coordinate system analysis

---

#### 16. Revit API Interface
**Skill ID**: `revit-api-interface`
**Category**: BIM Coordination
**Used By**: bim-coordination, reinforced-concrete-design, structural-steel-design

**Capabilities**:
- Extract element properties
- Create structural elements
- Generate schedules
- Apply structural parameters
- Export to analysis software
- Rebar detailing automation

---

#### 17. Civil 3D Surface Analyzer
**Skill ID**: `civil3d-surface-analyzer`
**Category**: Site Design
**Used By**: highway-geometric-design, stormwater-management-design, slope-stability-analysis

**Capabilities**:
- Surface analysis (slope, elevation, contours)
- Cut/fill volume calculation
- Drainage analysis
- Corridor modeling
- Cross-section generation
- Earthwork quantities

---

### Transportation Engineering Skills

#### 18. Highway Alignment Designer
**Skill ID**: `highway-alignment-designer`
**Category**: Transportation Design
**Used By**: highway-geometric-design, bridge-design-lrfd

**Capabilities**:
- Horizontal curve design (simple, compound, reverse, spiral)
- Vertical curve design (crest, sag)
- Superelevation calculation
- Sight distance analysis
- Cross-section template generation
- AASHTO Green Book compliance checking

**Implementation Notes**:
```javascript
{
  kind: 'skill',
  skill: {
    name: 'highway-alignment-designer',
    context: {
      designSpeed: 65,  // mph
      terrain: 'flat|rolling|mountainous',
      roadClass: 'freeway|arterial|collector|local',
      crossSectionType: 'rural|urban|suburban',
      standardCode: 'AASHTO|state-dot',
      outputFormat: 'xml|landxml|csv'
    }
  }
}
```

---

#### 19. Traffic Simulation Engine
**Skill ID**: `traffic-simulation-engine`
**Category**: Transportation Analysis
**Used By**: traffic-impact-analysis, intersection-signal-design

**Capabilities**:
- Microsimulation modeling
- Level of service calculation (HCM methodology)
- Queue length estimation
- Delay analysis
- Signal timing optimization
- Trip generation calculation

---

#### 20. Pavement Design Calculator
**Skill ID**: `pavement-design-calculator`
**Category**: Transportation Design
**Used By**: pavement-design, highway-geometric-design

**Capabilities**:
- Flexible pavement design (AASHTO 93, MEPDG)
- Rigid pavement design
- Overlay design
- Traffic loading analysis (ESALs)
- Material characterization
- Life-cycle cost analysis

---

#### 21. Signal Timing Optimizer
**Skill ID**: `signal-timing-optimizer`
**Category**: Transportation Analysis
**Used By**: intersection-signal-design, traffic-impact-analysis

**Capabilities**:
- Cycle length optimization
- Phase timing calculation
- Coordination timing (green wave)
- Actuated signal design
- Pedestrian timing (ADA compliance)
- MUTCD compliance checking

---

### Water Resources Engineering Skills

#### 22. Hydrologic Modeling Engine
**Skill ID**: `hydrologic-modeling-engine`
**Category**: Water Resources
**Used By**: stormwater-management-design, flood-analysis-mitigation, hydraulic-structure-design

**Capabilities**:
- Rational method calculations
- SCS/NRCS curve number method
- Unit hydrograph generation
- Reservoir routing
- Time of concentration calculation
- IDF curve analysis

**Implementation Notes**:
```javascript
{
  kind: 'skill',
  skill: {
    name: 'hydrologic-modeling-engine',
    context: {
      watershed: {
        area: 100,  // acres
        curveNumber: 75,
        timeOfConcentration: 30  // minutes
      },
      rainfall: {
        intensity: 4.5,  // in/hr
        duration: 60,  // minutes
        returnPeriod: 100  // years
      },
      method: 'rational|scs|unit-hydrograph',
      outputFormat: 'hydrograph|peak-flow|report'
    }
  }
}
```

---

#### 23. Hydraulic Analysis Engine
**Skill ID**: `hydraulic-analysis-engine`
**Category**: Water Resources
**Used By**: hydraulic-structure-design, stormwater-management-design, flood-analysis-mitigation

**Capabilities**:
- Open channel flow (Manning's equation)
- Culvert hydraulics (inlet/outlet control)
- Pipe network analysis
- Energy and momentum calculations
- Backwater analysis
- Spillway design calculations

---

#### 24. Detention Pond Designer
**Skill ID**: `detention-pond-designer`
**Category**: Water Resources
**Used By**: stormwater-management-design

**Capabilities**:
- Storage volume calculation
- Outlet structure sizing
- Stage-storage-discharge relationships
- Multi-stage outlet design
- Emergency spillway sizing
- Sediment storage calculation

---

#### 25. Water Distribution Modeler
**Skill ID**: `water-distribution-modeler`
**Category**: Water Resources
**Used By**: water-distribution-design

**Capabilities**:
- Pipe network analysis (Hardy-Cross, Newton-Raphson)
- Fire flow analysis
- Pump curve analysis
- Storage tank sizing
- Pressure zone analysis
- Water quality modeling

---

### Construction Management Skills

#### 26. Quantity Takeoff Calculator
**Skill ID**: `quantity-takeoff-calculator`
**Category**: Construction Management
**Used By**: construction-cost-estimation, specifications-development

**Capabilities**:
- Concrete volume calculation
- Steel weight calculation
- Earthwork quantities
- Pipe and conduit lengths
- Area calculations (formwork, finishes)
- Unit conversion

**Implementation Notes**:
```javascript
{
  kind: 'skill',
  skill: {
    name: 'quantity-takeoff-calculator',
    context: {
      source: 'bim-model|drawings|cad',
      categories: ['concrete', 'steel', 'earthwork', 'masonry'],
      unitSystem: 'imperial|metric',
      outputFormat: 'csv|excel|json',
      wasteFactor: 0.05
    }
  }
}
```

---

#### 27. CPM Schedule Generator
**Skill ID**: `cpm-schedule-generator`
**Category**: Construction Management
**Used By**: construction-schedule-development

**Capabilities**:
- Critical path calculation
- Float analysis (total, free, independent)
- Resource leveling
- Schedule compression
- Gantt chart generation
- Progress tracking

---

#### 28. Cost Database Interface
**Skill ID**: `cost-database-interface`
**Category**: Construction Management
**Used By**: construction-cost-estimation

**Capabilities**:
- RS Means database integration
- Unit cost lookup
- Regional cost adjustments
- Crew productivity rates
- Equipment rental rates
- Material price indices

---

#### 29. Submittal Tracker
**Skill ID**: `submittal-tracker`
**Category**: Construction Management
**Used By**: shop-drawing-review, construction-quality-control

**Capabilities**:
- Submittal log management
- Review workflow automation
- Specification section linking
- Response time tracking
- Revision management
- Approval stamp generation

---

### Building Codes and Compliance Skills

#### 30. Building Code Checker
**Skill ID**: `building-code-checker`
**Category**: Code Compliance
**Used By**: All structural processes, permit-application-preparation

**Capabilities**:
- IBC compliance verification
- Occupancy classification
- Construction type determination
- Allowable area calculation
- Fire-resistance requirements
- Means of egress analysis

**Implementation Notes**:
```javascript
{
  kind: 'skill',
  skill: {
    name: 'building-code-checker',
    context: {
      codeEdition: 'IBC-2021|IBC-2024',
      buildingData: {
        occupancy: 'B',
        constructionType: 'IIB',
        stories: 4,
        area: 50000,  // sf
        sprinklered: true
      },
      checkCategories: ['area', 'height', 'fire-resistance', 'egress'],
      outputFormat: 'report|checklist|json'
    }
  }
}
```

---

#### 31. Environmental Impact Analyzer
**Skill ID**: `environmental-impact-analyzer`
**Category**: Environmental
**Used By**: permit-application-preparation, stormwater-management-design

**Capabilities**:
- NEPA checklist generation
- Wetland impact assessment
- Endangered species screening
- Air quality impact analysis
- Noise impact assessment
- Mitigation measure recommendations

---

#### 32. ADA Compliance Checker
**Skill ID**: `ada-compliance-checker`
**Category**: Code Compliance
**Used By**: highway-geometric-design, permit-application-preparation

**Capabilities**:
- Accessible route analysis
- Slope and cross-slope checking
- Ramp design verification
- Curb ramp compliance
- Detectable warning requirements
- Parking accessibility

---

### Survey and GIS Skills

#### 33. Survey Data Processor
**Skill ID**: `survey-data-processor`
**Category**: Surveying
**Used By**: geotechnical-site-investigation, highway-geometric-design

**Capabilities**:
- Point cloud processing
- DTM/TIN generation
- Coordinate transformation
- Traverse adjustment
- Level loop adjustment
- GNSS data processing

---

#### 34. GIS Spatial Analyzer
**Skill ID**: `gis-spatial-analyzer`
**Category**: GIS
**Used By**: flood-analysis-mitigation, stormwater-management-design, highway-geometric-design

**Capabilities**:
- Watershed delineation
- Floodplain mapping
- Buffer analysis
- Slope analysis
- Land use classification
- Right-of-way analysis

---

### Documentation and Reporting Skills

#### 35. Engineering Report Generator
**Skill ID**: `engineering-report-generator`
**Category**: Documentation
**Used By**: All processes

**Capabilities**:
- Standard report templates (geotechnical, structural, traffic)
- Calculation sheet formatting
- Drawing sheet generation
- Table and figure numbering
- Reference management
- PE seal block placement

**Implementation Notes**:
```javascript
{
  kind: 'skill',
  skill: {
    name: 'engineering-report-generator',
    context: {
      reportType: 'geotechnical|structural|traffic|design',
      template: 'standard|custom',
      sections: ['executive-summary', 'methodology', 'findings', 'recommendations'],
      appendices: ['calculations', 'test-results', 'drawings'],
      outputFormat: 'docx|pdf|html'
    }
  }
}
```

---

#### 36. CSI Specification Writer
**Skill ID**: `csi-specification-writer`
**Category**: Documentation
**Used By**: specifications-development

**Capabilities**:
- MasterFormat organization
- Section template generation
- Standard paragraph library
- Edit tracking
- Reference standard linking
- Project-specific customization

---

#### 37. Permit Application Generator
**Skill ID**: `permit-application-generator`
**Category**: Documentation
**Used By**: permit-application-preparation

**Capabilities**:
- Building permit forms
- Environmental permit forms
- DOT permit applications
- Supporting document checklist
- Fee calculation
- Submittal package assembly

---

---

## Agents Backlog

### Structural Engineering Agents

#### 1. Structural Load Analyst
**Agent ID**: `structural-load-analyst`
**Category**: Structural Engineering
**Used By**: structural-load-analysis

**Expertise**:
- ASCE 7 load determination
- Dead load estimation
- Live load reduction
- Environmental load analysis (wind, seismic, snow, rain)
- Load combination development
- Load path analysis

**Prompt Template**:
```javascript
{
  role: 'Structural Load Analysis Specialist',
  expertise: ['ASCE 7', 'Load combinations', 'Environmental loads'],
  task: 'Determine design loads and load combinations for structural design',
  guidelines: [
    'Follow ASCE 7 methodology rigorously',
    'Consider all applicable load cases',
    'Document assumptions clearly',
    'Provide load path diagrams',
    'Apply risk category appropriately'
  ]
}
```

---

#### 2. Reinforced Concrete Designer
**Agent ID**: `reinforced-concrete-designer`
**Category**: Structural Engineering
**Used By**: reinforced-concrete-design, foundation-design

**Expertise**:
- ACI 318 design provisions
- Flexure, shear, torsion design
- Serviceability checks (deflection, cracking)
- Seismic detailing requirements
- Reinforcement detailing
- Constructability considerations

---

#### 3. Structural Steel Designer
**Agent ID**: `structural-steel-designer`
**Category**: Structural Engineering
**Used By**: structural-steel-design

**Expertise**:
- AISC 360 design provisions
- Member selection and optimization
- Connection design
- Stability analysis
- Seismic steel design (AISC 341)
- Fire protection requirements

---

#### 4. Seismic Design Specialist
**Agent ID**: `seismic-design-specialist`
**Category**: Structural Engineering
**Used By**: seismic-design-analysis, reinforced-concrete-design, structural-steel-design

**Expertise**:
- Seismic hazard analysis
- Structural system selection
- Response spectrum analysis
- Seismic detailing requirements
- Base isolation and damping systems
- Performance-based seismic design

**Prompt Template**:
```javascript
{
  role: 'Seismic Design Engineering Specialist',
  expertise: ['ASCE 7 seismic provisions', 'ACI 318 seismic detailing', 'AISC 341'],
  task: 'Develop seismic-resistant structural designs',
  guidelines: [
    'Determine seismic design category properly',
    'Select appropriate structural system',
    'Apply proper R, Cd, and Omega factors',
    'Detail for ductility and redundancy',
    'Consider performance objectives'
  ]
}
```

---

#### 5. Bridge Engineer
**Agent ID**: `bridge-engineer`
**Category**: Structural Engineering
**Used By**: bridge-design-lrfd

**Expertise**:
- AASHTO LRFD specifications
- Bridge superstructure design
- Substructure design
- Load rating
- Bridge inspection protocols
- Rehabilitation strategies

---

### Geotechnical Engineering Agents

#### 6. Geotechnical Investigation Specialist
**Agent ID**: `geotechnical-investigation-specialist`
**Category**: Geotechnical Engineering
**Used By**: geotechnical-site-investigation

**Expertise**:
- Subsurface investigation planning
- Field testing interpretation (SPT, CPT)
- Laboratory testing analysis
- Soil classification and description
- Geotechnical report writing
- Site characterization

**Prompt Template**:
```javascript
{
  role: 'Geotechnical Investigation Specialist',
  expertise: ['Subsurface exploration', 'Soil mechanics', 'Laboratory testing'],
  task: 'Plan and interpret geotechnical investigations',
  guidelines: [
    'Design appropriate boring program',
    'Select proper testing methods',
    'Interpret field and lab data correctly',
    'Develop subsurface model',
    'Provide engineering recommendations'
  ]
}
```

---

#### 7. Foundation Engineer
**Agent ID**: `foundation-engineer`
**Category**: Geotechnical Engineering
**Used By**: foundation-design

**Expertise**:
- Shallow foundation design
- Deep foundation design (piles, drilled shafts)
- Foundation settlement analysis
- Lateral loading analysis
- Foundation retrofitting
- Construction considerations

---

#### 8. Slope Stability Analyst
**Agent ID**: `slope-stability-analyst`
**Category**: Geotechnical Engineering
**Used By**: slope-stability-analysis, retaining-wall-design

**Expertise**:
- Limit equilibrium methods
- Factor of safety determination
- Remediation design
- Seismic slope stability
- Instrumentation and monitoring
- Landslide assessment

---

#### 9. Retaining Structure Designer
**Agent ID**: `retaining-structure-designer`
**Category**: Geotechnical Engineering
**Used By**: retaining-wall-design

**Expertise**:
- Gravity wall design
- Cantilever wall design
- MSE wall design
- Soil nail wall design
- Sheet pile wall design
- Tieback design

---

### Transportation Engineering Agents

#### 10. Highway Design Engineer
**Agent ID**: `highway-design-engineer`
**Category**: Transportation Engineering
**Used By**: highway-geometric-design

**Expertise**:
- AASHTO geometric design criteria
- Horizontal and vertical alignment
- Cross-section design
- Sight distance analysis
- Interchange design
- Design exception documentation

**Prompt Template**:
```javascript
{
  role: 'Highway Design Engineer',
  expertise: ['AASHTO Green Book', 'Geometric design', 'Safety engineering'],
  task: 'Design highway geometric elements meeting safety and operational requirements',
  guidelines: [
    'Apply design speed consistently',
    'Ensure adequate sight distances',
    'Coordinate horizontal and vertical alignment',
    'Design for target driver population',
    'Document any design exceptions'
  ]
}
```

---

#### 11. Traffic Engineer
**Agent ID**: `traffic-engineer`
**Category**: Transportation Engineering
**Used By**: traffic-impact-analysis, intersection-signal-design

**Expertise**:
- Traffic impact analysis
- Level of service analysis (HCM)
- Signal timing design
- Traffic safety analysis
- Transportation demand management
- Parking analysis

---

#### 12. Pavement Engineer
**Agent ID**: `pavement-engineer`
**Category**: Transportation Engineering
**Used By**: pavement-design

**Expertise**:
- Flexible pavement design
- Rigid pavement design
- Pavement rehabilitation
- Material selection
- Life-cycle cost analysis
- Pavement management systems

---

### Water Resources Engineering Agents

#### 13. Hydrology Analyst
**Agent ID**: `hydrology-analyst`
**Category**: Water Resources Engineering
**Used By**: stormwater-management-design, flood-analysis-mitigation

**Expertise**:
- Rainfall-runoff modeling
- Flood frequency analysis
- Watershed analysis
- Hydrograph development
- Climate change impacts
- Probabilistic hydrology

**Prompt Template**:
```javascript
{
  role: 'Hydrology Analysis Specialist',
  expertise: ['Hydrologic modeling', 'Flood analysis', 'Watershed science'],
  task: 'Perform hydrologic analysis for water resources engineering',
  guidelines: [
    'Select appropriate hydrologic methods',
    'Validate rainfall data appropriately',
    'Consider antecedent conditions',
    'Account for future development',
    'Apply proper return periods'
  ]
}
```

---

#### 14. Hydraulic Engineer
**Agent ID**: `hydraulic-engineer`
**Category**: Water Resources Engineering
**Used By**: hydraulic-structure-design, stormwater-management-design, flood-analysis-mitigation

**Expertise**:
- Open channel hydraulics
- Culvert and bridge hydraulics
- Energy dissipation design
- Spillway design
- Scour analysis
- HEC-RAS modeling

---

#### 15. Stormwater Management Specialist
**Agent ID**: `stormwater-management-specialist`
**Category**: Water Resources Engineering
**Used By**: stormwater-management-design

**Expertise**:
- Detention/retention design
- Low-impact development (LID)
- Green infrastructure
- Water quality treatment
- Stormwater regulations
- MS4 permit compliance

---

#### 16. Water Distribution Engineer
**Agent ID**: `water-distribution-engineer`
**Category**: Water Resources Engineering
**Used By**: water-distribution-design

**Expertise**:
- Pipe network design
- Pump station design
- Storage facility design
- Fire flow analysis
- Water quality considerations
- System master planning

---

### Construction Management Agents

#### 17. Cost Estimator
**Agent ID**: `cost-estimator`
**Category**: Construction Management
**Used By**: construction-cost-estimation

**Expertise**:
- Quantity takeoff methods
- Unit cost estimation
- Indirect cost allocation
- Contingency analysis
- Value engineering
- Cost database utilization

**Prompt Template**:
```javascript
{
  role: 'Construction Cost Estimating Specialist',
  expertise: ['Quantity takeoff', 'Cost databases', 'Value engineering'],
  task: 'Develop accurate construction cost estimates',
  guidelines: [
    'Complete thorough quantity takeoffs',
    'Use current cost data',
    'Apply appropriate regional factors',
    'Include all indirect costs',
    'Document assumptions and exclusions'
  ]
}
```

---

#### 18. Construction Scheduler
**Agent ID**: `construction-scheduler`
**Category**: Construction Management
**Used By**: construction-schedule-development

**Expertise**:
- CPM scheduling
- Resource allocation
- Schedule compression techniques
- Risk-based scheduling
- Progress tracking
- Delay analysis

---

#### 19. Quality Control Specialist
**Agent ID**: `quality-control-specialist`
**Category**: Construction Management
**Used By**: construction-quality-control, shop-drawing-review

**Expertise**:
- QA/QC program development
- Inspection protocols
- Testing requirements (concrete, steel, soil)
- Acceptance criteria
- Non-conformance management
- Documentation requirements

---

#### 20. Shop Drawing Reviewer
**Agent ID**: `shop-drawing-reviewer`
**Category**: Construction Management
**Used By**: shop-drawing-review

**Expertise**:
- Structural steel detailing review
- Rebar shop drawing review
- Mechanical equipment review
- Fabrication tolerance verification
- Design intent verification
- RFI response preparation

---

### BIM and Integration Agents

#### 21. BIM Coordinator
**Agent ID**: `bim-coordinator`
**Category**: BIM Management
**Used By**: bim-coordination

**Expertise**:
- Multi-discipline coordination
- Clash detection management
- LOD requirements
- BIM execution planning
- Model federation
- 4D/5D BIM applications

**Prompt Template**:
```javascript
{
  role: 'BIM Coordination Specialist',
  expertise: ['Multi-discipline coordination', 'Clash detection', 'BIM standards'],
  task: 'Coordinate BIM models across disciplines',
  guidelines: [
    'Establish clear LOD requirements',
    'Run regular clash detection cycles',
    'Prioritize and assign clash resolution',
    'Maintain model coordination log',
    'Enforce BIM execution plan'
  ]
}
```

---

#### 22. Structural Peer Reviewer
**Agent ID**: `structural-peer-reviewer`
**Category**: Quality Assurance
**Used By**: structural-peer-review

**Expertise**:
- Independent design verification
- Code compliance review
- Calculation checking
- Constructability review
- Professional practice standards
- Third-party review protocols

---

### Regulatory and Documentation Agents

#### 23. Specifications Writer
**Agent ID**: `specifications-writer`
**Category**: Documentation
**Used By**: specifications-development

**Expertise**:
- CSI MasterFormat organization
- Technical writing
- Standard specification customization
- Reference standard coordination
- Quality assurance specification
- Performance specifications

---

#### 24. Permit Coordinator
**Agent ID**: `permit-coordinator`
**Category**: Regulatory
**Used By**: permit-application-preparation

**Expertise**:
- Building permit requirements
- Environmental permit processes
- DOT permit coordination
- Utility coordination
- Regulatory agency relationships
- Permit expediting strategies

**Prompt Template**:
```javascript
{
  role: 'Permit Coordination Specialist',
  expertise: ['Building permits', 'Environmental compliance', 'Agency coordination'],
  task: 'Coordinate permit applications and approvals',
  guidelines: [
    'Identify all required permits early',
    'Prepare complete applications',
    'Coordinate with reviewing agencies',
    'Track review comments and responses',
    'Maintain permit schedule'
  ]
}
```

---

#### 25. Environmental Compliance Specialist
**Agent ID**: `environmental-compliance-specialist`
**Category**: Regulatory
**Used By**: permit-application-preparation, stormwater-management-design

**Expertise**:
- NEPA compliance
- Clean Water Act (Section 404)
- Endangered Species Act
- State environmental regulations
- Environmental impact mitigation
- Erosion and sediment control

---

#### 26. Building Code Analyst
**Agent ID**: `building-code-analyst`
**Category**: Code Compliance
**Used By**: All design processes

**Expertise**:
- International Building Code
- State and local amendments
- Fire code requirements
- Accessibility requirements
- Code interpretation
- Alternative compliance paths

---

#### 27. Technical Report Writer
**Agent ID**: `technical-report-writer`
**Category**: Documentation
**Used By**: All processes

**Expertise**:
- Engineering report standards
- Technical writing clarity
- Calculation documentation
- Figure and table formatting
- Executive summary development
- Appendix organization

---

---

## Shared Candidates (Cross-Process Reusability)

### High-Reuse Skills

| Skill ID | Process Count | Processes |
|----------|---------------|-----------|
| `fea-structural-engine` | 5 | structural-load-analysis, reinforced-concrete-design, structural-steel-design, seismic-design-analysis, bridge-design-lrfd |
| `section-property-calculator` | 3 | reinforced-concrete-design, structural-steel-design, bridge-design-lrfd |
| `load-combination-generator` | 4 | structural-load-analysis, reinforced-concrete-design, structural-steel-design, bridge-design-lrfd |
| `bearing-capacity-calculator` | 2 | foundation-design, geotechnical-site-investigation |
| `hydrologic-modeling-engine` | 3 | stormwater-management-design, flood-analysis-mitigation, hydraulic-structure-design |
| `hydraulic-analysis-engine` | 3 | hydraulic-structure-design, stormwater-management-design, flood-analysis-mitigation |
| `quantity-takeoff-calculator` | 2 | construction-cost-estimation, specifications-development |
| `building-code-checker` | 10+ | All structural and design processes |
| `engineering-report-generator` | 25 | All processes (documentation output) |
| `bim-clash-detection` | 2 | bim-coordination, shop-drawing-review |

### High-Reuse Agents

| Agent ID | Process Count | Processes |
|----------|---------------|-----------|
| `technical-report-writer` | 25 | All processes |
| `building-code-analyst` | 15+ | All design and review processes |
| `seismic-design-specialist` | 3 | seismic-design-analysis, reinforced-concrete-design, structural-steel-design |
| `foundation-engineer` | 3 | foundation-design, geotechnical-site-investigation, slope-stability-analysis |
| `hydraulic-engineer` | 3 | hydraulic-structure-design, stormwater-management-design, flood-analysis-mitigation |
| `cost-estimator` | 3 | construction-cost-estimation, construction-schedule-development, construction-quality-control |
| `quality-control-specialist` | 2 | construction-quality-control, shop-drawing-review |
| `permit-coordinator` | 2 | permit-application-preparation, specifications-development |

---

## Process-to-Skills/Agents Matrix

### Structural Engineering Processes

| Process | Recommended Skills | Recommended Agents |
|---------|-------------------|-------------------|
| **structural-load-analysis** | fea-structural-engine, load-combination-generator, wind-load-calculator, seismic-hazard-analyzer | structural-load-analyst, building-code-analyst |
| **reinforced-concrete-design** | fea-structural-engine, section-property-calculator, concrete-design-calculator | reinforced-concrete-designer, seismic-design-specialist |
| **structural-steel-design** | fea-structural-engine, section-property-calculator, steel-connection-designer | structural-steel-designer, seismic-design-specialist |
| **seismic-design-analysis** | seismic-hazard-analyzer, fea-structural-engine | seismic-design-specialist, building-code-analyst |
| **bridge-design-lrfd** | fea-structural-engine, section-property-calculator, pile-capacity-analyzer | bridge-engineer, foundation-engineer |

### Geotechnical Engineering Processes

| Process | Recommended Skills | Recommended Agents |
|---------|-------------------|-------------------|
| **geotechnical-site-investigation** | soil-classification-tool, bearing-capacity-calculator, settlement-calculator | geotechnical-investigation-specialist, technical-report-writer |
| **foundation-design** | bearing-capacity-calculator, pile-capacity-analyzer, settlement-calculator, earth-pressure-calculator | foundation-engineer, geotechnical-investigation-specialist |
| **slope-stability-analysis** | slope-stability-analyzer, earth-pressure-calculator, civil3d-surface-analyzer | slope-stability-analyst, geotechnical-investigation-specialist |
| **retaining-wall-design** | earth-pressure-calculator, slope-stability-analyzer, concrete-design-calculator | retaining-structure-designer, reinforced-concrete-designer |

### Transportation Engineering Processes

| Process | Recommended Skills | Recommended Agents |
|---------|-------------------|-------------------|
| **highway-geometric-design** | highway-alignment-designer, civil3d-surface-analyzer, survey-data-processor | highway-design-engineer, traffic-engineer |
| **traffic-impact-analysis** | traffic-simulation-engine, signal-timing-optimizer | traffic-engineer, technical-report-writer |
| **pavement-design** | pavement-design-calculator | pavement-engineer, cost-estimator |
| **intersection-signal-design** | signal-timing-optimizer, traffic-simulation-engine | traffic-engineer, building-code-analyst |

### Water Resources Engineering Processes

| Process | Recommended Skills | Recommended Agents |
|---------|-------------------|-------------------|
| **stormwater-management-design** | hydrologic-modeling-engine, hydraulic-analysis-engine, detention-pond-designer | stormwater-management-specialist, hydrology-analyst |
| **hydraulic-structure-design** | hydraulic-analysis-engine, hydrologic-modeling-engine | hydraulic-engineer, structural-load-analyst |
| **water-distribution-design** | water-distribution-modeler | water-distribution-engineer, cost-estimator |
| **flood-analysis-mitigation** | hydrologic-modeling-engine, hydraulic-analysis-engine, gis-spatial-analyzer | hydrology-analyst, hydraulic-engineer |

### Construction Management Processes

| Process | Recommended Skills | Recommended Agents |
|---------|-------------------|-------------------|
| **construction-cost-estimation** | quantity-takeoff-calculator, cost-database-interface | cost-estimator, technical-report-writer |
| **construction-schedule-development** | cpm-schedule-generator | construction-scheduler, cost-estimator |
| **construction-quality-control** | submittal-tracker | quality-control-specialist, technical-report-writer |
| **shop-drawing-review** | submittal-tracker, bim-clash-detection | shop-drawing-reviewer, quality-control-specialist |

### Design Integration Processes

| Process | Recommended Skills | Recommended Agents |
|---------|-------------------|-------------------|
| **bim-coordination** | bim-clash-detection, ifc-model-analyzer, revit-api-interface | bim-coordinator, structural-peer-reviewer |
| **structural-peer-review** | fea-structural-engine, ifc-model-analyzer, building-code-checker | structural-peer-reviewer, building-code-analyst |
| **specifications-development** | csi-specification-writer, quantity-takeoff-calculator | specifications-writer, technical-report-writer |
| **permit-application-preparation** | permit-application-generator, environmental-impact-analyzer, building-code-checker | permit-coordinator, environmental-compliance-specialist |

---

## Implementation Priority

### Phase 1: Foundation Skills (High Impact)
1. `fea-structural-engine` - Core structural analysis
2. `load-combination-generator` - Universal load processing
3. `bearing-capacity-calculator` - Foundation design foundation
4. `hydrologic-modeling-engine` - Water resources foundation
5. `building-code-checker` - Universal compliance

### Phase 2: Analysis Skills
6. `seismic-hazard-analyzer` - Seismic design support
7. `slope-stability-analyzer` - Geotechnical analysis
8. `hydraulic-analysis-engine` - Water resources analysis
9. `traffic-simulation-engine` - Transportation analysis
10. `quantity-takeoff-calculator` - Cost estimation support

### Phase 3: Design Skills
11. `concrete-design-calculator` - Concrete design
12. `steel-connection-designer` - Steel design
13. `highway-alignment-designer` - Transportation design
14. `detention-pond-designer` - Stormwater design
15. `pile-capacity-analyzer` - Foundation design

### Phase 4: Integration and BIM Skills
16. `bim-clash-detection` - BIM coordination
17. `ifc-model-analyzer` - BIM analysis
18. `revit-api-interface` - BIM automation
19. `cpm-schedule-generator` - Construction management
20. `cost-database-interface` - Cost estimation

### Phase 5: Domain Expert Agents
21. `structural-load-analyst` - Structural expertise
22. `foundation-engineer` - Geotechnical expertise
23. `highway-design-engineer` - Transportation expertise
24. `hydrology-analyst` - Water resources expertise
25. `cost-estimator` - Construction management expertise

### Phase 6: Quality and Documentation Agents
26. `building-code-analyst` - Code compliance
27. `bim-coordinator` - BIM management
28. `technical-report-writer` - Documentation quality
29. `permit-coordinator` - Regulatory navigation
30. `structural-peer-reviewer` - Quality assurance

---

## Summary Statistics

| Category | Count |
|----------|-------|
| **Total Skills** | 37 |
| **Total Agents** | 27 |
| **Shared/Reusable Skills** | 10 (high reuse) |
| **Shared/Reusable Agents** | 8 (high reuse) |

### Skills by Category
- Structural Analysis: 7
- Geotechnical Analysis: 6
- BIM and CAD: 4
- Transportation Engineering: 4
- Water Resources Engineering: 4
- Construction Management: 4
- Building Codes and Compliance: 3
- Survey and GIS: 2
- Documentation and Reporting: 3

### Agents by Category
- Structural Engineering: 5
- Geotechnical Engineering: 4
- Transportation Engineering: 3
- Water Resources Engineering: 4
- Construction Management: 4
- BIM and Integration: 2
- Regulatory and Documentation: 5

---

## Integration with Civil Engineering Software

### Analysis Software Integration Candidates
- SAP2000/ETABS/CSiBridge (structural analysis)
- RISA-3D/RAM Structural (structural design)
- PLAXIS/SLOPE/W (geotechnical analysis)
- HEC-RAS/HEC-HMS (hydraulic/hydrologic modeling)
- Synchro/SimTraffic (traffic analysis)

### Design Software Integration Candidates
- AutoCAD Civil 3D (site/roadway design)
- Revit Structure (structural BIM)
- Bentley OpenRoads (transportation design)
- WaterGEMS/SewerGEMS (utility design)

### Project Management Integration Candidates
- Primavera P6 (scheduling)
- Bluebeam Revu (document review)
- Procore (construction management)
- BIM 360 (cloud collaboration)

---

## Next Steps

1. **Implement Foundation Skills** - Start with high-impact, cross-process skills
2. **Create Agent Prompt Templates** - Standardize agent configurations for civil engineering domain
3. **Build Skill Integration Tests** - Ensure reliability with engineering calculations
4. **Document Skill APIs** - Clear usage patterns with engineering examples
5. **Develop Code Compliance Integration** - Connect to building code databases
6. **Establish Software Integrations** - Connect to civil engineering analysis tools
7. **Measure Usage Patterns** - Track which skills/agents are most valuable
8. **Iterate Based on Feedback** - Refine based on real-world engineering projects
