from __future__ import annotations
from typing import Any
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from amux_proxy.auth import verify_auth
from amux_proxy.config import ProxyConfig


def create_router(config: ProxyConfig, completion_fn=None) -> APIRouter:
    router = APIRouter()

    @router.post(
        "/v1/projects/{project}/locations/{location}/publishers/{publisher}/models/{model}:generateContent",
        response_model=None,
    )
    async def vertex_generate(
        project: str, location: str, publisher: str, model: str, request: Request
    ) -> JSONResponse:
        verify_auth(request, config.auth_token)
        body = await request.json()
        import litellm

        litellm.drop_params = config.drop_unsupported_params
        _complete = completion_fn or litellm.acompletion
        try:
            contents = body.get("contents", [])
            messages = []
            for c in contents:
                role = c.get("role", "user")
                parts = c.get("parts", [])
                text = " ".join(p.get("text", "") for p in parts if "text" in p)
                messages.append({"role": role, "content": text})
            gen_config = body.get("generationConfig", {})
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
            from amux_proxy.errors import format_google_error

            return format_google_error(e)

    return router
