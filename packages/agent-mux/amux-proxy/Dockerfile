FROM python:3.11-slim AS base

RUN groupadd -r appuser && useradd -r -g appuser -m appuser

WORKDIR /app

COPY pyproject.toml .
COPY src/ src/

RUN pip install --no-cache-dir ".[ollama]"

RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 8080
ENTRYPOINT ["amux-proxy"]
CMD ["--port", "8080", "--host", "0.0.0.0"]
