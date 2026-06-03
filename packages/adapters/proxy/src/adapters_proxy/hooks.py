"""Virtual model hook middleware for adapters-proxy.

Calls the krate hook bridge API to evaluate virtual model hooks
before and after model completions. The hook bridge runs JS hook
bodies from KrateVirtualModel CRDs and returns allow/deny/modify
decisions.

Environment variables:
  KRATE_HOOKS_ENABLED    - set to "true" to enable (default: disabled)
  KRATE_CONTROLLER_URL   - krate API server URL (e.g. http://localhost:3080)
  KRATE_ORG              - organization slug (default: "default")
"""

from __future__ import annotations

import json
import os
import logging
from typing import Any

logger = logging.getLogger("adapters-proxy.hooks")

HOOKS_ENABLED = os.environ.get("KRATE_HOOKS_ENABLED", "").lower() == "true"
CONTROLLER_URL = os.environ.get("KRATE_CONTROLLER_URL", "")
KRATE_ORG = os.environ.get("KRATE_ORG", "default")


async def dispatch_pre_completion(
    model: str,
    messages: list[dict],
    max_tokens: int | None = None,
    transport: str = "unknown",
) -> dict[str, Any]:
    """Dispatch VirtualModel.PreCompletion hook before model call.

    Returns:
        {"decision": "allow"} — proceed normally
        {"decision": "deny", "message": "..."} — block the request
        {"decision": "modify", "modifiedInput": {"messages": [...]}} — use modified messages
    """
    if not HOOKS_ENABLED or not CONTROLLER_URL:
        return {"decision": "allow"}

    try:
        import httpx

        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(
                f"{CONTROLLER_URL}/api/orgs/{KRATE_ORG}/hooks/dispatch",
                json={
                    "hookType": "VirtualModel.PreCompletion",
                    "modelName": model,
                    "payload": {
                        "request": {
                            "messages": messages,
                            "max_tokens": max_tokens,
                            "transport": transport,
                        }
                    },
                },
            )
            if resp.status_code == 200:
                return resp.json()
    except Exception as e:
        logger.warning("Hook dispatch failed (pre-completion): %s", e)

    return {"decision": "allow"}


async def dispatch_post_completion(
    model: str,
    response_content: str,
    usage: dict | None = None,
    transport: str = "unknown",
) -> dict[str, Any]:
    """Dispatch VirtualModel.PostCompletion hook after model call.

    Returns:
        {"decision": "allow"} — return response as-is
        {"decision": "modify", "modifiedInput": {"response": "..."}} — use modified response
    """
    if not HOOKS_ENABLED or not CONTROLLER_URL:
        return {"decision": "allow"}

    try:
        import httpx

        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(
                f"{CONTROLLER_URL}/api/orgs/{KRATE_ORG}/hooks/dispatch",
                json={
                    "hookType": "VirtualModel.PostCompletion",
                    "modelName": model,
                    "payload": {
                        "response": {
                            "content": response_content,
                            "usage": usage,
                            "transport": transport,
                        }
                    },
                },
            )
            if resp.status_code == 200:
                return resp.json()
    except Exception as e:
        logger.warning("Hook dispatch failed (post-completion): %s", e)

    return {"decision": "allow"}


async def dispatch_pre_tool_use(
    model: str,
    tool_name: str,
    tool_input: Any,
) -> dict[str, Any]:
    """Dispatch VirtualModel.PreToolUse hook before tool execution."""
    if not HOOKS_ENABLED or not CONTROLLER_URL:
        return {"decision": "allow"}

    try:
        import httpx

        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(
                f"{CONTROLLER_URL}/api/orgs/{KRATE_ORG}/hooks/dispatch",
                json={
                    "hookType": "VirtualModel.PreToolUse",
                    "modelName": model,
                    "payload": {
                        "toolCall": {"name": tool_name, "input": tool_input}
                    },
                },
            )
            if resp.status_code == 200:
                return resp.json()
    except Exception as e:
        logger.warning("Hook dispatch failed (pre-tool-use): %s", e)

    return {"decision": "allow"}
