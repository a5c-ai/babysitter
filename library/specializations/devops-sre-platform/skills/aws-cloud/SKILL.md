---
name: aws-cloud
description: AWS-specific infrastructure and services expertise for cloud operations and architecture
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - WebFetch
---

# AWS Cloud Skill

## Overview

Specialized skill for Amazon Web Services (AWS) infrastructure and services. Provides deep expertise in AWS-native solutions, best practices, and operational patterns.

## Capabilities

### AWS CLI Operations
- Execute and analyze AWS CLI commands
- Handle pagination and large result sets
- Interpret API responses and errors
- Use AWS CLI profiles and assume roles
- Query resources using JMESPath

### Compute Services
- EC2 instance management and optimization
- ECS/Fargate container orchestration
- Lambda function deployment and configuration
- Elastic Beanstalk application management
- Auto Scaling group configuration

### Kubernetes (EKS)
- EKS cluster provisioning and management
- Managed node groups and Fargate profiles
- EKS add-ons configuration
- IAM roles for service accounts (IRSA)
- EKS networking (VPC CNI, Calico)

### Networking
- VPC design and implementation
- ALB/NLB load balancer configuration
- Route53 DNS management
- CloudFront CDN setup
- Transit Gateway and VPC peering

### Storage and Databases
- S3 bucket policies and lifecycle rules
- EBS volume optimization
- RDS/Aurora database management
- DynamoDB table design
- ElastiCache configuration

### Security and IAM
- IAM policy generation and analysis
- Security group rule management
- Secrets Manager operations
- KMS key management
- AWS Organizations and SCPs

### Infrastructure as Code
- CloudFormation template development
- AWS CDK constructs and stacks
- SAM template generation
- CloudFormation stack operations
- Drift detection and remediation

## Target Processes

- `iac-implementation.js` - AWS infrastructure provisioning
- `kubernetes-setup.js` - EKS cluster management
- `cost-optimization.js` - AWS cost analysis and optimization
- `disaster-recovery-plan.js` - AWS DR architecture

## Usage Context

This skill is invoked when processes require:
- AWS infrastructure provisioning
- EKS cluster setup and management
- AWS networking configuration
- IAM policy design and review
- AWS cost optimization

## Dependencies

- AWS CLI v2
- AWS credentials/profiles
- eksctl for EKS operations
- CDK CLI for CDK projects

## Output Formats

- AWS CLI commands and outputs
- CloudFormation/CDK templates
- IAM policy documents
- Cost analysis reports
- Architecture recommendations
