import pytest
from amux_proxy.config import ProxyConfig


def test_from_env_defaults(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("AMUX_PROXY_TARGET_PROVIDER", "bedrock")
    monkeypatch.setenv("AMUX_PROXY_TARGET_MODEL", "bedrock/anthropic.claude-sonnet-4")
    monkeypatch.setenv("AMUX_PROXY_EXPOSED_TRANSPORT", "anthropic")
    cfg = ProxyConfig.from_env()
    assert cfg.target_provider == "bedrock"
    assert cfg.host == "127.0.0.1"
    assert cfg.port == 0
    assert cfg.stream is True


def test_validate_missing_fields() -> None:
    cfg = ProxyConfig(target_provider="", target_model="", exposed_transport="")
    errors = cfg.validate()
    assert len(errors) == 3


def test_validate_invalid_transport() -> None:
    cfg = ProxyConfig(target_provider="x", target_model="x", exposed_transport="invalid")
    errors = cfg.validate()
    assert any("Invalid transport" in e for e in errors)


def test_validate_passes() -> None:
    cfg = ProxyConfig(target_provider="bedrock", target_model="x", exposed_transport="anthropic")
    assert cfg.validate() == []
