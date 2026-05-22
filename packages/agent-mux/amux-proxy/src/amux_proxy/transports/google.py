from __future__ import annotations
import json as json_mod
from typing import Any
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse, StreamingResponse
from amux_proxy.auth import verify_auth
from amux_proxy.config import ProxyConfig
from amux_proxy.errors import format_google_error


def _parse_google_messages(body: dict) -> tuple[list[dict], dict]:  # type: ignore[type-arg]
    contents = body.get("contents", [])
    messages = []
    for c in contents:
        role = c.get("role", "user")
        parts = c.get("parts", [])
        text = " ".join(p.get("text", "") for p in parts if "text" in p)
        messages.append({"role": role, "content": text})
    gen_config = body.get("generationConfig", {})
    return messages, gen_config


def create_router(config: ProxyConfig, completion_fn=None) -> APIRouter:
    router = APIRouter()

    @router.post("/v1beta/models/{model}:generateContent", response_model=None)
    async def generate_content(model: str, request: Request) -> JSONResponse:
        verify_auth(request, config.auth_token)
        body = await request.json()
        import litellm

        litellm.drop_params = config.drop_unsupported_params
        _complete = completion_fn or litellm.acompletion
        try:
            messages, gen_config = _parse_google_messages(body)
            response: Any = await _complete(
                model=config.target_model,
                messages=messages,
                max_tokens=gen_config.get("maxOutputTokens"),
                temperature=gen_config.get("temperature"),
                stream=False,
                timeout=config.timeout,
                num_retries=config.max_retries,
            )
            choice = response.choices[0]
            return JSONResponse(
                {
                    "candidates": [
                        {
                            "content": {"parts": [{"text": choice.message.content}], "role": "model"},
                            "finishReason": "STOP",
                        }
                    ],
                    "usageMetadata": {
                        "promptTokenCount": response.usage.prompt_tokens,
                        "candidatesTokenCount": response.usage.completion_tokens,
                    },
                }
            )
        except Exception as e:
            return format_google_error(e)

    @router.post("/v1beta/models/{model}:streamGenerateContent", response_model=None)
    async def stream_generate_content(model: str, request: Request) -> StreamingResponse:
        verify_auth(request, config.auth_token)
        body = await request.json()
        import litellm

        litellm.drop_params = config.drop_unsupported_params
        _complete = completion_fn or litellm.acompletion
        try:
            messages, gen_config = _parse_google_messages(body)
            response = await _complete(
                model=config.target_model,
                messages=messages,
                max_tokens=gen_config.get("maxOutputTokens"),
                temperature=gen_config.get("temperature"),
                stream=True,
                timeout=config.timeout,
                num_retries=config.max_retries,
            )

            async def generate():  # type: ignore[return]
                async for chunk in response:
                    delta = chunk.choices[0].delta.content
                    if delta:
                        yield (
                            json_mod.dumps(
                                {
                                    "candidates": [{"content": {"parts": [{"text": delta}], "role": "model"}}],
                                }
                            )
                            + "\n"
                        )

            return StreamingResponse(generate(), media_type="application/x-ndjson")
        except Exception as e:
            return format_google_error(e)

    return router
