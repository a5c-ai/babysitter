from __future__ import annotations
import json as json_mod
from typing import Any
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse, StreamingResponse
from amux_proxy.auth import verify_auth
from amux_proxy.config import ProxyConfig
from amux_proxy.errors import format_anthropic_error


def create_router(config: ProxyConfig, completion_fn=None) -> APIRouter:
    router = APIRouter()

    @router.post("/v1/messages", response_model=None)
    async def messages(request: Request) -> JSONResponse | StreamingResponse:
        verify_auth(request, config.auth_token)
        body = await request.json()
        import litellm

        litellm.drop_params = config.drop_unsupported_params

        messages_list = body.get("messages", [])
        litellm_messages = _convert_anthropic_messages(messages_list)
        is_streaming = body.get("stream", False)

        _complete = completion_fn or litellm.acompletion
        try:
            response: Any = await _complete(
                model=config.target_model,
                messages=litellm_messages,
                max_tokens=body.get("max_tokens", 4096),
                temperature=body.get("temperature"),
                stream=is_streaming,
                timeout=config.timeout,
                num_retries=config.max_retries,
            )
            if not is_streaming:
                return JSONResponse(_format_anthropic_response(response))

            async def generate():  # type: ignore[return]
                msg_id = f"msg_{id(response)}"
                yield (
                    f"event: message_start\ndata: {json_mod.dumps({'type': 'message_start', 'message': {'id': msg_id, 'type': 'message', 'role': 'assistant', 'content': [], 'model': config.target_model}})}\n\n"
                )
                yield (
                    f"event: content_block_start\ndata: {json_mod.dumps({'type': 'content_block_start', 'index': 0, 'content_block': {'type': 'text', 'text': ''}})}\n\n"
                )
                async for chunk in response:
                    delta = chunk.choices[0].delta.content
                    if delta:
                        yield (
                            f"event: content_block_delta\ndata: {json_mod.dumps({'type': 'content_block_delta', 'index': 0, 'delta': {'type': 'text_delta', 'text': delta}})}\n\n"
                        )
                yield (
                    f"event: content_block_stop\ndata: {json_mod.dumps({'type': 'content_block_stop', 'index': 0})}\n\n"
                )
                yield f"event: message_stop\ndata: {json_mod.dumps({'type': 'message_stop'})}\n\n"

            return StreamingResponse(generate(), media_type="text/event-stream")
        except Exception as e:
            return format_anthropic_error(e)

    return router


def _convert_anthropic_messages(messages: list[dict]) -> list[dict]:  # type: ignore[type-arg]
    result = []
    for msg in messages:
        content = msg.get("content", "")
        if isinstance(content, list):
            text_parts = [p.get("text", "") for p in content if p.get("type") == "text"]
            content = "\n".join(text_parts)
        result.append({"role": msg["role"], "content": content})
    return result


def _format_anthropic_response(response: Any) -> dict:  # type: ignore[type-arg]
    choice = response.choices[0]
    return {
        "id": response.id,
        "type": "message",
        "role": "assistant",
        "content": [{"type": "text", "text": choice.message.content}],
        "model": response.model,
        "stop_reason": "end_turn",
        "usage": {
            "input_tokens": response.usage.prompt_tokens,
            "output_tokens": response.usage.completion_tokens,
        },
    }
