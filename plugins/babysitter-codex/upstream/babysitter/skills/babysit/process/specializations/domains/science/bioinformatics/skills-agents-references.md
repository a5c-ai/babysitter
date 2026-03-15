# Bioinformatics and Genomics - Skills and Agents References (Phase 5)

This document provides reference materials, tools, libraries, and cross-specialization resources for implementing the skills and agents defined in the skills-agents-backlog.md.

---

## Table of Contents

1. [GitHub Repositories](#github-repositories)
2. [MCP Server References](#mcp-server-references)
3. [Community Resources](#community-resources)
4. [API Documentation](#api-documentation)
5. [Applicable Skills from Other Specializations](#applicable-skills-from-other-specializations)

---

## GitHub Repositories

### Sequence Analysis

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [bwa](https://github.com/lh3/bwa) | Burrows-Wheeler Aligner | bwa-aligner |
| [minimap2](https://github.com/lh3/minimap2) | Long-read alignment | bwa-aligner, long-read |
| [samtools](https://github.com/samtools/samtools) | SAM/BAM manipulation | samtools-bam-processor |
| [htslib](https://github.com/samtools/htslib) | High-throughput sequencing library | samtools-bam-processor |
| [seqkit](https://github.com/shenwei356/seqkit) | FASTA/FASTQ toolkit | fastqc-quality-analyzer |
| [fastp](https://github.com/OpenGene/fastp) | FASTQ preprocessor | fastqc-quality-analyzer |

### Variant Calling and Analysis

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [GATK](https://github.com/broadinstitute/gatk) | Genome Analysis Toolkit | gatk-variant-caller |
| [DeepVariant](https://github.com/google/deepvariant) | Deep learning variant caller | deepvariant-caller |
| [freebayes](https://github.com/freebayes/freebayes) | Bayesian variant caller | gatk-variant-caller |
| [bcftools](https://github.com/samtools/bcftools) | VCF/BCF manipulation | vep-variant-annotator |
| [VEP](https://github.com/Ensembl/ensembl-vep) | Variant Effect Predictor | vep-variant-annotator |
| [SnpEff](https://github.com/pcingola/SnpEff) | Variant annotation | vep-variant-annotator |

### Structural Variant Detection

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [Manta](https://github.com/Illumina/manta) | Structural variant caller | structural-variant-detector |
| [DELLY](https://github.com/dellytools/delly) | SV discovery | structural-variant-detector |
| [CNVkit](https://github.com/etal/cnvkit) | Copy number calling | structural-variant-detector |
| [GRIDSS](https://github.com/PapenfussLab/gridss) | SV detection | structural-variant-detector |
| [Sniffles](https://github.com/fritzsedlazeck/Sniffles) | Long-read SV caller | structural-variant-detector |

### RNA-seq and Transcriptomics

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [STAR](https://github.com/alexdobin/STAR) | RNA-seq aligner | star-rnaseq-aligner |
| [salmon](https://github.com/COMBINE-lab/salmon) | Transcript quantification | salmon-quantifier |
| [kallisto](https://github.com/pachterlab/kallisto) | Pseudo-alignment quantification | salmon-quantifier |
| [DESeq2](https://github.com/mikelove/DESeq2) | Differential expression | deseq2-differential-expression |
| [edgeR](https://github.com/Bioconductor-Packages/edgeR) | DE analysis | deseq2-differential-expression |
| [STAR-Fusion](https://github.com/STAR-Fusion/STAR-Fusion) | Fusion gene detection | fusion-gene-detector |

### Single-Cell Analysis

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [Seurat](https://github.com/satijalab/seurat) | scRNA-seq analysis | seurat-single-cell-analyzer |
| [Scanpy](https://github.com/scverse/scanpy) | Python scRNA-seq | seurat-single-cell-analyzer |
| [CellRanger](https://support.10xgenomics.com/single-cell-gene-expression/software/pipelines/latest/what-is-cell-ranger) | 10X processing | cellranger-processor |
| [scvi-tools](https://github.com/scverse/scvi-tools) | Deep learning for scRNA | seurat-single-cell-analyzer |
| [SingleR](https://github.com/LTLA/SingleR) | Cell type annotation | seurat-single-cell-analyzer |

### Metagenomics

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [QIIME2](https://github.com/qiime2/qiime2) | Microbiome analysis | qiime2-microbiome-analyzer |
| [Kraken2](https://github.com/DerrickWood/kraken2) | Taxonomic classification | kraken2-taxonomic-classifier |
| [MetaPhlAn](https://github.com/biobakery/MetaPhlAn) | Metagenomic profiling | metaphlan-profiler |
| [HUMAnN](https://github.com/biobakery/humann) | Functional profiling | humann-functional-profiler |
| [MEGAHIT](https://github.com/voutcn/megahit) | Metagenomic assembly | megahit-assembler |

### Structural Biology

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [AlphaFold](https://github.com/deepmind/alphafold) | Protein structure prediction | alphafold-predictor |
| [ColabFold](https://github.com/sokrypton/ColabFold) | AlphaFold accessible | alphafold-predictor |
| [AutoDock-Vina](https://github.com/ccsb-scripps/AutoDock-Vina) | Molecular docking | autodock-docking-engine |
| [RDKit](https://github.com/rdkit/rdkit) | Chemoinformatics | rdkit-chemoinformatics |
| [PyMOL](https://github.com/schrodinger/pymol-open-source) | Molecular visualization | pymol-visualizer |
| [Open Babel](https://github.com/openbabel/openbabel) | Chemical formats | rdkit-chemoinformatics |

### Workflow Management

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [Nextflow](https://github.com/nextflow-io/nextflow) | Workflow engine | nextflow-pipeline-executor |
| [nf-core](https://github.com/nf-core) | Nextflow pipelines | nextflow-pipeline-executor |
| [Snakemake](https://github.com/snakemake/snakemake) | Workflow management | snakemake-workflow-manager |
| [Cromwell](https://github.com/broadinstitute/cromwell) | WDL executor | nextflow-pipeline-executor |
| [WDL](https://github.com/openwdl/wdl) | Workflow Definition Language | nextflow-pipeline-executor |

### Clinical Genomics

| Repository | Description | Relevant Skills |
|------------|-------------|-----------------|
| [InterVar](https://github.com/WGLab/InterVar) | ACMG classification | acmg-variant-classifier |
| [Exomiser](https://github.com/exomiser/Exomiser) | Phenotype-driven prioritization | hpo-phenotype-matcher |
| [PharmCAT](https://github.com/PharmGKB/PharmCAT) | Pharmacogenomics | pharmgkb-annotator |
| [MSIsensor](https://github.com/ding-lab/msisensor) | MSI detection | tmb-msi-calculator |
| [hap.py](https://github.com/Illumina/hap.py) | Variant benchmarking | giab-benchmark-validator |

---

## MCP Server References

### Data Access MCP Servers

| MCP Server | Purpose | Integration Points |
|------------|---------|-------------------|
| **filesystem** | Access FASTQ, BAM, VCF files | All analysis skills |
| **github** | Version control for pipelines | All workflow skills |
| **postgres/sqlite** | Store variant databases | Clinical genomics skills |
| **aws-s3/gcs** | Cloud data storage | All analysis pipelines |

### Potential Custom MCP Servers

| Server Concept | Description | Target Skills |
|----------------|-------------|---------------|
| **ncbi-mcp** | NCBI database queries | blast-sequence-search, clinvar-querier |
| **ensembl-mcp** | Ensembl data access | vep-variant-annotator |
| **pharmgkb-mcp** | PharmGKB queries | pharmgkb-annotator |
| **hpo-mcp** | HPO ontology queries | hpo-phenotype-matcher |
| **string-mcp** | STRING database queries | string-network-analyzer |
| **pdb-mcp** | Protein Data Bank access | alphafold-predictor, pymol-visualizer |

### Bioinformatics Database MCP Servers

| MCP Server | Purpose | Integration Points |
|------------|---------|-------------------|
| **clinvar-mcp** | ClinVar variant queries | clinvar-querier |
| **gnomad-mcp** | gnomAD frequency queries | vep-variant-annotator |
| **cosmic-mcp** | COSMIC somatic mutations | tmb-msi-calculator |
| **uniprot-mcp** | UniProt protein data | alphafold-predictor |

### HPC Integration MCP Servers

| MCP Server | Purpose | Integration Points |
|------------|---------|-------------------|
| **slurm-mcp** | SLURM job submission | All pipeline skills |
| **pbs-mcp** | PBS/Torque job submission | All pipeline skills |
| **singularity-mcp** | Container management | singularity-container-manager |

---

## Community Resources

### Professional Organizations

| Organization | Resources | Relevant Areas |
|--------------|-----------|----------------|
| [GA4GH](https://www.ga4gh.org/) | Data sharing standards | ga4gh-standards-validator |
| [ISCB](https://www.iscb.org/) | Bioinformatics society | All bioinformatics |
| [ASHG](https://www.ashg.org/) | Human genetics | Clinical genomics |
| [ACMG](https://www.acmg.net/) | Medical genetics | acmg-variant-classifier |
| [ClinGen](https://clinicalgenome.org/) | Clinical genomics | Clinical variant interpretation |

### Forums and Communities

| Community | Focus Area | URL |
|-----------|------------|-----|
| Biostars | Bioinformatics Q&A | https://www.biostars.org/ |
| SEQanswers | Sequencing discussion | http://seqanswers.com/ |
| r/bioinformatics | Reddit community | https://www.reddit.com/r/bioinformatics/ |
| nf-core Slack | Nextflow community | https://nf-co.re/join |
| Bioconductor Support | R packages | https://support.bioconductor.org/ |

### Educational Resources

| Resource | Description | Topics |
|----------|-------------|--------|
| [Bioconductor](https://www.bioconductor.org/) | R packages for genomics | All R-based skills |
| [Galaxy Training](https://training.galaxyproject.org/) | Bioinformatics tutorials | All analysis skills |
| [EMBL-EBI Training](https://www.ebi.ac.uk/training/) | Genomics courses | All bioinformatics |
| [Data Carpentry](https://datacarpentry.org/) | Data skills | Pipeline development |
| [Rosalind](https://rosalind.info/) | Bioinformatics problems | Algorithm development |

### Documentation and Tutorials

| Resource | Description | Skills |
|----------|-------------|--------|
| [nf-core Documentation](https://nf-co.re/docs) | Pipeline standards | nextflow-pipeline-executor |
| [GATK Best Practices](https://gatk.broadinstitute.org/hc/en-us/sections/360007226651-Best-Practices-Workflows) | Variant calling | gatk-variant-caller |
| [Seurat Vignettes](https://satijalab.org/seurat/vignettes.html) | scRNA-seq tutorials | seurat-single-cell-analyzer |
| [QIIME2 Tutorials](https://docs.qiime2.org/2023.9/tutorials/) | Microbiome analysis | qiime2-microbiome-analyzer |
| [AlphaFold DB](https://alphafold.ebi.ac.uk/) | Predicted structures | alphafold-predictor |

---

## API Documentation

### Database APIs

| Database | API Documentation | Integration Skills |
|----------|-------------------|-------------------|
| NCBI E-utilities | [E-utilities Docs](https://www.ncbi.nlm.nih.gov/books/NBK25500/) | blast-sequence-search, clinvar-querier |
| Ensembl REST | [Ensembl REST API](https://rest.ensembl.org/) | vep-variant-annotator |
| UniProt | [UniProt API](https://www.uniprot.org/help/programmatic_access) | alphafold-predictor |
| ClinVar | [ClinVar API](https://www.ncbi.nlm.nih.gov/clinvar/docs/api/) | clinvar-querier |
| PharmGKB | [PharmGKB API](https://api.pharmgkb.org/) | pharmgkb-annotator |
| STRING | [STRING API](https://string-db.org/cgi/help.pl?subpage=api) | string-network-analyzer |

### Tool APIs

| Tool | API Documentation | Integration Skills |
|------|-------------------|-------------------|
| GATK | [GATK Documentation](https://gatk.broadinstitute.org/) | gatk-variant-caller |
| VEP | [VEP Documentation](https://ensembl.org/info/docs/tools/vep/index.html) | vep-variant-annotator |
| Nextflow | [Nextflow Documentation](https://www.nextflow.io/docs/latest/index.html) | nextflow-pipeline-executor |
| Snakemake | [Snakemake Documentation](https://snakemake.readthedocs.io/) | snakemake-workflow-manager |
| Seurat | [Seurat Documentation](https://satijalab.org/seurat/) | seurat-single-cell-analyzer |

### Cloud Platform APIs

| Platform | Documentation | Use Cases |
|----------|---------------|-----------|
| Terra/FireCloud | [Terra API](https://api.firecloud.org/) | Cloud genomics workflows |
| DNAnexus | [DNAnexus API](https://documentation.dnanexus.com/) | Clinical genomics platform |
| Seven Bridges | [SB API](https://docs.sevenbridges.com/) | Cloud bioinformatics |
| AWS HealthOmics | [HealthOmics](https://docs.aws.amazon.com/omics/) | AWS genomics workflows |
| Google Cloud LS | [Life Sciences API](https://cloud.google.com/life-sciences/docs) | GCP genomics |

### Standards and Formats

| Standard | Specification | Skills |
|----------|---------------|--------|
| VCF | [VCF Specification](https://samtools.github.io/hts-specs/VCFv4.3.pdf) | All variant skills |
| SAM/BAM | [SAM Specification](https://samtools.github.io/hts-specs/SAMv1.pdf) | samtools-bam-processor |
| FASTQ | [FASTQ format](https://www.ncbi.nlm.nih.gov/sra/docs/submitformats/) | fastqc-quality-analyzer |
| GFF3/GTF | [GFF3 Specification](https://github.com/The-Sequence-Ontology/Specifications/blob/master/gff3.md) | star-rnaseq-aligner |
| CRAM | [CRAM Specification](https://samtools.github.io/hts-specs/CRAMv3.pdf) | samtools-bam-processor |
| GA4GH Schemas | [GA4GH Schemas](https://github.com/ga4gh-discovery) | ga4gh-standards-validator |

---

## Applicable Skills from Other Specializations

### From Biomedical Engineering

| Skill | Description | Application in Bioinformatics |
|-------|-------------|-------------------------------|
| requirements-traceability-manager | Design control | CAP/CLIA lab validation documentation |
| software-vv-test-generator | Software V&V | Pipeline validation testing |
| aiml-validation-framework | AI/ML validation | ML model validation for clinical use |
| clinical-study-designer | Clinical study design | Clinical validation study design |

### From Chemical Engineering

| Skill | Description | Application in Bioinformatics |
|-------|-------------|-------------------------------|
| kinetic-modeler | Reaction kinetics | Enzyme kinetics modeling |
| process-economics-estimator | Cost analysis | Sequencing cost optimization |

### From Data Science (Generic)

| Skill | Description | Application in Bioinformatics |
|-------|-------------|-------------------------------|
| statistical-analysis | Statistical methods | All quantitative analyses |
| machine-learning | ML algorithms | Variant pathogenicity prediction |
| data-visualization | Data viz | Genomics visualization |
| database-management | DB skills | Variant databases |

### From Software Engineering (Generic)

| Skill | Description | Application in Bioinformatics |
|-------|-------------|-------------------------------|
| ci-cd-pipeline | Continuous integration | Pipeline automation |
| containerization | Docker/Singularity | Reproducible analysis |
| version-control | Git workflows | Pipeline versioning |
| testing-frameworks | Unit/integration tests | Pipeline validation |

### From DevOps/SRE

| Skill | Description | Application in Bioinformatics |
|-------|-------------|-------------------------------|
| cloud-infrastructure | Cloud deployment | Cloud genomics platforms |
| monitoring-alerting | System monitoring | Pipeline monitoring |
| cost-optimization | Resource management | HPC cost management |

### Cross-Specialization Agent Applicability

| Agent Source | Agent | Bioinformatics Application |
|--------------|-------|---------------------------|
| Biomedical | regulatory-submission-strategist | FDA submission for clinical tests |
| Biomedical | software-lifecycle-manager | Clinical software compliance |
| Data Science | data-engineer | Genomic data pipeline development |
| Data Science | ml-engineer | AI/ML model development |
| DevOps | infrastructure-engineer | HPC/cloud infrastructure |

---

## Integration Recommendations

### Priority Tool Integrations

1. **GATK/DeepVariant** - Primary variant calling tools
2. **VEP/SnpEff** - Variant annotation
3. **Seurat/Scanpy** - Single-cell analysis
4. **Nextflow/nf-core** - Pipeline orchestration
5. **NCBI/Ensembl APIs** - Database integration

### Recommended MCP Server Development

1. **ncbi-entrez-mcp** - NCBI database queries
2. **ensembl-rest-mcp** - Ensembl data access
3. **clinical-db-mcp** - ClinVar, OMIM, HPO integration
4. **hpc-job-mcp** - SLURM/PBS job management
5. **workflow-status-mcp** - Pipeline monitoring

### Data Standards to Support

- **VCF/BCF** - Variant Call Format
- **SAM/BAM/CRAM** - Alignment formats
- **FASTQ** - Sequence reads
- **GFF3/GTF** - Gene annotations
- **BED** - Genomic intervals
- **AnnData (h5ad)** - Single-cell data
- **GA4GH schemas** - Interoperability standards
- **OMOP CDM** - Clinical data integration

---

## Summary

This reference document provides the foundational resources for implementing bioinformatics skills and agents:

| Category | Count |
|----------|-------|
| GitHub Repositories | 50+ |
| MCP Server References | 15+ |
| Community Resources | 20+ |
| API Documentation Sources | 25+ |
| Cross-Specialization Skills | 15+ |

---

**Created**: 2026-01-25
**Version**: 1.0.0
**Status**: Phase 5 - References Documented
**Next Step**: Implement specialized skills and agents using these references
