# Industrial Engineering - Skills and Agents References (Phase 5)

This document provides implementation references for the skills and agents identified in the Industrial Engineering skills-agents-backlog.md, including GitHub repositories, MCP servers, community resources, API documentation, and applicable skills from other specializations.

---

## Table of Contents

1. [GitHub Repositories](#github-repositories)
2. [MCP Server References](#mcp-server-references)
3. [Community Resources](#community-resources)
4. [API Documentation](#api-documentation)
5. [Applicable Skills from Other Specializations](#applicable-skills-from-other-specializations)

---

## GitHub Repositories

### Operations Research and Optimization

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [PuLP](https://github.com/coin-or/pulp) | Linear programming in Python | linear-program-modeler |
| [Pyomo](https://github.com/Pyomo/pyomo) | Python optimization modeling | linear-program-modeler, integer-program-solver |
| [Google OR-Tools](https://github.com/google/or-tools) | Constraint programming and optimization | integer-program-solver, vehicle-routing-solver |
| [CVXPY](https://github.com/cvxpy/cvxpy) | Convex optimization | linear-program-modeler |
| [scipy.optimize](https://github.com/scipy/scipy) | Optimization algorithms | linear-program-modeler |
| [NetworkX](https://github.com/networkx/networkx) | Network analysis and algorithms | network-optimizer |
| [python-mip](https://github.com/coin-or/python-mip) | Mixed-integer programming | integer-program-solver |
| [DEAP](https://github.com/DEAP/deap) | Evolutionary algorithms | Production scheduling |
| [Optuna](https://github.com/optuna/optuna) | Hyperparameter optimization | simulation-experiment-designer |

### Discrete Event Simulation

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [SimPy](https://github.com/simpy/simpy) | Process-based DES | discrete-event-simulator |
| [Ciw](https://github.com/CiwPython/Ciw) | Queuing network simulation | discrete-event-simulator, queuing-analyzer |
| [salabim](https://github.com/salabim/salabim) | DES with animation | discrete-event-simulator |
| [simmer](https://github.com/r-simmer/simmer) | R-based DES | discrete-event-simulator |
| [desmod](https://github.com/SanDisk-Open-Source/desmod) | Modular DES | discrete-event-simulator |

### Statistical Analysis and Quality

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [statsmodels](https://github.com/statsmodels/statsmodels) | Statistical modeling | distribution-fitter, doe-designer |
| [scipy.stats](https://github.com/scipy/scipy) | Statistical functions | distribution-fitter, process-capability-calculator |
| [pingouin](https://github.com/raphaelvallat/pingouin) | Statistical analysis | gage-rr-analyzer, doe-designer |
| [pyDOE2](https://github.com/clicumu/pyDOE2) | Design of experiments | doe-designer, simulation-experiment-designer |
| [SALib](https://github.com/SALib/SALib) | Sensitivity analysis | simulation-experiment-designer |
| [fitter](https://github.com/cokelaer/fitter) | Distribution fitting | distribution-fitter |

### Time Series and Forecasting

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [Prophet](https://github.com/facebook/prophet) | Business time series | demand-forecaster |
| [statsmodels](https://github.com/statsmodels/statsmodels) | ARIMA, exponential smoothing | demand-forecaster |
| [pmdarima](https://github.com/alkaline-ml/pmdarima) | Auto-ARIMA | demand-forecaster |
| [sktime](https://github.com/sktime/sktime) | Time series ML | demand-forecaster |
| [NeuralProphet](https://github.com/ourownstory/neural_prophet) | Neural network forecasting | demand-forecaster |
| [Darts](https://github.com/unit8co/darts) | Time series library | demand-forecaster |

### Lean Manufacturing and Process Improvement

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [VSM-Python](https://github.com/vsm-tools) | Value stream mapping tools | value-stream-mapper |
| [PM4Py](https://github.com/pm4py/pm4py-core) | Process mining | process-mining-analyzer, value-stream-mapper |
| [ProM](https://promtools.org) | Process mining toolkit | process-mining-analyzer |
| [Celonis](https://www.celonis.com) | Process mining platform (commercial) | process-mining-analyzer |

### Production Planning and Scheduling

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [Job Shop Scheduling](https://github.com/mcfadd/Job_Shop_Schedule_Problem) | Job shop algorithms | production-scheduler |
| [PyJobShop](https://github.com/PyJobShop/PyJobShop) | Job shop scheduling | production-scheduler |
| [SchedulingBenchmarks](https://github.com/schedulingbenchmarks/schedulingbenchmarks.github.io) | Scheduling test problems | production-scheduler |
| [python-gantt](https://github.com/alexandre-music/python-gantt) | Gantt chart generation | production-scheduler |

### Quality Control and SPC

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [pyspc](https://github.com/carlosqsilva/pyspc) | Statistical process control | control-chart-analyzer |
| [qcc](https://cran.r-project.org/package=qcc) | R quality control charts | control-chart-analyzer |
| [SixSigma](https://cran.r-project.org/package=SixSigma) | R Six Sigma tools | process-capability-calculator |
| [qualityTools](https://cran.r-project.org/package=qualityTools) | R quality tools | doe-designer, control-chart-analyzer |

### Decision Analysis

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [AHPy](https://github.com/PhilipGrworck/AHPy) | Analytic Hierarchy Process | mcda-analyzer |
| [scikit-criteria](https://github.com/quatrope/scikit-criteria) | MCDA methods | mcda-analyzer |
| [pyDecision](https://github.com/Valdecy/pyDecision) | MCDA library | mcda-analyzer |
| [DecisionTree](https://github.com/scikit-learn/scikit-learn) | Decision trees | decision-tree-analyzer |

### Ergonomics

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [PyErgo](https://github.com/ergonomics-tools) | Ergonomic assessment | niosh-lifting-calculator, rula-reba-assessor |
| [OpenSim](https://github.com/opensim-org/opensim-core) | Biomechanical simulation | anthropometric-analyzer |
| [BioPython](https://github.com/biopython/biopython) | Biological data analysis | anthropometric-analyzer |

### Visualization and Dashboards

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [Plotly Dash](https://github.com/plotly/dash) | Analytical dashboards | operational-dashboard-generator |
| [Streamlit](https://github.com/streamlit/streamlit) | Data app framework | operational-dashboard-generator |
| [Grafana](https://github.com/grafana/grafana) | Monitoring dashboards | operational-dashboard-generator |
| [Altair](https://github.com/altair-viz/altair) | Declarative visualization | pareto-analyzer |

---

## MCP Server References

### ERP/MES Integration MCP Servers

| Server | Description | Relevant Skills |
|--------|-------------|-----------------|
| SAP RFC MCP | SAP ERP integration | production-scheduler, inventory-optimizer |
| Oracle REST MCP | Oracle ERP data access | demand-forecaster, capacity-planner |
| Microsoft Dynamics MCP | Dynamics 365 integration | inventory-optimizer |
| MQTT/OPC-UA MCP | Industrial IoT data | oee-calculator, control-chart-analyzer |

### Simulation MCP Servers

| Server | Description | Relevant Skills |
|--------|-------------|-----------------|
| SimPy MCP | DES model execution | discrete-event-simulator |
| Arena API MCP | Arena simulation integration | discrete-event-simulator |
| FlexSim MCP | FlexSim model control | discrete-event-simulator |
| AnyLogic MCP | AnyLogic simulation | discrete-event-simulator |

### Analytics MCP Servers

| Server | Description | Relevant Skills |
|--------|-------------|-----------------|
| Minitab MCP | Statistical analysis | doe-designer, control-chart-analyzer |
| JMP MCP | JMP statistical software | doe-designer, process-capability-calculator |
| Tableau MCP | Business intelligence | operational-dashboard-generator |
| Power BI MCP | Microsoft BI platform | operational-dashboard-generator |

### Process Mining MCP Servers

| Server | Description | Relevant Skills |
|--------|-------------|-----------------|
| Celonis MCP | Process mining platform | process-mining-analyzer |
| ARIS MCP | ARIS process management | value-stream-mapper |
| Signavio MCP | Process intelligence | process-mining-analyzer |

---

## Community Resources

### Forums and Discussion

| Resource | URL | Topics |
|----------|-----|--------|
| INFORMS | https://www.informs.org | Operations research |
| ASQ Community | https://my.asq.org/communities | Quality engineering |
| APICS | https://www.ascm.org | Supply chain, production |
| IIE | https://www.iise.org | Industrial engineering |
| Lean Enterprise Institute | https://www.lean.org | Lean manufacturing |
| Reddit r/IndustrialEngineering | https://reddit.com/r/IndustrialEngineering | General IE |
| Reddit r/OperationsResearch | https://reddit.com/r/OperationsResearch | OR topics |

### Documentation and Tutorials

| Resource | URL | Topics |
|----------|-----|--------|
| NIST Engineering Statistics | https://www.itl.nist.gov/div898/handbook/ | Statistical methods |
| MIT OpenCourseWare OR | https://ocw.mit.edu/courses/sloan-school-of-management/ | Operations research |
| Coursera Supply Chain | https://www.coursera.org/specializations/supply-chain-management | Supply chain |
| edX Quality Management | https://www.edx.org | Quality, Six Sigma |
| Lean Enterprise Institute | https://www.lean.org/LeanPost/ | Lean resources |
| APQC | https://www.apqc.org | Benchmarking, processes |

### Standards and Methodologies

| Organization | Standards | Topics |
|--------------|-----------|--------|
| ISO | ISO 9001, TS 16949, 22163 | Quality management |
| ASQ | CQE, Six Sigma certifications | Quality engineering |
| AIAG | FMEA, SPC, MSA manuals | Automotive quality |
| APICS | CPIM, CSCP | Supply chain |
| PMI | PMBOK | Project management |
| Lean Enterprise Institute | Lean principles | Lean manufacturing |

### Professional Certifications

| Certification | Organization | Topics |
|---------------|--------------|--------|
| CQE | ASQ | Quality engineering |
| Six Sigma (CSSBB, CSSGB) | ASQ, IASSC | Process improvement |
| CPIM | ASCM | Production & inventory |
| CSCP | ASCM | Supply chain |
| PMP | PMI | Project management |
| Lean certification | Various | Lean manufacturing |

---

## API Documentation

### Optimization Solver APIs

| API | Documentation | Purpose |
|-----|---------------|---------|
| Gurobi | https://www.gurobi.com/documentation/ | Commercial optimizer |
| CPLEX | https://www.ibm.com/docs/en/icos | IBM optimizer |
| COIN-OR | https://coin-or.github.io | Open source solvers |
| Google OR-Tools | https://developers.google.com/optimization | Constraint programming |
| SCIP | https://www.scipopt.org/doc/ | MIP solver |

### Statistical Software APIs

| API | Documentation | Purpose |
|-----|---------------|---------|
| Minitab API | https://www.minitab.com/en-us/support/ | Statistical analysis |
| JMP Scripting | https://www.jmp.com/support/help/ | JMP automation |
| SAS Viya | https://developer.sas.com | SAS analytics |
| R API | https://www.rdocumentation.org | R packages |

### ERP System APIs

| API | Documentation | Purpose |
|-----|---------------|---------|
| SAP API Hub | https://api.sap.com | SAP integration |
| Oracle REST | https://docs.oracle.com/en/cloud/saas/ | Oracle ERP |
| Microsoft Dynamics | https://docs.microsoft.com/en-us/dynamics365/ | Dynamics 365 |
| NetSuite | https://docs.oracle.com/en/cloud/saas/netsuite/ | NetSuite ERP |

### Industrial IoT APIs

| API | Documentation | Purpose |
|-----|---------------|---------|
| OPC-UA | https://opcfoundation.org | Industrial automation |
| MQTT | https://mqtt.org/getting-started/ | IoT messaging |
| AWS IoT | https://docs.aws.amazon.com/iot/ | Cloud IoT |
| Azure IoT | https://docs.microsoft.com/en-us/azure/iot/ | Cloud IoT |

### Process Mining APIs

| API | Documentation | Purpose |
|-----|---------------|---------|
| Celonis | https://docs.celonis.com | Process mining |
| UiPath Process Mining | https://docs.uipath.com/process-mining | Process mining |
| PM4Py | https://pm4py.fit.fraunhofer.de/documentation | Python process mining |

---

## Applicable Skills from Other Specializations

### From Materials Science

| Skill | Original ID | Application in Industrial Engineering |
|-------|-------------|--------------------------------------|
| Mechanical Testing Skill | SK-005 | Quality control testing, incoming inspection |
| Failure Analysis Skill | SK-017 | Root cause analysis for defective products |
| NDT Methods Skill | SK-019 | Quality inspection processes |
| Materials Specification Skill | SK-020 | Incoming material quality control |

### From Mechanical Engineering

| Skill | Original ID | Application in Industrial Engineering |
|-------|-------------|--------------------------------------|
| CAD Modeling Skill | SK-008 | Facility and workstation layout design |
| GD&T Skill | SK-009 | Quality inspection specifications |
| DFM Review Skill | SK-024 | Design for manufacturing analysis |
| Test Plan Development Skill | SK-017 | Quality test plan development |
| First Article Inspection Skill | SK-019 | Production part approval |

### From Electrical Engineering

| Skill | Original ID | Application in Industrial Engineering |
|-------|-------------|--------------------------------------|
| Test Equipment Automation Skill | SK-018 | Automated quality inspection |
| Reliability Analysis Skill | SK-020 | Product reliability prediction |
| Control System Design Skill | SK-009 | Process automation control |

### From Chemical Engineering

| Skill | Original ID | Application in Industrial Engineering |
|-------|-------------|--------------------------------------|
| Process Control Skill | Various | Continuous process monitoring |
| Process Simulation Skill | Various | Chemical process optimization |
| PID Tuning Skill | Various | Process control loops |

### From Business - Supply Chain

| Skill | Original ID | Application in Industrial Engineering |
|-------|-------------|--------------------------------------|
| Demand Forecasting Skill | Various | Production planning inputs |
| Inventory Optimization Skill | Various | Safety stock, EOQ calculations |
| Supplier Evaluation Skill | Various | Vendor quality assessment |
| S&OP Planning Skill | Various | Capacity planning alignment |

### From Business - Operations

| Skill | Original ID | Application in Industrial Engineering |
|-------|-------------|--------------------------------------|
| Value Stream Mapping Skill | Various | Lean transformation |
| DMAIC Project Skill | Various | Six Sigma improvement |
| Kaizen Event Skill | Various | Rapid improvement |
| Standard Work Skill | Various | Work standardization |
| OEE Calculation Skill | Various | Equipment effectiveness |

### From Automotive Engineering

| Skill | Original ID | Application in Industrial Engineering |
|-------|-------------|--------------------------------------|
| PPAP Skill | Various | Production part approval |
| APQP Skill | Various | Quality planning |
| Control Plan Skill | Various | Process control |
| Homologation Skill | Various | Product certification |

### From Aerospace Engineering

| Skill | Original ID | Application in Industrial Engineering |
|-------|-------------|--------------------------------------|
| Requirements Verification Skill | Various | Product verification |
| Configuration Management Skill | Various | Change control |
| Flight Test Planning Skill | Various | Test planning methodology |

### From Environmental Engineering

| Skill | Original ID | Application in Industrial Engineering |
|-------|-------------|--------------------------------------|
| LCA Assessment Skill | SK-020 | Product environmental impact |
| EMS Implementation Skill | SK-024 | ISO 14001 implementation |
| GHG Reduction Skill | SK-010 | Carbon footprint reduction |

---

## Implementation Notes

### Priority Integration Points

1. **PuLP/OR-Tools**: Core optimization capability for resource allocation
2. **SimPy**: Foundation for discrete event simulation
3. **Prophet/statsmodels**: Time series forecasting for demand planning
4. **pyspc**: Statistical process control charts
5. **PM4Py**: Process mining for value stream analysis
6. **Dash/Streamlit**: Operational dashboards

### Cross-Specialization Synergies

- Quality skills from Automotive (PPAP, APQP) directly applicable to manufacturing
- Process control from Chemical Engineering applicable to continuous processes
- Reliability analysis from Electrical Engineering enhances quality prediction
- DFM skills from Mechanical Engineering support producibility analysis

### Recommended Implementation Order

1. Optimization infrastructure (PuLP, OR-Tools)
2. Simulation capability (SimPy)
3. Statistical analysis (scipy.stats, statsmodels)
4. Forecasting (Prophet, pmdarima)
5. SPC and quality (pyspc, DOE tools)
6. Process mining (PM4Py)
7. Dashboard visualization (Dash, Streamlit)
8. ERP integration (SAP, Oracle APIs)

### Industry-Specific Considerations

- Automotive: AIAG standards (FMEA, SPC, MSA), IATF 16949
- Aerospace: AS9100, AS9102 (FAI), NADCAP
- Pharmaceutical: FDA 21 CFR Part 11, GMP
- Healthcare: Lean Healthcare, patient flow simulation
- Food/Beverage: HACCP, food safety quality

---

**Created**: 2026-01-25
**Version**: 1.0.0
**Status**: Phase 5 - References Documented
**Next Step**: Phase 6 - Skills and Agents Implementation
