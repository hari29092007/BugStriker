"""
Centralized LLM client factory for BugStriker.
Supports standard OpenAI and OpenRouter endpoints seamlessly.
"""
from __future__ import annotations

from typing import Optional
from openai import AsyncOpenAI
from app.config import get_settings


def get_llm_client() -> AsyncOpenAI:
    settings = get_settings()
    api_key = settings.openai_api_key or ""
    base_url = settings.openai_base_url.strip() if settings.openai_base_url else ""

    # Auto-detect OpenRouter keys
    if not base_url and api_key.startswith("sk-or-"):
        base_url = "https://openrouter.ai/api/v1"

    kwargs: dict = {"api_key": api_key}
    if base_url:
        kwargs["base_url"] = base_url
        kwargs["default_headers"] = {
            "HTTP-Referer": "http://localhost:8000",
            "X-Title": "BugStriker",
        }
    return AsyncOpenAI(**kwargs)


def get_llm_model() -> str:
    settings = get_settings()
    model = (settings.openai_model or "openai/gpt-4o-mini").strip()
    api_key = settings.openai_api_key or ""
    # Map simple model name to OpenRouter identifier if using OpenRouter
    if (api_key.startswith("sk-or-") or "openrouter" in (settings.openai_base_url or "")) and "/" not in model:
        if model.startswith("gpt-"):
            return f"openai/{model}"
    return model
