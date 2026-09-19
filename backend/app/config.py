from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env", case_sensitive=False)

    supabase_url: str = "https://your-project.supabase.co"
    supabase_anon_key: str = "placeholder-anon-key"
    supabase_service_role_key: str = "placeholder-service-role-key"
    openai_api_key: str = "sk-placeholder-key"
    openai_model: str = "gpt-4o-mini"
    secret_key: str = "bugstriker-dev-secret"
    frontend_url: str = "http://localhost:5173"
    backend_url: str = "http://localhost:8000"
    use_docker: bool = False
    execution_timeout: int = 5
    max_llm_calls_per_run: int = 5
    environment: str = "development"
    debug: bool = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()
