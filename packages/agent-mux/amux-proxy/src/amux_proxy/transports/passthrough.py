from __future__ import annotations
import httpx
from fastapi import APIRouter, Request
from fastapi.responses import Response
from amux_proxy.auth import verify_auth
from amux_proxy.config import ProxyConfig


def create_router(config: ProxyConfig) -> APIRouter:
    router = APIRouter()

    @router.api_route(
        "/passthrough/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"], response_model=None
    )
    async def passthrough(path: str, request: Request) -> Response:
        verify_auth(request, config.auth_token)

        target_url = f"{_resolve_api_base(config)}/{path}"
        headers = dict(request.headers)
        headers.pop("host", None)
        headers.pop("x-api-key", None)
        headers.pop("authorization", None)

        _inject_provider_auth(config, headers)

        body = await request.body()

        async with httpx.AsyncClient(timeout=config.timeout) as client:
            resp = await client.request(
                method=request.method,
                url=target_url,
                headers=headers,
                content=body if body else None,
                params=dict(request.query_params),
            )
            return Response(
                content=resp.content,
                status_code=resp.status_code,
                headers=dict(resp.headers),
            )

    return router


def _resolve_api_base(config: ProxyConfig) -> str:
    import os

    provider = config.target_provider
    base_map = {
        "anthropic": "https://api.anthropic.com",
        "openai": "https://api.openai.com",
        "google": "https://generativelanguage.googleapis.com",
    }
    return os.environ.get("AMUX_PROXY_TARGET_API_BASE", base_map.get(provider, ""))


def _inject_provider_auth(config: ProxyConfig, headers: dict) -> None:
    import os

    provider = config.target_provider
    if provider == "anthropic":
        key = os.environ.get("ANTHROPIC_API_KEY", "")
        if key:
            headers["x-api-key"] = key
            headers["anthropic-version"] = "2023-06-01"
    elif provider in ("openai", "groq", "together_ai", "fireworks_ai", "deepseek", "mistral"):
        key = os.environ.get("OPENAI_API_KEY") or os.environ.get(f"{provider.upper()}_API_KEY", "")
        if key:
            headers["authorization"] = f"Bearer {key}"
    elif provider == "google":
        key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY", "")
        if key:
            headers["x-goog-api-key"] = key
