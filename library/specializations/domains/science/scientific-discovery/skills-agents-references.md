# Scientific Discovery and Problem Solving - Skills and Agents References (Phase 5)

## Overview

This document provides reference materials, resources, and cross-specialization links for implementing the skills and agents identified in the Scientific Discovery and Problem Solving skills-agents-backlog.md. It covers GitHub repositories, MCP servers, community resources, API documentation, and applicable skills from other specializations.

---

## GitHub Repositories

### Literature and Knowledge Management

| Repository | Description | Relevance to Skills |
|-----------|-------------|---------------------|
| [Semantic Scholar API](https://github.com/allenai/s2-folks) | Academic search | semantic-scholar-search |
| [PyMed](https://github.com/gijswobben/pymed) | PubMed access | pubmed-literature-miner |
| [Biopython](https://github.com/biopython/biopython) | Bioinformatics | pubmed-literature-miner |
| [Pyzotero](https://github.com/urschrei/pyzotero) | Zotero API | zotero-reference-manager |
| [scholarpy](https://github.com/scholarly-python-package/scholarly) | Google Scholar | Literature search |
| [paperscraper](https://github.com/PhosphorylatedRabbits/paperscraper) | Paper scraping | Literature mining |
| [PyPaperBot](https://github.com/ferru97/PyPaperBot) | Paper downloading | Literature collection |

### Causal Inference and Reasoning

| Repository | Description | Relevance to Skills |
|-----------|-------------|---------------------|
| [DoWhy](https://github.com/py-why/dowhy) | Causal inference | causal-inference-engine |
| [CausalNex](https://github.com/quantumblacklabs/causalnex) | Bayesian networks | causal-inference-engine |
| [pgmpy](https://github.com/pgmpy/pgmpy) | Probabilistic graphical models | causal-inference-engine, bayesian-inference-engine |
| [EconML](https://github.com/py-why/EconML) | ML for causal inference | causal-inference-engine |
| [CausalML](https://github.com/uber/causalml) | Uplift modeling | causal-inference-engine |
| [causal-learn](https://github.com/py-why/causal-learn) | Causal discovery | causal-inference-engine |
| [TETRAD](https://github.com/cmu-phil/tetrad) | Causal search | causal-inference-engine |

### Bayesian and Statistical Inference

| Repository | Description | Relevance to Skills |
|-----------|-------------|---------------------|
| [PyMC](https://github.com/pymc-devs/pymc) | Probabilistic programming | bayesian-inference-engine |
| [Stan](https://github.com/stan-dev/stan) | Bayesian modeling | bayesian-inference-engine |
| [NumPyro](https://github.com/pyro-ppl/numpyro) | Probabilistic programming | bayesian-inference-engine |
| [ArviZ](https://github.com/arviz-devs/arviz) | Bayesian visualization | bayesian-inference-engine |
| [emcee](https://github.com/dfm/emcee) | MCMC sampler | bayesian-inference-engine |
| [scipy.stats](https://github.com/scipy/scipy) | Statistical functions | statistical-test-selector |
| [pingouin](https://github.com/raphaelvallat/pingouin) | Statistical testing | statistical-test-selector, power-analysis-calculator |
| [statsmodels](https://github.com/statsmodels/statsmodels) | Statistical models | regression-analyzer, time-series-analyzer |

### Formal Logic and Reasoning

| Repository | Description | Relevance to Skills |
|-----------|-------------|---------------------|
| [Z3](https://github.com/Z3Prover/z3) | SMT solver | formal-logic-reasoner |
| [Prover9](https://www.cs.unm.edu/~mccune/mace4/) | Theorem prover | formal-logic-reasoner |
| [Lean 4](https://github.com/leanprover/lean4) | Proof assistant | formal-logic-reasoner |
| [SymPy Logic](https://github.com/sympy/sympy) | Symbolic logic | formal-logic-reasoner |
| [pyDatalog](https://github.com/pcarbonn/pyDatalog) | Logic programming | formal-logic-reasoner |

### Systems Thinking and Dynamics

| Repository | Description | Relevance to Skills |
|-----------|-------------|---------------------|
| [PySD](https://github.com/JamesPHoughton/pysd) | System dynamics | systems-dynamics-modeler |
| [BPTK-Py](https://github.com/transentis/bptk_py) | Business simulation | systems-dynamics-modeler |
| [NetworkX](https://github.com/networkx/networkx) | Network analysis | network-visualizer |
| [pyvis](https://github.com/WestHealth/pyvis) | Interactive networks | network-visualizer |
| [Mesa](https://github.com/projectmesa/mesa) | Agent-based modeling | systems-dynamics-modeler |

### Meta-Analysis and Systematic Reviews

| Repository | Description | Relevance to Skills |
|-----------|-------------|---------------------|
| [PythonMeta](https://github.com/dantaki/PythonMeta) | Meta-analysis | meta-analysis-engine |
| [forestplot](https://github.com/LSYS/forestplot) | Forest plots | meta-analysis-engine |
| [metafor](https://github.com/wviechtb/metafor) | R meta-analysis | meta-analysis-engine (via rpy2) |
| [robvis](https://github.com/mcguinlu/robvis) | Risk of bias visualization | checklist-validator |
| [PRISMA2020](https://github.com/prisma-flowdiagram/PRISMA2020) | PRISMA diagrams | checklist-validator |

### Experimental Design

| Repository | Description | Relevance to Skills |
|-----------|-------------|---------------------|
| [pyDOE2](https://github.com/clicumu/pyDOE2) | Design of experiments | doe-optimizer |
| [SALib](https://github.com/SALib/SALib) | Sensitivity analysis | doe-optimizer |
| [scipy.stats](https://github.com/scipy/scipy) | Statistical functions | randomization-generator |
| [optimal](https://github.com/altaris/optimal) | Optimal design | doe-optimizer |
| [GPyOpt](https://github.com/SheffieldML/GPyOpt) | Bayesian optimization | doe-optimizer |

### Data Visualization

| Repository | Description | Relevance to Skills |
|-----------|-------------|---------------------|
| [matplotlib](https://github.com/matplotlib/matplotlib) | Python plotting | scientific-figure-generator |
| [seaborn](https://github.com/mwaskom/seaborn) | Statistical visualization | scientific-figure-generator |
| [plotly](https://github.com/plotly/plotly.py) | Interactive plots | interactive-dashboard-builder |
| [altair](https://github.com/altair-viz/altair) | Declarative viz | scientific-figure-generator |
| [bokeh](https://github.com/bokeh/bokeh) | Interactive web plots | interactive-dashboard-builder |
| [Streamlit](https://github.com/streamlit/streamlit) | Data apps | interactive-dashboard-builder |
| [Dash](https://github.com/plotly/dash) | Dashboards | interactive-dashboard-builder |
| [Panel](https://github.com/holoviz/panel) | Dashboards | interactive-dashboard-builder |

### Reproducibility and Data Management

| Repository | Description | Relevance to Skills |
|-----------|-------------|---------------------|
| [DVC](https://github.com/iterative/dvc) | Data version control | data-versioning-manager |
| [papermill](https://github.com/nteract/papermill) | Notebook execution | jupyter-reproducibility-checker |
| [nbQA](https://github.com/nbQA-dev/nbQA) | Notebook linting | jupyter-reproducibility-checker |
| [nbstripout](https://github.com/kynan/nbstripout) | Strip notebook output | jupyter-reproducibility-checker |
| [pipreqs](https://github.com/bndr/pipreqs) | Requirements extraction | jupyter-reproducibility-checker |
| [osfclient](https://github.com/osfclient/osfclient) | OSF API | osf-workflow-integrator |
| [Zenodo REST API](https://github.com/zenodo/zenodo) | Data archiving | data-versioning-manager |

### Scientific Writing

| Repository | Description | Relevance to Skills |
|-----------|-------------|---------------------|
| [pandoc](https://github.com/jgm/pandoc) | Document conversion | latex-document-compiler |
| [latexmk](https://github.com/debian-tex/latexmk) | LaTeX build | latex-document-compiler |
| [biber](https://github.com/plk/biber) | Bibliography | latex-document-compiler |
| [LanguageTool](https://github.com/languagetool-org/languagetool) | Grammar checking | academic-writing-assistant |
| [write-good](https://github.com/btford/write-good) | Writing suggestions | academic-writing-assistant |
| [proselint](https://github.com/amperser/proselint) | Style checking | academic-writing-assistant |

### TRIZ and Innovation

| Repository | Description | Relevance to Skills |
|-----------|-------------|---------------------|
| [TRIZ40](https://triz40.com/) | TRIZ principles database | triz-contradiction-solver |
| [py-triz](https://github.com/trizstudio/py-triz) | TRIZ tools | triz-contradiction-solver |
| Custom implementations needed | Contradiction matrix | triz-contradiction-solver |

### Analogical Reasoning

| Repository | Description | Relevance to Skills |
|-----------|-------------|---------------------|
| [SME](https://github.com/qrg/SME) | Structure Mapping Engine | analogy-mapper |
| [analogy](https://github.com/Analogy-org/analogy) | Analogy library | analogy-mapper |
| Custom NLP pipelines | Cross-domain mapping | analogy-mapper |

---

## MCP Server References

### Relevant MCP Servers for Scientific Discovery

| MCP Server | Description | Applicable Skills |
|------------|-------------|-------------------|
| **filesystem** | File system operations | All file-based skills |
| **github** | Version control | Code and protocol versioning |
| **fetch** | Web access | Literature search, API access |
| **postgres/sqlite** | Database operations | Research data storage |
| **memory** | Persistent context | Long research sessions |
| **puppeteer/playwright** | Web automation | Database scraping |

### Potential Custom MCP Servers

| Server Concept | Purpose | Skills Enabled |
|---------------|---------|----------------|
| **mcp-semantic-scholar** | Academic search | semantic-scholar-search |
| **mcp-pubmed** | Biomedical literature | pubmed-literature-miner |
| **mcp-zotero** | Reference management | zotero-reference-manager |
| **mcp-osf** | Open Science Framework | osf-workflow-integrator |
| **mcp-arxiv** | Preprint search | Literature search |
| **mcp-jupyter** | Notebook execution | jupyter-reproducibility-checker |
| **mcp-latex** | LaTeX compilation | latex-document-compiler |
| **mcp-triz** | TRIZ knowledge base | triz-contradiction-solver |
| **mcp-causal** | Causal inference tools | causal-inference-engine |

---

## Community Resources

### Forums and Discussion

| Resource | URL | Topics |
|----------|-----|--------|
| Cross Validated | https://stats.stackexchange.com/ | Statistics, methodology |
| Research Methods SE | https://academia.stackexchange.com/ | Academia, methodology |
| Open Science Framework | https://osf.io/explore/activity/ | Open science community |
| PubPeer | https://pubpeer.com/ | Post-publication review |
| r/AskStatistics | https://reddit.com/r/AskStatistics | Statistics help |
| Stan Discourse | https://discourse.mc-stan.org/ | Bayesian modeling |
| PyMC Discourse | https://discourse.pymc.io/ | PyMC usage |

### Documentation and Tutorials

| Resource | URL | Relevance |
|----------|-----|-----------|
| CONSORT Statement | https://www.consort-statement.org/ | RCT reporting |
| PRISMA Statement | https://prisma-statement.org/ | Systematic reviews |
| STROBE Statement | https://www.strobe-statement.org/ | Observational studies |
| EQUATOR Network | https://www.equator-network.org/ | Reporting guidelines |
| Cochrane Handbook | https://training.cochrane.org/handbook | Systematic reviews |
| Statistical Rethinking | https://xcelab.net/rm/statistical-rethinking/ | Bayesian statistics |
| Causal Inference Book | https://www.hsph.harvard.edu/miguel-hernan/causal-inference-book/ | Causal methods |
| The Turing Way | https://the-turing-way.netlify.app/ | Reproducible research |

### Best Practices

| Resource | Description | Applicable Areas |
|----------|-------------|------------------|
| [FAIR Principles](https://www.go-fair.org/fair-principles/) | Data management | data-versioning-manager |
| [TOP Guidelines](https://www.cos.io/initiatives/top-guidelines) | Transparency | reproducibility skills |
| [Pre-registration Templates](https://osf.io/registries/) | OSF registries | protocol-builder |
| [APA Publication Manual](https://apastyle.apa.org/products/publication-manual-7th-edition) | Writing standards | statistical-reporting-formatter |
| [ICMJE Guidelines](https://www.icmje.org/) | Medical writing | academic-writing-assistant |

---

## API Documentation

### Literature and Data Services

| API | Documentation URL | Purpose |
|-----|-------------------|---------|
| Semantic Scholar API | https://api.semanticscholar.org/ | Academic search |
| PubMed E-utilities | https://www.ncbi.nlm.nih.gov/books/NBK25501/ | Biomedical literature |
| Crossref API | https://www.crossref.org/documentation/retrieve-metadata/rest-api/ | DOI metadata |
| OpenAlex API | https://docs.openalex.org/api | Academic data |
| ORCID API | https://info.orcid.org/documentation/api-tutorials/ | Researcher IDs |
| Zotero API | https://www.zotero.org/support/dev/web_api/v3/start | Reference management |
| OSF API | https://developer.osf.io/ | Open science |
| Zenodo API | https://developers.zenodo.org/ | Data archiving |
| Figshare API | https://docs.figshare.com/ | Data sharing |

### Standards and Formats

| Standard | Documentation | Tools |
|----------|--------------|-------|
| JATS XML | https://jats.nlm.nih.gov/ | Journal articles |
| DataCite | https://datacite.org/dois.html | Dataset DOIs |
| ORCID | https://orcid.org/ | Researcher identifiers |
| CRediT | https://credit.niso.org/ | Contributor roles |
| RO-Crate | https://www.researchobject.org/ro-crate/ | Research objects |
| BIDS | https://bids.neuroimaging.io/ | Brain imaging data |

---

## Applicable Skills from Other Specializations

### From Mathematics Specialization

| Skill | Application to Scientific Discovery |
|-------|-----------------------------------|
| **stan-bayesian-modeling** | Bayesian inference workflows |
| **pymc-probabilistic-programming** | Probabilistic modeling |
| **convex-optimization-solver** | Experimental optimization |
| **monte-carlo-simulation** | Uncertainty quantification |
| **sensitivity-analysis-uq** | Parameter sensitivity |
| **latex-math-formatter** | Scientific writing |
| **counterexample-generator** | Hypothesis testing |

### From Computer Science Specialization

| Skill | Application to Scientific Discovery |
|-------|-----------------------------------|
| **formal-logic-reasoner** | Deductive reasoning support |
| **theorem-prover-interface** | Proof verification |
| **algorithm-complexity-analyzer** | Computational feasibility |
| **benchmark-suite-manager** | Experimental evaluation |

### From Physics Specialization

| Skill | Application to Scientific Discovery |
|-------|-----------------------------------|
| **scipy-optimization-toolkit** | Data fitting, optimization |
| **emcee-mcmc-sampler** | Posterior sampling |
| **paraview-scientific-visualizer** | 3D data visualization |
| **latex-physics-documenter** | Scientific writing |

### From Data Science Specialization

| Skill | Application to Scientific Discovery |
|-------|-----------------------------------|
| **pandas-data-wrangler** | Data preprocessing |
| **sklearn-ml-toolkit** | Predictive modeling |
| **visualization-toolkit** | Exploratory analysis |
| **feature-engineering-toolkit** | Variable preparation |
| **cross-validation-framework** | Model evaluation |
| **mlflow-experiment-tracker** | Experiment tracking |

### From Quantum Computing Specialization

| Skill | Application to Scientific Discovery |
|-------|-----------------------------------|
| **resource-estimator** | Computational planning |
| **statevector-simulator** | Quantum algorithm testing |

---

## Cross-Specialization Agent Collaboration

### Agents from Other Specializations Useful for Scientific Discovery

| Agent | Source Specialization | Scientific Discovery Application |
|-------|----------------------|---------------------------------|
| **numerical-analyst** | Mathematics | Numerical method validation |
| **bayesian-statistician** | Mathematics | Bayesian workflow guidance |
| **optimization-expert** | Mathematics | Experimental optimization |
| **theorem-prover-expert** | Mathematics | Formal reasoning |
| **algorithm-analyst** | Computer Science | Algorithm design |
| **data-pipeline-architect** | Data Engineering | Data processing pipelines |
| **ml-model-validator** | Data Science | Model validation |
| **physics-paper-writer** | Physics | Scientific writing |

### Scientific Discovery Agents Useful for Other Specializations

| Agent | Target Specialization | Application |
|-------|----------------------|-------------|
| **statistical-consultant** | All quantitative fields | Statistical guidance |
| **systematic-review-coordinator** | Healthcare, Policy | Evidence synthesis |
| **experiment-designer** | All experimental sciences | Experimental methodology |
| **reproducibility-guardian** | All computational fields | Reproducibility |
| **causal-reasoning-analyst** | Economics, Healthcare | Causal inference |
| **rigor-assessor** | All research domains | Quality assessment |
| **bias-detective** | Data Science, ML | Bias detection |

---

## Implementation Recommendations

### Tool Selection Priority

1. **Open APIs**: Prioritize services with public APIs (Semantic Scholar, OSF)
2. **Standards Compliance**: Choose tools supporting standard formats (JATS, DataCite)
3. **Community Adoption**: Select widely-used tools in research community
4. **Reproducibility Focus**: Prefer tools enabling reproducible workflows

### Integration Patterns

1. **Literature Pipeline**: Chain search -> retrieval -> extraction -> synthesis
2. **Statistical Workflow**: Data -> exploration -> modeling -> inference
3. **Reproducibility Stack**: Code versioning + data versioning + environment
4. **Publication Pipeline**: Analysis -> figures -> manuscript -> submission

### Testing Strategies

1. **Known Datasets**: Test against well-characterized benchmark datasets
2. **Published Results**: Validate against published statistical analyses
3. **Cross-Tool Verification**: Compare results across statistical packages
4. **Sensitivity Testing**: Verify robustness to parameter choices

### Research Workflow Integration

| Phase | Tools | Skills |
|-------|-------|--------|
| Question Formulation | Literature databases | semantic-scholar-search, hypothesis-generator |
| Literature Review | Zotero, PRISMA | zotero-reference-manager, meta-analysis-engine |
| Study Design | OSF, power tools | power-analysis-calculator, protocol-builder |
| Data Collection | REDCap, Qualtrics | protocol-builder |
| Analysis | R/Python, Stan | statistical-test-selector, bayesian-inference-engine |
| Writing | LaTeX, Overleaf | latex-document-compiler, academic-writing-assistant |
| Dissemination | OSF, Zenodo | osf-workflow-integrator, data-versioning-manager |

---

## Reporting Guideline Checklists

### Clinical and Health Research

| Guideline | Purpose | URL |
|-----------|---------|-----|
| CONSORT | Randomized trials | https://www.consort-statement.org/ |
| STROBE | Observational studies | https://www.strobe-statement.org/ |
| PRISMA | Systematic reviews | https://prisma-statement.org/ |
| SPIRIT | Trial protocols | https://www.spirit-statement.org/ |
| STARD | Diagnostic accuracy | https://www.equator-network.org/reporting-guidelines/stard/ |
| TRIPOD | Prediction models | https://www.tripod-statement.org/ |

### Other Domains

| Guideline | Purpose | URL |
|-----------|---------|-----|
| ARRIVE | Animal research | https://arriveguidelines.org/ |
| MDAR | Materials reporting | https://www.cell.com/star-authors-guide |
| JARS | Quantitative research | https://apastyle.apa.org/jars |
| COREQ | Qualitative research | https://www.equator-network.org/reporting-guidelines/coreq/ |

---

## Statistical Method References

### Frequentist Methods

| Method Category | Key References | Tools |
|----------------|----------------|-------|
| Hypothesis Testing | Neyman-Pearson framework | scipy.stats, pingouin |
| ANOVA | Fisher's methods | statsmodels, pingouin |
| Regression | OLS, GLM | statsmodels, scikit-learn |
| Survival Analysis | Cox proportional hazards | lifelines, survival |

### Bayesian Methods

| Method Category | Key References | Tools |
|----------------|----------------|-------|
| MCMC | NUTS, HMC | Stan, PyMC |
| Model Comparison | LOO-CV, WAIC | ArviZ |
| Prior Elicitation | SHELF protocol | Stan |
| Hierarchical Models | Multilevel modeling | Stan, PyMC |

### Causal Inference

| Method Category | Key References | Tools |
|----------------|----------------|-------|
| DAG-based | Pearl's do-calculus | DoWhy |
| Potential Outcomes | Rubin causal model | EconML |
| Instrumental Variables | 2SLS, LATE | statsmodels |
| Propensity Scores | Matching, weighting | CausalML |

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-25 | Babysitter AI | Initial references document creation |
