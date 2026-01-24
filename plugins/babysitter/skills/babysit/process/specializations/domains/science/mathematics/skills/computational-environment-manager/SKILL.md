---
name: computational-environment-manager
description: Mathematical computing environment management
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Task
metadata:
  version: "1.0"
  category: research-infrastructure
  domain: mathematics
  backlog-id: SK-MATH-038
  tools:
    - conda
    - Docker
    - Jupyter
  processes:
    - reproducible-research
    - environment-setup
---

# Computational Environment Manager Skill

## Purpose

Provides tools for managing mathematical computing environments ensuring reproducibility and portability.

## Capabilities

- **Environment Creation**: Conda, venv, Docker
- **Package Management**: Dependency resolution
- **Jupyter Integration**: Notebook environments
- **Version Control**: Environment versioning
- **Reproducibility**: Lock files and containers
- **HPC Integration**: Cluster environment setup

## Usage Guidelines

1. **Environment Design**
   - List required packages
   - Specify versions
   - Plan for reproducibility

2. **Setup Process**
   - Create environment
   - Install dependencies
   - Verify installations

3. **Maintenance**
   - Update packages
   - Export specifications
   - Document changes

4. **Best Practices**
   - Use lock files
   - Containerize when possible
   - Document environment setup
