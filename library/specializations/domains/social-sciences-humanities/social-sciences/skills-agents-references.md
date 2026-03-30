# Social Sciences - Skills and Agents References

## Phase 5: External Resources and Cross-Specialization References

This document provides external resources, tools, and cross-specialization references to support the implementation of Social Sciences skills and agents.

---

## GitHub Repositories

### Quantitative Methods and Statistical Analysis

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [tidyverse/tidyverse](https://github.com/tidyverse/tidyverse) | R packages for data science | SK-SS-001 (Quantitative Methods) |
| [rstudio/rstudio](https://github.com/rstudio/rstudio) | R IDE for statistical computing | SK-SS-001 |
| [pandas-dev/pandas](https://github.com/pandas-dev/pandas) | Python data analysis library | SK-SS-001 |
| [statsmodels/statsmodels](https://github.com/statsmodels/statsmodels) | Statistical models in Python | SK-SS-001, SK-SS-004 |
| [scipy/scipy](https://github.com/scipy/scipy) | Scientific computing library | SK-SS-001 |
| [pymc-devs/pymc](https://github.com/pymc-devs/pymc) | Probabilistic programming | SK-SS-001 |
| [stan-dev/stan](https://github.com/stan-dev/stan) | Bayesian statistical inference | SK-SS-001 |

### Causal Inference

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [microsoft/EconML](https://github.com/microsoft/EconML) | Machine learning for causal inference | SK-SS-004 (Causal Inference Methods) |
| [uber/causalml](https://github.com/uber/causalml) | Uplift modeling and causal inference | SK-SS-004 |
| [py-why/dowhy](https://github.com/py-why/dowhy) | Causal inference library | SK-SS-004 |
| [tlverse/tmle3](https://github.com/tlverse/tmle3) | Targeted learning for causal inference | SK-SS-004 |
| [kosukeimai/MatchIt](https://github.com/kosukeimai/MatchIt) | Propensity score matching in R | SK-SS-004 |

### Qualitative Analysis

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [QualCoder](https://github.com/ccbogel/QualCoder) | Open-source qualitative analysis | SK-SS-002 (Qualitative Analysis) |
| [Taguette](https://github.com/remram44/taguette) | Free qualitative data analysis | SK-SS-002 |
| [RQDA](https://github.com/Ronggui/RQDA) | R-based qualitative analysis | SK-SS-002 |

### Survey Research

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [LimeSurvey](https://github.com/LimeSurvey/LimeSurvey) | Open-source survey platform | SK-SS-003 (Survey Design) |
| [ohmageomh/ohmage](https://github.com/ohmage/server) | Mobile survey platform | SK-SS-003 |
| [survey-library/survey-js](https://github.com/surveyjs/survey-library) | JavaScript survey library | SK-SS-003 |
| [complexsurveys/srvyr](https://github.com/gergness/srvyr) | Survey analysis in R | SK-SS-003 |

### Network Analysis

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [gephi/gephi](https://github.com/gephi/gephi) | Network visualization and analysis | SK-SS-007 (Network Analysis) |
| [networkx/networkx](https://github.com/networkx/networkx) | Python network analysis | SK-SS-007 |
| [igraph/igraph](https://github.com/igraph/igraph) | Network analysis library | SK-SS-007 |
| [snakemake/snakemake](https://github.com/snakemake/snakemake) | Workflow management | SK-SS-007 |
| [statnet/statnet](https://github.com/statnet) | Statistical network analysis in R | SK-SS-007 |

### Psychometrics and Measurement

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [cran/psych](https://github.com/personality-project/psych) | Psychometric functions in R | SK-SS-009 (Psychometric Assessment) |
| [mirt](https://github.com/philchalmers/mirt) | Item response theory in R | SK-SS-009 |
| [lavaan](https://github.com/yrosseel/lavaan) | Structural equation modeling | SK-SS-001, SK-SS-009 |
| [factor-analyzer](https://github.com/EducationalTestingService/factor_analyzer) | Factor analysis in Python | SK-SS-009 |

### Mixed Methods

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [Mixed-Methods-Research](https://github.com/mixed-methods) | Mixed methods resources | SK-SS-010 (Mixed Methods Integration) |

### Program Evaluation

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [J-PAL/evaluator](https://github.com/J-PAL) | Impact evaluation tools | SK-SS-006 (Program Evaluation) |
| [rctpower](https://github.com/vikjam/rctpower) | Power analysis for RCTs | SK-SS-006 |

### Meta-Analysis

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [metafor](https://github.com/wviechtb/metafor) | Meta-analysis in R | SK-SS-008 (Systematic Review) |
| [meta](https://github.com/guido-s/meta) | Meta-analysis package | SK-SS-008 |
| [RevMan](https://training.cochrane.org/online-learning/core-software-cochrane-reviews/revman) | Systematic review software | SK-SS-008 |

---

## MCP Server References

### Potential MCP Integrations

| MCP Server Type | Description | Applicable Skills |
|-----------------|-------------|-------------------|
| **Statistical Computing MCP** | R/Python/Stata statistical processing | SK-SS-001 |
| **Survey Platform MCP** | Qualtrics/LimeSurvey integration | SK-SS-003 |
| **Qualitative Coding MCP** | NVivo/Atlas.ti data access | SK-SS-002 |
| **Citation Database MCP** | JSTOR, EBSCO, Web of Science access | SK-SS-008, SK-SS-011 |
| **IRB Protocol MCP** | Ethics application templates and tracking | SK-SS-014 |
| **Data Repository MCP** | ICPSR, OSF, Dataverse access | SK-SS-001, SK-SS-011 |
| **Policy Database MCP** | Government data and policy document access | SK-SS-006, SK-SS-012 |

### Recommended MCP Implementations

```yaml
# Example MCP configuration for social science research
mcp_servers:
  - name: statistical-engine
    type: computation
    description: Multi-language statistical processing
    languages:
      - R
      - Python
      - Stata
    capabilities:
      - regression_analysis
      - multilevel_modeling
      - structural_equation_modeling
      - causal_inference
      - power_analysis
    packages:
      r:
        - tidyverse
        - lavaan
        - lme4
        - MatchIt
      python:
        - statsmodels
        - causalml
        - dowhy
        - pymc

  - name: survey-manager
    type: api
    description: Survey design and administration
    platforms:
      - Qualtrics
      - LimeSurvey
      - REDCap
    features:
      - survey_creation
      - sampling_management
      - response_collection
      - data_cleaning
      - weighting

  - name: qualitative-analyzer
    type: processing
    description: Qualitative data analysis pipeline
    methods:
      - thematic_analysis
      - grounded_theory
      - content_analysis
    features:
      - auto_coding
      - theme_extraction
      - intercoder_reliability
      - memo_management
```

---

## Community Resources

### Professional Organizations

| Organization | Resources | Relevant Areas |
|--------------|-----------|----------------|
| [American Sociological Association (ASA)](https://www.asanet.org/) | Methods resources, ethics, publications | SK-SS-001, SK-SS-002, SK-SS-011 |
| [American Psychological Association (APA)](https://www.apa.org/) | Research standards, ethics, statistics | SK-SS-009, SK-SS-001, SK-SS-011 |
| [American Political Science Association (APSA)](https://www.apsanet.org/) | Political methodology, standards | SK-SS-001, SK-SS-004 |
| [American Economic Association (AEA)](https://www.aeaweb.org/) | Econometrics, causal inference | SK-SS-004, SK-SS-006 |
| [American Anthropological Association (AAA)](https://www.americananthro.org/) | Ethnographic methods, ethics | SK-SS-005, SK-SS-013 |
| [American Evaluation Association (AEA)](https://www.eval.org/) | Program evaluation standards | SK-SS-006 |
| [Society for Research Synthesis Methodology](https://www.srsm.org/) | Meta-analysis, systematic review | SK-SS-008 |
| [Psychometric Society](https://www.psychometricsociety.org/) | Measurement theory, IRT | SK-SS-009 |
| [Mixed Methods International Research Association](https://mmira.wildapricot.org/) | Mixed methods standards | SK-SS-010 |

### Methodology Resources

| Resource | Description | Relevant Skills |
|----------|-------------|-----------------|
| [SAGE Research Methods](https://methods.sagepub.com/) | Comprehensive methods encyclopedia | All skills |
| [ICPSR](https://www.icpsr.umich.edu/) | Data archive and methods training | SK-SS-001, SK-SS-003 |
| [Cochrane Handbook](https://training.cochrane.org/handbook) | Systematic review methodology | SK-SS-008 |
| [Campbell Collaboration](https://www.campbellcollaboration.org/) | Social intervention reviews | SK-SS-008, SK-SS-006 |
| [J-PAL](https://www.povertyactionlab.org/) | Impact evaluation resources | SK-SS-006, SK-SS-004 |
| [3ie](https://www.3ieimpact.org/) | Impact evaluation evidence | SK-SS-006 |

### Statistical Software Documentation

| Software | Documentation | Relevant Skills |
|----------|---------------|-----------------|
| [R Documentation](https://www.r-project.org/other-docs.html) | R language and packages | SK-SS-001 |
| [Stata Documentation](https://www.stata.com/manuals/) | Stata statistical software | SK-SS-001 |
| [SPSS Documentation](https://www.ibm.com/docs/en/spss-statistics) | IBM SPSS Statistics | SK-SS-001 |
| [Mplus Documentation](https://www.statmodel.com/documentation.shtml) | Structural equation modeling | SK-SS-001, SK-SS-009 |
| [NVivo Resources](https://help-nv.qsrinternational.com/) | Qualitative analysis | SK-SS-002 |
| [Atlas.ti Academy](https://atlasti.com/academy/) | Qualitative software training | SK-SS-002 |

### Online Learning

| Platform | Content | Relevant Areas |
|----------|---------|----------------|
| [Coursera Methods Courses](https://www.coursera.org/courses?query=research%20methods) | University methodology courses | All skills |
| [edX Statistics](https://www.edx.org/learn/statistics) | Statistics and data analysis | SK-SS-001 |
| [EGAP Methods Guides](https://egap.org/methods-guides/) | Experimental design and analysis | SK-SS-004, SK-SS-006 |
| [UCLA Statistical Consulting](https://stats.oarc.ucla.edu/) | Software tutorials, methods | SK-SS-001 |
| [Qualtrics XM Institute](https://www.xminstitute.com/) | Survey methodology | SK-SS-003 |

### Forums and Communities

| Community | Focus | URL |
|-----------|-------|-----|
| Cross Validated | Statistics Q&A | [stats.stackexchange.com](https://stats.stackexchange.com/) |
| r/AcademicPsychology | Psychology research | [reddit.com/r/AcademicPsychology](https://reddit.com/r/AcademicPsychology) |
| Political Methodology Society | Political science methods | [polmeth.org](https://polmeth.org/) |
| QualPage | Qualitative research | [qualpage.com](https://www.qualpage.com/) |
| METHODSPACE | Research methods community | [methodspace.com](https://www.methodspace.com/) |

---

## API Documentation

### Data and Survey APIs

| API | Description | Use Cases |
|-----|-------------|-----------|
| [Qualtrics API](https://api.qualtrics.com/) | Survey platform integration | SK-SS-003 |
| [Census API](https://www.census.gov/data/developers.html) | US Census data access | SK-SS-003, SK-SS-006 |
| [World Bank API](https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-about-the-indicators-api-documentation) | Development indicators | SK-SS-006 |
| [OECD API](https://data.oecd.org/api/) | International statistics | SK-SS-006 |
| [OSF API](https://developer.osf.io/) | Open Science Framework | SK-SS-011 |
| [Dataverse API](https://guides.dataverse.org/en/latest/api/) | Research data repository | SK-SS-011 |
| [ICPSR API](https://www.icpsr.umich.edu/web/ICPSR/cms/3856) | Social science data archive | SK-SS-001 |

### Statistical Computing APIs

| API | Description | Use Cases |
|-----|-------------|-----------|
| [RStudio Connect API](https://docs.rstudio.com/connect/api/) | R environment integration | SK-SS-001 |
| [JupyterHub API](https://jupyterhub.readthedocs.io/en/stable/reference/rest.html) | Notebook server management | SK-SS-001 |
| [MLflow API](https://mlflow.org/docs/latest/rest-api.html) | ML experiment tracking | SK-SS-001 |

### Academic and Citation APIs

| API | Description | Use Cases |
|-----|-------------|-----------|
| [CrossRef API](https://api.crossref.org/) | Citation and DOI metadata | SK-SS-011 |
| [Semantic Scholar API](https://www.semanticscholar.org/product/api) | Academic paper search | SK-SS-008 |
| [CORE API](https://core.ac.uk/documentation/api) | Open access papers | SK-SS-008 |
| [Zotero API](https://www.zotero.org/support/dev/web_api/v3/start) | Bibliography management | SK-SS-011 |
| [ORCID API](https://orcid.org/developer-tools) | Researcher identification | SK-SS-011 |

### Policy and Government APIs

| API | Description | Use Cases |
|-----|-------------|-----------|
| [USA.gov Data API](https://www.data.gov/developers/apis) | US government open data | SK-SS-006, SK-SS-012 |
| [UK Data Service API](https://www.ukdataservice.ac.uk/) | UK social science data | SK-SS-006 |
| [Eurostat API](https://ec.europa.eu/eurostat/web/main/data/web-services) | European statistics | SK-SS-006 |

---

## Applicable Skills from Other Specializations

### From Technology Specializations

| Source Specialization | Skill/Process | Application to Social Sciences |
|----------------------|---------------|--------------------------------|
| **Data Science** | Machine Learning | Predictive modeling, text classification |
| **Data Science** | Data Visualization | Research findings presentation |
| **Data Science** | Big Data Processing | Large-scale survey/administrative data |
| **Data Science** | NLP | Text analysis, content coding |
| **Software Development** | Database Design | Research data management |
| **Software Development** | API Integration | Data collection automation |
| **Software Development** | Web Development | Online survey platforms |

### From Business Specializations

| Source Specialization | Skill/Process | Application to Social Sciences |
|----------------------|---------------|--------------------------------|
| **Finance** | Financial Analysis | Economic research, cost-benefit |
| **Finance** | Risk Assessment | Program risk evaluation |
| **Marketing** | Market Research | Consumer behavior studies |
| **Marketing** | Survey Design | Applied social research |
| **Operations** | Process Analysis | Organizational research |
| **Operations** | Project Management | Research project coordination |
| **Human Resources** | Organizational Development | Workplace research |
| **Human Resources** | Training Evaluation | Education research methods |

### From Other Social Sciences & Humanities

| Source Specialization | Skill/Process | Application to Social Sciences |
|----------------------|---------------|--------------------------------|
| **Philosophy** | Ethical Framework Application | SK-SS-014 research ethics |
| **Philosophy** | Critical Analysis | Theoretical critique |
| **Philosophy** | Logic and Argumentation | Research design logic |
| **Humanities** | Qualitative Methods | SK-SS-002, SK-SS-005 ethnographic research |
| **Humanities** | Textual Analysis | Content analysis |
| **Humanities** | Archival Research | Historical social research |
| **Education** | Assessment Design | Test development |
| **Education** | Program Evaluation | Educational effectiveness |
| **Education** | Learning Analytics | Educational data mining |
| **Healthcare** | Clinical Research | Health services research |
| **Healthcare** | Population Health | Epidemiology, public health |
| **Healthcare** | Quality Measurement | Outcome assessment |

### Cross-Functional Agent Collaborations

| Social Sciences Agent | Collaborating Agent | Collaboration Purpose |
|----------------------|--------------------|-----------------------|
| AG-SS-001 (Quantitative Methodologist) | Data Science: Statistician | Advanced modeling |
| AG-SS-001 (Quantitative Methodologist) | Healthcare: Epidemiologist | Health research design |
| AG-SS-002 (Qualitative Specialist) | Humanities: Ethnographer | Cultural research |
| AG-SS-003 (Survey Director) | Marketing: Market Researcher | Applied survey research |
| AG-SS-004 (Program Evaluator) | Education: Assessment Specialist | Educational evaluation |
| AG-SS-005 (Causal Inference Analyst) | Finance: Econometrician | Economic policy analysis |
| AG-SS-006 (Policy Analyst) | Legal: Policy Researcher | Policy development |
| AG-SS-007 (Psychometrics Expert) | Education: Assessment Designer | Test development |
| AG-SS-008 (Mixed Methods Coordinator) | Humanities: Qualitative Researcher | Integration strategies |
| AG-SS-009 (Computational Social Scientist) | Data Science: ML Engineer | Computational methods |
| AG-SS-010 (Ethics Coordinator) | Philosophy: Ethics Consultant | Research ethics review |

---

## Implementation Recommendations

### Priority Integration Order

1. **Statistical Computing** (SK-SS-001) - R/Python environment with key packages
2. **Survey Platform** (SK-SS-003) - Qualtrics/LimeSurvey integration
3. **Qualitative Tools** (SK-SS-002) - NVivo/Atlas.ti or open-source alternatives
4. **Causal Inference** (SK-SS-004) - DoWhy/EconML integration
5. **Literature Search** (SK-SS-008) - Academic database connectivity

### Technology Stack Recommendations

```yaml
recommended_stack:
  statistical_computing:
    primary: R with tidyverse
    secondary: Python with statsmodels
    bayesian: Stan / PyMC
    sem: lavaan / Mplus

  causal_inference:
    matching: MatchIt (R)
    ml_causal: EconML, CausalML (Python)
    dag: dagitty (R)
    did: did package (R)

  survey:
    platform: Qualtrics / LimeSurvey
    analysis: survey (R), srvyr (R)
    weighting: weights (R)

  qualitative:
    commercial: NVivo, Atlas.ti
    open_source: QualCoder, Taguette
    transcription: Otter.ai, Rev

  network:
    analysis: igraph, NetworkX
    visualization: Gephi
    ergm: statnet (R)

  psychometrics:
    cfa: lavaan (R)
    irt: mirt (R), ltm (R)
    reliability: psych (R)

  meta_analysis:
    meta: metafor (R), meta (R)
    screening: Rayyan, Covidence

  reproducibility:
    workflow: targets (R), snakemake
    environment: renv (R), conda (Python)
    sharing: OSF, GitHub
```

### Reporting Standards

```yaml
reporting_standards:
  quantitative:
    - APA 7th Edition
    - JARS (Journal Article Reporting Standards)

  qualitative:
    - COREQ (Consolidated criteria for reporting qualitative research)
    - SRQR (Standards for Reporting Qualitative Research)

  systematic_review:
    - PRISMA 2020
    - PROSPERO registration

  clinical_trials:
    - CONSORT

  observational:
    - STROBE

  program_evaluation:
    - AEA Guiding Principles
    - JCSEE Program Evaluation Standards

  pre_registration:
    - OSF
    - AEA Registry (RCTs)
    - PROSPERO (systematic reviews)
```

### Data Management Best Practices

```yaml
data_management:
  storage:
    - Institutional repository
    - OSF
    - ICPSR
    - Dataverse

  documentation:
    - Codebook creation
    - Data dictionary
    - README files
    - FAIR principles

  security:
    - IRB compliance
    - De-identification
    - Secure storage
    - Access controls

  sharing:
    - Data use agreements
    - Restricted access
    - Public use files
```

---

**Created**: 2026-01-25
**Version**: 1.0.0
**Specialization**: Social Sciences (`social-sciences`)
**Phase**: 5 - Skills and Agents References
