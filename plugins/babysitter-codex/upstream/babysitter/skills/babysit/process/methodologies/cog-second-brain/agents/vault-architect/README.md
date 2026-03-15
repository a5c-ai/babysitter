# Vault Architect Agent

Designs and maintains the COG vault directory structure, Git integration, and self-healing cross-reference system.

## Overview

The Vault Architect ensures the physical integrity of the COG Second Brain vault. It manages the directory structure (00-inbox through 05-knowledge), maintains Git version control, and runs self-healing operations to keep cross-references consistent.

## Use Cases

- **Vault Initialization** - Create the full COG directory structure with Git tracking
- **Content Routing** - Route classified content to appropriate vault sections
- **Self-Healing** - Detect and auto-fix broken cross-references after renames
- **Framework Updates** - Apply COG framework updates while preserving user content
- **Health Checks** - Assess vault structure, cross-reference, and Git health

## Key Principle

Content-safe operations: framework changes never overwrite personal data. User content in 02-personal, 03-professional, and 04-projects is always preserved during updates.
