# Supermemory Quickstart

Source: https://supermemory.ai/docs/quickstart

## Setup

1. Register at https://console.supermemory.ai
2. Create API key: API Keys -> Create API Key

## Installation

### Python

```bash
pip install supermemory
export SUPERMEMORY_API_KEY="YOUR_API_KEY"
```

### TypeScript

```bash
npm install supermemory
export SUPERMEMORY_API_KEY="YOUR_API_KEY"
```

## Core Workflow

1. **Retrieve context** using `client.profile()` with a user identifier and query
2. **Construct system messages** incorporating static profiles, dynamic profiles, and relevant memories
3. **Store conversations** with `client.add()` for future retrieval

## Automatic Features

- Memory extraction from conversations
- User profile construction (static + dynamic facts)
- Contextual retrieval for personalized LLM responses

## Optional Enhancement

Apply `threshold` parameter to refine search results by relevance scoring.
