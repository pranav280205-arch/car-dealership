"""App settings, read from environment variables with sensible local defaults."""
import os


class Settings:
    # SQLite file by default so the project runs with zero setup.
    # Set DATABASE_URL=postgresql://user:pass@host/db to use Postgres instead.
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./dealership.db")
    # Dev-only default. HS256 wants at least 32 bytes, so set a real one in production.
    jwt_secret: str = os.getenv(
        "JWT_SECRET", "dev-only-secret-please-change-me-0123456789abcdef"
    )
    jwt_algorithm: str = "HS256"
    # bcrypt cost factor. 12 is a good default; tests drop it to 4 to stay fast.
    bcrypt_rounds: int = int(os.getenv("BCRYPT_ROUNDS", "12"))
    token_expire_minutes: int = int(os.getenv("TOKEN_EXPIRE_MINUTES", "60"))
    cors_origins: list[str] = os.getenv(
        "CORS_ORIGINS", "http://localhost:5173"
    ).split(",")


settings = Settings()
