from amux_proxy.providers.ollama_server import OllamaServerManager


def test_stop_without_start() -> None:
    mgr = OllamaServerManager()
    mgr.stop()  # should not raise
