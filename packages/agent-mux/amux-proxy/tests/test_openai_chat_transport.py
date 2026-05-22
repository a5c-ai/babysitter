from __future__ import annotations
import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from httpx import ASGITransport, AsyncClient
from amux_proxy.server import create_app
from amux_proxy.config import ProxyConfig


def _mock_response(content: str = "Hello") -> MagicMock:
    resp = MagicMock()
    resp.id = "test-id"
    resp.model = "gpt-4o"
    choice = MagicMock()
    choice.message.content = content
    resp.choices = [choice]
    usage = MagicMock()
    usage.prompt_tokens = 10
    usage.completion_tokens = 5
    usage.total_tokens = 15
    resp.usage = usage
    resp.model_dump.return_value = {
        "id": "test-id",
        "object": "chat.completion",
        "choices": [{"message": {"content": content, "role": "assistant"}}],
        "usage": {"prompt_tokens": 10, "completion_tokens": 5},
    }
    return resp


@pytest.fixture
def config() -> ProxyConfig:
    return ProxyConfig(
        target_provider="anthropic",
        target_model="anthropic/claude",
        exposed_transport="openai-chat",
        auth_token="test-token",
    )


@pytest.fixture
async def client(config: ProxyConfig) -> AsyncClient:
    app = create_app(config)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


@pytest.mark.asyncio
async def test_chat_completions(client: AsyncClient, config: ProxyConfig) -> None:
    with patch("litellm.acompletion", new_callable=AsyncMock, return_value=_mock_response()):
        resp = await client.post(
            "/v1/chat/completions",
            json={
                "model": "gpt-4o",
                "messages": [{"role": "user", "content": "hi"}],
            },
            headers={"Authorization": "Bearer test-token"},
        )
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_chat_completions_response_body(client: AsyncClient, config: ProxyConfig) -> None:
    with patch("litellm.acompletion", new_callable=AsyncMock, return_value=_mock_response("Test reply")):
        resp = await client.post(
            "/v1/chat/completions",
            json={
                "model": "gpt-4o",
                "messages": [{"role": "user", "content": "hello"}],
            },
            headers={"Authorization": "Bearer test-token"},
        )
    assert resp.status_code == 200
    body = resp.json()
    assert body["id"] == "test-id"
    assert body["object"] == "chat.completion"


@pytest.mark.asyncio
async def test_auth_required(client: AsyncClient) -> None:
    resp = await client.post(
        "/v1/chat/completions",
        json={"messages": []},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_x_api_key_auth(client: AsyncClient, config: ProxyConfig) -> None:
    with patch("litellm.acompletion", new_callable=AsyncMock, return_value=_mock_response()):
        resp = await client.post(
            "/v1/chat/completions",
            json={
                "model": "gpt-4o",
                "messages": [{"role": "user", "content": "hi"}],
            },
            headers={"X-Api-Key": config.auth_token},
        )
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_wrong_token_rejected(client: AsyncClient) -> None:
    resp = await client.post(
        "/v1/chat/completions",
        json={"model": "gpt-4o", "messages": [{"role": "user", "content": "hi"}]},
        headers={"Authorization": "Bearer wrong-token"},
    )
    assert resp.status_code == 401
