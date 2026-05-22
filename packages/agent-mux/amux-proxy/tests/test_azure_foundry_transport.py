from __future__ import annotations
import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from httpx import ASGITransport, AsyncClient
from amux_proxy.server import create_app
from amux_proxy.config import ProxyConfig


def _mock_response(content: str = "Hello") -> MagicMock:
    resp = MagicMock()
    resp.id = "test-id"
    resp.model = "azure-model"
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
        target_provider="azure",
        target_model="azure/gpt-4o",
        exposed_transport="azure-foundry",
        auth_token="test-token",
    )


@pytest.fixture
async def client(config: ProxyConfig) -> AsyncClient:
    app = create_app(config)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


@pytest.mark.asyncio
async def test_foundry_chat_completions_endpoint(client: AsyncClient, config: ProxyConfig) -> None:
    with patch("litellm.acompletion", new_callable=AsyncMock, return_value=_mock_response()):
        resp = await client.post(
            "/models/chat/completions",
            json={
                "model": "gpt-4o",
                "messages": [{"role": "user", "content": "hi"}],
            },
            headers={"X-Api-Key": config.auth_token},
        )
    assert resp.status_code == 200
    body = resp.json()
    assert "choices" in body
    assert body["choices"][0]["message"]["content"] == "Hello"


@pytest.mark.asyncio
async def test_foundry_chat_response_structure(client: AsyncClient, config: ProxyConfig) -> None:
    with patch("litellm.acompletion", new_callable=AsyncMock, return_value=_mock_response("World")):
        resp = await client.post(
            "/models/chat/completions",
            json={
                "model": "gpt-4o",
                "messages": [{"role": "user", "content": "test"}],
            },
            headers={"X-Api-Key": config.auth_token},
        )
    assert resp.status_code == 200
    body = resp.json()
    assert body["choices"][0]["message"]["role"] == "assistant"
    assert body["choices"][0]["message"]["content"] == "World"


@pytest.mark.asyncio
async def test_foundry_auth_required(client: AsyncClient) -> None:
    resp = await client.post(
        "/models/chat/completions",
        json={"messages": []},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_foundry_wrong_token_rejected(client: AsyncClient) -> None:
    resp = await client.post(
        "/models/chat/completions",
        json={"messages": []},
        headers={"X-Api-Key": "wrong-token"},
    )
    assert resp.status_code == 401
