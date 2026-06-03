import pytest


@pytest.mark.skip(
    reason="Requires running Ollama or API key — run manually with: pytest tests/test_integration.py -k real --no-header"
)
def test_real_provider_roundtrip() -> None:
    """Integration test placeholder. To run: set GROQ_API_KEY and remove skip."""
    pass
