from __future__ import annotations
import click
from amux_proxy import __version__
from amux_proxy.config import ProxyConfig


@click.command()
@click.option("--target-provider", envvar="AMUX_PROXY_TARGET_PROVIDER", help="LiteLLM provider name")
@click.option("--target-model", envvar="AMUX_PROXY_TARGET_MODEL", help="LiteLLM model identifier")
@click.option("--transport", envvar="AMUX_PROXY_EXPOSED_TRANSPORT", help="Exposed transport protocol")
@click.option("--port", type=int, default=0, envvar="AMUX_PROXY_PORT", help="Listen port (0=auto)")
@click.option("--host", default="127.0.0.1", envvar="AMUX_PROXY_HOST", help="Bind address")
@click.option("--auth-token", envvar="AMUX_PROXY_AUTH_TOKEN", default=None, help="Bearer token")
@click.option("--log-level", default="warn", envvar="AMUX_PROXY_LOG_LEVEL", help="Log level")
@click.option("--timeout", type=int, default=600, envvar="AMUX_PROXY_TIMEOUT", help="Timeout seconds")
@click.version_option(__version__)
def main(
    target_provider: str | None,
    target_model: str | None,
    transport: str | None,
    port: int,
    host: str,
    auth_token: str | None,
    log_level: str,
    timeout: int,
) -> None:
    """amux-proxy: Transport protocol bridge for coding agent harnesses."""
    import uuid

    config = ProxyConfig(
        target_provider=target_provider or "",
        target_model=target_model or "",
        exposed_transport=transport or "",
        host=host,
        port=port,
        auth_token=auth_token or str(uuid.uuid4()),
        log_level=log_level,
        timeout=timeout,
    )
    errors = config.validate()
    if errors:
        for e in errors:
            click.echo(f"Error: {e}", err=True)
        raise SystemExit(1)
    from amux_proxy.server import run_server

    run_server(config)
