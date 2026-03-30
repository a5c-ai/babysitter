---
name: azure-cloud
description: Azure-specific infrastructure and services expertise for cloud operations and architecture
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - WebFetch
---

# Azure Cloud Skill

## Overview

Specialized skill for Microsoft Azure infrastructure and services. Provides deep expertise in Azure-native solutions, best practices, and operational patterns.

## Capabilities

### Azure CLI Operations
- Execute and analyze az CLI commands
- Handle subscription and tenant context
- Interpret API responses and errors
- Manage service principal authentication
- Use Azure CLI extensions

### Compute Services
- Azure VM management and scale sets
- Azure Container Instances (ACI)
- Azure Functions deployment
- App Service configuration
- Azure Batch operations

### Kubernetes (AKS)
- AKS cluster provisioning and management
- Node pool configuration
- AKS networking (Azure CNI, Kubenet)
- Azure AD integration for AKS
- AKS add-ons and extensions

### Networking
- VNet design and implementation
- Azure Load Balancer and Application Gateway
- Azure DNS and Traffic Manager
- Azure Front Door and CDN
- ExpressRoute and VPN Gateway

### Storage and Databases
- Azure Storage account management
- Managed Disks optimization
- Azure SQL Database management
- Cosmos DB configuration
- Azure Cache for Redis

### Security and IAM
- Azure AD and RBAC configuration
- Managed Identity setup
- Azure Key Vault operations
- Azure Policy management
- Microsoft Defender for Cloud

### Infrastructure as Code
- ARM template development
- Bicep template creation
- Azure CLI deployment scripts
- Azure Resource Graph queries

### DevOps Integration
- Azure DevOps pipelines
- Azure Container Registry
- Azure Repos integration
- Release management

## Target Processes

- `iac-implementation.js` - Azure infrastructure provisioning
- `kubernetes-setup.js` - AKS cluster management
- `cost-optimization.js` - Azure cost analysis and optimization

## Usage Context

This skill is invoked when processes require:
- Azure infrastructure provisioning
- AKS cluster setup and management
- Azure networking configuration
- Azure AD and RBAC design
- Azure cost optimization

## Dependencies

- Azure CLI (az)
- Azure credentials/service principal
- Bicep CLI for Bicep projects
- kubectl for AKS operations

## Output Formats

- Azure CLI commands and outputs
- ARM/Bicep templates
- Azure RBAC role assignments
- Cost analysis reports
- Architecture recommendations
