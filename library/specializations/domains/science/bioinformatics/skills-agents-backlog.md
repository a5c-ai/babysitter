# Bioinformatics and Genomics - Skills and Agents Backlog (Phase 4)

## Overview

This backlog identifies specialized skills and agents that could enhance the Bioinformatics and Genomics processes beyond general-purpose capabilities. Each skill or agent is designed to provide domain-specific tooling, validation, or automation for genomics, transcriptomics, proteomics, and clinical bioinformatics workflows.

## Summary Statistics

- **Total Skills Identified**: 42
- **Total Agents Identified**: 24
- **Shared Candidates (Cross-Specialization)**: 12
- **Categories**: 8 (Sequence Analysis, Variant Analysis, Transcriptomics, Proteomics, Structural Biology, Metagenomics, Clinical Genomics, Infrastructure)

---

## Skills

### Sequence Analysis Skills

#### 1. bwa-aligner
**Description**: BWA-MEM2 alignment skill for mapping sequencing reads to reference genomes with optimized parameter selection and quality assessment.

**Capabilities**:
- Read alignment to reference genomes
- Parameter optimization for different read types
- Multi-threading configuration
- Index generation and management
- Alignment quality metrics reporting
- Support for paired-end and single-end reads

**Used By Processes**:
- Whole Genome Sequencing Pipeline (wgs-analysis-pipeline)
- Long-Read Sequencing Analysis (long-read-analysis)
- Tumor Molecular Profiling (tumor-molecular-profiling)

**Tools/Libraries**: BWA-MEM2, minimap2, samtools

---

#### 2. blast-sequence-search
**Description**: BLAST skill for sequence similarity searching, homology detection, and database querying across nucleotide and protein sequences.

**Capabilities**:
- BLASTn/BLASTp/BLASTx execution
- Custom database creation and management
- E-value and alignment filtering
- Output parsing and result annotation
- Batch query processing
- Remote NCBI database queries

**Used By Processes**:
- Whole Genome Sequencing Pipeline (wgs-analysis-pipeline)
- Protein Structure Prediction (protein-structure-prediction)
- Shotgun Metagenomics Pipeline (shotgun-metagenomics)

**Tools/Libraries**: NCBI BLAST+, DIAMOND, MMseqs2

---

#### 3. fastqc-quality-analyzer
**Description**: Sequencing quality control skill for assessing read quality, adapter contamination, and sequence composition.

**Capabilities**:
- Per-base quality score analysis
- Sequence duplication detection
- Adapter content identification
- GC content analysis
- Overrepresented sequence detection
- MultiQC report aggregation

**Used By Processes**:
- Whole Genome Sequencing Pipeline (wgs-analysis-pipeline)
- RNA-seq Differential Expression Analysis (rnaseq-differential-expression)
- Long-Read Sequencing Analysis (long-read-analysis)
- Analysis Pipeline Validation (pipeline-validation)

**Tools/Libraries**: FastQC, MultiQC, fastp

---

#### 4. samtools-bam-processor
**Description**: BAM/SAM file manipulation skill for sorting, indexing, filtering, and extracting alignment data.

**Capabilities**:
- BAM sorting and indexing
- Duplicate marking and removal
- Alignment statistics generation
- Region extraction and filtering
- Read group management
- Format conversion (SAM/BAM/CRAM)

**Used By Processes**:
- Whole Genome Sequencing Pipeline (wgs-analysis-pipeline)
- Tumor Molecular Profiling (tumor-molecular-profiling)
- RNA-seq Differential Expression Analysis (rnaseq-differential-expression)

**Tools/Libraries**: samtools, Picard, sambamba

---

#### 5. phylogenetics-tree-builder
**Description**: Phylogenetic analysis skill for constructing evolutionary trees, performing multiple sequence alignments, and assessing phylogenetic relationships.

**Capabilities**:
- Multiple sequence alignment (MUSCLE, MAFFT)
- Maximum likelihood tree construction
- Bayesian phylogenetic inference
- Bootstrap support calculation
- Tree visualization and annotation
- Molecular clock analysis

**Used By Processes**:
- 16S rRNA Microbiome Analysis (16s-microbiome-analysis)
- Shotgun Metagenomics Pipeline (shotgun-metagenomics)
- Whole Genome Sequencing Pipeline (wgs-analysis-pipeline)

**Tools/Libraries**: RAxML-NG, IQ-TREE, MrBayes, MAFFT, MUSCLE, FigTree

---

### Variant Analysis Skills

#### 6. gatk-variant-caller
**Description**: GATK best practices skill for germline and somatic variant calling with joint genotyping support.

**Capabilities**:
- HaplotypeCaller execution
- Base quality score recalibration (BQSR)
- Variant quality score recalibration (VQSR)
- Joint genotyping across cohorts
- GVCF generation and management
- Mutect2 somatic calling

**Used By Processes**:
- Whole Genome Sequencing Pipeline (wgs-analysis-pipeline)
- Clinical Variant Interpretation (clinical-variant-interpretation)
- Tumor Molecular Profiling (tumor-molecular-profiling)
- Rare Disease Diagnostic Pipeline (rare-disease-diagnostics)

**Tools/Libraries**: GATK4, Picard

---

#### 7. deepvariant-caller
**Description**: DeepVariant deep learning variant calling skill for high-accuracy SNV and indel detection.

**Capabilities**:
- GPU-accelerated variant calling
- WGS/WES/PacBio mode selection
- Model customization and retraining
- Confidence calibration
- Multi-sample variant calling
- Docker/Singularity deployment

**Used By Processes**:
- Whole Genome Sequencing Pipeline (wgs-analysis-pipeline)
- Long-Read Sequencing Analysis (long-read-analysis)
- Analysis Pipeline Validation (pipeline-validation)

**Tools/Libraries**: DeepVariant, Parabricks

---

#### 8. vep-variant-annotator
**Description**: Variant Effect Predictor skill for comprehensive variant annotation with clinical database integration.

**Capabilities**:
- Functional consequence prediction
- Population frequency annotation (gnomAD)
- Clinical database integration (ClinVar, COSMIC)
- Custom annotation plugins
- Pathogenicity score integration (CADD, REVEL)
- Regulatory region annotation

**Used By Processes**:
- Whole Genome Sequencing Pipeline (wgs-analysis-pipeline)
- Clinical Variant Interpretation (clinical-variant-interpretation)
- Pharmacogenomics Analysis (pharmacogenomics-analysis)
- Rare Disease Diagnostic Pipeline (rare-disease-diagnostics)

**Tools/Libraries**: Ensembl VEP, ANNOVAR, SnpEff

---

#### 9. structural-variant-detector
**Description**: Structural variant detection skill for identifying CNVs, inversions, translocations, and complex rearrangements.

**Capabilities**:
- Split-read and paired-end SV calling
- Copy number variation detection
- Mobile element insertion detection
- Complex SV resolution
- SV annotation and visualization
- Multi-caller integration

**Used By Processes**:
- Whole Genome Sequencing Pipeline (wgs-analysis-pipeline)
- Tumor Molecular Profiling (tumor-molecular-profiling)
- Long-Read Sequencing Analysis (long-read-analysis)

**Tools/Libraries**: Manta, DELLY, CNVkit, LUMPY, GRIDSS

---

#### 10. acmg-variant-classifier
**Description**: ACMG/AMP variant classification skill for systematic pathogenicity assessment following clinical guidelines.

**Capabilities**:
- Automated evidence criteria application
- Population frequency filtering
- In silico prediction integration
- Literature evidence curation
- Inheritance pattern analysis
- Classification report generation

**Used By Processes**:
- Clinical Variant Interpretation (clinical-variant-interpretation)
- Rare Disease Diagnostic Pipeline (rare-disease-diagnostics)
- Newborn Screening Genomics (newborn-screening-genomics)

**Tools/Libraries**: InterVar, VarSome API, ClinVar

---

### Transcriptomics Skills

#### 11. star-rnaseq-aligner
**Description**: STAR alignment skill for splice-aware RNA-seq read mapping with comprehensive QC metrics.

**Capabilities**:
- Splice junction detection
- Two-pass alignment mode
- Chimeric read detection (fusions)
- Gene quantification (--quantMode)
- Custom genome index generation
- Output in multiple formats

**Used By Processes**:
- RNA-seq Differential Expression Analysis (rnaseq-differential-expression)
- Single-Cell RNA-seq Analysis (scrnaseq-analysis)
- Spatial Transcriptomics Analysis (spatial-transcriptomics)

**Tools/Libraries**: STAR, HISAT2, kallisto

---

#### 12. salmon-quantifier
**Description**: Salmon pseudo-alignment skill for fast and accurate transcript quantification.

**Capabilities**:
- Selective alignment mode
- GC bias correction
- Mapping rate assessment
- Bootstrap uncertainty estimation
- Multi-mapping resolution
- Decoy-aware indexing

**Used By Processes**:
- RNA-seq Differential Expression Analysis (rnaseq-differential-expression)
- Single-Cell RNA-seq Analysis (scrnaseq-analysis)

**Tools/Libraries**: Salmon, kallisto, RSEM

---

#### 13. deseq2-differential-expression
**Description**: DESeq2 differential expression analysis skill with normalization, statistical modeling, and visualization.

**Capabilities**:
- Size factor normalization
- Negative binomial modeling
- Shrinkage estimation
- Batch effect modeling
- Multi-factor designs
- Result visualization (MA plots, volcano plots)

**Used By Processes**:
- RNA-seq Differential Expression Analysis (rnaseq-differential-expression)
- Single-Cell RNA-seq Analysis (scrnaseq-analysis)
- CRISPR Screen Analysis (crispr-screen-analysis)

**Tools/Libraries**: DESeq2, edgeR, limma-voom

---

#### 14. seurat-single-cell-analyzer
**Description**: Seurat single-cell analysis skill for clustering, annotation, and trajectory analysis of scRNA-seq data.

**Capabilities**:
- Quality filtering and normalization
- Dimensionality reduction (PCA, UMAP)
- Graph-based clustering
- Marker gene identification
- Cell type annotation
- Integration across datasets
- Trajectory inference

**Used By Processes**:
- Single-Cell RNA-seq Analysis (scrnaseq-analysis)
- Spatial Transcriptomics Analysis (spatial-transcriptomics)

**Tools/Libraries**: Seurat, Scanpy, CellRanger

---

#### 15. cellranger-processor
**Description**: Cell Ranger skill for 10X Genomics single-cell data processing including demultiplexing and alignment.

**Capabilities**:
- BCL to FASTQ conversion
- Cell barcode demultiplexing
- UMI counting
- Feature barcode processing
- Aggregate sample analysis
- Loupe Browser file generation

**Used By Processes**:
- Single-Cell RNA-seq Analysis (scrnaseq-analysis)
- Spatial Transcriptomics Analysis (spatial-transcriptomics)

**Tools/Libraries**: Cell Ranger, STARsolo

---

#### 16. gsea-pathway-analyzer
**Description**: Gene Set Enrichment Analysis skill for functional annotation and pathway interpretation.

**Capabilities**:
- Preranked GSEA execution
- Gene ontology enrichment
- KEGG/Reactome pathway analysis
- Custom gene set support
- Leading edge analysis
- Publication-ready visualizations

**Used By Processes**:
- RNA-seq Differential Expression Analysis (rnaseq-differential-expression)
- Single-Cell RNA-seq Analysis (scrnaseq-analysis)
- Multi-Omics Data Integration (multi-omics-integration)

**Tools/Libraries**: GSEA, clusterProfiler, g:Profiler, Enrichr

---

### Proteomics Skills

#### 17. maxquant-processor
**Description**: MaxQuant mass spectrometry skill for protein identification and quantification.

**Capabilities**:
- Andromeda search engine execution
- Label-free quantification (LFQ)
- TMT/iTRAQ labeled quantification
- Match between runs
- FDR control and filtering
- PTM site localization

**Used By Processes**:
- Mass Spectrometry Proteomics Pipeline (ms-proteomics-pipeline)
- Multi-Omics Data Integration (multi-omics-integration)

**Tools/Libraries**: MaxQuant, MSFragger, Proteome Discoverer

---

#### 18. perseus-statistical-analyzer
**Description**: Perseus statistical analysis skill for proteomics data analysis and visualization.

**Capabilities**:
- Missing value imputation
- Normalization strategies
- Statistical testing (t-test, ANOVA)
- Hierarchical clustering
- PCA and enrichment analysis
- Publication-quality plots

**Used By Processes**:
- Mass Spectrometry Proteomics Pipeline (ms-proteomics-pipeline)
- Multi-Omics Data Integration (multi-omics-integration)

**Tools/Libraries**: Perseus, MSstats, limma

---

#### 19. string-network-analyzer
**Description**: STRING protein interaction network skill for functional enrichment and network visualization.

**Capabilities**:
- Protein-protein interaction queries
- Network clustering
- Functional enrichment analysis
- Cytoscape integration
- Network visualization
- Interaction confidence scoring

**Used By Processes**:
- Mass Spectrometry Proteomics Pipeline (ms-proteomics-pipeline)
- Multi-Omics Data Integration (multi-omics-integration)

**Tools/Libraries**: STRING-db, Cytoscape, NetworkX

---

### Structural Biology Skills

#### 20. alphafold-predictor
**Description**: AlphaFold protein structure prediction skill with confidence assessment and model analysis.

**Capabilities**:
- Structure prediction execution
- pLDDT confidence scoring
- PAE analysis
- Multi-chain complex prediction
- Template-based refinement
- ColabFold integration

**Used By Processes**:
- Protein Structure Prediction (protein-structure-prediction)
- Molecular Docking and Virtual Screening (molecular-docking)

**Tools/Libraries**: AlphaFold2, ColabFold, RoseTTAFold

---

#### 21. autodock-docking-engine
**Description**: AutoDock molecular docking skill for small molecule binding prediction and virtual screening.

**Capabilities**:
- Receptor and ligand preparation
- Grid generation and docking
- Scoring function evaluation
- Pose clustering and ranking
- Batch virtual screening
- Binding affinity prediction

**Used By Processes**:
- Molecular Docking and Virtual Screening (molecular-docking)
- Protein Structure Prediction (protein-structure-prediction)

**Tools/Libraries**: AutoDock Vina, GOLD, Glide, rDock

---

#### 22. pymol-visualizer
**Description**: PyMOL molecular visualization skill for structure rendering and analysis.

**Capabilities**:
- Protein structure visualization
- Surface representation
- Binding site highlighting
- Movie and animation generation
- Publication-quality images
- Scripted visualization pipelines

**Used By Processes**:
- Protein Structure Prediction (protein-structure-prediction)
- Molecular Docking and Virtual Screening (molecular-docking)

**Tools/Libraries**: PyMOL, ChimeraX, VMD, NGLview

---

#### 23. rdkit-chemoinformatics
**Description**: RDKit chemoinformatics skill for molecular property calculation and compound library management.

**Capabilities**:
- Molecular descriptor calculation
- SMILES/InChI handling
- Substructure searching
- Fingerprint generation
- ADMET property prediction
- Compound library filtering

**Used By Processes**:
- Molecular Docking and Virtual Screening (molecular-docking)

**Tools/Libraries**: RDKit, Open Babel, ChEMBL

---

### Metagenomics Skills

#### 24. qiime2-microbiome-analyzer
**Description**: QIIME2 microbiome analysis skill for 16S rRNA profiling and diversity analysis.

**Capabilities**:
- Demultiplexing and denoising (DADA2)
- Taxonomic classification
- Alpha diversity metrics
- Beta diversity analysis
- Differential abundance testing
- Phylogenetic analysis

**Used By Processes**:
- 16S rRNA Microbiome Analysis (16s-microbiome-analysis)

**Tools/Libraries**: QIIME2, DADA2, phyloseq

---

#### 25. kraken2-taxonomic-classifier
**Description**: Kraken2 taxonomic classification skill for rapid metagenomic read assignment.

**Capabilities**:
- k-mer based classification
- Custom database creation
- Confidence score filtering
- Bracken abundance estimation
- Multi-sample reporting
- Memory-efficient operation

**Used By Processes**:
- Shotgun Metagenomics Pipeline (shotgun-metagenomics)
- 16S rRNA Microbiome Analysis (16s-microbiome-analysis)

**Tools/Libraries**: Kraken2, Bracken, Centrifuge

---

#### 26. metaphlan-profiler
**Description**: MetaPhlAn metagenomic profiling skill for species-level community composition.

**Capabilities**:
- Clade-specific marker gene analysis
- Species-level quantification
- Strain-level profiling (StrainPhlAn)
- Unknown species estimation
- Multi-sample heatmaps
- Comparative analysis

**Used By Processes**:
- Shotgun Metagenomics Pipeline (shotgun-metagenomics)

**Tools/Libraries**: MetaPhlAn4, StrainPhlAn, mOTUs

---

#### 27. humann-functional-profiler
**Description**: HUMAnN functional profiling skill for metagenomic pathway analysis.

**Capabilities**:
- Gene family quantification
- MetaCyc pathway abundance
- UniRef annotation
- Stratified functional profiles
- Pathway coverage analysis
- Custom database integration

**Used By Processes**:
- Shotgun Metagenomics Pipeline (shotgun-metagenomics)

**Tools/Libraries**: HUMAnN3, eggNOG-mapper, Prokka

---

#### 28. megahit-assembler
**Description**: MEGAHIT metagenomic assembly skill for reconstructing genomes from short reads.

**Capabilities**:
- Memory-efficient assembly
- Multiple k-mer strategies
- Contig quality assessment
- Large dataset handling
- Iterative assembly refinement
- Assembly graph analysis

**Used By Processes**:
- Shotgun Metagenomics Pipeline (shotgun-metagenomics)

**Tools/Libraries**: MEGAHIT, metaSPAdes, IDBA-UD

---

### Clinical Genomics Skills

#### 29. pharmgkb-annotator
**Description**: PharmGKB pharmacogenomics annotation skill for drug-gene interaction assessment.

**Capabilities**:
- Star allele calling (Stargazer)
- Diplotype determination
- CPIC guideline integration
- Drug recommendation generation
- Clinical annotation lookup
- Dosing guidance extraction

**Used By Processes**:
- Pharmacogenomics Analysis (pharmacogenomics-analysis)
- Clinical Variant Interpretation (clinical-variant-interpretation)

**Tools/Libraries**: PharmGKB API, Stargazer, PharmCAT

---

#### 30. clinvar-querier
**Description**: ClinVar database query skill for clinical variant interpretation and pathogenicity lookup.

**Capabilities**:
- Variant significance lookup
- Submission history retrieval
- Condition association queries
- Evidence level assessment
- Batch variant queries
- VCF annotation integration

**Used By Processes**:
- Clinical Variant Interpretation (clinical-variant-interpretation)
- Rare Disease Diagnostic Pipeline (rare-disease-diagnostics)
- Tumor Molecular Profiling (tumor-molecular-profiling)

**Tools/Libraries**: ClinVar API, VarSome API, OMIM

---

#### 31. hpo-phenotype-matcher
**Description**: Human Phenotype Ontology skill for phenotype-driven gene prioritization.

**Capabilities**:
- HPO term matching
- Gene-phenotype association scoring
- Semantic similarity analysis
- Phenotype-variant correlation
- Exomiser integration
- Prioritization reporting

**Used By Processes**:
- Rare Disease Diagnostic Pipeline (rare-disease-diagnostics)
- Clinical Variant Interpretation (clinical-variant-interpretation)

**Tools/Libraries**: HPO, Exomiser, Phen2Gene

---

#### 32. tmb-msi-calculator
**Description**: Tumor mutation burden and microsatellite instability calculation skill for immunotherapy biomarkers.

**Capabilities**:
- TMB calculation from VCF
- MSI status determination
- Neoantigen prediction
- HLA typing integration
- Biomarker thresholds
- Clinical report generation

**Used By Processes**:
- Tumor Molecular Profiling (tumor-molecular-profiling)

**Tools/Libraries**: TMBcat, MSIsensor2, MANTIS

---

#### 33. fusion-gene-detector
**Description**: Gene fusion detection skill for oncology applications with multiple caller integration.

**Capabilities**:
- RNA-based fusion calling
- DNA-based fusion detection
- Multi-caller consensus
- Visualization of fusion events
- Known fusion annotation
- Clinical actionability assessment

**Used By Processes**:
- Tumor Molecular Profiling (tumor-molecular-profiling)
- RNA-seq Differential Expression Analysis (rnaseq-differential-expression)

**Tools/Libraries**: STAR-Fusion, Arriba, FusionCatcher

---

### Infrastructure and Quality Skills

#### 34. nextflow-pipeline-executor
**Description**: Nextflow workflow management skill for reproducible bioinformatics pipelines.

**Capabilities**:
- DSL2 workflow execution
- Container integration (Docker/Singularity)
- Cloud execution (AWS, GCP, Azure)
- Pipeline parameterization
- Resume and caching
- Execution reports and timelines

**Used By Processes**:
- Reproducible Research Workflow (reproducible-research)
- Analysis Pipeline Validation (pipeline-validation)
- All analysis pipelines

**Tools/Libraries**: Nextflow, nf-core, Snakemake

---

#### 35. snakemake-workflow-manager
**Description**: Snakemake workflow management skill for rule-based pipeline execution.

**Capabilities**:
- DAG-based workflow execution
- Cluster/cloud execution
- Conda environment management
- Checkpointing and resume
- Benchmark collection
- Report generation

**Used By Processes**:
- Reproducible Research Workflow (reproducible-research)
- Analysis Pipeline Validation (pipeline-validation)

**Tools/Libraries**: Snakemake, Conda, Bioconda

---

#### 36. singularity-container-manager
**Description**: Singularity container management skill for HPC-compatible containerized execution.

**Capabilities**:
- Container building from recipes
- Registry pull and caching
- Bind mount configuration
- GPU passthrough
- MPI integration
- Security compliance for HPC

**Used By Processes**:
- Reproducible Research Workflow (reproducible-research)
- All analysis pipelines

**Tools/Libraries**: Singularity/Apptainer, Docker, BioContainers

---

#### 37. giab-benchmark-validator
**Description**: Genome in a Bottle benchmark validation skill for pipeline accuracy assessment.

**Capabilities**:
- Truth set comparison
- hap.py/vcfeval execution
- Sensitivity/specificity calculation
- Stratified performance metrics
- Difficult region analysis
- Validation report generation

**Used By Processes**:
- Analysis Pipeline Validation (pipeline-validation)
- Whole Genome Sequencing Pipeline (wgs-analysis-pipeline)

**Tools/Libraries**: hap.py, vcfeval, GIAB resources

---

#### 38. ga4gh-standards-validator
**Description**: GA4GH standards compliance skill for data sharing and interoperability.

**Capabilities**:
- VCF/BAM format validation
- htsget API compliance
- Beacon protocol testing
- DRS/WES/TES compliance
- Data model validation
- Interoperability testing

**Used By Processes**:
- Genomic Data Governance (genomic-data-governance)
- Reproducible Research Workflow (reproducible-research)

**Tools/Libraries**: GA4GH toolkits, htslib, Beacon v2

---

#### 39. igv-genome-browser
**Description**: IGV integration skill for interactive genome visualization and review.

**Capabilities**:
- BAM/VCF/BED visualization
- Batch screenshot generation
- Session management
- Track customization
- Region navigation
- Multi-sample comparison

**Used By Processes**:
- Clinical Variant Interpretation (clinical-variant-interpretation)
- Tumor Molecular Profiling (tumor-molecular-profiling)
- Whole Genome Sequencing Pipeline (wgs-analysis-pipeline)

**Tools/Libraries**: IGV, IGV.js, JBrowse2

---

#### 40. ucsc-genome-browser-querier
**Description**: UCSC Genome Browser query skill for genome annotation retrieval and track data access.

**Capabilities**:
- Track data retrieval
- Custom track upload
- Genome annotation queries
- Conservation score extraction
- Table browser queries
- bigWig/bigBed handling

**Used By Processes**:
- Whole Genome Sequencing Pipeline (wgs-analysis-pipeline)
- RNA-seq Differential Expression Analysis (rnaseq-differential-expression)

**Tools/Libraries**: UCSC API, kent utilities, pyBigWig

---

#### 41. hipaa-compliance-validator
**Description**: HIPAA compliance validation skill for genomic data handling and audit.

**Capabilities**:
- PHI detection and flagging
- Access control validation
- Audit log analysis
- De-identification verification
- Consent tracking
- Compliance report generation

**Used By Processes**:
- Genomic Data Governance (genomic-data-governance)
- All clinical pipelines

**Tools/Libraries**: Custom validators, audit frameworks

---

#### 42. mageck-crispr-analyzer
**Description**: MAGeCK CRISPR screen analysis skill for gene essentiality scoring.

**Capabilities**:
- Guide read counting
- Normalization and QC
- Gene-level analysis
- Pathway enrichment
- MLE model for complex designs
- Visualization outputs

**Used By Processes**:
- CRISPR Screen Analysis (crispr-screen-analysis)

**Tools/Libraries**: MAGeCK, BAGEL, CRISPResso2

---

## Agents

### Planning and Design Agents

#### 1. bioinformatics-project-planner
**Description**: Agent specialized in bioinformatics project scoping, experimental design consultation, and analysis strategy planning.

**Responsibilities**:
- Experimental design review
- Analysis strategy formulation
- Resource estimation (compute, storage)
- Timeline and milestone planning
- Technology selection guidance
- Risk assessment

**Used By Processes**:
- All pipeline processes
- Reproducible Research Workflow (reproducible-research)

**Required Skills**: nextflow-pipeline-executor, giab-benchmark-validator

---

#### 2. ngs-experiment-designer
**Description**: Agent specialized in NGS experimental design including library preparation, sequencing depth, and coverage optimization.

**Responsibilities**:
- Sequencing depth calculation
- Library preparation recommendations
- Control sample design
- Batch effect mitigation
- Cost optimization
- Quality metrics definition

**Used By Processes**:
- Whole Genome Sequencing Pipeline (wgs-analysis-pipeline)
- RNA-seq Differential Expression Analysis (rnaseq-differential-expression)
- Single-Cell RNA-seq Analysis (scrnaseq-analysis)

**Required Skills**: fastqc-quality-analyzer, samtools-bam-processor

---

### Genomics Analysis Agents

#### 3. wgs-pipeline-operator
**Description**: Agent specialized in whole genome sequencing pipeline execution, optimization, and troubleshooting.

**Responsibilities**:
- Pipeline configuration
- Parameter optimization
- Quality assessment
- Error diagnosis and resolution
- Resource monitoring
- Output validation

**Used By Processes**:
- Whole Genome Sequencing Pipeline (wgs-analysis-pipeline)

**Required Skills**: bwa-aligner, gatk-variant-caller, deepvariant-caller, samtools-bam-processor, fastqc-quality-analyzer

---

#### 4. variant-analyst
**Description**: Agent specialized in variant interpretation, annotation curation, and clinical significance assessment.

**Responsibilities**:
- Variant filtering and prioritization
- Annotation review and curation
- Clinical database queries
- Literature evidence assessment
- Inheritance pattern analysis
- Report preparation

**Used By Processes**:
- Clinical Variant Interpretation (clinical-variant-interpretation)
- Rare Disease Diagnostic Pipeline (rare-disease-diagnostics)

**Required Skills**: vep-variant-annotator, acmg-variant-classifier, clinvar-querier, hpo-phenotype-matcher

---

#### 5. structural-variant-analyst
**Description**: Agent specialized in structural variant detection, validation, and clinical interpretation.

**Responsibilities**:
- SV caller selection and configuration
- Multi-caller result integration
- Visualization and manual review
- Clinical significance assessment
- Breakpoint refinement
- CNV validation

**Used By Processes**:
- Whole Genome Sequencing Pipeline (wgs-analysis-pipeline)
- Tumor Molecular Profiling (tumor-molecular-profiling)

**Required Skills**: structural-variant-detector, igv-genome-browser

---

#### 6. long-read-specialist
**Description**: Agent specialized in long-read sequencing analysis for Oxford Nanopore and PacBio platforms.

**Responsibilities**:
- Basecalling optimization
- Assembly strategy selection
- Phasing and haplotype analysis
- Methylation calling
- Quality assessment
- Hybrid assembly approaches

**Used By Processes**:
- Long-Read Sequencing Analysis (long-read-analysis)

**Required Skills**: bwa-aligner, structural-variant-detector, samtools-bam-processor

---

### Transcriptomics Agents

#### 7. rnaseq-analyst
**Description**: Agent specialized in bulk RNA-seq analysis from alignment to pathway interpretation.

**Responsibilities**:
- Alignment QC and optimization
- Normalization strategy selection
- Statistical model design
- Batch effect correction
- Pathway analysis execution
- Result visualization

**Used By Processes**:
- RNA-seq Differential Expression Analysis (rnaseq-differential-expression)

**Required Skills**: star-rnaseq-aligner, salmon-quantifier, deseq2-differential-expression, gsea-pathway-analyzer

---

#### 8. single-cell-analyst
**Description**: Agent specialized in single-cell RNA-seq analysis including clustering, annotation, and trajectory inference.

**Responsibilities**:
- Quality filtering optimization
- Clustering parameter tuning
- Cell type annotation
- Trajectory analysis
- Multi-sample integration
- Visualization creation

**Used By Processes**:
- Single-Cell RNA-seq Analysis (scrnaseq-analysis)
- Spatial Transcriptomics Analysis (spatial-transcriptomics)

**Required Skills**: cellranger-processor, seurat-single-cell-analyzer, deseq2-differential-expression

---

#### 9. spatial-transcriptomics-analyst
**Description**: Agent specialized in spatial transcriptomics data analysis and tissue context integration.

**Responsibilities**:
- Spot/cell deconvolution
- Spatial clustering
- Image integration
- Spatially variable gene detection
- Cell type mapping
- Tissue domain identification

**Used By Processes**:
- Spatial Transcriptomics Analysis (spatial-transcriptomics)

**Required Skills**: seurat-single-cell-analyzer, gsea-pathway-analyzer

---

### Proteomics and Structural Biology Agents

#### 10. proteomics-analyst
**Description**: Agent specialized in mass spectrometry data analysis and protein quantification.

**Responsibilities**:
- Database search configuration
- Quantification strategy selection
- Statistical analysis execution
- PTM analysis
- Pathway enrichment
- Multi-omics correlation

**Used By Processes**:
- Mass Spectrometry Proteomics Pipeline (ms-proteomics-pipeline)

**Required Skills**: maxquant-processor, perseus-statistical-analyzer, string-network-analyzer

---

#### 11. structural-biology-analyst
**Description**: Agent specialized in protein structure prediction, analysis, and drug discovery applications.

**Responsibilities**:
- Structure prediction execution
- Quality assessment
- Active site identification
- Docking experiment design
- Virtual screening execution
- Lead compound prioritization

**Used By Processes**:
- Protein Structure Prediction (protein-structure-prediction)
- Molecular Docking and Virtual Screening (molecular-docking)

**Required Skills**: alphafold-predictor, autodock-docking-engine, pymol-visualizer, rdkit-chemoinformatics

---

#### 12. multi-omics-integrator
**Description**: Agent specialized in integrating multiple omics data types for systems biology insights.

**Responsibilities**:
- Data harmonization
- Feature matching across platforms
- Integration method selection
- Network construction
- Pathway-level analysis
- Biomarker panel identification

**Used By Processes**:
- Multi-Omics Data Integration (multi-omics-integration)

**Required Skills**: deseq2-differential-expression, perseus-statistical-analyzer, gsea-pathway-analyzer, string-network-analyzer

---

### Metagenomics Agents

#### 13. microbiome-analyst
**Description**: Agent specialized in 16S rRNA microbiome profiling and community analysis.

**Responsibilities**:
- Denoising parameter optimization
- Taxonomic classification
- Diversity analysis
- Differential abundance testing
- Functional prediction
- Visualization creation

**Used By Processes**:
- 16S rRNA Microbiome Analysis (16s-microbiome-analysis)

**Required Skills**: qiime2-microbiome-analyzer, kraken2-taxonomic-classifier, phylogenetics-tree-builder

---

#### 14. metagenomics-analyst
**Description**: Agent specialized in shotgun metagenomic analysis and functional profiling.

**Responsibilities**:
- Assembly strategy selection
- Taxonomic profiling
- Functional annotation
- AMR gene detection
- Metabolic pathway reconstruction
- Strain-level analysis

**Used By Processes**:
- Shotgun Metagenomics Pipeline (shotgun-metagenomics)

**Required Skills**: kraken2-taxonomic-classifier, metaphlan-profiler, humann-functional-profiler, megahit-assembler

---

### Clinical Genomics Agents

#### 15. clinical-genomics-specialist
**Description**: Agent specialized in clinical-grade variant interpretation and reporting.

**Responsibilities**:
- ACMG classification execution
- Evidence curation
- Clinical correlation
- Report generation
- Quality assurance
- Regulatory compliance

**Used By Processes**:
- Clinical Variant Interpretation (clinical-variant-interpretation)
- Rare Disease Diagnostic Pipeline (rare-disease-diagnostics)
- Newborn Screening Genomics (newborn-screening-genomics)

**Required Skills**: acmg-variant-classifier, clinvar-querier, hpo-phenotype-matcher, vep-variant-annotator

---

#### 16. oncology-genomics-specialist
**Description**: Agent specialized in tumor molecular profiling and precision oncology applications.

**Responsibilities**:
- Somatic variant calling
- TMB/MSI calculation
- Fusion detection
- Actionable mutation identification
- Therapy matching
- Clinical trial matching

**Used By Processes**:
- Tumor Molecular Profiling (tumor-molecular-profiling)

**Required Skills**: gatk-variant-caller, tmb-msi-calculator, fusion-gene-detector, clinvar-querier

---

#### 17. pharmacogenomics-specialist
**Description**: Agent specialized in pharmacogenomic analysis and drug response prediction.

**Responsibilities**:
- Star allele calling
- Diplotype interpretation
- Drug-gene interaction assessment
- CPIC guideline application
- Dosing recommendations
- Clinical report generation

**Used By Processes**:
- Pharmacogenomics Analysis (pharmacogenomics-analysis)

**Required Skills**: pharmgkb-annotator, vep-variant-annotator

---

#### 18. rare-disease-diagnostician
**Description**: Agent specialized in rare disease diagnosis using genomic data and phenotype correlation.

**Responsibilities**:
- Phenotype-driven prioritization
- Trio analysis coordination
- De novo variant identification
- Compound heterozygosity detection
- VUS review and reclassification
- Diagnostic report generation

**Used By Processes**:
- Rare Disease Diagnostic Pipeline (rare-disease-diagnostics)

**Required Skills**: hpo-phenotype-matcher, acmg-variant-classifier, clinvar-querier, vep-variant-annotator

---

### Infrastructure and Quality Agents

#### 19. pipeline-validation-engineer
**Description**: Agent specialized in bioinformatics pipeline validation and benchmarking.

**Responsibilities**:
- Benchmark dataset selection
- Accuracy assessment
- Reproducibility testing
- Performance characterization
- Validation documentation
- Regulatory compliance

**Used By Processes**:
- Analysis Pipeline Validation (pipeline-validation)

**Required Skills**: giab-benchmark-validator, nextflow-pipeline-executor, ga4gh-standards-validator

---

#### 20. reproducibility-engineer
**Description**: Agent specialized in ensuring computational reproducibility and FAIR principles implementation.

**Responsibilities**:
- Workflow containerization
- Version control enforcement
- Environment specification
- Documentation standards
- Data archival
- CI/CD setup for pipelines

**Used By Processes**:
- Reproducible Research Workflow (reproducible-research)

**Required Skills**: nextflow-pipeline-executor, snakemake-workflow-manager, singularity-container-manager, ga4gh-standards-validator

---

#### 21. data-governance-officer
**Description**: Agent specialized in genomic data governance, privacy protection, and regulatory compliance.

**Responsibilities**:
- Data classification
- Access control management
- Consent tracking
- De-identification procedures
- Audit trail maintenance
- Compliance reporting

**Used By Processes**:
- Genomic Data Governance (genomic-data-governance)

**Required Skills**: hipaa-compliance-validator, ga4gh-standards-validator

---

#### 22. bioinformatics-devops-engineer
**Description**: Agent specialized in bioinformatics infrastructure, cloud deployment, and resource optimization.

**Responsibilities**:
- Cloud infrastructure setup
- HPC cluster configuration
- Cost optimization
- Monitoring and alerting
- Disaster recovery
- Security hardening

**Used By Processes**:
- Reproducible Research Workflow (reproducible-research)
- All analysis pipelines

**Required Skills**: nextflow-pipeline-executor, singularity-container-manager

---

### Specialized Analysis Agents

#### 23. crispr-screen-analyst
**Description**: Agent specialized in CRISPR screening data analysis and hit prioritization.

**Responsibilities**:
- Guide counting QC
- Statistical analysis execution
- Essential gene identification
- Pathway enrichment
- Hit validation prioritization
- Result visualization

**Used By Processes**:
- CRISPR Screen Analysis (crispr-screen-analysis)

**Required Skills**: mageck-crispr-analyzer, gsea-pathway-analyzer

---

#### 24. bioinformatics-qa-engineer
**Description**: Agent specialized in quality assurance for bioinformatics analyses and clinical validation.

**Responsibilities**:
- QC metric monitoring
- Proficiency testing
- Edge case identification
- Error pattern analysis
- Documentation review
- Process improvement

**Used By Processes**:
- Analysis Pipeline Validation (pipeline-validation)
- All clinical pipelines

**Required Skills**: giab-benchmark-validator, fastqc-quality-analyzer, ga4gh-standards-validator

---

## Process to Skills/Agents Mapping

| Process | Recommended Skills | Recommended Agents |
|---------|-------------------|-------------------|
| wgs-analysis-pipeline | bwa-aligner, gatk-variant-caller, deepvariant-caller, vep-variant-annotator, structural-variant-detector, samtools-bam-processor, fastqc-quality-analyzer | wgs-pipeline-operator, ngs-experiment-designer |
| clinical-variant-interpretation | vep-variant-annotator, acmg-variant-classifier, clinvar-querier, hpo-phenotype-matcher, igv-genome-browser | variant-analyst, clinical-genomics-specialist |
| pharmacogenomics-analysis | pharmgkb-annotator, vep-variant-annotator, clinvar-querier | pharmacogenomics-specialist |
| rnaseq-differential-expression | star-rnaseq-aligner, salmon-quantifier, deseq2-differential-expression, gsea-pathway-analyzer, fastqc-quality-analyzer | rnaseq-analyst, ngs-experiment-designer |
| scrnaseq-analysis | cellranger-processor, seurat-single-cell-analyzer, deseq2-differential-expression, gsea-pathway-analyzer | single-cell-analyst |
| spatial-transcriptomics | seurat-single-cell-analyzer, gsea-pathway-analyzer | spatial-transcriptomics-analyst, single-cell-analyst |
| ms-proteomics-pipeline | maxquant-processor, perseus-statistical-analyzer, string-network-analyzer | proteomics-analyst |
| multi-omics-integration | deseq2-differential-expression, perseus-statistical-analyzer, gsea-pathway-analyzer, string-network-analyzer | multi-omics-integrator |
| protein-structure-prediction | alphafold-predictor, autodock-docking-engine, pymol-visualizer | structural-biology-analyst |
| molecular-docking | autodock-docking-engine, rdkit-chemoinformatics, pymol-visualizer | structural-biology-analyst |
| 16s-microbiome-analysis | qiime2-microbiome-analyzer, kraken2-taxonomic-classifier, phylogenetics-tree-builder | microbiome-analyst |
| shotgun-metagenomics | kraken2-taxonomic-classifier, metaphlan-profiler, humann-functional-profiler, megahit-assembler | metagenomics-analyst |
| tumor-molecular-profiling | gatk-variant-caller, tmb-msi-calculator, fusion-gene-detector, vep-variant-annotator, clinvar-querier, structural-variant-detector | oncology-genomics-specialist |
| rare-disease-diagnostics | acmg-variant-classifier, hpo-phenotype-matcher, clinvar-querier, vep-variant-annotator, igv-genome-browser | rare-disease-diagnostician, variant-analyst |
| newborn-screening-genomics | acmg-variant-classifier, clinvar-querier, vep-variant-annotator | clinical-genomics-specialist |
| pipeline-validation | giab-benchmark-validator, fastqc-quality-analyzer, ga4gh-standards-validator, nextflow-pipeline-executor | pipeline-validation-engineer, bioinformatics-qa-engineer |
| genomic-data-governance | hipaa-compliance-validator, ga4gh-standards-validator | data-governance-officer |
| reproducible-research | nextflow-pipeline-executor, snakemake-workflow-manager, singularity-container-manager, ga4gh-standards-validator | reproducibility-engineer, bioinformatics-devops-engineer |
| long-read-analysis | bwa-aligner, structural-variant-detector, samtools-bam-processor | long-read-specialist |
| crispr-screen-analysis | mageck-crispr-analyzer, gsea-pathway-analyzer, deseq2-differential-expression | crispr-screen-analyst |

---

## Shared Candidates (Cross-Specialization)

These skills and agents could be shared with other specializations:

### Shared Skills

1. **nextflow-pipeline-executor** - Applicable to any workflow-based processes (Data Engineering, DevOps)
2. **snakemake-workflow-manager** - Useful for reproducible research workflows (Data Science, Research)
3. **singularity-container-manager** - Container management for HPC (DevOps, Data Engineering)
4. **hipaa-compliance-validator** - Healthcare compliance (Security, Healthcare IT)
5. **gsea-pathway-analyzer** - Pathway analysis applicable to systems biology (Data Science)
6. **string-network-analyzer** - Network analysis applicable to systems thinking (Data Science)
7. **phylogenetics-tree-builder** - Evolutionary analysis (Data Science, Research)
8. **fastqc-quality-analyzer** - Quality control patterns applicable to data validation (Data Engineering)

### Shared Agents

1. **bioinformatics-devops-engineer** - Infrastructure expertise applicable to DevOps/SRE specialization
2. **data-governance-officer** - Governance expertise applicable to Security and Compliance specialization
3. **pipeline-validation-engineer** - Validation patterns applicable to QA Testing Automation specialization
4. **reproducibility-engineer** - Reproducibility practices applicable to Data Engineering and Data Science

---

## Implementation Priority

### High Priority (Core Genomics Workflows)
1. bwa-aligner
2. gatk-variant-caller
3. vep-variant-annotator
4. acmg-variant-classifier
5. star-rnaseq-aligner
6. deseq2-differential-expression
7. wgs-pipeline-operator (agent)
8. variant-analyst (agent)
9. clinical-genomics-specialist (agent)

### Medium Priority (Specialized Analysis)
1. seurat-single-cell-analyzer
2. alphafold-predictor
3. kraken2-taxonomic-classifier
4. maxquant-processor
5. nextflow-pipeline-executor
6. giab-benchmark-validator
7. single-cell-analyst (agent)
8. oncology-genomics-specialist (agent)
9. proteomics-analyst (agent)

### Lower Priority (Advanced and Emerging)
1. humann-functional-profiler
2. autodock-docking-engine
3. mageck-crispr-analyzer
4. spatial transcriptomics tools
5. structural-biology-analyst (agent)
6. crispr-screen-analyst (agent)
7. spatial-transcriptomics-analyst (agent)

---

## Notes

- All skills should implement standardized input/output schemas following GA4GH data standards where applicable
- Skills should support both local execution and cloud-based execution (AWS, GCP, Azure)
- Container compatibility (Docker/Singularity) is essential for HPC environments
- Clinical-grade skills must include validation and audit capabilities
- Agents should provide detailed reasoning and evidence citations for clinical decisions
- All skills should support FAIR data principles for research reproducibility
- Integration with nf-core pipelines should be prioritized for community alignment
- Skills should handle both short-read and long-read sequencing data where applicable
- Error handling should include bioinformatics-specific failure modes (e.g., low coverage, sample swaps)
- Monitoring should include domain-specific QC metrics (mapping rate, duplicate rate, coverage uniformity)
