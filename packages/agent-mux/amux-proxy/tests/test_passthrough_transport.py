from __future__ import annotations
import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from httpx import ASGITransport, AsyncClient
from amux_proxy.server import create_app
from amux_proxy.config import ProxyConfig


@pytest.fixture
def config() -> ProxyConfig:
    return ProxyConfig(
        target_provider="anthropic",
        target_model="anthropic/claude-sonnet-4-20250514",
        exposed_transport="passthrough",
        auth_token="test-token",
    )


@pytest.fixture
async def client(config: ProxyConfig) -> AsyncClient:
    app = create_app(config)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


@pytest.mark.asyncio
async def test_passthrough_auth_required(client: AsyncClient) -> None:
    resp = await client.post("/passthrough/v1/messages", json={})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_passthrough_get_auth_required(client: AsyncClient) -> None:
    resp = await client.get("/passthrough/v1/models")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_passthrough_wrong_token_rejected(client: AsyncClient) -> None:
    resp = await client.post(
        "/passthrough/v1/messages",
        json={},
        headers={"X-Api-Key": "wrong-token"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_passthrough_forwards_with_valid_auth(client: AsyncClient, config: ProxyConfig) -> None:
    mock_response = MagicMock()
    mock_response.content = b'{"type": "message"}'
    mock_response.status_code = 200
    mock_response.headers = {"content-type": "application/json"}

    with patch("httpx.AsyncClient.request", new_callable=AsyncMock, return_value=mock_response):
        resp = await client.post(
            "/passthrough/v1/messages",
            json={"model": "claude", "messages": []},
            headers={"X-Api-Key": config.auth_token},
        )
    assert resp.status_code == 200
