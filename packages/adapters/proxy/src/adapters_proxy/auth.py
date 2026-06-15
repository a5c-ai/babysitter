from __future__ import annotations
from fastapi import Request, HTTPException


def verify_auth(request: Request, expected_token: str) -> None:
    api_key = request.headers.get("x-api-key")
    if api_key == expected_token:
        return
    auth_header = request.headers.get("authorization", "")
    if auth_header.startswith("Bearer ") and auth_header[7:] == expected_token:
        return
    raise HTTPException(status_code=401, detail="Invalid or missing authentication token")
