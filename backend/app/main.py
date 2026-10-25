"""Entry point for the Car Dealership Inventory API."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.routers import auth


def create_app() -> FastAPI:
    app = FastAPI(title="Car Dealership Inventory API", version="1.0.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/api/health")
    def health():
        return {"status": "ok"}

    app.include_router(auth.router)

    return app


Base.metadata.create_all(bind=engine)
app = create_app()
