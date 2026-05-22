from amux_proxy.errors import litellm_error_to_status, format_anthropic_error, format_openai_error, format_google_error


class FakeAuthError(Exception):
    pass


FakeAuthError.__name__ = "AuthenticationError"


class FakeRateLimit(Exception):
    pass


FakeRateLimit.__name__ = "RateLimitError"


def test_auth_error_status() -> None:
    assert litellm_error_to_status(FakeAuthError("bad key")) == 401


def test_rate_limit_status() -> None:
    assert litellm_error_to_status(FakeRateLimit("slow down")) == 429


def test_unknown_error_status() -> None:
    assert litellm_error_to_status(ValueError("oops")) == 502


def test_anthropic_error_format() -> None:
    resp = format_anthropic_error(FakeAuthError("bad key"))
    assert resp.status_code == 401
    import json

    body = json.loads(resp.body)
    assert body["type"] == "error"
    assert body["error"]["type"] == "authentication_error"


def test_openai_error_format() -> None:
    resp = format_openai_error(FakeRateLimit("slow down"))
    assert resp.status_code == 429
    import json

    body = json.loads(resp.body)
    assert body["error"]["type"] == "rate_limit_exceeded"


def test_google_error_format() -> None:
    resp = format_google_error(FakeAuthError("no creds"))
    assert resp.status_code == 401
    import json

    body = json.loads(resp.body)
    assert body["error"]["status"] == "UNAUTHENTICATED"
