from __future__ import annotations
from typing import Any
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from amux_proxy.auth import verify_auth
from amux_proxy.config import ProxyConfig


def create_router(config: ProxyConfig, completion_fn=None) -> APIRouter:
    router = APIRouter()

    @router.post("/converse", response_model=None)
    async def converse(request: Request) -> JSONResponse:
        verify_auth(request, config.auth_token)
        body = await request.json()
        import litellm

        litellm.drop_params = config.drop_unsupported_params
        _complete = completion_fn or litellm.acompletion
        try:
            bedrock_messages = body.get("messages", [])
            messages = [{"role": m.get("role", "user"), "content": _extract_content(m)} for m in bedrock_messages]

            inf_config = body.get("inferenceConfig", {})
            response: Any = await _complete(
                model=config.target_model,
                messages=messages,
                max_tokens=inf_config.get("maxTokens"),
                temperature=inf_config.get("temperature"),
                top_p=inf_config.get("topP"),
                stream=False,
                timeout=config.timeout,
                num_retries=config.max_retries,
            )
            choice = response.choices[0]
            return JSONResponse(
                {
                    "output": {"message": {"role": "assistant", "content": [{"text": choice.message.content}]}},
                    "usage": {
                        "inputTokens": response.usage.prompt_tokens,
                        "outputTokens": response.usage.completion_tokens,
                        "totalTokens": response.usage.total_tokens,
                    },
                    "stopReason": "end_turn",
                }
            )
        except Exception as e:
            from amux_proxy.errors import format_openai_error

            return format_openai_error(e)

    return router


def _extract_content(msg: dict) -> str:
    content = msg.get("content", [])
    if isinstance(content, str):
        return content
    return " ".join(c.get("text", "") for c in content if "text" in c)
