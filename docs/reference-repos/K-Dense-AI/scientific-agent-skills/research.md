# K-Dense-AI/scientific-agent-skills

- **Archetype**: mega-skill-pack
- **Stars**: 18,215
- **Last pushed**: 2026-04-12
- **License**: MIT
- **Discovered**: 2026-04-12
- **Skills found**: 133 SKILL.md files across scientific-skills/
- **Fork**: No
- **Source**: gh-search

## Summary

Massive collection of 133 scientific and research agent skills covering biology, chemistry, medicine, physics, engineering, data analysis, geospatial science, lab automation, and scientific communication. Uses the Agent Skills standard (agentskills.io). Each skill has a SKILL.md with docs, examples, use cases, and best practices.

Key domains covered:
- Bioinformatics & Genomics (scanpy, scvelo, pysam, biopython, gget, etc.)
- Cheminformatics & Drug Discovery (rdkit, deepchem, diffdock, medchem, etc.)
- Proteomics & Mass Spectrometry (pyopenms, matchms)
- Clinical Research & Precision Medicine (clinical-decision-support, treatment-plans)
- Machine Learning & AI (pytorch-lightning, scikit-learn, stable-baselines3, shap)
- Materials Science & Chemistry (pymatgen, molecular-dynamics, rowan)
- Physics & Astronomy (astropy, cirq, qiskit, pennylane, qutip, sympy)
- Engineering & Simulation (simpy, pymoo, fluidsim, cobrapy)
- Data Analysis & Visualization (polars, dask, matplotlib, seaborn, networkx, statsmodels)
- Geospatial Science (geopandas, geomaster)
- Lab Automation (opentrons-integration, pylabrobot)
- Scientific Communication (literature-review, scientific-writing, peer-review, citation-management, latex-posters, pptx)
- 100+ scientific database integrations (database-lookup skill covers 78+ databases)

Also includes meta-skills: hypothesis-generation, scientific-brainstorming, scientific-critical-thinking, what-if-oracle, consciousness-council.

## Assessment

Extremely high value for babysitter process library. The scientific workflows are multi-step and procedurally rich. The meta-skills (hypothesis generation, brainstorming, literature review, peer review) encode reusable methodologies. The database integration patterns are valuable for plugin ideas.

**Extraction priority**: HIGH

---

## Processes

### 1. Scientific Literature Review & Synthesis
- **Source skills**: literature-review, paper-lookup, bgpt-paper-search, paperzilla, citation-management, pyzotero
- **Placement**: `specializations/science/literature-review-synthesis.js`
- **Description**: Multi-step process for systematic literature search, paper retrieval, quality assessment, synthesis, and citation management. Steps: define research question -> search databases -> screen results -> extract data -> synthesize findings -> generate bibliography.

### 2. Hypothesis Generation & Experimental Design
- **Source skills**: hypothesis-generation, scientific-brainstorming, scientific-critical-thinking, what-if-oracle
- **Placement**: `specializations/science/hypothesis-experimental-design.js`
- **Description**: Process for generating testable hypotheses from observations/data, evaluating them with critical thinking frameworks, designing experiments, and predicting outcomes with what-if analysis.

### 3. Drug Discovery Pipeline
- **Source skills**: rdkit, deepchem, medchem, diffdock, torchdrug, datamol, molfeat
- **Placement**: `specializations/science/drug-discovery-pipeline.js`
- **Description**: Multi-step computational drug discovery: target identification -> virtual screening -> molecular property prediction -> ADMET analysis -> lead optimization -> docking validation.

### 4. Single-Cell RNA-seq Analysis Pipeline
- **Source skills**: scanpy, scvelo, anndata, cellxgene-census, scvi-tools
- **Placement**: `specializations/science/single-cell-rnaseq-analysis.js`
- **Description**: End-to-end single-cell analysis: data loading -> QC filtering -> normalization -> dimensionality reduction -> clustering -> differential expression -> RNA velocity -> trajectory inference.

### 5. Scientific Paper Writing & Peer Review
- **Source skills**: scientific-writing, peer-review, venue-templates, latex-posters, markdown-mermaid-writing, scientific-schematics
- **Placement**: `specializations/science/scientific-paper-authoring.js`
- **Description**: Structured writing process: outline -> draft sections -> create figures/schematics -> format for venue -> self-review with peer-review checklist -> revision cycle.

### 6. Exploratory Data Analysis & Statistical Reporting
- **Source skills**: exploratory-data-analysis, statistical-analysis, matplotlib, seaborn, polars, statsmodels, shap
- **Placement**: `specializations/science/statistical-eda-reporting.js`
- **Description**: Systematic EDA pipeline: data profiling -> distribution analysis -> correlation exploration -> hypothesis testing -> model interpretability -> publication-quality visualization.

### 7. Genomics & Variant Analysis Pipeline
- **Source skills**: pysam, biopython, gget, deeptools, phylogenetics, tiledbvcf, scikit-bio
- **Placement**: `specializations/science/genomics-variant-analysis.js`
- **Description**: Genomic analysis workflow: sequence QC -> alignment processing -> variant calling/annotation -> phylogenetic analysis -> functional interpretation.

### 8. Clinical Decision Support Workflow
- **Source skills**: clinical-decision-support, treatment-plans, clinical-reports, pyhealth
- **Placement**: `specializations/science/clinical-decision-support.js`
- **Description**: Clinical analysis process: patient data ingestion -> risk stratification -> evidence-based treatment options -> compliance checking -> report generation.

## Plugin Ideas

### 1. Scientific Database Gateway Plugin
- **Category**: Tools Integration
- **install.md**: Configures a unified database-lookup interface for 78+ scientific databases (PubChem, ChEMBL, UniProt, COSMIC, ClinicalTrials.gov, FRED, etc.). Installs Python dependencies, configures API keys, sets up caching for repeated queries.
- **Source**: database-lookup skill pattern, bioservices, gget

### 2. Lab Notebook Integration Plugin
- **Category**: Knowledge Management
- **install.md**: Integrates with electronic lab notebooks (Benchling, LabArchive, Open Notebook). Configures API connections, sets up experiment logging hooks, enables protocol versioning.
- **Source**: benchling-integration, labarchive-integration, open-notebook, protocolsio-integration

### 3. Scientific Visualization Theme Plugin
- **Category**: Theming & Environment
- **install.md**: Installs publication-quality visualization presets for matplotlib/seaborn. Configures journal-specific style templates (Nature, Science, Cell, etc.), colorblind-safe palettes, and figure size standards.
- **Source**: scientific-visualization, matplotlib, seaborn skills

### 4. Citation Manager Plugin
- **Category**: Knowledge Management
- **install.md**: Connects to Zotero library, configures auto-citation insertion, sets up bibliography generation, enables DOI resolution and metadata extraction.
- **Source**: citation-management, pyzotero skills

## Implicit Procedural Knowledge

- **Multi-database query pattern**: The database-lookup skill demonstrates a unified interface for querying 78+ heterogeneous scientific databases with a common schema. This pattern (query normalization -> source routing -> result aggregation) is reusable.
- **Computational pipeline orchestration**: Many skills encode multi-tool pipelines (e.g., scanpy -> scvelo -> visualization) that demonstrate effective task sequencing with intermediate validation checkpoints.
- **Domain expert routing**: The consciousness-council skill implements a multi-perspective deliberation pattern where different "expert" viewpoints evaluate a problem -- potentially valuable for breakpoint routing strategies.

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Scientific Literature Review & Synthesis | NEW | Systematic literature search and synthesis methodology | - | specializations/academic-research/literature-review-synthesis.js |
| Hypothesis Generation & Experimental Design | NEW | Research hypothesis development and experimental planning | - | specializations/academic-research/hypothesis-experimental-design.js |
| Drug Discovery Pipeline | NEW | Computational drug discovery workflow | - | specializations/science/drug-discovery-pipeline.js |
| Single-Cell RNA-seq Analysis Pipeline | NEW | End-to-end single-cell genomics analysis | - | specializations/science/single-cell-rnaseq-analysis.js |
| Scientific Paper Writing & Peer Review | NEW | Academic paper authoring and review process | - | specializations/academic-research/scientific-paper-authoring.js |
| Statistical EDA & Reporting | NEW | Exploratory data analysis and statistical reporting | - | specializations/data-science-ml/statistical-eda-reporting.js |
| Genomics & Variant Analysis Pipeline | NEW | Genomic sequence analysis workflow | - | specializations/science/genomics-variant-analysis.js |
| Clinical Decision Support Workflow | NEW | Clinical data analysis and decision support | - | specializations/science/clinical-decision-support.js |
| Multi-Database Query Pattern | NEW | Unified interface for heterogeneous database querying | - | specializations/shared/multi-database-query.js |
| Computational Pipeline Orchestration | NEW | Multi-tool pipeline sequencing with validation | - | specializations/shared/computational-pipeline-orchestration.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Scientific Database Gateway | NEW | Unified access to 78+ scientific databases | - | plugins/a5c/marketplace/plugins/scientific-database-gateway/ |
| Lab Notebook Integration | NEW | Electronic lab notebook integration | - | plugins/a5c/marketplace/plugins/lab-notebook-integration/ |
| Scientific Visualization Theme | NEW | Publication-quality visualization presets | - | plugins/a5c/marketplace/plugins/scientific-visualization-theme/ |
| Citation Manager | NEW | Zotero integration and bibliography management | - | plugins/a5c/marketplace/plugins/citation-manager/ |
- **GPU optimization patterns**: The optimize-for-gpu skill encodes knowledge about when and how to offload computation, relevant to any resource-intensive process orchestration.
