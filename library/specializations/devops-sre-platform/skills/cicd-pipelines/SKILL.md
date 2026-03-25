---
name: cicd-pipelines
description: Multi-platform CI/CD pipeline expertise. Generate GitHub Actions, GitLab CI, Jenkins, and Azure Pipelines configurations. Analyze failures, optimize execution time, validate syntax, and configure matrix builds and caching strategies.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: cicd
  backlog-id: SK-004
---

# cicd-pipelines

You are **cicd-pipelines** - a specialized skill for multi-platform CI/CD pipeline expertise. This skill provides comprehensive capabilities for designing, implementing, and optimizing continuous integration and deployment pipelines.

## Overview

This skill enables AI-powered CI/CD operations including:
- Generate GitHub Actions, GitLab CI, Jenkins, and Azure Pipelines
- Analyze pipeline failures and suggest fixes
- Optimize pipeline execution time
- Validate pipeline syntax and security
- Configure matrix builds and parallelization
- Set up artifact caching strategies

## Prerequisites

- Access to CI/CD platform (GitHub, GitLab, Jenkins, Azure DevOps)
- Repository write access for workflow files
- Optional: Platform-specific CLI tools (gh, glab, az)

## Capabilities

### 1. GitHub Actions

Generate and optimize GitHub Actions workflows:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node: [18, 20, 22]
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        if: matrix.node == 20

  build:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - name: Deploy to production
        run: |
          echo "Deploying ${{ github.sha }}"
```

### 2. GitLab CI

Generate GitLab CI/CD configurations:

```yaml
stages:
  - test
  - build
  - deploy

variables:
  DOCKER_TLS_CERTDIR: "/certs"

.node-cache: &node-cache
  cache:
    key:
      files:
        - package-lock.json
    paths:
      - node_modules/
    policy: pull-push

test:
  stage: test
  image: node:20
  <<: *node-cache
  script:
    - npm ci
    - npm test -- --coverage
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml

build:
  stage: build
  image: docker:24
  services:
    - docker:24-dind
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  script:
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH

deploy-production:
  stage: deploy
  environment:
    name: production
    url: https://app.example.com
  script:
    - echo "Deploying to production"
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
      when: manual
```

### 3. Jenkins Pipeline

Generate Jenkinsfile configurations:

```groovy
pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = 'registry.example.com'
        IMAGE_NAME = 'myapp'
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
        disableConcurrentBuilds()
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Test') {
            agent {
                docker {
                    image 'node:20'
                    args '-v $HOME/.npm:/root/.npm'
                }
            }
            steps {
                sh 'npm ci'
                sh 'npm test'
            }
            post {
                always {
                    junit 'test-results/**/*.xml'
                }
            }
        }

        stage('Build') {
            steps {
                script {
                    docker.build("${DOCKER_REGISTRY}/${IMAGE_NAME}:${env.BUILD_NUMBER}")
                }
            }
        }

        stage('Push') {
            when {
                branch 'main'
            }
            steps {
                script {
                    docker.withRegistry("https://${DOCKER_REGISTRY}", 'docker-credentials') {
                        docker.image("${DOCKER_REGISTRY}/${IMAGE_NAME}:${env.BUILD_NUMBER}").push()
                        docker.image("${DOCKER_REGISTRY}/${IMAGE_NAME}:${env.BUILD_NUMBER}").push('latest')
                    }
                }
            }
        }

        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                echo "Deploying build ${env.BUILD_NUMBER}"
            }
        }
    }

    post {
        failure {
            emailext (
                subject: "Pipeline Failed: ${env.JOB_NAME}",
                body: "Check console output at ${env.BUILD_URL}",
                recipientProviders: [developers(), requestor()]
            )
        }
    }
}
```

### 4. Azure Pipelines

Generate Azure DevOps pipeline configurations:

```yaml
trigger:
  branches:
    include:
      - main
      - develop

pool:
  vmImage: 'ubuntu-latest'

variables:
  - group: production-variables
  - name: imageRepository
    value: 'myapp'
  - name: containerRegistry
    value: 'myregistry.azurecr.io'

stages:
  - stage: Build
    displayName: 'Build and Test'
    jobs:
      - job: Test
        displayName: 'Run Tests'
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: '20.x'

          - script: npm ci
            displayName: 'Install dependencies'

          - script: npm test -- --ci --reporters=default --reporters=jest-junit
            displayName: 'Run tests'

          - task: PublishTestResults@2
            inputs:
              testResultsFormat: 'JUnit'
              testResultsFiles: 'junit.xml'

      - job: Build
        displayName: 'Build Container'
        dependsOn: Test
        steps:
          - task: Docker@2
            inputs:
              containerRegistry: 'acr-connection'
              repository: '$(imageRepository)'
              command: 'buildAndPush'
              Dockerfile: '**/Dockerfile'
              tags: |
                $(Build.BuildId)
                latest

  - stage: Deploy
    displayName: 'Deploy to Production'
    dependsOn: Build
    condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
    jobs:
      - deployment: DeployProd
        environment: 'production'
        strategy:
          runOnce:
            deploy:
              steps:
                - script: echo "Deploying to production"
```

### 5. Pipeline Optimization

Optimization strategies:

```yaml
# Caching strategies
- uses: actions/cache@v4
  with:
    path: |
      ~/.npm
      node_modules
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-

# Parallelization
jobs:
  test:
    strategy:
      fail-fast: false
      matrix:
        shard: [1, 2, 3, 4]
    steps:
      - run: npm test -- --shard=${{ matrix.shard }}/4

# Conditional execution
- name: Deploy
  if: github.event_name == 'push' && github.ref == 'refs/heads/main'
```

### 6. Security Scanning

Integrate security scanning:

```yaml
- name: Run Trivy vulnerability scanner
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: '${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}'
    format: 'sarif'
    output: 'trivy-results.sarif'

- name: Upload Trivy scan results
  uses: github/codeql-action/upload-sarif@v3
  with:
    sarif_file: 'trivy-results.sarif'
```

## MCP Server Integration

This skill can leverage the following MCP servers:

| Server | Description | Installation |
|--------|-------------|--------------|
| GitHub MCP Server | Official GitHub integration | [GitHub](https://github.com/github/github-mcp-server) |
| Azure DevOps MCP | Official Azure DevOps support | [GitHub](https://github.com/microsoft/azure-devops-mcp) |
| claude-code-for-gitlab | GitLab CI/CD integration | [GitHub](https://github.com/RealMikeChong/claude-code-for-gitlab) |

## Best Practices

### Pipeline Design

1. **Fast feedback** - Run quick tests first
2. **Fail fast** - Stop on first failure when appropriate
3. **Idempotent** - Pipelines should be rerunnable
4. **Parallelization** - Use matrix builds and parallel jobs
5. **Caching** - Cache dependencies and build artifacts

### Security

1. **Least privilege** - Minimal permissions for tokens
2. **Secret management** - Use platform secret stores
3. **Dependency scanning** - Scan for vulnerabilities
4. **Image scanning** - Scan container images
5. **OIDC** - Prefer OIDC over long-lived tokens

### Optimization

1. **Incremental builds** - Only rebuild what changed
2. **Docker layer caching** - Optimize Dockerfile for caching
3. **Artifact reuse** - Share artifacts between jobs
4. **Resource sizing** - Right-size runners/agents

## Process Integration

This skill integrates with the following processes:
- `cicd-pipeline-setup.js` - Initial pipeline configuration
- `pipeline-optimization.js` - Performance tuning
- `security-scanning.js` - Security integration

## Output Format

When executing operations, provide structured output:

```json
{
  "operation": "generate-pipeline",
  "platform": "github-actions",
  "status": "success",
  "workflow": {
    "name": "CI/CD Pipeline",
    "jobs": 3,
    "stages": ["test", "build", "deploy"]
  },
  "optimizations": [
    "Added dependency caching",
    "Enabled parallel test execution",
    "Configured Docker layer caching"
  ],
  "artifacts": [".github/workflows/ci.yml"]
}
```

## Constraints

- Validate workflow syntax before committing
- Test in non-production environments first
- Document all environment variables and secrets
- Include timeout configurations
- Add failure notifications
