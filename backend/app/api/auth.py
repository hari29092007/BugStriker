"""
Authentication dependencies for BugStriker API using Supabase Auth JWTs.
"""
from __future__ import annotations

import os
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import get_settings
from app.database.supabase import get_supabase_service_client

security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
):
    """
    Validates the Supabase Bearer JWT and extracts the user object.
    Supports a mock dev user in development/testing mode when token starts with 'dev-'.
    """
    settings = get_settings()

    if not credentials:
        # In test/dev mode without token, allow mock student if environment is development/testing
        if settings.environment in ("development", "test"):
            return {
                "id": "00000000-0000-0000-0000-000000000001",
                "email": "student@bugstriker.dev",
                "role": "authenticated",
            }
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required",
        )

    token = credentials.credentials

    # Allow dev-tokens for local testing
    if token.startswith("dev-"):
        user_email = token[4:] if len(token) > 4 else "student@bugstriker.dev"
        return {
            "id": user_email,
            "email": user_email,
            "role": "authenticated",
        }

    try:
        client = get_supabase_service_client()
        user_response = client.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired Supabase token",
            )
        u = user_response.user
        return {
            "id": str(u.id),
            "email": u.email,
            "role": getattr(u, "role", "authenticated"),
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(exc)}",
        )
