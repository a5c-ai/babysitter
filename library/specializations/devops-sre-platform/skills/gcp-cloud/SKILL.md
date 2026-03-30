---
name: gcp-cloud
description: GCP-specific infrastructure and services expertise for cloud operations and architecture
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - WebFetch
---

# GCP Cloud Skill

## Overview

Specialized skill for Google Cloud Platform (GCP) infrastructure and services. Provides deep expertise in GCP-native solutions, best practices, and operational patterns.

## Capabilities

### gcloud CLI Operations
- Execute and analyze gcloud commands
- Handle project and organization context
- Interpret API responses and errors
- Manage service account impersonation
- Use gcloud configurations

### Compute Services
- Compute Engine VM management
- Cloud Run service deployment
- Cloud Functions configuration
- App Engine application management
- Managed Instance Groups

### Kubernetes (GKE)
- GKE cluster provisioning (Standard/Autopilot)
- Node pool management and configuration
- GKE networking (VPC-native, Shared VPC)
- Workload Identity configuration
- GKE security features (Binary Authorization)

### Networking
- VPC network design and implementation
- Cloud Load Balancing configuration
- Cloud DNS management
- Cloud CDN setup
- Cloud Interconnect and VPN

### Storage and Databases
- Cloud Storage bucket management
- Persistent Disk optimization
- Cloud SQL management
- Cloud Spanner configuration
- Firestore/Datastore operations
- BigQuery dataset management

### Security and IAM
- IAM policy and role management
- Service account configuration
- Organization policies
- Secret Manager operations
- VPC Service Controls

### CI/CD and DevOps
- Cloud Build pipeline configuration
- Artifact Registry management
- Cloud Deploy for CD
- Container Registry operations

## Target Processes

- `iac-implementation.js` - GCP infrastructure provisioning
- `kubernetes-setup.js` - GKE cluster management
- `cost-optimization.js` - GCP cost analysis and optimization

## Usage Context

This skill is invoked when processes require:
- GCP infrastructure provisioning
- GKE cluster setup and management
- GCP networking configuration
- IAM and service account design
- GCP cost optimization

## Dependencies

- gcloud CLI
- GCP credentials/service accounts
- gsutil for Cloud Storage
- bq for BigQuery

## Output Formats

- gcloud CLI commands and outputs
- Deployment Manager templates
- IAM policy documents
- Cost analysis reports
- Architecture recommendations
