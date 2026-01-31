# Babysitter User Documentation - Information Architecture

**Version:** 1.0
**Date:** 2026-01-25
**Author:** Information Architecture Specialist
**Status:** Complete
**Framework:** Diataxis (Tutorials, How-to Guides, Reference, Explanation)
**Related Documents:**
- [01-discovery-analysis.md](./01-discovery-analysis.md)
- [02-audience-personas.md](./02-audience-personas.md)

---

## Table of Contents

1. [Diataxis Framework Application](#1-diataxis-framework-application)
2. [Complete Sitemap](#2-complete-sitemap)
3. [Navigation Menu Structure](#3-navigation-menu-structure)
4. [Page Hierarchy](#4-page-hierarchy)
5. [Breadcrumb Navigation](#5-breadcrumb-navigation)
6. [Cross-Reference Strategy](#6-cross-reference-strategy)
7. [Content Templates](#7-content-templates)
8. [Implementation Guidelines](#8-implementation-guidelines)

---

## 1. Diataxis Framework Application

### 1.1 Framework Overview

The Diataxis framework organizes documentation into four distinct categories based on user needs:

| Category | Orientation | User Mode | Content Purpose |
|----------|-------------|-----------|-----------------|
| **Tutorials** | Learning | Study | Guided lessons for acquiring skills |
| **How-to Guides** | Task | Work | Practical steps to solve problems |
| **Reference** | Information | Work | Technical descriptions and specifications |
| **Explanation** | Understanding | Study | Conceptual background and context |

### 1.2 Category Definitions for Babysitter

#### Tutorials (Learning-Oriented)

**Purpose:** Take users by the hand through a series of steps to complete a project.

**Characteristics:**
- Learning-focused, not task-focused
- Safe learning environment
- Immediate sense of achievement
- Repeatable and reliable outcomes
- Concrete, not abstract

**Babysitter Application:**
- Getting started from zero to first successful run
- Building complete features step-by-step
- Progressive skill building
- Safe experimentation environments

**Primary Personas:** James Park (beginner), Sarah Chen (onboarding)

---

#### How-to Guides (Task-Oriented)

**Purpose:** Take users through steps to solve a real-world problem.

**Characteristics:**
- Goal-focused (solve a specific problem)
- Series of practical steps
- Assumes some knowledge
- Addresses a specific question or need
- Flexible enough for variations

**Babysitter Application:**
- Configuring breakpoints for specific use cases
- Resuming interrupted sessions
- Integrating with CI/CD pipelines
- Troubleshooting specific issues
- Optimizing quality convergence

**Primary Personas:** Sarah Chen (daily use), Elena Rodriguez (automation), Marcus Thompson (governance)

---

#### Reference (Information-Oriented)

**Purpose:** Provide technical descriptions of the machinery and how to operate it.

**Characteristics:**
- Information-oriented
- Describes the machinery
- Accurate and complete
- Structured consistently
- Austere and to the point

**Babysitter Application:**
- CLI command reference
- API documentation
- Configuration options
- Environment variables
- Exit codes and error messages
- File structure specifications
- JSON schemas

**Primary Personas:** Elena Rodriguez (automation), all personas for lookup

---

#### Explanation (Understanding-Oriented)

**Purpose:** Clarify and illuminate a particular topic.

**Characteristics:**
- Understanding-oriented
- Explains background and context
- Discusses alternatives and opinions
- Provides reasoning and connections
- Illuminates the subject

**Babysitter Application:**
- Event sourcing and journal system concepts
- Quality convergence philosophy
- Why human-in-the-loop matters
- Architecture decisions and trade-offs
- Methodology comparisons and rationale

**Primary Personas:** Marcus Thompson (governance), James Park (foundational), Sarah Chen (optimization decisions)

---

### 1.3 Content Mapping by Diataxis Category

| Existing/Planned Content | Diataxis Category | Rationale |
|-------------------------|-------------------|-----------|
| First Run Tutorial | Tutorial | Learning through doing |
| Installation Guide | Tutorial | Guided setup process |
| Build a Todo App | Tutorial | Complete project learning |
| Configure Breakpoints | How-to | Specific task completion |
| Resume Interrupted Work | How-to | Problem-solving guide |
| CI/CD Integration | How-to | Task-oriented automation |
| Troubleshooting Guide | How-to | Problem-solution format |
| CLI Reference | Reference | Technical specification |
| API Reference | Reference | Technical specification |
| Glossary | Reference | Term definitions |
| Configuration Reference | Reference | Settings specification |
| Event Sourcing Explained | Explanation | Conceptual understanding |
| Quality Convergence | Explanation | Philosophy and rationale |
| Architecture Overview | Explanation | System understanding |
| Methodology Comparison | Explanation | Decision-making context |

---

## 2. Complete Sitemap

### 2.1 Sitemap by Diataxis Category

```
docs/
|
+-- index.md                              # Landing page / documentation home
|
+-- tutorials/                            # LEARNING-ORIENTED
|   |
|   +-- index.md                          # Tutorials overview
|   |
|   +-- getting-started/                  # Level 1: Beginner Tutorials
|   |   +-- index.md                      # Getting started overview
|   |   +-- prerequisites.md              # Environment preparation
|   |   +-- installation.md               # Step-by-step installation
|   |   +-- your-first-run.md             # First babysitter execution
|   |   +-- understanding-results.md      # Reading run output and artifacts
|   |
|   +-- building-features/                # Level 2: Intermediate Tutorials
|   |   +-- index.md                      # Building features overview
|   |   +-- tdd-calculator.md             # Build calculator with TDD
|   |   +-- todo-api.md                   # Build a todo API end-to-end
|   |   +-- auth-feature.md               # Add authentication with TDD
|   |   +-- refactoring-legacy.md         # Refactor legacy code safely
|   |
|   +-- advanced-projects/                # Level 3: Advanced Tutorials
|       +-- index.md                      # Advanced projects overview
|       +-- ci-integration-tutorial.md    # GitHub Actions integration project
|       +-- team-onboarding.md            # Onboard your team tutorial
|       +-- custom-process-tutorial.md    # Create your first custom process
|
+-- how-to/                               # TASK-ORIENTED
|   |
|   +-- index.md                          # How-to guides overview
|   |
|   +-- workflows/                        # Workflow How-tos
|   |   +-- index.md                      # Workflows overview
|   |   +-- resume-interrupted-work.md    # Resume after session ends
|   |   +-- manage-multiple-runs.md       # Work with several concurrent runs
|   |   +-- review-run-history.md         # Analyze past runs via journal
|   |   +-- cancel-running-workflow.md    # Stop a workflow in progress
|   |
|   +-- quality/                          # Quality Management How-tos
|   |   +-- index.md                      # Quality management overview
|   |   +-- set-quality-targets.md        # Configure quality thresholds
|   |   +-- tune-iteration-limits.md      # Optimize max iterations
|   |   +-- customize-scoring.md          # Adjust quality scoring criteria
|   |   +-- debug-quality-issues.md       # When quality doesn't converge
|   |
|   +-- breakpoints/                      # Breakpoint How-tos
|   |   +-- index.md                      # Breakpoints overview
|   |   +-- configure-breakpoint-service.md # Set up the web UI
|   |   +-- approve-via-web.md            # Approve breakpoints in browser
|   |   +-- setup-telegram.md             # Mobile notifications setup
|   |   +-- configure-ngrok.md            # Expose service externally
|   |   +-- create-approval-policies.md   # Define when approval is needed
|   |
|   +-- integration/                      # Integration How-tos
|   |   +-- index.md                      # Integration overview
|   |   +-- github-actions.md             # GitHub Actions CI/CD
|   |   +-- gitlab-ci.md                  # GitLab CI integration
|   |   +-- jenkins.md                    # Jenkins pipeline integration
|   |   +-- scripting-with-cli.md         # Bash/shell automation
|   |   +-- node-sdk-automation.md        # Node.js programmatic use
|   |
|   +-- methodologies/                    # Methodology How-tos
|   |   +-- index.md                      # Methodologies overview
|   |   +-- use-tdd-workflow.md           # TDD quality convergence
|   |   +-- use-gsd-workflow.md           # Get Shit Done rapid mode
|   |   +-- use-spec-kit.md               # Specification-driven workflow
|   |   +-- choose-methodology.md         # Select the right approach
|   |
|   +-- troubleshooting/                  # Troubleshooting How-tos
|   |   +-- index.md                      # Troubleshooting overview
|   |   +-- installation-issues.md        # Fix installation problems
|   |   +-- runtime-errors.md             # Resolve runtime issues
|   |   +-- breakpoint-issues.md          # Breakpoint not resolving
|   |   +-- performance-problems.md       # Slow iterations, memory issues
|   |   +-- journal-recovery.md           # Recover from journal corruption
|   |
|   +-- customization/                    # Customization How-tos
|       +-- index.md                      # Customization overview
|       +-- create-custom-process.md      # Build a process definition
|       +-- create-custom-hooks.md        # Develop lifecycle hooks
|       +-- create-team-templates.md      # Shared team process templates
|       +-- extend-quality-scoring.md     # Custom quality evaluators
|
+-- reference/                            # INFORMATION-ORIENTED
|   |
|   +-- index.md                          # Reference overview
|   |
|   +-- cli/                              # CLI Reference
|   |   +-- index.md                      # CLI overview
|   |   +-- run-create.md                 # run:create command
|   |   +-- run-iterate.md                # run:iterate command
|   |   +-- run-status.md                 # run:status command
|   |   +-- run-list.md                   # run:list command
|   |   +-- run-cancel.md                 # run:cancel command
|   |   +-- effects-get.md                # effects:get command
|   |   +-- effects-post.md               # effects:post command
|   |   +-- journal-commands.md           # journal:* commands
|   |   +-- global-options.md             # Global CLI flags
|   |   +-- exit-codes.md                 # Exit codes reference
|   |   +-- output-formats.md             # JSON/text output schemas
|   |
|   +-- api/                              # SDK API Reference
|   |   +-- index.md                      # API overview
|   |   +-- babysitter-class.md           # Main Babysitter class
|   |   +-- run-class.md                  # Run object API
|   |   +-- journal-api.md                # Journal access API
|   |   +-- effect-types.md               # Effect type specifications
|   |   +-- task-types.md                 # Task type specifications
|   |   +-- event-types.md                # Event type definitions
|   |
|   +-- configuration/                    # Configuration Reference
|   |   +-- index.md                      # Configuration overview
|   |   +-- environment-variables.md      # All env vars
|   |   +-- config-files.md               # Configuration file formats
|   |   +-- process-parameters.md         # Process definition parameters
|   |   +-- breakpoint-config.md          # Breakpoint service configuration
|   |
|   +-- file-structure/                   # File Structure Reference
|   |   +-- index.md                      # File structure overview
|   |   +-- run-directory.md              # .a5c/runs/<runId>/ structure
|   |   +-- journal-format.md             # Journal file format
|   |   +-- state-file.md                 # State.json specification
|   |   +-- artifact-types.md             # Artifact file types
|   |
|   +-- glossary.md                       # Complete terminology reference
|   +-- error-catalog.md                  # All error messages and solutions
|   +-- keyboard-shortcuts.md             # UI and CLI shortcuts
|   +-- version-history.md                # Changelog and migration guides
|
+-- explanation/                          # UNDERSTANDING-ORIENTED
|   |
|   +-- index.md                          # Explanation overview
|   |
|   +-- core-concepts/                    # Foundational Concepts
|   |   +-- index.md                      # Core concepts overview
|   |   +-- what-is-babysitter.md         # Introduction and positioning
|   |   +-- event-sourcing.md             # Event sourcing explained
|   |   +-- quality-convergence.md        # Iterative quality improvement
|   |   +-- human-in-the-loop.md          # Why human approval matters
|   |   +-- deterministic-execution.md    # Predictability and replay
|   |
|   +-- architecture/                     # Architecture Concepts
|   |   +-- index.md                      # Architecture overview
|   |   +-- system-architecture.md        # High-level system design
|   |   +-- journal-system.md             # Journal internals and design
|   |   +-- process-engine.md             # Process execution engine
|   |   +-- task-execution.md             # How tasks are executed
|   |   +-- breakpoint-architecture.md    # Breakpoint system design
|   |
|   +-- methodologies/                    # Methodology Concepts
|   |   +-- index.md                      # Methodology philosophy
|   |   +-- tdd-philosophy.md             # Why TDD with AI
|   |   +-- gsd-philosophy.md             # When speed matters
|   |   +-- spec-kit-philosophy.md        # Specification-driven rationale
|   |   +-- methodology-comparison.md     # Detailed comparison
|   |
|   +-- governance/                       # Governance and Compliance
|   |   +-- index.md                      # Governance overview
|   |   +-- audit-trails.md               # Audit trail design and usage
|   |   +-- compliance-patterns.md        # Meeting compliance requirements
|   |   +-- security-model.md             # Security boundaries and trust
|   |   +-- access-control.md             # Permission and access patterns
|   |
|   +-- best-practices/                   # Best Practices
|       +-- index.md                      # Best practices overview
|       +-- workflow-patterns.md          # Effective workflow patterns
|       +-- quality-optimization.md       # Optimizing for quality
|       +-- team-adoption.md              # Team rollout strategies
|       +-- process-design.md             # Custom process best practices
```

### 2.2 Sitemap Statistics

| Category | Level 1 Sections | Level 2 Topics | Total Pages |
|----------|------------------|----------------|-------------|
| Tutorials | 3 | 14 | 18 |
| How-to Guides | 7 | 35 | 43 |
| Reference | 5 | 27 | 36 |
| Explanation | 5 | 22 | 28 |
| **Total** | **20** | **98** | **125** |

---

## 3. Navigation Menu Structure

### 3.1 Primary Navigation (Top-Level)

```
+------------------------------------------------------------------+
|  [Logo] Babysitter Docs                                           |
+------------------------------------------------------------------+
|  Tutorials  |  How-to Guides  |  Reference  |  Explanation  | [Search] |
+------------------------------------------------------------------+
```

### 3.2 Secondary Navigation (Category-Level Sidebars)

#### Tutorials Sidebar

```
TUTORIALS

Getting Started
  - Overview
  - Prerequisites
  - Installation
  - Your First Run
  - Understanding Results

Building Features
  - Overview
  - TDD Calculator
  - Todo API
  - Auth Feature
  - Refactoring Legacy Code

Advanced Projects
  - Overview
  - CI Integration Tutorial
  - Team Onboarding
  - Custom Process Tutorial
```

#### How-to Guides Sidebar

```
HOW-TO GUIDES

Workflows
  - Overview
  - Resume Interrupted Work
  - Manage Multiple Runs
  - Review Run History
  - Cancel Running Workflow

Quality Management
  - Overview
  - Set Quality Targets
  - Tune Iteration Limits
  - Customize Scoring
  - Debug Quality Issues

Breakpoints
  - Overview
  - Configure Service
  - Approve via Web
  - Setup Telegram
  - Configure ngrok
  - Create Approval Policies

Integration
  - Overview
  - GitHub Actions
  - GitLab CI
  - Jenkins
  - Scripting with CLI
  - Node SDK Automation

Methodologies
  - Overview
  - Use TDD Workflow
  - Use GSD Workflow
  - Use Spec-Kit
  - Choose Methodology

Troubleshooting
  - Overview
  - Installation Issues
  - Runtime Errors
  - Breakpoint Issues
  - Performance Problems
  - Journal Recovery

Customization
  - Overview
  - Create Custom Process
  - Create Custom Hooks
  - Create Team Templates
  - Extend Quality Scoring
```

#### Reference Sidebar

```
REFERENCE

CLI Reference
  - Overview
  - run:create
  - run:iterate
  - run:status
  - run:list
  - run:cancel
  - effects:get
  - effects:post
  - journal:* Commands
  - Global Options
  - Exit Codes
  - Output Formats

SDK API
  - Overview
  - Babysitter Class
  - Run Class
  - Journal API
  - Effect Types
  - Task Types
  - Event Types

Configuration
  - Overview
  - Environment Variables
  - Config Files
  - Process Parameters
  - Breakpoint Config

File Structure
  - Overview
  - Run Directory
  - Journal Format
  - State File
  - Artifact Types

Quick Reference
  - Glossary
  - Error Catalog
  - Keyboard Shortcuts
  - Version History
```

#### Explanation Sidebar

```
EXPLANATION

Core Concepts
  - Overview
  - What is Babysitter?
  - Event Sourcing
  - Quality Convergence
  - Human-in-the-Loop
  - Deterministic Execution

Architecture
  - Overview
  - System Architecture
  - Journal System
  - Process Engine
  - Task Execution
  - Breakpoint Architecture

Methodologies
  - Overview
  - TDD Philosophy
  - GSD Philosophy
  - Spec-Kit Philosophy
  - Methodology Comparison

Governance
  - Overview
  - Audit Trails
  - Compliance Patterns
  - Security Model
  - Access Control

Best Practices
  - Overview
  - Workflow Patterns
  - Quality Optimization
  - Team Adoption
  - Process Design
```

### 3.3 Mobile Navigation

```
+---------------------------+
| [Hamburger] Babysitter    |
+---------------------------+
| [Search icon]             |
+---------------------------+

[Hamburger expanded:]
+---------------------------+
| Tutorials           [>]   |
| How-to Guides       [>]   |
| Reference           [>]   |
| Explanation         [>]   |
+---------------------------+
| Quick Links               |
| - Getting Started         |
| - CLI Reference           |
| - Glossary                |
+---------------------------+
```

### 3.4 Footer Navigation

```
+------------------------------------------------------------------+
| Tutorials          | How-to          | Reference    | Explanation |
| - Getting Started  | - Workflows     | - CLI        | - Concepts  |
| - Building         | - Quality       | - API        | - Architecture |
|   Features         | - Breakpoints   | - Config     | - Methodologies |
| - Advanced         | - Integration   | - Files      | - Governance |
|   Projects         | - Troubleshoot  | - Glossary   | - Best Practices |
+------------------------------------------------------------------+
| Resources                                                          |
| GitHub | Community | Blog | Changelog | Support                   |
+------------------------------------------------------------------+
```

---

## 4. Page Hierarchy

### 4.1 Tutorials Hierarchy

```
TUTORIALS
|
+-- Level 1: Getting Started (Beginner)
|   |
|   +-- L1.1 Prerequisites
|   |   +-- Node.js requirements
|   |   +-- Claude Code setup
|   |   +-- Optional tools
|   |   +-- Knowledge checklist
|   |
|   +-- L1.2 Installation
|   |   +-- SDK installation
|   |   +-- Plugin installation
|   |   +-- Breakpoints service
|   |   +-- Verification steps
|   |
|   +-- L1.3 Your First Run
|   |   +-- Starting Claude Code
|   |   +-- Running /babysitter:call command
|   |   +-- Observing iteration
|   |   +-- Viewing results
|   |
|   +-- L1.4 Understanding Results
|       +-- Run directory structure
|       +-- Reading the journal
|       +-- Viewing artifacts
|       +-- Quality scores
|
+-- Level 2: Building Features (Intermediate)
|   |
|   +-- L2.1 TDD Calculator
|   |   +-- Project setup
|   |   +-- Defining requirements
|   |   +-- Running TDD workflow
|   |   +-- Test-first iteration
|   |   +-- Quality convergence
|   |   +-- Final review
|   |
|   +-- L2.2 Todo API
|   |   +-- API design
|   |   +-- Database setup
|   |   +-- Endpoint creation
|   |   +-- Testing integration
|   |   +-- Breakpoint approval
|   |   +-- Deployment preparation
|   |
|   +-- L2.3 Auth Feature
|   |   +-- JWT concepts
|   |   +-- Security requirements
|   |   +-- TDD implementation
|   |   +-- Security review breakpoint
|   |   +-- Integration testing
|   |
|   +-- L2.4 Refactoring Legacy Code
|       +-- Analysis phase
|       +-- Test coverage first
|       +-- Incremental refactoring
|       +-- Quality validation
|       +-- Safe deployment
|
+-- Level 3: Advanced Projects (Expert)
    |
    +-- L3.1 CI Integration Tutorial
    |   +-- GitHub Actions setup
    |   +-- Workflow configuration
    |   +-- Automated quality gates
    |   +-- Breakpoint handling in CI
    |   +-- Reporting and notifications
    |
    +-- L3.2 Team Onboarding
    |   +-- Planning rollout
    |   +-- Creating team processes
    |   +-- Training materials
    |   +-- Governance setup
    |   +-- Success metrics
    |
    +-- L3.3 Custom Process Tutorial
        +-- Process definition basics
        +-- Task orchestration
        +-- Quality scoring
        +-- Breakpoint integration
        +-- Testing and deployment
```

### 4.2 How-to Guides Hierarchy

```
HOW-TO GUIDES
|
+-- Workflows
|   +-- Resume Interrupted Work
|   |   +-- Identifying paused runs
|   |   +-- Resume command
|   |   +-- State verification
|   |
|   +-- Manage Multiple Runs
|   |   +-- Listing active runs
|   |   +-- Switching contexts
|   |   +-- Run isolation
|   |
|   +-- Review Run History
|   |   +-- Journal exploration
|   |   +-- Event filtering
|   |   +-- Artifact analysis
|   |
|   +-- Cancel Running Workflow
|       +-- Graceful cancellation
|       +-- Force stop
|       +-- Cleanup procedures
|
+-- Quality Management
|   +-- Set Quality Targets
|   |   +-- Target selection
|   |   +-- Per-process configuration
|   |   +-- Dynamic adjustment
|   |
|   +-- Tune Iteration Limits
|   |   +-- Max iterations setting
|   |   +-- Early exit conditions
|   |   +-- Performance balance
|   |
|   +-- Customize Scoring
|   |   +-- Scoring criteria
|   |   +-- Weight adjustment
|   |   +-- Custom evaluators
|   |
|   +-- Debug Quality Issues
|       +-- Score analysis
|       +-- Iteration review
|       +-- Target adjustment
|
+-- Breakpoints
|   +-- Configure Breakpoint Service
|   |   +-- Service startup
|   |   +-- Port configuration
|   |   +-- Authentication setup
|   |
|   +-- Approve via Web
|   |   +-- Accessing the UI
|   |   +-- Review interface
|   |   +-- Approval workflow
|   |
|   +-- Setup Telegram
|   |   +-- Bot creation
|   |   +-- Token configuration
|   |   +-- Notification settings
|   |
|   +-- Configure ngrok
|   |   +-- ngrok installation
|   |   +-- Tunnel setup
|   |   +-- Security considerations
|   |
|   +-- Create Approval Policies
|       +-- Policy definition
|       +-- Trigger conditions
|       +-- Escalation rules
|
+-- Integration
|   +-- GitHub Actions
|   |   +-- Workflow file setup
|   |   +-- Secrets configuration
|   |   +-- Job definitions
|   |   +-- Artifact handling
|   |
|   +-- GitLab CI
|   |   +-- .gitlab-ci.yml setup
|   |   +-- Variables configuration
|   |   +-- Stage definitions
|   |
|   +-- Jenkins
|   |   +-- Jenkinsfile creation
|   |   +-- Credentials setup
|   |   +-- Pipeline stages
|   |
|   +-- Scripting with CLI
|   |   +-- Bash patterns
|   |   +-- JSON parsing
|   |   +-- Error handling
|   |
|   +-- Node SDK Automation
|       +-- SDK installation
|       +-- Programmatic usage
|       +-- Event handling
|
+-- Methodologies
|   +-- Use TDD Workflow
|   |   +-- Process selection
|   |   +-- Configuration
|   |   +-- Execution
|   |
|   +-- Use GSD Workflow
|   |   +-- When to use GSD
|   |   +-- Configuration
|   |   +-- Speed optimization
|   |
|   +-- Use Spec-Kit
|   |   +-- Specification input
|   |   +-- Configuration
|   |   +-- Validation
|   |
|   +-- Choose Methodology
|       +-- Decision criteria
|       +-- Comparison table
|       +-- Recommendations
|
+-- Troubleshooting
|   +-- Installation Issues
|   |   +-- CLI not found
|   |   +-- Plugin not appearing
|   |   +-- Version mismatches
|   |
|   +-- Runtime Errors
|   |   +-- Session timeouts
|   |   +-- API errors
|   |   +-- Memory issues
|   |
|   +-- Breakpoint Issues
|   |   +-- Service not starting
|   |   +-- Approval not resolving
|   |   +-- Connection problems
|   |
|   +-- Performance Problems
|   |   +-- Slow iterations
|   |   +-- High memory usage
|   |   +-- Large journal files
|   |
|   +-- Journal Recovery
|       +-- Corruption detection
|       +-- State rebuild
|       +-- Manual recovery
|
+-- Customization
    +-- Create Custom Process
    |   +-- Process structure
    |   +-- Task definitions
    |   +-- Testing
    |
    +-- Create Custom Hooks
    |   +-- Hook types
    |   +-- Implementation
    |   +-- Registration
    |
    +-- Create Team Templates
    |   +-- Template design
    |   +-- Parameterization
    |   +-- Distribution
    |
    +-- Extend Quality Scoring
        +-- Evaluator interface
        +-- Custom metrics
        +-- Integration
```

### 4.3 Reference Hierarchy

```
REFERENCE
|
+-- CLI Reference
|   +-- run:create
|   |   +-- Synopsis
|   |   +-- Options
|   |   +-- Examples
|   |   +-- Exit codes
|   |
|   +-- run:iterate
|   |   +-- Synopsis
|   |   +-- Options
|   |   +-- Examples
|   |   +-- Exit codes
|   |
|   +-- run:status
|   |   +-- Synopsis
|   |   +-- Options
|   |   +-- Output format
|   |
|   +-- run:list
|   |   +-- Synopsis
|   |   +-- Filtering options
|   |   +-- Output format
|   |
|   +-- run:cancel
|   |   +-- Synopsis
|   |   +-- Options
|   |   +-- Behavior
|   |
|   +-- effects:get
|   |   +-- Synopsis
|   |   +-- Options
|   |   +-- Output format
|   |
|   +-- effects:post
|   |   +-- Synopsis
|   |   +-- Options
|   |   +-- Input format
|   |
|   +-- journal:* Commands
|   |   +-- journal:list
|   |   +-- journal:get
|   |   +-- journal:export
|   |
|   +-- Global Options
|   |   +-- --help
|   |   +-- --version
|   |   +-- --json
|   |   +-- --verbose
|   |   +-- --cwd
|   |
|   +-- Exit Codes
|   |   +-- Success codes
|   |   +-- Error codes
|   |   +-- Signal handling
|   |
|   +-- Output Formats
|       +-- JSON schema
|       +-- Text format
|       +-- Table format
|
+-- SDK API Reference
|   +-- Babysitter Class
|   |   +-- Constructor
|   |   +-- Methods
|   |   +-- Properties
|   |   +-- Events
|   |
|   +-- Run Class
|   |   +-- Properties
|   |   +-- Methods
|   |   +-- State transitions
|   |
|   +-- Journal API
|   |   +-- Reading events
|   |   +-- Writing events
|   |   +-- Querying
|   |
|   +-- Effect Types
|   |   +-- TaskEffect
|   |   +-- BreakpointEffect
|   |   +-- SleepEffect
|   |
|   +-- Task Types
|   |   +-- AgentTask
|   |   +-- SkillTask
|   |   +-- NodeTask
|   |   +-- ShellTask
|   |
|   +-- Event Types
|       +-- RunCreated
|       +-- IterationStarted
|       +-- EffectRequested
|       +-- EffectCompleted
|       +-- RunCompleted
|
+-- Configuration Reference
|   +-- Environment Variables
|   |   +-- BABYSITTER_*
|   |   +-- A5C_*
|   |   +-- NODE_*
|   |
|   +-- Config Files
|   |   +-- .a5c/config.json
|   |   +-- Process config
|   |   +-- Breakpoint config
|   |
|   +-- Process Parameters
|   |   +-- Required parameters
|   |   +-- Optional parameters
|   |   +-- Parameter types
|   |
|   +-- Breakpoint Config
|       +-- Service settings
|       +-- UI settings
|       +-- Notification settings
|
+-- File Structure Reference
|   +-- Run Directory
|   |   +-- Directory layout
|   |   +-- File purposes
|   |   +-- Lifecycle
|   |
|   +-- Journal Format
|   |   +-- File naming
|   |   +-- Event structure
|   |   +-- Ordering guarantees
|   |
|   +-- State File
|   |   +-- Schema
|   |   +-- Derivation rules
|   |   +-- Caching behavior
|   |
|   +-- Artifact Types
|       +-- Plans
|       +-- Reports
|       +-- Specs
|       +-- Logs
|
+-- Quick Reference
    +-- Glossary
    |   +-- A-Z term definitions
    |   +-- Related term links
    |
    +-- Error Catalog
    |   +-- Error codes
    |   +-- Error messages
    |   +-- Resolution steps
    |
    +-- Keyboard Shortcuts
    |   +-- CLI shortcuts
    |   +-- UI shortcuts
    |
    +-- Version History
        +-- Changelog
        +-- Migration guides
        +-- Deprecation notices
```

### 4.4 Explanation Hierarchy

```
EXPLANATION
|
+-- Core Concepts
|   +-- What is Babysitter?
|   |   +-- Problem statement
|   |   +-- Solution overview
|   |   +-- Key differentiators
|   |   +-- Use case examples
|   |
|   +-- Event Sourcing
|   |   +-- What is event sourcing?
|   |   +-- Benefits for AI workflows
|   |   +-- Journal as source of truth
|   |   +-- State derivation
|   |   +-- Replay and recovery
|   |
|   +-- Quality Convergence
|   |   +-- The iteration loop
|   |   +-- Quality scoring
|   |   +-- Convergence criteria
|   |   +-- When to stop iterating
|   |
|   +-- Human-in-the-Loop
|   |   +-- Why human approval matters
|   |   +-- Breakpoint philosophy
|   |   +-- Trust and automation balance
|   |   +-- Use case patterns
|   |
|   +-- Deterministic Execution
|       +-- Reproducibility goals
|       +-- Journal-based replay
|       +-- Non-determinism handling
|       +-- Testing implications
|
+-- Architecture
|   +-- System Architecture
|   |   +-- Component overview
|   |   +-- Data flow
|   |   +-- Integration points
|   |   +-- Deployment options
|   |
|   +-- Journal System
|   |   +-- Design principles
|   |   +-- Append-only guarantees
|   |   +-- Event ordering
|   |   +-- Storage considerations
|   |
|   +-- Process Engine
|   |   +-- Process lifecycle
|   |   +-- Effect scheduling
|   |   +-- Dependency management
|   |   +-- Error handling
|   |
|   +-- Task Execution
|   |   +-- Task types deep dive
|   |   +-- Execution environment
|   |   +-- Result handling
|   |   +-- Retry behavior
|   |
|   +-- Breakpoint Architecture
|       +-- Service design
|       +-- Resolution flow
|       +-- Persistence
|       +-- Multi-approver patterns
|
+-- Methodologies
|   +-- TDD Philosophy
|   |   +-- Test-first rationale
|   |   +-- AI and TDD synergy
|   |   +-- Quality through tests
|   |   +-- When TDD works best
|   |
|   +-- GSD Philosophy
|   |   +-- Speed over perfection
|   |   +-- Appropriate use cases
|   |   +-- Trade-offs
|   |
|   +-- Spec-Kit Philosophy
|   |   +-- Specification-driven development
|   |   +-- Contract-first approach
|   |   +-- Validation strategies
|   |
|   +-- Methodology Comparison
|       +-- Feature matrix
|       +-- Use case mapping
|       +-- Decision framework
|       +-- Hybrid approaches
|
+-- Governance
|   +-- Audit Trails
|   |   +-- Compliance requirements
|   |   +-- What is logged
|   |   +-- Retention policies
|   |   +-- Access patterns
|   |
|   +-- Compliance Patterns
|   |   +-- SOC 2 considerations
|   |   +-- GDPR implications
|   |   +-- Industry-specific guidance
|   |
|   +-- Security Model
|   |   +-- Trust boundaries
|   |   +-- Data handling
|   |   +-- Network security
|   |   +-- Secret management
|   |
|   +-- Access Control
|       +-- Permission model
|       +-- Role definitions
|       +-- Enforcement points
|
+-- Best Practices
    +-- Workflow Patterns
    |   +-- Effective prompting
    |   +-- Iteration optimization
    |   +-- Breakpoint placement
    |
    +-- Quality Optimization
    |   +-- Target setting
    |   +-- Scoring tuning
    |   +-- Convergence acceleration
    |
    +-- Team Adoption
    |   +-- Rollout strategies
    |   +-- Training approaches
    |   +-- Success metrics
    |
    +-- Process Design
        +-- Reusable patterns
        +-- Parameterization
        +-- Testing processes
        +-- Versioning
```

---

## 5. Breadcrumb Navigation

### 5.1 Breadcrumb Format

```
Home > Category > Section > Page
```

### 5.2 Breadcrumb Examples

| Page | Breadcrumb |
|------|------------|
| Installation Tutorial | `Docs > Tutorials > Getting Started > Installation` |
| Resume Interrupted Work | `Docs > How-to Guides > Workflows > Resume Interrupted Work` |
| run:create Command | `Docs > Reference > CLI > run:create` |
| Event Sourcing Explained | `Docs > Explanation > Core Concepts > Event Sourcing` |
| GitHub Actions Integration | `Docs > How-to Guides > Integration > GitHub Actions` |
| Glossary | `Docs > Reference > Glossary` |

### 5.3 Breadcrumb Implementation Rules

1. **Maximum depth:** 4 levels (Home included)
2. **Truncation:** On mobile, show `... > Section > Page`
3. **Links:** All breadcrumb items except current page are links
4. **Styling:** Current page in bold, separator is `>`
5. **Schema markup:** Use BreadcrumbList schema for SEO

### 5.4 Breadcrumb HTML Template

```html
<nav aria-label="Breadcrumb" class="breadcrumb">
  <ol itemscope itemtype="https://schema.org/BreadcrumbList">
    <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
      <a itemprop="item" href="/docs/">
        <span itemprop="name">Docs</span>
      </a>
      <meta itemprop="position" content="1" />
    </li>
    <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
      <a itemprop="item" href="/docs/tutorials/">
        <span itemprop="name">Tutorials</span>
      </a>
      <meta itemprop="position" content="2" />
    </li>
    <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
      <a itemprop="item" href="/docs/tutorials/getting-started/">
        <span itemprop="name">Getting Started</span>
      </a>
      <meta itemprop="position" content="3" />
    </li>
    <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
      <span itemprop="name"><strong>Installation</strong></span>
      <meta itemprop="position" content="4" />
    </li>
  </ol>
</nav>
```

---

## 6. Cross-Reference Strategy

### 6.1 Cross-Reference Types

| Type | Purpose | Example |
|------|---------|---------|
| **Prerequisites** | Link to required prior reading | "Before starting, complete [Installation](../getting-started/installation.md)" |
| **Related Concepts** | Connect to explanations | "Learn more about [Event Sourcing](../explanation/core-concepts/event-sourcing.md)" |
| **Next Steps** | Guide progression | "Ready for more? Try [Building a Todo API](./todo-api.md)" |
| **See Also** | Related topics | "See also: [Quality Convergence](../explanation/core-concepts/quality-convergence.md)" |
| **Reference Links** | Technical details | "For all options, see [CLI Reference](../reference/cli/run-create.md)" |
| **Troubleshooting** | Problem resolution | "Having issues? Check [Troubleshooting](../how-to/troubleshooting/)" |

### 6.2 Cross-Reference Placement Strategy

#### In Tutorials

| Location | Cross-Reference Type |
|----------|---------------------|
| Introduction | Prerequisites |
| Concept mentions | Related Concepts |
| Command usage | Reference Links |
| End of page | Next Steps, See Also |
| Error scenarios | Troubleshooting |

#### In How-to Guides

| Location | Cross-Reference Type |
|----------|---------------------|
| Introduction | Prerequisites, Related Concepts |
| Step details | Reference Links |
| Advanced options | See Also |
| End of page | Related How-tos, Troubleshooting |

#### In Reference

| Location | Cross-Reference Type |
|----------|---------------------|
| Overview | Tutorials for usage examples |
| Related items | Other Reference pages |
| Complex concepts | Explanation pages |

#### In Explanation

| Location | Cross-Reference Type |
|----------|---------------------|
| Practical applications | How-to Guides |
| Technical details | Reference pages |
| Learning paths | Tutorials |
| Related concepts | Other Explanation pages |

### 6.3 Cross-Reference Matrix

This matrix shows primary relationships between sections:

| From \ To | Tutorials | How-to | Reference | Explanation |
|-----------|-----------|--------|-----------|-------------|
| **Tutorials** | Next steps | After completion | Commands used | Background |
| **How-to** | Prerequisites | Related tasks | Technical details | Why this matters |
| **Reference** | Usage examples | Practical application | Related items | Concepts |
| **Explanation** | Try it yourself | Apply this | Technical spec | Related topics |

### 6.4 Internal Linking Patterns

#### Pattern 1: Inline Contextual Link
```markdown
The [journal system](../explanation/architecture/journal-system.md) stores all events
as append-only records.
```

#### Pattern 2: Callout Box
```markdown
> **Learn More**
>
> To understand why Babysitter uses event sourcing, see
> [Event Sourcing Explained](../explanation/core-concepts/event-sourcing.md).
```

#### Pattern 3: Prerequisites Block
```markdown
## Prerequisites

Before starting this tutorial, ensure you have:
- Completed [Installation](./installation.md)
- Read [Your First Run](./your-first-run.md)
- Basic understanding of [TDD concepts](../explanation/methodologies/tdd-philosophy.md)
```

#### Pattern 4: Next Steps Section
```markdown
## Next Steps

Now that you've completed your first run:
- **Continue learning:** [Understanding Results](./understanding-results.md)
- **Build something:** [TDD Calculator Tutorial](../building-features/tdd-calculator.md)
- **Go deeper:** [Event Sourcing Explained](../explanation/core-concepts/event-sourcing.md)
```

#### Pattern 5: See Also Footer
```markdown
---

## See Also

- [Quality Convergence](../explanation/core-concepts/quality-convergence.md) - Understand how quality targets work
- [Set Quality Targets](../how-to/quality/set-quality-targets.md) - Configure targets for your projects
- [Debug Quality Issues](../how-to/troubleshooting/debug-quality-issues.md) - When quality doesn't converge
```

### 6.5 External Link Strategy

| External Resource | Link Pattern | Notes |
|-------------------|--------------|-------|
| Claude Code Docs | Link with icon | Opens new tab |
| GitHub Repository | Direct link | For code references |
| npm Packages | npm badge + link | Version info |
| Community Resources | Dedicated section | Slack, Discord, etc. |

---

## 7. Content Templates

### 7.1 Tutorial Template

```markdown
---
title: [Tutorial Title]
description: [One-sentence description]
category: tutorial
level: beginner | intermediate | advanced
estimated_time: [X minutes]
prerequisites:
  - [list of prerequisite pages]
personas:
  - [primary personas]
---

# [Tutorial Title]

**Time:** [X minutes] | **Level:** [Beginner/Intermediate/Advanced]

## What You'll Learn

By the end of this tutorial, you will be able to:
- [Learning objective 1]
- [Learning objective 2]
- [Learning objective 3]

## Prerequisites

Before starting, ensure you have:
- [ ] [Prerequisite 1 with link]
- [ ] [Prerequisite 2 with link]

## What We're Building

[Brief description of the project/outcome, with screenshot or diagram if applicable]

---

## Step 1: [Action Title]

[Explanation of what we're doing and why]

```bash
[command]
```

**What you should see:**

```
[expected output]
```

> **Note:** [Helpful tip or common mistake to avoid]

---

## Step 2: [Action Title]

[Continue pattern...]

---

## Step [N]: [Final Action]

[Final step...]

---

## Summary

You've successfully:
- [Accomplishment 1]
- [Accomplishment 2]
- [Accomplishment 3]

## Next Steps

- **Continue learning:** [Next tutorial link]
- **Apply this:** [Related how-to link]
- **Go deeper:** [Related explanation link]

## Troubleshooting

### [Common Issue 1]

**Symptom:** [What the user sees]

**Solution:** [How to fix it]

### [Common Issue 2]

[Continue pattern...]

---

## See Also

- [Related page 1]
- [Related page 2]
```

### 7.2 How-to Guide Template

```markdown
---
title: How to [Task]
description: [One-sentence description of what this achieves]
category: how-to
section: [workflows|quality|breakpoints|integration|methodologies|troubleshooting|customization]
personas:
  - [primary personas]
---

# How to [Task]

[One paragraph explaining what this guide helps you accomplish and when you'd need it]

## Prerequisites

- [Prerequisite 1]
- [Prerequisite 2]

## Steps

### 1. [First Action]

[Brief explanation]

```bash
[command or code]
```

### 2. [Second Action]

[Brief explanation]

```bash
[command or code]
```

### 3. [Continue as needed...]

---

## Variations

### [Variation 1: Different Scenario]

[Adjusted steps for this scenario]

### [Variation 2: Alternative Approach]

[Adjusted steps for this approach]

---

## Verification

To confirm success:

```bash
[verification command]
```

Expected result: [what indicates success]

---

## Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| [Issue 1] | [Cause] | [Solution] |
| [Issue 2] | [Cause] | [Solution] |

---

## Related Guides

- [Related how-to 1]
- [Related how-to 2]

## Reference

- [CLI command reference]
- [Configuration reference]
```

### 7.3 Reference Template

```markdown
---
title: [Reference Item Name]
description: [Brief technical description]
category: reference
section: [cli|api|configuration|file-structure]
---

# [Reference Item Name]

[One-paragraph technical description]

## Synopsis

```
[command syntax or API signature]
```

## [Options/Parameters/Properties]

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `[name]` | [type] | [Yes/No] | [default] | [Description] |
| `[name]` | [type] | [Yes/No] | [default] | [Description] |

## [Return Value/Output]

[Description of what is returned or output]

### [Format 1: JSON]

```json
{
  "[field]": "[description]"
}
```

### [Format 2: Text]

```
[text output format]
```

## Examples

### Basic Usage

```bash
[example command]
```

Output:
```
[example output]
```

### [Specific Use Case]

```bash
[example command for use case]
```

## [Exit Codes / Error Handling]

| Code | Meaning |
|------|---------|
| [code] | [meaning] |

## [Related / See Also]

- [Related reference 1]
- [Related reference 2]
- [How-to guide using this]
```

### 7.4 Explanation Template

```markdown
---
title: [Concept Name]
description: [One-sentence description]
category: explanation
section: [core-concepts|architecture|methodologies|governance|best-practices]
personas:
  - [primary personas]
---

# [Concept Name]

[Opening paragraph that establishes context and importance]

## Overview

[High-level explanation accessible to all readers]

## [Core Concept Section 1]

[Detailed explanation with examples]

### [Subsection if needed]

[Further detail]

## [Core Concept Section 2]

[Continue pattern...]

## How It Works

[Technical explanation with diagrams if helpful]

```
[diagram in ASCII or reference to image]
```

## Why This Matters

[Explanation of importance and benefits]

### [Benefit 1]

[Explanation]

### [Benefit 2]

[Explanation]

## Trade-offs and Alternatives

[Discussion of trade-offs, when this approach isn't ideal, alternatives]

| Approach | Pros | Cons |
|----------|------|------|
| [Approach 1] | [Pros] | [Cons] |
| [Approach 2] | [Pros] | [Cons] |

## Practical Applications

[How to apply this understanding]

- **[Scenario 1]:** [Application]
- **[Scenario 2]:** [Application]

## Further Reading

- [Internal link to related explanation]
- [Internal link to how-to guide]
- [External resource if appropriate]

---

## Summary

[Key takeaways in 2-3 sentences]
```

### 7.5 Glossary Entry Template

```markdown
### [Term]

**Definition:** [Clear, concise definition in one sentence]

**Context:** [Where/how this term is used in Babysitter]

**Example:** [Brief example of usage]

**Related Terms:** [Link to related glossary entries]

**Learn More:** [Link to explanation page if available]
```

### 7.6 Error Catalog Entry Template

```markdown
### [Error Code/Message]

**Error Message:**
```
[Exact error message text]
```

**Cause:** [What causes this error]

**Solution:**
1. [Step 1]
2. [Step 2]

**Prevention:** [How to avoid this error]

**Related:** [Link to relevant documentation]
```

---

## 8. Implementation Guidelines

### 8.1 File Naming Conventions

| Rule | Example |
|------|---------|
| Lowercase only | `your-first-run.md` |
| Hyphens for spaces | `github-actions.md` |
| No special characters | `run-create.md` not `run:create.md` |
| Descriptive names | `configure-breakpoint-service.md` |
| Index files for sections | `index.md` |

### 8.2 Frontmatter Standards

Every documentation file must include:

```yaml
---
title: [Page Title]                    # Required
description: [SEO description]          # Required, max 160 chars
category: [tutorial|how-to|reference|explanation]  # Required
level: [beginner|intermediate|advanced] # Required for tutorials
section: [section-name]                 # Required for how-to and reference
estimated_time: [X minutes]             # Required for tutorials
prerequisites:                          # Recommended
  - [prerequisite-slug]
personas:                               # Recommended
  - sarah-chen
  - james-park
last_updated: [YYYY-MM-DD]             # Required
---
```

### 8.3 Content Quality Checklist

Before publishing any documentation page:

- [ ] **Frontmatter complete** with all required fields
- [ ] **Breadcrumbs verified** against hierarchy
- [ ] **Cross-references working** (all internal links tested)
- [ ] **Code examples tested** and working
- [ ] **Screenshots current** (if applicable)
- [ ] **Spelling and grammar** reviewed
- [ ] **Persona alignment** verified (content matches target personas)
- [ ] **Prerequisites accurate** and linked
- [ ] **Next steps included** for progression

### 8.4 URL Structure

Base URL: `https://docs.babysitter.dev/`

| Pattern | Example URL |
|---------|-------------|
| Tutorial | `/tutorials/getting-started/installation/` |
| How-to | `/how-to/breakpoints/configure-service/` |
| Reference | `/reference/cli/run-create/` |
| Explanation | `/explanation/core-concepts/event-sourcing/` |

### 8.5 Search Optimization

#### Page Metadata

- Title: Include primary keyword, max 60 characters
- Description: Actionable summary, max 160 characters
- Headers: Use H1 for title, H2 for sections, H3 for subsections

#### Content Optimization

- Primary keyword in first 100 words
- Related keywords naturally distributed
- Internal links with descriptive anchor text
- Alt text for all images

#### Structured Data

Implement JSON-LD for:
- BreadcrumbList (all pages)
- HowTo (how-to guides)
- TechArticle (reference pages)
- FAQPage (troubleshooting pages)

### 8.6 Accessibility Requirements

- **Heading hierarchy:** Sequential (H1 > H2 > H3), no skipped levels
- **Link text:** Descriptive, not "click here"
- **Images:** Alt text for all images
- **Code blocks:** Language specified for syntax highlighting
- **Tables:** Header rows defined
- **Color:** Never sole means of conveying information
- **Keyboard navigation:** All interactive elements accessible

### 8.7 Versioning Strategy

| Content Type | Versioning Approach |
|--------------|---------------------|
| Tutorials | Single version, updated with each release |
| How-to Guides | Single version with version callouts |
| Reference | Multi-version with version selector |
| Explanation | Single version, concepts rarely change |

Version callout format:
```markdown
> **Version Note:** This feature requires Babysitter v1.2.0 or later.
```

### 8.8 Maintenance Schedule

| Task | Frequency | Owner |
|------|-----------|-------|
| Link validation | Weekly (automated) | CI/CD |
| Code example testing | Per release | Release engineer |
| Screenshot updates | Per major release | Documentation team |
| Content review | Quarterly | Documentation team |
| Analytics review | Monthly | Documentation lead |
| User feedback review | Weekly | Documentation team |

---

## Appendix A: Persona-to-Content Mapping

### Sarah Chen (Productivity-Focused Developer)

| Priority | Content Path |
|----------|--------------|
| P0 | Tutorials > Getting Started > * |
| P0 | How-to > Methodologies > * |
| P0 | Reference > CLI > (quick reference) |
| P1 | How-to > Workflows > * |
| P1 | How-to > Quality > * |
| P2 | Explanation > Methodologies > methodology-comparison |

### Marcus Thompson (Technical Lead)

| Priority | Content Path |
|----------|--------------|
| P0 | Explanation > Architecture > * |
| P0 | Explanation > Governance > * |
| P0 | How-to > Breakpoints > * |
| P1 | Explanation > Best Practices > team-adoption |
| P1 | How-to > Customization > * |
| P2 | Tutorials > Advanced Projects > team-onboarding |

### Elena Rodriguez (DevOps Engineer)

| Priority | Content Path |
|----------|--------------|
| P0 | Reference > CLI > * |
| P0 | How-to > Integration > * |
| P0 | Reference > Configuration > * |
| P1 | Explanation > Architecture > * |
| P1 | How-to > Customization > * |
| P2 | Tutorials > Advanced Projects > ci-integration-tutorial |

### James Park (Curious Newcomer)

| Priority | Content Path |
|----------|--------------|
| P0 | Explanation > Core Concepts > what-is-babysitter |
| P0 | Tutorials > Getting Started > * (all, in order) |
| P0 | Reference > Glossary |
| P1 | Explanation > Core Concepts > * |
| P1 | Tutorials > Building Features > tdd-calculator |
| P2 | How-to > Troubleshooting > installation-issues |

---

## Appendix B: Implementation Phases

### Phase 1: Foundation (Weeks 1-2)

**Focus:** Beginner onboarding and core reference

| Deliverable | Category | Priority |
|-------------|----------|----------|
| What is Babysitter? | Explanation | P0 |
| Prerequisites | Tutorial | P0 |
| Installation | Tutorial | P0 |
| Your First Run | Tutorial | P0 |
| Glossary | Reference | P0 |
| CLI Overview | Reference | P0 |

### Phase 2: Core Workflows (Weeks 3-4)

**Focus:** Daily use documentation

| Deliverable | Category | Priority |
|-------------|----------|----------|
| TDD Calculator Tutorial | Tutorial | P1 |
| Resume Interrupted Work | How-to | P1 |
| Set Quality Targets | How-to | P1 |
| Configure Breakpoint Service | How-to | P1 |
| run:create Reference | Reference | P1 |
| run:iterate Reference | Reference | P1 |
| Event Sourcing | Explanation | P1 |

### Phase 3: Integration (Weeks 5-6)

**Focus:** CI/CD and automation

| Deliverable | Category | Priority |
|-------------|----------|----------|
| GitHub Actions | How-to | P1 |
| GitLab CI | How-to | P2 |
| Scripting with CLI | How-to | P1 |
| Exit Codes Reference | Reference | P1 |
| Environment Variables | Reference | P1 |
| Deterministic Execution | Explanation | P2 |

### Phase 4: Advanced (Weeks 7-8)

**Focus:** Customization and governance

| Deliverable | Category | Priority |
|-------------|----------|----------|
| Create Custom Process | How-to | P2 |
| CI Integration Tutorial | Tutorial | P2 |
| Architecture Overview | Explanation | P2 |
| Audit Trails | Explanation | P2 |
| Security Model | Explanation | P2 |
| Team Adoption | Explanation | P2 |

---

**Document Status:** Complete
**Next Phase:** Begin content creation following Phase 1 deliverables
**Review Date:** 2026-02-01
