/**
 * @process specializations/domains/science/bioinformatics/scrnaseq-analysis
 * @description Single-Cell RNA-seq Analysis - End-to-end analysis pipeline for single-cell RNA
 * sequencing data including quality control, normalization, clustering, cell type annotation,
 * and trajectory analysis.
 * @inputs { projectName: string, samples: array, technology?: string, expectedCellTypes?: array, outputDir?: string }
 * @outputs { success: boolean, clusters: array, cellTypes: object, trajectories: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/bioinformatics/scrnaseq-analysis', {
 *   projectName: 'PBMC Single-Cell Atlas',
 *   samples: [{ id: 'sample1', path: '/data/sample1' }],
 *   technology: '10X_Chromium',
 *   expectedCellTypes: ['T cells', 'B cells', 'Monocytes', 'NK cells']
 * });
 *
 * @references
 * - Scanpy: https://scanpy.readthedocs.io/
 * - Seurat: https://satijalab.org/seurat/
 * - scVI: https://docs.scvi-tools.org/
 * - CellTypist: https://www.celltypist.org/
 * - Monocle3: https://cole-trapnell-lab.github.io/monocle3/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    samples = [],
    technology = '10X_Chromium', // '10X_Chromium', 'Smart-seq2', 'Drop-seq', 'inDrop'
    expectedCellTypes = [],
    outputDir = 'scrnaseq-output',
    minGenes = 200,
    maxGenes = 5000,
    maxMitoPercent = 20,
    nPCs = 50,
    resolution = 0.5,
    annotationReference = 'PBMC',
    performTrajectory = true,
    performCellChat = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const clusters = [];

  ctx.log('info', `Starting Single-Cell RNA-seq Analysis for ${projectName}`);
  ctx.log('info', `Samples: ${samples.length}, Technology: ${technology}`);

  // ============================================================================
  // PHASE 1: DATA LOADING AND CELL BARCODE PROCESSING
  // ============================================================================

  ctx.log('info', 'Phase 1: Data Loading and Cell Barcode Processing');

  const loadingResult = await ctx.task(dataLoadingTask, {
    projectName,
    samples,
    technology,
    outputDir
  });

  artifacts.push(...loadingResult.artifacts);

  ctx.log('info', `Loaded ${loadingResult.totalCells} cells from ${loadingResult.samplesProcessed} samples`);

  // ============================================================================
  // PHASE 2: QUALITY CONTROL AND FILTERING
  // ============================================================================

  ctx.log('info', 'Phase 2: Quality Control and Cell Filtering');

  const qcResult = await ctx.task(cellQualityControlTask, {
    projectName,
    adata: loadingResult.adata,
    minGenes,
    maxGenes,
    maxMitoPercent,
    outputDir
  });

  artifacts.push(...qcResult.artifacts);

  ctx.log('info', `QC complete - ${qcResult.cellsRetained}/${loadingResult.totalCells} cells retained (${qcResult.doubletRate}% doublets removed)`);

  // Breakpoint: Review QC metrics
  await ctx.breakpoint({
    question: `Cell quality control complete. Retained ${qcResult.cellsRetained} cells (${qcResult.percentRetained}%). Doublets removed: ${qcResult.doubletsRemoved}. Review QC metrics?`,
    title: 'Single-Cell QC Review',
    context: {
      runId: ctx.runId,
      qcMetrics: {
        totalCells: loadingResult.totalCells,
        cellsRetained: qcResult.cellsRetained,
        percentRetained: qcResult.percentRetained,
        medianGenes: qcResult.medianGenes,
        medianUMI: qcResult.medianUMI,
        medianMitoPercent: qcResult.medianMitoPercent
      },
      files: qcResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 3: NORMALIZATION AND FEATURE SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 3: Normalization and Feature Selection');

  const normalizationResult = await ctx.task(normalizationFeatureSelectionTask, {
    projectName,
    adata: qcResult.filteredAdata,
    outputDir
  });

  artifacts.push(...normalizationResult.artifacts);

  ctx.log('info', `Normalization complete - ${normalizationResult.hvgCount} highly variable genes selected`);

  // ============================================================================
  // PHASE 4: DIMENSIONALITY REDUCTION
  // ============================================================================

  ctx.log('info', 'Phase 4: Dimensionality Reduction (PCA, UMAP)');

  const dimReductionResult = await ctx.task(dimensionalityReductionTask, {
    projectName,
    adata: normalizationResult.normalizedAdata,
    nPCs,
    outputDir
  });

  artifacts.push(...dimReductionResult.artifacts);

  ctx.log('info', `Dimensionality reduction complete - Using ${dimReductionResult.optimalPCs} PCs`);

  // ============================================================================
  // PHASE 5: CLUSTERING AND MARKER GENE IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Clustering and Marker Gene Identification');

  const clusteringResult = await ctx.task(clusteringMarkerGenesTask, {
    projectName,
    adata: dimReductionResult.reducedAdata,
    resolution,
    outputDir
  });

  artifacts.push(...clusteringResult.artifacts);
  clusters.push(...clusteringResult.clusters);

  ctx.log('info', `Clustering complete - ${clusteringResult.nClusters} clusters identified`);

  // Breakpoint: Review clustering
  await ctx.breakpoint({
    question: `Clustering identified ${clusteringResult.nClusters} clusters. Top markers per cluster available. Review clustering results and marker genes?`,
    title: 'Clustering Review',
    context: {
      runId: ctx.runId,
      nClusters: clusteringResult.nClusters,
      clusterSizes: clusteringResult.clusterSizes,
      topMarkers: clusteringResult.topMarkersByCluster,
      files: clusteringResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 6: AUTOMATED CELL TYPE ANNOTATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Automated Cell Type Annotation');

  const annotationResult = await ctx.task(cellTypeAnnotationTask, {
    projectName,
    adata: clusteringResult.clusteredAdata,
    annotationReference,
    expectedCellTypes,
    outputDir
  });

  artifacts.push(...annotationResult.artifacts);

  ctx.log('info', `Cell type annotation complete - ${annotationResult.cellTypesIdentified} cell types identified`);

  // Breakpoint: Review cell type annotation
  await ctx.breakpoint({
    question: `Cell type annotation complete. ${annotationResult.cellTypesIdentified} cell types identified. Review annotations and approve?`,
    title: 'Cell Type Annotation Review',
    context: {
      runId: ctx.runId,
      cellTypes: annotationResult.cellTypes,
      cellTypeCounts: annotationResult.cellTypeCounts,
      annotationConfidence: annotationResult.confidenceScores,
      files: annotationResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 7: TRAJECTORY AND PSEUDOTIME ANALYSIS (OPTIONAL)
  // ============================================================================

  let trajectoryResult = null;
  if (performTrajectory) {
    ctx.log('info', 'Phase 7: Trajectory and Pseudotime Analysis');

    trajectoryResult = await ctx.task(trajectoryAnalysisTask, {
      projectName,
      adata: annotationResult.annotatedAdata,
      outputDir
    });

    artifacts.push(...trajectoryResult.artifacts);

    ctx.log('info', `Trajectory analysis complete - ${trajectoryResult.trajectoriesIdentified} lineages identified`);
  }

  // ============================================================================
  // PHASE 8: CELL-CELL COMMUNICATION ANALYSIS (OPTIONAL)
  // ============================================================================

  let cellChatResult = null;
  if (performCellChat) {
    ctx.log('info', 'Phase 8: Cell-Cell Communication Analysis');

    cellChatResult = await ctx.task(cellCommunicationTask, {
      projectName,
      adata: annotationResult.annotatedAdata,
      outputDir
    });

    artifacts.push(...cellChatResult.artifacts);

    ctx.log('info', `Cell communication analysis complete - ${cellChatResult.significantInteractions} significant interactions`);
  }

  // ============================================================================
  // PHASE 9: DIFFERENTIAL EXPRESSION BETWEEN CLUSTERS
  // ============================================================================

  ctx.log('info', 'Phase 9: Differential Expression Between Cell Types');

  const deResult = await ctx.task(clusterDifferentialExpressionTask, {
    projectName,
    adata: annotationResult.annotatedAdata,
    outputDir
  });

  artifacts.push(...deResult.artifacts);

  ctx.log('info', `DE analysis complete - ${deResult.totalDEGenes} differentially expressed genes across clusters`);

  // ============================================================================
  // PHASE 10: GENERATE COMPREHENSIVE REPORT
  // ============================================================================

  ctx.log('info', 'Phase 10: Generating Analysis Report');

  const reportResult = await ctx.task(generateScRNAseqReportTask, {
    projectName,
    technology,
    loadingResult,
    qcResult,
    normalizationResult,
    dimReductionResult,
    clusteringResult,
    annotationResult,
    trajectoryResult,
    cellChatResult,
    deResult,
    outputDir
  });

  artifacts.push(...reportResult.artifacts);

  // Final Breakpoint: Analysis complete
  await ctx.breakpoint({
    question: `Single-Cell RNA-seq Analysis Complete for ${projectName}. ${qcResult.cellsRetained} cells, ${clusteringResult.nClusters} clusters, ${annotationResult.cellTypesIdentified} cell types. Approve final results?`,
    title: 'scRNA-seq Analysis Complete',
    context: {
      runId: ctx.runId,
      summary: {
        totalCells: qcResult.cellsRetained,
        clusters: clusteringResult.nClusters,
        cellTypes: annotationResult.cellTypesIdentified,
        trajectories: trajectoryResult?.trajectoriesIdentified || 0,
        interactions: cellChatResult?.significantInteractions || 0
      },
      files: [
        { path: reportResult.reportPath, format: 'markdown', label: 'Analysis Report' },
        { path: annotationResult.adataPath, format: 'h5ad', label: 'Annotated Data' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    technology,
    cellsAnalyzed: qcResult.cellsRetained,
    clusters: clusters.map(c => ({
      clusterId: c.id,
      cellCount: c.cellCount,
      cellType: c.annotatedCellType,
      topMarkers: c.topMarkers
    })),
    cellTypes: {
      identified: annotationResult.cellTypesIdentified,
      counts: annotationResult.cellTypeCounts,
      proportions: annotationResult.cellTypeProportions
    },
    trajectories: trajectoryResult ? {
      lineages: trajectoryResult.trajectoriesIdentified,
      branchPoints: trajectoryResult.branchPoints,
      pseudotimeRange: trajectoryResult.pseudotimeRange
    } : null,
    cellCommunication: cellChatResult ? {
      significantInteractions: cellChatResult.significantInteractions,
      topPathways: cellChatResult.topPathways,
      senderReceiverPairs: cellChatResult.topPairs
    } : null,
    qcMetrics: {
      cellsRetained: qcResult.cellsRetained,
      percentRetained: qcResult.percentRetained,
      medianGenes: qcResult.medianGenes,
      medianUMI: qcResult.medianUMI
    },
    outputFiles: {
      report: reportResult.reportPath,
      annotatedAdata: annotationResult.adataPath,
      markerGenes: clusteringResult.markerTablePath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/science/bioinformatics/scrnaseq-analysis',
      processSlug: 'scrnaseq-analysis',
      category: 'bioinformatics',
      timestamp: startTime,
      technology,
      resolution
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const dataLoadingTask = defineTask('data-loading', (args, taskCtx) => ({
  kind: 'agent',
  title: `Data Loading - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Single-Cell Data Processing Specialist',
      task: 'Load and process single-cell RNA-seq data',
      context: {
        projectName: args.projectName,
        samples: args.samples,
        technology: args.technology,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Load data based on technology platform:',
        '   - 10X Chromium: Load from Cell Ranger output (filtered_feature_bc_matrix)',
        '   - Smart-seq2: Load count matrix with cell metadata',
        '   - Drop-seq: Load from dropEst or similar output',
        '2. Create AnnData object with counts matrix',
        '3. Add cell metadata (sample, batch, etc.)',
        '4. Add gene metadata (gene names, biotypes)',
        '5. Calculate basic QC metrics per cell',
        '6. If multiple samples, concatenate with batch labels',
        '7. Validate data integrity',
        '8. Generate data loading summary',
        '9. Create initial UMAP for QC visualization',
        '10. Save raw data object'
      ],
      outputFormat: 'JSON object with loaded data information'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'adata', 'totalCells', 'samplesProcessed', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        adata: { type: 'string', description: 'Path to AnnData object' },
        totalCells: { type: 'number' },
        totalGenes: { type: 'number' },
        samplesProcessed: { type: 'number' },
        sampleSummary: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['bioinformatics', 'single-cell', 'data-loading']
}));

export const cellQualityControlTask = defineTask('cell-quality-control', (args, taskCtx) => ({
  kind: 'agent',
  title: `Cell Quality Control - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Single-Cell QC Specialist',
      task: 'Perform quality control and filter low-quality cells',
      context: {
        projectName: args.projectName,
        adata: args.adata,
        minGenes: args.minGenes,
        maxGenes: args.maxGenes,
        maxMitoPercent: args.maxMitoPercent,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Calculate QC metrics:',
        '   - Number of genes per cell',
        '   - Number of UMIs per cell',
        '   - Percent mitochondrial reads',
        '   - Percent ribosomal reads',
        '2. Run doublet detection (Scrublet or DoubletFinder)',
        '3. Identify empty droplets and low-quality cells',
        '4. Apply QC filters:',
        '   - minGenes < n_genes < maxGenes',
        '   - percent_mito < maxMitoPercent',
        '   - Remove predicted doublets',
        '5. Generate QC violin plots',
        '6. Generate scatter plots (genes vs UMI, mito vs genes)',
        '7. Create QC metrics summary table',
        '8. Document filtering criteria and thresholds',
        '9. Save filtered data object',
        '10. Generate QC report'
      ],
      outputFormat: 'JSON object with QC results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'filteredAdata', 'cellsRetained', 'percentRetained', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        filteredAdata: { type: 'string' },
        cellsRetained: { type: 'number' },
        percentRetained: { type: 'number' },
        doubletsRemoved: { type: 'number' },
        doubletRate: { type: 'number' },
        medianGenes: { type: 'number' },
        medianUMI: { type: 'number' },
        medianMitoPercent: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['bioinformatics', 'single-cell', 'quality-control']
}));

export const normalizationFeatureSelectionTask = defineTask('normalization-feature-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Normalization and Feature Selection - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Single-Cell Normalization Specialist',
      task: 'Normalize data and select highly variable genes',
      context: {
        projectName: args.projectName,
        adata: args.adata,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Apply normalization method:',
        '   - scran pooling normalization (recommended)',
        '   - or simple library size normalization',
        '   - or SCTransform (Seurat)',
        '2. Log-transform normalized counts',
        '3. Identify highly variable genes (HVGs):',
        '   - Use Seurat v3 method or scanpy default',
        '   - Select top 2000-3000 HVGs',
        '4. Exclude cell cycle genes if needed',
        '5. Exclude mitochondrial and ribosomal genes',
        '6. Scale data (zero mean, unit variance)',
        '7. Generate HVG dispersion plot',
        '8. Save normalized expression matrix',
        '9. Document normalization parameters',
        '10. Generate normalization summary'
      ],
      outputFormat: 'JSON object with normalization results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'normalizedAdata', 'hvgCount', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        normalizedAdata: { type: 'string' },
        hvgCount: { type: 'number' },
        normalizationMethod: { type: 'string' },
        scaledData: { type: 'boolean' },
        topHVGs: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['bioinformatics', 'single-cell', 'normalization']
}));

export const dimensionalityReductionTask = defineTask('dimensionality-reduction', (args, taskCtx) => ({
  kind: 'agent',
  title: `Dimensionality Reduction - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Dimensionality Reduction Specialist',
      task: 'Perform PCA and UMAP for visualization',
      context: {
        projectName: args.projectName,
        adata: args.adata,
        nPCs: args.nPCs,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Perform PCA on HVGs',
        '2. Determine optimal number of PCs:',
        '   - Elbow plot analysis',
        '   - Variance explained thresholding',
        '   - Jackstraw or similar methods',
        '3. Generate PCA plots (PC1 vs PC2, colored by metadata)',
        '4. Build neighbor graph using optimal PCs',
        '5. Compute UMAP embedding',
        '6. Generate UMAP plots colored by:',
        '   - Sample',
        '   - QC metrics (genes, UMI, mito)',
        '7. Optionally compute t-SNE for comparison',
        '8. Assess batch effects in embeddings',
        '9. Save reduced data object',
        '10. Generate dimensionality reduction report'
      ],
      outputFormat: 'JSON object with dimensionality reduction results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'reducedAdata', 'optimalPCs', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        reducedAdata: { type: 'string' },
        optimalPCs: { type: 'number' },
        varianceExplained: { type: 'array' },
        umapCoordinates: { type: 'string' },
        batchEffectScore: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['bioinformatics', 'single-cell', 'dimensionality-reduction']
}));

export const clusteringMarkerGenesTask = defineTask('clustering-marker-genes', (args, taskCtx) => ({
  kind: 'agent',
  title: `Clustering and Marker Genes - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Single-Cell Clustering Specialist',
      task: 'Cluster cells and identify marker genes',
      context: {
        projectName: args.projectName,
        adata: args.adata,
        resolution: args.resolution,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Perform graph-based clustering (Leiden or Louvain)',
        '2. Test multiple resolutions if needed',
        '3. Visualize clusters on UMAP',
        '4. Identify marker genes per cluster:',
        '   - Wilcoxon rank-sum test',
        '   - log2FC threshold > 0.5',
        '   - expressed in > 25% of cluster cells',
        '5. Generate marker gene heatmap (top 10 per cluster)',
        '6. Generate dot plot of marker expression',
        '7. Calculate cluster quality metrics',
        '8. Generate cluster size distribution',
        '9. Export marker gene tables',
        '10. Save clustered data object'
      ],
      outputFormat: 'JSON object with clustering results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'clusteredAdata', 'nClusters', 'clusters', 'markerTablePath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        clusteredAdata: { type: 'string' },
        nClusters: { type: 'number' },
        clusters: { type: 'array' },
        clusterSizes: { type: 'object' },
        topMarkersByCluster: { type: 'object' },
        markerTablePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['bioinformatics', 'single-cell', 'clustering']
}));

export const cellTypeAnnotationTask = defineTask('cell-type-annotation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Cell Type Annotation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Cell Type Annotation Specialist',
      task: 'Annotate cell types using automated methods',
      context: {
        projectName: args.projectName,
        adata: args.adata,
        annotationReference: args.annotationReference,
        expectedCellTypes: args.expectedCellTypes,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Use automated annotation tools:',
        '   - CellTypist for immune cells',
        '   - SingleR with reference datasets',
        '   - scType or scCATCH',
        '2. Transfer labels from reference dataset',
        '3. Validate annotations with marker genes',
        '4. Check annotation consistency within clusters',
        '5. Resolve conflicting annotations',
        '6. Calculate annotation confidence scores',
        '7. Generate annotation UMAP plots',
        '8. Create cell type composition bar plots',
        '9. Calculate cell type proportions',
        '10. Save annotated data object'
      ],
      outputFormat: 'JSON object with cell type annotations'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'annotatedAdata', 'cellTypesIdentified', 'cellTypes', 'adataPath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        annotatedAdata: { type: 'string' },
        adataPath: { type: 'string' },
        cellTypesIdentified: { type: 'number' },
        cellTypes: { type: 'array' },
        cellTypeCounts: { type: 'object' },
        cellTypeProportions: { type: 'object' },
        confidenceScores: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['bioinformatics', 'single-cell', 'cell-type-annotation']
}));

export const trajectoryAnalysisTask = defineTask('trajectory-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Trajectory Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Trajectory Analysis Specialist',
      task: 'Perform trajectory and pseudotime analysis',
      context: {
        projectName: args.projectName,
        adata: args.adata,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Subset to relevant cell populations for trajectory',
        '2. Apply trajectory inference method:',
        '   - Monocle3 for complex trajectories',
        '   - PAGA for coarse-grained topology',
        '   - Slingshot for simpler trajectories',
        '3. Identify root cells (based on markers or prior knowledge)',
        '4. Calculate pseudotime ordering',
        '5. Identify branch points and lineages',
        '6. Find genes varying along pseudotime',
        '7. Cluster genes by expression pattern',
        '8. Generate trajectory visualization',
        '9. Create pseudotime gene expression plots',
        '10. Save trajectory results'
      ],
      outputFormat: 'JSON object with trajectory analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'trajectoriesIdentified', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        trajectoriesIdentified: { type: 'number' },
        branchPoints: { type: 'number' },
        lineages: { type: 'array' },
        pseudotimeRange: { type: 'array' },
        trajectoryGenes: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['bioinformatics', 'single-cell', 'trajectory-analysis']
}));

export const cellCommunicationTask = defineTask('cell-communication', (args, taskCtx) => ({
  kind: 'agent',
  title: `Cell-Cell Communication - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Cell Communication Analysis Specialist',
      task: 'Analyze cell-cell communication networks',
      context: {
        projectName: args.projectName,
        adata: args.adata,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Apply cell communication tools:',
        '   - CellChat',
        '   - CellPhoneDB',
        '   - NicheNet',
        '2. Identify ligand-receptor interactions',
        '3. Calculate communication probability scores',
        '4. Filter significant interactions',
        '5. Identify dominant sender/receiver cell types',
        '6. Analyze signaling pathways involved',
        '7. Generate communication network plots',
        '8. Create chord diagrams of interactions',
        '9. Generate pathway analysis plots',
        '10. Export interaction tables'
      ],
      outputFormat: 'JSON object with cell communication results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'significantInteractions', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        significantInteractions: { type: 'number' },
        topPairs: { type: 'array' },
        topPathways: { type: 'array' },
        senderCellTypes: { type: 'array' },
        receiverCellTypes: { type: 'array' },
        networkPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['bioinformatics', 'single-cell', 'cell-communication']
}));

export const clusterDifferentialExpressionTask = defineTask('cluster-differential-expression', (args, taskCtx) => ({
  kind: 'agent',
  title: `Cluster Differential Expression - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Single-Cell DE Specialist',
      task: 'Perform differential expression between cell types/clusters',
      context: {
        projectName: args.projectName,
        adata: args.adata,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Compare gene expression between cell types',
        '2. Use appropriate DE test:',
        '   - Wilcoxon rank-sum (default)',
        '   - MAST for UMI data',
        '   - DESeq2 pseudobulk',
        '3. Calculate log fold changes',
        '4. Apply multiple testing correction',
        '5. Filter significant DE genes',
        '6. Generate volcano plots per comparison',
        '7. Create heatmap of top DE genes',
        '8. Perform pathway enrichment on DE genes',
        '9. Export DE results tables',
        '10. Generate DE summary report'
      ],
      outputFormat: 'JSON object with DE results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'totalDEGenes', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        totalDEGenes: { type: 'number' },
        comparisons: { type: 'array' },
        deTablePath: { type: 'string' },
        pathwayEnrichment: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['bioinformatics', 'single-cell', 'differential-expression']
}));

export const generateScRNAseqReportTask = defineTask('generate-scrnaseq-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate scRNA-seq Report - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Single-Cell Analysis Report Specialist',
      task: 'Generate comprehensive scRNA-seq analysis report',
      context: {
        projectName: args.projectName,
        technology: args.technology,
        loadingResult: args.loadingResult,
        qcResult: args.qcResult,
        normalizationResult: args.normalizationResult,
        dimReductionResult: args.dimReductionResult,
        clusteringResult: args.clusteringResult,
        annotationResult: args.annotationResult,
        trajectoryResult: args.trajectoryResult,
        cellChatResult: args.cellChatResult,
        deResult: args.deResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create executive summary',
        '2. Document experimental design and technology',
        '3. Present QC metrics and filtering results',
        '4. Show UMAP visualizations',
        '5. Present cell type composition',
        '6. Include marker gene analysis',
        '7. Add trajectory analysis results if available',
        '8. Add cell communication results if available',
        '9. Document methods and parameters',
        '10. Include data accessibility information',
        '11. Generate interactive HTML report',
        '12. Export figures in publication quality'
      ],
      outputFormat: 'JSON object with report paths'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'reportPath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        reportPath: { type: 'string' },
        htmlReportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyFindings: { type: 'array' },
        figurePaths: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['bioinformatics', 'single-cell', 'report-generation']
}));
