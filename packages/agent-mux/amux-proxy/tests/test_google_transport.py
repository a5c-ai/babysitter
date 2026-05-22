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
        target_provider="openai",
        target_model="openai/gpt-4o",
        exposed_transport="google",
        auth_token="test-token",
    )


@pytest.fixture
async def client(config: ProxyConfig) -> AsyncClient:
    app = create_app(config)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


@pytest.mark.asyncio
async def test_generate_content(client: AsyncClient, config: ProxyConfig) -> None:
    with patch("litellm.acompletion", new_callable=AsyncMock, return_value=_mock_response()):
        resp = await client.post(
            "/v1beta/models/gemini:generateContent",
            json={"contents": [{"role": "user", "parts": [{"text": "hi"}]}]},
            headers={"X-Api-Key": config.auth_token},
        )
    assert resp.status_code == 200
    body = resp.json()
    assert body["candidates"][0]["content"]["parts"][0]["text"] == "Hello"


@pytest.mark.asyncio
async def test_generate_content_response_structure(client: AsyncClient, config: ProxyConfig) -> None:
    with patch("litellm.acompletion", new_callable=AsyncMock, return_value=_mock_response("Gemini reply")):
        resp = await client.post(
            "/v1beta/models/gemini-pro:generateContent",
            json={"contents": [{"role": "user", "parts": [{"text": "hello"}]}]},
            headers={"X-Api-Key": config.auth_token},
        )
    assert resp.status_code == 200
    body = resp.json()
    assert body["candidates"][0]["content"]["role"] == "model"
    assert body["candidates"][0]["finishReason"] == "STOP"
    assert body["candidates"][0]["content"]["parts"][0]["text"] == "Gemini reply"
    assert "usageMetadata" in body


@pytest.mark.asyncio
async def test_auth_required(client: AsyncClient) -> None:
    resp = await client.post(
        "/v1beta/models/gemini:generateContent",
        json={"contents": [{"role": "user", "parts": [{"text": "hi"}]}]},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_bearer_auth(client: AsyncClient, config: ProxyConfig) -> None:
    with patch("litellm.acompletion", new_callable=AsyncMock, return_value=_mock_response()):
        resp = await client.post(
            "/v1beta/models/gemini:generateContent",
            json={"contents": [{"role": "user", "parts": [{"text": "hi"}]}]},
            headers={"Authorization": f"Bearer {config.auth_token}"},
        )
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_wrong_token_rejected(client: AsyncClient) -> None:
    resp = await client.post(
        "/v1beta/models/gemini:generateContent",
        json={"contents": [{"role": "user", "parts": [{"text": "hi"}]}]},
        headers={"X-Api-Key": "wrong-token"},
    )
    assert resp.status_code == 401
