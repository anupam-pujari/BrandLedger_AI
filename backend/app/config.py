"""
BrandProof Application Configuration.

Loads environment variables using pydantic-settings when available,
with a robust os.environ fallback for zero-dependency test/scaffold environments.
"""

import os
from functools import lru_cache
from typing import List

try:
    from pydantic_settings import BaseSettings, SettingsConfigDict

    class Settings(BaseSettings):
        # Application Server
        environment: str = "development"
        log_level: str = "INFO"
        host: str = "0.0.0.0"
        port: int = 8000
        cors_origins: str = "http://localhost:5173,http://localhost:3000,https://brandproof.vercel.app"
        max_upload_size_mb: int = 50

        # Supabase (PostgreSQL, Auth, Storage)
        supabase_url: str = "https://mock-project-ref.supabase.co"
        supabase_service_key: str = "mock-service-role-key"
        supabase_anon_key: str = "mock-anon-key"
        supabase_jwt_secret: str = "mock-jwt-secret-for-dev-verification"

        # Search & Vector Embeddings
        embedding_model: str = "all-MiniLM-L6-v2"

        # AI Provider Settings
        default_ai_provider: str = "openai"
        openai_api_key: str = ""
        gemini_api_key: str = ""

        # Document & OCR Parsers
        tesseract_cmd: str = "/usr/bin/tesseract"

        model_config = SettingsConfigDict(
            env_file=".env",
            env_file_encoding="utf-8",
            extra="ignore"
        )

        @property
        def cors_origins_list(self) -> List[str]:
            """Parse comma-separated origin strings into a list for FastAPI CORSMiddleware."""
            return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

except ImportError:
    # Standard library fallback when pydantic-settings is not yet installed
    class Settings:
        def __init__(self):
            self.environment = os.getenv("ENVIRONMENT", "development")
            self.log_level = os.getenv("LOG_LEVEL", "INFO")
            self.host = os.getenv("HOST", "0.0.0.0")
            self.port = int(os.getenv("PORT", "8000"))
            self.cors_origins = os.getenv(
                "CORS_ORIGINS", 
                "http://localhost:5173,http://localhost:3000,https://brandproof.vercel.app"
            )
            self.max_upload_size_mb = int(os.getenv("MAX_UPLOAD_SIZE_MB", "50"))
            self.supabase_url = os.getenv("SUPABASE_URL", "https://mock-project-ref.supabase.co")
            self.supabase_service_key = os.getenv("SUPABASE_SERVICE_KEY", "mock-service-role-key")
            self.supabase_anon_key = os.getenv("SUPABASE_ANON_KEY", "mock-anon-key")
            self.supabase_jwt_secret = os.getenv("SUPABASE_JWT_SECRET", "mock-jwt-secret-for-dev-verification")
            self.embedding_model = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
            self.default_ai_provider = os.getenv("DEFAULT_AI_PROVIDER", "openai")
            self.openai_api_key = os.getenv("OPENAI_API_KEY", "")
            self.gemini_api_key = os.getenv("GEMINI_API_KEY", "")
            self.tesseract_cmd = os.getenv("TESSERACT_CMD", "/usr/bin/tesseract")

        @property
        def cors_origins_list(self) -> List[str]:
            return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache()
def get_settings() -> Settings:
    """Return cached application settings singleton."""
    return Settings()
