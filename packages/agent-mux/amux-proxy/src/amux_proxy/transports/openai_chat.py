from __future__ import annotations
import json as json_mod
from typing import Any
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse, StreamingResponse
from amux_proxy.auth import verify_auth
from amux_proxy.config import ProxyConfig
from amux_proxy.errors import format_openai_error


def create_router(config: ProxyConfig, completion_fn=None) -> APIRouter:
    router = APIRouter()

    @router.post("/v1/chat/completions", response_model=None)
    async def chat_completions(request: Request) -> JSONResponse | StreamingResponse:
        verify_auth(request, config.auth_token)
        body = await request.json()
        import litellm

        litellm.drop_params = config.drop_unsupported_params
        is_streaming = body.get("stream", False)
        _complete = completion_fn or litellm.acompletion
        try:
            response: Any = await _complete(
                model=config.target_model,
                messages=body.get("messages", []),
                max_tokens=body.get("max_tokens"),
                temperature=body.get("temperature"),
                stream=is_streaming,
                timeout=config.timeout,
                num_retries=config.max_retries,
            )
            if not is_streaming:
                return JSONResponse(response.model_dump())

            async def generate():  # type: ignore[return]
                async for chunk in response:
                    yield f"data: {json_mod.dumps(chunk.model_dump())}\n\n"
                yield "data: [DONE]\n\n"

            return StreamingResponse(generate(), media_type="text/event-stream")
        except Exception as e:
            return format_openai_error(e)

    return router
