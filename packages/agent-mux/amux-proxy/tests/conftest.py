import pytest
from amux_proxy.config import ProxyConfig


@pytest.fixture
def default_config() -> ProxyConfig:
    return ProxyConfig(
        target_provider="openai",
        target_model="openai/gpt-4o",
        exposed_transport="anthropic",
        auth_token="test-token",
    )
