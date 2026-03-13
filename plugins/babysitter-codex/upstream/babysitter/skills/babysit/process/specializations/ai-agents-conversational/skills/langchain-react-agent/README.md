# LangChain ReAct Agent

Implements ReAct (Reasoning + Acting) agent patterns using the LangChain framework with tool binding capabilities.

## Overview

This skill provides the ability to create and configure LangChain-based ReAct agents that can reason about tasks and take actions using bound tools. It handles the full agent lifecycle including setup, tool binding, execution, and output parsing.

## Key Features

- ReAct loop implementation (Thought -> Action -> Observation)
- Dynamic tool binding with schema validation
- Multi-provider LLM support
- Configurable memory systems
- Error handling and graceful degradation

## Usage

Use this skill when implementing autonomous agents that need to reason about tasks and execute actions through defined tools.
