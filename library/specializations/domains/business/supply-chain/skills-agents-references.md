# Supply Chain Management - Skills and Agents References (Phase 5)

## Overview

This document provides references to GitHub repositories, MCP servers, community resources, and relevant tools for implementing the skills and agents identified in the Supply Chain Management backlog. These references support the development and integration of domain-specific capabilities for demand forecasting, procurement, inventory management, supplier management, risk management, analytics, logistics, and sustainability.

---

## Demand Forecasting Skills References

### demand-forecasting-engine

#### GitHub Repositories
- **prophet** - https://github.com/facebook/prophet - Time series forecasting by Meta with automatic seasonality detection
- **statsforecast** - https://github.com/Nixtla/statsforecast - Fast statistical forecasting including ARIMA and exponential smoothing
- **darts** - https://github.com/unit8co/darts - Comprehensive time series library with deep learning models
- **sktime** - https://github.com/sktime/sktime - Unified time series machine learning framework
- **neuralforecast** - https://github.com/Nixtla/neuralforecast - Deep learning for time series including LSTM and N-BEATS
- **gluonts** - https://github.com/awslabs/gluonts - Probabilistic time series modeling
- **holt-winters** - https://github.com/topics/holt-winters - Holt-Winters exponential smoothing implementations
- **demand-forecasting** - https://github.com/topics/demand-forecasting - Community demand forecasting projects

#### MCP Servers
- **mcp-sap-ibp** - SAP Integrated Business Planning demand management
- **mcp-kinaxis** - Kinaxis RapidResponse demand planning integration
- **mcp-o9-solutions** - o9 Solutions demand planning platform
- **mcp-blue-yonder** - Blue Yonder (JDA) demand planning connector
- **mcp-oracle-demantra** - Oracle Demantra demand management

#### Community Resources
- Demand Planning & Forecasting (APICS/ASCM) - https://www.ascm.org/
- Institute of Business Forecasting & Planning - https://ibf.org/
- Foresight (International Institute of Forecasters) - https://forecasters.org/
- Supply Chain Digest - https://www.scdigest.com/

---

### demand-sensing-integrator

#### GitHub Repositories
- **apache-kafka** - https://github.com/apache/kafka - Real-time event streaming platform
- **apache-flink** - https://github.com/apache/flink - Stream processing framework
- **confluent-kafka-python** - https://github.com/confluentinc/confluent-kafka-python - Python Kafka client
- **spark-streaming** - https://github.com/apache/spark - Apache Spark for stream processing
- **twitter-sentiment** - https://github.com/topics/sentiment-analysis - Social media sentiment tools
- **weather-api** - https://github.com/topics/weather-api - Weather data integration

#### MCP Servers
- **mcp-pos-data** - Point-of-sale data integration service
- **mcp-syndicated-data** - Nielsen/IRI syndicated data connector
- **mcp-weather** - Weather data integration for demand correlation
- **mcp-social-listening** - Social media sentiment monitoring
- **mcp-economic-indicators** - Economic indicator feeds for demand impact

#### Community Resources
- Consumer Goods Technology - https://consumergoods.com/
- Retail Wire - https://retailwire.com/
- CGT (Consumer Goods Technology) - https://www.consumergoods.com/
- RILA (Retail Industry Leaders Association) - https://www.rila.org/

---

### sop-scenario-modeler

#### GitHub Repositories
- **scipy-optimize** - https://github.com/scipy/scipy - Scientific computing for optimization
- **pulp** - https://github.com/coin-or/pulp - Linear programming in Python
- **pyomo** - https://github.com/Pyomo/pyomo - Python optimization modeling
- **gekko** - https://github.com/BYU-PRISM/GEKKO - Dynamic optimization
- **scenario-planning** - https://github.com/topics/scenario-planning - Scenario modeling tools

#### MCP Servers
- **mcp-kinaxis** - Kinaxis RapidResponse S&OP platform
- **mcp-o9-solutions** - o9 Solutions integrated planning
- **mcp-sap-ibp** - SAP IBP for S&OP process
- **mcp-anaplan** - Anaplan connected planning
- **mcp-board** - Board International planning platform

#### Community Resources
- Oliver Wight S&OP Maturity Model - https://www.oliverwight-americas.com/
- Gartner S&OP Research - https://www.gartner.com/
- APICS S&OP Certification - https://www.ascm.org/
- IBP Collaborative - https://www.ibpcollaborative.org/

---

## Procurement Skills References

### strategic-sourcing-analyzer

#### GitHub Repositories
- **spend-analysis** - https://github.com/topics/spend-analysis - Spend analytics tools
- **commodity-classification** - UNSPSC classification implementations
- **market-analysis** - https://github.com/topics/market-analysis - Market research tools
- **pareto-analysis** - https://github.com/topics/pareto - ABC analysis implementations
- **porter-five-forces** - Strategic framework implementations

#### MCP Servers
- **mcp-ariba** - SAP Ariba procurement platform
- **mcp-coupa** - Coupa procurement suite
- **mcp-jaggaer** - JAGGAER source-to-pay
- **mcp-gep-smart** - GEP SMART procurement
- **mcp-ivalua** - Ivalua procurement platform

#### Community Resources
- ISM (Institute for Supply Management) - https://www.ismworld.org/
- CIPS (Chartered Institute of Procurement & Supply) - https://www.cips.org/
- Procurement Leaders - https://www.procurementleaders.com/
- Spend Matters - https://spendmatters.com/

---

### rfx-document-generator

#### GitHub Repositories
- **docx-python** - https://github.com/python-openxml/python-docx - Word document generation
- **jinja2** - https://github.com/pallets/jinja - Template engine for documents
- **document-generation** - https://github.com/topics/document-generation - Doc generation tools
- **rfp-generator** - https://github.com/topics/rfp - RFP related projects
- **pandoc** - https://github.com/jgm/pandoc - Universal document converter

#### MCP Servers
- **mcp-ariba** - SAP Ariba sourcing events
- **mcp-coupa** - Coupa sourcing module
- **mcp-jaggaer** - JAGGAER strategic sourcing
- **mcp-scout-rfp** - Scout RFP platform
- **mcp-docusign** - DocuSign for contract workflows

#### Community Resources
- NIGP (National Institute of Governmental Purchasing) - https://www.nigp.org/
- RFP Templates Library - https://www.rfp360.com/
- Procurement IQ - https://www.procurementiq.com/
- Public Spend Forum - https://publicspendforum.net/

---

### tco-calculator

#### GitHub Repositories
- **numpy-financial** - https://github.com/numpy/numpy-financial - Financial calculations
- **cost-modeling** - https://github.com/topics/cost-modeling - Cost analysis tools
- **lifecycle-cost** - Total cost of ownership models
- **financial-analysis** - https://github.com/topics/financial-analysis - Financial modeling

#### MCP Servers
- **mcp-spreadsheet** - Excel-based TCO modeling
- **mcp-python** - Python execution for cost calculations
- **mcp-erp-costing** - ERP costing module integration
- **mcp-supplier-data** - Supplier cost data aggregation

#### Community Resources
- ISM Total Cost of Ownership Guide - https://www.ismworld.org/
- APQC Procurement Benchmarks - https://www.apqc.org/
- Supply Chain Council TCO Resources - https://www.apics.org/
- Purchasing & Procurement Center - https://www.purchasing-procurement-center.com/

---

### contract-analyzer

#### GitHub Repositories
- **legal-bert** - https://github.com/nlmatics/nlmatics - Legal NLP models
- **blackstone** - https://github.com/ICLRandD/Blackstone - Legal NLP library
- **contract-analysis** - https://github.com/topics/contract-analysis - Contract analysis tools
- **nlp-legal** - https://github.com/topics/legal-nlp - Legal NLP repositories
- **spacy** - https://github.com/explosion/spaCy - NLP for contract extraction

#### MCP Servers
- **mcp-icertis** - Icertis Contract Intelligence
- **mcp-docusign-clm** - DocuSign CLM
- **mcp-agiloft** - Agiloft contract management
- **mcp-concord** - Concord contract management
- **mcp-ironclad** - Ironclad contract platform

#### Community Resources
- IACCM (International Association for Contract & Commercial Management) - https://www.worldcc.com/
- NCMA (National Contract Management Association) - https://www.ncmahq.org/
- ACC (Association of Corporate Counsel) - https://www.acc.com/
- ContractPodAI Resources - https://contractpodai.com/

---

### category-strategy-builder

#### GitHub Repositories
- **portfolio-optimization** - https://github.com/topics/portfolio-optimization - Portfolio analysis
- **kraljic-matrix** - Kraljic Matrix implementations
- **strategic-analysis** - https://github.com/topics/strategic-analysis - Strategy frameworks
- **clustering** - https://github.com/topics/clustering - Category segmentation algorithms

#### MCP Servers
- **mcp-coupa** - Coupa category management
- **mcp-sievo** - Sievo spend analytics
- **mcp-gep-smart** - GEP category management
- **mcp-synertrade** - SynerTrade procurement intelligence

#### Community Resources
- CIPS Category Management - https://www.cips.org/
- Efficio Category Management - https://www.efficioconsulting.com/
- AT Kearney Procurement Resources - https://www.kearney.com/
- Category Management Association - https://www.cpgcatman.com/

---

## Inventory Skills References

### inventory-optimizer

#### GitHub Repositories
- **scipy-optimize** - https://github.com/scipy/scipy - Optimization algorithms
- **pyomo** - https://github.com/Pyomo/pyomo - Mathematical optimization
- **or-tools** - https://github.com/google/or-tools - Google Operations Research tools
- **inventory-management** - https://github.com/topics/inventory-management - Inventory tools
- **abc-xyz-analysis** - Inventory classification implementations
- **eoq-calculator** - Economic Order Quantity calculators

#### MCP Servers
- **mcp-sap-ewm** - SAP Extended Warehouse Management
- **mcp-oracle-wms** - Oracle Warehouse Management
- **mcp-manhattan-wmos** - Manhattan WMOS
- **mcp-blue-yonder-wms** - Blue Yonder WMS
- **mcp-kinaxis** - Kinaxis inventory optimization

#### Community Resources
- APICS Inventory Management - https://www.ascm.org/
- Warehouse Education and Research Council (WERC) - https://www.werc.org/
- Supply Chain Management Review - https://www.scmr.com/
- CSCMP (Council of Supply Chain Management Professionals) - https://cscmp.org/

---

### safety-stock-calculator

#### GitHub Repositories
- **scipy-stats** - https://github.com/scipy/scipy - Statistical distributions
- **numpy** - https://github.com/numpy/numpy - Numerical computing
- **safety-stock** - https://github.com/topics/safety-stock - Safety stock calculators
- **monte-carlo** - https://github.com/topics/monte-carlo - Monte Carlo simulation
- **service-level** - Service level optimization tools

#### MCP Servers
- **mcp-sap-apo** - SAP APO/IBP safety stock planning
- **mcp-kinaxis** - Kinaxis inventory buffers
- **mcp-o9-solutions** - o9 inventory optimization
- **mcp-llamasoft** - LLamasoft (Coupa) inventory modeling

#### Community Resources
- APICS CPIM Inventory Content - https://www.ascm.org/
- Inventory Optimization Society - https://inventoryoptimization.org/
- MIT Center for Transportation & Logistics - https://ctl.mit.edu/
- Georgia Tech Supply Chain - https://www.scl.gatech.edu/

---

### ddmrp-buffer-manager

#### GitHub Repositories
- **ddmrp** - https://github.com/topics/ddmrp - DDMRP implementations
- **demand-driven-mrp** - Demand-Driven MRP algorithms
- **buffer-management** - Buffer positioning tools
- **decoupling-point** - Strategic decoupling analysis

#### MCP Servers
- **mcp-demand-driven-tech** - Demand Driven Technologies platform
- **mcp-kinaxis** - Kinaxis DDMRP capabilities
- **mcp-sap-ddmrp** - SAP DDMRP module
- **mcp-o9-solutions** - o9 DDMRP implementation
- **mcp-orchestr8** - Orchestr8 DDMRP

#### Community Resources
- Demand Driven Institute - https://www.demanddriveninstitute.com/
- DDMRP Certification Program - https://www.demanddriveninstitute.com/ddpp
- Carol Ptak & Chad Smith DDMRP Books - https://www.demanddriveninstitute.com/
- APICS DDMRP Resources - https://www.ascm.org/

---

## Supplier Management Skills References

### supplier-scorecard-engine

#### GitHub Repositories
- **pandas** - https://github.com/pandas-dev/pandas - Data analysis for scorecards
- **plotly** - https://github.com/plotly/plotly.py - Interactive scorecard visualizations
- **dash** - https://github.com/plotly/dash - Dashboard framework
- **kpi-dashboard** - https://github.com/topics/kpi-dashboard - KPI tracking tools
- **supplier-management** - https://github.com/topics/supplier-management - SRM tools

#### MCP Servers
- **mcp-ariba-slp** - SAP Ariba Supplier Lifecycle & Performance
- **mcp-coupa-srm** - Coupa Supplier Management
- **mcp-jaggaer-srm** - JAGGAER SRM
- **mcp-gep-smart** - GEP Supplier Management
- **mcp-ivalua** - Ivalua Supplier Management

#### Community Resources
- ISM Supplier Management - https://www.ismworld.org/
- Supplier Management Professionals Council - https://smpcouncil.org/
- Procurement Leaders SRM Resources - https://www.procurementleaders.com/
- Gartner Supplier Performance Research - https://www.gartner.com/

---

### vendor-risk-scorer

#### GitHub Repositories
- **risk-scoring** - https://github.com/topics/risk-scoring - Risk scoring algorithms
- **financial-analysis** - https://github.com/topics/financial-analysis - Financial risk tools
- **credit-risk** - https://github.com/topics/credit-risk - Credit risk models
- **geopolitical-risk** - Country risk assessment tools
- **esg-scoring** - https://github.com/topics/esg - ESG risk scoring

#### MCP Servers
- **mcp-dnb** - Dun & Bradstreet supplier risk data
- **mcp-resilinc** - Resilinc supply chain risk platform
- **mcp-ecovadis** - EcoVadis sustainability ratings
- **mcp-riskpulse** - RiskPulse supply chain analytics
- **mcp-interos** - Interos relationship intelligence

#### Community Resources
- SCRLC (Supply Chain Risk Leadership Council) - https://www.scrlc.com/
- Business Continuity Institute - https://www.thebci.org/
- RIMS (Risk Management Society) - https://www.rims.org/
- Supply Chain Risk Management Consortium - https://www.supplychainrisk.com/

---

### supplier-development-planner

#### GitHub Repositories
- **project-management** - https://github.com/topics/project-management - PM tools
- **continuous-improvement** - https://github.com/topics/continuous-improvement - CI frameworks
- **lean-six-sigma** - https://github.com/topics/lean-six-sigma - Process improvement
- **capability-maturity** - Capability assessment models

#### MCP Servers
- **mcp-ariba** - SAP Ariba supplier development
- **mcp-coupa** - Coupa supplier collaboration
- **mcp-jaggaer** - JAGGAER supplier development
- **mcp-smartsheet** - Smartsheet project tracking
- **mcp-monday** - Monday.com milestone tracking

#### Community Resources
- ISM Supplier Development - https://www.ismworld.org/
- ASQ (American Society for Quality) - https://asq.org/
- APICS Supplier Development - https://www.ascm.org/
- Lean Enterprise Institute - https://www.lean.org/

---

### qbr-preparation-assistant

#### GitHub Repositories
- **powerpoint-python** - https://github.com/scanny/python-pptx - PowerPoint generation
- **data-visualization** - https://github.com/topics/data-visualization - Visualization tools
- **report-generation** - https://github.com/topics/report-generation - Report automation
- **meeting-management** - https://github.com/topics/meeting - Meeting tools

#### MCP Servers
- **mcp-powerpoint** - PowerPoint automation
- **mcp-google-slides** - Google Slides integration
- **mcp-tableau** - Tableau for QBR visualizations
- **mcp-power-bi** - Power BI reporting
- **mcp-crm** - CRM relationship data

#### Community Resources
- IACCM QBR Best Practices - https://www.worldcc.com/
- Procurement Leaders Supplier Reviews - https://www.procurementleaders.com/
- Strategic Supplier Reviews Guide - https://www.ismworld.org/
- Business Review Templates - https://www.smartsheet.com/

---

### supplier-onboarding-orchestrator

#### GitHub Repositories
- **workflow-automation** - https://github.com/topics/workflow-automation - Workflow tools
- **document-management** - https://github.com/topics/document-management - Document handling
- **onboarding** - https://github.com/topics/onboarding - Onboarding frameworks
- **kyc** - https://github.com/topics/kyc - Know Your Customer/Supplier

#### MCP Servers
- **mcp-ariba-slp** - SAP Ariba supplier onboarding
- **mcp-coupa** - Coupa supplier onboarding
- **mcp-jaggaer** - JAGGAER supplier registration
- **mcp-tealbook** - TealBook supplier data
- **mcp-docusign** - DocuSign for onboarding docs

#### Community Resources
- ISM Supplier Qualification - https://www.ismworld.org/
- CIPS Supplier Onboarding - https://www.cips.org/
- Supplier.io Resources - https://supplier.io/
- Thomas Network - https://www.thomasnet.com/

---

## Risk Management Skills References

### supply-chain-risk-assessor

#### GitHub Repositories
- **risk-assessment** - https://github.com/topics/risk-assessment - Risk assessment tools
- **fmea** - https://github.com/topics/fmea - Failure Mode Effects Analysis
- **risk-matrix** - https://github.com/topics/risk-matrix - Risk matrix implementations
- **bow-tie-analysis** - Bow-tie risk analysis tools
- **monte-carlo-risk** - Monte Carlo risk simulation

#### MCP Servers
- **mcp-resilinc** - Resilinc risk intelligence
- **mcp-riskpulse** - RiskPulse analytics
- **mcp-everstream** - Everstream Analytics risk platform
- **mcp-interos** - Interos supply chain risk
- **mcp-riskmethods** - riskmethods GmbH platform

#### Community Resources
- Supply Chain Risk Management Consortium - https://www.supplychainrisk.com/
- SCRLC (Supply Chain Risk Leadership Council) - https://www.scrlc.com/
- ISO 31000 Risk Management - https://www.iso.org/
- APICS Risk Management - https://www.ascm.org/

---

### early-warning-monitor

#### GitHub Repositories
- **news-api** - https://github.com/topics/news-api - News aggregation APIs
- **sentiment-analysis** - https://github.com/topics/sentiment-analysis - Sentiment tools
- **anomaly-detection** - https://github.com/topics/anomaly-detection - Anomaly detection
- **alerting** - https://github.com/topics/alerting - Alert management systems
- **event-detection** - https://github.com/topics/event-detection - Event monitoring

#### MCP Servers
- **mcp-resilinc** - Resilinc EventWatch monitoring
- **mcp-riskpulse** - RiskPulse alerts
- **mcp-dnb** - Dun & Bradstreet risk alerts
- **mcp-nc4** - NC4 risk monitoring
- **mcp-prewave** - Prewave risk monitoring

#### Community Resources
- BCI Supply Chain Resilience - https://www.thebci.org/
- SCRM (Supply Chain Risk Management) Forums - https://www.scmr.com/
- MIT CTL Resilience Research - https://ctl.mit.edu/
- World Economic Forum Supply Chain Risk - https://www.weforum.org/

---

### contingency-plan-builder

#### GitHub Repositories
- **business-continuity** - https://github.com/topics/business-continuity - BCP tools
- **disaster-recovery** - https://github.com/topics/disaster-recovery - DR planning
- **scenario-planning** - https://github.com/topics/scenario-planning - Scenario tools
- **playbook** - https://github.com/topics/playbook - Response playbooks
- **documentation** - https://github.com/topics/documentation - Plan documentation

#### MCP Servers
- **mcp-fusion-risk** - Fusion Risk Management BCP
- **mcp-castellan** - Castellan business continuity
- **mcp-archer** - RSA Archer risk platform
- **mcp-servicenow-bcm** - ServiceNow BCM

#### Community Resources
- Business Continuity Institute - https://www.thebci.org/
- DRI International - https://drii.org/
- ISO 22301 Business Continuity - https://www.iso.org/
- FEMA Business Continuity - https://www.fema.gov/

---

### disruption-response-coordinator

#### GitHub Repositories
- **incident-management** - https://github.com/topics/incident-management - Incident tools
- **crisis-management** - https://github.com/topics/crisis-management - Crisis frameworks
- **communication** - https://github.com/topics/communication - Communication tools
- **war-room** - Command center coordination tools
- **status-page** - https://github.com/topics/status-page - Status communication

#### MCP Servers
- **mcp-pagerduty** - PagerDuty incident management
- **mcp-opsgenie** - Opsgenie alerting
- **mcp-servicenow-itsm** - ServiceNow incident management
- **mcp-statuspage** - Statuspage.io communication
- **mcp-slack** - Slack coordination

#### Community Resources
- Gartner Supply Chain Disruption Research - https://www.gartner.com/
- Supply Chain Dive - https://www.supplychaindive.com/
- SCMR Disruption Resources - https://www.scmr.com/
- McKinsey Supply Chain Resilience - https://www.mckinsey.com/

---

## Analytics Skills References

### scor-kpi-dashboard-builder

#### GitHub Repositories
- **dash** - https://github.com/plotly/dash - Dashboard framework
- **streamlit** - https://github.com/streamlit/streamlit - Data app framework
- **grafana** - https://github.com/grafana/grafana - Analytics visualization
- **apache-superset** - https://github.com/apache/superset - BI platform
- **metabase** - https://github.com/metabase/metabase - Open-source BI

#### MCP Servers
- **mcp-power-bi** - Microsoft Power BI
- **mcp-tableau** - Tableau visualization
- **mcp-looker** - Looker analytics
- **mcp-qlik** - Qlik Sense analytics
- **mcp-domo** - Domo BI platform

#### Community Resources
- ASCM SCOR Model - https://www.ascm.org/
- APQC Supply Chain Benchmarks - https://www.apqc.org/
- Supply Chain Council - https://cscmp.org/
- Gartner Supply Chain KPIs - https://www.gartner.com/

---

### spend-analytics-engine

#### GitHub Repositories
- **pandas** - https://github.com/pandas-dev/pandas - Data manipulation
- **scikit-learn** - https://github.com/scikit-learn/scikit-learn - ML for classification
- **text-classification** - https://github.com/topics/text-classification - Spend classification
- **clustering** - https://github.com/topics/clustering - Supplier clustering
- **unspsc** - UNSPSC classification tools

#### MCP Servers
- **mcp-sievo** - Sievo spend analytics
- **mcp-coupa-analytics** - Coupa Spend Guard
- **mcp-sap-ariba-spend** - SAP Ariba Spend Analysis
- **mcp-jaggaer-analytics** - JAGGAER Analytics
- **mcp-per-angusta** - Per Angusta procurement analytics

#### Community Resources
- CAPS Research - https://www.capsresearch.org/
- ISM Spend Analysis - https://www.ismworld.org/
- Spend Matters Analytics - https://spendmatters.com/
- Procurement Analytics Forum - https://www.procurementleaders.com/

---

### cost-to-serve-analyzer

#### GitHub Repositories
- **activity-based-costing** - https://github.com/topics/costing - ABC costing tools
- **profitability-analysis** - https://github.com/topics/profitability - Profitability tools
- **cost-allocation** - Cost allocation algorithms
- **financial-modeling** - https://github.com/topics/financial-modeling - Cost modeling

#### MCP Servers
- **mcp-sap-co** - SAP Controlling for cost allocation
- **mcp-oracle-cost** - Oracle costing modules
- **mcp-anaplan** - Anaplan cost modeling
- **mcp-coupa-analytics** - Coupa cost analysis
- **mcp-llamasoft** - LLamasoft cost modeling

#### Community Resources
- APQC Cost Benchmarking - https://www.apqc.org/
- CSCMP Cost-to-Serve Research - https://cscmp.org/
- Gartner Cost Optimization - https://www.gartner.com/
- MIT CTL Cost Research - https://ctl.mit.edu/

---

### forecast-accuracy-analyzer

#### GitHub Repositories
- **forecast-metrics** - https://github.com/topics/forecast - Forecast accuracy tools
- **mape** - Mean Absolute Percentage Error calculators
- **bias-detection** - Forecast bias analysis
- **error-analysis** - https://github.com/topics/error-analysis - Error decomposition
- **fva** - Forecast Value Add analysis

#### MCP Servers
- **mcp-sap-ibp** - SAP IBP forecast analytics
- **mcp-kinaxis** - Kinaxis forecast accuracy
- **mcp-o9-solutions** - o9 forecast analytics
- **mcp-blue-yonder** - Blue Yonder accuracy tracking

#### Community Resources
- IBF Forecast Accuracy - https://ibf.org/
- Foresight Practitioner Journal - https://forecasters.org/
- APICS Forecast Metrics - https://www.ascm.org/
- Forecast Pro Resources - https://www.forecastpro.com/

---

## Logistics Skills References

### network-optimization-modeler

#### GitHub Repositories
- **or-tools** - https://github.com/google/or-tools - Google OR Tools for optimization
- **cplex-python** - IBM CPLEX Python interface
- **gurobi** - https://github.com/topics/gurobi - Gurobi optimization
- **pyomo** - https://github.com/Pyomo/pyomo - Python optimization
- **pulp** - https://github.com/coin-or/pulp - Linear programming
- **networkx** - https://github.com/networkx/networkx - Network analysis

#### MCP Servers
- **mcp-llamasoft** - LLamasoft (Coupa) network design
- **mcp-anylogistix** - anyLogistix network optimization
- **mcp-optilogic** - Optilogic Cosmic Frog
- **mcp-log-hub** - Log-hub network design
- **mcp-coupa-design** - Coupa supply chain design

#### Community Resources
- INFORMS (Operations Research) - https://www.informs.org/
- CSCMP Network Design - https://cscmp.org/
- MIT Scale Network Design - https://scale.mit.edu/
- Georgia Tech Optimization Research - https://www.isye.gatech.edu/

---

### capacity-constraint-analyzer

#### GitHub Repositories
- **theory-of-constraints** - https://github.com/topics/theory-of-constraints - TOC implementations
- **bottleneck-analysis** - Constraint identification tools
- **scheduling** - https://github.com/topics/scheduling - Scheduling algorithms
- **capacity-planning** - https://github.com/topics/capacity-planning - Capacity tools
- **goldratt-toc** - Theory of Constraints frameworks

#### MCP Servers
- **mcp-sap-pp** - SAP Production Planning
- **mcp-oracle-scm** - Oracle SCM capacity planning
- **mcp-kinaxis** - Kinaxis capacity planning
- **mcp-o9-solutions** - o9 capacity optimization
- **mcp-preactor** - Preactor APS (Siemens)

#### Community Resources
- TOC World Conference - https://www.tocico.org/
- APICS Capacity Planning - https://www.ascm.org/
- Theory of Constraints Institute - https://www.goldratt.com/
- Lean Production Resources - https://www.lean.org/

---

## Sustainability Skills References

### sustainable-procurement-assessor

#### GitHub Repositories
- **esg-scoring** - https://github.com/topics/esg - ESG scoring tools
- **sustainability-metrics** - https://github.com/topics/sustainability - Sustainability analysis
- **carbon-footprint** - https://github.com/topics/carbon-footprint - Carbon calculation
- **circular-economy** - https://github.com/topics/circular-economy - Circularity tools
- **gri-reporting** - GRI standards implementation

#### MCP Servers
- **mcp-ecovadis** - EcoVadis sustainability ratings
- **mcp-sedex** - Sedex ethical supply chain
- **mcp-cdp** - CDP carbon disclosure
- **mcp-sustainalytics** - Sustainalytics ESG data
- **mcp-iss-esg** - ISS ESG ratings

#### Community Resources
- UN Global Compact - https://www.unglobalcompact.org/
- CDP (Carbon Disclosure Project) - https://www.cdp.net/
- Science Based Targets - https://sciencebasedtargets.org/
- Responsible Business Alliance - https://www.responsiblebusiness.org/
- EcoVadis Academy - https://ecovadis.com/

---

## Cross-Functional Skills References

### supply-chain-visibility-integrator

#### GitHub Repositories
- **edi-parser** - https://github.com/topics/edi - EDI processing tools
- **api-integration** - https://github.com/topics/api-integration - API connectors
- **event-streaming** - https://github.com/topics/event-streaming - Event processing
- **tracking** - https://github.com/topics/tracking - Shipment tracking
- **data-integration** - https://github.com/topics/data-integration - ETL tools

#### MCP Servers
- **mcp-project44** - project44 visibility platform
- **mcp-fourkites** - FourKites visibility
- **mcp-transporeon** - Transporeon visibility
- **mcp-e2open** - E2open visibility
- **mcp-blujay** - BluJay Solutions visibility

#### Community Resources
- Visibility Consortium - https://www.project44.com/
- CSCMP Visibility Research - https://cscmp.org/
- Gartner Control Tower Research - https://www.gartner.com/
- Supply Chain Visibility Forum - https://www.scmr.com/

---

### procurement-automation-orchestrator

#### GitHub Repositories
- **robocorp** - https://github.com/robocorp/robocorp - RPA framework
- **rpa-framework** - https://github.com/robocorp/rpa-framework - RPA tools
- **workflow** - https://github.com/topics/workflow - Workflow automation
- **automation** - https://github.com/topics/automation - Automation tools
- **uipath** - https://github.com/topics/uipath - UiPath integrations

#### MCP Servers
- **mcp-uipath** - UiPath RPA
- **mcp-automation-anywhere** - Automation Anywhere
- **mcp-power-automate** - Microsoft Power Automate
- **mcp-workato** - Workato integration platform
- **mcp-servicenow** - ServiceNow workflow

#### Community Resources
- IRPA (Institute for Robotic Process Automation) - https://irpaai.com/
- UiPath Academy - https://academy.uipath.com/
- Automation Anywhere University - https://university.automationanywhere.com/
- Procurement Automation Forum - https://www.procurementleaders.com/

---

### supply-chain-simulation-engine

#### GitHub Repositories
- **simpy** - https://github.com/topics/simpy - Discrete event simulation
- **anylogic** - https://github.com/topics/anylogic - Agent-based simulation
- **mesa** - https://github.com/projectmesa/mesa - Agent-based modeling
- **salabim** - https://github.com/salabim/salabim - Discrete event simulation
- **ciw** - https://github.com/CiwPython/Ciw - Queueing network simulation

#### MCP Servers
- **mcp-anylogic** - AnyLogic simulation
- **mcp-simul8** - SIMUL8 simulation
- **mcp-flexsim** - FlexSim simulation
- **mcp-llamasoft-sim** - LLamasoft simulation
- **mcp-arena** - Arena simulation

#### Community Resources
- INFORMS Simulation Society - https://www.informs-sim.org/
- Winter Simulation Conference - https://www.wintersim.org/
- Simulation Society - https://www.scs.org/
- AnyLogic Resources - https://www.anylogic.com/

---

### master-data-quality-manager

#### GitHub Repositories
- **great-expectations** - https://github.com/great-expectations/great_expectations - Data quality
- **pandas-profiling** - https://github.com/ydataai/ydata-profiling - Data profiling
- **data-quality** - https://github.com/topics/data-quality - Data quality tools
- **dedupe** - https://github.com/dedupeio/dedupe - Duplicate detection
- **cleanlab** - https://github.com/cleanlab/cleanlab - Data cleaning ML

#### MCP Servers
- **mcp-sap-mdg** - SAP Master Data Governance
- **mcp-informatica-mdm** - Informatica MDM
- **mcp-talend-mdm** - Talend MDM
- **mcp-stibo-step** - Stibo Systems STEP
- **mcp-reltio** - Reltio MDM

#### Community Resources
- DAMA International - https://www.dama.org/
- Data Management Association - https://www.dama.org/
- Gartner MDM Research - https://www.gartner.com/
- MDM Institute - https://www.tcdii.com/

---

### supply-chain-digital-twin

#### GitHub Repositories
- **digital-twin** - https://github.com/topics/digital-twin - Digital twin frameworks
- **simulation** - https://github.com/topics/simulation - Simulation engines
- **iot** - https://github.com/topics/iot - IoT integration
- **machine-learning** - https://github.com/topics/machine-learning - ML models
- **predictive-analytics** - https://github.com/topics/predictive-analytics - Predictive tools

#### MCP Servers
- **mcp-azure-digital-twins** - Azure Digital Twins
- **mcp-aws-twinmaker** - AWS IoT TwinMaker
- **mcp-siemens-mindsphere** - Siemens MindSphere
- **mcp-ge-predix** - GE Predix
- **mcp-ptc-thingworx** - PTC ThingWorx

#### Community Resources
- Digital Twin Consortium - https://www.digitaltwinconsortium.org/
- Gartner Digital Twin Research - https://www.gartner.com/
- Industrial Digital Twin Association - https://industrialdigitaltwin.org/
- IoT World Congress - https://www.iotsworldcongress.com/

---

## Agent References

### Planning Agents

#### demand-planner
- **Planning Software**: SAP IBP, Kinaxis RapidResponse, o9 Solutions, Blue Yonder
- **Forecasting Tools**: Prophet, statsforecast, darts, ForecastPro
- **Learning Resources**: IBF CPF Certification, APICS CPIM
- **Communities**: IBF Network, APICS Supply Chain Council

#### sop-coordinator
- **S&OP Platforms**: Kinaxis, o9, SAP IBP, Anaplan, Board
- **Collaboration Tools**: Microsoft Teams, Smartsheet, Monday.com
- **Certifications**: APICS CSCP, Oliver Wight S&OP
- **Resources**: Oliver Wight S&OP, Gartner S&OP

#### supply-chain-network-designer
- **Optimization Tools**: LLamasoft, anyLogistix, Optilogic, OR-Tools
- **Modeling Software**: CPLEX, Gurobi, AIMMS
- **Certifications**: INFORMS CAP, APICS CSCP
- **Resources**: MIT Scale, Georgia Tech Optimization

#### capacity-planner
- **APS Platforms**: SAP PP/DS, Oracle SCM, Kinaxis, Preactor
- **TOC Resources**: Goldratt Institute, TOCICO
- **Certifications**: APICS CPIM, TOCICO
- **Resources**: Theory of Constraints Institute

---

### Procurement Agents

#### strategic-sourcing-manager
- **Sourcing Platforms**: SAP Ariba, Coupa, JAGGAER, GEP SMART
- **Market Intelligence**: Beroe, SpendEdge, Gartner
- **Certifications**: CPSM (ISM), MCIPS (CIPS)
- **Resources**: ISM, CIPS, Procurement Leaders

#### procurement-analyst
- **Analytics Platforms**: Sievo, Coupa Analytics, SAP Ariba Spend Analysis
- **BI Tools**: Power BI, Tableau, Looker
- **Certifications**: CPSM, CPSA
- **Resources**: CAPS Research, APQC

#### contract-manager
- **CLM Platforms**: Icertis, DocuSign CLM, Agiloft, Ironclad
- **Legal Tech**: LegalSifter, Luminance, Kira
- **Certifications**: CCCM (NCMA), CPCM
- **Resources**: WorldCC (IACCM), NCMA

#### category-manager
- **Category Tools**: Coupa, GEP, Sievo
- **Frameworks**: Kraljic Matrix, Category Management
- **Certifications**: CPSM, Category Management Practitioner
- **Resources**: CIPS Category Management, AT Kearney

---

### Inventory Agents

#### inventory-optimizer-agent
- **Optimization Platforms**: Kinaxis, o9, Blue Yonder, SAP IBP
- **Analytics Tools**: Python (scipy, pandas), R
- **Certifications**: APICS CPIM, CPIM-F
- **Resources**: APICS Inventory, MIT CTL

#### ddmrp-practitioner
- **DDMRP Platforms**: Demand Driven Technologies, Kinaxis, SAP DDMRP
- **Training**: Demand Driven Institute DDPP, DDLP certifications
- **Certifications**: DDPP, DDLP
- **Resources**: Demand Driven Institute, Carol Ptak

---

### Supplier Management Agents

#### supplier-performance-manager
- **SRM Platforms**: SAP Ariba SLP, Coupa SRM, JAGGAER SRM
- **Scorecard Tools**: Power BI, Tableau, custom dashboards
- **Certifications**: CPSM, CSCP
- **Resources**: ISM Supplier Management, Procurement Leaders

#### supplier-development-manager
- **Collaboration Tools**: Smartsheet, Monday.com, MS Project
- **Quality Standards**: ISO 9001, IATF 16949, AS9100
- **Certifications**: ASQ CQE, Lean Six Sigma
- **Resources**: ASQ, Lean Enterprise Institute

#### supplier-relationship-manager
- **SRM Platforms**: SAP Ariba, Coupa, GEP
- **QBR Tools**: PowerPoint, Tableau, custom templates
- **Certifications**: CPSM, Strategic Supplier Management
- **Resources**: WorldCC (IACCM), ISM

#### supplier-onboarding-coordinator
- **Onboarding Platforms**: SAP Ariba, Coupa, TealBook
- **Compliance Tools**: EcoVadis, Sedex, ISNetworld
- **Certifications**: CPSM, compliance certifications
- **Resources**: ISM, CIPS

---

### Risk Management Agents

#### supply-chain-risk-manager
- **Risk Platforms**: Resilinc, Everstream, riskmethods, Interos
- **Risk Frameworks**: ISO 31000, COSO ERM
- **Certifications**: CSCP, CRISC, RIMS-CRMP
- **Resources**: SCRLC, RIMS, BCI

#### supplier-risk-analyst
- **Risk Data**: D&B, Resilinc, EcoVadis, Prewave
- **Analytics Tools**: Python, R, BI platforms
- **Certifications**: CRISC, CSCP
- **Resources**: SCRLC, Supply Chain Risk Forum

#### business-continuity-planner
- **BCP Platforms**: Fusion Risk, Castellan, Archer
- **Standards**: ISO 22301, DRII Professional Practices
- **Certifications**: CBCP, MBCI, ABCP
- **Resources**: BCI, DRI International

#### disruption-response-manager
- **Incident Platforms**: PagerDuty, Opsgenie, ServiceNow
- **Communication**: Slack, Teams, Statuspage
- **Certifications**: CBCP, crisis management
- **Resources**: BCI, FEMA

---

### Analytics Agents

#### supply-chain-analyst
- **BI Platforms**: Power BI, Tableau, Looker, Qlik
- **Data Tools**: Python (pandas, plotly), R, SQL
- **Certifications**: CSCP, data analytics certifications
- **Resources**: APQC, CSCMP, Gartner

#### cost-to-serve-analyst
- **Costing Tools**: SAP CO, Oracle Costing, Anaplan
- **Modeling Software**: Excel, Python, specialized ABC tools
- **Certifications**: CMA, CSCP
- **Resources**: APQC, CSCMP Cost-to-Serve

---

### Logistics Agents

#### logistics-optimization-manager
- **TMS Platforms**: Oracle TMS, SAP TM, Blue Yonder TMS
- **Optimization Tools**: OR-Tools, CPLEX, Gurobi
- **Certifications**: CTL, CSCP
- **Resources**: CSCMP, MIT CTL

---

### Sustainability Agents

#### sustainability-procurement-manager
- **ESG Platforms**: EcoVadis, Sedex, CDP
- **Reporting Frameworks**: GRI, SASB, TCFD
- **Certifications**: Sustainability certifications, CDP accreditation
- **Resources**: UN Global Compact, CDP, Science Based Targets

---

### Digital and Transformation Agents

#### supply-chain-digitalization-lead
- **Digital Platforms**: Azure Digital Twins, AWS TwinMaker, Siemens MindSphere
- **Integration Tools**: MuleSoft, Workato, Boomi
- **Certifications**: Digital transformation certifications
- **Resources**: Digital Twin Consortium, Gartner

#### master-data-steward
- **MDM Platforms**: SAP MDG, Informatica MDM, Stibo STEP, Reltio
- **Data Quality**: Great Expectations, Talend DQ
- **Certifications**: CDMP, MDM certifications
- **Resources**: DAMA, Gartner MDM

---

## General MCP Server References

### Supply Chain Platform MCP Servers
| Server Name | Description | Primary Use Cases |
|-------------|-------------|-------------------|
| mcp-sap-scm | SAP Supply Chain Management | End-to-end SCM integration |
| mcp-oracle-scm | Oracle SCM Cloud | Cloud SCM operations |
| mcp-kinaxis | Kinaxis RapidResponse | Planning and S&OP |
| mcp-blue-yonder | Blue Yonder platform | Planning and execution |
| mcp-o9-solutions | o9 Solutions platform | AI-powered planning |

### Procurement Platform MCP Servers
| Server Name | Description | Primary Use Cases |
|-------------|-------------|-------------------|
| mcp-ariba | SAP Ariba | Procurement and sourcing |
| mcp-coupa | Coupa BSM | Business spend management |
| mcp-jaggaer | JAGGAER ONE | Source-to-pay |
| mcp-gep-smart | GEP SMART | Procurement platform |
| mcp-ivalua | Ivalua | Spend management |

### Analytics and BI MCP Servers
| Server Name | Description | Primary Use Cases |
|-------------|-------------|-------------------|
| mcp-power-bi | Microsoft Power BI | Dashboards and reporting |
| mcp-tableau | Tableau | Data visualization |
| mcp-looker | Google Looker | Analytics platform |
| mcp-python | Python execution | Custom analytics |

### Risk and Visibility MCP Servers
| Server Name | Description | Primary Use Cases |
|-------------|-------------|-------------------|
| mcp-resilinc | Resilinc | Supply chain risk |
| mcp-project44 | project44 | Supply chain visibility |
| mcp-fourkites | FourKites | Real-time visibility |
| mcp-ecovadis | EcoVadis | Sustainability ratings |

### Communication MCP Servers
| Server Name | Description | Primary Use Cases |
|-------------|-------------|-------------------|
| mcp-slack | Slack integration | Team coordination |
| mcp-teams | Microsoft Teams | Enterprise collaboration |
| mcp-email | Email integration | Notifications, alerts |

---

## Implementation Notes

### Integration Priorities
1. **ERP Connectors** - SAP, Oracle integrations are foundational for supply chain data
2. **Planning Platforms** - Kinaxis, o9, SAP IBP for demand and supply planning
3. **Procurement Suites** - Ariba, Coupa for sourcing and supplier management
4. **Risk Platforms** - Resilinc, EcoVadis for risk monitoring and sustainability
5. **Visibility Platforms** - project44, FourKites for shipment tracking

### Security Considerations
- All supply chain data MCP servers should implement OAuth 2.0 or equivalent
- Supplier-sensitive data must be encrypted in transit and at rest
- Audit logging required for all procurement and sourcing transactions
- SOC 2 Type II compliance recommended for production deployments
- Role-based access control for supplier performance and risk data

### Data Quality Requirements
- Inventory data should maintain appropriate precision (units, quantities)
- All cost data should include currency codes and exchange rates
- Timestamps should include timezone information for global operations
- Data lineage should be tracked for compliance and audit purposes
- Master data (items, suppliers, locations) requires validation rules

### Performance Considerations
- Real-time demand sensing requires low-latency data pipelines
- Network optimization models may require significant compute resources
- Simulation engines should support parallel execution
- Dashboard refresh rates should balance freshness vs. system load

---

## Related Resources

### Professional Organizations
- ASCM (Association for Supply Chain Management) - https://www.ascm.org/
- CSCMP (Council of Supply Chain Management Professionals) - https://cscmp.org/
- ISM (Institute for Supply Management) - https://www.ismworld.org/
- CIPS (Chartered Institute of Procurement & Supply) - https://www.cips.org/
- APQC (American Productivity & Quality Center) - https://www.apqc.org/
- Demand Driven Institute - https://www.demanddriveninstitute.com/
- SCRLC (Supply Chain Risk Leadership Council) - https://www.scrlc.com/

### Industry Publications
- Supply Chain Management Review - https://www.scmr.com/
- Supply Chain Dive - https://www.supplychaindive.com/
- Logistics Management - https://www.logisticsmgmt.com/
- Supply Chain Digital - https://supplychaindigital.com/
- Spend Matters - https://spendmatters.com/

### Research Organizations
- MIT Center for Transportation & Logistics - https://ctl.mit.edu/
- Georgia Tech Supply Chain & Logistics Institute - https://www.scl.gatech.edu/
- Stanford Global Supply Chain Management Forum - https://www.gsb.stanford.edu/
- Gartner Supply Chain Research - https://www.gartner.com/

### Certification Programs
- APICS CPIM (Certified in Planning and Inventory Management)
- APICS CSCP (Certified Supply Chain Professional)
- ISM CPSM (Certified Professional in Supply Management)
- CIPS MCIPS (Member of CIPS)
- DDI DDPP/DDLP (Demand Driven Planner Professional/Leader)
- CBCP (Certified Business Continuity Professional)

---

*Last Updated: January 2026*
*Version: 1.0.0*
*Status: Phase 5 - References Compiled*
*Next Step: Implement specialized skills and agents using these references*
