---
name: arxiv-search-interface
description: arXiv paper search and retrieval
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
  category: literature-research
  domain: mathematics
  backlog-id: SK-MATH-035
  tools:
    - arXiv API
    - arxiv Python package
    - feedparser
  processes:
    - literature-review
    - research-discovery
---

# arXiv Search Interface Skill

## Purpose

Provides interface to arXiv for searching, retrieving, and analyzing mathematical research papers.

## Capabilities

- **Advanced Search**: Author, title, abstract queries
- **Category Filtering**: Math subject classification
- **Citation Tracking**: Reference discovery
- **PDF Retrieval**: Download and extraction
- **Metadata Extraction**: Authors, dates, categories
- **Alert Setup**: New paper notifications

## Usage Guidelines

1. **Search Strategy**
   - Define search criteria
   - Select math categories
   - Set date ranges

2. **Result Processing**
   - Filter relevant papers
   - Extract metadata
   - Download PDFs

3. **Organization**
   - Categorize papers
   - Track citations
   - Maintain bibliography

4. **Best Practices**
   - Use precise queries
   - Check multiple categories
   - Monitor related work
