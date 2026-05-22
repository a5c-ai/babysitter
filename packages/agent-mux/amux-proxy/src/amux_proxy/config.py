from __future__ import annotations
import os
import uuid
from dataclasses import dataclass, field


@dataclass
class ProxyConfig:
    target_provider: str
    target_model: str
    exposed_transport: str
    host: str = "127.0.0.1"
    port: int = 0
    auth_token: str = field(default_factory=lambda: str(uuid.uuid4()))
    log_level: str = "warn"
    timeout: int = 600
    max_retries: int = 2
    stream: bool = True
    drop_unsupported_params: bool = True
    ollama_auto_pull: bool = True
    ollama_host: str = "http://localhost:11434"
    ollama_manage_server: bool = False
    cache_enabled: bool = False

    @classmethod
    def from_env(cls) -> ProxyConfig:
        return cls(
            target_provider=os.environ.get("AMUX_PROXY_TARGET_PROVIDER", ""),
            target_model=os.environ.get("AMUX_PROXY_TARGET_MODEL", ""),
            exposed_transport=os.environ.get("AMUX_PROXY_EXPOSED_TRANSPORT", ""),
            host=os.environ.get("AMUX_PROXY_HOST", "127.0.0.1"),
            port=int(os.environ.get("AMUX_PROXY_PORT", "0")),
            auth_token=os.environ.get("AMUX_PROXY_AUTH_TOKEN", str(uuid.uuid4())),
            log_level=os.environ.get("AMUX_PROXY_LOG_LEVEL", "warn"),
            timeout=int(os.environ.get("AMUX_PROXY_TIMEOUT", "600")),
            max_retries=int(os.environ.get("AMUX_PROXY_MAX_RETRIES", "2")),
            stream=os.environ.get("AMUX_PROXY_STREAM", "true").lower() == "true",
            drop_unsupported_params=os.environ.get("AMUX_PROXY_DROP_UNSUPPORTED_PARAMS", "true").lower() == "true",
            ollama_auto_pull=os.environ.get("AMUX_PROXY_OLLAMA_AUTO_PULL", "true").lower() == "true",
            ollama_host=os.environ.get("AMUX_PROXY_OLLAMA_HOST", "http://localhost:11434"),
            ollama_manage_server=os.environ.get("AMUX_PROXY_OLLAMA_MANAGE_SERVER", "false").lower() == "true",
            cache_enabled=os.environ.get("AMUX_PROXY_CACHE", "false").lower() == "true",
        )

    def validate(self) -> list[str]:
        errors: list[str] = []
        if not self.target_provider:
            errors.append("AMUX_PROXY_TARGET_PROVIDER is required")
        if not self.target_model:
            errors.append("AMUX_PROXY_TARGET_MODEL is required")
        if not self.exposed_transport:
            errors.append("AMUX_PROXY_EXPOSED_TRANSPORT is required")
        valid_transports = {
            "anthropic",
            "openai-chat",
            "openai-responses",
            "google",
            "passthrough",
            "bedrock-converse",
            "vertex-native",
            "azure-foundry",
        }
        if self.exposed_transport and self.exposed_transport not in valid_transports:
            errors.append(f"Invalid transport '{self.exposed_transport}'. Valid: {valid_transports}")
        return errors
