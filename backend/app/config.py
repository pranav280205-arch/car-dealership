"""App settings, read from environment variables with sensible local defaults."""
import os


class Settings:
    # SQLite file by default so the project runs with zero setup.
    # Set DATABASE_URL=postgresql://user:pass@host/db to use Postgres instead.
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./dealership.db")
    jwt_secret: str = os.getenv("JWT_SECRET", "change-me-in-production")
    jwt_algorithm: str = "HS256"
    token_expire_minutes: int = int(os.getenv("TOKEN_EXPIRE_MINUTES", "60"))
    cors_origins: list[str] = os.getenv(
        "CORS_ORIGINS", "http://localhost:5173"
    ).split(",")


settings = Settings()
