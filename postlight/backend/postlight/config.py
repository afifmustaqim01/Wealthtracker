from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    supabase_db_url: str
    gemini_api_key: str
    frontend_origin: str = "http://localhost:5173"
    storage_bucket: str = "post-images"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()