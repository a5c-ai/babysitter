from __future__ import annotations
import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from fastapi.testclient import TestClient
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
        exposed_transport="openai-responses",
        auth_token="test-token",
    )


@pytest.fixture
async def client(config: ProxyConfig) -> AsyncClient:
    app = create_app(config)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


@pytest.mark.asyncio
async def test_responses_endpoint(client: AsyncClient, config: ProxyConfig) -> None:
    with patch("litellm.acompletion", new_callable=AsyncMock, return_value=_mock_response()):
        resp = await client.post(
            "/v1/responses",
            json={"model": "gpt-4o", "input": "hello"},
            headers={"Authorization": "Bearer test-token"},
        )
    assert resp.status_code == 200
    body = resp.json()
    assert body["object"] == "response"
    assert body["status"] == "completed"


@pytest.mark.asyncio
async def test_responses_output_text(client: AsyncClient, config: ProxyConfig) -> None:
    with patch("litellm.acompletion", new_callable=AsyncMock, return_value=_mock_response("Proxy response")):
        resp = await client.post(
            "/v1/responses",
            json={"model": "gpt-4o", "input": "tell me something"},
            headers={"Authorization": "Bearer test-token"},
        )
    assert resp.status_code == 200
    body = resp.json()
    assert body["output"][0]["content"][0]["text"] == "Proxy response"
    assert body["output"][0]["role"] == "assistant"


@pytest.mark.asyncio
async def test_auth_required(client: AsyncClient) -> None:
    resp = await client.post(
        "/v1/responses",
        json={"model": "gpt-4o", "input": "hi"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_x_api_key_auth(client: AsyncClient, config: ProxyConfig) -> None:
    with patch("litellm.acompletion", new_callable=AsyncMock, return_value=_mock_response()):
        resp = await client.post(
            "/v1/responses",
            json={"model": "gpt-4o", "input": "hi"},
            headers={"X-Api-Key": config.auth_token},
        )
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_wrong_token_rejected(client: AsyncClient) -> None:
    resp = await client.post(
        "/v1/responses",
        json={"model": "gpt-4o", "input": "hi"},
        headers={"Authorization": "Bearer wrong-token"},
    )
    assert resp.status_code == 401


def test_responses_websocket(config: ProxyConfig) -> None:
    async def stream_response():
        chunk = MagicMock()
        chunk.choices = [MagicMock()]
        chunk.choices[0].delta.content = "Proxy websocket response"
        yield chunk

    async def completion(*_args: object, **_kwargs: object):
        return stream_response()

    app = create_app(config)
    with patch("litellm.acompletion", new=completion), TestClient(app) as test_client:
        with test_client.websocket_connect(
            "/v1/responses",
            headers={"Authorization": "Bearer test-token"},
        ) as websocket:
            websocket.send_json(
                {
                    "type": "response.create",
                    "model": "gpt-4o",
                    "input": "hello",
                }
            )
            seen: list[str] = []
            for _ in range(4):
                event = websocket.receive_json()
                seen.append(event["type"])
                if event["type"] == "response.output_text.delta":
                    assert event["delta"] == "Proxy websocket response"
                if event["type"] == "response.completed":
                    break

    assert "response.created" in seen
    assert "response.output_text.delta" in seen
    assert "response.completed" in seen
