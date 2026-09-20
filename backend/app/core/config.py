import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "New Sunshine Public School Portal"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "new_sunshine_public_school_super_secret_jwt_key_2026_indore_73181"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # SQLite by default, or PostgreSQL if configured
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./school_portal.db")
    
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]
    
    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env")

settings = Settings()
