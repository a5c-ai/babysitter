from __future__ import annotations
from typing import Any
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from amux_proxy.auth import verify_auth
from amux_proxy.config import ProxyConfig


def create_router(config: ProxyConfig, completion_fn=None) -> APIRouter:
    router = APIRouter()

    @router.post("/models/chat/completions", response_model=None)
    async def foundry_chat(request: Request) -> JSONResponse:
        verify_auth(request, config.auth_token)
        body = await request.json()
        import litellm

        litellm.drop_params = config.drop_unsupported_params
        _complete = completion_fn or litellm.acompletion
        try:
            response: Any = await _complete(
                model=config.target_model,
                messages=body.get("messages", []),
                max_tokens=body.get("max_tokens"),
                temperature=body.get("temperature"),
                stream=False,
                timeout=config.timeout,
                num_retries=config.max_retries,
            )
            return JSONResponse(response.model_dump())
        except Exception as e:
            from amux_proxy.errors import format_openai_error

            return format_openai_error(e)

    return router
