from __future__ import annotations
import os
import subprocess
import time
import sys


class OllamaServerManager:
    def __init__(self, host: str = "127.0.0.1", port: int = 11434) -> None:
        self.host = host
        self.port = port
        self.process: subprocess.Popen | None = None

    def start(self) -> None:
        env = {**os.environ, "OLLAMA_HOST": f"{self.host}:{self.port}"}
        self.process = subprocess.Popen(
            ["ollama", "serve"],
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        for _ in range(30):
            if self._health_check():
                print(f"[amux-proxy] Ollama server started on {self.host}:{self.port}", file=sys.stderr)
                return
            time.sleep(1)
        raise RuntimeError("Ollama server failed to start within 30s")

    def stop(self) -> None:
        if self.process:
            self.process.terminate()
            try:
                self.process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.process.kill()
            self.process = None

    def _health_check(self) -> bool:
        try:
            import httpx

            resp = httpx.get(f"http://{self.host}:{self.port}/api/tags", timeout=2)
            return resp.status_code == 200
        except Exception:
            return False
