from __future__ import annotations
import asyncio
import json
import json as json_mod
import os
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
import uvicorn
from amux_proxy.config import ProxyConfig
from amux_proxy.cost import CostTracker


def get_completion_fn(config: ProxyConfig):
    """Return a completion function — Router-backed if configured, else None (use litellm.acompletion lazily)."""
    router_path = os.environ.get("AMUX_PROXY_ROUTER_CONFIG")
    if router_path:
        import litellm

        with open(router_path) as f:
            router_cfg = json_mod.load(f)
        router = litellm.Router(
            model_list=router_cfg.get("model_list", []),
            fallbacks=router_cfg.get("fallbacks", []),
        )
        return router.acompletion
    return None


def create_app(config: ProxyConfig) -> FastAPI:
    ollama_server: object = None

    if config.ollama_manage_server and config.target_provider == "ollama":
        from amux_proxy.providers.ollama_server import OllamaServerManager

        ollama_server = OllamaServerManager()

    @asynccontextmanager
    async def lifespan(app_instance: FastAPI):
        if ollama_server:
            await asyncio.to_thread(ollama_server.start)  # type: ignore[union-attr]
        yield
        if ollama_server:
            ollama_server.stop()  # type: ignore[union-attr]

    app = FastAPI(title="amux-proxy", version="0.1.0", lifespan=lifespan)
    app.state.config = config

    if config.cache_enabled:
        from amux_proxy.cache import ResponseCache

        app.state.cache = ResponseCache()
    else:
        app.state.cache = None

    app.state.cost_tracker = CostTracker()

    @app.get("/health")
    async def health() -> dict[str, object]:
        return {
            "status": "ok",
            "transport": config.exposed_transport,
            "provider": config.target_provider,
            "model": config.target_model,
            "router": bool(os.environ.get("AMUX_PROXY_ROUTER_CONFIG")),
        }

    @app.get("/v1/models")
    async def list_models() -> dict:
        return {
            "object": "list",
            "data": [
                {
                    "id": config.target_model,
                    "object": "model",
                    "owned_by": config.target_provider,
                }
            ],
        }

    @app.get("/metrics")
    async def metrics() -> dict:
        return app.state.cost_tracker.to_dict()

    @app.get("/cache/stats")
    async def cache_stats() -> dict:
        if not app.state.cache:
            return {"enabled": False}
        return {"enabled": True, "size": app.state.cache.size}

    @app.post("/v1/count_tokens")
    async def count_tokens(request: Request) -> dict:
        body = await request.json()
        model = body.get("model", config.target_model)
        messages = body.get("messages", [])
        try:
            import litellm

            count = litellm.token_counter(model=model, messages=messages)
            return {"count": count}
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    completion_fn = get_completion_fn(config)

    if config.exposed_transport == "anthropic":
        from amux_proxy.transports.anthropic import create_router

        app.include_router(create_router(config, completion_fn))
    elif config.exposed_transport == "openai-chat":
        from amux_proxy.transports.openai_chat import create_router

        app.include_router(create_router(config, completion_fn))
    elif config.exposed_transport == "openai-responses":
        from amux_proxy.transports.openai_responses import create_router

        app.include_router(create_router(config, completion_fn))
    elif config.exposed_transport == "google":
        from amux_proxy.transports.google import create_router

        app.include_router(create_router(config, completion_fn))
    elif config.exposed_transport == "passthrough":
        from amux_proxy.transports.passthrough import create_router

        app.include_router(create_router(config))
    elif config.exposed_transport == "bedrock-converse":
        from amux_proxy.transports.bedrock_converse import create_router

        app.include_router(create_router(config, completion_fn))
    elif config.exposed_transport == "vertex-native":
        from amux_proxy.transports.vertex_native import create_router

        app.include_router(create_router(config, completion_fn))
    elif config.exposed_transport == "azure-foundry":
        from amux_proxy.transports.azure_foundry import create_router

        app.include_router(create_router(config, completion_fn))

    return app


def run_server(config: ProxyConfig) -> None:
    app = create_app(config)
    print(f"[amux-proxy] Transport: {config.exposed_transport} -> {config.target_provider}", file=sys.stderr)
    print(f"[amux-proxy] Model: {config.target_model}", file=sys.stderr)
    print(
        json.dumps(
            {
                "event": "ready",
                "port": config.port,
                "auth_token": config.auth_token,
                "url": f"http://{config.host}:{config.port}",
            }
        ),
        flush=True,
    )
    uvicorn.run(
        app,
        host=config.host,
        port=config.port,
        log_level=config.log_level,
        access_log=config.log_level == "debug",
    )
