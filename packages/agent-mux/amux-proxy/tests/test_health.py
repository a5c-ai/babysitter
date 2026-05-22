import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from httpx import ASGITransport, AsyncClient
from amux_proxy.server import create_app
from amux_proxy.config import ProxyConfig


@pytest.fixture
def config() -> ProxyConfig:
    return ProxyConfig(
        target_provider="openai",
        target_model="openai/gpt-4o",
        exposed_transport="anthropic",
        auth_token="test-token",
    )


@pytest.fixture
async def client(config: ProxyConfig) -> AsyncClient:
    app = create_app(config)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest.mark.asyncio
async def test_health_endpoint(client: AsyncClient) -> None:
    resp = await client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["transport"] == "anthropic"
    assert body["provider"] == "openai"


@pytest.mark.asyncio
async def test_models_endpoint(client: AsyncClient) -> None:
    resp = await client.get("/v1/models")
    assert resp.status_code == 200
    body = resp.json()
    assert body["object"] == "list"
    assert len(body["data"]) >= 1
    assert body["data"][0]["id"] == "openai/gpt-4o"


@pytest.mark.asyncio
async def test_auth_rejects_missing_token(client: AsyncClient) -> None:
    resp = await client.post("/v1/messages", json={"model": "x", "messages": []})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_auth_accepts_api_key(client: AsyncClient, config: ProxyConfig) -> None:
    mock_resp = MagicMock()
    mock_resp.id = "test-id"
    mock_resp.model = "gpt-4o"
    choice = MagicMock()
    choice.message.content = "hi"
    mock_resp.choices = [choice]
    mock_resp.usage = MagicMock(prompt_tokens=1, completion_tokens=1, total_tokens=2)
    with patch("litellm.acompletion", new_callable=AsyncMock, return_value=mock_resp):
        resp = await client.post(
            "/v1/messages",
            json={"model": "x", "max_tokens": 10, "messages": [{"role": "user", "content": "hi"}]},
            headers={"X-Api-Key": config.auth_token},
        )
    # Auth passes — should not be 401
    assert resp.status_code != 401


@pytest.mark.asyncio
async def test_auth_accepts_bearer(client: AsyncClient, config: ProxyConfig) -> None:
    mock_resp = MagicMock()
    mock_resp.id = "test-id"
    mock_resp.model = "gpt-4o"
    choice = MagicMock()
    choice.message.content = "hi"
    mock_resp.choices = [choice]
    mock_resp.usage = MagicMock(prompt_tokens=1, completion_tokens=1, total_tokens=2)
    with patch("litellm.acompletion", new_callable=AsyncMock, return_value=mock_resp):
        resp = await client.post(
            "/v1/messages",
            json={"model": "x", "max_tokens": 10, "messages": [{"role": "user", "content": "hi"}]},
            headers={"Authorization": f"Bearer {config.auth_token}"},
        )
    assert resp.status_code != 401
