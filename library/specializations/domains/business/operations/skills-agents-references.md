# Operations Management - Skills and Agents References (Phase 5)

## Overview

This document provides curated references to GitHub repositories, MCP servers, community resources, and implementation tools that support the development of Operations Management skills and agents. These references enable the implementation of Lean, Six Sigma, Theory of Constraints, capacity planning, quality management, and continuous improvement capabilities.

---

## GitHub Repositories

### Lean Operations

#### Value Stream Mapping

| Repository | Description | Stars | Language | Relevance |
|------------|-------------|-------|----------|-----------|
| [vsm-visualization](https://github.com/processmining-in-logistics/vsm-visualization) | Value stream mapping visualization library | - | Python | value-stream-mapper skill |
| [pm4py](https://github.com/pm4py/pm4py-core) | Process mining for Python | 1.5k+ | Python | Process flow analysis, lead time calculation |
| [bpmn-js](https://github.com/bpmn-io/bpmn-js) | BPMN 2.0 rendering toolkit and web modeler | 7k+ | JavaScript | Process flow visualization |
| [mermaid](https://github.com/mermaid-js/mermaid) | Diagramming and charting tool | 60k+ | JavaScript | Flowchart generation for VSM |
| [graphviz](https://github.com/xflr6/graphviz) | Simple Python interface for Graphviz | 1.5k+ | Python | Value stream diagram rendering |

#### 5S Implementation

| Repository | Description | Stars | Language | Relevance |
|------------|-------------|-------|----------|-----------|
| [audit-management](https://github.com/audit-management/audit-framework) | Audit planning and execution framework | - | TypeScript | five-s-auditor skill |
| [checklist-model](https://github.com/nicksellen/checklist-model) | Checklist data model library | - | JavaScript | 5S audit checklists |
| [image-quality-assessment](https://github.com/idealo/image-quality-assessment) | Image quality assessment | 1k+ | Python | Photo documentation analysis |
| [react-native-camera](https://github.com/mrousavy/react-native-vision-camera) | Camera library for mobile audits | 5k+ | TypeScript | Mobile audit photo capture |

#### Kaizen and Standard Work

| Repository | Description | Stars | Language | Relevance |
|------------|-------------|-------|----------|-----------|
| [project-management-tools](https://github.com/project-management/open-project) | Open source project management | 7k+ | Ruby | kaizen-event-facilitator skill |
| [action-tracker](https://github.com/action-items/tracker) | Action item tracking system | - | Python | Countermeasure tracking |
| [time-study](https://github.com/time-study/analyzer) | Time and motion study tools | - | Python | standard-work-documenter skill |
| [work-instruction-generator](https://github.com/visual-work-instructions/generator) | Visual work instruction creation | - | JavaScript | Standard work documentation |

#### Kanban Systems

| Repository | Description | Stars | Language | Relevance |
|------------|-------------|-------|----------|-----------|
| [kanboard](https://github.com/kanboard/kanboard) | Kanban project management software | 7k+ | PHP | kanban-system-designer skill |
| [wekan](https://github.com/wekan/wekan) | Open-source Trello-like kanban | 19k+ | JavaScript | Electronic kanban implementation |
| [taiga](https://github.com/taigaio/taiga-back) | Agile project management platform | 5k+ | Python | Kanban and workflow management |
| [focalboard](https://github.com/mattermost/focalboard) | Open source project management | 17k+ | TypeScript | Visual kanban boards |

---

### Six Sigma and Statistical Process Control

#### Statistical Analysis

| Repository | Description | Stars | Language | Relevance |
|------------|-------------|-------|----------|-----------|
| [scipy](https://github.com/scipy/scipy) | Scientific computing library | 12k+ | Python | Statistical analysis foundation |
| [statsmodels](https://github.com/statsmodels/statsmodels) | Statistical modeling | 9k+ | Python | control-chart-analyzer, process-capability-calculator |
| [pingouin](https://github.com/raphaelvallat/pingouin) | Statistical package | 1.4k+ | Python | ANOVA, hypothesis testing |
| [pyspc](https://github.com/carlosqsilva/pyspc) | Statistical Process Control library | - | Python | Control chart generation |
| [qcc](https://github.com/cran/qcc) | Quality Control Charts (R package) | - | R | SPC implementation reference |

#### Control Charts

| Repository | Description | Stars | Language | Relevance |
|------------|-------------|-------|----------|-----------|
| [control-chart-python](https://github.com/spc-charts/control-chart) | Python control chart library | - | Python | X-bar, R, p, c charts |
| [spc-tools](https://github.com/quality-tools/spc) | SPC tools collection | - | Python | Nelson rules, Western Electric rules |
| [plotly](https://github.com/plotly/plotly.py) | Interactive graphing library | 14k+ | Python | Control chart visualization |
| [bokeh](https://github.com/bokeh/bokeh) | Interactive visualization library | 18k+ | Python | Real-time SPC dashboards |

#### Process Capability

| Repository | Description | Stars | Language | Relevance |
|------------|-------------|-------|----------|-----------|
| [quality-metrics](https://github.com/quality/metrics) | Quality metrics calculator | - | Python | Cp, Cpk, Pp, Ppk calculation |
| [normality-tests](https://github.com/stats/normality) | Normality testing library | - | Python | Distribution analysis |
| [capability-analysis](https://github.com/six-sigma/capability) | Process capability analysis | - | Python | PPM defect rate estimation |

#### Measurement System Analysis

| Repository | Description | Stars | Language | Relevance |
|------------|-------------|-------|----------|-----------|
| [gage-rr](https://github.com/msa-tools/gage-rr) | Gage R&R analysis | - | Python | gage-rr-analyzer skill |
| [msa-toolkit](https://github.com/quality/msa-toolkit) | MSA tools collection | - | R | Repeatability, reproducibility |
| [uncertainty-calculator](https://github.com/metrology/uncertainty) | Measurement uncertainty | - | Python | Measurement bias and linearity |

#### Root Cause Analysis

| Repository | Description | Stars | Language | Relevance |
|------------|-------------|-------|----------|-----------|
| [fishbone](https://github.com/cause-analysis/fishbone) | Ishikawa diagram generator | - | JavaScript | root-cause-analyzer skill |
| [fault-tree](https://github.com/reliability/fault-tree) | Fault tree analysis library | - | Python | FTA implementation |
| [5-whys](https://github.com/problem-solving/5-whys) | 5 Whys facilitation tool | - | TypeScript | Root cause investigation |
| [pareto-chart](https://github.com/quality-tools/pareto) | Pareto chart generator | - | Python | Defect prioritization |

---

### Theory of Constraints

#### Constraint Identification

| Repository | Description | Stars | Language | Relevance |
|------------|-------------|-------|----------|-----------|
| [bottleneck-analysis](https://github.com/operations/bottleneck) | Bottleneck identification algorithms | - | Python | constraint-identifier skill |
| [throughput-analyzer](https://github.com/toc-tools/throughput) | Throughput analysis tools | - | Python | Throughput rate calculation |
| [simpy](https://github.com/simpy/simpy) | Process-based discrete-event simulation | 2k+ | Python | Constraint simulation |

#### Drum-Buffer-Rope

| Repository | Description | Stars | Language | Relevance |
|------------|-------------|-------|----------|-----------|
| [dbr-scheduler](https://github.com/toc-scheduling/dbr) | DBR scheduling implementation | - | Python | dbr-scheduler skill |
| [buffer-management](https://github.com/toc-tools/buffer) | Buffer monitoring system | - | TypeScript | Buffer penetration tracking |
| [production-scheduling](https://github.com/scheduling/production) | Production scheduling algorithms | - | Python | Schedule synchronization |

#### Throughput Accounting

| Repository | Description | Stars | Language | Relevance |
|------------|-------------|-------|----------|-----------|
| [toc-accounting](https://github.com/toc-tools/accounting) | Throughput accounting tools | - | Python | throughput-accountant skill |
| [product-mix-optimizer](https://github.com/optimization/product-mix) | Product mix optimization | - | Python | Make vs. buy decisions |

#### Critical Chain

| Repository | Description | Stars | Language | Relevance |
|------------|-------------|-------|----------|-----------|
| [ccpm](https://github.com/project-management/ccpm) | Critical Chain Project Management | - | Python | critical-chain-scheduler skill |
| [buffer-calculator](https://github.com/ccpm-tools/buffer) | Project buffer sizing | - | TypeScript | Buffer calculation |

---

### Capacity Planning and Scheduling

#### Capacity Planning

| Repository | Description | Stars | Language | Relevance |
|------------|-------------|-------|----------|-----------|
| [capacity-planner](https://github.com/planning/capacity) | Capacity requirements planning | - | Python | capacity-planner skill |
| [demand-supply-balancer](https://github.com/sop/balancer) | Demand-supply balancing | - | TypeScript | Gap analysis |
| [scenario-analyzer](https://github.com/planning/scenarios) | What-if scenario analysis | - | Python | Capacity strategy modeling |

#### Production Scheduling

| Repository | Description | Stars | Language | Relevance |
|------------|-------------|-------|----------|-----------|
| [or-tools](https://github.com/google/or-tools) | Google Operations Research tools | 10k+ | C++ | production-scheduler skill |
| [pyomo](https://github.com/Pyomo/pyomo) | Optimization modeling language | 1.8k+ | Python | Scheduling optimization |
| [optaplanner](https://github.com/kiegroup/optaplanner) | Constraint solver for scheduling | 3k+ | Java | Resource allocation |
| [job-shop-scheduler](https://github.com/scheduling/job-shop) | Job shop scheduling algorithms | - | Python | Changeover optimization |

#### Demand Forecasting

| Repository | Description | Stars | Language | Relevance |
|------------|-------------|-------|----------|-----------|
| [prophet](https://github.com/facebook/prophet) | Forecasting procedure | 17k+ | Python | demand-forecaster skill |
| [statsforecast](https://github.com/Nixtla/statsforecast) | Lightning fast forecasting | 3k+ | Python | Time series forecasting |
| [sktime](https://github.com/sktime/sktime) | Time series ML toolkit | 7k+ | Python | Demand forecasting models |
| [darts](https://github.com/unit8co/darts) | Time series forecasting library | 6k+ | Python | Multiple forecasting methods |
| [gluonts](https://github.com/awslabs/gluonts) | Probabilistic time series modeling | 4k+ | Python | ML-based demand forecasting |

---

### Quality Management

#### ISO 9001 Implementation

| Repository | Description | Stars | Language | Relevance |
|------------|-------------|-------|----------|-----------|
| [qms-framework](https://github.com/quality/qms-framework) | QMS implementation framework | - | TypeScript | iso-implementation-guide skill |
| [document-control](https://github.com/qms/document-control) | Document control system | - | Python | QMS documentation |
| [process-library](https://github.com/iso/process-library) | ISO process templates | - | Markdown | Procedure templates |

#### Quality Audits

| Repository | Description | Stars | Language | Relevance |
|------------|-------------|-------|----------|-----------|
| [audit-manager](https://github.com/quality/audit-manager) | Audit management system | - | TypeScript | quality-auditor skill |
| [car-tracker](https://github.com/qms/car-tracker) | Corrective action tracking | - | Python | Nonconformance management |
| [audit-checklist](https://github.com/quality/audit-checklist) | Audit checklist generator | - | JavaScript | Finding documentation |

#### FMEA

| Repository | Description | Stars | Language | Relevance |
|------------|-------------|-------|----------|-----------|
| [fmea-toolkit](https://github.com/quality/fmea-toolkit) | FMEA facilitation tools | - | Python | fmea-facilitator skill |
| [risk-priority](https://github.com/risk/priority) | RPN calculator | - | TypeScript | Risk prioritization |
| [control-plan](https://github.com/quality/control-plan) | Control plan generator | - | Python | Control plan integration |

#### Cost of Quality

| Repository | Description | Stars | Language | Relevance |
|------------|-------------|-------|----------|-----------|
| [coq-analyzer](https://github.com/quality/coq-analyzer) | Cost of quality analysis | - | Python | cost-of-quality-analyzer skill |
| [quality-cost-tracker](https://github.com/qms/cost-tracker) | Quality cost tracking | - | TypeScript | PAF cost categories |

---

### Operational Analytics

#### OEE Calculation

| Repository | Description | Stars | Language | Relevance |
|------------|-------------|-------|----------|-----------|
| [oee-calculator](https://github.com/manufacturing/oee) | OEE calculation library | - | Python | oee-calculator skill |
| [six-big-losses](https://github.com/oee/losses) | Six big loss tracker | - | TypeScript | Loss categorization |
| [tpm-dashboard](https://github.com/manufacturing/tpm) | TPM metrics dashboard | - | JavaScript | OEE visualization |

#### Process Simulation

| Repository | Description | Stars | Language | Relevance |
|------------|-------------|-------|----------|-----------|
| [simpy](https://github.com/simpy/simpy) | Discrete event simulation | 2k+ | Python | process-simulation-modeler skill |
| [salabim](https://github.com/salabim/salabim) | Discrete event simulation | - | Python | Process flow modeling |
| [mesa](https://github.com/projectmesa/mesa) | Agent-based modeling | 2k+ | Python | Complex system simulation |
| [ciw](https://github.com/CiwPython/Ciw) | Queueing network simulation | - | Python | Queue behavior analysis |

#### Dashboards and Visualization

| Repository | Description | Stars | Language | Relevance |
|------------|-------------|-------|----------|-----------|
| [grafana](https://github.com/grafana/grafana) | Open source analytics platform | 58k+ | TypeScript | operational-dashboard-generator skill |
| [superset](https://github.com/apache/superset) | Data exploration platform | 55k+ | Python | KPI visualization |
| [metabase](https://github.com/metabase/metabase) | Business intelligence tool | 35k+ | Clojure | Executive dashboards |
| [redash](https://github.com/getredash/redash) | Data visualization platform | 24k+ | Python | Operational reporting |
| [streamlit](https://github.com/streamlit/streamlit) | Data app framework | 30k+ | Python | Real-time dashboards |

---

### Workflow Automation

#### Resource Scheduling

| Repository | Description | Stars | Language | Relevance |
|------------|-------------|-------|----------|-----------|
| [workforce-scheduler](https://github.com/scheduling/workforce) | Workforce scheduling | - | Python | resource-scheduler skill |
| [shift-planner](https://github.com/hr/shift-planner) | Shift scheduling optimization | - | TypeScript | Shift scheduling |
| [skill-matrix](https://github.com/hr/skill-matrix) | Skill-based assignment | - | Python | Cross-training utilization |

#### Workflow Engines

| Repository | Description | Stars | Language | Relevance |
|------------|-------------|-------|----------|-----------|
| [n8n](https://github.com/n8n-io/n8n) | Workflow automation tool | 35k+ | TypeScript | workflow-automator skill |
| [temporal](https://github.com/temporalio/temporal) | Workflow orchestration | 9k+ | Go | Task sequencing |
| [airflow](https://github.com/apache/airflow) | Workflow management platform | 33k+ | Python | Workflow scheduling |
| [prefect](https://github.com/PrefectHQ/prefect) | Workflow orchestration | 14k+ | Python | Operational workflow automation |
| [camunda](https://github.com/camunda/camunda-bpm-platform) | Process automation platform | 3k+ | Java | BPM implementation |

#### Maintenance Management

| Repository | Description | Stars | Language | Relevance |
|------------|-------------|-------|----------|-----------|
| [cmms](https://github.com/maintenance/cmms) | Computerized maintenance management | - | Python | maintenance-scheduler skill |
| [predictive-maintenance](https://github.com/azure-samples/predictive-maintenance) | Predictive maintenance | 1k+ | Python | TPM integration |
| [work-order-system](https://github.com/maintenance/work-orders) | Work order management | - | TypeScript | Maintenance scheduling |

---

## MCP Servers

### Operations-Specific MCP Servers

| MCP Server | Description | Capabilities | Relevance |
|------------|-------------|--------------|-----------|
| **mcp-server-time** | Time and scheduling operations | Timer management, scheduling | Kaizen event scheduling, audit calendars |
| **mcp-server-fetch** | HTTP request handling | API integration | ERP/MES system connectivity |
| **mcp-server-filesystem** | File system operations | Document management | QMS documentation, work instructions |
| **mcp-server-postgres** | PostgreSQL database | Operational data storage | Quality metrics, production data |
| **mcp-server-sqlite** | SQLite database | Local data management | Audit records, improvement tracking |

### Analytics and Visualization MCP Servers

| MCP Server | Description | Capabilities | Relevance |
|------------|-------------|--------------|-----------|
| **mcp-server-prometheus** | Prometheus metrics | Time series metrics | OEE tracking, SPC data |
| **mcp-server-grafana** | Grafana integration | Dashboard management | Operational dashboards |
| **mcp-server-influxdb** | InfluxDB time series | High-frequency data | Real-time SPC, OEE |

### Integration MCP Servers

| MCP Server | Description | Capabilities | Relevance |
|------------|-------------|--------------|-----------|
| **mcp-server-slack** | Slack integration | Team communication | Kaizen coordination, alerts |
| **mcp-server-github** | GitHub operations | Version control | Process documentation management |
| **mcp-server-google-drive** | Google Drive access | Document storage | QMS documentation, A3 templates |
| **mcp-server-notion** | Notion integration | Knowledge management | Standard work documentation |

### Data Processing MCP Servers

| MCP Server | Description | Capabilities | Relevance |
|------------|-------------|--------------|-----------|
| **mcp-server-pandas** | Data analysis with Pandas | Statistical computation | SPC analysis, capability studies |
| **mcp-server-jupyter** | Jupyter notebook execution | Analysis notebooks | Root cause analysis, simulations |
| **mcp-server-duckdb** | DuckDB analytics | SQL analytics | Operational data analysis |

---

## Community Resources

### Professional Organizations

| Organization | Website | Relevance |
|--------------|---------|-----------|
| American Society for Quality (ASQ) | [asq.org](https://asq.org) | Six Sigma, quality management standards |
| Association for Manufacturing Excellence (AME) | [ame.org](https://ame.org) | Lean enterprise resources |
| APICS (now ASCM) | [ascm.org](https://www.ascm.org) | Supply chain, operations management |
| Institute of Industrial and Systems Engineers (IISE) | [iise.org](https://www.iise.org) | Industrial engineering practices |
| Theory of Constraints International Certification Organization (TOCICO) | [tocico.org](https://www.tocico.org) | TOC certification and resources |
| Lean Enterprise Institute (LEI) | [lean.org](https://www.lean.org) | Lean thinking and practice |

### Standards Bodies

| Organization | Website | Standards | Relevance |
|--------------|---------|-----------|-----------|
| International Organization for Standardization (ISO) | [iso.org](https://www.iso.org) | ISO 9001, ISO 14001 | QMS implementation |
| Automotive Industry Action Group (AIAG) | [aiag.org](https://www.aiag.org) | APQP, PPAP, FMEA, MSA, SPC | Automotive quality tools |
| International Electrotechnical Commission (IEC) | [iec.ch](https://www.iec.ch) | IEC 62264 | Manufacturing systems integration |
| MESA International | [mesa.org](https://www.mesa.org) | ISA-95 | MES standards |

### Online Learning Platforms

| Platform | URL | Topics | Relevance |
|----------|-----|--------|-----------|
| Lean Six Sigma Institute | [leansixsigmainstitute.org](https://www.leansixsigmainstitute.org) | Lean Six Sigma certification | DMAIC, SPC, capability |
| Coursera | [coursera.org](https://www.coursera.org) | Operations management courses | Comprehensive operations education |
| edX | [edx.org](https://www.edx.org) | MIT operations courses | Academic operations research |
| Udemy | [udemy.com](https://www.udemy.com) | Practical operations courses | Hands-on tools training |
| LinkedIn Learning | [linkedin.com/learning](https://www.linkedin.com/learning) | Professional development | Lean, Six Sigma, quality |

### Knowledge Bases and Wikis

| Resource | URL | Focus | Relevance |
|----------|-----|-------|-----------|
| iSixSigma | [isixsigma.com](https://www.isixsigma.com) | Six Sigma methodology | DMAIC, SPC, root cause |
| Lean Manufacturing Tools | [leanmanufacturingtools.org](https://www.leanmanufacturingtools.org) | Lean tools and techniques | VSM, 5S, kanban, standard work |
| Quality Digest | [qualitydigest.com](https://www.qualitydigest.com) | Quality management news | Industry best practices |
| Industry Week | [industryweek.com](https://www.industryweek.com) | Manufacturing news | Operations trends |
| APQC (American Productivity & Quality Center) | [apqc.org](https://www.apqc.org) | Benchmarking | Process benchmarking data |

### Open Source Communities

| Community | Platform | Focus | Relevance |
|-----------|----------|-------|-----------|
| Process Mining Community | [processmining.org](https://processmining.org) | Process mining tools | Value stream analysis |
| Operations Research Stack Exchange | [or.stackexchange.com](https://or.stackexchange.com) | OR algorithms | Scheduling optimization |
| Quality Forums (ASQ) | [asq.org/communities](https://asq.org/communities) | Quality discussions | Quality tool implementation |
| Reddit r/leansixsigma | [reddit.com/r/leansixsigma](https://www.reddit.com/r/leansixsigma) | Lean Six Sigma | Practical implementation |
| Reddit r/supplychain | [reddit.com/r/supplychain](https://www.reddit.com/r/supplychain) | Supply chain operations | S&OP, capacity planning |

---

## Software Tools and Platforms

### Statistical Analysis Software

| Software | Type | URL | Relevance |
|----------|------|-----|-----------|
| Minitab | Commercial | [minitab.com](https://www.minitab.com) | SPC, capability, DOE, Gage R&R |
| JMP | Commercial | [jmp.com](https://www.jmp.com) | Statistical analysis |
| R + RStudio | Open Source | [rstudio.com](https://www.rstudio.com) | Statistical computing |
| Python + SciPy | Open Source | [scipy.org](https://scipy.org) | Scientific computing |
| JASP | Open Source | [jasp-stats.org](https://jasp-stats.org) | Statistical analysis GUI |

### Process Mining Tools

| Software | Type | URL | Relevance |
|----------|------|-----|-----------|
| Celonis | Commercial | [celonis.com](https://www.celonis.com) | Enterprise process mining |
| ProM | Open Source | [promtools.org](https://promtools.org) | Process mining framework |
| Disco | Commercial | [fluxicon.com/disco](https://fluxicon.com/disco) | Process discovery |
| ARIS | Commercial | [softwareag.com](https://www.softwareag.com) | Process modeling and analysis |

### Simulation Software

| Software | Type | URL | Relevance |
|----------|------|-----|-----------|
| AnyLogic | Commercial | [anylogic.com](https://www.anylogic.com) | Multi-method simulation |
| FlexSim | Commercial | [flexsim.com](https://www.flexsim.com) | Manufacturing simulation |
| Arena | Commercial | [rockwellautomation.com](https://www.rockwellautomation.com) | Discrete event simulation |
| Simio | Commercial | [simio.com](https://www.simio.com) | Simulation and scheduling |
| SimPy | Open Source | [simpy.readthedocs.io](https://simpy.readthedocs.io) | Python simulation library |

### Quality Management Software

| Software | Type | URL | Relevance |
|----------|------|-----|-----------|
| ETQ Reliance | Commercial | [etq.com](https://www.etq.com) | Enterprise QMS |
| MasterControl | Commercial | [mastercontrol.com](https://www.mastercontrol.com) | Quality and compliance |
| Qualio | Commercial | [qualio.com](https://www.qualio.com) | Cloud QMS |
| Greenlight Guru | Commercial | [greenlight.guru](https://www.greenlight.guru) | Medical device QMS |

### ERP/MES Integration

| Software | Type | URL | Relevance |
|----------|------|-----|-----------|
| SAP S/4HANA | Commercial | [sap.com](https://www.sap.com) | Enterprise resource planning |
| Oracle Cloud | Commercial | [oracle.com](https://www.oracle.com) | Cloud ERP |
| Microsoft Dynamics 365 | Commercial | [microsoft.com](https://www.microsoft.com) | Business applications |
| Odoo | Open Source | [odoo.com](https://www.odoo.com) | Open source ERP |
| ERPNext | Open Source | [erpnext.com](https://erpnext.com) | Manufacturing ERP |

### Planning and Scheduling

| Software | Type | URL | Relevance |
|----------|------|-----|-----------|
| Kinaxis RapidResponse | Commercial | [kinaxis.com](https://www.kinaxis.com) | S&OP, supply planning |
| o9 Solutions | Commercial | [o9solutions.com](https://www.o9solutions.com) | AI-powered planning |
| Blue Yonder | Commercial | [blueyonder.com](https://blueyonder.com) | Supply chain planning |
| PlanetTogether | Commercial | [planettogether.com](https://www.planettogether.com) | Production scheduling |

---

## API References

### Data Analysis APIs

| API | Documentation | Use Case |
|-----|---------------|----------|
| SciPy Statistics | [docs.scipy.org/doc/scipy/reference/stats.html](https://docs.scipy.org/doc/scipy/reference/stats.html) | Statistical functions |
| Statsmodels | [statsmodels.org/stable/api.html](https://www.statsmodels.org/stable/api.html) | Statistical modeling |
| NumPy | [numpy.org/doc/stable/reference](https://numpy.org/doc/stable/reference) | Numerical computing |
| Pandas | [pandas.pydata.org/docs/reference](https://pandas.pydata.org/docs/reference) | Data manipulation |

### Visualization APIs

| API | Documentation | Use Case |
|-----|---------------|----------|
| Plotly Python | [plotly.com/python](https://plotly.com/python) | Interactive charts |
| Matplotlib | [matplotlib.org/stable/api](https://matplotlib.org/stable/api) | Static visualizations |
| Bokeh | [docs.bokeh.org/en/latest/docs/reference.html](https://docs.bokeh.org/en/latest/docs/reference.html) | Web-based visualization |
| Altair | [altair-viz.github.io](https://altair-viz.github.io) | Declarative visualization |

### Optimization APIs

| API | Documentation | Use Case |
|-----|---------------|----------|
| OR-Tools | [developers.google.com/optimization](https://developers.google.com/optimization) | Constraint programming |
| Pyomo | [pyomo.readthedocs.io](https://pyomo.readthedocs.io) | Optimization modeling |
| PuLP | [coin-or.github.io/pulp](https://coin-or.github.io/pulp) | Linear programming |
| CVXPY | [cvxpy.org](https://www.cvxpy.org) | Convex optimization |

### ERP Integration APIs

| API | Documentation | Use Case |
|-----|---------------|----------|
| SAP Business API Hub | [api.sap.com](https://api.sap.com) | SAP integration |
| Oracle REST APIs | [docs.oracle.com/en/cloud/saas](https://docs.oracle.com/en/cloud/saas) | Oracle Cloud integration |
| Microsoft Dynamics 365 | [docs.microsoft.com/en-us/dynamics365](https://docs.microsoft.com/en-us/dynamics365) | Dynamics integration |
| Odoo External API | [odoo.com/documentation](https://www.odoo.com/documentation) | Odoo integration |

---

## Implementation Templates

### Lean Templates

| Template | Format | Source | Use Case |
|----------|--------|--------|----------|
| Value Stream Map Template | Visio/Lucidchart | LEI | Current/future state mapping |
| 5S Audit Checklist | Excel/PDF | AME | Workplace organization audit |
| Kaizen Event Charter | Word/PDF | LEI | Rapid improvement planning |
| Standard Work Combination Sheet | Excel | LEI | Work element documentation |
| A3 Problem Solving | PowerPoint/PDF | LEI | Structured problem solving |

### Six Sigma Templates

| Template | Format | Source | Use Case |
|----------|--------|--------|----------|
| DMAIC Project Charter | Word/Excel | ASQ | Project definition |
| SIPOC Diagram | PowerPoint | iSixSigma | Process overview |
| Control Chart Templates | Excel/Minitab | AIAG | SPC implementation |
| Process Capability Report | Minitab/Excel | AIAG | Capability analysis |
| Gage R&R Study | Minitab/Excel | AIAG | MSA studies |
| FMEA Template | Excel | AIAG | Failure mode analysis |

### Quality Templates

| Template | Format | Source | Use Case |
|----------|--------|--------|----------|
| ISO 9001 Gap Assessment | Excel | ISO | QMS implementation |
| Internal Audit Checklist | Excel/Word | ASQ | Quality audits |
| Corrective Action Request | Word/PDF | ASQ | Nonconformance management |
| Management Review Agenda | Word | ISO | QMS review |
| Cost of Quality Worksheet | Excel | ASQ | COQ tracking |

### Planning Templates

| Template | Format | Source | Use Case |
|----------|--------|--------|----------|
| Capacity Planning Worksheet | Excel | APICS | Capacity requirements |
| S&OP Planning Template | Excel | APICS | Demand-supply balancing |
| Demand Forecast Template | Excel | APICS | Forecast management |
| Production Schedule | Excel | APICS | Schedule management |

---

## Books and Publications

### Lean Operations

| Title | Author | Publisher | ISBN |
|-------|--------|-----------|------|
| Learning to See | Rother & Shook | Lean Enterprise Institute | 978-0966784305 |
| Toyota Production System | Taiichi Ohno | Productivity Press | 978-0915299140 |
| The Machine That Changed the World | Womack, Jones & Roos | Free Press | 978-0743299794 |
| Lean Thinking | Womack & Jones | Free Press | 978-0743249270 |
| Creating a Lean Culture | David Mann | Productivity Press | 978-1482243239 |

### Six Sigma

| Title | Author | Publisher | ISBN |
|-------|--------|-----------|------|
| The Six Sigma Way | Pande, Neuman & Cavanagh | McGraw-Hill | 978-0071497329 |
| Statistical Quality Control | Montgomery | Wiley | 978-1118146811 |
| Lean Six Sigma | George, Rowlands & Kastle | McGraw-Hill | 978-0071385213 |
| Six Sigma Handbook | Pyzdek & Keller | McGraw-Hill | 978-0071840538 |

### Theory of Constraints

| Title | Author | Publisher | ISBN |
|-------|--------|-----------|------|
| The Goal | Eliyahu Goldratt | North River Press | 978-0884271956 |
| Critical Chain | Eliyahu Goldratt | North River Press | 978-0884271536 |
| Theory of Constraints Handbook | Cox & Schleier | McGraw-Hill | 978-0071665544 |
| Velocity | Goldratt & Cox | North River Press | 978-0884272045 |

### Quality Management

| Title | Author | Publisher | ISBN |
|-------|--------|-----------|------|
| Juran's Quality Handbook | Juran & De Feo | McGraw-Hill | 978-0071629737 |
| Quality Management for Organizational Excellence | Goetsch & Davis | Pearson | 978-0133791853 |
| ISO 9001:2015 Explained | Cianfrani & West | ASQ | 978-0873899314 |

### Operations Management

| Title | Author | Publisher | ISBN |
|-------|--------|-----------|------|
| Operations Management | Heizer, Render & Munson | Pearson | 978-0134130422 |
| Factory Physics | Hopp & Spearman | Waveland Press | 978-1577667391 |
| Production and Operations Analysis | Nahmias & Olsen | Waveland Press | 978-1478628248 |

---

## Certification Programs

### Lean Certifications

| Certification | Organization | Levels | Relevance |
|---------------|--------------|--------|-----------|
| Lean Practitioner | AME | Bronze, Silver, Gold | Lean transformation |
| Lean Leader | Lean Enterprise Institute | Fundamentals, Advanced | Lean leadership |
| Shingo Prize | Shingo Institute | Examiner certification | Operational excellence |

### Six Sigma Certifications

| Certification | Organization | Levels | Relevance |
|---------------|--------------|--------|-----------|
| Six Sigma | ASQ | Yellow, Green, Black Belt | DMAIC methodology |
| Lean Six Sigma | IASSC | Yellow, Green, Black Belt | Combined Lean Six Sigma |
| Six Sigma | Council for Six Sigma | Yellow, Green, Black, MBB | Industry recognition |

### Quality Certifications

| Certification | Organization | Levels | Relevance |
|---------------|--------------|--------|-----------|
| Certified Quality Engineer (CQE) | ASQ | Single level | Quality engineering |
| Certified Quality Manager (CMQ/OE) | ASQ | Single level | Quality management |
| Certified Quality Auditor (CQA) | ASQ | Single level | Quality auditing |
| ISO 9001 Lead Auditor | Various | Single level | QMS auditing |

### Operations Certifications

| Certification | Organization | Levels | Relevance |
|---------------|--------------|--------|-----------|
| CPIM | APICS/ASCM | Part 1, Part 2 | Production and inventory |
| CSCP | APICS/ASCM | Single level | Supply chain |
| CLTD | APICS/ASCM | Single level | Logistics |
| TOCICO | TOCICO | Various levels | Theory of Constraints |

---

## Notes

- Repository links may require verification as open source projects evolve
- Commercial software links are for reference; evaluate licensing requirements
- MCP server availability depends on ecosystem development
- Template sources may require membership or purchase
- Certification requirements change; verify with issuing organizations
- API documentation versions should be checked for compatibility
- Community resources are community-maintained and may vary in quality
- Integration capabilities depend on specific system configurations

---

*Last Updated: January 2026*
