from __future__ import annotations
from amux_proxy.server import create_app
from amux_proxy.config import ProxyConfig


def _get_route_paths(app) -> list[str]:  # type: ignore[no-untyped-def]
    return [r.path for r in app.routes]


def test_health_returns_config() -> None:
    config = ProxyConfig(
        target_provider="bedrock",
        target_model="bedrock/claude",
        exposed_transport="anthropic",
        auth_token="t",
    )
    app = create_app(config)
    routes = _get_route_paths(app)
    assert "/health" in routes


def test_models_endpoint_exists() -> None:
    config = ProxyConfig(
        target_provider="openai",
        target_model="openai/gpt-4o",
        exposed_transport="openai-chat",
        auth_token="t",
    )
    app = create_app(config)
    routes = _get_route_paths(app)
    assert "/v1/models" in routes


def test_anthropic_transport_mounted() -> None:
    config = ProxyConfig(
        target_provider="openai",
        target_model="openai/gpt-4o",
        exposed_transport="anthropic",
        auth_token="t",
    )
    app = create_app(config)
    routes = _get_route_paths(app)
    assert "/v1/messages" in routes


def test_openai_chat_transport_mounted() -> None:
    config = ProxyConfig(
        target_provider="anthropic",
        target_model="anthropic/claude",
        exposed_transport="openai-chat",
        auth_token="t",
    )
    app = create_app(config)
    routes = _get_route_paths(app)
    assert "/v1/chat/completions" in routes


def test_openai_responses_transport_mounted() -> None:
    config = ProxyConfig(
        target_provider="anthropic",
        target_model="anthropic/claude",
        exposed_transport="openai-responses",
        auth_token="t",
    )
    app = create_app(config)
    routes = _get_route_paths(app)
    assert "/v1/responses" in routes


def test_google_transport_mounted() -> None:
    config = ProxyConfig(
        target_provider="openai",
        target_model="openai/gpt-4o",
        exposed_transport="google",
        auth_token="t",
    )
    app = create_app(config)
    routes = _get_route_paths(app)
    assert any("/v1beta/models/" in r for r in routes)


def test_count_tokens_endpoint_exists() -> None:
    config = ProxyConfig(
        target_provider="openai",
        target_model="openai/gpt-4o",
        exposed_transport="anthropic",
        auth_token="t",
    )
    app = create_app(config)
    routes = _get_route_paths(app)
    assert "/v1/count_tokens" in routes


def test_app_state_has_config() -> None:
    config = ProxyConfig(
        target_provider="openai",
        target_model="openai/gpt-4o",
        exposed_transport="openai-chat",
        auth_token="my-token",
    )
    app = create_app(config)
    assert app.state.config is config
    assert app.state.config.auth_token == "my-token"
