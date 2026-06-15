from __future__ import annotations
from starlette.responses import JSONResponse


def litellm_error_to_status(exc: Exception) -> int:
    """Map LiteLLM exception types to HTTP status codes."""
    type_name = type(exc).__name__
    status_map = {
        "AuthenticationError": 401,
        "RateLimitError": 429,
        "BadRequestError": 400,
        "NotFoundError": 404,
        "Timeout": 408,
        "ServiceUnavailableError": 503,
        "APIError": 500,
        "APIConnectionError": 502,
    }
    return status_map.get(type_name, 502)


def format_anthropic_error(exc: Exception) -> JSONResponse:
    """Format error as Anthropic API error response."""
    status = litellm_error_to_status(exc)
    type_map = {
        401: "authentication_error",
        429: "rate_limit_error",
        400: "invalid_request_error",
        404: "not_found_error",
        408: "timeout_error",
        503: "overloaded_error",
        500: "api_error",
        502: "api_error",
    }
    return JSONResponse(
        status_code=status,
        content={
            "type": "error",
            "error": {
                "type": type_map.get(status, "api_error"),
                "message": str(exc),
            },
        },
    )


def format_openai_error(exc: Exception) -> JSONResponse:
    """Format error as OpenAI API error response."""
    status = litellm_error_to_status(exc)
    code_map = {
        401: "invalid_api_key",
        429: "rate_limit_exceeded",
        400: "invalid_request_error",
        404: "model_not_found",
        408: "timeout",
        503: "server_error",
        500: "server_error",
        502: "server_error",
    }
    return JSONResponse(
        status_code=status,
        content={
            "error": {
                "message": str(exc),
                "type": code_map.get(status, "server_error"),
                "code": code_map.get(status, "server_error"),
            },
        },
    )


def format_google_error(exc: Exception) -> JSONResponse:
    """Format error as Google API error response."""
    status = litellm_error_to_status(exc)
    google_status_map = {
        401: "UNAUTHENTICATED",
        429: "RESOURCE_EXHAUSTED",
        400: "INVALID_ARGUMENT",
        404: "NOT_FOUND",
        408: "DEADLINE_EXCEEDED",
        503: "UNAVAILABLE",
        500: "INTERNAL",
        502: "INTERNAL",
    }
    return JSONResponse(
        status_code=status,
        content={
            "error": {
                "code": status,
                "message": str(exc),
                "status": google_status_map.get(status, "INTERNAL"),
            },
        },
    )
