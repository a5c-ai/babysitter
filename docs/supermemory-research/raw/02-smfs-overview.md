# SMFS (Semantic Memory File System) Overview

Source: https://supermemory.ai/docs/smfs/overview

## Core Concept

SMFS enables agents to access Supermemory containers using standard filesystem operations. "Memory your agent can grep." The system provides real directory mounting where agents can use familiar shell commands like `ls`, `cat`, and `grep` without requiring SDK integration or embedding knowledge.

## Key Features

### Semantic Search

The grep functionality operates semantically by default, surfacing relevant content across the entire container ranked by relevance. Users can append flags to revert to exact-match searching.

### Context Optimization

Memory paths get distilled and indexed by Supermemory, preventing them from consuming model context tokens. A virtual `profile.md` file provides a live summary of container contents.

### Synchronization

Background bidirectional syncing ensures local reads hit cached data while writes push updates to Supermemory.

## Deployment Options

### 1. Mount Binary

For environments with real filesystems (Claude Code, Cursor, Docker). Uses NFSv3 on macOS and FUSE on Linux.

### 2. Bash Tool

For serverless/edge deployments (Lambda, Cloudflare Workers, Vercel). Available as TypeScript (`@supermemory/bash`) and Python (`supermemory-bash`) packages.

## Supported Platforms

Integration guides exist for Daytona, E2B, Vercel AI SDK, and Cloudflare Workers.
