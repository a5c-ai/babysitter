# Data Science and Machine Learning - Skills and Agents References (Phase 5)

## Overview

This document provides external references to community-created Claude skills, agents, plugins, and MCP (Model Context Protocol) servers that align with the skills and agents identified in the Phase 4 backlog. These resources can enhance Data Science and Machine Learning workflows by providing pre-built integrations for experiment tracking, model training, data validation, and ML monitoring.

## Summary Statistics

- **Total References Found**: 47
- **Categories Covered**: 9 (Data Engineering, Model Development, MLOps, Explainability, Monitoring, Validation, Cloud Platforms, Data Visualization, Infrastructure)
- **MCP Servers**: 28
- **Claude Skills Collections**: 4
- **Supporting Tools/Guides**: 15

---

## Data Engineering References

### Pandas and DataFrame Analysis

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| pandas-mcp-server | MCP Server | https://github.com/marlonluo2018/pandas-mcp-server | Comprehensive MCP server enabling LLMs to execute pandas code through a standardized workflow for data analysis and visualization with secure sandboxed execution |
| MCP Pandas (alistairwalsh) | MCP Server | https://playbooks.com/mcp/alistairwalsh-pandas | Containerized pandas server bringing powerful data manipulation to the MCP ecosystem |
| Claude Scientific Skills - pandas | Skill | https://github.com/K-Dense-AI/claude-scientific-skills | Scientific skills collection including pandas, NumPy, and data manipulation tools |

### Data Validation (Great Expectations)

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| gx-mcp-server | MCP Server | https://github.com/davidf9999/gx-mcp-server | Exposes Great Expectations data-quality checks as callable tools for LLM agents with CSV, Snowflake, and BigQuery support |
| Great Expectations MCP (Smithery) | MCP Server | https://smithery.ai/server/@davidf9999/gx-mcp-server | Smithery-hosted Great Expectations server for data quality validation |

### Data Versioning (DVC)

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| DVC Official | Tool | https://dvc.org/ | Open-source version control system for ML projects, data, and experiments (CLI tool, MCP wrapper possible) |

### Feature Store (Feast)

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| Feast MCP Example | Documentation | https://docs.feast.dev/getting-started/components/feature-server | Feast feature server documentation with MCP AI Agent example integration |

---

## Model Development References

### Scikit-learn

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| Claude Scientific Skills - sklearn | Skill | https://github.com/K-Dense-AI/claude-scientific-skills | Production-ready scikit-learn skills for classification, regression, and clustering |
| ML Models as MCP Tools Guide | Guide | https://medium.com/@premlaknaboina/how-to-wrap-machine-learning-models-as-mcp-tools-1e510b21f1f9 | Tutorial on wrapping scikit-learn models as MCP tools |

### PyTorch

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| claude-pytorch-treehugger | MCP Server | https://github.com/izaitsevfb/claude-pytorch-treehugger | MCP harness for PyTorch HUD API for CI/CD analytics |
| Claude Scientific Skills - PyTorch Lightning | Skill | https://github.com/K-Dense-AI/claude-scientific-skills | PyTorch Lightning skills for deep learning workflows |
| AI-research-SKILLs - PyTorch FSDP | Skill | https://github.com/zechenzhangAGI/AI-research-SKILLs | Distributed training skills with PyTorch FSDP and DeepSpeed |

### TensorFlow/Keras

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| Claude Scientific Skills - TensorFlow | Skill | https://github.com/K-Dense-AI/claude-scientific-skills | TensorFlow/Keras skills for neural network development |
| AI-research-SKILLs - TensorBoard | Skill | https://github.com/zechenzhangAGI/AI-research-SKILLs | TensorBoard experiment visualization skills |

### Hyperparameter Tuning (Optuna)

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| optuna-mcp | MCP Server | https://github.com/optuna/optuna-mcp | Official Optuna MCP server for automated hyperparameter optimization with study management, visualizations, and dashboard |
| Optuna MCP (mcpmarket) | MCP Server | https://mcpmarket.com/server/optuna | Optuna MCP server for hyperparameter tuning automation |

### Distributed Training (Ray)

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| ray-mcp | MCP Server | https://lobehub.com/mcp/pradeepiyer-ray-mcp | MCP server for managing Ray clusters, jobs, and distributed computing workflows |

---

## MLOps References

### Experiment Tracking (MLflow)

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| mlflow-mcp (kkruglik) | MCP Server | https://github.com/kkruglik/mlflow-mcp | MLflow MCP server for experiment tracking, run comparison, artifact access, and model registry |
| MLflow Official MCP Server | MCP Server | https://mlflow.org/docs/latest/genai/mcp/ | Official MLflow MCP server (MLflow 3.4+) for trace analysis and GenAI lifecycle |
| mlflowMCPServer (iRahulPandey) | MCP Server | https://github.com/iRahulPandey/mlflowMCPServer | Natural language interface to MLflow for experiment management |
| mcp-server-mlflow (B-Step62) | MCP Server | https://github.com/B-Step62/mcp-server-mlflow | MCP server for accessing prompts stored in MLflow Prompt Registry |

### Experiment Tracking (Weights & Biases)

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| wandb-mcp-server | MCP Server | https://github.com/wandb/wandb-mcp-server | Official W&B MCP server for experiment tracking, sweeps, artifacts, model registry, and Weave traces |
| AI-research-SKILLs - W&B | Skill | https://github.com/zechenzhangAGI/AI-research-SKILLs | Weights & Biases experiment tracking skills |

### Kubeflow Pipelines

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| Kubeflow Documentation | Reference | https://v0-7.kubeflow.org/docs/components/serving/seldon/ | Kubeflow pipeline and Seldon serving documentation (no dedicated MCP server found) |

### Model Deployment (Seldon/BentoML)

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| Seldon Core Documentation | Reference | https://docs.seldon.io/projects/seldon-core/en/latest/ | Seldon Core deployment documentation for Kubernetes-native ML serving |
| BentoML Documentation | Reference | https://docs.bentoml.org/ | BentoML model packaging and serving documentation |

---

## Explainability References

### SHAP/LIME

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| CML_AMP_Explainability_LIME_SHAP | Reference | https://github.com/cloudera/CML_AMP_Explainability_LIME_SHAP | Cloudera ML project demonstrating SHAP and LIME explainability |
| Claude Scientific Skills - statsmodels | Skill | https://github.com/K-Dense-AI/claude-scientific-skills | Statistical modeling skills that can support explainability workflows |

*Note: No dedicated MCP servers for SHAP/LIME were found. Custom integration may be required.*

### Alibi Explainability

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| Alibi Documentation | Reference | https://docs.seldon.io/projects/alibi/ | Alibi explainability library documentation (Seldon ecosystem) |

---

## Monitoring References

### Drift Detection (Evidently AI)

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| Evidently AI | Tool | https://github.com/evidentlyai/evidently | Open-source ML and LLM observability framework with 100+ metrics for drift detection |
| Evidently Documentation | Reference | https://docs.evidentlyai.com/ | Comprehensive documentation for data drift, model performance, and LLM monitoring |

*Note: No dedicated MCP server for Evidently AI was found. The library can be integrated into custom workflows.*

### WhyLabs/Arize

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| WhyLabs whylogs | Tool | https://github.com/whylabs/whylogs | Open-source data logging library for ML observability |
| Arize AI | Platform | https://arize.com/ | ML observability platform (commercial, no public MCP server) |

---

## Validation References

### Fairness (Fairlearn)

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| Fairlearn | Tool | https://github.com/fairlearn/fairlearn | Python package for assessing and improving ML fairness |
| Fairlearn Documentation | Reference | https://fairlearn.org/ | Official documentation with metrics and mitigation algorithms |

*Note: No dedicated MCP server for Fairlearn was found. Integration with Claude can be done via custom skills.*

### Model Cards

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| Model Card Toolkit | Tool | https://github.com/tensorflow/model-card-toolkit | TensorFlow Model Card Toolkit for documentation |

---

## Jupyter and Notebook References

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| jupyter-notebook-mcp | MCP Server | https://github.com/jjsantos01/jupyter-notebook-mcp | JupyterMCP connects Jupyter Notebook to Claude AI for AI-assisted code execution and data analysis |
| jupyter-mcp-server (Datalayer) | MCP Server | https://github.com/datalayer/jupyter-mcp-server | MCP Server for Jupyter compatible with any deployment (local, JupyterHub, etc.) |
| claude-code-notebook-mcp | MCP Server | https://github.com/mstampfer/claude-code-notebook-mcp | MCP server for comprehensive Jupyter notebook interaction compatible with Claude Code |
| mcp-jupyter (Block) | MCP Server | https://pypi.org/project/mcp-jupyter/ | PyPI package for Jupyter MCP integration with testing infrastructure |
| cursor-notebook-mcp | MCP Server | https://github.com/jbeno/cursor-notebook-mcp | MCP server for AI agents to interact with .ipynb files |

---

## Cloud Platform References

### AWS SageMaker

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| aws-mcp-server | MCP Server | https://github.com/alexei-led/aws-mcp-server | Lightweight service enabling AI assistants to execute AWS CLI commands through MCP |
| AWS Bedrock MCP | Reference | https://docs.aws.amazon.com/bedrock/ | AWS Bedrock MCP server for agent development |

### Google Cloud (BigQuery/Vertex AI)

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| mcp-server-bigquery | MCP Server | https://github.com/LucasHild/mcp-server-bigquery | MCP server providing access to BigQuery for data analysis |
| mcp-bigquery-server | MCP Server | https://github.com/ergut/mcp-bigquery-server | Secure read-only access to BigQuery datasets through MCP |
| Google MCP Toolbox | Documentation | https://docs.cloud.google.com/bigquery/docs/pre-built-tools-with-mcp-toolbox | Official Google Cloud documentation for MCP with BigQuery |

### Azure ML

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| Microsoft Agent Framework | Reference | https://azure.microsoft.com/ | Azure MCP server and Agent2Agent (A2A) protocol (October 2025) |

---

## Data Visualization References

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| mcp-visualization-duckdb | MCP Server | https://lobehub.com/mcp/xoniks-mcp-visualization-duckdb | MCP server supporting bar, line, scatter, pie, histogram, box, heatmap charts with DuckDB |
| plotly-mcp-cursor | MCP Server | https://github.com/arshlibruh/plotly-mcp-cursor | Complete Plotly MCP server with 49+ trace types and natural language interface |
| Vizro MCP Server | MCP Server | https://community.plotly.com/t/vizro-mcp-server-to-help-build-vizro-dash-apps-from-ide-host-fast-and-reliably/92221 | Vizro/Dash app creation from MCP-compatible hosts |
| Claude Scientific Skills - matplotlib/seaborn | Skill | https://github.com/K-Dense-AI/claude-scientific-skills | Publication-quality visualization skills |

---

## Hugging Face and Transformers References

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| hf-mcp-server (Official) | MCP Server | https://huggingface.co/docs/hub/en/hf-mcp-server | Official Hugging Face MCP Server for models, datasets, and spaces |
| huggingface-mcp-server | MCP Server | https://github.com/shreyaskarnik/huggingface-mcp-server | Community MCP server with read-only access to Hugging Face Hub APIs |
| HuggingMCP | MCP Server | https://mcp.so/server/HuggingMCP/ProCreations-Official | MCP server for managing Hugging Face models, datasets, and collections |
| huggingface-hub-search | MCP Server | https://playbooks.com/mcp/davanstrien-huggingface-hub-search | Semantic search MCP server for Hugging Face models and datasets |

---

## Database and Data Warehouse References

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| PostgreSQL MCP Server | MCP Server | https://www.pulsemcp.com/servers/modelcontextprotocol-postgres | Direct PostgreSQL database integration with PostGIS support |
| MintMCP Gateway | MCP Server | https://www.mintmcp.com/ | SOC 2 compliant connection to 30+ database types including PostgreSQL, MySQL, BigQuery |
| Snowflake MCP | Reference | Multiple implementations | Various Snowflake MCP servers available in awesome-mcp-servers lists |

---

## Comprehensive Skill Collections

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| K-Dense-AI/claude-scientific-skills | Skills Collection | https://github.com/K-Dense-AI/claude-scientific-skills | 140+ scientific skills including scikit-learn, PyTorch Lightning, pandas, NumPy, statsmodels |
| zechenzhangAGI/AI-research-SKILLs | Skills Collection | https://github.com/zechenzhangAGI/AI-research-SKILLs | 77 AI research skills spanning model architecture, fine-tuning, distributed training, MLOps |
| ComposioHQ/awesome-claude-skills | Skills Directory | https://github.com/ComposioHQ/awesome-claude-skills | Curated list of Claude skills (limited ML-specific content) |

---

## Awesome MCP Server Lists

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| punkpeye/awesome-mcp-servers | Curated List | https://github.com/punkpeye/awesome-mcp-servers | Production-ready and experimental MCP servers |
| wong2/awesome-mcp-servers | Curated List | https://github.com/wong2/awesome-mcp-servers | Curated list of Model Context Protocol servers |
| TensorBlock/awesome-mcp-servers | Curated List | https://github.com/TensorBlock/awesome-mcp-servers | Coverage of 7260+ MCP servers |
| tolkonepiu/best-of-mcp-servers | Ranked List | https://github.com/tolkonepiu/best-of-mcp-servers | Ranked list of MCP servers, updated weekly |

---

## Skills/Agents to References Mapping

| Skill/Agent from Backlog | Recommended References |
|--------------------------|------------------------|
| pandas-dataframe-analyzer | pandas-mcp-server, MCP Pandas, Claude Scientific Skills |
| great-expectations-validator | gx-mcp-server |
| dvc-dataset-versioning | DVC Official (CLI integration) |
| feast-feature-store | Feast Documentation with MCP example |
| sklearn-model-trainer | Claude Scientific Skills - sklearn, ML Models as MCP Tools Guide |
| pytorch-trainer | claude-pytorch-treehugger, AI-research-SKILLs |
| tensorflow-trainer | Claude Scientific Skills - TensorFlow |
| optuna-hyperparameter-tuner | optuna-mcp (Official) |
| ray-distributed-trainer | ray-mcp |
| mlflow-experiment-tracker | mlflow-mcp, MLflow Official MCP Server |
| wandb-experiment-tracker | wandb-mcp-server (Official) |
| kubeflow-pipeline-executor | Kubeflow Documentation (no MCP) |
| seldon-model-deployer | Seldon Core Documentation (no MCP) |
| bentoml-model-packager | BentoML Documentation (no MCP) |
| shap-explainer | CML_AMP_Explainability (reference only) |
| lime-explainer | CML_AMP_Explainability (reference only) |
| alibi-explainer | Alibi Documentation |
| evidently-drift-detector | Evidently AI (library, no MCP) |
| whylabs-monitor | WhyLabs whylogs |
| arize-observability | Arize AI (commercial) |
| fairlearn-bias-detector | Fairlearn (library, no MCP) |
| model-card-generator | Model Card Toolkit |
| pytest-ml-tester | Standard pytest (no specialized MCP) |
| jupyter-notebook-executor | jupyter-notebook-mcp, jupyter-mcp-server, mcp-jupyter |

---

## Gaps and Opportunities

The following skills/agents from the backlog do not have readily available MCP servers or Claude skills:

### High Priority Gaps (Consider Custom Development)
1. **SHAP/LIME Explainers** - No dedicated MCP servers; high value for explainability workflows
2. **Evidently AI Drift Detector** - Library available but no MCP wrapper
3. **Fairlearn Bias Detector** - No MCP integration; critical for responsible AI
4. **Seldon/BentoML Deployers** - No MCP servers for model deployment automation
5. **Model Card Generator** - No automated MCP integration

### Medium Priority Gaps
1. **Kubeflow Pipeline Executor** - Complex orchestration, Kubernetes-native
2. **WhyLabs/Arize Monitors** - Commercial platforms with limited open integrations
3. **Alibi Explainer** - Specialized counterfactual explanations

### Covered Areas (Strong Ecosystem)
1. **Jupyter Notebooks** - Multiple MCP server options
2. **MLflow/W&B** - Official MCP servers available
3. **Optuna** - Official MCP server
4. **Pandas** - Multiple MCP servers
5. **Great Expectations** - Dedicated MCP server
6. **Hugging Face** - Official and community MCP servers
7. **Data Visualization** - Plotly, DuckDB, matplotlib MCP servers

---

## Implementation Recommendations

### Quick Wins (Existing MCP Servers)
1. Install **jupyter-mcp-server** for notebook execution
2. Configure **mlflow-mcp** or **wandb-mcp-server** for experiment tracking
3. Add **optuna-mcp** for hyperparameter tuning
4. Deploy **gx-mcp-server** for data validation
5. Use **pandas-mcp-server** for data analysis

### Custom Development Priorities
1. Create SHAP/LIME MCP wrapper for explainability
2. Build Evidently AI MCP server for drift detection
3. Develop Fairlearn MCP integration for bias detection
4. Consider Seldon/BentoML MCP servers for deployment automation

### Integration Strategy
1. Start with experiment tracking (MLflow/W&B MCP servers)
2. Add data validation (Great Expectations MCP)
3. Integrate notebook workflows (Jupyter MCP)
4. Expand to hyperparameter tuning (Optuna MCP)
5. Build custom integrations for gaps

---

## References

### Official Documentation
- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [Claude Code MCP Documentation](https://code.claude.com/docs/en/mcp)
- [Anthropic MCP Announcement](https://www.anthropic.com/news/model-context-protocol)

### Community Resources
- [Awesome MCP Servers](https://github.com/punkpeye/awesome-mcp-servers)
- [MCP Server Registry](https://mcp.so/)
- [Smithery MCP Marketplace](https://smithery.ai/)

---

*Last Updated: 2026-01-24*
*Phase: 5 - Skills and Agents References*
